import{loadTransportData}from'./data-loader.js';
import{$,escapeHtml,formatTime}from'./utils.js';
import{storage}from'./storage.js';
import{railDataRepository}from'./rail-data-repository.js';
import{canonicalRouteId,isCountryEnabled}from'./feature-flags.js';

const indexedResearchName=id=>globalThis.TRT_KOREA_RESEARCH_INDEX?.routes?.find(r=>r.id===id)?.line?.ko||'';
const indexedKoreanLineName=id=>globalThis.TRT_KOREA_INDEX?.routes?.find(route=>route.id===id)?.line?.ko||globalThis.TRT_KOREA_INDEX?.routes?.find(route=>route.id===id)?.names?.ko||'';

export function renderStats(){
  let picker=$('#records-mode');if(!picker){picker=document.createElement('select');picker.id='records-mode';picker.setAttribute('aria-label','기록 종류');picker.innerHTML='<option value="released">정식·기존 운영 기록</option><option value="research">연구용 미리보기 기록</option>';$('#stats-summary').before(picker);picker.addEventListener('change',()=>renderStats())}
  if(picker.value==='research'&&!globalThis.TRT_KOREA_RESEARCH_INDEX&&!picker.dataset.loading){picker.dataset.loading='true';loadTransportData('kr','research').then(()=>{delete picker.dataset.loading;renderStats()}).catch(()=>{delete picker.dataset.loading})}
  const records=Object.entries(picker.value==='research'?storage.researchRecords():storage.records()).map(([routeId,record])=>({...record,routeId})).filter(record=>isCountryEnabled(record.countryId||'jp'));
  const plays=records.reduce((n,r)=>n+r.plays,0),stations=records.reduce((n,r)=>n+r.totalStations,0),acc=records.length?records.reduce((n,r)=>n+r.bestAccuracy,0)/records.length:0,cpm=Math.max(0,...records.map(r=>r.bestCpm)),combo=Math.max(0,...records.map(r=>r.maxCombo));
  $('#stats-summary').innerHTML=[['총 플레이',`${plays}회`],['입력 지점',`${stations}곳`],['평균 정확도',`${acc.toFixed(1)}%`],['최고 타수',`${cpm}타`],['최고 콤보',`${combo}`]].map(x=>`<div class="stat-card"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
  $('#records-table').innerHTML=`<div class="record-row header"><span>노선</span><span>플레이</span><span>최고 시간</span><span>정확도</span><span>타수</span><span>콤보</span></div>`+(records.length?records.sort((a,b)=>b.plays-a.plays).map(r=>{
    const routeId=canonicalRouteId(r.lineId||r.routeId),line=railDataRepository.getLine(routeId),route=railDataRepository.getRoute(routeId),name=line?.names?.ko||indexedResearchName(routeId)||indexedKoreanLineName(routeId)||r.name||routeId;
    return`<div class="record-row" data-route-id="${escapeHtml(routeId)}" data-country-id="${escapeHtml(r.countryId||'jp')}" data-direction-id="${escapeHtml(r.directionId||'forward')}"><b class="record-route-brand" style="border-left:4px solid ${r.color};padding-left:10px"><span>${escapeHtml(name)}${r.countryId==='kr'&&r.serviceJourneyId&&r.destinationName?`<small style="display:block">${escapeHtml(r.originName||'')} → ${escapeHtml(r.destinationName)}</small>`:''}</span></b><span>${r.plays}</span><span>${formatTime(r.bestTime)}</span><span>${r.bestAccuracy.toFixed(1)}%</span><span>${r.bestCpm}</span><span>${r.maxCombo}</span></div>`
  }).join(''):'<p class="muted" style="padding:20px">아직 기록이 없습니다.</p>')
}
