'use strict';
const distance=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
class Heap{
 constructor(){this.a=[]}
 push(v){let i=this.a.length;this.a.push(v);while(i){const p=(i-1)>>1;if(this.a[p][0]<=v[0])break;this.a[i]=this.a[p];i=p}this.a[i]=v}
 pop(){const top=this.a[0],v=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let c=i*2+1;if(c+1<this.a.length&&this.a[c+1][0]<this.a[c][0])c++;if(this.a[c][0]>=v[0])break;this.a[i]=this.a[c];i=c}this.a[i]=v}return top}
}
class UKTrackGraph{
 constructor(){this.nodes=new Map;this.edges=new Map}
 add(refs,geometry,relationId){for(let i=0;i<refs.length;i++){this.nodes.set(refs[i],geometry[i]);if(i){const from=refs[i-1],to=refs[i];if(!this.edges.has(from))this.edges.set(from,new Map);this.edges.get(from).set(to,{km:distance(geometry[i-1],geometry[i]),relationId})}}}
 candidates(station){const point=[station.lat,station.lon];return [...this.nodes].map(([id,p])=>({id,d:distance(point,p)})).filter(p=>p.d<=0.3).sort((a,b)=>a.d-b.d).slice(0,24)}
 path(sources,targets,maxKm){
  const targetMap=new Map(targets.map(t=>[t.id,t])),cost=new Map,parent=new Map,heap=new Heap;
  for(const s of sources){const value=s.d*4;if(value<(cost.get(s.id)??Infinity)){cost.set(s.id,value);heap.push([value,s.id])}}
  let end=null,best=Infinity;
  while(heap.a.length){const [value,id]=heap.pop();if(value!==cost.get(id))continue;if(value>best||value>maxKm+2.4)break;
   if(targetMap.has(id)){const total=value+targetMap.get(id).d*4;if(total<best){best=total;end=id}}
   for(const[to,e]of this.edges.get(id)||[]){const v=value+e.km;if(v<(cost.get(to)??Infinity)){cost.set(to,v);parent.set(to,{id,relationId:e.relationId});heap.push([v,to])}}
  }
  if(end===null)throw Error('no-connected-directed-OSM-path');
  const refs=[end],relations=new Set;while(parent.has(refs.at(-1))){const p=parent.get(refs.at(-1));relations.add(p.relationId);refs.push(p.id)}refs.reverse();
  const geometry=refs.map(id=>this.nodes.get(id));let km=0;for(let i=1;i<geometry.length;i++)km+=distance(geometry[i-1],geometry[i]);
  if(refs.length<2||km>maxKm)throw Error('implausible-OSM-path-length');return{refs,geometry,relationIds:[...relations]};
 }
 resolve(stations){
  const candidates=stations.map(s=>this.candidates(s));if(candidates.some(c=>!c.length))throw Error('station-outside-mapped-track');
  const segments=[];let sources=candidates[0];
  for(let i=0;i<stations.length-1;i++){const maxKm=distance([stations[i].lat,stations[i].lon],[stations[i+1].lat,stations[i+1].lon])*4+0.5,part=this.path(sources,candidates[i+1],maxKm);segments.push(part);sources=[{id:part.refs.at(-1),d:0}]}
  return segments;
 }
}
module.exports={UKTrackGraph};
