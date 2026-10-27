const KR_CONFIRMED_TRANSFERS=[{"region":"capital","name":"시청","routeIds":["kr-metro-1-main","kr-metro-1-section-2","kr-metro-2"],"source":"https://ms.smc.seoul.kr/attach/record/SEOUL/appendix/a11/A0066691.pdf?time=20260525101106"},{"region":"busan","name":"서면","routeIds":["kr-regional-busan-1","kr-regional-busan-2"],"source":"https://work.humetro.busan.kr/homepage/history/page/subLocation.do?menu_no=1002020202"},{"region":"daegu","name":"반월당","routeIds":["kr-regional-daegu-7","kr-regional-daegu-8"],"source":"https://daegu.grandculture.net/daegu/junggu/toc/GC40000506"}];
// recommit-trigger: free-drive-move-fix-20261007
import{koreanRouteBlockReason}from'./korean-access-policy.js';
import{$,escapeHtml,normalize,koreanStationDisplayName,koreanRouteDisplayText}from'./utils.js';

const finite=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n));
const coords=s=>finite(s?.latitude)&&finite(s?.longitude)?[Number(s.latitude),Number(s.longitude)]:null;
// JR Keiyo Line Maihama ⇄ Resort Gateway is an officially signposted
// walking transfer despite the stations having different Japanese names.
// Preserve each railway's independent coordinates via coordsByRoute.
// Officially designated transfers may use distinct station names/IDs.
// Names are never rewritten to form a transfer: only the free-drive graph key
// is shared. Geography is an additional safeguard, not transfer evidence.
const JP_NAMED_TRANSFER_GROUPS=[
  {
    "id": "akasaka-nagatacho",
    "names": [
      "赤坂見附",
      "永田町"
    ],
    "center": [
      35.6778,
      139.7389
    ],
    "radiusKm": 0.72,
    "source": "https://www.tokyometro.jp/station/akasaka-mitsuke/index.html"
  },
  {
    "id": "kokkai-tameike",
    "names": [
      "国会議事堂前",
      "溜池山王"
    ],
    "center": [
      35.674,
      139.743
    ],
    "radiusKm": 0.72,
    "source": "https://www.tokyometro.jp/station/kokkai-gijidomae/index.html"
  },
  {
    "id": "awajicho-ogawamachi",
    "names": [
      "淡路町",
      "新御茶ノ水",
      "小川町"
    ],
    "center": [
      35.696,
      139.7664
    ],
    "radiusKm": 0.65,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html"
  },
  {
    "id": "hibiya-yurakucho",
    "names": [
      "日比谷",
      "有楽町"
    ],
    "center": [
      35.6756,
      139.7613
    ],
    "radiusKm": 0.72,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html"
  },
  {
    "id": "ueno-okachimachi",
    "names": [
      "上野広小路",
      "仲御徒町",
      "上野御徒町"
    ],
    "center": [
      35.7075,
      139.7743
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/station/ueno-hirokoji/index.html"
  },
  {
    "id": "ningyocho-suitengumae",
    "names": [
      "人形町",
      "水天宮前"
    ],
    "center": [
      35.6842,
      139.784
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html"
  },
  {
    "id": "tsukiji-shintomicho",
    "names": [
      "築地",
      "新富町"
    ],
    "center": [
      35.6693,
      139.7737
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html"
  },
  {
    "id": "toranomon-hills",
    "names": [
      "虎ノ門",
      "虎ノ門ヒルズ"
    ],
    "center": [
      35.6691,
      139.7489
    ],
    "radiusKm": 0.55,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html"
  },
  {
    "id": "ginza-itchome",
    "names": [
      "銀座",
      "銀座一丁目"
    ],
    "center": [
      35.673,
      139.765
    ],
    "radiusKm": 0.75,
    "source": "https://www.tokyometro.jp/ticket/guide/transfertime/index.html"
  },
  {
    "id": "korakuen-kasuga",
    "names": [
      "後楽園",
      "春日"
    ],
    "center": [
      35.7085,
      139.752
    ],
    "radiusKm": 0.62,
    "source": "https://www.tokyometro.jp/station/line_marunouchi/index.html"
  },
  {
    "id": "akihabara-iwamotocho",
    "names": [
      "秋葉原",
      "岩本町"
    ],
    "center": [
      35.697,
      139.774
    ],
    "radiusKm": 0.7,
    "source": "https://www.tokyometro.jp/support/guide/operation/pdf/information_20250401.pdf"
  },
  {
    "id": "shinjuku-shinsen",
    "names": [
      "新宿",
      "新線新宿"
    ],
    "center": [
      35.6898,
      139.701
    ],
    "radiusKm": 0.75,
    "source": "https://www.tokyometro.jp/support/guide/operation/pdf/information_20250401.pdf"
  },
  {
    "id": "ueno-keisei-ueno",
    "names": [
      "上野",
      "京成上野"
    ],
    "center": [
      35.7116,
      139.7742
    ],
    "radiusKm": 0.5,
    "source": "https://www.tokyometro.jp/station/line_ginza/index.html"
  },
  {
    "id": "osaka-umeda",
    "names": [
      "大阪",
      "梅田",
      "東梅田",
      "西梅田",
      "大阪梅田"
    ],
    "center": [
      34.7021,
      135.4976
    ],
    "radiusKm": 0.9,
    "source": "https://subway.osakametro.co.jp/station_guide/index.php"
  },
  {
    "id": "osaka-namba",
    "names": [
      "なんば",
      "大阪難波",
      "難波",
      "JR難波"
    ],
    "center": [
      34.6659,
      135.4998
    ],
    "radiusKm": 0.85,
    "source": "https://subway.osakametro.co.jp/station_guide/M/m20/"
  }
];
export function japaneseNamedTransferNamesForRoute(route){
  if(route?.countryId!=='jp')return [];
  const all=new Set;
  for(const group of JP_NAMED_TRANSFER_GROUPS){
    if(!(route.stations||[]).some(stop=>{
      const point=coords(stop);
      return group.names.includes(stop.ja)&&point&&jpTransferDistanceKm(point,group.center)<=group.radiusKm;
    }))continue;
    for(const name of group.names)all.add(name);
  }
  return [...all];
}
const jpTransferDistanceKm=(a,b)=>Math.hypot((a[0]-b[0])*111.195,
  (a[1]-b[1])*111.195*Math.cos(b[0]*Math.PI/180));
function assignJapanNamedTransfers(routes){
  const present=(routes||[]).filter(route=>route.countryId==='jp');
  for(const route of present)for(const stop of route.stations||[])delete stop.jpNamedTransferKey;
  for(const spec of JP_NAMED_TRANSFER_GROUPS){
    const accepted=[];
    for(const route of present)for(const stop of route.stations||[]){
      const point=coords(stop);
      if(spec.names.includes(stop.ja)&&point&&jpTransferDistanceKm(point,spec.center)<=spec.radiusKm)
        accepted.push({route,stop});
    }
    // A genuine transfer must connect different route IDs and names.
    if(new Set(accepted.map(x=>x.route.id)).size<2||
       new Set(accepted.map(x=>x.stop.ja)).size<2)continue;
    // Reject ambiguous groups containing two separate stops on one route;
    // never collapse consecutive stations into a single free-drive node.
    const byRoute=new Map;
    for(const item of accepted)byRoute.set(item.route.id,(byRoute.get(item.route.id)||0)+1);
    if([...byRoute.values()].some(n=>n>1))continue;
    for(const {stop} of accepted)stop.jpNamedTransferKey='jp-named-transfer:'+spec.id;
  }
}

const JP_MAIHAMA_RESORT_TRANSFER='jp-transfer:maihama-resort-gateway';
const jpDisneyTransferKey=(station,route)=>{
  const allowed=route?.id==='line-11326'&&station?.ja==='舞浜'||
                route?.id==='jp-disney-resort-line'&&station?.ja==='リゾートゲートウェイ・ステーション';
  if(!allowed)return null;
  const lat=Number(station.latitude),lon=Number(station.longitude);
  return Number.isFinite(lat)&&Number.isFinite(lon)&&
    Math.abs(lat-35.63524)<0.006&&Math.abs(lon-139.88510)<0.006?
    JP_MAIHAMA_RESORT_TRANSFER:null;
};
const freeDriveStationKey=s=>{
  if(s?.jpTransferKey)return s.jpTransferKey;
  if(s?.jpNamedTransferKey)return s.jpNamedTransferKey;
  if(s?.jpSharedStationKey)return s.jpSharedStationKey;
  if(s?.krTransferKey)return s.krTransferKey;
  if(s?.krNoAutoTransfer)return String(s.id);
  const c=coords(s),ja=normalize(s?.ja||s?.names?.ja||s?.ko||'');
  // Transfer stations are often represented by different operator-specific IDs.
  // Prefer a name + ~200m coordinate cell so the same physical station merges across companies.
  if(c&&ja){
    const lat=Math.round(c[0]*500)/500,lon=Math.round(c[1]*500)/500;
    return `place:${ja}:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  }
  return String(s?.stationMasterId||s?.sourceStationId||s?.id||ja);
};
const routeName=r=>koreanRouteDisplayText(r?.line?.ko||r?.line?.ja||r?.line?.en||r?.id||'노선',r);
const stationName=(s,r)=>koreanStationDisplayName(s?.ko||s?.ja||s?.romaji||s?.id||'역',r?.countryId,r);
const routeColor=r=>r?.lineColor||r?.color||'#73837b';
const routeSegments=route=>{
  if(route?.countryId==='kr'){
    if(route.geometryReady!==true)return[];
    return(route.directedSegments||[]).filter(segment=>segment.geometryStatus==='ready').map(segment=>segment.geometry)
  }
  // A line's surveyed polyline belongs to that line, not to a single merged interchange point.
  if(route?.geometryReady===true&&Array.isArray(route.geometry)&&route.geometry.length>1)return[route.geometry];
  return[(route.stations||[]).map(coords).filter(Boolean)]
};

function boundsOfRoutes(routes){
  let minLat=90,maxLat=-90,minLon=180,maxLon=-180,count=0;
  for(const route of routes||[])for(const station of route.stations||[]){
    const c=coords(station);if(!c)continue;
    minLat=Math.min(minLat,c[0]);maxLat=Math.max(maxLat,c[0]);minLon=Math.min(minLon,c[1]);maxLon=Math.max(maxLon,c[1]);count++;
  }
  return count?{minLat,maxLat,minLon,maxLon}:null;
}
function project(c,b,w,h,pad=24){
  const lonSpan=Math.max(.01,b.maxLon-b.minLon),latSpan=Math.max(.01,b.maxLat-b.minLat);
  const scale=Math.min((w-pad*2)/lonSpan,(h-pad*2)/latSpan);
  const usedW=lonSpan*scale,usedH=latSpan*scale;
  return[(w-usedW)/2+(c[1]-b.minLon)*scale,(h-usedH)/2+(b.maxLat-c[0])*scale];
}
export function drawNetworkCanvas(canvas,routes,{bounds=null,alpha=.28,transferNodes=null,currentKey=null,currentRouteId=null}={}){
  if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const b=bounds||boundsOfRoutes(routes);if(!b)return;
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const route of routes||[]){
    const segments=routeSegments(route);if(!segments.some(pts=>pts.length>=2))continue;
    ctx.beginPath();
    for(const pts of segments){if(pts.length<2)continue;pts.forEach((c,i)=>{const p=project(c,b,w,h,20);i?ctx.lineTo(...p):ctx.moveTo(...p)})}
    ctx.strokeStyle=routeColor(route);
    ctx.globalAlpha=route.id===currentRouteId?Math.min(1,alpha*3.3):alpha;
    ctx.lineWidth=route.id===currentRouteId?3.5:1.15;
    ctx.stroke();
  }
  if(transferNodes){
    for(const node of transferNodes.values()){
      if((node.routeIds?.size||0)<2)continue;
      // Interchanges group navigation only; plot each line's own station coordinate.
      for(const c of node.coordsByRoute?.values()||[]){
        if(!c)continue;
        const p=project(c,b,w,h,20);
        ctx.globalAlpha=.72;ctx.fillStyle='#f7fbf8';ctx.beginPath();ctx.arc(p[0],p[1],3.2,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#17342b';ctx.lineWidth=1.2;ctx.stroke();
      }
    }
  }
  if(currentKey&&transferNodes?.has(currentKey)){
    const node=transferNodes.get(currentKey),c=node.coordsByRoute?.get(currentRouteId),p=c&&project(c,b,w,h,20);
    if(p){ctx.globalAlpha=1;ctx.fillStyle='#69efb7';ctx.beginPath();ctx.arc(p[0],p[1],7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#07120e';ctx.lineWidth=3;ctx.stroke()}
  }
  ctx.globalAlpha=1;
}

export class FreeDrive{
  constructor({onExit,onChange}={}){this.routes=[];this.graph=new Map;this.currentKey=null;this.currentRouteId=null;this.history=[];this.startRoute=null;this.onExit=onExit;this.onChange=onChange;this.canvas=$('#free-drive-canvas');this.viewMode='local';this.bind()}
  bind(){
    const handleEdge=e=>{const b=e.target.closest('[data-free-edge]');if(b)this.move(decodeURIComponent(b.dataset.freeEdge))};$('#free-drive-options')?.addEventListener('click',handleEdge);
    $('#free-drive-start-station')?.addEventListener('change',e=>this.restartAt(+e.target.value));
    $('#free-drive-reset')?.addEventListener('click',()=>this.restartAt(+($('#free-drive-start-station')?.value||0)));$('#free-drive-map-toggle')?.addEventListener('click',()=>{this.viewMode=this.viewMode==='local'?'all':'local';this.renderMap();this.updateMapToggle()});
    $('#free-drive-exit')?.addEventListener('click',()=>this.onExit?.());
    addEventListener('resize',()=>this.renderMap());
  }
  setNetwork(routes){
    assignJapanNamedTransfers(routes);
    // Coordinates are route-specific, but the canonical station identity
    // still joins platforms into a transfer. Do not bucket the same master
    // station into different nodes when its line platforms are >200 m apart.
    const masterRoutes=new Map;
    for(const route of routes||[])if(route.countryId==='jp')for(const stop of route.stations||[]){
      const id=String(stop.stationMasterId||stop.sourceStationId||'');
      if(!id)continue;
      if(!masterRoutes.has(id))masterRoutes.set(id,new Set);
      masterRoutes.get(id).add(route.id);
    }
    const sharedMasterIds=new Set([...masterRoutes].filter(([,lines])=>lines.size>1).map(([id])=>id));
    for(const route of routes||[])for(const stop of route.stations||[]){
      if(route.countryId==='jp'){
        const key=jpDisneyTransferKey(stop,route);
        if(key)stop.jpTransferKey=key;
        const masterId=String(stop.stationMasterId||stop.sourceStationId||'');
        if(masterId&&sharedMasterIds.has(masterId))stop.jpSharedStationKey='jp-station:'+masterId;
        else delete stop.jpSharedStationKey;
        continue;
      }
      if(route.countryId!=='kr')continue;
      delete stop.krTransferKey;
      stop.krNoAutoTransfer=true;
      const region=route.regionId||'capital';
      const transfer=KR_CONFIRMED_TRANSFERS.find(t=>t.region===region&&t.name===stop.ko&&t.routeIds.includes(route.id));
      if(transfer)stop.krTransferKey='kr-transfer:'+region+':'+transfer.name;
    }
    this.routes=(routes||[]).filter(r=>!koreanRouteBlockReason(r)).filter(r=>Array.isArray(r.stations)&&r.stations.length>=2&&(r.countryId!=='kr'||r.geometryReady===true));
    this.graph=new Map;
    const ensure=(station,route,index)=>{
      const key=freeDriveStationKey(station);if(!key)return null;let node=this.graph.get(key);
      if(!node){node={key,station,coord:coords(station),edges:[],routeIds:new Set,stationsByRoute:new Map,coordsByRoute:new Map};this.graph.set(key,node)}
      node.routeIds.add(route.id);
      if(!node.stationsByRoute.has(route.id)){
        node.stationsByRoute.set(route.id,{station,index});
        node.coordsByRoute.set(route.id,coords(station));
      }
      node.routeNames=node.routeNames||new Map;node.routeNames.set(route.id,routeName(route));return node;
    };
    for(const route of this.routes){
      route.stations.forEach((s,i)=>ensure(s,route,i));
      for(let i=0;i<route.stations.length-1;i++){
        const a=route.stations[i],b=route.stations[i+1],ak=freeDriveStationKey(a),bk=freeDriveStationKey(b),an=ensure(a,route,i),bn=ensure(b,route,i+1);
        if(!an||!bn||!ak||!bk||ak===bk)continue;
        an.edges.push({to:bk,routeId:route.id,route,index:i+1,direction:1,station:b});
        if(!route.oneWay&&!(route.countryId==='kr'&&route.schemaVersion===2))bn.edges.push({to:ak,routeId:route.id,route,index:i,direction:-1,station:a});
      }
      if(route.loop&&route.stations.length>2){
        const a=route.stations.at(-1),b=route.stations[0],ak=freeDriveStationKey(a),bk=freeDriveStationKey(b),an=ensure(a,route,route.stations.length-1),bn=ensure(b,route,0);
        if(an&&bn&&ak!==bk){an.edges.push({to:bk,routeId:route.id,route,index:0,direction:1,station:b});if(!route.oneWay&&!(route.countryId==='kr'&&route.schemaVersion===2))bn.edges.push({to:ak,routeId:route.id,route,index:route.stations.length-1,direction:-1,station:a})}
      }
    }
    this.renderMap();
  }
  start(route,index=0){
    if(!route?.stations?.length)return false;
    this.startRoute=route;this.currentRouteId=route.id;this.history=[];this.populateStartStations(route);
    this.restartAt(Math.max(0,Math.min(index,route.stations.length-1)));return true;
  }
  populateStartStations(route){
    const select=$('#free-drive-start-station');if(!select)return;
    select.innerHTML=route.stations.map((s,i)=>`<option value="${i}">${escapeHtml(stationName(s,route))} · ${escapeHtml(route.countryId==='kr'?stationName(s,route):s.ja||'')}</option>`).join('');
  }
  updateMapToggle(){const b=$('#free-drive-map-toggle');if(b)b.textContent=this.viewMode==='local'?'전국망 보기':'현재역 주변 보기'}
  restartAt(index=0){
    if(!this.startRoute)return;
    const station=this.startRoute.stations[index]||this.startRoute.stations[0];this.currentKey=freeDriveStationKey(station);this.currentRouteId=this.startRoute.id;this.history=[this.currentKey];
    const select=$('#free-drive-start-station');if(select)select.value=String(Math.max(0,index));this.viewMode='local';this.updateMapToggle();this.render();this.emit();
  }
  move(encoded){
    let token;try{token=JSON.parse(encoded)}catch{return false}
    return this.moveTo(token?.[0],token?.[1])
  }
  stationForRoute(key,routeId){return this.graph.get(key)?.stationsByRoute?.get(routeId)?.station||null}
  coordsForRoute(key,routeId){return this.graph.get(key)?.coordsByRoute?.get(routeId)||null}
  selectRoute(routeId){
    const node=this.current();
    if(!node?.stationsByRoute?.has(routeId)||!this.routes.some(route=>route.id===routeId))return false;
    if(this.currentRouteId===routeId)return true;
    this.currentRouteId=routeId;
    this.render();this.emit();
    return true
  }
  moveTo(to,routeId){
    if(!to||!routeId)return false;
    const node=this.graph.get(this.currentKey),edge=node?.edges?.find(e=>e.to===to&&e.routeId===routeId);
    if(!edge)return false;
    this.currentKey=edge.to;this.currentRouteId=edge.routeId;this.history.push(edge.to);
    this.render();this.emit();return true
  }
  switchRouteAtCurrentStation(routeId){
    const node=this.current(),route=this.routes.find(r=>r.id===routeId);
    if(!node||!route||routeId===this.currentRouteId||!node.routeIds.has(routeId)||!route.stations.some(s=>freeDriveStationKey(s)===this.currentKey))return false;
    this.currentRouteId=routeId;this.render();this.emit();return true;
  }
  current(){return this.graph.get(this.currentKey)||null}
  snapshot(){
    const node=this.current(),route=this.routes.find(r=>r.id===this.currentRouteId)||this.startRoute;
    if(!node||!route)return null;
    const indexedStop=node.stationsByRoute?.get(this.currentRouteId);
    const stationIndex=indexedStop?.index??Math.max(0,route.stations.findIndex(station=>freeDriveStationKey(station)===this.currentKey));
    return{node,station:route.stations[stationIndex]||indexedStop?.station||node.station,route,routeId:this.currentRouteId,stationIndex,edges:this.edges(),historyLength:this.history.length,transferCount:Math.max(0,(node.routeIds?.size||1)-1)}
  }
  emit(){const state=this.snapshot();if(state)this.onChange?.(state);return state}
  edges(){
    const node=this.current();if(!node)return[];
    const seen=new Set;
    return node.edges.filter(e=>{const k=`${e.to}|${e.routeId}`;if(seen.has(k))return false;seen.add(k);return true})
      .sort((a,b)=>(a.routeId===this.currentRouteId?-1:0)-(b.routeId===this.currentRouteId?-1:0)||routeName(a.route).localeCompare(routeName(b.route),'ko'));
  }
  render(){
    const node=this.current();if(!node)return;
    const route=this.routes.find(r=>r.id===this.currentRouteId);
    const actual=this.stationForRoute(this.currentKey,this.currentRouteId)||node.station;
    $('#free-drive-station-ko').textContent=stationName(actual,route);
    $('#free-drive-station-ja').textContent=route?.countryId==='kr'?stationName(actual,route):actual.ja||'';
    $('#free-drive-current-line').textContent=routeName(route);
    $('#free-drive-transfer-count').textContent=String(Math.max(0,(node.routeIds?.size||1)-1));
    $('#free-drive-visited-count').textContent=String(this.history.length);
    const edges=this.edges(),target=$('#free-drive-options');
    const groups=new Map;for(const edge of edges){if(!groups.has(edge.routeId))groups.set(edge.routeId,[]);groups.get(edge.routeId).push(edge)}
    target.innerHTML=[...groups.entries()].map(([routeId,list])=>{
      const r=list[0].route,transfer=routeId!==this.currentRouteId;
      return `<section class="free-drive-line ${transfer?'transfer':''}" style="--route-color:${routeColor(r)}"><header><span>${transfer?'TRANSFER · 환승':'CURRENT LINE'}</span><b>${escapeHtml(routeName(r))}</b><small>${escapeHtml(r.operator?.ko||r.operator?.ja||'')}</small></header><div>${list.map(edge=>{const dest=edge.station||this.stationForRoute(edge.to,edge.routeId);return `<button type="button" data-free-edge="${encodeURIComponent(JSON.stringify([edge.to,edge.routeId]))}"><b>${escapeHtml(stationName(dest,r))}</b><span>${escapeHtml(r.countryId==='kr'?stationName(dest,r):dest?.ja||'')}</span><i>→</i></button>`}).join('')}</div></section>`
    }).join('')||'<p class="muted">이 역에서 이어지는 선로를 찾지 못했습니다.</p>';
    this.renderMap();
  }
  renderMap(){
    if(!this.canvas||!this.routes.length)return;
    let bounds=boundsOfRoutes(this.routes);
    if(this.viewMode==='local'){
      const c=this.coordsForRoute(this.currentKey,this.currentRouteId);
      if(c)bounds={minLat:c[0]-.18,maxLat:c[0]+.18,minLon:c[1]-.24,maxLon:c[1]+.24};
    }
    drawNetworkCanvas(this.canvas,this.routes,{bounds,alpha:this.viewMode==='local'?.18:.10,transferNodes:this.graph,currentKey:this.currentKey,currentRouteId:this.currentRouteId});
  }
}
