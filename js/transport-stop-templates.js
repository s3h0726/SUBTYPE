import{resolveStationSignTemplate}from'./station-sign-templates.js';
const resolveJapaneseTemplate=resolveStationSignTemplate;

const koreanTemplates={
  krSeoulMetro:{style:'kr-seoul-metro',family:'kr-metro',referenceSource:'https://www.seoulmetro.co.kr/'},
  krKorail:{style:'kr-korail',family:'kr-korail',referenceSource:'user-supplied KORAIL Bupyeong station-nameboard reference; SUBTYPE rendition'},
  krGenericRail:{style:'kr-generic-rail',family:'kr-rail',referenceSource:'generic Korean railway nameboard'},
  krShinbundang:{style:'kr-shinbundang',family:'kr-private-metro',referenceSource:'https://www.shinbundang.co.kr/'},
  krBus:{style:'kr-bus-stop',family:'kr-bus',referenceSource:'official public route data'},
  krRiver:{style:'kr-river-terminal',family:'kr-river',referenceSource:'https://hangangbus.go.kr/'}
};

// The Seoul subway network shares routes with Korail. Its line-1 cards can
// contain BOTH Seoul Metro's 10 underground stations and Korail's suburban
// sections (e.g. Sinchang). Resolve the sign for the actual station, not only
// the shared route's operatorId. No line-color inference is involved.
const seoulMetroLine1=new Set(['서울','시청','종각','종로3가','종로5가','동대문','동묘앞','신설동','제기동','청량리']);
const korailLine3=new Set(['대화','주엽','정발산','마두','백석','대곡','화정','원당','원흥','삼송','지축']);
const korailLine4=new Set(['선바위','경마공원','대공원','과천','정부과천청사','인덕원','평촌','범계','금정','산본','수리산','대야미','반월','상록수','한대앞','중앙','고잔','초지','신길온천','정왕','오이도']);
const korailOperatorStationName=station=>String(station?.ko||station?.names?.ko||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/역$/,'').replace(/\s+/g,'');
export function isKorailOperatedRoute(route,station){
  if(route?.countryId!=='kr'||['bus','village_bus','express_bus','brt','river_bus','ferry'].includes(route.mode))return false;
  if(route.operatorId==='kr-korail')return true;
  const operator=String(route.operator?.ko||route.operatorNameKo||'').trim();
  if(operator==='한국철도공사'||operator==='코레일'||/^KORAIL$/i.test(operator))return true;
  if(route.operatorId!=='kr-seoulmetro-korail'||!station)return false;
  const name=korailOperatorStationName(station);
  if(!name)return false;
  const line=String(route.id||'').match(/^kr-(?:rail-seoul|metro)-([134])$/)?.[1];
  if(line==='1')return !seoulMetroLine1.has(name);
  if(line==='3')return korailLine3.has(name);
  if(line==='4')return korailLine4.has(name);
  return false;
}

export function resolveTransportStopTemplate(route,station){
  if(route?.countryId==='fr'){
    const style=route.operatorId==='fr-ratp'?'fr-ratp':route.operatorId==='fr-ratp-dev-lyon'?'fr-tcl':'fr-sncf';
    return {key:style,style,family:'fr-korean-first',referenceSource:route.sourceUrl};
  }
  if(route?.countryId==='uk'){const style=route.id==='uk-metrolink'?'uk-metrolink':route.id==='uk-elizabeth'?'uk-elizabeth':route.operatorId==='uk-first-rail-london'?'uk-overground':route.id==='uk-dlr'?'uk-dlr':route.id==='uk-glasgow-subway'?'uk-metro':route.category==='subway'?'uk-underground':route.category==='tram'?'uk-tram':route.category==='light_rail'?'uk-metro':'uk-national-rail';return{key:style,style,family:'uk-bilingual',referenceSource:'SUBTYPE original bilingual railway learning layout; no official logos'}}
  if(route?.countryId==='hk'){const mode=route.mode||route.category,style=mode==='light_rail'?'hk-light-rail':mode==='tram'?'hk-tram':mode==='funicular'?'hk-funicular':mode==='high_speed_rail'?'hk-hsr':'hk-mtr';return{key:style,style,family:style,referenceSource:route.sourceUrl||'Hong Kong transport learning layout; not an official sign'}}
  if(route?.countryId!=='kr')return resolveJapaneseTemplate(route);
  const key=route.mode==='river_bus'?'krRiver':['bus','village_bus','express_bus','brt'].includes(route.mode)?'krBus':route.operatorId==='kr-shinbundang'?'krShinbundang':isKorailOperatedRoute(route,station)?'krKorail':route.operatorId==='kr-seoul-metro'||route.operatorId==='kr-seoulmetro-korail'?'krSeoulMetro':'krGenericRail';
  return{key,...koreanTemplates[key]}
}

export const transportStopTemplates=koreanTemplates;
