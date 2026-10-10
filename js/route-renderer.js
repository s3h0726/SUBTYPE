function hideKoreanTrainFallback(target){const marker=target?.parentElement?.querySelector('.kr-train-fallback');if(marker)marker.hidden=true}
function showKoreanTrainFallback(route,index,target){if(!target)return;let marker=target.parentElement.querySelector('.kr-train-fallback');if(!marker){marker=document.createElement('div');marker.className='kr-train-fallback';marker.style.cssText='position:absolute;z-index:1200;top:42%;left:50%;transform:translate(-50%,-50%);padding:15px 24px;border-radius:45px;background:#102a28;color:#fff;border:3px solid #6ae4bd;box-shadow:0 8px 25px #0008;pointer-events:none;font-weight:800;text-align:center';target.parentElement.append(marker)}marker.hidden=false;const name=route.stations?.[index]?.ko||route.stations?.[index]?.ja||'';marker.textContent=(route.mode==='river_bus'?'⛴ ':'🚆 ')+(route.line?.ko||'열차')+' · '+name}
import{$,escapeHtml}from'./utils.js';
import{ensureLeaflet}from'./network-map.js';
import{lineBadgeMeta}from'./line-badge.js';

let gameRail=null,renderQueue=Promise.resolve(),resizeBound=false;
const latLngs=route=>route.stations.map(station=>[station.latitude,station.longitude]);
const geometryPoints=route=>Array.isArray(route.geometry)&&route.geometry.length>1?route.geometry:latLngs(route);
function koreaTrackGeometry(route){
  const match=/^kr-metro-(\d+)/.exec(route?.id||'');
  const codes={1:'line_1',2:'line_2',3:'line_3',4:'line_4',5:'line_5',6:'line_6',7:'line_7',8:'line_8',9:'line_9',10:'incheon_line_1',11:'incheon_line_2',12:'gyeonggang_line',13:'gyeongui_jungang_line',14:'gyeongchun_line',15:'airport_line',16:'seohae_line',17:'suin_bundang_line',18:'shinbundang_line',19:'sillim_line',20:'ui_sinseol_light_rail_line',21:'gimpo_line',22:'everline',23:'uijeongbu_light_rail_line'};
  const paths=route?.countryId==='kr'&&match?globalThis.TRT_KOREA_TRACK_GEOMETRY?.[codes[Number(match[1])]]:null;
  if(!Array.isArray(paths)||route.stations?.length<2)return null;
  const distance=(a,b)=>Math.hypot((a[0]-b[0])*111000,(a[1]-b[1])*88000);
  const coords=route.stations.map(s=>[Number(s.latitude),Number(s.longitude)]);
  if(coords.some(p=>!p.every(Number.isFinite)||p[0]===0||p[1]===0))return null;
  const track=paths.filter(p=>Array.isArray(p)&&p.length>1).map(p=>p.map(x=>[Number(x[1]),Number(x[0])]));
  const snaps=coords.map(pt=>{let best={dist:Infinity};track.forEach((line,k)=>line.forEach((v,i)=>{const d=distance(pt,v);if(d<best.dist)best={k,i,dist:d}}));return best});
  if(snaps.some(s=>s.dist>350))return null;
  const segments=[];
  for(let n=0;n<snaps.length-1;n++){
    const a=snaps[n],b=snaps[n+1];if(a.k!==b.k)return null;
    const line=track[a.k],points=a.i<=b.i?line.slice(a.i,b.i+1):line.slice(b.i,a.i+1).reverse();
    if(points.length<2||points.some((p,i)=>i>0&&distance(p,points[i-1])>1800))return null;
    const length=points.slice(1).reduce((sum,p,i)=>sum+distance(p,points[i]),0);
    if(length>Math.max(12000,distance(coords[n],coords[n+1])*4))return null;
    segments.push([coords[n],...points,coords[n+1]]);
  }
  const points=[],offsets=[];
  segments.forEach((seg,i)=>{offsets[i]=points.length;points.push(...(i?seg.slice(1):seg))});
  offsets.push(points.length-1);
  return{points,offsets};
}
function travelGeometry(route){const korea=koreaTrackGeometry(route);if(korea)return korea;const stations=route.stations,points=[],offsets=[],directed=route.directedSegments;if(Array.isArray(directed)&&directed.length===stations.length-1){for(let i=0;i<directed.length;i++){offsets[i]=Math.max(0,points.length-1);let part=directed[i].geometry.map(point=>[Number(point[0]),Number(point[1])]);if(points.length&&part.length&&points.at(-1)[0]===part[0][0]&&points.at(-1)[1]===part[0][1])part=part.slice(1);points.push(...part)}offsets[stations.length-1]=Math.max(0,points.length-1);return{points,offsets}}const source=geometryPoints(route);for(let i=0;i<stations.length;i++){offsets[i]=Math.max(0,points.length-1);if(i===stations.length-1)break;const a=Number.isInteger(stations[i].geometryIndex)?stations[i].geometryIndex:source.findIndex(p=>p[0]===stations[i].latitude&&p[1]===stations[i].longitude),b=Number.isInteger(stations[i+1].geometryIndex)?stations[i+1].geometryIndex:source.findIndex(p=>p[0]===stations[i+1].latitude&&p[1]===stations[i+1].longitude);let part=a<=b?source.slice(Math.max(0,a),b+1):source.slice(Math.max(0,b),a+1).reverse();if(!part.length)part=[[stations[i].latitude,stations[i].longitude],[stations[i+1].latitude,stations[i+1].longitude]];if(points.length&&points.at(-1)[0]===part[0][0]&&points.at(-1)[1]===part[0][1])part=part.slice(1);points.push(...part)}offsets[stations.length-1]=Math.max(0,points.length-1);return{points,offsets}}
const validCoordinates=route=>route.stations.every(station=>Number.isFinite(station.latitude)&&Number.isFinite(station.longitude));
function stationIcon(L,station,kind='other',color='#49c888'){
  const current=kind==='current',visible=kind!=='other',size=current?18:11;
  return L.divIcon({className:'osm-station-icon-wrap',html:`<span class="osm-station-dot ${kind}" style="--marker-color:${color};width:${size}px;height:${size}px"></span>${visible?`<span class="osm-station-label ${kind}"><b>${escapeHtml(station.ja)}</b><small>${escapeHtml(station.ko)}</small></span>`:''}`,iconSize:[20,20],iconAnchor:[10,10]})
}
function vehicleIcon(L,route){const badge=lineBadgeMeta(route),mode=route.mode||'rail',kind=['bus','village_bus','express_bus'].includes(mode)?'bus':mode==='river_bus'?'boat':mode==='high_speed_rail'?'high-speed':'train',label=kind==='bus'?'버스':kind==='boat'?'한강버스':kind==='high-speed'?'고속열차':'열차';return L.divIcon({className:'osm-train-wrap',html:`<span class="osm-train vehicle-${kind}" style="--train-color:${route.lineColor}" aria-label="${label} 위치"><i aria-hidden="true"></i><b>${escapeHtml(badge.code)}</b></span>`,iconSize:[60,54],iconAnchor:[30,27]})}
function updateDebug(){globalThis.__TRT_MAP_DEBUG__={mapObjects:gameRail?.map?1:0,tileLayers:gameRail?.tile?1:0,trainMarkers:gameRail?.train?1:0,stationMarkers:gameRail?.markers?.length||0,routeId:gameRail?.routeId||null,routeKey:gameRail?.routeKey||null,currentIndex:gameRail?.index??null,typingProgress:gameRail?.typingProgress??0};const target=$('#provider-basemap');if(target)Object.entries(globalThis.__TRT_MAP_DEBUG__).forEach(([key,value])=>target.dataset[key]=String(value))}
async function ensureGameMap(target){
  if(gameRail?.map)return gameRail;
  const L=await ensureLeaflet(),map=L.map(target,{zoomControl:true,attributionControl:true,keyboard:true,dragging:true,scrollWheelZoom:true,doubleClickZoom:true,boxZoom:true,touchZoom:true,minZoom:8,maxZoom:18});
  const tile=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(map);
  const railLayer=L.layerGroup().addTo(map),stationLayer=L.layerGroup().addTo(map),trainLayer=L.layerGroup().addTo(map);
  gameRail={L,map,tile,railLayer,stationLayer,trainLayer,routeId:null,routeKey:null,markers:[],train:null,index:0,typingProgress:0,animation:null,points:[]};
  tile.on('tileerror',()=>{const status=$('#basemap-status');if(status)status.textContent='OPENSTREETMAP · TILE RETRY'});
  if(!resizeBound){resizeBound=true;addEventListener('resize',()=>{if(!gameRail?.map)return;clearTimeout(gameRail.resizeTimer);gameRail.resizeTimer=setTimeout(()=>gameRail.map.invalidateSize(),120)})}
  updateDebug();return gameRail
}
function stopAnimation(rail){if(rail.animation){cancelAnimationFrame(rail.animation);rail.animation=null}if(rail.typingAnimation){cancelAnimationFrame(rail.typingAnimation);rail.typingAnimation=null}rail.typingTarget=null}
function animateTrain(rail,from,to,motion){
  stopAnimation(rail);const duration=motion===false?0:90,start=performance.now();
  const frame=now=>{const p=duration?Math.min(1,(now-start)/duration):1,eased=1-Math.pow(1-p,3),point=[from[0]+(to[0]-from[0])*eased,from[1]+(to[1]-from[1])*eased];rail.train.setLatLng(point);if(p<1)rail.animation=requestAnimationFrame(frame);else rail.animation=null};frame(start)
}
function typingSegment(rail,from,to){const key=`${from}:${to}`;if(rail.segmentCache.has(key))return rail.segmentCache.get(key);const a=rail.stationOffsets[from],b=rail.stationOffsets[to],segment=a<=b?rail.points.slice(a,b+1):rail.points.slice(b,a+1).reverse(),lengths=new Float64Array(segment.length);for(let i=1;i<segment.length;i++){const p=segment[i-1],q=segment[i],dx=(q[1]-p[1])*Math.cos((p[0]+q[0])*Math.PI/360),dy=q[0]-p[0];lengths[i]=lengths[i-1]+Math.hypot(dx,dy)}const cached={segment,lengths,total:lengths.at(-1)||0};rail.segmentCache.set(key,cached);return cached}
function clearRouteLayers(rail){stopAnimation(rail);rail.railLayer.clearLayers();rail.stationLayer.clearLayers();rail.trainLayer.clearLayers();rail.markers=[];rail.train=null;rail.routeId=null;rail.routeKey=null;rail.points=[];updateDebug()}
function createRouteLayers(rail,route,index,options={}){
  clearRouteLayers(rail);const {L,map}=rail,stationPoints=latLngs(route),travel=travelGeometry(route),points=travel.points;rail.routeId=route.id;rail.routeKey=route.renderKey||route.id;rail.points=points;rail.stationPoints=stationPoints;rail.stationOffsets=travel.offsets;rail.segmentCache=new Map();rail.index=index;rail.nextIndex=Number.isInteger(options.nextRouteIndex)?options.nextRouteIndex:Math.min(index+1,route.stations.length-1);
  rail.base=L.polyline(points,{color:'#182923',weight:11,opacity:.55,lineCap:'round'}).addTo(rail.railLayer);if(Array.isArray(route.segments))for(const segment of route.segments){const from=travel.offsets[segment.fromStation],to=travel.offsets[segment.toStation];L.polyline(points.slice(Math.min(from,to),Math.max(from,to)+1),{color:segment.lineColor,weight:7,opacity:.72,lineCap:'round'}).addTo(rail.railLayer)}
  rail.remaining=L.polyline(points.slice(travel.offsets[index]),{color:route.lineColor,weight:7,opacity:.55,lineCap:'round'}).addTo(rail.railLayer);
  rail.completed=L.polyline(points.slice(0,travel.offsets[index]+1),{color:route.lineColor,weight:8,opacity:1,lineCap:'round'}).addTo(rail.railLayer);
  rail.markers=route.stations.map((station,i)=>L.marker(stationPoints[i],{interactive:false,keyboard:false,zIndexOffset:i===index?500:0,icon:stationIcon(L,station,i===index?'current':i===rail.nextIndex?'next':i===index-1?'previous':'other',route.lineColor)}).addTo(rail.stationLayer));
  rail.train=L.marker(stationPoints[index],{interactive:false,keyboard:false,zIndexOffset:1000,icon:vehicleIcon(L,route)}).addTo(rail.trainLayer);
  requestAnimationFrame(()=>{map.invalidateSize();const pair=[stationPoints[index],stationPoints[rail.nextIndex]].filter(Boolean);if(pair.length>1)map.fitBounds(pair,{padding:[100,100],maxZoom:16});else map.setView(stationPoints[index],15)});updateDebug()
}
function updateRouteProgress(rail,route,index,motion,options={}){
  const nextIndex=Number.isInteger(options.nextRouteIndex)?options.nextRouteIndex:Math.min(index+1,route.stations.length-1),currentPosition=rail.train?.getLatLng(),previous=currentPosition?[currentPosition.lat,currentPosition.lng]:rail.stationPoints[rail.index],next=rail.stationPoints[index];rail.remaining.setLatLngs(rail.points.slice(rail.stationOffsets[index]));rail.completed.setLatLngs(rail.points.slice(0,rail.stationOffsets[index]+1));
  rail.markers.forEach((marker,i)=>{const kind=i===index?'current':i===nextIndex?'next':i===index-1?'previous':'other';marker.setIcon(stationIcon(rail.L,route.stations[i],kind,route.lineColor));marker.setZIndexOffset(i===index?500:0)});
  const active=route.stations[index]?.segment||route;rail.train.setIcon(vehicleIcon(rail.L,active));animateTrain(rail,previous,next,motion);rail.index=index;rail.nextIndex=nextIndex;rail.typingProgress=0;const pair=[rail.stationPoints[index],rail.stationPoints[nextIndex]].filter(Boolean);if(pair.length>1)rail.map.fitBounds(pair,{padding:[100,100],maxZoom:16});else rail.map.setView(next,15);updateDebug()
}
async function renderOsm(route,index,options){
  const target=$('#provider-basemap'),status=$('#basemap-status');if(!target)return;
  if(route.geometryReady===false&&!validCoordinates(route)){if(gameRail?.map)clearRouteLayers(gameRail);showKoreanTrainFallback(route,index,target);if(status)status.textContent='역 좌표 미확보 · 위치 표시 제한';return}
  if(!validCoordinates(route)){showKoreanTrainFallback(route,index,target);if(status)status.textContent=route.countryId==='kr'?'좌표 미확보 · 열차 위치(개략)':'좌표가 없는 노선입니다';return}
  hideKoreanTrainFallback(target);
  const rail=await ensureGameMap(target),safe=Math.max(0,Math.min(index,route.stations.length-1));
  const requestedNext=Number.isInteger(options.nextRouteIndex)?options.nextRouteIndex:Math.min(safe+1,route.stations.length-1);if(rail.routeKey!==(route.renderKey||route.id))createRouteLayers(rail,route,safe,options);else if(rail.index!==safe||rail.nextIndex!==requestedNext)updateRouteProgress(rail,route,safe,options.motion,options);else rail.nextIndex=requestedNext;
  requestAnimationFrame(()=>rail.map.invalidateSize());if(status)status.textContent='OPENSTREETMAP · LIVE';
  const station=route.stations[safe],info=$('#map-station-info');if(info){info.hidden=false;info.innerHTML=`<b>${escapeHtml(station.ja)}</b><span>${escapeHtml(station.ko)} · ${escapeHtml(station.romaji)}</span>`}
}
export function renderGameMap(route,index,options={}){renderQueue=renderQueue.then(()=>renderOsm(route,index,options)).catch(error=>{console.error('OSM game map:',error);const status=$('#basemap-status');if(status)status.textContent='OPENSTREETMAP · LOAD ERROR'});return renderQueue}
function stopTypingAnimation(rail){if(rail.typingAnimation){cancelAnimationFrame(rail.typingAnimation);rail.typingAnimation=null}rail.typingTarget=null}
function animateTypingTrain(rail,target,motion=true){
  if(!rail?.train)return;
  if(motion===false){stopTypingAnimation(rail);rail.train.setLatLng(target);return}
  rail.typingTarget=target;
  if(rail.typingAnimation)return;
  let last=performance.now();
  const frame=now=>{
    const goal=rail.typingTarget;
    if(!goal){rail.typingAnimation=null;return}
    const current=rail.train.getLatLng();
    const dt=Math.min(40,Math.max(1,now-last));last=now;
    const alpha=1-Math.exp(-dt/75);
    const next=[current.lat+(goal[0]-current.lat)*alpha,current.lng+(goal[1]-current.lng)*alpha];
    const d=Math.hypot(goal[0]-next[0],goal[1]-next[1]);
    rail.train.setLatLng(d<0.0000015?goal:next);
    if(d<0.0000015){rail.typingAnimation=null;return}
    rail.typingAnimation=requestAnimationFrame(frame);
  };
  rail.typingAnimation=requestAnimationFrame(frame);
}
export function setTrainTypingProgress(progress,motion=true){
  const rail=gameRail;if(!rail?.train||!rail.points.length)return;
  const cached=typingSegment(rail,rail.index,rail.nextIndex),{segment,lengths,total}=cached;
  if(segment.length<2)return;
  const safe=Math.max(rail.typingProgress||0,Math.min(1,Number(progress)||0)),targetDistance=total*safe;
  let i=1;while(i<lengths.length&&lengths[i]<targetDistance)i++;
  const a=segment[Math.max(0,i-1)],b=segment[Math.min(i,segment.length-1)];
  const span=Math.max(.0000001,lengths[i]-lengths[i-1]),part=(targetDistance-lengths[i-1])/span;
  const target=[a[0]+(b[0]-a[0])*part,a[1]+(b[1]-a[1])*part];
  animateTypingTrain(rail,target,motion);rail.typingProgress=safe;updateDebug()
}
export function gameMapDebug(){updateDebug();return globalThis.__TRT_MAP_DEBUG__}

export function renderSvg(container,route,{editable=false,onMove}={}){const stations=route.stations||[],w=Math.max(620,stations.length*110),h=340;const points=stations.map((s,i)=>{const auto={x:60+i*(w-120)/Math.max(1,stations.length-1),y:h/2};return editable&&s.map?{x:s.map.x,y:s.map.y}:auto});const path=points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+(route.loop&&points.length>2?' Z':'');container.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(route.line?.ko||'커스텀 노선')} 노선도"><path d="${path}" fill="none" stroke="${route.lineColor}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>${points.map((p,i)=>`<g class="svg-station" data-index="${i}" transform="translate(${p.x} ${p.y})" tabindex="${editable?0:-1}"><circle r="13" fill="#fff" stroke="${route.lineColor}" stroke-width="6"/><text y="32" text-anchor="middle" font-size="13" font-weight="700">${escapeHtml(stations[i].ja||stations[i].ko||`역 ${i+1}`)}</text></g>`).join('')}</svg>`;if(!editable)return;const svg=container.querySelector('svg');let active=null;svg.addEventListener('pointerdown',e=>{const g=e.target.closest('.svg-station');if(!g)return;active=+g.dataset.index;g.setPointerCapture(e.pointerId)});svg.addEventListener('pointermove',e=>{if(active===null)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());onMove(active,{x:Math.round(p.x),y:Math.round(p.y)})});svg.addEventListener('pointerup',()=>active=null);svg.addEventListener('pointercancel',()=>active=null)}
