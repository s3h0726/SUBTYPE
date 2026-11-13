import{thailandPresentation,decodeThailandPayload,setThailandNameEvidence}from'./thailand-network.js';
import{decodeRoutePayload}from'./route-payload.js';
import{configureUKNames,ukPresentation,ukPatternRoute}from'./uk-network.js';
import{configureFranceNames,francePatternRoute,franceSearchNames,franceStationPresentation}from'./france-network.js';
import{configureTaiwanNetwork,taiwanKoreanPresentation}from'./taiwan-network.js';
import{hongKongRouteBlockReason}from'./hong-kong-policy.js';
import{koreanServiceIsCurrent}from'./korean-service-resolver.js';
import{KR_LINE1_INTEGRATION_RELATIONS}from'./korean-preview-access-data.js';
import{isKoreanResearch,assertKoreanResearchRoute,koreanLine1ServiceDetails}from'./korean-research-resolver.js';
import{koreanRouteBlockReason}from'./korean-access-policy.js';
import{FEATURE_FLAGS}from'./feature-flags.js';
const text=(...values)=>String(values.find(value=>typeof value==='string'&&value.trim())||'').normalize('NFC').trim();
const cleanDisplayLineName=value=>text(value).replace(/^JR/,'').replace(/^東京メトロ/,'').replace(/^都営/,'').replace(/^大阪メトロ/,'');
// The editor saves a small JSON file independently of the generated catalog.
// Apply it in the browser as well: a failed bulk rebuild must not hide edits.
let editorNameOverrides={operators:{},lines:{},stations:{},services:{}};
async function loadEditorNameOverrides(){
  try{
    const response=await fetch(new URL('data/editor-overrides.json',document.baseURI),{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const source=await response.json();
    editorNameOverrides={operators:source?.operators||{},lines:source?.lines||{},stations:source?.stations||{},services:source?.services||{}};
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
// Published Korean bus payloads spell Latin initials phonetically to satisfy
// a Hangul-only publication validator. Restore the official source letter names
// for display/typing without altering route IDs, coordinates, or stored payloads.
const KR_BUS_SPELLED_LATIN=['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지'];
// Convert only obvious English-letter markers when no original source survives.
// Do not rewrite native Korean words such as 이동, 유동, 비봉 or 에이스.
function restoreKrBusUnambiguousMarkers(value){
 const input=String(value||'').normalize('NFC');
 const table=KR_BUS_ROUTE_LETTERS.filter(([reading])=>reading!=='지')
   .sort((a,b)=>b[0].length-a[0].length);
 const alternatives=table.map(([reading])=>reading).join('|');
 const pattern=new RegExp('(^|[\\s(·,./\\-])((?:'+alternatives+')+)(?=$|[\\s)·,./\\-]|[0-9]|동|관|블록|구역|출구|게이트|주차장|승강장|정류장|타워|마트)','gu');
 return input.replace(pattern,(match,before,letters)=>{
   if(['이','오','유'].includes(letters))return match;
   let rest=letters,latin='';
   while(rest){
     const entry=table.find(([reading])=>rest.startsWith(reading));
     if(!entry)return match;
     latin+=entry[1];rest=rest.slice(entry[0].length);
   }
   return latin?before+latin:match;
 });
}

// Also used by gameplay and free drive after repository canonicalization.
export function restoreKrBusLatinStation(station){
 if(!station||typeof station!=='object')return station;
 const sources=[station.sourceName,station.sourceStopName,station.originalStopName,station.names?.sourceName]
   .filter(value=>typeof value==='string'&&value.trim()).map(value=>value.normalize('NFC').trim());
 const official=sources.find(value=>/[A-Za-z]/.test(value))||sources[0]||'';
 const previous=String(station.ko||station.names?.ko||'').normalize('NFC').trim();
 if(!previous)return station;
 const hasLatinSource=/[A-Za-z]/.test(official);
 const restoredWithoutSource=hasLatinSource?previous:(!official?restoreKrBusUnambiguousMarkers(previous):previous);
 if(!hasLatinSource&&restoredWithoutSource===previous)return station;
 const letterName=c=>KR_BUS_SPELLED_LATIN[c.toUpperCase().charCodeAt(0)-65];
 const spelled=official.replace(/[A-Za-z]/g,letterName);
 const aptSpelled=official.replace(/APT/gi,'아파트').replace(/[A-Za-z]/g,letterName);
 // Allow punctuation differences; never replace native Korean words without
 // an independently documented Latin source.
 const compact=value=>value.replace(/[.·,，:;_\-()\[\]{}\/\s]/g,'');
 const match=previous===spelled||compact(previous)===compact(spelled);
 const matchApt=previous===aptSpelled||compact(previous)===compact(aptSpelled);
 if(hasLatinSource&&!match&&!matchApt)return station;
 const restored=hasLatinSource?(matchApt&&!match?official.replace(/APT/gi,'아파트'):official):restoredWithoutSource;
 if(restored===previous)return station;
 const corrected={...station,ko:restored,ja:restored,kana:restored,romaji:restored,
  koAliases:[...new Set([...(station.koAliases||[]),previous])],
  nameLocalization:hasLatinSource?'원본 영문 알파벳 표기 유지':'건물·승강장 알파벳 표기 복원'};
 // normalizeStation and the shared repository may prioritize nested labels.
 if(station.names)corrected.names={...station.names,ko:restored,ja:restored,kana:restored,en:restored};
 if(station.canonicalStationNames)corrected.canonicalStationNames={...station.canonicalStationNames,ko:restored,ja:restored,kana:restored,en:restored};
 if(station.nameKo)corrected.nameKo=restored;
 return corrected;
}
// Only decode an entire *bus route code*, not arbitrary Korean words.
// Seoul/GBIS source builders transliterated Latin route letters to Hangul.
const KR_BUS_ROUTE_LETTERS=[
 ['에이치','H'],['더블유','W'],['제트','Z'],['브이','V'],
 ['에프','F'],['제이','J'],['케이','K'],['에스','S'],
 ['에이','A'],['아이','I'],['엘','L'],['엠','M'],['엔','N'],
 ['비','B'],['씨','C'],['디','D'],['이','E'],
 ['오','O'],['피','P'],['큐','Q'],['알','R'],['티','T'],['유','U'],
 ['엑스','X'],['와이','Y']
];
function restoreKrBusRouteCode(value){
 const original=String(value??'').normalize('NFC').trim();
 // 공식 계통 접미사는 보존하고 노선번호 부분만 복원한다.
 const variant=original.match(/^([^()]+)(\([^()]+\))$/);
 if(variant){const code=restoreKrBusRouteCode(variant[1]);return code===variant[1]?original:code+variant[2]}
 if(!original||!/[가-힣]/.test(original))return original;
 let remaining=original,restored='',letters=0;
 while(remaining){
  const digit=remaining.match(/^[0-9]+/);
  if(digit){restored+=digit[0];remaining=remaining.slice(digit[0].length);continue}
  const punct=remaining.match(/^[-·]/);
  if(punct){restored+=punct[0];remaining=remaining.slice(1);continue}
  const letter=KR_BUS_ROUTE_LETTERS.find(([ko])=>remaining.startsWith(ko));
  if(!letter)return original;
  restored+=letter[1];remaining=remaining.slice(letter[0].length);letters++;
 }
 // No unmapped syllable is ever converted, and a genuine Korean route word
 // cannot accidentally be rewritten merely because it contains '비' or '이'.
 return letters?restored:original;
}
// Route title formatter shared by the game and the country-specific editor.
// Convert all documented A-Z letter pronunciations only in Korean bus line
// names, not station names, identifiers, coordinates or foreign routes.
function restoreKrBusRouteName(raw){
 const first=String(raw?.line?.ko||raw?.names?.ko||raw?.nameKo||'').normalize('NFC');
 if(!first)return raw;
 const source=String(raw?.sourceRouteNumber||raw?.originalRouteNumber||raw?.routeNumber||'').normalize('NFC').trim();
 const decodedSource=restoreKrBusRouteCode(source);
 const official=/^[A-Za-z0-9-]+(?:\([^()]+\))?$/.test(source)?source.toUpperCase():decodedSource;
 const verified=/^[A-Z0-9-]+(?:\([^()]+\))?$/.test(official)&&/[A-Z]/.test(official)
    &&(/[A-Za-z]/.test(source)||!source.includes('지'));
 const codeBase=verified?official.replace(/\([^()]+\)$/,''):'';
 const letterNames=KR_BUS_ROUTE_LETTERS.filter(([ko])=>ko!=='지').sort((a,b)=>b[0].length-a[0].length);
 const letterRE='(?:'+letterNames.map(([ko])=>ko).join('|')+')+';
 function decode(token){
  let value=String(token||'').replace(/\s+/g,''),result='',letters=0;
  while(value){
   const number=value.match(/^[0-9]+/);
   if(number){result+=number[0];value=value.slice(number[0].length);continue}
   if(value[0]==='-'){result+='-';value=value.slice(1);continue}
   const latin=value.match(/^[A-Za-z]/);
   if(latin){result+=latin[0].toUpperCase();value=value.slice(1);letters++;continue}
   const piece=letterNames.find(([ko])=>value.startsWith(ko));
   if(!piece)return '';
   result+=piece[1];value=value.slice(piece[0].length);letters++;
  }
  return letters&&/^[A-Z0-9-]+$/.test(result)?result:'';
 }
 function label(value){
  if(typeof value!=='string'||!value)return value;
  let title=value.normalize('NFC');
  // Source-backed codes resolve the ambiguous "지" spelling (G vs Z).
  if(codeBase){
   const spoken=codeBase.replace(/[A-Z]/g,l=>KR_BUS_SPELLED_LATIN[l.charCodeAt(0)-65]);
   const escaped=spoken.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   title=title.replace(new RegExp(escaped+'(?=번|선|$|[\\s)·,/:\\[(])','gu'),codeBase);
   // Preserve a slash/hyphen separating a verified alphabet prefix from digits,
   // e.g. "지/10" means G/10 or Z/10 according to the official route code.
   const officialParts=codeBase.match(/^([A-Z]+)([0-9]+)$/);
   const spokenParts=spoken.match(/^([가-힣]+)([0-9]+)$/);
   if(officialParts&&spokenParts&&officialParts[2]===spokenParts[2]){
    const prefix=spokenParts[1];
    const withSeparator=new RegExp(prefix+'([/\\\\-])'+spokenParts[2]+'(?=번|$|[\\s)·,])','gu');
    title=title.replace(withSeparator,(match,sep)=>officialParts[1]+sep+officialParts[2]);
   }
  }
  const swap=(pattern,fn)=>{title=title.replace(pattern,(...args)=>{
   const offset=args[args.length-2],full=args[args.length-1],data=fn(args);
   const prefix=full.slice(0,offset+(data.before||'').length);
   const rawCode=data.code;
   // "어린이100번" is not the E100 bus; single native syllables
   // embedded in Korean words need an explicit source code to be changed.
   if(!codeBase&&/[가-힣]$/.test(prefix)&&rawCode.replace(/[0-9\s-]/g,'').length===1)return args[0];
   const converted=decode(rawCode);
   return converted?(data.before||'')+converted+(data.after||''):args[0];
  })};
  swap(new RegExp('('+letterRE+'[0-9]+(?:-[0-9]+)*)(?=번|$|\\(|[\\s·,])','gu'),
   args=>({code:args[1]}));
  swap(new RegExp('([0-9]+'+letterRE+'(?:-[0-9]+)*)(?=번|$|\\(|[\\s·,])','gu'),
   args=>({code:args[1]}));
  swap(new RegExp('('+letterRE+')\\s+([0-9]+(?:-[0-9]+)*)(?=번|$|\\(|[\\s·,])','gu'),
   args=>({code:args[1]+args[2]}));
  // Letter sequences without digits are still meaningful line-name tokens.
  swap(new RegExp('(^|[\\s(·,/\\-:\\[])('+letterRE+')(?=번|선|$|[\\s)·,/\\-:\\]])','gu'),
   args=>({before:args[1],code:args[2]}));
  swap(new RegExp('('+letterRE+')(?=번|선(?:$|[\\s)·,]))','gu'),
   args=>({code:args[1]}));
  title=title.replace(/(^|[\s(·,/:])([A-Z])\s+([0-9]+(?:-[0-9]+)*)(?=번|$|\(|[\s·,])/g,
   (match,before,letter,number)=>before+letter+number);
  title=title.replace(/(^|[\s(·,/:])([a-z]+[0-9]+(?:-[0-9]+)*)(?=번|$|\(|[\s·,])/g,
   (match,before,code)=>before+code.toUpperCase());
  return title;
 }
 const oldNames=raw?.names?.ko,oldPassenger=raw?.passengerLineName,oldKo=raw?.nameKo;
 const corrected=label(first),newNames=label(oldNames),newPassenger=label(oldPassenger),newKo=label(oldKo);
 const changeLine=corrected!==first,changeNames=newNames!==oldNames,
  changePassenger=newPassenger!==oldPassenger,changeKo=newKo!==oldKo;
 if(!changeLine&&!changeNames&&!changePassenger&&!changeKo)return raw;
 const answer={...raw};
 if(changeLine){
  const oldLine=raw.line||{};
  answer.line={...oldLine,ko:corrected,aliases:[...new Set([...(oldLine.aliases||[]),first])]};
  for(const lang of ['ja','en'])if(!oldLine[lang]||oldLine[lang]===first)answer.line[lang]=corrected;
 }
 if(changeNames)answer.names={...raw.names,ko:newNames,aliases:[...new Set([...(raw.names.aliases||[]),oldNames])]};
 if(changePassenger)answer.passengerLineName=newPassenger;
 if(changeKo)answer.nameKo=newKo;
 if(verified)Object.assign(answer,{routeNumber:official,legacyPhoneticRouteNumber:source});
 return answer;
}
export function restoreKrBusLatinRoute(raw){
 if(raw?.countryId!=='kr'||!(['bus','village_bus','express_bus','brt'].includes(raw.mode)||String(raw.id||'').startsWith('kr-bus-')))return raw;
 raw=restoreKrBusRouteName(raw);
 const correct=stations=>Array.isArray(stations)?stations.map(restoreKrBusLatinStation):stations;
 const original=raw.verifiedJourneys;
 const journeys=Array.isArray(original)?original.map(journey=>{
  const before=journey.stations||[],stations=correct(before);
  // Direction labels often contain an exact 'origin → destination' prefix.
  const from=before[0],to=before.at(-1),newFrom=stations[0],newTo=stations.at(-1);
  const oldPair=(from?.ko||'')+' → '+(to?.ko||''),newPair=(newFrom?.ko||'')+' → '+(newTo?.ko||'');
  const fixLabel=label=>typeof label==='string'&&oldPair!==' → '&&label.includes(oldPair)
    ?label.replace(oldPair,newPair):label;
  const pattern=journey.patternName||{},service=journey.service||{};
  return{...journey,stations,patternName:{...pattern,ko:fixLabel(pattern.ko)},
   service:{...service,nameKo:fixLabel(service.nameKo)}};
 }):original;
 return{...raw,stations:correct(raw.stations),verifiedJourneys:journeys};
}
const KR_RAIL_TRAIN_ACRONYMS={케이티엑스:'KTX',아이티엑스:'ITX',에스알티:'SRT',지티엑스:'GTX',에이알이엑스:'AREX',이엠유:'EMU',디엠유:'DMU'};
export function restoreKrRailTrainLabel(value){
 if(typeof value!=='string')return value;
 return value.replace(/케이티엑스|아이티엑스|에스알티|지티엑스|에이알이엑스|이엠유|디엠유/gu,part=>KR_RAIL_TRAIN_ACRONYMS[part]||part);
}
function isKoreanRailRoute(raw){
 return raw?.countryId==='kr'&&(/rail|metro|subway|tram/i.test(String(raw.mode||'')+' '+String(raw.category||''))||String(raw.id||'').startsWith('kr-rail-'));
}
// The imported source may contain phonetic spellings of official train acronyms.
// Keep IDs, official timetable evidence, stations and source data unchanged.
export function restoreKrRailServiceNames(raw){
 if(!isKoreanRailRoute(raw))return raw;
 const rename=(object,keys)=>{
  if(!object)return object;
  const result={...object};
  for(const key of keys)if(typeof result[key]==='string')result[key]=restoreKrRailTrainLabel(result[key]);
  return result;
 };
 return {...raw,
  services:Array.isArray(raw.services)?raw.services.map(service=>rename(service,['nameKo','nameJa','nameEn','ko','ja','en'])):raw.services,
  verifiedJourneys:Array.isArray(raw.verifiedJourneys)?raw.verifiedJourneys.map(journey=>({
   ...journey,patternName:rename(journey.patternName,['ko','ja','en']),
   service:rename(journey.service,['nameKo','nameJa','nameEn','ko','ja','en'])
  })):raw.verifiedJourneys
 };
}
export function normalizeLine(raw={},defaults={}){
  raw=restoreKrRailServiceNames(restoreKrBusLatinRoute(raw));
  if(raw.countryId==='kr'&&raw.canonicalContract==='kr-canonical-v1')raw={...raw,line:{...raw.line,ja:raw.line?.ko,en:raw.line?.ko},operator:{...raw.operator,ja:raw.operator?.ko,en:raw.operator?.ko}};
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
  const serviceStationPool=raw.countryId==='kr'&&raw.schemaVersion===2?[...stations,...(raw.verifiedJourneys||[]).flatMap(j=>j.stations||[])]:stations;
  if(Array.isArray(serviceSource))for(let index=0;index<serviceSource.length;index++){const service=serviceSource[index],stops=[];let invalid=false;if(Array.isArray(service.stops))for(const stop of service.stops){const station=serviceStationPool.find(item=>item.id===stop||item.sourceId===stop);if(!station){console.error(`${id}/${service.id||index}: service stop not found`,stop);invalid=true;break}stops.push(station.id)}if(!invalid&&stops.length>=2)services.push({id:text(service.id)||`service-${index+1}`,nameJa:text(service.nameJa,service.ja)||'各駅停車',nameKo:(isKoreanRailRoute(raw)?restoreKrRailTrainLabel(text(editorNameOverrides.services[service.id],editorNameOverrides.services['legacy:'+id+':'+service.id],service.nameKo,service.ko)):text(editorNameOverrides.services[service.id],editorNameOverrides.services['legacy:'+id+':'+service.id],service.nameKo,service.ko))||'각역정차',nameEn:text(service.nameEn,service.en)||'Local',...(raw.countryId==='tw'?{nameZh:service.nameZh||service.names?.zh||raw.line?.zh||''}:{}),stops})}
  const allStationsService=services.find(service=>service.stops.length===allStationIds.length&&service.stops.every((stationId,index)=>stationId===allStationIds[index]));if(allStationsService){services.splice(services.indexOf(allStationsService),1);services.unshift(allStationsService)}else if((raw.countryId!=='tw'||raw.category==='custom')&&raw.countryId!=='hk'&&raw.countryId!=='th'&&(raw.countryId!=='fr'||raw.category==='custom')&&!(raw.countryId==='kr'&&raw.schemaVersion===2))services.unshift({id:'local',nameJa:raw.countryId==='tw'?'각역정차':'各駅停車',nameKo:'각역정차',nameEn:'Local',...(raw.countryId==='tw'?{nameZh:raw.line?.zh||'自訂路線'}:{}),stops:allStationIds});
  // 한국 이름 편집은 대표 경로뿐 아니라 분기·급행·반대 방향의 모든 정차지에 적용한다.
  const verifiedJourneys=Array.isArray(raw.verifiedJourneys)?raw.verifiedJourneys.map(journey=>{
    const calls=raw.countryId==='kr'?(journey.stations||[]).map(station=>{
      const edited=stationEdits[station.id]??stationEdits[station.ja];
      if(typeof edited!=='string'||!edited.trim())return station;
      return{...station,ko:edited.trim(),...(station.names?{names:{...station.names,ko:edited.trim()}}:{}),canonicalStationNames:station.canonicalStationNames||{ja:station.ja,kana:station.kana,ko:station.ko,en:station.romaji},routeSpecificStationName:true,editorStationNameOverride:true};
    }):journey.stations;
    if(raw.countryId==='kr'&&calls?.length){const old=journey.stations,oldPair=old[0].ko+' → '+old.at(-1).ko,newPair=calls[0].ko+' → '+calls.at(-1).ko;
      const fix=value=>typeof value==='string'?value.replace(oldPair,newPair):value;
      journey={...journey,stations:calls,patternName:{...journey.patternName,ko:fix(journey.patternName?.ko)},service:journey.service?{...journey.service,nameKo:fix(journey.service.nameKo)}:journey.service};}
    const override=editorNameOverrides.services[journey.service?.id]||editorNameOverrides.services[journey.id];
    if(typeof override!=='string'||!override.trim())return journey;
    const displayName=isKoreanRailRoute(raw)?restoreKrRailTrainLabel(override.trim()):override.trim();
    return {...journey,patternName:{...(journey.patternName||{}),ko:displayName},service:journey.service?{...journey.service,nameKo:displayName}:journey.service};
  }):raw.verifiedJourneys;
  const lineTheme=verifiedTheme||{code:resolvedCode,color:text(raw.lineColor,raw.color)||'#777777',style:category==='jr'?'jr':category==='subway'?'metro':'private',operatorMark:text(operatorRaw.en,operatorRaw.ja)||'RAILWAY',colorVerified:false,colorSource:raw.colorSource||'Imported source data'};
  const editorLine=editorNameOverrides.lines[id]||{};
  const editorColor=/^#[0-9a-fA-F]{6}$/.test(editorLine.color||'')?editorLine.color:lineTheme.color;
  const normalizedOperatorId=text(raw.operatorId,operatorRaw.id)||category,assetOperatorId=({'jr-east':'op-2','jr-central':'op-3','tokyo-metro':'op-18','toei':'op-119'})[normalizedOperatorId]||normalizedOperatorId;
  raw.operatorAsset=raw.operatorAsset?.asset?raw.operatorAsset:null;
  const lineJa=cleanDisplayLineName(text(lineRaw.ja,raw.nameJa,raw.japanese,raw.name,lineRaw.en,'新路線')),operatorJa=text(operatorRaw.ja,raw.operatorNameJa,raw.operatorName,operatorRaw.en,'Railway'),operatorKo=text(operatorRaw.ko),lineKo=text(lineRaw.ko);
  return{...raw,verifiedJourneys,id,category,countryId:text(raw.countryId)||'jp',mode:text(raw.mode)||'rail',operatorId:text(raw.operatorId,operatorRaw.id)||category,operator:{...(raw.countryId==='th'?{th:operatorRaw.th}:{}),...(raw.countryId==='tw'?{...operatorRaw,zh:text(operatorRaw.zh,operatorRaw.nameZh,operatorRaw.names?.zh)}:{}),ja:operatorJa,en:text(operatorRaw.en,raw.operatorNameEn,raw.operatorName,operatorRaw.ja,'Transport'),ko:text(editorNameOverrides.operators[normalizedOperatorId],operatorKo)||'MISSING_KOREAN_NAME'},line:{...lineRaw,ja:lineJa,en:text(lineRaw.en,raw.nameEn,raw.english,raw.name,lineRaw.ja,lineRaw.ko,'New Route'),ko:text(editorLine.ko,lineKo)||'MISSING_KOREAN_NAME'},code:resolvedCode,lineColor:editorColor,loop:!!raw.loop,lineTheme:{...lineTheme,color:editorColor},services,stations}
}
function normalizeLazyLine(raw={}){const normalized=normalizeLine({...raw,stations:[],services:[]},{category:raw.category});const searchStations=Array.isArray(raw.searchStations)?raw.searchStations:[];
 const editedNames=raw.countryId==='kr'?Object.values(editorNameOverrides.stations[raw.id]||{}).filter(v=>typeof v==='string'):[];
 return{...normalized,lazy:true,lazySource:raw.lazySource,stationCount:Number(raw.stationCount)||0,searchStations:[...new Set([...searchStations,...editedNames])],stationSequence:Array.isArray(raw.stationSequence)?raw.stationSequence:[]}}
function validLine(line){return Array.isArray(line.stations)&&line.stations.length>=2&&line.stations.every(station=>station.ja||station.kana||station.romaji||station.ko)}
async function fetchJson(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error(`${url.pathname}: HTTP ${response.status}`);try{return await decodeRoutePayload(await response.json())}catch(error){throw new Error(`${url.pathname}: invalid JSON (${error.message})`)}}
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
const ukGeometryRequests=new Map(),ukGeometrySegments={};
async function loadUKGeometry(files=['data/uk/generated/geometry.json']){
 await Promise.all(files.map(file=>{if(!/^data\/uk\/generated\/(?:geometry\.json|geometry\/\d+_-?\d+(?:_long)?\.json)$/.test(file))throw Error('UK_GEOMETRY_SOURCE');if(!ukGeometryRequests.has(file))ukGeometryRequests.set(file,fetchJson(new URL(file,document.baseURI)).then(d=>{Object.assign(ukGeometrySegments,d.segments)}).catch(e=>{ukGeometryRequests.delete(file);throw e}));return ukGeometryRequests.get(file)}));
 return ukGeometrySegments;
}
export async function loadTransportData(countryId='jp',koreaMode='released'){
  if(countryId==='fr'){
    await loadEditorNameOverrides();
    const data=await fetchJson(new URL('data/fr/generated/index.json',document.baseURI));
    if(data.country?.id!=='fr')throw Error('프랑스 노선 목록을 확인할 수 없습니다.');
    configureFranceNames(editorNameOverrides);
    const lines=data.routes.filter(route=>route.playable&&route.geometryReady&&route.serviceCount>0).map(raw=>{
      const route=normalizeLazyLine(raw);
      return {...route,searchStations:franceSearchNames(route)};
    });
    const operators=data.operators.map(operator=>({...operator,names:{...operator.names,
      ko:text(editorNameOverrides.operators[operator.id],operator.names.ko)}}));
    return {country:data.country,operators,lines,stations:[],assets:{},errors:[],
      counts:lines.reduce((counts,line)=>(counts[line.category]=(counts[line.category]||0)+1,counts),{}),
      source:'france-verified-lazy-network',sourceNotice:data.sourceNotice};
  }
  if(countryId==='uk'){
    await loadEditorNameOverrides();
    const data=await fetchJson(new URL('data/uk/generated/index.json',document.baseURI));
    configureUKNames(editorNameOverrides,data.stationNameIndex||[]);
    if(data.country?.id!=='uk')throw Error('UK_COUNTRY_IDENTITY');
    const lines=data.routes.filter(r=>r.playable&&r.geometryReady&&r.serviceCount>0).map(r=>ukPresentation(normalizeLazyLine(r)));
    return{country:data.country,operators:data.operators.map(o=>({...o,names:{...o.names,ko:editorNameOverrides.operators[o.id]||o.names.ko}})),lines,stations:[],assets:{},errors:[],counts:lines.reduce((m,r)=>(m[r.category]=(m[r.category]||0)+1,m),{}),source:'uk-verified-lazy-network',sourceNotice:data.sourceNotice};
  }

  if(countryId==='th'){
    await loadEditorNameOverrides();
    // 선택적 보정표가 없어도 기존 태국 노선은 계속 불러온다.
    try{const reviewed=await fetchJson(new URL('data/th/namuwiki-station-names.json?v=20261103-r2',document.baseURI));setThailandNameEvidence(reviewed?.countryId==='th'?reviewed.stations||{}:{})}catch(error){console.warn('태국 역명 보정표를 불러오지 못했습니다.',error);setThailandNameEvidence({})}
    const data=await fetchJson(new URL('data/th/generated/index.json',document.baseURI));
    if(data.country?.id!=='th')throw Error('태국 국가 식별자가 올바르지 않습니다.');
    const lines=data.routes.filter(r=>r.operationalStatus==='OPERATIONAL'&&r.playable&&r.geometryReady&&r.serviceCount>0).map(r=>thailandPresentation(normalizeLazyLine(r)));
    return{country:data.country,operators:data.operators,lines,stations:[],assets:{},errors:[],counts:lines.reduce((m,l)=>(m[l.category]=(m[l.category]||0)+1,m),{}),source:'thailand-lazy-network',sourceNotice:data.sourceNotice};
  }
  await loadEditorNameOverrides();
  const withEditorOperators=operators=>(operators||[]).map(operator=>({
    ...operator,names:{...(operator.names||{}),
      ...(typeof editorNameOverrides.operators[operator.id]==='string'&&editorNameOverrides.operators[operator.id].trim()?{ko:editorNameOverrides.operators[operator.id].trim()}:{})}
  }));
  if(countryId==='tw'){
    const data=await fetchJson(new URL('data/tw/generated/network.json?v=tw-timetable-20261111',document.baseURI));
    const all=data.lines.map(raw=>taiwanKoreanPresentation(normalizeLine(raw)));
    const patterns=(data.patterns||[]).map(pattern=>{
      const nameKo=editorNameOverrides.services[pattern.id];
      return typeof nameKo==='string'&&nameKo.trim()?{
        ...pattern,nameKo:nameKo.trim(),displayNames:{...(pattern.displayNames||{}),ko:nameKo.trim()}
      }:pattern;
    });
    configureTaiwanNetwork(all,patterns);
    const lines=all.filter(l=>l.visibility!=='internal'&&l.playable&&l.geometryReady&&l.taiwanServices.length);
    return{country:data.country,operators:withEditorOperators(data.operators).map(o=>({...o,names:{...o.names,ja:o.names.ko}})),lines,stations:[],assets:data.assets||{},errors:[],counts:lines.reduce((m,l)=>(m[l.category]=(m[l.category]||0)+1,m),{}),fallbackUsed:false,source:'taiwan-physical-and-service-network'};
  }
  if(countryId==='hk'){
    const data=globalThis.TRT_HONG_KONG_INDEX||await fetchJson(new URL('data/hk/generated/index.json',document.baseURI));
    if(data.country?.id!=='hk')throw new Error('홍콩 데이터 지역 식별자가 올바르지 않습니다.');
    const lines=(data.routes||[]).map(normalizeLazyLine);
    return{country:data.country,operators:withEditorOperators(data.operators),lines,stations:[],assets:data.assets||{},errors:[],counts:lines.reduce((c,r)=>({...c,[r.category]:(c[r.category]||0)+1}),{}),audit:data.audit,checkedAt:data.checkedAt,fallbackUsed:false,source:'hong-kong-lazy-index'};
  }
  if(countryId==='jp'){
    const data=await loadRailData();
    data.operators=withEditorOperators(data.operators);
    // Small, independently sourced monorail not present in MLIT's 610-line
    // canonical runtime index. Never mutate or replace existing catalog lines.
    const extra=globalThis.TRT_DISNEY_RESORT_ROUTE;
    if(extra&&!data.lines.some(line=>line.id===extra.id)){
      const line=normalizeLine(extra,{category:'monorail'});
      data.lines.push(line);
      data.counts.other=(data.counts.other||0)+1;
    }
    return data;
  }
  if(FEATURE_FLAGS.koreaRoutesReset)return{country:{id:'kr',names:{ko:'대한민국',en:'South Korea'}},operators:[],lines:[],stations:[],assets:{operators:{},lines:{}},errors:[],counts:{},fallbackUsed:false,source:'korea-reset'};
  const data=globalThis.TRT_KOREA_INDEX||await fetchJson(new URL('data/kr/generated/index.json',document.baseURI));
  const lines=(data.routes||[]).filter(route=>(!route.serviceWindows||route.serviceWindows.some(koreanServiceIsCurrent))&&route.releaseStatus!=='research'&&route.playStatus!=='RESEARCH_PLAYABLE'&&!route.previewContract&&!koreanRouteBlockReason(route)).map(normalizeLazyLine),operators=data.operators||[],counts=(lines).reduce((result,route)=>({...result,[route.category]:(result[route.category]||0)+1}),{});
  return{country:data.country,operators:withEditorOperators(operators),lines,stations:[],assets:data.assets||{operators:{},lines:{}},errors:[],counts,fallbackUsed:false,source:'korea-lazy-index'}
}
const franceGeometryRequests=new Map();
function franceGeometryFile(file){
  if(!/^data\/fr\/generated\/geometry\/-?\d+_-?\d+\.json$/.test(file))throw Error('프랑스 선로 자료 경로가 잘못되었습니다.');
  if(franceGeometryRequests.has(file)){
    const previous=franceGeometryRequests.get(file);
    franceGeometryRequests.delete(file);
    franceGeometryRequests.set(file,previous);
    return previous;
  }
  const pending=fetchJson(new URL(file,document.baseURI)).catch(error=>{
    if(franceGeometryRequests.get(file)===pending)franceGeometryRequests.delete(file);
    throw error;
  });
  franceGeometryRequests.set(file,pending);
  if(franceGeometryRequests.size>32)franceGeometryRequests.delete(franceGeometryRequests.keys().next().value);
  return pending;
}
export async function hydrateRailLine(route){if(!route?.lazy)return route;
 if(route.countryId==='fr'){
  if(!/^data\/fr\/generated\/routes\/[a-z0-9-]+\.json$/.test(route.lazySource))throw Error('프랑스 노선 자료 경로가 잘못되었습니다.');
  const [raw,tiles]=await Promise.all([
    fetchJson(new URL(route.lazySource,document.baseURI)),
    Promise.all(route.geometryFiles.map(franceGeometryFile)),
  ]);
  if(raw.countryId!=='fr'||raw.id!==route.id||!raw.patterns?.length)throw Error('프랑스 노선 자료가 일치하지 않습니다.');
  const owner=normalizeLine(raw);
  owner.franceWays=Object.assign({},...tiles.map(tile=>tile.ways));
  owner.stationCatalog=raw.stationCatalog.map((station,index)=>franceStationPresentation(normalizeStation(station,index,owner.code)));
  const first=francePatternRoute(owner,owner.patterns[0]);
  return {...first,services:owner.services};
 }
 if(route.countryId==='uk'){
  const [raw,segments]=await Promise.all([fetchJson(new URL(route.lazySource,document.baseURI)),loadUKGeometry(route.geometryFiles)]);
  if(raw.countryId!=='uk'||raw.id!==route.id||!raw.patterns?.length)throw Error('UK_ROUTE_IDENTITY');
  const owner=ukPresentation(normalizeLine({...raw,ukGeometry:segments}));
  const first=ukPatternRoute(owner,owner.patterns[0]);return{...first,services:owner.services,patterns:owner.patterns,stationCatalog:owner.stationCatalog};
 }

 if(route.countryId==='th'){
  const response=await fetch(new URL(route.lazySource,document.baseURI));if(!response.ok)throw Error('태국 노선 파일 로딩 실패: '+response.status);
  const data=await decodeThailandPayload(await response.json());if(data.route.id!==route.id)throw Error('태국 상세 노선 불일치');return thailandPresentation(normalizeLine(data.route));
 }const key=String(route.lazySource).replace(/^\.\//,''),embedded=globalThis.TRT_EMBEDDED_NATIONWIDE?.routes?.[key];if(embedded)return normalizeLine(embedded.route||embedded,{category:route.category});const url=new URL(key,document.baseURI),payload=await fetchJson(url);const sourceRoute=Array.isArray(payload.routes)?payload.routes.find(item=>item?.id===route.id):(payload.route||payload);if(!sourceRoute)throw new Error('일본 노선 분할 파일에 해당 노선이 없습니다: '+route.id);if(route.countryId==='kr'&&/^kr-service-\d+$/.test(route.id)&&(!sourceRoute||sourceRoute.id!==route.id||sourceRoute.sourceServiceId!==route.sourceServiceId))throw Error('KOREAN_SERVICE_IDENTITY_MISMATCH');if(route.countryId==='hk'&&(sourceRoute.countryId!=='hk'||sourceRoute.id!==route.id))throw new Error('홍콩 노선 파일 식별자가 일치하지 않습니다.');const normalized=normalizeLine(sourceRoute,{category:route.category});if(normalized.countryId==='hk'&&hongKongRouteBlockReason(normalized))throw new Error(hongKongRouteBlockReason(normalized));normalized.directions=sourceRoute.directions||[];if(route.id==='line-28002'){normalized.stationCount=Number(route.stationCount)||28;normalized.searchStations=route.searchStations||[];}if(route.countryId==='kr'){normalized.playable=route.playable;normalized.visibility=route.visibility;normalized.dataKind=route.dataKind;normalized.serviceNote=route.serviceNote;normalized.operatorId=route.operatorId;normalized.operator={...normalized.operator,...route.operator,ko:text(editorNameOverrides.operators[route.operatorId],route.operator?.ko,normalized.operator?.ko)};normalized.operators=route.operators||normalized.operators;normalized.operatorIds=route.operatorIds||normalized.operatorIds;normalized.countryId='kr';normalized.regionId=route.regionId;normalized.passengerLineId=route.passengerLineId;normalized.passengerLineName=route.passengerLineName;normalized.operatingPatternId=route.operatingPatternId;normalized.serviceValidationStatus=route.serviceValidationStatus;normalized.geometryReady=route.geometryReady===true;normalized.geometryStatus=route.geometryStatus||normalized.geometryStatus;normalized.releaseStatus=route.releaseStatus||normalized.releaseStatus;normalized.integratedLine1=route.integratedLine1===true;normalized.line1Service=route.line1Service||null;normalized.gameValidationStatus=route.gameValidationStatus||normalized.gameValidationStatus;}return normalized}
export async function loadRoutes(){const data=await loadRailData();return{routes:data.lines,errors:data.errors,counts:data.counts,fallbackUsed:data.fallbackUsed}}
export async function loadStationMaster(){const workspaceData=globalThis.TRT_EMBEDDED_LINE_WORKSPACES;if(!Array.isArray(workspaceData?.routes))return[];const map=new Map;for(const route of workspaceData.routes)for(const station of route.stations||[])if(!map.has(station.id))map.set(station.id,normalizeStation(station,map.size,route.code));return[...map.values()]}
