'use strict';
// Verified, one-way school-day Light Rail workings. Reuse source OSM edges
// from the normal Hong Kong compiler; never reverse geometry or invent tracks.
const crypto=require('node:crypto');
const {gameplayFingerprint,reviewedGameplay}=require('./hk-release.cjs');

const SPECS=[
 {id:'hk-light-rail-506p-school-morning',lineId:'hk-light-rail-506p',code:'506P',
  names:{ja:'輕鐵 506P',en:'Light Rail 506P',ko:'경전철 506P'},
  stationCodes:['001','010','015','020','030','040','050','060','295','300','310','320','330','340','100'],
  departureTimes:['07:20','07:35'],
  timetableUrl:'https://www.mtr.com.hk/en/customer/services/schedule_index.html',
  callingOrderUrl:'https://www.mtr.com.hk/archive/corporate/en/press_release/PR-23-057-E.pdf',
  noteKo:'평일 학기 중 아침 특별 운행. 튄문 페리부두 07:20·07:35 출발, 시우홍 도착. 주말·공휴일·학교 방학 미운행. 07:20편은 720으로 계속 운행하며, 역명은 실제 정차역만 표시합니다.'},
 {id:'hk-light-rail-720-school-morning',lineId:'hk-light-rail-720',code:'720',
  names:{ja:'輕鐵 720',en:'Light Rail 720',ko:'경전철 720'},
  stationCodes:['100','350','360','370','380','425','445','448','460','490','500'],
  departureTimes:['07:46'],
  timetableUrl:'https://www.mtr.com.hk/en/customer/services/schedule_index.html',
  callingOrderUrl:'https://thehkhub.com/mtr-adds-100-trips-on-3-lines-launches-new-weekday-only-light-rail-route/',
  noteKo:'평일 학기 중 아침 특별 운행. 시우홍 07:46 출발, 틴윙 도착. 주말·공휴일·학교 방학 미운행. 506P의 07:20편에서 계속 운행하고, 틴윙부터 751P로 변경됩니다.'}
];
const meters=(a,b)=>{
 const lat=(a[0]+b[0])/2*Math.PI/180;
 return Math.hypot((a[0]-b[0])*111195,(a[1]-b[1])*111195*Math.cos(lat));
};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const asId=code=>'hk-lr-'+code;
function extraHongKongLightRailRoutes(catalog,{validationPreview=false,gameplayReview={services:{}}}={}){
 const stationCatalog=new Map(),adjacent=new Map();
 for(const route of catalog){
  if(route.countryId!=='hk'||route.category!=='light_rail'||route.geometryReady!==true||route.geometryStatus!=='verified')continue;
  for(const stop of route.stations||[])if(!stationCatalog.has(stop.id))stationCatalog.set(stop.id,stop);
  for(const edge of route.directedSegments||[]){
   if(!edge.sourceWayIds?.length||edge.geometryStatus!=='ready')continue;
   if(!adjacent.has(edge.fromStationId))adjacent.set(edge.fromStationId,[]);
   if(!adjacent.get(edge.fromStationId).some(old=>old.id===edge.id))
    adjacent.get(edge.fromStationId).push(edge);
  }
 }
 // Select the smallest number of already directed OSM edges. A merged path may
 // pass through an intermediate stop that this special service does not call.
 function findPath(start,end){
  const queue=[{id:start,path:[]}],visited=new Set([start]);
  for(let i=0;i<queue.length;i++){
   const current=queue[i];
   if(current.id===end)return current.path;
   if(current.path.length>30)continue;
   for(const edge of adjacent.get(current.id)||[]){
    if(visited.has(edge.toStationId))continue;
    visited.add(edge.toStationId);
    queue.push({id:edge.toStationId,path:[...current.path,edge]});
   }
  }
  throw Error('Missing directed OSM railway between '+start+' and '+end);
 }
 function assemble(path,from,to,i){
  if(!path.length||path[0].fromStationId!==from||path.at(-1).toStationId!==to)
   throw Error('Invalid special route path '+from+' => '+to);
  const geometry=[],gaps=[],ways=[],sources=[];
  for(let j=0;j<path.length;j++){
   const edge=path[j];
   if(j&&path[j-1].toStationId!==edge.fromStationId)throw Error('Disconnected railway IDs');
   if(j){
    const gap=meters(geometry.at(-1),edge.geometry[0]);
    if(gap>25)throw Error('Unverified track/stop offset ('+gap.toFixed(2)+'m) '+from+' => '+to);
    if(gap>0.01)gaps.push({stopId:edge.fromStationId,gapMeters:Number(gap.toFixed(2))});
   }
   geometry.push(...(!geometry.length||!same(geometry.at(-1),edge.geometry[0])?edge.geometry:edge.geometry.slice(1)));
   for(const way of edge.sourceWayIds)if(!ways.includes(way))ways.push(way);
   if(edge.sourceUrl&&!sources.includes(edge.sourceUrl))sources.push(edge.sourceUrl);
  }
  return{id:'hk-special-track-'+i,fromStationId:from,toStationId:to,geometry,
   segmentLengthMeters:path.reduce((n,e)=>n+(e.segmentLengthMeters||0),0),
   sourceWayIds:ways,sourceUrl:sources[0],sourceUrls:sources,sourceType:'osm',
   checkedAt:'2026-11-22',geometryStatus:'ready',direction:'forward',
   stopOffsetReview:gaps.length?{status:'platform-offset',gaps}:null};
 }
 return SPECS.map(spec=>{
  const ids=spec.stationCodes.map(asId);
  for(const id of ids)if(!stationCatalog.has(id)||stationCatalog.get(id).nameStatus!=='verified')
   throw Error('Missing verified Hong Kong Light Rail stop '+id);
  const segments=[];
  for(let i=0;i<ids.length-1;i++)segments.push(assemble(findPath(ids[i],ids[i+1]),ids[i],ids[i+1],spec.code.toLowerCase()+'-'+i));
  const geometry=[],stations=[];
  for(let i=0;i<ids.length;i++){
   if(i<segments.length){
    const points=segments[i].geometry;
    if(geometry.length&&meters(geometry.at(-1),points[0])>25)throw Error('Disconnected stop boundary '+ids[i]);
    if(!geometry.length)geometry.push(...points);else geometry.push(...(same(geometry.at(-1),points[0])?points.slice(1):points));
   }
   const lastIndex=i===0?0:(i===ids.length-1?geometry.length-1:(()=>{
    const consumed=segments[i].geometry.length;
    return geometry.length-consumed;
   })());
   // For every nonterminal stop, the matching geometry vertex is the first
   // vertex of its outgoing segment, including any platform offset.
   const point=geometry[lastIndex],s=stationCatalog.get(ids[i]);
   stations.push({...s,stopId:spec.id+'-stop-'+i,physicalStationId:s.id,stationMasterId:s.id,
    lineId:spec.lineId,geometryIndex:lastIndex,
    latitude:point[0],longitude:point[1],coordinates:{lat:point[0],lng:point[1]},
    stopPosition:{lat:point[0],lng:point[1],sourceUrl:s.sourceUrl},
    ja:s.ja||s.nameZhHant,kana:'',romaji:s.romaji||s.nameEn,ko:s.ko||s.nameKo,
    officialCode:s.officialCode||s.code});
  }
  // A full-stop count and source path check must be independent of the display.
  if(stations.length!==ids.length||segments.length!==ids.length-1)throw Error('Special route broken '+spec.code);
  const validWhen={type:'school-term-weekday-morning',timezone:'Asia/Hong_Kong',
   departureTimes:spec.departureTimes,days:['monday','tuesday','wednesday','thursday','friday'],
   schoolHolidays:false,publicHolidays:false,reviewStatus:'verified',noteKo:spec.noteKo,
   sources:[spec.timetableUrl,spec.callingOrderUrl]};
  const route={id:spec.id,countryId:'hk',schemaVersion:1,canonicalLineId:spec.lineId,servicePatternId:spec.id,
   serviceLabel:stations[0].romaji+' → '+stations.at(-1).romaji,
   operatorId:'hk-mtr',operator:{ja:'港鐵',en:'MTR',ko:'홍콩 MTR'},
   line:spec.names,category:'light_rail',mode:'light_rail',code:spec.code,
   officialSymbolExists:false,lineColor:'#71857D',
   lineTheme:{code:spec.code,color:'#71857D',style:'hk',colorVerified:false,colorSource:'Official RGB not verified'},
   loop:false,lazy:false,playable:false,releaseStatus:'INCOMPLETE',
   geometryReady:true,geometryStatus:'verified',blockedReasons:[],direction:'school-morning-one-way',
   validWhen,sourceUrl:spec.timetableUrl,stopStatus:'verified',
   geometry,directedSegments:segments,stations,
   services:[{id:spec.id,nameJa:spec.names.ja,nameEn:spec.names.en,nameKo:spec.names.ko,stops:ids}]};
  route.operatingConditionFingerprint=crypto.createHash('sha256').update(JSON.stringify(validWhen)).digest('hex');
  route.validationFingerprint=gameplayFingerprint(route);
  if(reviewedGameplay(route,gameplayReview)){
   route.playable=true;route.releaseStatus='ready';
  }else if(validationPreview){
   route.playable=true;route.releaseStatus='validation-preview';route.validationPreview=true;
  }else route.blockedReasons=['동일 데이터의 실제 게임 타이핑 완주 검증 필요'];
  return route;
 });
}
module.exports={SPECS,extraHongKongLightRailRoutes};
