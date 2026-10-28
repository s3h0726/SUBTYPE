#!/usr/bin/env node
'use strict';
// Read-only Supabase API smoke check with the public publishable key.
// Never print the project URL or any key.
const fs=require('node:fs'),path=require('node:path');
const config=fs.readFileSync(path.resolve(__dirname,'../js/auth-config.js'),'utf8');
const match=config.match(/window\.TRT_SUPABASE_CONFIG\s*=\s*\{\s*url\s*:\s*'([^']+)'\s*,\s*anonKey\s*:\s*'([^']+)'\s*\}/s);
if(!match||!/^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(match[1].trim())||match[2].trim().length<20){
  console.error('FAIL: SUBTYPE Supabase public configuration missing or invalid');process.exitCode=1;
}else{
  const base=match[1].trim().replace(/\/$/,''),apikey=match[2].trim();
  const get=async(route)=>{
    const response=await fetch(base+'/rest/v1/'+route+'?select=*&limit=0',{
      headers:{apikey},signal:AbortSignal.timeout(12000)});
    let data;try{data=await response.json()}catch{data=null}
    return {status:response.status,code:data?.code||null};
  };
  (async()=>{
    const publicBoard=await get('ranking_best');
    if(publicBoard.status!==200){
      console.error('FAIL: ranking_best public read is not available. HTTP '+publicBoard.status+
        (publicBoard.code?' ('+publicBoard.code+')':''));
      process.exitCode=1;return;
    }
    console.log('PASS: ranking_best anonymous read and public API key');
    const privateRuns=await get('player_runs');
    if(privateRuns.status===404||privateRuns.code==='PGRST205'||privateRuns.code==='42P01'){
      console.error('FAIL: player_runs table is missing from the Data API. Apply the latest supabase/ranking.sql to Supabase SQL Editor.');
      process.exitCode=1;return;
    }
    if([401,403].includes(privateRuns.status)&&privateRuns.code==='42501'){
      console.log('PASS: player_runs table exists; anonymous read denied (private records protected)');
      return;
    }
    if(privateRuns.status===200){
      console.error('FAIL: player_runs is anonymously readable; expected private RLS/grants');
      process.exitCode=1;return;
    }
    console.error('INCONCLUSIVE: player_runs HTTP '+privateRuns.status+
      (privateRuns.code?' ('+privateRuns.code+')':'')+'; inspect Supabase permissions and API settings');
    process.exitCode=1;
  })().catch(error=>{console.error('INCONCLUSIVE: Supabase API check could not complete ('+
    String(error.name||'network error')+').');process.exitCode=1});
}
