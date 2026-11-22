// Correct GAME MAP display of KTX trunk corridors without modifying
// canonical route geometries, OSM edge proofs or real train stopping patterns.
const KTX_MAP_REFERENCE_FILE='data/kr/physical/ktx-gyeongbu-display.json';
let ktxMapReferencePromise;
const ktxDisplayDistanceKm=(a,b)=>111.195*Math.hypot(
 a[0]-b[0],(a[1]-b[1])*Math.cos((a[0]+b[0])*Math.PI/360));
const ktxDisplayValid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const ktxDisplayLength=poly=>poly.reduce((n,p,i)=>i?n+ktxDisplayDistanceKm(poly[i-1],p):n,0);
const ktxDisplaySame=(a,b)=>ktxDisplayValid(a)&&ktxDisplayValid(b)&&a[0]===b[0]&&a[1]===b[1];
export function validateKtxMapReference(record){
 if(record?.schemaVersion!==1||!record.tracks)throw Error('KTX_MAP_REFERENCE_SCHEMA');
 for(const [key,from,to,min,max]of [
  ['haengsinToSeoul','행신','서울역',13,17],
  ['daejeonToDongdaegu','대전','동대구',110,145],
  ['gyeongjuToBusan','경주','부산',77,87],
  ['dongdaeguToBusan','동대구','부산',124,136]
 ]){
  const ref=record.tracks[key],geo=ref?.geometry;
  if(ref?.displayFrom!==from||ref?.displayTo!==to||ref?.mayUseForOperationalRouting!==false||
   !Array.isArray(geo)||geo.length<20||geo.some(p=>!ktxDisplayValid(p))||
   ktxDisplayLength(geo)<min||ktxDisplayLength(geo)>max||geo.some((p,i)=>i&&ktxDisplayDistanceKm(geo[i-1],p)>2))
   throw Error('KTX_MAP_REFERENCE_INVALID_'+key);
 }
 return record;
}
export function loadKtxMapReference(){
 return ktxMapReferencePromise??=(async()=>{
  const resp=await fetch(new URL(KTX_MAP_REFERENCE_FILE,document.baseURI),{cache:'no-cache'});
  if(!resp.ok)throw Error('KTX_MAP_REFERENCE_HTTP_'+resp.status);
  const record=validateKtxMapReference(await resp.json());
  globalThis.TRT_KTX_GYEONGBU_DISPLAY_REFERENCE=record;
  return record;
 })().catch(error=>{ktxMapReferencePromise=null;throw error});
}
// The map-only centerline is smoothly aligned to the current service's
// verified station anchors in the first/last 2 km. No stop or service changes.
function adaptKtxMapToStationAnchors(reference,old){
 const a=old[0],b=old.at(-1),first=reference[0],last=reference.at(-1);
 if(ktxDisplayDistanceKm(a,first)>.40||ktxDisplayDistanceKm(b,last)>.40)return null;
 const startShift=[a[0]-first[0],a[1]-first[1]],
       endShift=[b[0]-last[0],b[1]-last[1]];
 const total=ktxDisplayLength(reference),points=[],meters=2000;
 let travelled=0;
 for(let i=0;i<reference.length;i++){
  if(i)travelled+=ktxDisplayDistanceKm(reference[i-1],reference[i]);
  const w0=Math.max(0,1-travelled*1000/meters),
        w1=Math.max(0,1-(total-travelled)*1000/meters);
  const p=reference[i];
  points.push([p[0]+startShift[0]*w0+endShift[0]*w1,
   p[1]+startShift[1]*w0+endShift[1]*w1]);
 }
 points[0]=[...a];points[points.length-1]=[...b];
 if(points.some((p,i)=>!ktxDisplayValid(p)||i&&ktxDisplayDistanceKm(points[i-1],p)>2))return null;
 return points;
}
export function mapOnlyKtxJourneySegments(route,journey,reference=globalThis.TRT_KTX_GYEONGBU_DISPLAY_REFERENCE){
 if(route?.countryId!=='kr'||route.mode!=='high_speed_rail'||!reference?.tracks||
  !Array.isArray(journey?.stations)||!Array.isArray(journey?.directedSegments))return null;
 const name=[journey.patternName?.ko,journey.service?.nameKo,route.line?.ko].join(' ');
 if(!/KTX|케이티엑스/.test(name)||/SRT|에스알티/.test(name))return null;
 const sections=journey.directedSegments;
 if(sections.length!==journey.stations.length-1)return null;
 // Gupo-bound KTX uses the conventional Gyeongbu Line south of Dongdaegu.
 // Only direct non-Gupo southbound KTX legs are eligible for this display correction.
 const viaGupo=journey.stations.some(station=>station.ko==='구포');
 let corrections=0;
 const display=sections.map((segment,i)=>{
  const from=journey.stations[i]?.ko,to=journey.stations[i+1]?.ko;
  let key=null,minimum=Infinity;
  if(i===0&&journey.stations[0]?.ko==='행신'&&from==='행신'&&to==='서울역'){
   key='haengsinToSeoul';minimum=1.3;
  }else if(from==='대전'&&to==='동대구'||from==='동대구'&&to==='대전'){
   key='daejeonToDongdaegu';minimum=12;
  }else if(!viaGupo&&((from==='경주'&&to==='부산')||(from==='부산'&&to==='경주'))){
   key='gyeongjuToBusan';minimum=8;
  }else if(!viaGupo&&((from==='동대구'&&to==='부산')||(from==='부산'&&to==='동대구'))){
   key='dongdaeguToBusan';minimum=8;
  }
  if(!key)return {...segment,geometryStatus:'ready'};
  const source=segment.geometry,ref=reference.tracks[key];
  if(!Array.isArray(source)||source.length<2||!ref?.geometry)return {...segment,geometryStatus:'ready'};
  const difference=ktxDisplayLength(source)-ref.km;
  const southReference=key==='gyeongjuToBusan'||key==='dongdaeguToBusan';
  // A conventional shortcut may be shorter than the real high-speed railway.
  // For southern KTX use absolute deviation, not just excessive route length.
  if(southReference?Math.abs(difference)<minimum:difference<minimum)
   return {...segment,geometryStatus:'ready'};
  // This is the SAME published OSM-derived railway display reference; the
  // reverse is visual-only and never asserts a new operational OSM way.
  const referenceGeometry=from===ref.displayTo&&to===ref.displayFrom?
   ref.geometry.slice().reverse():ref.geometry;
  const adapted=adaptKtxMapToStationAnchors(referenceGeometry,source);
  if(!adapted)return {...segment,geometryStatus:'ready'};
  corrections++;
  return {...segment,geometry:adapted,geometryStatus:'ready',
   gameMapVisualCorrection:{referenceJourneyId:ref.referenceJourneyId,
    source:'existing OSM high-speed railway; visual-only',appliesTo:'map and train animation'}};
 });
 if(!corrections)return null;
 for(let i=1;i<display.length;i++){
  if(!ktxDisplaySame(display[i-1].geometry.at(-1),display[i].geometry[0]))return null;
 }
 return display;
}
