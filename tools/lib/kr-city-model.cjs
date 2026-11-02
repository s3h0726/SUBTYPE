'use strict';
const {bindStopsToShape}=require('./kr-road-binding.cjs'),{validateRoute,distance,korean}=require('./kr-canonical.cjs');
const alphabet=['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지'];
const ko=x=>String(x??'').replace(/APT/gi,'아파트').replace(/[A-Za-z]/g,c=>alphabet[c.toUpperCase().charCodeAt(0)-65]).normalize('NFC').trim();
// 도로 원본의 점 순서를 보존하고 정류장 투영점만 같은 선분 안에 삽입한다.
function journey(prefix,id,name,rawStops,shape,extra={}){
 const clean=[];for(const p of shape)if(!clean.length||JSON.stringify(clean.at(-1))!==JSON.stringify(p))clean.push(p);
 const hints=rawStops.map((s,i)=>({...s,posY:Number(s.lat),posX:Number(s.lon),stationOrd:i+1,guganLen:i?distance([Number(s.lat),Number(s.lon)],[Number(rawStops[i-1].lat),Number(rawStops[i-1].lon)])*1000:0}));
 const bound=bindStopsToShape(clean,hints),first=bound.indexes[0],last=bound.indexes.at(-1),geometry=bound.geometry.slice(first,last+1),seen=new Map;
 const stations=rawStops.map((s,i)=>{const canonicalStopId='kr-'+prefix+'-stop-'+s.id,n=(seen.get(canonicalStopId)||0)+1;seen.set(canonicalStopId,n);return{id:canonicalStopId+(n>1?'-visit-'+n:''),canonicalStopId,sourceStopId:String(s.id),sourceSequence:s.sequence??i+1,sourceName:s.name,ko:ko(s.name),ja:ko(s.name),kana:ko(s.name),romaji:ko(s.name),latitude:Number(s.lat),longitude:Number(s.lon),geometryIndex:bound.indexes[i]-first}});
 const label=stations[0].ko+' → '+stations.at(-1).ko+(name?' · '+ko(name):'');
 return{id,patternId:id,directionId:String(extra.directionId??id),tripIds:[String(extra.sourcePatternId??id)],patternName:{ko:label},stations,geometry,geometryEvidence:{kind:'official-municipal-road-polyline',sourcePositions:bound.sourcePositions.slice(first,last+1),maximumOffsetKm:bound.maximumOffsetKm},sourcePattern:extra,directedSegments:stations.slice(1).map((s,i)=>({fromStationId:stations[i].id,toStationId:s.id,geometry:geometry.slice(stations[i].geometryIndex,s.geometryIndex+1)})),service:{id,nameKo:label,stops:stations.map(s=>s.id)}};
}
function route({prefix,id,regionId,regionKo,name,operator,operatorKey,journeys,category='city_bus',categoryKo='시내버스',mode='bus',sources,sourceRouteIds,extra={}}){
 if(!korean(ko(operator)))throw Error('공식 운영사명 미확인');
 const result={schemaVersion:2,id:'kr-bus-'+prefix+'-'+id,countryId:'kr',regionId,regionKo,mode,category,normalizedCategory:category,categoryKo,line:{ko:ko(name)},routeNumber:String(extra.routeNumber??id),operatorId:'kr-'+prefix+'-operator-'+operatorKey,operator:{ko:ko(operator)},lineColor:extra.color||'#2876bd',releaseStatus:'verified',geometryReady:true,verifiedJourneys:journeys,stations:journeys[0]?.stations,geometry:journeys[0]?.geometry,sourceRefs:sources,sourceRouteIds:sourceRouteIds||[String(id)],operationalEvidence:{url:sources[0].url,checkedAt:sources[0].retrievedAt},...extra};
 const errors=validateRoute(result);if(errors.length)throw Error(errors.join(' / '));return result;
}
// 부분 운행은 이미 검증한 원본 경로를 그대로 잘라 사용한다.
function sliceJourney(whole,id,direction,start,end){const a=whole.stations[start].geometryIndex,b=whole.stations[end].geometryIndex,geometry=whole.geometry.slice(a,b+1),stations=whole.stations.slice(start,end+1).map(s=>({...s,geometryIndex:s.geometryIndex-a})),label=stations[0].ko+' → '+stations.at(-1).ko;return{...whole,id,patternId:id,directionId:direction,patternName:{ko:label},stations,geometry,geometryEvidence:{...whole.geometryEvidence,sourcePositions:whole.geometryEvidence.sourcePositions.slice(a,b+1)},sourcePattern:{...whole.sourcePattern,directionId:direction,startSequence:stations[0].sourceSequence,endSequence:stations.at(-1).sourceSequence},directedSegments:stations.slice(1).map((s,i)=>({fromStationId:stations[i].id,toStationId:s.id,geometry:geometry.slice(stations[i].geometryIndex,s.geometryIndex+1)})),service:{id,nameKo:label,stops:stations.map(s=>s.id)}}}
module.exports={journey,route,ko,sliceJourney};
