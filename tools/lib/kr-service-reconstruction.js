'use strict';
const crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {assemble}=require('./kr-network');
// Reviewed supplements for incomplete relations. Every coordinate is retained
// from an existing directional source relation; the complete calling pattern
// comes from actual official trains. No nearest-track or path search is used.
function reconstructService(target,donor,maps,config,relation,trips,endpointEvidence={references:[],files:new Map()}){
 const fail=code=>{throw Error(code+':'+target.id)};
 if(digest(relation)!==config.targetRelationHash||digest(donor)!==config.donorServiceHash)fail('STALE_RECONSTRUCTION_SOURCE');
 if(target.status!=='candidate'||target.passengerLineId!==donor.passengerLineId)fail('RECONSTRUCTION_IDENTITY');
 const renames=config.endpointNameCorrections||[];
 for(const [endpoint,sourceName,officialName] of [['origin',target.osmFrom,config.origin],['destination',target.osmTo,config.destination]]){
  const matching=renames.filter(r=>r.endpoint===endpoint);
  if(sourceName===officialName){if(matching.length)fail('UNUSED_ENDPOINT_RENAME');continue}
  const r=matching[0],reference=endpointEvidence.references?.find(x=>x.id===r?.referenceId),station=maps.stations.get(r?.stationId),bytes=endpointEvidence.files?.get(r?.officialFile);
  if(matching.length!==1||!r||r.expectedSourceName!==sourceName||r.officialName!==officialName||!reference||digest(reference)!==r.referenceSha256||reference.number!==r.officialStationCode||reference.names.ko!==officialName||reference.officialLineCode!==r.referenceLineCode||station?.names.ko!==officialName||JSON.stringify(station.coordinates)!==JSON.stringify(r.expectedStationCoordinates)||!bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==r.officialSha256||!bytes.toString('utf8').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').includes(r.expectedOfficialText))fail('UNVERIFIED_ENDPOINT_RENAME');
 }
 if(renames.some(r=>!['origin','destination'].includes(r.endpoint)))fail('UNVERIFIED_ENDPOINT_RENAME');
 assemble(donor,maps);
 const names=calls=>calls.map(c=>maps.stations.get(maps.stops.get(c.stopId)?.stationId)?.names.ko);
 const donorNames=names(donor.stops),starts=donorNames.flatMap((n,i)=>n===config.origin?[i]:[]),ends=donorNames.flatMap((n,i)=>n===config.destination?[i]:[]);
 if(starts.length!==1||ends.length!==1||starts[0]>=ends[0])fail('AMBIGUOUS_SOURCE_VISIT');
 const calls=donor.stops.slice(starts[0],ends[0]+1);
 if(JSON.stringify(names(calls))!==JSON.stringify(config.calls.map(c=>c.officialStationName)))fail('OFFICIAL_CALL_PATTERN_MISMATCH');
 for(const r of renames){const i=r.endpoint==='origin'?0:calls.length-1;if(maps.stops.get(calls[i].stopId)?.stationId!==r.stationId||config.calls[i].officialStationCode!==r.officialStationCode)fail('RENAMED_ENDPOINT_IDENTITY_MISMATCH')}
 if(target.stops.some(c=>!calls.some(d=>d.stopId===c.stopId)))fail('ORIGINAL_STOP_OMITTED');
 const evidence=trips.filter(t=>config.officialTripIds.includes(t.id));
 if(evidence.length!==config.officialTripIds.length||!evidence.length)fail('MISSING_OFFICIAL_TRAINS');
 for(const t of evidence){
  if(t.sourceId!==config.sourceId||t.officialLineCode!==config.officialLineCode||t.directionId!==config.officialDirectionId||t.express||t.originOperationalName!==config.origin||t.destinationOperationalName!==config.destination||t.calls.length!==calls.length||t.calls.some((c,i)=>c.operationalStationName!==config.calls[i].officialStationName||c.officialStationCode!==config.calls[i].officialStationCode))fail('OFFICIAL_TRAIN_DRIFT');
 }
 const a=calls[0].geometryIndex,b=calls.at(-1).geometryIndex,selected=[];let offset=0,removed=0;
 for(const p of donor.paths){const g=maps.geometry.get(p.geometryId),end=offset+g.nodeIds.length-1;
  if(end>a&&offset<b){if(!selected.length)removed=offset;selected.push({...p})}offset=end;
 }
 if(!target.paths.every(p=>selected.some(q=>q.geometryId===p.geometryId)))fail('ORIGINAL_WAY_OMITTED');
 const track=new Map([...maps.infrastructure.values()].map(i=>[i.geometryId,i]));
 for(const p of selected){const t=track.get(p.geometryId);if(!t||(['yard','spur'].includes(t.service)||(t.service==='siding'&&!endpointEvidence.passengerPlatforms?.has(p.geometryId.replace('kr-geometry-',''))))||(t.oneway==='yes'&&p.reverse)||(t.oneway==='-1'&&!p.reverse))fail('UNREVIEWED_DIRECTION_OR_NON_PUBLIC_TRACK')}
 const result={...target,...(renames.length?{operatingEndpoints:{origin:config.origin,destination:config.destination},sourceNames:target.sourceNames||target.names,names:{...target.names,ko:config.officialDisplayName}}:{}),paths:selected,stops:calls.map(c=>({...c,geometryIndex:c.geometryIndex-removed})),sourceIssues:target.issues,reconstruction:{donorServiceId:donor.id,sourceId:config.sourceId,officialTripIds:config.officialTripIds,reviewedOn:config.reviewedOn,...(renames.length?{endpointNameCorrections:renames}:{}),scope:'Candidate source-track and complete published calling-pattern reconstruction only; release reviews remain required'},issues:[{code:'OFFICIAL_TIMETABLE_REQUIRED'}]};
 assemble(result,maps);return result;
}
module.exports={reconstructService,digest};
