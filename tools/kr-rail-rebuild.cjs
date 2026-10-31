'use strict';
// Reconstruct published patterns from independently checked source snapshots.
// Never infer a return service, merge by station name, or bridge missing ways.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {load,validate,assemble}=require('./lib/kr-network');
const {validateRoute}=require('./lib/kr-canonical.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),out=path.join(root,'data/kr/canonical');
const read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const data=load(base),validation=validate(data,{base});
if(validation.errors.length)throw Error(JSON.stringify(validation.errors));
const maps=validation.maps,source=maps.sources.get('seoulmetro-official-20260901');
for(const file of source.files)if(hash(fs.readFileSync(path.join(base,file.path)))!==file.sha256)throw Error('OFFICIAL_SOURCE_HASH_CHANGED');
const tripRows=read('seoulmetro-trip-candidates'),bindings=read('timetable-service-bindings');
const corrections=new Map(read('station-name-corrections').map(s=>[s.stationId,s.officialName]));
const lineIds={1:'kr-osm-line-8691899',2:'kr-osm-line-7625892',3:'kr-osm-line-7879839',4:'kr-osm-line-7625893',5:'kr-osm-line-7879871',6:'kr-osm-line-7919154',7:'kr-osm-line-7922930',8:'kr-osm-line-7919019'};
const lineCode=id=>Object.keys(lineIds).find(k=>lineIds[k]===id);
// Source labels append line/platform or secondary names. This only compares
// already connected stop nodes inside one explicit directional rail path.
const normalized=name=>name.normalize('NFC').replace(/^(?:[1-9]호선|교외선)\s*/,'').replace(/\([^)]*\)/g,'').trim().replace(/역$/,'').replace(/\s/g,'');
const tracks=[],queue=[],physical=new Map;
for(const s of data.services){
 if(s.access?.passengerCandidate===false||s.status==='excluded'){queue.push({id:s.id,name:s.names.ko,reason:'비공개·폐선·계획 노선'});continue}
 try{
  const assembled=assemble(s,maps);
  if(assembled.geometry.some((p,i)=>i&&Math.hypot((p[0]-assembled.geometry[i-1][0])*111.195,(p[1]-assembled.geometry[i-1][1])*88)>2))throw Error('SOURCE_EDGE_EXCEEDS_2_KM');
  const stations=assembled.stations.map(st=>({...st,ko:corrections.get(st.id)||st.ko}));
  tracks.push({s,...assembled,stations,names:stations.map(st=>normalized(st.ko))});
 }catch(e){queue.push({id:s.id,name:s.names.ko,reason:e.message})}
}
// Full, official train columns are deduplicated into calling patterns; dates and
// calendars stay attached as evidence. Partial columns are never published.
const patterns=new Map;
for(const trip of tripRows){
 if(trip.calls.length<2||trip.originOperationalName!==trip.calls[0].operationalStationName||trip.destinationOperationalName!==trip.calls.at(-1).operationalStationName)continue;
 const key=JSON.stringify([trip.officialLineCode,trip.express,trip.directionId,trip.calls.map(c=>[c.officialStationCode,c.operationalStationName])]);
 if(!patterns.has(key))patterns.set(key,{trip,tripIds:[],calendars:new Set});
 const p=patterns.get(key);p.tripIds.push(trip.id);p.calendars.add(trip.calendarLabel);
}
const routes=new Map,acceptedPatterns=new Set;
for(const [key,p] of patterns){
 const {trip}=p,expected=trip.calls.map(c=>normalized(c.operationalStationName));
 const candidates=[];
 for(const track of tracks){
  if(lineCode(track.s.passengerLineId)!==trip.officialLineCode)continue;
  const indices=[];let cursor=0;
  for(const name of expected){let hit=track.names.indexOf(name,cursor);if(hit<0){indices.length=0;break}indices.push(hit);cursor=hit+1}
  if(indices.length!==expected.length)continue;
  // Ordinary trains must call at every intermediate stop. Express sequences
  // may omit stations only when the official train explicitly says express.
  if(!trip.express&&indices.some((n,i)=>i&&n!==indices[i-1]+1))continue;
  candidates.push({track,indices,extra:track.stations.length-indices.length});
 }
 if(!candidates.length){queue.push({id:'official-pattern-'+hash(key).slice(0,14),name:`${trip.officialLineCode}호선 ${trip.originOperationalName} → ${trip.destinationOperationalName}`,reason:'완전한 실제 방향별 선로·정차 순서 미확보',tripIds:p.tripIds});continue}
 candidates.sort((a,b)=>a.extra-b.extra||a.track.s.id.localeCompare(b.track.s.id));
 const {track,indices}=candidates[0],start=track.stations[indices[0]].geometryIndex,end=track.stations[indices.at(-1)].geometryIndex;
 const geometry=track.geometry.slice(start,end+1);
 const stations=indices.map((n,i)=>{const st=track.stations[n],name=trip.calls[i].operationalStationName;return{...st,ko:name,ja:name,kana:name,romaji:name,officialCode:trip.calls[i].officialStationCode,geometryIndex:st.geometryIndex-start}});
 const name=`${trip.originOperationalName} → ${trip.destinationOperationalName}${trip.express?' 급행':' 일반'}`,id='kr-rail-pattern-'+hash(key).slice(0,16);
 const service={id,nameKo:name,nameJa:name,nameEn:name,stops:stations.map(st=>st.id)};
 const journey={id,patternId:id,patternName:{ko:name},directionId:trip.directionId,tripIds:p.tripIds,calendarLabels:[...p.calendars],sourcePatternId:track.s.id,service,stations,geometry,directedSegments:stations.slice(0,-1).map((st,i)=>({fromStationId:st.id,toStationId:stations[i+1].id,geometry:geometry.slice(st.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready'}))};
 const routeId='kr-rail-seoul-'+trip.officialLineCode;
 if(!routes.has(routeId))routes.set(routeId,{id:routeId,schemaVersion:2,countryId:'kr',category:'subway',subcategory:'지하철',mode:'subway',regionId:'수도권',line:{ko:`수도권 전철 ${trip.officialLineCode}호선`,ja:`수도권 전철 ${trip.officialLineCode}호선`},operatorId:'kr-seoulmetro-korail',operator:{ko:'서울교통공사·한국철도공사',ja:'서울교통공사·한국철도공사'},lineColor:maps['passenger-lines'].get(lineIds[trip.officialLineCode]).color||'#0052A4',geometryReady:true,geometryStatus:'ready',playable:true,visibility:'public',releaseStatus:'verified',verifiedJourneys:[],services:[],sourceRefs:[{url:'https://download.geofabrik.de/asia/south-korea.html',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',sourceDate:'2026-10-14',retrievedAt:'2026-10-30'},{url:source.url,license:source.license,sourceDate:source.dataReferenceDate,retrievedAt:'2026-10-30'}],operationalEvidence:{url:source.url,checkedAt:'2026-10-30',sourceDate:source.dataReferenceDate,notes:'공식 열차운행시각표의 완전한 정차 순서와 출발·종착이 일치하는 운행계통만 생성. 임시·파업 증편은 포함하지 않음.'}});
 const route=routes.get(routeId);route.verifiedJourneys.push(journey);route.services.push(service);acceptedPatterns.add(track.s.id);
 for(const ref of track.s.paths){const g=maps.geometry.get(ref.geometryId);physical.set(g.id,g)}
}
// Full urban local services can also be checked against the operator's current
// network. These are ODbL route/stop facts, not republished KRIC timetable data.
// Require the entire terminal pair and official number of stations; short turns
// and express patterns still require an exact complete official train column.
const busanEvidence='https://work.humetro.busan.kr/homepage/cyberstation/map.do';
const urban=[
 ['8258658','부산 도시철도 2호선','부산교통공사','부산',43,'장산','양산','subway',busanEvidence],
 ['8247017','부산 도시철도 3호선','부산교통공사','부산',17,'수영','대저','subway',busanEvidence],
 ['8255698','부산 도시철도 1호선','부산교통공사','부산',40,'다대포해수욕장','노포','subway',busanEvidence],
 ['8258702','부산 도시철도 4호선','부산교통공사','부산',14,'미남','안평','light_rail',busanEvidence],
 ['7705740','부산김해경전철','부산김해경전철','부산·경남',21,'사상','가야대','light_rail',busanEvidence],
 ['7792528','대전 도시철도 1호선','대전교통공사','대전',22,'판암','반석','subway','https://www.djtc.kr/kor/index.do'],
 ['7527498','인천 도시철도 2호선','인천교통공사','인천',27,'검단오류','운연','light_rail','https://www.ictr.or.kr/main/railway/intro.jsp'],
 ['7854149','인천 도시철도 1호선','인천교통공사','인천',33,'검단호수공원','송도달빛축제공원','subway','https://www.ictr.or.kr/main/railway/intro.jsp'],
 ['14191878','신림선','남서울경전철','서울',11,'샛강','관악산','light_rail','https://sillimlrt.com/site/kr/html/sub01/010101.html'],
 ['7533584','우이신설선','우이신설경전철운영','서울',13,'북한산우이','신설동','light_rail','https://www.ui-line.com/'],
 ['7883317','서울 지하철 9호선','서울시메트로9호선·서울교통공사','서울',38,'개화','중앙보훈병원','subway','https://mas.smc.seoul.kr/attach/record/SEOUL/appendix/a11/A0068285.pdf?time=20260416093434'],
 ['10092721','김포골드라인','김포골드라인에스알에스','경기',10,'양촌','김포공항','light_rail','https://m.gimpo.go.kr/portal/contents.do?key=1483'],
 ['18581442','교외선 무궁화호','한국철도공사','경기',6,'대곡','의정부','rail','https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable'],
 ['18581443','교외선 무궁화호','한국철도공사','경기',6,'대곡','의정부','rail','https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable'],
 ['7531174','용인 에버라인','용인에버라인운영','경기',15,'기흥','전대·에버랜드','light_rail','https://www.ever-line.co.kr/'],
 ['7845969','대구 도시철도 2호선','대구교통공사','대구',29,'문양','영남대','subway','https://www.dtro.or.kr/'],
 ['7845965','대구 도시철도 3호선','대구교통공사','대구',30,'칠곡경대병원','용지','monorail','https://www.dtro.or.kr/'],
 ['13538911','광주 도시철도 1호선','광주교통공사','광주',20,'녹동','평동','subway','https://www.grtc.co.kr/cyber?timetable=20'],
];
for(const [osmId,label,operator,region,count,a,b,mode,url] of urban){
 const selected=tracks.filter(t=>t.s.passengerLineId==='kr-osm-line-'+osmId&&t.stations.length===count&&((normalized(t.stations[0].ko)===normalized(a)&&normalized(t.stations.at(-1).ko)===normalized(b))||(normalized(t.stations[0].ko)===normalized(b)&&normalized(t.stations.at(-1).ko)===normalized(a))));
 if(!selected.length){queue.push({id:'kr-rail-urban-'+osmId,name:label,reason:'공식 종점·역수와 일치하는 연속 실제 선로 미확보'});continue}
 const category=mode==='rail'?'conventional_rail':mode==='light_rail'?'light_rail':'subway';
 const route={id:mode==='rail'?'kr-rail-gyoe':'kr-rail-urban-'+osmId,schemaVersion:2,countryId:'kr',category,subcategory:mode==='rail'?'일반철도':mode==='light_rail'?'경전철':'지하철',mode,regionId:region,line:{ko:label,ja:label},operatorId:'kr-operator-'+hash(operator).slice(0,10),operator:{ko:operator,ja:operator},lineColor:maps['passenger-lines'].get('kr-osm-line-'+osmId).color||'#777777',geometryReady:true,geometryStatus:'ready',playable:true,visibility:'public',releaseStatus:'verified',verifiedJourneys:[],services:[],sourceRefs:[{url:'https://download.geofabrik.de/asia/south-korea.html',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',sourceDate:'2026-10-14',retrievedAt:'2026-10-30'}],operationalEvidence:{url,checkedAt:'2026-10-30',verifiedOrigin:a,verifiedDestination:b,verifiedStationCount:count,scope:'공식 현재 운영 노선의 완전한 양단·정차역수와 원본 방향별 노선 대조. 개별 열차 시간·임시 계통은 포함하지 않음.'}};
 for(const track of selected){
  const stations=track.stations.map(st=>{const name=mode==='rail'?st.ko.replace(/^교외선\s*/,'').replace(/역$/,''):st.ko;return{...st,ko:name,ja:name,kana:name,romaji:name}});
  const name=`${stations[0].ko} → ${stations.at(-1).ko} 일반`,id='kr-rail-local-'+track.s.id.replace('kr-osm-service-','');
  const service={id,nameKo:name,nameJa:name,nameEn:name,stops:stations.map(st=>st.id)};
  const journey={id,patternId:id,patternName:{ko:name},directionId:track.s.directionId,tripIds:[track.s.id],sourcePatternId:track.s.id,service,stations,geometry:track.geometry,directedSegments:track.directedSegments};
  route.verifiedJourneys.push(journey);route.services.push(service);acceptedPatterns.add(track.s.id);
  for(const ref of track.s.paths){const g=maps.geometry.get(ref.geometryId);physical.set(g.id,g)}
 }
 const prior=routes.get(route.id);if(prior){prior.verifiedJourneys.push(...route.verifiedJourneys);prior.services.push(...route.services)}else routes.set(route.id,route);
}
const result=[];
for(const route of routes.values()){
 route.verifiedJourneys.sort((a,b)=>b.stations.length-a.stations.length||a.id.localeCompare(b.id));
 route.services=route.verifiedJourneys.map(j=>j.service);
 Object.assign(route,{stations:route.verifiedJourneys[0].stations,geometry:route.verifiedJourneys[0].geometry,directedSegments:route.verifiedJourneys[0].directedSegments});
 const errors=validateRoute(route);if(errors.length)throw Error(route.id+': '+errors.join('; '));
 result.push(route);
}
for(const track of tracks)if(!acceptedPatterns.has(track.s.id))queue.push({id:track.s.id,name:track.s.names.ko,reason:'실제 선로 확인됨; 재사용 가능한 최신 공식 완전 운행계통 근거·정차지 연결 검증 대기'});
fs.mkdirSync(out,{recursive:true});
const write=(name,value)=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(value)+'\n');
write('rail-batch',{schemaVersion:1,generatedAt:'2026-10-30',routes:result});
write('rail-physical-alignments',{schemaVersion:1,sourceDate:'2026-10-14',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',ways:[...physical.values()]});
write('rail-import-queue',{schemaVersion:1,checkedAt:'2026-10-30',candidates:queue});
const report={checkedAt:'2026-10-30',sourceServices:data.services.length,exactConnectedSourcePaths:tracks.length,officialTrips:tripRows.length,officialUniquePatterns:patterns.size,publicRoutes:result.length,playableServiceDirections:result.reduce((n,r)=>n+r.verifiedJourneys.length,0),uniqueStationIds:new Set(result.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,physicalWays:physical.size,queuedCandidates:queue.length,sourceFilesVerified:source.files.length+data.sources.filter(s=>s.kind==='osm').reduce((n,s)=>n+(s.files?.length||0),0),validationErrors:0,notes:['기존 공개 노선 복원 없이 공식 완전 운행열과 원본 선로를 재검증하여 생성','운행표를 찾지 못한 고속·일반철도 및 전국 도시철도는 비공개 대기열 유지','전방향 추정·직선 연결·정차지 이름만 이용한 물리적 위치 결합 없음']};
write('rail-import-report',report);console.log(JSON.stringify(report,null,2));
