import{taiwanRecordMarkup,ensureTaiwanDisplay,taiwanRecordDisplay,taiwanDisplayReady}from'./taiwan-display.js';
import{loadTransportData}from'./data-loader.js';
import{$,escapeHtml,formatTime,koreanStationDisplayName,koreanRouteDisplayText}from'./utils.js';
import{storage}from'./storage.js';
import{railDataRepository}from'./rail-data-repository.js';
import{canonicalRouteId,isCountryEnabled}from'./feature-flags.js';

const indexedKoreanLineName=id=>globalThis.TRT_KOREA_INDEX?.routes?.find(route=>route.id===id)?.line?.ko||globalThis.TRT_KOREA_INDEX?.routes?.find(route=>route.id===id)?.names?.ko||'';


const recordCatalogPaths={jp:'data/nationwide/index.json',kr:'data/kr/generated/index.json',hk:'data/hk/generated/index.json',tw:'data/tw/generated/network.json',th:'data/th/generated/index.json',uk:'data/uk/generated/index.json',fr:'data/fr/generated/index.json'};
const recordRouteMetadata=new Map(),recordCatalogRequests=new Set();
function ensureRecordCatalog(countryId){
  const path=recordCatalogPaths[countryId];
  if(!path||recordCatalogRequests.has(countryId))return;
  recordCatalogRequests.add(countryId);
  fetch(new URL(path,document.baseURI)).then(response=>{
    if(!response.ok)throw Error('기록용 노선 목록 HTTP '+response.status);
    return response.json();
  }).then(data=>{
    for(const route of data.routes||data.lines||[])if(route?.id)recordRouteMetadata.set(route.id,route);
    renderStats();
  }).catch(error=>console.warn('이전 운행 기록의 노선 메타데이터를 불러오지 못했습니다.',error));
}
function recordRouteInfo(record,id){
  const stored=railDataRepository.getRoute(id)||recordRouteMetadata.get(id);
  if(stored)return stored;
  const builtin=(record.countryId==='jp'?(globalThis.TRT_JAPAN_LITE_INDEX?.routes||globalThis.TRT_EMBEDDED_LINE_WORKSPACES?.routes||[]):record.countryId==='kr'?(globalThis.TRT_KOREA_INDEX?.routes||[]):record.countryId==='hk'?(globalThis.TRT_HONG_KONG_INDEX?.routes||[]):[]);
  const match=builtin.find(route=>route?.id===id);
  if(match)return match;
  if(!record.routeName)ensureRecordCatalog(record.countryId||'jp');
  return null;
}

export function renderStats(){
  const oldPicker=$('#records-mode');if(oldPicker)oldPicker.remove();
  const records=Object.entries(storage.records()).map(([routeId,record])=>({...record,routeId})).filter(record=>isCountryEnabled(record.countryId||'jp'));
  if(!taiwanDisplayReady()&&records.some(r=>(r.lineId||r.routeId||'').startsWith('tw-')&&!taiwanRecordDisplay({...r,routeId:r.lineId||r.routeId})?.route))void ensureTaiwanDisplay().then(()=>renderStats()).catch(console.warn);
  const plays=records.reduce((n,r)=>n+r.plays,0),stations=records.reduce((n,r)=>n+r.totalStations,0),acc=records.length?records.reduce((n,r)=>n+r.bestAccuracy,0)/records.length:0,cpm=Math.max(0,...records.map(r=>r.bestCpm)),combo=Math.max(0,...records.map(r=>r.maxCombo));
  $('#stats-summary').innerHTML=[['총 플레이',`${plays}회`],['입력 지점',`${stations}곳`],['평균 정확도',`${acc.toFixed(1)}%`],['최고 타수',`${cpm}타`],['최고 콤보',`${combo}`]].map(x=>`<div class="stat-card"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
  $('#records-table').innerHTML=`<div class="record-row header"><span>노선</span><span>플레이</span><span>최고 시간</span><span>정확도</span><span>타수</span><span>콤보</span></div>`+(records.length?records.sort((a,b)=>b.plays-a.plays).map(r=>{

    const routeId=canonicalRouteId(r.lineId||r.routeId),route=recordRouteInfo(r,routeId);
    const line=railDataRepository.getLine(routeId),rawName=line?.names?.ko||route?.line?.ko||route?.names?.ko||indexedKoreanLineName(routeId)||r.routeName||r.name||routeId;
    const name=koreanRouteDisplayText(rawName,route||{countryId:r.countryId,stations:[{ko:r.originName},{ko:r.destinationName}]});
    const calls=route?.stations?.length?route.stations:route?.stationSequence||[];
    const stationById=id=>id?calls.find(station=>String(station.id)===String(id)||String(station.sourceId)===String(id)):null;
    const originStation=stationById(r.originStationId)||(!r.serviceJourneyId&&!r.servicePatternId?calls[0]:null);
    const destinationStation=stationById(r.destinationStationId)||(!r.serviceJourneyId&&!r.servicePatternId?calls.at(-1):null);
    const origin=r.originName||originStation?.ko||originStation?.names?.ko||'';
    const destination=r.destinationName||destinationStation?.ko||destinationStation?.names?.ko||'';
    const isTaiwan=r.countryId==='tw'||route?.countryId==='tw'||routeId.startsWith('tw-');
    const title=isTaiwan?taiwanRecordMarkup({...r,routeId,route:route||storage.routes().find(item=>item.id===routeId)}):escapeHtml(name);
    const section=!isTaiwan&&origin&&destination&&origin!==destination?'<small class="record-route-section">'+escapeHtml(r.countryId==='kr'?koreanStationDisplayName(origin,'kr',route):origin)+' → '+escapeHtml(r.countryId==='kr'?koreanStationDisplayName(destination,'kr',route):destination)+'</small>':'';
    const color=/^#[0-9a-f]{3,8}$/i.test(String(r.color||''))?r.color:/^#[0-9a-f]{3,8}$/i.test(String(route?.lineColor||''))?route.lineColor:'#777';
    return '<div class="record-row" data-route-id="'+escapeHtml(routeId)+'" data-country-id="'+escapeHtml(r.countryId||'jp')+'" data-direction-id="'+escapeHtml(r.directionId||'forward')+'"><b class="record-route-brand" style="border-left:4px solid '+color+';padding-left:10px"><span>'+title+section+'</span></b><span>'+r.plays+'</span><span>'+formatTime(r.bestTime)+'</span><span>'+Number(r.bestAccuracy||0).toFixed(1)+'%</span><span>'+r.bestCpm+'</span><span>'+r.maxCombo+'</span></div>';
  }).join(''):'<p class="muted" style="padding:20px">아직 기록이 없습니다.</p>')
}
