#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const opMap=new Map((index.operators||[]).map(o=>[o.id,o]));
const problems=[],notes=[];const perMode={},perRegion={};
for(const meta of index.routes||[]){
 const mode=meta.mode||'unknown',region=meta.regionId||'capital';
 perMode[mode]=(perMode[mode]||0)+1;perRegion[region]=(perRegion[region]||0)+1;
 if(!opMap.has(meta.operatorId))problems.push(meta.id+': operator missing');
 if(!fs.existsSync(path.join(root,meta.lazySource||''))){problems.push(meta.id+': missing detail');continue}
 const payload=JSON.parse(fs.readFileSync(path.join(root,meta.lazySource),'utf8')).route;
 if(!payload||!Array.isArray(payload.directions))problems.push(meta.id+': missing directions');
 if(payload?.operatorId!==meta.operatorId)notes.push(meta.id+': operator detail differs from index; hydrate uses index override');
 if(meta.stationCount!==payload?.stations?.length)problems.push(meta.id+': station count mismatch');
 if(meta.mode==='river_bus'&&!payload.serviceNote)notes.push(meta.id+': confirm sailing-specific intermediate stop patterns');
 if(meta.geometryReady===true&&payload.geometryReady!==true)problems.push(meta.id+': false geometry readiness');
}
const duplicateIds=index.routes.length-new Set(index.routes.map(x=>x.id)).size;
if(duplicateIds)problems.push('duplicate routes '+duplicateIds);
const report={status:problems.length?'FAIL':'PASS',readiness:'PROVISIONAL_NOT_RELEASED',routes:index.routes.length,byMode:perMode,byRegion:perRegion,corailIndexed:index.routes.filter(r=>r.operatorId==='kr-korail'||r.operatorIds?.includes('kr-korail')).length,hangangRoutes:index.routes.filter(r=>r.mode==='river_bus').length,problems,notes};
console.log(JSON.stringify(report,null,2));process.exitCode=problems.length?1:0;
