#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{readBatches,assembleCanonicalRoutes}=require('./lib/kr-canonical.cjs');
const {encode,decode}=require('./lib/kr-payload.cjs');
const root=path.resolve(__dirname,'..'),batches=readBatches(root),compiled=assembleCanonicalRoutes(batches),accepted=compiled.routes,rejected=compiled.rejected;
const report={schemaVersion:1,batches:batches.map(b=>b.name),publicRoutes:accepted.length,playableDirections:accepted.reduce((n,r)=>n+r.verifiedJourneys.length,0),uniqueStops:new Set(accepted.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,byMode:{},byCategory:{},rejected};
for(const route of accepted){report.byMode[route.mode]=(report.byMode[route.mode]||0)+1;report.byCategory[route.normalizedCategory||route.category]=(report.byCategory[route.normalizedCategory||route.category]||0)+1}
const write=(file,value)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n')};
write('reports/kr-rebuild/catalog-validation.json',report);
if(rejected.length){console.error(JSON.stringify(report,null,2));process.exitCode=1}
if(process.argv.includes('--publish')&&!rejected.length){
 if(!accepted.length)throw Error('검증된 신규 노선이 없어 한국 공개 초기화 상태를 유지합니다.');
 // Keep historical public journeys immutable. The only approved replacement
 // is the OSM-sourced geometry correction for the four CURRENT eastern Hangang
 // patterns; exact stop identities, services and validity windows are protected.
 const correctedEastIds=new Set([
  'kr-hangang-east-oksu-outbound','kr-hangang-east-oksu-inbound',
  'kr-hangang-east-apgujeong-outbound','kr-hangang-east-apgujeong-inbound'
 ]);
 const withoutGeometry=journey=>{
  const copy=structuredClone(journey);
  delete copy.geometry;
  delete copy.directedSegments;
  delete copy.sourceWayIds;
  copy.stations=(copy.stations||[]).map(({geometryIndex,stopOffsetMeters,...stop})=>stop);
  return copy;
 };
 const approvedEasternBypass=(routeId,oldJourney,newJourney)=>
  routeId==='kr-hangang-east'&&correctedEastIds.has(oldJourney.id)
  &&newJourney.sourceWayIds?.includes(1443233864)
  &&JSON.stringify(withoutGeometry(oldJourney))===JSON.stringify(withoutGeometry(newJourney));
 const unchangedPayloads=new Set;
 const oldFile=path.join(root,'data/kr/generated/index.json');
 if(fs.existsSync(oldFile))for(const old of JSON.parse(fs.readFileSync(oldFile,'utf8')).routes||[]){
  const next=accepted.find(r=>r.id===old.id);if(!next)throw Error('기존 공개 노선 손실 차단: '+old.id);
  const stored=JSON.parse(fs.readFileSync(path.join(root,old.lazySource),'utf8')),oldPayload=decode(stored).route;
  for(const journey of oldPayload.verifiedJourneys||[]){const retained=next.verifiedJourneys.find(j=>j.id===journey.id);if(!retained||(JSON.stringify(retained)!==JSON.stringify(journey)&&!approvedEasternBypass(old.id,journey,retained)))throw Error('기존 공개 운행계통 변경 차단: '+journey.id)}
  // 내용과 무손실 압축 형식이 같은 파일은 다시 쓰지 않는다.
  if(stored.encoding==='subtype-route-gzip-v1'&&JSON.stringify(next)===JSON.stringify(oldPayload))unchangedPayloads.add(old.id);
 }
 const operators=[...new Map(accepted.map(r=>[r.operatorId,{id:r.operatorId,names:{...r.operator,ja:r.operator.ko,en:r.operator.ko}}])).values()];
 const routes=accepted.map(route=>{if(!unchangedPayloads.has(route.id))write('data/kr/generated/routes/'+route.id+'.json',JSON.stringify(encode(route))+'\n');const {stations,geometry,directedSegments,verifiedJourneys,services,...meta}=route;return{...meta,lazy:true,lazySource:'data/kr/generated/routes/'+route.id+'.json',stationCount:Math.max(...verifiedJourneys.map(j=>j.stations.length)),serviceCount:verifiedJourneys.length,serviceWindows:verifiedJourneys.map(j=>j.serviceDates||{}),searchStations:[...new Set(verifiedJourneys.flatMap(j=>j.stations.map(s=>s.ko)))],stations:[],services:[]}});
 const index={schemaVersion:3,canonicalContract:'kr-canonical-v1',country:{id:'kr',names:{ko:'대한민국'}},routes,operators,counts:report,assets:{operators:{},lines:{}}};
 write('data/kr/generated/index.json',index);write('js/korea-index-data.js','/* 신규 한국 대중교통 공개 목록: 검증된 배치에서 생성 */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(index)+';\n');
 write('data/kr/publication-policy.json',{schemaVersion:2,mode:'canonical',canonicalContract:'kr-canonical-v1',automaticKoreanPublication:false,compiler:'tools/build-kr-canonical.cjs',publicRouteCount:routes.length,backupRef:'backup/korea-before-rebuild-20261030',notes:'신규 검증 배치만 공개. 기존 초기화 이전 컴파일러로 덮어쓰기 금지.'});
 const flags=path.join(root,'js/feature-flags.js');fs.writeFileSync(flags,fs.readFileSync(flags,'utf8').replace('koreaRoutesReset:true','koreaRoutesReset:false'));
}
console.log(JSON.stringify(report,null,2));
