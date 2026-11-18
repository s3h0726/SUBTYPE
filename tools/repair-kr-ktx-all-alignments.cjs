#!/usr/bin/env node
'use strict';
// Corrects only demonstrably better KTX alignments using exact OSM railway
// edges. No guessed station sequence, arbitrary straight-line corridor, or
// connection between unrelated OSM nodes is permitted.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {distance,validateRoute,readBatches}=require('./lib/kr-canonical.cjs');
const {expectedCorridor,indexTracks,nearest,samples}=require('./audit-kr-ktx-track-alignment.cjs');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const HIGHSPEED=['경부고속선','호남고속선','수서평택고속선','강릉선'];
const geoKey=p=>p[0].toFixed(7)+','+p[1].toFixed(7);
const len=points=>points.reduce((s,p,i)=>i?s+distance(points[i-1],p):s,0);
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a[0]===b[0]&&a[1]===b[1];
function classify(tags){
 const name=[tags.name,tags['name:ko'],tags.ref].filter(Boolean).join(' ');
 const corridor=HIGHSPEED.find(n=>name.includes(n))||null;
 const fast=!!corridor||tags.highspeed==='yes'||Number.parseFloat(tags.maxspeed)>=200;
 return {corridor,fast};
}
function project(p,a,b){
 const sx=Math.cos(p[0]*Math.PI/180);
 const dx=(b[1]-a[1])*sx,dy=b[0]-a[0];
 const t=Math.max(0,Math.min(1,((p[1]-a[1])*sx*dx+(p[0]-a[0])*dy)/(dx*dx+dy*dy||1)));
 const point=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
 return {t,point,offset:distance(p,point)};
}
class Heap{
 constructor(){this.a=[]}
 push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p][0]<=v[0])break;a[i]=a[p];i=p}a[i]=v}
 pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c}a[i]=last}return first}
 get length(){return this.a.length}
}
function graphFromWays(ways){
 const nodes=new Map(),adj=new Map(),grid=new Map(),cell=.012;
 const coord=k=>nodes.get(k);
 const gridKey=(y,x)=>Math.floor(y/cell)+':'+Math.floor(x/cell);
 const insert=(a,b,edge)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push({to:b,...edge})};
 const edges=[];
 for(const w of ways){
  const tags=w.tags||{};
  if(tags.railway!=='rail'||['yard','spur','siding'].includes(tags.service)||['industrial','military','test'].includes(tags.usage)||tags.disused==='yes'||tags.access==='no')continue;
  const c=w.coordinates||[];
  const kind=classify(tags);
  for(let i=1;i<c.length;i++){
   const a=c[i-1],b=c[i];if(!Array.isArray(a)||!Array.isArray(b))continue;
   const km=distance(a,b);if(km<=.000001||km>5)continue;
   const ak=geoKey(a),bk=geoKey(b);
   nodes.set(ak,a);nodes.set(bk,b);
   const entry={km,wayId:String(w.id),...kind};
   // Rail direction tags are not a ban on reverse operations. Train service
   // direction is retained from the original timetable.
   insert(ak,bk,entry);insert(bk,ak,entry);
   const edge={ak,bk,a,b,...entry},index=edges.length;edges.push(edge);
   const aY=Math.floor(Math.min(a[0],b[0])/cell),bY=Math.floor(Math.max(a[0],b[0])/cell);
   const aX=Math.floor(Math.min(a[1],b[1])/cell),bX=Math.floor(Math.max(a[1],b[1])/cell);
   for(let y=aY;y<=bY;y++)for(let x=aX;x<=bX;x++){
    const k=y+':'+x;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(index);
   }
  }
 }
 const snaps=(p,maxMeters=8)=>{
  const y=Math.floor(p[0]/cell),x=Math.floor(p[1]/cell),hits=[];
  const visited=new Set();
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   for(const index of grid.get((y+dy)+':'+(x+dx))||[]){
    if(visited.has(index))continue;visited.add(index);
    const edge=edges[index],match=project(p,edge.a,edge.b);
    if(match.offset*1000<=maxMeters)hits.push({edge,...match});
   }
  }
  hits.sort((a,b)=>a.offset-b.offset);
  return hits.slice(0,16);
 };
 return {nodes,adj,edges,snaps,coord};
}
function edgePenalty(edge,corridor){
 if(edge.corridor===corridor)return 1;
 if(edge.fast&&!edge.corridor)return 1.18;
 if(edge.fast)return 5;
 return 12;
}
function graphRoute(graph,from,to,corridor,oldKm){
 const starts=graph.snaps(from),ends=graph.snaps(to);
 if(!starts.length||!ends.length)return {reason:'NO_SOURCE_EDGE_SNAP',startCandidates:starts.length,endCandidates:ends.length};
 const endNodes=new Map();
 for(const e of ends)for(const id of [e.edge.ak,e.edge.bk]){
  const km=distance(e.point,graph.coord(id))+e.offset;
  const cost=km*edgePenalty(e.edge,corridor);
  if(!endNodes.has(id)||cost<endNodes.get(id).cost)endNodes.set(id,{cost,km,wayId:e.edge.wayId,fast:e.edge.fast,corridor:e.edge.corridor});
 }
 const dist=new Map(),prior=new Map(),heap=new Heap();
 for(const s of starts)for(const id of [s.edge.ak,s.edge.bk]){
  const km=distance(s.point,graph.coord(id))+s.offset;
  const cost=km*edgePenalty(s.edge,corridor);
  if(cost>=(dist.get(id)??Infinity))continue;
  dist.set(id,cost);prior.set(id,{from:null,km,fast:s.edge.fast,corridor:s.edge.corridor,wayId:s.edge.wayId});
  heap.push([cost,id]);
 }
 let best=null,steps=0;const maxCost=Math.min(2500,Math.max(160,oldKm*22));
 while(heap.length){
  const [cost,id]=heap.pop();
  if(cost!==dist.get(id)||cost>maxCost)continue;
  if(best&&cost>best.cost)break;
  const tail=endNodes.get(id);
  if(tail&&(!best||cost+tail.cost<best.cost))best={cost:cost+tail.cost,id,tail};
  for(const edge of graph.adj.get(id)||[]){
   const value=cost+edge.km*edgePenalty(edge,corridor);
   if(value>maxCost||value>=(dist.get(edge.to)??Infinity))continue;
   dist.set(edge.to,value);
   prior.set(edge.to,{from:id,km:edge.km,fast:edge.fast,corridor:edge.corridor,wayId:edge.wayId});
   heap.push([value,edge.to]);
  }
  if(++steps>1000000)break;
 }
 if(!best)return {reason:'NO_CONNECTED_OSM_ROUTE',startCandidates:starts.length,endCandidates:ends.length};
 const ids=[best.id];let fast=best.tail.fast?best.tail.km:0,named=best.tail.corridor===corridor?best.tail.km:0,total=best.tail.km;
 const wayIds=new Set([best.tail.wayId]);
 while(true){
  const rec=prior.get(ids[0]);if(!rec)return {reason:'BROKEN_GRAPH_PREDECESSOR'};
  fast+=rec.fast?rec.km:0;
  if(rec.corridor===corridor)named+=rec.km;
  total+=rec.km;wayIds.add(rec.wayId);
  if(!rec.from)break;
  ids.unshift(rec.from);
 }
 const geometry=[from,...ids.map(id=>graph.coord(id)),to];
 const unique=[];
 for(const p of geometry)if(!same(unique.at(-1),p))unique.push(p);
 if(unique.length<2)return {reason:'EMPTY_PATH'};
 const finalKm=len(unique);
 return {geometry:unique,km:finalKm,fastShare:fast/Math.max(total,.001),namedShare:named/Math.max(total,.001),wayIds:[...wayIds],sourceSnapMaxMeters:8};
}
function evidence(points,corridor,tracks){
 const sample=samples(points,1.6).slice(1,-1);
 if(!sample.length)return {coverage:0,density:0,namedDensity:0};
 let known=0,matched=0,named=0;
 for(const p of sample){
  const d=nearest(p,corridor,tracks);
  if(d.distanceKm!==null){known++;if(d.distanceKm<=.3)matched++}
  if(d.namedDistanceKm!==null&&d.namedDistanceKm<=1)named++;
 }
 return {coverage:matched/sample.length,density:known/sample.length,namedDensity:named/sample.length};
}
function isKtx(route,j){
 const label=[route.line?.ko,j.patternName?.ko,j.service?.nameKo].join(' ');
 return route.countryId==='kr'&&route.mode==='high_speed_rail'&&!/SRT|에스알티/.test(label)&&/KTX|케이티엑스|고속철도|고속선/.test(label);
}
function decide(oldGeom,next,corridor,tracks){
 const originalKm=len(oldGeom),straightKm=distance(oldGeom[0],oldGeom.at(-1));
 const before=evidence(oldGeom,corridor,tracks);
 if(originalKm<10||straightKm<5)return {accept:false,reason:'SEGMENT_TOO_SHORT'};
 const detour=originalKm>straightKm*1.58&&originalKm-straightKm>9;
 const offset=before.density>=.6&&before.coverage<.65;
 const gap=before.density<.6&&originalKm>straightKm*1.28;
 if(!detour&&!offset&&!gap)return {accept:false,reason:'EXISTING_WITHIN_TOLERANCE'};
 if(!next.geometry)return {accept:false,reason:next.reason,originalKm:+originalKm.toFixed(2)};
 const after=evidence(next.geometry,corridor,tracks);
 const shorten=next.km<originalKm-Math.max(2,originalKm*.045);
 const betterAlignment=after.coverage>=before.coverage+.2&&after.coverage>=.72&&next.km<=originalKm*1.035;
 const physicallyPossible=next.km>=straightKm*.99&&next.km<=straightKm*1.65
  &&next.fastShare>=.83&&next.km<=originalKm*1.035
  &&next.geometry.every((p,i)=>!i||distance(next.geometry[i-1],p)<=2);
 const accept=physicallyPossible&&(shorten||betterAlignment)
  &&(after.coverage>=.75||next.namedShare>=.7);
 return {accept,reason:accept?'SOURCE_TRACK_IMPROVEMENT':!physicallyPossible?'SOURCE_PROOF_INSUFFICIENT':'NO_SIGNIFICANT_IMPROVEMENT',
  originalKm:+originalKm.toFixed(2),correctedKm:+next.km.toFixed(2),
  fastShare:+next.fastShare.toFixed(3),namedShare:+next.namedShare.toFixed(3),
  originalCoverage:+before.coverage.toFixed(3),newCoverage:+after.coverage.toFixed(3)};
}
function rebuild(j,segments){
 const geometry=[],stations=j.stations.map(s=>({...s}));
 const newSegments=segments.map((s,i)=>({...j.directedSegments[i],geometry:s}));
 for(let i=0;i<newSegments.length;i++){
  const pts=newSegments[i].geometry;
  if(pts.length<2)throw Error('EMPTY_SEGMENT_'+i);
  if(i===0){stations[0].geometryIndex=0;geometry.push(...pts)}
  else {if(!same(geometry.at(-1),pts[0]))throw Error('TRACK_BREAK_AT_'+i);geometry.push(...pts.slice(1))}
  stations[i+1].geometryIndex=geometry.length-1;
 }
 for(const s of stations)if(distance([s.latitude,s.longitude],geometry[s.geometryIndex])>.15)throw Error('STATION_TRACK_OFFSET_'+s.ko);
 return {...j,geometry,stations,directedSegments:newSegments};
}
function main(){
 const ways=read('data/kr/v2/source/osm-ways.json');
 const tracks=indexTracks(ways),graph=graphFromWays(ways);
 const batches=readBatches(root),cache=new Map(),changes=[],events=[];
 let tested=0,improved=0,ktx=0;
 for(const batch of batches){
  let dirty=false;
  for(const route of batch.routes||[]){
   const keep=route.verifiedJourneys||[];
   let routeDirty=false;
   for(let ji=0;ji<keep.length;ji++){
    const j=keep[ji];if(!isKtx(route,j))continue;ktx++;
    const names=j.stations.map(s=>s.ko);
    let updated=j,diffs=[],segmentGeoms=j.directedSegments.map(s=>s.geometry);
    for(let i=0;i<segmentGeoms.length;i++){
     const corridor=expectedCorridor(names[i],names[i+1],names);
     if(!corridor)continue;
     tested++;
     const geom=segmentGeoms[i],key=JSON.stringify([corridor,geom[0],geom.at(-1)]);
     if(!cache.has(key)){
      const originalKm=len(geom),straightKm=distance(geom[0],geom.at(-1));
      const e=evidence(geom,corridor,tracks);
      const suspected=originalKm>straightKm*1.58&&originalKm-straightKm>9
       ||e.density>=.6&&e.coverage<.65
       ||e.density<.6&&originalKm>straightKm*1.28;
      const replacement=suspected?graphRoute(graph,geom[0],geom.at(-1),corridor,originalKm):{reason:'EXISTING_WITHIN_TOLERANCE'};
      cache.set(key,{replacement,decision:decide(geom,replacement,corridor,tracks)});
     }
     const {replacement,decision}=cache.get(key);
     if(decision.reason==='EXISTING_WITHIN_TOLERANCE')continue;
     events.push({routeId:route.id,journeyId:j.id,from:names[i],to:names[i+1],corridor,...decision});
     if(decision.accept){
      segmentGeoms[i]=replacement.geometry;
      diffs.push({index:i,from:names[i],to:names[i+1],corridor,wayIds:replacement.wayIds,
       oldKm:decision.originalKm,newKm:decision.correctedKm,oldCoverage:decision.originalCoverage,
       newCoverage:decision.newCoverage,source:'OpenStreetMap exact rail-way vertices, connected by coincident source coordinates'});
     }
    }
    if(!diffs.length)continue;
    try{
     const candidate=rebuild(j,segmentGeoms);
     candidate.ktxTrackCorrection={method:'source-backed-rail-graph-realignment',checkedAt:'2026-11-18',legs:diffs};
     const probe={...route,verifiedJourneys:[candidate]};
     const errors=validateRoute(probe);
     if(errors.length)throw Error(errors.join(' | '));
     updated=candidate;keep[ji]=updated;routeDirty=dirty=true;
     improved+=diffs.length;
    }catch(error){
     events.push({routeId:route.id,journeyId:j.id,reason:'REJECTED_POST_VALIDATION',error:String(error)});
    }
   }
   if(routeDirty){
    route.verifiedJourneys=keep;
    const first=keep[0];
    route.geometry=first.geometry;route.stations=first.stations;route.directedSegments=first.directedSegments;
    const errors=validateRoute(route);
    if(errors.length)throw Error('INVALID_ROUTE_AFTER_REPAIR '+route.id+' '+errors.join(';'));
   }
  }
  if(dirty)changes.push(batch);
 }
 const summary={ktxJourneys:ktx,checkedHighSpeedLegs:tested,uniqueCheckedSegments:cache.size,
  changedJourneys:events.filter(x=>x.accept).length,correctedLegInstances:improved,
  changedBatches:changes.map(x=>x.name),statusCounts:{}};
 for(const x of events)summary.statusCounts[x.reason]=(summary.statusCounts[x.reason]||0)+1;
 const report={checkedAt:new Date().toISOString(),method:'OSM exact-way graph; conservative KTX-only geometries; current timetable stop lists unchanged',summary,events};
 const folder=path.join(root,'reports');fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'kr-ktx-realignment-20261118.json'),JSON.stringify(report,null,2)+'\n');
 console.log('KTX_REPAIR_SUMMARY '+JSON.stringify(summary));
 console.log('KTX_UNIQUE_SEGMENTS '+JSON.stringify([...new Map(events.map(e=>[e.corridor+'|'+e.from+'|'+e.to,e])).values()].slice(0,50)));
 if(process.argv.includes('--write')){
  for(const batch of changes){
   fs.writeFileSync(path.join(root,'data/kr/canonical',batch.name),JSON.stringify(batch)+'\n');
   console.log('KTX_WRITTEN '+batch.name);
  }
 }else console.log('DRY_RUN_ONLY');
}
if(require.main===module)main();
module.exports={classify,project,graphFromWays,graphRoute,decide,rebuild};
