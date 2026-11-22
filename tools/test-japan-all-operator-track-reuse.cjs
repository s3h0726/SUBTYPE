#!/usr/bin/env node
'use strict';
// Non-TrainLCD Japanese services must reuse *only* an existing surveyed track
// with the same operator/category and exact ordered station identities.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function compile(file,routes){
  const source=read(file),resolver=read('js/service-route-resolver.js');
  const range=(s,start,end)=>{
    const i=s.indexOf(start),j=s.indexOf(end,i+start.length);
    assert(i>=0&&j>i,'missing code '+start+' in '+file);
    return s.slice(i,j);
  };
  const helper=range(source,'const jpCatalogNameCache=new WeakMap();','// TrainLCD line IDs predate');
  const clip=range(resolver,'function prepareThroughPart(','export function buildThroughServiceRoute(');
  const choice=range(source,'function resolveOperatingChoice(','function operatingChoiceStatus(');
  const status=range(source,'function operatingChoiceStatus(','function operatingChoicePlayable(');
  const ctx={
    builtin:routes,copyGeometry:geometry=>geometry.map(p=>p.slice()),
    stationKey:station=>String(station.id),globalThis:{TRT_NATIONWIDE_SERVICE_CATALOG:{lines:{}}},
    resolveServiceSelection:({baseRoute,legacyServiceId,directionId})=>({
      route:baseRoute,service:baseRoute.services?.find(s=>s.id===legacyServiceId)||baseRoute.services?.[0],
      direction:directionId
    })
  };
  vm.createContext(ctx);
  vm.runInContext(clip+helper+choice+status+
    ';globalThis.api={japaneseExistingPhysicalCandidates,japaneseReusablePhysicalRoute,japaneseChoiceCanReuseTrack,operatingChoiceStatus,resolveOperatingChoice};',ctx);
  return ctx.globalThis.api;
}
const station=(id,i)=>({id,ja:'駅'+id,geometryIndex:i});
function fixtures(category,operator='sample-jp'){
  const track={
    countryId:'jp',id:'line-surveyed',category,operatorId:operator,
    geometryReady:true,playable:true,
    stations:[station('X',0),station('A',1),station('B',2),station('C',3),station('D',4)],
    geometry:[[0,0],[1,0],[2,0],[3,0],[4,0]],services:[]
  };
  const original={
    countryId:'jp',id:'line-incomplete',category,operatorId:operator,
    geometryReady:false,playable:false,missingSegments:[{from:'A',to:'D'}],
    stations:[station('A',0),station('B',1),station('C',2),station('D',3)],
    geometry:[[10,10]],services:[]
  };
  return {track,original};
}
for(const file of ['js/app.js','js/app.bundle.js']){
  for(const category of ['jr','shinkansen','private','subway','third-sector','tram']){
    test(file+' '+category+': reuse validated physical railway for both directions',()=>{
      const {track,original}=fixtures(category);
      const api=compile(file,[original,track]);
      const choice={kind:'fallback',direction:'forward',legacyServiceId:'local'};
      assert.equal(api.japaneseExistingPhysicalCandidates(original).length,1);
      const reused=api.japaneseReusablePhysicalRoute(original);
      assert.ok(reused,category+' should reuse existing track');
      assert.equal(reused.id,original.id,'route/service identity must remain stable');
      assert.equal(reused.physicalTrackRouteId,track.id);
      assert.deepEqual(Array.from(reused.stations,st=>st.id),['A','B','C','D']);
      assert.equal(reused.geometry.length,4);
      assert.equal(reused.services[0].id,'local');
      assert.equal(original.playable,false,'source must remain blocked');
      assert.equal(api.operatingChoiceStatus(choice,original).playable,true);
      assert.equal(api.resolveOperatingChoice(choice,original).route.physicalTrackRouteId,track.id);
      const reverse={...choice,direction:'reverse'};
      assert.equal(api.operatingChoiceStatus(reverse,original).playable,true);
    });
  }
  test(file+': protect identity, operator, ambiguity and geometry',()=>{
    const {track,original}=fixtures('private');
    const wrongOperator={...track,operatorId:'different-company'};
    const wrongCategory={...track,category:'jr'};
    const noGeometry={...track,geometryReady:false};
    const badIds={...track,stations:track.stations.map(s=>s.id==='B'?{...s,id:'B-other',ja:'駅B'}:s)};
    const blockedParallel={...track,id:'parallel-unverified',playable:false};
    const choice={kind:'fallback',direction:'forward'};
    for(const candidate of [wrongOperator,wrongCategory,noGeometry,badIds,blockedParallel]){
      const api=compile(file,[original,candidate]);
      assert.equal(api.operatingChoiceStatus(choice,original).playable,false,
        'unsafe candidate '+candidate.id);
    }
    assert.equal(compile(file,[original,track,{...track,id:'second-track'}])
      .operatingChoiceStatus(choice,original).playable,false,'ambiguous parallels remain blocked');
    assert.equal(compile(file,[original,track])
      .operatingChoiceStatus({kind:'through',throughSpecId:'unverified'},original).playable,false);
    assert.equal(compile(file,[original,track])
      .operatingChoiceStatus({kind:'catalog',catalogUnavailableReason:'미검증'},original).playable,false);
  });
  test(file+': reverse-oriented source is clipped along real reversed track',()=>{
    const {track,original}=fixtures('subway');
    original.stations.reverse();
    const api=compile(file,[original,track]);
    const reused=api.japaneseReusablePhysicalRoute(original);
    assert.deepEqual(Array.from(reused.stations,s=>s.id),['D','C','B','A']);
    assert.deepEqual(Array.from(reused.geometry,p=>p[0]),[4,3,2,1]);
  });
}
