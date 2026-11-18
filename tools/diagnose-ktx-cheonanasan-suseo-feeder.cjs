#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs'),{projection}=require('./lib/kr-road-binding.cjs');
const {makeGraph,sourceRoute}=require('./repair-kr-ktx-proven-graph.cjs');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8')),
 graph=makeGraph(ways);
const target='kr-continuity-pattern-2da7b27c4f071687';
const all=[...graph.byWay.values()].flatMap(x=>[...x.values()]);
for(const batch of readBatches(root))for(const route of batch.routes||[])for(const j of route.verifiedJourneys||[]){
 if(j.id!==target)continue;
 const pi=j.stations.findIndex(x=>x.ko==='평택지제'),from=j.stations[pi-1],to=j.stations[pi];
 const leg=j.directedSegments[pi-1],refs=j.sourceEdgeRefs.slice(from.geometryIndex,to.geometryIndex),
 start=leg.geometry[0],ref=refs[0],way=ways.find(w=>String(w.id)===String(ref.wayId));
 const originalEdge=way&&way.nodeIds?.indexOf(String(ref.fromNodeId)),endIndex=way&&way.nodeIds?.indexOf(String(ref.toNodeId));
 const proj=originalEdge>=0&&endIndex>=0?projection(start,way.coordinates[originalEdge],way.coordinates[endIndex]):null;
 const nearby=[];
 for(const e of all){
  if(!(e.fast||e.corridor==='경부고속선'))continue;
  const m=projection(start,e.a,e.b);
  if(m.offset>.16)continue;
  nearby.push({edge:e,point:m.point,offset:m.offset});
 }
 nearby.sort((a,b)=>a.offset-b.offset);
 const sources=nearby.slice(0,10);
 console.log('KTX_CHEONAN_PROVENANCE '+JSON.stringify({
  journey:j.id,route:route.id,stops:j.stations.map(s=>s.ko),
  index:pi,station:from.ko,sourceStart:start,sourceRef:ref,wayTags:way?.tags,
  sourceNodeCount:way?.nodeIds?.length,wayCoords:way?.coordinates?.length,
  isWayInGraph:graph.byWay.has(String(ref.wayId)),
  edgeFromIndex:originalEdge,edgeToIndex:endIndex,sourceProjectionKm:proj?.offset,
  nearbyHSR:sources.map(x=>({km:+x.offset.toFixed(4),way:x.edge.evidence,point:x.point,
   corridor:x.edge.corridor,fast:x.edge.fast}))
 }));
 const physical=[37.0158783,127.0702278];
 const ends=all.filter(e=>e.corridor==='수서평택고속선')
  .map(e=>({e,match:projection(physical,e.a,e.b)})).filter(x=>x.match.offset<.02).slice(0,5);
 const probe=[];
 for(const startCand of sources.slice(0,5))for(const endCand of ends.slice(0,3)){
  const r=sourceRoute(graph,{p:startCand.point,ref:startCand.edge.evidence},
  {p:endCand.match.point,ref:endCand.e.evidence},'경부고속선',150);
  if(r.geometry)probe.push({km:r.km,fast:r.fastFraction,named:r.namedFraction,
   from:startCand.offset,to:endCand.match.offset,source:startCand.edge.evidence,way:endCand.e.evidence});
  else probe.push({reason:r.reason,from:startCand.offset,to:endCand.match.offset});
 }
 const preceding=j.directedSegments[pi-2],before=j.stations[pi-2];
 const originalRefs=j.sourceEdgeRefs.slice(before.geometryIndex,from.geometryIndex);
 const hsrBackCandidates=[];
 for(const cand of sources.slice(0,5)){
  const routed=sourceRoute(graph,
   {p:preceding.geometry[0],ref:originalRefs[0]},
   {p:cand.point,ref:cand.edge.evidence},
   '호남고속선',200);
  if(!routed.geometry){hsrBackCandidates.push({reason:routed.reason});continue}
  hsrBackCandidates.push({km:+routed.km.toFixed(3),
   oldKm:+preceding.geometry.reduce((n,p,i)=>i?n+distance(p,preceding.geometry[i-1]):n,0).toFixed(3),
   fast:routed.fastFraction,named:routed.namedFraction,from:preceding.geometry[0],to:cand.point,
   wayIds:routed.wayIds.slice(0,5)});
 }
 console.log('KTX_CHEONAN_UPSTREAM_PROOF '+JSON.stringify(hsrBackCandidates));
 console.log('KTX_CHEONAN_HSR_ALTERNATIVE '+JSON.stringify(probe.sort((a,b)=>(a.km||1e9)-(b.km||1e9)).slice(0,20)));
}
