'use strict';
const fs=require('node:fs'),path=require('node:path');
const MODES=new Set(['rail','subway','commuter_rail','high_speed_rail','light_rail','monorail','airport_rail','tram','bus','village_bus','express_bus','brt','river_bus']);
const korean=value=>typeof value==='string'&&/[가-힣]/u.test(value)&&!/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/u.test(value);
const coordinate=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=32&&p[0]<=39.5&&p[1]>=124&&p[1]<=132;
const distance=(a,b)=>111.195*Math.hypot(a[0]-b[0],(a[1]-b[1])*Math.cos((a[0]+b[0])*Math.PI/360));
let sparseSourceWays;
function verifiedSparseEdge(route,from,to){
 if(route.geometryEvidence?.kind!=='exact-osm-source-edges'||distance(from,to)>5)return false;
 const evidence=route.geometryEvidence.sparseSourceEdges?.find(e=>JSON.stringify(e.from)===JSON.stringify(from)&&JSON.stringify(e.to)===JSON.stringify(to)||JSON.stringify(e.from)===JSON.stringify(to)&&JSON.stringify(e.to)===JSON.stringify(from));
 if(!evidence)return false;
 sparseSourceWays??=new Map(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/kr/v2/source/osm-ways.json'),'utf8')).map(w=>[String(w.id),w]));
 const way=sparseSourceWays.get(String(evidence.wayId));if(!way)return false;
 const a=way.nodeIds.indexOf(String(evidence.fromNodeId)),b=way.nodeIds.indexOf(String(evidence.toNodeId));
 return a>=0&&Math.abs(a-b)===1&&JSON.stringify(way.coordinates[a])===JSON.stringify(evidence.from)&&JSON.stringify(way.coordinates[b])===JSON.stringify(evidence.to);
}
function validateRoute(route){
 const errors=[],fail=message=>errors.push(message);
 if(!/^kr-[a-z0-9-]+$/.test(route.id||''))fail('노선 식별자 오류');
 if(route.countryId!=='kr'||!MODES.has(route.mode))fail('지원하지 않는 교통수단');
 // 공식 버스 노선번호의 대문자는 한국어 제목 안에서도 원문 식별자로 보존한다.
 const officialCode=['bus','village_bus','express_bus','brt'].includes(route.mode)&&route.routeNumber===route.originalRouteNumber&&/^[A-Z0-9-]+$/.test(route.routeNumber||'')?route.routeNumber:null;
 const lineName=officialCode?route.line?.ko?.replace(officialCode+'번','번'):route.line?.ko;
 if(!korean(lineName)||!korean(route.operator?.ko))fail('한국어 노선·운영사명 누락');
 if(!route.regionId)fail('지역 식별자 누락');
 if(!route.operatorId)fail('운영사 식별자 누락');
 if(route.schemaVersion!==2||route.releaseStatus!=='verified'||route.geometryReady!==true)fail('공개 검증 상태 누락');
 const sources=route.sourceRefs||route.sources||[];
 if(!sources.length||sources.some(s=>!s.url||!s.license||!(s.sourceDate||s.retrievedAt||s.checkedAt)))fail('출처·자료 날짜·이용 조건 누락');
 if(!route.operationalEvidence?.url||!route.operationalEvidence?.checkedAt)fail('현재 운행 근거 누락');
 if(!route.verifiedJourneys?.length)fail('빈 운행계통');
 const seen=new Set;
 for(const journey of route.verifiedJourneys||[]){
  if(!journey.id||seen.has(journey.id))fail('운행계통 식별자 중복');seen.add(journey.id);
  if(!journey.directionId||!journey.tripIds?.length||!korean(journey.patternName?.ko))fail('방향·운행 근거·한국어 운행계통명 누락');
  const stops=journey.stations||[],geometry=journey.geometry||[],segments=journey.directedSegments||[];
  if(stops.length<2||geometry.length<2)fail('정차 순서·실제 경로 누락');
  if(geometry.some(p=>!coordinate(p)))fail('유효하지 않은 경로 좌표');
  // A source polyline may be sparse, but a kilometre-scale edge cannot be
  // treated as verified detailed navigation geometry without investigation.
  if(geometry.some((p,i)=>i&&coordinate(p)&&coordinate(geometry[i-1])&&distance(p,geometry[i-1])>2&&!verifiedSparseEdge(route,geometry[i-1],p)))fail('경로 연결 간격 초과');
  let previous=-1;
  for(const stop of stops){
   if(!stop.id||!korean(stop.ko)||!coordinate([stop.latitude,stop.longitude]))fail('정차지 식별자·한국어 이름·좌표 오류');
   if(!Number.isInteger(stop.geometryIndex)||stop.geometryIndex<=previous||stop.geometryIndex>=geometry.length)fail('정차 순서·경로 인덱스 오류');
   const p=geometry[stop.geometryIndex];if(coordinate(p)&&distance(p,[stop.latitude,stop.longitude])>.15)fail('정차지와 실제 경로 불일치');
   previous=stop.geometryIndex;
  }
  if(stops[0]?.geometryIndex!==0||stops.at(-1)?.geometryIndex!==geometry.length-1)fail('출발·종점과 경로 끝점 불일치');
  if(segments.length!==stops.length-1)fail('정차 구간 누락');
  segments.forEach((segment,i)=>{if(segment.fromStationId!==stops[i]?.id||segment.toStationId!==stops[i+1]?.id||JSON.stringify(segment.geometry)!==JSON.stringify(geometry.slice(stops[i]?.geometryIndex,stops[i+1]?.geometryIndex+1)))fail('구간 경로·방향 불일치')});
  if(JSON.stringify(journey.service?.stops)!==JSON.stringify(stops.map(s=>s.id)))fail('운행계통 정차 참조 오류');
 }
 return [...new Set(errors)];
}
function readBatches(root){
 const dir=path.join(root,'data/kr/canonical');
 if(!fs.existsSync(dir))return[];
 const batches=fs.readdirSync(dir).filter(n=>n.endsWith('-batch.json')).sort().map(n=>require('./kr-shared-geometry.cjs').shareGeometry({name:n,...JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))}));
 const arexTimetable=path.join(dir,'arex-short-turns.json');
 if(fs.existsSync(arexTimetable))require('./kr-arex-timetable.cjs').applyArexShortTurns(batches,JSON.parse(fs.readFileSync(arexTimetable,'utf8')));
 return batches;
}
function assembleCanonicalRoutes(batches){
 const byId=new Map,rejected=[],inputIds=new Set,merges=[];
 for(const batch of batches)for(const route of batch.routes||[]){
  const errors=validateRoute(route);if(inputIds.has(route.id))errors.push('노선 식별자 중복');inputIds.add(route.id);
  if(errors.length){rejected.push({batch:batch.name,id:route.id,errors});continue}
  if(route.mergeIntoRouteId){merges.push({batch:batch.name,route});continue}
  byId.set(route.id,{...route,canonicalContract:'kr-canonical-v1'});
 }
 for(const {batch,route}of merges){
  const target=byId.get(route.mergeIntoRouteId);
  if(!target||target.countryId!==route.countryId||target.mode!==route.mode||target.operatorId!==route.operatorId){rejected.push({batch,id:route.id,errors:['병합 대상·교통수단·운영사 불일치']});continue}
  const duplicate=new Set(target.verifiedJourneys.map(j=>j.id));if(route.verifiedJourneys.some(j=>duplicate.has(j.id))){rejected.push({batch,id:route.id,errors:['병합 운행계통 식별자 중복']});continue}
  const evidence=Object.fromEntries(target.verifiedJourneys.map(j=>[j.id,target.operationalEvidence]));
  target.operationalEvidenceByJourney={...evidence,...target.operationalEvidenceByJourney,...Object.fromEntries(route.verifiedJourneys.map(j=>[j.id,route.operationalEvidence]))};
  target.verifiedJourneys=[...target.verifiedJourneys,...route.verifiedJourneys];
  target.sourceRefs=[...new Map([...(target.sourceRefs||[]),...(route.sourceRefs||[])].map(s=>[JSON.stringify(s),s])).values()];
  target.mergedRecords=[...(target.mergedRecords||[]),{id:route.id,journeys:route.verifiedJourneys.map(j=>j.id),sourceRefs:route.sourceRefs}];
  if(route.geometryEvidence?.sparseSourceEdges?.length)target.geometryEvidence={...target.geometryEvidence,kind:'exact-osm-source-edges',sparseSourceEdges:[...(target.geometryEvidence?.sparseSourceEdges||[]),...route.geometryEvidence.sparseSourceEdges]};
  const errors=validateRoute(target);if(errors.length)rejected.push({batch,id:target.id,errors});
 }
 return{routes:[...byId.values()],rejected};
}
module.exports={MODES,korean,coordinate,distance,validateRoute,readBatches,assembleCanonicalRoutes};
