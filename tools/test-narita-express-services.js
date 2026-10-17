#!/usr/bin/env node
// Guard N'EX stop patterns from reintroducing an impossible Ofuna -> Shinjuku chain.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const canonical=JSON.parse(fs.readFileSync(path.join(root,'data/lines/jr-east/narita-express/line.json'),'utf8'));
const generated=JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes/line-11328.json'),'utf8')).route;
const ids=new Set(generated.stations.map(s=>s.id));
const stationById=new Map(generated.stations.map(s=>[s.id,s.ja]));
const codes=['nex-shinjuku','nex-ofuna'];
assert.deepEqual(canonical.services.map(s=>s.id).sort(),codes.sort());
for(const service of canonical.services){
  assert(service.stopPattern.every(id=>ids.has(id)),service.id+': missing station ID');
  assert.equal(new Set(service.stopPattern).size,service.stopPattern.length,service.id+': duplicate stop');
  assert.equal(service.stopPattern.at(-1),'station-1132705',service.id+': wrong airport terminal');
  assert(service.actualTrainExamples.length>=2,service.id+': missing timetable examples');
}
const nameOrder=id=>canonical.services.find(s=>s.id===id).stopPattern.map(id=>stationById.get(id));
const shinjuku=nameOrder('nex-shinjuku'),ofuna=nameOrder('nex-ofuna');
assert(shinjuku.includes('渋谷'));
assert(!shinjuku.includes('品川'), 'Shinjuku branch must not stop at Shinagawa');
assert(ofuna.includes('品川'));
assert(!ofuna.includes('渋谷'), 'Ofuna branch must not stop at Shibuya');
assert.equal(shinjuku.at(0),'新宿');assert.equal(ofuna.at(0),'大船');
assert(shinjuku.includes('東京')&&ofuna.includes('東京'));
assert.equal(canonical.legacy.playabilityStatus,'BRANCHED_ROUTE_GEOMETRY_REQUIRES_RECONSTRUCTION');
console.log(JSON.stringify({status:'PASS',serviceIds:codes,timetableExamples:canonical.services.reduce((n,s)=>n+s.actualTrainExamples.length,0),geometry:'PENDING_PHYSICAL_BRANCH_RECONSTRUCTION'},null,2));
