'use strict';
// Provenance lookup: each rendered segment must be collinear with one
// original OSM edge and obey its original one-way rail direction.
const fs=require('node:fs'),path=require('node:path');
const {projection}=require('./kr-road-binding.cjs');
const root=path.resolve(__dirname,'../..'),cell=.025;
let cached;
function build(){
 if(cached)return cached;
 const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
 const grid=new Map(),edges=[];
 for(const w of ways){
  const tags=w.tags||{},ids=w.nodeIds||[],coordinates=w.coordinates||[];
  if(!['rail','subway','light_rail','monorail','narrow_gauge'].includes(tags.railway)||['yard','spur'].includes(tags.service))continue;
  for(let i=1;i<coordinates.length&&i<ids.length;i++){
   const a=coordinates[i-1],b=coordinates[i];
   if(!Array.isArray(a)||!Array.isArray(b)||a.every((x,j)=>x===b[j]))continue;
   const e={a,b,oneway:tags.oneway,wayId:String(w.id),fromNodeId:String(ids[i-1]),toNodeId:String(ids[i])},n=edges.length;edges.push(e);
   const ya=Math.floor(Math.min(a[0],b[0])/cell),yb=Math.floor(Math.max(a[0],b[0])/cell);
   const xa=Math.floor(Math.min(a[1],b[1])/cell),xb=Math.floor(Math.max(a[1],b[1])/cell);
   for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){const key=y+':'+x;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(n)}
  }
 }
 cached={grid,edges,memo:new Map()};return cached;
}
function proofFor(a,b){
 const {grid,edges,memo}=build(),key=a.join(',')+'|'+b.join(',');
 if(memo.has(key))return memo.get(key);
 const y=Math.floor(((a[0]+b[0])/2)/cell),x=Math.floor(((a[1]+b[1])/2)/cell);
 let answer=null;const seen=new Set();
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  for(const id of grid.get((y+dy)+':'+(x+dx))||[]){
   if(seen.has(id))continue;seen.add(id);
   const edge=edges[id],p=projection(a,edge.a,edge.b),q=projection(b,edge.a,edge.b);
   if(p.offset>=1e-7||q.offset>=1e-7)continue;
   if(edge.oneway==='yes'&&q.t+1e-10<p.t)continue;
   if(edge.oneway==='-1'&&q.t>p.t+1e-10)continue;
   answer={wayId:edge.wayId,fromNodeId:edge.fromNodeId,toNodeId:edge.toNodeId};break;
  }
  if(answer)break;
 }
 memo.set(key,answer);return answer;
}
function provePoints(points){
 const refs=[];
 for(let i=1;i<points.length;i++){
  const p=proofFor(points[i-1],points[i]);
  if(!p)return {refs:null,failedAt:i-1,from:points[i-1],to:points[i]};
  refs.push(p);
 }
 return {refs};
}
module.exports={proofFor,provePoints};
