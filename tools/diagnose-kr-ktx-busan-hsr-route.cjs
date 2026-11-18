#!/usr/bin/env node
'use strict';
// Read-only: identify a continuous ORIGINAL OSM Gyeongju→Busan KTX map path.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {makeGraph,sourceRoute}=require('./repair-kr-ktx-proven-graph.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const route=readBatches(root).flatMap(b=>b.routes||[]).find(x=>x.id==='kr-rail-continuity-gyeongbu-highspeed');
const j=route.verifiedJourneys.find(x=>x.id==='kr-continuity-pattern-ce3c807f4962c1fb');
const ix=j.stations.findIndex((s,i)=>s.ko==='경주'&&j.stations[i+1]?.ko==='부산');
if(ix<0)throw Error('NO_BUSAN_KTX_LEG');
const geom=j.directedSegments[ix].geometry,from=geom[0],to=geom.at(-1);
const candidates=(graph,p,purpose,k=4)=>{
 let out=[];
 for(const index of graph.byWay.values())for(const e of index.values()){
  if(purpose==='from'&&e.corridor!=='경부고속선')continue;
  const m=projection(p,e.a,e.b);
  if(m.offset>.2)continue;
  out.push({p:m.point,ref:e.evidence,off:m.offset,edge:e});
 }
 out.sort((a,b)=>(a.edge.corridor==='경부고속선'?0:1)-(b.edge.corridor==='경부고속선'?0:1)||a.off-b.off);
 let seen=new Set();
 return out.filter(x=>{const key=x.ref.wayId+'|'+x.ref.fromNodeId+'|'+x.ref.toNodeId;if(seen.has(key))return false;seen.add(key);return true}).slice(0,k);
};
for(const variant of [
 {name:'osm-rail-directional',ways},
 {name:'map-direction-neutral',ways:ways.map(w=>({...w,tags:{...w.tags,oneway:undefined}}))},
 {name:'map-neutral-include-sidings',ways:ways.map(w=>({...w,tags:{...w.tags,oneway:undefined,service:undefined}}))}
]){
 const graph=makeGraph(variant.ways);
 const starts=candidates(graph,from,'from',4),ends=candidates(graph,to,'to',4);
 const outcomes=[];
 for(const a of starts)for(const b of ends){
  const r=sourceRoute(graph,a,b,'경부고속선',140);
  if(!r.geometry)continue;
  outcomes.push({km:+r.km.toFixed(2),highspeed:+r.fastFraction.toFixed(3),named:+r.namedFraction.toFixed(3),
   snapFromKm:+a.off.toFixed(3),snapToKm:+b.off.toFixed(3),startWay:a.ref.wayId,endWay:b.ref.wayId,
   ways:r.wayIds.slice(0,7),length:r.geometry.length});
 }
 outcomes.sort((a,b)=>a.km-b.km);
 console.log('KTX_BUSAN_HSR_CANDIDATES '+JSON.stringify({variant:variant.name,
  start:from,end:to,originalKm:112.01,
  starts:starts.length,ends:ends.length,best:outcomes.slice(0,7)}));
}
