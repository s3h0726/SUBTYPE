// OSM-backed physical Suseo–Pyeongtaek HSR geometry; never use station-to-station chords.
// A train's own verified stopping pattern is unchanged. Only matching Suseo HSR
// corridor intervals are swapped for the actual, continuous OSM rail node chain.
const TRACK_FILE='data/kr/physical/suseo-pyeongtaek.json';
let sourcePromise;
const stationName=station=>String(station?.ko||station?.names?.ko||station?.nameKo||'').trim();
const close=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&Math.hypot(
  (a[0]-b[0])*111.195,(a[1]-b[1])*88)<0.35;
const reverse=geometry=>geometry.map(point=>[...point]).reverse();
const concatenate=segments=>segments.flatMap((part,i)=>i?part.geometry.slice(1):part.geometry);
export function verifySuseoTrack(record){
 if(record?.id!=='kr-physical-suseo-pyeongtaek-highspeed'||
    record?.source?.license!=='ODbL-1.0')throw Error('SUSEO_HSR_SOURCE_ID');
 for(const kind of ['srt','gtx']){
  const service=record[kind];
  if(service?.stations?.length!==4||service?.segments?.length!==3)throw Error('SUSEO_HSR_STATIONS');
  for(let i=0;i<3;i++){
   const part=service.segments[i],points=part?.geometry;
   if(part?.from!==service.stations[i].ko||part?.to!==service.stations[i+1].ko||
      !Array.isArray(points)||points.length<2||!part.wayIds?.length||
      !close(points[0],[service.stations[i].latitude,service.stations[i].longitude])||
      !close(points.at(-1),[service.stations[i+1].latitude,service.stations[i+1].longitude]))
     throw Error('SUSEO_HSR_OSM_CONTINUITY');
   if(i&&!close(service.segments[i-1].geometry.at(-1),points[0]))throw Error('SUSEO_HSR_JUNCTION');
  }
 }
 return record;
}
export function loadSuseoTrack(){
 return sourcePromise??=(async()=>{
  const response=await fetch(new URL(TRACK_FILE,document.baseURI),{cache:'no-cache'});
  if(!response.ok)throw Error('SUSEO_HSR_HTTP_'+response.status);
  const record=verifySuseoTrack(await response.json());
  globalThis.TRT_KR_SUSEO_PYEONGTAEK_TRACK=record;
  return record;
 })().catch(error=>{sourcePromise=null;throw error});
}
function pathBetween(track,from,to){
 const ordered=['수서','동탄','평택지제','SR분기 접속부'],a=ordered.indexOf(from),b=ordered.indexOf(to);
 if(a<0||b<0||a===b)return null;
 // The SRT/Gyeongbu handoff is not a passenger station; cover only called pairs.
 const parts=[];
 for(let i=Math.min(a,b);i<Math.max(a,b);i++)parts.push({geometry:track.srt.segments[i].geometry});
 const geometry=concatenate(parts);
 return a<b?geometry:reverse(geometry);
}
function replaceConsecutiveSegments(item,track){
 if(!item||!Array.isArray(item.stations)||item.stations.length<2||
    !Array.isArray(item.directedSegments)||item.directedSegments.length!==item.stations.length-1)return item;
 const names=item.stations.map(stationName);
 if(!names.includes('수서')||(!names.includes('동탄')&&!names.includes('평택지제')))return item;
 const next=[],indices=[0];let didChange=false;
 for(let i=0;i<item.directedSegments.length;i++){
  const old=item.directedSegments[i],candidate=pathBetween(track,names[i],names[i+1]);
  const geometry=candidate||old.geometry;
  if(!Array.isArray(geometry)||geometry.length<2)return item;
  next.push(candidate?{...old,geometry,geometryStatus:'ready',trackCorridorId:track.id,
    trackSource:'OpenStreetMap',sourceWayIds:track.srt.segments.flatMap(s=>s.wayIds)}:old);
  didChange||=!!candidate;
  indices.push(indices.at(-1)+geometry.length-1);
 }
 if(!didChange)return item;
 // Never silently bridge a missing connection to an unrelated railway.
 for(let i=1;i<next.length;i++)if(!close(next[i-1].geometry.at(-1),next[i].geometry[0]))return item;
 const geometry=concatenate(next);
 return {...item,geometry,directedSegments:next,
   stations:item.stations.map((station,i)=>({...station,geometryIndex:indices[i]})),
   geometryReady:true,geometryStatus:'ready'};
}
export function applySuseoTrack(raw,track=globalThis.TRT_KR_SUSEO_PYEONGTAEK_TRACK){
 if(!track||raw?.countryId!=='kr'||raw?.schemaVersion!==2||
    !/high.speed/i.test(String(raw.mode)+' '+String(raw.category)))return raw;
 const journeys=Array.isArray(raw.verifiedJourneys)?
   raw.verifiedJourneys.map(j=>replaceConsecutiveSegments(j,track)):raw.verifiedJourneys;
 const main=replaceConsecutiveSegments(raw,track);
 if(main===raw&&journeys===raw.verifiedJourneys)return raw;
 return {...main,verifiedJourneys:journeys};
}
