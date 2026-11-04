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

// Match the actual operator, never the route colour or the fact that a line
// belongs to the Korean railway network. Mixed-operator routes must supply an
// explicit Korail station segment rather than painting every stop as Korail.
export function isKorailOperatedRoute(route){
  if(route?.countryId!=='kr'||['bus','village_bus','express_bus','brt','river_bus','ferry'].includes(route.mode))return false;
  if(route.operatorId==='kr-korail')return true;
  const operator=String(route.operator?.ko||route.operatorNameKo||'').trim();
  return operator==='한국철도공사'||operator==='코레일'||/^KORAIL$/i.test(operator);
}

export function resolveTransportStopTemplate(route){
  if(route?.countryId==='hk'){const mode=route.mode||route.category,style=mode==='light_rail'?'hk-light-rail':mode==='tram'?'hk-tram':mode==='funicular'?'hk-funicular':mode==='high_speed_rail'?'hk-hsr':'hk-mtr';return{key:style,style,family:style,referenceSource:route.sourceUrl||'Hong Kong transport learning layout; not an official sign'}}
  if(route?.countryId!=='kr')return resolveJapaneseTemplate(route);
  const key=route.mode==='river_bus'?'krRiver':['bus','village_bus','express_bus','brt'].includes(route.mode)?'krBus':route.operatorId==='kr-seoul-metro'||route.operatorId==='kr-seoulmetro-korail'?'krSeoulMetro':route.operatorId==='kr-shinbundang'?'krShinbundang':isKorailOperatedRoute(route)?'krKorail':'krGenericRail';
  return{key,...koreanTemplates[key]}
}

export const transportStopTemplates=koreanTemplates;
