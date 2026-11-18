#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {makeGraph}=require('./repair-kr-ktx-proven-graph.cjs');
const ways=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/kr/v2/source/osm-ways.json'),'utf8'));
const graph=makeGraph(ways),edges=[...graph.byWay.values()].flatMap(x=>[...x.values()]).filter(e=>e.fast);
const parent=new Map(),size=new Map();
const root=x=>{if(!parent.has(x)){parent.set(x,x);size.set(x,1)}if(parent.get(x)!==x)parent.set(x,root(parent.get(x)));return parent.get(x)};
const union=(a,b)=>{a=root(a);b=root(b);if(a===b)return;if(size.get(a)<size.get(b))[a,b]=[b,a];parent.set(b,a);size.set(a,size.get(a)+size.get(b))};
for(const e of edges)union(e.ak,e.bk);
const comps=new Map();
for(const e of edges){
 const key=root(e.ak),c=comps.get(key)||{id:key,edges:0,km:0,points:new Map(),names:new Set()};
 c.edges++;c.km+=e.km;c.points.set(e.ak,e.a);c.points.set(e.bk,e.b);if(e.corridor)c.names.add(e.corridor);comps.set(key,c);
}
const stops={'대전':[36.3305619,127.4359359],'동대구':[35.8799722,128.6300202],'경주':[35.7981699,129.1398093],'부산':[35.1155532,129.0425868]};
const km=(a,b)=>{const rad=Math.PI/180,dy=(a[0]-b[0])*rad,dx=(a[1]-b[1])*rad;return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dx/2)**2)))};
const summary=[...comps.values()].map(c=>{
 let min={},extent=[90,-90,180,-180];
 for(const [n,p]of c.points){for(const [st,coord]of Object.entries(stops)){const d=km(p,coord);if(!min[st]||min[st].km>d)min[st]={km:d,node:n,coord:p}}
 extent[0]=Math.min(extent[0],p[0]);extent[1]=Math.max(extent[1],p[0]);extent[2]=Math.min(extent[2],p[1]);extent[3]=Math.max(extent[3],p[1])}
 return {id:c.id,edges:c.edges,km:+c.km.toFixed(2),nodes:c.points.size,names:[...c.names],extent,nearest:Object.fromEntries(Object.entries(min).map(([s,v])=>[s,{km:+v.km.toFixed(3),node:v.node,coord:v.coord}]))};
});
const important=summary.filter(c=>c.km>5).sort((a,b)=>b.km-a.km);
const corridor=important.filter(c=>
 c.nearest['대전'].km<12||c.nearest['동대구'].km<12||
 (c.extent[1]>35.8&&c.extent[0]<36.4&&c.extent[3]>127.3&&c.extent[2]<128.7));
console.log('KTX_HSR_COMPONENT_COUNT '+JSON.stringify({components:comps.size,fastEdges:edges.length,major:important.length,nearSouth:corridor.length}));
for(const c of corridor.slice(0,35))console.log('KTX_HSR_COMPONENT '+JSON.stringify(c));
