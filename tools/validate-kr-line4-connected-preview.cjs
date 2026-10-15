#!/usr/bin/env node
'use strict';
// Independent candidate-only gate: every station-to-station track must be continuous,
// follow the correct ordered stations, and consist solely of source coordinate vertices.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const plan=load('data/kr/research/kr-metro-4-plan.json');
const raw=load('data/kr/osm-candidates/kr-metro-4-unverified.geojson');
const preview=load('data/kr/osm-candidates/kr-metro-4-connected-preview.json');
const fail=msg=>{throw Error('Line4 preview invalid: '+msg)};
const check=(yes,msg)=>{if(!yes)fail(msg)};
const key=p=>p.map(x=>Number(x).toFixed(7)).join(',');
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&key(a)===key(b);
const meters=(a,b)=>Math.hypot((a[0]-b[0])*111000,(a[1]-b[1])*88000);
const sourceEdges=new Set();
for(const line of raw.features[0].geometry.coordinates){
 for(let i=1;i<line.length;i++){
  const a=key([...line[i-1]].reverse()),b=key([...line[i]].reverse());
  sourceEdges.add(a+'|'+b);sourceEdges.add(b+'|'+a);
 }
}
check(preview.publishable===false&&preview.geometryReady===false,'unverified route marked playable');
check(preview.directions.length===2,'missing directions');
const actual=plan.stationRecords;
check(actual.length===51,'wrong station count');
const allIds=new Set();
for(const direction of preview.directions){
 const reverse=direction.id==='reverse';
 check(direction.id==='forward'||reverse,'unknown direction');
 const expected=reverse?[...actual].reverse():actual;
 check(direction.stops.length===51&&direction.directedSegments.length===50,'missing stops/sections');
 check(direction.maxSnapMeters<350,'station too far from rail');
 const flattened=[...direction.directedSegments[0].geometry];
 for(let i=0;i<51;i++){
  const stop=direction.stops[i];
  check(stop.ko===expected[i].nameKo&&stop.officialCode===expected[i].code,'station order '+i);
  check(stop.id==='kr-4-'+expected[i].code,'station identifier '+i);
  check(stop.snapDistanceMeters<350,'rail station snap '+stop.ko);
  check(equal(direction.geometry[stop.geometryIndex], i===0?direction.directedSegments[0].geometry[0]:direction.directedSegments[i-1].geometry.at(-1)),'station geometry index '+stop.ko);
  allIds.add(stop.id);
  if(i===50)continue;
  const seg=direction.directedSegments[i];
  check(seg.fromStationId===stop.id&&seg.toStationId===direction.stops[i+1].id,'direction mismatch '+i);
  check(seg.source?.license==='ODbL-1.0'&&seg.source?.featureLineId==='4','unsourced segment '+i);
  for(let j=1;j<seg.geometry.length;j++){
   const a=seg.geometry[j-1],b=seg.geometry[j];
   check(meters(a,b)<2000,'suspicious geometry jump '+i+':'+j);
   check(sourceEdges.has(key(a)+'|'+key(b)),'interpolated or fabricated edge '+i+':'+j);
  }
  if(i>0)check(equal(seg.geometry[0],direction.directedSegments[i-1].geometry.at(-1)),'gap between segments '+i);
 }
 const km=direction.lengthMeters/1000;
 check(km>75&&km<100,'implausible cumulative distance '+km);
 check(equal(direction.geometry[0],direction.directedSegments[0].geometry[0]),'wrong first vertex');
 check(equal(direction.geometry.at(-1),direction.directedSegments.at(-1).geometry.at(-1)),'wrong last vertex');
 console.log(direction.id+': 51 stations, 50 contiguous verified-source edges, '+km.toFixed(2)+'km, station snap max '+direction.maxSnapMeters+'m');
}
check(allIds.size===51,'station duplicates');
console.log('SOURCE-EDGE TOPOLOGY PASS. Operational track direction, platform positioning and timetable remain UNVERIFIED; do not publish.');
