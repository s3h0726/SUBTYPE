'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path'),events=new Map(),values=new Map;
const context={console,crypto:require('crypto').webcrypto,URLSearchParams,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},document:{addEventListener:(k,fn)=>events.set(k,fn),getElementById:()=>null,body:{dataset:{}}}};context.window=context;
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/leaderboard.js'),'utf8'),context);
const result={options:{mode:'complete',direction:'forward'},routeIntegrity:true,completed:2,cpm:120,accuracy:100,elapsed:5000,route:{id:'uk-waterloo-city',countryId:'uk',line:{ko:'워털루 앤드 시티선'},stations:[{id:'uk-waterloo',ko:'워털루'},{id:'uk-bank',ko:'뱅크'}]},originStationId:'uk-waterloo',destinationStationId:'uk-bank',serviceJourneyId:'uk-verified-direction',serviceName:'워털루 → 뱅크'};
events.get('trt:journey-finished')({detail:result});
assert.equal(context.TRTLeaderboard.history()[0].country_id,'uk');assert(context.TRTLeaderboard.history()[0].service_key.includes('uk-verified-direction'));assert.equal(context.TRTLeaderboard.history()[0].route_id,'uk-waterloo-city');
console.log('PASS: UK leaderboard country and verified service identity; isolated guest history only.');
