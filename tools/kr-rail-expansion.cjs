'use strict';
// Source-node rail graph reconstruction. Virtual station points subdivide one
// existing source edge without changing its polyline; they never bridge gaps.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {load,validate}=require('./lib/kr-network'),{validateRoute,distance}=require('./lib/kr-canonical.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),out=path.join(root,'data/kr/canonical');
const read=(dir,n)=>JSON.parse(fs.readFileSync(path.join(dir,n+'.json'),'utf8'));
const data=load(base),checked=validate(data,{base});if(checked.errors.length)throw Error('INVALID_PINNED_RAIL_SOURCES');
const ways=new Map(read(path.join(base,'source'),'osm-ways').map(w=>[w.id,w]));
const rawNodes=read(path.join(base,'source'),'osm-nodes'),official=read(out,'rail-expansion-official-patterns');
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
for(const s of official.sources)if(hash(fs.readFileSync(path.join(out,s.path)))!==s.sha256)throw Error('OFFICIAL_FILE_HASH_MISMATCH');
const aliases={'신판교':'판교','신이매':'이매','경광주':'경기광주','도예촌':'신둔도예촌','세종릉':'세종대왕릉','대모산':'대모산입구','강남구':'강남구청','로데오':'압구정로데오','평내호':'평내호평','디엠시':'디지털미디어시티','항공대':'한국항공대','총신대':'총신대입구','신창':'신창','신원':'신원','서울':'서울역','서강':'서강대','신수원':'수원','수원시':'수원시청','매탄권':'매탄권선','신길온':'신길온천','신인천':'인천','남동인':'남동인더스파크','인천논':'인천논현','소래포':'소래포구','효창공':'효창공원앞','홍대입':'홍대입구','1양정':'양정','1양원':'양원','신초지':'초지','시흥능':'시흥능곡','시흥청':'시흥시청','신신현':'신현','신신천':'신천','시흥대':'시흥대야','신소사':'소사','부천종':'부천종합운동장','신김포':'김포공항','오시리':'오시리아','신해운':'신해운대','부산원':'부산원동','부교대':'교대','거제해':'거제해맞이'};
const clean=n=>String(n||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/^(?:[1-9]호선|경춘선|교외선|경의중앙선|서해선|기차역)\s*/,'').replace(/기차역/g,'').replace(/역$/,'').replace(/\s+/g,'');
const display=n=>aliases[clean(n)]||String(n).replace(/\([^)]*\)/g,'').trim();
const keyName=n=>clean(aliases[clean(n)]||n);
const named=new Map;
for(const n of rawNodes){if(!['stop','station','halt'].includes(n.tags?.railway))continue;const name=n.tags['name:ko']||n.tags.name;if(!/[가-힣]/.test(name||''))continue;const k=keyName(name);if(!named.has(k))named.set(k,[]);named.get(k).push(n)}
class Heap{constructor(){this.a=[]}push(item){let a=this.a,i=a.length;a.push(item);while(i){let p=(i-1)>>1;if(a[p][0]<=item[0])break;a[i]=a[p];i=p}a[i]=item}pop(){let a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c}a[i]=last}return first}get length(){return this.a.length}}
function projection(point,a,b){const scale=Math.cos(point[0]*Math.PI/180),x=(b[1]-a[1])*scale,y=b[0]-a[0],t=Math.max(0,Math.min(1,((point[1]-a[1])*scale*x+(point[0]-a[0])*y)/(x*x+y*y||1)));const p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];return{t,point:p,offset:distance(point,p)}}
function graphFor(services,names){
 const selected=new Map,coords=new Map,edges=[];
 for(const s of services)for(const p of s.paths||[]){const w=ways.get(p.geometryId.replace('kr-geometry-',''));if(w&&!selected.has(w.id)&&['rail','subway','light_rail','monorail','narrow_gauge'].includes(w.tags?.railway)&&!['yard','spur'].includes(w.tags?.service))selected.set(w.id,w)}
 for(const w of selected.values())for(let i=1;i<w.nodeIds.length;i++){
  const a=w.nodeIds[i-1],b=w.nodeIds[i],from=w.coordinates[i-1],to=w.coordinates[i];coords.set(a,from);coords.set(b,to);edges.push({a,b,from,to,wayId:w.id,fromNodeId:a,toNodeId:b,oneway:w.tags.oneway,splits:[]});
 }
 const bindings=new Map,unbound=[];
 for(const name of names){const candidates=named.get(keyName(name))||[],options=[];
  for(const n of candidates){let best=null;const point=[n.lat,n.lon];if(coords.has(n.id)&&n.tags.railway==='stop')best={offset:0,t:0,point:coords.get(n.id),node:n,nodeId:n.id,rank:0};
   else for(const edge of edges){if(Math.abs(point[0]-(edge.from[0]+edge.to[0])/2)>Math.abs(edge.from[0]-edge.to[0])/2+.002)continue;if(Math.abs(point[1]-(edge.from[1]+edge.to[1])/2)>Math.abs(edge.from[1]-edge.to[1])/2+.002)continue;const p=projection(point,edge.from,edge.to);if(p.offset>.15)continue;const rank=p.offset+(n.tags.railway==='stop'?0:.03);if(!best||rank<best.rank)best={...p,rank,node:n,edge}}
   if(best)options.push(best);
  }
  options.sort((a,b)=>a.rank-b.rank);const kept=options.slice(0,12);if(!kept.length){unbound.push(name);continue}
  for(const best of kept){if(!best.nodeId){if(best.t<1e-8)best.nodeId=best.edge.a;else if(best.t>1-1e-8)best.nodeId=best.edge.b;else{best.nodeId='linear-'+best.edge.wayId+'-'+best.edge.fromNodeId+'-'+best.node.id;best.edge.splits.push({...best,id:best.nodeId});coords.set(best.nodeId,best.point)}}}
  bindings.set(name,kept);
 }
 const adjacency=new Map,edgeProof=new Map,sparseSourceEdges=[];
 const add=(a,b,proof)=>{if(!adjacency.has(a))adjacency.set(a,[]);adjacency.get(a).push([b,distance(coords.get(a),coords.get(b))]);edgeProof.set(a+'|'+b,proof)};
 for(const edge of edges){
  const ordered=[{id:edge.a,t:0},...[...new Map(edge.splits.map(s=>[s.id,s])).values()].sort((a,b)=>a.t-b.t),{id:edge.b,t:1}];
  if(distance(edge.from,edge.to)>2)sparseSourceEdges.push({wayId:edge.wayId,fromNodeId:edge.fromNodeId,toNodeId:edge.toNodeId,from:edge.from,to:edge.to,distanceKm:distance(edge.from,edge.to)});
  for(let i=1;i<ordered.length;i++){const a=ordered[i-1].id,b=ordered[i].id;if(a===b)continue;const proof={wayId:edge.wayId,fromNodeId:edge.fromNodeId,toNodeId:edge.toNodeId};if(edge.oneway!=='-1')add(a,b,proof);if(edge.oneway!=='yes')add(b,a,proof)}
 }
 return{coords,adjacency,edgeProof,bindings,unbound,selected,sparseSourceEdges,cache:new Map};
}
function shortest(graph,start,end){
 const key=start+'|'+end;if(graph.cache.has(key))return graph.cache.get(key);
 const dist=new Map([[start,0]]),prior=new Map,heap=new Heap;heap.push([0,start]);
 while(heap.length){const [cost,node]=heap.pop();if(cost!==dist.get(node))continue;if(node===end)break;for(const [next,km] of graph.adjacency.get(node)||[]){const total=cost+km;if(total<(dist.get(next)??Infinity)){dist.set(next,total);prior.set(next,node);heap.push([total,next])}}}
 let result=null;if(dist.has(end)){const ids=[end];while(ids[0]!==start)ids.unshift(prior.get(ids[0]));result={ids,lengthKm:dist.get(end)}}graph.cache.set(key,result);return result;
}
const existing=[...read(out,'rail-batch').routes,...read(out,'rail-highspeed-batch').routes];
const existingPatterns=new Map(existing.map(r=>[r.id,new Set(r.verifiedJourneys.map(j=>JSON.stringify(j.stations.map(s=>keyName(s.ko)))))]));
const metro=read(base,'seoulmetro-trip-candidates').map(t=>({id:t.id,sourceId:t.sourceId,sourceDate:'2026-09-01',sheet:t.officialLineCode,trainType:t.express?'급행':'일반',calendar:t.calendarLabel,calls:t.calls.map(c=>({ko:c.operationalStationName,time:c.arrival||c.departure})),origin:t.originOperationalName,destination:t.destinationOperationalName}));
const korail=read(base,'timetable-candidates').tripCandidates.map(t=>({...t,origin:t.originOperationalName,destination:t.destinationOperationalName,trainType:/ITX/.test(t.sheet)?'ITX-청춘':/급행/.test(t.calendarLabel||'')?'급행':'일반',calls:t.calls.map(c=>({ko:display(c.operationalStationName),time:c.arrival||c.departure}))}));
const groups=[];
const lineIds={1:'8691899',2:'7625892',3:'7879839',4:'7625893',5:'7879871',6:'7919154',7:'7922930',8:'7919019'};
for(const [n,id] of Object.entries(lineIds))groups.push({id:'metro-'+n,label:`수도권 전철 ${n}호선`,mode:'subway',region:'수도권',target:'kr-rail-seoul-'+n,services:data.services.filter(s=>s.passengerLineId==='kr-osm-line-'+id),trips:metro.filter(t=>t.sheet===n),sourceUrl:'https://www.data.go.kr/data/15098251/fileData.do'});
for(const spec of [
 ['suin-bundang','수인·분당선','11619514',t=>t.sourceId==='korail-timetable-25702'],
 ['gyeonggang','수도권 전철 경강선','8735483',t=>t.sourceId==='korail-timetable-23962'],
 ['gyeongchun','수도권 전철 경춘선','8656365',t=>/2574[56]$/.test(t.sourceId)&&/경춘선|망우직결선/.test(t.sheet)],
 ['gyeongui-jungang','경의·중앙선','8667957',t=>/2574[56]$/.test(t.sourceId)&&/경의/.test(t.sheet)],
 ['seohae','수도권 전철 서해선','8725316',t=>/2574[56]$/.test(t.sourceId)&&/서해선/.test(t.sheet)],
 ['donghae','동해선 광역전철','8272972',t=>/25747$/.test(t.sourceId)],
 ['daegyeong','대경선','18418133',t=>/25748$/.test(t.sourceId)],
 ['itx-cheongchun','아이티엑스 청춘 경춘선',null,t=>/2574[56]$/.test(t.sourceId)&&/ITX청춘/.test(t.sheet)],
 ]){const [id,label,lineId,accept]=spec;groups.push({id,label,mode:id==='itx-cheongchun'?'rail':'commuter_rail',region:'전국',services:data.services.filter(s=>lineId?s.passengerLineId==='kr-osm-line-'+lineId:/1411574[9]$|14115750$/.test(s.id)),trips:korail.filter(accept),sourceUrl:'https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable'})}
for(const spec of [
 ['gyeongbu-conventional','경부선 일반열차',['6094786','8266158'],'경부선','conventional'],
 ['gyeongbuk-conventional','경북선 일반열차',['8787856'],'경북선','conventional'],
 ['yeongdong-conventional','영동선 일반열차',['7796215'],'영동선','conventional'],
 ['taebaek-conventional','태백선 일반열차',['7796022','7796215'],'태백선','conventional'],
 ['gyeongjeon-conventional','경전선 일반열차',['8226481','7798599'],'경전선','conventional'],
 ['honam-highspeed','고속철도 호남선',['11272646'],'호남선','highspeed','kr-rail-highspeed-honam'],
 ['jeolla-highspeed','고속철도 전라선',['11272647'],'전라선','highspeed'],
 ['gyeongbu-highspeed','고속철도 경부선',['11214334','11214335','11208903'],'경부선','highspeed'],
 ['gangneung-highspeed','고속철도 강릉선',['12239797'],'강릉선','highspeed'],
 ]){const [id,label,ids,sheet,kind,target]=spec;groups.push({id,label,mode:kind==='highspeed'?'high_speed_rail':'rail',region:'전국',target,services:data.services.filter(s=>ids.includes(s.id.replace('kr-osm-service-',''))),trips:official.trips.filter(t=>t.sheet===sheet&&t.sourceId==='korail-'+kind+'-20261101'),sourceUrl:official.sources.find(s=>s.id==='korail-'+kind+'-20261101').url})}
const queue=[],routes=[],usedWays=new Map,groupReports=[],currentEvidence=[];
for(const group of groups){
 const patterns=new Map;
 for(const t of group.trips){if(t.calls.length<2)continue;if(t.origin&&(keyName(t.origin)!==keyName(t.calls[0].ko)||keyName(t.destination)!==keyName(t.calls.at(-1).ko)))continue;
  const names=t.calls.map(c=>display(c.ko));const key=JSON.stringify(names.map(keyName));if(!patterns.has(key))patterns.set(key,{names,trips:[]});patterns.get(key).trips.push(t);
 }
 const names=[...new Set([...patterns.values()].flatMap(p=>p.names))],graph=graphFor(group.services,names);
 const route={id:'kr-rail-expansion-'+group.id,...(group.target?{mergeIntoRouteId:group.target}:{}),schemaVersion:2,countryId:'kr',category:group.mode==='rail'?'conventional_rail':group.mode,subcategory:group.mode==='rail'?'일반철도':group.mode==='high_speed_rail'?'고속철도':group.mode==='subway'?'지하철':'광역철도',mode:group.mode,regionId:group.region,line:{ko:group.label,ja:group.label},operatorId:group.target?existing.find(r=>r.id===group.target).operatorId:'kr-korail',operator:group.target?existing.find(r=>r.id===group.target).operator:{ko:'한국철도공사',ja:'한국철도공사'},lineColor:group.target?existing.find(r=>r.id===group.target).lineColor:'#005DAA',geometryReady:true,geometryStatus:'ready',playable:true,releaseStatus:'verified',visibility:'public',sourceRefs:[{url:'https://download.geofabrik.de/asia/south-korea.html',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',sourceDate:'2026-10-14',retrievedAt:'2026-11-01'}],operationalEvidence:{url:group.sourceUrl,checkedAt:'2026-11-01',scope:'공식 완전 열차열·출발과 종착·전 정차순서를 원본 후보 선로 그래프와 대조. 다른 물리적 위치를 이름만으로 연결하지 않음.'},geometryEvidence:{kind:'exact-osm-source-edges',sourceNodeContinuity:true,sparseSourceEdges:graph.sparseSourceEdges,linearReferencing:'정차지 점은 원본 선로 한 구간 위의 수직 투영으로만 삽입하며 원본 선형을 변경하지 않음.'},verifiedJourneys:[],services:[],operatingEvidenceByJourney:{}};
 for(const [key,p] of patterns){
  if(existingPatterns.get(group.target)?.has(key)){currentEvidence.push({routeId:group.target,patternKey:key,sourceUrl:group.sourceUrl,checkedAt:'2026-11-01',tripIds:p.trips.map(t=>t.id),calls:p.names});continue}
  const options=p.names.map(n=>graph.bindings.get(n));let reason,ids=[],stopIndices=[],bindings=[];
  if(options.some(b=>!b))reason='공식 정차지와 후보 실제 선로의 150미터 이내 연결 불가';
  else{
   let states=options[0].map(binding=>({cost:binding.rank||0,bindings:[binding],legs:[]}));
   for(let i=1;i<options.length;i++){const next=[];for(const binding of options[i]){let best=null;for(const state of states){const prev=state.bindings.at(-1),leg=shortest(graph,prev.nodeId,binding.nodeId);if(!leg||leg.lengthKm>Math.max(15,distance([prev.node.lat,prev.node.lon],[binding.node.lat,binding.node.lon])*3))continue;const cost=state.cost+leg.lengthKm+(binding.rank||0);if(!best||cost<best.cost)best={cost,bindings:[...state.bindings,binding],legs:[...state.legs,leg]}}if(best)next.push(best)}states=next;if(!states.length)break}
   if(!states.length)reason='공통 원본 노드로 연결된 방향별 선로 부재';else{states.sort((a,b)=>a.cost-b.cost);const best=states[0];bindings=best.bindings;ids=[bindings[0].nodeId];stopIndices=[0];for(const leg of best.legs){ids.push(...leg.ids.slice(1));stopIndices.push(ids.length-1)}}
  }
  if(!reason&&stopIndices.some((x,i)=>i&&x<=stopIndices[i-1]))reason='정차 순서 중복';
  if(reason){queue.push({groupId:group.id,patternId:hash(key).slice(0,16),reason,calls:p.names,tripIds:p.trips.map(t=>t.id),unbound:p.names.filter(n=>!graph.bindings.has(n))});continue}
  const geometry=ids.map(id=>graph.coords.get(id)),jid='kr-expansion-pattern-'+hash(group.id+'|'+key).slice(0,16);
  const stations=p.names.map((name,i)=>{const b=bindings[i];return{id:'kr-rail-node-'+b.node.id,ko:name,ja:name,kana:name,romaji:name,latitude:b.node.lat,longitude:b.node.lon,geometryIndex:stopIndices[i],sourceNodeId:b.node.id,sourceTrackOffsetMeters:Math.round(b.offset*1000),sourceBindingKind:b.edge?'original-segment-linear-reference':'original-rail-node'}});
  const types=[...new Set(p.trips.map(t=>String(t.trainType||'일반').replace(/케이티엑스/g,'KTX').replace(/아이티엑스/g,'ITX')))];
  const name=stations[0].ko+' → '+stations.at(-1).ko+' '+types.join('·')+' '+stations.length+'개역 정차';
  const service={id:jid,nameKo:name,nameJa:name,nameEn:name,stops:stations.map(s=>s.id)};
  const journey={id:jid,patternId:jid,patternName:{ko:name},directionId:group.id+'-'+hash(stations[0].ko+'|'+stations.at(-1).ko).slice(0,8),tripIds:p.trips.map(t=>t.id),officialTrainNumbers:[...new Set(p.trips.map(t=>t.trainNumber).filter(Boolean))],calendarLabels:[...new Set(p.trips.map(t=>t.calendar||t.calendarLabel).filter(Boolean))],stations,geometry,service,directedSegments:stations.slice(0,-1).map((s,i)=>({fromStationId:s.id,toStationId:stations[i+1].id,geometry:geometry.slice(s.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready'})),sourceEdgeRefs:ids.slice(1).map((id,i)=>graph.edgeProof.get(ids[i]+'|'+id))};
  const probe={...route,verifiedJourneys:[journey]};const errors=validateRoute(probe);
  if(errors.length){queue.push({groupId:group.id,patternId:jid,reason:'자동 공개 검증 미통과',errors,calls:p.names,tripIds:journey.tripIds});continue}
  route.verifiedJourneys.push(journey);route.services.push(service);route.operatingEvidenceByJourney[jid]={url:group.sourceUrl,checkedAt:'2026-11-01',sourceIds:[...new Set(p.trips.map(t=>t.sourceId))]};
 }
 if(route.verifiedJourneys.length){route.verifiedJourneys.sort((a,b)=>b.stations.length-a.stations.length);Object.assign(route,{stations:route.verifiedJourneys[0].stations,geometry:route.verifiedJourneys[0].geometry,directedSegments:route.verifiedJourneys[0].directedSegments});routes.push(route);for(const [id,w] of graph.selected)usedWays.set(id,w)}
 groupReports.push({groupId:group.id,officialPatterns:patterns.size,sourceWays:graph.selected.size,unboundNames:graph.unbound,addedDirections:route.verifiedJourneys.length,queuedPatterns:queue.filter(q=>q.groupId===group.id).length});
 console.log(group.id+': '+route.verifiedJourneys.length+'개 계통');
}
const report={checkedAt:'2026-11-01',newRoutes:routes.filter(r=>!r.mergeIntoRouteId).length,extendedExistingRoutes:routes.filter(r=>r.mergeIntoRouteId).length,extensionRecords:routes.length,addedDirections:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),uniqueStationIds:new Set(routes.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,sourceWays:usedWays.size,queuedPatterns:queue.length,verifiedExistingPatterns:currentEvidence.length,groups:groupReports};
const write=(name,v)=>fs.writeFileSync(path.join(out,'rail-expansion-'+name+'.json'),JSON.stringify(v)+'\n');
write('batch',{schemaVersion:1,generatedAt:'2026-11-01',routes});write('report',report);write('queue',{schemaVersion:1,checkedAt:'2026-11-01',candidates:queue});write('current-evidence',{checkedAt:'2026-11-01',sources:official.sources,verifiedExistingPatterns:currentEvidence});write('physical-alignments',{sourceDate:'2026-10-14',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',ways:[...usedWays.values()]});console.log(JSON.stringify({...report,groups:undefined}));
