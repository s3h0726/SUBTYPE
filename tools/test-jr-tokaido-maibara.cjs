#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const route=json('data/generated/routes/line-11502.json').route;
const published=json('data/jp-canonical/chunk-02.json').routes.find(item=>item.id===route.id);
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\\s*$/,''));
const card=lite.routes.find(item=>item.id===route.id);
const physical=json('data/lines/jr-central/tokaidohonsen-hamamatsu-gifu/geometry.json');
const gap=physical['station-1150304::station-1150307'];
const context={};
vm.createContext(context);
vm.runInContext(read('js/route-integrity.js').replace(/^export\\s+/gm,'')+';globalThis.resolvePlayableRouteForTest=resolvePlayableRoute;',context);
assert.equal(route.stations.length,42);
assert.equal(route.stations[0].ja,'豊橋');
assert.equal(route.stations.at(-1).ja,'米原');
assert.equal(route.directedSegments.length,41);
assert.equal(route.geometryReady,true);
assert.deepEqual(route.missingSegments,[]);
assert(gap?.verified && gap.geometry.length>=40,'Ogaki–Tarui needs real verified polyline, not a chord');
const ids=route.stations.map(s=>s.id);
assert.equal(new Set(ids).size,42);
for(let i=0;i<41;i++){
 const segment=route.directedSegments[i];
 assert.equal(segment.fromStationId,ids[i]);
 assert.equal(segment.toStationId,ids[i+1]);
 assert(segment.geometry.length>=2);
}
for(const direction of ['forward','reverse']){
 const actual=context.resolvePlayableRouteForTest(route,{direction,service:{id:'local',stops:ids}});
 assert.equal(actual.stations.length,42);
 assert.equal(actual.segments.length,41);
 assert.equal(actual.fallbackGeometry,undefined);
 assert.equal(actual.stations[0].ja,direction==='forward'?'豊橋':'米原');
 assert.equal(actual.stations.at(-1).ja,direction==='forward'?'米原':'豊橋');
}
assert(published,'runtime chunk must contain the merged route');
assert.equal(published.stations.length,42);
assert.equal(published.geometry.length,route.geometry.length);
assert.equal(published.directedSegments.length,41);
assert.equal(published.geometryReady,true);
assert.equal(published.missingSegments?.length,0);
assert.equal(card.stationCount,42);
assert.equal(card.line.ko,'도카이도 본선(토요하시~마이바라)');
assert(card.lazySource.includes('chunk-02.json'));
assert(!card.playable===false || card.playable===true);
console.log('PASS: Toyohashi–Maibara 42 stations, 41 real railway edges, forward/reverse game route, published chunk and card');
