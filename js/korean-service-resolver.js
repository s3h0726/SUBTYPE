// A v2 journey is already directional and contains only timetable stopping calls.
// Geometry between calls includes every non-stopping station and track curve.
export function koreanVerifiedChoices(route){
 if(route?.countryId!=='kr'||route.schemaVersion!==2)return[];
 return(route.verifiedJourneys||[]).map(journey=>({kind:'koreanVerified',id:journey.id,patternId:journey.patternId,patternName:journey.patternName,direction:journey.directionId,originId:journey.stations[0].id,destinationId:journey.stations.at(-1).id,originNames:journey.stations[0],destinationNames:journey.stations.at(-1),trainType:null}));
}
export function resolveKoreanVerifiedChoice(choice,route){
 if(route?.countryId!=='kr'||route.schemaVersion!==2||route.releaseStatus!=='verified'||!route.geometryReady)throw Error('검증되지 않은 한국 철도 데이터입니다.');
 const journey=route.verifiedJourneys?.find(j=>j.id===choice?.id);
 if(!journey||!journey.tripIds?.length||journey.stations?.length<2||journey.geometry?.length<2)throw Error('확인된 실제 운행계통이 아닙니다.');
 if(choice.originId!==journey.stations[0].id||choice.destinationId!==journey.stations.at(-1).id)throw Error('실제 운행하지 않는 기점·종점 조합입니다.');
 const resolved={...route,stations:journey.stations,geometry:journey.geometry,directedSegments:journey.directedSegments,services:[journey.service],selectedDirectionId:journey.directionId};
 const context={id:journey.id,baseRouteId:route.id,originStationId:journey.stations[0].id,destinationStationId:journey.stations.at(-1).id,originNames:journey.stations[0],destinationNames:journey.stations.at(-1),directionId:journey.directionId};
 return{route:resolved,service:journey.service,journey:context,journeyId:journey.id,direction:'forward',travelDirectionId:journey.directionId,pattern:{id:journey.patternId,names:journey.patternName},trainType:null,destinationStationId:journey.stations.at(-1).id,trainTypeContexts:[]};
}
