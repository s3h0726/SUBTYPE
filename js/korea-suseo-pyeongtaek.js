// OSM-backed physical Suseo–Pyeongtaek HSR geometry; never use station-to-station chords.
// A train's own verified stopping pattern is unchanged. Only matching Suseo HSR
// corridor intervals are swapped for the actual, continuous OSM rail node chain.
const SUSEO_TRACK_FILE='data/kr/physical/suseo-pyeongtaek.json';
let suseoTrackSourcePromise;
const suseoStationName=station=>String(station?.ko||station?.names?.ko||station?.nameKo||'').trim();
// A station or junction may be accepted only at its exact source OSM vertex.
// Proximity (even a few metres) does not prove track continuity.
// An endpoint source node ID is provenance for that endpoint, not for every
// intermediate geometry vertex; source-way edge validation is a separate test.
// An OSM vertex must match exactly; proximity is not proof of a railway junction.
const suseoSameVertex=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length>=2&&b.length>=2&&a[0]===b[0]&&a[1]===b[1];
const reverseSuseoGeometry=geometry=>geometry.map(point=>[...point]).reverse();
const concatSuseoSegments=segments=>segments.flatMap((part,i)=>i?part.geometry.slice(1):part.geometry);
export function verifySuseoTrack(record){
 if(record?.id!=='kr-physical-suseo-pyeongtaek-highspeed'||
    record?.source?.license!=='ODbL-1.0')throw Error('SUSEO_HSR_SOURCE_ID');
 for(const kind of ['srt','gtx']){
  const service=record[kind];
  if(service?.stations?.length!==4||service?.segments?.length!==3)throw Error('SUSEO_HSR_STATIONS');
  if(service.stations.some(stop=>!/^\d+$/.test(String(stop?.osmNodeId??''))))
   throw Error('SUSEO_HSR_SOURCE_NODE_ID');
  for(let i=0;i<3;i++){
   const part=service.segments[i],points=part?.geometry,sourceIds=part?.sourceNodeIds;
   if(!Array.isArray(sourceIds)||sourceIds.length!==2||
      String(sourceIds[0])!==String(service.stations[i].osmNodeId)||
      String(sourceIds[1])!==String(service.stations[i+1].osmNodeId))
    throw Error('SUSEO_HSR_SOURCE_NODE_ID');
   if(part?.from!==service.stations[i].ko||part?.to!==service.stations[i+1].ko||
      !Array.isArray(points)||points.length<2||!part.wayIds?.length||
      !suseoSameVertex(points[0],[service.stations[i].latitude,service.stations[i].longitude])||
      !suseoSameVertex(points.at(-1),[service.stations[i+1].latitude,service.stations[i+1].longitude]))
     throw Error('SUSEO_HSR_OSM_CONTINUITY');
   if(i&&!suseoSameVertex(service.segments[i-1].geometry.at(-1),points[0]))
    throw Error('SUSEO_HSR_JUNCTION');
  }
 }
 return record;
}
export function loadSuseoTrack(){
 return suseoTrackSourcePromise??=(async()=>{
  const response=await fetch(new URL(SUSEO_TRACK_FILE,document.baseURI),{cache:'no-cache'});
  if(!response.ok)throw Error('SUSEO_HSR_HTTP_'+response.status);
  const record=verifySuseoTrack(await response.json());
  globalThis.TRT_KR_SUSEO_PYEONGTAEK_TRACK=record;
  return record;
 })().catch(error=>{suseoTrackSourcePromise=null;throw error});
}
function suseoPathBetween(track,from,to){
 const ordered=['수서','동탄','평택지제','SR분기 접속부'],a=ordered.indexOf(from),b=ordered.indexOf(to);
 if(a<0||b<0||a===b)return null;
 // The SRT/Gyeongbu handoff is not a passenger station; cover only called pairs.
 const parts=[];
 for(let i=Math.min(a,b);i<Math.max(a,b);i++)parts.push({geometry:track.srt.segments[i].geometry});
 const geometry=concatSuseoSegments(parts);
 return a<b?geometry:reverseSuseoGeometry(geometry);
}
// Through SRT trains may not call Dongtan or PyeongtaekJije. Join the
// Suseo corridor to the existing onward railway only at the SAME original
// OSM vertex of the SR/Gyeongbu junction; never draw a proximity chord.
function suseoThroughJunction(track,from,to,original){
 if(!Array.isArray(original)||original.length<2)return null;
 if((from==='수서')===(to==='수서'))return null;
 const full=concatSuseoSegments(track.srt.segments);
 const junction=full.at(-1);
 const exact=p=>Array.isArray(p)&&p.length>=2&&p[0]===junction[0]&&p[1]===junction[1];
 if(from==='수서'){
  const index=original.findIndex(exact);
  if(index<0||index===original.length-1)return null;
  return [...full,...original.slice(index+1)];
 }
 const index=original.findIndex(exact);
 if(index<=0)return null;
 return [...original.slice(0,index),...reverseSuseoGeometry(full)];
}
function replaceSuseoConsecutiveSegments(item,track){
 if(!item||!Array.isArray(item.stations)||item.stations.length<2||
    !Array.isArray(item.directedSegments)||item.directedSegments.length!==item.stations.length-1)return item;
 const names=item.stations.map(suseoStationName);
 if(!names.includes('수서'))return item;
 const next=[],indices=[0],correctedStopIndices=new Set();let didChange=false;
 for(let i=0;i<item.directedSegments.length;i++){
  const old=item.directedSegments[i],candidate=suseoPathBetween(track,names[i],names[i+1]);
  const verified=candidate||suseoThroughJunction(track,names[i],names[i+1],old.geometry);
  const geometry=verified||old.geometry;
  if(!Array.isArray(geometry)||geometry.length<2)return item;
  next.push(verified?{...old,geometry,geometryStatus:'ready',trackCorridorId:track.id,
    trackSource:'OpenStreetMap',sourceWayIds:track.srt.segments.flatMap(s=>s.wayIds)}:old);
  if(verified){
   if(candidate){correctedStopIndices.add(i);correctedStopIndices.add(i+1)}
   else if(names[i]==='수서')correctedStopIndices.add(i);
   else if(names[i+1]==='수서')correctedStopIndices.add(i+1);
  }
  didChange||=!!verified;
  indices.push(indices.at(-1)+geometry.length-1);
 }
 if(!didChange)return item;
 // A near miss (even a few metres) is NOT proof of a rail junction. In
 // particular, do not silently bridge Pyeongtaek Jije's nearby rail tracks.
 for(let i=1;i<next.length;i++)if(!suseoSameVertex(next[i-1].geometry.at(-1),next[i].geometry[0]))return item;
 const geometry=concatSuseoSegments(next);
 const stationCatalog=new Map(track.srt.stations.map(stop=>[stop.ko,stop]));
 const stations=item.stations.map((station,i)=>{
  const result={...station,geometryIndex:indices[i]};
  if(!correctedStopIndices.has(i))return result;
  const source=stationCatalog.get(names[i]);
  if(!source)return result;
  const coordinate=[source.latitude,source.longitude];
  if(!suseoSameVertex(geometry[indices[i]],coordinate))return null;
  // The imported stop may refer to a different platform. Once geometry is
  // replaced, record the actual source-backed HSR stop coordinate too.
  return {...result,latitude:source.latitude,longitude:source.longitude,
   physicalTrackStopNodeId:source.osmNodeId};
 });
 if(stations.some(s=>!s))return item;
 return {...item,geometry,directedSegments:next,stations,
   geometryReady:true,geometryStatus:'ready'};
}
export function applySuseoTrack(raw,track=globalThis.TRT_KR_SUSEO_PYEONGTAEK_TRACK){
 if(!track||raw?.countryId!=='kr'||raw?.schemaVersion!==2||
    !/high.speed/i.test(String(raw.mode)+' '+String(raw.category)))return raw;
 const previousJourneys=raw.verifiedJourneys;
 const journeys=Array.isArray(previousJourneys)?
   previousJourneys.map(j=>replaceSuseoConsecutiveSegments(j,track)):previousJourneys;
 const journeysChanged=Array.isArray(previousJourneys)&&journeys.some((journey,i)=>journey!==previousJourneys[i]);
 const main=replaceSuseoConsecutiveSegments(raw,track);
 if(main===raw&&!journeysChanged)return raw;
 return {...main,verifiedJourneys:journeysChanged?journeys:previousJourneys};
}
