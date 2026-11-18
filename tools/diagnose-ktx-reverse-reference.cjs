#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {makeGraph,sourceRoute}=require('./repair-kr-ktx-proven-graph.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const graph=makeGraph(ways);
const routes=readBatches(root).flatMap(b=>b.routes||[]);
const all=routes.flatMap(r=>(r.verifiedJourneys||[]).map(j=>({r,j})));
const names=['kr-continuity-pattern-59b7693515160112','kr-continuity-pattern-ce3c807f4962c1fb','kr-network-pattern-3404bcd3714767b5'];
const getLeg=(j,a,b)=>{
 const i=j.stations.findIndex((s,i)=>s.ko===a&&j.stations[i+1]?.ko===b);
 if(i<0)return null;
 return {start:{p:j.directedSegments[i].geometry[0],ref:j.sourceEdgeRefs[j.stations[i].geometryIndex]},
 end:{p:j.directedSegments[i].geometry.at(-1),ref:j.sourceEdgeRefs[j.stations[i+1].geometryIndex-1]},
 stations:[j.stations[i],j.stations[i+1]],geometry:j.directedSegments[i].geometry,
 proof:j.sourceEdgeRefs.slice(j.stations[i].geometryIndex,j.stations[i+1].geometryIndex)};
};
const straight=(a,b)=>distance(a,b);
const len=a=>a.reduce((s,p,i)=>i?s+distance(a[i-1],p):s,0);
const exemplar=new Map();
for(const id of names){
 const x=all.find(x=>x.j.id===id);
 if(!x)continue;
 exemplar.set(id,x.j);
 for(const p of [['동대구','대전'],['대전','동대구'],['경주','부산'],['행신','서울역']]){
  const l=getLeg(x.j,p[0],p[1]);
  if(!l)continue;
  let counts={};let sample=[];
  for(const proof of l.proof){
   const edge=graph.byWay.get(String(proof.wayId))?.get(String(proof.fromNodeId)+'|'+String(proof.toNodeId));
   if(!edge)continue;
   const way=ways.find(w=>String(w.id)===String(proof.wayId));
   let tag=way?.tags?.oneway||'?';counts[tag]=(counts[tag]||0)+1;
   if(sample.length<6&&!sample.some(x=>x.wayId===proof.wayId))sample.push({wayId:proof.wayId,tag,highspeed:way?.tags?.highspeed,
    name:way?.tags?.name,maxspeed:way?.tags?.maxspeed});
  }
  console.log('KTX_REVERSE_SOURCE '+JSON.stringify({journey:id,from:p[0],to:p[1],km:+len(l.geometry).toFixed(2),
   start:l.start,end:l.end,oneway:counts,sourceWays:sample}));
 }
}
const rev=getLeg(exemplar.get('kr-continuity-pattern-59b7693515160112'),'동대구','대전');
if(rev){
 const out=sourceRoute(graph,rev.end,rev.start,'경부고속선',160);
 console.log('KTX_REVERSE_PATH_TEST '+JSON.stringify({from:'대전',to:'동대구',source:'reverse-journey-platform-source',
  km:out.km,reason:out.reason,fast:out.fastFraction,named:out.namedFraction,
  wayIds:out.wayIds?.slice(0,8)}));
}
const candidates=(p,corridor,k=3)=>{
 const results=[];
 for(const m of graph.byWay.values())for(const e of m.values()){
  if(e.corridor!==corridor&&!(e.fast&&!e.corridor))continue;
  const x=projection(p,e.a,e.b);
  if(x.offset>.35)continue;
  results.push({p:x.point,ref:e.evidence,off:x.offset,edge:e});
 }
 results.sort((a,b)=>a.off-b.off);
 const seen=new Set();
 return results.filter(r=>{const key=r.ref.wayId+'|'+r.ref.fromNodeId+'|'+r.ref.toNodeId;if(seen.has(key))return false;seen.add(key);return true}).slice(0,k);
};
for(const [from,to,journeyId] of [
 ['대전','동대구','kr-continuity-pattern-ce3c807f4962c1fb'],
 ['경주','부산','kr-continuity-pattern-ce3c807f4962c1fb']
]){
 const j=exemplar.get(journeyId),leg=getLeg(j,from,to);
 const starts=candidates(leg.start.p,'경부고속선',3),
       ends=candidates(leg.end.p,'경부고속선',3);
 let alts=[];
 for(const a of starts)for(const b of ends){
  const trial=sourceRoute(graph,a,b,'경부고속선',180);
  alts.push({fromOffset:+a.off.toFixed(4),toOffset:+b.off.toFixed(4),km:trial.km,
   reason:trial.reason,fast:trial.fastFraction,named:trial.namedFraction,
   fromSource:a.ref.wayId,toSource:b.ref.wayId,ways:trial.wayIds?.slice(0,6)});
 }
 alts.sort((a,b)=>(a.km||1e9)-(b.km||1e9));
 console.log('KTX_FORWARD_SOURCE_CANDIDATES '+JSON.stringify({from,to,starts:starts.length,ends:ends.length,originalKm:len(leg.geometry),
  alternatives:alts.slice(0,8)}));
}
const haengsin=all.find(x=>x.j.id==='kr-network-pattern-3404bcd3714767b5');
if(haengsin){
 const leg=getLeg(haengsin.j,'행신','서울역');
 const out=sourceRoute(graph,leg.start,leg.end,'경의선',30);
 console.log('KTX_HAENGSIN_SHORTEST '+JSON.stringify({oldKm:len(leg.geometry),newKm:out.km,reason:out.reason,wayIds:out.wayIds?.slice(0,6)}));
}
