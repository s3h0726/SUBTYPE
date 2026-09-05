import{escapeHtml}from'./utils.js';
import{railDataRepository}from'./rail-data-repository.js';

export function operatorLogoAsset(routeOrOperatorId){
  const operatorId=typeof routeOrOperatorId==='string'?routeOrOperatorId:routeOrOperatorId?.operatorId;
  return railDataRepository.getOperatorLogoAsset(operatorId)||routeOrOperatorId?.operatorAsset||null
}

export function operatorLogoMarkup(routeOrOperatorId,className='operator-logo'){
  const asset=operatorLogoAsset(routeOrOperatorId),url=asset?.url||asset?.asset;if(!url)return'';
  return`<span class="${escapeHtml(className)}" data-operator-logo><img loading="lazy" decoding="async" src="${escapeHtml(url)}" alt="${escapeHtml(asset.label||'운영사')} 로고"><span hidden>${escapeHtml(asset.label||'운영사')}</span></span>`
}
