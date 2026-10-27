import{escapeHtml,normalize,koreanStationDisplayName}from'./utils.js';
let leafletPromise;
export function ensureLeaflet(){if(window.L)return Promise.resolve(window.L);if(leafletPromise)return leafletPromise;leafletPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='anonymous';script.onload=()=>resolve(window.L);script.onerror=()=>reject(new Error('Leaflet unavailable'));document.head.append(script);setTimeout(()=>window.L?resolve(window.L):reject(new Error('Leaflet timeout')),8000)});return leafletPromise}
const tokyoBounds=[[35.49,138.94],[35.92,140.12]];
const routeGeometry=route=>{if(route?.countryId==='kr'){if(route.geometryReady!==true)return[];return(route.directedSegments||[]).filter(segment=>segment.geometryStatus==='ready').map(segment=>segment.geometry)}return route.stations.filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).map(s=>[s.latitude,s.longitude])};
export class NetworkMap{
 constructor(container,status,{onRoute,onPlay}){this.container=container;this.status=status;this.onRoute=onRoute;this.onPlay=onPlay;this.ready=false;this.filter='all'}
 async init(routes,stations){this.routes=routes;this.stations=stations;try{const L=await ensureLeaflet();this.L=L;this.map=L.map(this.container,{zoomControl:true,minZoom:8,preferCanvas:true}).fitBounds(tokyoBounds);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(this.map);this.lineLayer=L.layerGroup().addTo(this.map);this.stationLayer=L.layerGroup().addTo(this.map);this.drawLines();this.map.on('zoomend',()=>this.drawStations());this.drawStations();this.ready=true;this.status.hidden=true;setTimeout(()=>this.map.invalidateSize(),50)}catch{this.status.textContent='지도를 불러올 수 없습니다. 노선 목록으로 계속 플레이할 수 있습니다.';this.status.classList.add('error')}}
 drawLines(){if(!this.L)return;this.lineLayer.clearLayers();for(const route of this.routes){if(this.filter!=='all'&&route.category!==this.filter)continue;const points=routeGeometry(route);if(!points.length||route.countryId!=='kr'&&points.length<2)continue;const line=this.L.polyline(points,{color:route.lineColor,weight:route.id===this.activeRouteId?8:4,opacity:route.id===this.activeRouteId?1:.65,pane:'overlayPane'}).addTo(this.lineLayer);line.bindTooltip(`${route.operator.ja} · ${route.line.ja}`,{sticky:true});line.on('click',()=>this.selectRoute(route))}}
 drawStations(){
  if(!this.L)return;
  this.stationLayer.clearLayers();
  const zoom=this.map.getZoom();
  if(zoom<10)return;
  const visibleRoutes=this.routes.filter(r=>this.filter==='all'||r.category===this.filter),
    routeLookup=new Map(visibleRoutes.map(route=>[route.id,route])),
    visibleRouteIds=new Set(routeLookup.keys());
  for(const station of this.stations){
    if(!station.inTokyo)continue;
    const refs=station.lines.filter(ref=>visibleRouteIds.has(ref.routeId));
    if(!refs.length||zoom<12&&refs.length<3)continue;
    // Each interchange is one logical stop, but the actual route platforms
    // have independent track positions. Plot those when a route is hydrated.
    const routeCoordinates=[];
    if(zoom>=14)for(const ref of refs){
      const route=routeLookup.get(ref.routeId);
      const stop=route?.stations?.find(item=>
        String(item.stationMasterId||item.sourceStationId||item.id)===String(station.id));
      if(Number.isFinite(stop?.latitude)&&Number.isFinite(stop?.longitude))
        routeCoordinates.push([stop.latitude,stop.longitude]);
    }
    const positions=routeCoordinates.length?routeCoordinates:[[station.latitude,station.longitude]];
    const distinct=new Set();
    for(const position of positions){
      if(!position.every(Number.isFinite))continue;
      const key=position.map(n=>Number(n).toFixed(6)).join(':');
      if(distinct.has(key))continue;
      distinct.add(key);
      const marker=this.L.circleMarker(position,{radius:zoom>=14?6:4,color:'#111921',weight:1,fillColor:'#fff',fillOpacity:.95}).addTo(this.stationLayer);
      if(zoom>=14)marker.bindTooltip(station.ja,{permanent:true,direction:'right',className:'station-label'});
      marker.on('click',()=>this.showStation(station));
    }
  }
 }
 setFilter(filter){this.filter=filter;this.activeRouteId=null;this.drawLines();this.drawStations()}
 reset(){if(this.map)this.map.fitBounds(tokyoBounds);this.activeRouteId=null;this.drawLines();document.querySelector('#station-info').hidden=true}
 selectRoute(route){this.activeRouteId=route.id;this.drawLines();if(this.map){const pts=route.stations.map(s=>[s.latitude,s.longitude]);this.map.fitBounds(pts,{padding:[35,35]})}const panel=document.querySelector('#station-info');panel.hidden=false;panel.innerHTML=`<button class="station-info-close" aria-label="닫기">×</button><span class="map-kicker">${escapeHtml(route.operator.ja)}</span><h3>${escapeHtml(route.line.ja)}</h3><p>${escapeHtml(route.line.en)} · ${escapeHtml(route.line.ko)}</p><strong>${route.stations.length} STATIONS</strong><button class="btn primary" data-map-play>PLAY →</button>`;panel.querySelector('.station-info-close').onclick=()=>panel.hidden=true;panel.querySelector('[data-map-play]').onclick=()=>this.onPlay(route);this.onRoute?.(route)}
 showStation(station){const panel=document.querySelector('#station-info');panel.hidden=false;const grouped=Object.entries(station.lines.reduce((a,x)=>{(a[x.operatorJa]??=[]).push(x);return a},{}));panel.innerHTML=`<button class="station-info-close" aria-label="닫기">×</button><span class="map-kicker">STATION</span><h3>${escapeHtml(this.routes?.[0]?.countryId==='kr'?koreanStationDisplayName(station.ko,'kr',this.routes[0]):station.ja)}</h3><p>${escapeHtml(station.romaji)} · ${escapeHtml(koreanStationDisplayName(station.ko,this.routes?.[0]?.countryId,this.routes?.[0]))}</p><div class="station-lines">${grouped.map(([op,ls])=>`<div><b>${escapeHtml(op)}</b>${ls.map(x=>`<button data-station-route="${x.routeId}"><i style="background:${this.routes.find(r=>r.id===x.routeId)?.lineColor||'#777'}"></i>${escapeHtml(x.lineJa)} ${escapeHtml(x.code||'')}</button>`).join('')}</div>`).join('')}</div>`;panel.querySelector('.station-info-close').onclick=()=>panel.hidden=true;panel.querySelectorAll('[data-station-route]').forEach(b=>b.onclick=()=>{const r=this.routes.find(x=>x.id===b.dataset.stationRoute);if(r)this.selectRoute(r)})}
 focusStation(station){if(!this.map)return;this.map.setView([station.latitude,station.longitude],15);this.drawStations();this.showStation(station)}
 search(query){const q=normalize(query);if(!q)return[];return this.stations.filter(s=>normalize([s.ja,s.kana,s.romaji,s.ko,...(s.koAliases||[])].join(' ')).includes(q)).slice(0,8)}
}

export class CustomGeoMap{
 constructor(container,status,onAdd,onMove){this.container=container;this.status=status;this.onAdd=onAdd;this.onMove=onMove;this.markers=[]}
 async init(route){this.route=route;try{const L=await ensureLeaflet();this.L=L;this.map=L.map(this.container,{center:[35.6812,139.7671],zoom:11});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(this.map);this.layer=L.layerGroup().addTo(this.map);this.map.on('click',e=>this.onAdd({latitude:+e.latlng.lat.toFixed(6),longitude:+e.latlng.lng.toFixed(6)}));this.status.hidden=true;this.render(route)}catch{this.status.textContent='지도를 불러올 수 없습니다. SCHEMATIC 편집은 계속 사용할 수 있습니다.';this.status.classList.add('error')}}
 render(route){this.route=route;if(!this.L)return;this.layer.clearLayers();this.markers=[];const points=route.stations.filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).map(s=>[s.latitude,s.longitude]);if(points.length>1)this.L.polyline(points,{color:route.lineColor,weight:6}).addTo(this.layer);route.stations.forEach((s,i)=>{if(!Number.isFinite(s.latitude)||!Number.isFinite(s.longitude))return;const marker=this.L.marker([s.latitude,s.longitude],{draggable:true,title:koreanStationDisplayName(route.countryId==='kr'?s.ko:s.ja||s.ko,route.countryId,s.segment||route)||`역 ${i+1}`}).addTo(this.layer);marker.bindTooltip(koreanStationDisplayName(route.countryId==='kr'?s.ko:s.ja||s.ko,route.countryId,s.segment||route)||`역 ${i+1}`);marker.on('dragend',e=>{const p=e.target.getLatLng();this.onMove(i,{latitude:+p.lat.toFixed(6),longitude:+p.lng.toFixed(6)})});this.markers.push(marker)})}
 show(){if(this.map)setTimeout(()=>this.map.invalidateSize(),50)}
}
