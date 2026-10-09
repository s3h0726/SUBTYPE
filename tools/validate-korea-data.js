#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const errors=[],ids=new Set();
for(const route of index.routes||[]){
 if(ids.has(route.id))errors.push('duplicate route '+route.id);
 ids.add(route.id);
 if(route.countryId!=='kr'||!route.id.startsWith('kr-'))errors.push('country/id '+route.id);
 if(!route.lazySource)errors.push('missing lazySource '+route.id);
 const file=path.join(root,route.lazySource||'MISSING');
 if(!fs.existsSync(file)){errors.push('missing file '+route.id);continue}
 const payload=JSON.parse(fs.readFileSync(file,'utf8')).route;
 if(!payload||!Array.isArray(payload.directions)||payload.directions.length!==2){errors.push('directions '+route.id);continue}
 for(const dir of payload.directions){
  if(!Array.isArray(dir.stops)||dir.stops.length<3)errors.push('too few stops '+route.id);
  if(dir.stops?.some(s=>!s.names?.ko||!Number.isFinite(s.latitude)||!Number.isFinite(s.longitude)))errors.push('invalid stop '+route.id);
  if(dir.geometryStatus!=='ready'&&((dir.geometry||[]).length||(dir.directedSegments||[]).length))errors.push('fake geometry '+route.id);
 }
 if(payload.sourceStatus==='secondary-unverified'&&payload.geometryReady)errors.push('unverified route marked geometryReady '+route.id);
}
if(!index.routes?.length)errors.push('Korean catalog empty');
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',routes:ids.size,operators:index.operators?.length,uniqueLineStations:index.counts?.stops,provisional:index.routes?.some(r=>r.sourceStatus==='secondary-unverified'),errors},null,2));
if(errors.length)process.exitCode=1;
