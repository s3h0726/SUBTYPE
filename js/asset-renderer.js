import{escapeHtml}from'./utils.js';
import{railDataRepository}from'./rail-data-repository.js';

export function operatorLogoAsset(routeOrOperatorId){
  const operatorId=typeof routeOrOperatorId==='string'?routeOrOperatorId:routeOrOperatorId?.operatorId;
  if(operatorId==='sendaishikotsukyoku'||operatorId==='op-115')return{url:'https://upload.wikimedia.org/wikipedia/commons/b/b7/Sendai_City_Subway_Logo.svg',asset:'https://upload.wikimedia.org/wikipedia/commons/b/b7/Sendai_City_Subway_Logo.svg',label:'센다이시 지하철',verified:true,source:'https://commons.wikimedia.org/wiki/File:Sendai_City_Subway_Logo.svg'};
  return railDataRepository.getOperatorLogoAsset(operatorId)||routeOrOperatorId?.operatorAsset||null
}

export function operatorLogoMarkup(routeOrOperatorId,className='operator-logo'){
  const asset=operatorLogoAsset(routeOrOperatorId),url=asset?.url||asset?.asset;if(!url)return'';
  return`<span class="${escapeHtml(className)}" data-operator-logo><img loading="lazy" decoding="async" src="${escapeHtml(url)}" alt="${escapeHtml(asset.label||'운영사')} 로고"><span hidden>${escapeHtml(asset.label||'운영사')}</span></span>`
}
