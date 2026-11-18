// Verified physical railway stations + explicitly chosen virtual airport links.
// A flight is NEVER a railway edge; unresolved foreign portals are only UI options.
export const customAirportStationKey=station=>String(station?.twTransferKey||station?.stationMasterId||station?.sourceStationId||station?.id||'');
const inRailRoute=route=>route&&Array.isArray(route.stations)&&route.stations.length>=2&&route.category!=='custom'&&route.playable!==false&&route.visibility!=='internal'&&
 !['bus','village_bus','express_bus','brt','river_bus','ferry'].includes(route.mode);
export function customAirportOptions(current,countryId,routes,airports,{allowForeign=false}={}){
 if(!airports||!current||!Array.isArray(routes))return[];
 const key=customAirportStationKey(current),departures=[];
 for(const route of routes){
  if(!inRailRoute(route)||route.countryId!==countryId)continue;
  const source=route.stations.find(station=>customAirportStationKey(station)===key);
  if(!source)continue;
  for(const airport of airports.airports||[])if(airport.countryId===countryId&&
   airports.matchesStation(source,route,airport)&&!departures.some(item=>item.code===airport.code))departures.push(airport);
 }
 if(!departures.length)return[];
 const options=[],seen=new Set();
 for(const origin of departures)for(const destination of airports.airports||[]){
  for(const portal of destination.portals||[]){
   let found=false;
   for(const route of routes){
    if(!inRailRoute(route)||route.countryId!==destination.countryId||!airports.candidate(route,destination,portal.id))continue;
    const index=airports.findStation(route,destination,portal.id);
    if(index<0)continue;
    const station=route.stations[index],targetKey=customAirportStationKey(station);
    if(!targetKey||(destination.countryId===countryId&&targetKey===key))continue;
    const token=origin.code+':'+destination.code+':'+portal.id+':'+targetKey;
    if(seen.has(token))continue;
    seen.add(token);found=true;
    options.push({id:token,fromCode:origin.code,toCode:destination.code,portalId:portal.id,
     fromCountryId:origin.countryId,toCountryId:destination.countryId,
     fromName:origin.name,toName:destination.name,portalLabel:portal.label,
     kind:origin.code===destination.code?'terminal-transfer':'virtual-flight',
     targetStationKey:targetKey,targetStation:station,sourceRouteId:route.id,loadRequired:false});
   }
   // A foreign destination is selectable only as a request to load and verify its railway station.
   if(allowForeign&&destination.countryId!==countryId&&!found){
    const token=origin.code+':'+destination.code+':'+portal.id+':pending';
    if(seen.has(token))continue;seen.add(token);
    options.push({id:token,fromCode:origin.code,toCode:destination.code,portalId:portal.id,
     fromCountryId:origin.countryId,toCountryId:destination.countryId,
     fromName:origin.name,toName:destination.name,portalLabel:portal.label,
     kind:'virtual-flight',targetStationKey:null,targetStation:null,sourceRouteId:null,loadRequired:true});
   }
  }
 }
 return options;
}
// Saved itineraries are checked against the same terminal names, country and geography.
// When the foreign network is cached, require an exact registered rail station there too.
export function customAirportTransferValid(previous,arrival,transfer,countryId,routes,airports){
 if(!transfer||!arrival||!previous||!airports)return false;
 const fromCountry=previous.countryId||transfer.fromCountryId||countryId;
 const toCountry=arrival.countryId||transfer.toCountryId||countryId;
 if(transfer.fromCountryId&&transfer.fromCountryId!==fromCountry)return false;
 if(transfer.toCountryId&&transfer.toCountryId!==toCountry)return false;
 const origin=airports.byCode.get(transfer.fromCode),destination=airports.byCode.get(transfer.toCode);
 if(!origin||!destination||origin.countryId!==fromCountry||destination.countryId!==toCountry||
  transfer.kind!==(origin.code===destination.code?'terminal-transfer':'virtual-flight'))return false;
 if(!airports.coord(previous)||!airports.coord(arrival))return false;
 const fakeFrom={countryId:fromCountry,mode:'rail',line:{ko:'공항철도',en:'Airport railway'}};
 const fakeTo={countryId:toCountry,mode:'rail',line:{ko:'공항철도',en:'Airport railway'}};
 if(!airports.matchesStation(previous,fakeFrom,origin)||!airports.matchesPortal(arrival,fakeTo,destination,transfer.portalId))return false;
 // Do not make guessed or fabricated stations valid when a real route is available.
 const sourceRoutes=(routes||[]).filter(route=>route.countryId===fromCountry&&inRailRoute(route));
 const destRoutes=(routes||[]).filter(route=>route.countryId===toCountry&&inRailRoute(route));
 if(sourceRoutes.length&&!sourceRoutes.some(route=>route.stations.some(station=>
   customAirportStationKey(station)===customAirportStationKey(previous)&&airports.matchesStation(station,route,origin))))return false;
 if(destRoutes.length&&!destRoutes.some(route=>route.stations.some(station=>
   customAirportStationKey(station)===customAirportStationKey(arrival)&&airports.matchesPortal(station,route,destination,transfer.portalId))))return false;
 return true;
}
