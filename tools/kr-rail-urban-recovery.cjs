'use strict';
// 이미 확보한 공식 자료와 원본 정차 관계로 차량기지 임시승강장행을 추가한다.
const fs=require('node:fs'),crypto=require('node:crypto'),{load,validate,assemble}=require('./lib/kr-network'),{validateRoute}=require('./lib/kr-canonical.cjs');
const base='data/kr/canonical/',data=load('data/kr/v2'),checked=validate(data,{base:'data/kr/v2'}),source=data.services.find(s=>s.id==='kr-osm-service-13738410');
const raw=JSON.parse(fs.readFileSync('data/kr/v2/source/osm-nodes.json')).find(n=>n.id==='9221654398'),nodeIds=[];
for(const p of source.paths){const g=checked.maps.geometry.get(p.geometryId),ids=p.reverse?g.nodeIds.slice().reverse():g.nodeIds;nodeIds.push(...ids.slice(nodeIds.length?1:0));}
if(nodeIds.at(-1)!==raw.id||raw.tags.railway!=='stop')throw Error('임시승강장 원본 선로 종점 불일치');
const stopId='kr-osm-stop-'+raw.id,stationId='kr-osm-node-'+raw.id;
checked.maps.stops.set(stopId,{id:stopId,stationId,osmNodeId:raw.id,coordinates:{lat:raw.lat,lon:raw.lon}});
checked.maps.stations.set(stationId,{id:stationId,names:{ko:'차량기지 임시승강장',en:''},transferStationIds:[]});
source.stops.push({stopId,geometryIndex:nodeIds.length-1,boarding:false,alighting:true});
const original=JSON.parse(fs.readFileSync(base+'rail-urban-national-batch.json')).routes.find(r=>r.id==='kr-rail-national-uijeongbu'),a=assemble(source,checked.maps);
const names=JSON.parse(fs.readFileSync(base+'rail-urban-national-batch.json')).routes.find(r=>r.id===original.id).verifiedJourneys.find(j=>j.stations[0].ko==='발곡').stations.map(s=>s.ko).concat('차량기지 임시승강장');
if(a.stations.length!==16||names.length!==16)throw Error('의정부 원본 정차 관계 변경');
const stations=a.stations.map((s,i)=>({...s,id:'kr-rail-stop-'+s.platformId.replace('kr-osm-stop-',''),ko:names[i],ja:names[i],kana:names[i],romaji:names[i],sourceStopId:s.platformId}));
const id='kr-urban-recovery-13738410',name='발곡 → 차량기지 임시승강장',service={id,nameKo:name,stops:stations.map(s=>s.id)};
const journey={id,patternId:id,patternName:{ko:name},directionId:source.directionId,tripIds:[source.id],sourcePatternId:source.id,stations,geometry:a.geometry,directedSegments:a.directedSegments,service};
journey.directedSegments=stations.slice(0,-1).map((s,i)=>({fromStationId:s.id,toStationId:stations[i+1].id,geometry:a.geometry.slice(s.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready'}));
const file='national-source/rail-ulrt-balgok-20261105.jpg',route={...original,id:'kr-rail-urban-depot-recovery',mergeIntoRouteId:original.id,verifiedJourneys:[journey],services:[service],stations,geometry:a.geometry,directedSegments:journey.directedSegments,sourceRefs:[...original.sourceRefs,{url:'https://www.ulrt.co.kr/doc/contents/information/stations.php',sourceDate:'2026-11-05',license:'공식 공개 역명·운행 사실; 제공기관 이용조건',localFile:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(base+file)).digest('hex')}],operationalEvidence:{url:'https://www.ulrt.co.kr/doc/contents/information/stations.php',checkedAt:'2026-11-05',scope:'이미 확보된 공식 차량기지 임시승강장행 표시와 16개 원본 정차열 대조. 추가 시간표 확인 없음.'}};
const errors=validateRoute(route);if(errors.length)throw Error(errors.join(' · '));
fs.writeFileSync(base+'rail-urban-recovery-batch.json',JSON.stringify({schemaVersion:2,routes:[route]})+'\n');console.log({directions:1,stations:stations.length});
