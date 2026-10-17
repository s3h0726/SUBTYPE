import {travelGeometry,vehicleIcon} from './route-renderer.js';
import {formatJourneyDistanceAnalogy} from './distance-analogies.js';
/* Shared completion map for every playable transport line. */
let completedMap;
const number=v=>Number.isFinite(Number(v))?Number(v):NaN;
const coordinate=s=>{const p=[number(s?.latitude??s?.coordinates?.lat),number(s?.longitude??s?.coordinates?.lng)];return p.every(Number.isFinite)?p:null};
const same=(a,b)=>a&&b&&Math.abs(a[0]-b[0])<.0000001&&Math.abs(a[1]-b[1])<.0000001;
function segmentPath(route,from,to){
 const stations=route.stations||[],i=stations.findIndex(s=>s.id===from.id),j=stations.findIndex(s=>s.id===to.id);
 if(Math.abs(i-j)!==1)return null;
 if(route.countryId!=='kr'&&!Array.isArray(route.directedSegments)&&Array.isArray(route.geometry)&&route.geometry.length>1){
  const source=route.geometry,first=stations[i],last=stations[j];
  const index=s=>Number.isInteger(s.geometryIndex)?s.geometryIndex:source.findIndex(p=>same(p,coordinate(s)));
  const x=index(first),y=index(last);
  if(x>=0&&y>=0&&x!==y){const raw=x<y?source.slice(x,y+1):source.slice(y,x+1).reverse();const path=raw.map(p=>[number(p[0]),number(p[1])]);if(path.length>=2&&path.every(p=>p.every(Number.isFinite)))return path}
 }
 
 const segment=route.directedSegments?.[Math.min(i,j)];
 if(!Array.isArray(segment?.geometry)||segment.geometry.length<2||route.countryId==='kr'&&segment.geometryStatus!=='ready')return null;
 const a=segment.geometry.map(p=>[number(p[0]),number(p[1])]).filter(p=>p.every(Number.isFinite));
 if(a.length<2)return null;
 const first=coordinate(from),last=coordinate(to);
 return first&&last&&Math.abs(a[0][0]-first[0])+Math.abs(a[0][1]-first[1])>Math.abs(a.at(-1)[0]-first[0])+Math.abs(a.at(-1)[1]-first[1])?a.reverse():a;
}
let journeyMap=null,journeyTrain=null,trainAnimation=null,journeyLayer=null;
function stopTrain(){if(trainAnimation!==null)cancelAnimationFrame(trainAnimation);trainAnimation=null;if(journeyMap){journeyMap.remove();journeyMap=null}journeyTrain=null}
async function showCompletedJourneyOnMap(result){
 stopTrain();
 const box=document.getElementById('result-journey-map'),note=document.getElementById('result-journey-note'),heading=document.getElementById('result-journey-heading');
 if(!box||!note||!heading)return;
 const route=result.mapRoute||result.route||{},stations=route.stations||[],byId=new Map(stations.map(s=>[s.id,s]));
 const passed=(result.typedStationIds||[]).map(id=>byId.get(id)).filter(Boolean);
 heading.textContent=(passed[0]?.ko||passed[0]?.ja||'출발')+' → '+(passed.at(-1)?.ko||passed.at(-1)?.ja||'도착');
 // Replay the exact same geometry and station offsets used by the live game renderer.
 const travel=travelGeometry(route),parts=[];let missing=0;
 for(let i=1;i<passed.length;i++){
  const fromIndex=stations.findIndex(st=>st.id===passed[i-1].id),toIndex=stations.findIndex(st=>st.id===passed[i].id);
  let path=null;
  if(travel&&fromIndex>=0&&toIndex>=0&&fromIndex!==toIndex){
   const x=travel.offsets[fromIndex],y=travel.offsets[toIndex];
   if(Number.isInteger(x)&&Number.isInteger(y)&&x!==y)path=x<y?travel.points.slice(x,y+1):travel.points.slice(y,x+1).reverse();
  }
  if(path?.length>1)parts.push({points:path,verified:route.countryId!=='kr'||route.geometryReady===true});
  else {const from=coordinate(passed[i-1]),to=coordinate(passed[i]);if(from&&to){parts.push({points:[from,to],verified:false});missing++}}
 }
 if(!parts.length){note.textContent='경로 좌표를 확인할 수 없습니다.';box.replaceChildren();return}
 box.replaceChildren();box.style.display='block';
 const {ensureLeaflet}=await import('./network-map.js');
 const L=await ensureLeaflet();
 if(document.getElementById('result-journey')?.hidden)return;
 journeyMap=L.map(box,{zoomControl:true,scrollWheelZoom:false,minZoom:5,maxZoom:18,attributionControl:true});
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,keepBuffer:8,updateWhenIdle:true,attribution:'&copy; OpenStreetMap contributors'}).addTo(journeyMap);
 const color=/^#[0-9a-f]{3,8}$/i.test(route.lineColor||'')?route.lineColor:'#18a77c';
 const linePoints=[];
 for(const part of parts){
  L.polyline(part.points,{color:part.verified?color:'#9aa6a2',weight:part.verified?7:4,opacity:0.95,dashArray:part.verified?null:'6 8',lineCap:'round'}).addTo(journeyMap);
  linePoints.push(...(!linePoints.length?part.points:part.points.slice(1)));
 }
 for(let i=0;i<passed.length;i++){
  const position=coordinate(passed[i]);if(!position)continue;
  L.circleMarker(position,{radius:i===0||i===passed.length-1?7:3,weight:2,color:'#ffffff',fillColor:i===0?'#16a34a':i===passed.length-1?'#dc2626':color,fillOpacity:1}).bindTooltip(passed[i].ko||passed[i].ja||'',{direction:'top'}).addTo(journeyMap);
 }
 const bounds=L.latLngBounds(linePoints);
 // Follow-camera zoom reflects the distance covered, not an arbitrary fixed zoom.
 const travelledKm=linePoints.reduce((sum,p,i)=>i?sum+distanceMeters(linePoints[i-1],p)/1000:0,0);
 const maxFollowZoom=travelledKm<3?16:travelledKm<10?15:travelledKm<30?14:travelledKm<80?13:travelledKm<200?12:travelledKm<400?11:10;
 if(bounds.isValid()){
  journeyMap.fitBounds(bounds.pad(0.16),{maxZoom:maxFollowZoom});
  // For long routes keep enough surroundings visible while tracking, without zooming in too far.
  const initialZoom=journeyMap.getZoom();
  const followZoom=Math.min(maxFollowZoom,Math.max(initialZoom,travelledKm>=80?11:travelledKm>=30?12:13));
  journeyMap.setView(linePoints[0],followZoom,{animate:false});
 }
 journeyTrain=L.marker(linePoints[0],{interactive:false,zIndexOffset:1000,icon:vehicleIcon(L,route)}).addTo(journeyMap);
 note.textContent=missing?'메인 주행 지도의 선형 데이터를 그대로 재생합니다. 점선은 실제 선형이 확인되지 않은 '+missing+'개 구간입니다.':'메인 주행에서 사용한 실제 선형과 열차 아이콘으로 재생합니다.';
 const lengths=[0];for(let i=1;i<linePoints.length;i++)lengths.push(lengths.at(-1)+distanceMeters(linePoints[i-1],linePoints[i]));
 const total=lengths.at(-1);if(!(total>0))return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(reduced)return;
 const duration=Math.min(50000,Math.max(12000,total/25)),started=performance.now();let lastCamera=0;
 const frame=now=>{
  if(document.getElementById('result-journey')?.hidden||!journeyMap){trainAnimation=null;return}
  const distance=(now-started)%duration/duration*total;
  let k=1;while(k<lengths.length-1&&lengths[k]<distance)k++;
  const weight=(distance-lengths[k-1])/Math.max(.001,lengths[k]-lengths[k-1]);
  const from=linePoints[k-1],to=linePoints[k],point=[from[0]+(to[0]-from[0])*weight,from[1]+(to[1]-from[1])*weight];
  journeyTrain.setLatLng(point);
  if(now-lastCamera>450){lastCamera=now;const middle=journeyMap.getSize().divideBy(2);if(journeyMap.latLngToContainerPoint(point).distanceTo(middle)>85)journeyMap.panTo(point,{animate:true,duration:.3})}
  trainAnimation=requestAnimationFrame(frame);
 };
 trainAnimation=requestAnimationFrame(frame);
 requestAnimationFrame(()=>journeyMap?.invalidateSize());
}
const radians=d=>d*Math.PI/180;
const distanceMeters=(a,b)=>{const x=radians(b[0]-a[0]),y=radians(b[1]-a[1]);const h=Math.sin(x/2)**2+Math.cos(radians(a[0]))*Math.cos(radians(b[0]))*Math.sin(y/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))};
function journeyDistance(result){
 const route=result?.route||{},stations=route.stations||[],byId=new Map(stations.map(s=>[s.id,s]));
 const passed=(result?.typedStationIds||[]).map(id=>byId.get(id)).filter(Boolean);
 let meters=0,approximate=false,segments=0;
 for(let i=1;i<passed.length;i++){
  const detailed=segmentPath(route,passed[i-1],passed[i]);
  if(detailed){for(let j=1;j<detailed.length;j++)meters+=distanceMeters(detailed[j-1],detailed[j]);segments++;continue}
  const a=coordinate(passed[i-1]),b=coordinate(passed[i]);if(a&&b){meters+=distanceMeters(a,b);approximate=true;segments++}
 }
 return{meters,approximate,segments};
}

let lastJourney=null;
document.addEventListener('trt:journey-finished',event=>{
 lastJourney=event.detail;
 const button=document.getElementById('result-open-journey'),panel=document.getElementById('result-journey');
 if(button){button.disabled=false;button.textContent='내 운행 경로 보기 · 노선도 ↗'}
 if(panel)panel.hidden=true;stopTrain();
 const destination=document.getElementById('result-distance'),description=document.getElementById('result-distance-note');
 const d=journeyDistance(lastJourney);
 if(destination)destination.textContent=d.segments?(d.meters/1000).toFixed(2)+' km':'측정 불가';
 if(description)description.textContent=d.approximate?'일부 구간은 역간 직선거리 추정치입니다.':d.segments?'실제 선형 기반 이동 거리':'거리 계산을 위한 위치 정보가 없습니다.';
 const analogy=document.getElementById('result-distance-analogy');if(analogy)analogy.textContent=d.segments?formatJourneyDistanceAnalogy(d.meters/1000,lastJourney?.route?.countryId||lastJourney?.countryId||'jp'):'';
});
document.getElementById('result-open-journey')?.addEventListener('click',async event=>{
 if(!lastJourney)return;
 const button=event.currentTarget,panel=document.getElementById('result-journey');
 if(!panel)return;
 if(!panel.hidden){panel.hidden=true;stopTrain();button.textContent='내 운행 경로 보기 · 노선도 ↗';return}
 panel.hidden=false;button.textContent='지도 닫기';
 // The map is deliberately never constructed during game completion.
 try{await showCompletedJourneyOnMap(lastJourney)}catch(error){console.error('Journey map failed independently',error);const note=document.getElementById('result-journey-note');if(note)note.textContent='지도를 불러오지 못했습니다. 운행 결과는 정상적으로 보존됩니다.'}
});
