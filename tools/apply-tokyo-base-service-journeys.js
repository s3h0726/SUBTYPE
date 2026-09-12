#!/usr/bin/env node
/*
 * Add canonical origin/destination journeys for Tokyo Metro and Toei base
 * routes. Through and non-through services intentionally share one catalog.
 * Generated runtime bundles are rebuilt by the normal build command.
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8')),write=(file,value)=>fs.writeFileSync(path.join(root,file),`${JSON.stringify(value,null,2)}\n`);
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js','line-workspace-data.js'),'utf8'),context);
const routes=context.window.TRT_EMBEDDED_LINE_WORKSPACES.routes||[],routeMap=new Map(routes.map(route=>[route.id,route]));
const sid=station=>String(station.stationMasterId||station.sourceStationId||station.id);
const sources={
  metro:{type:'official',url:'https://www.tokyometro.jp/station/index.html',verifiedAt:'2026-09-12'},
  ginza:{type:'official',url:'https://www.tokyometro.jp/station/timetable/pdf/202503/G01.pdf',verifiedAt:'2026-09-12'},
  tozai:{type:'official',url:'https://www.tokyometro.jp/station/gyotoku/timetable/pdf/202501/gyotoku_timetable.pdf',verifiedAt:'2026-09-12'},
  hanzomon:{type:'official',url:'https://www.tokyometro.jp/station/timetable/pdf/202603/Z13.pdf',verifiedAt:'2026-09-12'},
  toei:{type:'official',url:'https://www.kotsu.metro.tokyo.jp/subway/timetable/',verifiedAt:'2026-09-12'},
  mita:{type:'official',url:'https://www.kotsu.metro.tokyo.jp/subway/timetable/mita/n/I01NH.html',verifiedAt:'2026-09-12'},
  shinjuku:{type:'official',url:'https://www.kotsu.metro.tokyo.jp/subway/timetable/shinjuku/S20WH.html',verifiedAt:'2026-09-12'}
};
const routeDefinitions=[
  ['line-28001','ginza','tokyo-local',sources.metro],['line-28002','marunouchi','tokyo-local',sources.metro],['line-28002-honancho-branch','marunouchi-honancho','tokyo-local',sources.metro],
  ['line-28003','hibiya','tokyo-local',sources.metro],['line-28004','tozai','tokyo-local',sources.metro],['line-28005','chiyoda','tokyo-local',sources.metro],
  ['line-28006','yurakucho','tokyo-local',sources.metro],['line-28008','hanzomon','tokyo-local',sources.metro],['line-28009','namboku','tokyo-local',sources.metro],['line-28010','fukutoshin','tokyo-local',sources.metro],
  ['line-99302','asakusa','toei-local',sources.toei],['line-99303','mita','toei-local',sources.toei],['line-99304','shinjuku','toei-local',sources.toei],['line-99301','oedo','toei-local',sources.toei]
];
const catalog=read('data/tokyo-service-patterns.json'),managedPrefix='base-journey-';
for(const type of [
  {id:'tokyo-local',names:{ja:'各駅停車',ko:'각역정차',en:'Local'},priority:10},
  {id:'toei-local',operatorId:'toei',names:{ja:'各駅停車',ko:'각역정차',en:'Local'},priority:10},
  {id:'tokyo-metro-rapid',operatorId:'tokyo-metro',names:{ja:'快速',ko:'쾌속',en:'Rapid'},priority:25},
  {id:'toei-express',operatorId:'toei',names:{ja:'急行',ko:'급행',en:'Express'},priority:30}
])if(!(catalog.trainTypes||[]).some(item=>item.id===type.id))catalog.trainTypes.push(type);
const trainName=id=>(catalog.trainTypes||[]).find(item=>item.id===id)?.names||{ja:id,ko:id,en:id};
const patterns=[];
function addPattern({routeId,slug,originJa,destinationJa,trainTypeId,source,stopNames,idSuffix}){
  const route=routeMap.get(routeId);if(!route)throw new Error(`Missing route ${routeId}`);
  const a=route.stations.findIndex(station=>station.ja===originJa),b=route.stations.findIndex(station=>station.ja===destinationJa);if(a<0||b<0||a===b)throw new Error(`${routeId}: invalid journey ${originJa} -> ${destinationJa}`);
  const directionId=a<b?'forward':'reverse',stationSequence=(a<b?route.stations.slice(a,b+1):route.stations.slice(b,a+1).reverse()),stopSet=stopNames?new Set(stopNames):null,stops=stopSet?stationSequence.filter(station=>stopSet.has(station.ja)):stationSequence;
  if(stops[0]!==stationSequence[0]||stops.at(-1)!==stationSequence.at(-1))throw new Error(`${routeId}: stop pattern does not contain both endpoints`);
  const type=trainName(trainTypeId),origin=stationSequence[0],destination=stationSequence.at(-1),id=`${managedPrefix}${slug}-${idSuffix||`${directionId}-${trainTypeId}`}`;
  patterns.push({id,baseRouteId:routeId,trainTypeId,originStationId:sid(origin),destinationStationId:sid(destination),directionId,stationSequence:stationSequence.map(sid),stopStationIds:stops.map(sid),names:{ja:`${type.ja} ${destination.ja}行`,ko:`${type.ko} · ${destination.ko}행`,en:`${type.en} to ${destination.romaji||destination.ja}`},sources:[source]});
}
for(const [routeId,slug,trainTypeId,source] of routeDefinitions){
  const route=routeMap.get(routeId);if(!route)throw new Error(`Missing route ${routeId}`);const first=route.stations[0].ja,last=route.stations.at(-1).ja;
  // The legacy full-line play remains available in both directions as an
  // explicit ServiceJourney instead of an implicit first-to-last special case.
  addPattern({routeId,slug,originJa:first,destinationJa:last,trainTypeId,source,idSuffix:'full-forward'});
  addPattern({routeId,slug,originJa:last,destinationJa:first,trainTypeId,source,idSuffix:'full-reverse'});
}
// Repeated short workings and train types verified in current official
// timetables. These are deliberately enumerated; no Cartesian product exists.
for(const definition of [
  {routeId:'line-28001',slug:'ginza',originJa:'渋谷',destinationJa:'上野',trainTypeId:'tokyo-local',source:sources.ginza,idSuffix:'shibuya-ueno'},
  {routeId:'line-28001',slug:'ginza',originJa:'上野',destinationJa:'渋谷',trainTypeId:'tokyo-local',source:sources.ginza,idSuffix:'ueno-shibuya'},
  {routeId:'line-28004',slug:'tozai',originJa:'中野',destinationJa:'東陽町',trainTypeId:'tokyo-local',source:sources.tozai,idSuffix:'nakano-toyocho'},
  {routeId:'line-28004',slug:'tozai',originJa:'妙典',destinationJa:'中野',trainTypeId:'tokyo-local',source:sources.tozai,idSuffix:'myoden-nakano'},
  {routeId:'line-28008',slug:'hanzomon',originJa:'渋谷',destinationJa:'清澄白河',trainTypeId:'tokyo-local',source:sources.hanzomon,idSuffix:'shibuya-kiyosumi'},
  {routeId:'line-28008',slug:'hanzomon',originJa:'清澄白河',destinationJa:'渋谷',trainTypeId:'tokyo-local',source:sources.hanzomon,idSuffix:'kiyosumi-shibuya'},
  {routeId:'line-99303',slug:'mita',originJa:'目黒',destinationJa:'高島平',trainTypeId:'toei-local',source:sources.mita,idSuffix:'meguro-takashimadaira'},
  {routeId:'line-99303',slug:'mita',originJa:'高島平',destinationJa:'目黒',trainTypeId:'toei-local',source:sources.mita,idSuffix:'takashimadaira-meguro'},
  {routeId:'line-99304',slug:'shinjuku',originJa:'本八幡',destinationJa:'大島',trainTypeId:'toei-local',source:sources.shinjuku,idSuffix:'motoyawata-ojima'},
  {routeId:'line-99304',slug:'shinjuku',originJa:'大島',destinationJa:'新宿',trainTypeId:'toei-local',source:sources.shinjuku,idSuffix:'ojima-shinjuku'}
])addPattern(definition);
const tozaiRapidStops=['中野','落合','高田馬場','早稲田','神楽坂','飯田橋','九段下','竹橋','大手町','日本橋','茅場町','門前仲町','木場','東陽町','浦安','西船橋'];
addPattern({routeId:'line-28004',slug:'tozai',originJa:'中野',destinationJa:'西船橋',trainTypeId:'tokyo-metro-rapid',source:sources.tozai,stopNames:tozaiRapidStops,idSuffix:'rapid-forward'});
addPattern({routeId:'line-28004',slug:'tozai',originJa:'西船橋',destinationJa:'中野',trainTypeId:'tokyo-metro-rapid',source:sources.tozai,stopNames:tozaiRapidStops,idSuffix:'rapid-reverse'});
const shinjukuExpressStops=['新宿','市ヶ谷','神保町','馬喰横山','森下','大島','船堀','本八幡'];
addPattern({routeId:'line-99304',slug:'shinjuku',originJa:'新宿',destinationJa:'本八幡',trainTypeId:'toei-express',source:sources.shinjuku,stopNames:shinjukuExpressStops,idSuffix:'express-forward'});
addPattern({routeId:'line-99304',slug:'shinjuku',originJa:'本八幡',destinationJa:'新宿',trainTypeId:'toei-express',source:sources.shinjuku,stopNames:shinjukuExpressStops,idSuffix:'express-reverse'});
const fukutoshinExpressStops=['和光市','小竹向原','池袋','新宿三丁目','明治神宮前〈原宿〉','渋谷'],fukutoshinCommuterStops=['和光市','地下鉄成増','地下鉄赤塚','平和台','氷川台','小竹向原','池袋','新宿三丁目','明治神宮前〈原宿〉','渋谷'];
addPattern({routeId:'line-28010',slug:'fukutoshin',originJa:'渋谷',destinationJa:'和光市',trainTypeId:'tokyo-metro-express',source:sources.metro,stopNames:fukutoshinExpressStops,idSuffix:'express-reverse'});
addPattern({routeId:'line-28010',slug:'fukutoshin',originJa:'渋谷',destinationJa:'和光市',trainTypeId:'tokyo-metro-commuter-express',source:sources.metro,stopNames:fukutoshinCommuterStops,idSuffix:'commuter-express-reverse'});
const managedIds=new Set(patterns.map(item=>item.id));catalog.servicePatterns=[...(catalog.servicePatterns||[]).filter(item=>!item.id.startsWith(managedPrefix)&&!managedIds.has(item.id)),...patterns];
const activePatterns=(catalog.servicePatterns||[]).filter(item=>(!item.status||item.status==='active')&&item.originStationId&&item.destinationStationId&&item.trainTypeId);
catalog.serviceJourneys=activePatterns.map(pattern=>({id:`journey-${pattern.id}`,baseRouteId:pattern.baseRouteId,originStationId:pattern.originStationId,destinationStationId:pattern.destinationStationId,trainTypeId:pattern.trainTypeId,throughServiceId:pattern.throughServiceId||null,directionId:pattern.directionId,servicePatternId:pattern.id,status:'active'}));
const endpointStationById=new Map(routes.flatMap(route=>route.stations).map(station=>[sid(station),station])),endpointIds=new Set(activePatterns.flatMap(pattern=>[pattern.originStationId,pattern.destinationStationId]));
catalog.destinations=[...new Map([...(catalog.destinations||[]).map(item=>[item.stationId,item]),...[...endpointIds].map(id=>{const station=endpointStationById.get(id);return[id,{stationId:id,names:{ja:station?.ja||'',ko:station?.ko||'',en:station?.romaji||station?.ja||''}}]})]).values()];
catalog.baseJourneyInventory=routeDefinitions.map(([lineId,slug])=>({lineId,slug,status:'COMPLETE',journeys:catalog.serviceJourneys.filter(item=>item.baseRouteId===lineId&&!item.throughServiceId).length}));catalog.verifiedAt='2026-09-12';write('data/tokyo-service-patterns.json',catalog);
console.log(JSON.stringify({routes:routeDefinitions.length,basePatterns:patterns.length,allPatterns:catalog.servicePatterns.length,journeys:catalog.serviceJourneys.length,throughJourneys:catalog.serviceJourneys.filter(item=>item.throughServiceId).length},null,2));
