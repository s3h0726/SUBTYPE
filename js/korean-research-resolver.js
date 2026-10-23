import{KR_PREVIEW_RESTRICTIONS}from'./korean-preview-access-data.js';
import{koreanRouteBlockReason}from'./korean-access-policy.js';
// A route label describes its stop pattern. It is NOT proof of a published timetable.
// Korail confirmed the Yong-san ↔ Dongincheon express SERVICE (2026-05-20);
// only those two full-route OSM candidates have operator-confirmed identity here.
export function koreanLine1ServiceDetails(route){
 if(route?.passengerLineId!=='kr-osm-line-8691899')return null;
 const id=String(route.sourceRelationId||''),name=String(route.passengerLineName||route.line?.ko||'');
 const rawOrigin=String(route.researchEvidence?.origin||''),rawDestination=String(route.researchEvidence?.destination||'');
 const nameOnly=v=>v.trim()==='서울역'?'서울역':v.replace(/역$/,'').trim(),origin=nameOnly(rawOrigin),destination=nameOnly(rawDestination);
 const express=/급행/.test(name),branch=origin==='서동탄'||destination==='서동탄';
 const group=express?'경인선 급행':branch?'서동탄 지선 일반':origin==='천안'||destination==='천안'?'경부선 일반':'1호선 일반';
 // Ordering is solely a UI direction hint, not proof of an operator timetable.
 const rank={광운대:0,청량리:10,동묘앞:15,서울역:20,용산:25,구로:40,부천:55,병점:70,서동탄:75,동인천:80,천안:110};
 const travelDirection=rank[origin]!=null&&rank[destination]!=null?(rank[destination]<rank[origin]?'up':'down'):null;
 const confirmed=(id==='8820537'&&origin==='동인천'&&destination==='용산')||(id==='8820538'&&origin==='용산'&&destination==='동인천');
 return{group,travelDirection,groupId:express?'gyeongin-express':branch?'seodongtan-local':origin==='천안'||destination==='천안'?'gyeongbu-local':'local',
  name:group+' · '+origin+' → '+destination,origin,destination,
  evidenceStatus:confirmed?'operator-service-confirmed':'timetable-unverified',
  evidenceNote:confirmed?'한국철도공사 2026-05-20: 5월 26일부터 용산~동인천 특급을 일반 급행으로 전환':'개별 계통·운행일·정차역 공식 시간표 대조 미완료'};
}
export function isKoreanResearch(route){return route?.countryId==='kr'&&route?.previewContract==='kr-research-v1'&&route.playStatus==='RESEARCH_PLAYABLE'&&route.releaseStatus==='research'}
export function assertKoreanResearchRoute(route){
 if(!isKoreanResearch(route)||koreanRouteBlockReason(route)||route.lazy||!/^kr-preview-\d+$/.test(route.id)||route.sourceServiceId!=='kr-osm-service-'+route.sourceRelationId)throw Error('INVALID_RESEARCH_CONTRACT');
 if(KR_PREVIEW_RESTRICTIONS.some(r=>r.serviceId===route.sourceServiceId))throw Error('RESEARCH_SERVICE_RESTRICTED');
 const st=route.stations,g=route.geometry,e=route.researchEvidence,eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a[0]===b[0]&&a[1]===b[1];
 if(st?.length<2||g?.length<2||!e?.track?.length||!e.unverified?.length||e.sourceUrl!=='https://www.openstreetmap.org/relation/'+route.sourceRelationId||st[0].ko!==e.origin||st.at(-1).ko!==e.destination)throw Error('INCOMPLETE_RESEARCH_EVIDENCE');
 if(g.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<32||p[0]>40||p[1]<123||p[1]>133))throw Error('INVALID_RESEARCH_COORDINATES');
 if(e.track.some(w=>!['rail','subway','light_rail','tram','monorail','funicular'].includes(w.railway)||w.highway||['yard','siding','spur'].includes(w.service)||['private','no'].includes(w.access)||(w.oneway==='yes'&&w.reverse)||(w.oneway==='-1'&&!w.reverse)||!w.sourceUrl))throw Error('RESEARCH_TRACK_BLOCKED');
 let previous=-1;for(const s of st){if(!/[가-힣]/.test(s.ko)||!Number.isInteger(s.geometryIndex)||s.geometryIndex<=previous||!eq(g[s.geometryIndex],[s.latitude,s.longitude]))throw Error('RESEARCH_STOP_TRACK_MISMATCH');previous=s.geometryIndex}
 if(st[0].geometryIndex!==0||st.at(-1).geometryIndex!==g.length-1||route.directedSegments?.length!==st.length-1)throw Error('RESEARCH_ENDPOINT_MISMATCH');
 route.directedSegments.forEach((seg,i)=>{if(seg.fromStationId!==st[i].id||seg.toStationId!==st[i+1].id||JSON.stringify(seg.geometry)!==JSON.stringify(g.slice(st[i].geometryIndex,st[i+1].geometryIndex+1)))throw Error('RESEARCH_SEGMENT_MISMATCH')});
 if(route.services?.length!==1||JSON.stringify(route.services[0].stops)!==JSON.stringify(st.map(s=>s.id)))throw Error('RESEARCH_CALL_PATTERN_MISMATCH');
 return route;
}
export function koreanResearchChoices(route){if(!isKoreanResearch(route)||route.lazy)return[];assertKoreanResearchRoute(route);return[{kind:'koreanResearch',id:'research:'+route.sourceServiceId,patternId:route.sourceServiceId,patternName:{ko:route.integratedLine1===true?(route.line1Service?.name||koreanLine1ServiceDetails(route)?.name||'1호선 일반'):'연구용 경로 · 공식 운행 미승인'},line1PatternKey:route.integratedLine1===true?(route.line1Service?.groupId||koreanLine1ServiceDetails(route)?.groupId):null,line1UiDirection:route.integratedLine1===true?(route.line1Service?.travelDirection||koreanLine1ServiceDetails(route)?.travelDirection):null,direction:route.directionId,originId:route.stations[0].id,destinationId:route.stations.at(-1).id,originNames:route.stations[0],destinationNames:route.stations.at(-1),trainType:null}]}
export function resolveKoreanResearchChoice(choice,route){assertKoreanResearchRoute(route);const expected=koreanResearchChoices(route)[0];if(choice?.kind!=='koreanResearch'||choice.id!==expected.id||choice.originId!==expected.originId||choice.destinationId!==expected.destinationId)throw Error('INVALID_RESEARCH_DIRECTION');const detail=route.integratedLine1===true?(route.line1Service||koreanLine1ServiceDetails(route)):null;return{route:{...route,line:{...route.line,ko:detail?'수도권 전철 1호선':'연구용 · '+route.line.ko}},service:detail?{...route.services[0],nameKo:detail.name,nameJa:detail.name,nameEn:detail.name}:route.services[0],journey:{id:expected.id,baseRouteId:route.id,originStationId:expected.originId,destinationStationId:expected.destinationId,originNames:expected.originNames,destinationNames:expected.destinationNames,directionId:route.directionId},journeyId:expected.id,direction:'forward',travelDirectionId:route.directionId,pattern:{id:route.sourceServiceId,names:expected.patternName},destinationStationId:expected.destinationId,researchPreview:true};}
