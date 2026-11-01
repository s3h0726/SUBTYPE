'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {validateRoute,distance}=require('./lib/kr-canonical.cjs'),{projection}=require('./lib/kr-road-binding.cjs');
const dir=path.resolve(__dirname,'../data/kr/canonical'),batch=JSON.parse(fs.readFileSync(path.join(dir,'rail-expansion-batch.json'),'utf8'));
const ways=new Map(JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/source/osm-ways.json'),'utf8')).map(w=>[String(w.id),w]));
let journeys=0,edges=0;
const aliases=Function('return '+fs.readFileSync(path.join(__dirname,'kr-rail-expansion.cjs'),'utf8').match(/const aliases=(\{[^\n]+\});/)[1])();
const clean=n=>String(n||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/^(?:[1-9]호선|경춘선|교외선|경의중앙선|서해선|기차역)\s*/,'').replace(/기차역/g,'').replace(/역$/,'').replace(/\s+/g,'');
const key=n=>clean(aliases[clean(n)]||n);
const officialTrips=new Map([
 ...JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/seoulmetro-trip-candidates.json'),'utf8')),
 ...JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/timetable-candidates.json'),'utf8')).tripCandidates,
 ...JSON.parse(fs.readFileSync(path.join(dir,'rail-expansion-official-patterns.json'),'utf8')).trips
].map(t=>[t.id,t]));
for(const route of batch.routes){assert.deepEqual(validateRoute(route),[],route.id);for(const journey of route.verifiedJourneys){
 assert.equal(journey.sourceEdgeRefs.length,journey.geometry.length-1);assert(journey.tripIds.length);
 for(const id of journey.tripIds){const t=officialTrips.get(id);assert(t,'missing official train');assert.deepEqual(journey.stations.map(s=>key(s.ko)),t.calls.map(c=>key(c.ko||c.operationalStationName)),id+' complete stop sequence');}
 for(let i=0;i<journey.sourceEdgeRefs.length;i++){
  const proof=journey.sourceEdgeRefs[i],way=ways.get(String(proof.wayId));assert(way,'unknown physical source way');
  assert(!['yard','spur'].includes(way.tags?.service));assert(['rail','subway','light_rail','monorail','narrow_gauge'].includes(way.tags?.railway));
  const a=way.nodeIds.indexOf(String(proof.fromNodeId)),b=way.nodeIds.indexOf(String(proof.toNodeId));assert(a>=0&&Math.abs(a-b)===1,'non-adjacent source nodes');
  const from=projection(journey.geometry[i],way.coordinates[a],way.coordinates[b]),to=projection(journey.geometry[i+1],way.coordinates[a],way.coordinates[b]);assert(from.offset<1e-7&&to.offset<1e-7,'invented railway edge');
  if(way.tags.oneway==='yes')assert(to.t>=from.t);if(way.tags.oneway==='-1')assert(to.t<=from.t);edges++;
 }
 for(const stop of journey.stations)assert(distance([stop.latitude,stop.longitude],journey.geometry[stop.geometryIndex])<=.15);
 journeys++;
}}
console.log(JSON.stringify({passed:true,records:batch.routes.length,journeys,edges,checks:['actual original railway edges','source one-way rules','actual station positions','complete official journey references']}));
