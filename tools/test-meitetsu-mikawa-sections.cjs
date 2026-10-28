#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const umi=JSON.parse(read('data/route-overrides/meitetsu-mikawa-umi.json')).route;
const yama=JSON.parse(read('data/route-overrides/meitetsu-mikawa-yama.json')).route;
assert.equal(umi.stations.length,12);assert.equal(yama.stations.length,12);
assert.equal(umi.stations[0].id,yama.stations[0].id,'Chiryu interchange station ID');
assert.equal(umi.stations[0].ja,'知立');assert.equal(yama.stations[0].ja,'知立');
assert.equal(umi.stations.at(-1).ja,'碧南');assert.equal(yama.stations.at(-1).ja,'猿投');
assert.equal(umi.directedSegments.length,11);assert.equal(yama.directedSegments.length,11);
assert.equal(new Set([...umi.stations,...yama.stations].map(s=>s.id)).size,23);
for(const route of [umi,yama]){
 assert.equal(route.services[0].stops.length,12);
 assert.equal(route.geometryReady,true);
 assert.equal(route.missingSegments.length,0);
 assert.equal(route.reusedSegments.length,0);
}
const geometryCode=read('js/route-integrity.js').replace(/^export /gm,'');
const runner={};vm.createContext(runner);
vm.runInContext(geometryCode+';globalThis.resolvePlayableRoute=resolvePlayableRoute;',runner);
for(const route of [umi,yama])for(const direction of ['forward','reverse']){
 const full=runner.resolvePlayableRoute(route,{direction,service:route.services[0]});
 assert.equal(full.stations.length,12);
 assert.equal(full.segments.length,11);
 assert.ok(full.geometry.length>100);
 assert.notEqual(full.fallbackGeometry,true);
 assert.deepEqual(Array.from(full.stations,x=>x.id),
   direction==='forward'?route.services[0].stops:[...route.services[0].stops].reverse());
}
const s=read('js/japan-lite-index.js'),index=JSON.parse(s.slice(s.indexOf('=')+1,s.lastIndexOf(';')));
const context={TRT_JAPAN_LITE_INDEX:index,console:{error:m=>{throw Error(m)}}};vm.createContext(context);
vm.runInContext(read('js/meitetsu-mikawa-sections-patch.js'),context);
const a=index.routes.find(x=>x.id==='line-30005');
assert.equal(a.visibility,'internal');assert.equal(a.playable,false);
for(const id of ['line-30005-yama','line-30005-umi']){
 const matches=index.routes.filter(x=>x.id===id);
 assert.equal(matches.length,1);
 assert.equal(matches[0].stationCount,12);
 assert.equal(matches[0].playable,true);
 assert.match(matches[0].lazySource,/meitetsu-mikawa-(umi|yama).json/);
}
assert.equal(index.routes.filter(r=>r?.operatorId==='nagoyatetsudo'&&/三河線/.test(r?.line?.ja||'')&&r.visibility!=='internal').length,2);
const html=read('index.html');
assert.ok(html.includes('meitetsu-mikawa-sections-patch.js'));
console.log('PASS: Meitetsu Mikawa two cards, 12+12 stations, 2x2 directions and curved rail');
