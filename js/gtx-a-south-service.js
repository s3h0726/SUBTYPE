/* GTX-A south operating section on the existing GTX-A route card.
 * Four active stops confirmed by KOTI/CPPR:
 * https://cppr.koti.re.kr/site/railwyDetail?railwyId=RID241201000009
 * Station coordinates are geographic labels, NOT verified tunnel track.
 * The unrecovered original OSM service alignments are never invented.
 */
(function (root) {
  'use strict';
  const ROUTE='kr-rail-national-gtx-a';
  const stops=Object.freeze([
    {id:'kr-gtx-a-x108',ko:'수서',latitude:37.487444,longitude:127.102111,stationCode:'X108'},
    {id:'kr-gtx-a-x109',ko:'성남',latitude:37.39472,longitude:127.11944,stationCode:'X109'},
    {id:'kr-gtx-a-x110',ko:'구성',latitude:37.29861,longitude:127.10556,stationCode:'X110'},
    {id:'kr-gtx-a-x111',ko:'동탄',latitude:37.201167,longitude:127.095111,stationCode:'X111'}
  ]);
  const valid=route=>route?.id===ROUTE&&route.countryId==='kr'&&route.schemaVersion===2&&route.releaseStatus==='verified';
  const ordered=direction=>direction==='reverse'?[...stops].reverse():[...stops];
  function choices(route){
    if(!valid(route))return [];
    return ['forward','reverse'].map(direction=>{
      const seq=ordered(direction),start=seq[0],end=seq.at(-1);
      return{kind:'gtxSouth',id:'kr-gtx-a-south-'+direction,patternId:'kr-gtx-a-south',
        patternName:{ko:'GTX-A 수서–동탄',ja:'GTX-A 수서–동탄',en:'GTX-A Suseo–Dongtan'},
        direction,originId:start.id,destinationId:end.id,originNames:start,destinationNames:end,trainType:null};
    });
  }
  function resolve(choice,route){
    const approved=choices(route).find(item=>item.id===choice?.id&&item.originId===choice.originId&&item.destinationId===choice.destinationId);
    if(!approved)throw new Error('GTX-A 수서–동탄의 공식 운행 방향을 확인할 수 없습니다.');
    const stations=ordered(approved.direction).map(s=>({...s,ja:s.ko,kana:s.ko,romaji:s.ko,officialCode:s.stationCode,hasOfficialStationCode:true}));
    const label=stations[0].ko+' → '+stations.at(-1).ko+' (GTX-A 남부)';
    const service={id:approved.id,nameKo:label,nameJa:label,nameEn:label,stops:stations.map(s=>s.id)};
    const line={...route,gtxSouthStationOnly:true,geometryReady:false,geometryStatus:'missing',
      stations,geometry:[],directedSegments:[],services:[service],
      missingSegments:['수서–성남','성남–구성','구성–동탄'],selectedDirectionId:approved.direction,
      serviceNote:'남부 4개 역의 순서 타이핑 전용 — 실제 선로 선형 미검증'};
    return{route:line,service,direction:'forward',journeyId:approved.id,
      journey:{id:approved.id,baseRouteId:route.id,originStationId:stations[0].id,destinationStationId:stations.at(-1).id,directionId:approved.direction},
      pattern:{id:'kr-gtx-a-south',names:approved.patternName},trainType:null,destinationStationId:stations.at(-1).id,trainTypeContexts:[]};
  }
  root.TRT_GTX_A_SOUTH=Object.freeze({routeId:ROUTE,choices,resolve,stations:stops});
})(globalThis);
