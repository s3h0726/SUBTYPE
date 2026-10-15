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
assert(Array.isArray(plan.stationRecords)&&plan.stationRecords.length===51,'missing station metadata');
const expectedCodes=[405,406,...Array.from({length:49},(_,i)=>i+408)];
for(let i=0;i<51;i++){
 const record=plan.stationRecords[i];
 assert(record.nameKo===stations[i]&&record.order===i+1,'station record order mismatch at '+i);
 assert(record.code===String(expectedCodes[i]),'station code mismatch: '+record.nameKo);
 if(['secondary-public-dataset','secondary-wikidata-derived'].includes(record.coordinateStatus)){
 assert(Number.isFinite(record.latitude)&&Number.isFinite(record.longitude),'sourced coordinates required');
 assert(record.latitude>37.2&&record.latitude<37.8&&record.longitude>126.6&&record.longitude<127.4,'invalid metro coordinate envelope');
 assert(typeof record.coordinateSource==='string'&&record.coordinateSource.startsWith('https://'),'missing coordinate source');
}else assert(record.latitude===null&&record.longitude===null&&record.coordinateStatus==='unverified','unsourced coordinates must remain null');
}
assert(plan.coordinatesCoverage?.found===51&&plan.coordinatesCoverage?.missing?.length===0,'coordinate coverage record mismatch');
assert(!stations.includes('풍양'),'unopened future station must not enter playable station list');
assert(stations[0]==='진접'&&stations.at(-1)==='오이도','wrong termini');
for(const [first,last] of [['진접','불암산'],['불암산','남태령'],['남태령','금정'],['금정','오이도']]){
 assert(stations.indexOf(first)>=0&&stations.indexOf(first)<stations.indexOf(last),'incorrect section '+first+'→'+last);
}
assert(plan.geometryReady===false&&plan.publishable===false,'premature geometry/playability approval');
assert(!index.routes.some(r=>r.id==='kr-metro-4'),'unverified line unexpectedly published');
assert(plan.completedChecks.length===0,'do not mark 9 completion gates without evidence');
console.log('Line 4 RESEARCH PASS: 51 ordered stations; unpublished until 50 track sections + services + end-to-end tests verify.');
