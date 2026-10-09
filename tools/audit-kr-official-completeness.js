#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),idx=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const errors=[],pending=[],status={};
const authoritative=new Set(['official-station-sequence-verified','official-scheduled-service-verified']);
for(const route of idx.routes||[]){
 const file=path.join(root,route.lazySource||'NO-SOURCE');
 if(!fs.existsSync(file)){errors.push(route.id+': no detail file');continue}
 let detail;try{detail=JSON.parse(fs.readFileSync(file,'utf8')).route}catch(e){errors.push(route.id+': corrupt detail');continue}
 if(!detail||detail.id!==route.id)errors.push(route.id+': identity mismatch');
 if(!Array.isArray(detail?.directions)||detail.directions.length!==2)errors.push(route.id+': directions missing');
 const first=detail?.directions?.[0]?.stops||[],back=detail?.directions?.[1]?.stops||[];
 if(first.length!==route.stationCount)errors.push(route.id+': station count mismatch');
 if(JSON.stringify(first.map(s=>s.id).reverse())!==JSON.stringify(back.map(s=>s.id)))errors.push(route.id+': opposite sequence mismatch');
 if(first.some(s=>!s.names?.ko))errors.push(route.id+': missing Hangul');
 const provenance=route.sourceStatus||detail.sourceStatus||'unlabeled';status[provenance]=(status[provenance]||0)+1;
 const source=detail.source||route.source,verified=authoritative.has(provenance)&&!!source?.url;
 if(!verified)pending.push({id:route.id,name:route.line?.ko||route.names?.ko,sourceStatus:provenance,reason:'official station sequence, current operation, operator and stop patterns not all independently verified'});
 if(!verified&&(route.geometryReady===true||detail.geometryReady===true))errors.push(route.id+': unverified but geometry ready');
 if(detail.dataKind==='trainService'&&!verified&&(route.playable!==false||route.visibility!=='internal'))errors.push(route.id+': unverified train service playable');
}
if((idx.routes||[]).length!==idx.counts?.routes)errors.push('index route total does not match');
if(new Set((idx.routes||[]).map(x=>x.id)).size!==(idx.routes||[]).length)errors.push('duplicate route identifiers');
const result={status:errors.length?'STRUCTURAL_FAIL':'STRUCTURAL_PASS',officiallyFullyVerified:idx.routes.length-pending.length,pendingOfficialVerification:pending.length,routeEntries:idx.routes.length,sourceStatusCounts:status,completenessCertified:pending.length===0&&errors.length===0,errors,pending};
const report=path.join(root,'data/kr/generated/official-verification-report.json');fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,pending:pending.slice(0,12)},null,2));
if(errors.length)process.exitCode=1;
if(process.argv.includes('--require-complete')&&pending.length)process.exitCode=2;
