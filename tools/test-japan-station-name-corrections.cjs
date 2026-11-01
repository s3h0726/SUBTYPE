#!/usr/bin/env node
'use strict';
// Guard exact Namuwiki-verified Japanese station labels without flattening homonymous stations.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('data/japan-verified-station-name-corrections-20261101.json');
const editor=read('data/editor-overrides.json');
assert.equal(manifest.count,manifest.corrections.length);
assert.equal(manifest.corrections.length,12);
const byId=new Map();
for(const name of fs.readdirSync(path.join(root,'data/shared-stations')).filter(n=>/^stations-\d+\.json$/.test(n))){
 for(const station of read('data/shared-stations/'+name)){
  assert(!byId.has(station.id),'Duplicate shared station ID: '+station.id);
  byId.set(station.id,station);
 }
}
const routes=new Map();
for(const correction of manifest.corrections){
 const {routeId,stationId,ja,ko,sourceUrl}=correction;
 const physical=byId.get(stationId);
 assert(physical,'Missing physical station '+stationId);
 assert.equal(physical.names.ja,ja,'Japanese station identity changed');
 assert.equal(physical.names.ko,ko,'Canonical Korean station name stale');
 assert.equal(physical.koSourceUrl,sourceUrl,'Canonical name evidence missing');
 assert.equal(physical.koVerified,true,'Canonical verification flag missing');
 assert.equal(editor.stations?.[routeId]?.[stationId],ko,'Live-game Korean name override stale');
 if(!routes.has(routeId))routes.set(routeId,read('data/generated/routes/'+routeId+'.json').route);
 const route=routes.get(routeId);
 const matches=route.stations.filter(s=>s.id===stationId&&s.ja===ja);
 assert.equal(matches.length,1,'Generated route station missing/duplicated '+routeId+':'+stationId);
 assert.equal(matches[0].ko,ko,'Generated route Korean name stale');
 assert.equal(matches[0].koSourceUrl,sourceUrl,'Generated route source missing');
}
assert.equal(byId.get('station-1150910').names.ko,'오카와라','Kansai namesake unexpectedly changed');
console.log('PASS '+manifest.corrections.length+' verified Japanese station labels / '+routes.size+' generated routes / unrelated namesake preserved');
