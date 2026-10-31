'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateRoute}=require('./lib/kr-canonical.cjs');
const {routes}=require('../data/kr/canonical/rail-batch.json');
test('rail publications pass complete geometry, language and reference gates',()=>{
 assert.ok(routes.length>=20);assert.equal(new Set(routes.map(r=>r.id)).size,routes.length);
 for(const route of routes)assert.deepEqual(validateRoute(route),[],route.id);
 for(const n of [1,2,3,4,5,6,7,8])assert.ok(routes.some(r=>r.id==='kr-rail-seoul-'+n));
});
test('every published geometry edge is an actual source rail edge in its direction',()=>{
 const {ways}=require('../data/kr/canonical/rail-physical-alignments.json'),edges=new Set;
 for(const way of ways)for(let i=1;i<way.coordinates.length;i++){
  const a=JSON.stringify(way.coordinates[i-1]),b=JSON.stringify(way.coordinates[i]);edges.add(a+'|'+b);edges.add(b+'|'+a);
 }
 for(const route of routes)for(const j of route.verifiedJourneys)for(let i=1;i<j.geometry.length;i++)assert.ok(edges.has(JSON.stringify(j.geometry[i-1])+'|'+JSON.stringify(j.geometry[i])),`${route.id}/${j.id}: fabricated edge ${i}`);
});
test('official metro journeys preserve complete official Korean call sequences',()=>{
 const trips=new Map(require('../data/kr/v2/seoulmetro-trip-candidates.json').map(t=>[t.id,t]));
 for(const route of routes.filter(r=>r.id.startsWith('kr-rail-seoul-')))for(const j of route.verifiedJourneys){
  for(const id of j.tripIds){const trip=trips.get(id);assert.ok(trip);assert.deepEqual(j.stations.map(s=>s.ko),trip.calls.map(c=>c.operationalStationName));assert.equal(j.stations[0].ko,trip.originOperationalName);assert.equal(j.stations.at(-1).ko,trip.destinationOperationalName)}
 }
});
test('conventional railway has independent actual tracks in both directions',()=>{
 const route=routes.find(r=>r.id==='kr-rail-gyoe');assert.ok(route);assert.equal(route.mode,'rail');
 assert.deepEqual(route.verifiedJourneys[0].stations.map(s=>s.ko),['대곡','원릉','일영','장흥','송추','의정부']);
 assert.deepEqual(route.verifiedJourneys[1].stations.map(s=>s.ko),['의정부','송추','장흥','일영','원릉','대곡']);
 assert.notDeepEqual(route.verifiedJourneys[0].geometry,route.verifiedJourneys[1].geometry.slice().reverse());
});
test('high-speed route uses a complete current official train and exact actual source edges',()=>{
 const {routes:highspeed}=require('../data/kr/canonical/rail-highspeed-batch.json');
 const official=require('../data/kr/canonical/rail-ktx-official-patterns.json');
 const {ways}=require('../data/kr/canonical/rail-highspeed-physical-alignments.json');
 const edges=new Set;for(const way of ways)for(let i=1;i<way.coordinates.length;i++){
  const a=JSON.stringify(way.coordinates[i-1]),b=JSON.stringify(way.coordinates[i]);edges.add(a+'|'+b);edges.add(b+'|'+a);
 }
 const route=highspeed[0];assert.equal(route.mode,'high_speed_rail');
 for(const j of route.verifiedJourneys){
  for(const tripId of j.tripIds){const trip=official.trips.find(t=>t.id===tripId);assert.ok(trip);assert.equal(trip.calendar,'매일');assert.deepEqual(j.stations.map(s=>s.ko),trip.calls.map(c=>c.ko));}
  assert.equal(j.stations[0].ko,'용산');assert.equal(j.stations.at(-1).ko,'목포');assert.ok(j.stations.some(s=>s.ko==='광주송정'));
  for(let i=1;i<j.geometry.length;i++)assert.ok(edges.has(JSON.stringify(j.geometry[i-1])+'|'+JSON.stringify(j.geometry[i])));
 }
 assert.ok(route.geometryEvidence.maximumSourceEdgeKm<5);assert.equal(route.geometryEvidence.sparseSourceEdges.length,6);
});
