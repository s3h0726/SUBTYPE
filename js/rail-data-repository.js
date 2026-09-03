const clean=value=>String(value??'').normalize('NFC').trim();

export function resolveProjectAsset(relativePath){
  if(!relativePath)return null;
  try{return new URL(clean(relativePath).replace(/^\/+/,''),document.baseURI).href}catch{return null}
}

class Repository{
  constructor(){this.reset()}
  reset(){this.operators=new Map;this.lines=new Map;this.stations=new Map;this.routes=new Map;this.assets={operators:{},lines:{}}}
  configure({operators=[],lines=[],stations=[],assets={}}={}){
    this.reset();this.assets={operators:assets.operators||{},lines:assets.lines||{}};
    for(const operator of operators){const names=operator.names||operator.operator||{};this.operators.set(operator.id,{...operator,id:operator.id,names:{ja:clean(names.ja),ko:clean(names.ko),en:clean(names.en)}})}
    for(const station of stations)this.registerStation(station);
    for(const route of lines)this.registerRoute(route);
    return this
  }
  registerStation(station){
    const id=clean(station?.stationMasterId||station?.sourceStationId||station?.internalId||station?.id);if(!id)return null;
    const existing=this.stations.get(id),names=station.names||{ja:station.ja,kana:station.kana,ko:station.ko,en:station.romaji||station.en};
    const rawLat=station.latitude??station.coordinates?.lat,rawLng=station.longitude??station.coordinates?.lng,record=existing||{id,type:station.type||'rail_station',names:{ja:clean(names.ja),kana:clean(names.kana),ko:clean(names.ko),en:clean(names.en)},coordinates:{lat:rawLat===null||rawLat===undefined?null:Number(rawLat),lng:rawLng===null||rawLng===undefined?null:Number(rawLng)}};
    if(!existing)this.stations.set(id,record);return record
  }
  registerRoute(route){
    if(!route?.id)return route;const operatorNames=route.operator?.names||route.operator||{},lineNames=route.line?.names||route.line||{};
    if(!this.operators.has(route.operatorId))this.operators.set(route.operatorId,{id:route.operatorId,names:{ja:clean(operatorNames.ja),ko:clean(operatorNames.ko),en:clean(operatorNames.en)}});
    this.lines.set(route.id,{id:route.id,operatorId:route.operatorId,names:{ja:clean(lineNames.ja),kana:clean(lineNames.kana),ko:clean(lineNames.ko),en:clean(lineNames.en)},color:route.lineColor||route.color,code:route.code||'',workspace:route.workspace});
    for(const station of route.stations||[])this.registerStation(station);this.routes.set(route.id,route);return route
  }
  getOperator(id){return this.operators.get(id)||null}
  getLine(id){return this.lines.get(id)||null}
  getStation(id){return this.stations.get(id)||null}
  getRoute(id){return this.routes.get(id)||null}
  getLineStations(id){return this.routes.get(id)?.stations||[]}
  getOperatorLogoAsset(id){const entry=this.assets.operators?.[id];if(!entry?.asset)return null;const operator=this.getOperator(id);return{asset:resolveProjectAsset(entry.asset),label:operator?.names?.en||operator?.names?.ja||id,canonicalFile:entry.file,version:entry.version}}
  getLineSymbolAsset(id){const entry=this.assets.lines?.[id];if(!entry?.asset)return null;return{asset:resolveProjectAsset(entry.asset),canonicalFile:entry.file,version:entry.version}}
  resolveRoute(route){
    if(!route)return route;this.registerRoute(route);const operator=this.getOperator(route.operatorId),line=this.getLine(route.id),operatorAsset=this.getOperatorLogoAsset(route.operatorId),symbolAsset=this.getLineSymbolAsset(route.id);
    const stations=(route.stations||[]).map(station=>{const canonical=this.registerStation(station);return canonical?{...station,ja:canonical.names.ja,kana:canonical.names.kana,ko:canonical.names.ko,romaji:canonical.names.en}:station});
    const resolved={...route,operator:operator?.names||route.operator,line:line?.names||route.line,operatorAsset,symbolAsset,stations};this.routes.set(route.id,resolved);return resolved
  }
}

export const railDataRepository=new Repository();
