#!/usr/bin/env node
'use strict';
// Preserve independent Japanese station signs and coordinates while enabling
// verified, different-name transfers in the actual FreeDrive graph and TAB.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const fixture=id=>{
  const route=JSON.parse(read('data/generated/routes/'+id+'.json')).route;
  return {...route,countryId:'jp',lazy:false};
};
const source=read('js/free-drive.js')
  .replace(/^import[^;]*;/gm,'').replace(/\bexport\s+/g,'');
const context={
  console,
  koreanRouteBlockReason:()=>false,
  $:()=>null,
  addEventListener:()=>{},
  normalize:s=>String(s||'').normalize('NFC').toLowerCase(),
  koreanStationDisplayName:s=>s,
  koreanRouteDisplayText:s=>s,
  escapeHtml:s=>String(s)
};
vm.createContext(context);
vm.runInContext(source+';globalThis.FreeDriveTest=FreeDrive;globalThis.keyTest=freeDriveStationKey;globalThis.namedTransferNames=japaneseNamedTransferNamesForRoute;globalThis.transferGroupCount=JP_NAMED_TRANSFER_GROUPS.length;',context);
assert.ok(context.transferGroupCount>=15);
const find=(route,name)=>{const stop=route.stations.find(x=>x.ja===name);assert.ok(stop,route.id+': '+name+' missing');return stop};
const cases=[
  ['akasaka/nagatacho',['line-28001','赤坂見附'],['line-28008','永田町']],
  ['kokkai/tameike',['line-28002','国会議事堂前'],['line-28009','溜池山王']],
  ['awajicho/shin-ochanomizu',['line-28002','淡路町'],['line-28005','新御茶ノ水']],
  ['awajicho/ogawamachi',['line-28002','淡路町'],['line-99304','小川町']],
  ['ueno/keisei-ueno',['line-28001','上野'],['line-23001','京成上野']],
  ['osaka/umeda',['line-11602','大阪'],['line-99618','梅田']],
  ['osaka/higashi-umeda',['line-11602','大阪'],['line-99619','東梅田']],
  ['osaka/nishi-umeda',['line-11602','大阪'],['line-99620','西梅田']]
];
for(const [label,[idA,nameA],[idB,nameB]] of cases){
  const a=fixture(idA),b=fixture(idB);
  const stopA=find(a,nameA),stopB=find(b,nameB);
  const drive=new context.FreeDriveTest();
  drive.render=()=>{};drive.renderMap=()=>{};drive.populateStartStations=()=>{};drive.emit=()=>{};
  drive.setNetwork([a,b]);
  const keyA=context.keyTest(stopA),keyB=context.keyTest(stopB);
  assert.equal(keyA,keyB,label+': different-name transfer not joined');
  assert.ok(keyA.startsWith('jp-named-transfer:'),label+': incorrect transfer key');
  const node=drive.graph.get(keyA);
  assert.ok(node?.routeIds.has(idA)&&node?.routeIds.has(idB),label+': missing transfer tabs');
  const index=a.stations.findIndex(x=>x.id===stopA.id);
  assert.ok(drive.start(a,index),label+': start');
  assert.ok(drive.switchRouteAtCurrentStation(idB),label+': cannot press TAB to switch');
  assert.equal(drive.snapshot().station.ja,nameB,label+': switched to wrong station sign');
  assert.deepEqual(Array.from(drive.coordsForRoute(keyA,idA)),[stopA.latitude,stopA.longitude]);
  assert.deepEqual(Array.from(drive.coordsForRoute(keyA,idB)),[stopB.latitude,stopB.longitude]);
  assert.ok(stopA.latitude!==stopB.latitude||stopA.longitude!==stopB.longitude,
    label+': independent platforms collapsed');
}
const names=JSON.parse(read('data/japan-route-station-names.json')).routes;
for(const [id,overrides] of Object.entries(names)){
  const route=fixture(id);
  for(const [stationId,expected] of Object.entries(overrides)){
    const stop=route.stations.find(x=>x.id===stationId);
    assert.ok(stop,id+': missing overridden station '+stationId);
    assert.equal(stop.ja,expected.ja,id+': outdated Japanese station sign');
    assert.equal(stop.ko,expected.ko,id+': outdated Korean station sign');
    assert.equal(stop.routeSpecificStationName,true);
    assert.ok(stop.canonicalStationNames?.ja,'must retain common station ID/names');
  }
}
// Same spelling outside the documented transfer catchment must never merge.
const afar={
  id:'not-the-osaka-station',countryId:'jp',
  stations:[{id:'unrelated-osaka',stationMasterId:'unrelated-osaka',ja:'大阪',ko:'오사카',latitude:35.2,longitude:135.7},
    {id:'another-stop',ja:'遠方',latitude:35.21,longitude:135.71}]
};
const other=fixture('line-99618');
const drive=new context.FreeDriveTest();
drive.renderMap=()=>{};
drive.setNetwork([afar,other]);
assert.notEqual(context.keyTest(afar.stations[0]),context.keyTest(find(other,'梅田')),
  'two unrelated same/nearby names should not merge');
assert.ok(context.namedTransferNames(fixture('line-28001')).includes('永田町'),
  'Akasaka transfer neighbor names missing from lazy-load catalog');
const app=read('js/app.js'),bundle=read('js/app.bundle.js');
const begin=app.indexOf('async function hydrateJapaneseNamedTransferConnections(route){'),
  end=app.indexOf('async function startFreeDrive(route){',begin);
assert.ok(begin>0&&end>begin,'app is missing named transfer hydration');
const helper=app.slice(begin,end);
let hydrated=0,refreshed=0;
const chosen=fixture('line-28001');
const routes=[
  {id:'line-28008',countryId:'jp',lazy:true,searchStations:['永田町']},
  {id:'line-unrelated',countryId:'jp',lazy:true,searchStations:['遠方']}
];
const appContext={
  builtin:routes,
  console,
  isRouteVisible:()=>true,
  japaneseNamedTransferNamesForRoute:context.namedTransferNames,
  hydrateRailLine:async item=>{hydrated++;return{...item,lazy:false,stations:fixture('line-28008').stations}},
  railDataRepository:{resolveRoute:route=>route},
  refreshRoutes:()=>{refreshed++}
};
vm.createContext(appContext);
vm.runInContext(helper+';globalThis.prefetch=hydrateJapaneseNamedTransferConnections;',appContext);
(async()=>{
 await appContext.prefetch(chosen);
 assert.equal(hydrated,1,'only nearby named transfer lines may be fetched');
 assert.equal(refreshed,1,'free-drive route network must refresh after hydration');
 assert.equal(routes[0].lazy,false);
 assert.equal(routes[1].lazy,true,'unrelated line was needlessly hydrated');
 for(const part of [
   'function japaneseNamedTransferNamesForRoute(route){',
   'function assignJapanNamedTransfers(routes){',
   'async function hydrateJapaneseNamedTransferConnections(route){',
   "if(target.countryId==='jp')await hydrateJapaneseNamedTransferConnections(target);",
   'station.canonicalStationNames||station.names'
 ])assert.ok(bundle.includes(part),'published bundle missing '+part);
 console.log(JSON.stringify({status:'PASS',differentNameTransferCases:cases.length,sourceGroups:context.transferGroupCount,renamedRoutes:Object.keys(names).length,prefetch:'targeted',routeCoordinates:'independent'}));
})().catch(err=>{console.error(err);process.exitCode=1});
