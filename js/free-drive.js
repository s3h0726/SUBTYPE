// recommit-trigger: free-drive-move-fix-20261007
import{$,escapeHtml,normalize}from'./utils.js';

const finite=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n));
const coords=s=>finite(s?.latitude)&&finite(s?.longitude)?[Number(s.latitude),Number(s.longitude)]:null;
const freeDriveStationKey=s=>{
  const c=coords(s),ja=normalize(s?.ja||s?.names?.ja||s?.ko||'');
  // Transfer stations are often represented by different operator-specific IDs.
  // Prefer a name + ~200m coordinate cell so the same physical station merges across companies.
  if(c&&ja){
    const lat=Math.round(c[0]*500)/500,lon=Math.round(c[1]*500)/500;
    return `place:${ja}:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  }
  return String(s?.stationMasterId||s?.sourceStationId||s?.id||ja);
};
const routeName=r=>r?.line?.ko||r?.line?.ja||r?.line?.en||r?.id||'노선';
const stationName=s=>s?.ko||s?.ja||s?.romaji||s?.id||'역';
const routeColor=r=>r?.lineColor||r?.color||'#73837b';

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
    const pts=(route.stations||[]).map(coords).filter(Boolean);if(pts.length<2)continue;
    ctx.beginPath();
    pts.forEach((c,i)=>{const p=project(c,b,w,h,20);i?ctx.lineTo(...p):ctx.moveTo(...p)});
    ctx.strokeStyle=routeColor(route);
    ctx.globalAlpha=route.id===currentRouteId?Math.min(1,alpha*3.3):alpha;
    ctx.lineWidth=route.id===currentRouteId?3.5:1.15;
    ctx.stroke();
  }
  if(transferNodes){
    for(const node of transferNodes.values()){
      if((node.routeIds?.size||0)<2||!node.coord)continue;
      const p=project(node.coord,b,w,h,20);
      ctx.globalAlpha=.72;ctx.fillStyle='#f7fbf8';ctx.beginPath();ctx.arc(p[0],p[1],3.2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#17342b';ctx.lineWidth=1.2;ctx.stroke();
    }
  }
  if(currentKey&&transferNodes?.has(currentKey)){
    const node=transferNodes.get(currentKey),p=node.coord&&project(node.coord,b,w,h,20);
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
    this.routes=(routes||[]).filter(r=>Array.isArray(r.stations)&&r.stations.length>=2);
    this.graph=new Map;
    const ensure=(station,route,index)=>{
      const key=freeDriveStationKey(station);if(!key)return null;let node=this.graph.get(key);
      if(!node){node={key,station,coord:coords(station),edges:[],routeIds:new Set};this.graph.set(key,node)}
      node.routeIds.add(route.id);node.routeNames=node.routeNames||new Map;node.routeNames.set(route.id,routeName(route));return node;
    };
    for(const route of this.routes){
      route.stations.forEach((s,i)=>ensure(s,route,i));
      for(let i=0;i<route.stations.length-1;i++){
        const a=route.stations[i],b=route.stations[i+1],ak=freeDriveStationKey(a),bk=freeDriveStationKey(b),an=ensure(a,route,i),bn=ensure(b,route,i+1);
        if(!an||!bn||!ak||!bk||ak===bk)continue;
        an.edges.push({to:bk,routeId:route.id,route,index:i+1,direction:1});
        bn.edges.push({to:ak,routeId:route.id,route,index:i,direction:-1});
      }
      if(route.loop&&route.stations.length>2){
        const a=route.stations.at(-1),b=route.stations[0],ak=freeDriveStationKey(a),bk=freeDriveStationKey(b),an=ensure(a,route,route.stations.length-1),bn=ensure(b,route,0);
        if(an&&bn&&ak!==bk){an.edges.push({to:bk,routeId:route.id,route,index:0,direction:1});bn.edges.push({to:ak,routeId:route.id,route,index:route.stations.length-1,direction:-1})}
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
    select.innerHTML=route.stations.map((s,i)=>`<option value="${i}">${escapeHtml(s.ko||s.ja)} · ${escapeHtml(s.ja||'')}</option>`).join('');
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
  moveTo(to,routeId){
    if(!to||!routeId)return false;
    const node=this.graph.get(this.currentKey),edge=node?.edges?.find(e=>e.to===to&&e.routeId===routeId);
    if(!edge)return false;
    this.currentKey=edge.to;this.currentRouteId=edge.routeId;this.history.push(edge.to);
    this.render();this.emit();return true
  }
  current(){return this.graph.get(this.currentKey)||null}
  snapshot(){
    const node=this.current(),route=this.routes.find(r=>r.id===this.currentRouteId)||this.startRoute;
    if(!node||!route)return null;
    const stationIndex=Math.max(0,route.stations.findIndex(station=>freeDriveStationKey(station)===this.currentKey));
    return{node,station:route.stations[stationIndex]||node.station,route,routeId:this.currentRouteId,stationIndex,edges:this.edges(),historyLength:this.history.length,transferCount:Math.max(0,(node.routeIds?.size||1)-1)}
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
    $('#free-drive-station-ko').textContent=stationName(node.station);
    $('#free-drive-station-ja').textContent=node.station.ja||'';
    $('#free-drive-current-line').textContent=routeName(route);
    $('#free-drive-transfer-count').textContent=String(Math.max(0,(node.routeIds?.size||1)-1));
    $('#free-drive-visited-count').textContent=String(this.history.length);
    const edges=this.edges(),target=$('#free-drive-options');
    const groups=new Map;for(const edge of edges){if(!groups.has(edge.routeId))groups.set(edge.routeId,[]);groups.get(edge.routeId).push(edge)}
    target.innerHTML=[...groups.entries()].map(([routeId,list])=>{
      const r=list[0].route,transfer=routeId!==this.currentRouteId;
      return `<section class="free-drive-line ${transfer?'transfer':''}" style="--route-color:${routeColor(r)}"><header><span>${transfer?'TRANSFER · 환승':'CURRENT LINE'}</span><b>${escapeHtml(routeName(r))}</b><small>${escapeHtml(r.operator?.ko||r.operator?.ja||'')}</small></header><div>${list.map(edge=>{const dest=this.graph.get(edge.to)?.station;return `<button type="button" data-free-edge="${encodeURIComponent(JSON.stringify([edge.to,edge.routeId]))}"><b>${escapeHtml(dest?.ko||dest?.ja||'다음 역')}</b><span>${escapeHtml(dest?.ja||'')}</span><i>→</i></button>`}).join('')}</div></section>`
    }).join('')||'<p class="muted">이 역에서 이어지는 선로를 찾지 못했습니다.</p>';
    this.renderMap();
  }
  renderMap(){
    if(!this.canvas||!this.routes.length)return;
    let bounds=boundsOfRoutes(this.routes);
    if(this.viewMode==='local'){
      const node=this.current(),c=node?.coord;
      if(c)bounds={minLat:c[0]-.18,maxLat:c[0]+.18,minLon:c[1]-.24,maxLon:c[1]+.24};
    }
    drawNetworkCanvas(this.canvas,this.routes,{bounds,alpha:this.viewMode==='local'?.18:.10,transferNodes:this.graph,currentKey:this.currentKey,currentRouteId:this.currentRouteId});
  }
}
