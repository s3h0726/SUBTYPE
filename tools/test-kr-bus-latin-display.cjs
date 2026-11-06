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
// All 26 Latin letters are restored in uppercase from a verified source.
// G and Z both sound like 지 in legacy Hangul, so only an original code can
// disambiguate them; native Korean place names must remain unchanged.
const alphabetReadings=['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지'];
for(let i=0;i<alphabetReadings.length;i++){
 const latin=String.fromCharCode(65+i),original={id:'letter-'+latin,sourceName:latin+'동',ko:alphabetReadings[i]+'동'};
 assert.equal(stop(original).ko,latin+'동','uppercase '+latin+' building');
 assert.equal(original.ko,alphabetReadings[i]+'동','original phonetic station name is preserved');
 const coded=route({id:'kr-bus-code-'+latin,countryId:'kr',mode:'bus',line:{ko:'서울 '+alphabetReadings[i]+'1번'},
   routeNumber:latin+'1'});
 assert.equal(coded.line.ko,'서울 '+latin+'1번','uppercase '+latin+' route code');
}
for(const [previous,expected] of [
 ['에이비씨동','ABC동'],['에이치동','H동'],['더블유동','W동'],['비동','B동'],
 ['씨동','C동'],['이동','이동'],['오동','오동'],['유동','유동'],
 ['비봉','비봉'],['에이스','에이스']
]){
 assert.equal(stop({ko:previous}).ko,expected,'source-free sign marker '+previous);
}
assert.equal(stop({sourceName:'에이동',ko:'에이동'}).ko,'에이동','do not rewrite an explicit Korean source');
assert.equal(stop({sourceName:'한울마을1단지, LH파주본부',ko:'한울마을1단지 엘에이치파주본부'}).ko,
 '한울마을1단지, LH파주본부','verified Latin source with punctuation variants');

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
// The country-specific Korean-name editor must display the same corrected
// routes/stops as the playable catalog, without rewriting source IDs or edits.
const editorSource=fs.readFileSync(path.join(root,'reports/korean-names/editor.html'),'utf8');
assert(editorSource.includes("krBusRestorerPromise=import('../../js/data-loader.js')"),
 'editor must call the gameplay restorer, not a separate letter map');
assert(editorSource.includes("data.routes=(data.routes||[]).map(route=>route?.countryId==='kr'?restore(route):route)"),
 'all Korean route cards must display corrected Latin line names');
assert(editorSource.includes('return koreanBusDisplayRoute(route);'),
 'Korean lazy route detail and station-name editor must restore Latin stop names');
assert(editorSource.includes('applyRemote();original=rows.map(r=>r.slice());applyDraft();'),
 'manual name overrides and unsaved drafts take precedence over generated labels');
assert(editorSource.includes("DATA_VERSION='20261102-nationwide-revalidated'"),
 'keep saved editor draft namespace stable');
const restoredEditorRoute=route({id:'kr-bus-editor-sample',countryId:'kr',mode:'bus',
 line:{ko:'서울 에이1번'},routeNumber:'에이1',
 verifiedJourneys:[{id:'direction-1',stations:[
  {id:'stop-a',sourceName:'A동',ko:'에이동'},
  {id:'stop-b',sourceName:'B동',ko:'비동'}
 ]}]});
assert.equal(restoredEditorRoute.line.ko,'서울 A1번');
assert.deepEqual(restoredEditorRoute.verifiedJourneys[0].stations.map(s=>s.ko),['A동','B동']);
assert.deepEqual(restoredEditorRoute.verifiedJourneys[0].stations.map(s=>s.id),['stop-a','stop-b']);

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

// Missing original route numbers must not prevent bus line-name correction.
for(const [name,expected] of [
 ['서울 에이1번','서울 A1번'],
 ['부산 비2번','부산 B2번'],
 ['대구 씨3번','대구 C3번'],
 ['경기 엠123번','경기 M123번'],
 ['울산 10에이-1번','울산 10A-1번'],
 ['서울 에이비씨10번','서울 ABC10번'],
 ['서울 에이치20번','서울 H20번'],
 ['경기 더블유7번','경기 W7번'],
 ['서울 지1번','서울 지1번'], // G/Z is ambiguous without original Latin
 ['경기 비봉2번','경기 비봉2번'], // preserve Korean place names
 ['서울 마을버스 3번','서울 마을버스 3번']
]){
 const sample={id:'kr-bus-no-number',countryId:'kr',mode:'village_bus',line:{ko:name}};
 const changed=route(sample);
 assert.equal(changed.line.ko,expected,'fallback route label: '+name);
 assert.equal(sample.line.ko,name,'route name source must not be mutated');
 if(name!==expected)assert(changed.line.aliases.includes(name),'legacy line alias preserved');
}
assert.equal(route({id:'kr-rail-no-number',countryId:'kr',mode:'rail',line:{ko:'서울 에이1번'}}).line.ko,
 '서울 에이1번','railway unaffected by bus fallback');
assert.equal(route({id:'jp-bus-no-number',countryId:'jp',mode:'bus',line:{ko:'서울 에이1번'}}).line.ko,
 '서울 에이1번','foreign buses unaffected by Korean fallback');

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

// 계통 설명은 보존하고 공식 노선번호의 영문자만 대문자로 복원한다.
for(const [original,previous,expected] of [['P9401(출근)','피9401(출근)','P9401(출근)'],['a1','에이1','A1'],['B3(단축)','비3(단축)','B3(단축)'],['ABC10','에이비씨10','ABC10']]){
 const actual=route({id:'kr-bus-검증',countryId:'kr',mode:'bus',originalRouteNumber:original,routeNumber:previous,line:{ko:'경기 의정부시 '+previous+'번'},stations:[]});
 assert.equal(actual.line.ko,'경기 의정부시 '+expected+'번');assert.equal(actual.id,'kr-bus-검증');
}
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
