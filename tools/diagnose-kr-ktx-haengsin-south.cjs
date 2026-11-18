#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {expectedCorridor,indexTracks,nearest,samples}=require('./audit-kr-ktx-track-alignment.cjs');
const batches=readBatches(root),ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const tracks=indexTracks(ways),byWay=new Map(ways.map(x=>[String(x.id),x]));
const km=points=>points.reduce((s,p,i)=>i?s+distance(points[i-1],p):s,0);
const endpoints=p=>[p[0],p.at(-1)];
const count={haengsin:0,south:0};const representative=new Set(),unique=new Map();
const target=j=>j.stations?.[0]?.ko==='행신'||
 j.stations?.some((s,i)=>['대전','동대구','경주','울산'].includes(s.ko)&&['동대구','경주','울산','부산'].includes(j.stations[i+1]?.ko));
for(const batch of batches){
 for(const route of batch.routes||[]){
  if(route.mode!=='high_speed_rail')continue;
  for(const j of route.verifiedJourneys||[]){
   if(!target(j))continue;
   const names=j.stations.map(s=>s.ko);const haengsin=names[0]==='행신';
   if(haengsin)count.haengsin++;
   if(names.includes('대전')&&names.some(x=>['동대구','경주','부산'].includes(x)))count.south++;
   if(!haengsin&&representative.has(route.id))continue;
   representative.add(route.id);
   const legs=j.directedSegments.map((s,i)=>{
    const coord=s.geometry;
    const from=j.stations[i].ko,to=j.stations[i+1].ko,distKm=km(coord);
    const src=j.sourceEdgeRefs?.slice(j.stations[i].geometryIndex,j.stations[i+1].geometryIndex)||[];
    const wayIds=[...new Set(src.map(e=>String(e.wayId)))];
    const tags=wayIds.map(id=>byWay.get(id)?.tags||{});
    const freq={};for(const tag of tags){
     const key=[tag.name||tag['name:ko']||'',tag.highspeed||'?',tag.railway||'',tag.service||'',tag.maxspeed||''].join('|');
     freq[key]=(freq[key]||0)+1;
    }
    const corridor=expectedCorridor(from,to,names),sample= corridor?samples(coord,3).slice(1,-1).map(p=>nearest(p,corridor,tracks)):[],
      coverage=sample.length?sample.filter(o=>o.distanceKm!==null&&o.distanceKm<.3).length/sample.length:null;
    return {from,to,km:+distKm.toFixed(2),straight:+distance(coord[0],coord.at(-1)).toFixed(2),stretch:+(distKm/distance(coord[0],coord.at(-1))).toFixed(2),
     vertices:coord.length,endpoint0:coord[0],endpointN:coord.at(-1),
     sourceEvidence:src.length,hsrCoverage:coverage,topWays:Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6),
     exampleWay:wayIds.slice(0,5),minLat:Math.min(...coord.map(p=>p[0])),maxLat:Math.max(...coord.map(p=>p[0])),
     minLon:Math.min(...coord.map(p=>p[1])),maxLon:Math.max(...coord.map(p=>p[1]))};
   });
   const chosen=legs.filter((l,i)=>haengsin&&i<3||names.includes('대전')&&(
     l.from==='대전'||l.from==='김천구미'||l.from==='동대구'||l.from==='경주'||l.from==='울산'||l.to==='부산'));
   const record={batch:batch.name,routeId:route.id,journeyId:j.id,pattern:j.patternName?.ko,stops:names,
    selected:chosen};
   console.log('KTX_HAENGSIN_SOUTH_DETAIL '+JSON.stringify(record));
  }
 }
}
console.log('KTX_HAENGSIN_SOUTH_COUNTS '+JSON.stringify(count));
