#!/usr/bin/env node
'use strict';
// One-time canonical route creation. Reuses the first nine independently
// verified MLIT N02-2025 Sobu Main Line segments; never draws chords or invents
// coordinates. The Sobu Main Line remains intact as an existing railway card.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {projectRoot,loadStations,read,writeAtomic}=require('./lib/line-workspaces');
const root=projectRoot;
const apply=process.argv.includes('--apply');
const sourceDir=path.join(root,'data/lines/jr-east/sobuhonsen');
const destDir=path.join(root,'data/lines/jr-east/sobu-rapid');
const sourceLine=read(path.join(sourceDir,'line.json'));
const sourceStops=read(path.join(sourceDir,'stations.json'));
const sourceGeometry=read(path.join(sourceDir,'geometry.json'));
const sourceSymbol=fs.readFileSync(path.join(sourceDir,'symbol.svg'),'utf8');
const canonical=loadStations().map;
const expected=['東京','新日本橋','馬喰町','錦糸町','新小岩','市川','船橋','津田沼','稲毛','千葉'];
assert.equal(sourceLine.id,'line-11314');
assert.equal(sourceLine.operatorId,'jr-east');
assert.equal(sourceStops.length,31);
const selected=sourceStops.slice(0,10);
assert.deepEqual(selected.map(s=>canonical.get(s.stationId)?.names?.ja),expected,'Track source does not match official JO route');
const key=(a,b)=>a.stationId+'::'+b.stationId;
const segments={};
let count=0;
for(let i=0;i<9;i++){
 const a=selected[i],b=selected[i+1],id=key(a,b);
 const segment=sourceGeometry[id];
 assert(segment?.verified===true&&segment.source==='MLIT-N02-2025',
   'Unverified Japanese track geometry '+id);
 assert(segment.fromStationId===a.stationId&&segment.toStationId===b.stationId,
   'Wrong directed Sobu track '+id);
 assert(segment.geometry.length>=5,'Unusually poor geometry detail '+id);
 for(const point of segment.geometry)assert(
  Array.isArray(point)&&point.length===2&&point[0]>35&&point[0]<36&&point[1]>139&&point[1]<141,
  'Sobu real track point outside expected Tokyo–Chiba bounds '+id);
 segments[id]=JSON.parse(JSON.stringify(segment));
 count+=segment.geometry.length;
}
assert(count>=230,'Sobu track geometry excessively simplified '+count);
const stationCodeUrl='https://www.jreast.co.jp/chiba/news/pdf/pre1801_number.pdf';
const stops=selected.map((r,i)=>({
 stationId:r.stationId,order:i+1,stationCode:'JO'+(19+i),
 hasOfficialStationCode:true,
 stationCodeSource:{
  type:'operator-official',
  url:stationCodeUrl,
  verified:true,
  confidence:'HIGH',
  status:'VERIFIED',
  note:'JR East JO station numbering, JO19 (Tokyo) through JO28 (Chiba)'
 }
}));
const doc='https://www.jreast.co.jp/press/2020/yokohama/20201112_y02.pdf';
const timetable='https://timetables.jreast.co.jp/en/2610/train/160/164001.html';
const namuwiki='https://namu.wiki/w/'+encodeURIComponent('소부 쾌속선');
const line={
 schemaVersion:1,
 id:'line-jr-east-sobu-rapid',
 operatorId:'jr-east',
 category:'jr',
 names:{ja:'総武快速線',kana:'そうぶかいそくせん',ko:'소부 쾌속선',en:'Sobu Line (Rapid Service)'},
 code:'JO',color:'#1069B4',
 symbol:{
  asset:'./symbol.svg',officialSymbolExists:true,
  source:'https://commons.wikimedia.org/wiki/File:JR_JO_line_symbol.svg',
  verified:true,assetSource:'wikimedia',assetSourceUrl:'https://commons.wikimedia.org/wiki/File:JR_JO_line_symbol.svg',
  identificationSource:'jr-east',
  identificationUrl:stationCodeUrl,
  note:'Unmodified existing JO line symbol reused from canonical JR East Sobu Main Line'
 },
 loop:false,stationSignTemplate:'jr-east',
 services:[{
  id:'sobu-rapid',
  names:{ja:'快速',ko:'쾌속',en:'Rapid'},
  stopPattern:stops.map(s=>s.stationId)
 }],
 throughServiceIds:[],
 throughOperations:[],
 sources:{
  official:doc,
  timetable,
  korean:namuwiki,
  geometry:'MLIT-N02-2025',
  geometryReuse:{
   routeId:'line-11314',
   segmentCount:9,
   status:'source-copied-independently-for-Sobu-Rapid',
   limitation:'Existing MLIT surveyed railway corridor is reused; do not claim separate fast-track vs local-track centrelines were independently surveyed.'
  },
  koreanName:{
   family:'namuwiki',method:'page-title',type:'namuwiki-title',
   url:namuwiki,status:'ARTICLE_TITLE',
   verified:false,
   canonicalPolicy:'namuwiki',
   note:'Korean label matches Namuwiki article title; access to full article was not confirmed.'
  }
 },
 legacy:{
  origin:'curated-jr-east-2026',
  coverage:'東京～千葉',
  dataKind:'operatingRoute',
  sourcePhysicalRouteId:'line-11314',
  generatedBy:'tools/create-jr-sobu-rapid-line.cjs'
 },
 routeInfo:{
  ja:'東京～千葉（総武線快速）',
  ko:'도쿄~치바 10개 역. 요코스카선·나리타선·우치보선·소토보선 직통 운행은 별도 운행계통으로 관리합니다.',
  source:doc
 }
};
const routeStationNames={
 [selected[2].stationId]:{
  ja:'馬喰町',kana:'ばくろちょう',ko:'바쿠로초',en:'Bakurocho',
  source:namuwiki,
  note:'Use the Rapid Line station-name pronunciation; preserve shared station ID.'
 },
 [selected[3].stationId]:{
  ja:'錦糸町',kana:'きんしちょう',ko:'킨시초',en:'Kinshicho',
  source:namuwiki,
  note:'Use Namuwiki station Korean spelling on the Rapid Line; do not mutate the Chuo–Sobu Local record.'
 }
};
const overrideFile=path.join(root,'data/japan-route-station-names.json'),overrides=read(overrideFile);
overrides.routes??={};
const old=overrides.routes[line.id]||{};
if(Object.keys(old).some(k=>!routeStationNames[k]))
 throw Error('Existing Sobu Rapid route-specific overrides require manual merge');
overrides.routes[line.id]={...old,...routeStationNames};
const files=[
 ['line.json',line],['stations.json',stops],['geometry.json',segments]
];
if(apply){
 fs.mkdirSync(destDir,{recursive:true});
 for(const [name,data] of files)writeAtomic(path.join(destDir,name),data);
 fs.writeFileSync(path.join(destDir,'symbol.svg'),sourceSymbol);
 fs.writeFileSync(path.join(destDir,'README.md'),[
  '# JR 동일본 소부 쾌속선 — 総武快速線',
  '',
  '- 전용 노선 카드: 도쿄역 → 치바역 (10개 역, JO19–JO28)',
  '- 복귀 주행: 치바역 → 도쿄역 (게임의 역방향 경로)',
  '- 기존 소부 본선(도쿄~조시) 및 주오·소부 완행선은 수정하거나 제거하지 않음',
  '- 노선 색: #1069B4 / 기존 공식 JR JO 심볼 재사용',
  '- 선형: 검증된 MLIT N02-2025 소부 본선 최초 9개 구간의 실제 선형 정점 '+count+'개 재사용',
  '- 제한: 급행 전용 선로와 완행 선로의 병렬 선로 좌표를 개별 측량했다고 주장하지 않음',
  '- 환승역: 기존 물리 역 ID 유지. 노선별 역 표시명은 data/japan-route-station-names.json에 기록',
  '- 운행계통: 도쿄~치바 기본 쾌속을 실행. 외부 직통 행선지는 추가 선로 검증 전 임의 활성화하지 않음',
  '',
  '## 공식 근거',
  '- 운행 경로: '+doc,
  '- 2026년 10월 열차 정차역: '+timetable,
  '- 역 번호: '+stationCodeUrl,
  '- 한글 노선명: '+namuwiki,
  '',
  'Generated by tools/create-jr-sobu-rapid-line.cjs. Published line/station data is produced by tools/build-static.js.',
  ''
 ].join('\n'));
 writeAtomic(overrideFile,overrides);
}
console.log(JSON.stringify({
 status:'PASS',applied:apply,
 lineId:line.id,ja:line.names.ja,ko:line.names.ko,
 stops:expected.length,code:'JO19–JO28',routeFrom:expected[0],routeTo:expected.at(-1),
 segments:Object.keys(segments).length,totalMLITVertices:count,
 verifiedSegments:Object.values(segments).filter(x=>x.verified).length,
 operator:line.operatorId,
 sourcePreserved:'line-11314',
 noStraightLines:true,scope:'Tokyo–Chiba only'
},null,2));
