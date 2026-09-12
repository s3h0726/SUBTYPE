export const FEATURE_FLAGS=Object.freeze({
  korea:false,
  visibleJapanRegion:'all'
});

// Keep historical play records playable after a physical branch becomes an
// internal part of its passenger line. IDs remain stable in stored records;
// only their current display/playback parent changes.
const LEGACY_ROUTE_ALIASES=Object.freeze({'line-28002-honancho-branch':'line-28002'});
export const canonicalRouteId=routeId=>LEGACY_ROUTE_ALIASES[String(routeId||'')]||routeId;

export const isCountryEnabled=countryId=>countryId!=='kr'||FEATURE_FLAGS.korea;

export function isRouteVisible(route){
  // Physical branch workspaces can be required for geometry and legacy record
  // resolution without becoming an independent passenger-facing line.
  if(route.visibility==='internal'||route.playable===false)return false;
  if(!isCountryEnabled(route.countryId||'jp'))return false;
  if(route.countryId==='kr'||FEATURE_FLAGS.visibleJapanRegion!=='tokyo-area')return true;
  const scope=globalThis.TRT_TOKYO_AREA;
  if(!scope)return false;
  if(route.category==='custom')return route.stations?.length>=2&&route.stations.every(station=>scope.stationIds.includes(station.stationMasterId||station.id));
  return scope.routeIds.includes(route.id);
}
