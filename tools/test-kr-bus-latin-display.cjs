#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const loader=fs.readFileSync(path.join(root,'js/data-loader.js'),'utf8');
const bundle=fs.readFileSync(path.join(root,'js/app.bundle.js'),'utf8');
const start='// Published Korean bus payloads spell Latin initials';
const end='export function normalizeLine(raw={},defaults={})';
assert(loader.includes(start)&&loader.includes(end),'Korean bus normalization source must exist');
const code=loader.slice(loader.indexOf(start),loader.indexOf(end));
assert(bundle.includes(code),'built gameplay must contain the same restoration code');
const {restoreKrBusLatinStation:stop,restoreKrBusLatinRoute:route}=new Function(code+'\nreturn {restoreKrBusLatinStation,restoreKrBusLatinRoute};')();
for(const [official,previous,expected] of [
 ['A동','에이동','A동'],
 ['B','비','B'],
 ['ABC마트','에이비씨마트','ABC마트'],
 ['APT A동','아파트 에이동','아파트 A동'],
 ['비','비','비'],
 ['이마트','이마트','이마트'],
 ['에이동','에이동','에이동'],
 ['A동','특별한별칭','특별한별칭']
]){
 const original={id:'stop',sourceName:official,ko:previous,latitude:37,longitude:127};
 const result=stop(original);
 assert.equal(result.ko,expected,official+' Korean name');
 assert.equal(result.id,original.id,'station identity');
 assert.equal(result.latitude,37,'latitude intact');
 assert.equal(result.longitude,127,'longitude intact');
 assert.equal(original.ko,previous,'source remains untouched');
}
const fixture={id:'kr-bus-test',countryId:'kr',mode:'bus',stations:[
 {id:'1',sourceName:'A동',ko:'에이동',latitude:37,longitude:127},
 {id:'2',sourceName:'B',ko:'비',latitude:38,longitude:128}
 ],verifiedJourneys:[{id:'run',patternName:{ko:'에이동 → 비 · 일반'},
 service:{id:'run',nameKo:'에이동 → 비 · 일반'},
 stations:[{id:'1',sourceName:'A동',ko:'에이동',latitude:37},
 {id:'2',sourceName:'B',ko:'비',latitude:38}]}]};
const result=route(fixture),run=result.verifiedJourneys[0];
assert.equal(result.stations[0].ko,'A동');
assert.equal(run.stations[1].ko,'B');
assert.equal(run.patternName.ko,'A동 → B · 일반');
assert.equal(run.service.nameKo,'A동 → B · 일반');
assert.equal(fixture.stations[0].ko,'에이동','source payload must not mutate');
assert.equal(route({...fixture,countryId:'jp'}).stations[0].ko,'에이동','Japan unaffected');
assert.equal(route({...fixture,countryId:'kr',mode:'rail',id:'kr-rail-test'}).stations[0].ko,'에이동','Korean railway unaffected');
console.log('PASS Korean bus Latin stop display: A/B/ABC, source-only conversion, directions, IDs, non-bus regression');
