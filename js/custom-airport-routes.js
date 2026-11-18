// Explicit virtual airport links for the CUSTOM route editor.
// Never enter these links in the physical railway shortest-path graph.
const customAirportStationKey=station=>String(station?.twTransferKey||station?.stationMasterId||station?.sourceStationId||station?.id||'');
export function customAirportOptions(current,countryId,routes,airports){
 if(!airports||!current||!Array.isArray(routes))return[];
 const key=customAirportStationKey(current),departures=[];
 for(const route of routes){
  if(route.countryId!==countryId)continue;
  const source=(route.stations||[]).find(station=>customAirportStationKey(station)===key);
  if(!source)continue;
  for(const airport of airports.airports||[]){
   if(airport.countryId!==countryId)continue;
   if(airports.matchesStation(source,route,airport)&&!departures.some(item=>item.code===airport.code))departures.push(airport);
  }
 }
 if(!departures.length)return[];
 const options=[],seen=new Set();
 for(const origin of departures)for(const destination of airports.airports||[]){
  // The current editor has only the selected country's verified rail network loaded.
  if(destination.countryId!==countryId)continue;
  for(const portal of destination.portals||[])for(const route of routes){
   if(route.countryId!==countryId||!airports.candidate(route,destination,portal.id))continue;
   const index=airports.findStation(route,destination,portal.id);
   if(index<0)continue;
   const station=route.stations[index],targetKey=customAirportStationKey(station);
   if(!targetKey||targetKey===key)continue;
   const token=origin.code+':'+destination.code+':'+portal.id+':'+targetKey;
   if(seen.has(token))continue;
   seen.add(token);
   options.push({id:token,fromCode:origin.code,toCode:destination.code,portalId:portal.id,
    fromName:origin.name,toName:destination.name,portalLabel:portal.label,
    kind:origin.code===destination.code?'terminal-transfer':'virtual-flight',
    targetStationKey:targetKey,targetStation:station,sourceRouteId:route.id});
  }
 }
 return options;
}
export function customAirportTransferValid(previous,arrival,transfer,countryId,routes,airports){
 if(!transfer||!arrival||!previous||!airports)return false;
 const options=customAirportOptions(previous,countryId,routes,airports);
 return options.some(item=>item.fromCode===transfer.fromCode&&item.toCode===transfer.toCode&&
  item.portalId===transfer.portalId&&item.kind===transfer.kind&&
  item.targetStationKey===customAirportStationKey(arrival));
}
