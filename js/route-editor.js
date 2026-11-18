import{getTaiwanDisplayNames,taiwanNameMarkup,taiwanNameText}from'./taiwan-display.js';
import{hongKongRouteBlockReason,buildHongKongCustomRoute,hongKongContinuationAllowed}from'./hong-kong-policy.js';
import{koreanRouteBlockReason}from'./korean-access-policy.js';
import{$,$$,uid,escapeHtml,normalize,toast,debounce,koreanStationDisplayName,customStationNames}from'./utils.js';
import{storage}from'./storage.js';
import{renderSvg}from'./route-renderer.js';
import{CustomGeoMap}from'./network-map.js';
import{normalizeLine}from'./data-loader.js';
import{CustomShortestPath}from'./custom-shortest-path.js';
import{customAirportOptions,customAirportTransferValid}from'./custom-airport-routes.js';
const MAX=300;
const blank=(i=1,geo={})=>({id:`CT${String(i).padStart(2,'0')}`,ja:'',kana:'',romaji:'',ko:'',koAliases:[],map:null,latitude:geo.latitude??null,longitude:geo.longitude??null,customStation:true});
export class RouteEditor{
 constructor({onRoutesChanged,onPlay,onSaved,onLoadAirportNetwork,onSearchForeignRail}){this.onRoutesChanged=onRoutesChanged;this.onPlay=onPlay;this.onSaved=onSaved;this.onLoadAirportNetwork=onLoadAirportNetwork;this.onSearchForeignRail=onSearchForeignRail;this.lastForeignSearchKey='';this.stationSearchStatus=null;this.countryNetworks=new Map();this.airportBusy=false;this.form=$('#route-form');this.list=$('#station-editor');this.master=[];this.railRoutes=[];this.stationGraph=new Map();this.shortestPath=new CustomShortestPath();this.latestPath=null;this.route=this.fresh();this.activeCountryId=this.route.countryId;this.geo=null;this.render();this.bind()}
 stationDisplay(station,route=this.route){
  const name=customStationNames(station,station?.countryId||this.activeCountryId||route?.countryId);
  return koreanStationDisplayName(name.korean,name.countryId,station?.segment||route);
 }
 stationNativeDisplay(station){return customStationNames(station,this.activeCountryId||this.route.countryId).local}
 fresh(){return{countryId:globalThis.document?.documentElement?.dataset.country||'jp',id:uid('custom'),category:'custom',dataKind:'customJourney',operatorId:'custom',operator:{ja:'Custom Journey',en:'Custom Journey',ko:'커스텀 여정'},line:{ja:'カスタム旅程',en:'Custom Journey',ko:'커스텀 여정'},code:'CT',lineColor:'#e84747',loop:false,coverage:'rail-network',stations:[],geometry:[],segments:[]}}
 setRailNetwork(routes,{countryId=this.route.countryId,force=false}={}){
  const original=(Array.isArray(routes)?routes:[]).filter(route=>route.countryId===countryId);
  const previous=this.countryNetworks.get(countryId)||{};
  this.countryNetworks.set(countryId,{...previous,routes:original});
  if(!force&&countryId!==this.activeCountryId)return;
  this.activeCountryId=countryId;
  this.railRoutes=(Array.isArray(routes)?routes:[]).filter(route=>route.countryId===countryId&&route.category!=='custom').filter(route=>!koreanRouteBlockReason(route)&&!hongKongRouteBlockReason(route)).filter(route=>Array.isArray(route?.stations)&&route.stations.length>=2);
  this.stationGraph=new Map();
  const keyOf=station=>station?.twTransferKey||station?.stationMasterId||station?.sourceStationId||station?.id||'';
  const add=(key,station,route)=>{if(!key)return null;let node=this.stationGraph.get(key);if(!node){node={key,station,edges:[]};this.stationGraph.set(key,node)}node.routes=node.routes||new Set();node.routes.add(route.id);return node};
  for(const route of this.railRoutes){
   route.stations.forEach(station=>add(keyOf(station),station,route));
   for(let i=0;i<route.stations.length-1;i++){
    const a=route.stations[i],b=route.stations[i+1],ak=keyOf(a),bk=keyOf(b);
    if(!ak||!bk||ak===bk)continue;
    const an=add(ak,a,route),bn=add(bk,b,route);
    if(!an||!bn)continue;
    an.edges.push({to:bk,route,fromIndex:i,toIndex:i+1});
    if(route.countryId!=='hk'&&(route.countryId!=='kr'||route.schemaVersion!==2))bn.edges.push({to:ak,route,fromIndex:i+1,toIndex:i});
   }
  }
  this.shortestPath.setRoutes(this.railRoutes);
  this.renderJourneyOptions();this.renderAirportOptions()
 }
 setStationMaster(stations,{countryId=this.route.countryId,force=false}={}){
  const previous=this.countryNetworks.get(countryId)||{};
  this.countryNetworks.set(countryId,{...previous,stations:Array.isArray(stations)?stations:[]});
  if(!force&&this.activeCountryId!==countryId)return;
  this.master=Array.isArray(stations)?stations:[];this.renderSearch($('#station-master-search')?.value||'');this.renderJourneyOptions();this.renderAirportOptions();
 }
 useCountry(countryId){
  const cached=this.countryNetworks.get(countryId);
  if(!cached)return false;
  this.activeCountryId=countryId;
  this.setRailNetwork(cached.routes||[],{countryId,force:true});
  this.setStationMaster(cached.stations||[],{countryId,force:true});
  return true;
 }
 knownRoutes(){return [...this.countryNetworks.values()].flatMap(entry=>entry.routes||[]).filter(route=>!route.lazy&&Array.isArray(route.stations)&&route.stations.length>=2)}
 async restoreLastCountry(){
  const current=this.route.stations.at(-1),country=current?.countryId||this.route.countryId;
  if(this.useCountry(country))return;
  const previousFlight=[...this.route.stations].reverse().find(station=>station.airportIncomingTransfer?.toCountryId===country);
  if(previousFlight&&this.onLoadAirportNetwork){
   try{
    const arrival=previousFlight.airportIncomingTransfer;
    const result=await this.onLoadAirportNetwork({countryId,toCode:arrival.toCode,portalId:arrival.portalId});
    this.setRailNetwork(result.routes,{countryId});this.setStationMaster(result.stations,{countryId});this.useCountry(country);
   }catch(error){toast('도착 국가 철도망 로딩 실패: '+error.message)}
  }
 }

 createNew(){this.route=this.fresh();this.activeCountryId=this.route.countryId;this.useCountry(this.activeCountryId);this.latestPath=null;this.render();$('#station-master-search')?.focus()}
 loadRoute(route){if(!route||koreanRouteBlockReason(route))return;this.route=structuredClone(route);this.latestPath=null;this.route.geometry ||= [];this.route.segments ||= [];this.route.airportTransfers ||= [];this.useCountry(this.route.stations.at(-1)?.countryId||this.route.countryId);this.render();void this.restoreLastCountry()}
 bind(){
  $('#new-route').addEventListener('click',()=>this.createNew());$('#add-station').addEventListener('click',()=>this.addStation());$('#save-route').addEventListener('click',()=>this.save());$('#play-custom').addEventListener('click',()=>{if(this.validate())this.onPlay(this.route)});$('#export-route').addEventListener('click',()=>this.export());$('#import-route').addEventListener('change',e=>this.import(e.target.files[0]));
  $('#station-master-search').addEventListener('input',debounce(e=>this.renderSearch(e.target.value),70));$('#station-search-results').addEventListener('click',e=>{const button=e.target.closest('[data-add-master]');if(button)this.addMasterStation(button.dataset.addMaster);const shortest=e.target.closest('[data-route-to]');if(shortest)this.connectShortestPath(shortest.dataset.routeTo)});$('#journey-options').addEventListener('click',e=>{const button=e.target.closest('[data-journey-edge]');if(button)this.addGraphEdge(button.dataset.journeyEdge)});$('#custom-airport-choices')?.addEventListener('click',e=>{const button=e.target.closest('[data-airport-choice]');if(button)void this.addAirportTransfer(button.dataset.airportChoice)});$('#custom-clear-stops')?.addEventListener('click',()=>{if(!this.route.stations.length)return;this.sync();this.resetTrack();this.latestPath=null;this.render();toast('역 목록을 초기화했습니다. 노선 정보는 유지됩니다.')});document.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.isComposing&&document.body.dataset.currentScreen==='custom-editor'&&this.route.stations.length){const options=this.currentEdges();if(new Set(options.map(edge=>edge.route.id)).size>1){e.preventDefault();$('#journey-options').classList.toggle('transfer-open');$('#journey-options').focus?.()}}});
  this.form.addEventListener('input',debounce(()=>{this.sync();this.draw()},60));this.list.addEventListener('click',e=>this.action(e));this.list.addEventListener('dragstart',e=>{const row=e.target.closest('.station-row');if(row){this.dragIndex=+row.dataset.index;row.classList.add('dragging')}});this.list.addEventListener('dragend',e=>e.target.closest('.station-row')?.classList.remove('dragging'));this.list.addEventListener('dragover',e=>e.preventDefault());this.list.addEventListener('drop',e=>{e.preventDefault();const to=+e.target.closest('.station-row')?.dataset.index;if(Number.isInteger(to)&&to!==this.dragIndex){this.sync();const stops=this.route.stations.map(station=>structuredClone(station));const[m]=stops.splice(this.dragIndex,1);stops.splice(to,0,m);this.retraceEditedStops(stops)}});
  $('#saved-routes').addEventListener('click',e=>{const id=e.target.closest('[data-id]')?.dataset.id;if(!id)return;if(e.target.matches('[data-delete]')){if(confirm('이 노선을 삭제할까요?')){storage.deleteRoute(id);this.renderSaved();this.onRoutesChanged()}}else{const found=storage.routes().find(r=>r.id===id);if(found){this.route=structuredClone(found);this.render()}}})
 }
 async activate(){await this.restoreLastCountry();await this.switchEditorView('map');setTimeout(()=>$('#station-master-search')?.focus(),80)}
 async searchForeignStations(value){
  if(!this.onSearchForeignRail)return;
  const q=normalize(value),country=this.activeCountryId;
  if(!q||q.length<2&&!/[一-龯ぁ-んァ-ン가-힣]/u.test(q))return;
  const key=country+':'+q;
  if(this.lastForeignSearchKey===key)return;
  this.lastForeignSearchKey=key;this.stationSearchStatus={key,loading:true};this.renderSearch(value);
  try{
   const result=await this.onSearchForeignRail({countryId:country,query:value});
   if(!result||country!==this.activeCountryId||normalize($('#station-master-search')?.value||'')!==q)return;
   // Search-driven loading must NEVER discard the airport arrival line or
   // the rest of the railway network already used by this custom journey.
   const before=this.countryNetworks.get(country)||{};
   const routes=[...new Map([...(before.routes||[]),...(result.routes||[])].map(route=>[route.id,route])).values()];
   const stationKey=station=>String(station?.twTransferKey||station?.stationMasterId||station?.sourceStationId||station?.id||'');
   const stations=[...new Map([...(before.stations||[]),...(result.stations||[])]
     .filter(station=>stationKey(station)).map(station=>[stationKey(station),station])).values()];
   this.setRailNetwork(routes,{countryId:country,force:true});
   this.setStationMaster(stations,{countryId:country,force:true});
   this.stationSearchStatus={key,loading:false,matchedRoutes:result.matchedRoutes||0,failedRoutes:result.failedRoutes||0};
   this.renderSearch(value);
  }catch(error){
   if(country===this.activeCountryId&&normalize($('#station-master-search')?.value||'')===q){
    this.stationSearchStatus={key,loading:false,error:error.message||String(error)};
    this.renderSearch(value);
   }
   // Permit a manual retry of the exact same station name.
   this.lastForeignSearchKey='';
   console.warn('Custom railway station search failed:',country,value,error);
  }
 }
 renderSearch(value){
  const target=$('#station-search-results');if(!target)return;
  const q=normalize(value);
  if(!q){target.innerHTML=this.activeCountryId==='tw'?'<p>한국어·繁體中文·English 역 이름을 입력하세요.</p>':'<p>한국어·현지어·English 역 이름을 입력하세요.</p>';return}
  const namesFor=station=>[station.zh,station.names?.zh,station.ja,station.kana,station.romaji,station.ko,station.en,station.th,station.fr,station.name,
    station.names?.en,station.names?.ko,station.displayNames?.ko,station.displayNames?.en,...(station.koAliases||[])];
  const folded=v=>normalize(v).normalize('NFKC').replace(/[\s._\-·・'’()（）\[\]]/g,'');
  const term=folded(q);
  const matches=this.master.map(station=>{
   const names=namesFor(station).map(folded),all=folded([names.join(' '),...(station.operators||[]),...(station.lines||[]).flatMap(line=>[line.lineJa,line.lineKo,line.operatorJa])].join(' '));
   const rank=names.includes(term)?0:names.some(name=>name.startsWith(term))?1:names.some(name=>name.includes(term))?2:all.includes(term)?3:99;
   return{station,rank};
  }).filter(item=>item.rank<99)
   .sort((a,b)=>a.rank-b.rank||String(a.station.ko||a.station.ja||a.station.romaji||'').localeCompare(String(b.station.ko||b.station.ja||b.station.romaji||''),'ko'))
   .slice(0,20).map(item=>item.station);
  target.innerHTML=matches.length?matches.map(station=>`<article class="station-search-result"><div><b>${escapeHtml(this.stationDisplay(station)||'한국어 역명 미등록')}</b><span>${this.activeCountryId==='tw'?taiwanNameMarkup(station):escapeHtml(this.stationNativeDisplay(station))}</span><small>${escapeHtml(station.romaji||station.names?.en||station.en||'')} · ${escapeHtml((station.operators||[]).join(' · '))}</small><small>${escapeHtml((station.lines||[]).slice(0,5).map(line=>line.lineKo||line.lineJa).join(' · '))}${station.lines?.length>5?' 외':''}</small></div><div class="custom-search-actions"><button type="button" data-add-master="${escapeHtml(station.id)}">${this.route.stations.length?'＋ 인접역':'출발역 선택'}</button>${this.route.stations.length?`<button type="button" class="shortest-connect" data-route-to="${escapeHtml(station.id)}">↗ 최단거리 연결</button>`:''}</div></article>`).join(''):'<p>현재 불러온 역 목록에는 일치하는 역이 없습니다.</p>';
  const key=this.activeCountryId+':'+q,status=this.stationSearchStatus;
  if(status?.key===key&&status.loading)target.insertAdjacentHTML('beforeend','<p class="station-search-loading" role="status">전국 철도망에서 역을 검색하고 있습니다…</p>');
  else if(status?.key===key&&status.error)target.insertAdjacentHTML('beforeend','<p class="station-search-error" role="status">철도 데이터 검색 실패 · 검색어를 다시 입력해 재시도하세요.</p>');
  else if(!matches.length&&status?.key===key&&status.matchedRoutes===0)target.insertAdjacentHTML('beforeend','<p>등록된 철도역이 없습니다. 다른 한국어·현지어·영문 표기로도 검색해 보세요.</p>');
  else if(!matches.length&&status?.key===key&&status.failedRoutes>0)target.insertAdjacentHTML('beforeend','<p>일치하는 노선을 찾았으나 일부 철도 파일을 불러오지 못했습니다.</p>');
  if(key!==this.lastForeignSearchKey)void this.searchForeignStations(value);
 }
 connectShortestPath(id){
  const target=this.master.find(station=>station.id===id),current=this.route.stations.at(-1);
  if(!target)return;
  if(!current){this.appendStation(target,null);return}
  this.sync();
  const from=CustomShortestPath.stationKey({sourceStationId:current.sourceStationId,twTransferKey:current.twTransferKey});
  const to=CustomShortestPath.stationKey(target);
  const path=this.shortestPath.find(from,to,{maxEdges:MAX-this.route.stations.length});
  if(!path){toast('현재 역에서 목적지까지 등록된 철도망의 연결 경로가 없습니다. 선로 데이터 또는 방향을 확인하세요.');return}
  const previous=structuredClone(this.route);
  for(const edge of path.edges){
    const next=edge.route.stations[edge.toIndex];
    const source=this.master.find(station=>CustomShortestPath.stationKey(station)===edge.to)||{...next,id:next.stationMasterId||next.sourceStationId||next.id,countryId:edge.route.countryId};
    if(!this.appendStation(source,edge,true)){
      this.route=previous;this.render();toast('일부 구간은 현재 검증된 운행 방향으로 연결할 수 없습니다. 변경 사항을 되돌렸습니다.');return;
    }
  }
  this.latestPath=path;
  this.render();
  const km=(path.distanceMeters/1000).toFixed(2),note=path.approximateEdges?' · 일부 구간은 역 간 직선거리 추정':'';
  toast(`최단 경로 ${path.edges.length}개 구간 · 약 ${km} km · 환승 ${path.transferCount}회${note}`);
 }
 resetTrack(){this.route.stations=[];this.route.geometry=[];this.route.segments=[];this.route.airportTransfers=[];this.route.directedSegments=[];this.route.geometryReady=false;delete this.route.releaseStatus;delete this.route.playable}
 airportChoices(){
  return this.route.countryId==='hk'?[]:customAirportOptions(this.route.stations.at(-1),
   this.route.stations.at(-1)?.countryId||this.activeCountryId||this.route.countryId,
   this.knownRoutes(),globalThis.TRTAirportSystem,{allowForeign:true});
 }
 renderAirportOptions(){
  const target=$('#custom-airport-choices');if(!target)return;
  const current=this.route.stations.at(-1),choices=this.airportChoices();
  if(!current){target.innerHTML='<p>공항 접근 철도역에서 출발하면 국내·국제 공항 이동을 선택할 수 있습니다.</p>';return}
  if(this.route.countryId==='hk'){target.innerHTML='<p>홍콩 출발 커스텀 경로는 기존 선로 검증 규칙에 따라 공항 이동을 지원하지 않습니다.</p>';return}
  if(!choices.length){target.innerHTML='<p>이 역에서 확인된 공항 출발 연결이 없습니다. 공항 접근 철도역을 선택하세요.</p>';return}
  const countryLabels={kr:'대한민국',jp:'일본',hk:'홍콩',tw:'대만',mo:'마카오',uk:'영국',fr:'프랑스',th:'태국'};
  target.innerHTML='<div class="custom-airport-heading"><strong>✈ '+escapeHtml(choices[0].fromName)+' 출발</strong><small>국가 간 이동은 목적지 국가의 등록 철도역을 확인한 다음 추가합니다. 실제 항공편이 아닙니다.</small></div><div class="custom-airport-choices">'+choices.map((option,i)=>
   '<button type="button" data-airport-choice="'+i+'" '+(this.airportBusy?'disabled':'')+'><span>'+escapeHtml(option.fromCode)+' → '+escapeHtml(option.toCode)+'</span><b>'+escapeHtml(option.toName)+'</b><small>'+escapeHtml(countryLabels[option.toCountryId]||option.toCountryId)+' · '+escapeHtml(option.portalLabel)+' · '+(option.loadRequired?'철도역 확인 필요':option.kind==='terminal-transfer'?'터미널 이동':'가상 항공 이동')+'</small></button>').join('')+'</div><p class="custom-airport-note">등록된 공항 접근 철도역이 없으면 이동하지 않습니다. 항공 구간은 철도 최단거리와 별도로 저장됩니다.</p>';
 }
 appendVerifiedAirportTransfer(option,quiet=false){
  const current=this.route.stations.at(-1),fromCountry=current?.countryId||this.route.countryId;
  const toCountry=option?.toCountryId||fromCountry;
  if(!option?.targetStation||option.loadRequired||this.route.stations.length>=MAX)return false;
  const all=this.knownRoutes();
  const station={...structuredClone(option.targetStation),
   countryId:toCountry,id:option.targetStation.stationMasterId||option.targetStation.sourceStationId||option.targetStation.id,
   sourceRouteId:option.sourceRouteId};
  const meta={kind:option.kind,fromCode:option.fromCode,toCode:option.toCode,portalId:option.portalId,
   fromCountryId:fromCountry,toCountryId:toCountry,virtual:true};
  if(!customAirportTransferValid(current,station,meta,fromCountry,all,globalThis.TRTAirportSystem))return false;
  const before=structuredClone(this.route),beforeCountry=this.activeCountryId,fromIndex=this.route.stations.length-1;
  // Ensure appendStation stores the destination country even while the source form stays on its home country.
  if(!this.useCountry(toCountry)){if(!quiet)toast('도착 국가 철도 데이터를 아직 불러오지 못했습니다.');return false}
  if(!this.appendStation(station,null,true)){
   this.route=before;this.useCountry(beforeCountry);return false;
  }
  const toIndex=this.route.stations.length-1,to=this.route.stations[toIndex];
  const transfer={...meta,fromStationId:current.sourceStationId,toStationId:to.sourceStationId,fromIndex,toIndex,
   sourceRouteId:current.sourceRouteId||null,destinationRouteId:option.sourceRouteId||null};
  to.airportIncomingTransfer=structuredClone(transfer);
  this.route.airportTransfers ||= [];this.route.airportTransfers.push(transfer);
  const fromPoint=[Number(current.latitude),Number(current.longitude)],toPoint=[Number(to.latitude),Number(to.longitude)];
  if([...fromPoint,...toPoint].every(Number.isFinite)){
   if(!this.route.geometry.length||this.route.geometry.at(-1)[0]!==fromPoint[0]||this.route.geometry.at(-1)[1]!==fromPoint[1])this.route.geometry.push(fromPoint);
   this.route.geometry.push(toPoint);to.geometryIndex=this.route.geometry.length-1;
  }
  if(!quiet){this.latestPath=null;this.render();toast('✈ '+option.fromCode+' → '+option.toCode+' · '+option.portalLabel+' 연결 완료. '+toCountry.toUpperCase()+' 철도로 계속 이동할 수 있습니다.')}
  return true;
 }
 async addAirportTransfer(token){
  if(this.airportBusy)return false;
  const option=this.airportChoices()[Number(token)];if(!option)return false;
  this.airportBusy=true;this.renderAirportOptions();
  const start=this.route.stations.at(-1),fromKey=start?.sourceStationId,originCountry=this.activeCountryId,routeId=this.route.id;
  try{
   if(option.loadRequired){
    if(!this.onLoadAirportNetwork)throw Error('다른 국가의 철도 데이터 로더가 연결되지 않았습니다.');
    const loaded=await this.onLoadAirportNetwork({countryId:option.toCountryId,toCode:option.toCode,portalId:option.portalId});
    if(this.route.id!==routeId||this.route.stations.at(-1)?.sourceStationId!==fromKey)throw Error('출발역이 변경되었습니다. 다시 시도하세요.');
    if(!loaded?.routes?.some(route=>route.countryId===option.toCountryId))throw Error('목적지의 철도 운행 데이터를 찾지 못했습니다.');
    this.setRailNetwork(loaded.routes,{countryId:option.toCountryId});
    this.setStationMaster(loaded.stations,{countryId:option.toCountryId});
   }
   const verified=customAirportOptions(start,start?.countryId||originCountry,this.knownRoutes(),globalThis.TRTAirportSystem)
    .find(item=>item.fromCode===option.fromCode&&item.toCode===option.toCode&&item.portalId===option.portalId&&!item.loadRequired);
   if(!verified||!this.appendVerifiedAirportTransfer(verified,true))throw Error('선택한 터미널의 실제 등록 철도역을 확인할 수 없습니다.');
   this.latestPath=null;this.render();
   toast('✈ 국제 공항 이동 · '+verified.fromCode+' → '+verified.toCode+' · '+verified.portalLabel+' · 목적지 철도역에서 계속 진행하세요.');
   return true;
  }catch(error){this.useCountry(originCountry);toast('공항 이동 실패: '+error.message);return false}
  finally{this.airportBusy=false;this.renderAirportOptions()}
 }
 addMasterStation(id){const source=this.master.find(station=>station.id===id);if(!source)return;if(!this.route.stations.length)return this.appendStation(source,null);const edge=this.currentEdges().find(item=>item.to===id);if(!edge)return toast('현재 역과 실제 선로로 인접한 역만 추가할 수 있습니다. 아래 노선별 다음 역을 선택하세요.');this.addGraphEdge(this.edgeToken(edge))}
 currentEdges(){
  const current=this.route.stations.at(-1);
  if(!current)return[];
  if(this.activeCountryId==='tw')return this.stationGraph.get(current.twTransferKey||current.sourceStationId)?.edges||[];
  const direct=this.stationGraph.get(current.sourceStationId)?.edges||[];
  if(this.activeCountryId==='hk')return direct.filter(edge=>hongKongContinuationAllowed(current,edge.route.directedSegments?.[edge.fromIndex],edge.route.servicePatternId||edge.route.id));
  const nearby=[];
  for(const node of this.stationGraph.values()){
   if(node.station.ja!==current.ja)continue;
   const lat=Number(node.station.latitude)-Number(current.latitude),lon=Number(node.station.longitude)-Number(current.longitude);
   if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.hypot(lat,lon)<=0.008)nearby.push(...node.edges);
  }
  const merged=[...direct,...nearby],seen=new Set;
  return merged.filter(edge=>{const key=`${edge.route.id}:${edge.fromIndex}:${edge.toIndex}`;if(seen.has(key))return false;seen.add(key);return true});
 }
 edgeToken(edge){return encodeURIComponent(JSON.stringify([edge.route.id,edge.fromIndex,edge.toIndex]))}
 addGraphEdge(token){let values;try{values=JSON.parse(decodeURIComponent(token))}catch{return}const[routeId,fromIndex,toIndex]=values,route=this.railRoutes.find(item=>item.id===routeId),edge=route&&{route,fromIndex,toIndex,to:route.stations[toIndex].stationMasterId||route.stations[toIndex].id};if(!edge)return;const source=this.master.find(station=>station.id===edge.to);if(!source)return toast('역 마스터에서 다음 역을 찾지 못했습니다.');this.appendStation(source,edge)}
 appendStation(source,edge,quiet=false){
  if(this.route.stations.length>=MAX){if(!quiet)toast('최대 300역까지 만들 수 있습니다.');return false}
  this.sync();
  if(this.route.countryId==='hk'){
   const sourceId=source.stationMasterId||source.id,rawIncoming=edge?.route?.directedSegments?.[edge.fromIndex],incoming=rawIncoming?{...rawIncoming,sourceServicePatternId:edge.route.servicePatternId||edge.route.id,sourceRouteId:edge.route.id}:null;
   if(edge&&(!incoming||edge.toIndex!==edge.fromIndex+1)){if(!quiet)toast('검증된 방향의 실제 선로만 선택할 수 있습니다.');return false}
   if(edge&&!hongKongContinuationAllowed(this.route.stations.at(-1),incoming,edge.route.servicePatternId||edge.route.id)){if(!quiet)toast('미검증 서비스 변경·반대편 승강장 연결은 선택할 수 없습니다.');return false}
   this.route.stations.push({...structuredClone(source),id:'',sourceStationId:sourceId,hkIncomingEdge:incoming?structuredClone(incoming):null});
   this.renumber();if(this.route.stations.length>1){try{this.route=buildHongKongCustomRoute(this.route)}catch(error){this.route.releaseStatus='INCOMPLETE';this.route.playable=false;if(!quiet)toast(error.message);if(quiet)return false}}if(!quiet)this.render();return true;
  }
  if(edge?.route?.countryId==='hk'){
   const rawIncoming=edge.route.directedSegments?.[edge.fromIndex];
   if(edge.toIndex!==edge.fromIndex+1||!rawIncoming||!hongKongContinuationAllowed(this.route.stations.at(-1),rawIncoming,edge.route.servicePatternId||edge.route.id)){
    if(!quiet)toast('홍콩 운행 방향·승강장 연결 검증에 실패했습니다.');return false;
   }
  }
  let segment=null;
  if(edge){
   const route=edge.route,a=route.stations[edge.fromIndex],b=route.stations[edge.toIndex],from=a.geometryIndex,to=b.geometryIndex;
   const sourceGeometry=Array.isArray(route.geometry)?route.geometry:[];
   const directed=route.directedSegments?.[Math.min(edge.fromIndex,edge.toIndex)]?.geometry;
   let points=Array.isArray(directed)&&directed.length>1?(edge.fromIndex<edge.toIndex?directed:[...directed].reverse()):Number.isInteger(from)&&Number.isInteger(to)&&sourceGeometry.length?(from<=to?sourceGeometry.slice(from,to+1):sourceGeometry.slice(to,from+1).reverse()):[];
   if(points.length<2&&[a.latitude,a.longitude,b.latitude,b.longitude].every(Number.isFinite))points=[[a.latitude,a.longitude],[b.latitude,b.longitude]];
   if(this.route.geometry.length&&points.length&&this.route.geometry.at(-1)[0]===points[0][0]&&this.route.geometry.at(-1)[1]===points[0][1])points=points.slice(1);
   const start=this.route.stations.length-1,offset=this.route.geometry.length;
   this.route.geometry.push(...points);
   segment={id:route.id,line:route.line,operator:route.operator,operatorAsset:route.operatorAsset,code:route.code,lineColor:route.lineColor,lineTheme:route.lineTheme};
   const previousStation=this.route.stations.at(-1),prior=this.route.segments.at(-1);
   if(previousStation&&!previousStation.segment)previousStation.segment=structuredClone(segment);
   if(prior?.id===route.id){prior.toStation=start+1;prior.to=source.id;prior.stations.push(source.id)}
   else this.route.segments.push({...segment,lineId:route.id,operatorId:route.operatorId,fromStation:start,toStation:start+1,from:previousStation?.sourceStationId,to:source.id,stations:[previousStation?.sourceStationId,source.id]});
   if(previousStation)previousStation.geometryIndex=Math.max(0,offset-1);
  }
  this.route.stations.push({...(this.activeCountryId==='tw'?{zh:source.zh,names:{...source.names,zh:source.zh},station_id:source.station_id||source.id,twTransferKey:source.twTransferKey,countryId:'tw',routeSpecificStationName:true}:{}),id:'',ja:customStationNames(source,this.activeCountryId).local,kana:source.kana||'',romaji:source.romaji||source.names?.en||source.en||'',ko:customStationNames(source,this.activeCountryId).hasKorean?customStationNames(source,this.activeCountryId).korean:'MISSING_KOREAN_NAME',zh:source.zh||source.names?.zh||'',th:source.th||source.names?.th||'',fr:source.fr||source.names?.fr||'',koAliases:[...(source.koAliases||[])],latitude:source.latitude,longitude:source.longitude,sourceStationId:source.id,operators:[...(source.operators||[])],lines:structuredClone(source.lines||[]),prefectureCode:source.prefectureCode,countryId:edge?.route?.countryId||source.countryId||this.activeCountryId||this.route.countryId,twTransferKey:source.twTransferKey,sourceRouteId:edge?.route?.id||source.sourceRouteId||null,routeSpecificStationName:true,hkIncomingEdge:edge?.route?.countryId==='hk'?{...(edge.route.directedSegments?.[edge.fromIndex]||{}),sourceServicePatternId:edge.route.servicePatternId||edge.route.id,sourceRouteId:edge.route.id}:null,inTokyo:source.inTokyo,geometryIndex:Math.max(0,this.route.geometry.length-1),segment});
  this.renumber();if(!quiet){this.render();toast(`${this.stationDisplay(source)||'MISSING_KOREAN_NAME'} (${this.activeCountryId==='kr'?this.stationDisplay(source):source.ja}) 역을 추가했습니다.`)}return true
 }
 renderJourneyOptions(){const target=$('#journey-options');if(!target)return;const current=this.route.stations.at(-1),edges=this.currentEdges();if(!current){target.innerHTML='<p>출발역을 선택하면 전국 철도망의 인접역과 환승 노선이 표시됩니다.</p>';return}const currentSegment=this.route.segments.at(-1)?.lineId||this.route.segments.at(-1)?.id||null,grouped=[...new Map(edges.map(edge=>[edge.route.id,edge.route])).values()];target.innerHTML=`<header><span>CURRENT · 現在</span><b>${this.activeCountryId==='tw'?taiwanNameMarkup(current):escapeHtml(this.stationNativeDisplay(current))+' / '+escapeHtml(this.stationDisplay(current))}</b><small>${grouped.length>1?'환승 가능 · 다른 노선도 바로 이어서 선택':'현재역에서 이어지는 인접역'}</small></header><div class="journey-lines">${grouped.map(route=>{const transfer=currentSegment&&route.id!==currentSegment;return`<section class="${transfer?'transfer':''}" style="--route-color:${route.lineColor||'#777'}"><h4><span>${transfer?'TRANSFER':'LINE'}</span> ${escapeHtml(route.code||'—')} · ${route.countryId==='tw'?taiwanNameMarkup(route.line):escapeHtml(route.line.ja||route.line.en||route.line.ko||'')} <small>${escapeHtml(route.line.ko)}</small></h4>${edges.filter(edge=>edge.route.id===route.id).map(edge=>{const station=route.stations[edge.toIndex];return`<button type="button" data-journey-edge="${this.edgeToken(edge)}"><b>${this.activeCountryId==='tw'?taiwanNameMarkup(station):escapeHtml(this.stationNativeDisplay(station))}</b><span>${escapeHtml(this.activeCountryId==='tw'?getTaiwanDisplayNames(station).zh:this.stationDisplay(station))}</span><small>${edge.toIndex>edge.fromIndex?'→':'←'} NEXT</small></button>`}).join('')}</section>`}).join('')}</div>`}
 addStation(geo={}){if(this.route.stations.length>=MAX)return toast('최대 300역까지 만들 수 있습니다.');this.sync();this.route.stations.push(blank(this.route.stations.length+1,geo));this.render();toast('고급 가상역을 추가했습니다. 실제 역 검색 사용을 권장합니다.')}
 renumber(){this.route.stations.forEach((station,i)=>station.id=`${this.route.code||'CT'}${String(i+1).padStart(2,'0')}`)}
 sync(){const f=new FormData(this.form);this.route.operator={...(this.route.countryId==='tw'?{zh:this.route.operator.zh}:{}),ja:f.get('operator')||'Custom Railway',en:this.route.countryId==='tw'?(this.route.operator.en||f.get('operator')||'Custom Railway'):(f.get('operator')||'Custom Railway'),ko:f.get('operator')||'커스텀 철도'};this.route.code=String(f.get('code')||'CT').toUpperCase();this.route.line={...(this.route.countryId==='tw'?{zh:f.get('lineJa')||this.route.line.zh||''}:{}),ja:f.get('lineJa')||'',ko:f.get('lineKo')||'',en:f.get('lineEn')||''};this.route.lineColor=f.get('color')||'#e84747';this.route.loop=f.get('loop')==='on';$$('.station-row',this.list).forEach((row,i)=>{if(!this.route.stations[i]?.customStation)return;this.route.stations[i]={...this.route.stations[i],...Object.fromEntries($$('input[data-field]',row).map(el=>[el.dataset.field,el.value.normalize('NFC')]))}});this.renumber()}
 render(){const f=this.form.elements;if(this.route.countryId==='tw'&&!this.taiwanOriginalLabels)this.taiwanOriginalLabels={label:f.lineJa.closest('label').firstChild.textContent,aria:f.lineJa.getAttribute('aria-label'),placeholder:f.lineJa.getAttribute('placeholder'),search:$('#station-master-search').placeholder};f.operator.value=this.route.operator.ko||this.route.operator.en||'';f.code.value=this.route.code||'CT';f.lineJa.value=this.route.countryId==='tw'?this.route.line.zh||'':this.route.line.ja||'';if(this.route.countryId==='tw'){f.lineJa.setAttribute('aria-label','번체중문 노선명');f.lineJa.placeholder='번체중문 노선명';f.lineJa.closest('label').firstChild.textContent='번체중문 / 繁體中文';$('#station-master-search').placeholder='한국어 / 繁體中文 / English';}else if(this.taiwanOriginalLabels){const prior=this.taiwanOriginalLabels;f.lineJa.closest('label').firstChild.textContent=prior.label;for(const [name,value]of[['aria-label',prior.aria],['placeholder',prior.placeholder]]){if(value===null)f.lineJa.removeAttribute(name);else f.lineJa.setAttribute(name,value)}$('#station-master-search').placeholder=prior.search;this.taiwanOriginalLabels=null;}f.lineKo.value=this.route.line.ko||'';f.lineEn.value=this.route.line.en||'';f.color.value=this.route.lineColor||'#e84747';f.loop.checked=!!this.route.loop;this.renumber();this.list.innerHTML=this.route.stations.length?this.route.stations.map((station,i)=>station.sourceStationId?`<div class="station-row master-row" draggable="true" data-index="${i}"><span class="drag-handle" aria-label="드래그하여 이동">☰</span><div class="master-station-copy"><b>${String(i+1).padStart(2,'0')} · ${station.countryId==='tw'?taiwanNameMarkup(station):escapeHtml(this.stationNativeDisplay(station))}</b><span>${escapeHtml(this.stationDisplay(station))}${station.countryId&&station.countryId!==this.route.countryId?' · '+escapeHtml(station.countryId.toUpperCase()):''}</span>${station.airportIncomingTransfer?`<small class="custom-airport-arrival">✈ ${escapeHtml(station.airportIncomingTransfer.fromCode)} → ${escapeHtml(station.airportIncomingTransfer.toCode)} · ${station.airportIncomingTransfer.kind==='terminal-transfer'?'터미널 이동':'가상 항공 이동'}</small>`:''}<small>${escapeHtml(station.romaji||station.names?.en||station.en||'')} · ${escapeHtml((station.operators||[]).join(' · '))}</small></div><span class="row-actions"><button type="button" data-up aria-label="위로">↑</button><button type="button" data-down aria-label="아래로">↓</button><button type="button" data-remove aria-label="삭제">×</button></span></div>`:`<div class="station-row" draggable="true" data-index="${i}"><span class="drag-handle">☰</span><input data-field="id" value="${escapeHtml(station.id)}" aria-label="역 번호"><input data-field="ja" value="${escapeHtml(station.ja)}" placeholder="공식 원문 역명" aria-label="공식 원문 역명"><input data-field="kana" value="${escapeHtml(station.kana)}" placeholder="ひらがな"><input data-field="romaji" value="${escapeHtml(station.romaji)}" placeholder="Romaji"><input data-field="ko" value="${escapeHtml(station.ko)}" placeholder="한국어 공식 원본 역명" aria-label="공식 원본 역명"><small class="station-coord">${Number.isFinite(station.latitude)?`${station.latitude.toFixed(5)}, ${station.longitude.toFixed(5)}`:'지도에서 좌표 지정 필요'}</small><span class="row-actions"><button type="button" data-up>↑</button><button type="button" data-down>↓</button><button type="button" data-remove>×</button></span></div>`).join(''):'<p class="muted">위 검색창에서 실제 역을 2개 이상 추가하세요.</p>';$('#station-count').textContent=`${this.route.stations.length} / ${MAX}`;this.draw();this.renderSaved();this.renderSearch($('#station-master-search')?.value||'');const status=$('#custom-route-summary');if(status){const n=this.route.stations.length,p=this.latestPath;status.textContent=p?`전체 ${n}개 역 · 최근 자동 연결 ${(p.distanceMeters/1000).toFixed(2)} km · 환승 ${p.transferCount}회${p.approximateEdges?' · 일부 거리 추정':''}`:`현재 ${n}개 역 · 가상 공항 이동 ${(this.route.airportTransfers||[]).length}회 · 철도 최단거리 연결`}}
 async retraceEditedStops(stops){
  if(this.isRetracing)return false;
  this.isRetracing=true;const previous=structuredClone(this.route),previousCountry=this.activeCountryId;
  try{
   if(stops.some(station=>!station.sourceStationId)){
    if(stops.some(station=>station.airportIncomingTransfer))throw Error('가상역과 공항 환승이 함께 있는 경우 역 순서를 자동 재구성할 수 없습니다.');
    this.resetTrack();this.route.stations=stops;this.renumber();this.latestPath=null;this.render();
    toast('가상역이 포함된 목록을 수정하여 기존 자동 선형을 초기화했습니다.');return true;
   }
   this.resetTrack();
   if(stops.length){
    const firstCountry=stops[0].countryId||previous.countryId;
    if(!this.useCountry(firstCountry))throw Error('첫 역의 철도망을 불러오지 못했습니다.');
    const first=this.master.find(item=>item.id===stops[0].sourceStationId)||{...stops[0],id:stops[0].sourceStationId};
    if(!this.appendStation(first,null,true))throw Error('첫 역 복원 실패');
   }
   for(let i=1;i<stops.length;i++){
    const current=this.route.stations.at(-1),targetCountry=stops[i].countryId||previous.countryId,flight=stops[i].airportIncomingTransfer;
    if(flight){
     if(!this.countryNetworks.has(targetCountry)||!this.countryNetworks.get(targetCountry)?.routes?.length){
      if(!this.onLoadAirportNetwork)throw Error('도착 국가 철도망을 불러올 수 없습니다.');
      const loaded=await this.onLoadAirportNetwork({countryId:targetCountry,toCode:flight.toCode,portalId:flight.portalId});
      this.setRailNetwork(loaded.routes,{countryId:targetCountry});
      this.setStationMaster(loaded.stations,{countryId:targetCountry});
     }
     const option=customAirportOptions(current,current.countryId||previous.countryId,this.knownRoutes(),globalThis.TRTAirportSystem)
      .find(item=>item.fromCode===flight.fromCode&&item.toCode===flight.toCode&&item.portalId===flight.portalId&&
       item.targetStationKey===CustomShortestPath.stationKey({sourceStationId:stops[i].sourceStationId,twTransferKey:stops[i].twTransferKey}));
     if(!option||!this.appendVerifiedAirportTransfer(option,true))throw Error('공항 환승 구간을 실제 등록 철도역으로 복원하지 못했습니다.');
     continue;
    }
    if(targetCountry!==current.countryId)throw Error('국경을 넘는 구간에는 공항 환승이 필요합니다.');
    if(!this.useCountry(targetCountry))throw Error('현재 국가의 철도망이 준비되지 않았습니다.');
    const toSource=this.master.find(item=>item.id===stops[i].sourceStationId)||{...stops[i],id:stops[i].sourceStationId};
    const from=CustomShortestPath.stationKey(current),to=CustomShortestPath.stationKey(toSource);
    const path=this.shortestPath.find(from,to,{maxEdges:MAX-this.route.stations.length});
    if(!path)throw Error('역 사이의 연결 선로를 찾지 못했습니다.');
    for(const edge of path.edges){
     const next=edge.route.stations[edge.toIndex],source=this.master.find(item=>CustomShortestPath.stationKey(item)===edge.to)||{...next,id:next.stationMasterId||next.sourceStationId||next.id,countryId:edge.route.countryId};
     if(!this.appendStation(source,edge,true))throw Error('허용되지 않는 방향 또는 미검증 환승입니다.');
    }
   }
   this.latestPath=null;this.render();return true;
  }catch(error){
   this.route=previous;this.useCountry(previousCountry);this.render();toast('역 순서 변경을 취소했습니다: '+error.message);return false;
  }finally{this.isRetracing=false}
 }
 action(e){
  const row=e.target.closest('.station-row');if(!row)return;
  const i=+row.dataset.index;this.sync();
  const stops=this.route.stations.map(station=>structuredClone(station));
  if(e.target.matches('[data-remove]'))stops.splice(i,1);
  else if(e.target.matches('[data-up]')&&i>0)[stops[i-1],stops[i]]=[stops[i],stops[i-1]];
  else if(e.target.matches('[data-down]')&&i<stops.length-1)[stops[i+1],stops[i]]=[stops[i],stops[i+1]];
  else return;
  this.retraceEditedStops(stops);
 }
 draw(){if(this.route.countryId==='hk'&&this.route.stations.length>=2){try{this.route=buildHongKongCustomRoute(this.route)}catch{this.route.geometryReady=false;this.route.geometry=[];this.route.directedSegments=[];this.route.playable=false;this.route.releaseStatus='INCOMPLETE'}}this.renderJourneyOptions();this.renderAirportOptions();renderSvg($('#custom-map'),this.route);this.geo?.render(this.route)}
 async switchEditorView(){if(!this.geo){this.geo=new CustomGeoMap($('#custom-geo-map'),$('#geo-map-status'),point=>this.addStation(point),(i,point)=>{Object.assign(this.route.stations[i],point);this.render()});await this.geo.init(this.route)}this.geo.render(this.route);this.geo.show()}
 validate(){this.sync();if(this.route.countryId==='hk'){try{this.route=normalizeLine(buildHongKongCustomRoute(this.route));return true}catch(error){toast(error.message);return false}}if(!this.route.line.ja&&!this.route.line.ko&&!this.route.line.en)return toast('노선명을 입력하세요.'),false;if(this.route.stations.length<2)return toast('실제 역을 최소 2개 추가해 주세요.'),false;if(this.route.loop&&this.route.stations.some(s=>s.airportIncomingTransfer))return toast('공항 환승을 포함한 노선은 순환선으로 저장할 수 없습니다.'),false;if(this.route.stations.some(station=>!customStationNames(station,this.route.countryId).hasKorean))return toast('한국어 이름이 미등록된 역이 있습니다. 해당 국가 철도 원본의 한국어 이름을 확인해야 저장할 수 있습니다.'),false;
  for(let i=1;i<this.route.stations.length;i++){
   const previous=this.route.stations[i-1],arrival=this.route.stations[i],transfer=arrival.airportIncomingTransfer;
   if(!transfer&&(previous.countryId||this.route.countryId)!==(arrival.countryId||this.route.countryId))
    return toast('서로 다른 국가의 철도역은 공항 환승으로 연결해야 합니다.'),false;
   if(transfer&&!customAirportTransferValid(previous,arrival,transfer,previous.countryId||this.route.countryId,this.knownRoutes(),globalThis.TRTAirportSystem))
    return toast('공항 환승 경로가 실제 등록된 터미널 철도역과 일치하지 않습니다.'),false;
  }
  this.route.airportTransfers=this.route.stations.filter(station=>station.airportIncomingTransfer).map(station=>structuredClone(station.airportIncomingTransfer));if(this.route.stations.some(station=>!Number.isFinite(station.latitude)||!Number.isFinite(station.longitude)))return toast('모든 역에 실제 지도 좌표가 필요합니다.'),false;if(!/^#[0-9a-f]{6}$/i.test(this.route.lineColor))return toast('노선 색상이 올바르지 않습니다.'),false;this.route=normalizeLine({...this.route,custom:true,category:'custom'},{category:'custom'});return true}
 save(){if(!this.validate())return;storage.saveRoute(this.route);toast('실제 철도망 여정을 저장했습니다.');this.renderSaved();this.onRoutesChanged();this.onSaved?.(this.route)}
 renderSaved(){const routes=storage.routes().filter(route=>(route.countryId||'jp')===(this.route.countryId||'jp'));$('#saved-routes').innerHTML=routes.length?routes.map(route=>`<div class="saved-item" style="--saved-color:${route.lineColor}" data-id="${route.id}"><span><b>${route.countryId==='tw'?taiwanNameMarkup(route.line):escapeHtml(route.line.ko)}</b><small>${route.stations.length}개 역</small></span><button data-delete aria-label="삭제">×</button></div>`).join(''):'<p class="muted">저장된 노선이 없습니다.</p>'}
 export(){if(!this.validate())return;const blob=new Blob([JSON.stringify({version:1,type:'custom-route',...this.route},null,2)],{type:'application/json'}),anchor=document.querySelector('#custom-route-download')||document.body.appendChild(document.createElement('a'));if(anchor.href?.startsWith('blob:'))URL.revokeObjectURL(anchor.href);anchor.id='custom-route-download';anchor.hidden=true;anchor.href=URL.createObjectURL(blob);anchor.download=`${this.route.id}.json`;anchor.click();toast('JSON 파일을 내보냈습니다.')}
 async import(file){
  if(!file)return;
  try{
   if(file.size>1_000_000)throw new Error('파일이 너무 큽니다.');
   const data=JSON.parse(await file.text());
   if(Array.isArray(data.stations)&&this.onLoadAirportNetwork){
    const loaded=new Set();
    for(const station of data.stations){
     const transfer=station?.airportIncomingTransfer;
     if(!transfer||!transfer.toCountryId)continue;
     const key=transfer.toCountryId+':'+transfer.toCode+':'+transfer.portalId;
     if(loaded.has(key))continue;loaded.add(key);
     const result=await this.onLoadAirportNetwork({countryId:transfer.toCountryId,toCode:transfer.toCode,portalId:transfer.portalId});
     this.setRailNetwork(result.routes,{countryId:transfer.toCountryId});
     this.setStationMaster(result.stations,{countryId:transfer.toCountryId});
    }
   }
   this.route=this.sanitize(data);storage.saveRoute(this.route);
   await this.restoreLastCountry();this.render();this.onRoutesChanged();toast('국가 간 공항 환승 경로를 포함한 노선을 가져왔습니다.');
  }catch(error){toast('가져오기 실패: '+error.message)}
  finally{$('#import-route').value=''}
 }
 sanitize(data){
  if(!data||typeof data!=='object'||!Array.isArray(data.stations))throw Error('지원하지 않는 JSON 형식입니다.');
  if(data.stations.length<2||data.stations.length>MAX)throw Error('역 수가 올바르지 않습니다.');
  if(data.stations.some(station=>!customStationNames(station,station?.countryId||data.countryId).hasKorean||!customStationNames(station,station?.countryId||data.countryId).local||!Number.isFinite(station.latitude)||!Number.isFinite(station.longitude)))throw Error('역 이름 또는 실제 좌표가 없습니다.');
  const route=normalizeLine({...data,id:typeof data.id==='string'&&data.id?data.id:uid('custom'),custom:true,category:'custom'},{category:'custom'});
  route.coverage='custom';
  if(route.stations.some(station=>station.airportIncomingTransfer)&&(route.countryId==='hk'||route.loop))throw Error('공항 이동이 포함된 순환선·홍콩 출발 노선은 가져올 수 없습니다.');
  for(let i=1;i<route.stations.length;i++){
   const previous=route.stations[i-1],arrival=route.stations[i],flight=arrival.airportIncomingTransfer;
   if(!flight&&(previous.countryId||route.countryId)!==(arrival.countryId||route.countryId))throw Error('항공 환승 없이 국가가 변경된 역 연결은 가져올 수 없습니다.');
   if(flight&&!customAirportTransferValid(previous,arrival,flight,previous.countryId||route.countryId,this.knownRoutes(),globalThis.TRTAirportSystem))
    throw Error('공항 환승이 실제 등록 공항·터미널역과 일치하지 않습니다.');
  }
  route.airportTransfers=route.stations.filter(station=>station.airportIncomingTransfer).map(station=>structuredClone(station.airportIncomingTransfer));
  if(route.countryId==='hk')return buildHongKongCustomRoute(route);
  return route;
 }
}
