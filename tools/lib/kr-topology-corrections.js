'use strict';
const crypto=require('node:crypto');
const {orientOrderedWays}=require('./kr-osm-order');
const relationHash=relation=>crypto.createHash('sha256').update(JSON.stringify(relation)).digest('hex');
function applyTopologyCorrection(relation,ways,correction){
 const members=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role));
 if(!correction)return {members};
 if(correction.relationId!==relation.id||correction.relationSha256!==relationHash(relation))throw Error('STALE_TOPOLOGY_CORRECTION:'+relation.id);
 const stops=relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)).map(m=>m.ref);
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
