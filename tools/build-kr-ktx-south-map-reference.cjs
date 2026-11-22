'use strict';
// Build a GAME MAP centerline from consecutive original OSM Gyeongbu HSR
// way nodes. The undirected graph follows physical rails for visualization;
// it is never evidence of a train running against an OSM one-way tag.
const fs=require('node:fs'),path=require('node:path');
const km=(a,b)=>Math.hypot((a[0]-b[0])*111.195,
 (a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
module.exports=function buildSouthKtxMapReference(root,anchors){
 const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
 const adjacency=new Map(),positions=new Map();
 for(const way of ways){
  const tags=way.tags||{},name=[tags.name,tags['name:ko'],tags.ref].join(' ');
  if(tags.railway!=='rail'||['siding','yard','spur'].includes(tags.service)||
   tags.disused==='yes'||!(name.includes('경부고속선')||tags.highspeed==='yes'||
   Number(tags.maxspeed)>=200))continue;
  const named=name.includes('경부고속선');
  for(let i=1;i<(way.nodeIds||[]).length;i++){
   const a=way.coordinates[i-1],b=way.coordinates[i];
   if(a[0]>36.1||b[0]>36.1||a[0]<34.95||b[0]<34.95||
    a[1]<128.45||b[1]<128.45)continue;
   const x=String(way.nodeIds[i-1]),y=String(way.nodeIds[i]),length=km(a,b);
   positions.set(x,a);positions.set(y,b);
   if(!adjacency.has(x))adjacency.set(x,[]);
   if(!adjacency.has(y))adjacency.set(y,[]);
   const edge={km:length,named,wayId:String(way.id)};
   adjacency.get(x).push({to:y,...edge});
   adjacency.get(y).push({to:x,...edge});
  }
 }
 const nearest=point=>[...positions].map(([id,p])=>({id,d:km(point,p)}))
  .sort((a,b)=>a.d-b.d).slice(0,3);
 function build(from,to,fromKo,toKo,range){
  const start=nearest(anchors[from]),end=nearest(anchors[to]);
  if(start[0].d>.2||end[0].d>.2)throw Error('KTX_SOUTH_OSM_ANCHOR_GAP '+from+'/'+to);
  const distances=new Map(),parents=new Map(),visited=new Set(),
        goals=new Set(end.map(item=>item.id));
  for(const item of start){distances.set(item.id,item.d);parents.set(item.id,null)}
  let last=null;
  while(true){
   let node=null,cost=Infinity;
   for(const [id,d] of distances)if(!visited.has(id)&&d<cost){node=id;cost=d}
   if(node===null)break;
   if(goals.has(node)){last=node;break}
   visited.add(node);
   for(const edge of adjacency.get(node)||[]){
    const next=cost+edge.km*(edge.named?1:2);
    if(next>=(distances.get(edge.to)??Infinity))continue;
    distances.set(edge.to,next);
    parents.set(edge.to,{parent:node,edge});
   }
  }
  if(!last)throw Error('KTX_SOUTH_OSM_DISCONNECTED '+from+'/'+to);
  const nodes=[last],wayIds=new Set();let highSpeedKm=0,otherKm=0,maxEdgeKm=0;
  while(parents.get(nodes[0])){
   const {parent,edge}=parents.get(nodes[0]);
   if(edge.named)highSpeedKm+=edge.km;else otherKm+=edge.km;
   maxEdgeKm=Math.max(maxEdgeKm,edge.km);
   wayIds.add(edge.wayId);nodes.unshift(parent);
  }
  const raw=nodes.map(id=>positions.get(id)),geometry=[raw[0]];
  // Subdivide the SAME original OSM source edge. Do not add artificial bends.
  for(let i=1;i<raw.length;i++){
   const a=raw[i-1],b=raw[i],count=Math.max(1,Math.ceil(km(a,b)/1.25));
   for(let n=1;n<=count;n++){
    geometry.push(n===count?b:[a[0]+(b[0]-a[0])*n/count,
     a[1]+(b[1]-a[1])*n/count]);
   }
  }
  const length=geometry.reduce((sum,p,i)=>i?sum+km(geometry[i-1],p):sum,0);
  const nearUlsan=Math.min(...geometry.map(p=>km(p,[35.554,129.138])));
  if(length<range[0]||length>range[1]||
   highSpeedKm/(highSpeedKm+otherKm)<.98||nearUlsan>.3||maxEdgeKm>11)
   throw Error('KTX_SOUTH_OSM_SOURCE_REJECTED '+from+'/'+to+' '+length);
  return{displayFrom:fromKo,displayTo:toKo,
   originalDirection:'OSM 경부고속선 물리선형(지도 표시용)',referenceJourneyId:null,
   method:'OSM named Gyeongbu HSR adjacent-way-node route; cartographic centerline only',
   mayUseForOperationalRouting:false,corridor:'경부고속선',
   note:'울산역 경유 실제 OSM 선로. 운영·시간표 증빙이 아닌 지도/게임 애니메이션 보정용.',
   km:+length.toFixed(3),osmWayCount:wayIds.size,geometry};
 }
 return{
  gyeongjuToBusan:build('gyeongju','busan','경주','부산',[75,90]),
  dongdaeguToBusan:build('dongdaegu','busan','동대구','부산',[120,138])
 };
};
