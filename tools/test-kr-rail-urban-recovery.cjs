'use strict';
// 임시승강장 방향 전체를 동일 원본 선로 노드·정차 관계와 독립 대조한다.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {load,validate}=require('./lib/kr-network'),{validateRoute}=require('./lib/kr-canonical.cjs');
const data=load('data/kr/v2'),maps=validate(data,{base:'data/kr/v2'}).maps,route=JSON.parse(fs.readFileSync('data/kr/canonical/rail-urban-recovery-batch.json')).routes[0],trip=route.verifiedJourneys[0],source=data.services.find(s=>s.id===trip.sourcePatternId);
assert.deepEqual(validateRoute(route),[]);const coords=[],nodes=[];
for(const p of source.paths){const g=maps.geometry.get(p.geometryId),ps=p.reverse?g.coordinates.slice().reverse():g.coordinates,ns=p.reverse?g.nodeIds.slice().reverse():g.nodeIds;if(nodes.length)assert.equal(nodes.at(-1),ns[0]);nodes.push(...ns.slice(coords.length?1:0));coords.push(...ps.slice(coords.length?1:0));}
assert.deepEqual(trip.geometry,coords);assert.equal(trip.stations.length,16);assert.equal(trip.stations.at(-1).ko,'차량기지 임시승강장');assert.equal(nodes.at(-1),'9221654398');
const raw=JSON.parse(fs.readFileSync('data/kr/v2/source/osm-nodes.json')).find(n=>n.id===nodes.at(-1));assert.equal(raw.tags.railway,'stop');assert.deepEqual(coords.at(-1),[raw.lat,raw.lon]);
for(const s of trip.stations)assert.equal(nodes[s.geometryIndex],s.platformId.replace('kr-osm-stop-',''));
assert.deepEqual(trip.stations.slice(0,-1).map(s=>s.sourceStopId),source.stops.map(s=>s.stopId));
console.log(JSON.stringify({passed:true,directions:1,stations:16,points:coords.length,scope:'원본 노드 연결·전체 정차 관계·선형 대조, 추가 시간표 확인 없음'}));
