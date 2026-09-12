#!/usr/bin/env node
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),json=file=>JSON.parse(read(file));
const catalog=json('data/tokyo-service-patterns.json'),through=json('data/through-services.json').services||[],context={window:{}};vm.createContext(context);vm.runInContext(read('js/line-workspace-data.js'),context);
const routes=context.window.TRT_EMBEDDED_LINE_WORKSPACES.routes||[],routeMap=new Map(routes.map(route=>[route.id,route])),trainTypes=new Set((catalog.trainTypes||[]).map(item=>item.id)),branches=new Map((catalog.branches||[]).map(item=>[item.id,item])),throughMap=new Map(through.map(item=>[item.id,item])),errors=[];
const stationId=station=>String(station.stationMasterId||station.sourceStationId||station.id),routeStations=route=>new Map((route?.stations||[]).map((station,index)=>[stationId(station),index]));
for(const branch of branches.values()){
  const parent=routeMap.get(branch.parentLineId),branchRoute=routeMap.get(branch.legacyRouteId||branch.routeId),stations=routeStations(branchRoute);if(!parent)errors.push(`${branch.id}: parent route missing`);if(!branchRoute)errors.push(`${branch.id}: geometry source route missing`);
  if(branch.stationSequence?.[0]!==branch.junctionStationId)errors.push(`${branch.id}: junction must be first station`);
  for(const id of branch.stationSequence||[])if(!stations.has(String(id)))errors.push(`${branch.id}: station missing ${id}`);
  const geometry=json(branch.geometrySource);if(geometry.geometryStatus!=='ready'||geometry.validation?.endpointVerified!==true)errors.push(`${branch.id}: geometry is not endpoint verified`);
  if(geometry.directedSegments?.length!==(branch.stationSequence?.length||0)-1)errors.push(`${branch.id}: geometry segment count mismatch`);
  if((geometry.directedSegments||[]).some(segment=>segment.geometry.length<3))errors.push(`${branch.id}: suspicious straight segment`)
}
for(const pattern of catalog.servicePatterns||[]){
  const base=routeMap.get(pattern.baseRouteId),branch=pattern.branchId?branches.get(pattern.branchId):null,spec=pattern.throughServiceId?throughMap.get(pattern.throughServiceId):null;
  if(!base)errors.push(`${pattern.id}: base route missing`);if(!trainTypes.has(pattern.trainTypeId))errors.push(`${pattern.id}: train type missing`);if(pattern.branchId&&!branch)errors.push(`${pattern.id}: branch missing`);if(pattern.throughServiceId&&!spec)errors.push(`${pattern.id}: through service missing`);
  const canonicalIds=pattern.stationSequence?.length?pattern.stationSequence.map(String):branch?branch.stationSequence.map(String):[...routeStations(base).keys()],ids=!spec&&pattern.directionId==='reverse'&&!pattern.stationSequence?.length?canonicalIds.slice().reverse():canonicalIds,indices=new Map(ids.map((id,index)=>[id,index])),stops=(pattern.stopStationIds||ids).map(String);
  for(const id of stops)if(!indices.has(id)&&!spec)errors.push(`${pattern.id}: stop outside route ${id}`);
  if(!spec&&stops.some((id,index)=>index&&indices.get(id)<=indices.get(stops[index-1])))errors.push(`${pattern.id}: stop order is not forward`);
  if(!spec&&pattern.originStationId!==stops[0])errors.push(`${pattern.id}: origin is not first stop`);if(!spec&&pattern.destinationStationId!==stops.at(-1))errors.push(`${pattern.id}: destination is not last stop`);
  if(!pattern.sources?.some(source=>source.type==='official'&&/^https:\/\//.test(source.url||'')))errors.push(`${pattern.id}: official source missing`)
}
const resolverSource=read('js/service-route-resolver.js'),gameSource=read('js/game.js');if(/\.geometry\.reverse\s*\(/.test(resolverSource+gameSource))errors.push('mutable geometry.reverse() found');
const summary={status:errors.length?'FAIL':'PASS',physicalLines:new Set(routes.map(route=>route.id)).size,branches:branches.size,servicePatterns:catalog.servicePatterns?.length||0,trainTypes:trainTypes.size,destinations:new Set((catalog.servicePatterns||[]).map(item=>item.destinationStationId)).size,throughServices:new Set((catalog.servicePatterns||[]).map(item=>item.throughServiceId).filter(Boolean)).size,errors};console.log(JSON.stringify(summary,null,2));if(errors.length)process.exitCode=1;
