#!/usr/bin/env node
'use strict';
// Compare published-canonical KTX paths with the actual runtime Suseo overlay.
// Read-only: no generated artifacts are edited by this test.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches}=require('./lib/kr-canonical.cjs');
const source=fs.readFileSync(path.join(root,'js/korea-suseo-pyeongtaek.js'),'utf8').replace(/\bexport\s+/g,'');
const ctx={};
vm.runInNewContext(source+'\nglobalThis.KTX_SUSEO_FIX={verifySuseoTrack,applySuseoTrack};',ctx,{timeout:5000});
const track=JSON.parse(fs.readFileSync(path.join(root,'data/kr/physical/suseo-pyeongtaek.json'),'utf8'));
ctx.KTX_SUSEO_FIX.verifySuseoTrack(track);
const routes=readBatches(root).flatMap(b=>b.routes||[]);
let eligible=0,patched=0,unchanged=0;
const detail=[];
for(const route of routes){
 if(route.countryId!=='kr'||route.mode!=='high_speed_rail')continue;
 const applicable=(route.verifiedJourneys||[]).filter(j=>(j.stations||[]).some((s,i)=>{
  const a=s.ko,b=j.stations[i+1]?.ko;
  return a==='수서'&&b==='평택지제'||a==='평택지제'&&b==='수서';
 }));
 if(!applicable.length)continue;
 const result=ctx.KTX_SUSEO_FIX.applySuseoTrack(route,track);
 for(const j of applicable){
  const index=j.stations.findIndex((s,i)=>{
   const a=s.ko,b=j.stations[i+1]?.ko;
   return a==='수서'&&b==='평택지제'||a==='평택지제'&&b==='수서';
  });
  const fixed=result.verifiedJourneys.find(x=>x.id===j.id);
  const section=fixed?.directedSegments[index];
  const ok=section?.trackCorridorId===track.id;
  eligible++;
  if(ok)patched++;else unchanged++;
  detail.push({routeId:route.id,journeyId:j.id,direction:j.stations[index].ko+' → '+j.stations[index+1].ko,
   patched:ok,oldNodes:j.directedSegments[index].geometry.length,newNodes:section?.geometry.length||0,
   stationFrom:[j.stations[index].latitude,j.stations[index].longitude],
   stationTo:[j.stations[index+1].latitude,j.stations[index+1].longitude],
   adjacentBefore:j.directedSegments[index-1]?{
     stop:j.stations[index-1]?.ko,
     end:j.directedSegments[index-1].geometry.at(-1),
     physicalEnd:track.srt.segments[1].geometry.at(-1),
     includesJunction:j.directedSegments[index-1].geometry.some(p=>p[0]===track.srt.segments[2].geometry.at(-1)[0]&&p[1]===track.srt.segments[2].geometry.at(-1)[1]),
     nearestPhysicalJije:(()=>{
       const target=track.srt.segments[1].geometry.at(-1),pts=j.directedSegments[index-1].geometry;
       let best={km:Infinity,index:-1,point:null};
       for(let k=0;k<pts.length;k++){
        const p=pts[k],dx=(p[1]-target[1])*88.85,dy=(p[0]-target[0])*111.195,km=Math.hypot(dx,dy);
        if(km<best.km)best={km:+km.toFixed(4),index:k,point:p};
       }
       return best;
     })()
   }:null});
 }
}
console.log('KTX_SUSEO_RUNTIME '+JSON.stringify({eligible,patched,unchanged,detail}));
if(eligible===0)throw Error('NO_ELIGIBLE_SUSEO_KTX_FOUND');
