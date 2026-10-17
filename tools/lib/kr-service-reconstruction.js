'use strict';
const crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {assemble}=require('./kr-network');
// Reviewed supplements for incomplete relations. Every coordinate is retained
// from an existing directional source relation; the complete calling pattern
// comes from actual official trains. No nearest-track or path search is used.
function reconstructService(target,donor,maps,config,relation,trips){
 const fail=code=>{throw Error(code+':'+target.id)};
 if(digest(relation)!==config.targetRelationHash||digest(donor)!==config.donorServiceHash)fail('STALE_RECONSTRUCTION_SOURCE');
 if(target.status!=='candidate'||target.passengerLineId!==donor.passengerLineId||target.osmFrom!==config.origin||target.osmTo!==config.destination)fail('RECONSTRUCTION_IDENTITY');
 assemble(donor,maps);
 const names=calls=>calls.map(c=>maps.stations.get(maps.stops.get(c.stopId)?.stationId)?.names.ko);
 const donorNames=names(donor.stops),starts=donorNames.flatMap((n,i)=>n===config.origin?[i]:[]),ends=donorNames.flatMap((n,i)=>n===config.destination?[i]:[]);
 if(starts.length!==1||ends.length!==1||starts[0]>=ends[0])fail('AMBIGUOUS_SOURCE_VISIT');
 const calls=donor.stops.slice(starts[0],ends[0]+1);
 if(JSON.stringify(names(calls))!==JSON.stringify(config.calls.map(c=>c.officialStationName)))fail('OFFICIAL_CALL_PATTERN_MISMATCH');
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
 for(const p of selected){const t=track.get(p.geometryId);if(!t||['yard','siding','spur'].includes(t.service)||(t.oneway==='yes'&&p.reverse)||(t.oneway==='-1'&&!p.reverse))fail('UNREVIEWED_DIRECTION_OR_NON_PUBLIC_TRACK')}
 const result={...target,paths:selected,stops:calls.map(c=>({...c,geometryIndex:c.geometryIndex-removed})),sourceIssues:target.issues,reconstruction:{donorServiceId:donor.id,sourceId:config.sourceId,officialTripIds:config.officialTripIds,reviewedOn:config.reviewedOn,scope:'Candidate source-track and complete published calling-pattern reconstruction only; release reviews remain required'},issues:[{code:'OFFICIAL_TIMETABLE_REQUIRED'}]};
 assemble(result,maps);return result;
}
module.exports={reconstructService,digest};
