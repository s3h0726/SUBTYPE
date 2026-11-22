#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=pathName=>fs.readFileSync(path.join(root,pathName),'utf8');
const source=read('js/rail-data-repository.js');
async function importRepository(){
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).railDataRepository;
}
const railway=(id,operatorId,stops,playable=true)=>({
  id,countryId:'jp',category:'subway',operatorId,
  operator:{ja:'鉄道',ko:'철도',en:'Rail'},
  line:{ja:id,ko:id,en:id},playable,geometryReady:playable,
  stations:stops,geometry:stops.map((_,i)=>[35+i*.001,139+i*.001]),
  services:[{id:'local',stops:stops.map(s=>s.id)}]
});
const stop=(id,ja,ko,index=0,extra={})=>({
  id,stationMasterId:id,ja,ko,romaji:ja,kana:ja,
  geometryIndex:index,latitude:35+index*.001,longitude:139+index*.001,...extra
});
test('Japanese route resolution never overwrites route names with shared station master names',async()=>{
  const repo=await importRepository();
  const master={id:'shared-osaka',names:{ja:'大阪',ko:'오사카',en:'Osaka'}};
  const jr=railway('jr','jr-west',[stop('shared-osaka','大阪','오사카'),stop('x','新大阪','신오사카',1)]);
  const subway=railway('subway','osaka-metro',[stop('shared-osaka','梅田','우메다'),stop('y','中津','나카츠',1)]);
  // Deliberately omit routeSpecificStationName to reproduce the original bug.
  repo.configure({stations:[master],lines:[jr,subway]});
  const resolvedSubway=repo.resolveRoute(subway);
  const resolvedJr=repo.resolveRoute(jr);
  assert.equal(resolvedSubway.stations[0].ja,'梅田');
  assert.equal(resolvedSubway.stations[0].ko,'우메다');
  assert.equal(resolvedJr.stations[0].ja,'大阪');
  assert.equal(resolvedJr.stations[0].ko,'오사카');
  assert.equal(resolvedSubway.stations[0].id,resolvedJr.stations[0].id,'shared transfer ID must be retained');
  assert.equal(repo.getStation('shared-osaka').names.ja,'大阪','master identity remains separate');
  repo.configure({stations:[master],lines:[subway,jr]});
  assert.equal(repo.resolveRoute(jr).stations[0].ja,'大阪','loading order must not change the sign');
  assert.equal(repo.resolveRoute(subway).stations[0].ja,'梅田','loading order must not change the sign');
});
test('non-Japanese canonical behavior and explicit sign overrides remain intact',async()=>{
  const repo=await importRepository(),station=stop('shared','Source sign','원래역');
  const common={id:'shared',names:{ja:'Canonical',ko:'대표역',en:'Canonical'}};
  const foreign={...railway('non-jp','metro',[station]),countryId:'kr'};
  repo.configure({stations:[common],lines:[foreign]});
  assert.equal(repo.resolveRoute(foreign).stations[0].ja,'Canonical');
  foreign.stations[0]={...station,routeSpecificStationName:true};
  assert.equal(repo.resolveRoute(foreign).stations[0].ja,'Source sign');
});
function compile(file,routes){
  const script=read(file),resolver=read('js/service-route-resolver.js').replace(/\bexport\s+/g,'');
  const range=(src,start,end)=>{
    const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
    assert(a>=0&&b>a,file+' missing '+start);return src.slice(a,b)
  };
  const helper=range(script,'const jpCatalogNameCache=new WeakMap();','// TrainLCD line IDs predate');
  const src=range(resolver,'function prepareThroughPart(','export function buildThroughServiceRoute(');
  const ctx={builtin:routes,
    copyGeometry:geometry=>geometry.map(p=>p.slice()),stationKey:s=>String(s.id),
    globalThis:{TRT_NATIONWIDE_SERVICE_CATALOG:{lines:{}}}};
  vm.createContext(ctx);
  vm.runInContext(src+helper+';globalThis.api={japaneseSharedStationIndices,japaneseExistingPhysicalCandidates,japaneseReusablePhysicalRoute};',ctx);
  return ctx.globalThis.api;
}
for(const pathName of ['js/app.js','js/app.bundle.js']){
  test(pathName+' reuses same station IDs despite different transfer station names',()=>{
    const track=railway('existing','tokyo-metro',[
      stop('start','始発','시발',0),stop('shared','大阪','오사카',1),
      stop('last','終点','종점',2)],true);
    const broken=railway('unplayable','tokyo-metro',[
      stop('start','始発','시발',0),stop('shared','梅田','우메다',1),
      stop('last','終点','종점',2)],false);
    const api=compile(pathName,[broken,track]);
    const candidate=api.japaneseExistingPhysicalCandidates(broken);
    assert.equal(candidate.length,1);
    const repaired=api.japaneseReusablePhysicalRoute(broken);
    assert.ok(repaired);
    assert.equal(repaired.stations[1].ja,'梅田','original route sign must survive track reuse');
    assert.equal(repaired.stations[1].ko,'우메다','original Korean name must survive track reuse');
    assert.equal(repaired.stations[1].id,'shared','transfer ID must stay the same');
    assert.equal(repaired.stations[1].geometryIndex,1,'surveyed geometry index must stay the same');
    assert.equal(repaired.physicalTrackRouteId,'existing');
    assert.equal(repaired.services[0].id,'local');
    assert.equal(broken.playable,false,'original data must not be force-unlocked');
  });
  test(pathName+' refuses ambiguous, mismatched IDs or wrong order',()=>{
    const base=railway('existing','operator-a',[
      stop('first','A','에이',0),stop('middle','B','비',1),stop('last','C','씨',2)]);
    const blocked=railway('blocked','operator-a',[
      stop('first','A','에이',0),stop('middle','B LINE','비선',1),stop('last','C','씨',2)],false);
    assert.ok(compile(pathName,[blocked,base]).japaneseReusablePhysicalRoute(blocked));
    const mismatch={...base,id:'wrong-id',stations:base.stations.map(s=>s.id==='middle'?{...s,id:'other'}:s)};
    assert.equal(compile(pathName,[blocked,mismatch]).japaneseReusablePhysicalRoute(blocked),null);
    const reversedOrder={...base,id:'wrong-order',stations:[base.stations[0],base.stations[2],base.stations[1]]};
    assert.equal(compile(pathName,[blocked,reversedOrder]).japaneseReusablePhysicalRoute(blocked),null);
    assert.equal(compile(pathName,[blocked,base,{...base,id:'second'}]).japaneseReusablePhysicalRoute(blocked),null);
    assert.equal(compile(pathName,[blocked,{...base,operatorId:'other-operator'}]).japaneseReusablePhysicalRoute(blocked),null);
  });
}
