'use strict';
function assembleTrack(relation,elements){
 const nodes=new Map(elements.filter(e=>e.type==='node').map(e=>[e.id,e])),ways=new Map(elements.filter(e=>e.type==='way').map(e=>[e.id,e]));
 const members=relation.members.filter(m=>m.type==='way'&&!m.role.includes('platform')&&!m.role.startsWith('stop'));
 if(!members.length)throw Error('no-track-ways');const oriented=[];
 for(let i=0;i<members.length;i++){const w=ways.get(members[i].ref);if(!w)throw Error('missing-way:'+members[i].ref);let ids=w.nodes.slice();
  if(i===0){const next=ways.get(members[1]?.ref)?.nodes||[];if(!next.includes(ids.at(-1))&&next.includes(ids[0]))ids.reverse()}
  else{const end=oriented.at(-1).at(-1);if(ids.at(-1)===end)ids.reverse();if(ids[0]!==end)throw Error('disconnected-track-way:'+members[i].ref)}oriented.push(ids);
 }
 const refs=oriented.flatMap((a,i)=>i?a.slice(1):a),geometry=refs.map(id=>{const n=nodes.get(id);if(!n)throw Error('missing-node:'+id);return[n.lat,n.lon]});return{refs,geometry,nodes,ways};
}
function assemble(relation,elements){
 const track=assembleTrack(relation,elements),stops=relation.members.filter(m=>m.type==='node'&&m.role.startsWith('stop')).map(m=>track.nodes.get(m.ref));
 if(stops.length<2||stops.some(s=>!s))throw Error('no-ordered-stop-nodes');let cursor=0;
 const aligned=stops.map(s=>{const index=track.refs.indexOf(s.id,cursor);if(index<0)throw Error('stop-not-on-track:'+s.id);cursor=index+1;return index});return{...track,stops,aligned};
}
module.exports={assembleTrack,assemble};
