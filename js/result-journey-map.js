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
async function showCompletedJourneyOnMap(result){
 const root=document.getElementById('result-journey'),mapEl=document.getElementById('result-journey-map'),note=document.getElementById('result-journey-note');
 if(!root||!mapEl||!note)return;
 if(completedMap){completedMap.remove();completedMap=null}
 root.hidden=false;mapEl.replaceChildren();
 const route=result.route||{},all=route.stations||[],ids=Array.isArray(result.typedStationIds)?result.typedStationIds:[],byId=new Map(all.map(s=>[s.id,s]));
 const passed=ids.map(id=>byId.get(id)).filter(Boolean);
 if(!passed.length&&all.length)passed.push(...all.slice(0,Math.min(all.length,Math.max(1,result.completed||0))));
 const start=passed[0],end=passed.at(-1);
 document.getElementById('result-journey-heading').textContent=(start?.ko||start?.ja||'출발')+' → '+(end?.ko||end?.ja||'도착');
 const points=passed.map(coordinate).filter(Boolean);
 if(!points.length){mapEl.style.display='none';note.textContent='이 노선은 표시 가능한 위치 좌표가 없어 운행 지도를 제공할 수 없습니다.';return}
 mapEl.style.display='block';
 note.textContent='지도에서 운행 구간을 확인할 수 있습니다.';
 try{
  const {ensureLeaflet}=await import('./network-map.js');
  await ensureLeaflet();
  if(!window.L)throw Error('Leaflet unavailable');
  const L=window.L;completedMap=L.map(mapEl,{scrollWheelZoom:false,attributionControl:true,zoomControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(completedMap);
  const color=/^#[0-9a-f]{3,8}$/i.test(route.lineColor||'')?route.lineColor:'#22a87c';
  const drawn=[];let missing=0;
  for(let i=0;i<passed.length-1;i++){
   const path=segmentPath(route,passed[i],passed[i+1]);
   if(path){L.polyline(path,{color,weight:6,opacity:.92}).addTo(completedMap);drawn.push(...path)}
   else missing++;
  }
  if(!drawn.length&&passed.length===1)drawn.push(coordinate(passed[0]));
  passed.forEach((s,i)=>{const p=coordinate(s);if(!p)return;L.circleMarker(p,{radius:i===0||i===passed.length-1?7:3,color:'#ffffff',weight:2,fillColor:i===0?'#16a34a':i===passed.length-1?'#dc2626':color,fillOpacity:1}).addTo(completedMap).bindPopup((i===0?'출발: ':i===passed.length-1?'도착: ':'경유: ')+(s.ko||s.ja||s.id))});
  const bounds=L.latLngBounds(drawn.length?drawn:points);
  if(bounds.isValid())completedMap.fitBounds(bounds.pad(.16),{maxZoom:14});
  note.textContent=missing?'실제 선형 확인 구간만 강조했습니다. 선형 데이터가 없는 '+missing+'개 역간 구간은 임의의 직선으로 연결하지 않았습니다.':'운행한 '+passed.length+'개 역과 실제 선형 구간을 표시했습니다.';
  requestAnimationFrame(()=>completedMap?.invalidateSize());
 }catch(error){console.warn('Completion map unavailable',error);mapEl.style.display='none';note.textContent='지도를 불러오지 못했습니다. 운행 결과와 기록은 정상 저장되었습니다.'}
}
document.addEventListener('trt:journey-finished',event=>{showCompletedJourneyOnMap(event.detail)});
