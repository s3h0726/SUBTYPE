#!/usr/bin/env node
'use strict';
// Generate a NON-PUBLISHED, contiguous, OSM-derived candidate for both directions.
// This intentionally does not certify services, direction-specific switchovers or stations.
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const research=JSON.parse(fs.readFileSync(path.join(root,'data/kr/research/kr-metro-4-plan.json'),'utf8'));
const geo=JSON.parse(fs.readFileSync(path.join(root,'data/kr/osm-candidates/kr-metro-4-unverified.geojson'),'utf8'));
const fail=s=>{throw Error('Line 4: '+s)};
const assert=(ok,s)=>{if(!ok)fail(s)};
const stations=research.stationRecords;
assert(stations.length===51&&stations.every(s=>Number.isFinite(s.longitude)&&Number.isFinite(s.latitude)),'51 sourced station centers required');
const lines=geo.features.find(f=>String(f.properties?.lineId)==='4')?.geometry?.coordinates;
assert(Array.isArray(lines),'no candidate Line 4 geometry');
const key=p=>p[0]+','+p[1],point=k=>k.split(',').map(Number);
const dist=(a,b)=>Math.hypot((a[0]-b[0])*88000,(a[1]-b[1])*111000);
const adj=new Map();
function link(a,b){
 const x=key(a),y=key(b),d=dist(a,b);
 if(!adj.has(x))adj.set(x,[]);
 if(!adj.has(y))adj.set(y,[]);
 adj.get(x).push([y,d]);adj.get(y).push([x,d]);
}
for(const line of lines)for(let i=1;i<line.length;i++)link(line[i-1],line[i]);
const components=[],membership=new Map();
for(const k of adj.keys()){
 if(membership.has(k))continue;
 const id=components.length,stack=[k],nodes=[];
 membership.set(k,id);
 while(stack.length){const cur=stack.pop();nodes.push(cur);for(const [n] of adj.get(cur))if(!membership.has(n)){membership.set(n,id);stack.push(n)}}
 components.push(nodes);
}
const major=components.map((nodes,id)=>({id,nodes})).filter(x=>x.nodes.length>200).sort((a,b)=>b.nodes.length-a.nodes.length);
assert(major.length===2,'expected two complete independent rail alignments');
function nearest(station,nodes){
 const target=[station.longitude,station.latitude];let min=Infinity,best;
 for(const k of nodes){const d=dist(target,point(k));if(d<min){best=k;min=d}}
 assert(min<350,'station too distant from candidate track: '+station.nameKo+' '+Math.round(min)+'m');
 return {key:best,meters:Math.round(min)};
}
function shortest(from,to){
 if(from===to)return [from];
 const costs=new Map([[from,0]]),previous=new Map(),visited=new Set();
 // A* admissible under the locally approximated metre scale.
 const queued=[[dist(point(from),point(to)),0,from]];
 while(queued.length){
  queued.sort((a,b)=>a[0]-b[0]);const [,,now]=queued.shift();
  if(visited.has(now))continue;
  if(now===to){const chain=[to];while(chain[0]!==from)chain.unshift(previous.get(chain[0]));return chain}
  visited.add(now);
  for(const [next,edge] of adj.get(now)||[]){
   const alt=costs.get(now)+edge;
   if(alt<(costs.get(next)??Infinity)){
    costs.set(next,alt);previous.set(next,now);
    queued.push([alt+dist(point(next),point(to)),alt,next]);
   }
  }
 }
 fail('disconnected rail graph '+from+' => '+to);
}
function candidate(component,reverse){
 const ordered=reverse?[...stations].reverse():stations;
 const snaps=ordered.map(s=>nearest(s,component.nodes));
 const segments=[],geometry=[],stops=[];
 for(let i=0;i<ordered.length;i++){
  if(i===0){geometry.push([point(snaps[0].key)[1],point(snaps[0].key)[0]])}
  stops.push({id:'kr-4-'+ordered[i].code,ko:ordered[i].nameKo,officialCode:ordered[i].code,latitude:ordered[i].latitude,longitude:ordered[i].longitude,geometryIndex:geometry.length-1,snapDistanceMeters:snaps[i].meters});
  if(i===ordered.length-1)break;
  const rail=shortest(snaps[i].key,snaps[i+1].key);
  const points=rail.map(k=>{const [lon,lat]=point(k);return [lat,lon]});
  const length=rail.slice(1).reduce((sum,k,j)=>sum+dist(point(rail[j]),point(k)),0);
  const direct=dist([ordered[i].longitude,ordered[i].latitude],[ordered[i+1].longitude,ordered[i+1].latitude]);
  assert(points.length>=2&&length>=direct*0.75&&length<Math.max(12000,direct*3),'suspicious segment '+ordered[i].nameKo+' -> '+ordered[i+1].nameKo);
  segments.push({fromStationId:stops[i].id,toStationId:'kr-4-'+ordered[i+1].code,geometry:points,source:{name:'OSM-derived candidate',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',url:'https://github.com/matassp/seoul-isochrone/blob/main/public/data/lines.geojson',geometryDataset:'matassp-seoul-isochrone-lines-geojson',featureLineId:'4'},lengthMeters:Math.round(length),geometryStatus:'candidate-unverified'});
  geometry.push(...points.slice(1));
 }
 // each stop geometryIndex must point to the exact snapped vertex.
 for(let i=1;i<stops.length;i++)stops[i].geometryIndex=segments.slice(0,i).reduce((n,s)=>n+s.geometry.length-1,0);
 assert(segments.length===50,'wrong segment count');
 return {id:reverse?'reverse':'forward',stops,geometry,directedSegments:segments,lengthMeters:segments.reduce((n,s)=>n+s.lengthMeters,0),maxSnapMeters:Math.max(...snaps.map(s=>s.meters))};
}
const forward=candidate(major[0],false),reverse=candidate(major[1],true);
const out={schemaVersion:1,routeId:'kr-metro-4',publishable:false,geometryReady:false,validationStatus:'candidate-station-center-snap-only',componentCounts:components.map(x=>x.length),directions:[forward,reverse],notes:['DO NOT USE AS PLAYABLE ROUTE: actual direction-specific rail selection, points/switches, station platform snapping and schedules are not verified','No straight-line interpolation; connected OSM coordinates only','The third isolated loop is excluded']};
const output=path.join(root,'data/kr/osm-candidates/kr-metro-4-connected-preview.json');
fs.writeFileSync(output,JSON.stringify(out)+'\n');
console.log(JSON.stringify({result:'candidate-only',directions:out.directions.map(d=>({id:d.id,segments:d.directedSegments.length,points:d.geometry.length,km:Math.round(d.lengthMeters/1000),maxSnap:d.maxSnapMeters})),published:false}));
