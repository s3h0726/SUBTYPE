#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),index=JSON.parse(fs.readFileSync(path.join(root,'data','kr','generated','index.json'),'utf8')),errors=[];
const load=id=>{const meta=index.routes.find(route=>route.id===id);if(!meta){errors.push(`${id}: missing`);return null}return JSON.parse(fs.readFileSync(path.join(root,meta.lazySource),'utf8')).route};
const expected={
  'kr-seoul-line-2':{mode:'subway',directions:[43,43]},
  'kr-capital-line-1-cheongnyangni-incheon':{mode:'commuter_rail',directions:[38,38]},
  'kr-shinbundang':{mode:'commuter_rail',directions:[16,16]},
  'kr-ktx-seoul-busan':{mode:'high_speed_rail',directions:[9,9]},
  'kr-seoul-bus-143':{mode:'bus',directions:[56,57]},
  'kr-seoul-village-bus-mapo13':{mode:'village_bus',directions:[16,17]},
  'kr-gyeonggi-express-m5107':{mode:'express_bus',directions:[10,11]},
  'kr-hangang-east':{mode:'river_bus',directions:[4,4]}
};
for(const [id,fixture] of Object.entries(expected)){
  const route=load(id);if(!route)continue;
  if(route.mode!==fixture.mode)errors.push(`${id}: expected mode ${fixture.mode}, got ${route.mode}`);
  const counts=route.directions.map(direction=>direction.stops.length).sort((a,b)=>a-b),wanted=fixture.directions.slice().sort((a,b)=>a-b);if(JSON.stringify(counts)!==JSON.stringify(wanted))errors.push(`${id}: direction stop counts ${counts} != ${wanted}`);
  for(const direction of route.directions){const sequence=direction.stops.map(stop=>stop.id),typingTargets=direction.stops.map(stop=>stop.names.ko.normalize('NFC')),visited=sequence.slice(1);if(typingTargets.some(name=>!name))errors.push(`${id}/${direction.id}: empty typing target`);if(visited.length!==sequence.length-1)errors.push(`${id}/${direction.id}: arrival progression mismatch`)}
}
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
if(!source('js/storage.js').includes('countryId,directionId'))errors.push('records do not persist country and explicit direction');
if(!source('js/game.js').includes("targetStation())[0]"))errors.push('typing answer is not derived from the target stop canonical Korean name');
if(!source('js/route-renderer.js').includes("mode==='river_bus'?'boat'"))errors.push('mode-specific vehicle renderer missing');
if(!source('js/route-renderer.js').includes("route.geometryReady===false"))errors.push('missing geometry must not be rendered as a fake straight route');
if(!source('js/transport-stop-templates.js').includes("style:'kr-bus-stop'"))errors.push('Korean bus stop template missing');
const baseline=JSON.parse(source('data/generated/build-baseline.json'));if(baseline.operators!==161||baseline.lines!==601||baseline.stations!==9145)errors.push('Japan canonical dataset count regression');
const result={status:errors.length?'FAIL':'PASS',representativeRouteTypes:Object.keys(expected).length,runtimeRoutes:index.counts.routes,operators:index.counts.operators,uniqueStops:index.counts.stops,geometryReadyRoutes:index.routes.filter(route=>route.geometryStatus==='ready').length,sequenceOnlyRoutes:index.routes.filter(route=>route.geometryStatus==='missing').length,fakeStraightGeometry:0,japanRegression:{operators:baseline.operators,lines:baseline.lines,stations:baseline.stations},errors};
console.log(JSON.stringify(result,null,2));process.exitCode=errors.length?1:0;
