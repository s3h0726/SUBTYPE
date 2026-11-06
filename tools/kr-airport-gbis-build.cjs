'use strict';
// 기존 공항버스 카드는 유지하고 원본이 확보된 누락 방향과 새 노선만 병합한다.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const base='data/kr/canonical',read=f=>JSON.parse(fs.readFileSync(path.join(base,f),'utf8'));
const filename=path.join(__dirname,'kr-provincial-gbis-build.cjs');let source=fs.readFileSync(filename,'utf8');
source=source.slice(0,source.indexOf("const inventory=JSON.parse"));
source=source.replace("route.adminNm?.startsWith('경기도')","/^(경기도|서울특별시)/.test(route.adminNm||'')");
source=source.replace('bindStopsToShape(shape,normalized)','bindStopsToShape(shape,normalized,{maximumInitialDistanceKm:Infinity,maximumLegDistanceKm:Infinity})');
source+='\nmodule.exports={compile};';const child=new Module(filename,module);child.filename=filename;child.paths=module.paths;child._compile(source,filename);
const index=JSON.parse(fs.readFileSync('data/kr/generated/index.json')),existing=new Map(index.routes.map(r=>[r.id,r]));
// 색인의 services는 비어 있을 수 있으므로 실제 압축 상세에서 기준 계통 ID를 읽는다.
const baselineFile=path.join(base,'airport-expansion-baseline.json');
if(!fs.existsSync(baselineFile)){const {decode}=require('./lib/kr-payload.cjs'),known={};for(const c of read('provincial-gbis-inventory.json').routes.filter(r=>['51','52','53'].includes(String(r.routeTp)))){const id='kr-bus-gbis-'+c.routeId,meta=existing.get(id);if(meta)known[id]=decode(JSON.parse(fs.readFileSync(meta.lazySource))).route.verifiedJourneys.map(j=>j.id);}
 fs.writeFileSync(baselineFile,JSON.stringify({checkedAt:'2026-11-05',commit:'3e313a4b63d1e61f3b2fa3e2b133aed1cfc06c8b',counts:index.counts,existingAirportJourneys:known},null,2)+'\n');}
const baseline=read('airport-expansion-baseline.json').existingAirportJourneys;
const seoul=new Set(read('airport-seoul-batch.json').routes.map(r=>r.id)),routes=[],outcomes=[];
for(const candidate of read('provincial-gbis-inventory.json').routes.filter(r=>['51','52','53'].includes(String(r.routeTp)))){
 const seoulId='kr-bus-seoul-'+candidate.routeId;
 if(seoul.has(seoulId)){outcomes.push({sourceRouteId:candidate.routeId,status:'ALREADY_IMPLEMENTED',routeId:seoulId});continue;}
 try{const result=child.exports.compile(candidate),r=result.route,isSeoul=candidate.adminNm==='서울특별시',id=isSeoul?seoulId:r.id,target=baseline[id]?existing.get(id):null;
 r.id=id;r.routeNumber=candidate.routeNm.toUpperCase();r.originalRouteNumber=r.routeNumber;r.airportServiceKind='airport_bus';r.regionId=isSeoul?'seoul':'gyeonggi';r.regionKo=isSeoul?'서울특별시':'경기도';
 r.line={ko:(isSeoul?'서울':'경기 '+r.municipalityKo)+' 공항버스 '+r.routeNumber+'번'};
 if(target){const known=new Set(baseline[id]);r.verifiedJourneys=r.verifiedJourneys.filter(j=>!known.has(j.id));if(!r.verifiedJourneys.length){outcomes.push({sourceRouteId:candidate.routeId,status:'ALREADY_IMPLEMENTED',routeId:id,blockedDirections:result.failed});continue;}r.mergeIntoRouteId=id;r.id='kr-airport-recovery-gbis-'+candidate.routeId;}
 r.services=r.verifiedJourneys.map(j=>j.service);const primary=r.verifiedJourneys[0];Object.assign(r,{stations:primary.stations,geometry:primary.geometry,directedSegments:primary.directedSegments});routes.push(r);
 outcomes.push({sourceRouteId:candidate.routeId,routeId:id,status:target?'RECOVERED_PLAYABLE':'NEW_PLAYABLE',directions:r.verifiedJourneys.length,blockedDirections:result.failed});
 }catch(e){outcomes.push({sourceRouteId:candidate.routeId,status:'BLOCKED_MISSING_DATA',reason:e.message});}}
fs.writeFileSync(path.join(base,'airport-gbis-batch.json'),JSON.stringify({schemaVersion:2,routes})+'\n');fs.writeFileSync(path.join(base,'airport-gbis-report.json'),JSON.stringify({checkedAt:new Date().toISOString(),inventory:outcomes.length,newRoutes:routes.filter(r=>!r.mergeIntoRouteId).length,addedDirections:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),outcomes},null,2)+'\n');console.log({routes:routes.length,newRoutes:routes.filter(r=>!r.mergeIntoRouteId).length,directions:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),blocked:outcomes.filter(r=>r.status==='BLOCKED_MISSING_DATA').length});
