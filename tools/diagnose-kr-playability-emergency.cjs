'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {decode}=require('./lib/kr-payload.cjs');
const root=path.resolve(__dirname,'..');
const routes=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8')).routes;
const policySource=fs.readFileSync(path.join(root,'js/korean-access-policy.js'),'utf8');
const blockedData=fs.readFileSync(path.join(root,'js/korean-access-data.js'),'utf8');
const blocked=JSON.parse(blockedData.match(/KR_BLOCKED_SOURCE_RELATIONS=(\[[^;]+\]);/)?.[1]||'[]');
const forbidden=new Set(blocked.flatMap(x=>x.lineIds||[]));
const isAvailable=r=>!r.serviceWindows||r.serviceWindows.some(w=>!w.start||w.start<='2026-11-18');
const counts={total:routes.length,playableTrue:0,playableFalse:0,geometryReadyTrue:0,geometryReadyFalse:0,publicCandidates:0,blocked:0,expiredAt2026Nov18:0,byMode:{},byReleaseStatus:{},byCategory:{}};
for(const r of routes){
 counts.playableTrue+=r.playable===true?1:0;
 counts.playableFalse+=r.playable===false?1:0;
 counts.geometryReadyTrue+=r.geometryReady===true?1:0;
 counts.geometryReadyFalse+=r.geometryReady===false?1:0;
 counts.blocked+=forbidden.has(r.id)?1:0;
 counts.expiredAt2026Nov18+=(!isAvailable(r))?1:0;
 counts.byMode[r.mode]=(counts.byMode[r.mode]||0)+1;
 counts.byReleaseStatus[r.releaseStatus||'none']=(counts.byReleaseStatus[r.releaseStatus||'none']||0)+1;
 counts.byCategory[r.category]=(counts.byCategory[r.category]||0)+1;
 if(r.playable!==false&&r.geometryReady===true&&r.geometryStatus!=='missing'&&r.visibility!=='internal')counts.publicCandidates++;
}
console.log('KR_INDEX_COUNTS '+JSON.stringify(counts));
const sampleGroups=['high_speed_rail','rail','subway','commuter_rail','bus','village_bus','river_bus'];
const sample=[];
for(const mode of sampleGroups){
 const r=routes.find(r=>r.mode===mode&&r.playable!==false&&r.geometryReady===true)||routes.find(r=>r.mode===mode);
 if(r&&!sample.some(x=>x.id===r.id))sample.push(r);
}
sample.push(...routes.filter(r=>r.id.startsWith('kr-rail')&&r.playable!==false&&r.geometryReady===true).slice(0,4).filter(r=>!sample.some(x=>x.id===r.id)));
for(const meta of sample){
 const row={id:meta.id,mode:meta.mode,category:meta.category,playable:meta.playable,geometryReady:meta.geometryReady,geometryStatus:meta.geometryStatus,releaseStatus:meta.releaseStatus,visibility:meta.visibility,lazySource:meta.lazySource,serviceWindows:meta.serviceWindows};
 try{
 const obj=decode(JSON.parse(fs.readFileSync(path.join(root,meta.lazySource),'utf8'))),r=obj.route;
 row.details={id:r.id,schemaVersion:r.schemaVersion,canonicalContract:r.canonicalContract,playable:r.playable,geometryReady:r.geometryReady,geometryStatus:r.geometryStatus,releaseStatus:r.releaseStatus,stations:r.stations?.length,geometry:r.geometry?.length,segments:r.directedSegments?.length,services:r.services?.length,directions:r.directions?.map(x=>x.id),verifiedJourneys:r.verifiedJourneys?.length,firstJourneys:r.verifiedJourneys?.slice(0,3).map(x=>({id:x.id,dates:x.serviceDates,stops:x.stations?.length,trips:x.tripIds?.length,service:x.service?.id}))};
 }catch(e){row.error=String(e.message||e)}
 console.log('KR_SAMPLE '+JSON.stringify(row));
}
if(counts.publicCandidates===0)console.error('NO_KR_PUBLIC_CANDIDATES');


const vm=require('node:vm');
const normalizeContext=vm.createContext({console,Intl,Date,URL,Blob,Response,TextDecoder,Uint8Array,Set,Map,Math,Number,JSON,RegExp,crypto:{randomUUID:()=> 'diagnostic'},hongKongRouteBlockReason:()=>null,koreanRouteBlockReason:()=>null});
const load=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\\bimport(?=\\s|\\{)[^;]+;/g,'').replace(/\\bexport\\s+/g,'');
try{
 vm.runInContext(load('js/data-loader.js')+'\\n;globalThis.__normalizeLazyLine=normalizeLazyLine;globalThis.__normalizeLine=normalizeLine;',normalizeContext,{timeout:15000});
 let ready=0,unavailable=0,errors=[];
 for(let i=0;i<routes.length;i++){
  try{
   normalizeContext.rawRoute=routes[i];
   const value=vm.runInContext('__normalizeLazyLine(rawRoute)',normalizeContext,{timeout:250});
   if(value.geometryReady===true&&value.playable!==false)ready++;else unavailable++;
  }catch(error){errors.push({index:i,route:routes[i].id,error:String(error.message||error)});if(errors.length>=6)break}
 }
 console.log('KR_NORMALIZE_RESULT '+JSON.stringify({ready,unavailable,errors}));
}catch(error){console.error('KR_NORMALIZE_FATAL '+String(error.stack||error))}
try{
 vm.runInContext(load('js/korean-service-resolver.js')+'\\n'+load('js/route-integrity.js')+'\\n;globalThis.__krTest={koreanVerifiedChoices,resolveKoreanVerifiedChoice,resolvePlayableRoute};',normalizeContext,{timeout:20000});
 for(const meta of sample){
  try{
   const route=decode(JSON.parse(fs.readFileSync(path.join(root,meta.lazySource),'utf8'))).route;
   normalizeContext.rawRoute=route;
   const outcome=vm.runInContext('(function(){const r=__normalizeLine(rawRoute);const choices=__krTest.koreanVerifiedChoices(r);if(!choices.length)return{choices:0,schemaVersion:r.schemaVersion,releaseStatus:r.releaseStatus};const resolved=__krTest.resolveKoreanVerifiedChoice(choices[0],r);const playable=__krTest.resolvePlayableRoute(resolved.route,{direction:resolved.direction,service:resolved.service});return {choices:choices.length,stations:playable.stations.length,segments:playable.segments.length,service:resolved.service.id}})()',normalizeContext,{timeout:5000});
   console.log('KR_RUNTIME_TEST '+JSON.stringify({id:route.id,outcome}));
  }catch(error){console.log('KR_RUNTIME_TEST '+JSON.stringify({id:meta.id,error:String(error.stack||error).slice(0,1600)}))}
 }
}catch(error){console.error('KR_RUNTIME_FATAL '+String(error.stack||error))}
