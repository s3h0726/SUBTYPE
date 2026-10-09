#!/usr/bin/env node
'use strict';
// Rebuild review-only transfer candidates. Never infer a confirmed interchange
// from a shared Hangul label without station identity and interchange evidence.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),source=path.join(root,'data/kr/generated/index.json');
const index=JSON.parse(fs.readFileSync(source,'utf8')),groups=new Map();
for(const route of index.routes||[]){
 const region=route.regionId||'capital';
 for(const name of new Set(route.searchStations||[])){
  const key=region+'|'+String(name).normalize('NFC');
  if(!groups.has(key))groups.set(key,{region,name,routeIds:new Set()});
  groups.get(key).routeIds.add(route.id);
 }
}
const candidates=[...groups.values()].filter(entry=>entry.routeIds.size>1)
 .map(entry=>({region:entry.region,name:entry.name,routeIds:[...entry.routeIds].sort(),status:'review_required'}))
 .sort((a,b)=>a.region.localeCompare(b.region)||a.name.localeCompare(b.name,'ko'));
const result={schemaVersion:1,generated:'2026-10-09',status:'candidates_only',description:'Same-named stations inside the same region. Not verified transfer edges; do not feed directly into gameplay.',counts:{candidates:candidates.length},candidates};
const file=path.join(root,'data/kr/generated/transfer-candidates.json');
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',candidates:candidates.length,confirmedTransfers:0},null,2));
