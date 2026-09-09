export const FEATURE_FLAGS=Object.freeze({
  korea:false,
  visibleJapanRegion:'tokyo-area'
});

export const isCountryEnabled=countryId=>countryId!=='kr'||FEATURE_FLAGS.korea;

export function isRouteVisible(route){
  if(!isCountryEnabled(route.countryId||'jp'))return false;
  if(route.countryId==='kr'||FEATURE_FLAGS.visibleJapanRegion!=='tokyo-area')return true;
  const scope=globalThis.TRT_TOKYO_AREA;
  if(!scope)return false;
  if(route.category==='custom')return route.stations?.length>=2&&route.stations.every(station=>scope.stationIds.includes(station.stationMasterId||station.id));
  return scope.routeIds.includes(route.id);
}
