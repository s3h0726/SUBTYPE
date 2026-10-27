#!/usr/bin/env node
// Station identity/translation can be shared, but railway stop positions cannot.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path');
const {loadAll}=require('./lib/line-workspaces');
const {routes}=loadAll();
const get=id=>{const route=routes.find(route=>route.id===id);assert.ok(route,'missing '+id);return route};
const metro=get('line-28002'),yamanote=get('line-11302'),rapid=get('line-11312');
const at=(route,name)=>{const s=route.stations.find(s=>s.ja===name);assert.ok(s,route.id+' missing '+name);return s};
const tokyoMetro=at(metro,'東京'),tokyoJr=at(yamanote,'東京'),tokyoRapid=at(rapid,'東京');
assert.equal(tokyoMetro.stationMasterId,tokyoJr.stationMasterId,'master station identity must be shared');
assert.equal(tokyoMetro.coordinateSource,'line-track-geometry');
assert.equal(tokyoJr.coordinateSource,'line-track-geometry');
assert.ok(tokyoMetro.latitude!==tokyoJr.latitude||tokyoMetro.longitude!==tokyoJr.longitude,
  'JR and Tokyo Metro must not use one master point for different station platforms');
const exactTrack=route=>route.stations.forEach((station,i)=>{
 if(station.coordinateSource!=='line-track-geometry')return;
 const segment=i<route.directedSegments.length?route.directedSegments[i]:route.directedSegments.at(-1);
 const point=i<route.directedSegments.length?segment.geometry[0]:segment.geometry.at(-1);
 assert.equal(station.latitude,point[0],route.id+' latitude '+station.ja);
 assert.equal(station.longitude,point[1],route.id+' longitude '+station.ja);
});
for(const route of [metro,yamanote,rapid,get('line-28001'),get('line-28004'),get('line-28002-honancho-branch')])
 exactTrack(route);
assert.equal(tokyoRapid.coordinateSource,'station-master-fallback',
  'legacy Chuo Rapid Tokyo segment is >1 km from Tokyo station: do not misplace station');
assert.ok(tokyoRapid.trackEndpointOffsetKm>1);
const source=fs.readFileSync(path.join(__dirname,'../js/data-loader.js'),'utf8')
 .replace(/^import[^;]*;/gm,'').replace(/\bexport\s+/g,'');
const ctx={console,TRT_KOREAN_OVERRIDES:{},TRT_LINE_THEMES:{}};
vm.runInNewContext(source+';globalThis.testNormalize=normalizeLine',ctx,{filename:'data-loader.js'});
// Simulate deployment with OLD station-master coordinates. The browser must
// independently recover correct per-route points without relying on a rebuild.
const runtimeRaw=id=>{
 const route=get(id);
 return {...route,stations:route.stations.map(s=>({
   ...s,latitude:s.coordinateSource==='line-track-geometry'?
     (id==='line-28002'?35.68117:s.latitude):s.latitude,
   longitude:s.coordinateSource==='line-track-geometry'?
     (id==='line-28002'?139.767553:s.longitude):s.longitude,
   coordinateSource:undefined
 }))};
};
const normalized=ctx.testNormalize(runtimeRaw('line-28002'));
const normalizedTokyo=normalized.stations.find(s=>s.ja==='東京');
assert.equal(normalizedTokyo.latitude,tokyoMetro.latitude);
assert.equal(normalizedTokyo.longitude,tokyoMetro.longitude);
assert.equal(normalizedTokyo.coordinateSource,'line-track-geometry');
const normalizeSource=fs.readFileSync(path.join(__dirname,'../js/app.bundle.js'),'utf8');
for(const marker of [
 'function applyRouteTrackCoordinates(raw,stations)',
 "coordinateSource:'line-track-geometry'",
 'const sharedMasterIds=new Set(',
 'routeCoordinates.push([stop.latitude,stop.longitude])'
])assert.ok(normalizeSource.includes(marker),'deployed bundle missing '+marker);
const free=fs.readFileSync(path.join(__dirname,'../js/free-drive.js'),'utf8');
assert.ok(free.includes("stop.jpSharedStationKey='jp-station:'+masterId"));
assert.ok(free.includes('node.coordsByRoute.set(route.id,coords(station))'));
if(process.argv.includes('--published')){
  const publishedMetro=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/generated/routes/line-28002.json'),'utf8')).route;
  const publishedYamanote=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/generated/routes/line-11302.json'),'utf8')).route;
  const m=at(publishedMetro,'東京'),j=at(publishedYamanote,'東京');
  assert.equal(m.coordinateSource,'line-track-geometry','published metro marker still uses shared master');
  assert.equal(j.coordinateSource,'line-track-geometry','published Yamanote marker still uses shared master');
  assert.equal(m.latitude,tokyoMetro.latitude);
  assert.equal(j.latitude,tokyoJr.latitude);
  assert.notEqual(m.latitude,j.latitude,'published railway platforms still collapsed');
  const audit=JSON.parse(fs.readFileSync(path.join(__dirname,'../reports/jr/route-station-coordinate-audit.json'),'utf8'));
  assert.ok(audit.totals.lineTrack>0,'canonical station-coordinate audit is empty');
  assert.equal(audit.stationTotal,audit.totals.lineTrack+audit.totals.fallback+audit.totals.unverified);
  assert.ok(audit.exceptions.some(x=>x.routeId==='line-11312'&&x.offsetKm>1),
    'wrong Chuo Rapid Tokyo geometry must be audited, not marked as a verified platform');
}
console.log(JSON.stringify({status:'PASS',routesTested:6,sharedTokyoIdentity:true,independentMetroAndJrPlatforms:true,rapidInvalidTrackFallback:true,browserSelfHeals:true}));
