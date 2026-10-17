#!/usr/bin/env node
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const {formatJourneyDistanceAnalogy:analogy,distanceAnalogyExampleCounts:counts}=await import(pathToFileURL(path.resolve(__dirname,'..','js/distance-analogies.js')));
 assert(counts.jp>=20&&counts.kr>=15,'Not enough comparison examples');
 for(const country of ['jp','kr'])for(const km of [0.25,1,2,5,10,15,30,40,80,100,150,220,300,420,515,860,1100]){
  const text=analogy(km,country);
  assert(text&&typeof text==='string');
  assert(!text.includes('NaN')&&!text.includes('Infinity'));
  if(km>=15)assert(text.includes('대략적 비유'),'Approximation not disclosed '+km);
  if(country==='jp'&&km===515)assert(text.includes('도쿄~오사카'));
  if(country==='kr'&&km===420)assert(text.includes('서울~부산'));
 }
 assert(analogy(0)==='비교할 거리를 계산할 수 없습니다.');
 assert(analogy(Infinity)==='비교할 거리를 계산할 수 없습니다.');
 console.log(JSON.stringify({status:'PASS',examples:counts,cases:34},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
