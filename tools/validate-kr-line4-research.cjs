#!/usr/bin/env node
'use strict';
// Research-data integrity gate. This is NOT a full route or track verification.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(root,'data/kr/research/kr-metro-4-plan.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const assert=(v,msg)=>{if(!v)throw Error('Line 4 research: '+msg)};
const stations=plan.stationOrder;
assert(plan.routeId==='kr-metro-4','wrong id');
assert(Array.isArray(stations)&&stations.length===51,'51 station order required');
assert(new Set(stations).size===51,'duplicate station name');
assert(stations[0]==='진접'&&stations.at(-1)==='오이도','wrong termini');
for(const [first,last] of [['진접','불암산'],['불암산','남태령'],['남태령','금정'],['금정','오이도']]){
 assert(stations.indexOf(first)>=0&&stations.indexOf(first)<stations.indexOf(last),'incorrect section '+first+'→'+last);
}
assert(plan.geometryReady===false&&plan.publishable===false,'premature geometry/playability approval');
assert(!index.routes.some(r=>r.id==='kr-metro-4'),'unverified line unexpectedly published');
assert(plan.completedChecks.length===0,'do not mark 9 completion gates without evidence');
console.log('Line 4 RESEARCH PASS: 51 ordered stations; unpublished until 50 track sections + services + end-to-end tests verify.');
