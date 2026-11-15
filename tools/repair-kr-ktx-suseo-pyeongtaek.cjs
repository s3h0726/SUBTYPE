#!/usr/bin/env node
'use strict';
// Repairs only graph-proven, overly long Suseo <-> PyeongtaekJije KTX detours.
// Neither interpolation nor topology stitching is permitted: every replacement
// vertex is an exact member of a connected original OSM railway way.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='data/kr/canonical';
const {distance,validateRoute,assembleCanonicalRoutes}=require('./lib/kr-canonical.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const ways=read('data/kr/v2/source/osm-ways.json');
const nodes=new Map(),grid=new Map(),adj=new Map,cell=.007;
const gridKey=p=>Math.floor(p[0]/cell)+':'+Math.floor(p[1]/cell);
const key=p=>p[0].toFixed(8)+':'+p[1].toFixed(8);
const byPoint=new Map();
const add=(id,p)=>{if(nodes.has(id))return;nodes.set(id,p);const k=gridKey(p);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(id);const kp=key(p);if(!byPoint.has(kp))byPoint.set(kp,[]);byPoint.get(kp).push(id)};
const edge=(a,b,physicalKm,highspeed,wayId)=>{if(!adj.has(a))adj.set(a,[]);adj.get(a).push({to:b,weight:physicalKm*(highspeed?1:7),km:physicalKm,highspeed,wayId})};
for(const way of ways){
 const tags=way.tags||{};
 if(!['rail','light_rail'].includes(tags.railway)||['yard','spur','siding'].includes(tags.service)||['industrial','military','test'].includes(tags.usage)||tags.access==='no'||tags.disused==='yes')continue;
 const n=[tags.name,tags['name:ko']].filter(Boolean).join(' ');
 const highspeed=n.includes('수서평택고속선')||n.includes('경부고속선')||n.includes('호남고속선')||tags.highspeed==='yes'||parseFloat(tags.maxspeed)>=200;
 const ids=way.nodeIds||[],coords=way.coordinates||[];
 for(let i=1;i<ids.length&&i<coords.length;i++){
  const a=String(ids[i-1]),b=String(ids[i]),p=coords[i-1],q=coords[i];
  if(!p||!q)continue;const km=distance(p,q);if(km>5||km<=0)continue;
  add(a,p);add(b,q);if(tags.oneway!=='-1')edge(a,b,km,highspeed,way.id);
  if(tags.oneway!=='yes')edge(b,a,km,highspeed,way.id);
 }
}
function near(p,cutoff=.14){
 const [y,x]=gridKey(p).split(':').map(Number),out=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
  for(const id of grid.get((y+dy)+':'+(x+dx))||[]){
   const km=distance(p,nodes.get(id));if(km<=cutoff)out.push({id,km,point:nodes.get(id)});
  }
 return out.sort((a,b)=>a.km-b.km);
}
class Heap{constructor(){this.a=[]}push(v){let a=this.a,i=a.length;a.push(v);while(i){let p=(i-1)>>1;if(a[p][0]<=v[0])break;a[i]=a[p];i=p}a[i]=v}pop(){let a=this.a,f=a[0],l=a.pop();if(a.length){let i=0;while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=l[0])break;a[i]=a[c];i=c}a[i]=l}return f}get length(){return this.a.length}}
function shortest(start,dest,maxCost=180){
 const dist=new Map([[start,0]]),prior=new Map,heap=new Heap;heap.push([0,start]);
 while(heap.length){
  const[c,u]=heap.pop();if(c!==dist.get(u)||c>maxCost)continue;if(u===dest)break;
  for(const e of adj.get(u)||[]){const total=c+e.weight;if(total<(dist.get(e.to)??Infinity)&&total<=maxCost){dist.set(e.to,total);prior.set(e.to,[u,e]);heap.push([total,e.to])}}
 }
 if(!dist.has(dest))return null;
 const ids=[dest];let physical=0,fast=0;while(ids[0]!==start){
  const p=prior.get(ids[0]);if(!p)return null;physical+=p[1].km;if(p[1].highspeed)fast+=p[1].km;ids.unshift(p[0]);
 }
 return{ids,cost:dist.get(dest),km:physical,highspeedShare:fast/physical,geometry:ids.map(id=>nodes.get(id))};
}
function candidates(station,adjacent,which){
 const location=[station.latitude,station.longitude];
 if(!adjacent)return near(location,.14).slice(0,7).map(x=>({...x,cutIndex:null}));
 // An adjoining service must meet the new route at an original OSM
 // node, with the discarded tail shorter than 140 metres from station.
 const coords=adjacent.geometry||[],i0=which==='start'?Math.max(0,coords.length-65):0,
  i1=which==='start'?coords.length:Math.min(coords.length,65);
 const out=[];
 for(let i=i0;i<i1;i++){
  const p=coords[i];if(distance(p,location)>.14)continue;
  for(const id of byPoint.get(key(p))||[]){
   if(distance(nodes.get(id),p)>.0005)continue;
   out.push({id,km:distance(p,location),point:nodes.get(id),cutIndex:i});
  }
 }
 const unique=new Map;for(const x of out.sort((a,b)=>a.km-b.km))if(!unique.has(x.id))unique.set(x.id,x);
 return [...unique.values()].slice(0,7);
}
function attempt(journey,i){
 const old=journey.directedSegments[i],st=journey.stations[i],end=journey.stations[i+1];
 const originalKm=old.geometry.reduce((v,p,n)=>n?v+distance(old.geometry[n-1],p):v,0);
 if(originalKm<75)return null;
 const pre=journey.directedSegments[i-1],post=journey.directedSegments[i+1];
 const starts=candidates(st,pre,'start'),ends=candidates(end,post,'end');
 if(!starts.length||!ends.length)return{status:'SKIP_NO_VERIFIED_JUNCTION',from:st.ko,to:end.ko,originalKm:+originalKm.toFixed(2),starts:starts.length,ends:ends.length};
 let best=null;
 for(const a of starts.slice(0,5))for(const b of ends.slice(0,5)){
  const candidate=shortest(a.id,b.id,115);
  if(!candidate||candidate.km>66||candidate.km<45||candidate.highspeedShare<.82||candidate.km>originalKm-20)continue;
  const score=candidate.cost+a.km*10+b.km*10;
  if(!best||score<best.score)best={...candidate,a,b,score};
 }
 if(!best)return{status:'SKIP_NO_GRAPH_BACKED_SHORTCUT',from:st.ko,to:end.ko,originalKm:+originalKm.toFixed(2),starts:starts.length,ends:ends.length};
 const segmentCoordinates=journey.directedSegments.map(x=>x.geometry);
 if(pre)segmentCoordinates[i-1]=pre.geometry.slice(0,best.a.cutIndex+1);
 segmentCoordinates[i]=best.geometry;
 if(post)segmentCoordinates[i+1]=post.geometry.slice(best.b.cutIndex);
 // Ends must exactly coincide; never insert an unsourced coordinate.
 if(pre&&JSON.stringify(segmentCoordinates[i-1].at(-1))!==JSON.stringify(best.geometry[0]))throw Error('UNVERIFIED_START_JOIN');
 if(post&&JSON.stringify(segmentCoordinates[i+1][0])!==JSON.stringify(best.geometry.at(-1)))throw Error('UNVERIFIED_END_JOIN');
 let cursor=0;const newStations=journey.stations.map(s=>({...s}));
 const newSegments=journey.directedSegments.map((seg,n)=>({...seg,geometry:segmentCoordinates[n]}));
 const joined=[];
 for(let n=0;n<newSegments.length;n++){
  const pts=newSegments[n].geometry;if(pts.length<2)throw Error('TRUNCATED_ADJACENT_SEGMENT');
  if(n===0){newStations[0].geometryIndex=0;joined.push(...pts)}
  else{
   if(JSON.stringify(joined.at(-1))!==JSON.stringify(pts[0]))throw Error('DISCONNECTED_SERVICE_AT_'+n);
   joined.push(...pts.slice(1));
  }
  cursor=joined.length-1;newStations[n+1].geometryIndex=cursor;
 }
 // Preserve source-supplied actual platform/station coordinates while snapping
 // the drawable corridor to the original adjacent OSM node within 140 metres.
 for(const st of newStations)if(distance([st.latitude,st.longitude],joined[st.geometryIndex])>.15)throw Error('STATION_NOT_ON_VERIFIED_TRACK');
 return{status:'REPAIR',from:st.ko,to:end.ko,originalKm:+originalKm.toFixed(2),correctedKm:+best.km.toFixed(2),highspeedShare:+best.highspeedShare.toFixed(3),graphNodes:best.ids.length,startSnapMeters:+(best.a.km*1000).toFixed(1),endSnapMeters:+(best.b.km*1000).toFixed(1),updated:{stations:newStations,directedSegments:newSegments,geometry:joined}};
}
const names=fs.readdirSync(path.join(root,base)).filter(x=>x.endsWith('-batch.json')),events=[],changes=[];
for(const name of names){
 const f=path.join(base,name),batch=read(f);let changed=false;
 for(const route of batch.routes||[]){
  if(route.mode!=='high_speed_rail')continue;
  let routeChanged=false;
  for(const j of route.verifiedJourneys||[]){
   const stationNames=(j.stations||[]).map(s=>s.ko);
   for(let i=0;i<stationNames.length-1;i++){
    const pair=[stationNames[i],stationNames[i+1]];
    if(!((pair[0]==='수서'&&pair[1]==='평택지제')||(pair[0]==='평택지제'&&pair[1]==='수서')))continue;
    const out=attempt(j,i),meta={batch:name,routeId:route.id,journeyId:j.id,from:pair[0],to:pair[1]};
    if(!out){events.push({...meta,status:'ALREADY_SHORT'});continue}
    const{updated,...report}=out;events.push({...meta,...report});
    if(updated){
     Object.assign(j,updated);routeChanged=changed=true;
     j.ktxTrackCorrection={source:'OSM exact continuous rail-node graph',routeKm:report.correctedKm,oldKm:report.originalKm,snapMeters:{from:report.startSnapMeters,to:report.endSnapMeters},method:'replaced-long-detour-with-source-edge-continuity'};
    }
   }
  }
  if(routeChanged){
   const first=route.verifiedJourneys[0];route.geometry=first.geometry;route.stations=first.stations;route.directedSegments=first.directedSegments;
   const errs=validateRoute(route);if(errs.length)throw Error('POST_REPAIR_VALIDATION_FAILED '+route.id+': '+errs.join('; '));
  }
 }
 if(changed)changes.push({name,batch});
}
const report={checkedAt:'2026-11-15',summary:{examined:events.length,repaired:events.filter(x=>x.status==='REPAIR').length,skipped:events.filter(x=>x.status.startsWith('SKIP')).length,changedBatches:changes.map(x=>x.name)},events};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/kr-ktx-suseo-correction.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write')){
 if(!changes.length)throw Error('NO_VERIFIABLE_CORRECTIONS_AVAILABLE');
 for(const c of changes)fs.writeFileSync(path.join(root,base,c.name),JSON.stringify(c.batch)+'\n');
 console.log('SAFE_KTX_BATCH_CORRECTIONS_WRITTEN '+changes.map(x=>x.name));
}else{
 console.log('DRY_RUN_ONLY; no data was changed');
}
