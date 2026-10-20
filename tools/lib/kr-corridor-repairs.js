'use strict';
const crypto=require('node:crypto');
const {orientOrderedWays}=require('./kr-osm-order');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const bytesHash=v=>crypto.createHash('sha256').update(v).digest('hex');
function turnDegrees(a,b,c){
 const scale=Math.cos(b[0]*Math.PI/180),u=[(b[1]-a[1])*scale,b[0]-a[0]],v=[(c[1]-b[1])*scale,c[0]-b[0]],length=Math.hypot(...u)*Math.hypot(...v);
 if(!length)return NaN;
 return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/length)))*180/Math.PI;
}

// A partial infrastructure repair is not a passenger service reconstruction.
// Only reviewed, uniquely joining, existing mainline pieces are permitted.
// No search over paths, new coordinates, removed source members or stop edits.
function createCorridorReviewer(ways,config,proofFiles){
 if(hash([...ways.values()])!==config.sourceWaysSha256)throw Error('STALE_CORRIDOR_SOURCE_WAYS');
 if(new Set(config.segments.map(s=>s.id)).size!==config.segments.length||new Set(config.segments.map(s=>s.wayId)).size!==config.segments.length||new Set(config.relations.map(r=>r.relationId)).size!==config.relations.length)throw Error('DUPLICATE_CORRIDOR_REVIEW');
 const segments=new Map();
 for(const s of config.segments){
  const w=ways.get(s.wayId),bytes=proofFiles.get(s.sourceFile);
  if(!w||hash(w)!==s.waySha256||w.version!==s.sourceVersion||!bytes||bytesHash(bytes)!==s.fileSha256||w.tags.railway!=='rail'||w.tags.gauge!=='1435'||w.tags.usage!=='main'||w.tags.service||w.tags.highway||['private','no'].includes(w.tags.access)||w.tags.name!==s.expectedLineName||w.tags.operator!==s.expectedOperator)throw Error('UNPROVEN_CORRIDOR_MAINLINE:'+s.wayId);
  const elements=JSON.parse(bytes).elements,latest=elements.filter(e=>e.type==='way'),nodes=new Map(elements.filter(e=>e.type==='node').map(n=>[String(n.id),n]));
  if(latest.length!==1||String(latest[0].id)!==w.id||latest[0].version!==w.version||JSON.stringify(latest[0].nodes.map(String))!==JSON.stringify(w.nodeIds)||Object.keys(w.tags).length!==Object.keys(latest[0].tags).length||Object.entries(w.tags).some(([k,v])=>latest[0].tags[k]!==v)||w.nodeIds.some((id,i)=>nodes.get(id)?.lat!==w.coordinates[i][0]||nodes.get(id)?.lon!==w.coordinates[i][1]))throw Error('LATEST_CORRIDOR_GEOMETRY_DRIFT:'+s.wayId);
  segments.set(s.id,structuredClone(s));
 }
 const reviews=new Map(config.relations.map(r=>[r.relationId,structuredClone(r)]));
 return relation=>{
  const review=reviews.get(relation.id);if(!review)return null;
  if(hash(relation)!==review.relationSha256||review.operatingPatternVerified!==false||review.releaseApproved!==false)throw Error('STALE_CORRIDOR_RELATION:'+relation.id);
  const original=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role)),members=original.map(m=>({...m})),proofs=[];
  if(!review.insertions.length||new Set(review.insertions.map(p=>p.segmentId)).size!==review.insertions.length)throw Error('DUPLICATE_CORRIDOR_INSERTION');
  let previous=-1;
  for(const [offset,p] of review.insertions.entries()){
   const s=segments.get(p.segmentId),w=ways.get(s?.wayId),before=original[p.sourceIndex-1],after=original[p.sourceIndex];
   if(!Number.isInteger(p.sourceIndex)||p.sourceIndex<=previous||!s||!w||hash(w)!==s.waySha256||before?.ref!==p.beforeWayId||after?.ref!==p.afterWayId||hash(ways.get(before.ref))!==p.beforeWaySha256||hash(ways.get(after.ref))!==p.afterWaySha256||original.some(m=>m.ref===w.id))throw Error('STALE_CORRIDOR_ANCHOR');
   previous=p.sourceIndex;
   const triple=[before,{type:'w',ref:w.id,role:''},after],q=orientOrderedWays(triple,ways,[]);
   if(orientOrderedWays([before,after],ways,[]).status!=='DISCONNECTED_ORDERED_WAYS'||q.status!=='UNIQUE_SOURCE_ORDER')throw Error('UNPROVEN_CORRIDOR_NODE_JOIN');
   for(const part of q.parts){const t=ways.get(part.wayId).tags;if(t.name!==s.expectedLineName||t.operator!==s.expectedOperator||t.service||t.highway||['private','no'].includes(t.access)||(t.oneway==='yes'&&part.reverse)||(t.oneway==='-1'&&!part.reverse))throw Error('CORRIDOR_DIRECTION_OR_ACCESS_CONFLICT')}
   const a=ways.get(before.ref),b=ways.get(after.ref),ae=[a.nodeIds[0],a.nodeIds.at(-1)],be=[b.nodeIds[0],b.nodeIds.at(-1)];
   const candidates=[...ways.values()].filter(v=>v.tags.railway==='rail'&&((ae.includes(v.nodeIds[0])&&be.includes(v.nodeIds.at(-1)))||(be.includes(v.nodeIds[0])&&ae.includes(v.nodeIds.at(-1))))&&orientOrderedWays([before,{ref:v.id,role:''},after],ways,[]).status==='UNIQUE_SOURCE_ORDER');
   if(candidates.length!==1||candidates[0].id!==w.id)throw Error('AMBIGUOUS_CORRIDOR_CONNECTOR');
   const oriented=q.parts.map(p=>{const points=ways.get(p.wayId).coordinates;return p.reverse?points.slice().reverse():points}),[x,y,z]=oriented;
   if(x.at(-1)[0]!==y[0][0]||x.at(-1)[1]!==y[0][1]||y.at(-1)[0]!==z[0][0]||y.at(-1)[1]!==z[0][1])throw Error('CORRIDOR_COORDINATE_JOIN_MISMATCH');
   const angles=[turnDegrees(x.at(-2),x.at(-1),y[1]),turnDegrees(y.at(-2),y.at(-1),z[1])];
   // An exact node join alone can still describe a switchback or wrong track.
   // This conservative extra rejection never establishes operating direction.
   if(angles.some(a=>!Number.isFinite(a)||a>30))throw Error('CORRIDOR_SWITCHBACK_OR_SHARP_JOIN');
   members.splice(p.sourceIndex+offset,0,triple[1]);
   proofs.push({...p,wayId:w.id,sourceFile:s.sourceFile,fileSha256:s.fileSha256,url:s.url,reverse:q.parts[1].reverse,joinNodeIds:[q.nodeIds[x.length-1],q.nodeIds[x.length+y.length-2]],joinCoordinates:[y[0],y.at(-1)],turnDegrees:angles});
  }
  const added=new Set(proofs.map(p=>p.wayId));
  if(members.length!==original.length+proofs.length||JSON.stringify(members.filter(m=>!added.has(m.ref)))!==JSON.stringify(original))throw Error('ORIGINAL_CORRIDOR_MEMBERS_CHANGED');
  return {members,evidence:{sourceId:config.sourceId,reviewedOn:config.reviewedOn,relationSha256:review.relationSha256,insertions:proofs,
   sourceTrackContiguous:orientOrderedWays(members,ways,[]).status==='UNIQUE_SOURCE_ORDER',originalStopMembers:relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)),
   operatingPatternVerified:false,releaseApproved:false,requiredIssue:'SOURCE_STOP_PATTERN_REVIEW_REQUIRED',
   scope:'Partial exact-node source mainline continuity only. Original rail members and stop members are preserved; passenger calling order, platforms, operating days and release remain unverified.'}};
 };
}
module.exports={createCorridorReviewer,turnDegrees,hash};
