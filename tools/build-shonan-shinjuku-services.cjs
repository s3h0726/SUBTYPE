#!/usr/bin/env node
'use strict';
// Japanese Shonan–Shinjuku operating corridors, generated from reviewed
// physical JR East workspaces. Never overwrite their source station lists.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=id=>JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes',id+'.json'),'utf8')).route;
const r=Object.fromEntries(['line-11333','line-11319','line-11323','line-11308','line-11301'].map(id=>[id,read(id)]));
const index=(route,name)=>{const i=route.stations.findIndex(s=>s.ja===name);if(i<0)throw Error('SHONAN_STATION_MISSING '+route.id+' '+name);return i};
const equal=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
function corridor(northId,northEnd,southId,southEnd){
 const north=r[northId],core=r['line-11333'],south=r[southId],a=index(north,'大宮'),b=index(north,northEnd),c=index(south,'大船'),d=index(south,southEnd);
 const left=north.stations.slice(a,b+1).reverse(),center=core.stations,right=south.stations.slice(c+1,d+1);
 const leftEdges=north.directedSegments.slice(a,b).reverse().map(s=>({fromStationId:s.toStationId,toStationId:s.fromStationId,geometry:s.geometry.slice().reverse(),source:s.source,verified:s.verified}));
 const edges=[...leftEdges,...core.directedSegments,...south.directedSegments.slice(c,d)];
 const stations=[...left,...center.slice(1),...right].map((s,i)=>({...s,order:i+1,geometryIndex:0}));
 if(stations.length!==edges.length+1)throw Error('SHONAN_TRACK_COUNT_MISMATCH');
 const geometry=[];
 for(let i=0;i<edges.length;i++){
  const edge=edges[i],points=edge.geometry,prev=geometry.at(-1);
  if(points.length<2||edge.fromStationId!==stations[i].id||edge.toStationId!==stations[i+1].id)throw Error('SHONAN_TRACK_ID_MISMATCH');
  if(prev&&!equal(prev,points[0]))throw Error('SHONAN_UNVERIFIED_TRACK_CONNECTION '+edge.fromStationId);
  stations[i].geometryIndex=geometry.length?geometry.length-1:0;
  geometry.push(...points.slice(prev?1:0));
 }
 stations.at(-1).geometryIndex=geometry.length-1;
 return {...core,id:'line-11333',loop:false,stations,geometry,directedSegments:edges,geometryReady:true,dataKind:'physicalRoute',sourcePhysicalIds:[northId,core.id,southId],corridorBranch:{north:northId,south:southId},services:[]};
}
const corridors={utsunomiyaZushi:corridor('line-11319','宇都宮','line-11308','逗子'),takasakiOdawara:corridor('line-11323','高崎','line-11301','小田原')};
const specs=[
 ['utsunomiya-zushi-local','utsunomiyaZushi','宇都宮','逗子','local','普通','보통'],
 ['koganei-zushi-local','utsunomiyaZushi','小金井','逗子','local','普通','보통'],
 ['utsunomiya-zushi-rapid','utsunomiyaZushi','宇都宮','逗子','utsunomiyaRapid','快速','쾌속'],
 ['takasaki-odawara-rapid','takasakiOdawara','高崎','小田原','takasakiRapid','快速','쾌속'],
 ['kagohara-hiratsuka-rapid','takasakiOdawara','籠原','平塚','takasakiRapid','快速','쾌속'],
 ['kagohara-kozu-rapid','takasakiOdawara','籠原','国府津','takasakiRapid','快速','쾌속'],
 ['takasaki-odawara-special-rapid','takasakiOdawara','高崎','小田原','specialRapid','特別快速','특별쾌속']
];
const groups={
 coreRapid:new Set(['大宮','浦和','赤羽','池袋','新宿','渋谷','恵比寿','大崎','武蔵小杉','横浜','戸塚','大船']),
 coreSpecial:new Set(['大宮','浦和','赤羽','池袋','新宿','渋谷','大崎','武蔵小杉','横浜','戸塚','大船']),
 northUtsuRapid:new Set(['大宮','東大宮','蓮田','久喜','古河','小山','小金井','自治医大','石橋','雀宮','宇都宮']),
 northSpecial:new Set(['大宮','上尾','桶川','北本','熊谷','籠原','深谷','岡部','本庄','神保原','新町','倉賀野','高崎']),
 southSpecial:new Set(['大船','藤沢','茅ケ崎','平塚','国府津','小田原'])
};
const patterns=specs.map(([id,branch,north,south,type,ja,ko])=>{
 const all=corridors[branch].stations,first=index(corridors[branch],north),last=index(corridors[branch],south);
 if(first>=last)throw Error('SHONAN_PATTERN_DIRECTION_MISMATCH '+id);
 const omiya=index(corridors[branch],'大宮'),ofuna=index(corridors[branch],'大船');
 const stops=all.slice(first,last+1).filter((station,i)=>{
  const n=first+i,name=station.ja;if(n===first||n===last||type==='local')return true;
  if(n<omiya)return type==='utsunomiyaRapid'?groups.northUtsuRapid.has(name):type==='specialRapid'?groups.northSpecial.has(name):true;
  if(n<=ofuna)return type==='specialRapid'?groups.coreSpecial.has(name):type==='takasakiRapid'?groups.coreRapid.has(name):true;
  return type==='specialRapid'?groups.southSpecial.has(name):true;
 }).map(s=>s.id);
 if(stops[0]!==all[first].id||stops.at(-1)!==all[last].id||new Set(stops).size!==stops.length)throw Error('SHONAN_STOPS_INVALID '+id);
 return{id,corridor:branch,north,south,type,ja,ko,originStationId:all[first].id,destinationStationId:all[last].id,stopStationIds:stops};
});
const data={schemaVersion:1,countryId:'jp',baseRouteId:'line-11333',sources:{official:'https://timetables.jreast.co.jp/2611/timetable/tt0866/0866090.html',officialNorth:'https://timetables.jreast.co.jp/2611/timetable/tt0866/0866080.html',stationPattern:'https://freedomtrain.jp/houkoumaku/51457/',timePeriod:'2026-03-14 revision'},corridors,patterns};
const output='/* AUTO-GENERATED: tools/build-shonan-shinjuku-services.cjs. Japan only. */\nwindow.TRT_SHONAN_SHINJUKU_SERVICES='+JSON.stringify(data)+';\n';
const target=path.join(root,'js/shonan-shinjuku-service-data.js');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('SHONAN_GENERATED_DATA_STALE')}
else fs.writeFileSync(target,output);
console.log(JSON.stringify({shonanCorridors:Object.keys(corridors).length,patterns:patterns.length,choices:patterns.length*2},null,2));
