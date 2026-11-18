#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches,distance}=require('./lib/kr-canonical.cjs');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const track=read('data/kr/physical/suseo-pyeongtaek.json');
const exact=p=>p[0].toFixed(7)+','+p[1].toFixed(7);
const physical=track.srt.segments.flatMap((s,i)=>s.geometry.map((p,k)=>({p,segment:i,k,wayIds:s.wayIds})));
const lookup=new Map(physical.map(x=>[exact(x.p),x]));
let found=0;
for(const batch of readBatches(root)){
 for(const route of batch.routes||[])for(const j of route.verifiedJourneys||[]){
  const i=j.stations.findIndex((s,k)=>s.ko==='평택지제'&&j.stations[k+1]?.ko==='수서');
  if(i<1)continue;
  if(!['kr-continuity-pattern-2da7b27c4f071687','kr-continuity-pattern-87065e1a5ed6544e'].includes(j.id))continue;
  found++;
  const previous=j.directedSegments[i-1].geometry,old=j.directedSegments[i].geometry;
  const shared=previous.map((p,k)=>({k,source:lookup.get(exact(p))})).filter(x=>x.source);
  let near={km:Infinity};
  for(let k=0;k<previous.length;k++)for(let l=0;l<physical.length;l++){
   const km=distance(previous[k],physical[l].p);
   if(km<near.km)near={km:+km.toFixed(6),inboundIndex:k,physicalSection:physical[l].segment,
     physicalIndex:physical[l].k,inboundPoint:previous[k],physicalPoint:physical[l].p};
  }
  let closestToJunction={km:Infinity},junction=track.srt.segments[2].geometry.at(-1);
  for(let k=0;k<previous.length;k++){
   const km=distance(previous[k],junction);
   if(km<closestToJunction.km)closestToJunction={km:+km.toFixed(6),inboundIndex:k,inboundPoint:previous[k]};
  }
  const originalRefs=j.sourceEdgeRefs?.slice(j.stations[i-1].geometryIndex,j.stations[i].geometryIndex)||[];
  const overlap=new Set(track.srt.segments.flatMap(x=>x.wayIds).map(String));
  const sharedWays=[...new Set(originalRefs.filter(x=>overlap.has(String(x.wayId))).map(x=>String(x.wayId)))];
  console.log('SUSEO_FEEDER_DIAG '+JSON.stringify({route:route.id,journey:j.id,from:j.stations[i-1].ko,
   previousPoints:previous.length,suseoPoints:old.length,
   sharedVertices:shared.length,sharedFirst:shared.slice(0,5),closest:near,
   closestToJunction,sharedWays,oldAtStop:previous.at(-1),actualSrtStop:track.srt.stations[2]}));
 }
}
if(found!==2)throw Error('Expected exactly two unlinked Suseo inbound KTX patterns; found '+found);
let outbound=0;
for(const batch of readBatches(root))for(const route of batch.routes||[])for(const j of route.verifiedJourneys||[]){
 if(j.id!=='kr-continuity-pattern-29f666f34d1ea522')continue;
 outbound++;
 const index=j.stations.findIndex((st,i)=>st.ko==='수서'&&j.stations[i+1]?.ko==='평택지제');
 if(index<0||index+1>=j.directedSegments.length)throw Error('EXPECTED_OUTBOUND_PYEONGTAEK_NEXT_LEG');
 const next=j.directedSegments[index+1].geometry;
 const shared=next.map((p,k)=>({k,source:lookup.get(exact(p))})).filter(x=>x.source);
 let near={km:Infinity};
 for(let k=0;k<next.length;k++)for(let l=0;l<physical.length;l++){
  const km=distance(next[k],physical[l].p);
  if(km<near.km)near={km:+km.toFixed(6),outboundIndex:k,physicalSection:physical[l].segment,
   physicalIndex:physical[l].k,outboundPoint:next[k],physicalPoint:physical[l].p};
 }
 const junc=track.srt.segments[2].geometry.at(-1);
 const best=next.map((p,k)=>({k,p,km:distance(p,junc)})).sort((a,b)=>a.km-b.km)[0];
 const refs=j.sourceEdgeRefs?.slice(j.stations[index+1].geometryIndex,j.stations[index+2].geometryIndex)||[];
 const overlap=new Set(track.srt.segments.flatMap(x=>x.wayIds).map(String));
 const sourceWayMatches=[...new Set(refs.filter(x=>overlap.has(String(x.wayId))).map(x=>String(x.wayId)))];
 console.log('SUSEO_OUTBOUND_FEEDER_DIAG '+JSON.stringify({
  journey:j.id,route:route.id,nextStop:j.stations[index+2].ko,
  nextPoints:next.length,sharedCount:shared.length,sharedFirst:shared.slice(0,8),
  closestPhysical:near,closestJunction:{point:best.p,index:best.k,km:+best.km.toFixed(6)},
  sourceWayMatches,legacyStopCoord:[j.stations[index+1].latitude,j.stations[index+1].longitude],
  physicalStopCoord:[track.srt.stations[2].latitude,track.srt.stations[2].longitude]
 }));
}
if(outbound!==1)throw Error('Expected one outbound feeder case, found '+outbound);

