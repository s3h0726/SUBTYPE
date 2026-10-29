const norm=value=>String(value||'').normalize('NFC').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
const meters=(a,b)=>{const rad=Math.PI/180,dlat=(b[0]-a[0])*rad,dlon=(b[1]-a[1])*rad,s=Math.sin(dlat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s))};
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>22.1&&p[0]<22.58&&p[1]>113.8&&p[1]<114.45;
function extractRelation(relation,elements,{operationalWayIds=[]}={}){
 const byKey=new Map(elements.map(e=>[e.type+':'+e.id,e]));
 const stopNodes=relation.members.filter(m=>m.type==='node'&&/^stop/.test(m.role)).map(m=>byKey.get('node:'+m.ref));
 if(stopNodes.length<2||stopNodes.some(n=>!n))throw Error('missing ordered stop nodes');
 const members=relation.members.filter(m=>{if(m.type!=='way'||/platform|stop/.test(m.role))return false;const tags=byKey.get('way:'+m.ref)?.tags;return tags?.public_transport!=='platform'&&tags?.railway!=='platform'&&tags?.area!=='yes'});
 const ways=members.map(m=>byKey.get('way:'+m.ref));if(!ways.length||ways.some(w=>!w))throw Error('missing source railway ways');
 for(const way of ways){if(!['rail','subway','light_rail','tram','funicular'].includes(way.tags?.railway))throw Error('non-railway way '+way.id);if(way.tags?.construction&&!['no','finished'].includes(way.tags.construction)&&!operationalWayIds.includes(way.id))throw Error('construction railway way requires commissioning review '+way.id)}
 const ordered=[];
 for(let i=0;i<ways.length;i++){
  let ids=[...ways[i].nodes];if(members[i].role==='backward')ids.reverse();
  if(i===0&&ways[1]&&!ways[1].nodes.includes(ids.at(-1))&&ways[1].nodes.includes(ids[0]))ids.reverse();
  if(i){const end=ordered.at(-1).ids.at(-1);if(ids.at(-1)===end)ids.reverse();if(ids[0]!==end)throw Error('disconnected railway way '+ways[i].id)}
  ordered.push({id:ways[i].id,ids});
 }
 let vertexIds=ordered.flatMap((w,i)=>i?w.ids.slice(1):w.ids);
 // A closed railway has no privileged first way. Rotate only a truly closed
 // source chain, at the exact first stop node; never bridge an open gap.
 if(vertexIds[0]===vertexIds.at(-1)&&relation.tags?.roundtrip==='yes'){
  const start=vertexIds.indexOf(stopNodes[0].id);
  if(start>0){const ring=vertexIds.slice(0,-1);vertexIds=[...ring.slice(start),...ring.slice(0,start),ring[start]]}
 }
 const points=vertexIds.map(id=>{const n=byKey.get('node:'+id);return[n?.lat,n?.lon]});
 if(points.some(p=>!validPoint(p)))throw Error('invalid/outside-HK source coordinate');
 let cursor=0;const bindings=[];
 for(const stop of stopNodes){let index=vertexIds.indexOf(stop.id,cursor),snap=0;if(index<0){let best=Infinity;for(let i=cursor;i<points.length;i++){const d=meters([stop.lat,stop.lon],points[i]);if(d<best){best=d;index=i}}snap=best;if(best>80)throw Error('stop not on railway within 80m: '+stop.id)}
  if(bindings.length&&index<=bindings.at(-1).index)throw Error('non-increasing stop order');bindings.push({node:stop,index,snapMeters:snap});cursor=index+1;
 }
 const segments=[];
 for(let i=0;i<bindings.length-1;i++){const a=bindings[i],b=bindings[i+1],geometry=points.slice(a.index,b.index+1);let length=0;for(let j=1;j<geometry.length;j++){const d=meters(geometry[j-1],geometry[j]);if(d>10000)throw Error('source railway vertex jump >10km');length+=d}if(length<=0)throw Error('zero length railway segment');segments.push({geometry,segmentLengthMeters:length,sourceWayIds:ordered.filter(w=>w.ids.some(id=>vertexIds.indexOf(id)>=a.index&&vertexIds.indexOf(id)<=b.index)).map(w=>w.id)})}
 return{bindings,segments,sourceWayIds:ways.map(w=>w.id),sourceRelationId:relation.id};
}
function matchesOfficial(bindings,stops){return bindings.length===stops.length&&bindings.every((b,i)=>b.node.tags?.ref===stops[i].code||norm(b.node.tags?.['name:en'])===norm(stops[i].nameEn))}
function selectOfficialCandidate(candidate,stops){
 for(let i=0;i<=candidate.bindings.length-stops.length;i++)if(matchesOfficial(candidate.bindings.slice(i,i+stops.length),stops))return{...candidate,bindings:candidate.bindings.slice(i,i+stops.length),segments:candidate.segments.slice(i,i+stops.length-1)};
 return null;
}
module.exports={norm,meters,validPoint,extractRelation,matchesOfficial,selectOfficialCandidate};
