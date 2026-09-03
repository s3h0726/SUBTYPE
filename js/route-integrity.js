const stationId=station=>String(station?.id||'');
const pointOf=station=>[Number(station?.latitude),Number(station?.longitude)];
const validPoint=point=>Array.isArray(point)&&point.length>=2&&point.every(Number.isFinite);
const rad=value=>value*Math.PI/180;
export const distanceKm=(a,b)=>{if(!validPoint(a)||!validPoint(b))return Infinity;const dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]),value=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(value),Math.sqrt(1-value))};
const cloneGeometry=geometry=>geometry.map(point=>[Number(point[0]),Number(point[1])]);

export function canonicalStations(route){
  if(!route||!Array.isArray(route.stations)||route.stations.length<2)throw new Error(`${route?.id||'route'}: station count must be at least 2`);
  return route.stations.map((station,index)=>{if(!stationId(station))throw new Error(`${route.id}: missing station id at order ${index+1}`);if(!validPoint(pointOf(station)))throw new Error(`${route.id}/${stationId(station)}: missing station coordinates`);return station});
}

function geometryIndex(source,station){
  if(Number.isInteger(station.geometryIndex)&&station.geometryIndex>=0&&station.geometryIndex<source.length)return station.geometryIndex;
  let best=-1,bestDistance=Infinity;const target=pointOf(station);source.forEach((point,index)=>{const value=distanceKm(target,point);if(value<bestDistance){best=index;bestDistance=value}});return best;
}

export function buildCanonicalSegmentMap(route,{endpointToleranceKm=1.2}={}){
  const stations=canonicalStations(route),source=Array.isArray(route.geometry)?cloneGeometry(route.geometry):[];
  if(source.length<2)throw new Error(`${route.id}: missing railway geometry`);
  const map=new Map,segments=[];
  for(let index=0;index<stations.length-1;index++){
    const from=stations[index],to=stations[index+1],fromId=stationId(from),toId=stationId(to),a=geometryIndex(source,from),b=geometryIndex(source,to);
    if(a<0||b<0||a===b)throw new Error(`${route.id}: missing railway segment ${fromId} -> ${toId}`);
    let geometry=a<b?source.slice(a,b+1):source.slice(b,a+1).reverse();
    const normal=distanceKm(geometry[0],pointOf(from))+distanceKm(geometry.at(-1),pointOf(to)),reversed=distanceKm(geometry.at(-1),pointOf(from))+distanceKm(geometry[0],pointOf(to));
    if(reversed<normal)geometry=geometry.slice().reverse();
    const fromErrorKm=distanceKm(geometry[0],pointOf(from)),toErrorKm=distanceKm(geometry.at(-1),pointOf(to)),segment={fromStationId:fromId,toStationId:toId,fromOrder:index+1,toOrder:index+2,geometry,fromErrorKm,toErrorKm,endpointMismatch:fromErrorKm>endpointToleranceKm||toErrorKm>endpointToleranceKm};
    const key=`${fromId}::${toId}`,existing=map.get(key);if(existing)map.set(key,Array.isArray(existing)?[...existing,segment]:[existing,segment]);else map.set(key,segment);segments.push(segment);
  }
  return{map,segments};
}

export function getDirectedSegment(segmentMap,fromId,toId){
  const value=entry=>Array.isArray(entry)?entry[0]:entry,forward=value(segmentMap.get(`${fromId}::${toId}`));if(forward)return{...forward,geometry:cloneGeometry(forward.geometry),reversed:false};
  const reverse=value(segmentMap.get(`${toId}::${fromId}`));if(reverse)return reverseSegment(reverse,fromId,toId);
  throw new Error(`Missing railway segment: ${fromId} -> ${toId}`);
}
function reverseSegment(segment,fromId=segment.toStationId,toId=segment.fromStationId){return{...segment,fromStationId:fromId,toStationId:toId,fromOrder:segment.toOrder,toOrder:segment.fromOrder,fromErrorKm:segment.toErrorKm,toErrorKm:segment.fromErrorKm,geometry:cloneGeometry(segment.geometry).reverse(),reversed:true}}

function mergeSegmentPath(segmentMap,fullRoute,fromIndex,toIndex){
  if(toIndex!==fromIndex+1)throw new Error(`Non-forward resolved route index: ${fromIndex} -> ${toIndex}`);
  return getDirectedSegment(segmentMap,stationId(fullRoute[fromIndex]),stationId(fullRoute[toIndex]));
}

function combineServiceSegment(segmentMap,fullRoute,fromIndex,toIndex){
  const fromStation=fullRoute[fromIndex],toStation=fullRoute[toIndex];if(fromIndex<0||toIndex<0||toIndex<=fromIndex)throw new Error(`Invalid service stop order: ${stationId(fromStation)} -> ${stationId(toStation)}`);
  const parts=[];for(let index=fromIndex;index<toIndex;index++)parts.push(mergeSegmentPath(segmentMap,fullRoute,index,index+1));
  const geometry=[];for(const part of parts){const points=cloneGeometry(part.geometry);if(geometry.length&&points.length&&geometry.at(-1)[0]===points[0][0]&&geometry.at(-1)[1]===points[0][1])points.shift();geometry.push(...points)}
  return{fromStationId:stationId(fromStation),toStationId:stationId(toStation),geometry,parts,serviceCombined:parts.length>1,endpointMismatch:parts.some(part=>part.endpointMismatch)};
}
function combineAlignedSegments(fullRoute,fullSegments,fromIndex,toIndex){const fromStation=fullRoute[fromIndex],toStation=fullRoute[toIndex],parts=fullSegments.slice(fromIndex,toIndex);if(!parts.length)throw new Error(`Missing railway segment: ${stationId(fromStation)} -> ${stationId(toStation)}`);const geometry=[];for(const part of parts){const points=cloneGeometry(part.geometry);if(geometry.length&&points.length&&geometry.at(-1)[0]===points[0][0]&&geometry.at(-1)[1]===points[0][1])points.shift();geometry.push(...points)}return{fromStationId:stationId(fromStation),toStationId:stationId(toStation),geometry,parts,serviceCombined:parts.length>1,endpointMismatch:parts.some(part=>part.endpointMismatch)}}

export function resolvePlayableRoute(route,{direction='forward',service=null}={}){
  if(route?.countryId==='kr'&&route.geometryStatus==='missing'){
    const canonical=(route.stations||[]).map((station,index)=>{if(!stationId(station))throw new Error(`${route.id}: missing stop id at order ${index+1}`);return{...station}}),resolved=direction==='reverse'?canonical.slice().reverse():canonical.slice(),requested=new Set(Array.isArray(service?.stops)?service.stops.map(String):[]),stations=service&&service.id!=='local'&&requested.size>=2?resolved.filter(station=>requested.has(stationId(station))):resolved;
    if(stations.length<2)throw new Error(`${route.id}: resolved route has fewer than 2 stops`);
    const segments=stations.slice(0,-1).map((station,index)=>({fromStationId:stationId(station),toStationId:stationId(stations[index+1]),geometry:[],sequenceOnly:true}));
    return{canonicalStations:canonical,stations,segments,geometry:[],canonicalSegments:segments,direction,serviceApplied:false,sequenceOnly:true,renderKey:`${route.id}::${direction}::sequence-only::${stations.map(stationId).join('>')}`}
  }
  const canonical=canonicalStations(route),{segments:canonicalSegments}=buildCanonicalSegmentMap(route),resolvedFull=direction==='reverse'?canonical.slice().reverse():canonical.slice(),resolvedFullSegments=direction==='reverse'?canonicalSegments.slice().reverse().map(segment=>reverseSegment(segment)):canonicalSegments.map(segment=>({...segment,geometry:cloneGeometry(segment.geometry),reversed:false}));
  const fullIds=new Set(canonical.map(stationId)),requestedStops=Array.isArray(service?.stops)?service.stops.map(String):[];
  for(const stopId of requestedStops)if(!fullIds.has(stopId))throw new Error(`${route.id}/${service.id}: service stop not found ${stopId}`);
  const applyStopPattern=!!service&&service.id!=='local'&&requestedStops.length>=2&&requestedStops.length<canonical.length;
  const stopIds=new Set(requestedStops),entries=resolvedFull.map((station,index)=>({station,index})),selectedEntries=applyStopPattern?entries.filter(entry=>stopIds.has(stationId(entry.station))):entries,stations=selectedEntries.map(entry=>entry.station);
  if(stations.length<2)throw new Error(`${route.id}: resolved route has fewer than 2 stations`);
  const segments=[];for(let index=0;index<stations.length-1;index++)segments.push(applyStopPattern?combineAlignedSegments(resolvedFull,resolvedFullSegments,selectedEntries[index].index,selectedEntries[index+1].index):resolvedFullSegments[index]);
  const geometry=[],resolvedStations=stations.map(station=>({...station}));segments.forEach((segment,index)=>{const points=cloneGeometry(segment.geometry);resolvedStations[index].geometryIndex=Math.max(0,geometry.length-1);if(geometry.length&&points.length&&geometry.at(-1)[0]===points[0][0]&&geometry.at(-1)[1]===points[0][1])points.shift();geometry.push(...points)});resolvedStations.at(-1).geometryIndex=Math.max(0,geometry.length-1);
  return{canonicalStations:canonical.slice(),stations:resolvedStations,segments,geometry,canonicalSegments,direction,serviceApplied:applyStopPattern,renderKey:`${route.id}::${direction}::${service?.id||'all'}::${resolvedStations.map(stationId).join('>')}`};
}

export function auditRouteIntegrity(route){
  const errors=[],warnings=[];let forward=null,reverse=null;try{forward=resolvePlayableRoute(route,{direction:'forward'});reverse=resolvePlayableRoute(route,{direction:'reverse'})}catch(error){errors.push(error.message)}
  const expected=route.stations?.map(stationId)||[],actualReverse=reverse?.stations.map(stationId)||[],reverseExpected=expected.slice().reverse();
  if(reverse&&JSON.stringify(actualReverse)!==JSON.stringify(reverseExpected))errors.push(`${route.id}: reverse station order mismatch`);
  const endpointMismatch=[...(forward?.segments||[]),...(reverse?.segments||[])].filter(segment=>segment.endpointMismatch);
  if(endpointMismatch.length)warnings.push(`${endpointMismatch.length} directed segment endpoint mismatch(es)`);
  return{routeId:route.id,stationCount:expected.length,forwardSegments:forward?.segments.length||0,reverseSegments:reverse?.segments.length||0,missingStations:0,missingSegments:errors.filter(value=>/segment|geometry/.test(value)).length,duplicateOrder:0,geometryEndpointMismatch:endpointMismatch.length,forwardOrder:forward?.stations.map(station=>({id:stationId(station),ja:station.ja,ko:station.ko,code:station.officialCode||''}))||[],reverseOrder:reverse?.stations.map(station=>({id:stationId(station),ja:station.ja,ko:station.ko,code:station.officialCode||''}))||[],errors,warnings,pass:errors.length===0};
}
