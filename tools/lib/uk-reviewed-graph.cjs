'use strict';
const {UKTrackGraph}=require('./uk-track-graph.cjs');
const normalize=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
// For explicitly reviewed timetable calls only. All edges are consecutive nodes
// of source railway ways; platform geometry is never an infrastructure edge.
function assembleReviewedGraph(relations,elements,calls,aliases={}){
 const nodes=new Map(elements.filter(e=>e.type==='node').map(e=>[e.id,e])),ways=new Map(elements.filter(e=>e.type==='way').map(e=>[e.id,e])),graph=new UKTrackGraph;
 for(const r of relations)for(const m of r.members){if(m.type!=='way'||/platform|stop/.test(m.role))continue;const w=ways.get(m.ref);if(!w||!['rail','light_rail','tram','subway'].includes(w.tags?.railway))continue;
  const refs=w.nodes,points=refs.map(id=>{const n=nodes.get(id);if(!n)throw Error('missing-source-node:'+id);return[n.lat,n.lon]});
  if(w.tags?.oneway!=='-1')graph.add(refs,points,r.id);
  if(w.tags?.oneway!=='yes'&&w.tags?.oneway!=='1')graph.add(refs.slice().reverse(),points.slice().reverse(),r.id);
 }
 const requested=calls.map(name=>{const key=normalize(aliases[name]||name),matches=[...nodes.values()].filter(n=>normalize(n.tags?.name)===key&&(n.tags?.railway==='tram_stop'||n.tags?.public_transport==='stop_position'||n.tags?.railway==='stop'));if(!matches.length)throw Error('no-named-source-stop:'+name);return{name,lat:matches[0].lat,lon:matches[0].lon,source:matches[0]}});
 const parts=graph.resolve(requested),refs=[],geometry=[],aligned=[];
 for(const part of parts){aligned.push(refs.length?refs.length-1:0);refs.push(...(refs.length?part.refs.slice(1):part.refs));geometry.push(...(geometry.length?part.geometry.slice(1):part.geometry))}aligned.push(refs.length-1);
 const stops=requested.map((s,n)=>({...s.source,tags:{...s.source.tags,name:calls[n]}}));
 const maxStationOffsetKm=Math.max(...requested.map((s,i)=>Math.hypot((s.lat-geometry[aligned[i]][0])*111.195,(s.lon-geometry[aligned[i]][1])*111.195*Math.cos(s.lat*Math.PI/180))));
 if(maxStationOffsetKm>0.3)throw Error('station-outside-mapped-track');
 return{refs,geometry,aligned,stops,maxStationOffsetKm};
}
module.exports={assembleReviewedGraph};
