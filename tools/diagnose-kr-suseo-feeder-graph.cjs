#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {makeGraph,sourceRoute}=require('./repair-kr-ktx-proven-graph.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const physical=JSON.parse(fs.readFileSync(path.join(root,'data/kr/physical/suseo-pyeongtaek.json'),'utf8'));
const graph=makeGraph(ways);
const platform=[physical.srt.stations[2].latitude,physical.srt.stations[2].longitude];
const exact=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const terminalEdges=[...graph.byWay.values()].flatMap(x=>[...x.values()])
 .map(e=>{
   const projected=projection(platform,e.a,e.b);
   return {...e,nearestKm:projected.offset,nearPoint:projected.point};
 })
 .filter(e=>e.nearestKm<.035)
 .sort((a,b)=>(Number(b.fast)-Number(a.fast))||a.nearestKm-b.nearestKm)
 .slice(0,12);
for(const id of ['817199348','810625038','810625037','1262631295']){
 const w=ways.find(x=>String(x.id)===id);
 console.log('SUSEO_SOURCE_WAY_DIAG '+JSON.stringify({id,tags:w?.tags,points:w?.coordinates?.length,nodeIds:w?.nodeIds?.length,
 graphIndexed:graph.byWay.has(id),first:w?.coordinates?.[0],last:w?.coordinates?.at(-1)}));
}
console.log('SUSEO_PHYSICAL_PLATFORM_EDGES '+JSON.stringify(terminalEdges.map(e=>({way:e.evidence,oneway:e.oneway,fast:e.fast,corridor:e.corridor,offsetKm:e.nearestKm,actual:e.nearPoint}))));
const targetIds=new Set(['kr-continuity-pattern-2da7b27c4f071687',
 'kr-continuity-pattern-87065e1a5ed6544e','kr-continuity-pattern-29f666f34d1ea522']);
const full=readBatches(root);
for(const batch of full)for(const route of batch.routes||[])for(const j of route.verifiedJourneys||[]){
 if(!targetIds.has(j.id))continue;
 const idx=j.stations.findIndex((s,i)=>s.ko==='평택지제'&&(j.stations[i-1]?.ko==='수서'||j.stations[i+1]?.ko==='수서'));
 if(idx<0)throw Error('NO_SUSEO_KTX_JUNCTION '+j.id);
 const preceding=j.stations[idx-1]?.ko==='수서'?idx+1:idx-1;
 const aIdx=Math.min(idx,preceding),bIdx=Math.max(idx,preceding);
 const inbound=preceding<idx;
 const seg=j.directedSegments[aIdx],coords=seg.geometry,originalKm=coords.reduce((s,p,i)=>i?s+distance(coords[i-1],p):0,0);
 const oldRefs=j.sourceEdgeRefs?.slice(j.stations[aIdx].geometryIndex,j.stations[bIdx].geometryIndex)||[];
 const candidates=[];
 for(const edge of terminalEdges){
  if(!oldRefs.length)continue;
  const start=inbound?{p:coords[0],ref:oldRefs[0]}:{p:edge.nearPoint,ref:edge.evidence};
  const end=inbound?{p:edge.nearPoint,ref:edge.evidence}:{p:coords.at(-1),ref:oldRefs.at(-1)};
  const result=sourceRoute(graph,start,end,'경부고속선',originalKm);
  if(!result.geometry){candidates.push({way:edge.evidence.wayId,reason:result.reason});continue}
  candidates.push({way:edge.evidence.wayId,km:+result.km.toFixed(3),
   oldKm:+originalKm.toFixed(3),directKm:+distance(start.p,end.p).toFixed(3),
   named:+result.namedFraction.toFixed(3),fast:+result.fastFraction.toFixed(3),
   points:result.geometry.length,refCount:result.proofs.length,first:result.geometry[0],last:result.geometry.at(-1)});
 }
 console.log('SUSEO_FEEDER_GRAPH_PATH '+JSON.stringify({journey:j.id,route:route.id,
  leg:j.stations[aIdx].ko+'->'+j.stations[bIdx].ko,platform,
  storedStop:[j.stations[idx].latitude,j.stations[idx].longitude],
  candidates}));
}
