#!/usr/bin/env node
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import{resolvePlayableRoute}from'../js/route-integrity.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ids=['kr-metro-2','kr-metro-2-section-2','kr-metro-2-section-3'];
const errors=[],checks=[];
for(const id of ids){
  const route=JSON.parse(fs.readFileSync(path.join(root,'data','kr','generated','routes',`${id}.json`),'utf8')).route;
  for(const direction of route.directions||[]){
    try{
      const selected={...route,stations:direction.stops,geometry:direction.geometry,directedSegments:direction.directedSegments,geometryReady:true,geometryStatus:'ready'};
      const resolved=resolvePlayableRoute(selected,{direction:'forward'});
      const pass=resolved.segments.length===direction.stops.length-1&&resolved.segments.every(segment=>segment.geometryStatus==='ready'&&!segment.fallbackGeometry)&&resolved.geometry.length===direction.geometry.length;
      checks.push({artifact:id,direction:direction.id,stations:resolved.stations.length,segments:resolved.segments.length,points:resolved.geometry.length,pass});
      if(!pass)errors.push(`${id}/${direction.id}: resolved geometry differs or contains fallback`);
    }catch(error){errors.push(`${id}/${direction.id}: ${error.message}`)}
  }
}
try{
  resolvePlayableRoute({id:'kr-unverified-fixture',countryId:'kr',geometryReady:false,geometryStatus:'missing',stations:[{id:'a',ko:'가',latitude:37,longitude:127},{id:'b',ko:'나',latitude:37.1,longitude:127.1}]});
  errors.push('unverified Korean route received a straight-line fallback');
}catch(error){checks.push({fixture:'unverified-korean-route-blocked',pass:/verified railway geometry is required/.test(error.message)})}
const result={status:errors.length?'FAIL':'PASS',checks,errors};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
