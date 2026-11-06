'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {validateRoute,distance}=require('./lib/kr-canonical.cjs'),{projection}=require('./lib/kr-road-binding.cjs');
const dir=path.resolve(__dirname,'../data/kr/canonical'),batchFile=process.argv.find(a=>a.startsWith('--batch='))?.slice(8)||(process.argv.includes('--network')?'rail-network-recovery-batch.json':'rail-expansion-batch.json'),batch=JSON.parse(fs.readFileSync(path.join(dir,batchFile),'utf8'));
const ways=new Map(JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/source/osm-ways.json'),'utf8')).map(w=>[String(w.id),w]));
// 승강장 복구에서 측선은 원본 여객 정차 관계가 직접 사용한 선로만 허용한다.
const passengerWays=new Set(JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/services.json'),'utf8')).filter(s=>s.status!=='excluded'&&s.access?.passengerCandidate!==false).flatMap(s=>(s.paths||[]).map(p=>p.geometryId.replace('kr-geometry-',''))));
const vm=require('node:vm'),runtime=vm.createContext({console,Intl,Date,Set,Map,Math,Number,JSON,hongKongRouteBlockReason:()=>null});
for(const file of ['js/korean-service-resolver.js','js/route-integrity.js'])vm.runInContext(fs.readFileSync(file,'utf8').replace(/^import[^;]+;/gm,'').replace(/\bexport\s+/g,''),runtime);
let journeys=0,edges=0;
const aliases=Function('return '+fs.readFileSync(path.join(__dirname,'kr-rail-expansion.cjs'),'utf8').match(/const aliases=(\{[^\n]+\});/)[1])();
const clean=n=>String(n||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/^(?:[1-9]호선|경춘선|교외선|경의중앙선|서해선|기차역)\s*/,'').replace(/기차역/g,'').replace(/역$/,'').replace(/\s+/g,'');
const key=n=>clean(aliases[clean(n)]||n);
const officialTripRows=[
 ...JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/seoulmetro-trip-candidates.json'),'utf8')),
 ...JSON.parse(fs.readFileSync(path.resolve(dir,'../v2/timetable-candidates.json'),'utf8')).tripCandidates,
 ...JSON.parse(fs.readFileSync(path.join(dir,'rail-expansion-official-patterns.json'),'utf8')).trips
];
const officialTrips=new Map;for(const t of officialTripRows){if(!officialTrips.has(t.id))officialTrips.set(t.id,[]);officialTrips.get(t.id).push(t)}
for(const route of batch.routes){assert.deepEqual(validateRoute(route),[],route.id);for(const journey of route.verifiedJourneys){
 if(journey.officialPatternReferences){const source=JSON.parse(fs.readFileSync(path.join(dir,'rail-expansion-official-patterns.json'),'utf8')).trips;for(const ref of journey.officialPatternReferences){const original=source[ref.sourceRecordIndex];assert.equal(original.id,ref.tripId);assert.equal(original.sourceId,ref.sourceId);assert.equal(JSON.stringify(original.calls.map(c=>key(c.ko))),JSON.stringify(journey.stations.map(s=>key(s.ko))));}}
 assert.equal(journey.sourceEdgeRefs.length,journey.geometry.length-1);assert(journey.tripIds.length);
 for(const id of journey.tripIds){const candidates=officialTrips.get(id);assert(candidates?.length,'missing official train');const calls=JSON.stringify(journey.stations.map(s=>key(s.ko)));assert(candidates.some(t=>JSON.stringify(t.calls.map(c=>key(c.ko||c.operationalStationName)))===calls),id+' complete stop sequence');}
 for(let i=0;i<journey.sourceEdgeRefs.length;i++){
  const proof=journey.sourceEdgeRefs[i],way=ways.get(String(proof.wayId));assert(way,'unknown physical source way');
  assert(!['yard','spur'].includes(way.tags?.service)||(batchFile==='rail-platform-recovery-batch.json'&&passengerWays.has(way.id)),'여객 근거 없는 측선');assert(['rail','subway','light_rail','monorail','narrow_gauge'].includes(way.tags?.railway));
  const a=way.nodeIds.indexOf(String(proof.fromNodeId)),b=way.nodeIds.indexOf(String(proof.toNodeId));assert(a>=0&&Math.abs(a-b)===1,'non-adjacent source nodes');
  const from=projection(journey.geometry[i],way.coordinates[a],way.coordinates[b]),to=projection(journey.geometry[i+1],way.coordinates[a],way.coordinates[b]);assert(from.offset<1e-7&&to.offset<1e-7,'invented railway edge');
  if(way.tags.oneway==='yes')assert(to.t>=from.t);if(way.tags.oneway==='-1')assert(to.t<=from.t);edges++;
 }
 for(const stop of journey.stations)assert(distance([stop.latitude,stop.longitude],journey.geometry[stop.geometryIndex])<=.15);
 runtime.route={...route,canonicalContract:'kr-canonical-v1'};runtime.jid=journey.id;
 vm.runInContext("{const choice=koreanVerifiedChoices(route).find(c=>c.id===jid);const actual=resolveKoreanVerifiedChoice(choice,route);globalThis.result=resolvePlayableRoute(actual.route,{direction:'forward',service:actual.service});}",runtime);
 assert.equal(JSON.stringify(runtime.result.stations.map(s=>s.id)),JSON.stringify(journey.stations.map(s=>s.id)),'게임 경로 정차열');assert(!runtime.result.fallbackGeometry);assert.equal(runtime.result.segments.length,journey.stations.length-1);
 journeys++;
}}
console.log(JSON.stringify({passed:true,records:batch.routes.length,journeys,edges,checks:['actual original railway edges','source one-way rules','actual station positions','complete official journey references']}));
