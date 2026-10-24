'use strict';
const fs=require('node:fs'),path=require('node:path');
const {load,validate,assemble}=require('./lib/kr-network');
const base=path.resolve(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8'));
const data=load(base),{maps,errors}=validate(data,{base});if(errors.length)throw Error(JSON.stringify(errors));
const sourceRelations=new Map(read('source/osm-relations').map(r=>[r.id,r]));
const latestWays=new Map(read('source/osm-62-20261017/osm-ways').map(w=>[w.id,w]));
const coords=new Map();for(const w of read('source/osm-ways'))w.nodeIds.forEach((id,i)=>coords.set(id,w.coordinates[i]));
const nodes=new Map(read('source/osm-nodes').map(n=>[n.id,n]));
const official=new Map(read('timetable-verifications').map(v=>[v.serviceId,v]));
const platformRows=read('official-platform-reference');
const rows=[];let assemblable=0;
for(const s of data.services){
 try{assemble(s,maps);assemblable++;continue}catch{}
 const id=s.id.split('-').at(-1),relation=sourceRelations.get(id),causes=[];
 const policy=s.access?.passengerCandidate===false;
 if(policy)causes.push(s.access.classification);
 if(s.issues.some(i=>i.code==='MISSING_ORDERED_STOPS'))causes.push('SOURCE_STOP_SEQUENCE_INCOMPLETE');
 if(s.issues.some(i=>/DISCONNECTED/.test(i.code)))causes.push('SOURCE_MEMBER_CONTINUITY_UNRESOLVED');
 if(s.issues.some(i=>/STOP.*TRACK/.test(i.code)))causes.push('SOURCE_STOP_TRACK_OR_PLATFORM_MISMATCH');
 const facilityMembers=relation.members.filter(m=>m.type==='w').flatMap(m=>{const w=latestWays.get(m.ref);return w&&!w.tags.railway?[{wayId:w.id,tags:w.tags,closed:w.nodeIds[0]===w.nodeIds.at(-1),url:'https://www.openstreetmap.org/way/'+w.id}]:[]});
 if(facilityMembers.length)causes.push('NON_RAIL_FACILITY_MEMBER_REQUIRES_REAL_TRACK_SOURCE');
 const v=official.get(s.id);
 rows.push({serviceId:s.id,relationId:id,sourceName:s.names.ko,origin:s.osmFrom,destination:s.osmTo,passengerLineId:s.passengerLineId,
  category:policy?'EXCLUDED_OR_QUARANTINED':'PASSENGER_RESEARCH',access:s.access||null,causes,
  relationUrl:'https://www.openstreetmap.org/relation/'+id,sourceWayIds:relation.members.filter(m=>m.type==='w').map(m=>m.ref),
  officialStopOrder:v?.calls.map(c=>c.officialStationName)||null,officialTimetableStatus:v?.status||'NOT_VERIFIED',
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
const result={asOf:data.coverage.asOf,status:'INCOMPLETE',scope:'Unassemblable source candidates; not a count of actual passenger lines or release-approved services',
 counts:{registeredServices:data.services.length,sourceAssemblable:assemblable,remaining:rows.length,passengerResearch:rows.filter(r=>r.category==='PASSENGER_RESEARCH').length,excludedOrQuarantined:rows.filter(r=>r.category!=='PASSENGER_RESEARCH').length,officialTimetablePatterns:official.size,releaseApproved:data.services.filter(s=>s.releaseApproved===true).length},platformDisagreements,rows};
const out=path.join(base,'generated');fs.writeFileSync(path.join(out,'remaining-failures.json'),JSON.stringify(result,null,2)+'\n');
const esc=x=>String(x??'미상').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
fs.writeFileSync(path.join(out,'remaining-failures.md'),['# 한국 철도 잔여 후보 목록','',`기준 ${result.asOf} · **INCOMPLETE**`,'',JSON.stringify(result.counts),'','실제 노선 수와 OSM relation 후보 수는 다르다. 아래 제외·보류 항목은 복구 성공으로 세지 않는다. 공식 시간표 패턴 일치는 선로·승강장·운행일 예외·배포 승인을 의미하지 않는다.','', '| 후보 ID | 원본 이름 | 출발 → 종착 | 구분 | 오류·원인 | 원본 |','|---|---|---|---|---|---|',...rows.map(r=>`| ${r.serviceId} | ${esc(r.sourceName)} | ${esc(r.origin)} → ${esc(r.destination)} | ${r.category} | ${[...new Set(r.issues.map(i=>i.code))].join(', ')}; ${r.causes.join(', ')} | [OSM](${r.relationUrl}) |`),'','## 오이도 승강장 방향 대조','',...platformDisagreements.map(r=>`- ${r.serviceId}: OSM 승강장 ${r.osmPlatformCode}, 시간표 ${r.timetableDirection}, 공식 승강장 방향 ${r.officialPlatformDirection}. 종착 회차 동선 확인 전 승인 보류. [공식 자료](${r.sourceUrl})`),''].join('\n'));
console.log(JSON.stringify({...result.counts,platformDirectionDisagreements:platformDisagreements.length}));
