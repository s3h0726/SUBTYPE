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
let trainAnimation=null;
function stopTrain(){if(trainAnimation!==null)cancelAnimationFrame(trainAnimation);trainAnimation=null}
function showCompletedJourneyOnMap(result){
 stopTrain();
 const box=document.getElementById('result-journey-map'),note=document.getElementById('result-journey-note'),heading=document.getElementById('result-journey-heading');
 if(!box||!note||!heading)return;
 const route=result.route||{},stations=route.stations||[],byId=new Map(stations.map(s=>[s.id,s]));
 const passed=(result.typedStationIds||[]).map(id=>byId.get(id)).filter(Boolean);
 heading.textContent=(passed[0]?.ko||passed[0]?.ja||'출발')+' → '+(passed.at(-1)?.ko||passed.at(-1)?.ja||'도착');
 let track=[],missing=0;
 for(let i=1;i<passed.length;i++){
  const detailed=segmentPath(route,passed[i-1],passed[i]),a=coordinate(passed[i-1]),b=coordinate(passed[i]);
  const part=detailed||a&&b&&[a,b];
  if(!detailed)missing++;
  if(part)track.push(...(track.length?part.slice(1):part));
 }
 if(track.length<2)track=passed.map(coordinate).filter(Boolean);
 if(!track.length){box.textContent='표시할 역 좌표가 없습니다.';note.textContent='거리 및 경로 정보가 부족합니다.';return}
 // Retain shape, but remove excessive map detail; preserve endpoints.
 const stride=Math.max(1,Math.ceil(track.length/180));
 const simplified=track.filter((_,i)=>i%stride===0);
 if(!same(simplified.at(-1),track.at(-1)))simplified.push(track.at(-1));
 const width=800,height=350,pad=42;
 const lats=simplified.map(p=>p[0]),lngs=simplified.map(p=>p[1]);
 const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs);
 const k=Math.min((width-pad*2)/Math.max(.00001,(maxLng-minLng)*Math.cos(radians((minLat+maxLat)/2))),(height-pad*2)/Math.max(.00001,maxLat-minLat));
 const project=p=>[width/2+((p[1]-(minLng+maxLng)/2)*Math.cos(radians((minLat+maxLat)/2)))*k,height/2-(p[0]-(minLat+maxLat)/2)*k];
 const pts=simplified.map(project),d=pts.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(2)).join(' ')).join(' ');
 const col=/^#[0-9a-f]{3,8}$/i.test(route.lineColor||'')?route.lineColor:'#199e83';
 box.replaceChildren();
 const ns='http://www.w3.org/2000/svg';
 const el=(tag,attrs,parent)=>{const node=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));(parent||svg).append(node);return node};
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 800 350');svg.setAttribute('role','img');svg.setAttribute('aria-label','단순화된 운행 구간 노선도');svg.style.cssText='width:100%;height:100%;display:block;background:var(--surface,#f4f8f7);border-radius:14px';box.append(svg);
 el('path',{d,fill:'none',stroke:'#a7b5b0','stroke-width':12,'stroke-linecap':'round','stroke-linejoin':'round'});
 const line=el('path',{d,fill:'none',stroke:col,'stroke-width':7,'stroke-linecap':'round','stroke-linejoin':'round'});
 // Fixed endpoints and a moving train. Only this button starts the animation.
 for(const [p,label,fill] of [[pts[0],'START','#16a34a'],[pts.at(-1),'END','#dc2626']]){
  el('circle',{cx:p[0],cy:p[1],r:9,fill,stroke:'#fff','stroke-width':3});
  const t=el('text',{x:p[0],y:p[1]-16,'text-anchor':'middle',fill:'currentColor','font-size':15,'font-weight':700});t.textContent=label;
 }
 const train=el('g',{'aria-label':'움직이는 열차'});
 el('rect',{x:-12,y:-9,width:24,height:18,rx:6,fill:'#172e39',stroke:'#fff','stroke-width':2},train);
 el('rect',{x:-7,y:-5,width:14,height:6,rx:2,fill:'#a8e2ff'},train);
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(reduced){train.setAttribute('transform',`translate(${pts[0][0]} ${pts[0][1]})`)}
 else{
  const length=line.getTotalLength(),duration=Math.max(7500,Math.min(30000,pts.length*180)),started=performance.now();
  function frame(now){if(document.hidden||document.getElementById('result-journey')?.hidden){trainAnimation=null;return}
   const point=line.getPointAtLength(length*((now-started)%duration)/duration);
   train.setAttribute('transform',`translate(${point.x} ${point.y})`);
   trainAnimation=requestAnimationFrame(frame)
  }
  trainAnimation=requestAnimationFrame(frame);
 }
 note.textContent=missing?'단순화된 노선도입니다. 실제 선형이 없는 구간은 역 좌표 기준으로 연결했습니다.':'실제 선형을 단순화한 노선도입니다. 열차가 이동 경로를 반복 주행합니다.';
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
function journeyAnalogy(km){
 if(!(km>0))return '비교할 거리를 계산할 수 없습니다.';
 const laps=Math.round(km/.4),marathons=(km/42.195).toFixed(1);
 if(km<15)return '400m 운동장 트랙 약 '+laps+'바퀴';
 if(km<100)return '풀마라톤 약 '+marathons+'회 거리 · 운동장 약 '+laps+'바퀴';
 // Approximate intercity distances only; these are not exact rail travel distances.
 const comparisons=[['서울~대전',150],['서울~강릉',220],['서울~대구',290],['서울~부산',400],['서울~광주',270],['서울~목포',350],['서울~여수',360]];
 const nearest=[...comparisons].sort((a,b)=>Math.abs(km-a[1])-Math.abs(km-b[1]))[0];
 return '풀마라톤 약 '+marathons+'회 · '+nearest[0]+' 약 '+(km/nearest[1]).toFixed(1)+'배 거리 (도시 간 거리 비교는 대략적 비유)';
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
 const analogy=document.getElementById('result-distance-analogy');if(analogy)analogy.textContent=d.segments?journeyAnalogy(d.meters/1000):'';
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
