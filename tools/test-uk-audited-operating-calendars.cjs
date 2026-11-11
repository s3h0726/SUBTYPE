'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {applyPublishedWindows}=require('./apply-uk-audited-operating-calendars.cjs');
const root=path.resolve(__dirname,'..'),load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const m=load('data/uk/source/timetables/metrolink-2026-operator-windows.json');
const e=load('data/uk/source/timetables/elizabeth-2026-sampled-journey.json');

test('All 20 Metrolink patterns follow source-backed official service windows',()=>{
 const r=load('data/uk/generated/routes/uk-metrolink.json');
 assert.equal(r.patterns.length,20);
 const groups=r.patterns.map(x=>x.officialSchedule);
 assert(groups.every(Boolean));
 const counts=Object.fromEntries([...new Set(groups.map(g=>g.windowRule))]
   .map(name=>[name,groups.filter(g=>g.windowRule===name).length]));
 assert.deepEqual(counts,{ALL_DAY:10,PART_DAY:6,PEAK_DIRECT:2,OFF_PEAK_VIA_MEDIACITY:2});
 const stationNames=new Map(r.stationCatalog.map(s=>[s.id,s.en]));
 for(const p of r.patterns) {
   const g=p.officialSchedule;
   assert.equal(g.sourceUrl,m.sourceUrl);
   const stops=p.stationIds.map(id=>stationNames.get(id));
   assert(stops.every(Boolean));
   if(g.windowRule==='PEAK_DIRECT')assert(!stops.includes('MediaCityUK'));
   if(g.windowRule==='OFF_PEAK_VIA_MEDIACITY')assert(stops.includes('MediaCityUK'));
   if(['PART_DAY','PEAK_DIRECT'].includes(g.windowRule))assert.deepEqual(g.operatingWindows,m.partDayWindows);
   if(g.windowRule==='OFF_PEAK_VIA_MEDIACITY')assert.deepEqual(g.operatingWindows,m.offPeakWindows);
 }
 assert.equal(r.operatorTimetableScope.operatingHoursGuide.friSat,'06:00–01:00 next day');
 assert.equal(r.serviceCount,20);
});

test('TfL weekday 04:44 Shenfield to 05:27 Liverpool Street matches all 14 stations',()=>{
 const r=load('data/uk/generated/routes/uk-elizabeth.json'),trip=e.journeys[0];
 const p=r.patterns.find(x=>x.id===trip.patternId);
 assert(p);
 const byId=new Map(r.stationCatalog.map(s=>[s.id,s.en]));
 assert.deepEqual(p.stationIds.map(id=>byId.get(id)),trip.stops.map(x=>x[0]));
 assert.deepEqual(p.officialTrainSample.stationTimeSamples,
   trip.stops.map(([station,time])=>({station,time})));
 let prev=-1;
 for(const [,time]of trip.stops){
   const [h,m]=time.split(':').map(Number),total=h*60+m;
   assert(total>prev,'Official train times must increase along stops');
   prev=total;
 }
 assert.equal(p.officialTrainSample.sourceUrl,e.sourceUrl);
 assert.equal(r.patterns.length,19);
 assert.equal(r.patterns.filter(p=>p.officialTrainSample).length,1);
});

test('Production UK choice resolution remains playable for audited Metrolink and Elizabeth trains',async()=>{
 const uk=await import(pathToFileURL(path.join(root,'js/uk-network.js')));
 const integrity=await import(pathToFileURL(path.join(root,'js/route-integrity.js')));
 for(const id of ['uk-metrolink','uk-elizabeth']){
   const r=load('data/uk/generated/routes/'+id+'.json');
   r.ukGeometry=Object.assign({},...r.geometryFiles.map(f=>load(f).segments));
   const choices=uk.ukOperatingChoices(r);
   assert.equal(choices.length,r.patterns.length);
   for(const choice of choices){
     const run=uk.resolveUKChoice(choice,r);
     const result=integrity.auditRouteIntegrity(run.route);
     assert(result.pass,id+':'+choice.id+' '+JSON.stringify(result.errors));
     assert.equal(run.route.directedSegments.length,run.route.stations.length-1);
   }
 }
});

test('Re-application is deterministic and never adds service directions',()=>{
 const first=load('data/uk/generated/routes/uk-metrolink.json').patterns.map(x=>x.id);
 const result=applyPublishedWindows();
 const second=load('data/uk/generated/routes/uk-metrolink.json').patterns.map(x=>x.id);
 assert.deepEqual(second,first);
 assert.deepEqual(result,{metrolinkOperatingPatterns:20,elizabethSampledTrains:1});
});
