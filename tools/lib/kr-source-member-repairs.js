'use strict';
const crypto=require('node:crypto');
const {orientOrderedWays}=require('./kr-osm-order');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const bytesHash=v=>crypto.createHash('sha256').update(v).digest('hex');

// Partial repairs never bypass the normal assembly, stop binding or release
// checks. Every distinct original rail way and every original stop is retained.
function repairSourceMembers(relation,ways,nodes,config,evidence){
 const original=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role));
 const sourceStops=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role));
 if(!config)return {members:original,stops:sourceStops};
 const fail=code=>{throw Error(code+':'+relation.id)};
 if(config.relationId!==relation.id||hash(relation)!==config.relationSha256)fail('STALE_PARTIAL_REPAIR');
 const p=config.memberRepair,member=original[p.sourceIndex],way=ways.get(p.wayId);
 if(!member||member.ref!==p.wayId||member.role!==p.sourceRole||!way||hash(way)!==p.waySha256)fail('STALE_PARTIAL_REPAIR_WAY');
 const members=original.slice();
 if(p.kind==='MISPLACED_MEMBER'){
  const before=original[p.insertBeforeIndex-1],after=original[p.insertBeforeIndex];
  if(p.sourceIndex<=p.insertBeforeIndex||before?.ref!==p.beforeWayId||after?.ref!==p.afterWayId)fail('STALE_REPAIR_ANCHOR');
  if(orientOrderedWays([before,after],ways,[]).status!=='DISCONNECTED_ORDERED_WAYS'||orientOrderedWays([before,member,after],ways,[]).status!=='UNIQUE_SOURCE_ORDER')fail('UNPROVEN_LOCAL_REORDER');
  members.splice(p.sourceIndex,1);members.splice(p.insertBeforeIndex,0,member);
 }else if(p.kind==='DISCONNECTED_DUPLICATE_OCCURRENCE'){
  if(p.sourceIndex!==original.length-1||p.retainedIndex>=p.sourceIndex||JSON.stringify(original[p.retainedIndex])!==JSON.stringify(member))fail('UNPROVEN_DUPLICATE_OCCURRENCE');
  if(orientOrderedWays(original,ways,[]).status!=='DISCONNECTED_ORDERED_WAYS')fail('POSSIBLE_VALID_REPEATED_TRAVERSAL');
  members.splice(p.sourceIndex,1);
  if(orientOrderedWays(members,ways,[]).status!=='UNIQUE_SOURCE_ORDER')fail('UNPROVEN_DUPLICATE_REPAIR_CONTINUITY');
 }else fail('UNKNOWN_PARTIAL_REPAIR');
 if(JSON.stringify([...new Set(members.map(m=>m.ref))].sort())!==JSON.stringify([...new Set(original.map(m=>m.ref))].sort()))fail('ORIGINAL_RAIL_WAY_REMOVED');
 const order=config.officialStopOrder,source=evidence.sources.find(s=>s.id===order.sourceId);
 if(!source||source.kind!=='official-timetable'||source.sha256!==order.workbookSha256||bytesHash(evidence.workbook)!==order.workbookSha256||bytesHash(evidence.researchBytes)!==order.researchSha256)fail('STALE_OFFICIAL_STOP_ORDER_SOURCE');
 const research=JSON.parse(evidence.researchBytes),trains=research.trains.filter(t=>order.tripIds.includes(t.id));
 if(!trains.length||trains.length!==order.tripIds.length||new Set(trains.map(t=>t.calendarGroup)).size!==2)fail('INCOMPLETE_PUBLISHED_DAY_GROUPS');
 const names=order.nodes.map(n=>n.officialName);
 if(names[0]!==relation.tags.from||names.at(-1)!==relation.tags.to)fail('OFFICIAL_ENDPOINT_ORDER_MISMATCH');
 for(const t of trains)if(t.sourceId!==source.id||t.publishedDirection!==order.publishedDirection||JSON.stringify(t.calls.map(c=>c.operationalStationName))!==JSON.stringify(names)||t.originOperationalName!==names[0]||t.destinationOperationalName!==names.at(-1))fail('OFFICIAL_STOP_ORDER_DRIFT');
 if(order.nodes.length!==sourceStops.length||new Set(order.nodes.map(n=>n.nodeId)).size!==sourceStops.length)fail('SOURCE_STOP_REMOVED');
 const stops=order.nodes.map(n=>{
  const node=nodes.get(n.nodeId),member=sourceStops.find(m=>m.ref===n.nodeId);
  if(!member||!node||hash(node)!==n.nodeSha256||node.tags.name!==n.officialName)fail('STATION_IDENTITY_DRIFT');
  return {...member};
 });
 return {members,stops,evidence:{...config,scope:'Partial source member and official stop-order repair only; unmapped stop positions, branch tracks and release reviews remain unresolved',operationalDirectionVerified:false,releaseApproved:false}};
}
module.exports={repairSourceMembers,hash};
