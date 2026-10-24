import{hongKongRouteBlockReason}from'./hong-kong-policy.js';
// One operator card, six actual route pairs, independently sourced directions.
// Boarding midway never fabricates a reverse trip or changes the official terminus.
export function hongKongTramChoices(routes){
 const choices=[];
 for(const route of routes){if(route.countryId!=='hk'||route.canonicalLineId!=='hk-tramway'||route.lazy||hongKongRouteBlockReason(route))continue;
  const last=route.stations.at(-1),tramGroup=route.tramServiceGroup;
  if(!tramGroup)continue;
  const tramGroupLabel=[route.stations[0].ko,last.ko].sort().join(' ↔ ');
  for(let boardingIndex=0;boardingIndex<route.stations.length-1;boardingIndex++){const first=route.stations[boardingIndex];choices.push({kind:'hongKongTram',id:route.id+':board:'+boardingIndex,sourceRouteId:route.id,tramGroup,tramGroupLabel,boardingIndex,originId:first.id,destinationId:last.id,originNames:first,destinationNames:last,directionOriginNames:route.stations[0],patternName:route.line,direction:route.direction,legacyServiceId:route.services[0].id})}
 }
 return choices;
}
export function resolveHongKongTramChoice(choice,route){
 if(choice?.kind!=='hongKongTram'||choice.sourceRouteId!==route?.id||hongKongRouteBlockReason(route)||!Number.isInteger(choice.boardingIndex)||choice.boardingIndex<0||choice.boardingIndex>=route.stations.length-1)throw Error('검증된 트램 승차 구간이 아닙니다.');
 const calls=route.stations.slice(choice.boardingIndex);
 if(calls[0].id!==choice.originId||calls.at(-1).id!==choice.destinationId)throw Error('트램 출발·종착 정류장이 원본 운행계통과 다릅니다.');
 return{route,service:route.services[0],boardingStationId:calls[0].id,direction:'forward',pattern:null,trainType:null,destinationStationId:calls.at(-1).id,trainTypeContexts:[]};
}
