#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const routeA=JSON.parse(read('data/route-overrides/hakodate-west.json')).route;
const routeB=JSON.parse(read('data/route-overrides/hakodate-east.json')).route;
assert.equal(routeA.stations.length,15);assert.equal(routeB.stations.length,27);
assert.equal(routeA.stations.at(-1).ja,'札幌');assert.equal(routeB.stations[0].ja,'札幌');
assert.equal(routeB.stations.at(-1).ja,'旭川');
assert.equal(routeA.stations.at(-1).id,routeB.stations[0].id);
assert.deepEqual(routeA.geometry.at(-1),routeB.geometry[0]);
assert.equal(new Set([...routeA.stations,...routeB.stations].map(s=>s.id)).size,41);
assert.equal(routeB.stations.find(s=>s.ja==='厚別')?.ko,'아쓰베쓰');
assert.equal(routeB.stations.find(s=>s.ja==='大麻')?.ko,'오아사');
assert.deepEqual(routeB.services.map(s=>s.stops.length),[27,13,15,7,7]);
const trackCode=read('js/route-integrity.js').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const runner={};vm.createContext(runner);
vm.runInContext(trackCode+';globalThis.resolvePlayableRoute=resolvePlayableRoute;',runner);
for(const route of [routeA,routeB])for(const service of route.services)for(const direction of ['forward','reverse']){
 const resolved=runner.resolvePlayableRoute(route,{service,direction});
 assert.equal(resolved.stations.length,service.stops.length);
 assert.equal(resolved.segments.length,service.stops.length-1);
 assert.ok(resolved.geometry.length>resolved.stations.length*2);
 assert.notEqual(resolved.fallbackGeometry,true,'must use real track');
 const expected=direction==='forward'?service.stops:[...service.stops].reverse();
 assert.deepEqual(Array.from(resolved.stations,s=>s.id),expected,'operating order');
}
const code=read('js/japan-lite-index.js'),lite=JSON.parse(code.slice(code.indexOf('=')+1,code.lastIndexOf(';')));
lite.transferNeighbors={'line-11103':['line-11104'],'line-11104':['line-11103']};
const ctx={TRT_JAPAN_LITE_INDEX:lite,console:{error:msg=>{throw Error(msg)}}};vm.createContext(ctx);
vm.runInContext(read('js/jr-hokkaido-hakodate-split.js'),ctx);
assert.equal(lite.routes.find(r=>r.id==='line-11103').visibility,'internal');
for(const [id,n] of [['line-11103-otaru-sapporo',15],['line-11103-sapporo-asahikawa',27]]){
 const list=lite.routes.filter(r=>r.id===id);assert.equal(list.length,1);assert.equal(list[0].stationCount,n);assert.equal(list[0].playable,true);
 assert.ok(list[0].lazySource.includes('data/route-overrides/hakodate-'));
}
assert.ok(lite.transferNeighbors['line-11103-otaru-sapporo']?.includes('line-11103-sapporo-asahikawa'));
assert.ok(read('index.html').includes('js/jr-hokkaido-hakodate-split.js'));
console.log('PASS: separate Otaru–Sapporo/Sapporo–Asahikawa, original internal, all services both directions');
