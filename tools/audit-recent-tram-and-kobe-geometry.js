#!/usr/bin/env node
// Source vs deployed route integrity audit. No invented coordinate geometry.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const ids=['line-99719',...Array.from({length:6},(_,i)=>'line-toyama-city-'+(i+1)),'line-hankyu-kobe-kosoku'];
let failures=0;
for(const id of ids){
 const route=JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes',id+'.json'),'utf8')).route;
 const stations=route.stations||[],segments=route.directedSegments||[];
 let missing=[],bad=[];
 for(let i=0;i<stations.length-1;i++){
   const a=stations[i],b=stations[i+1],s=segments.find(v=>v.fromStationId===a.id&&v.toStationId===b.id);
   if(!s||!Array.isArray(s.geometry)||s.geometry.length<2||s.verified!==true){missing.push(a.id+'::'+b.id);continue;}
   if(s.geometry.some(pt=>!Array.isArray(pt)||pt.length<2||!pt.every(Number.isFinite)))bad.push(a.id+'::'+b.id);
 }
 const completelyVerified=!missing.length&&!bad.length&&segments.length===stations.length-1;
 if(route.geometryReady===true&&!completelyVerified){console.error('FALSE READY:',id,{missing,bad});failures++}
 if(id==='line-hankyu-kobe-kosoku'&&completelyVerified){console.log('Kobe track verified; manual geometry provenance review still required')}
 console.log(JSON.stringify({id,stations:stations.length,segments:segments.length,geometryReady:route.geometryReady,complete:completelyVerified,missing,bad}));
}
if(failures)process.exit(1);
