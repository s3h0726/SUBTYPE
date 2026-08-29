const LINE_CATEGORIES=['jr','subway','private','other','shinkansen'];
const DATA_FILES={operators:new URL('../data/operators/operators.json',import.meta.url),stations:new URL('../data/stations/tokyo-stations.json',import.meta.url),lines:[new URL('../data/lines/jr.json',import.meta.url),new URL('../data/lines/subway.json',import.meta.url),new URL('../data/lines/private.json',import.meta.url),new URL('../data/lines/other.json',import.meta.url),new URL('../data/lines/shinkansen.json',import.meta.url)]};
const NATIONWIDE_INDEX=new URL('../data/nationwide/index.json',import.meta.url);
const fallbackLines=[
 {id:'line-11302',category:'jr',operatorId:'jr-east',operator:{ja:'JR東日本',en:'JR East',ko:'JR 동일본'},line:{ja:'山手線',en:'Yamanote Line',ko:'야마노테선'},code:'JY',lineColor:'#80c241',loop:true,coverage:'fallback',stations:[['JY01','東京','とうきょう','Tokyo','도쿄',35.681236,139.767125],['JY02','神田','かんだ','Kanda','칸다',35.691676,139.770883],['JY03','秋葉原','あきはばら','Akihabara','아키하바라',35.698353,139.773114],['JY04','御徒町','おかちまち','Okachimachi','오카치마치',35.707438,139.774632],['JY05','上野','うえの','Ueno','우에노',35.713768,139.777254]]},
 {id:'line-28001',category:'subway',operatorId:'tokyo-metro',operator:{ja:'東京メトロ',en:'Tokyo Metro',ko:'도쿄 메트로'},line:{ja:'銀座線',en:'Ginza Line',ko:'긴자선'},code:'G',lineColor:'#f39700',loop:false,coverage:'fallback',stations:[['G01','渋谷','しぶや','Shibuya','시부야',35.658034,139.701636],['G02','表参道','おもてさんどう','Omote-sando','오모테산도',35.665247,139.712314],['G03','外苑前','がいえんまえ','Gaiemmae','가이엔마에',35.670527,139.717857],['G04','青山一丁目','あおやまいっちょうめ','Aoyama-itchome','아오야마잇초메',35.672765,139.724159],['G05','赤坂見附','あかさかみつけ','Akasaka-mitsuke','아카사카미쓰케',35.676845,139.737253]]}
];
const text=(...values)=>String(values.find(value=>typeof value==='string'&&value.trim())||'').normalize('NFC').trim();
const LINE_KO_OVERRIDES={'御堂筋線':'미도스지선','谷町線':'다니마치선','四つ橋線':'요쓰바시선','中央線':'주오선','千日前線':'센니치마에선','堺筋線':'사카이스지선','長堀鶴見緑地線':'나가호리쓰루미료쿠치선','今里筋線':'이마자토스지선','南港ポートタウン線':'뉴트램'};
const cleanDisplayLineName=value=>text(value).replace(/^JR/,'').replace(/^東京メトロ/,'').replace(/^都営/,'').replace(/^大阪メトロ/,'');
export function normalizeStation(raw={},index=0,lineCode='ST'){
  const source=Array.isArray(raw)?{id:raw[0],ja:raw[1],kana:raw[2],romaji:raw[3],ko:raw[4],latitude:raw[5],longitude:raw[6],koAliases:raw[7]}:raw;
  const fallbackName=text(source.nameJa,source.ja,source.stationName,source.japanese,source.name,source.nameKo,source.ko,source.romaji,source.en,source.kana,source.hiragana);
  const ja=text(source.nameJa,source.ja,source.stationName,source.japanese,source.name,fallbackName);
  const curated=globalThis.TRT_KOREAN_OVERRIDES?.[ja];
  const latitude=Number(source.latitude),longitude=Number(source.longitude);
  const aliases=[...(Array.isArray(source.koAliases)?source.koAliases:[]),...(curated?.aliases||[])].filter(x=>typeof x==='string'&&x.trim()).map(x=>x.normalize('NFC').trim());
  const internalId=text(source.internalId,source.id,source.sourceId,source.code)||`${lineCode}-internal-${index+1}`;
  const explicitCode=text(source.officialCode,source.stationCode),arrayCode=Array.isArray(raw)&&/^[A-Z]{1,4}\d{1,3}$/.test(text(source.id))?text(source.id):'',officialCode=explicitCode||arrayCode;
  const ko=text(curated?.ko,source.nameKo,source.ko)||'MISSING_KOREAN_NAME';
  return{...source,id:internalId,internalId,officialCode,stationCode:officialCode,hasOfficialStationCode:source.hasOfficialStationCode??!!officialCode,stationCodeSource:source.stationCodeSource||text(source.codeSource)||(officialCode?(explicitCode?'source-explicit':'bundled-verified-array'):'none'),ja,kana:text(source.kana,source.hiragana,fallbackName),romaji:text(source.romaji,source.en,fallbackName),ko,koMissing:ko==='MISSING_KOREAN_NAME',koAliases:[...new Set(aliases)],koVerified:!!curated||!!source.koVerified,koSource:curated?'Tokyu official station list · pronunciation reviewed':source.koSource||'',latitude:Number.isFinite(latitude)?latitude:null,longitude:Number.isFinite(longitude)?longitude:null}
}
export function normalizeLine(raw={},defaults={}){
  const category=text(raw.category,defaults.category)||'other',code=text(raw.code,raw.lineCode),operatorRaw=raw.operator||{},lineRaw=raw.line||{};
  const id=text(raw.id,raw.lineId)||`line-${category}-${crypto.randomUUID?.()||Date.now()}`;
  const verifiedTheme=globalThis.TRT_LINE_THEMES?.[id],resolvedCode=verifiedTheme?.code||code||'—';
  const stations=Array.isArray(raw.stations)?raw.stations.map((station,index)=>{const normalized=normalizeStation(station,index,resolvedCode),verifiedCode=verifiedTheme?.stationCodes?.[normalized.ja];return verifiedCode?{...normalized,officialCode:verifiedCode,stationCode:verifiedCode,hasOfficialStationCode:true,stationCodeSource:verifiedTheme.colorSource||'verified-line-theme'}:normalized}):[];
  const serviceSource=Array.isArray(raw.services)?raw.services:globalThis.TRT_SERVICE_CATALOG?.[id];
  const allStationIds=stations.map(station=>station.id),services=[];
  if(Array.isArray(serviceSource))for(let index=0;index<serviceSource.length;index++){const service=serviceSource[index],stops=[];let invalid=false;if(Array.isArray(service.stops))for(const stop of service.stops){const station=stations.find(item=>item.id===stop||item.sourceId===stop);if(!station){console.error(`${id}/${service.id||index}: service stop not found`,stop);invalid=true;break}stops.push(station.id)}if(!invalid&&stops.length>=2)services.push({id:text(service.id)||`service-${index+1}`,nameJa:text(service.nameJa,service.ja)||'各駅停車',nameKo:text(service.nameKo,service.ko)||'각역정차',nameEn:text(service.nameEn,service.en)||'Local',stops})}
  const allStationsService=services.find(service=>service.stops.length===allStationIds.length&&service.stops.every((stationId,index)=>stationId===allStationIds[index]));if(allStationsService){services.splice(services.indexOf(allStationsService),1);services.unshift(allStationsService)}else services.unshift({id:'local',nameJa:'各駅停車',nameKo:'각역정차',nameEn:'Local',stops:allStationIds});
  const lineTheme=verifiedTheme||{code:resolvedCode,color:text(raw.lineColor,raw.color)||'#777777',style:category==='jr'?'jr':category==='subway'?'metro':'private',operatorMark:text(operatorRaw.en,operatorRaw.ja)||'RAILWAY',colorVerified:false,colorSource:raw.colorSource||'Imported source data'};
  const normalizedOperatorId=text(raw.operatorId,operatorRaw.id)||category,assetOperatorId=({'jr-east':'op-2','jr-central':'op-3','tokyo-metro':'op-18','toei':'op-119'})[normalizedOperatorId]||normalizedOperatorId;
  raw.operatorAsset=globalThis.TRT_OPERATOR_ASSETS?.[assetOperatorId]||null;
  const lineJa=cleanDisplayLineName(text(lineRaw.ja,raw.nameJa,raw.japanese,raw.name,lineRaw.en,'新路線')),operatorJa=text(operatorRaw.ja,raw.operatorNameJa,raw.operatorName,operatorRaw.en,'Railway'),operatorKo=operatorJa==='Osaka Metro'?'오사카 메트로':text(operatorRaw.ko,raw.operatorNameKo),lineKo=LINE_KO_OVERRIDES[lineJa]||text(lineRaw.ko,raw.nameKo,raw.korean);
  return{...raw,id,category,operatorId:text(raw.operatorId,operatorRaw.id)||category,operator:{ja:operatorJa,en:text(operatorRaw.en,raw.operatorNameEn,raw.operatorName,operatorRaw.ja,'Railway'),ko:operatorKo||'MISSING_KOREAN_NAME'},line:{...lineRaw,ja:lineJa,en:text(lineRaw.en,raw.nameEn,raw.english,raw.name,lineRaw.ja,'New Line'),ko:lineKo||'MISSING_KOREAN_NAME'},code:resolvedCode,lineColor:lineTheme.color,loop:!!raw.loop,lineTheme,services,stations}
}
function normalizeLazyLine(raw={}){const normalized=normalizeLine({...raw,stations:[]},{category:raw.category});return{...normalized,lazy:true,lazySource:raw.lazySource,stationCount:Number(raw.stationCount)||0,searchStations:Array.isArray(raw.searchStations)?raw.searchStations:[],stationSequence:Array.isArray(raw.stationSequence)?raw.stationSequence:[]}}
function validLine(line){return Array.isArray(line.stations)&&line.stations.length>=2&&line.stations.every(station=>station.ja||station.kana||station.romaji||station.ko)}
async function fetchJson(url){const response=await fetch(url);if(!response.ok)throw new Error(`${url.pathname}: HTTP ${response.status}`);try{return await response.json()}catch(error){throw new Error(`${url.pathname}: invalid JSON (${error.message})`)}}
export async function loadRailData(){
  const workspaceData=globalThis.TRT_EMBEDDED_LINE_WORKSPACES;if(Array.isArray(workspaceData?.routes)&&workspaceData.routes.length){const lines=workspaceData.routes.map(route=>normalizeLine(route,{category:route.category})),operators=Array.isArray(workspaceData.index?.operators)?workspaceData.index.operators:[],stationMap=new Map;for(const line of lines)for(const station of line.stations)if(!stationMap.has(station.id))stationMap.set(station.id,station);const stations=[...stationMap.values()],counts=[...new Set(lines.map(line=>line.category))].reduce((result,category)=>({...result,[category]:lines.filter(line=>line.category===category).length}),{});return{operators,lines,stations,errors:[],counts,fallbackUsed:false,source:'line-workspaces'}}
  const embedded=globalThis.TRT_EMBEDDED_RAIL_DATA;
  let operators=[],stations=[],normalized=[],errors=[];
  if(embedded&&embedded.operators&&embedded.stations&&embedded.lines){
    operators=Array.isArray(embedded.operators.operators)?embedded.operators.operators:[];
    stations=Array.isArray(embedded.stations.stations)?embedded.stations.stations.map((station,index)=>normalizeStation(station,index)):[];
    normalized=LINE_CATEGORIES.flatMap(category=>{const file=embedded.lines[category];return Array.isArray(file?.routes)?file.routes.map(line=>normalizeLine(line,{category})):[]});
  }else{
    const requests=[fetchJson(DATA_FILES.operators),fetchJson(DATA_FILES.stations),...DATA_FILES.lines.map(fetchJson)];
    const [operatorResult,stationResult,...lineResults]=await Promise.allSettled(requests);
    const capture=(result,label)=>{if(result.status==='rejected')errors.push(`${label}: ${result.reason?.message||result.reason}`)};
    capture(operatorResult,'operators');capture(stationResult,'stations');lineResults.forEach((result,index)=>capture(result,`lines-${index+1}`));
    operators=operatorResult.status==='fulfilled'&&Array.isArray(operatorResult.value.operators)?operatorResult.value.operators:[];
    stations=stationResult.status==='fulfilled'&&Array.isArray(stationResult.value.stations)?stationResult.value.stations.map((station,index)=>normalizeStation(station,index)):[];
    normalized=lineResults.flatMap((result,index)=>result.status==='fulfilled'&&Array.isArray(result.value.routes)?result.value.routes.map(line=>normalizeLine(line,{category:LINE_CATEGORIES[index]})):[]);
  }
  try{const nationwide=globalThis.TRT_EMBEDDED_NATIONWIDE?.index||await fetchJson(NATIONWIDE_INDEX),known=new Set(normalized.map(line=>`${line.operator.ja}\u0000${line.line.ja}`));for(const raw of nationwide.routes||[]){const key=`${raw.operator?.ja}\u0000${raw.line?.ja}`;if(!known.has(key)){normalized.push(normalizeLazyLine(raw));known.add(key)}}operators=[...new Map([...operators,...(nationwide.operators||[])].map(operator=>[operator.id,operator])).values()]}catch(error){errors.push(`nationwide-index: ${error.message}`)}
  const lines=normalized.filter(line=>{const valid=line.lazy||validLine(line);if(!valid)console.warn(`Skipped invalid line: ${line.id}`);return valid});
  for(const fallback of fallbackLines.map(line=>normalizeLine(line)))if(!lines.some(line=>line.id===fallback.id))lines.push(fallback);
  const counts=[...new Set(lines.map(line=>line.category))].reduce((result,category)=>({...result,[category]:lines.filter(line=>line.category===category).length}),{});
  return{operators,lines,stations,errors,counts,fallbackUsed:lines.some(line=>line.coverage==='fallback')}
}
export async function hydrateRailLine(route){if(!route?.lazy)return route;const key=String(route.lazySource).replace(/^\.\//,''),embedded=globalThis.TRT_EMBEDDED_NATIONWIDE?.routes?.[key];if(embedded)return normalizeLine(embedded.route||embedded,{category:route.category});const url=new URL(key,document.baseURI),payload=await fetchJson(url);return normalizeLine(payload.route||payload,{category:route.category})}
export async function loadRoutes(){const data=await loadRailData();return{routes:data.lines,errors:data.errors,counts:data.counts,fallbackUsed:data.fallbackUsed}}
export async function loadStationMaster(){const workspaceData=globalThis.TRT_EMBEDDED_LINE_WORKSPACES;if(Array.isArray(workspaceData?.routes)){const map=new Map;for(const route of workspaceData.routes)for(const station of route.stations||[])if(!map.has(station.id))map.set(station.id,normalizeStation(station,map.size,route.code));return[...map.values()]}const embedded=globalThis.TRT_EMBEDDED_RAIL_DATA;if(embedded&&Array.isArray(embedded.stations?.stations))return embedded.stations.stations.map((station,index)=>normalizeStation(station,index));const result=await Promise.allSettled([fetchJson(DATA_FILES.stations)]);return result[0].status==='fulfilled'&&Array.isArray(result[0].value.stations)?result[0].value.stations.map((station,index)=>normalizeStation(station,index)):[]}
