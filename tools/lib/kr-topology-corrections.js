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
 if(correction.reason==='NON_RAIL_BRIDGE_MEMBER'){
  // 교량 외곽 폴리곤은 선로가 아니다. 고정 원본으로 입증된 교량 위 선로만 대체한다.
  const patch=correction.replacedMember,member=members[patch?.memberIndex],facility=facilityWays.get(member?.ref);
  if(!facility||patch.wayId!==member.ref||patch.sourceRole!==member.role||patch.sourceVersion!==facility.version||patch.facilitySha256!==relationHash(facility)||facility.tags?.man_made!=='bridge'||facility.tags.railway||facility.nodeIds?.[0]!==facility.nodeIds?.at(-1)||!facility.coordinates?.every(Array.isArray))throw Error('UNPROVEN_NON_RAIL_FACILITY');
  const replacements=correction.replacementWays;
  if(!Array.isArray(replacements)||!replacements.length||new Set(replacements.map(p=>p.wayId)).size!==replacements.length)throw Error('UNPROVEN_REPLACEMENT_TRACK');
  const ys=facility.coordinates.map(p=>p[0]),xs=facility.coordinates.map(p=>p[1]),inside=p=>Array.isArray(p)&&p[0]>=Math.min(...ys)-1e-7&&p[0]<=Math.max(...ys)+1e-7&&p[1]>=Math.min(...xs)-1e-7&&p[1]<=Math.max(...xs)+1e-7;
  for(const p of replacements){const w=ways.get(p.wayId);if(!w||p.sourceVersion!==w.version||p.sha256!==relationHash(w)||w.tags?.railway!=='rail'||w.tags.bridge!=='yes'||w.tags.highway||w.tags.access==='no'||w.tags.disused==='yes'||['yard','spur','siding'].includes(w.tags.service)||['industrial','military','test'].includes(w.tags.usage)||!w.coordinates?.every(inside)||members.some(m=>m.ref===p.wayId))throw Error('UNPROVEN_REPLACEMENT_TRACK');}
  const corrected=members.flatMap((m,i)=>i===patch.memberIndex?replacements.map(p=>({type:'w',ref:p.wayId,role:''})):[m]);
  const unique=orientOrderedWays(corrected,ways,stops);
  if(stops.length<2||unique.status!=='UNIQUE_SOURCE_ORDER')throw Error('UNPROVEN_REPLACEMENT_TRACK');
  const start=ways.get(replacements[0].wayId),end=ways.get(replacements.at(-1).wayId),first=unique.parts[patch.memberIndex],last=unique.parts[patch.memberIndex+replacements.length-1];
  if(!facility.nodeIds.includes(first.reverse?start.nodeIds.at(-1):start.nodeIds[0])||!facility.nodeIds.includes(last.reverse?end.nodeIds[0]:end.nodeIds.at(-1)))throw Error('UNPROVEN_REPLACEMENT_TRACK');
  for(const p of unique.parts){const t=ways.get(p.wayId).tags;if(t.oneway==='yes'&&p.reverse||t.oneway==='-1'&&!p.reverse)throw Error('ONEWAY_CONFLICT:'+p.wayId)}
  return {members:corrected,evidence:{reason:correction.reason,relationSha256:correction.relationSha256,replacedMember:patch,replacementWays:replacements,method:'pinned-bridge-footprint-and-exact-rail-node-chain',operationalDirectionVerified:false}};
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
