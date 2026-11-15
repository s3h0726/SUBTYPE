#!/usr/bin/env node
/* Assemble GTX-A south's actual OSM rail members from the repository's pinned
 * Geofabrik/OSM source, not from a speculative straight line.
 * The original GTX-A relations 17413294/17413296 are node-contiguous;
 * they omit the Seongnam passenger stop, so locate the OSM "성남 GTX"
 * station marker on each physical running track, snapping ONLY to an
 * existing OSM source node within 50 metres. Rail-side platforms can have
 * OSM service=siding even when the original GTX-A relation uses them.
 */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ways=new Map(read('data/kr/v2/source/osm-ways.json').map(w=>[String(w.id),w]));
const serviceIndex=new Map(read('data/kr/v2/services.json').map(s=>[s.id,s]));
const geometry=new Map(read('data/kr/v2/geometry.json').map(g=>[g.id,g]));
const stopIndex=new Map(read('data/kr/v2/stops.json').map(s=>[s.id,s]));
const stationIndex=new Map(read('data/kr/v2/stations.json').map(s=>[s.id,s]));
const km=(a,b)=>111.195*Math.hypot(a[0]-b[0],(a[1]-b[1])*Math.cos((a[0]+b[0])*Math.PI/360));
const coordsEqual=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
const OSM_STOP_SEONGNAM='kr-osm-stop-10787176950';
const target=stopIndex.get(OSM_STOP_SEONGNAM);
assert(target&&stationIndex.get(target.stationId)?.names?.ko==='성남 GTX');
const marker=[target.coordinates.lat,target.coordinates.lon];
const meta=[
 {direction:'forward',serviceId:'kr-osm-service-17413294',idOrder:['kr-gtx-a-x108','kr-gtx-a-x109','kr-gtx-a-x110','kr-gtx-a-x111'],labels:['수서','성남','구성','동탄']},
 {direction:'reverse',serviceId:'kr-osm-service-17413296',idOrder:['kr-gtx-a-x111','kr-gtx-a-x110','kr-gtx-a-x109','kr-gtx-a-x108'],labels:['동탄','구성','성남','수서']}
];
const directions={};
for(const cfg of meta){
 const s=serviceIndex.get(cfg.serviceId);
 assert(s&&s.passengerLineId==='kr-osm-line-17443066');
 assert.equal(s.stops.length,3);
 assert.equal(s.paths.length,9);
 let points=[],nodes=[],sourceWays=[];
 for(const part of s.paths){
   const g=geometry.get(part.geometryId);
   assert(g,'OSM geometry not found '+part.geometryId);
   const w=ways.get(String(g.sourceRef?.id));
   assert(w&&w.tags?.railway==='rail'&&!w.tags.highway&&!['yard','spur'].includes(w.tags.service),'rail track source is invalid: '+g.sourceRef?.id);
   assert.deepEqual(g.coordinates,w.coordinates,'geometry must equal pinned raw OSM coordinates');
   assert.deepEqual(g.nodeIds,w.nodeIds,'geometry must equal pinned raw OSM nodes');
   const p=part.reverse?[...g.coordinates].reverse():g.coordinates;
   const n=part.reverse?[...g.nodeIds].reverse():g.nodeIds;
   if(nodes.length){assert.equal(String(nodes.at(-1)),String(n[0]),'Disconnected railway nodes at OSM way '+w.id);assert(coordsEqual(points.at(-1),p[0]),'Disconnected railway coordinates at OSM way '+w.id)}
   const shift=nodes.length?1:0;
   points.push(...p.slice(shift));
   nodes.push(...n.slice(shift));
   sourceWays.push({id:String(w.id),version:w.version,railway:w.tags.railway,name:w.tags.name||null,service:w.tags.service||null,osmUrl:'https://www.openstreetmap.org/way/'+w.id});
 }
 assert(points.length>=90,'OSM route unusually sparse');
 const calls=s.stops.map(c=>{
   const stop=stopIndex.get(c.stopId);assert(stop,'GTX-A platform stop missing');
   const station=stationIndex.get(stop.stationId);assert(station);
   const point=points[c.geometryIndex],node=nodes[c.geometryIndex];
   assert.equal(String(stop.osmNodeId),String(node),'Stop must be on original OSM route node');
   assert(coordsEqual(point,[stop.coordinates.lat,stop.coordinates.lon]),'Stop must use original OSM route coordinate');
   return {sourceStopId:c.stopId,sourceNodeId:String(node),geometryIndex:c.geometryIndex,sourceName:station.names.ko};
 });
 const seongBetween=cfg.direction==='forward'?[calls[0].geometryIndex+1,calls[1].geometryIndex-1]:[calls[1].geometryIndex+1,calls[2].geometryIndex-1];
 let near=null;
 for(let i=seongBetween[0];i<=seongBetween[1];i++){
   const d=km(points[i],marker);
   if(!near||d<near.distanceKm)near={index:i,distanceKm:d,sourceNodeId:String(nodes[i])};
 }
 assert(near&&near.distanceKm<.05,'Seongnam GTX station marker too far from actual track: '+near?.distanceKm);
 const seong={sourceStopId:OSM_STOP_SEONGNAM,sourceNodeId:near.sourceNodeId,geometryIndex:near.index,sourceName:'성남 GTX',osmStationToTrackKm:near.distanceKm};
 const original=cfg.direction==='forward'?[calls[0],seong,calls[1],calls[2]]:[calls[0],calls[1],seong,calls[2]];
 const anchors=original.map((row,i)=>({...row,id:cfg.idOrder[i],name:cfg.labels[i],latitude:points[row.geometryIndex][0],longitude:points[row.geometryIndex][1]}));
 assert.deepEqual(anchors.map(a=>a.name),cfg.labels);
 assert(anchors.every((a,i)=>i===0||a.geometryIndex>anchors[i-1].geometryIndex),'Stop indices must increase');
 assert(anchors[0].geometryIndex===0&&anchors.at(-1).geometryIndex===points.length-1,'OSM endpoints must match');
 const distanceKm=points.slice(1).reduce((sum,p,i)=>sum+km(points[i],p),0);
 assert(distanceKm>31&&distanceKm<35,'GTX-A distance must agree with official 32.7km');
 const sourceHash=crypto.createHash('sha256').update(JSON.stringify(points)).digest('hex');
 directions[cfg.direction]={sourceServiceId:s.id,sourceRelationId:s.id.replace('kr-osm-service-',''),geometry:points,stations:anchors,
   sourceWays,distanceKm:Number(distanceKm.toFixed(5)),geometrySha256:sourceHash,
   notice:'Verified OSM source-node-contiguous geometry, including GTX-A passenger relation station sidings; original source relation lacks Seongnam call, anchored to existing OSM track node near its GTX station marker'};
}
const result={type:'GTX_A_SOUTH_OSM_TRACKS',routeId:'kr-rail-national-gtx-a',source:'Pinned OpenStreetMap Korea ways; 2026-10-14 Geofabrik snapshot',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',officialOperation:'https://cppr.koti.re.kr/site/railwyDetail?railwyId=RID241201000009',directions};
console.log('GTX_SRT_SUMMARY='+JSON.stringify(Object.fromEntries(Object.entries(directions).map(([k,v])=>[k,{points:v.geometry.length,km:v.distanceKm,stations:v.stations.map(s=>({name:s.name,at:s.geometryIndex,sourceNodeId:s.sourceNodeId})),ways:v.sourceWays.map(s=>s.id),sha256:v.geometrySha256}]))));
if(process.argv.includes('--dump'))console.log('GTX_SRT_GENERATED='+JSON.stringify(result));
