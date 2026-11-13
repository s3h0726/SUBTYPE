#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const loader=fs.readFileSync('js/data-loader.js','utf8');
const bundle=fs.readFileSync('js/app.bundle.js','utf8');
const begin=loader.indexOf('const KR_RAIL_TRAIN_ACRONYMS=');
const end=loader.indexOf('export function normalizeLine(raw={},defaults={})');
assert(begin>=0&&end>begin,'Korean railway acronym module exists');
const code=loader.slice(begin,end).replace(/\bexport\s+/g,'');
assert(bundle.includes(code),'deployed game bundle matches source converter');
const {restoreKrRailTrainLabel,restoreKrRailServiceNames}=new Function(code+'\nreturn {restoreKrRailTrainLabel,restoreKrRailServiceNames};')();
const cases=[
 ['케이티엑스 산천','KTX 산천'],['케이티엑스산천·케이티엑스 이음','KTX산천·KTX 이음'],
 ['아이티엑스 청춘','ITX 청춘'],['에스알티','SRT'],['지티엑스 A','GTX A'],
 ['에이알이엑스·이엠유·디엠유','AREX·EMU·DMU'],['목포 → 서울 케이티엑스 12개역 정차','목포 → 서울 KTX 12개역 정차']
];
for(const [before,after] of cases)assert.equal(restoreKrRailTrainLabel(before),after,before);
const rail={id:'kr-rail-sample',countryId:'kr',mode:'high_speed_rail',services:[{id:'1',nameKo:'케이티엑스 산천',nameJa:'케이티엑스 산천'}],
 verifiedJourneys:[{id:'1',patternName:{ko:'목포 → 서울 케이티엑스'},service:{id:'1',nameKo:'목포 → 서울 케이티엑스'},stations:[{id:'s',ko:'케이티엑스역'}]}]};
const renamed=restoreKrRailServiceNames(rail);
assert.equal(renamed.services[0].nameKo,'KTX 산천');
assert.equal(renamed.verifiedJourneys[0].patternName.ko,'목포 → 서울 KTX');
assert.equal(renamed.verifiedJourneys[0].service.nameKo,'목포 → 서울 KTX');
assert.equal(renamed.verifiedJourneys[0].stations[0].ko,'케이티엑스역','station names unchanged');
assert.equal(rail.services[0].nameKo,'케이티엑스 산천','source is not mutated');
assert.strictEqual(restoreKrRailServiceNames({...rail,id:'kr-bus-sample',mode:'bus'}).services[0].nameKo,'케이티엑스 산천','bus routes unchanged');
const overrides=JSON.parse(fs.readFileSync('data/editor-overrides.json','utf8'));
for(const name of Object.values(overrides.services||{}))assert(!/케이티엑스|아이티엑스/u.test(name),'editor overrides use official acronyms');
console.log('한국 운행계통 약어 KTX·ITX·SRT·GTX·AREX·EMU·DMU 복원 검사 통과');
