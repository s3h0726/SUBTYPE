import{hongKongRouteBlockReason}from'./hong-kong-policy.js';
import{KR_LINE1_INTEGRATION_RELATIONS}from'./korean-preview-access-data.js';
import{isKoreanResearch,assertKoreanResearchRoute,koreanLine1ServiceDetails}from'./korean-research-resolver.js';
import{koreanRouteBlockReason}from'./korean-access-policy.js';
const text=(...values)=>String(values.find(value=>typeof value==='string'&&value.trim())||'').normalize('NFC').trim();
const cleanDisplayLineName=value=>text(value).replace(/^JR/,'').replace(/^東京メトロ/,'').replace(/^都営/,'').replace(/^大阪メトロ/,'');
// The editor saves a small JSON file independently of the generated catalog.
// Apply it in the browser as well: a failed bulk rebuild must not hide edits.
let editorNameOverrides={operators:{},lines:{},stations:{}};
async function loadEditorNameOverrides(){
  try{
    const response=await fetch(new URL('data/editor-overrides.json',document.baseURI),{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const source=await response.json();
    editorNameOverrides={operators:source?.operators||{},lines:source?.lines||{},stations:source?.stations||{}};
  }catch(error){console.warn('Editor names unavailable; using built names',error)}
}
export function normalizeStation(raw={},index=0,lineCode='ST'){
  const source=Array.isArray(raw)?{id:raw[0],ja:raw[1],kana:raw[2],romaji:raw[3],ko:raw[4],latitude:raw[5],longitude:raw[6],koAliases:raw[7]}:raw;
  const sourceNames=source.names||{};
  const fallbackName=text(source.nameJa,source.ja,source.stationName,source.japanese,source.name,source.nameKo,source.ko,source.romaji,source.en,source.kana,source.hiragana);
  const ja=text(sourceNames.ja,source.nameJa,source.ja,source.stationName,source.japanese,source.name,sourceNames.ko,fallbackName);
  const curated=globalThis.TRT_KOREAN_OVERRIDES?.[ja];
  const rawLatitude=source.latitude??source.coordinates?.lat,rawLongitude=source.longitude??source.coordinates?.lng,latitude=Number(rawLatitude),longitude=Number(rawLongitude);
  const aliases=[...(Array.isArray(source.koAliases)?source.koAliases:[]),...(curated?.aliases||[])].filter(x=>typeof x==='string'&&x.trim()).map(x=>x.normalize('NFC').trim());
  const internalId=text(source.internalId,source.id,source.sourceId,source.code)||`${lineCode}-internal-${index+1}`;
  const explicitCode=text(source.officialCode,source.stationCode),arrayCode=Array.isArray(raw)&&/^[A-Z]{1,4}\d{1,3}$/.test(text(source.id))?text(source.id):'',officialCode=explicitCode||arrayCode;
  const ko=text(sourceNames.ko,source.nameKo,source.ko)||'MISSING_KOREAN_NAME';
  return{...source,id:internalId,internalId,officialCode,stationCode:officialCode,hasOfficialStationCode:source.hasOfficialStationCode??!!officialCode,stationCodeSource:source.stationCodeSource||text(source.codeSource)||(officialCode?(explicitCode?'source-explicit':'bundled-verified-array'):'none'),ja,kana:source.countryId==='hk'?'':text(sourceNames.kana,source.kana,source.hiragana,ko),romaji:text(sourceNames.en,source.romaji,source.en,ko),ko,koMissing:ko==='MISSING_KOREAN_NAME',koAliases:[...new Set(aliases)],koVerified:!!source.koVerified,koSource:source.koSource||'',latitude:Number.isFinite(latitude)&&rawLatitude!==null?latitude:null,longitude:Number.isFinite(longitude)&&rawLongitude!==null?longitude:null}
}
// Keep a stop's railway/platform coordinate separate from the shared station
// identity used by search, names and transfers. Geometry vertices are [lat,lon].
function applyRouteTrackCoordinates(raw,stations){
  const segments=raw?.directedSegments;
  if(raw?.countryId==='kr'||raw?.geometryReady!==true||!Array.isArray(segments)
    ||segments.length!==stations.length-1||stations.length<2)return stations;
  const valid=point=>Array.isArray(point)&&point.length>=2
    &&Number.isFinite(Number(point[0]))&&Number.isFinite(Number(point[1]))
    &&Math.abs(Number(point[0]))<=90&&Math.abs(Number(point[1]))<=180;
  const km=(a,b)=>Math.hypot((Number(a[0])-Number(b[0]))*111.195,
    (Number(a[1])-Number(b[1]))*111.195*Math.cos(Number(b[0])*Math.PI/180));
  return stations.map((station,i)=>{
    const segment=i<segments.length?segments[i]:segments.at(-1);
    const point=i<segments.length?segment?.geometry?.[0]:segment?.geometry?.at(-1);
    const current=[station.latitude,station.longitude];
    const expected=i<segments.length?segment?.fromStationId:segment?.toStationId;
    if(String(expected)!==String(station.id)||!valid(point)||!valid(current))return station;
    const offset=km(point,current);
    // A few legacy 'verified' lines start well outside their actual station.
    // Never relocate the marker kilometres away from its canonical location.
    return offset<=0.5
      ?{...station,latitude:Number(point[0]),longitude:Number(point[1]),coordinateSource:'line-track-geometry'}
      :{...station,coordinateSource:station.coordinateSource||'station-master-fallback',trackEndpointOffsetKm:+offset.toFixed(3)};
  });
}
export function normalizeLine(raw={},defaults={}){
  const category=text(raw.category,defaults.category)||'other',code=text(raw.code,raw.lineCode),operatorRaw=raw.operator||{},lineRaw=raw.line||raw.names||{};
  const id=text(raw.id,raw.lineId)||`line-${category}-${crypto.randomUUID?.()||Date.now()}`;
  const verifiedTheme=globalThis.TRT_LINE_THEMES?.[id],resolvedCode=verifiedTheme?.code||code||'—';
  const stationEdits=editorNameOverrides.stations[id]||{};
  const stations=applyRouteTrackCoordinates(raw,Array.isArray(raw.stations)?raw.stations.map((station,index)=>{const normalized=normalizeStation(station,index,resolvedCode),verifiedCode=verifiedTheme?.stationCodes?.[normalized.ja];return verifiedCode?{...normalized,officialCode:verifiedCode,stationCode:verifiedCode,hasOfficialStationCode:true,stationCodeSource:verifiedTheme.colorSource||'verified-line-theme'}:normalized}):[]).map(station=>{
    const edited=stationEdits[station.id]??stationEdits[station.ja];
    if(typeof edited!=='string'||!edited.trim())return station;
    return{...station,canonicalStationNames:station.canonicalStationNames||{ja:station.ja,kana:station.kana,ko:station.ko,en:station.romaji},ko:edited.trim(),routeSpecificStationName:true,editorStationNameOverride:true};
  });
  const serviceSource=Array.isArray(raw.services)?raw.services:globalThis.TRT_SERVICE_CATALOG?.[id];
  const allStationIds=stations.map(station=>station.id),services=[];
  if(Array.isArray(serviceSource))for(let index=0;index<serviceSource.length;index++){const service=serviceSource[index],stops=[];let invalid=false;if(Array.isArray(service.stops))for(const stop of service.stops){const station=stations.find(item=>item.id===stop||item.sourceId===stop);if(!station){console.error(`${id}/${service.id||index}: service stop not found`,stop);invalid=true;break}stops.push(station.id)}if(!invalid&&stops.length>=2)services.push({id:text(service.id)||`service-${index+1}`,nameJa:text(service.nameJa,service.ja)||'各駅停車',nameKo:text(service.nameKo,service.ko)||'각역정차',nameEn:text(service.nameEn,service.en)||'Local',stops})}
  const allStationsService=services.find(service=>service.stops.length===allStationIds.length&&service.stops.every((stationId,index)=>stationId===allStationIds[index]));if(allStationsService){services.splice(services.indexOf(allStationsService),1);services.unshift(allStationsService)}else if(raw.countryId!=='hk'&&!(raw.countryId==='kr'&&raw.schemaVersion===2))services.unshift({id:'local',nameJa:'各駅停車',nameKo:'각역정차',nameEn:'Local',stops:allStationIds});
  const lineTheme=verifiedTheme||{code:resolvedCode,color:text(raw.lineColor,raw.color)||'#777777',style:category==='jr'?'jr':category==='subway'?'metro':'private',operatorMark:text(operatorRaw.en,operatorRaw.ja)||'RAILWAY',colorVerified:false,colorSource:raw.colorSource||'Imported source data'};
  const editorLine=editorNameOverrides.lines[id]||{};
  const editorColor=/^#[0-9a-fA-F]{6}$/.test(editorLine.color||'')?editorLine.color:lineTheme.color;
  const normalizedOperatorId=text(raw.operatorId,operatorRaw.id)||category,assetOperatorId=({'jr-east':'op-2','jr-central':'op-3','tokyo-metro':'op-18','toei':'op-119'})[normalizedOperatorId]||normalizedOperatorId;
  raw.operatorAsset=raw.operatorAsset?.asset?raw.operatorAsset:null;
  const lineJa=cleanDisplayLineName(text(lineRaw.ja,raw.nameJa,raw.japanese,raw.name,lineRaw.en,'新路線')),operatorJa=text(operatorRaw.ja,raw.operatorNameJa,raw.operatorName,operatorRaw.en,'Railway'),operatorKo=text(operatorRaw.ko),lineKo=text(lineRaw.ko);
  return{...raw,id,category,countryId:text(raw.countryId)||'jp',mode:text(raw.mode)||'rail',operatorId:text(raw.operatorId,operatorRaw.id)||category,operator:{ja:operatorJa,en:text(operatorRaw.en,raw.operatorNameEn,raw.operatorName,operatorRaw.ja,'Transport'),ko:text(editorNameOverrides.operators[normalizedOperatorId],operatorKo)||'MISSING_KOREAN_NAME'},line:{...lineRaw,ja:lineJa,en:text(lineRaw.en,raw.nameEn,raw.english,raw.name,lineRaw.ja,lineRaw.ko,'New Route'),ko:text(editorLine.ko,lineKo)||'MISSING_KOREAN_NAME'},code:resolvedCode,lineColor:editorColor,loop:!!raw.loop,lineTheme:{...lineTheme,color:editorColor},services,stations}
}
function normalizeLazyLine(raw={}){const normalized=normalizeLine({...raw,stations:[],services:[]},{category:raw.category});return{...normalized,lazy:true,lazySource:raw.lazySource,stationCount:Number(raw.stationCount)||0,searchStations:Array.isArray(raw.searchStations)?raw.searchStations:[],stationSequence:Array.isArray(raw.stationSequence)?raw.stationSequence:[]}}
function validLine(line){return Array.isArray(line.stations)&&line.stations.length>=2&&line.stations.every(station=>station.ja||station.kana||station.romaji||station.ko)}
async function fetchJson(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error(`${url.pathname}: HTTP ${response.status}`);try{return await response.json()}catch(error){throw new Error(`${url.pathname}: invalid JSON (${error.message})`)}}
export async function loadRailData(){
  await loadEditorNameOverrides();
  const canonical=globalThis.TRT_EMBEDDED_LINE_WORKSPACES;
  const nationwide=globalThis.TRT_EMBEDDED_NATIONWIDE;
  const lite=globalThis.TRT_JAPAN_LITE_INDEX;
  if(!Array.isArray(canonical?.routes)&&Array.isArray(lite?.routes)&&lite.routes.length){
    const lines=lite.routes.filter(route=>route?.id&&route.lazySource).map(normalizeLazyLine);
    if(!lines.length)throw new Error('일본 최신 노선 목록을 읽지 못했습니다.');
    const counts=lines.reduce((map,line)=>({...map,[line.category]:(map[line.category]||0)+1}),{});
    return{operators:lite.operators||[],lines,stations:[],assets:lite.assets||{},errors:[],counts,fallbackUsed:false,source:'japan-canonical-lazy'};
  }
  let input=Array.isArray(canonical?.routes)?canonical.routes:[];
  let fallbackUsed=!input.length;
  const backupRoutes=()=>Object.values(nationwide?.routes||{}).map(record=>record?.route||record).filter(route=>route?.id&&Array.isArray(route.stations)&&route.stations.length>=2);
  if(!input.length)input=backupRoutes();
  if(!input.length){
    // The full Japanese workspace can exceed 20MB. If its script was blocked,
    // keep the game functional using the small nationwide catalog and fetch
    // the selected line's complete stations/geometry only when it is chosen.
    let index;
    try{
      index=await fetchJson(new URL('data/nationwide/index.json',document.baseURI));
    }catch(error){
      throw new Error('일본 철도 경량 목록도 불러오지 못했습니다: '+(error?.message||error));
    }
    if(!Array.isArray(index?.routes)||!index.routes.length)throw new Error('일본 철도 노선 목록이 비어 있습니다.');
    const lines=index.routes.filter(route=>route?.id&&route.lazySource).map(normalizeLazyLine);
    if(!lines.length)throw new Error('일본 철도 개별 노선 경로를 확인할 수 없습니다.');
    const counts=lines.reduce((map,line)=>({...map,[line.category]:(map[line.category]||0)+1}),{});
    console.warn('Japan catalog: full workspace unavailable; using on-demand nationwide index',lines.length);
    return{operators:index.operators||[],lines,stations:[],assets:canonical?.assets||{},errors:[],counts,fallbackUsed:true,source:'nationwide-lazy-index'};
  }
  const errors=[];
  const convert=items=>items.flatMap(route=>{
    try{
      const line=normalizeLine(route,{category:route.category});
      if(!Array.isArray(line.stations)||line.stations.length<2){errors.push(String(route?.id||'unknown')+': fewer than 2 stations');return[]}
      return[line];
    }catch(error){errors.push(String(route?.id||'unknown')+': '+(error?.message||error));return[]}
  });
  let lines=convert(input);
  if(!lines.length&&!fallbackUsed){lines=convert(backupRoutes());fallbackUsed=true}
  if(!lines.length)throw new Error('일본 철도 노선 복원 실패: '+(errors[0]||'노선 데이터 없음'));
  const operators=Array.isArray(canonical?.index?.operators)&&!fallbackUsed?canonical.index.operators:Array.isArray(nationwide?.index?.operators)?nationwide.index.operators:[];
  const stationMap=new Map;
  for(const line of lines)for(const station of line.stations)if(!stationMap.has(station.id))stationMap.set(station.id,station);
  const stations=[...stationMap.values()];
  const counts=[...new Set(lines.map(line=>line.category))].reduce((result,category)=>({...result,[category]:lines.filter(line=>line.category===category).length}),{});
  if(fallbackUsed)console.warn('Japan catalog: loaded emergency nationwide backup',lines.length,'routes');
  if(errors.length)console.warn('Japan catalog skipped invalid routes:',errors.length,errors.slice(0,5));
  return{operators,lines,stations,assets:canonical?.assets||{},errors,counts,fallbackUsed,source:fallbackUsed?'nationwide-emergency-backup':'canonical-line-workspaces'}
}
// A research preview is never promoted into an officially released service.
// Replace only the public Line 1 selector; preserve the five legacy source files
// and keep each OSM journey's own validated stopping calls and track geometry.
export function integrateKoreanLine1Index(published,preview){
  if(preview?.previewContract!=='kr-research-v1'||!Array.isArray(preview.routes)||preview.routes.some(route=>!isKoreanResearch(route)))throw Error('INVALID_LINE1_PREVIEW_INDEX');
  const obsolete=new Set(['13695367','13695368']); // discontinued Dongincheon limited express
  const integration={relationIds:KR_LINE1_INTEGRATION_RELATIONS};
  const merged=preview.routes.filter(route=>integration.relationIds.includes(String(route.sourceRelationId))&&route.passengerLineId==='kr-osm-line-8691899'&&!obsolete.has(String(route.sourceRelationId))&&route.lazy&&route.lazySource&&route.geometryReady===true&&route.playable===true).map(route=>({...route,integratedLine1:true,line1Service:koreanLine1ServiceDetails(route)}));
  if(!merged.length)throw Error('NO_VERIFIED_LINE1_RESEARCH_PREVIEWS');
  const ids=new Set(merged.map(route=>route.id));if(ids.size!==merged.length)throw Error('DUPLICATE_LINE1_RESEARCH_ROUTE');
  const legacy=(published.routes||[]),isOldLine1=route=>/^kr-metro-1-(?:main|gyeongin|gyeongbu|gwangmyeong|seodongtan)$/.test(String(route.id));
  const first=legacy.findIndex(isOldLine1);if(first<0)throw Error('MISSING_LEGACY_LINE1_BASELINE');
  const routes=[...legacy.slice(0,first),...merged,...legacy.slice(first)].filter(route=>!isOldLine1(route));
  const operators=[...new Map([...(published.operators||[]),...(preview.operators||[])].map(operator=>[operator.id,operator])).values()];
  return{...published,routes,operators,integratedLine1:{researchServices:merged.length,replacedLegacySections:legacy.filter(isOldLine1).length,releaseStatus:'research',officialReleased:0}};
}
export async function loadTransportData(countryId='jp',koreaMode='released'){
  if(countryId==='hk'){
    const data=globalThis.TRT_HONG_KONG_INDEX||await fetchJson(new URL('data/hk/generated/index.json',document.baseURI));
    if(data.country?.id!=='hk')throw new Error('홍콩 데이터 지역 식별자가 올바르지 않습니다.');
    const lines=(data.routes||[]).map(normalizeLazyLine);
    return{country:data.country,operators:data.operators||[],lines,stations:[],assets:data.assets||{},errors:[],counts:lines.reduce((c,r)=>({...c,[r.category]:(c[r.category]||0)+1}),{}),audit:data.audit,checkedAt:data.checkedAt,fallbackUsed:false,source:'hong-kong-lazy-index'};
  }
  if(countryId==='jp'){
    const data=await loadRailData();
    // Small, independently sourced monorail not present in MLIT's 610-line
    // canonical runtime index. Never mutate or replace existing catalog lines.
    const extra=globalThis.TRT_DISNEY_RESORT_ROUTE;
    if(extra&&!data.lines.some(line=>line.id===extra.id)){
      const line=normalizeLine(extra,{category:'other'});
      data.lines.push(line);
      data.counts.other=(data.counts.other||0)+1;
    }
    return data;
  }
  const data=globalThis.TRT_KOREA_INDEX||await fetchJson(new URL('data/kr/generated/index.json',document.baseURI));
  const lines=(data.routes||[]).filter(route=>!koreanRouteBlockReason(route)).map(normalizeLazyLine),operators=data.operators||[],counts=(lines).reduce((result,route)=>({...result,[route.category]:(result[route.category]||0)+1}),{});
  return{country:data.country,operators,lines,stations:[],assets:data.assets||{operators:{},lines:{}},errors:[],counts,fallbackUsed:false,source:'korea-lazy-index'}
}
export async function hydrateRailLine(route){if(!route?.lazy)return route;const key=String(route.lazySource).replace(/^\.\//,''),embedded=globalThis.TRT_EMBEDDED_NATIONWIDE?.routes?.[key];if(embedded)return normalizeLine(embedded.route||embedded,{category:route.category});const url=new URL(key,document.baseURI),payload=await fetchJson(url);const sourceRoute=Array.isArray(payload.routes)?payload.routes.find(item=>item?.id===route.id):(payload.route||payload);if(!sourceRoute)throw new Error('일본 노선 분할 파일에 해당 노선이 없습니다: '+route.id);if(route.countryId==='kr'&&/^kr-service-\d+$/.test(route.id)&&(!sourceRoute||sourceRoute.id!==route.id||sourceRoute.sourceServiceId!==route.sourceServiceId))throw Error('KOREAN_SERVICE_IDENTITY_MISMATCH');if(route.countryId==='hk'&&(sourceRoute.countryId!=='hk'||sourceRoute.id!==route.id))throw new Error('홍콩 노선 파일 식별자가 일치하지 않습니다.');const normalized=normalizeLine(sourceRoute,{category:route.category});if(normalized.countryId==='hk'&&hongKongRouteBlockReason(normalized))throw new Error(hongKongRouteBlockReason(normalized));normalized.directions=sourceRoute.directions||[];if(route.id==='line-28002'){normalized.stationCount=Number(route.stationCount)||28;normalized.searchStations=route.searchStations||[];}if(route.countryId==='kr'){normalized.playable=route.playable;normalized.visibility=route.visibility;normalized.dataKind=route.dataKind;normalized.serviceNote=route.serviceNote;normalized.operatorId=route.operatorId;normalized.operator={...normalized.operator,...route.operator};normalized.operators=route.operators||normalized.operators;normalized.operatorIds=route.operatorIds||normalized.operatorIds;normalized.countryId='kr';normalized.regionId=route.regionId;normalized.passengerLineId=route.passengerLineId;normalized.passengerLineName=route.passengerLineName;normalized.operatingPatternId=route.operatingPatternId;normalized.serviceValidationStatus=route.serviceValidationStatus;normalized.geometryReady=route.geometryReady===true;normalized.geometryStatus=route.geometryStatus||normalized.geometryStatus;normalized.releaseStatus=route.releaseStatus||normalized.releaseStatus;normalized.integratedLine1=route.integratedLine1===true;normalized.line1Service=route.line1Service||null;normalized.gameValidationStatus=route.gameValidationStatus||normalized.gameValidationStatus;}return normalized}
export async function loadRoutes(){const data=await loadRailData();return{routes:data.lines,errors:data.errors,counts:data.counts,fallbackUsed:data.fallbackUsed}}
export async function loadStationMaster(){const workspaceData=globalThis.TRT_EMBEDDED_LINE_WORKSPACES;if(!Array.isArray(workspaceData?.routes))return[];const map=new Map;for(const route of workspaceData.routes)for(const station of route.stations||[])if(!map.has(station.id))map.set(station.id,normalizeStation(station,map.size,route.code));return[...map.values()]}
