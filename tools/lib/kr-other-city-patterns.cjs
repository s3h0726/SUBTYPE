'use strict';
const {journey}=require('./kr-city-model.cjs'),{distance}=require('./kr-canonical.cjs');
// 공식 지도 화면의 정렬된 도로 구간을 사용하되 구간 사이의 미확인 연결은 차단한다.
function connectedParts(parts){for(let i=1;i<parts.length;i++)if(distance([...parts[i-1].at(-1)].reverse(),[...parts[i][0]].reverse())>.025)throw Error('공식 도로 구간 사이 25미터 초과 단절');return parts.flat().map(p=>[Number(p[1]),Number(p[0])]);}
module.exports=function({city,id,meta,read,operators}){
 let number,category='city_bus',categoryKo='시내버스',mode='bus',family,operator,patterns=[],sourceKinds;
 if(city==='ulsan'){
  number=meta.searchBrtNo;family=String(meta.brtid).slice(0,3)+'-'+number;operator=operators.routes[number]?.join(' · ');if(!operator)throw Error('공식 운영사 배정 미확인: '+number);
  const cats={11:['express_bus','리무진급행버스','express_bus'],12:['city_bus','좌석버스','bus'],13:['city_bus','시내버스','bus'],20:['city_bus','지선버스','bus'],30:['village_bus','마을버스','village_bus'],40:['other_bus','관광순환버스','bus']};if(!cats[meta.brttype])throw Error('공식 분류 미확인');[category,categoryKo,mode]=cats[meta.brttype];
  const calls=read(id,'stops').rows,shape=read(id,'shape').list[0];
  patterns=[journey(city,'kr-'+city+'-'+id,meta.brtname,calls.map(s=>({id:s.stopid,name:s.stopname,lat:s.stopy2,lon:s.stopx2,sequence:s.brsseqno})),shape.map(p=>[Number(p.y2),Number(p.x2)]),{sourcePatternId:id,directionId:meta.brtdirection,sourceServiceClass:meta.brtclass})];sourceKinds=['stops','shape'];
 }else if(city==='sejong'){
  number=meta.route_name;family=number;operator=operators.routes[number]?.join(' · ');if(!operator)throw Error('공식 운영사 배정 미확인: '+number);
  const detail=read(id,'detail'),calls=detail.busRouteDetailList,shape=detail.busRouteDetailMapVoList;if(/^B/.test(number)){category='metropolitan_bus';categoryKo='비알티';mode='express_bus';}else if(number.length>=4){category='metropolitan_bus';categoryKo='광역버스';mode='express_bus';}
  patterns=[journey(city,'kr-'+city+'-'+id,'',calls.map(s=>({id:s.stop_id,name:s.stop_name,lat:s.lat,lon:s.lng,sequence:s.stop_ord})),shape.map(p=>[Number(p.lat),Number(p.lng)]),{sourcePatternId:id,directionId:meta.route_direction})];sourceKinds=['detail'];
 }else if(city==='daejeon'){
  const kind=meta.routeTp.trim();number=(kind==='1'?'급행':kind==='5'?'마을':kind==='6'?'첨단':'')+meta.routeNo;family=id;operator=operators.routes[number]?.join(' · ');if(!operator)throw Error('공식 운영사 배정 미확인: '+number);
  const cats={1:['express_bus','급행버스','express_bus'],2:['city_bus','도시버스','bus'],3:['metropolitan_bus','광역버스','express_bus'],4:['rural_bus','외곽버스','bus'],5:['village_bus','마을버스','village_bus'],6:['other_bus','첨단버스','bus'],7:['metropolitan_bus','광역버스','express_bus'],8:['metropolitan_bus','광역버스','express_bus'],9:['metropolitan_bus','계룡버스','bus']};if(!cats[kind])throw Error('공식 분류 미확인');[category,categoryKo,mode]=cats[kind];
  sourceKinds=['info'];for(const direction of ['up','down']){const calls=read(id,direction+'-stops'),shape=read(id,direction+'-shape');patterns.push(journey(city,'kr-'+city+'-'+id+'-'+direction,'',calls.map(s=>({id:s.busstopId,name:s.busstopNm,lat:s.gpsLati,lon:s.gpsLong,sequence:s.busstopSeq})),connectedParts(shape.list),{sourcePatternId:id,directionId:direction}));sourceKinds.push(direction+'-stops',direction+'-shape');}
 }else throw Error('미지원 수집 지역');
 return{number,category,categoryKo,mode,family,operator,patterns,sourceKinds};
};
