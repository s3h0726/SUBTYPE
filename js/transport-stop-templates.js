import{resolveStationSignTemplate}from'./station-sign-templates.js';
const resolveJapaneseTemplate=resolveStationSignTemplate;

const koreanTemplates={
  krSeoulMetro:{style:'kr-seoul-metro',family:'kr-metro',referenceSource:'https://www.seoulmetro.co.kr/'},
  krKorail:{style:'kr-korail',family:'kr-commuter',referenceSource:'https://www.letskorail.com/'},
  krShinbundang:{style:'kr-shinbundang',family:'kr-private-metro',referenceSource:'https://www.shinbundang.co.kr/'},
  krBus:{style:'kr-bus-stop',family:'kr-bus',referenceSource:'official public route data'},
  krRiver:{style:'kr-river-terminal',family:'kr-river',referenceSource:'https://hangangbus.go.kr/'}
};

export function resolveTransportStopTemplate(route){
  if(route?.countryId==='hk'){const mode=route.mode||route.category,style=mode==='light_rail'?'hk-light-rail':mode==='tram'?'hk-tram':mode==='funicular'?'hk-funicular':mode==='high_speed_rail'?'hk-hsr':'hk-mtr';return{key:style,style,family:style,referenceSource:route.sourceUrl||'Hong Kong transport learning layout; not an official sign'}}
  if(route?.countryId!=='kr')return resolveJapaneseTemplate(route);
  // Interim Korean railway signage: Japanese JR East layout, until per-operator Korean originals are implemented.
  if(!['river_bus','bus','village_bus','express_bus'].includes(route.mode))return{...resolveJapaneseTemplate({...route,operatorId:'jr-east',stationSignTemplate:'jr-east'}),key:'kr-temp-jr-east',referenceSource:'JR East-style interim layout for Korean rail; not an official Korean sign'};
  const key=route.mode==='river_bus'?'krRiver':['bus','village_bus','express_bus'].includes(route.mode)?'krBus':route.operatorId==='kr-seoul-metro'?'krSeoulMetro':route.operatorId==='kr-shinbundang'?'krShinbundang':'krKorail';
  return{key,...koreanTemplates[key]}
}

export const transportStopTemplates=koreanTemplates;
