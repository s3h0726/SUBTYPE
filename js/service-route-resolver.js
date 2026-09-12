const copyGeometry=geometry=>(geometry||[]).map(point=>[Number(point[0]),Number(point[1])]);
const stationKey=station=>String(station?.stationMasterId||station?.sourceStationId||station?.internalId||station?.id||'');
const routeIds=spec=>spec?.routeSegments?.map(segment=>segment.routeId)||spec?.routeIds||[];
const sameStation=(left,right)=>stationKey(left)===stationKey(right)||Boolean(left?.ja&&right?.ja&&left.ja===right.ja);
const sameBoundaryStation=(spec,left,right)=>sameStation(left,right)||(spec?.boundaryStationAliases||[]).some(pair=>{
  const values=new Set(pair.map(String));
  return(values.has(stationKey(left))&&values.has(stationKey(right)))||(values.has(String(left?.ja||''))&&values.has(String(right?.ja||'')));
});
const radians=value=>value*Math.PI/180;
const pointDistanceKm=(left,right)=>{const dLat=radians(right[0]-left[0]),dLon=radians(right[1]-left[1]),value=Math.sin(dLat/2)**2+Math.cos(radians(left[0]))*Math.cos(radians(right[0]))*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(value),Math.sqrt(1-value))};

export function serviceCatalog(){
  return globalThis.TRT_TOKYO_SERVICE_PATTERNS||{trainTypes:[],branches:[],servicePatterns:[]}
}

export function trainTypeFor(id){return serviceCatalog().trainTypes?.find(item=>item.id===id)||null}
export function branchFor(id){return serviceCatalog().branches?.find(item=>item.id===id)||null}
export function servicePatternFor(id){return serviceCatalog().servicePatterns?.find(item=>item.id===id)||null}
export function servicePatternsForRoute(routeId){return(serviceCatalog().servicePatterns||[]).filter(item=>item.baseRouteId===routeId&&(!item.status||item.status==='active'))}
const endpointFor=id=>serviceCatalog().destinations?.find(item=>String(item.stationId)===String(id))||null;
const endpointNames=id=>endpointFor(id)?.names||{ja:String(id||''),ko:String(id||''),en:String(id||'')};

export function serviceJourneysForRoute(routeId){
  const canonical=(serviceCatalog().serviceJourneys||[]).filter(item=>item.baseRouteId===routeId&&(!item.status||item.status==='active'));
  return canonical.map(item=>{const pattern=servicePatternFor(item.servicePatternId);return{...item,originNames:endpointNames(item.originStationId),destinationNames:endpointNames(item.destinationStationId),names:pattern?.names||item.names}})
}
export function journeyOriginsForRoute(routeId){return[...new Map(serviceJourneysForRoute(routeId).map(item=>[item.originStationId,{stationId:item.originStationId,names:item.originNames}])).values()]}
export function journeyDestinationsForRoute(routeId,originStationId){return[...new Map(serviceJourneysForRoute(routeId).filter(item=>item.originStationId===originStationId).map(item=>[item.destinationStationId,{stationId:item.destinationStationId,names:item.destinationNames}])).values()]}
export function journeyTrainTypesForRoute(routeId,originStationId,destinationStationId){return[...new Map(serviceJourneysForRoute(routeId).filter(item=>item.originStationId===originStationId&&item.destinationStationId===destinationStationId).map(item=>[item.trainTypeId,trainTypeFor(item.trainTypeId)])).values()].filter(Boolean)}

function contextOf(route){return{id:route.id,operatorId:route.operatorId,line:route.line,operator:route.operator,operatorAsset:route.operatorAsset,symbolAsset:route.symbolAsset,code:route.code,lineColor:route.lineColor,lineTheme:route.lineTheme}}

function prepareThroughPart(route,config={}){
  let geometry=copyGeometry(route.geometry),stations=(route.stations||[]).map(station=>({...station}));
  if(config.direction==='reverse'){
    geometry=geometry.slice().reverse();
    stations=stations.slice().reverse().map(station=>({...station,geometryIndex:Math.max(0,geometry.length-1-(station.geometryIndex??0))}))
  }
  const start=config.startStationId?stations.findIndex(station=>stationKey(station)===String(config.startStationId)):config.startStationJa?stations.findIndex(station=>station.ja===config.startStationJa):0;
  const end=config.endStationId?stations.findIndex(station=>stationKey(station)===String(config.endStationId)):config.endStationJa?stations.findIndex(station=>station.ja===config.endStationJa):stations.length-1;
  if(start<0||end<start)throw new Error(`Invalid service range ${route.id}: ${config.startStationId||config.startStationJa||'*'} -> ${config.endStationId||config.endStationJa||'*'}`);
  const selected=stations.slice(start,end+1),firstGeometry=selected[0]?.geometryIndex??0,lastGeometry=selected.at(-1)?.geometryIndex??geometry.length-1;
  return{...route,geometry:geometry.slice(firstGeometry,lastGeometry+1),stations:selected.map(station=>({...station,geometryIndex:(station.geometryIndex??firstGeometry)-firstGeometry}))}
}

export function buildThroughServiceRoute(spec,getRoute,directionId='forward'){
  if(!spec)throw new Error('Missing through-service definition');
  const directional=spec.directionVariants?.[directionId],configs=directional||spec.routeSegments||routeIds(spec).map(routeId=>({routeId})),parts=configs.map(config=>{
    const source=getRoute(config.routeId);if(!source)throw new Error(`Missing through-service route: ${config.routeId}`);return prepareThroughPart(source,config)
  });
  const stations=[],geometry=[],contexts=[];
  for(const part of parts){
    if(part.stations.length<2||part.geometry.length<2)throw new Error(`${spec.id}: incomplete part ${part.id}`);
    if(stations.length){
      if(!sameBoundaryStation(spec,stations.at(-1),part.stations[0]))throw new Error(`${spec.id}: disconnected station boundary at ${part.id}`);
      const previous=geometry.at(-1),next=part.geometry[0];
      // Verified representations of the same interchange can differ slightly by
      // platform/track. Snap the shared endpoint; never draw a synthetic connector.
      const gapKm=pointDistanceKm(previous,next),tolerance=Number(spec.boundarySnapToleranceKm??0.25);
      if(gapKm>tolerance)throw new Error(`${spec.id}: geometry boundary gap at ${part.id} (${gapKm.toFixed(3)} km)`);
      if(gapKm>1e-7)part.geometry[0]=[...previous];
    }
    let offset=geometry.length;if(geometry.length&&part.geometry?.length&&Math.hypot(geometry.at(-1)[0]-part.geometry[0][0],geometry.at(-1)[1]-part.geometry[0][1])<.002){offset--;geometry.push(...copyGeometry(part.geometry).slice(1))}else geometry.push(...copyGeometry(part.geometry));
    const context=contextOf(part),start=Math.max(0,stations.length-1);
    for(let index=0;index<part.stations.length;index++){
      const station=part.stations[index],sameBoundary=index===0&&stations.length&&sameBoundaryStation(spec,stations.at(-1),station);if(sameBoundary){
        if(spec.boundaryCanonicalStationJa&&station.ja===spec.boundaryCanonicalStationJa){
          const previous=stations.at(-1);stations[stations.length-1]={...station,geometryIndex:previous.geometryIndex,segment:context};
        }
        continue;
      }
      stations.push({...station,geometryIndex:(station.geometryIndex??0)+offset,segment:context})
    }
    contexts.push({...context,fromStation:start,toStation:stations.length-1})
  }
  if(stations.length<2||geometry.length<2)throw new Error(`${spec.id}: incomplete through-service route`);
  return{...parts[0],id:`through-${spec.id}`,dataKind:'throughService',selectedDirectionId:directionId,line:{ja:spec.nameJa,ko:spec.nameKo,en:spec.nameEn},stations,geometry,segments:contexts,throughService:spec,loop:false,coverage:'verified-through-service'}
}

export function buildBranchRoute(branch,source){
  if(!branch||!source)throw new Error('Missing branch or parent route');
  const sourceMap=new Map((source.stations||[]).map(station=>[stationKey(station),station])),stations=branch.stationSequence.map(id=>sourceMap.get(String(id)));
  if(stations.some(station=>!station))throw new Error(`${branch.id}: branch station is missing from ${source.id}`);
  const geometryData=branch.geometryData;if(!geometryData?.geometry?.length||geometryData.geometryStatus!=='ready')throw new Error(`${branch.id}: verified branch geometry is unavailable`);
  const geometry=[],directedSegments=[],resolvedStations=[];
  for(let index=0;index<geometryData.directedSegments.length;index++){
    const part=copyGeometry(geometryData.directedSegments[index].geometry);if(geometry.length&&part.length&&geometry.at(-1)[0]===part[0][0]&&geometry.at(-1)[1]===part[0][1])part.shift();
    const from=stations[index],to=stations[index+1],fromCode=branch.stationCodes?.[stationKey(from)]||from.officialCode||'';resolvedStations[index]={...from,officialCode:fromCode,stationCode:fromCode,hasOfficialStationCode:!!fromCode,geometryIndex:Math.max(0,geometry.length-1),segment:contextOf(source)};geometry.push(...part);
    directedSegments.push({fromStationId:stationKey(from),toStationId:stationKey(to),geometry:copyGeometry(geometryData.directedSegments[index].geometry),source:geometryData.directedSegments[index].source,endpointMismatch:false})
  }
  const terminal=stations.at(-1),terminalCode=branch.stationCodes?.[stationKey(terminal)]||terminal.officialCode||'';resolvedStations[stations.length-1]={...terminal,officialCode:terminalCode,stationCode:terminalCode,hasOfficialStationCode:!!terminalCode,geometryIndex:Math.max(0,geometry.length-1),segment:contextOf(source)};
  return{...source,id:`branch-${branch.id}`,dataKind:'branch',parentLineId:branch.parentLineId,branch,line:{...source.line,...branch.names},stations:resolvedStations,geometry,directedSegments,geometryReady:true,loop:false,coverage:'verified-osm-branch'}
}

export function resolveServiceSelection({baseRoute,servicePatternId,directionId='forward',legacyServiceId='local',getRoute}){
  const pattern=servicePatternFor(servicePatternId);
  if(!pattern){const service=baseRoute.services?.find(item=>item.id===legacyServiceId)||baseRoute.services?.[0];return{route:baseRoute,service,direction:directionId,pattern:null,trainType:null,destinationStationId:null}}
  if(pattern.baseRouteId!==baseRoute.id)throw new Error(`${pattern.id}: pattern does not belong to ${baseRoute.id}`);
  if(pattern.status&&pattern.status!=='active')throw new Error(`${pattern.id}: ${pattern.status}`);
  let route=baseRoute;
  if(pattern.branchId)route=buildBranchRoute(branchFor(pattern.branchId),baseRoute);
  if(pattern.throughServiceId){const spec=(globalThis.TRT_RAIL_SYSTEM?.throughServices||[]).find(item=>item.id===pattern.throughServiceId);route=buildThroughServiceRoute(spec,getRoute,pattern.directionId||directionId)}
  else route=prepareThroughPart(route,{direction:pattern.directionId||directionId,startStationId:pattern.originStationId,endStationId:pattern.destinationStationId});
  const routeIdsSet=new Set(route.stations.map(stationKey)),stops=(pattern.stopStationIds?.length?pattern.stopStationIds:route.stations.map(stationKey)).map(String);
  for(const id of stops)if(!routeIdsSet.has(id))throw new Error(`${pattern.id}: stop ${id} is outside the resolved route`);
  const service={id:pattern.id,nameJa:pattern.names.ja,nameKo:pattern.names.ko,nameEn:pattern.names.en,stops,trainTypeId:pattern.trainTypeId,destinationStationId:pattern.destinationStationId,throughServiceId:pattern.throughServiceId||null};
  // A directional through route is already assembled in travel order. Passing
  // "reverse" to the game would reverse it a second time.
  const resolvedDirection='forward';
  return{route:{...route,services:[service]},service,direction:resolvedDirection,travelDirectionId:pattern.directionId||directionId,pattern,trainType:trainTypeFor(pattern.trainTypeId),destinationStationId:pattern.destinationStationId}
}

export function resolveServiceJourney({baseRoute,journeyId,originStationId,destinationStationId,trainTypeId,getRoute}){
  const journeys=serviceJourneysForRoute(baseRoute.id),journey=journeys.find(item=>item.id===journeyId)||journeys.find(item=>item.originStationId===originStationId&&item.destinationStationId===destinationStationId&&item.trainTypeId===trainTypeId);
  if(!journey)throw new Error('실제로 운행하는 출발지·종착지·열차종별 조합이 아닙니다.');
  const resolved=resolveServiceSelection({baseRoute,servicePatternId:journey.servicePatternId,directionId:journey.directionId,getRoute});
  const segmentTypeMap=new Map((resolved.pattern.segmentTrainTypeContexts||[]).map(item=>[item.routeId,item.trainTypeId]));
  const trainTypeContexts=(resolved.route.segments||[{id:resolved.route.id,fromStation:0,toStation:resolved.route.stations.length-1}]).map(segment=>({
    routeId:segment.id,fromStation:segment.fromStation??0,toStation:segment.toStation??resolved.route.stations.length-1,trainTypeId:segmentTypeMap.get(segment.id)||journey.trainTypeId,
    trainType:trainTypeFor(segmentTypeMap.get(segment.id)||journey.trainTypeId)
  }));
  const route={...resolved.route,serviceJourney:{...journey},trainTypeContexts};
  return{...resolved,route,journey:{...journey},journeyId:journey.id,trainTypeContexts};
}
