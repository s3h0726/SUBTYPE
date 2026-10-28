#!/usr/bin/env node
'use strict';
// Assemble two independently playable Meitetsu Mikawa sections from their
// already-verified railway track vertices. No straight-line interpolation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes/line-30005.json'),'utf8')).route;
const index=source.stations.findIndex(s=>s.ja==='知立');
assert.equal(index,11);assert.equal(source.stations.length,23);
assert.equal(source.directedSegments.length,22);assert.equal(source.geometryReady,true);
const cut=source.stations[index].geometryIndex;
const specs=[
 {id:'line-30005-umi',tag:'umi',ko:'메이테츠 미카와선(해선)',ja:'名鉄三河線（海線）',kana:'めいてつみかわせん（うみせん）',en:'Meitetsu Mikawa Line (Sea Section)',
  stations:source.stations.slice(0,index+1).reverse().map(s=>({...s,geometryIndex:cut-s.geometryIndex})),
  geometry:source.geometry.slice(0,cut+1).reverse(),
  directedSegments:source.directedSegments.slice(0,index).reverse().map(seg=>({...seg,fromStationId:seg.toStationId,toStationId:seg.fromStationId,geometry:seg.geometry.slice().reverse()}))},
 {id:'line-30005-yama',tag:'yama',ko:'메이테츠 미카와선(산선)',ja:'名鉄三河線（山線）',kana:'めいてつみかわせん（やません）',en:'Meitetsu Mikawa Line (Mountain Section)',
  stations:source.stations.slice(index).map(s=>({...s,geometryIndex:s.geometryIndex-cut})),
  geometry:source.geometry.slice(cut),
  directedSegments:source.directedSegments.slice(index).map(seg=>({...seg,geometry:seg.geometry.slice()}))}
];
for(const spec of specs){
 const route={...source,id:spec.id,legacyId:spec.id,line:{...source.line,ja:spec.ja,kana:spec.kana,ko:spec.ko,en:spec.en},
   code:spec.tag==='yama'?'MY':'MU',
   stations:spec.stations,geometry:spec.geometry,directedSegments:spec.directedSegments,
   sectionType:spec.tag,sourcePhysicalRouteId:source.id,sourceSection:'Meitetsu Mikawa Line',
   geometryReady:true,services:[{id:'local',nameJa:'普通',nameKo:'각역정차',nameEn:'Local',stops:spec.stations.map(st=>st.id)}],
   sourceOriginalStationCount:source.stations.length,segmentCount:spec.directedSegments.length,
   missingSegments:[],reusedSegments:[]};
 assert.equal(route.stations.length,12);assert.equal(route.stations[0].ja,'知立');
 assert.equal(route.stations.at(-1).ja,spec.tag==='umi'?'碧南':'猿投');
 assert.equal(route.directedSegments.length,11);
 assert.equal(route.stations.at(-1).geometryIndex,route.geometry.length-1);
 for(let i=0;i<route.directedSegments.length;i++){
   const seg=route.directedSegments[i],st=route.stations[i],next=route.stations[i+1];
   assert.equal(seg.fromStationId,st.id);assert.equal(seg.toStationId,next.id);
   assert.ok(seg.geometry.length>2,'Curved geometry missing on segment '+i);
   assert.deepEqual(seg.geometry[0],route.geometry[st.geometryIndex]);
   assert.deepEqual(seg.geometry.at(-1),route.geometry[next.geometryIndex]);
 }
 const target=path.join(root,'data/route-overrides/meitetsu-mikawa-'+spec.tag+'.json');
 const json=JSON.stringify({route},null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),json,'Generated '+spec.tag+' payload is stale');
 else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,json)}
 console.log('PASS: '+spec.tag+' / 12 stations / 11 physical segments / '+spec.geometry.length+' vertices');
}
