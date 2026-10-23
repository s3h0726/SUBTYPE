const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {compile,assemble,validate}=require('./lib/kr-network');
// Synthetic fixtures only: these are not South Korean railway data and are never
// written to source/generated catalogs. Each opposite direction is explicit.
function fixture(){
 const d={operators:[{id:'op',names:{ko:'테스트',en:'Test'},verification:'verified'}],infrastructure:[],stations:[],stops:[], 'passenger-lines':[{id:'line',names:{ko:'시험선',en:'Fixture'},status:'verified',color:'#123456',regionId:'test'}],services:[],trips:[],geometry:[],sources:[],reviews:[],assets:[], 'station-signs':[],coverage:{asOf:'2026-10-15',status:'verified',officialPassengerLineIds:['line'],officialServiceIds:['out','in'],sourceIds:['inventory']}};
 d.assets.push({id:'logo',kind:'operator',operatorId:'op',verified:true,sourceUrl:'https://example.invalid/logo',license:'fixture-only',asset:'fixture.svg'});
 for(const [id,kind] of [['osm','osm'],['timetable','official-timetable'],['station','official-stations'],['inventory','official-national-inventory']])d.sources.push({id,kind,license:'fixture-only',licenseStatus:'verified',url:'https://example.invalid/'+id,publisher:'Fixture',validFrom:'2026-01-01',files:[{path:'fixture.json',sha256:'0'.repeat(64)}]});
 const points=[[37,127],[37.001,127.001],[37.002,127],[37.003,127.001]];
 d.geometry.push({id:'g',nodeIds:['1','2','3','4'],coordinates:points,sourceRef:{sourceId:'osm',id:'1'}});
 for(const [i,n] of ['가','나','다','라'].entries()){d.stations.push({id:'s'+i,names:{ko:n+'역',en:'Fixture '+i},status:'verified',transferStationIds:[]});d.stops.push({id:'p'+i,stationId:'s'+i,verification:'verified',numberingNotApplicable:true,platformCode:'1',osmNodeId:String(i+1),coordinates:{lat:points[i][0],lon:points[i][1]}})}
 for(const [id,reverse] of [['out',false],['in',true]]){
  const calls=reverse?[{stopId:'p3',geometryIndex:0},{stopId:'p0',geometryIndex:3}]:[{stopId:'p0',geometryIndex:0},{stopId:'p3',geometryIndex:3}];
  const s={id,passengerLineId:'line',names:{ko:'시험 급행',en:'Fixture express'},operatorIds:['op'],directionId:id,paths:[{geometryId:'g',reverse}],stops:calls};d.services.push(s);
  d.trips.push({id:'trip-'+id,serviceId:id,status:'verified',sourceIds:['timetable'],validFrom:'2026-01-01',operatingDays:['thu'],stopIds:calls.map(s=>s.stopId)});
  const length=assemble(s,validate(d).maps).lengthKm;
  d.reviews.push({id:'review-'+id,serviceId:id,status:'verified',timetableSourceIds:['timetable'],stationSourceIds:['station'],trackDirectionVerified:true,validFrom:'2026-01-01',officialDistanceKm:length});
 }
 return d;
}
test('directional services compile without creating reverse or local services',()=>{const d=fixture(),r=compile(d);assert.equal(r.status,'COMPLETE');assert.equal(r.routes.length,1);assert.equal(r.routes[0].verifiedJourneys.length,2);assert.equal(r.routes[0].verifiedJourneys[0].stations.length,2);assert.equal(r.routes[0].verifiedJourneys[0].geometry.length,4);d.services.pop();d.trips.pop();d.reviews.pop();assert.equal(compile(d).routes[0].verifiedJourneys.length,1);assert.equal(compile(d).status,'INCOMPLETE')});
test('unreviewed OSM topology cannot publish',()=>{const d=fixture();d.reviews=[];const r=compile(d);assert.equal(r.routes.length,0);assert.equal(r.blocked.length,2)});
test('future and expired timetable evidence cannot publish',()=>{for(const field of ['validFrom','validUntil']){const d=fixture();d.sources.find(s=>s.id==='timetable')[field]=field==='validFrom'?'2026-11-01':'2026-10-14';assert.equal(compile(d).routes.length,0)}});
test('different train stops cannot be inferred from a timetable',()=>{const d=fixture();d.trips[0].stopIds=['p0','p1','p3'];assert.equal(compile(d).counts.releasedServices,1)});
test('duplicate IDs and missing references fail validation',()=>{const d=fixture();d.stations.push(d.stations[0]);d.services[0].stops[0].stopId='absent';const r=compile(d);assert.equal(r.status,'INVALID');assert(r.errors.some(e=>e.code==='MISSING_REFERENCE'));assert(r.errors.some(e=>e.code==='DUPLICATE_OR_MISSING_ID'))});
test('track gaps are not bridged or snapped',()=>{const d=fixture();d.geometry.push({...d.geometry[0],id:'gap',nodeIds:['99','100'],coordinates:[[37.0030001,127.001],[37.004,127]]});d.services[0].paths.push({geometryId:'gap',reverse:false});assert(compile(d).blocked[0].reasons.includes('DISCONNECTED_TRACK'))});
test('station offsets must match source nodes and visit order',()=>{for(const [mutation,remaining] of [[d=>d.services[0].stops[1].geometryIndex=0,1],[d=>d.stops[0].osmNodeId='wrong',0]]){const d=fixture();mutation(d);assert.equal(compile(d).counts.releasedServices,remaining)}});
test('national totals cannot be declared complete without an official inventory',()=>{const d=fixture();d.coverage.sourceIds=[];assert.equal(compile(d).status,'INCOMPLETE')});
test('excluded research cannot publish or satisfy the official national service inventory',()=>{
 const d=fixture();d.services.push({...d.services[0],id:'research',access:{passengerCandidate:false,classification:'REJECTED_ROAD',reason:'road'}});
 let r=compile(d);assert.equal(r.status,'COMPLETE');assert.equal(r.counts.excludedServices,1);assert.equal(r.counts.releasedServices,2);assert.equal(r.excluded[0].serviceId,'research');
 d.coverage.officialServiceIds.push('research');assert.equal(compile(d).status,'INCOMPLETE');
});
test('rail and road co-tagging remains blocked despite otherwise complete release evidence',()=>{const d=fixture();d.infrastructure=[{id:'road-conflict',geometryId:'g',highway:'track'}];const r=compile(d);assert.equal(r.routes.length,0);assert(r.blocked.every(b=>b.reasons.includes('ROAD_OR_AMBIGUOUS_RAIL_ROAD_WAY')))});
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function context(){const c={console,clearInterval,clearTimeout,queueMicrotask,renderGameMap(){},$(){return{hidden:false}},globalThis:null};c.globalThis=c;vm.createContext(c);require('./lib/test-kr-access-context.cjs')(c);return c}
test('runtime keeps exact directions, rejects invented destinations, preserves express track',()=>{const c=context();vm.runInContext(read('js/korean-service-resolver.js').replace(/export /g,'')+';globalThis.api={koreanVerifiedChoices,resolveKoreanVerifiedChoice}',c);const route=compile(fixture()).routes[0],choices=c.api.koreanVerifiedChoices(route);assert.equal(choices.length,2);for(const choice of choices){const r=c.api.resolveKoreanVerifiedChoice(choice,route);assert.equal(r.direction,'forward');assert.equal(r.route.geometry.length,4);assert.equal(r.service.stops.length,2);assert.throws(()=>c.api.resolveKoreanVerifiedChoice({...choice,destinationId:'s1'},route))}});
test('actual Game advancement and finish run exactly once in both explicit directions',()=>{
 const c=context();vm.runInContext(read('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/^export\s+/gm,'')+';globalThis.GameTest=Game',c);const p=c.GameTest.prototype;
 for(const j of compile(fixture()).routes[0].verifiedJourneys){let finishes=0,result;const sim={finished:false,paused:false,phase:'ARRIVING',index:0,sequence:j.stations,boarding:true,mapRoute:{},route:{id:'fixture',line:{ko:'시험선'}},options:{mode:'complete'},targetStation:p.targetStation,currentStation:p.currentStation,routeIndex(){return this.index},mapOptions(){return{}},advanceToNextStation:p.advanceToNextStation,visitedStationIds:[],typedStationIds:[],elapsed(){return 0},finish:p.finish,renderStation(){},updateHud(){},syncDebug(){},metrics(){return{}},onFinish(r){finishes++;result=r}};
  for(let i=0;i<j.stations.length;i++){sim.typedStationIds.push(j.stations[i].id);sim.phase='ARRIVING';p.advance.call(sim)}
  p.finish.call(sim);p.advance.call(sim);assert.equal(finishes,1);assert.equal(result.routeIntegrity,true);assert.equal(sim.index,j.stations.length-1);
 }
});
test('normalization never manufactures an all-stops service for v2',()=>{const c=context();vm.runInContext(read('js/data-loader.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.normalizeTest=normalizeLine',c);const r=compile(fixture()).routes[0];const n=c.normalizeTest(r);assert.equal(n.services.length,2);assert(!n.services.some(s=>s.id==='local'))});
test('omitted source stops cannot make a partial route releasable',()=>{const d=fixture();d.services[0].issues=[{code:'STOP_NOT_ON_ORDERED_TRACK',nodeId:'unknown'}];assert(compile(d).blocked[0].reasons.includes('UNRESOLVED_IMPORT_TOPOLOGY'))});
test('candidate trains and unverified platform metadata cannot release',()=>{const d=fixture();d.trips[0].status='candidate';d.stops[3].verification='candidate';assert.equal(compile(d).routes.length,0)});

test('a review flag cannot authorize running against source one-way track',()=>{
 for(const oneway of ['yes','-1']){const d=fixture();d.infrastructure=[{id:'track',geometryId:'g',oneway}];const r=compile(d);assert.equal(r.counts.releasedServices,1);assert(r.blocked[0].reasons.includes('ONEWAY_DIRECTION_CONFLICT'))}
});
test('expired national inventory does not certify coverage',()=>{const d=fixture();d.sources.find(s=>s.id==='inventory').validUntil='2026-10-14';assert.equal(compile(d).status,'INCOMPLETE')});
test('timetable matching preserves identity ambiguity and never approves a train',()=>{const {match}=require('./match-kr-timetables');const d=fixture(),t={tripCandidates:[{id:'t',sourceId:'timetable',sheet:'fixture',originOperationalName:'가역',destinationOperationalName:'라역',calls:[{operationalStationName:'가역'},{operationalStationName:'라역'}]}]};let r=match(d,t);assert.equal(r.counts.exactUnambiguousPatterns,1);assert.equal(r.releasedTrips,0);d.services.push({...d.services[0],id:'duplicate-path'});r=match(d,t);assert.equal(r.counts.ambiguousPatterns,1);t.tripCandidates[0].calls[0].operationalStationName='가';assert.equal(match(d,t).counts.unmatchedPatterns,1)});
test('real game route resolver preserves express geometry and repeated loop station visits',()=>{
 const c=context();vm.runInContext(read('js/route-integrity.js').replace(/export /g,'')+';globalThis.resolveTest=resolvePlayableRoute',c);
 for(const journey of compile(fixture()).routes[0].verifiedJourneys){const r=c.resolveTest({id:'fixture',countryId:'kr',geometryReady:true,...journey},{service:journey.service});assert.equal(r.stations.length,2);assert.equal(r.geometry.length,4);assert.equal(r.segments.length,1);assert.equal(r.segments[0].endpointMismatch,false)}
 const d=fixture(),g=d.geometry[0];g.nodeIds.push(g.nodeIds[0]);g.coordinates.push(g.coordinates[0]);d.services[0].stops=[{stopId:'p0',geometryIndex:0},{stopId:'p3',geometryIndex:3},{stopId:'p0',geometryIndex:4}];
 const j=assemble(d.services[0],validate(d).maps),r=c.resolveTest({id:'loop',countryId:'kr',geometryReady:true,...j});assert.deepEqual(Array.from(r.stations,s=>s.id),['s0','s3','s0']);assert.equal(r.segments.length,2);assert.equal(r.geometry.length,5);
});
test('official station matching does not merge same-name places or assign approvals',()=>{const {matchStations}=require('./match-kr-stations'),ref=[{id:'official',names:{ko:'시험역'},coordinates:{lat:37,lon:127}}],stations=[{id:'near',names:{ko:'시험역'},coordinates:{lat:37.001,lon:127}},{id:'far',names:{ko:'시험역'},coordinates:{lat:38,lon:127}}];let r=matchStations(ref,stations);assert.equal(r.approved,0);assert.deepEqual(r.matches[0].candidates.map(c=>c.stationId),['near']);stations.push({...stations[0],id:'other-platform'});assert.equal(matchStations(ref,stations).counts.ambiguousRows,1);ref[0].coordinates.lat=null;assert.equal(matchStations(ref,stations).matches[0].reviewRequired,'INVALID_OFFICIAL_COORDINATE')});

test('returning to a loop station uses the later map visit and adjacent segment',()=>{
 const c=context();vm.runInContext(read('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/^export\s+/gm,'')+';globalThis.GameTest=Game',c);
 const p=c.GameTest.prototype,visits=[{id:'a'},{id:'b'},{id:'a'},{id:'c'}];
 const game={mapRoute:{stations:visits},sequence:visits,index:2,boarding:false,options:{},serviceStops:new Set(['a','b','c']),routeIndex:p.routeIndex,currentStation:p.currentStation,targetStation:p.targetStation};
 assert.equal(p.routeIndex.call(game,visits[2]),2);assert.equal(p.mapOptions.call(game).previousRouteIndex,1);assert.equal(p.mapOptions.call(game).nextRouteIndex,3);
 assert.equal(p.routeIndex.call(game,visits[0]),0);
});

test('Korean journey identity and directions survive records and display endpoints',()=>{
 const c=context();c.isCountryEnabled=()=>true;c.canonicalRouteId=id=>id;c.escapeHtml=s=>String(s).replace(/</g,'&lt;');c.formatTime=()=>'';
 vm.runInContext(read('js/korean-service-resolver.js').replace(/export /g,'')+';globalThis.api={koreanVerifiedChoices,resolveKoreanVerifiedChoice}',c);
 vm.runInContext(read('js/storage.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.store=storage',c);
 const route=compile(fixture()).routes[0];
 for(const choice of c.api.koreanVerifiedChoices(route)){
  const r=c.api.resolveKoreanVerifiedChoice(choice,route);
  assert.equal(r.journeyId,choice.id);assert.equal(r.journey.directionId,choice.direction);
  c.store.saveResult({route:r.route,routeId:r.route.id,serviceJourneyId:r.journeyId,options:{serviceJourney:r.journey},directionId:r.journey.directionId,destinationStationId:r.destinationStationId,originStationId:r.journey.originStationId,elapsed:1000,accuracy:100,cpm:100,maxCombo:1,completed:2,color:'#123456'});
 }
 const records=c.store.records();assert.equal(Object.keys(records).length,2);assert.equal(records.out.directionId,'out');assert.equal(records.in.directionId,'in');assert.equal(records.out.destinationName,'라역');assert.equal(records.in.destinationName,'가역');
 const elements=new Map();c.$=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id)};c.railDataRepository={getLine(){return{names:{ko:'시험선'}}},getRoute(){return route}};
 vm.runInContext(read('js/utils.js').slice(read('js/utils.js').indexOf('export const koreanStationDisplayName'),read('js/utils.js').indexOf('export const normalize')).replace(/export /g,''),c);
 vm.runInContext(read('js/statistics.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.renderStatsTest=renderStats',c);c.renderStatsTest();
 assert(elements.get('#records-table').innerHTML.includes('가 → 라'));assert(elements.get('#records-table').innerHTML.includes('라 → 가'));
});
