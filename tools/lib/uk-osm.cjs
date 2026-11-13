'use strict';
function assembleTrack(relation,elements,{activeRailOnly=false}={}){
 const nodes=new Map(elements.filter(e=>e.type==='node').map(e=>[e.id,e])),ways=new Map(elements.filter(e=>e.type==='way').map(e=>[e.id,e]));
 const members=relation.members.filter(m=>m.type==='way'&&!m.role.includes('platform')&&!m.role.startsWith('stop'));
 if(!members.length)throw Error('no-track-ways');const oriented=[];
 for(let i=0;i<members.length;i++){const w=ways.get(members[i].ref);if(!w)throw Error('missing-way:'+members[i].ref);if(activeRailOnly&&!['rail','subway','light_rail','tram'].includes(w.tags?.railway))throw Error('inactive-track-way:'+w.id);let ids=w.nodes.slice();
  if(i===0){const next=ways.get(members[1]?.ref)?.nodes||[];if(!next.includes(ids.at(-1))&&next.includes(ids[0]))ids.reverse()}
  else{const end=oriented.at(-1).at(-1);if(ids.at(-1)===end)ids.reverse();if(ids[0]!==end)throw Error('disconnected-track-way:'+members[i].ref)}oriented.push(ids);
 }
 const refs=oriented.flatMap((a,i)=>i?a.slice(1):a),geometry=refs.map(id=>{const n=nodes.get(id);if(!n)throw Error('missing-node:'+id);return[n.lat,n.lon]});return{refs,geometry,nodes,ways};
}
function assemble(relation,elements,options={}){
 const track=assembleTrack(relation,elements,options),stops=options.reviewedTrackStops?track.refs.map(id=>track.nodes.get(id)).filter(n=>n.tags?.railway==='tram_stop'):relation.members.filter(m=>m.type==='node'&&m.role.startsWith('stop')).map(m=>track.nodes.get(m.ref));
 if(stops.length<2||stops.some(s=>!s))throw Error('no-ordered-stop-nodes');let cursor=0;
 const aligned=stops.map(s=>{const index=track.refs.indexOf(s.id,cursor);if(index<0)throw Error('stop-not-on-track:'+s.id);cursor=index+1;return index});return{...track,stops,aligned};
}
function assembleCalls(relation,elements,calls){
 const track=assembleTrack(relation,elements),normalize=s=>(s||'').toLowerCase().replace(/newcastle central/,'newcastle').replace(/[^a-z0-9]/g,'');let cursor=0;
 const aligned=[],stops=[];
 for(const call of calls){const key=normalize(call);let found=-1;
  for(let i=cursor;i<track.refs.length;i++){const node=track.nodes.get(track.refs[i]);if(normalize(node.tags?.name)===key&&['stop','tram_stop','station'].includes(node.tags?.railway)||normalize(node.tags?.name)===key&&node.tags?.public_transport==='stop_position'){found=i;break}}
  if(found<0)throw Error('official-call-not-on-ordered-track:'+call);
  aligned.push(found);stops.push({...track.nodes.get(track.refs[found]),tags:{...track.nodes.get(track.refs[found]).tags,name:call}});cursor=found+1;
 }
 return{...track,aligned,stops};
}
module.exports={assembleTrack,assemble,assembleCalls};
