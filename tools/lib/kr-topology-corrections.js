'use strict';
const crypto=require('node:crypto');
const {orientOrderedWays}=require('./kr-osm-order');
const {orientMemberChain}=require('./kr-member-chain');
const relationHash=relation=>crypto.createHash('sha256').update(JSON.stringify(relation)).digest('hex');
function applyTopologyCorrection(relation,ways,correction,facilityWays=new Map()){
 const members=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role));
 if(!correction)return {members};
 if(correction.relationId!==relation.id||correction.relationSha256!==relationHash(relation))throw Error('STALE_TOPOLOGY_CORRECTION:'+relation.id);
 const stops=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)).map(m=>m.ref);
 if(correction.reason==='NON_RAIL_FACILITY_MEMBER'){
  const replacement=correction.replacedMember,member=members[replacement?.memberIndex],facility=facilityWays.get(replacement?.wayId);
  if(!replacement||member?.ref!==replacement.wayId||member.role!==replacement.sourceRole||ways.has(member.ref)||!facility||relationHash(facility)!==replacement.facilitySha256||facility.version!==replacement.sourceVersion||facility.tags.railway||facility.tags.man_made!=='bridge'||facility.nodeIds.length<4||facility.nodeIds[0]!==facility.nodeIds.at(-1))throw Error('UNPROVEN_NON_RAIL_FACILITY:'+relation.id);
  const inserts=correction.replacementWays;
  if(!Array.isArray(inserts)||inserts.length<1||new Set(inserts.map(p=>p.wayId)).size!==inserts.length)throw Error('INVALID_REPLACEMENT_TRACKS');
  for(const p of inserts){const w=ways.get(p.wayId);if(!w||members.some(m=>m.ref===p.wayId)||w.version!==p.sourceVersion||relationHash(w)!==p.sha256||w.tags.railway!=='rail'||['yard','siding','spur'].includes(w.tags.service)||w.tags.highway||Object.entries(correction.expectedTrackTags||{}).some(([k,v])=>w.tags[k]!==v))throw Error('UNPROVEN_REPLACEMENT_TRACK:'+p.wayId)}
  const corrected=members.flatMap((m,i)=>i===replacement.memberIndex?inserts.map(p=>({type:'w',ref:p.wayId,role:''})):[m]),result=orientOrderedWays(corrected,ways,stops);
  if(stops.length<2||result.status!=='UNIQUE_SOURCE_ORDER')throw Error('UNPROVEN_REPLACEMENT_CONTINUITY');
  for(const p of result.parts){const t=ways.get(p.wayId).tags;if(t.oneway==='yes'&&p.reverse||t.oneway==='-1'&&!p.reverse)throw Error('ONEWAY_CONFLICT:'+p.wayId)}
  return {members:corrected,evidence:{reason:correction.reason,relationSha256:correction.relationSha256,replacedMember:replacement,replacementWays:inserts,method:'pinned-non-rail-closed-bridge-outline-replaced-by-existing-exact-node-contiguous-rail-ways',operationalDirectionVerified:false}};
 }
 if(correction.reason==='MISORDERED_MEMBERS'){
  if(orientOrderedWays(members,ways,stops).status==='UNIQUE_SOURCE_ORDER')throw Error('ALREADY_ORDERED_RELATION:'+relation.id);
  const unique=orientMemberChain(members,ways,stops),order=correction.orderedMembers;
  if(unique.status!=='UNIQUE_SOURCE_ORDER'||!Array.isArray(order)||order.length!==members.length)throw Error('UNPROVEN_MEMBER_ORDER:'+relation.id);
  if(new Set(order.map(p=>p.sourceIndex)).size!==members.length)throw Error('DUPLICATE_MEMBER_INDEX');
  for(const [i,p] of order.entries()){
   const m=members[p.sourceIndex],w=ways.get(m?.ref);
   if(unique.memberOrder[i]!==p.sourceIndex||p.wayId!==m?.ref||p.sourceVersion!==w?.version||p.sourceRole!==m?.role||unique.members[i].role!==p.role)throw Error('STALE_MEMBER_ORDER:'+relation.id);
  }
  for(const p of unique.parts){const t=ways.get(p.wayId).tags;if(t.oneway==='yes'&&p.reverse||t.oneway==='-1'&&!p.reverse)throw Error('ONEWAY_CONFLICT:'+p.wayId)}
  return {members:unique.members,evidence:{reason:correction.reason,relationSha256:correction.relationSha256,orderedMembers:order,method:'complete-unbranched-source-member-chain-and-stop-order',operationalDirectionVerified:false}};
 }
 if(stops.length<2||correction.reason!=='CONFLICTING_MEMBER_ROLES')throw Error('INVALID_TOPOLOGY_CORRECTION:'+relation.id);
 const corrected=members.map((m,index)=>{
  const patch=correction.roles.find(p=>p.memberIndex===index);
  if(!patch)return m;
  const way=ways.get(m.ref);
  if(patch.wayId!==m.ref||patch.sourceRole!==m.role||patch.sourceVersion!==way?.version||!['forward','backward'].includes(patch.role)||patch.role===m.role)throw Error('STALE_WAY_CORRECTION:'+m.ref);
  return {...m,role:patch.role};
 });
 if(new Set(correction.roles.map(p=>p.memberIndex)).size!==correction.roles.length||correction.roles.some(p=>!members[p.memberIndex]))throw Error('INVALID_CORRECTION_INDEX');
 // Independently prove that retaining ALL source ways and stop nodes permits
 // precisely this traversal. No sorting, snapping, shortest path or new edges.
 const unique=orientOrderedWays(members.map(m=>({...m,role:''})),ways,stops);
 const result=orientOrderedWays(corrected,ways,stops);
 if(unique.status!=='UNIQUE_SOURCE_ORDER'||result.status!=='UNIQUE_SOURCE_ORDER'||JSON.stringify(unique.parts)!==JSON.stringify(result.parts))throw Error('UNPROVEN_TOPOLOGY_CORRECTION:'+relation.id);
 for(const p of result.parts){const t=ways.get(p.wayId).tags;if((t.oneway==='yes'&&p.reverse)||(t.oneway==='-1'&&!p.reverse))throw Error('ONEWAY_CONFLICT:'+p.wayId)}
 return {members:corrected,evidence:{reason:correction.reason,relationSha256:correction.relationSha256,roles:correction.roles,method:'unique-exact-node-continuity-and-source-stop-order',operationalDirectionVerified:false}};
}
module.exports={relationHash,applyTopologyCorrection};
