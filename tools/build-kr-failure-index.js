'use strict';
const fs=require('node:fs'),path=require('node:path');
const {load,validate,assemble,compile}=require('./lib/kr-network');
const base=path.resolve(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8'));
const data=load(base),{maps,errors}=validate(data,{base});if(errors.length)throw Error(JSON.stringify(errors));
const sourceRelations=new Map(read('source/osm-relations').map(r=>[r.id,r]));
const latestWays=new Map(read('source/osm-62-20261017/osm-ways').map(w=>[w.id,w]));
const coords=new Map();for(const w of read('source/osm-ways'))w.nodeIds.forEach((id,i)=>coords.set(id,w.coordinates[i]));
const nodes=new Map(read('source/osm-nodes').map(n=>[n.id,n]));
const official=new Map(read('timetable-verifications').map(v=>[v.serviceId,v]));
const trainBrandReviews=read('train-brand-reviews');
const platformRows=read('official-platform-reference');
const rows=[];let assemblable=0,playableSourceCandidates=0;
for(const s of data.services){
 let journey;try{journey=assemble(s,maps);assemblable++}catch{}
 if(journey&&s.access?.passengerCandidate!==false){playableSourceCandidates++;continue}
 const id=s.id.split('-').at(-1),relation=sourceRelations.get(id),causes=[];
 const policy=s.access?.passengerCandidate===false;
 if(policy)causes.push(s.access.classification);
 if(s.issues.some(i=>i.code==='MISSING_ORDERED_STOPS'))causes.push('SOURCE_STOP_SEQUENCE_INCOMPLETE');
 if(s.issues.some(i=>/DISCONNECTED/.test(i.code)))causes.push('SOURCE_MEMBER_CONTINUITY_UNRESOLVED');
 if(s.issues.some(i=>/STOP.*TRACK/.test(i.code)))causes.push('SOURCE_STOP_TRACK_OR_PLATFORM_MISMATCH');
 const facilityMembers=relation.members.filter(m=>m.type==='w').flatMap(m=>{const w=latestWays.get(m.ref);return w&&!w.tags.railway?[{wayId:w.id,tags:w.tags,closed:w.nodeIds[0]===w.nodeIds.at(-1),url:'https://www.openstreetmap.org/way/'+w.id}]:[]});
 if(facilityMembers.length)causes.push('NON_RAIL_FACILITY_MEMBER_REQUIRES_REAL_TRACK_SOURCE');
 const v=official.get(s.id);
 rows.push({serviceId:s.id,relationId:id,sourceName:s.names.ko,origin:s.operatingEndpoints?.origin||s.osmFrom,destination:s.operatingEndpoints?.destination||s.osmTo,sourceOrigin:s.osmFrom,sourceDestination:s.osmTo,endpointCorrection:s.endpointCorrection||null,passengerLineId:s.passengerLineId,
  category:policy?'EXCLUDED_OR_QUARANTINED':'PASSENGER_RESEARCH',sourceAssemblable:!!journey,access:s.access||null,causes,
  relationUrl:'https://www.openstreetmap.org/relation/'+id,sourceWayIds:relation.members.filter(m=>m.type==='w').map(m=>m.ref),
  officialStopOrder:v?.calls.map(c=>c.officialStationName)||s.sourceMemberRepair?.officialStopOrder.nodes.map(n=>n.officialName)||null,officialTimetableStatus:v?.status||(s.sourceMemberRepair?'PUBLISHED_ORDER_ONLY_PLATFORM_UNRESOLVED':'NOT_VERIFIED'),
  sourceMemberRepair:s.sourceMemberRepair||null,
  trainBrandReview:trainBrandReviews.relationReviews.find(r=>r.relationId===id)||null,
  issues:s.issues.map(i=>{const n=nodes.get(i.nodeId);return {...i,fromCoordinates:coords.get(i.from)||null,toCoordinates:coords.get(i.to)||null,stopCoordinates:n?[n.lat,n.lon]:null,stopTags:n?.tags||null}}),facilityMembers,
  nextAction:policy?'공개 플레이 제외 사유 유지. 미개통·비여객·접근 제한·유형 미확인 상태를 복구 성공으로 집계하지 않음.':'공식 전체 정차 순서와 같은 방향의 실제 선로·승강장을 대조. 원본 way·정차 지점을 임의 삭제하거나 직선 연결하지 않음.'});
}
// A published direction disagreement is evidence to review, never permission
// to relabel a siding, swap platforms or reverse a train automatically.
const platformDisagreements=[];
for(const serviceId of ['kr-osm-service-2718884','kr-osm-service-4744311']){
 const s=maps.services.get(serviceId),v=official.get(serviceId);if(!s||!v)continue;
 for(const c of s.stops){const stop=maps.stops.get(c.stopId),st=maps.stations.get(stop.stationId);if(st.names.ko!=='오이도')continue;
  const facts=platformRows.filter(r=>r.stationName==='오이도'&&r.operatorName==='한국철도공사'&&r.platformCode===stop.platformCode);
  if(facts.length===1&&facts[0].directionId!==v.officialDirectionId)platformDisagreements.push({serviceId,stopId:stop.id,osmPlatformCode:stop.platformCode,timetableDirection:v.officialDirectionId,officialPlatformDirection:facts[0].directionId,officialReferenceId:facts[0].id,sourceUrl:'https://www.data.go.kr/data/15041194/fileData.do',status:'REQUIRES_TERMINAL_PLATFORM_AND_TURNBACK_REVIEW'});
 }
}
const result={asOf:'2026-10-18',status:'INCOMPLETE',scope:'Non-playable source candidates: unassemblable geometry or access quarantine; not a count of actual passenger lines or release-approved services',
 counts:{registeredServices:data.services.length,sourceAssemblable:assemblable,playableSourceCandidates,unassemblableSourceServices:data.services.length-assemblable,remaining:rows.length,passengerResearch:rows.filter(r=>r.category==='PASSENGER_RESEARCH').length,excludedOrQuarantined:rows.filter(r=>r.category!=='PASSENGER_RESEARCH').length,officialTimetablePatterns:official.size,releaseApproved:data.services.filter(s=>s.releaseApproved===true).length},platformDisagreements,rows};
const out=path.join(base,'generated');fs.writeFileSync(path.join(out,'remaining-failures.json'),JSON.stringify(result,null,2)+'\n');
// Reuse the production gate's reasons verbatim. This is an evidence index,
// never a second, more permissive approval mechanism.
const national=compile(data,{base}),blockerCounts={};
for(const row of national.blocked)for(const reason of row.reasons)blockerCounts[reason]=(blockerCounts[reason]||0)+1;
const releaseIndex={asOf:data.coverage.asOf,status:national.status,counts:national.counts,blockerCounts,
 scope:'Reasons returned by the unchanged production release gate. Calling-pattern research and source-track recovery are separate from release approval.',
 publishedResearch:{commuterTrainColumns:read('korail-commuter-research').trains.length,gyeongbuKtxTrainRows:read('korail-ktx-research').trains.length,
 restoredKtxCallingPattern:{serviceId:'kr-osm-service-11214334',sourceId:'korail-ktx-20260515',trainNumbers:['43','181'],finalTimetableApproval:false}},
 services:national.blocked.map(b=>{const s=maps.services.get(b.serviceId);return {...b,officialClockReview:official.get(s.id)?.status||null,trackSupplement:s.trackSupplement||null,sourceMemberRepair:s.sourceMemberRepair||null,endpointCorrection:s.endpointCorrection||null}})};
fs.writeFileSync(path.join(out,'release-blockers.json'),JSON.stringify(releaseIndex,null,2)+'\n');
fs.writeFileSync(path.join(out,'release-blockers.md'),['# 한국 전국 배포 승인 차단 근거','',`판정 **${national.status}** · 활성 후보 ${national.counts.activeServiceCandidates} · 승인 ${national.counts.releasedServices}`,'','기존 프로덕션 승인 함수가 반환한 실패 사유를 그대로 집계한다. 복구된 선형이나 추출된 공식 시간표 열을 정식 승인으로 취급하지 않는다.','','| 실패 사유 | 후보 수 |','|---|---:|',...Object.entries(blockerCounts).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`| ${k} | ${v} |`),'','개별 305개 후보의 사유와 새 복구 근거는 release-blockers.json에 기록한다. 전국 공식 노선·운행계통 목록도 아직 완성되지 않았다.',''].join('\n'));
const esc=x=>String(x??'미상').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
fs.writeFileSync(path.join(out,'remaining-failures.md'),['# 한국 철도 잔여 후보 목록','',`기준 ${result.asOf} · **INCOMPLETE**`,'',JSON.stringify(result.counts),'','실제 노선 수와 OSM relation 후보 수는 다르다. 아래 제외·보류 항목은 복구 성공으로 세지 않는다. 공식 시간표 패턴 일치는 선로·승강장·운행일 예외·배포 승인을 의미하지 않는다.','', '| 후보 ID | 원본 이름 | 출발 → 종착 | 구분 | 오류·원인 | 원본 |','|---|---|---|---|---|---|',...rows.map(r=>`| ${r.serviceId} | ${esc(r.sourceName)} | ${esc(r.origin)} → ${esc(r.destination)} | ${r.category} | ${[...new Set(r.issues.map(i=>i.code))].join(', ')}; ${r.causes.join(', ')} | [OSM](${r.relationUrl}) |`),'','## 오이도 승강장 방향 대조','',...platformDisagreements.map(r=>`- ${r.serviceId}: OSM 승강장 ${r.osmPlatformCode}, 시간표 ${r.timetableDirection}, 공식 승강장 방향 ${r.officialPlatformDirection}. 종착 회차 동선 확인 전 승인 보류. [공식 자료](${r.sourceUrl})`),''].join('\n'));
console.log(JSON.stringify({...result.counts,platformDirectionDisagreements:platformDisagreements.length}));
