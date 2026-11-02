'use strict';
// 신규 지자체 전체 계통의 도로 원본, 정류장 ID 순서, 한글 표시를 대조한다.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const {epsg5187}=require('./lib/kr-projection.cjs'),{validateRoute,distance}=require('./lib/kr-canonical.cjs'),base=path.resolve(__dirname,'../data/kr/canonical');
let routes=0,directions=0,points=0,projectedStops=0;const regions={};
for(const city of ['incheon','daegu','gwangju','ulsan','sejong','daejeon','jeju']){
 const batch=JSON.parse(fs.readFileSync(path.join(base,city+'-batch.json'))),dir=path.join(base,city+'-source');
 const read=(id,k)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,id+'-'+k+'.json.gz'))));regions[city]={routes:batch.routes.length,directions:0};
 for(const route of batch.routes){assert.deepEqual(validateRoute(route),[]);assert(!/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/u.test(route.line.ko+route.operator.ko));routes++;
  for(const trip of route.verifiedJourneys){const id=trip.sourcePattern.sourcePatternId,dirId=trip.directionId;let raw,calls;
   if(city==='incheon'){const data=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,id+'.json.gz'))));raw=data.vertexList.filter(v=>v.dircd===dirId).map(v=>[Number(v.lat),Number(v.lng)]);let stops=data.viaStopList.filter(s=>s.dircd===dirId);if(dirId==='1'){const turn=data.viaStopList.filter(s=>s.dircd==='0').at(-1);if(turn)stops=[turn,...stops];}calls=stops.map(s=>String(s.bstopid));}
   if(city==='daegu'){const feature=read(id,'shape').features.find(f=>f.geometry.type==='MultiLineString'&&String(f.properties.moveDir)===dirId&&f.properties.routeId===id);raw=feature.geometry.coordinates.flat().map(p=>epsg5187(...p));calls=read(id,'stops').body.filter(s=>String(s.moveDir)===dirId).map(s=>String(s.bsId));}
   if(city==='gwangju'){raw=read(id,'shape').list.map(p=>[Number(p.LATITUDE),Number(p.LONGITUDE)]);let list=read(id,'stops').list;const a=trip.sourcePattern.startSequence,b=trip.sourcePattern.endSequence;if(a)list=list.slice(a-1,b);calls=list.map(s=>String(s.BUSSTOP_ID));}
   if(city==='ulsan'){raw=read(id,'shape').list[0].map(p=>[Number(p.y2),Number(p.x2)]);calls=read(id,'stops').rows.map(s=>String(s.stopid));}
   if(city==='sejong'){const detail=read(id,'detail');raw=detail.busRouteDetailMapVoList.map(p=>[Number(p.lat),Number(p.lng)]);calls=detail.busRouteDetailList.map(s=>String(s.stop_id));}
   if(city==='daejeon'){raw=read(id,dirId+'-shape').list.flat().map(p=>[Number(p[1]),Number(p[0])]);calls=read(id,dirId+'-stops').map(s=>String(s.busstopId));}
   if(city==='jeju'){raw=read(id,'shape').map(p=>[Number(p.localY),Number(p.localX)]);calls=read(id,'info').stationInfoList.filter(s=>!s.stationNm.includes('가상')).map(s=>String(s.stationId));}
   raw=raw.filter((p,i,a)=>!i||JSON.stringify(p)!==JSON.stringify(a[i-1]));
   assert.deepEqual(trip.stations.map(s=>s.sourceStopId),calls,trip.id+' 공식 정류장 순서');
   const positions=trip.geometryEvidence.sourcePositions;assert.equal(positions.length,trip.geometry.length);const retained=new Set(positions);
   for(let i=Math.ceil(positions[0]);i<positions.at(-1);i++)assert(retained.has(i),trip.id+' 원본 굴곡 보존 '+i);
   positions.forEach((p,i)=>{const edge=Math.floor(p),t=p-edge,a=raw[edge],b=raw[Math.min(edge+1,raw.length-1)];assert(a&&b);const expected=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];assert(distance(expected,trip.geometry[i])<.000001,trip.id+' 원본 선분 외 선형 차단');if(i)assert(p>positions[i-1]);points++;});
   for(const s of trip.stations){assert(!/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/u.test(s.ko),s.ko);assert(distance([s.latitude,s.longitude],trip.geometry[s.geometryIndex])<=.150001);projectedStops++;}
   directions++;regions[city].directions++;
  }
 }
}
assert(distance(epsg5187(167262.93410326,377035.76061895),[35.99035823333333,128.63696013333333])<.00001,'공식 좌표쌍 투영 검사');
const report={passed:true,routes,directions,points,projectedStops,regions,scope:'전체 신규 지자체 계통의 원본 선분·굴곡·정류장 순서 대조. 브라우저 완주와 별개.'};fs.writeFileSync(path.resolve(__dirname,'../reports/kr-rebuild/지자체-원본-검증.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
