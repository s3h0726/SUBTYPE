import{escapeHtml}from'./utils.js';
import{railDataRepository}from'./rail-data-repository.js';

export function operatorLogoAsset(routeOrOperatorId){
  const operatorId=typeof routeOrOperatorId==='string'?routeOrOperatorId:routeOrOperatorId?.operatorId;
  if(operatorId==='sendaishikotsukyoku'||operatorId==='op-115')return{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Sendai_City_Subway_Logo.svg',asset:'https://commons.wikimedia.org/wiki/Special:FilePath/Sendai_City_Subway_Logo.svg',label:'센다이시 지하철',verified:true,source:'https://commons.wikimedia.org/wiki/File:Sendai_City_Subway_Logo.svg'};
  if(operatorId==='toei'||operatorId==='op-119'||routeOrOperatorId?.id==='line-99342'||routeOrOperatorId?.id==='line-99305')return{url:new URL('./data/operators/toei/logo.svg',document.baseURI).href,asset:new URL('./data/operators/toei/logo.svg',document.baseURI).href,label:'도쿄도 교통국',verified:true,source:'https://commons.wikimedia.org/wiki/File:Toei_Transportation_combined_logo.svg'};
  // Sanyo Electric Railway: original company symbol from Wikimedia Commons (not a generated approximation).
  if(['sanyodenkitetsudo','sanyo-electric-railway','sanyo','op-sanyo'].includes(operatorId)||/山陽電気鉄道|산요 전기철도/i.test(String(routeOrOperatorId?.operator?.ja||routeOrOperatorId?.operator?.ko||'')))return{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Sanyo_electric_railway_logo.svg',asset:'https://commons.wikimedia.org/wiki/Special:FilePath/Sanyo_electric_railway_logo.svg',label:'산요 전기철도',verified:true,source:'https://commons.wikimedia.org/wiki/File:Sanyo_electric_railway_logo.svg'};
  if(operatorId==='kobeshikotsukyoku')return{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Kobe_Municipal_Subway_Logo.svg',asset:'https://commons.wikimedia.org/wiki/Special:FilePath/Kobe_Municipal_Subway_Logo.svg',label:'고베 시영 지하철',verified:true,source:'https://commons.wikimedia.org/wiki/File:Kobe_Municipal_Subway_Logo.svg'};
  if(operatorId==='nishinihontetsudo')return{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Nishitetsu_logo_N.svg',asset:'https://commons.wikimedia.org/wiki/Special:FilePath/Nishitetsu_logo_N.svg',label:'니시테츠',verified:true,source:'https://commons.wikimedia.org/wiki/File:Nishitetsu_logo_N.svg'};
  if(operatorId==='kantotetsudo')return{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Kantetsu_Logo.svg',asset:'https://commons.wikimedia.org/wiki/Special:FilePath/Kantetsu_Logo.svg',label:'간토 철도',verified:true,source:'https://commons.wikimedia.org/wiki/File:Kantetsu_Logo.svg'};
  if(operatorId==='kagoshimashikotsukyoku')return{url:'https://file.namu.moe/file/e8ee98f43a695ae1bbee6337c0a603116252d7cb21a49eabe902a5f4ab252359',asset:'https://file.namu.moe/file/e8ee98f43a695ae1bbee6337c0a603116252d7cb21a49eabe902a5f4ab252359',label:'가고시마시 교통국',verified:false,source:'https://m.namu.moe/w/가고시마시_교통국'};
  return railDataRepository.getOperatorLogoAsset(operatorId)||routeOrOperatorId?.operatorAsset||null
}

export function operatorLogoMarkup(routeOrOperatorId,className='operator-logo'){
  const asset=operatorLogoAsset(routeOrOperatorId),url=asset?.url||asset?.asset;if(!url)return'';
  return`<span class="${escapeHtml(className)}" data-operator-logo><img loading="lazy" decoding="async" src="${escapeHtml(url)}" alt="${escapeHtml(asset.label||'운영사')} 로고"><span hidden>${escapeHtml(asset.label||'운영사')}</span></span>`
}
