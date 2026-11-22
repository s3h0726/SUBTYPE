#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {makeGraph}=require('./repair-kr-ktx-proven-graph.cjs');
const {distance}=require('./lib/kr-canonical.cjs');
const {projection}=require('./lib/kr-road-binding.cjs');
const ways=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/kr/v2/source/osm-ways.json'),'utf8'));
const graph=makeGraph(ways);
const edges=[...graph.byWay.values()].flatMap(x=>[...x.values()]);
const targets=[
 ['대전','동대구',[36.3305619,127.4359359],[35.8799722,128.6300202],'경부고속선'],
 ['동대구','경주',[35.8799722,128.6300202],[35.7981699,129.1398093],'경부고속선'],
 ['경주','부산',[35.7981699,129.1398093],[35.1155532,129.0425868],'경부고속선'],
 ['동대구','부산',[35.8799722,128.6300202],[35.1155532,129.0425868],'경부고속선'],
 ['행신','서울역',[37.6123655,126.8364],[37.5537729,126.9712],'경의선']
];
class Heap{constructor(){this.a=[]}push(v){const a=this.a;let i=a.length;a.push(v);while(i){const j=(i-1)>>1;if(a[j][0]<=v[0])break;a[i]=a[j];i=j}a[i]=v}pop(){const a=this.a,one=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let k=i*2+1;if(k+1<a.length&&a[k+1][0]<a[k][0])k++;if(a[k][0]>=last[0])break;a[i]=a[k];i=k}a[i]=last}return one}get length(){return this.a.length}}
function makeAdj(filter){const adj=new Map();for(const e of edges){if(!filter(e))continue;for(const [a,b,rev]of [[e.ak,e.bk,false],[e.bk,e.ak,true]]){if(!adj.has(a))adj.set(a,[]);adj.get(a).push({to:b,e,rev,km:e.km})}}return adj}
const indexes={hsr:makeAdj(e=>e.corridor==='경부고속선'||e.fast),
 rail:makeAdj(e=>true)};
const near=(p,filter,limit=8)=>{
 const hits=[];for(const e of edges){if(!filter(e))continue;const m=projection(p,e.a,e.b);if(m.offset<.18)hits.push({e,p:m.point,offset:m.offset})}
 hits.sort((a,b)=>a.offset-b.offset);return hits.slice(0,limit);
};
function bestRoute(origins,goals,adj,corridor,max=1200){
 const heap=new Heap(),dist=new Map(),prev=new Map();
 for(const x of origins){
  for(const node of [x.e.ak,x.e.bk]){
   const pos=graph.positions.get(node),d=distance(pos,x.p),cost=d+(corridor&&x.e.corridor!==corridor?d*4:0);
   if(cost<(dist.get(node)??Infinity)){dist.set(node,cost);prev.set(node,{start:x,terminal:x.p});heap.push([cost,node])}
  }
 }
 const goalNodes=new Map();
 for(const g of goals)for(const node of [g.e.ak,g.e.bk]){
  const d=distance(graph.positions.get(node),g.p);const current=goalNodes.get(node);
  if(!current||current.cost>d)goalNodes.set(node,{goal:g,cost:d});
 }
 let best=null,visited=0;
 while(heap.length){
  const [cost,node]=heap.pop();if(cost!==dist.get(node))continue;
  if(best&&cost>best.cost)break;if(cost>max)break;
  const terminal=goalNodes.get(node);
  if(terminal&&(!best||best.cost>cost+terminal.cost))best={node,cost:cost+terminal.cost,terminal};
  for(const ed of adj.get(node)||[]){
   const v=ed.e,penalty=v.corridor===corridor?1:(v.fast?1.3:8);
   const next=cost+ed.km*penalty;
   if(next<(dist.get(ed.to)??Infinity)){dist.set(ed.to,next);prev.set(ed.to,{parent:node,edge:ed});heap.push([next,ed.to])}
  }
  if(++visited>200000)break;
 }
 if(!best)return {reason:'NO_PATH',visited};
 const segments=[];let p=best.node;
 while(true){const step=prev.get(p);if(!step)return {reason:'BROKEN_PREV'};if(step.start){segments.unshift({type:'anchor',from:step.start.p,to:graph.positions.get(p)});break}segments.unshift({type:'edge',a:graph.positions.get(step.parent),b:graph.positions.get(p),...step.edge});p=step.parent}
 const geomKm=segments.reduce((sum,z)=>sum+distance(z.a||z.from,z.b||z.to),0)+best.terminal.cost;
 const full=segments.filter(x=>x.type==='edge');
 let reversed=0,fast=0,named=0,nonfast=0,km=0;
 for(const z of full){const d=z.km;km+=d;if(z.e.fast)fast+=d;else nonfast+=d;if(z.e.corridor===corridor)named+=d;if(z.rev&&(z.e.oneway==='yes'))reversed+=d;if(!z.rev&&(z.e.oneway==='-1'))reversed+=d}
 const bounds=[90,-90,180,-180];for(const z of full)for(const p of [z.a,z.b]){bounds[0]=Math.min(bounds[0],p[0]);bounds[1]=Math.max(bounds[1],p[0]);bounds[2]=Math.min(bounds[2],p[1]);bounds[3]=Math.max(bounds[3],p[1])}
 return {km:+geomKm.toFixed(2),fastShare:+(fast/(km||1)).toFixed(3),namedShare:+(named/(km||1)).toFixed(3),reversedOneWayKm:+reversed.toFixed(2),segments:full.length,
   firstWays:full.slice(0,10).map(z=>z.e.evidence.wayId),lastWays:full.slice(-10).map(z=>z.e.evidence.wayId),
   bounds,anchors:{start:segments[0].from,end:best.terminal.goal.p},visited};
}
for(const [from,to,start,end,corridor]of targets){
 const isHsr=corridor==='경부고속선';
 const origins=near(start,e=>isHsr?e.corridor===corridor:!e.fast,8),goals=near(end,e=>isHsr?e.corridor===corridor:!e.fast,8);
 for(const type of [isHsr?'hsr':'rail','rail']){
  const result=bestRoute(origins,goals,indexes[type],corridor,1800);
  console.log('KTX_SOURCE_BIDIRECTIONAL '+JSON.stringify({from,to,type,originCandidates:origins.length,goalCandidates:goals.length,closestStartKm:origins[0]?.offset,closestEndKm:goals[0]?.offset,...result}));
 }
}
