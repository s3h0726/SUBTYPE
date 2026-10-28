#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const folder='data/lines/jr-hokkaido/hakodatehonsen-chomanbu-otaru/';
const rel=JSON.parse(read(folder+'stations.json'));
const tracks=JSON.parse(read(folder+'geometry.json'));
const route=JSON.parse(read('data/generated/routes/line-11102.json')).route;
const former='station-1110202',a='station-1110138',b='station-1110204';
// Validate nationwide ingest and shared station master as well as the compiled route.
// A later data rebuild must not resurrect a closed station.
const nationwide=JSON.parse(read('data/nationwide/routes/line-11102.json')).route;
const shared=JSON.parse(read('data/shared-stations/stations-61.json'));
assert.equal(nationwide.stations.length,17);
assert.equal(nationwide.stationSequence.length,17);
assert.equal(nationwide.stations.some(s=>s.stationMasterId===former||s.ja==='二股'),false);
assert.equal(nationwide.stationSequence.includes(former),false);
assert.equal(shared.some(s=>s.id===former),false);
assert.equal(nationwide.stations[0].ja,'長万部');
assert.equal(nationwide.stations[1].ja,'黒松内');
assert.equal(nationwide.stations.at(-1).ja,'小樽');
assert.equal(nationwide.geometry.length,1435);
assert.deepEqual(nationwide.stationSequence,route.stations.map(s=>s.id));
// The separate, active Kyoto Tango Railway Futamata (二俣) must be preserved.
const kyoto=JSON.parse(read('data/generated/routes/line-99608.json')).route;
assert.ok(kyoto.stations.some(s=>s.ja==='二俣'));

assert.equal(route.stations.length,17);
assert.equal(route.directedSegments.length,16);
assert.equal(route.geometry.length,1435,'Do not replace real curves with straight tracks');
assert.equal(rel.length,17);
assert.equal(Object.keys(tracks).length,16);
assert.equal(rel.some(st=>st.stationId===former),false);
assert.equal(route.stations.some(st=>st.id===former||st.ja==='二股'),false);
assert.equal(rel[0].stationId,a);assert.equal(rel[1].stationId,b);
assert.equal(route.stations[0].ja,'長万部');assert.equal(route.stations[1].ja,'黒松内');
assert.equal(route.stations.at(-1).ja,'小樽');
assert.deepEqual(rel.map(x=>x.order),Array.from({length:17},(_,i)=>i+1));
const bridge=tracks[a+'::'+b];
assert.ok(bridge?.verified);
assert.equal(bridge.geometry.length,152);
assert.equal(tracks[a+'::'+former],undefined);
assert.equal(tracks[former+'::'+b],undefined);
for(let i=0;i<16;i++){
 const from=route.stations[i],to=route.stations[i+1],seg=route.directedSegments[i];
 assert.equal(seg.fromStationId,from.id);assert.equal(seg.toStationId,to.id);
 assert.ok(seg.geometry.length>2);
 assert.deepEqual(seg.geometry[0],route.geometry[from.geometryIndex]);
 assert.deepEqual(seg.geometry.at(-1),route.geometry[to.geometryIndex]);
}
assert.deepEqual(route.directedSegments[0].geometry,bridge.geometry);
const js=read('js/japan-lite-index.js'),lite=JSON.parse(js.slice(js.indexOf('=')+1,js.lastIndexOf(';')));
const card=lite.routes.find(x=>x.id==='line-11102');assert.ok(card);
assert.equal(card.stationCount,17);
assert.equal(card.searchStations.includes('二股'),false);
assert.equal(card.searchStations.includes('후타마타'),false);
assert.ok(card.lazySource.includes('data/generated/routes/line-11102.json'));
const routeModule=read('js/route-integrity.js').replace(/^export /gm,'');
const context={};vm.createContext(context);
vm.runInContext(routeModule+';globalThis.resolvePlayableRoute=resolvePlayableRoute;',context);
const service={id:'local',stops:route.stations.map(s=>s.id)};
for(const direction of ['forward','reverse']){
 const selected=context.resolvePlayableRoute(route,{service,direction});
 assert.equal(selected.stations.length,17);
 assert.equal(selected.segments.length,16);
 assert.ok(selected.geometry.length>1400);
 assert.notEqual(selected.fallbackGeometry,true);
 const expected=direction==='forward'?service.stops:[...service.stops].reverse();
 assert.deepEqual(Array.from(selected.stations,s=>s.id),expected);
}
console.log('PASS: JR Hokkaido Futamata retired; 17 stops, 16 curved segments, both directions');
