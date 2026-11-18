#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const file=process.argv[2]||'/tmp/ktx-osm-south.json';
const payload=JSON.parse(fs.readFileSync(file,'utf8'));
const ways=(payload.elements||[]).filter(x=>x.type==='way'&&x.geometry?.length>1);
const bounds={minLat:Infinity,maxLat:-Infinity,minLon:Infinity,maxLon:-Infinity};
let tagged=0,length=0,count=0;
for(const w of ways){
 const pts=w.geometry;
 const n=w.tags?.name||w.tags?.['name:ko']||'';
 if(n.includes('경부고속선'))tagged++;
 for(const p of pts){
  bounds.minLat=Math.min(bounds.minLat,p.lat);bounds.maxLat=Math.max(bounds.maxLat,p.lat);
  bounds.minLon=Math.min(bounds.minLon,p.lon);bounds.maxLon=Math.max(bounds.maxLon,p.lon);
 }
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],rad=Math.PI/180;
  const dy=(a.lat-b.lat)*rad,dx=(a.lon-b.lon)*rad;
  length+=12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dx/2)**2)));
 }
 if(w.geometry.some(p=>p.lat<35.5))count++;
}
const southern=ways.filter(w=>w.geometry.some(p=>p.lat<35.5)).slice(0,30).map(w=>({id:w.id,name:w.tags?.name,ref:w.tags?.ref,maxspeed:w.tags?.maxspeed,highspeed:w.tags?.highspeed,railway:w.tags?.railway,pts:w.geometry.length,head:w.geometry[0],tail:w.geometry.at(-1)}));
console.log('KTX_OSM_SOUTH_LIVE '+JSON.stringify({ways:ways.length,tagged,southOfUlsan:count,lengthKm:+length.toFixed(1),bounds,examples:southern}));
