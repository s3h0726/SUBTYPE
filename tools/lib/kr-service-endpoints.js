'use strict';
const {hash}=require('./kr-source-member-repairs');
const crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function correctSourceEndpoints(service,relation,nodes,config,evidence){
 const fail=code=>{throw Error(code+':'+service.id)};
 if(service.id!==config.serviceId||hash(relation)!==config.relationSha256||service.osmFrom!==config.originalOrigin||service.osmTo!==config.originalDestination)fail('STALE_ENDPOINT_CORRECTION');
 const members=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role));
 const source=evidence.sources.find(s=>s.id===config.sourceId);
 if(!source||source.kind!=='official-timetable'||source.sha256!==config.workbookSha256||sha(evidence.workbook)!==config.workbookSha256||sha(evidence.researchBytes)!==config.researchSha256)fail('STALE_ENDPOINT_TIMETABLE');
 for(const [position,name,proof] of [[0,config.origin,config.originNode],[-1,config.destination,config.destinationNode]]){
  const m=members.at(position),node=nodes.get(proof.nodeId);
  if(m?.ref!==proof.nodeId||hash(node)!==proof.nodeSha256||node.tags.name!==name||node.tags.railway!=='stop'||node.tags.public_transport!=='stop_position')fail('UNPROVEN_ENDPOINT_STOP_IDENTITY');
  if(service.stops.at(position)?.stopId!=='kr-osm-stop-'+proof.nodeId)fail('ENDPOINT_NOT_RETAINED_ON_SOURCE_TRACK');
 }
 const trains=JSON.parse(evidence.researchBytes).trains.filter(t=>config.tripIds.includes(t.id));
 if(trains.length!==config.tripIds.length||!trains.length||new Set(trains.map(t=>t.calendarGroup)).size!==2)fail('MISSING_ENDPOINT_DAY_GROUP');
 for(const t of trains)if(t.sourceId!==source.id||t.originOperationalName!==config.origin||t.destinationOperationalName!==config.destination||t.calls.length!==members.length||t.calls[0].operationalStationName!==config.origin||t.calls.at(-1).operationalStationName!==config.destination)fail('OFFICIAL_ENDPOINT_TRAIN_DRIFT');
 return {...service,operatingEndpoints:{origin:config.origin,destination:config.destination},endpointCorrection:{...config,scope:'Published complete-train endpoints and existing source terminal stop identities only; intermediate station abbreviations, tracks, platforms and release remain unverified',releaseApproved:false}};
}
module.exports={correctSourceEndpoints};
