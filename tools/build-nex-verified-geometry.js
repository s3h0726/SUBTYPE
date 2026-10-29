#!/usr/bin/env node
// Build branch-specific N'EX geometry from existing MLIT-N02-2025 track chains.
// Output is research/playability candidate data, NOT a live route or official track approval.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const nex=read('data/lines/jr-east/narita-express/geometry.json');
const yok=read('data/lines/jr-east/yokosuka-line/geometry.json');
const route=read('data/generated/routes/line-11328.json').route;
const stations=new Map(route.stations.map(s=>[s.id,s]));
const id={ofuna:'station-1130107',totsuka:'station-1130106',yokohama:'station-1130105',musashi:'station-004301',nishioi:'station-004235',shinagawa:'station-1130103',shinjuku:'station-003700',shibuya:'station-003922',tokyo:'station-1130101',chiba:'station-1131339',yotsukaido:'station-003898',sakura:'station-1131415',narita:'station-1132703',t2:'station-1132813',t1:'station-1132705'};
const chain=(parts)=>{
 const coords=[],sources=[],stationGeometryIndices={};
 for(const [dataset,from,to] of parts){
  const source=dataset==='nex'?nex:yok;
  const direct=source[from+'::'+to],reverse=source[to+'::'+from];
  const segment=direct||reverse;
  assert(segment?.verified===true&&Array.isArray(segment.geometry)&&segment.geometry.length>=2,'Unverified or missing railway segment '+dataset+':'+from+'::'+to);
  const points=direct?segment.geometry.map(x=>x.slice()):segment.geometry.slice().reverse().map(x=>x.slice());
  if(coords.length){
   const a=coords.at(-1),b=points[0];
   // Never fabricate a new connector for a mismatched physical-track edge.
   assert(Math.abs(a[0]-b[0])<0.002&&Math.abs(a[1]-b[1])<0.002,'Disjoint track geometry '+from+'::'+to);
   if(a[0]===b[0]&&a[1]===b[1])points.shift();
  }
  if(stationGeometryIndices[from]===undefined)stationGeometryIndices[from]=coords.length?coords.length-1:0;
  coords.push(...points);
  stationGeometryIndices[to]=coords.length-1;
  sources.push({dataset,from,to,originalSource:segment.source,verified:segment.verified});
 }
 return {geometry:coords,sources,stationGeometryIndices};
};
const airport=[
 ['nex',id.tokyo,id.chiba],['nex',id.chiba,id.yotsukaido],
 ['nex',id.yotsukaido,id.sakura],['nex',id.sakura,id.narita],
 ['nex',id.narita,id.t2],['nex',id.t2,id.t1]];
const variants=[
 {id:'nex-shinjuku-physical-candidate',nameKo:'나리타 익스프레스 신주쿠 계통',stopIds:[id.shinjuku,id.shibuya,id.tokyo,id.chiba,id.yotsukaido,id.sakura,id.narita,id.t2,id.t1],parts:[['nex',id.shinjuku,id.shibuya],['nex',id.shibuya,id.shinagawa],['nex',id.shinagawa,id.tokyo],...airport]},
 {id:'nex-ofuna-physical-candidate',nameKo:'나리타 익스프레스 오후나 계통',stopIds:[id.ofuna,id.totsuka,id.yokohama,id.musashi,id.shinagawa,id.tokyo,id.chiba,id.yotsukaido,id.sakura,id.narita,id.t2,id.t1],parts:[['nex',id.ofuna,id.totsuka],['nex',id.totsuka,id.yokohama],['nex',id.yokohama,id.musashi],['yok',id.musashi,id.nishioi],['yok',id.nishioi,id.shinagawa],['nex',id.shinagawa,id.tokyo],...airport]}
];
const results=[];
for(const v of variants){
 const assembled=chain(v.parts);
 results.push({id:v.id,nameKo:v.nameKo,status:'GEOMETRY_CANDIDATE_NOT_RELEASE_APPROVED',geometry:assembled.geometry,stationGeometryIndices:assembled.stationGeometryIndices,segments:assembled.sources,stopIds:v.stopIds,stations:v.stopIds.map(st=>{assert(stations.has(st),'Unknown stop '+st);return {id:st,ja:stations.get(st).ja,ko:stations.get(st).ko}}),notes:'Intermediate physical pass-through positions need separate station index; service stopping patterns vary by train.'});
}
const output='data/generated/nex-branch-geometry-candidates.json';
fs.writeFileSync(path.join(root,output),JSON.stringify({version:1,source:'Existing MLIT-N02-2025 source geometry: Narita Express and Yokosuka Line',releaseApproved:false,variants:results},null,2)+'\n');
console.log(JSON.stringify({status:'BUILT_NOT_PUBLISHED',routes:results.map(v=>({id:v.id,trackPoints:v.geometry.length,stops:v.stations.length})),output},null,2));
