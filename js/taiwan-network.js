import{getTaiwanDisplayNames,registerTaiwanDisplay}from'./taiwan-display.js';
// Taiwan has a physical catalog and independently evidenced passenger journeys.
// A Chinese original is retained as zh; legacy ja presentation slots use Korean.
export const TAIWAN_CATEGORIES=[['all','전체'],['rail','일반철도'],['shinkansen','고속철도'],['subway','지하철'],['airport_rail','공항철도'],['light_rail','경전철'],['heritage','삼림·관광철도'],['custom','커스텀']];
let taiwanPatterns=new Map(),taiwanTracks=new Map(),taiwanStations=new Map();
export function taiwanKoreanPresentation(route){
 if(route?.countryId!=='tw')return route;
 const stations=(route.stations||[]).map(s=>({...s,zh:getTaiwanDisplayNames(s).zh,ja:s.ko,kana:s.ko,romaji:s.en||s.names?.en||'',names:{...s.names,zh:getTaiwanDisplayNames(s).zh,ja:s.ko,ko:s.ko},routeSpecificStationName:true}));
 if(stations.some(s=>!/[가-힣]/.test(s.ko||'')||/[\p{Script=Han}]/u.test(s.ko)))throw Error('대만 역명의 한국어 번역이 필요합니다.');
 return{...route,operator:{...route.operator,zh:getTaiwanDisplayNames(route.operator).zh,ja:route.operator.ko},line:{...route.line,zh:getTaiwanDisplayNames(route.line).zh,ja:route.line.ko},stations};
}
export function configureTaiwanNetwork(lines,patterns){
 registerTaiwanDisplay(lines,patterns);
 taiwanTracks=new Map(lines.map(l=>[l.id,l]));taiwanPatterns=new Map(patterns.map(p=>[p.id,p]));
 taiwanStations=new Map(lines.flatMap(l=>l.stations.map(s=>[s.id,s])));
 return lines;
}
export function taiwanFreeDriveTracks(){return[...taiwanTracks.values()].filter(l=>l.visibility==='internal')}
export function taiwanOperatingChoices(route){return(route?.taiwanServices||[]).map(id=>taiwanPatterns.get(id)).filter(Boolean).map(spec=>({kind:'taiwan',id:spec.id,originId:spec.origin.id,destinationId:spec.loop?spec.origin.id+'-circuit-end':spec.destination.id,originNames:taiwanStations.get(spec.origin.id)||spec.origin,destinationNames:taiwanStations.get((spec.loop?spec.origin:spec.destination).id)||(spec.loop?spec.origin:spec.destination),patternName:{en:spec.displayNames?.en||'',zh:spec.displayNames?.zh||spec.nameZh||'',ko:spec.loop&&!spec.roundTrip?(spec.direction==='reverse'?'반시계 방향 한 바퀴':'시계 방향 한 바퀴'):spec.nameKo},trainType:null,journeyId:spec.id,patternId:spec.id,direction:spec.direction||'forward',legacyServiceId:spec.id}))}
const taiwanDistance=(a,b)=>Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360));
export function resolveTaiwanChoice(choice,owner){
 const spec=taiwanPatterns.get(choice.id);if(!spec||!owner.taiwanServices?.includes(spec.id))throw Error('대만 운행계통이 없습니다.');
 const stations=[],geometry=[];
 for(const part of spec.parts){const line=taiwanTracks.get(part.lineId);if(!line?.geometryReady)throw Error('대만 실제 선로가 없습니다.');const ss=line.stations.slice(Math.min(part.a,part.b),Math.max(part.a,part.b)+1);if(part.b<part.a)ss.reverse();
  for(let i=0;i<ss.length;i++){
   const s=ss[i];if(i===0&&stations.length){if(s.networkKey!==stations.at(-1).networkKey)throw Error('대만 선로 접속점이 다릅니다.');continue}
   if(i){const previous=ss[i-1],a=previous.geometryIndex,b=s.geometryIndex;let points=line.geometry.slice(Math.min(a,b),Math.max(a,b)+1).map(p=>[...p]);if(b<a)points.reverse();if(geometry.length){if(taiwanDistance(geometry.at(-1),points[0])>.15)throw Error('대만 선로 사이에 틈이 있습니다.');points[0]=geometry.at(-1);points.shift()}else geometry.push(points.shift());geometry.push(...points)}
   stations.push({...s,geometryIndex:Math.max(0,geometry.length-1)});
  }
 }
 let calls=[...spec.calls];
 if(spec.loop){
  // The source loop includes its closing track. Keep one arrival-only boundary
  // marker so the train traverses C38 -> C1 without asking for C1 twice.
  const line=taiwanTracks.get(spec.parts[0].lineId),closing=line.loopClosingGeometry;
  if(!closing?.length)throw Error('순환선의 마지막 선로가 없습니다.');
  if(!geometry.length&&stations.length===1)geometry.push([...line.geometry[0]]);
  let points=closing.map(p=>[...p]);if(spec.direction==='reverse')points.reverse();
  if(taiwanDistance(geometry.at(-1),points[0])>.15)throw Error('순환선 접속 오류');points[0]=geometry.at(-1);geometry.push(...points.slice(1));
  const first=stations[0],arrival={...first,id:first.id+'-circuit-end',station_id:first.station_id,loopArrivalOnly:true,geometryIndex:geometry.length-1};stations.push(arrival);calls.push(arrival.id);
 }
 const service={id:spec.id,nameKo:choice.patternName?.ko||spec.nameKo,nameJa:choice.patternName?.ko||spec.nameKo,nameZh:choice.patternName?.zh||spec.displayNames?.zh||spec.nameZh||'',nameEn:spec.displayNames?.en||'',stops:calls};
 const route=taiwanKoreanPresentation({...owner,id:owner.id,physicalLineId:owner.id,selectedServiceId:spec.id,serviceJourney:{id:spec.id},stations,geometry,loop:false,taiwanCircuit:!!spec.loop,services:[service],geometryReady:true,geometryStatus:'ready',directedSegments:[]});
 return{route,service,direction:'forward',pattern:{id:spec.id,names:{ko:service.nameKo,zh:service.nameZh}},trainType:null,journey:{id:spec.id,directionId:spec.direction,originStationId:stations[0].id,destinationStationId:stations.at(-1).id},destinationStationId:stations.at(-1).id,trainTypeContexts:[]};
}
