#!/usr/bin/env node
'use strict';
// Rebuild the durable through-service payload from unchanged canonical physical
// segments; do not re-create 22 stations with straight-line approximations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const load=id=>JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes/line-'+id+'.json'),'utf8')).route;
const a=load('99814'),b=load('99815');
assert.equal(a.stations.at(-1).id,b.stations[0].id,'Nakamura junction station ID');
assert.deepEqual(a.geometry.at(-1),b.geometry[0],'Nakamura junction geometry');
assert.equal(a.directedSegments.length,a.stations.length-1);
assert.equal(b.directedSegments.length,b.stations.length-1);
const stations=[...a.stations,...b.stations.slice(1).map(st=>({...st,geometryIndex:a.geometry.length-1+st.geometryIndex}))];
const geometry=[...a.geometry,...b.geometry.slice(1)],directedSegments=[...a.directedSegments,...b.directedSegments];
const services=[
  {id:'local',nameJa:'普通（窪川〜宿毛）',nameKo:'보통 · 쿠보카와~스쿠모',nameEn:'Local · Kubokawa–Sukumo',stops:stations.map(st=>st.id)},
  {id:'nakamura-section',nameJa:'普通（窪川〜中村）',nameKo:'보통 · 쿠보카와~나카무라',nameEn:'Local · Kubokawa–Nakamura',stops:a.stations.map(st=>st.id)},
  {id:'sukumo-section',nameJa:'普通（中村〜宿毛）',nameKo:'보통 · 나카무라~스쿠모',nameEn:'Local · Nakamura–Sukumo',stops:b.stations.map(st=>st.id)}
];
const route={...a,line:{...a.line,ja:'中村・宿毛線',ko:'나카무라·스쿠모선',en:'Nakamura–Sukumo Line',kana:'なかむら・すくもせん'},
 stations,geometry,directedSegments,geometryReady:true,services,
 trackSections:[{id:a.id,nameJa:'中村線',nameKo:'나카무라선',fromStationId:a.stations[0].id,toStationId:a.stations.at(-1).id},{id:b.id,nameJa:'宿毛線',nameKo:'스쿠모선',fromStationId:b.stations[0].id,toStationId:b.stations.at(-1).id}],
 missingSegments:[...(a.missingSegments||[]),...(b.missingSegments||[])],
 reusedSegments:[...(a.reusedSegments||[]),...(b.reusedSegments||[])],
 sources:[...(Array.isArray(a.sources)?a.sources:[]),...(Array.isArray(b.sources)?b.sources:[])],
 sourcePhysicalRouteIds:[a.id,b.id],dataKind:'merged-physical-railway',coverage:'canonical-combined-line'};
assert.equal(stations.length,22);assert.equal(new Set(stations.map(st=>st.id)).size,22);
assert.equal(geometry.length,583);assert.equal(directedSegments.length,21);
assert.equal(stations.at(-1).geometryIndex,geometry.length-1);
for(let i=0;i<directedSegments.length;i++){
 const seg=directedSegments[i];assert.equal(seg.fromStationId,stations[i].id);assert.equal(seg.toStationId,stations[i+1].id);
 assert.ok(seg.geometry.length>2,'Missing curved track segment '+i);
 assert.deepEqual(seg.geometry[0],geometry[stations[i].geometryIndex]);
 assert.deepEqual(seg.geometry.at(-1),geometry[stations[i+1].geometryIndex]);
}
for(const s of services){assert.ok(s.stops.length>=2);assert.ok(s.stops.every(id=>stations.some(st=>st.id===id)))}
const output=JSON.stringify({route},null,2)+'\n',out=path.join(root,'data/route-overrides/tosakuroshio-nakamura-sukumo.json');
if(process.argv.includes('--check')){
 assert.equal(fs.readFileSync(out,'utf8'),output,'Merged payload is stale; rerun node tools/build-tosakuroshio-merged.cjs');
 console.log('PASS: merged Nakamura–Sukumo geometry/sequence/services (22 stations, 21 segments, 583 vertices)');
}else{
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,output);
 console.log('Wrote '+path.relative(root,out));
}
