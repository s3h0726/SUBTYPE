#!/usr/bin/env node
'use strict';
/*
 * Source-proofed KTX path replacement.
 *
 * Every generated point pair is a collinear segment of an adjacent
 * OSM railway node pair, and carries the original way/node reference.
 * Route endpoints are attached ONLY through the old, proven platform edge.
 * Dijkstra joins tracks solely when OSM node IDs coincide.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {distance,readBatches,validateRoute}=require('./lib/kr-canonical.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const {expectedCorridor,indexTracks,nearest,samples}=require('./audit-kr-ktx-track-alignment.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ptSame=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a[0]===b[0]&&a[1]===b[1];
const L=points=>points.reduce((km,p,i)=>i?km+distance(points[i-1],p):km,0);
const hsr=['경부고속선','호남고속선','수서평택고속선','강릉선'];
function classOf(tags={}){
 const name=[tags.name,tags['name:ko'],tags.ref].filter(Boolean).join(' ');
 const corridor=hsr.find(k=>name.includes(k))||null;
 const fast=!!corridor||tags.highspeed==='yes'||parseFloat(tags.maxspeed)>=200;
 return {corridor,fast};
}
class Heap{
 constructor(){this.a=[]}
 push(v){const a=this.a;let i=a.length;a.push(v);while(i){const j=(i-1)>>1;if(a[j][0]<=v[0])break;a[i]=a[j];i=j}a[i]=v}
 pop(){const a=this.a,v=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=2*i+1;if(j+1<a.length&&a[j+1][0]<a[j][0])j++;if(a[j][0]>=last[0])break;a[i]=a[j];i=j}a[i]=last}return v}
 get length(){return this.a.length}
}
function makeGraph(ways){
 const positions=new Map(),adj=new Map(),byWay=new Map();
 let railWayCount=0,edgeCount=0;
 for(const w of ways){
  const tags=w.tags||{};
  if(!['rail','light_rail'].includes(tags.railway)||tags.disused==='yes'||
      ['yard','spur','siding'].includes(tags.service)||['industrial','military','test'].includes(tags.usage))continue;
  const coords=w.coordinates||[],nodeIds=w.nodeIds||[],edges=new Map();
  if(coords.length!==nodeIds.length)continue;
  const classification=classOf(tags),wayId=String(w.id);
  for(let i=1;i<coords.length;i++){
   const a=coords[i-1],b=coords[i],ak=String(nodeIds[i-1]),bk=String(nodeIds[i]);
   if(!Array.isArray(a)||!Array.isArray(b)||!ak||!bk)continue;
   const km=distance(a,b);
   if(km<1e-9||km>8)continue;
   positions.set(ak,a);positions.set(bk,b);
   const evidence={wayId,fromNodeId:ak,toNodeId:bk};
   const edge={ak,bk,a,b,km,oneway:tags.oneway,evidence,...classification};
   edges.set(ak+'|'+bk,edge);
   const connect=(from,to,reverse)=>{
    if(!adj.has(from))adj.set(from,[]);
    adj.get(from).push({to,reverse,...edge});
   };
   if(tags.oneway!=='-1')connect(ak,bk,false);
   if(tags.oneway!=='yes')connect(bk,ak,true);
   edgeCount++;
  }
  if(edges.size){byWay.set(wayId,edges);railWayCount++}
 }
 return {positions,adj,byWay,edgeCount,railWayCount};
}
const weight=(edge,corridor)=>{
 if(edge.corridor===corridor)return 1;
 if(edge.fast&&!edge.corridor)return 1.15;
 if(edge.fast)return 3;
 return 9;
};
function anchor(graph,ref,point){
 const edge=graph.byWay.get(String(ref.wayId))?.get(String(ref.fromNodeId)+'|'+String(ref.toNodeId));
 if(!edge)return null;
 const match=projection(point,edge.a,edge.b);
 if(match.offset>1e-7)return null;
 // Only actual adjacent source OSM nodes, never unproven nearby tracks.
 return {...edge,point,progress:match.t};
}
function shortenPieces(pieces,maxKm=1.4){
 const geometry=[pieces[0].a],proofs=[];
 for(const piece of pieces){
  if(!ptSame(geometry.at(-1),piece.a))throw Error('UNCONNECTED_OSM_WAY_NODES');
  const steps=Math.max(1,Math.ceil(distance(piece.a,piece.b)/maxKm));
  for(let k=1;k<=steps;k++){
   const t=k/steps;
   const b=k===steps?piece.b:[
    piece.a[0]+t*(piece.b[0]-piece.a[0]),
    piece.a[1]+t*(piece.b[1]-piece.a[1])
   ];
   if(ptSame(geometry.at(-1),b))continue;
   geometry.push(b);proofs.push(piece.evidence);
  }
 }
 if(geometry.length-1!==proofs.length)throw Error('SOURCE_PROOF_LENGTH_MISMATCH');
 return {geometry,proofs};
}
function sourceRoute(graph,start,end,corridor,priorKm){
 const from=anchor(graph,start.ref,start.p),to=anchor(graph,end.ref,end.p);
 if(!from||!to)return {reason:'ENDPOINT_SOURCE_NODE_MISSING'};
 const goals=new Map(),dist=new Map(),prev=new Map(),q=new Heap();
 const origins=[];
 const startNode=(node,progress,direction)=>{
  if(direction==='forward'&&from.oneway==='-1')return;
  if(direction==='backward'&&from.oneway==='yes')return;
  const p=graph.positions.get(node),km=distance(start.p,p);
  if(!p)return;
  origins.push({node,cost:km*weight(from,corridor),km,pieces:km<1e-9?[]:[{a:start.p,b:p,evidence:from.evidence}],edge:from});
 };
 startNode(from.ak,from.progress,'backward');
 startNode(from.bk,1-from.progress,'forward');
 for(const o of origins){
  if(o.cost>=(dist.get(o.node)??Infinity))continue;
  dist.set(o.node,o.cost);prev.set(o.node,{start:o.pieces});
  q.push([o.cost,o.node]);
 }
 const finish=(node,direction)=>{
  if(direction==='forward'&&to.oneway==='-1')return;
  if(direction==='backward'&&to.oneway==='yes')return;
  const p=graph.positions.get(node),km=distance(p,end.p);
  if(!p)return;
  const last=km<1e-9?[]:[{a:p,b:end.p,evidence:to.evidence}];
  goals.set(node,{cost:km*weight(to,corridor),parts:last});
 };
 finish(to.ak,'forward');finish(to.bk,'backward');
 if(!origins.length||!goals.size)return {reason:'DIRECTIONAL_PLATFORM_EDGE_BLOCK'};
 let best=null,pops=0,reason='OSM_NODE_DISCONNECTED';
 const maxCost=Math.max(110,priorKm*16);
 while(q.length){
  const [cost,id]=q.pop();
  if(cost!==dist.get(id))continue;
  if(best&&cost>best.cost)break;
  if(cost>maxCost)break;
  const last=goals.get(id);
  if(last&&(!best||cost+last.cost<best.cost))best={node:id,cost:cost+last.cost,last:last.parts};
  for(const edge of graph.adj.get(id)||[]){
   const nextCost=cost+edge.km*weight(edge,corridor);
   if(nextCost>maxCost||nextCost>=(dist.get(edge.to)??Infinity))continue;
   dist.set(edge.to,nextCost);prev.set(edge.to,{parent:id,
    piece:{a:graph.positions.get(id),b:graph.positions.get(edge.to),evidence:edge.evidence},
    fast:edge.fast,named:edge.corridor===corridor});
   q.push([nextCost,edge.to]);
  }
  if(++pops>500000){reason='SEARCH_LIMIT';break}
 }
 if(!best)return {reason,visited:pops,from:from.evidence,to:to.evidence};
 let p=best.node,parts=[];
 while(true){
  const step=prev.get(p);
  if(!step)return {reason:'BROKEN_PARENT_CHAIN'};
  if(step.start){parts=step.start.concat(parts);break}
  parts.unshift(step.piece);p=step.parent;
 }
 parts.push(...best.last);
 if(!parts.length)return {reason:'ZERO_LENGTH_ROUTE'};
 const joined=shortenPieces(parts);
 if(!ptSame(joined.geometry[0],start.p)||!ptSame(joined.geometry.at(-1),end.p))
  throw Error('STATION_GEOMETRY_ENDPOINT_CHANGED');
 let fastKm=0,namedKm=0,total=0;
 for(const part of parts){
  const d=distance(part.a,part.b),ref=part.evidence;
  const e=graph.byWay.get(ref.wayId)?.get(ref.fromNodeId+'|'+ref.toNodeId);
  total+=d;if(e?.fast)fastKm+=d;if(e?.corridor===corridor)namedKm+=d;
 }
 return {...joined,km:L(joined.geometry),fastFraction:fastKm/total,namedFraction:namedKm/total,visited:pops,wayIds:[...new Set(joined.proofs.map(p=>p.wayId))]};
}
function coverage(points,corridor,tracks){
 const ss=samples(points,1.5).slice(1,-1);
 if(!ss.length)return {value:0,density:0,named:0};
 let ok=0,known=0,named=0;
 for(const p of ss){
  const n=nearest(p,corridor,tracks);
  if(n.distanceKm!==null){known++;if(n.distanceKm<=.3)ok++}
  if(n.namedDistanceKm!==null&&n.namedDistanceKm<=.5)named++;
 }
 return {value:ok/ss.length,density:known/ss.length,named:named/ss.length};
}
function judge(oldGeom,candidate,corridor,tracks){
 const before=coverage(oldGeom,corridor,tracks),oldKm=L(oldGeom),direct=distance(oldGeom[0],oldGeom.at(-1));
 if(!candidate.geometry)return {accept:false,reason:candidate.reason,oldKm:+oldKm.toFixed(2)};
 const after=coverage(candidate.geometry,corridor,tracks);
 const lower=candidate.km<=oldKm-Math.max(2,oldKm*.04);
 const aligns=after.value>before.value+.17&&after.value>=.78&&candidate.km<=oldKm*1.025;
 const physical=candidate.km>direct*.99&&candidate.km<oldKm*1.03
  &&candidate.fastFraction>=.81&&after.value>=.78
  &&candidate.geometry.every((p,i)=>!i||distance(candidate.geometry[i-1],p)<=1.5);
 const accept=physical&&(lower||aligns);
 return {accept,reason:accept?'VERIFIED_HSR_ROUTE':!physical?'NO_PHYSICAL_HIGH_SPEED_PROOF':'NO_MEANINGFUL_IMPROVEMENT',
  oldKm:+oldKm.toFixed(2),newKm:+candidate.km.toFixed(2),directKm:+direct.toFixed(2),
  oldCoverage:+before.value.toFixed(3),newCoverage:+after.value.toFixed(3),
  namedShare:+candidate.namedFraction.toFixed(3),fastShare:+candidate.fastFraction.toFixed(3)};
}
function proveCandidate(candidate,graph){
 if(candidate.proofs.length!==candidate.geometry.length-1)return false;
 for(let i=0;i<candidate.proofs.length;i++){
  const ref=candidate.proofs[i],edge=graph.byWay.get(ref.wayId)?.get(ref.fromNodeId+'|'+ref.toNodeId);
  if(!edge)return false;
  const from=projection(candidate.geometry[i],edge.a,edge.b),to=projection(candidate.geometry[i+1],edge.a,edge.b);
  if(from.offset>=1e-7||to.offset>=1e-7)return false;
  if(edge.oneway==='yes'&&to.t+1e-10<from.t)return false;
  if(edge.oneway==='-1'&&to.t>from.t+1e-10)return false;
 }
 return true;
}
function rebuild(j,segments,refs){
 const stops=j.stations.map(s=>({...s}));
 const geom=[],allRefs=[],directedSegments=[];
 for(let i=0;i<segments.length;i++){
  const pts=segments[i],proofs=refs[i];
  if(pts.length<2||proofs.length!==pts.length-1)throw Error('MISMATCHED_SEGMENT_PROOFS '+i);
  if(i){
   if(!ptSame(geom.at(-1),pts[0]))throw Error('NON_CONNECTED_STATION_'+i);
   geom.push(...pts.slice(1));
  }else{stops[0].geometryIndex=0;geom.push(...pts)}
  stops[i+1].geometryIndex=geom.length-1;
  allRefs.push(...proofs);
  directedSegments.push({...j.directedSegments[i],geometry:pts});
 }
 return {...j,stations:stops,geometry:geom,directedSegments,sourceEdgeRefs:allRefs};
}
function isKtx(route,j){
 const name=[route.line?.ko,j.patternName?.ko,j.service?.nameKo].join(' ');
 return route.countryId==='kr'&&route.mode==='high_speed_rail'&&!/SRT|에스알티/.test(name)&&/KTX|케이티엑스|고속철도|고속선/.test(name);
}
function run(){
 const ways=read('data/kr/v2/source/osm-ways.json'),graph=makeGraph(ways),tracks=indexTracks(ways);
 const batches=readBatches(root),cache=new Map(),events=[],changedBatches=[];
 let checkedJourneys=0,checkedLegs=0,corrected=0,correctedJourneys=0;
 for(const batch of batches){
  let batchChanged=false;
  for(const route of batch.routes||[]){
   let routeChanged=false;
   for(let ji=0;ji<(route.verifiedJourneys||[]).length;ji++){
    const j=route.verifiedJourneys[ji];if(!isKtx(route,j))continue;checkedJourneys++;
    const names=j.stations.map(x=>x.ko);
    const geomParts=j.directedSegments.map(x=>x.geometry),refs=[];
    for(let i=0;i<geomParts.length;i++){
     const a=j.stations[i].geometryIndex,b=j.stations[i+1].geometryIndex;
     refs.push(j.sourceEdgeRefs?.slice(a,b)||[]);
    }
    let diffs=[];
    for(let i=0;i<geomParts.length;i++){
     const corridor=expectedCorridor(names[i],names[i+1],names);
     if(!corridor)continue;checkedLegs++;
     const old=geomParts[i],oldRefs=refs[i];
     if(oldRefs.length!==old.length-1||!oldRefs.length)throw Error('UNPROVEN_BASELINE '+j.id+' '+i);
     const oldCoverage=coverage(old,corridor,tracks),oldKm=L(old),direct=distance(old[0],old.at(-1));
     const suspicious=oldCoverage.value<.73||oldKm>direct*1.6;
     if(!suspicious)continue;
     const start={p:old[0],ref:oldRefs[0]},end={p:old.at(-1),ref:oldRefs.at(-1)};
     const key=JSON.stringify([corridor,start,end]);
     if(!cache.has(key)){
      const alternative=sourceRoute(graph,start,end,corridor,oldKm);
      const decision=judge(old,alternative,corridor,tracks);
      cache.set(key,{alternative,decision});
     }
     const {alternative,decision}=cache.get(key);
     events.push({routeId:route.id,journeyId:j.id,from:names[i],to:names[i+1],corridor,...decision});
     if(!decision.accept)continue;
     if(!proveCandidate(alternative,graph))throw Error('OSM_WAY_PROOF_ERROR '+j.id+' '+i);
     geomParts[i]=alternative.geometry;refs[i]=alternative.proofs;
     diffs.push({index:i,from:names[i],to:names[i+1],oldKm:decision.oldKm,
      newKm:decision.newKm,oldCoverage:decision.oldCoverage,newCoverage:decision.newCoverage,
      wayIds:alternative.wayIds});
    }
    if(!diffs.length)continue;
    const fixed=rebuild(j,geomParts,refs);
    fixed.ktxTrackCorrection={method:'source-backed-rail-graph-realignment',
     checkedAt:'2026-11-18',sourceProofsRebuilt:'all geometry edges proven against consecutive original OSM way nodes',
     legs:diffs};
    const errors=validateRoute({...route,verifiedJourneys:[fixed],stations:fixed.stations,
      geometry:fixed.geometry,directedSegments:fixed.directedSegments});
    if(errors.length)throw Error('CANDIDATE_CANONICAL_FAIL '+j.id+' '+errors.join(';'));
    route.verifiedJourneys[ji]=fixed;
    corrected+=diffs.length;correctedJourneys++;routeChanged=batchChanged=true;
   }
   if(routeChanged){
    const first=route.verifiedJourneys[0];
    route.geometry=first.geometry;route.stations=first.stations;route.directedSegments=first.directedSegments;
    const errors=validateRoute(route);
    if(errors.length)throw Error('FINAL_CANONICAL_FAIL '+route.id+' '+errors.join(';'));
   }
  }
  if(batchChanged)changedBatches.push(batch);
 }
 const uniqueIssues=Object.values(events.reduce((m,x)=>{
  const key=x.corridor+'|'+x.from+'|'+x.to+'|'+x.reason;
  if(!m[key])m[key]={corridor:x.corridor,from:x.from,to:x.to,reason:x.reason,
   count:0,oldKm:x.oldKm,newKm:x.newKm,oldCoverage:x.oldCoverage,newCoverage:x.newCoverage};
  m[key].count++;return m;
 },{})).sort((a,b)=>b.count-a.count);
 const summary={checkedJourneys,checkedLegs,uniqueGraphQueries:cache.size,correctedJourneys,correctedLegs:corrected,
  changedBatches:changedBatches.map(b=>b.name),graphEdges:graph.edgeCount,
  statusCounts:events.reduce((m,x)=>(m[x.reason]=(m[x.reason]||0)+1,m),{})};
 const report={method:'source-node-directed OSM Dijkstra with source-edge references for every segment',
   checkedAt:new Date().toISOString(),summary,uniqueIssues};
 fs.mkdirSync(path.join(root,'reports'),{recursive:true});
 fs.writeFileSync(path.join(root,'reports/kr-ktx-proven-source-routing.json'),JSON.stringify(report,null,2)+'\n');
 console.log('KTX_PROVEN_ROUTE_SUMMARY '+JSON.stringify(summary));
 console.log('KTX_PROVEN_ROUTE_ISSUES '+JSON.stringify(uniqueIssues));
 if(process.argv.includes('--write')){
  for(const batch of changedBatches){
   fs.writeFileSync(path.join(root,'data/kr/canonical',batch.name),JSON.stringify(batch)+'\n');
   console.log('KTX_PROVEN_WRITTEN '+batch.name);
  }
 }else console.log('DRY_RUN_ONLY');
}
if(require.main===module)run();
module.exports={makeGraph,sourceRoute,proveCandidate,rebuild,judge,anchor};
