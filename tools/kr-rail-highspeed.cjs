'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {load,validate,assemble}=require('./lib/kr-network');
const {validateRoute,distance}=require('./lib/kr-canonical.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),out=path.join(root,'data/kr/canonical');
const data=load(base),check=validate(data,{base});if(check.errors.length)throw Error('SOURCE_HASH_OR_GEOMETRY_INVALID');
const maps=check.maps,official=require('../data/kr/canonical/rail-ktx-official-patterns.json');
const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'rail-ktx-timetable-20260901.xlsx'))).digest('hex');
if(sha!==official.sha256)throw Error('OFFICIAL_KTX_WORKBOOK_HASH_CHANGED');
const source=maps.services.get('kr-osm-service-11272646'),aligned=assemble(source,maps);
const nodes=require('../data/kr/v2/source/osm-nodes.json'),pointNodes=new Map;
const ways=source.paths.map(ref=>maps.geometry.get(ref.geometryId)),sparseSourceEdges=[];
for(const way of ways)for(let i=1;i<way.coordinates.length;i++){
 const km=distance(way.coordinates[i-1],way.coordinates[i]);if(km>2)sparseSourceEdges.push({wayId:way.sourceRef.id,fromNodeId:way.nodeIds[i-1],toNodeId:way.nodeIds[i],from:way.coordinates[i-1],to:way.coordinates[i],distanceKm:km});
}
// Bind only named railway stop_position nodes close to this known corridor;
// names do not create edges or choose a path between unrelated locations.
for(const node of nodes.filter(n=>n.tags?.railway==='stop'&&/[가-힣]/.test(n.tags?.['name:ko']||n.tags?.name||''))){
 const name=node.tags['name:ko']||node.tags.name;
 let best={km:Infinity};aligned.geometry.forEach((point,index)=>{const km=distance(point,[node.lat,node.lon]);if(km<best.km)best={km,index,node}});
 if(best.km<=.1&&(!pointNodes.has(name)||best.km<pointNodes.get(name).km))pointNodes.set(name,best);
}
const route={id:'kr-rail-highspeed-honam',schemaVersion:2,countryId:'kr',category:'high_speed_rail',subcategory:'고속철도',mode:'high_speed_rail',regionId:'전국',line:{ko:'고속철도 호남선',ja:'고속철도 호남선'},operatorId:'kr-korail',operator:{ko:'한국철도공사',ja:'한국철도공사'},lineColor:'#005DAA',playable:true,visibility:'public',geometryReady:true,geometryStatus:'ready',releaseStatus:'verified',verifiedJourneys:[],services:[],sourceRefs:[{url:'https://www.openstreetmap.org/relation/11272646',license:'ODbL-1.0',sourceDate:'2026-10-14',attribution:'© OpenStreetMap contributors'}],operationalEvidence:{url:official.sourceUrl,checkedAt:'2026-10-31',sourceDate:official.sourceDate,sourceSha256:official.sha256,scope:'공식 호남선 하행 완전 열차행의 전 정차역과 운행요일 확인. 시각표 이미지·편집물 재배포 아님.'},geometryEvidence:{kind:'exact-osm-source-edges',sourceRelationId:'11272646',sourceDate:'2026-10-14',sourceNodeContinuity:true,sparseSourceEdges,maximumSourceEdgeKm:Math.max(...sparseSourceEdges.map(e=>e.distanceKm)),note:'일부 원본 선로의 정점 간격이 2킬로미터를 초과하나 모든 연결은 원본 선로의 연속된 노드 쌍이다. 정점 보간·임의 직선 연결·누락 선로 추정 없음.'}};
const patterns=new Map,queue=[];
for(const trip of official.trips.filter(t=>t.sheet==='호남선')){
 if(trip.calls[0].ko!=='용산'||trip.calls.at(-1).ko!=='목포')continue;
 let prior=-1;const stops=[];
 for(const call of trip.calls){const binding=pointNodes.get(call.ko);if(!binding||binding.index<=prior){stops.length=0;break}stops.push({id:'kr-osm-stop-'+binding.node.id,stationMasterId:'kr-osm-node-'+binding.node.id,ko:call.ko,ja:call.ko,kana:call.ko,romaji:call.ko,latitude:binding.node.lat,longitude:binding.node.lon,geometryIndex:binding.index,coordinateSource:'osm-railway-stop-position',sourceStopNodeId:binding.node.id,sourceTrackOffsetMeters:Math.round(binding.km*1000)});prior=binding.index}
 if(stops.length!==trip.calls.length){queue.push({tripId:trip.id,reason:'정차지 원본 선로 위치·방향 연결 미확보',calls:trip.calls.map(c=>c.ko)});continue}
 const key=JSON.stringify(stops.map(s=>s.id));if(!patterns.has(key))patterns.set(key,{stops,trips:[]});patterns.get(key).trips.push(trip);
}
for(const [key,p] of patterns){
 const id='kr-highspeed-honam-'+crypto.createHash('sha256').update(key).digest('hex').slice(0,14),start=p.stops[0].geometryIndex,end=p.stops.at(-1).geometryIndex,geometry=aligned.geometry.slice(start,end+1),stations=p.stops.map(s=>({...s,geometryIndex:s.geometryIndex-start}));
 const trainTypes=[...new Set(p.trips.map(t=>t.trainType))],types=trainTypes.map(t=>t.replace(/케이티엑스/g,'KTX'));
 const name='용산 → 목포 '+types.join('·')+' '+stations.length+'개역 정차';
 const service={id,nameKo:name,nameJa:name,nameEn:name,stops:stations.map(s=>s.id)};
 const journey={id,patternId:id,patternName:{ko:name},directionId:'honam-down',tripIds:p.trips.map(t=>t.id),officialTrainNumbers:p.trips.map(t=>t.trainNumber),operatingCalendars:[...new Set(p.trips.map(t=>t.calendar))],service,stations,geometry,directedSegments:stations.slice(0,-1).map((s,i)=>({fromStationId:s.id,toStationId:stations[i+1].id,geometry:geometry.slice(s.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready'}))};
 route.verifiedJourneys.push(journey);route.services.push(service);
}
if(!route.verifiedJourneys.length)throw Error('NO_COMPLETE_OFFICIAL_HIGH_SPEED_PATTERN');
Object.assign(route,{stations:route.verifiedJourneys[0].stations,geometry:route.verifiedJourneys[0].geometry,directedSegments:route.verifiedJourneys[0].directedSegments});
const errors=validateRoute(route);
fs.writeFileSync(path.join(out,'rail-highspeed-batch.json'),JSON.stringify({schemaVersion:1,generatedAt:'2026-10-31',routes:[route]})+'\n');
fs.writeFileSync(path.join(out,'rail-highspeed-physical-alignments.json'),JSON.stringify({schemaVersion:1,license:'ODbL-1.0',sourceDate:'2026-10-14',attribution:'© OpenStreetMap contributors',ways})+'\n');
const report={sourceWorkbookSha256:sha,sourceRows:official.trips.length,publicRoutes:1,playableServiceDirections:route.verifiedJourneys.length,officialTrains:route.verifiedJourneys.reduce((n,j)=>n+j.tripIds.length,0),uniqueStationIds:new Set(route.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id))).size,completeSourceWays:ways.length,sparseSourceEdges:sparseSourceEdges.length,maximumSourceEdgeKm:route.geometryEvidence.maximumSourceEdgeKm,validationErrors:errors,queuedCandidates:queue.length};
fs.writeFileSync(path.join(out,'rail-highspeed-report.json'),JSON.stringify(report)+'\n');fs.writeFileSync(path.join(out,'rail-highspeed-queue.json'),JSON.stringify({candidates:queue})+'\n');console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
