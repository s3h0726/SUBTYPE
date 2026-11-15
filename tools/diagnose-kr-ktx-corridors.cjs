#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const{readBatches,assembleCanonicalRoutes,distance}=require('./lib/kr-canonical.cjs');
class Heap{constructor(){this.a=[]}push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p][0]<=v[0])break;a[i]=a[p];i=p}a[i]=v}pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c}a[i]=last}return first}get length(){return this.a.length}}
const ways=read('data/kr/v2/source/osm-ways.json'),adj=new Map,points=new Map,classified=new Map;
const stats={ways:ways.length,rail:0,highspeed:0,edges:0,nodes:0};
const add=(a,b,km,wayId,kind)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push([b,km,wayId,kind])};
for(const w of ways){
 const tags=w.tags||{};
 if(!['rail','light_rail'].includes(tags.railway)||['yard','spur','siding'].includes(tags.service)||['industrial','military','test'].includes(tags.usage)||tags.disused==='yes')continue;
 stats.rail++;
 const name=[tags.name,tags['name:ko']].filter(Boolean).join(' ');
 const kind=name.includes('경부고속선')?'경부고속선':name.includes('호남고속선')?'호남고속선':name.includes('수서평택고속선')?'수서평택고속선':tags.highspeed==='yes'||parseFloat(tags.maxspeed)>=200?'other-highspeed':'other';
 if(kind!=='other')stats.highspeed++;
 classified.set(String(w.id),kind);
 const ids=w.nodeIds||[],coords=w.coordinates||[];
 for(let i=1;i<ids.length&&i<coords.length;i++){
  const a=String(ids[i-1]),b=String(ids[i]),p=coords[i-1],q=coords[i];
  if(!p||!q)continue;
  const km=distance(p,q);if(!Number.isFinite(km)||km>8)continue;
  points.set(a,p);points.set(b,q);stats.edges++;
  const factor=kind==='other'?7:1;
  if(tags.oneway!=='-1')add(a,b,km*factor,String(w.id),kind);
  if(tags.oneway!=='yes')add(b,a,km*factor,String(w.id),kind);
 }
}
stats.nodes=points.size;
const pointList=[...points];
function nearestNodes(p,k=8){
 return pointList.map(([id,q])=>({id,km:distance(p,q)})).sort((a,b)=>a.km-b.km).slice(0,k);
}
function shortest(s,e,maxCost=1800){
 const dist=new Map([[s,0]]),prior=new Map,heap=new Heap;heap.push([0,s]);
 while(heap.length){
  const [cost,node]=heap.pop();if(cost!==dist.get(node))continue;if(cost>maxCost)break;if(node===e)break;
  for(const [next,w,wayId,kind]of adj.get(node)||[]){
   const costNext=cost+w;if(costNext<(dist.get(next)??Infinity)){dist.set(next,costNext);prior.set(next,[node,wayId,kind]);heap.push([costNext,next])}
  }
 }
 if(!dist.has(e))return null;
 const ids=[e],parts=[];let len=0,fast=0;while(ids[0]!==s){
  const p=prior.get(ids[0]);if(!p)return null;
  const prev=p[0],d=distance(points.get(prev),points.get(ids[0]));len+=d;if(p[2]!=='other')fast+=d;
  parts.unshift({way:p[1],kind:p[2],length:d});ids.unshift(prev);
 }
 return{weightedKm:+dist.get(e).toFixed(1),actualKm:+len.toFixed(1),fastShare:+(fast/len).toFixed(3),points:ids.length,parts:parts.slice(0,7),ids};
}
const routes=assembleCanonicalRoutes(readBatches(root)).routes;
const targets=[
 ['kr-rail-expansion-gyeongbu-highspeed','수서','평택지제'],
 ['kr-rail-expansion-gyeongbu-highspeed','대전','동대구'],
 ['kr-rail-highspeed-honam','평택지제','수서'],
 ['kr-rail-highspeed-honam','광주송정','정읍'],
 ['kr-rail-highspeed-honam','정읍','익산'],
 ['kr-rail-highspeed-honam','오송','익산'],
 ['kr-rail-expansion-gyeongbu-highspeed','동대구','부산']
];
console.log('TRACK_GRAPH '+JSON.stringify(stats));
for(const [routeId,from,to]of targets){
 const route=routes.find(r=>r.id===routeId);
 const candidate=route?.verifiedJourneys?.flatMap(j=>j.stations.slice(0,-1).map((st,i)=>({j,st,i}))).find(x=>x.st.ko===from&&x.j.stations[x.i+1].ko===to);
 if(!candidate){console.log('NOT_FOUND '+routeId+' '+from+' '+to);continue}
 const start=candidate.j.stations[candidate.i],end=candidate.j.stations[candidate.i+1],source=candidate.j.directedSegments[candidate.i].geometry;
 const a=nearestNodes([start.latitude,start.longitude]),b=nearestNodes([end.latitude,end.longitude]);
 let best=null;
 for(const x of a.slice(0,5))for(const y of b.slice(0,5)){
  if(x.km>.4||y.km>.4)continue;
  const got=shortest(x.id,y.id,1300);if(!got)continue;
  if(!best||got.weightedKm<best.weightedKm)best={...got,snapStart:x.km,snapEnd:y.km};
 }
 let adjacent=[];
 if(best){for(const [side,geom,nodes] of [
  ['before',candidate.j.directedSegments[candidate.i-1]?.geometry||[],best.ids.slice(0,45)],
  ['after',candidate.j.directedSegments[candidate.i+1]?.geometry||[],best.ids.slice(-45)]
 ]){
  let candidateMin={km:Infinity};const sample=side==='before'?geom.slice(-100):geom.slice(0,100);
  for(let i=0;i<sample.length;i++)for(const id of nodes){const d=distance(sample[i],points.get(id));if(d<candidateMin.km)candidateMin={km:d,nodeId:id,adjacentIndex:i}}
  adjacent.push({side,bestMatch:candidateMin.km<Infinity?{km:+candidateMin.km.toFixed(4),nodeId:candidateMin.nodeId,adjacentIndex:candidateMin.adjacentIndex}:null})
 }}
 console.log('PATH_DIAG '+JSON.stringify({adjacent,routeId,from,to,originalKm:+source.reduce((sum,p,i)=>i?sum+distance(source[i-1],p):sum,0).toFixed(2),start:{lat:start.latitude,lon:start.longitude},end:{lat:end.latitude,lon:end.longitude},nearestStart:a.slice(0,2),nearestEnd:b.slice(0,2),best:best&&{weightedKm:best.weightedKm,actualKm:best.actualKm,fastShare:best.fastShare,points:best.points,snapStart:best.snapStart,snapEnd:best.snapEnd,parts:best.parts}}));
}
