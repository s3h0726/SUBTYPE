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
assert.ok(context.transferGroupCount>=33,'nationwide source groups missing');
const national=JSON.parse(read('data/japan-named-transfer-groups.json'));
assert.equal(context.transferGroupCount,national.groups.length);
assert.ok(new Set(national.groups.map(x=>x.region)).size>=8);
const find=(route,name)=>{const stop=route.stations.find(x=>x.ja===name);assert.ok(stop,route.id+': '+name+' missing');return stop};
const cases=[
  ['akasaka/nagatacho',['line-28001','赤坂見附'],['line-28008','永田町']],
  ['kokkai/tameike',['line-28002','国会議事堂前'],['line-28009','溜池山王']],
  ['awajicho/shin-ochanomizu',['line-28002','淡路町'],['line-28005','新御茶ノ水']],
  ['awajicho/ogawamachi',['line-28002','淡路町'],['line-99304','小川町']],
  ['ueno/keisei-ueno',['line-28001','上野'],['line-23001','京成上野']],
  ['osaka/umeda',['line-11602','大阪'],['line-99618','梅田']],
  ['osaka/higashi-umeda',['line-11602','大阪'],['line-99619','東梅田']],
  ['osaka/nishi-umeda',['line-11602','大阪'],['line-99620','西梅田']],
  ['hibiya/yurakucho',['line-28003','日比谷'],['line-28006','有楽町']],
  ['ueno-hirokoji/naka-okachimachi',['line-28001','上野広小路'],['line-28003','仲御徒町']],
  ['ningyocho/suitengumae',['line-28003','人形町'],['line-28008','水天宮前']],
  ['tsukiji/shintomicho',['line-28003','築地'],['line-28006','新富町']],
  ['toranomon/toranomon-hills',['line-28001','虎ノ門'],['line-28003','虎ノ門ヒルズ']],
  ['ginza/ginza-itchome',['line-28001','銀座'],['line-28006','銀座一丁目']],
  ['korakuen/kasuga',['line-28002','後楽園'],['line-99301','春日']],
  ['akihabara/iwamotocho',['line-28003','秋葉原'],['line-99304','岩本町']],
  ['shinjuku/shinsen-shinjuku',['line-99304','新宿'],['line-24007','新線新宿']],
  ['namba/osaka-namba',['line-99618','なんば'],['line-31001','大阪難波']],
  ['sapporo/jr-subway',['line-11103','札幌'],['line-99102','さっぽろ']],
  ['sapporo/odori-tram',['line-99101','大通'],['line-99104','西４丁目']],
  ['nagoya/jr-kintetsu',['line-11502','名古屋'],['line-31027','近鉄名古屋']],
  ['nagoya/jr-meitetsu',['line-11502','名古屋'],['line-30001','名鉄名古屋']],
  ['kyoto/shijo-karasuma',['line-99610','四条'],['line-34003','烏丸']],
  ['osaka/minamikata',['line-34003','南方'],['line-99618','西中島南方']],
  ['kobe/sannomiya',['line-11603','三ノ宮'],['line-34001','神戸三宮']],
  ['hiroshima/jr-tram',['line-11611','広島'],['line-99710','広島駅']],
  ['takamatsu/jr-kotoden',['line-11802','高松'],['line-99802','高松築港']],
  ['toyama/jr-dentetsu',['line-11416','富山'],['line-99408','電鉄富山']],
  ['fukuoka/tenjin-walk',['line-99905','天神'],['line-99907','天神南']],
  ['kumamoto/jr-tram',['line-11903','熊本'],['line-99922','熊本駅前']],
  ['kamikumamoto/jr-tram',['line-11903','上熊本'],['line-99923','上熊本駅前']],
  ['nagasaki/jr-tram',['line-11905','長崎'],['line-99913','長崎駅前']],
  ['kanazawa/jr-hokutetsu',['line-11415','金沢'],['line-99417','北鉄金沢']],
  ['hakodate/jr-tram',['line-11101','函館'],['line-99105','函館駅前']],
  ['okayama/jr-tram',['line-11609','岡山'],['line-99706','岡山駅前']],
  ['himeji/jr-sanyo',['line-11608','姫路'],['line-99637','山陽姫路']]
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
// JR Aoba-dori and JR Sendai are consecutive physical stops, not one.
const jrSendai=fixture('line-11222'),subwaySendai=fixture('line-99214');
const jrAoba=find(jrSendai,'あおば通'),jrCentral=find(jrSendai,'仙台');
const subwayCentral=find(subwaySendai,'仙台');
const sendaiDrive=new context.FreeDriveTest();
sendaiDrive.render=()=>{};sendaiDrive.renderMap=()=>{};sendaiDrive.populateStartStations=()=>{};sendaiDrive.emit=()=>{};
sendaiDrive.setNetwork([jrSendai,subwaySendai]);
assert.notEqual(context.keyTest(jrAoba),context.keyTest(jrCentral),
  'Sendai adjacent JR Aoba-dori and Sendai stops were collapsed');
assert.equal(context.keyTest(jrCentral),context.keyTest(subwayCentral),
  'Sendai subway should transfer at JR Sendai, not JR Aoba-dori');
assert.ok(jrSendai.stations.findIndex(x=>x.id===jrAoba.id)+1===jrSendai.stations.findIndex(x=>x.id===jrCentral.id),
  'Sendai JR segment order unexpectedly changed');
assert.equal(subwayCentral.transferStationId,jrCentral.id);
// Nationwide same-name, different-ID platforms join only within 250 m.
const nearA={id:'jp-near-a',countryId:'jp',stations:[
 {id:'a1',stationMasterId:'unique-a1',ja:'県庁前',ko:'현청앞',latitude:34.0001,longitude:135.0001},
 {id:'a2',stationMasterId:'unique-a2',ja:'別駅',latitude:34.02,longitude:135.02}
]};
const nearB={id:'jp-near-b',countryId:'jp',stations:[
 {id:'b1',stationMasterId:'unique-b1',ja:'県庁前',ko:'현청앞',latitude:34.001,longitude:135.0002},
 {id:'b2',stationMasterId:'unique-b2',ja:'別終',latitude:34.022,longitude:135.022}
]};
const nearDrive=new context.FreeDriveTest();
nearDrive.renderMap=()=>{};nearDrive.render=()=>{};nearDrive.emit=()=>{};nearDrive.populateStartStations=()=>{};
nearDrive.setNetwork([nearA,nearB]);
assert.equal(context.keyTest(nearA.stations[0]),context.keyTest(nearB.stations[0]),
 'nationwide nearby same-name platforms with different master IDs must join');
assert.ok(context.keyTest(nearA.stations[0]).startsWith('jp-near-name:'));
nearDrive.start(nearA,0);
assert.ok(nearDrive.switchRouteAtCurrentStation(nearB.id));
nearB.stations[0].latitude=34.03;
nearDrive.setNetwork([nearA,nearB]);
assert.notEqual(context.keyTest(nearA.stations[0]),context.keyTest(nearB.stations[0]),
 'stations kilometers apart must never auto-merge');
// A 200 m rounded coordinate cell is NOT sufficient evidence for a transfer.
// Two same-name stops at opposite cell corners can be >250 m apart.
const aliasA={id:'jp-separated-a',countryId:'jp',stations:[
 {id:'ka',stationMasterId:'different-ka',ja:'試験駅',latitude:34.00099,longitude:135.00099},
 {id:'ka2',stationMasterId:'ka2',ja:'別駅',latitude:34.03,longitude:135.03}
]};
const aliasB={id:'jp-separated-b',countryId:'jp',stations:[
 {id:'kb',stationMasterId:'different-kb',ja:'試験駅',latitude:33.99901,longitude:134.99901},
 {id:'kb2',stationMasterId:'kb2',ja:'別駅２',latitude:34.04,longitude:135.04}
]};
const isolatedDrive=new context.FreeDriveTest();
isolatedDrive.renderMap=()=>{};isolatedDrive.render=()=>{};isolatedDrive.emit=()=>{};isolatedDrive.populateStartStations=()=>{};
isolatedDrive.setNetwork([aliasA,aliasB]);
assert.notEqual(context.keyTest(aliasA.stations[0]),context.keyTest(aliasB.stations[0]),
 'unverified matching names in the same coordinate cell must remain separate');
assert.ok(context.keyTest(aliasA.stations[0]).startsWith('jp-route-stop:'));
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
   'const networkStart=freeDrive?.routes?.find(line=>line.id===target.id)||target;',
   'station.canonicalStationNames||station.names',
   'const ambiguousByRoute=new Set',
   'function assignJapanNearbySameNameTransfers(routes){',
   'const neighborIds=new Set(nationalNeighbors?.[route.id]||[])'
 ])assert.ok(bundle.includes(part),'published bundle missing '+part);
 const indexedRows=[
   {id:'line-28008',countryId:'jp',lazy:true,searchStations:['永田町']},
   {id:'line-99304',countryId:'jp',lazy:true,searchStations:['小川町']},
   {id:'line-unrelated',countryId:'jp',lazy:true,searchStations:['遠方']}
 ];
 let indexedFetched=0;
 const indexedContext={
   builtin:indexedRows,console,isRouteVisible:()=>true,
   TRT_JAPAN_LITE_INDEX:{transferNeighbors:{'line-28001':['line-99304']}},
   japaneseNamedTransferNamesForRoute:()=>[],
   hydrateRailLine:async row=>{indexedFetched++;return{...row,lazy:false,stations:[]}},
   railDataRepository:{resolveRoute:route=>route},refreshRoutes:()=>{}
 };
 vm.createContext(indexedContext);
 vm.runInContext(helper+';globalThis.prefetch=hydrateJapaneseNamedTransferConnections;',indexedContext);
 await indexedContext.prefetch(chosen);
 assert.equal(indexedFetched,1,'national index must hydrate the neighboring route only');
 assert.equal(indexedRows[1].lazy,false);
 assert.equal(indexedRows[0].lazy,true);
 // A deployed pre-regeneration index may have no nationwide neighbor graph.
 // Discover same-name counterparts even outside the 29 manually curated groups.
 const noGraphRoutes=[
   {id:'line-country-mate',countryId:'jp',lazy:true,searchStations:['金沢']},
   {id:'line-unrelated-region',countryId:'jp',lazy:true,searchStations:['那覇']}
 ];
 let fallbackLoaded=0;
 const noGraphContext={
   builtin:noGraphRoutes,console,isRouteVisible:()=>true,
   TRT_JAPAN_LITE_INDEX:{routes:[]},
   japaneseNamedTransferNamesForRoute:()=>[],
   hydrateRailLine:async row=>{fallbackLoaded++;return{...row,lazy:false,stations:[]}},
   railDataRepository:{resolveRoute:r=>r},refreshRoutes:()=>{}
 };
 vm.createContext(noGraphContext);
 vm.runInContext(helper+';globalThis.prefetch=hydrateJapaneseNamedTransferConnections;',noGraphContext);
 await noGraphContext.prefetch({id:'route-kanazawa',countryId:'jp',
   stations:[{ja:'金沢',canonicalStationNames:{ja:'金沢'},latitude:36.578,longitude:136.648}]});
 assert.equal(fallbackLoaded,1,'missing nationwide index should still discover same-name interchanges');
 assert.equal(noGraphRoutes[0].lazy,false);
 assert.equal(noGraphRoutes[1].lazy,true);
 console.log(JSON.stringify({status:'PASS',differentNameTransferCases:cases.length,nationwideRegionCount:new Set(national.groups.map(x=>x.region)).size,sourceGroups:context.transferGroupCount,renamedRoutes:Object.keys(names).length,prefetch:'targeted',routeCoordinates:'independent'}));
})().catch(err=>{console.error(err);process.exitCode=1});
