#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadAll,projectRoot}=require('./lib/line-workspaces');
const read=p=>JSON.parse(fs.readFileSync(path.join(projectRoot,p),'utf8'));
const {routes}=loadAll();
const overrides=read('data/japan-route-station-names.json').routes;
const groups=read('data/japan-named-transfer-groups.json').groups;
assert(routes.length>=590,'national railway workspace inventory unexpectedly reduced');
const lookup=new Map(routes.map(r=>[r.id,r]));
const validatedOverrides=[];
for(const [routeId,entries] of Object.entries(overrides)){
 const route=lookup.get(routeId);
 assert(route,'missing station-sign route '+routeId);
 for(const [id,names] of Object.entries(entries)){
  const found=route.stations.filter(s=>s.id===id);
  assert(found.length===1,routeId+'/'+id+': missing or duplicated stop');
  assert.equal(found[0].ja,names.ja,routeId+'/'+id+' station sign incorrect');
  assert.equal(found[0].ko,names.ko,routeId+'/'+id+' Hangul sign incorrect');
  if(names.transferStationId)assert.equal(found[0].transferStationId,names.transferStationId);
  validatedOverrides.push({routeId,id,name:found[0].ja});
 }
}
assert(validatedOverrides.length>=40,'operator-specific station-sign coverage regressed');
const km=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos(b[0]*Math.PI/180));
const groupResults=groups.map(spec=>{
 const matched=[];
 for(const route of routes)for(const stop of route.stations){
  if(spec.names.includes(stop.ja)&&Number.isFinite(stop.latitude)&&Number.isFinite(stop.longitude)
    &&km([stop.latitude,stop.longitude],spec.center)<=spec.radiusKm)
   matched.push({routeId:route.id,stopId:stop.id,stationJa:stop.ja});
 }
 const counts=new Map;
 for(const stop of matched)counts.set(stop.routeId,(counts.get(stop.routeId)||0)+1);
 const eligible=matched.filter(stop=>counts.get(stop.routeId)===1);
 const ready=!spec.disabledNamedJoin&&new Set(eligible.map(s=>s.routeId)).size>=2
   &&new Set(eligible.map(s=>s.stationJa)).size>=2;
 return{id:spec.id,region:spec.region,source:spec.source,ready,
  candidates:matched.length,uniqueRouteMatches:eligible.length,
  distinctNames:[...new Set(eligible.map(s=>s.stationJa))],
  disabledNamedJoin:!!spec.disabledNamedJoin};
});
const ready=groupResults.filter(group=>group.ready);
assert(groups.length>=29,'national transfer inventory reduced');
assert(new Set(groups.map(s=>s.region)).size>=8,'nationwide transfer coverage reduced');
assert(ready.length>=18,'most named interchanges failed to assemble from canonical routes');
const stations=routes.reduce((n,r)=>n+r.stations.length,0);
const duplicateRouteStationIds=[];
for(const route of routes){
 const byId=new Map;
 for(const stop of route.stations){
  const id=stop.transferStationId||stop.stationMasterId||stop.id;
  byId.set(id,(byId.get(id)||0)+1);
 }
 for(const [id,count] of byId)if(count>1)duplicateRouteStationIds.push({routeId:route.id,stationId:id,count});
}
const report={schemaVersion:1,generated:new Date().toISOString(),
 JapaneseRoutes:routes.length,stationOccurrences:stations,
 auditedRegions:[...new Set(groups.map(group=>group.region))],
 namedTransferGroups:groups.length,activeNamedGroups:ready.length,
 operatorSpecificStationOverrides:validatedOverrides.length,
 stationNameRoutes:Object.keys(overrides).length,
 groupResults,duplicateRouteStationIds,
 policy:'Only named pairs with cited transfer information and bounded local coordinates join; duplicate stops on one line are not collapsed; shared station identity never overwrites a line station sign.'};
const dest=path.join(projectRoot,'reports/jr/japan-national-transfer-audit.json');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',JapaneseRoutes:routes.length,stationOccurrences:stations,
  groups:groups.length,active:ready.length,regions:report.auditedRegions.length,
  stationNameRoutes:Object.keys(overrides).length,overrides:validatedOverrides.length,
  duplicatedStopIdentities:duplicateRouteStationIds.length,report:'reports/jr/japan-national-transfer-audit.json'}));
