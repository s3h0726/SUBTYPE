#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {bindStopsToShape}=require('./lib/kr-road-binding.cjs'),{validateRoute}=require('./lib/kr-canonical.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/kr/canonical'),read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const letters=['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지'];
const ko=value=>String(value??'').replace(/[A-Za-z]/g,c=>letters[c.toUpperCase().charCodeAt(0)-65]);
const categories={1:'공항버스',2:'마을버스',3:'간선버스',4:'지선버스',5:'순환버스',6:'광역버스',7:'기타 버스',8:'급행버스'},colors={1:'#8d5c31',2:'#5bb025',3:'#2965b1',4:'#46a548',5:'#e1b900',6:'#d83c3c',7:'#687584',8:'#d83c3c'};
const published=new Set(read('bus-topis-batch.json').routes.map(r=>r.id));
const candidates=read('bus-candidates.json').routes.filter(r=>r.regionId==='seoul'&&!published.has(r.id)),routes=[],queue=[];
function cached(id,kind){const fresh=path.join(dir,'bus-recovered-source',id+'-'+kind+'.json.gz'),original=path.join(dir,'bus-source/topis',id+'-'+kind+'.json.gz');const file=fs.existsSync(fresh)?fresh:original;return{rows:JSON.parse(zlib.gunzipSync(fs.readFileSync(file))).rows,fresh:file===fresh,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}}
for(const candidate of candidates)try{
 const rid=candidate.sourceRouteId,source=cached(rid,'geometry'),stopSource=cached(rid,'stops'),stops=stopSource.rows.slice().sort((a,b)=>a.stationOrd-b.stationOrd);
 if(stops.length<2)throw Error('NO_CURRENT_STOPS');if(stops[0].routNm!==candidate.routeNumber)throw Error('ROUTE_NUMBER_CHANGED');
 const operators=[...new Set((candidate.operatorNamesKo||[]).map(ko))].sort();if(!operators.length)throw Error('NO_OFFICIAL_OPERATOR');
 const shape=source.rows.map(r=>[Number(r.posY),Number(r.posX)]).filter((p,i,all)=>!i||JSON.stringify(p)!==JSON.stringify(all[i-1]));
 const bound=bindStopsToShape(shape,stops),groups=[];
 stops.forEach((stop,index)=>{if(!/[가-힣]/.test(ko(stop.dir)))throw Error('NO_OFFICIAL_DIRECTION');if(groups.at(-1)?.name!==stop.dir)groups.push({name:stop.dir,indexes:[]});groups.at(-1).indexes.push(index)});
 const journeys=groups.flatMap((group,index)=>{
  if(group.indexes.length<2)return[];const start=bound.indexes[group.indexes[0]],end=bound.indexes[group.indexes.at(-1)],geometry=bound.geometry.slice(start,end+1);
  const stations=group.indexes.map(i=>{const s=stops[i],name=ko(s.stnName);return{id:'kr-seoul-stop-'+s.stnId,sourceStopId:String(s.stnId),ko:name,ja:name,kana:name,romaji:name,sourceName:s.stnName,latitude:Number(s.posY),longitude:Number(s.posX),geometryIndex:bound.indexes[i]-start}});
  const id=candidate.id+'-direction-'+(index+1),pattern=ko(group.name)+' 방면';
  return[{id,patternId:id,directionId:'direction-'+(index+1),patternName:{ko:pattern},tripIds:[rid+':'+stops[group.indexes[0]].stationOrd+'-'+stops[group.indexes.at(-1)].stationOrd],stations,geometry,directedSegments:stations.slice(1).map((b,i)=>({fromStationId:stations[i].id,toStationId:b.id,geometry:geometry.slice(stations[i].geometryIndex,b.geometryIndex+1)})),service:{id,nameKo:pattern,stops:stations.map(s=>s.id)},sourceDirection:group.name,sourceStopOrders:group.indexes.map(i=>stops[i].stationOrd),geometrySourcePositions:bound.sourcePositions.slice(start,end+1)}];
 });
 if(!journeys.length)throw Error('NO_PLAYABLE_DIRECTION');const type=Number(stops[0].rtCd),category=type===2?'village_bus':type===6?'metropolitan_bus':type===8?'express_bus':[3,4,5].includes(type)?'city_bus':'other_bus',operator=operators.join(' · ');
 const route={schemaVersion:2,id:candidate.id,countryId:'kr',mode:type===2?'village_bus':[1,6,8].includes(type)?'express_bus':'bus',line:{ko:'서울 '+ko(candidate.routeNumber)+'번'},operatorId:'kr-bus-operator-'+crypto.createHash('sha256').update(operator).digest('hex').slice(0,12),operator:{ko:operator},regionId:'seoul',regionKo:'서울특별시',routeNumber:ko(candidate.routeNumber),category,normalizedCategory:category,categoryKo:categories[type]||'기타 버스',regionalCategory:categories[type]||'기타 버스',color:colors[type]||'#687584',releaseStatus:'verified',geometryReady:true,sourceRefs:[...candidate.sourceRefs,{url:'https://topis.seoul.go.kr/map/busMap/selectBusLineList.do',sourceDate:source.fresh?'2026-11-01':'2026-10-30',license:'서울특별시 공공데이터 출처표시'}],operationalEvidence:{url:'https://topis.seoul.go.kr/',checkedAt:stopSource.fresh?'2026-11-01':'2026-10-30',routeId:rid,endpoint:'/map/busMap/selectBusLineStnXMLList.do'},geometryEvidence:{kind:'collinear-source-edge-stop-projection',sourceSha256:source.sha256,stopsSha256:stopSource.sha256,maximumStopOffsetKm:bound.maximumOffsetKm},verifiedJourneys:journeys,stations:journeys[0].stations,geometry:journeys[0].geometry};
 const errors=validateRoute(route);if(errors.length)throw Error('CANONICAL:'+errors.join('|'));routes.push(route);
}catch(error){queue.push({routeId:candidate.id,sourceRouteId:candidate.sourceRouteId,failureType:error.message.split(':')[0],reason:error.message})}
const write=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value)+'\n');
write('bus-recovered-batch.json',{schemaVersion:2,generatedBy:'tools/kr-bus-recover-topis.cjs',routes});write('bus-recovered-queue.json',{candidates:queue});
const report={baselineSeoulRoutes:published.size,processed:candidates.length,addedRoutes:routes.length,addedDirections:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),stops:new Set(routes.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,remaining:queue.length,failureTypes:queue.reduce((a,q)=>(a[q.failureType]=(a[q.failureType]||0)+1,a),{})};write('bus-recovered-report.json',report);console.log(JSON.stringify(report,null,2));
