#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const ids=['kr-metro-19','kr-metro-22'];
const distance=(a,b)=>Math.hypot((a[0]-b[0])*111000,(a[1]-b[1])*88000);
for(const id of ids){
 const file=path.join(root,'data/kr/generated/routes',id+'.json');
 const r=JSON.parse(fs.readFileSync(file,'utf8')).route;
 if(!r.geometryReady||r.geometryStatus!=='osm-segment-validated')throw Error(id+': not validated');
 const segments=r.directions?.[0]?.directedSegments||[];
 if(segments.length!==r.stations.length-1)throw Error(id+': wrong segment count');
 for(let i=0;i<segments.length;i++){
  const segment=segments[i],g=segment.geometry;
  if(segment.fromStationId!==r.stations[i].id||segment.toStationId!==r.stations[i+1].id)throw Error(id+': station pairing mismatch '+i);
  if(!Array.isArray(g)||g.length<2)throw Error(id+': missing OSM way '+i);
  for(let k=1;k<g.length;k++)if(distance(g[k],g[k-1])>1800)throw Error(id+': disconnected geometry '+i);
 }
 const reverse=r.directions[1].directedSegments;
 if(reverse.length!==segments.length||reverse[0].fromStationId!==segments.at(-1).toStationId)throw Error(id+': wrong reverse way');
 console.log(id+': '+segments.length+' OSM way segments validated');
}
