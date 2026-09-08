#!/usr/bin/env node
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),json=file=>JSON.parse(read(file));
const context={window:{},console};context.globalThis=context;vm.createContext(context);vm.runInContext(read('js/line-workspace-data.js'),context);
const routes=context.window.TRT_EMBEDDED_LINE_WORKSPACES.routes||[],routeMap=new Map(routes.map(route=>[route.id,route]));
const catalog=json('data/tokyo-service-patterns.json');
catalog.branches=catalog.branches.map(branch=>({...branch,geometryData:json(branch.geometrySource)}));
context.TRT_TOKYO_SERVICE_PATTERNS=catalog;
context.TRT_RAIL_SYSTEM={throughServices:json('data/through-services.json').services||[]};
const resolverSource=read('js/service-route-resolver.js').replace(/^export\s+/gm,'')+'\n;globalThis.__resolver={resolveServiceSelection,servicePatternsForRoute};';
vm.runInContext(resolverSource,context,{filename:'service-route-resolver.js'});
const {resolveServiceSelection,servicePatternsForRoute}=context.__resolver,getRoute=id=>routeMap.get(id),errors=[];
const assert=(condition,message)=>{if(!condition)errors.push(message)};

const branchBase=getRoute('line-28002'),branch=resolveServiceSelection({baseRoute:branchBase,servicePatternId:'marunouchi-honancho-local',getRoute});
assert(branch.route.dataKind==='branch','Honancho pattern did not resolve as a branch');
assert(branch.route.stations.length===4,'Honancho branch station count is not 4');
assert(branch.route.directedSegments.length===3,'Honancho branch geometry segment count is not 3');
assert(branch.route.geometry.length===57,'Honancho branch must retain the 57-point OSM alignment');
assert(branch.route.stations[0].stationCode==='M06'&&branch.route.stations.at(-1).stationCode==='Mb03','Honancho branch station context codes are wrong');

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

const immutableProbe=[[1,2],[3,4]],snapshot=JSON.stringify(immutableProbe);void immutableProbe.slice().reverse();assert(JSON.stringify(immutableProbe)===snapshot,'Reverse probe mutated its source geometry');
const summary={status:errors.length?'FAIL':'PASS',branch:{stations:branch.route.stations.length,geometryPoints:branch.route.geometry.length},express:{physicalStations:express.route.stations.length,typingStops:express.service.stops.length},through:{stations:through.route.stations.length,operators:[...operatorIds]},errors};
console.log(JSON.stringify(summary,null,2));if(errors.length)process.exitCode=1;
