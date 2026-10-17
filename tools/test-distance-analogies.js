#!/usr/bin/env node
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const{formatJourneyDistanceAnalogy:fn,distanceAnalogyExampleCounts:counts}=await import(pathToFileURL(path.resolve(__dirname,'..','js/distance-analogies.js')));
assert(counts.kr>=18);for(const country of ['kr','jp'])for(const km of [0.25,1.5,10,40,80,100,160,220,290,420,860,1100]){const s=fn(km,country);assert(s.includes('한국 ')&&s.includes('대략적인 거리 비교'));assert(!/마라톤|운동장|도쿄|오사카|NaN|Infinity/.test(s));if(km===420)assert(s.includes('서울~부산'))}
assert(fn(0)==='비교할 거리를 계산할 수 없습니다.');assert(fn(Infinity)==='비교할 거리를 계산할 수 없습니다.');
console.log(JSON.stringify({status:'PASS',cases:24,comparisons:counts.kr},null,2))})().catch(e=>{console.error(e);process.exitCode=1});
