import{mapOnlyKtxJourneySegments}from'./ktx-gyeongbu-map-display.js';
// Canonical v2 journeys contain timetable stops and actual railway curves.
export function koreanServiceIsCurrent(window={}){
 const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
 return(!window.start||date>=window.start)&&(!window.end||date<=window.end);
}
const ktxStationSignature=stations=>(stations||[]).map(station=>String(
 station?.ko||station?.names?.ko||station?.stationMasterId||station?.id||''
).normalize('NFC').trim()).join('→');
const isKtxJourney=(route,journey)=>{
 const label=[route?.line?.ko,journey?.patternName?.ko,journey?.service?.nameKo].join(' ');
 return route?.countryId==='kr'&&route.mode==='high_speed_rail'&&
  /KTX|케이티엑스/i.test(label)&&!/SRT|에스알티/i.test(label);
};
const makeKoreanChoice=journey=>({
 kind:'koreanVerified',id:journey.id,patternId:journey.patternId,
 patternName:journey.patternName,direction:journey.directionId,
 originId:journey.stations[0].id,destinationId:journey.stations.at(-1).id,
 originNames:journey.stations[0],destinationNames:journey.stations.at(-1),trainType:null
});
export function koreanVerifiedChoices(route){
 if(route?.countryId!=='kr'||route.schemaVersion!==2||route.releaseStatus!=='verified')return[];
 const journeys=(route.verifiedJourneys||[]).filter(journey=>
  journey?.stations?.length>=2&&koreanServiceIsCurrent(journey.serviceDates));
 // KTX and KTX-산천 are rolling stock, not different stopping patterns.
 // Deduplicate only identical directed calls within the same physical line.
 const choices=[],seen=new Set(),present=new Set();
 for(const journey of journeys)if(isKtxJourney(route,journey))
  present.add(ktxStationSignature(journey.stations));
 for(const journey of journeys){
  const ktx=isKtxJourney(route,journey);
  const signature=ktxStationSignature(journey.stations);
  if(ktx){if(seen.has(signature))continue;seen.add(signature);}
  choices.push(makeKoreanChoice(journey));
  // A missing reverse direction is a GAME simulation of the same continuous
  // source track; it is NOT an invented opposite-direction train timetable.
  if(!ktx||route.oneWay===true)continue;
  const reverseSignature=ktxStationSignature([...journey.stations].reverse());
  if(reverseSignature===signature||present.has(reverseSignature)||seen.has(reverseSignature))continue;
  seen.add(reverseSignature);
  choices.push({...makeKoreanChoice(journey),
   id:'kr-ktx-game-reverse:'+journey.id,sourceJourneyId:journey.id,
   simulatedReverse:true,timetableVerified:false,
   direction:String(journey.directionId||'forward')+':game-reverse',
   originId:journey.stations.at(-1).id,destinationId:journey.stations[0].id,
   originNames:journey.stations.at(-1),destinationNames:journey.stations[0]});
 }
 return choices;
}
const reverseKtxJourney=journey=>{
 const last=journey.geometry.length-1;
 const geometry=journey.geometry.slice().reverse().map(point=>[...point]);
 const stations=journey.stations.slice().reverse().map(station=>({
  ...station,geometryIndex:last-station.geometryIndex
 }));
 const directedSegments=journey.directedSegments.slice().reverse().map((segment,i)=>({
  ...segment,fromStationId:stations[i].id,toStationId:stations[i+1].id,
  geometry:segment.geometry.slice().reverse().map(point=>[...point]),
  geometryStatus:'ready'
 }));
 // No original forward train number is shown as evidence of a reverse train.
 const service={...journey.service,
  id:String(journey.service?.id||journey.id)+':game-reverse',
  stops:stations.map(station=>station.id),
  nameKo:String(journey.service?.nameKo||journey.patternName?.ko||'KTX')+
   ' · 역방향 게임 운행(시간표 미검증)'};
 return {...journey,stations,geometry,directedSegments,service,
  simulatedReverse:true,timetableVerified:false,sourceJourneyId:journey.id,
  tripIds:[],officialTrainNumbers:[],operatingCalendars:[]};
};
export function resolveKoreanVerifiedChoice(choice,route){
 if(route?.countryId!=='kr'||route.schemaVersion!==2||route.releaseStatus!=='verified'||!route.geometryReady)
  throw Error('검증되지 않은 한국 철도 데이터입니다.');
 const available=koreanVerifiedChoices(route).find(item=>item.id===choice?.id);
 if(!available)throw Error('현재 운행 기간에 해당하지 않는 운행계통입니다.');
 const original=route.verifiedJourneys?.find(j=>j.id===(available.sourceJourneyId||available.id));
 if(!original||!original.tripIds?.length||original.stations?.length<2||
  original.geometry?.length<2||original.directedSegments?.length!==original.stations.length-1)
  throw Error('확인된 실제 운행계통이 아닙니다.');
 const journey=available.simulatedReverse?reverseKtxJourney(original):original;
 if(choice.originId!==journey.stations[0].id||choice.destinationId!==journey.stations.at(-1).id)
  throw Error('실제 운행하지 않는 기점·종점 조합입니다.');
 const segments=journey.directedSegments.map(segment=>({...segment,geometryStatus:'ready'}));
 const displaySegments=typeof mapOnlyKtxJourneySegments==='function'
  ?mapOnlyKtxJourneySegments(route,{...journey,directedSegments:segments}):null;
 const resolved={...route,stations:journey.stations,geometry:journey.geometry,directedSegments:segments,
  ...(displaySegments?{mapDisplaySegments:displaySegments,mapGeometryCorrection:'verified-reference-centerline-visual-only'}:{}),
  services:[journey.service],selectedDirectionId:available.direction,
  ...(available.simulatedReverse?{gameOnlyReverse:true,timetableVerified:false,
   serviceNote:'역방향 게임 운행이며 실제 역방향 열차 시간표를 뜻하지 않습니다.'}:{})};
 const context={id:available.id,baseRouteId:route.id,originStationId:journey.stations[0].id,
  destinationStationId:journey.stations.at(-1).id,originNames:journey.stations[0],
  destinationNames:journey.stations.at(-1),directionId:available.direction,
  ...(available.simulatedReverse?{sourceJourneyId:original.id,simulatedReverse:true}:{})};
 return{route:resolved,service:journey.service,journey:context,journeyId:available.id,
  direction:'forward',travelDirectionId:available.direction,
  pattern:{id:journey.patternId,names:journey.patternName},trainType:null,
  destinationStationId:journey.stations.at(-1).id,trainTypeContexts:[]};
}
