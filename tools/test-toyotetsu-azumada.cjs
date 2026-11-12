#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const main=json('data/generated/routes/line-99521.json').route;
const national=json('data/nationwide/routes/line-99521.json').route;
const branch=json('data/generated/routes/line-toyotetsu-azumada-park-branch.json').route;
const nameSource=json('data/japan-route-station-names.json').routes;
const officialStops=[
 ['駅前','에키마에'],['駅前大通','에키마에오도리'],['新川','신카와'],['札木','후다기'],
 ['市役所前','시야쿠쇼마에'],['豊橋公園前','토요하시코엔마에'],['東八町','히가시핫초'],
 ['前畑','마에하타'],['東田坂上','아즈마다사카우에'],['東田','아즈마다'],
 ['競輪場前','케이린조마에'],['井原','이하라'],['赤岩口','아카이와구치']
];
assert.equal(main.id,'line-99521');
assert.equal(main.category,'tram');
assert.deepEqual(main.stations.map(s=>[s.ja,s.ko]),officialStops);
assert.deepEqual(national.stations.map(s=>[s.ja,s.ko]),officialStops);
assert.equal(main.stations[0].id,'station-1141301','Preserve existing Toyohashi transfer master ID');
assert.equal(main.stations[0].routeSpecificStationName,true,'Display official Ekimae rather than JR Toyohashi');
assert.deepEqual(main.stations.map(s=>s.stationCode),Array.from({length:13},(_,i)=>String(i+1).padStart(2,'0')));
assert.equal(main.directedSegments.length,12);
assert.equal(main.geometryReady,true);
assert.equal(main.geometry.length,49);
assert.equal(main.stations.at(-1).geometryIndex,main.geometry.length-1);
assert.equal(main.missingSegments.length,0);
assert(main.services.some(s=>s.id==='toyotetsu-azumada-akaiwaguchi-local'&&s.stops.length===13));
assert(main.services.some(s=>s.id==='toyotetsu-azumada-keirinjo-local'&&s.stops.length===11));
const relations=json('data/lines/toyohashitetsudo/toyohashitetsudoazumadahonsen/stations.json');
const mainGeo=json('data/lines/toyohashitetsudo/toyohashitetsudoazumadahonsen/geometry.json');
assert.equal(relations.length,13);
assert.equal(Object.keys(mainGeo).length,12);
assert(!Object.keys(mainGeo).some(k=>k.includes('station-9952202')),'Erroneous Akaiwaguchi–Park edge must be removed');
assert.equal(branch.visibility,'internal','Branch must not appear as duplicate card');
assert.deepEqual(branch.stations.map(s=>s.ja),['井原','運動公園前']);
assert.deepEqual(branch.stations.map(s=>s.stationCode),['12','14']);
assert.equal(branch.directedSegments.length,1);
assert.equal(branch.directedSegments[0].fromStationId,main.stations[11].id);
assert.equal(branch.stations[0].stationMasterId,main.stations[11].stationMasterId);
assert.equal(branch.geometryReady,true);
assert.deepEqual(branch.geometry[0],main.geometry[main.stations[11].geometryIndex],'Branch must begin at real Ihara junction');
const branchGeo=json('data/lines/toyohashitetsudo/toyohashitetsudoazumadaparkbranch/geometry.json');
assert.deepEqual(branchGeo['station-9952112::station-9952202'].geometry,branch.geometry);
assert.equal(nameSource['line-99521']['station-1141301'].ja,'駅前');
assert.equal(nameSource['line-toyotetsu-azumada-park-branch']['station-9952202'].ja,'運動公園前');
const service=json('data/through-services.json').services.find(s=>s.id==='toyotetsu-azumada-park-local');
assert(service,'Missing official park-bound through service');
assert.deepEqual(service.participatingLineIds,[main.id,branch.id]);
const browser=JSON.parse(read('js/rail-system-data.js').split('window.TRT_RAIL_SYSTEM=')[1].trim().replace(/;\s*$/,''));
assert.deepEqual(browser.throughServices.find(s=>s.id===service.id),service,'Stale live through-service registry');
const routes=new Map([[main.id,main],[branch.id,branch]]);
const context={console};context.globalThis=context;vm.createContext(context);
vm.runInContext(read('js/service-route-resolver.js').replace(/\bexport\s+/g,''),context);
for(const [direction,first,last] of [['forward','駅前','運動公園前'],['reverse','運動公園前','駅前']]){
 const r=context.buildThroughServiceRoute(service,id=>routes.get(id),direction),stations=r.stations;
 assert.deepEqual([stations[0].ja,stations.at(-1).ja],[first,last]);
 assert.equal(stations.length,13,'The park service has twelve shared stops plus park terminal');
 assert(!stations.some(s=>s.ja==='赤岩口'),'Park-bound service must not detour via Akaiwaguchi');
 assert.equal(new Set(stations.map(s=>s.stationMasterId)).size,13,'Shared Ihara junction must not be duplicated');
 assert(stations.every((s,i)=>Number.isInteger(s.geometryIndex)&&s.geometryIndex>=0&&s.geometryIndex<r.geometry.length&&(i===0||s.geometryIndex>stations[i-1].geometryIndex)));
 assert.equal(stations.at(-1).geometryIndex,r.geometry.length-1);
}
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
const cards=lite.routes.filter(x=>x.operatorId==='toyohashitetsudo');
assert.equal(cards.filter(x=>x.visibility!=='internal').length,2,'Only Atsumi and Azumada visible');
assert(lite.routes.find(x=>x.id===branch.id)?.lazySource.includes('line-toyotetsu-azumada-park-branch.json'));
assert(lite.routes.find(x=>x.id===main.id)?.lazySource.includes('data/generated/routes/line-99521.json'));
const html=read('index.html');
assert(html.includes('japan-lite-index.js?v=20261113-azumada-rebuilt'));
assert(html.includes('rail-system-data.js?v=20261113-azumada-park-through'));
assert(read('tools/export-korean-names.js').includes("x.meta.id!=='line-toyotetsu-azumada-park-branch'"));
console.log('PASS Toyotetsu: 14 actual stops; 13-stop Akaiwaguchi local, 11-stop short-turn, 13-stop Park through service in both directions; no fake Akaiwaguchi–Park edge');
