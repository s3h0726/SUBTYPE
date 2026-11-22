#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const {makeGraph,sourceRoute}=require('./repair-kr-ktx-proven-graph.cjs');
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const sourceWays=new Map(ways.map(w=>[String(w.id),w]));
const routes=readBatches(root).flatMap(b=>b.routes||[]);
const sampleIds=['kr-continuity-pattern-ce3c807f4962c1fb','kr-network-pattern-3404bcd3714767b5',
 'kr-network-pattern-e70f510e7564282a'];
function exact(a,b){return a&&b&&a[0]===b[0]&&a[1]===b[1]}
function routePath(j,from,to){
 const i=j.stations.findIndex((s,k)=>s.ko===from&&j.stations[k+1]?.ko===to);
 if(i<0)return null;
 const a=j.stations[i],b=j.stations[i+1];
 const refs=j.sourceEdgeRefs.slice(a.geometryIndex,b.geometryIndex);
 const geom=j.directedSegments[i].geometry;
 const err=[];
 let changes=0,sep=0,ident=0;
 for(let k=1;k<refs.length;k++){
  const p=geom[k],ar=refs[k-1],br=refs[k];
  const wayA=sourceWays.get(String(ar.wayId)),wayB=sourceWays.get(String(br.wayId));
  const aI=wayA?.nodeIds.indexOf(String(ar.fromNodeId)),aJ=wayA?.nodeIds.indexOf(String(ar.toNodeId));
  const bI=wayB?.nodeIds.indexOf(String(br.fromNodeId)),bJ=wayB?.nodeIds.indexOf(String(br.toNodeId));
  if(!wayA||!wayB||aI<0||bI<0)continue;
  const atA=exact(p,wayA.coordinates[aI])?ar.fromNodeId:exact(p,wayA.coordinates[aJ])?ar.toNodeId:null;
  const atB=exact(p,wayB.coordinates[bI])?br.fromNodeId:exact(p,wayB.coordinates[bJ])?br.toNodeId:null;
  if(ar.wayId!==br.wayId)changes++;
  if(atA!==null&&atB!==null&&String(atA)!==String(atB)){
   sep++;
   if(err.length<9)err.push({point:p,wayA:ar.wayId,wayB:br.wayId,nodeA:atA,nodeB:atB,
    tagA:wayA.tags?.name,tagB:wayB.tags?.name,serviceA:wayA.tags?.service,serviceB:wayB.tags?.service});
  }else if(atA===null||atB===null)ident++;
 }
 return {i,from,to,km:geom.reduce((s,p,k)=>k?s+distance(geom[k-1],p):s,0),
  straight:distance(geom[0],geom.at(-1)),totalRefs:refs.length,changes,
  sameCoordinateDifferentOsmNode:sep,insideSourceWayVertices:ident,disconnections:err,
  start:{ref:refs[0],p:geom[0]},end:{ref:refs.at(-1),p:geom.at(-1)}};
}
for(const id of sampleIds){
 const found=routes.flatMap(r=>(r.verifiedJourneys||[]).map(j=>({r,j}))).find(x=>x.j.id===id);
 if(!found){console.log('MISSING_JOURNEY '+id);continue}
 const j=found.j;
 for(const [a,b] of [['행신','서울역'],['대전','동대구'],['경주','부산'],['동대구','부산']]){
  const part=routePath(j,a,b);if(!part)continue;
  console.log('KTX_JUNCTION_TOPOLOGY '+JSON.stringify({journey:id,route:found.r.id,...part}));
 }
}
const base=ways.filter(w=>!['yard','spur','siding'].includes(w.tags?.service));
const expanded=ways.map(w=>!['yard','spur','siding'].includes(w.tags?.service)?w:({...w,tags:{...w.tags,service:undefined}}));
const variants=[{name:'strict',data:base},{name:'with-rail-sidings',data:expanded}];
for(const v of variants){
 const g=makeGraph(v.data);
 const found=routes.flatMap(r=>(r.verifiedJourneys||[]).map(j=>({r,j}))).find(x=>x.j.id==='kr-continuity-pattern-ce3c807f4962c1fb');
 const j=found.j;
 for(const [a,b,corridor] of [['대전','동대구','경부고속선'],['경주','부산','경부고속선']]){
  const original=routePath(j,a,b),out=sourceRoute(g,original.start,original.end,corridor,original.km);
  console.log('KTX_GRAPH_ALTERNATIVE '+JSON.stringify({graph:v.name,from:a,to:b,
   originalKm:+original.km.toFixed(3),newKm:out.km,
   fast:out.fastFraction,named:out.namedFraction,reason:out.reason,
   originalSourceDisconnectedNodes:original.sameCoordinateDifferentOsmNode,
   ways:out.wayIds?.slice(0,10),graphEdges:g.edgeCount}));
 }
}
