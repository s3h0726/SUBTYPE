'use strict';
/* The published operator schedule rules supplement, rather than replace,
   UK OSM real-track operating patterns. No new journeys, dates, or tracks
   are fabricated. Safe/idempotent on repeated UK catalogue rebuild. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),uk=path.join(root,'data/uk');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v)+'\n');
function applyPublishedWindows(dir=uk){
 const met=read(path.join(dir,'source/timetables/metrolink-2026-operator-windows.json'));
 const eli=read(path.join(dir,'source/timetables/elizabeth-2026-sampled-journey.json'));
 const mfile=path.join(dir,'generated/routes/uk-metrolink.json');
 const efile=path.join(dir,'generated/routes/uk-elizabeth.json');
 const route=read(mfile),elizabeth=read(efile),names=new Map(route.stationCatalog.map(s=>[s.id,s.en]));
 assert.equal(route.patterns.length,20,'Unexpected Metrolink directions; reconcile source before rerunning');
 const indexed=new Map;
 for(const group of met.groups)for(const id of group.patternIds){
   assert(!indexed.has(id),'Duplicate official group assignment: '+id);
   indexed.set(id,group);
 }
 assert.equal(indexed.size,20,'TfGM published service group coverage must be exactly 20 patterns');
 for(const pattern of route.patterns){
   const group=indexed.get(pattern.id);
   assert(group,'Unmapped Metrolink direction '+pattern.id);
   const stopNames=pattern.stationIds.map(id=>names.get(id));
   assert(stopNames.every(Boolean),pattern.id+' has unknown stop');
   if(group.via)assert(stopNames.includes(group.via),pattern.id+' missing official via stop '+group.via);
   if(group.category==='PEAK_DIRECT')assert(!stopNames.includes('MediaCityUK'),'Non-via Eccles includes MediaCityUK');
   if(group.category==='OFF_PEAK_VIA_MEDIACITY')assert(stopNames.includes('MediaCityUK'),'Missing via MediaCityUK');
   const official={
     sourceUrl:met.sourceUrl,networkMapUrl:met.networkMapUrl,checkedAt:met.checkedAt,
     groupId:group.id,officialRoute:group.officialRoute,
     windowRule:group.category,
     operatingHoursAreGeneralGuidanceOnly:true,
     ...(group.category==='PART_DAY'||group.category==='PEAK_DIRECT' ?
       {operatingWindows:met.partDayWindows}:{}),
     ...(group.category==='OFF_PEAK_VIA_MEDIACITY' ?
       {operatingWindows:met.offPeakWindows}:{}),
     ...(group.category==='ALL_DAY' ?
       {operatingWindows:{allOperatingDays:'From service start to service end; see operator schedule'}}:{})
   };
   pattern.officialSchedule=official;
   const service=route.services.find(s=>s.id===pattern.id);
   assert(service,'Missing runtime service for '+pattern.id);
   service.officialSchedule=official;
 }
 route.operatorTimetableScope={
   sourceUrl:met.sourceUrl,checkedAt:met.checkedAt,
   serviceFrequencyGuide:met.generalFrequencyGuide,
   operatingHoursGuide:met.operatingHoursGuide,
   disclaimer:'First/last tram and exceptions require station- and date-specific verification'
 };
 const eNames=new Map(elizabeth.stationCatalog.map(s=>[s.id,s.en]));
 for(const sample of eli.journeys){
   const pattern=elizabeth.patterns.find(p=>p.id===sample.patternId);
   assert(pattern,'TfL sampled journey missing from game '+sample.patternId);
   const actual=pattern.stationIds.map(id=>eNames.get(id));
   const expected=sample.stops.map(stop=>stop[0]);
   assert.deepEqual(actual,expected,'TfL train stops do not match real game direction');
   assert.equal(sample.stops[0][1],sample.departure);
   assert.equal(sample.stops.at(-1)[1],sample.arrival);
   const official={
     sourceUrl:eli.sourceUrl,checkedAt:eli.checkedAt,
     samplePrintedPage:eli.sourcePrintedPage,validFrom:eli.validFrom,validTo:eli.validTo,
     coverage:'ONE_WEEKDAY_TRAIN_STOP_AND_TIME_MATCH',
     departure:sample.departure,arrival:sample.arrival,
     operatingDayScope:sample.serviceDays,
     stationTimeSamples:sample.stops.map(([station,time])=>({station,time})),
     note:'Single observed timetable column; does not certify other trains or calendar exceptions'
   };
   pattern.officialTrainSample=official;
   const service=elizabeth.services.find(s=>s.id===pattern.id);
   assert(service,'Elizabeth game service missing '+pattern.id);
   service.officialTrainSample=official;
 }
 elizabeth.operatorTimetableScope={
   sourceUrl:eli.sourceUrl,checkedAt:eli.checkedAt,
   validFrom:eli.validFrom,validTo:eli.validTo,
   scope:'One sample train verified against PDF page 2. Other directions remain partial.'
 };
 write(mfile,route);write(efile,elizabeth);
 return {metrolinkOperatingPatterns:route.patterns.length,elizabethSampledTrains:eli.journeys.length};
}
module.exports={applyPublishedWindows};
if(require.main===module)console.log(JSON.stringify(applyPublishedWindows()));
