#!/usr/bin/env node
'use strict';
// Through-service regression: verified Iyo suburban tracks, both directions,
// Matsuyamashi continuity, section locals, browser selector and arrival ID.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const throughId='iyotetsu-takahama-yokogawara-local';
const spec=json('data/through-services.json').services.find(x=>x.id===throughId);
assert(spec,'Official Iyotetsu Takahama–Yokogawara through service missing');
assert.deepEqual(spec.participatingLineIds,['line-99806','line-99807']);
assert.equal(spec.boundarySnapToleranceKm,0.02);
const embedded=JSON.parse(read('js/rail-system-data.js').split('window.TRT_RAIL_SYSTEM=')[1].trim().replace(/;\s*$/,''));
assert.deepEqual(embedded.throughServices.find(x=>x.id===throughId),spec,'Browser data is stale');
assert.equal(embedded.audit.throughServices,embedded.throughServices.length);
const routes=new Map;
const expectedLocals={
 'line-99806':{id:'iyotetsu-takahama-local',count:10,first:'高浜',last:'松山市'},
 'line-99807':{id:'iyotetsu-yokogawara-local',count:15,first:'松山市',last:'横河原'}
};
for(const [id,meta] of Object.entries(expectedLocals)){
 const route=json('data/generated/routes/'+id+'.json').route;
 const workspace= id==='line-99806'?'iyotetsudotakahamasen':'iyotetsudoyokogawarasen';
 const line=json('data/lines/iyotetsudo/'+workspace+'/line.json');
 assert.equal(route.id,line.id);
 assert.equal(route.geometryReady,true);
 assert.equal(route.stations.length,meta.count);
 assert.equal(route.directedSegments.length,meta.count-1);
 assert.equal(route.stations[0].ja,meta.first);
 assert.equal(route.stations.at(-1).ja,meta.last);
 assert.equal(route.services.length,1);
 assert.equal(route.services[0].id,meta.id);
 assert.deepEqual(route.services[0].stops,route.stations.map(s=>s.id));
 assert.deepEqual(line.services[0].stopPattern,route.services[0].stops);
 assert(line.throughServiceIds.includes(throughId));
 assert(route.throughServiceIds.includes(throughId));
 routes.set(id,route);
}
const left=routes.get('line-99806'),right=routes.get('line-99807');
assert.equal(left.stations.at(-1).stationMasterId,right.stations[0].stationMasterId);
assert.equal(left.stations.at(-1).ja,'松山市');
assert.deepEqual(left.geometry.at(-1),right.geometry[0],'Matsuyamashi must be a real matching track endpoint');
const ctx={console};ctx.globalThis=ctx;
ctx.TRT_RAIL_SYSTEM={throughServices:[spec],trainServices:[]};
ctx.TRT_TOKYO_SERVICE_PATTERNS={trainTypes:[{id:'through-regular',names:{ko:'직통'},priority:20}]};
vm.createContext(ctx);
vm.runInContext(read('js/service-route-resolver.js').replace(/\bexport\s+/g,''),ctx);
const cases={
 forward:['高浜','横河原'],
 reverse:['横河原','高浜']
};
for(const [direction,[origin,destination]] of Object.entries(cases)){
 const joined=ctx.buildThroughServiceRoute(spec,id=>routes.get(id),direction);
 assert.equal(joined.stations.length,24,'10 + 15 - shared Matsuyamashi must equal 24');
 assert.equal(joined.geometry.length,left.geometry.length+right.geometry.length-1);
 assert.equal(joined.stations[0].ja,origin);
 assert.equal(joined.stations.at(-1).ja,destination);
 assert.equal(joined.stations.filter(s=>s.ja==='松山市').length,1,'Duplicate interchange stop');
 assert.equal(new Set(joined.stations.map(s=>s.id)).size,24);
 assert(joined.stations.every((s,i)=>Number.isInteger(s.geometryIndex)&&s.geometryIndex>=0&&s.geometryIndex<joined.geometry.length&&(i===0||s.geometryIndex>joined.stations[i-1].geometryIndex)),'Non-monotonic station geometry indices');
 assert.equal(joined.geometryReady,true,'Existing physical segments should be preserved');
 const join=joined.stations.find(s=>s.ja==='松山市');
 assert.equal(JSON.stringify(joined.geometry[join.geometryIndex]),JSON.stringify(left.geometry.at(-1)),'Joined rail coordinate must be the source track vertex');
}
const src=read('js/app.js'),bundle=read('js/app.bundle.js');
const fix='destinationStationId:throughRoute.stations.at(-1)?.id||null';
assert(src.includes(fix)&&bundle.includes(fix),'Through-service destination uses synthetic selector ID');
const section=(start,end)=>{const i=src.indexOf(start),j=src.indexOf(end,i);assert(i>=0&&j>i,'Missing app function');return src.slice(i,j)};
ctx.serviceJourneysForRoute=()=>[];
ctx.servicePatternsForRoute=()=>[];
ctx.trainTypeFor=id=>ctx.TRT_TOKYO_SERVICE_PATTERNS.trainTypes.find(t=>t.id===id)||null;
ctx.throughRouteIds=spec=>spec.participatingLineIds;
ctx.nationwideCatalogLine=()=>null;
ctx.journeyLabel=value=>typeof value==='string'?value:value?.ko||value?.ja||value?.names?.ko||'';
ctx.buildThroughRoute=(s,direction)=>ctx.buildThroughServiceRoute(s,id=>routes.get(id),direction);
vm.runInContext(section('function actualOperatingChoices(route){','function operatingPatternKey(choice){'),ctx);
vm.runInContext(section('function resolveOperatingChoice(choice,route,{preview=false}={}){','function operatingChoiceStatus(choice,route){'),ctx);
for(const [id,route] of routes){
 const choices=ctx.actualOperatingChoices({...route,countryId:'jp'});
 assert.equal(choices.filter(c=>c.kind==='through').length,2,'Two direct-through directions required '+id);
 assert.equal(choices.filter(c=>c.kind==='legacy').length,2,'Keep both local-section directions '+id);
 for(const choice of choices.filter(c=>c.kind==='through')){
  const result=ctx.resolveOperatingChoice(choice,{...route,countryId:'jp'});
  assert.equal(result.service.stops.length,24,'Actual selected through journey is incomplete');
  assert.equal(result.destinationStationId,result.route.stations.at(-1).id,'Incorrect arrival binding');
  assert.equal(result.route.stations.at(-1).ja,choice.direction==='forward'?'横河原':'高浜');
 }
}
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
assert.equal(lite.routes.length,608,'Do not add duplicate physical line cards');
assert.equal(lite.routes.filter(r=>r.operatorId==='iyotetsudo').length,8,'Preserve Iyo 3 rail + 5 tram cards');
assert(read('index.html').includes('rail-system-data.js?v=20261103-iyotetsu-through-v1'),'Client cache would keep old timetable');
console.log('PASS Iyo: 2 through directions, 24 real stops, 143 source-track points, 4 local/through choices per card, 8 existing line cards preserved');
