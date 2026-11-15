#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const track=json('data/kr/physical/suseo-pyeongtaek.json');
const source=read('js/korea-suseo-pyeongtaek.js').replace(/\bexport\s+/g,'');
const ctx={};vm.runInNewContext(source+'\nglobalThis.TEST_SUSEO={verifySuseoTrack,applySuseoTrack};',ctx,{timeout:3000});
const api=ctx.TEST_SUSEO;
assert.equal(api.verifySuseoTrack(track),track);
assert.equal(track.officialLengthKm,61.1);
const geometry=new Map(json('data/kr/v2/geometry.json').map(w=>[w.id.replace(/^kr-geometry-/,'') ,w]));
const infrastructure=new Map(json('data/kr/v2/infrastructure.json').map(w=>[w.geometryId.replace(/^kr-geometry-/,''),w]));
let segments=0,sourceEdges=0;
const coord=p=>p.join(',');
for(const service of [track.srt,track.gtx]){
 for(let i=0;i<service.segments.length;i++){
  let s=service.segments[i],edges=new Set();
  for(const id of s.wayIds){
   const w=geometry.get(String(id));
   assert(w,'OSM way missing '+id);
   assert.equal(infrastructure.get(String(id))?.mode,'rail');
   for(let k=1;k<w.coordinates.length;k++){
    const a=coord(w.coordinates[k-1]),b=coord(w.coordinates[k]);
    edges.add(a+'|'+b);edges.add(b+'|'+a);
   }
  }
  for(let k=1;k<s.geometry.length;k++){
   const a=coord(s.geometry[k-1]),b=coord(s.geometry[k]);
   assert(edges.has(a+'|'+b),'non-OSM edge on '+s.from+' → '+s.to+' #'+k);
   sourceEdges++;
  }
  segments++;
 }
}
const length=service=>service.segments.reduce((a,b)=>a+b.lengthKm,0);
assert(Math.abs(length(track.srt)-61.1)<1,'Suseo–Pyeongtaek length');
assert(length(track.gtx)>31&&length(track.gtx)<35,'GTX-A south length');
const makeRoute=names=>({
 id:'kr-rail-expansion-gyeongbu-highspeed',countryId:'kr',schemaVersion:2,
 mode:'high_speed_rail',category:'high_speed_rail',
 stations:names.map((ko,i)=>({id:'id'+i,ko,geometryIndex:i*2})),
 directedSegments:names.slice(1).map((_,i)=>({
  fromStationId:'id'+i,toStationId:'id'+(i+1),
  geometry:[[37.48-i*.2,127.10],[37.28-i*.2,127.10]]
 })),
 verifiedJourneys:[]
});
for(let names of [['수서','동탄','평택지제'],['평택지제','동탄','수서']]){
 const original=makeRoute(names),result=api.applySuseoTrack(original,track);
 assert.notEqual(result,original,'eligible service should use true railway track');
 assert.equal(result.directedSegments.length,2);
 for(let i=0;i<2;i++){
  const section=result.directedSegments[i];
  assert(section.geometry.length>50);
  assert.equal(section.trackCorridorId,track.id);
  assert.equal(result.stations[i+1].geometryIndex,
    result.stations[i].geometryIndex+section.geometry.length-1);
 }
 assert.equal(result.geometry[0][0]>(names[0]==='수서'?37:36),
   true);
}
for(let names of [['서울','광명','천안아산'],['수서','성남','구성']]){
 const unchanged=makeRoute(names);
 if(names[0]==='수서')unchanged.mode=unchanged.category='commuter_rail';
 assert.equal(api.applySuseoTrack(unchanged,track),unchanged,'unrelated trains must remain on original track');
}
console.log('PASS: source OSM edge continuity, '+segments+' physical sections, '+sourceEdges+' verified track edges; SRT directions and unrelated KTX protected');
