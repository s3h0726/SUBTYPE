#!/usr/bin/env node
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),json=file=>JSON.parse(read(file));
const context={window:{},console};context.globalThis=context;vm.createContext(context);vm.runInContext(read('js/line-workspace-data.js'),context);
const routes=context.window.TRT_EMBEDDED_LINE_WORKSPACES.routes||[],routeMap=new Map(routes.map(route=>[route.id,route]));
const catalog=json('data/tokyo-service-patterns.json');
catalog.branches=catalog.branches.map(branch=>({...branch,geometryData:json(branch.geometrySource)}));
context.TRT_TOKYO_SERVICE_PATTERNS=catalog;
context.TRT_RAIL_SYSTEM={throughServices:json('data/through-services.json').services||[]};
const resolverSource=read('js/service-route-resolver.js').replace(/^export\s+/gm,'')+'\n;globalThis.__resolver={resolveServiceSelection,servicePatternsForRoute,buildThroughServiceRoute};';
vm.runInContext(resolverSource,context,{filename:'service-route-resolver.js'});
const {resolveServiceSelection,servicePatternsForRoute}=context.__resolver,getRoute=id=>routeMap.get(id),errors=[];
const assert=(condition,message)=>{if(!condition)errors.push(message)};

const marunouchiMain=getRoute('line-28002'),branchRoute=getRoute('line-28002-honancho-branch');
assert(marunouchiMain.stations.length===25,'Marunouchi main line must end at Ogikubo with 25 stations');
assert(marunouchiMain.stations.at(-1).stationMasterId==='station-mlit-003575','Marunouchi main terminal is not Ogikubo');
assert(branchRoute?.dataKind==='branchRoute','Honancho branch is not an independent canonical route');
assert(branchRoute?.stations.length===4,'Honancho branch station count is not 4');
assert(branchRoute?.directedSegments.length===3,'Honancho branch geometry segment count is not 3');
assert(branchRoute?.geometry.length===57,'Honancho branch must retain the 57-point OSM alignment');
assert(branchRoute?.stations[0].stationCode==='M06'&&branchRoute?.stations.at(-1).stationCode==='Mb03','Honancho branch station context codes are wrong');

const fukutoshin=getRoute('line-28010'),express=resolveServiceSelection({baseRoute:fukutoshin,servicePatternId:'fukutoshin-express-wakoshi-shibuya',getRoute});
assert(fukutoshin.stations.length===16,'Fukutoshin station count is not 16');
assert(fukutoshin.stations[0].stationCode==='F-01'&&fukutoshin.stations.at(-1).stationCode==='F-16','Fukutoshin station numbering was not applied');
assert(fukutoshin.stations[0].distanceKm===0&&fukutoshin.stations.at(-1).distanceKm===20.2,'Fukutoshin distance metadata was not applied');
assert(fukutoshin.stations[8].transfers.some(transfer=>transfer.lineId==='line-11302'&&transfer.stationCode==='JY13'),'Ikebukuro transfer metadata is missing');
assert(express.route.stations.length===16,'Fukutoshin express lost physical stations');
assert(express.service.stops.length===6,'Fukutoshin express stop count is not 6');
assert(express.service.stops[0]==='station-mlit-003123'&&express.service.stops.at(-1)==='station-mlit-003922','Fukutoshin express endpoints are wrong');
assert(express.route.geometry.length===fukutoshin.geometry.length,'Fukutoshin express must retain the complete physical geometry');
const commuterExpress=resolveServiceSelection({baseRoute:fukutoshin,servicePatternId:'fukutoshin-commuter-express-wakoshi-shibuya',getRoute});
assert(commuterExpress.service.stops.length===10,'Fukutoshin commuter express stop count is not 10');
assert(!commuterExpress.service.stops.includes('station-mlit-003471')&&commuterExpress.service.stops.includes('station-1130206'),'Fukutoshin commuter express stop pattern is wrong');

const through=resolveServiceSelection({baseRoute:fukutoshin,servicePatternId:'fukutoshin-tokyu-minatomirai-forward',getRoute});
const operatorIds=new Set(through.route.segments.map(segment=>segment.operatorId));
assert(through.route.dataKind==='throughService','Fukutoshin/Minatomirai pattern did not resolve as a through service');
assert(operatorIds.size>=3,'Fukutoshin/Minatomirai operator contexts were not preserved');
assert(through.route.stations.at(-1).stationMasterId==='station-mlit-004704','Fukutoshin/Minatomirai destination is wrong');
assert(through.destinationStationId==='station-mlit-004704','Resolved destination metadata is wrong');
assert(servicePatternsForRoute('line-28010').length===11,'Fukutoshin setup must expose three internal and eight directional through patterns');
assert(!servicePatternsForRoute('line-28010').some(pattern=>pattern.id==='fukutoshin-s-train-metro-section'),'Metadata-only S-TRAIN pattern must not be offered as a standalone route');

const snapshot=JSON.stringify(routes);
for(const spec of context.TRT_RAIL_SYSTEM.throughServices){
  for(const direction of spec.directionVariants?['forward','reverse']:['forward']){
    try{
      const resolved=context.__resolver.buildThroughServiceRoute(spec,getRoute,direction);
      assert(resolved.stations.length>1,`${spec.id}/${direction}: missing resolved stations`);
      assert(resolved.selectedDirectionId===direction,`${spec.id}/${direction}: direction context was lost`);
      for(const segment of resolved.segments)assert(segment.fromStation>=0&&segment.toStation<resolved.stations.length,`${spec.id}/${direction}: invalid context range`);
    }catch(error){assert(false,`${spec.id}/${direction}: ${error.message}`)}
  }
}
assert(catalog.metroLineInventory?.length===9,'Tokyo Metro inventory must contain all nine lines');
assert(catalog.metroLineInventory.filter(item=>item.status==='NONE').length===2,'Ginza and Marunouchi must be the two no-through lines');
for(const lineId of ['line-26009','line-29003']){
  const route=getRoute(lineId);assert(route?.geometryReady===true,`${lineId}: Shin-yokohama extension geometry is not ready`);
  assert(route?.missingSegments?.length===0,`${lineId}: Shin-yokohama extension has missing geometry segments`);
}
for(const pattern of (catalog.servicePatterns||[]).filter(item=>item.throughServiceId&&(!item.status||item.status==='active'))){
  try{
    const resolved=resolveServiceSelection({baseRoute:getRoute(pattern.baseRouteId),servicePatternId:pattern.id,getRoute});
    assert(resolved.route.dataKind==='throughService',`${pattern.id}: did not resolve as through service`);
    assert(resolved.direction==='forward',`${pattern.id}: directional route would be reversed twice by PLAY`);
    assert(resolved.travelDirectionId===pattern.directionId,`${pattern.id}: travel direction metadata mismatch`);
    assert(resolved.route.stations[0].id===pattern.originStationId&&resolved.route.stations.at(-1).id===pattern.destinationStationId,`${pattern.id}: endpoints do not match pattern`);
  }catch(error){assert(false,`${pattern.id}: ${error.message}`)}
}
assert(JSON.stringify(routes)===snapshot,'Through-service resolution mutated canonical routes');
for(const patternId of ['namboku-saitama-tokyu-sotetsu-ebina-forward','namboku-saitama-tokyu-sotetsu-ebina-reverse','fukutoshin-tokyu-sotetsu-shonandai-forward','fukutoshin-tokyu-sotetsu-shonandai-reverse']){
  const pattern=catalog.servicePatterns.find(item=>item.id===patternId),resolved=resolveServiceSelection({baseRoute:getRoute(pattern.baseRouteId),servicePatternId:patternId,getRoute});
  assert(resolved.route.segments.some(segment=>segment.id==='line-26009')&&resolved.route.segments.some(segment=>segment.id==='line-29003'),`${patternId}: Shin-yokohama lines are not in the resolved route`);
  assert(new Set(resolved.route.segments.map(segment=>segment.operatorId)).size>=3,`${patternId}: operator boundary contexts are incomplete`);
}
const invalid={id:'disconnected-test',routeIds:['line-28010','line-99310']};
let rejected=false;try{context.__resolver.buildThroughServiceRoute(invalid,getRoute)}catch(error){rejected=/disconnected station boundary/.test(error.message)}
assert(rejected,'Disconnected through-service stations must be rejected');
const validSpec=context.TRT_RAIL_SYSTEM.throughServices.find(item=>item.id==='fukutoshin-tokyu-minatomirai');
rejected=false;try{context.__resolver.buildThroughServiceRoute(validSpec,id=>{const route=getRoute(id);if(id!=='line-26001')return route;const copy=JSON.parse(JSON.stringify(route));copy.geometry=copy.geometry.map(point=>[point[0]+.01,point[1]]);return copy})}catch(error){rejected=/geometry boundary gap/.test(error.message)}
assert(rejected,'Through-service geometry gaps must not create synthetic connectors');
const summary={status:errors.length?'FAIL':'PASS',marunouchi:{mainStations:marunouchiMain.stations.length,branchStations:branchRoute?.stations.length,branchGeometryPoints:branchRoute?.geometry.length},fukutoshin:{physicalStations:express.route.stations.length,expressTypingStops:express.service.stops.length,commuterExpressTypingStops:commuterExpress.service.stops.length,numbering:[fukutoshin.stations[0].stationCode,fukutoshin.stations.at(-1).stationCode]},tokyoMetro:{lines:catalog.metroLineInventory?.length||0,throughServices:context.TRT_RAIL_SYSTEM.throughServices.length,directionalPatterns:(catalog.servicePatterns||[]).filter(item=>item.throughServiceId&&(!item.status||item.status==='active')).length},through:{stations:through.route.stations.length,operators:[...operatorIds]},errors};
console.log(JSON.stringify(summary,null,2));if(errors.length)process.exitCode=1;
