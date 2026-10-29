// Narita Express: branch-specific, train-level journeys.  Never traverse the legacy
// Ofuna -> Shinjuku single-chain railway as a real train path.
const NEX_AIRPORT='station-1132705',NEX_T2='station-1132813',NEX_TOKYO='station-1130101';
const NEX_EXAMPLES=[
  {
    id:'nex-5-shinjuku',variantId:'nex-shinjuku-physical-candidate',
    direction:'forward',trainNumber:'2205M',trainName:'成田エクスプレス5号',nameKo:'특급 나리타 익스프레스 5호 · 신주쿠발',
    source:'https://timetables.jreast.co.jp/2610/train/030/031141.html',
    stops:['station-003700','station-003922',NEX_TOKYO,'station-1131339',NEX_T2,NEX_AIRPORT]
  },
  {
    id:'nex-5-ofuna',variantId:'nex-ofuna-physical-candidate',
    direction:'forward',trainNumber:'2005M',trainName:'成田エクスプレス5号',nameKo:'특급 나리타 익스프레스 5호 · 오후나발',
    source:'https://timetables.jreast.co.jp/2610/train/030/031141.html',
    stops:['station-1130107','station-1130106','station-1130105','station-004301','station-1130103',NEX_TOKYO,'station-1131339',NEX_T2,NEX_AIRPORT]
  },
  {
    id:'nex-14-shinjuku',variantId:'nex-shinjuku-physical-candidate',
    direction:'reverse',trainNumber:'2214M',trainName:'成田エクスプレス14号',nameKo:'특급 나리타 익스프레스 14호 · 신주쿠행',
    source:'https://timetables.jreast.co.jp/2610/train/045/047971.html',
    stops:[NEX_AIRPORT,NEX_T2,'station-1131339',NEX_TOKYO,'station-003922','station-003700']
  },
  {
    id:'nex-14-ofuna',variantId:'nex-ofuna-physical-candidate',
    direction:'reverse',trainNumber:'2014M',trainName:'成田エクスプレス14号',nameKo:'특급 나리타 익스프레스 14호 · 오후나행',
    source:'https://timetables.jreast.co.jp/2610/train/045/047971.html',
    stops:[NEX_AIRPORT,NEX_T2,'station-1131339',NEX_TOKYO,'station-1130103','station-004301','station-1130105','station-1130106','station-1130107']
  },
  {
    id:'nex-2-shinjuku',variantId:'nex-shinjuku-physical-candidate',
    direction:'reverse',trainNumber:'2202M',trainName:'成田エクスプレス2号',nameKo:'특급 나리타 익스프레스 2호 · 신주쿠행',
    source:'https://timetables.jreast.co.jp/en/2610/train/025/029042.html',
    stops:[NEX_AIRPORT,NEX_T2,'station-1132703','station-1131415','station-003898','station-1131339',NEX_TOKYO,'station-003922','station-003700']
  },
  {
    id:'nex-2-ofuna',variantId:'nex-ofuna-physical-candidate',
    direction:'reverse',trainNumber:'2002M',trainName:'成田エクスプレス2号',nameKo:'특급 나리타 익스프레스 2호 · 오후나행',
    source:'https://timetables.jreast.co.jp/en/2610/train/025/029042.html',
    stops:[NEX_AIRPORT,NEX_T2,'station-1132703','station-1131415','station-003898','station-1131339',NEX_TOKYO,'station-1130103','station-004301','station-1130105','station-1130106','station-1130107']
  },
  {
    id:'nex-54-shinjuku',variantId:'nex-shinjuku-physical-candidate',
    direction:'reverse',trainNumber:'2254M',trainName:'成田エクスプレス54号',nameKo:'특급 나리타 익스프레스 54호 · 신주쿠행',
    source:'https://timetables.jreast.co.jp/en/2610/train/030/031291.html',
    stops:[NEX_AIRPORT,NEX_T2,NEX_TOKYO,'station-003922','station-003700']
  },
  {
    id:'nex-54-ofuna',variantId:'nex-ofuna-physical-candidate',
    direction:'reverse',trainNumber:'2054M',trainName:'成田エクスプレス54号',nameKo:'특급 나리타 익스프레스 54호 · 오후나행',
    source:'https://timetables.jreast.co.jp/en/2610/train/030/031291.html',
    stops:[NEX_AIRPORT,NEX_T2,NEX_TOKYO,'station-1130103','station-004301','station-1130105','station-1130106','station-1130107']
  }
];
const pointDistance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function nexOperatingChoices(baseRoute){
  if(baseRoute?.id!=='line-11328')return [];
  const data=globalThis.TRT_NEX_BRANCH_CANDIDATES;
  if(!data?.variants?.length)return [];
  const stations=new Map((baseRoute.stations||[]).map(st=>[String(st.id),st]));
  return NEX_EXAMPLES.filter(item=>
    data.variants.some(v=>v.id===item.variantId&&v.geometry?.length>=2&&item.stops.every(id=>v.stopIds.includes(id)))
  ).map(item=>({
    kind:'nex',id:item.id,nexVariantId:item.variantId,nexExampleId:item.id,
    originId:item.stops[0],destinationId:item.stops.at(-1),
    originNames:stations.get(item.stops[0])||{ko:item.stops[0]},
    destinationNames:stations.get(item.stops.at(-1))||{ko:item.stops.at(-1)},
    patternName:{ko:item.nameKo,ja:item.trainName,en:"Narita Express"},
    trainType:{id:'nex-limited-express',priority:90,names:{ko:'특급',ja:'特急',en:'Limited Express'}},
    direction:item.direction,sourceRouteId:baseRoute.id
  }));
}
export function resolveNexOperatingChoice(baseRoute,choice){
  if(baseRoute?.id!=='line-11328'||choice?.kind!=='nex')throw new Error('Invalid Narita Express operating choice');
  const item=NEX_EXAMPLES.find(x=>x.id===choice.nexExampleId&&x.variantId===choice.nexVariantId);
  if(!item)throw new Error('Unknown NEX train example');
  const data=globalThis.TRT_NEX_BRANCH_CANDIDATES;
  const variant=data?.variants?.find(v=>v.id===item.variantId);
  if(!variant?.geometry?.length||!variant.stationGeometryIndices||data.releaseApproved!==false)
    throw new Error('NEX real-track branch data is unavailable or malformed');
  const master=new Map((baseRoute.stations||[]).map(st=>[String(st.id),st]));
  const stationIds=item.direction==='reverse'?variant.stopIds.slice().reverse():variant.stopIds.slice();
  const geometry=item.direction==='reverse'?variant.geometry.slice().reverse().map(p=>p.slice()):variant.geometry.map(p=>p.slice());
  const stations=stationIds.map(id=>{
    const source=master.get(String(id)),index=variant.stationGeometryIndices[id];
    if(!source||!Number.isInteger(index)||index<0||index>=variant.geometry.length)
      throw new Error('NEX geometry station binding invalid: '+id);
    const geometryIndex=item.direction==='reverse'?geometry.length-1-index:index;
    return{...source,geometryIndex};
  });
  if(stations.length<2||stations.some((st,i)=>i>0&&st.geometryIndex<=stations[i-1].geometryIndex))
    throw new Error('NEX station indices must follow physical track order');
  if(stations[0].geometryIndex!==0||stations.at(-1).geometryIndex!==geometry.length-1)
    throw new Error('NEX route starts/ends outside its own track');
  for(const id of item.stops)if(!stationIds.includes(id))throw new Error('NEX timetable stop is absent: '+id);
  for(const s of stations){
    const point=geometry[s.geometryIndex];
    if(!point||!Number.isFinite(point[0])||!Number.isFinite(point[1]))
      throw new Error('Missing NEX station track point: '+s.id);
  }
  const service={id:item.id,nameJa:item.trainName,nameKo:item.nameKo,nameEn:'Narita Express',
    stops:item.stops,trainTypeId:'nex-limited-express',destinationStationId:item.stops.at(-1)};
  const directedSegments=stations.slice(0,-1).map((st,i)=>({fromStationId:st.id,toStationId:stations[i+1].id,geometry:geometry.slice(st.geometryIndex,stations[i+1].geometryIndex+1).map(p=>p.slice()),source:'MLIT-N02-2025 combined railway centerline',verified:false}));
  const route={...baseRoute,stations,geometry,directedSegments,missingSegments:[],reusedSegments:[],services:[service],selectedDirectionId:item.direction,
    dataKind:'trainService',geometryReady:true,nexRepresentativeTimetable:true,
    nexTimetableUrl:item.source,nexBranchGeometryStatus:'MLIT_TRACK_CANDIDATE_NOT_RELEASE_APPROVED',
    line:{...baseRoute.line},coverage:'2026 JR East train-level examples; branch geometry sourced from MLIT-N02-2025'};
  return{route,service,direction:'forward',travelDirectionId:item.direction,pattern:null,
    trainType:choice.trainType||null,destinationStationId:item.stops.at(-1)};
}
