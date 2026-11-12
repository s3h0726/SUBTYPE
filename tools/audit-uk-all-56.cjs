'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const out=(name,text)=>fs.writeFileSync(path.join(root,'docs/timetable-audit',name),text,'utf8');
const esc=x=>'"'+String(x??'').replaceAll('"','""')+'"';
function csv(name,keys,rows){out(name,[keys.join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n')+'\n')}
function timeOrder(sample,stops){
 let last=-1;
 for(const [name,time]of sample.calls){
  const at=stops.indexOf(name,last+1);assert(at>last,'Official stop not in game order: '+sample.routeId+' / '+name);last=at;
  assert(/^\d{2}:\d{2}$/.test(time),'Bad timetable time');
 }
}
function audit(){
 const index=read('data/uk/generated/index.json');
 const sources=read('data/uk/source/timetables/uk-56-official-sources.json');
 const samples=read('data/uk/source/timetables/uk-56-train-time-samples.json');
 const elizabeth=read('data/uk/source/timetables/elizabeth-2026-sampled-journey.json');
 const rules=read('data/uk/source/timetables/uk-56-service-day-rules.json');
 assert.equal(index.routes.length,56);assert.equal(sources.routes.length,56);
 const sourceMap=new Map(sources.routes.map(s=>[s.routeId,s]));
 assert.equal(sourceMap.size,56);
 const sampleRows=[...samples.journeys,...elizabeth.journeys.map(x=>({routeId:'uk-elizabeth',patternId:x.patternId,
   day:x.serviceDays,type:'FULL_PATTERN',calls:x.stops,sourceUrl:elizabeth.sourceUrl}))];
 const sampleMap=new Map(sampleRows.map(s=>[s.routeId+'::'+s.patternId,s]));
 assert.equal(sampleMap.size,6);
 const statuses={
  'uk-edinburgh-trams':'EARLY_SHORT_TURN_EVIDENCE',
  'uk-glasgow-subway':'CIRCLE_AND_DAY_RULE_REVIEWED',
  'uk-metrolink':'20_DAY_WINDOWS_REVIEWED',
  'uk-net-hucknall-toton':'LATE_SHORT_TURNS_REVIEWED',
  'uk-net-phoenix-clifton':'LATE_SHORT_TURNS_REVIEWED',
  'uk-tyne-wear-green':'TERMINUS_ONLY_CHECKED',
  'uk-sheffield-yellow':'TERMINI_CHECKED',
  'uk-sheffield-blue':'TERMINI_CHECKED',
  'uk-sheffield-purple':'TERMINI_CHECKED',
  'uk-sheffield-tram-train':'TERMINI_CHECKED',
  'uk-waterloo-city':'WEEKDAY_ONLY_CALENDAR_CHECKED',
  'uk-heathrow-express':'RETURN_DIRECTION_MISSING',
  'uk-avanti-liverpool':'RETURN_DIRECTION_MISSING'
 };
 const missingReturns={
  'uk-heathrow-express':['London Paddington','Heathrow Terminal 5'],
  'uk-avanti-liverpool':['London Euston','Liverpool Lime Street']
 };
 const routeRows=[],patternRows=[],matched=[];
 for(const meta of index.routes){
  const source=sourceMap.get(meta.id);assert(source,'Unmapped official source: '+meta.id);
  assert(/^https:\/\//.test(source.officialUrl));
  const route=read(meta.lazySource);
  assert(route.id===meta.id&&route.patterns.length===meta.serviceCount);
  const byId=new Map(route.stationCatalog.map(s=>[s.id,s.en]));
  let found=0;const endpoints=[];
  for(const p of route.patterns){
   assert(p.stationIds.length>=2&&p.segmentIds.length===p.stationIds.length-1,meta.id);
   assert(p.validation?.trackContinuity===true,meta.id+':'+p.id);
   const stops=p.stationIds.map(id=>byId.get(id));
   assert(stops.every(Boolean),meta.id+':station');
   assert(route.services.some(s=>s.id===p.id),meta.id+':service');
   const sample=sampleMap.get(meta.id+'::'+p.id);
   if(sample){
    timeOrder(sample,stops);found++;
    matched.push({route_id:meta.id,pattern_id:p.id,day:sample.day,printed_stops:sample.calls.length,official_source:sample.sourceUrl||source.officialUrl});
   }
   endpoints.push([stops[0],stops.at(-1)]);
   patternRows.push({country:'UK',route_id:meta.id,pattern_id:p.id,origin:stops[0],destination:stops.at(-1),
    registered_station_calls:stops.length,real_track_segments:p.segmentIds.length,
    structural_validation:'PASS',official_train_time_check:sample?'PUBLISHED_SAMPLE_MATCH':'NOT_TIMETABLE_CERTIFIED',
    official_source:source.officialUrl});
  }
  let gap='';
  if(missingReturns[meta.id]){
   const pair=missingReturns[meta.id];assert(!endpoints.some(x=>x[0]===pair[0]&&x[1]===pair[1]),'Previously missing return now exists');
   gap=pair[0]+' → '+pair[1]+' missing in game; need direction-specific OSM track confirmation';
  }
  routeRows.push({country:'UK',route_id:meta.id,line_name:meta.line?.en,operator:source.operator,
   registered_directions:meta.serviceCount,structure_test:'PASS',timetable_status:found?'TIMED_SAMPLE_MATCH':(statuses[meta.id]||'OFFICIAL_SOURCE_MAPPED_ONLY'),
   official_time_samples:found,official_source_type:source.sourceKind,official_timetable_url:source.officialUrl,
   known_issue:gap,source_notes:source.note,fully_timetable_verified:'NO',checked_at:'2026-11-12'});
 }
 assert.equal(routeRows.length,56);assert.equal(patternRows.length,291);
 assert.equal(matched.length,6);
 for(const rule of rules.rules) {
  const route=read('data/uk/generated/routes/'+rule.routeId+'.json');
  assert.deepEqual(route.officialServiceDayRule?.routeId,rule.routeId);
 }
 csv('UK_ROUTE_AUDIT_56.csv',Object.keys(routeRows[0]),routeRows);
 csv('UK_TIMETABLE_AUDIT_291_DIRECTIONS.csv',Object.keys(patternRows[0]),patternRows);
 csv('UK_OFFICIAL_TRAIN_TIME_SAMPLES.csv',Object.keys(matched[0]),matched);
 const checked=routeRows.filter(x=>x.timetable_status!=='OFFICIAL_SOURCE_MAPPED_ONLY').length;
 const lines=[
  '# UK all 56 railway routes: timetable audit, 12 November 2026','',
  'All **56/56 UK lines** and **291/291 playable directions** were inspected for game station IDs, directed track segments and selectable service identities.',
  'All **56/56** have a named operator or national timetable source; some links are directories or search interfaces rather than dated train-by-train PDF tables.',
  '**Full per-train, per-day timetable certification is 0/56.** Source discovery and real-track validation do not count as full timetable verification.','',
  '| Measure | Result |','|---|---:|','| UK line IDs | 56 |','| Real-track game directions structurally checked | 291 |',
  '| Timetable sources linked | 56 |',
  '| Routes with prior concrete timetable, operating-rule or terminus checks | '+checked+' |',
  '| Published train samples whose stops align with the game | 6 |',
  '| Missing official reverse directions | 2 |','| Fully timetable verified | 0 |','',
  '## Confirmed official schedule sample checks','',
  '| Route | Game pattern | Official schedule calls matched | Source |','|---|---|---:|---|',
  ...matched.map(x=>'| '+x.route_id+' | '+x.pattern_id+' | '+x.printed_stops+' | '+x.official_source+' |'),
  '','## Confirmed omissions and current timetable exceptions','',
  '- Heathrow Express: Paddington → Heathrow Terminal 5 missing in game; opposite direction exists. Reverse real OSM tracks needed.',
  '- Avanti West Coast Liverpool branch: London Euston → Liverpool Lime Street direction missing in game; opposite direction exists.',
  '- Waterloo & City: Monday–Friday 06:00–00:30, no regular weekend or bank holiday train (TfL). Calendar is stored as source metadata, without restricting sandbox gameplay.',
  '- Glasgow Subway: Monday–Saturday 06:30–23:40, Sunday 10:00–18:12. Govan departure first/last for both loops stored (SPT).',
  '- Merseyrail Southport and Chester/Ellesmere Port: autumn amendments overlap this date; May base PDF alone must not be treated as current departure times.',
  '- Lumo: Stevenage is pickup-only northbound and dropoff-only southbound; station list alone does not encode boarding restrictions.',
  '','## Evidence files','',
  '- UK_ROUTE_AUDIT_56.csv: one record for each UK route with operator source and evidence level.',
  '- UK_TIMETABLE_AUDIT_291_DIRECTIONS.csv: all 291 patterns, origins/destinations, real-track checks, train-time sample status.',
  '- UK_OFFICIAL_TRAIN_TIME_SAMPLES.csv: 6 actual timetable column comparisons.',
  '- data/uk/source/timetables/uk-56-official-sources.json: 56 official source URLs.',
  '- data/uk/source/timetables/uk-56-train-time-samples.json: 5 additional actual train samples; one prior TfL Elizabeth sample reused.',
  '','**Required next stage:** extract the full dated weekday/Saturday/Sunday columns from all operator timetable sources and reconcile each of 291 patterns. Do not upgrade incomplete routes to VERIFIED.'
 ];
 out('UK_ALL_56_TIMETABLE_AUDIT.md',lines.join('\n')+'\n');
 const summary={routes:routeRows.length,directions:patternRows.length,officialSources:sourceMap.size,partialRoutes:checked,timedTrainSamples:matched.length,fullyVerified:0};
 console.log(JSON.stringify(summary,null,2));return summary;
}
module.exports={audit};
if(require.main===module)audit();
