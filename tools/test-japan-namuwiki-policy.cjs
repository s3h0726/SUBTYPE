#!/usr/bin/env node
'use strict';
// Japanese name policy regression: route-specific UI/editor and published generated data agree.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const manifest=read('data/japan-namuwiki-policy-corrections-20261102.json');
const editor=read('data/editor-overrides.json');
const disney=fs.readFileSync(path.join(root,'js/disney-resort-line-data.js'),'utf8');
const ids=new Set(),files=new Map();
assert.equal(manifest.corrections.length,38,'Unexpected policy batch size');
assert(manifest.policy.includes('나무위키:편집지침'),'Missing policy attribution');
let direct=0,policyOnly=0;
for(const item of manifest.corrections){
 const {routeId,stationId,ja,beforeKo,ko,sourceUrl,verification}=item;
 assert(ja&&beforeKo&&ko&&sourceUrl,'Incomplete correction metadata');
 assert.notEqual(beforeKo,ko,'Unchanged row in correction manifest');
 const key=routeId+'::'+stationId;
 assert(!ids.has(key),'Duplicate station-route fix '+key);
 ids.add(key);
 assert.equal(editor.stations?.[routeId]?.[stationId],ko,'Runtime name override not published: '+key);
 if(verification==='policy')policyOnly++;else direct++;
 if(routeId==='jp-disney-resort-line'){
  assert.equal(stationId,'dr-02');
  assert(disney.includes("id:'dr-02'"));
  assert(disney.includes("ko:'도쿄 디즈니랜드 스테이션'"));
  continue;
 }
 const file='data/generated/routes/'+routeId+'.json';
 if(!files.has(file))files.set(file,read(file));
 const route=files.get(file).route;
 assert.equal(route.id,routeId,'Route identity drift');
 const matches=route.stations.filter(s=>s.id===stationId&&s.ja===ja);
 assert.equal(matches.length,1,'Station identity lost: '+key);
 const station=matches[0];
 assert.equal(station.ko,ko,'Generated Korean name stale: '+key);
 assert.equal(station.koSourceUrl,sourceUrl,'Source evidence lost: '+key);
 assert.equal(station.koVerified,verification!=='policy','Unverified spelling mislabeled as verified: '+key);
 assert(station.koReviewStatus==='VERIFIED'||station.koReviewStatus==='POLICY_APPLIED_ARTICLE_UNCHECKED',
  'Review status not explicit: '+key);
}
assert.equal(ids.size,38);
assert.equal(direct+policyOnly,38);
assert.equal(files.size,18);
console.log('PASS Namuwiki Japanese railway policy: '+ids.size+' station-route entries; '+files.size+' generated routes; '+direct+' page/example confirmed; '+policyOnly+' policy-only; Disney source synced');
