#!/usr/bin/env node
'use strict';
/* Reference lines for GAME MAP ONLY, never train timetable or track proofs.
 * Northbound Dongdaegu→Daejeon is OSM-verified and visually identical to
 * southbound high-speed corridor within parallel-track display precision.
 * The same recorded source can NOT be used as a southbound operational way
 * without its own OSM one-way proof.
 */
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const {readBatches,validateRoute,distance}=require('./lib/kr-canonical.cjs');
const routes=readBatches(root).flatMap(b=>b.routes||[]);
const locate=id=>{
 for(const r of routes){const j=r.verifiedJourneys?.find(x=>x.id===id);if(j)return {route:r,journey:j}}
 throw Error('KTX_SOURCE_JOURNEY_NOT_FOUND '+id);
};
const take=(journey,from,to)=>{
 const i=journey.stations.findIndex((s,i)=>s.ko===from&&journey.stations[i+1]?.ko===to);
 if(i<0)throw Error('KTX_SOURCE_LEG_MISSING '+from+'/'+to);
 return journey.directedSegments[i].geometry.map(p=>[p[0],p[1]]);
};
const refs=[
 {key:'haengsinToSeoul',id:'kr-continuity-pattern-ce3c807f4962c1fb',
  from:'행신',to:'서울역',reverse:false,corridor:'경의선·경부선',
  comment:'source-verified Haengsin → Seoul railway instead of detour via Yongsan'},
 {key:'daejeonToDongdaegu',id:'kr-continuity-pattern-59b7693515160112',
  from:'동대구',to:'대전',reverse:true,corridor:'경부고속선',
  comment:'northbound actual high-speed OSM centerline, mirrored for display only; southbound OSM one-way is not claimed'}
];
const tracks={};
for(const ref of refs){
 const {route,journey}=locate(ref.id);
 const errors=validateRoute({...route,verifiedJourneys:[journey]});
 if(errors.length)throw Error('INVALID_DISPLAY_REFERENCE '+ref.id+' '+errors.join(';'));
 let geometry=take(journey,ref.from,ref.to);
 if(ref.reverse)geometry=geometry.reverse();
 const km=geometry.reduce((n,p,i)=>i?n+distance(geometry[i-1],p):n,0);
 if(!geometry.every(p=>p.length===2&&p.every(Number.isFinite))||km>180||km<10)throw Error('BAD_REFERENCE_GEOMETRY '+ref.key);
 tracks[ref.key]={displayFrom:ref.reverse?ref.to:ref.from,displayTo:ref.reverse?ref.from:ref.to,
  originalDirection:ref.from+' → '+ref.to,referenceJourneyId:ref.id,
  originalRouteId:route.id,method:'reused validated source-route track polyline, game-map visual only',
  mayUseForOperationalRouting:false,
  corridor:ref.corridor,note:ref.comment,km:+km.toFixed(3),geometry};
}
const data={schemaVersion:1,tracks,usage:'map visualization of existing railway only; original journey source refs, station stops and trip proofs retained'};
const out=path.join(root,'data/kr/physical/ktx-gyeongbu-display.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(data)+'\n');
console.log('KTX_MAP_REFERENCE_BUILT '+JSON.stringify(Object.fromEntries(Object.entries(tracks).map(([k,v])=>[k,{source:v.referenceJourneyId,km:v.km,points:v.geometry.length,from:v.displayFrom,to:v.displayTo}]))));
