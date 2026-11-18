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
  const edge={a,b,wayId:String(w.id),fromNodeId:String(ids[k-1]),toNodeId:String(ids[k]),oneway:tags.oneway,name:tags['name:ko']||tags.name||''};
  edges.push(edge);
  const ya=Math.floor(Math.min(a[0],b[0])/cell),yb=Math.floor(Math.max(a[0],b[0])/cell);
  const xa=Math.floor(Math.min(a[1],b[1])/cell),xb=Math.floor(Math.max(a[1],b[1])/cell);
  for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){
   const grid=y+':'+x;if(!index.has(grid))index.set(grid,[]);index.get(grid).push(id);
  }
 }
}
function nearbyEdges(p){
 const [y,x]=key(p[0],p[1]).split(':').map(Number);
 const list=[],seen=new Set();
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  for(const id of index.get((y+dy)+':'+(x+dx))||[]){
   if(seen.has(id))continue;seen.add(id);
   const e=edges[id],match=projection(p,e.a,e.b);
   if(match.offset>.25)continue;
   list.push({wayId:e.wayId,fromNodeId:e.fromNodeId,toNodeId:e.toNodeId,
    name:e.name,offsetKm:+match.offset.toFixed(5),point:match.point});
  }
 }
 return list.sort((a,b)=>a.offsetKm-b.offsetKm).slice(0,8);
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
const {execFileSync}=require('node:child_process');
const ORIGINAL_REF='afea304ec9aada43612aac6c7ab08095911ee905';
const originalBatches=new Map();
function originalBatch(name){
 if(originalBatches.has(name))return originalBatches.get(name);
 // The baseline commit predates the KTX geometry-only PR and retains its
 // complete source refs. Never guess missing physical track connectivity.
 const file='data/kr/canonical/'+name;
 const content=execFileSync('git',['show',ORIGINAL_REF+':'+file],
  {cwd:root,encoding:'utf8',maxBuffer:250*1024*1024});
 const value=JSON.parse(content);
 originalBatches.set(name,value);
 return value;
}
const pointEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a[0]===b[0]&&a[1]===b[1];
const identical=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function assemble(original,sections,refs){
 const stations=original.stations.map(s=>({...s})),geometry=[];
 const directedSegments=sections.map((g,i)=>({...original.directedSegments[i],geometry:g}));
 const fullRefs=[];
 for(let i=0;i<sections.length;i++){
  const pts=sections[i];
  if(!pts||pts.length<2)throw Error('EMPTY_EDGE_SECTION');
  if(i){
   if(!pointEqual(geometry.at(-1),pts[0]))throw Error('DISCONNECTED_SECTION_'+i);
   geometry.push(...pts.slice(1));
  }else{stations[0].geometryIndex=0;geometry.push(...pts)}
  stations[i+1].geometryIndex=geometry.length-1;
  fullRefs.push(...refs[i]);
 }
 if(fullRefs.length!==geometry.length-1)throw Error('EDGE_PROOF_MISMATCH '+fullRefs.length+' '+(geometry.length-1));
 return {...structuredClone(original),stations,geometry,directedSegments,sourceEdgeRefs:fullRefs};
}
let checked=0,kept=0,reverted=0,keptJourneys=0,rolledBackJourneys=0,checkedEdges=0,changedBatches=[];
const reasons={};let samples=[];
const batches=readBatches(root);
for(const batch of batches){
 let dirty=false;
 const base=originalBatch(batch.name);
 const oldRoutes=new Map(base.routes.map(r=>[r.id,r]));
 for(const route of batch.routes||[]){
  const baseRoute=oldRoutes.get(route.id);
  if(!baseRoute)continue;
  const oldJourneys=new Map((baseRoute.verifiedJourneys||[]).map(j=>[j.id,j]));
  for(let ji=0;ji<(route.verifiedJourneys||[]).length;ji++){
   const j=route.verifiedJourneys[ji];
   if(j.ktxTrackCorrection?.method!=='source-backed-rail-graph-realignment')continue;
   const old=oldJourneys.get(j.id);
   if(!old)throw Error('MISSING_PRE_REPAIR_JOURNEY '+j.id);
   if(old.stations.length!==j.stations.length||old.directedSegments.length!==j.directedSegments.length
      ||old.stations.some((s,i)=>s.id!==j.stations[i].id||s.ko!==j.stations[i].ko)){
    throw Error('STOP_IDENTITY_CHANGED '+j.id);
   }
   checked++;
   let sections=[],proofs=[],accepted=[];
   const oldSections=old.directedSegments;
   for(let i=0;i<oldSections.length;i++){
    const baseline=oldSections[i].geometry;
    const current=j.directedSegments[i].geometry;
    const oStart=old.stations[i].geometryIndex,oEnd=old.stations[i+1].geometryIndex;
    const baselineRefs=old.sourceEdgeRefs.slice(oStart,oEnd);
    if(baselineRefs.length!==baseline.length-1)throw Error('INVALID_BASELINE_PROOF '+j.id+' '+i);
    let keptPart=false,reason=null,candidateRefs=[];
    if(!identical(baseline,current)){
     if(!pointEqual(baseline[0],current[0])||!pointEqual(baseline.at(-1),current.at(-1)))
      reason='STOP_ENDPOINT_MISMATCH';
     else for(let e=1;e<current.length;e++){
      const proof=refFor(current[e-1],current[e]);
      if(!proof){reason='MISSING_OSM_SOURCE_EDGE';break}
      candidateRefs.push(proof);
     }
     if(!reason){
      keptPart=true;kept++;
      checkedEdges+=candidateRefs.length;
      accepted.push({index:i,from:j.stations[i].ko,to:j.stations[i+1].ko,
        edgeCount:candidateRefs.length});
     }else{
      reverted++;
      reasons[reason]=(reasons[reason]||0)+1;
      if(samples.length<20)samples.push({journeyId:j.id,leg:i,from:j.stations[i].ko,
       to:j.stations[i+1].ko,reason});
     }
    }
    sections.push(keptPart?current:baseline);
    proofs.push(keptPart?candidateRefs:baselineRefs);
   }
   let result=assemble(old,sections,proofs);
   if(accepted.length){
    result.ktxTrackCorrection={method:'source-backed-rail-graph-realignment',
     checkedAt:'2026-11-18',
     sourceProofsRebuilt:'all geometry edges proven against consecutive original OSM way nodes',
     legs:j.ktxTrackCorrection.legs.filter(x=>accepted.some(a=>a.index===x.index))};
    keptJourneys++;
   }else rolledBackJourneys++;
   route.verifiedJourneys[ji]=result;
   dirty=true;
  }
  if(dirty){
   const first=route.verifiedJourneys[0];
   route.geometry=first.geometry;
   route.stations=first.stations;
   route.directedSegments=first.directedSegments;
   const errors=validateRoute(route);
   if(errors.length)throw Error('ROUTE_INVALID '+route.id+' '+errors.join('; '));
  }
 }
 if(dirty)changedBatches.push(batch);
}
const summary={checkedJourneys:checked,retainedCorrectedJourneys:keptJourneys,
 revertedJourneys:rolledBackJourneys,retainedLegs:kept,revertedLegs:reverted,
 checkedNewEdges:checkedEdges,changedBatches:changedBatches.map(b=>b.name),
 fallbackReasons:reasons,uniqueSourceEdgeLookups:proofCache.size};
const report={checkedAt:new Date().toISOString(),baseline:ORIGINAL_REF,summary,samples};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/kr-ktx-source-edge-proofs-20261118.json'),JSON.stringify(report,null,2)+'\n');
console.log('KTX_PROVENANCE_REPAIR '+JSON.stringify(summary));
if(process.argv.includes('--write')){
 for(const batch of changedBatches){
  fs.writeFileSync(path.join(root,'data/kr/canonical',batch.name),JSON.stringify(batch)+'\n');
  console.log('KTX_PROOF_WRITTEN '+batch.name);
 }
}else console.log('DRY_RUN_ONLY');
