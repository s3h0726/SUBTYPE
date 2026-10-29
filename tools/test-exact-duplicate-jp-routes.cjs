#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const aliases=JSON.parse(read('data/japan-duplicate-route-aliases.json')).aliases;
const oldIds=Object.keys(aliases),canonicalIds=Object.values(aliases);
assert.equal(oldIds.length,3);
const unpack=(file,marker)=>JSON.parse(read(file).split(marker)[1].trim().replace(/;\s*$/,''));
const index=unpack('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=').routes;
const workspace=unpack('js/line-workspace-data.js','window.TRT_EMBEDDED_LINE_WORKSPACES=').routes;
for(const [name,routes] of [['index',index],['workspace',workspace]]){
 const ids=new Set(routes.map(r=>r.id));
 assert.equal(ids.size,routes.length,'Duplicate IDs in '+name);
 for(const old of oldIds)assert(!ids.has(old),'Retired duplicate still in '+name+': '+old);
 for(const id of canonicalIds)assert(ids.has(id),'Canonical route missing in '+name+': '+id);
 assert(routes.length>=590&&routes.length<=610,'Unexpected line count '+name+': '+routes.length);
}
const routeSeq=r=>(r?.searchStations||[]).filter((_,i)=>i%2===0).join('>');
for(const [old,id] of Object.entries(aliases)){
 const original=index.find(r=>r.id===id);
 assert(original?.stationCount>=2,'Canonical lost its stations '+id);
 assert(routeSeq(original),'Canonical route station search missing '+id);
}
const chunkDir=path.join(root,'data/jp-canonical');
let count=0;
for(const file of fs.readdirSync(chunkDir).filter(x=>/^chunk-\d+\.json$/.test(x))){
 const pack=JSON.parse(read('data/jp-canonical/'+file));
 for(const route of pack.routes){
  assert(!oldIds.includes(route.id),'Stale duplicate in '+file);
  assert(route.stations?.length>=2,'Missing station payload for '+route.id);
  count++;
 }
}
assert.equal(count,index.filter(r=>r.lazySource?.includes('/jp-canonical/')).length,'Chunk/catalog count mismatch');
for(const file of ['js/feature-flags.js','js/app.bundle.js']){
 const text=read(file);
 for(const [old,id] of Object.entries(aliases))
  assert(text.includes("'"+old+"':'"+id+"'"),'Missing old-score alias in '+file+': '+old);
}
console.log('PASS '+JSON.stringify({published:index.length,workspace:workspace.length,chunkRoutes:count,retired:oldIds.length}));
