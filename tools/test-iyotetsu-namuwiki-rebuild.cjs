#!/usr/bin/env node
'use strict';
// Verify Iyo suburban railway identity, five separated tram operating patterns,
// surveyed geometry, station names, distinct interchange identities and re-build safety.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),
 json=p=>JSON.parse(read(p)),fromJs=(p,prefix)=>JSON.parse(read(p).split(prefix)[1].trim().replace(/;\s*$/,''));
const spec=json('data/iyotetsu-namuwiki-rebuild-20261102.json'),lite=fromJs('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const visible=lite.routes.filter(r=>r.operatorId==='iyotetsudo');
const expected=['line-99805','line-99806','line-99807','line-99809-1','line-99809-2','line-99810','line-99811','line-99812'];
assert.deepEqual(visible.map(r=>r.id).sort(),expected.slice().sort(),'Exactly 3 suburban + 5 tram cards required');
assert(!lite.routes.some(r=>r.id==='line-99809'),'Incomplete legacy circular route leaked to picker');
assert.equal(lite.routes.length,608,'Japan national route inventory must grow exactly by one');
const editor=json('data/editor-overrides.json'),byId=new Map(visible.map(r=>[r.id,r]));
const network=new Map;
for(const id of expected){
 const meta=spec.lines[id],card=byId.get(id),route=json('data/generated/routes/'+id+'.json').route;
 network.set(id,route);
 assert(card&&meta, 'Missing '+id);
 assert.equal(route.id,id);
 assert.equal(route.operatorId,'iyotetsudo');
 assert.equal(route.operator.ko,'이요 철도');
 assert.equal(route.line.ko,meta.ko);
 assert.equal(route.line.ja,meta.ja);
 assert.equal(route.lineColor,meta.color);
 assert.equal(card.line.ko,meta.ko);
 assert.equal(card.lineColor,meta.color);
 assert.equal(card.stationCount,route.stations.length);
 assert.equal(card.category,meta.category);
 assert.equal(editor.lines[id]?.ko,meta.ko);
 assert.equal(editor.lines[id]?.color,meta.color);
 assert(card.lazySource.startsWith('./data/generated/routes/'+id+'.json?v='),'Do not hydrate stale workspace chunk: '+id);
 assert(route.geometryReady===true,'No incomplete route allowed '+id);
 assert(route.stations.length>=7);
 assert.equal(route.directedSegments.length,route.stations.length-1,'Disconnected or extra segment: '+id);
 assert(!route.missingSegments?.length,'Track gap on '+id);
 for(let i=0;i<route.directedSegments.length;i++){
  const s=route.directedSegments[i],a=route.stations[i],b=route.stations[i+1];
  assert.equal(s.fromStationId,a.id);
  assert.equal(s.toStationId,b.id);
  assert(s.geometry.length>=2,'Missing track vertices: '+id+'/'+i);
  assert(s.geometry.every(([lat,lon])=>lat>33.5&&lat<34&&lon>132.5&&lon<133),'Off-route map coordinate '+id);
 }
 assert(new Set(route.stations.map(s=>s.id)).size===route.stations.length,'Repeated station ID: '+id);
}
for(const id of ['line-99809-1','line-99809-2']){
 const r=network.get(id);
 assert.equal(r.stations.length,23);
 assert.equal(r.directedSegments.length,22);
 assert.equal(r.loop,true);
 assert.equal(r.oneWay,true,'1 and 2 cannot allow reversed service assignment');
 assert.equal(r.stations[0].ja,'松山市駅');
 assert.equal(r.stations.at(-1).ja,r.stations[0].ja);
 assert.notEqual(r.stations[0].id,r.stations.at(-1).id,'Loop return requires distinct stop occurrence ID');
 assert.equal(r.stations[0].stationMasterId,r.stations.at(-1).stationMasterId);
 assert.equal(r.stations.filter(s=>s.ja==='南堀端').length,2);
 assert.equal(r.services.length,1);
 assert.deepEqual(r.services[0].stops,r.stations.map(s=>s.id));
 assert.equal(r.geometry[0][0],r.geometry.at(-1)[0]);
 assert.equal(r.geometry[0][1],r.geometry.at(-1)[1]);
}
assert.deepEqual(network.get('line-99809-1').stations.map(s=>s.ja),spec.servicePatterns.loop1);
assert.deepEqual(network.get('line-99809-2').stations.map(s=>s.ja),spec.servicePatterns.loop2);
const gunchu=network.get('line-99805'),end=gunchu.stations.at(-1);
assert.equal(end.ja,'郡中港');assert.equal(end.ko,'군츄항');
assert.equal(end.id,'station-iyotetsu-gunchuko');assert.equal(end.stationCode,'IY35');
assert(!gunchu.stations.some(s=>s.ja==='伊予市'),'JR Iyo-shi is a neighboring separate station');
assert.equal(network.get('line-99806').stations.length,10);
assert.equal(network.get('line-99807').stations.length,15);
const city5=network.get('line-99811');
assert.equal(city5.stations[0].ja,'JR松山駅前');
assert.equal(city5.stations[1].ja,'大手町駅前');
const city6=network.get('line-99812');
assert(city6.stations.some(s=>s.id==='station-iyotetsu-honmachi-itchome'&&s.ja==='本町一丁目'));
assert(!city6.stations.some(s=>s.ja==='西堀端'),'Route 6 does not call at Nishi-Horibata');
const shards=['data/shared-stations/stations-37.json','data/shared-stations/stations-43.json'];
const canonical=shards.flatMap(json);
assert(canonical.some(s=>s.id==='station-iyotetsu-gunchuko'&&s.names.ko==='군츄항'));
assert(canonical.some(s=>s.id==='station-iyotetsu-honmachi-itchome'&&s.names.ko==='혼마치잇초메'));
const graph=json('data/generated/japan-transfer-neighbors.json'),neighbors=lite.transferNeighbors;
assert.deepEqual(neighbors,graph.neighbors,'Outdated transfer graph payload');
assert(!neighbors['line-99809'],'Old circular transfer node not removed');
assert(neighbors['line-99809-1']?.length&&neighbors['line-99809-2']?.length,'Separated loops need transfers');
assert.equal(graph.audit.routeCount,lite.routes.length);
const builder=read('tools/build-japan-lazy-catalog.cjs');
assert(builder.includes('iyotetsuPublished')&&builder.includes('newVisibleLoopIds'),
 'Future Japanese rebuild would destroy the new Iyo operating services');
console.log('PASS Iyo railway: 3 suburban + 5 city-tram patterns, both complete circular traversals, corrected stops, name/code/color, transfer graph and rebuild preservation');
