'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {SHORT_TURNS,applyShortTurns}=require('./apply-uk-verified-shortturns.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const index=read('data/uk/generated/index.json');

test('all seven UK timetable short turns are present with real parent segments, times, and no invented stations',()=>{
 const ids=new Set,routeCounts=new Map();
 for(const spec of SHORT_TURNS){
  const route=read('data/uk/generated/routes/'+spec.routeId+'.json');
  const names=new Map(route.stationCatalog.map(s=>[s.id,s.en]));
  const id='uk-tt-'+spec.serviceKey;
  assert(!ids.has(id));ids.add(id);
  const pattern=route.patterns.find(p=>p.id===id),parent=route.patterns.find(p=>p.id===spec.parentId);
  assert(pattern&&parent,id);
  const start=parent.stationIds.findIndex(s=>names.get(s)===spec.from);
  const end=parent.stationIds.findIndex(s=>names.get(s)===spec.to);
  assert(start>=0&&end>start);
  assert.deepEqual(pattern.stationIds,parent.stationIds.slice(start,end+1));
  assert.deepEqual(pattern.segmentIds,parent.segmentIds.slice(start,end));
  assert.equal(pattern.segmentIds.length,pattern.stationIds.length-1);
  assert.equal(pattern.evidence.timetableEvidence.mondayToSaturday,spec.timeMonSat);
  assert.equal(pattern.evidence.timetableEvidence.sunday,spec.timeSunday);
  assert.equal(pattern.evidence.officialUrl,spec.url);
  assert.equal(pattern.validation.trackContinuity,true);
  assert(route.services.some(x=>x.id===id));
  routeCounts.set(route.id,route.patterns.length);
 }
 assert.equal(ids.size,7);
 for(const [id,count] of routeCounts){
  assert.equal(index.routes.find(r=>r.id===id).serviceCount,count);
 }
 const validation=read('data/uk/generated/validation.json');
 assert.equal(validation.playableDirections,index.routes.reduce((n,r)=>n+r.serviceCount,0));
 assert.equal(validation.lines,index.routes.length);
});

test('published UK short turns resolve and pass route-integrity on the actual track',async()=>{
 const uk=await import(pathToFileURL(path.join(root,'js/uk-network.js')));
 const integrity=await import(pathToFileURL(path.join(root,'js/route-integrity.js')));
 for(const routeId of [...new Set(SHORT_TURNS.map(s=>s.routeId))]){
  const route=read('data/uk/generated/routes/'+routeId+'.json');
  route.ukGeometry=Object.assign({},...route.geometryFiles.map(f=>read(f).segments));
  const choices=uk.ukOperatingChoices(route);
  assert.equal(choices.length,index.routes.find(r=>r.id===routeId).serviceCount);
  for(const spec of SHORT_TURNS.filter(s=>s.routeId===routeId)){
   const choice=choices.find(c=>c.id==='uk-tt-'+spec.serviceKey);
   assert(choice);
   const resolved=uk.resolveUKChoice(choice,route);
   assert.equal(resolved.route.stations[0].en,spec.from);
   assert.equal(resolved.route.stations.at(-1).en,spec.to);
   assert.equal(resolved.route.directedSegments.length,resolved.route.stations.length-1);
   const audit=integrity.auditRouteIntegrity(resolved.route);
   assert(audit.pass,JSON.stringify({routeId,service:choice.id,errors:audit.errors}));
  }
 }
});

test('SPT Glasgow official 15-stop outer and inner circle orders match game data',()=>{
 const r=read('data/uk/generated/routes/uk-glasgow-subway.json');
 const st=new Map(r.stationCatalog.map(s=>[s.id,s.en]));
 const outer=['Govan','Partick','Kelvinhall','Hillhead','Kelvinbridge','St Georges Cross',
   'Cowcaddens','Buchanan Street','St Enoch','Bridge Street','West Street','Shields Road',
   'Kinning Park','Cessnock','Ibrox','Govan'];
 const inner=['Govan','Ibrox','Cessnock','Kinning Park','Shields Road','West Street',
   'Bridge Street','St Enoch','Buchanan Street','Cowcaddens','St Georges Cross',
   'Kelvinbridge','Hillhead','Kelvinhall','Partick','Govan'];
 assert.deepEqual(r.patterns.find(p=>p.id==='uk-osm-225658').stationIds.map(x=>st.get(x)),outer);
 assert.deepEqual(r.patterns.find(p=>p.id==='uk-osm-7734172').stationIds.map(x=>st.get(x)),inner);
});

test('rerunning the short turn builder is idempotent',()=>{
 const before=SHORT_TURNS.map(s=>read('data/uk/generated/routes/'+s.routeId+'.json').patterns.length);
 applyShortTurns(path.join(root,'data/uk'),index);
 const after=SHORT_TURNS.map(s=>read('data/uk/generated/routes/'+s.routeId+'.json').patterns.length);
 assert.deepEqual(after,before);
});
