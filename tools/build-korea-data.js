#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{load,compile}=require('./lib/kr-network');
const base=path.resolve(__dirname,'../data/kr/v2'),result=compile(load(base),{base});
if(result.errors.length){console.error(JSON.stringify(result.errors,null,2));process.exit(1)}
const target=path.join(base,'generated');fs.mkdirSync(target,{recursive:true});
const write=(name,value)=>{const file=path.join(target,name);fs.writeFileSync(file+'.tmp',JSON.stringify(value,null,2)+'\n');fs.renameSync(file+'.tmp',file)};
write('audit.json',{...result,routes:result.routes.map(r=>r.id)});
// Candidate output is isolated from both deployed indexes. A release may only
// replace the live catalog after national coverage and provenance pass.
write('routes.json',{schemaVersion:2,country:{id:'kr',name:'대한민국'},routes:result.routes});
console.log(JSON.stringify({status:result.status,...result.counts,blockedServices:result.blocked.length},null,2));
const publish=process.argv.includes('--publish');
if((publish||process.argv.includes('--require-complete'))&&result.status!=='COMPLETE'){console.error('KR_RELEASE_BLOCKED: nationwide evidence, source geometry and trips are incomplete. Live catalog unchanged.');process.exitCode=1}
else if(publish){
 const data=load(base),krRoot=path.resolve(base,'..'),generated=path.join(krRoot,'generated'),routeDir=path.join(generated,'routes');fs.mkdirSync(routeDir,{recursive:true});
 const atomic=(file,value)=>{fs.writeFileSync(file+'.tmp',value);fs.renameSync(file+'.tmp',file)};
 const wanted=new Set(result.routes.map(r=>r.id+'.json'));
 for(const route of result.routes)atomic(path.join(routeDir,route.id+'.json'),JSON.stringify({route})+'\n');
 const index={schemaVersion:2,country:{id:'kr',name:'대한민국'},operators:data.operators.filter(o=>o.verification==='verified'),routes:result.routes.map(r=>({...r,stations:[],geometry:[],directedSegments:[],verifiedJourneys:[],services:[],lazy:true,lazySource:'data/kr/generated/routes/'+r.id+'.json',stationCount:r.stations.length,serviceCount:r.verifiedJourneys.length})),assets:{operators:Object.fromEntries(data.assets.filter(a=>a.kind==='operator').map(a=>[a.operatorId,a])),lines:Object.fromEntries(data.assets.filter(a=>a.kind==='line').map(a=>[a.passengerLineId,a]))}};
 atomic(path.join(generated,'index.json'),JSON.stringify(index)+'\n');
 atomic(path.resolve(base,'../../../js/korea-index-data.js'),'/* Generated from data/kr/v2. */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(index)+';\n');
 for(const name of fs.readdirSync(routeDir))if(name.endsWith('.json')&&!wanted.has(name))fs.unlinkSync(path.join(routeDir,name));
 // Remove only named obsolete Korean inputs after verified replacement exists.
 for(const relative of ['source','osm-candidates','research','line1-service-candidates.json','TRACK_GEOMETRY_AUDIT.json']){
  const obsolete=path.resolve(krRoot,relative);if(!obsolete.startsWith(krRoot+path.sep)||obsolete===base)throw Error('Unsafe migration path');
  fs.rmSync(obsolete,{force:true,recursive:true});
 }
}
