'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {readBatches,assembleCanonicalRoutes,validateRoute}=require('./lib/kr-canonical.cjs');
const config=JSON.parse(fs.readFileSync(path.join(root,'data/kr/canonical/arex-short-turns.json'),'utf8'));
const {routes,rejected}=assembleCanonicalRoutes(readBatches(root));
const arex=routes.find(r=>r.id===config.routeId);
test('All 4 operator-backed AREX short-turn paths are valid, without any new geometry',()=>{
 assert(arex,'published airport rail route');
 assert.deepEqual(rejected,[],'canonical validation');
 assert.equal(config.patterns.length,4);
 const used=new Set();
 for(const source of config.patterns){
  const p=arex.verifiedJourneys.find(j=>j.id===source.id);
  const parent=arex.verifiedJourneys.find(j=>j.id===source.parentJourneyId);
  assert(p&&parent,source.id+' parent or pattern missing');
  assert(!used.has(p.id));used.add(p.id);
  assert.equal(p.stations[0].ko,source.fromStation);
  assert.equal(p.stations.at(-1).ko,source.toStation);
  assert.equal(p.stations.length,p.directedSegments.length+1);
  assert.deepEqual(p.service.stops,p.stations.map(s=>s.id));
  assert.equal(p.geometry.length,p.stations.at(-1).geometryIndex+1);
  assert.deepEqual(p.directedSegments.map(s=>s.geometry[0]),parent.directedSegments
   .slice(parent.stations.findIndex(x=>x.ko===source.fromStation),parent.stations.findIndex(x=>x.ko===source.toStation))
   .map(s=>s.geometry[0]));
  assert.equal(p.timetableEvidence.url,source.url);
  assert.equal(p.timetableEvidence.sourceId,source.sourceId);
 }
 assert.deepEqual(validateRoute(arex),[]);
});
test('Only 2 new operator-backed station-board cases, with real weekday times and provenance',()=>{
 const next=config.patterns.filter(p=>p.id.startsWith('kr-arex-geomam-'));
 assert.equal(next.length,2);
 assert.deepEqual(next.map(x=>x.observedDeparture),['05:30','05:08']);
 assert(next.every(x=>x.url.startsWith('https://www.airportrailroad.com/train/normal/info/070')));
 assert(next.every(x=>x.serviceDay==='weekday'));
 assert(next.every(x=>x.corroborationUrl));
});
