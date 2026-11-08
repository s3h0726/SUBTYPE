// UK physical lines, operating patterns and shared railway geometry are distinct.
export const UK_CATEGORIES=[['all','전체'],['subway','지하철'],['commuter_rail','광역철도'],['light_rail','경전철'],['tram','트램'],['rail','내셔널 레일'],['custom','커스텀']];
let ukNameEdits={operators:{},lines:{},stations:{},services:{}},ukSharedStationEdits=new Map(),ukStationGroups=new Map(),ukGroupEdits=new Map();
export function configureUKNames(edits={},stationIndex=[]){
 ukNameEdits=edits;ukSharedStationEdits=new Map();
 ukStationGroups=new Map(stationIndex.map(s=>[s.id,s.nameGroup]));ukGroupEdits=new Map();
 for(const [line,stations]of Object.entries(edits.stations||{}).sort(([a],[b])=>a.localeCompare(b)))if(line.startsWith('uk-'))for(const[id,value]of Object.entries(stations))if(typeof value==='string'&&value.trim())ukSharedStationEdits.set(id,value.trim());
 for(const[id,value]of ukSharedStationEdits)if(ukStationGroups.has(id))ukGroupEdits.set(ukStationGroups.get(id),value);
}
export function ukPresentation(route){
 if(route?.countryId!=='uk')return route;
 const update=station=>{const edited=ukGroupEdits.get(ukStationGroups.get(station.id))||ukSharedStationEdits.get(station.id)||ukSharedStationEdits.get(station.en||station.ja);return{...station,ko:edited||station.ko,kana:'',ja:station.en||station.romaji||station.ja,romaji:station.en||station.romaji||station.ja,routeSpecificStationName:true,names:undefined,canonicalStationNames:undefined}};
 route.stationCatalog=(route.stationCatalog||route.stations||[]).map(update);const byId=new Map(route.stationCatalog.map(s=>[s.id,s]));
 route.stations=(route.stations||[]).map(s=>({...s,...byId.get(s.id)}));
 route.operator={...route.operator,ko:ukNameEdits.operators?.[route.operatorId]||route.operator.ko};route.line={...route.line,...ukNameEdits.lines?.[route.id]};
 route.services=(route.services||[]).map(s=>({...s,nameKo:ukNameEdits.services?.[s.id]||s.nameKo}));
 return route;
}
export function ukPatternRoute(owner,pattern){
 const byId=new Map(owner.stationCatalog.map(s=>[s.id,s])),geometry=[],directedSegments=[],stations=[];
 for(let i=0;i<pattern.segmentIds.length;i++){
  const id=pattern.segmentIds[i],segment=owner.ukGeometry?.[id];if(!segment||!segment.stationPairs.includes(pattern.stationIds[i]+'::'+pattern.stationIds[i+1]))throw Error('UK_GEOMETRY_IDENTITY:'+id);
  const start=geometry.length?geometry.length-1:0,points=segment.geometry;
  if(geometry.length&&JSON.stringify(geometry.at(-1))!==JSON.stringify(points[0]))throw Error('UK_DISCONNECTED_SEGMENT:'+id);
  geometry.push(...(geometry.length?points.slice(1):points));
  const station=byId.get(pattern.stationIds[i]);if(!station)throw Error('UK_UNKNOWN_STATION');
  stations.push({...station,latitude:points[0][0],longitude:points[0][1],geometryIndex:start});
  directedSegments.push({fromStationId:pattern.stationIds[i],toStationId:pattern.stationIds[i+1],geometry:points,source:{type:'openstreetmap',relationId:pattern.sourceRelationId,verified:true}});
 }
 const last=byId.get(pattern.stationIds.at(-1));if(!last||!geometry.length)throw Error('UK_EMPTY_PATTERN');stations.push({...last,latitude:geometry.at(-1)[0],longitude:geometry.at(-1)[1],geometryIndex:geometry.length-1});
 const service={id:pattern.id,nameKo:ukNameEdits.services?.[pattern.id]||pattern.nameKo,nameJa:pattern.nameEn,nameEn:pattern.nameEn,stops:stations.map(s=>s.id)};
 return{...owner,lazy:false,loop:false,geometry,stations,directedSegments,selectedServiceId:pattern.id,services:[service],serviceJourney:{id:pattern.id},operatingPatternName:service.nameKo};
}
export function ukOperatingChoices(route){
 if(!route?.playable||!route.geometryReady||route.lazy)return[];
 ukPresentation(route);const stations=new Map(route.stationCatalog.map(s=>[s.id,s]));
 return(route.patterns||[]).map(p=>({kind:'uk',id:p.id,patternId:p.familyId||p.id,legacyServiceId:p.id,originId:p.stationIds[0],destinationId:p.stationIds.at(-1),originNames:stations.get(p.stationIds[0]),destinationNames:stations.get(p.stationIds.at(-1)),patternName:{ko:ukNameEdits.services?.[p.id]||(route.id==='uk-glasgow-subway'?p.nameKo:[stations.get(p.stationIds[0]).ko,stations.get(p.stationIds.at(-1)).ko].sort().join(' ↔ ')+(p.viaStationId?' · '+stations.get(p.viaStationId).ko+' 경유':'')),en:p.nameEn},direction:p.id,directionLabel:route.id==='uk-glasgow-subway'?p.nameKo:null}));
}
export function resolveUKChoice(choice,owner){
 const pattern=owner?.patterns?.find(p=>p.id===choice.id);if(!pattern||!owner.playable||!(pattern.validation?.officialSequence||pattern.validation?.reviewedRegionalSequence)||!pattern.validation?.trackContinuity)throw Error('UK_UNVERIFIED_PATTERN');
 const route=ukPatternRoute(ukPresentation(owner),pattern),service=route.services[0];
 return{route,service,direction:'forward',pattern:{id:pattern.id,names:{ko:service.nameKo,en:service.nameEn}},journey:{id:pattern.id,originStationId:route.stations[0].id,destinationStationId:route.stations.at(-1).id},destinationStationId:route.stations.at(-1).id};
}
export function ukFreeDriveRoutes(routes){return routes.filter(r=>!r.lazy&&r.countryId==='uk').flatMap(r=>(r.patterns||[]).map((p,i)=>({...ukPatternRoute(r,p),id:i?r.id+'--'+p.id:r.id,patterns:[],physicalLineId:r.id,oneWay:true})))}
