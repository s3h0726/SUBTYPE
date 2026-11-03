#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const loader=fs.readFileSync(path.join(root,'js/data-loader.js'),'utf8');
const bundle=fs.readFileSync(path.join(root,'js/app.bundle.js'),'utf8');
const start='// Published Korean bus payloads spell Latin initials';
const end='export function normalizeLine(raw={},defaults={})';
assert(loader.includes(start)&&loader.includes(end),'Korean bus normalization source must exist');
const code=loader.slice(loader.indexOf(start),loader.indexOf(end)).replace(/\bexport\s+/g,'');
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

// Korean bus route *numbers* are also restored for route list, search and game HUD.
for(const [input,number,want] of [
 ['서울 에이1번','에이1','서울 A1번'],
 ['서울 비2번','비2','서울 B2번'],
 ['경기 성남 엠2311번','엠2311','경기 성남 M2311번'],
 ['서울 에이비씨10번','에이비씨10','서울 ABC10번'],
 ['서울 에이1번','A1','서울 A1번'],
 ['부산 씨100번','씨100','부산 C100번'],
 ['서울 지1번','지1','서울 지1번'], // G and Z share the same generated Korean spelling; do not guess.
 ['경기 비봉2번','비봉2','경기 비봉2번'],
 ['서울 마을1번','마을1','서울 마을1번']
]){
 const initial={id:'kr-bus-visual-test',countryId:'kr',mode:'bus',line:{ko:input},routeNumber:number};
 const converted=route(initial);
 assert.equal(converted.line.ko,want,'line name: '+input);
 assert.equal(initial.line.ko,input,'source line name must remain unchanged');
 if(want!==input){
  assert(converted.line.aliases.includes(input),'legacy Korean search alias for '+input);
  assert(/[A-Z]/.test(converted.routeNumber),'routeNumber converted to Latin letters');
 }
}
const repositoryModule=fs.readFileSync(path.join(root,'js/rail-data-repository.js'),'utf8');
const Repository=new Function(repositoryModule.replace(/\bexport\s+/g,'')+'; return Repository;')();
const repository=new Repository();
const aliased=repository.resolveRoute(route({id:'kr-bus-alias',countryId:'kr',mode:'bus',
 line:{ko:'서울 에이1번'},routeNumber:'에이1'}));
assert.equal(aliased.line.ko,'서울 A1번','repository must preserve visible Latin route name');
assert(aliased.line.aliases.includes('서울 에이1번'),'legacy Hangul route name must remain searchable after repository');
const appSource=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
assert(appSource.includes("r.countryId==='kr'?krRouteLabel(r):r.line.ko"),'route picker must show Korean route title');
assert(appSource.includes('...(r.line.aliases||[])'),'route search must include legacy Hangul aliases');

const originalOfficial=route({id:'kr-bus-source-number',countryId:'kr',mode:'express_bus',
 line:{ko:'서울 엠100번'},routeNumber:'M100'});
assert.equal(originalOfficial.line.ko,'서울 M100번','use official Latin route number when available');
const sourceZ=route({id:'kr-bus-verified-z',countryId:'kr',mode:'bus',line:{ko:'서울 지1번'},routeNumber:'Z1'});
assert.equal(sourceZ.line.ko,'서울 Z1번','restore ambiguous initial only with Latin original evidence');
const railSource=route({id:'kr-rail-sample',countryId:'kr',mode:'rail',line:{ko:'서울 엠100번'},routeNumber:'엠100'});
assert.equal(railSource.line.ko,'서울 엠100번','Korean rail route names untouched');
const foreignSource=route({id:'jp-bus-sample',countryId:'jp',mode:'bus',line:{ko:'서울 에이1번'},routeNumber:'에이1'});
assert.equal(foreignSource.line.ko,'서울 에이1번','other countries untouched');

const result=route(fixture),run=result.verifiedJourneys[0];
assert.equal(result.stations[0].ko,'A동');
assert.equal(run.stations[1].ko,'B');
assert.equal(run.patternName.ko,'A동 → B · 일반');
assert.equal(run.service.nameKo,'A동 → B · 일반');
assert.equal(fixture.stations[0].ko,'에이동','source payload must not mutate');
assert.equal(route({...fixture,countryId:'jp'}).stations[0].ko,'에이동','Japan unaffected');
assert.equal(route({...fixture,countryId:'kr',mode:'rail',id:'kr-rail-test'}).stations[0].ko,'에이동','Korean railway unaffected');

const nested=stop({id:'nested',sourceName:'LH파주본부',ko:'엘에이치파주본부',
 names:{ko:'엘에이치파주본부',ja:'엘에이치파주본부'},
 canonicalStationNames:{ko:'엘에이치파주본부'}});
assert.equal(nested.ko,'LH파주본부');
assert.equal(nested.names.ko,'LH파주본부');
assert.equal(nested.canonicalStationNames.ko,'LH파주본부');
const punctuated=stop({sourceName:'A.B구역',ko:'에이비구역'});
assert.equal(punctuated.ko,'A.B구역');
const {decode}=require('./lib/kr-payload.cjs');
const published=decode(JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/routes/kr-bus-gbis-241458103.json'),'utf8'))).route;
const unmodified=published.verifiedJourneys.flatMap(j=>j.stations).find(s=>s.sourceName==='한울마을1단지.LH파주본부');
assert(unmodified,'published GBIS route should contain the official LH stop');
assert.equal(unmodified.ko,'한울마을1단지.엘에이치파주본부','source still stores legacy reading');
const corrected=route(published);
assert(corrected.verifiedJourneys.flatMap(j=>j.stations).some(s=>s.sourceName===unmodified.sourceName&&s.ko==='한울마을1단지.LH파주본부'),'real published stop restored for display');
assert.equal(published.verifiedJourneys.flatMap(j=>j.stations).find(s=>s.sourceName===unmodified.sourceName).ko,unmodified.ko,'published source remains unchanged');
const gameSource=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
assert(gameSource.includes('route=restoreKrBusLatinRoute(railDataRepository.resolveRoute(route))'),'game must correct canonicalized route');
assert(gameSource.includes('station=restoreKrBusLatinStation(station)'),'free drive must correct stop');
assert(bundle.includes('route=restoreKrBusLatinRoute(railDataRepository.resolveRoute(route))'),'shipped game path corrected');

// Evaluate the actual Game.answerValues method, not a copied test-only function.
const typingSource=gameSource.slice(gameSource.indexOf('  answerValues(station){'),gameSource.indexOf('  routeIndex(station){'));
assert(typingSource.includes('restoreKrBusLatinStation'),'actual typing path must restore stop name');
const TestGame=new Function('restoreKrBusLatinStation','buildTypingModel',
 'return class TestGame{stationKoDisplay(value){return value};'+typingSource+'}'
)(stop,value=>({inputText:String(value).normalize('NFC').replace(/[^A-Za-z0-9가-힣]/g,'')}));
const game=new TestGame();game.route={countryId:'kr',mode:'bus',canonicalContract:'kr-canonical-v1'};
assert.deepEqual(game.answerValues({sourceName:'B동',ko:'비동'}),['B동','비동'],'player sees and types B as first answer');
assert.equal(game.answerValues({sourceName:'한울마을1단지.LH파주본부',ko:'한울마을1단지.엘에이치파주본부'})[0],
 '한울마을1단지LH파주본부','Latin letters are required in real typing target');
game.route={countryId:'jp',mode:'rail'};
assert.equal(game.answerValues({sourceName:'B동',ko:'비동'})[0],'비동','Japanese station unaffected');


console.log('PASS Korean bus Latin stop display: A/B/ABC, source-only conversion, directions, IDs, non-bus regression');
