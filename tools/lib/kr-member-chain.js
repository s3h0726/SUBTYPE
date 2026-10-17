'use strict';
const {orientOrderedWays}=require('./kr-osm-order');
// Only an unbranched, open chain containing EVERY relation member is eligible.
// No path search, distance optimisation, omitted members or invented edges.
function orientMemberChain(members,ways,stops){
 if(stops.length<2)return {status:'MISSING_ORDERED_STOPS'};
 const adjacency=new Map();
 for(const [i,m] of members.entries()){
  const w=ways.get(m.ref);if(!w?.nodeIds?.length)return {status:'MISSING_MEMBER_WAY'};
  for(const n of [w.nodeIds[0],w.nodeIds.at(-1)]){if(!adjacency.has(n))adjacency.set(n,[]);adjacency.get(n).push(i)}
 }
 const ends=[...adjacency].filter(([,ids])=>ids.length===1).map(([id])=>id);
 if(ends.length!==2||[...adjacency.values()].some(ids=>ids.length>2))return {status:'NOT_A_SIMPLE_MEMBER_CHAIN'};
 const valid=[];
 for(const start of ends){
  let node=start;const used=new Set(),memberOrder=[],ordered=[];
  while(used.size<members.length){
   const next=(adjacency.get(node)||[]).filter(i=>!used.has(i));if(next.length!==1)break;
   const i=next[0],m=members[i],w=ways.get(m.ref),reverse=w.nodeIds.at(-1)===node;
   memberOrder.push(i);ordered.push({...m,role:reverse?'backward':'forward'});used.add(i);node=reverse?w.nodeIds[0]:w.nodeIds.at(-1);
  }
  if(used.size!==members.length)continue;
  const result=orientOrderedWays(ordered,ways,stops);if(result.status==='UNIQUE_SOURCE_ORDER')valid.push({...result,members:ordered,memberOrder});
 }
 return valid.length===1?valid[0]:{status:valid.length?'AMBIGUOUS_ORIENTATION':'ORDERED_STOPS_NOT_ON_TRACK'};
}
module.exports={orientMemberChain};
