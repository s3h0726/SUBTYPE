#!/usr/bin/env node
'use strict';
// Read-only validation of existing records under a test user's JWT.
// Never inserts, deletes, or modifies production data.
const assert=require('node:assert/strict');
const url=process.env.SUBTYPE_SUPABASE_URL,key=process.env.SUBTYPE_SUPABASE_PUBLISHABLE_KEY;
const jwt=process.env.SUBTYPE_TEST_ACCESS_TOKEN;
if(!url||!key||!jwt){console.error('Set SUBTYPE_SUPABASE_URL, SUBTYPE_SUPABASE_PUBLISHABLE_KEY, SUBTYPE_TEST_ACCESS_TOKEN (dedicated user)');process.exit(2)}
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)){console.error('Invalid Supabase project URL');process.exit(2)}
(async()=>{
  const headers={apikey:key,Authorization:'Bearer '+jwt,Accept:'application/json'};
  const userResponse=await fetch(url.replace(/\/$/,'')+'/auth/v1/user',{headers});
  assert.equal(userResponse.status,200,'JWT must identify a valid user');
  const user=await userResponse.json();assert.ok(user.id);
  for(const table of ['player_runs','ranking_runs']){
    const endpoint=url.replace(/\/$/,'')+'/rest/v1/'+table+'?select=run_uid,user_id,route_id,service_key&user_id=eq.'+encodeURIComponent(user.id)+'&limit=5';
    const response=await fetch(endpoint,{headers});
    const data=await response.json();
    assert.ok(response.ok,table+': '+JSON.stringify(data));
    assert.ok(Array.isArray(data));
    assert.ok(data.every(row=>row.user_id===user.id),'RLS must only return the authorized user records');
    console.log(JSON.stringify({table,status:'PASS_READ',userRowsSampled:data.length,write:'DISABLED'}));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
