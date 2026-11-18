#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {sourceRoute,makeGraph}=require('./repair-kr-ktx-proven-graph.cjs');
const issues=JSON.parse(fs.readFileSync(path.join(root,'reports/kr-ktx-proven-source-routing.json'),'utf8')).uniqueIssues;
const targets=issues.filter(i=>i.count>=2&&i.reason!=='VERIFIED_HSR_ROUTE'&&i.reason!=='LEGACY_MISSING_FULL_TRIP_OSM_PROOF');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const graph=makeGraph(ways);
const batches=readBatches(root);
const routes=batches.flatMap(b=>b.routes||[]);
const groups=targets.map(t=>{
 for(const route of routes)for(const j of route.verifiedJourneys||[]){
  const i=j.stations.findIndex((s,k)=>s.ko===t.from&&j.stations[k+1]?.ko===t.to);
  if(i>=0)return {...t,j,route,i};
 }
 return {...t};
}).filter(x=>x.j);
const allEdges=[...graph.byWay.values()].flatMap(x=>[...x.values()]);
function candidates(p,corridor,limit=3){
 const out=[];
 for(const e of allEdges){
  if(e.corridor!==corridor)continue;
  const m1=distance(p,e.a),m2=distance(p,e.b);
  if(m1<.9||m2<.9){
   const near=m1<m2?{p:e.a,d:m1}:{p:e.b,d:m2};
   out.push({p:near.p,km:near.d,edge:e});
  }
 }
 out.sort((a,b)=>a.km-b.km);
 const dedup=new Map();
 for(const x of out){
  const k=x.edge.ak+'|'+x.edge.bk;
  if(!dedup.has(k))dedup.set(k,x);
 }
 return [...dedup.values()].slice(0,limit);
}
for(const q of groups){
 const leg=q.j.directedSegments[q.i],start=leg.geometry[0],end=leg.geometry.at(-1);
 const starts=candidates(start,q.corridor,4),ends=candidates(end,q.corridor,4);
 const alternatives=[];
 for(const a of starts)for(const b of ends){
  const x=sourceRoute(graph,{p:a.p,ref:a.edge.evidence},{p:b.p,ref:b.edge.evidence},q.corridor,q.oldKm);
  if(!x.geometry)continue;
  alternatives.push({km:+x.km.toFixed(3),fast:x.fastFraction,named:x.namedFraction,
   startOffset:+a.km.toFixed(4),endOffset:+b.km.toFixed(4),
   start:a.p,end:b.p,wayIds:x.wayIds.slice(0,7)});
 }
 alternatives.sort((a,b)=>a.km-b.km);
 console.log('KTX_PLATFORM_NODE_CANDIDATES '+JSON.stringify({from:q.from,to:q.to,corridor:q.corridor,
   officialFrom:[q.j.stations[q.i].latitude,q.j.stations[q.i].longitude],
   officialTo:[q.j.stations[q.i+1].latitude,q.j.stations[q.i+1].longitude],
   oldKm:q.oldKm,matchedStart:starts.length,matchedEnd:ends.length,
   nearestStart:starts.slice(0,2).map(x=>({km:x.km,node:x.edge.ak,way:x.edge.evidence.wayId})),
   nearestEnd:ends.slice(0,2).map(x=>({km:x.km,node:x.edge.bk,way:x.edge.evidence.wayId})),
   best:alternatives.slice(0,3)}));
}
