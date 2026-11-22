'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const test=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/korean-service-resolver.js'),'utf8')
 .replace(/^import[^\r\n]*\r?\n/,'').replace(/\bexport\s+/g,'');
const context=vm.createContext({Intl,Date,console,mapOnlyKtxJourneySegments:()=>null});
vm.runInContext(source+'\nglobalThis.api={koreanVerifiedChoices,resolveKoreanVerifiedChoice};',context);
const {koreanVerifiedChoices,resolveKoreanVerifiedChoice}=context.api;
const point=(name,i)=>({id:name,ko:name,latitude:35+i,longitude:127+i,geometryIndex:i});
const seoul=point('서울',0),dongdaegu=point('동대구',1),busan=point('부산',2);
const forwardPoints=[[35,127],[36,128],[37,129]];
const makeJourney=(id,kind,stations=[seoul,dongdaegu,busan],geometry=forwardPoints)=>({
 id,patternId:'kr-gyeongbu-official',patternName:{ko:'서울–부산 '+kind},
 directionId:'down',tripIds:[id],geometry,stations,
 service:{id:'service-'+id,nameKo:kind+' 경부',stops:stations.map(x=>x.id)},
 directedSegments:stations.slice(0,-1).map((s,i)=>({
  fromStationId:s.id,toStationId:stations[i+1].id,
  geometry:geometry.slice(i,i+2),geometryStatus:'ready'
 }))
});
const makeRoute=(journeys,extra={})=>({
 id:'kr-gyeongbu-test',countryId:'kr',schemaVersion:2,releaseStatus:'verified',
 geometryReady:true,mode:'high_speed_rail',line:{ko:'경부고속선'},
 verifiedJourneys:journeys,...extra
});
test('identical KTX/KTX-산천 stops appear once per physical direction',()=>{
 const route=makeRoute([makeJourney('one','KTX'),makeJourney('two','KTX-산천')]);
 const choices=koreanVerifiedChoices(route);
 assert.equal(choices.length,2);
 assert.equal(choices.filter(c=>c.simulatedReverse).length,1);
 assert.equal(choices.filter(c=>!c.simulatedReverse).length,1);
 assert.equal(choices[1].originId,'부산');
});
test('simulated northbound preserves exact reversed source geometry and stops',()=>{
 const journey=makeJourney('one','KTX');
 const route=makeRoute([journey]);
 const choice=koreanVerifiedChoices(route).find(c=>c.simulatedReverse);
 const resolved=resolveKoreanVerifiedChoice(choice,route);
 assert.equal(resolved.route.gameOnlyReverse,true);
 assert.equal(resolved.route.timetableVerified,false);
 assert.deepEqual(JSON.parse(JSON.stringify(resolved.route.geometry)),[...forwardPoints].reverse());
 assert.deepEqual(JSON.parse(JSON.stringify(resolved.route.stations.map(s=>s.geometryIndex))),[0,1,2]);
 assert.deepEqual(JSON.parse(JSON.stringify(resolved.service.stops)),['부산','동대구','서울']);
 assert.equal(resolved.route.directedSegments[0].fromStationId,'부산');
 assert.equal(resolved.route.directedSegments[0].toStationId,'동대구');
 assert.equal(resolved.route.directedSegments[0].geometry[0][0],37);
 assert.equal(resolved.route.directedSegments[1].geometry.at(-1)[0],35);
 assert.equal(resolved.route.stations[0].id,choice.originId);
 assert.equal(resolved.route.stations.at(-1).id,choice.destinationId);
 assert.deepEqual(journey.tripIds,['one'],'canonical official trip unmodified');
 assert.ok(resolved.service.nameKo.includes('역방향 게임 운행'));
 assert.ok(!resolved.service.nameKo.includes('시간표 미검증'));
 assert.equal(resolved.route.timetableVerified,false);
 assert.equal(resolved.journey.sourceJourneyId,'one');
});
test('real timetable reverse supersedes game reverse',()=>{
 const down=makeJourney('down','KTX');
 const up=makeJourney('up','KTX-산천',[busan,dongdaegu,seoul],[[37,129],[36,128],[35,127]]);
 const choices=koreanVerifiedChoices(makeRoute([down,up]));
 assert.equal(choices.length,2);
 assert.ok(choices.every(choice=>!choice.simulatedReverse));
});
test('different stop orders and non-KTX trains are never accidentally deduplicated',()=>{
 const down=makeJourney('down','KTX');
 const express=makeJourney('express','KTX',[seoul,busan],[[35,127],[37,129]]);
 const choices=koreanVerifiedChoices(makeRoute([down,express]));
 assert.equal(choices.length,4);
 const srt=koreanVerifiedChoices(makeRoute([makeJourney('s1','SRT'),makeJourney('s2','SRT')],{line:{ko:'SRT 고속철도'}}));
 assert.equal(srt.length,2);
});
