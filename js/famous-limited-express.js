// Famous Japanese limited express trains are independently selectable game routes.
// Every path uses the canonical physical-track polylines: never invent straight connectors.
// These are documented representative service patterns; timetables can vary by train/date.
const FAMOUS_EXPRESS_SPECS=[
 {id:'skyliner',name:{ko:'스카이라이너',ja:'スカイライナー',en:'Skyliner'},
  parts:[{id:'line-23006',from:'京成上野',to:'成田空港（第１旅客ターミナル）'}],color:'#f87818',
  official:'https://www.keisei.co.jp/keisei/tetudou/skyliner/jp/skyliner/index.php',
  patterns:[{id:'skyliner',ja:'スカイライナー',ko:'스카이라이너',stops:['京成上野','日暮里','空港第２ビル（第２旅客ターミナル）','成田空港（第１旅客ターミナル）']}]},
 {id:'rapit',name:{ko:'특급 라피트',ja:'特急ラピート',en:'Limited Express Rapi:t'},
  parts:[{id:'line-32001',from:'難波',to:'泉佐野'},{id:'line-32002',from:'泉佐野',to:'関西空港'}],color:'#174a9f',
  official:'https://www.adnankai.co.jp/media/2026/NANKAI_MEDIA_GUIDE.pdf',
  patterns:[
   {id:'rapit-alpha',ja:'ラピートα',ko:'라피트 α',stops:['難波','新今宮','天下茶屋','泉佐野','りんくうタウン','関西空港']},
   {id:'rapit-beta',ja:'ラピートβ',ko:'라피트 β',stops:['難波','新今宮','天下茶屋','堺','岸和田','泉佐野','りんくうタウン','関西空港']}
  ]},
 {id:'laview',name:{ko:'특급 라뷰',ja:'特急ラビュー',en:'Limited Express Laview'},
  parts:[{id:'line-22001',from:'池袋',to:'飯能'},{id:'line-22002',from:'飯能',to:'西武秩父'}],color:'#eb9200',
  official:'https://www.seiburailway.jp/railway/reservedtrain/laview/',
  patterns:[
   {id:'laview-chichibu',ja:'ちちぶ',ko:'치치부호',stops:['池袋','所沢','入間市','飯能','横瀬','西武秩父']},
   {id:'laview-musashi',ja:'むさし',ko:'무사시호',stops:['池袋','所沢','入間市','飯能']}
  ]},
 {id:'redarrow',name:{ko:'특급 레드애로',ja:'特急レッドアロー',en:'Limited Express Red Arrow'},
  parts:[{id:'line-22007',from:'西武新宿',to:'本川越'}],color:'#d12337',
  official:'https://www.seiburailway.jp/railway/reservedtrain/redarrow/',
  patterns:[{id:'redarrow-koedo',ja:'小江戸',ko:'코에도호',stops:['西武新宿','高田馬場','東村山','所沢','狭山市','本川越']}]},
 {id:'romancecar',name:{ko:'오다큐 로망스카',ja:'小田急ロマンスカー',en:'Odakyu Romancecar'},
  parts:[{id:'line-25001',from:'新宿',to:'小田原'}],color:'#d72a36',
  official:'https://www.odakyu.jp/romancecar/homeway/',
  patterns:[{id:'romancecar-homeway-1',ja:'ホームウェイ1号',ko:'홈웨이 1호',directions:['forward'],stops:['新宿','町田','海老名','本厚木','秦野','小田原']}]}
];
const cloneRailPoint=p=>[Number(p[0]),Number(p[1])];
function sourceSegment(route,fromJa,toJa){
 const st=route?.stations||[],start=st.findIndex(s=>s.ja===fromJa),end=st.findIndex(s=>s.ja===toJa);
 if(start<0||end<=start||!route?.geometryReady||route.geometry?.length<2)throw Error('Missing certified track segment: '+route?.id+' '+fromJa+'→'+toJa);
 const indices=st.slice(start,end+1).map(s=>s.geometryIndex);
 if(indices.some((v,i)=>!Number.isInteger(v)||(i>0&&v<=indices[i-1])))throw Error('Track station indices are not monotonic: '+route.id);
 const begin=indices[0],finish=indices.at(-1),polyline=route.geometry.slice(begin,finish+1).map(cloneRailPoint);
 if(polyline.length<2||polyline.some(p=>!p.every(Number.isFinite)))throw Error('Missing track points '+route.id);
 return {stations:st.slice(start,end+1).map(s=>({...s,geometryIndex:s.geometryIndex-begin})),geometry:polyline,sourceId:route.id};
}
function composePhysicalService(spec,baseRoutes){
 const sections=spec.parts.map(part=>{
  const route=baseRoutes.get(part.id);
  return sourceSegment(route,part.from,part.to)
 }),stations=[],geometry=[],sources=[];
 for(const section of sections){
  let points=section.geometry;
  if(geometry.length){
   const last=geometry.at(-1),first=points[0],distance=Math.hypot(last[0]-first[0],last[1]-first[1]);
   // Reject an unverified gap; only the same coordinate is a valid transfer.
   if(distance>0.00002)throw Error('Track boundary discontinuity '+spec.id+': '+distance);
   if(distance<1e-10)points=points.slice(1);
  }
  const offset=geometry.length-(section.geometry.length-points.length),hasBoundary=stations.length>0;
  for(let i=0;i<section.stations.length;i++){
   const station=section.stations[i];
   if(hasBoundary&&i===0){
    if(stations.at(-1).ja!==station.ja)throw Error('Different junction stations '+spec.id);
    continue
   }
   const position=offset+station.geometryIndex;
   if(!Number.isInteger(position)||position<0)throw Error('Invalid combined geometry index');
   stations.push({...station,geometryIndex:position});
  }
  geometry.push(...points);
  sources.push(section.sourceId)
 }
 if(stations.length<2||stations.some((s,i)=>i>0&&s.geometryIndex<=stations[i-1].geometryIndex))throw Error('Invalid station sequence '+spec.id);
 if(stations[0].geometryIndex!==0||stations.at(-1).geometryIndex!==geometry.length-1)throw Error('Track endpoints do not match '+spec.id);
 const byJa=new Map(stations.map(s=>[s.ja,s]));
 const variants=spec.patterns.map(pattern=>{
  const stops=pattern.stops.map(ja=>{const match=byJa.get(ja);if(!match)throw Error('Express stop unavailable '+spec.id+':'+ja);return match.id});
  const position=stops.map(id=>stations.find(s=>s.id===id).geometryIndex);
  if(position.some((v,i)=>i>0&&v<=position[i-1]))throw Error('Unordered express stops '+spec.id+'/'+pattern.id);
  return{id:pattern.id,nameJa:pattern.ja,nameKo:pattern.ko,directions:pattern.directions||['forward','reverse'],stopIds:stops,sourceUrl:spec.official}
 });
 const first=baseRoutes.get(spec.parts[0].id),id='famous-express-'+spec.id;
 return {...first,id,legacyId:id,category:first.category,operatorId:first.operatorId,
   line:{...first.line,...spec.name},lineColor:spec.color,stationCount:stations.length,
   dataKind:'trainService',famousExpress:true,geometryReady:true,
   trackSourceRouteIds:sources,officialTimetableUrl:spec.official,
   services:variants.map(p=>({id:p.id,nameJa:p.nameJa,nameKo:p.nameKo,nameEn:p.nameKo,stops:p.stopIds})),
   famousVariants:variants,stations,geometry,loop:false,
   directedSegments:stations.slice(0,-1).map((st,i)=>({fromStationId:st.id,toStationId:stations[i+1].id,geometry:geometry.slice(st.geometryIndex,stations[i+1].geometryIndex+1),verified:false,source:'Existing physical rail line geometry'})),
   missingSegments:[],reusedSegments:[],nexRepresentativeTimetable:false,
   coverage:'Documented representative express stopping patterns, built from existing railway tracks'}
}
export function famousLimitedExpressSourceIds(){return [...new Set(FAMOUS_EXPRESS_SPECS.flatMap(spec=>spec.parts.map(part=>part.id)))]}
export function buildFamousLimitedExpressRoutes(routes){
 const map=new Map(routes.map(r=>[r.id,r])),result=[];
 for(const spec of FAMOUS_EXPRESS_SPECS){
  try{result.push(composePhysicalService(spec,map))}
  catch(e){console.warn('Famous express candidate omitted:',spec.id,e?.message||e)}
 }
 return result
}
export function famousLimitedExpressChoices(route){
 if(!route?.famousExpress)return [];
 const stationMap=new Map(route.stations.map(st=>[String(st.id),st]));
 return route.famousVariants.flatMap(p=>p.directions.map(direction=>{
  const first=direction==='reverse'?p.stopIds.at(-1):p.stopIds[0],last=direction==='reverse'?p.stopIds[0]:p.stopIds.at(-1);
  return{kind:'famousExpress',id:p.id+':'+direction,originId:first,destinationId:last,
   originNames:stationMap.get(String(first)),destinationNames:stationMap.get(String(last)),
   legacyServiceId:p.id,direction,patternName:{ko:p.nameKo,ja:p.nameJa},
   trainType:{id:'famous-limited-express',priority:85,names:{ko:'특급',ja:'特急',en:'Limited Express'}}}
 }))
}
export function resolveFamousLimitedExpressChoice(route,choice){
 if(!route?.famousExpress||choice.kind!=='famousExpress')throw Error('Unknown famous express route');
 const p=route.famousVariants.find(v=>v.id===choice.legacyServiceId);
 if(!p)throw Error('Unavailable train pattern');
 const reverse=choice.direction==='reverse';
 const all=reverse?route.stations.slice().reverse():route.stations.slice();
 const points=reverse?route.geometry.slice().reverse().map(cloneRailPoint):route.geometry.map(cloneRailPoint);
 const adjust=st=>({...st,geometryIndex:reverse?points.length-1-st.geometryIndex:st.geometryIndex});
 const stations=all.map(adjust);
 const required=reverse?p.stopIds.slice().reverse():p.stopIds.slice();
 const first=stations.findIndex(st=>st.id===required[0]),last=stations.findIndex(st=>st.id===required.at(-1));
 if(first<0||last<=first)throw Error('Invalid limited express section');
 const begin=stations[first].geometryIndex,finish=stations[last].geometryIndex;
 const selected=stations.slice(first,last+1).map(st=>({...st,geometryIndex:st.geometryIndex-begin}));
 const geometry=points.slice(begin,finish+1);
 if(selected.at(-1).geometryIndex!==geometry.length-1)throw Error('Incorrect train geometry boundary');
 const service={id:p.id,nameJa:p.nameJa,nameKo:p.nameKo,nameEn:p.nameKo,stops:required,
   destinationStationId:required.at(-1),trainTypeId:'famous-limited-express'};
 const result={...route,stations:selected,geometry,services:[service],selectedDirectionId:choice.direction,
   directedSegments:selected.slice(0,-1).map((s,i)=>({fromStationId:s.id,toStationId:selected[i+1].id,
     geometry:geometry.slice(s.geometryIndex,selected[i+1].geometryIndex+1),verified:false,source:'Physical source lines'}))};
 return{route:result,service,direction:'forward',travelDirectionId:choice.direction,
   destinationStationId:required.at(-1),pattern:null,trainType:choice.trainType}
}
