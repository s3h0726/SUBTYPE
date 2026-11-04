#!/usr/bin/env node
'use strict';
// No river centreline or straight terminal chords are substituted for an actual
// navigational alignment. Unresolved patterns stay out of the playable catalog.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/kr/canonical');
const source=JSON.parse(fs.readFileSync(path.join(dir,'river-sources.json'),'utf8'));
const terminals=new Map(source.terminals.map(t=>[t.id,t]));
const osm=JSON.parse(fs.readFileSync(path.join(dir,'river-osm-terminals.json'),'utf8'));
const elements=new Map(osm.elements.map(e=>[e.id,e]));
const terminalElements={'kr-hangang-magok':1418419406,'kr-hangang-mangwon':1418419420,'kr-hangang-yeouido':13149390539,'kr-hangang-apgujeong':1418419409,'kr-hangang-oksu':1418419418,'kr-hangang-seoul-forest':1458956838,'kr-hangang-ttukseom':1418419412,'kr-hangang-jamsil':1418419415};
const distance=(a,b)=>Math.hypot((a[0]-b[0])*111195,(a[1]-b[1])*88200);
const coord=e=>{if(e.lat)return[e.lat,e.lon];const g=e.geometry.slice(0,-1);return[g.reduce((s,p)=>s+p.lat,0)/g.length,g.reduce((s,p)=>s+p.lon,0)/g.length]};
const layouts={'kr-hangang-west':[1490035963],'kr-hangang-east-oksu-forest':[1527378114,1527378115,1441742054],'kr-hangang-east-apgujeong-forest':[1527378114,1527717246,1441742054],'kr-hangang-east-oksu':[1527378114,1527378115,1441742054],'kr-hangang-east-apgujeong':[1527378114,1527717246,1441742054]};
// The west way explicitly names Mangwon, whereas the official notice gives
// only section endpoints. Preserve the mapped intermediate call.
source.patterns[0].stopIds.splice(1,0,'kr-hangang-mangwon');source.patterns[0].stopSequenceComplete=true;
const routes=[],failures=[],allIds=new Set;
let maxEdgeMeters=0,maxStopOffsetMeters=0;
for(const [group,patterns] of [['kr-hangang-west',source.patterns.slice(0,1)],['kr-hangang-east',source.patterns.slice(1)]]){
 const journeys=[];
 for(const p of patterns){try{
  const wayIds=layouts[p.id];let full=[];
  for(const id of wayIds){const e=elements.get(id);if(e?.tags?.route!=='ferry')throw Error('수상 항로 원본 없음: '+id);const points=e.geometry.map(p=>[p.lat,p.lon]);if(full.length&&distance(full.at(-1),points[0])>0.01)throw Error('항로 끝점 불일치: '+id);full.push(...points.slice(full.length?1:0));}
  // Source ways use Yeouido -> Magok and Jamsil -> Yeouido respectively.
  const sourceStops=[...p.stopIds].reverse();
  for(const directionId of ['outbound','inbound']){
   const geometry=directionId==='outbound'?[...full].reverse():full.map(p=>[...p]);
   const stopIds=directionId==='outbound'?p.stopIds:sourceStops;
   for(let i=1;i<geometry.length;i++){const m=distance(geometry[i-1],geometry[i]);maxEdgeMeters=Math.max(maxEdgeMeters,m);if(m>2000)throw Error('항로 점 간격 초과: '+m);}
   let previous=-1;
   const stations=stopIds.map((id,si)=>{const t=terminals.get(id),e=elements.get(terminalElements[id]);if(!e)throw Error('선착장 원본 없음: '+id);const c=coord(e);let best={i:-1,m:Infinity};for(let i=0;i<geometry.length;i++){const m=distance(c,geometry[i]);if(m<best.m)best={i,m}}if(si===0)best={i:0,m:distance(c,geometry[0])};if(si===stopIds.length-1)best={i:geometry.length-1,m:distance(c,geometry.at(-1))};if(best.m>150||best.i<=previous)throw Error('선착장 항로 연결/순서 오류: '+id+' '+best.m);previous=best.i;maxStopOffsetMeters=Math.max(maxStopOffsetMeters,best.m);if(si===0&&best.i!==0||si===stopIds.length-1&&best.i!==geometry.length-1)throw Error('기종점 불일치: '+id);return{id,ko:t.nameKo,ja:t.nameKo,kana:t.nameKo,romaji:t.nameKo,latitude:c[0],longitude:c[1],geometryIndex:best.i,sourceRef:{type:e.type,id:e.id},stopOffsetMeters:Math.round(best.m*100)/100}});
   const id=p.id+'-'+directionId;
   if(allIds.has(id))throw Error('운항 ID 중복: '+id);allIds.add(id);
   const directedSegments=stations.slice(1).map((s,i)=>({id:id+'-segment-'+i,fromStationId:stations[i].id,toStationId:s.id,fromIndex:stations[i].geometryIndex,toIndex:s.geometryIndex,geometry:geometry.slice(stations[i].geometryIndex,s.geometryIndex+1)}));
   journeys.push({id,patternId:p.id,patternName:{ko:p.nameKo},directionId,tripIds:[p.id],stations,geometry,directedSegments,service:{id,nameKo:p.nameKo+' '+stations.at(-1).ko+'행',stops:stopIds},serviceDates:{start:p.validFrom,validFrom:p.validFrom,...(p.validThrough?{end:p.validThrough,validThrough:p.validThrough,endDatePrecision:p.endDatePrecision}:{})},sourceWayIds:wayIds});
  }
 }catch(error){failures.push({patternId:p.id,reason:error.message})}}
 if(journeys.length){const first=journeys.find(j=>!j.serviceDates.validThrough)||journeys[0],sourceDate=osm.osm3s.timestamp_osm_base.slice(0,10);routes.push({schemaVersion:2,id:group,countryId:'kr',name:{ko:group.endsWith('west')?'한강버스 서부 구간':'한강버스 동부 구간'},line:{ko:group.endsWith('west')?'한강버스 서부 구간':'한강버스 동부 구간'},nameKo:group.endsWith('west')?'한강버스 서부 구간':'한강버스 동부 구간',mode:'river_bus',regionId:'seoul',regionKo:'서울',operatorId:source.operator.id,operatorNameKo:source.operator.nameKo,operator:{id:source.operator.id,ko:source.operator.nameKo,name:source.operator.nameKo,nameKo:source.operator.nameKo},color:'#4255A5',category:'river_bus',releaseStatus:'verified',geometryReady:true,stations:first.stations,geometry:first.geometry,directedSegments:first.directedSegments,verifiedJourneys:journeys,services:journeys.map(j=>j.service),sourceRefs:[...[...new Set(journeys.flatMap(j=>j.sourceWayIds))].map(id=>({url:'https://www.openstreetmap.org/way/'+id,license:'ODbL-1.0',sourceDate})),{url:'https://www.openstreetmap.org/copyright',license:'ODbL-1.0',sourceDate,attribution:'© OpenStreetMap contributors',snapshot:'river-osm-terminals.json'},...source.sources.slice(0,2).map(s=>({url:s.url,license:s.license,sourceDate:s.updatedAt,use:'운항 사실 검증'}))],operationalEvidence:{url:source.sources[group.endsWith('west')?0:1].url,checkedAt:'2026-11-05'},transferStationIds:['kr-hangang-yeouido'],geometrySource:{type:'osm-route-ferry',wayIds:[...new Set(journeys.flatMap(j=>j.sourceWayIds))],sourceDate,license:'ODbL-1.0'}})}
}
const ids=new Set,queue=[];
for(const p of source.patterns){
 if(ids.has(p.id))throw Error('중복 운항 패턴: '+p.id);ids.add(p.id);
 if(!/[가-힣]/u.test(p.nameKo)||p.stopIds.length<2)throw Error('운항 패턴 이름 또는 정차역 오류: '+p.id);
 for(const id of p.stopIds)if(!terminals.has(id)||!/[가-힣]/u.test(terminals.get(id).nameKo))throw Error('선착장 참조 오류: '+id);
 for(const [direction,stops] of [['outbound',p.stopIds],['inbound',[...p.stopIds].reverse()]]){
  if(allIds.has(p.id+'-'+direction))continue;
  const blockers=['검증 가능한 선박 항행 경로 좌표 미확보','선착장 접안 지점의 좌표와 항로 연결 미확인'];
  if(!p.stopSequenceComplete)blockers.push('중간 선착장 정차 목록 미확인');
  queue.push({...p,id:p.id+'-'+direction,patternId:p.id,directionId:direction,nameKo:p.nameKo+' '+terminals.get(stops.at(-1)).nameKo+'행',mode:'river_bus',regionKo:'서울',operatorNameKo:source.operator.nameKo,stopIds:stops,stops:stops.map(id=>({id,nameKo:terminals.get(id).nameKo})),releaseStatus:'queued',geometryReady:false,geometry:[],blockers,sourceDate:source.checkedAt});
 }
}
const snapshots=['river-osm.json','river-osm-terminals.json'].filter(f=>fs.existsSync(path.join(dir,f))).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex')}));
const report={schemaVersion:2,checkedAt:'2026-11-05',mode:'river_bus',status:failures.length?'partial':'geometry-validated',publicRouteCount:routes.length,publicServiceDirectionCount:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),candidatePatternCount:source.patterns.length,candidateDirectionCount:queue.length,terminalInventoryCount:source.terminals.length,activeTerminalCount:new Set(routes.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,completeGeometryCount:routes.length,maxEdgeMeters,maxStopOffsetMeters,failures,sourceIds:source.sources.map(s=>s.id),snapshots,validation:{uniquePatternIds:true,terminalReferences:true,koreanNames:true,unverifiedGeometryExcluded:true},notesKo:['한강버스는 철도·도로버스와 분리한 수상교통 수단으로 저장한다.','동부와 서부는 여의도에서 환승한다.','서울숲 임시 정차는 10월 말 종료되며 자동 연장하지 않는다. 신규 기본 동부 계통은 11월 이후 정차 여부 추가 확인이 필요하다.','안내 지도나 강 중심선을 선박 항로로 간주하지 않는다.']};
for(const [file,data] of [['river-batch.json',{schemaVersion:2,countryId:'kr',routes}],['river-queue.json',{schemaVersion:2,countryId:'kr',candidates:queue}],['river-report.json',report]])fs.writeFileSync(path.join(dir,file),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
