#!/usr/bin/env node
'use strict';
/* Regression for JP evidence-backed operating pattern extension.
   Run: node tools/test-japan-extra-operating-patterns.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const base=JSON.parse(read('data/tokyo-service-patterns.json'));
const sandbox={window:{TRT_TOKYO_SERVICE_PATTERNS:structuredClone(base)}};
vm.createContext(sandbox);
const patch=read('js/japan-extra-operating-patterns.js');
const originalPatterns=base.servicePatterns.length;
const originalJourneys=base.serviceJourneys.length;
vm.runInContext(patch,sandbox,{filename:'japan-extra-operating-patterns.js'});
const cat=sandbox.window.TRT_TOKYO_SERVICE_PATTERNS;
const manifest=sandbox.window.TRT_JP_EXTRA_OPERATING_PATTERN_AUDIT;
assert.equal(manifest.expectedDirectionCount,16);
assert.equal(manifest.addedDirections,16);
assert.equal(cat.servicePatterns.length,originalPatterns+16);
assert.equal(cat.serviceJourneys.length,originalJourneys+16);
assert.equal(new Set(cat.servicePatterns.map(p=>p.id)).size,cat.servicePatterns.length,'duplicate service id');
assert.equal(new Set(cat.serviceJourneys.map(p=>p.id)).size,cat.serviceJourneys.length,'duplicate journey id');
assert.deepEqual([...manifest.operators].sort(),['keikyu','keio','odakyu','seibu'].sort());
const cachedRoutes=new Map();
for(const p of cat.servicePatterns.slice(originalPatterns)){
  const routeId=p.baseRouteId;
  if(!cachedRoutes.has(routeId)){
    const route=JSON.parse(read('data/generated/routes/'+routeId+'.json')).route;
    assert.equal(route.geometryReady,true,routeId+': missing real geometry');
    assert.ok(route.stations.length>=2,routeId+': missing stations');
    cachedRoutes.set(routeId,route);
  }
  const route=cachedRoutes.get(routeId);
  const original=route.stations;
  const reversed=p.directionId==='reverse';
  const chosen=reversed?original.slice().reverse():original;
  const byId=new Map(chosen.map((s,i)=>[String(s.id),i]));
  const stopIds=p.stopStationIds.map(String);
  assert.ok(stopIds.length>2,p.id+': too few stops');
  assert.equal(new Set(stopIds).size,stopIds.length,p.id+': repeated station');
  const positions=stopIds.map(s=>byId.get(s));
  assert.ok(positions.every(Number.isInteger),p.id+': unknown station');
  assert.ok(positions.every((n,i)=>i===0||n>positions[i-1]),p.id+': order mismatch');
  assert.equal(String(p.originStationId),stopIds[0],p.id+': origin mismatch');
  assert.equal(String(p.destinationStationId),stopIds.at(-1),p.id+': destination mismatch');
  assert.ok(p.sources.some(x=>/^https:\/\//.test(x.url)),p.id+': provenance missing');
  assert.equal(p.status,'active');
  const journey=cat.serviceJourneys.find(x=>x.servicePatternId===p.id);
  assert.ok(journey,p.id+': selection journey missing');
  assert.equal(journey.directionId,p.directionId);
  const start=chosen.findIndex(s=>String(s.id)===String(p.originStationId));
  const end=chosen.findIndex(s=>String(s.id)===String(p.destinationStationId));
  assert.ok(start>=0&&end>=start,p.id+': route resolver section mismatch');
  const selected=chosen.slice(start,end+1);
  assert.ok(stopIds.every(s=>selected.some(st=>String(st.id)===s)),p.id+': skipped stop outside segment');
  assert.ok(selected.every(st=>Number.isInteger(st.geometryIndex)),p.id+': invalid station geom idx');
}
const html=read('index.html');
const posExtra=html.indexOf('japan-extra-operating-patterns.js');
assert.ok(html.indexOf('service-data.js')>=0&&posExtra>html.indexOf('service-data.js'),'extension before catalog');
assert.ok(posExtra<html.indexOf('app.bundle.js'),'extension loaded after game');
vm.runInContext(patch,sandbox,{filename:'repeat-extension.js'});
assert.equal(cat.servicePatterns.length,originalPatterns+16,'extension must be idempotent');
console.log(JSON.stringify({status:'PASS',routeCards:cachedRoutes.size,newServiceFamilies:8,newDirections:16,checkedStops:cat.servicePatterns.slice(originalPatterns).reduce((n,p)=>n+p.stopStationIds.length,0),deduplication:'PASS',geometryIndex:'PASS',directionOrdering:'PASS'},null,2));
