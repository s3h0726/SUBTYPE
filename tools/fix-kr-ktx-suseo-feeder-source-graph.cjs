#!/usr/bin/env node
'use strict';
// Restore two actual KTX feeder-to-Suseo physical rail connections with exact
// original OSM-way proofs. Never join two 40m-separated rails by proximity.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,distance,validateRoute}=require('./lib/kr-canonical.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const {makeGraph,sourceRoute,proveCandidate,rebuild}=require('./repair-kr-ktx-proven-graph.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const wayData=read('data/kr/v2/source/osm-ways.json'),graph=makeGraph(wayData),
 physical=read('data/kr/physical/suseo-pyeongtaek.json');
const suseo=[physical.srt.stations[0].latitude,physical.srt.stations[0].longitude],
 platform=[physical.srt.stations[2].latitude,physical.srt.stations[2].longitude];
const canonical=readBatches(root);
const target=new Map([
 ['kr-continuity-pattern-87065e1a5ed6544e','inbound'],
 ['kr-continuity-pattern-29f666f34d1ea522','outbound']
]);
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a[0]===b[0]&&a[1]===b[1];
const len=points=>points.reduce((km,p,i)=>i?km+distance(points[i-1],p):km,0);
const sourceStart=[...graph.byWay.get('1262631295').values()].find(e=>same(e.a,suseo)||same(e.b,suseo));
if(!sourceStart)throw Error('REAL_SUSEO_OSM_START_NODE_MISSING');
const near= [];
for(const m of graph.byWay.values())for(const e of m.values()){
 if(e.corridor!=='수서평택고속선')continue;
 const proj=projection(platform,e.a,e.b);
 if(proj.offset<=.035)near.push({e,p:proj.point,offset:proj.offset});
}
near.sort((a,b)=>a.offset-b.offset);
const terminal=near.slice(0,8);
if(!terminal.length)throw Error('REAL_PYEONGTAEK_OSM_PLATFORM_TRACK_MISSING');
const changed=[],events=[];
for(const batch of canonical){
 let modified=false;
 for(const route of batch.routes||[]){
  let routeDirty=false;
  for(let ji=0;ji<(route.verifiedJourneys||[]).length;ji++){
   const j=route.verifiedJourneys[ji],direction=target.get(j.id);
   if(!direction)continue;
   const pi=j.stations.findIndex(x=>x.ko==='평택지제'),si=j.stations.findIndex(x=>x.ko==='수서');
   if(pi<0||si<0||Math.abs(pi-si)!==1)throw Error('NONCONSECUTIVE_SUSEO_PLATFORM '+j.id);
   const oldSections=j.directedSegments.map(s=>s.geometry),
    oldRefs=j.directedSegments.map((s,i)=>j.sourceEdgeRefs.slice(j.stations[i].geometryIndex,j.stations[i+1].geometryIndex));
   if(oldRefs.some((r,i)=>r.length!==oldSections[i].length-1))throw Error('BASELINE_SOURCE_PROOF_MISSING '+j.id);
   const hsrLeg=Math.min(pi,si),feederLeg=direction==='inbound'?pi-1:pi;
   if(feederLeg<0||feederLeg>=oldSections.length)throw Error('NO_FEEDER_LEG '+j.id);
   let best=null;
   for(const {e,p,offset} of terminal){
    const stop={p,ref:e.evidence},realSuseo={p:suseo,ref:sourceStart.evidence};
    const hsr=direction==='inbound'
     ?sourceRoute(graph,stop,realSuseo,'수서평택고속선',len(oldSections[hsrLeg]))
     :sourceRoute(graph,realSuseo,stop,'수서평택고속선',len(oldSections[hsrLeg]));
    const orig=oldSections[feederLeg],proofs=oldRefs[feederLeg];
    const feeder=direction==='inbound'
     ?sourceRoute(graph,{p:orig[0],ref:proofs[0]},stop,'경부고속선',len(orig))
     :sourceRoute(graph,stop,{p:orig.at(-1),ref:proofs.at(-1)},'경부고속선',len(orig));
    if(!hsr.geometry||!feeder.geometry||!proveCandidate(hsr,graph)||!proveCandidate(feeder,graph))continue;
    const feederOldKm=len(orig);
    if(feeder.km>feederOldKm-2||feeder.fastFraction<.9||
       hsr.km<48||hsr.km>60||hsr.fastFraction<.99)continue;
    const combinedKm=hsr.km+feeder.km;
    if(!best||combinedKm<best.totalKm)best={p,e,offset,hsr,feeder,totalKm:combinedKm,feederOldKm};
   }
   if(!best)throw Error('NO_SOURCE_CONNECTED_PYEONGTAEK_FEEDER '+j.id);
   const sections=[...oldSections],refs=[...oldRefs];
   sections[hsrLeg]=best.hsr.geometry;refs[hsrLeg]=best.hsr.proofs;
   sections[feederLeg]=best.feeder.geometry;refs[feederLeg]=best.feeder.proofs;
   // The two source-proven paths meet at the identical projected OSM rail
   // point at the passenger stop. No virtual 6m platform chord is drawn.
   if(!same(sections[hsrLeg][direction==='inbound'?0:sections[hsrLeg].length-1],best.p))
    throw Error('OSM_HSR_PLATFORM_JOIN_FAIL');
   const fixed=rebuild(j,sections,refs);
   fixed.stations[pi]={...fixed.stations[pi],latitude:best.p[0],longitude:best.p[1]};
   fixed.stations[si]={...fixed.stations[si],latitude:suseo[0],longitude:suseo[1]};
   const legs=[hsrLeg,feederLeg].map(i=>({
    index:i,from:j.stations[i].ko,to:j.stations[i+1].ko,
    oldKm:+len(oldSections[i]).toFixed(3),newKm:+len(sections[i]).toFixed(3),
    wayIds:[...new Set(refs[i].map(x=>x.wayId))]}));
   fixed.ktxTrackCorrection={method:'source-backed-rail-graph-realignment',
    checkedAt:'2026-11-18',
    sourceProofsRebuilt:'all geometry edges proven against consecutive original OSM way nodes',
    platformAnchors:[
     {id:j.stations[pi].id,ko:'평택지제',coordinate:best.p,sourceWayId:best.e.evidence.wayId,offsetKm:best.offset},
     {id:j.stations[si].id,ko:'수서',coordinate:suseo,sourceWayId:sourceStart.evidence.wayId,offsetKm:0}
    ],legs};
   const errors=validateRoute({...route,verifiedJourneys:[fixed],stations:fixed.stations,geometry:fixed.geometry,
    directedSegments:fixed.directedSegments});
   if(errors.length)throw Error('INVALID_PHYSICAL_FEEDER_JOURNEY '+j.id+' '+errors.join(';'));
   route.verifiedJourneys[ji]=fixed;modified=routeDirty=true;
   events.push({route:route.id,journeyId:j.id,direction,platformOffsetKm:best.offset,legs,
    newTotalKm:+best.totalKm.toFixed(3),sourceEdges:fixed.sourceEdgeRefs.length});
  }
  if(routeDirty){
   const first=route.verifiedJourneys[0];
   route.geometry=first.geometry;route.stations=first.stations;route.directedSegments=first.directedSegments;
   const errors=validateRoute(route);
   if(errors.length)throw Error('INVALID_PHYSICAL_FEEDER_ROUTE '+route.id+' '+errors.join(';'));
  }
 }
 if(modified)changed.push(batch);
}
if(events.length!==2)throw Error('NOT_ALL_FEEDER_CASES_CORRECTED '+events.length);
const result={source:'OpenStreetMap original directed node chain, 0m invented links',summary:{verifiedJourneys:events.length,
 changedBatches:changed.map(x=>x.name)},events};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/kr-ktx-suseo-feeder-real-track.json'),JSON.stringify(result,null,2)+'\n');
console.log('KTX_SUSEO_FEEDER_FIXED '+JSON.stringify(result));
if(process.argv.includes('--write')){
 for(const batch of changed){
  fs.writeFileSync(path.join(root,'data/kr/canonical',batch.name),JSON.stringify(batch)+'\n');
  console.log('KTX_SUSEO_FEEDER_WRITTEN '+batch.name);
 }
}else console.log('DRY_RUN_ONLY');
