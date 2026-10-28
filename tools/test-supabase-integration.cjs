#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const auth=read('js/auth.js'),board=read('js/leaderboard.js'),storageCode=read('js/storage.js');
new vm.Script(auth.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,''),{filename:'auth.js'});
new vm.Script(board,{filename:'leaderboard.js'});
const sql=read('supabase/ranking.sql'),html=read('index.html'),bootstrap=read('js/bootstrap.js');
for(const marker of ['enable row level security','create policy "ranking own insert"','create policy "own cloud read"','security_invoker = true','create table if not exists public.player_public_profiles','ranking_best','on conflict (user_id) do nothing'])
  assert.ok(sql.includes(marker),'Missing Supabase SQL requirement: '+marker);
for(const id of ['auth-dialog','auth-profile-form','auth-email','auth-nickname-edit','ranking-board','ranking-country','ranking-route','ranking-scope'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing or duplicated UI ID '+id);
assert.ok(bootstrap.includes('authRedirect'),'Email-link token will be stripped by navigation');
assert.ok(auth.includes('grant_type=refresh_token'),'Expired sessions must refresh');
assert.ok(auth.includes('...\(token?{Authorization:')===false||auth.includes('apikey:this.key'),'Must use public API key');
assert.ok(!auth.includes('Authorization:\'Bearer \'+(token||this.key)'),'Publishable key is not a JWT');
// Browser-like storage test: account data must not bleed into guest/other accounts.
const map=new Map(),localStorage={
  getItem:key=>map.has(key)?map.get(key):null,
  setItem:(key,value)=>{map.set(key,String(value))},
  removeItem:key=>map.delete(key)
};
const context={console,localStorage,isCountryEnabled:()=>true,Map,Set,JSON};
vm.createContext(context);
vm.runInContext(storageCode.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+'\n;globalThis.testStorage=storage',context);
const s=context.testStorage;
const result={route:{id:'line-test',line:{ko:'테스트'},operatorId:'jr-east',countryId:'jp',lineColor:'#008843'},
  routeId:'line-test',elapsed:12000,accuracy:98.8,cpm:280,maxCombo:20,completed:4,color:'#008843'};
s.saveResult(result);assert.equal(Object.keys(s.records()).length,1);
const userA='123e4567-e89b-12d3-a456-426614174001',userB='123e4567-e89b-12d3-a456-426614174002';
s.setAccount(userA);assert.equal(Object.keys(s.records()).length,0);
s.saveResult({...result,cpm:400});assert.equal(s.records()['line-test'].bestCpm,400);
s.setAccount(userB);assert.equal(Object.keys(s.records()).length,0);
s.setAccount(userA);assert.equal(s.records()['line-test'].bestCpm,400);
s.setAccount(null);assert.equal(s.records()['line-test'].bestCpm,280);
const listeners={},boardCtx={console,localStorage,crypto:{randomUUID:()=> '123e4567-e89b-42d3-a456-426614174003'},
 document:{addEventListener:(name,fn)=>{listeners[name]=fn},getElementById:()=>null,body:{dataset:{currentScreen:'home'}}},
 setTimeout:()=>{},fetch:()=>{},TRT_SUPABASE_CONFIG:{url:'',anonKey:''}};
boardCtx.window=boardCtx;vm.createContext(boardCtx);
vm.runInContext(board,boardCtx);
const eligible={...result,routeIntegrity:true,options:{mode:'complete'},countryId:'jp'};
assert.equal(boardCtx.TRTLeaderboard.validate(eligible),true);
assert.equal(boardCtx.TRTLeaderboard.validate({...eligible,routeIntegrity:false}),false);
assert.equal(boardCtx.TRTLeaderboard.validate({...eligible,options:{researchPreview:true}}),false);
assert.equal(boardCtx.TRTLeaderboard.validate({...eligible,options:{mode:'free-drive'}}),false);
const anotherJourney={...eligible,serviceJourneyId:'journey-express',servicePatternId:'pattern-express',serviceName:'급행',directionId:'reverse',
 originStationId:'station-a',destinationStationId:'station-b'};
listeners['trt:journey-finished']({detail:anotherJourney});
const firstRun=boardCtx.TRTLeaderboard.history()[0];
assert.ok(firstRun.service_key.includes('journey:journey-express'));
assert.ok(firstRun.service_key.includes('direction:reverse'));
assert.ok(firstRun.service_name.includes('급행'));
listeners['trt:journey-finished']({detail:eligible});
assert.equal(boardCtx.TRTLeaderboard.history().length,2);
assert.equal(boardCtx.TRTLeaderboard.history()[0].synced,false);
assert.ok(sql.includes('user_id,route_id,country_id,service_key'),'SQL must rank by service, not just route');
assert.ok(html.includes('id="ranking-service"'),'Service selector must exist');
console.log(JSON.stringify({status:'PASS',accountIsolation:true,rankingEligibility:true,sqlPolicies:true,authRedirect:true}));
