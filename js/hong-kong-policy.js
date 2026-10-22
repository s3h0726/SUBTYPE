// Hong Kong data must fail closed. Never reinterpret another country's records.
export function hongKongRouteBlockReason(route){
  if(route?.countryId!=='hk')return'';
  if((route.releaseStatus!=='ready'&&!(route.releaseStatus==='validation-preview'&&route.validationPreview===true&&typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)))||route.playable!==true)return(route.blockedReasons||[]).join(' · ')||'홍콩 서비스 검증 대기';
  if(route.geometryReady!==true||route.geometryStatus!=='verified')return'실제 선로 검증 필요';
  if(route.lazy)return'';
  if(!Array.isArray(route.stations)||route.stations.length<2)return'정차역 자료 필요';
  if(route.stations.some(s=>s.nameStatus!=='verified'||!s.ko||!s.ja||!s.romaji))return'한국어·번체중문·영문 역명 검수 필요';
  if(!Array.isArray(route.directedSegments)||route.directedSegments.length!==route.stations.length-1)return'정차역 간 실제 선로 누락';
  if(route.directedSegments.some((s,i)=>!['ready','verified'].includes(s.geometryStatus)||s.fromStationId!==route.stations[i].id||s.toStationId!==route.stations[i+1].id||!s.sourceWayIds?.length||!Array.isArray(s.geometry)||s.geometry.length<2))return'실제 선로 출처·연결 검증 필요';
  if(route.stations.some(s=>!Number.isFinite(s.latitude)||!Number.isFinite(s.longitude)||s.latitude<22.1||s.latitude>22.58||s.longitude<113.8||s.longitude>114.45))return'홍콩 역 좌표 검증 필요';
  if(route.stations.some(s=>Number.isInteger(s.geometryIndex)&&route.geometry?.[s.geometryIndex]&&(s.latitude!==route.geometry[s.geometryIndex][0]||s.longitude!==route.geometry[s.geometryIndex][1])))return'노선별 정차 위치와 실제 선로 불일치';
  return'';
}

export const HONG_KONG_CATEGORIES=[['all','전체'],['subway','MTR METRO'],['airport_rail','AIRPORT EXPRESS'],['light_rail','LIGHT RAIL'],['tram','TRAM'],['funicular','FUNICULAR'],['high_speed_rail','HIGH SPEED RAIL'],['custom','CUSTOM']];

export function hongKongContinuationAllowed(current,source,servicePatternId){
  const previous=current?.hkIncomingEdge;if(!previous)return true;
  if(previous.sourceServicePatternId&&previous.sourceServicePatternId!==servicePatternId)return false;
  return !!source?.geometry?.length&&JSON.stringify(previous.geometry?.at(-1))===JSON.stringify(source.geometry[0]);
}

export function buildHongKongCustomRoute(route){
  if(route?.countryId!=='hk')return route;
  if(!route.stations||route.stations.length<2)throw new Error('실제 홍콩 역을 2개 이상 선택하세요.');
  if(route.loop&&route.stations[0].sourceStationId!==route.stations.at(-1).sourceStationId)throw new Error('실제 한 바퀴가 연결된 여정만 순환선으로 저장할 수 있습니다.');
  const stations=route.stations.map(s=>({...s,internalId:s.id})),geometry=[],directedSegments=[];
  for(let i=0;i<stations.length-1;i++){
    const a=stations[i],b=stations[i+1],source=b.hkIncomingEdge;
    if(!source||source.fromStationId!==a.sourceStationId||source.toStationId!==b.sourceStationId||!source.sourceWayIds?.length||source.geometryStatus!=='ready')throw new Error('역 순서를 변경한 구간의 실제 선로를 다시 선택하세요.');
    if(i&& !hongKongContinuationAllowed(a,source,source.sourceServicePatternId))throw new Error('미검증 서비스 변경·반대편 승강장 연결은 저장할 수 없습니다.');
    if(geometry.length&&JSON.stringify(geometry.at(-1))!==JSON.stringify(source.geometry[0]))throw new Error('연결되지 않은 선로·미검증 환승은 저장할 수 없습니다.');
    a.geometryIndex=Math.max(0,geometry.length-1);geometry.push(...(geometry.length?source.geometry.slice(1):source.geometry));b.geometryIndex=geometry.length-1;
    directedSegments.push({...source,fromStationId:a.id,toStationId:b.id});
  }
  for(const station of stations){const point=geometry[station.geometryIndex];station.latitude=point[0];station.longitude=point[1];station.coordinates={lat:point[0],lng:point[1]};station.stopId=route.id+'-stop-'+station.geometryIndex;}
  const result={...route,stations,geometry,directedSegments,countryId:'hk',category:'custom',servicePatternId:route.id,releaseStatus:'ready',geometryStatus:'verified',geometryReady:true,playable:true,services:[{id:route.id,nameKo:route.line.ko,nameEn:route.line.en,nameJa:route.line.ja,stops:stations.map(s=>s.id)}]};
  const reason=hongKongRouteBlockReason(result);if(reason)throw new Error(reason);return result;
}
