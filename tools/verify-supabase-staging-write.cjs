#!/usr/bin/env node
'use strict';
// Explicitly gated staging-only INSERT → read-back → optional second-user RLS denial.
// Creates ONE clearly labeled, private test run; does not modify ranking_runs.
// Staging player_runs lacks DELETE permission, so test records remain on the staging project.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const url=(process.env.SUBTYPE_SUPABASE_URL||'').replace(/\/$/,'');
const key=process.env.SUBTYPE_SUPABASE_PUBLISHABLE_KEY;
const token=process.env.SUBTYPE_TEST_ACCESS_TOKEN,otherToken=process.env.SUBTYPE_OTHER_TEST_ACCESS_TOKEN;
const stagingRef=process.env.SUBTYPE_STAGING_PROJECT_REF;
const productionRef='xeefhvtrebcfqgfmyibb';
if(process.env.SUBTYPE_STAGING_WRITE_ACK!=='YES_STAGING_ONLY'||!key||!token||!stagingRef||
 !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||new URL(url).hostname.split('.')[0]!==stagingRef||stagingRef===productionRef){
 console.error('REFUSED: set staging URL, matching SUBTYPE_STAGING_PROJECT_REF, public key, test JWT, and SUBTYPE_STAGING_WRITE_ACK=YES_STAGING_ONLY. Production project is blocked.');
 process.exit(2);
}
const headers=jwt=>({apikey:key,Authorization:'Bearer '+jwt,Accept:'application/json'});
(async()=>{
 const me=await fetch(url+'/auth/v1/user',{headers:headers(token)});
 assert.equal(me.status,200,'signed-in staging test user required');
 const user=await me.json();assert.ok(user.id);
 const runUid=crypto.randomUUID();
 const data={run_uid:runUid,user_id:user.id,route_id:'integration-test-no-ranking',route_name:'SUBTYPE STAGING TEST ONLY',country_id:'jp',service_key:'integration-test',service_name:'test-only',game_mode:'integration_test',cpm:0,accuracy:0,elapsed_ms:0,completed:0,created_at:new Date().toISOString()};
 const endpoint=url+'/rest/v1/player_runs';
 const inserted=await fetch(endpoint,{method:'POST',headers:{...headers(token),'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(data)});
 const body=await inserted.json();
 assert.equal(inserted.status,201,'insert failed: '+JSON.stringify(body));
 assert.equal(body[0]?.run_uid,runUid,'inserted run ID mismatch');
 const read=async jwt=>{
  const res=await fetch(endpoint+'?select=run_uid,user_id,game_mode&run_uid=eq.'+encodeURIComponent(runUid),{headers:headers(jwt)});
  assert.ok(res.ok,'read failed: '+res.status);
  return res.json();
 };
 const own=await read(token);assert.equal(own.length,1);assert.equal(own[0].user_id,user.id);
 let crossUser='NOT_TESTED';
 if(otherToken){
  const guest=await fetch(url+'/auth/v1/user',{headers:headers(otherToken)});
  assert.equal(guest.status,200,'second test user JWT required');
  const other=await guest.json();assert.notEqual(other.id,user.id,'test users must differ');
  const rows=await read(otherToken);assert.deepEqual(rows,[],'second user must not read private test run');
  crossUser='PASS_DENIED';
 }
 console.log(JSON.stringify({status:'PASS_WRITE_AND_READ',runUid,project:stagingRef,crossUser,rankingWrites:0,cleanup:'NOT_PERMITTED_BY_RLS; staging-only record retained'}));
})().catch(error=>{console.error(error);process.exitCode=1});
