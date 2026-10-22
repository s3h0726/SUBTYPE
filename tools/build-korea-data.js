#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{load,compile}=require('./lib/kr-network');
const base=path.resolve(__dirname,'../data/kr/v2'),data=load(base),result=compile(data,{base});
if(result.errors.length){console.error(JSON.stringify(result.errors,null,2));process.exit(1)}
const target=path.join(base,'generated');fs.mkdirSync(target,{recursive:true});
const atomic=(file,value)=>{fs.writeFileSync(file+'.tmp',value);fs.renameSync(file+'.tmp',file)};
const write=(name,value)=>atomic(path.join(target,name),JSON.stringify(value,null,2)+'\n');
write('audit.json',{...result,routes:result.routes.map(r=>r.id)});
write('routes.json',{schemaVersion:2,country:{id:'kr',name:'대한민국'},routes:result.routes});
console.log(JSON.stringify({status:result.status,...result.counts,blockedServices:result.blocked.length},null,2));
// National publication remains strict; individual releases use exactly the same
// service-level compile gate, independently of national inventory completeness.
const national=process.argv.includes('--publish')||process.argv.includes('--require-complete');
if(national&&result.status!=='COMPLETE'){console.error('KR_RELEASE_BLOCKED: national evidence remains incomplete.');process.exitCode=1}
else if(process.argv.includes('--publish-released')||process.argv.includes('--publish')){
 const generated=path.resolve(base,'../generated'),routeDir=path.join(generated,'routes'),file=path.join(generated,'index.json');
 const prior=JSON.parse(fs.readFileSync(file,'utf8'));
 const reviews=JSON.parse(fs.readFileSync(path.join(base,'service-playthrough-reviews.json'),'utf8')),bundleSha=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(base,'../../../js/app.bundle.js'))).digest('hex');
 const publication=require('./lib/kr-release-playthroughs').gateReleasedRoutes(result.routes,reviews,bundleSha);if(process.argv.includes('--publish')&&publication.blocked.length)throw Error('KR_RELEASE_BLOCKED: pinned PC/mobile release reviews missing');write('release-publication.json',{status:result.status,scope:'Per-service source approval AND pinned PC/mobile completion review; national audit remains independent',releasedServices:publication.routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),blocked:publication.blocked});
 // Preserve legacy artifacts and their provenance. Never delete source research
 // or remove an existing line because another service is not yet approved.
 if(publication.routes.length){
  const byId=new Map(prior.routes.map(r=>[r.id,r]));
  for(const route of publication.routes){atomic(path.join(routeDir,route.id+'.json'),JSON.stringify({route:{...route,playStatus:'RELEASED'}})+'\n');byId.set(route.id,{...route,playStatus:'RELEASED',stations:[],geometry:[],directedSegments:[],verifiedJourneys:[],services:[],lazy:true,lazySource:'data/kr/generated/routes/'+route.id+'.json',stationCount:route.stations.length,serviceCount:route.verifiedJourneys.length})}
  const operators=new Map((prior.operators||[]).map(o=>[o.id,o]));for(const o of data.operators.filter(o=>o.verification==='verified'))operators.set(o.id,o);
  const index={...prior,routes:[...byId.values()],operators:[...operators.values()]};atomic(file,JSON.stringify(index)+'\n');atomic(path.resolve(base,'../../../js/korea-index-data.js'),'/* Generated released Korean catalog; legacy entries retained. */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(index)+';\n');
 }
}
