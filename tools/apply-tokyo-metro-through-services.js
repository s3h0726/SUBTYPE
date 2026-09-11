#!/usr/bin/env node
/*
 * Rebuild the canonical Tokyo Metro through-service inventory and its reusable
 * service patterns.  Run the normal build afterwards; generated JS is never
 * edited here.
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const write=(file,value)=>fs.writeFileSync(path.join(root,file),`${JSON.stringify(value,null,2)}\n`);
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js','line-workspace-data.js'),'utf8'),context);
const routes=context.window.TRT_EMBEDDED_LINE_WORKSPACES.routes||[],routeMap=new Map(routes.map(route=>[route.id,route]));
const stationId=station=>String(station.stationMasterId||station.sourceStationId||station.id),sameStation=(a,b)=>stationId(a)===stationId(b)||a.ja===b.ja;
const official='https://www.tokyometro.jp/corporate/ir/library/factbook/pdf/factbook_2025.pdf';
const source=[{type:'official',url:official,verifiedAt:'2026-09-11'}];
const seg=(routeId,direction,startStationJa,endStationJa)=>({routeId,direction,startStationJa,endStationJa});
const pair=(forward,reverse)=>({forward,reverse});
const services=[
  {
    id:'hibiya-tobu',nameJa:'日比谷線・東武線直通',nameKo:'히비야선·도부선 직통',nameEn:'Hibiya–Tobu Through Service',
    participatingOperatorIds:['tokyo-metro','tobu'],participatingLineIds:['line-28003','line-21002','line-21003'],boundaryStations:['北千住','東武動物公園'],allowedDestinations:['中目黒','南栗橋'],
    directionVariants:pair(
      [seg('line-28003','reverse','中目黒','北千住'),seg('line-21002','forward','北千住','東武動物公園'),seg('line-21003','forward','東武動物公園','南栗橋')],
      [seg('line-21003','reverse','南栗橋','東武動物公園'),seg('line-21002','reverse','東武動物公園','北千住'),seg('line-28003','forward','北千住','中目黒')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'tozai-chuo-sobu',nameJa:'中央・総武線・東西線直通',nameKo:'주오·소부선·도자이선 직통',nameEn:'Chuo–Tozai–Sobu Through Service',
    participatingOperatorIds:['jr-east','tokyo-metro'],participatingLineIds:['line-11313','line-28004'],boundaryStations:['中野','西船橋'],allowedDestinations:['三鷹','津田沼'],
    directionVariants:pair(
      [seg('line-11313','forward','三鷹','中野'),seg('line-28004','forward','中野','西船橋'),seg('line-11313','forward','西船橋','津田沼')],
      [seg('line-11313','reverse','津田沼','西船橋'),seg('line-28004','reverse','西船橋','中野'),seg('line-11313','reverse','中野','三鷹')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'tozai-toyo-rapid',nameJa:'東西線・東葉高速線直通',nameKo:'도자이선·도요 고속선 직통',nameEn:'Tozai–Toyo Rapid Through Service',
    participatingOperatorIds:['tokyo-metro','higashihakosokutetsudo'],participatingLineIds:['line-28004','line-99338'],boundaryStations:['西船橋'],allowedDestinations:['中野','東葉勝田台'],
    directionVariants:pair(
      [seg('line-28004','forward','中野','西船橋'),seg('line-99338','forward','西船橋','東葉勝田台')],
      [seg('line-99338','reverse','東葉勝田台','西船橋'),seg('line-28004','reverse','西船橋','中野')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'chiyoda-joban-odakyu',nameJa:'常磐線・千代田線・小田急線直通',nameKo:'조반선·지요다선·오다큐선 직통',nameEn:'Joban–Chiyoda–Odakyu Through Service',
    participatingOperatorIds:['jr-east','tokyo-metro','odakyu'],participatingLineIds:['line-11320','line-28005','line-25001'],boundaryStations:['綾瀬','代々木上原'],allowedDestinations:['我孫子','本厚木'],
    directionVariants:pair(
      [seg('line-11320','reverse','我孫子','綾瀬'),seg('line-28005','forward','綾瀬','代々木上原'),seg('line-25001','forward','代々木上原','本厚木')],
      [seg('line-25001','reverse','本厚木','代々木上原'),seg('line-28005','reverse','代々木上原','綾瀬'),seg('line-11320','forward','綾瀬','我孫子')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'chiyoda-odakyu-tama',nameJa:'千代田線・小田急多摩線直通',nameKo:'지요다선·오다큐 다마선 직통',nameEn:'Chiyoda–Odakyu Tama Through Service',
    participatingOperatorIds:['tokyo-metro','odakyu'],participatingLineIds:['line-28005','line-25001','line-25003'],boundaryStations:['代々木上原','新百合ヶ丘'],allowedDestinations:['綾瀬','唐木田'],
    directionVariants:pair(
      [seg('line-28005','forward','綾瀬','代々木上原'),seg('line-25001','forward','代々木上原','新百合ヶ丘'),seg('line-25003','forward','新百合ヶ丘','唐木田')],
      [seg('line-25003','reverse','唐木田','新百合ヶ丘'),seg('line-25001','reverse','新百合ヶ丘','代々木上原'),seg('line-28005','reverse','代々木上原','綾瀬')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'yurakucho-tobu',nameJa:'東武東上線・有楽町線直通',nameKo:'도부 도조선·유라쿠초선 직통',nameEn:'Tobu Tojo–Yurakucho Through Service',
    participatingOperatorIds:['tobu','tokyo-metro'],participatingLineIds:['line-21001','line-28006'],boundaryStations:['和光市'],allowedDestinations:['森林公園','新木場'],
    directionVariants:pair(
      [seg('line-21001','reverse','森林公園','和光市'),seg('line-28006','forward','和光市','新木場')],
      [seg('line-28006','reverse','新木場','和光市'),seg('line-21001','forward','和光市','森林公園')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'yurakucho-seibu',nameJa:'西武線・有楽町線直通',nameKo:'세이부선·유라쿠초선 직통',nameEn:'Seibu–Yurakucho Through Service',
    participatingOperatorIds:['seibu','tokyo-metro'],participatingLineIds:['line-22001','line-22003','line-28006'],boundaryStations:['練馬','小竹向原'],allowedDestinations:['飯能','新木場'],
    directionVariants:pair(
      [seg('line-22001','reverse','飯能','練馬'),seg('line-22003','reverse','練馬','小竹向原'),seg('line-28006','forward','小竹向原','新木場')],
      [seg('line-28006','reverse','新木場','小竹向原'),seg('line-22003','forward','小竹向原','練馬'),seg('line-22001','forward','練馬','飯能')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'denentoshi-hanzomon-tobu',nameJa:'田園都市線・半蔵門線・東武線直通',nameKo:'덴엔토시선·한조몬선·도부선 직통',nameEn:'Den-en-toshi–Hanzomon–Tobu Through Service',
    participatingOperatorIds:['tokyu','tokyo-metro','tobu'],participatingLineIds:['line-26003','line-28008','line-21002'],boundaryStations:['渋谷','押上〈スカイツリー前〉'],allowedDestinations:['中央林間','久喜'],
    directionVariants:pair(
      [seg('line-26003','reverse','中央林間','渋谷'),seg('line-28008','forward','渋谷','押上〈スカイツリー前〉'),seg('line-21002','forward','押上〈スカイツリー前〉','久喜')],
      [seg('line-21002','reverse','久喜','押上〈スカイツリー前〉'),seg('line-28008','reverse','押上〈スカイツリー前〉','渋谷'),seg('line-26003','forward','渋谷','中央林間')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'namboku-saitama-tokyu',nameJa:'埼玉高速線・南北線・東急目黒線直通',nameKo:'사이타마 고속선·난보쿠선·도큐 메구로선 직통',nameEn:'Saitama Railway–Namboku–Tokyu Meguro Through Service',
    participatingOperatorIds:['saitama-railway','tokyo-metro','tokyu'],participatingLineIds:['line-99307','line-28009','line-26002'],boundaryStations:['赤羽岩淵','目黒'],allowedDestinations:['浦和美園','日吉'],
    directionVariants:pair(
      [seg('line-99307','reverse','浦和美園','赤羽岩淵'),seg('line-28009','forward','赤羽岩淵','目黒'),seg('line-26002','forward','目黒','日吉')],
      [seg('line-26002','reverse','日吉','目黒'),seg('line-28009','reverse','目黒','赤羽岩淵'),seg('line-99307','forward','赤羽岩淵','浦和美園')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'namboku-saitama-tokyu-sotetsu-ebina',nameJa:'埼玉高速線・南北線・東急線・相鉄線直通（海老名）',nameKo:'사이타마 고속선·난보쿠선·도큐선·소테츠선 직통(에비나)',nameEn:'Saitama–Namboku–Tokyu–Sotetsu Through Service to Ebina',
    participatingOperatorIds:['saitama-railway','tokyo-metro','tokyu','sotetsu'],participatingLineIds:['line-99307','line-28009','line-26002','line-26009','line-29003','line-29001'],boundaryStations:['赤羽岩淵','目黒','日吉','新横浜','西谷'],allowedDestinations:['浦和美園','海老名'],
    directionVariants:pair(
      [seg('line-99307','reverse','浦和美園','赤羽岩淵'),seg('line-28009','forward','赤羽岩淵','目黒'),seg('line-26002','forward','目黒','日吉'),seg('line-26009','forward','日吉','新横浜'),seg('line-29003','reverse','新横浜','西谷'),seg('line-29001','forward','西谷','海老名')],
      [seg('line-29001','reverse','海老名','西谷'),seg('line-29003','forward','西谷','新横浜'),seg('line-26009','reverse','新横浜','日吉'),seg('line-26002','reverse','日吉','目黒'),seg('line-28009','reverse','目黒','赤羽岩淵'),seg('line-99307','forward','赤羽岩淵','浦和美園')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'namboku-saitama-tokyu-sotetsu-shonandai',nameJa:'埼玉高速線・南北線・東急線・相鉄線直通（湘南台）',nameKo:'사이타마 고속선·난보쿠선·도큐선·소테츠선 직통(쇼난다이)',nameEn:'Saitama–Namboku–Tokyu–Sotetsu Through Service to Shonandai',
    participatingOperatorIds:['saitama-railway','tokyo-metro','tokyu','sotetsu'],participatingLineIds:['line-99307','line-28009','line-26002','line-26009','line-29003','line-29001','line-29002'],boundaryStations:['赤羽岩淵','目黒','日吉','新横浜','西谷','二俣川'],allowedDestinations:['浦和美園','湘南台'],
    directionVariants:pair(
      [seg('line-99307','reverse','浦和美園','赤羽岩淵'),seg('line-28009','forward','赤羽岩淵','目黒'),seg('line-26002','forward','目黒','日吉'),seg('line-26009','forward','日吉','新横浜'),seg('line-29003','reverse','新横浜','西谷'),seg('line-29001','forward','西谷','二俣川'),seg('line-29002','forward','二俣川','湘南台')],
      [seg('line-29002','reverse','湘南台','二俣川'),seg('line-29001','reverse','二俣川','西谷'),seg('line-29003','forward','西谷','新横浜'),seg('line-26009','reverse','新横浜','日吉'),seg('line-26002','reverse','日吉','目黒'),seg('line-28009','reverse','目黒','赤羽岩淵'),seg('line-99307','forward','赤羽岩淵','浦和美園')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'fukutoshin-tokyu-minatomirai',nameJa:'副都心線・東横線・みなとみらい線直通',nameKo:'후쿠토신선·도요코선·미나토미라이선 직통',nameEn:'Fukutoshin–Toyoko–Minatomirai Through Service',
    participatingOperatorIds:['tokyo-metro','tokyu','yokohama-minatomirai-railway'],participatingLineIds:['line-28010','line-26001','line-99310'],boundaryStations:['渋谷','横浜'],allowedDestinations:['和光市','元町・中華街'],
    directionVariants:pair(
      [seg('line-28010','forward','和光市','渋谷'),seg('line-26001','forward','渋谷','横浜'),seg('line-99310','forward','横浜','元町・中華街')],
      [seg('line-99310','reverse','元町・中華街','横浜'),seg('line-26001','reverse','横浜','渋谷'),seg('line-28010','reverse','渋谷','和光市')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'fukutoshin-tobu-minatomirai',nameJa:'東武東上線・副都心線・東横線・みなとみらい線直通',nameKo:'도부 도조선·후쿠토신선·도요코선·미나토미라이선 직통',nameEn:'Tobu–Fukutoshin–Toyoko–Minatomirai Through Service',
    participatingOperatorIds:['tobu','tokyo-metro','tokyu','yokohama-minatomirai-railway'],participatingLineIds:['line-21001','line-28010','line-26001','line-99310'],boundaryStations:['和光市','渋谷','横浜'],allowedDestinations:['森林公園','元町・中華街'],
    directionVariants:pair(
      [seg('line-21001','reverse','森林公園','和光市'),seg('line-28010','forward','和光市','渋谷'),seg('line-26001','forward','渋谷','横浜'),seg('line-99310','forward','横浜','元町・中華街')],
      [seg('line-99310','reverse','元町・中華街','横浜'),seg('line-26001','reverse','横浜','渋谷'),seg('line-28010','reverse','渋谷','和光市'),seg('line-21001','forward','和光市','森林公園')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'fukutoshin-seibu-minatomirai',nameJa:'西武線・副都心線・東横線・みなとみらい線直通',nameKo:'세이부선·후쿠토신선·도요코선·미나토미라이선 직통',nameEn:'Seibu–Fukutoshin–Toyoko–Minatomirai Through Service',
    participatingOperatorIds:['seibu','tokyo-metro','tokyu','yokohama-minatomirai-railway'],participatingLineIds:['line-22001','line-22003','line-28010','line-26001','line-99310'],boundaryStations:['練馬','小竹向原','渋谷','横浜'],allowedDestinations:['飯能','元町・中華街'],
    directionVariants:pair(
      [seg('line-22001','reverse','飯能','練馬'),seg('line-22003','reverse','練馬','小竹向原'),seg('line-28010','forward','小竹向原','渋谷'),seg('line-26001','forward','渋谷','横浜'),seg('line-99310','forward','横浜','元町・中華街')],
      [seg('line-99310','reverse','元町・中華街','横浜'),seg('line-26001','reverse','横浜','渋谷'),seg('line-28010','reverse','渋谷','小竹向原'),seg('line-22003','forward','小竹向原','練馬'),seg('line-22001','forward','練馬','飯能')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  },
  {
    id:'fukutoshin-tokyu-sotetsu-shonandai',nameJa:'副都心線・東横線・新横浜線・相鉄線直通',nameKo:'후쿠토신선·도요코선·신요코하마선·소테츠선 직통',nameEn:'Fukutoshin–Toyoko–Shin-yokohama–Sotetsu Through Service',
    participatingOperatorIds:['tokyo-metro','tokyu','sotetsu'],participatingLineIds:['line-28010','line-26001','line-26009','line-29003','line-29001','line-29002'],boundaryStations:['渋谷','日吉','新横浜','西谷','二俣川'],allowedDestinations:['和光市','湘南台'],
    directionVariants:pair(
      [seg('line-28010','forward','和光市','渋谷'),seg('line-26001','forward','渋谷','日吉'),seg('line-26009','forward','日吉','新横浜'),seg('line-29003','reverse','新横浜','西谷'),seg('line-29001','forward','西谷','二俣川'),seg('line-29002','forward','二俣川','湘南台')],
      [seg('line-29002','reverse','湘南台','二俣川'),seg('line-29001','reverse','二俣川','西谷'),seg('line-29003','forward','西谷','新横浜'),seg('line-26009','reverse','新横浜','日吉'),seg('line-26001','reverse','日吉','渋谷'),seg('line-28010','reverse','渋谷','和光市')]
    ),sourceUrl:official,verifiedDate:'2026-09-11'
  }
];

function selectedStations(config){
  const route=routeMap.get(config.routeId);if(!route)throw new Error(`Missing route ${config.routeId}`);
  const stations=config.direction==='reverse'?[...route.stations].reverse():[...route.stations];
  const start=stations.findIndex(station=>station.ja===config.startStationJa),end=stations.findIndex(station=>station.ja===config.endStationJa);
  if(start<0||end<start)throw new Error(`${config.routeId}: invalid range ${config.startStationJa} -> ${config.endStationJa}`);
  return stations.slice(start,end+1);
}
function sequenceFor(service,direction){
  const result=[];for(const config of service.directionVariants[direction])for(const station of selectedStations(config)){if(result.length&&sameStation(result.at(-1),station))continue;result.push(station)}return result;
}
const throughPatterns=[];
for(const service of services)for(const direction of ['forward','reverse']){
  const stations=sequenceFor(service,direction),origin=stations[0],destination=stations.at(-1);
  throughPatterns.push({
    id:`${service.id}-${direction}`,baseRouteId:service.participatingLineIds.find(id=>id.startsWith('line-280')),
    throughServiceId:service.id,trainTypeId:'through-regular',originStationId:stationId(origin),destinationStationId:stationId(destination),directionId:direction,
    stationSequence:stations.map(stationId),stopStationIds:stations.map(stationId),
    names:{ja:`${service.nameJa} ${destination.ja}行`,ko:`${service.nameKo} ${destination.ko}행`,en:`${service.nameEn} to ${destination.romaji||destination.en||destination.ja}`},sources:source
  });
}
const fLinerStops=new Set(['森林公園','東松山','坂戸','川越','朝霞台','和光市','小竹向原','池袋','新宿三丁目','明治神宮前〈原宿〉','渋谷','中目黒','自由が丘','武蔵小杉','菊名','横浜','みなとみらい','元町・中華街']);
for(const pattern of throughPatterns.filter(item=>item.throughServiceId==='fukutoshin-tobu-minatomirai')){pattern.trainTypeId='fukutoshin-f-liner-express';pattern.stopStationIds=pattern.stationSequence.filter(id=>{const station=routes.flatMap(route=>route.stations).find(item=>stationId(item)===id);return fLinerStops.has(station?.ja)});pattern.segmentTrainTypeContexts=[{routeId:'line-21001',trainTypeId:'tobu-rapid-express'},{routeId:'line-28010',trainTypeId:'tokyo-metro-express'},{routeId:'line-26001',trainTypeId:'tokyu-limited-express'},{routeId:'line-99310',trainTypeId:'tokyu-limited-express'}]}

const metroLines=[
  ['line-28001','ginza','NONE',[]],['line-28002','marunouchi','NONE',[]],['line-28003','hibiya','COMPLETE',['hibiya-tobu']],
  ['line-28004','tozai','COMPLETE',['tozai-chuo-sobu','tozai-toyo-rapid']],['line-28005','chiyoda','COMPLETE',['chiyoda-joban-odakyu','chiyoda-odakyu-tama']],
  ['line-28006','yurakucho','COMPLETE',['yurakucho-tobu','yurakucho-seibu']],['line-28008','hanzomon','COMPLETE',['denentoshi-hanzomon-tobu']],
  ['line-28009','namboku','COMPLETE',['namboku-saitama-tokyu','namboku-saitama-tokyu-sotetsu-ebina','namboku-saitama-tokyu-sotetsu-shonandai']],['line-28010','fukutoshin','COMPLETE',['fukutoshin-tokyu-minatomirai','fukutoshin-tobu-minatomirai','fukutoshin-seibu-minatomirai','fukutoshin-tokyu-sotetsu-shonandai']]
];
const inventory=metroLines.map(([lineId,slug,status,throughServiceIds])=>({lineId,slug,status,throughService:status==='NONE'?'none':'current',throughServiceIds,sources:source}));
for(const entry of inventory){
  const route=routeMap.get(entry.lineId),linePath=route?.workspace?.linePath;if(!linePath)throw new Error(`${entry.lineId}: canonical line workspace missing`);
  const line=read(linePath);line.throughServiceStatus=entry.throughService;line.throughServiceIds=[...entry.throughServiceIds];
  line.throughServiceVerifiedAt='2026-09-11';line.throughServiceSource=official;write(linePath,line);
}
const catalog=read('data/tokyo-service-patterns.json');
const trainTypes=[...catalog.trainTypes];
for(const type of [
  {id:'tokyo-metro-rapid',operatorId:'tokyo-metro',names:{ja:'快速',ko:'쾌속',en:'Rapid'},priority:25},
  {id:'tokyo-metro-commuter-rapid',operatorId:'tokyo-metro',names:{ja:'通勤快速',ko:'통근쾌속',en:'Commuter Rapid'},priority:27},
  {id:'fukutoshin-f-liner-express',names:{ja:'Fライナー急行',ko:'F라이너 급행',en:'F Liner Express'},priority:45},
  {id:'tobu-rapid-express',operatorId:'tobu',names:{ja:'快速急行',ko:'쾌속급행',en:'Rapid Express'},priority:45},
  {id:'tokyu-limited-express',operatorId:'tokyu',names:{ja:'特急',ko:'특급',en:'Limited Express'},priority:45}
])if(!trainTypes.some(item=>item.id===type.id))trainTypes.push(type);
const managedThroughIds=new Set(services.map(service=>service.id)),managedPatternIds=new Set(throughPatterns.map(pattern=>pattern.id));
const preserved=(catalog.servicePatterns||[]).filter(pattern=>!managedPatternIds.has(pattern.id)&&!(pattern.throughServiceId&&managedThroughIds.has(pattern.throughServiceId)));
catalog.schemaVersion=2;catalog.verifiedAt='2026-09-11';catalog.metroLineInventory=inventory;catalog.trainTypes=trainTypes;catalog.servicePatterns=[...preserved,...throughPatterns];
const throughFile=read('data/through-services.json'),preservedServices=(throughFile.services||[]).filter(service=>!managedThroughIds.has(service.id));
throughFile.schemaVersion=2;throughFile.inventoryScope='Tokyo Metro current reciprocal through services';throughFile.verifiedAt='2026-09-11';throughFile.services=[...preservedServices,...services];
const endpoints=throughPatterns.flatMap(pattern=>[pattern.originStationId,pattern.destinationStationId]);
catalog.destinations=[...new Map(endpoints.map(id=>{const station=routes.flatMap(route=>route.stations).find(item=>stationId(item)===id);return[id,{stationId:id,names:{ja:station?.ja||'',ko:station?.ko||'',en:station?.romaji||''}}]})).values()];
catalog.serviceJourneys=throughPatterns.map(pattern=>({id:`journey-${pattern.id}`,baseRouteId:pattern.baseRouteId,originStationId:pattern.originStationId,destinationStationId:pattern.destinationStationId,trainTypeId:pattern.trainTypeId,throughServiceId:pattern.throughServiceId,directionId:pattern.directionId,servicePatternId:pattern.id,status:'active'}));
write('data/through-services.json',throughFile);write('data/tokyo-service-patterns.json',catalog);
console.log(JSON.stringify({metroLines:inventory.length,throughServices:services.length,throughPatterns:throughPatterns.length,serviceJourneys:catalog.serviceJourneys.length,destinations:catalog.destinations.length},null,2));
