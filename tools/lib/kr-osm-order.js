'use strict';
// Orient only the ways already present in a route relation, in source order.
// Never add a way, sort members, snap endpoints or infer passenger direction.
function orientOrderedWays(members,ways,stopNodeIds=[]){
 if(!members.length)return {status:'MISSING_TRACK'};
 let candidates=[{parts:[],end:null}];
 for(const member of members){
  const way=ways.get(member.ref);if(!way?.nodeIds?.length)return {status:'MISSING_MEMBER_WAY',wayId:member.ref};
  const directions=member.role==='forward'?[false]:member.role==='backward'?[true]:member.role===''?[false,true]:[];
  if(!directions.length)return {status:'UNKNOWN_WAY_ROLE',wayId:member.ref,role:member.role};
  const next=[];
  for(const candidate of candidates)for(const reverse of directions){const start=reverse?way.nodeIds.at(-1):way.nodeIds[0],end=reverse?way.nodeIds[0]:way.nodeIds.at(-1);if(candidate.end!==null&&candidate.end!==start)continue;next.push({parts:[...candidate.parts,{wayId:member.ref,reverse}],end})}
  if(!next.length)return {status:'DISCONNECTED_ORDERED_WAYS',wayId:member.ref};
  // A bounded search fails closed, rather than dropping possible branches.
  if(next.length>64)return {status:'AMBIGUOUS_ORIENTATION'};
  candidates=next;
 }
 const valid=[];
 for(const candidate of candidates){
  const nodeIds=[];for(const part of candidate.parts){const way=ways.get(part.wayId),ids=part.reverse?way.nodeIds.slice().reverse():way.nodeIds;nodeIds.push(...ids.slice(nodeIds.length?1:0))}
  let previous=-1;const stopIndices=[];for(const id of stopNodeIds){const i=nodeIds.indexOf(id,previous+1);if(i<0)break;stopIndices.push(i);previous=i}
  if(stopIndices.length===stopNodeIds.length)valid.push({...candidate,nodeIds,stopIndices});
 }
 if(!valid.length)return {status:'ORDERED_STOPS_NOT_ON_TRACK'};
 if(valid.length!==1)return {status:'AMBIGUOUS_ORIENTATION'};
 return {status:'UNIQUE_SOURCE_ORDER',...valid[0]};
}
module.exports={orientOrderedWays};
