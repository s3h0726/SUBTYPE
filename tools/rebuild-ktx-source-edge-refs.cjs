#!/usr/bin/env node
'use strict';
// Repair physical OSM edge proofs after KTX-only geometry realignment.
// Every proof must identify one adjacent pair of actual OSM source nodes.
// No invented geometry or timetable/stop identity changes are allowed.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches,validateRoute}=require('./lib/kr-canonical.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ways=read('data/kr/v2/source/osm-ways.json');
const index=new Map(),edges=[],cell=.025;
const key=(y,x)=>Math.floor(y/cell)+':'+Math.floor(x/cell);
for(const w of ways){
 const ids=w.nodeIds||[],points=w.coordinates||[],tags=w.tags||{};
 if(!['rail','subway','light_rail','monorail','narrow_gauge'].includes(tags.railway)||
 ['yard','spur'].includes(tags.service))continue;
 for(let k=1;k<ids.length&&k<points.length;k++){
  const a=points[k-1],b=points[k];
  if(!a||!b||!Array.isArray(a)||!Array.isArray(b))continue;
  const dy=b[0]-a[0],dx=b[1]-a[1];
  if((dx*dx+dy*dy)<1e-20)continue;
  const id=edges.length;
  const edge={a,b,wayId:String(w.id),fromNodeId:String(ids[k-1]),toNodeId:String(ids[k]),oneway:tags.oneway};
  edges.push(edge);
  const ya=Math.floor(Math.min(a[0],b[0])/cell),yb=Math.floor(Math.max(a[0],b[0])/cell);
  const xa=Math.floor(Math.min(a[1],b[1])/cell),xb=Math.floor(Math.max(a[1],b[1])/cell);
  for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){
   const grid=y+':'+x;if(!index.has(grid))index.set(grid,[]);index.get(grid).push(id);
  }
 }
}
const proofCache=new Map();
function refFor(a,b){
 const k=a.join(',')+'|'+b.join(',');
 if(proofCache.has(k))return proofCache.get(k);
 const cy=Math.floor(((a[0]+b[0])/2)/cell),cx=Math.floor(((a[1]+b[1])/2)/cell);
 let proof=null;
 const seen=new Set();
 for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){
  for(const id of index.get(y+':'+x)||[]){
   if(seen.has(id))continue;seen.add(id);
   const e=edges[id];
   const from=projection(a,e.a,e.b),to=projection(b,e.a,e.b);
   if(from.offset>=1e-7||to.offset>=1e-7)continue;
   if(e.oneway==='yes'&&to.t+1e-10<from.t)continue;
   if(e.oneway==='-1'&&to.t>from.t+1e-10)continue;
   proof={wayId:e.wayId,fromNodeId:e.fromNodeId,toNodeId:e.toNodeId};
   break;
  }
  if(proof)break;
 }
 proofCache.set(k,proof);
 return proof;
}
let checked=0,updated=0,checkedEdges=0,missing=[];
const changedBatches=[];
const batches=readBatches(root);
for(const batch of batches){
 let dirty=false;
 for(const route of batch.routes||[]){
  for(const j of route.verifiedJourneys||[]){
   if(j.ktxTrackCorrection?.method!=='source-backed-rail-graph-realignment')continue;
   checked++;
   const geometry=j.geometry||[];
   const previous=j.sourceEdgeRefs||[];
   if(previous.length===geometry.length-1)continue;
   const refs=[];
   for(let k=1;k<geometry.length;k++){
    const ref=refFor(geometry[k-1],geometry[k]);
    if(!ref){missing.push({batch:batch.name,route:route.id,journey:j.id,edge:k-1,
      from:geometry[k-1],to:geometry[k]});if(missing.length>=25)break}
    else refs.push(ref);
   }
   if(missing.length)continue;
   if(refs.length!==geometry.length-1)throw Error('PROVENANCE_COUNT_MISMATCH '+j.id);
   j.sourceEdgeRefs=refs;
   j.ktxTrackCorrection.sourceProofsRebuilt='all geometry edges proven against consecutive original OSM way nodes';
   updated++;dirty=true;checkedEdges+=refs.length;
  }
  if(dirty&&route.verifiedJourneys?.length){
   const first=route.verifiedJourneys[0];
   route.geometry=first.geometry;route.stations=first.stations;route.directedSegments=first.directedSegments;
   const errors=validateRoute(route);
   if(errors.length)throw Error('CANONICAL_VALIDATION '+route.id+': '+errors.join(';'));
  }
 }
 if(dirty)changedBatches.push(batch);
}
const summary={checkedJourneys:checked,repairedJourneys:updated,checkedEdges,missingProofCount:missing.length,
  changedBatches:changedBatches.map(b=>b.name),spatialEdges:edges.length,uniqueProofLookups:proofCache.size};
const report={checkedAt:new Date().toISOString(),summary,missing};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/kr-ktx-source-edge-proofs-20261118.json'),JSON.stringify(report,null,2)+'\n');
console.log('KTX_PROVENANCE_REPAIR '+JSON.stringify(summary));
for(const x of missing)console.error('NO_VERIFIED_OSM_EDGE '+JSON.stringify(x));
if(missing.length){process.exitCode=1}
else if(process.argv.includes('--write')){
 for(const batch of changedBatches){
  fs.writeFileSync(path.join(root,'data/kr/canonical',batch.name),JSON.stringify(batch)+'\n');
  console.log('KTX_PROOF_WRITTEN '+batch.name);
 }
}else console.log('DRY_RUN_ONLY');
