'use strict';
const fs=require('node:fs'),path=require('node:path');
const {load,validate}=require('./lib/kr-network');
function time(s){if(!/^\d{1,2}:\d{2}:\d{2}$/.test(s||''))throw Error('INVALID_TIME');const [h,m,sec]=s.split(':').map(Number);if(h>47||m>59||sec>59)throw Error('INVALID_TIME');return h*3600+m*60+sec}
function verifyBinding(binding,maps,trips){
 const service=maps.services.get(binding.serviceId),source=maps.sources.get(binding.sourceId);
 if(!service||!source||source.kind!=='official-timetable'||source.licenseStatus!=='verified'||!source.validFrom)throw Error('MISSING_OFFICIAL_SOURCE');
 if(JSON.stringify(service.stops.map(c=>c.stopId))!==JSON.stringify(binding.calls.map(c=>c.stopId)))throw Error('STOP_BINDING_DRIFT');
 for(const c of binding.calls){const stop=maps.stops.get(c.stopId),station=maps.stations.get(stop?.stationId);if(stop?.stationId!==c.stationId||station?.names.ko!==c.expectedSourceName)throw Error('STATION_BINDING_DRIFT')}
 const eligible=trips.filter(t=>t.sourceId===binding.sourceId&&t.officialLineCode===binding.officialLineCode&&t.express===binding.express&&t.directionId===binding.officialDirectionId&&t.originOperationalName===binding.origin&&t.destinationOperationalName===binding.destination);
 const groups=[],rejected=[];
 for(const label of ['DAY','SAT','END']){
  const accepted=[];
  for(const t of eligible.filter(t=>t.calendarLabel===label)){
   try{
    if(t.calls.length!==binding.calls.length||t.calls.some((c,i)=>c.officialStationCode!==binding.calls[i].officialStationCode||c.operationalStationName!==binding.calls[i].officialStationName))throw Error('INCOMPLETE_OR_DIFFERENT_CALL_PATTERN');
    let previous=-1;for(const c of t.calls){const values=[c.arrival,c.departure].filter(Boolean);if(!values.length)throw Error('MISSING_CALL_TIME');for(const v of values){const n=time(v);if(n<previous)throw Error('NON_MONOTONIC_TIMETABLE');previous=n}if(!Number.isInteger(c.sourceRow)||!c.sourceRecordId)throw Error('MISSING_ROW_PROVENANCE')}
    if(!t.calls[0].departure||!t.calls.at(-1).arrival)throw Error('MISSING_ENDPOINT_TIMES');
    accepted.push({tripId:t.id,trainNumber:t.trainNumber,directionId:t.directionId,calls:t.calls});
   }catch(e){rejected.push({tripId:t.id,reason:e.message})}
  }
  if(!accepted.length)throw Error('NO_COMPLETE_'+label+'_TRAINS');
  groups.push({calendarLabel:label,trainCount:accepted.length,trains:accepted});
 }
 return {serviceId:service.id,sourceId:source.id,status:'verified',verificationScope:'Official complete calling pattern, source clocks and DAY/SAT/END groups only; not track/platform, holiday exceptions or release approval',verifiedOn:binding.reviewedOn,dataReferenceDate:source.dataReferenceDate,officialLineCode:binding.officialLineCode,officialDirectionId:binding.officialDirectionId,origin:binding.origin,destination:binding.destination,express:binding.express,calls:binding.calls,groups,rejected};
}
if(require.main===module){
 const base=path.resolve(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8')),data=load(base),{maps,errors}=validate(data,{base});if(errors.length)throw Error(JSON.stringify(errors));
 const trips=read('seoulmetro-trip-candidates'),results=read('timetable-service-bindings').map(b=>verifyBinding(b,maps,trips));
 const reviewIds=new Set(results.map(r=>'timetable-review-'+r.serviceId));const reviews=data.reviews.filter(r=>!reviewIds.has(r.id));
 for(const r of results)reviews.push({id:'timetable-review-'+r.serviceId,serviceId:r.serviceId,status:'verified',scope:r.verificationScope,timetableSourceIds:[r.sourceId],stationSourceIds:[],trackDirectionVerified:false,officialDistanceKm:null,validFrom:maps.sources.get(r.sourceId).validFrom,verifiedOn:r.verifiedOn,evidenceFile:'timetable-verifications.json',remainingReviews:['PLATFORM_AND_TRACK_DIRECTION','OFFICIAL_STATION_METADATA','DISTANCE','HOLIDAY_EXCEPTIONS','FULL_RELEASE_E2E']});
 const write=(n,v)=>fs.writeFileSync(path.join(base,n+'.json'),JSON.stringify(v,null,2)+'\n');write('timetable-verifications',results);write('reviews',reviews);
 console.log(JSON.stringify({verifiedTimetablePatterns:results.length,officialTrains:results.reduce((n,r)=>n+r.groups.reduce((s,g)=>s+g.trainCount,0),0),releaseApproved:0}));
}
module.exports={verifyBinding};
