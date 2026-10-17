#!/usr/bin/env node
// CI: 8 real JR East 2026 sample journeys must run on separate real-track N'EX variants.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=JSON.parse(read('data/generated/routes/line-11328.json')).route;
const candidates=JSON.parse(read('data/generated/nex-branch-geometry-candidates.json'));
assert.equal(candidates.releaseApproved,false);
assert.equal(candidates.variants.length,2);
const sandbox={console,TRT_NEX_BRANCH_CANDIDATES:candidates};sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(read('js/nex-route-resolver.js').replace(/\bexport\s+/g,''),sandbox,{filename:'js/nex-route-resolver.js'});
const choices=sandbox.nexOperatingChoices(source);
assert.equal(choices.length,8,'Expected trains 2, 5, 14 and 54 from Shinjuku and Ofuna');
const summary=[];
for(const choice of choices){
 const resolved=sandbox.resolveNexOperatingChoice(source,choice),route=resolved.route,stops=resolved.service.stops;
 assert.equal(route.geometryReady,true);
 assert.equal(route.nexBranchGeometryStatus,'MLIT_TRACK_CANDIDATE_NOT_RELEASE_APPROVED');
 assert.equal(resolved.direction,'forward','Resolver must avoid a second reverse');
 assert(route.geometry.length>300,'Track is unexpectedly short');
 assert(route.stations.length>=9,'NEX must retain actual physical waypoints');
 assert.equal(route.directedSegments.length,route.stations.length-1);
 assert.equal(JSON.stringify(route.stations.filter(s=>stops.includes(s.id)).map(s=>s.id)),JSON.stringify(stops),'Timetable stop sequence');
 assert(route.stations.every((s,i)=>i===0||s.geometryIndex>route.stations[i-1].geometryIndex));
 assert.equal(route.stations[0].geometryIndex,0);
 assert.equal(route.stations.at(-1).geometryIndex,route.geometry.length-1);
 assert(stops.includes('station-mlit-003766'),'Tokyo must be served');
 if(choice.nexVariantId.includes('shinjuku')){
   assert(route.stations.some(s=>s.ja==='渋谷'));
   assert(!stops.includes('station-mlit-004095'),'Shinagawa is a Shinjuku pass-through, not a stop');
 }else{
   assert(stops.includes('station-mlit-004095'),'Ofuna calls at Shinagawa');
   assert(!stops.includes('station-mlit-003922'),'Ofuna must not call at Shibuya');
 }
 if(choice.id.startsWith('nex-54-'))assert(!stops.includes('station-mlit-004173'),'Train 54 skips Chiba');
 if(choice.id.startsWith('nex-2-'))for(const stationId of ['station-mlit-003161','station-mlit-003531','station-mlit-003898','station-mlit-004173'])assert(stops.includes(stationId),'Train 2 additional call missing: '+stationId);
 for(const segment of route.directedSegments){assert(segment.geometry.length>=2);assert.equal(segment.verified,false);}
 summary.push({choice:choice.id,stations:route.stations.length,stops:stops.length,points:route.geometry.length,first:route.stations[0].ja,last:route.stations.at(-1).ja});
}
console.log(JSON.stringify({status:'PASS',count:summary.length,journeys:summary},null,2));
