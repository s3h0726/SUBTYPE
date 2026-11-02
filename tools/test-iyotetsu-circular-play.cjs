#!/usr/bin/env node
'use strict';
// Iyotetsu route 1 / route 2: complete loop, real station coordinates and
// transfers that do not split the circular arrival from its starting station.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),load=p=>JSON.parse(read(p));
const ids=['line-99809-1','line-99809-2'];
const routes=new Map(ids.map(id=>[id,load('data/generated/routes/'+id+'.json').route]));
const coords=s=>[s.latitude,s.longitude];
const pointKm=(a,b)=>{
 const lat=Number(b[0])*Math.PI/180;
 return Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos(lat));
};
const vmFile=p=>read(p).replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,'');
const routeCtx={console,hongKongRouteBlockReason:()=>null};
vm.createContext(routeCtx);
vm.runInContext(vmFile('js/route-integrity.js')+';globalThis.resolveIyotetsu=resolvePlayableRoute',routeCtx);
for(const [id,route] of routes){
 assert.equal(route.loop,true,id+': loop flag');
 assert.equal(route.oneWay,true,id+': circular route must not reverse');
 assert.equal(route.geometryReady,true,id+': surveyed track');
 assert.equal(route.stations.length,23,id+': 23 occurrences including terminal return');
 assert.equal(route.directedSegments.length,22,id+': 22 travelled segments');
 assert.equal(route.services.length,1,id+': exactly one physical direction');
 assert.deepEqual(route.services[0].stops,route.stations.map(s=>s.id));
 assert.equal(new Set(route.stations.map(s=>s.id)).size,23);
 const first=route.stations[0],last=route.stations.at(-1);
 assert.notEqual(first.id,last.id,'arrival occurrence must not overwrite departure record');
 assert.equal(first.stationMasterId,last.stationMasterId);
 assert.equal(first.ja,'松山市駅');assert.equal(last.ja,first.ja);
 assert.deepEqual(coords(first),coords(last));
 assert.deepEqual(route.geometry[0],route.geometry.at(-1));
 for(const station of route.stations){
   assert(Number.isInteger(station.geometryIndex),'Station must be snapped to rail geometry: '+station.ja);
   assert(pointKm(route.geometry[station.geometryIndex],coords(station))<0.08,
     id+'/'+station.ja+': wrong platform vs track endpoint');
 }
 for(let i=0;i<22;i++){
   const seg=route.directedSegments[i],from=route.stations[i],to=route.stations[i+1];
   assert.equal(seg.fromStationId,from.id);
   assert.equal(seg.toStationId,to.id);
   assert(seg.geometry.length>=2,id+': missing physical rails '+i);
   assert.deepEqual(seg.geometry[0],route.geometry[from.geometryIndex]);
   assert.deepEqual(seg.geometry.at(-1),route.geometry[to.geometryIndex]);
 }
 const resolved=routeCtx.resolveIyotetsu({...route,countryId:'jp'},{
   direction:'forward',service:route.services[0]});
 assert(!resolved.fallbackGeometry,'no straight-line fallback '+id);
 assert.equal(resolved.stations.length,23);
 assert.equal(resolved.segments.length,22);
 assert.equal(resolved.stations.at(-1).id,last.id);
 assert.deepEqual(resolved.geometry[0],resolved.geometry.at(-1));
}
const outer=routes.get(ids[0]),inner=routes.get(ids[1]);
assert.deepEqual(outer.stations.slice(2,21).map(s=>s.ja),
  inner.stations.slice(2,21).map(s=>s.ja).reverse(),
  'outer and inner circulation must travel opposite ways around the ring');

const ctx={console,normalize:s=>String(s||'').normalize('NFC').toLowerCase().trim(),
  $:()=>null,escapeHtml:s=>String(s||''),koreanRouteDisplayText:s=>String(s||''),
  koreanRouteBlockReason:()=>null,hongKongRouteBlockReason:()=>null,
  hongKongTransferAllowed:()=>true};
vm.createContext(ctx);
require('./lib/test-kr-display-context.cjs')(ctx);
vm.runInContext(vmFile('js/free-drive.js')+
 ';globalThis.IyotetsuDrive=FreeDrive;globalThis.iyKey=freeDriveStationKey',ctx);
const drive=Object.create(ctx.IyotetsuDrive.prototype);
drive.renderMap=()=>{};drive.render=()=>{};drive.emit=()=>{};
const more=['line-99805','line-99806','line-99807','line-99810','line-99811','line-99812'].map(id=>
  load('data/generated/routes/'+id+'.json').route);
const physical=[...routes.values(),...more].map(route=>({...JSON.parse(JSON.stringify(route)),countryId:'jp'}));
drive.setNetwork(physical);
for(const id of ids){
 const route=drive.routes.find(r=>r.id===id),first=route.stations[0],end=route.stations.at(-1);
 const startKey=ctx.iyKey(first),endKey=ctx.iyKey(end);
 assert.equal(startKey,endKey,id+': circular return must reach the actual start node');
 const node=drive.graph.get(startKey);
 assert(node,'missing real starting-station transfer node '+id);
 for(const railId of ['line-99805','line-99806','line-99807'])
   assert(node.routeIds.has(railId),id+': Matsuyamashi tram/suburban interchange missing '+railId);
 assert.notEqual(ctx.iyKey(route.stations[1]),ctx.iyKey(route.stations[21]),
   id+': repeated Minamihoribata visit must not short-circuit the full loop');
 const select={innerHTML:''};
 ctx.$=query=>query==='#free-drive-start-station'?select:null;
 drive.populateStartStations(route);
 assert.equal((select.innerHTML.match(/<option /g)||[]).length,22,
  id+': circular arrival duplicate should not be selectable as a departure');
 assert(!select.innerHTML.includes('value="22"'),id+': duplicate closing visit exposed');
 drive.currentKey=startKey;drive.currentRouteId=id;drive.history=[startKey];
 for(let i=1;i<route.stations.length;i++){
   const destination=ctx.iyKey(route.stations[i]);
   assert(drive.moveTo(destination,id),id+': free-drive skipped or blocked visit '+i);
   assert.equal(drive.currentKey,destination,id+': wrong graph station '+i);
 }
 assert.equal(drive.history.length,23,id+': exactly 22 moves plus start');
 assert.equal(drive.currentKey,startKey,id+': did not return to terminal');
 const edges=[...drive.graph.values()].flatMap(n=>n.edges).filter(e=>e.routeId===id);
 assert(edges.every(e=>e.direction===1),id+': reverse traversal incorrectly offered');
}

// Exercise Game's real station advancement and finish-contract logic for
// both loops without timers/animations. The 23rd typed station is REQUIRED.
const gameCtx={console,clearInterval,clearTimeout,
 performance:{now:()=>1000},$:()=>({})};
vm.createContext(gameCtx);
vm.runInContext(vmFile('js/game.js')+';globalThis.IyoGame=Game',gameCtx);
for(const id of ids){
 const route=routes.get(id),ready=routeCtx.resolveIyotetsu({...route,countryId:'jp'},{
   direction:'forward',service:route.services[0]});
 let outcome=null;
 const game=Object.create(gameCtx.IyoGame.prototype);
 Object.assign(game,{
   sequence:ready.stations,index:0,boarding:false,phase:'MOVING',
   typedStationIds:[ready.stations[0].id],visitedStationIds:[],
   route,options:{mode:'complete',direction:'forward'},service:route.services[0],
   errors:0,maxCombo:0,finished:false,timer:null,moveTimer:null,
   recordHongKongAdvance(){},syncDebug(){},metrics(){return{elapsed:1000,accuracy:100,cpm:300}},
   onFinish:result=>{outcome=result}
 });
 for(let i=1;i<ready.stations.length;i++){
   game.typedStationIds.push(ready.stations[i].id);
   game.phase='MOVING';
   game.advanceToNextStation(ready.stations[i]);
   assert.equal(game.index,i,id+': skipped station '+i);
 }
 game.finish();
 assert.equal(outcome?.routeIntegrity,true,id+': final loop was not verified');
 assert.equal(outcome?.completed,23,id+': did not type last return');
 assert.equal(outcome?.typedStationIds.at(-1),route.stations.at(-1).id);
 assert.equal(outcome?.visitedStationIds.length,22);
}
console.log('PASS Iyotetsu circular play: two one-way 23-visit loops, real track, full typed finish, 22 graph moves, unique departure list and verified Matsuyamashi transfers');
