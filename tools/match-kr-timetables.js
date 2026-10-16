#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {load,validate,assemble}=require('./lib/kr-network');
// Exact names and complete stop sequences only. No suffix removal, fuzzy
// station merging, inferred reverse trips, or automatic review approval.
function match(data,timetable){
 const {errors,maps}=validate(data);if(errors.length)throw Error('INVALID_NETWORK');
 const sequences=new Map(),tracks=[],rejectedTopology=[];
 for(const service of data.services){
  try{assemble(service,maps)}catch(e){rejectedTopology.push({serviceId:service.id,reason:e.message});continue}
  const names=service.stops.map(c=>maps.stations.get(maps.stops.get(c.stopId).stationId).names.ko);
  tracks.push({serviceId:service.id,names});
  const key=JSON.stringify(names);if(!sequences.has(key))sequences.set(key,[]);sequences.get(key).push(service.id);
 }
 const patterns=new Map();
 for(const trip of timetable.tripCandidates){
  const names=trip.calls.map(c=>c.operationalStationName);
  const key=JSON.stringify([trip.sourceId,trip.sheet,names]);
  if(!patterns.has(key)){
   // A short turn or express may be a subsequence of an explicit directional
   // path. Retain every possible parent; this is evidence for review only.
   const partialTrackCandidates=[];
   for(const track of tracks){let previous=-1;const indices=[];for(const name of names){const hits=track.names.map((n,i)=>n===name&&i>previous?i:-1).filter(i=>i>=0);if(hits.length!==1){indices.length=0;break}previous=hits[0];indices.push(previous)}if(indices.length===names.length&&indices.length>=2)partialTrackCandidates.push({serviceId:track.serviceId,stopIndices:indices})}
   patterns.set(key,{id:'pattern-'+patterns.size,sourceId:trip.sourceId,sheet:trip.sheet,stationNames:names,tripIds:[],serviceCandidateIds:sequences.get(JSON.stringify(names))||[],partialTrackCandidates,status:'candidate'});
  }
  const pattern=patterns.get(key);pattern.tripIds.push(trip.id);
  if(names[0]!==trip.originOperationalName||names.at(-1)!==trip.destinationOperationalName)pattern.endpointMismatch=true;
 }
 const rows=[...patterns.values()];for(const p of rows)p.reviewRequired=p.endpointMismatch?'TIMETABLE_ENDPOINT_MISMATCH':p.serviceCandidateIds.length===1?'OFFICIAL_IDENTITY_CALENDAR_AND_TRACK_REVIEW':p.serviceCandidateIds.length?'AMBIGUOUS_TRACK':'NO_EXACT_COMPLETE_TRACK_SEQUENCE';
 return {status:'INCOMPLETE',releasedTrips:0,counts:{tripCandidates:timetable.tripCandidates.length,patterns:rows.length,exactUnambiguousPatterns:rows.filter(p=>!p.endpointMismatch&&p.serviceCandidateIds.length===1).length,ambiguousPatterns:rows.filter(p=>p.serviceCandidateIds.length>1).length,unmatchedPatterns:rows.filter(p=>!p.serviceCandidateIds.length).length,partialTrackPatterns:rows.filter(p=>p.partialTrackCandidates.length).length,rejectedTopology:rejectedTopology.length},patterns:rows,rejectedTopology};
}
if(require.main===module){const base=path.resolve(__dirname,'../data/kr/v2'),result=match(load(base),JSON.parse(fs.readFileSync(path.join(base,'timetable-candidates.json'),'utf8')));fs.writeFileSync(path.join(base,'timetable-matches.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.counts,null,2))}
module.exports={match};
