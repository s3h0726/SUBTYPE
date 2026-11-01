'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {validateRoute}=require('./lib/kr-canonical.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/canonical');
const routes=JSON.parse(fs.readFileSync(path.join(base,'bus-topis-batch.json'),'utf8')).routes;
const candidates=JSON.parse(fs.readFileSync(path.join(base,'bus-candidates.json'),'utf8')).routes;
const routeIds=new Set;
let directions=0;
for(const route of routes){
 assert(!routeIds.has(route.id),route.id);routeIds.add(route.id);
 assert.deepEqual(validateRoute(route),[],route.id);
 const rid=route.id.replace('kr-bus-seoul-','');
 const read=kind=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(base,'bus-source/topis',`${rid}-${kind}.json.gz`)))).rows;
 const rawStops=read('stops').sort((a,b)=>a.stationOrd-b.stationOrd);
 const rawGeometry=read('geometry').map(p=>[Number(p.posY),Number(p.posX)]).filter((p,i,a)=>!i||JSON.stringify(p)!==JSON.stringify(a[i-1]));
 const officialGroups=[];
 for(const stop of rawStops){if(!officialGroups.length||officialGroups.at(-1).direction!==stop.dir)officialGroups.push({direction:stop.dir,stops:[]});officialGroups.at(-1).stops.push(stop);}
 for(const journey of route.verifiedJourneys){
  const group=officialGroups[Number(journey.directionId.replace('direction-',''))-1];
  assert.deepEqual(journey.stations.map(s=>s.sourceStopId),group.stops.map(s=>String(s.stnId)),`${journey.id}: source stop order`);
  assert.equal(journey.sourceDirection,group.direction);
  assert(journey.stations.every(s=>!/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/u.test(s.ko)));
  // Every playable point must be an unchanged contiguous slice of the actual
  // official road polyline. There is no stop-to-stop straight-line fallback.
  const first=journey.geometry[0];let matched=false;
  for(let start=0;start<rawGeometry.length;start++){
   if(JSON.stringify(first)!==JSON.stringify(rawGeometry[start]))continue;
   if(JSON.stringify(journey.geometry)===JSON.stringify(rawGeometry.slice(start,start+journey.geometry.length))){matched=true;break;}
  }
  assert(matched,`${journey.id}: official shape slice`);directions++;
 }
}
assert.equal(new Set(candidates.map(r=>r.id)).size,candidates.length);
assert(candidates.every(r=>r.publicationStatus==='queued'));
assert(candidates.filter(r=>r.regionId!=='seoul').every(r=>r.stopSequence.length===0),'national route endpoints must never become invented stop sequences');
assert(routes.some(r=>r.routeNumber==='143'&&r.verifiedJourneys.length===2),'representative Seoul city bus');
assert(routes.some(r=>r.mode==='village_bus'),'village buses included');
assert(routes.some(r=>r.categoryKo==='광역버스'),'metropolitan buses included');
console.log(JSON.stringify({passed:true,publicBusRoutes:routes.length,actualDirectionServices:directions,candidateRoutes:candidates.length,checks:['canonical schema','duplicate identifiers','Korean displays','source stop IDs and order','independent direction grouping','exact official road geometry slices','no invented nationwide sequences']}));
