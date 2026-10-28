#!/usr/bin/env node
'use strict';
// Reconstruct Sapporo split of JR Hokkaido Hakodate Main Line from canonical geometry.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const base=JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes/line-11103.json'),'utf8')).route;
const cut=base.stations.findIndex(s=>s.ja==='札幌');
assert.equal(cut,14);assert.equal(base.stations.length,41);assert.equal(base.directedSegments.length,40);
const geo=base.stations[cut].geometryIndex;
const spec=[
 {id:'line-11103-otaru-sapporo',type:'west',label:'오타루~삿포로',ja:'函館本線(小樽～札幌)',kana:'はこだてほんせん(おたる～さっぽろ)',en:'Hakodate Main Line (Otaru–Sapporo)',stations:base.stations.slice(0,cut+1),geometry:base.geometry.slice(0,geo+1),segments:base.directedSegments.slice(0,cut)},
 {id:'line-11103-sapporo-asahikawa',type:'east',label:'삿포로~아사히카와',ja:'函館本線(札幌～旭川)',kana:'はこだてほんせん(さっぽろ～あさひかわ)',en:'Hakodate Main Line (Sapporo–Asahikawa)',stations:base.stations.slice(cut).map(s=>({...s,geometryIndex:s.geometryIndex-geo,ko:s.ja==='厚別'?'아쓰베쓰':s.ja==='大麻'?'오아사':s.ko})),geometry:base.geometry.slice(geo),segments:base.directedSegments.slice(cut)}
];
const limitedStops=['札幌','岩見沢','美唄','砂川','滝川','深川','旭川'];
const makeServices=(type,stations)=>{
 const ids=stations.map(s=>s.id);
 if(type==='west')return[{id:'local',nameJa:'普通(小樽～札幌)',nameKo:'보통 · 오타루~삿포로',nameEn:'Local Otaru–Sapporo',stops:ids}];
 const idsByName=new Map(stations.map(s=>[s.ja,s.id])),seven=limitedStops.map(name=>{assert.ok(idsByName.has(name),name);return idsByName.get(name)});
 const iw=stations.findIndex(s=>s.ja==='岩見沢');assert.ok(iw>0);
 return [
 {id:'local',nameJa:'普通(札幌～旭川)',nameKo:'보통 · 삿포로~아사히카와',nameEn:'Local Sapporo–Asahikawa',stops:ids},
 {id:'sapporo-iwamizawa',nameJa:'普通(札幌～岩見沢)',nameKo:'보통 · 삿포로~이와미자와',nameEn:'Local Sapporo–Iwamizawa',stops:ids.slice(0,iw+1)},
 {id:'iwamizawa-asahikawa',nameJa:'普通(岩見沢～旭川)',nameKo:'보통 · 이와미자와~아사히카와',nameEn:'Local Iwamizawa–Asahikawa',stops:ids.slice(iw)},
 {id:'lilac',nameJa:'特急ライラック',nameKo:'특급 라이락',nameEn:'Limited Express Lilac',stops:seven},
 {id:'kamui',nameJa:'特急カムイ',nameKo:'특급 카무이',nameEn:'Limited Express Kamui',stops:seven}
 ];
};
for(const p of spec){
 const route={...base,id:p.id,legacyId:p.id,line:{...base.line,ja:p.ja,kana:p.kana,ko:'하코다테 본선('+p.label+')',en:p.en},
 stations:p.stations,geometry:p.geometry,directedSegments:p.segments,services:makeServices(p.type,p.stations),geometryReady:true,
 missingSegments:[],reusedSegments:[],sourcePhysicalRouteId:base.id,sourceSection:p.type,dataKind:'verified-physical-railway',coverage:'published-split-physical-line'};
 assert.equal(route.stations.length,p.type==='east'?27:15);
 assert.equal(route.directedSegments.length,route.stations.length-1);
 assert.equal(route.stations[0].geometryIndex,0);
 assert.equal(route.stations.at(-1).geometryIndex,route.geometry.length-1);
 for(let i=0;i<route.directedSegments.length;i++){
  const seg=route.directedSegments[i];
  assert.equal(seg.fromStationId,route.stations[i].id);assert.equal(seg.toStationId,route.stations[i+1].id);
  assert.ok(seg.geometry.length>2,'No straight-line fallback');
  assert.deepEqual(seg.geometry[0],route.geometry[route.stations[i].geometryIndex]);
  assert.deepEqual(seg.geometry.at(-1),route.geometry[route.stations[i+1].geometryIndex]);
 }
 const output=JSON.stringify({route},null,2)+'\n';
 const target=path.join(root,'data/route-overrides/hakodate-'+p.type+'.json');
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),output,'stale '+p.type+' payload');
 else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output)}
 console.log('PASS: '+route.id+' / '+route.stations.length+' stations / '+route.directedSegments.length+' segments / '+route.geometry.length+' track vertices');
}
