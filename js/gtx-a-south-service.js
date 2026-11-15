/* GTX-A south operating section on the existing GTX-A route card.
 * Four active stops confirmed by KOTI/CPPR:
 * https://cppr.koti.re.kr/site/railwyDetail?railwyId=RID241201000009
 * Actual southbound and northbound tracks are read from pinned OSM GTX-A
 * passenger service relations and their original OSM nodes, including
 * platform tracks that may carry the OSM siding tag.
 * Source and geometry checks: tools/build-gtx-a-srt-geometry.cjs
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
    const dataset=root.TRT_GTX_A_SOUTH_TRACKS,track=dataset?.directions?.[approved.direction];
    if(dataset?.routeId!==ROUTE||!track||track.sourceRelationId!==(approved.direction==='forward'?'17413294':'17413296')||
      track.geometry?.length<90||track.stations?.length!==4||track.sourceWays?.length!==9||
      !track.stations.every((anchor,i)=>anchor.id===ordered(approved.direction)[i].id&&Number.isInteger(anchor.geometryIndex)&&
        anchor.geometryIndex>=0&&anchor.geometryIndex<track.geometry.length&&
        anchor.latitude===track.geometry[anchor.geometryIndex][0]&&anchor.longitude===track.geometry[anchor.geometryIndex][1]))
      throw new Error('GTX-A 남부 실제 OSM 선로 자료를 검증할 수 없습니다. 다시 새로고침해 주세요.');
    const geometry=track.geometry.map(point=>[point[0],point[1]]);
    const stations=ordered(approved.direction).map((s,i)=>{
      const anchor=track.stations[i];
      return{...s,ja:s.ko,kana:s.ko,romaji:s.ko,officialCode:s.stationCode,hasOfficialStationCode:true,
        latitude:anchor.latitude,longitude:anchor.longitude,geometryIndex:anchor.geometryIndex,
        sourceStopId:anchor.sourceStopId,sourceNodeId:anchor.sourceNodeId};
    });
    if(stations[0].geometryIndex!==0||stations.at(-1).geometryIndex!==geometry.length-1||
      stations.some((station,i)=>i>0&&station.geometryIndex<=stations[i-1].geometryIndex))
      throw new Error('GTX-A 남부 역별 선로 위치가 일치하지 않습니다.');
    const directedSegments=stations.slice(0,-1).map((station,i)=>({
      fromStationId:station.id,toStationId:stations[i+1].id,
      geometry:geometry.slice(station.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready',
      source:{kind:'osm-pinned-gtx-a-passenger-relation',relationId:track.sourceRelationId}
    }));
    const label=stations[0].ko+' → '+stations.at(-1).ko+' (GTX-A 남부)';
    const service={id:approved.id,nameKo:label,nameJa:label,nameEn:label,stops:stations.map(s=>s.id)};
    const line={...route,gtxSouthStationOnly:false,geometryReady:true,geometryStatus:'ready',
      stations,geometry,directedSegments,services:[service],missingSegments:[],
      selectedDirectionId:approved.direction,
      geometrySource:'osm-source-node-contiguous-gtx-a-passenger-service',
      gtxSouthTrackEvidence:{sourceRelationId:track.sourceRelationId,sourceServiceId:track.sourceServiceId,
        geometrySha256:track.geometrySha256,sourceWays:track.sourceWays,distanceKm:track.distanceKm,
        note:'2026-10-14 pinned OSM original nodes; shared SRT rail and platform approaches'},
      sourceRefs:[...(route.sourceRefs||[]),{
        url:'https://www.openstreetmap.org/relation/'+track.sourceRelationId,
        sourceDate:'2026-10-14',license:'ODbL-1.0',
        attribution:'© OpenStreetMap contributors',sourceWayIds:track.sourceWays.map(w=>w.id)
      }],
      serviceNote:'수서평택고속선·GTX-A 전용 구간의 실제 OSM 선형 사용'};
    return{route:line,service,direction:'forward',journeyId:approved.id,
      journey:{id:approved.id,baseRouteId:route.id,originStationId:stations[0].id,destinationStationId:stations.at(-1).id,directionId:approved.direction},
      pattern:{id:'kr-gtx-a-south',names:approved.patternName},trainType:null,destinationStationId:stations.at(-1).id,trainTypeContexts:[]};
  }
  root.TRT_GTX_A_SOUTH=Object.freeze({routeId:ROUTE,choices,resolve,stations:stops});
})(globalThis);
