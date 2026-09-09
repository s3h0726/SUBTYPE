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
assert(express.route.stations.length===16,'Fukutoshin express lost physical stations');
assert(express.service.stops.length===6,'Fukutoshin express stop count is not 6');
assert(express.service.stops[0]==='station-mlit-003123'&&express.service.stops.at(-1)==='station-mlit-003922','Fukutoshin express endpoints are wrong');
assert(express.route.geometry.length===fukutoshin.geometry.length,'Fukutoshin express must retain the complete physical geometry');

const through=resolveServiceSelection({baseRoute:fukutoshin,servicePatternId:'fukutoshin-minatomirai-through-local',getRoute});
const operatorIds=new Set(through.route.segments.map(segment=>segment.operatorId));
assert(through.route.dataKind==='throughService','Fukutoshin/Minatomirai pattern did not resolve as a through service');
assert(operatorIds.size>=3,'Fukutoshin/Minatomirai operator contexts were not preserved');
assert(through.route.stations.at(-1).stationMasterId==='station-mlit-004704','Fukutoshin/Minatomirai destination is wrong');
assert(through.destinationStationId==='station-mlit-004704','Resolved destination metadata is wrong');
assert(servicePatternsForRoute('line-28010').length===3,'Fukutoshin setup must expose local, express, and through patterns');

const snapshot=JSON.stringify(routes);
for(const spec of context.TRT_RAIL_SYSTEM.throughServices){
  if(spec.id==='denentoshi-hanzomon-tobu'){
    let blocked=false;try{context.__resolver.buildThroughServiceRoute(spec,getRoute)}catch(error){blocked=/geometry boundary gap/.test(error.message)}
    assert(blocked,'Known Oshiage gap must remain blocked until verified geometry is repaired');
    assert(!servicePatternsForRoute('line-28008').some(pattern=>pattern.id==='hanzomon-denentoshi-tobu-through'),'Unresolved Oshiage gap must not be offered as playable');
    continue;
  }
  const resolved=context.__resolver.buildThroughServiceRoute(spec,getRoute);
  assert(resolved.stations.length>1,`${spec.id}: missing resolved stations`);
  for(const segment of resolved.segments)assert(segment.fromStation>=0&&segment.toStation<resolved.stations.length,`${spec.id}: invalid context range`);
}
assert(JSON.stringify(routes)===snapshot,'Through-service resolution mutated canonical routes');
const invalid={id:'disconnected-test',routeIds:['line-28010','line-99310']};
let rejected=false;try{context.__resolver.buildThroughServiceRoute(invalid,getRoute)}catch(error){rejected=/disconnected station boundary/.test(error.message)}
assert(rejected,'Disconnected through-service stations must be rejected');
const validSpec=context.TRT_RAIL_SYSTEM.throughServices[0];
rejected=false;try{context.__resolver.buildThroughServiceRoute(validSpec,id=>{const route=getRoute(id);if(id!=='line-26001')return route;const copy=JSON.parse(JSON.stringify(route));copy.geometry[0][0]+=.01;return copy})}catch(error){rejected=/geometry boundary gap/.test(error.message)}
assert(rejected,'Through-service geometry gaps must not create synthetic connectors');
const summary={status:errors.length?'FAIL':'PASS',marunouchi:{mainStations:marunouchiMain.stations.length,branchStations:branchRoute?.stations.length,branchGeometryPoints:branchRoute?.geometry.length},express:{physicalStations:express.route.stations.length,typingStops:express.service.stops.length},through:{stations:through.route.stations.length,operators:[...operatorIds]},errors};
console.log(JSON.stringify(summary,null,2));if(errors.length)process.exitCode=1;
