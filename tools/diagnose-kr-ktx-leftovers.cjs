#!/usr/bin/env node
'use strict';
// Diagnostic only: compare long KTX legs to all nearby original OSM edges.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {graphFromWays,graphRoute,project,classify}=require('./repair-kr-ktx-all-alignments.cjs');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const graph=graphFromWays(ways);
const routes=readBatches(root).flatMap(batch=>batch.routes||[]);
const targets=[['수서','평택지제'],['평택지제','수서'],['경주','부산'],['동대구','부산']];
const label=s=>[s.latitude,s.longitude];
const length=a=>a.reduce((v,p,i)=>i?v+distance(a[i-1],p):0,0);
const fmt=(p)=>p.map(x=>+x.toFixed(6));
console.log('GRAPH',JSON.stringify({nodes:graph.nodes.size,edges:graph.edges.length}));
for(const [from,to] of targets){
 let found=null;
 for(const route of routes){
  if(route.mode!=='high_speed_rail')continue;
  for(const j of route.verifiedJourneys||[]){
   const idx=j.stations.findIndex((s,i)=>s.ko===from&&j.stations[i+1]?.ko===to);
   if(idx>=0){found={j,route,i:idx};break}
  }
  if(found)break;
 }
 if(!found){console.log('NOT_FOUND',from,to);continue}
 const {j,route,i}=found,seg=j.directedSegments[i],start=label(j.stations[i]),end=label(j.stations[i+1]);
 const corridor=from==='수서'||to==='수서'?'수서평택고속선':'경부고속선';
 console.log('LEG',JSON.stringify({from,to,routeId:route.id,journeyId:j.id,oldKm:+length(seg.geometry).toFixed(2),
   siteFrom:fmt(start),siteTo:fmt(end),lineFrom:fmt(seg.geometry[0]),lineTo:fmt(seg.geometry.at(-1))}));
 for(const side of [{name:'start',p:start},{name:'end',p:end}]){
  const near=graph.snaps(side.p,400,corridor);
  console.log('STATION_SNAP',JSON.stringify({side:side.name,total:near.length,closest:near.slice(0,20).map(x=>({
   way:x.edge.wayId,km:+x.offset.toFixed(4),fast:x.edge.fast,corridor:x.edge.corridor,
   idA:x.edge.ak,idB:x.edge.bk,point:fmt(x.point)
  }))}));
 }
 const result=graphRoute(graph,seg.geometry[0],seg.geometry.at(-1),corridor,length(seg.geometry),{from:start,to:end});
 console.log('SOURCE_PATH',JSON.stringify({from,to,km:result.km,fast:result.fastShare,named:result.namedShare,reason:result.reason,
   ways:result.wayIds?.slice(0,12),points:result.geometry?.length}));
}
