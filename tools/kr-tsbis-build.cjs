'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {validateRoute,korean,distance}=require('./lib/kr-canonical.cjs'),{bindStopsToShape}=require('./lib/kr-road-binding.cjs');
const base=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(base,'tsbis-source');
const read=(kind,id)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,kind+'-'+id+'.json.gz'))));
const inventory=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'),'utf8')).routes,operators=JSON.parse(fs.readFileSync(path.join(dir,'operators.json'),'utf8')).operators;
const regions={'강원도':['gangwon','강원특별자치도'],'강원특별자치도':['gangwon','강원특별자치도'],'충청북도':['chungbuk','충청북도'],'충청남도':['chungnam','충청남도'],'전라북도':['jeonbuk','전북특별자치도'],'전북특별자치도':['jeonbuk','전북특별자치도'],'전라남도':['jeonnam','전라남도'],'경상북도':['gyeongbuk','경상북도'],'경상남도':['gyeongnam','경상남도']};
const cats={'10':['광역급행버스','metropolitan_bus','express_bus'],'12':['좌석버스','city_bus','bus'],'13':['시내버스','city_bus','bus'],'23':['농어촌버스','rural_bus','bus'],'30':['마을버스','village_bus','village_bus'],'41':['고속버스','express_bus','express_bus'],'42':['직행버스','express_bus','express_bus'],'43':['시외버스','express_bus','express_bus']};
const assert=(v,msg)=>{if(!v)throw Error(msg)};
// Preserve the original name as metadata. Public English abbreviations receive
// Korean readings, consistent with the already published Seoul/GBIS catalog.
const alphabet=['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지'];
const displayKo=value=>String(value||'').replace(/APT/gi,'아파트').replace(/[A-Za-z]/g,c=>alphabet[c.toUpperCase().charCodeAt(0)-65]).normalize('NFC');
function compile(meta){
 const rid=meta.route_id,region=regions[meta.admin_nm1],cat=cats[meta.route_ty],operator=operators[meta.company_id];
 assert(meta.use_yn==='Y','현재 운행 상태 미확인');assert(region,'행정구역 미확인');assert(cat,'공식 버스 분류 미확인');assert(operator&&korean(operator.name),'공식 운영사명 미확인');
 assert(korean(meta.route_nm)||/^\d+[\d-]*$/.test(meta.route_nm),'한국어 노선번호 보완 필요');
 const sequence=read('stops',rid),wfs=read('wfsstops',rid),rawShape=read('shape',rid);
 assert(Array.isArray(sequence)&&sequence.length>1,'전체 정류장 순서 누락');
 const calls=(wfs.features||[]).map(f=>f.properties).sort((a,b)=>Number(a.sequence)-Number(b.sequence));
 assert(JSON.stringify(calls.map(s=>[s.station_id,Number(s.sequence)]))===JSON.stringify(sequence.map(s=>[s.station_id,Number(s.sequence)])),'공식 두 정류장 자료의 순서 불일치');
 assert(calls[0]?.station_id===meta.st_sta_id&&calls.at(-1)?.station_id===meta.ed_sta_id,'공식 기종점 정류장 ID 불일치');
 assert(calls.every(s=>korean(displayKo(s.station_knm))),'한국어 정류장명 보완 필요');
 const features=(rawShape.features||[]).slice().sort((a,b)=>Number(a.properties.up_down)-Number(b.properties.up_down)||Number(a.properties.link_seq)-Number(b.properties.link_seq));
 assert(features.length&&features.every(f=>f.geometry.type==='LineString'&&f.properties.route_id===rid),'원본 실제 도로 선형 누락');
 const sourceShape=[];
 for(const f of features){const points=f.geometry.coordinates.map(p=>[p[1],p[0]]);assert(points.length>1,'빈 방향별 선형');if(sourceShape.length)assert(JSON.stringify(sourceShape.at(-1))===JSON.stringify(points[0]),'원본 방향별 도로 접속 단절');for(const p of points)if(!sourceShape.length||JSON.stringify(sourceShape.at(-1))!==JSON.stringify(p))sourceShape.push(p);}
 const normalized=calls.map((s,i)=>({...s,posY:Number(s.coords_y),posX:Number(s.coords_x),stationOrd:Number(s.sequence),guganLen:Number(s.stat_dist)||Number(calls[i-1]?.next_dist)||0}));
 const bound=bindStopsToShape(sourceShape,normalized);
 const middle=calls.findIndex(s=>s.station_id===meta.md_sta_id&&Number(s.sequence)===Number(meta.md_sta_index));
 const patterns=middle>0&&middle<calls.length-1?[{id:'outbound',start:0,end:middle},{id:'inbound',start:middle,end:calls.length-1}]:[{id:'complete',start:0,end:calls.length-1}];
 const journeys=patterns.map(p=>{
  const first=bound.indexes[p.start],last=bound.indexes[p.end],geometry=bound.geometry.slice(first,last+1),stations=normalized.slice(p.start,p.end+1).map((s,i)=>({id:'kr-ts-bis-stop-'+s.station_id,sourceStopId:s.station_id,sourceSequence:Number(s.sequence),sourceName:s.station_knm,ko:displayKo(s.station_knm),ja:displayKo(s.station_knm),kana:displayKo(s.station_knm),romaji:displayKo(s.station_knm),latitude:s.posY,longitude:s.posX,geometryIndex:bound.indexes[p.start+i]-first}));
  const id='kr-ts-bis-'+rid+'-'+p.id,name=stations[0].ko+' → '+stations.at(-1).ko+(p.id==='complete'?' 전체 운행':' 방면')+(meta.route_ex?' · '+displayKo(meta.route_ex):'');
  return{id,patternId:id,directionId:p.id,patternName:{ko:name},tripIds:[rid+':'+p.id],stations,geometry,
   geometryEvidence:{kind:'official-tsbis-original-road-segments',sourcePositions:bound.sourcePositions.slice(first,last+1),maximumOffsetKm:bound.maximumOffsetKm},
   sourcePattern:{routeId:rid,startSequence:stations[0].sourceSequence,endSequence:stations.at(-1).sourceSequence,officialMidpointId:meta.md_sta_id,officialMidpointSequence:meta.md_sta_index},
   directedSegments:stations.slice(1).map((s,i)=>({fromStationId:stations[i].id,toStationId:s.id,geometry:geometry.slice(stations[i].geometryIndex,s.geometryIndex+1)})),service:{id,nameKo:name,stops:stations.map(s=>s.id)}};
 });
 const route={schemaVersion:2,id:'kr-bus-ts-bis-'+rid,countryId:'kr',regionId:region[0],regionKo:region[1],municipalityKo:meta.admin_nm2,mode:cat[2],category:cat[1],normalizedCategory:cat[1],categoryKo:cat[0],regionalCategory:meta.route_ty_nm,operatorId:'kr-ts-bis-operator-'+meta.company_id,operator:{ko:operator.name},line:{ko:meta.admin_nm2+' '+meta.route_nm+'번'},routeNumber:meta.route_nm,lineColor:'#2a9d64',releaseStatus:'verified',geometryReady:true,verifiedJourneys:journeys,stations:journeys[0].stations,geometry:journeys[0].geometry,
  sourceRefs:[{url:'https://tsbis.kr/route/getWfsRoute.do?route_id='+rid,sourceDate:meta.apply_date?.slice(0,8)||'2026-11-01',retrievedAt:'2026-11-01',license:'공공데이터 사실정보 추출; 동일 제공기관의 공개 노선·정류소 데이터 이용허락범위 제한 없음',licenseUrl:'https://www.data.go.kr/data/15105964/fileData.do',attribution:'한국교통안전공단 광역버스정보시스템',coordinateSystem:'EPSG:4326'},{url:operator.url,retrievedAt:operator.retrievedAt,license:'공개 운행정보의 운영사 사실정보 추출'}],
  operationalEvidence:{url:'https://tsbis.kr/route/getRouteList.do',checkedAt:'2026-11-01',routeId:rid,useYn:meta.use_yn,applyDate:meta.apply_date,officialOriginId:meta.st_sta_id,officialDestinationId:meta.ed_sta_id,routeDescription:meta.route_ex,fullSequenceEndsAtOfficialDestination:true}};
 const errors=validateRoute(route);assert(!errors.length,'공개 스키마: '+errors.join(','));return route;
}
module.exports={compile};
if(require.main===module){
const groups=new Map,queue=[],routes=[];
for(let i=0;i<inventory.length;i++){const meta=inventory[i];try{const r=compile(meta);routes.push(r);const key=meta.admin_id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}catch(e){queue.push({routeId:'kr-bus-ts-bis-'+meta.route_id,sourceRouteId:meta.route_id,region:meta.admin_nm1,municipality:meta.admin_nm2,reason:e.message});}if(i%200===0)console.log(i,'/',inventory.length,'published',routes.length);}
const eligibleCandidates=routes.slice(),families=new Map,metaById=new Map(inventory.map(r=>[r.route_id,r]));
const publishedIndex=path.join(base,'../generated/index.json');
const previousFamilies=new Map((fs.existsSync(publishedIndex)?JSON.parse(fs.readFileSync(publishedIndex,'utf8')).routes:[]).filter(r=>r.id.startsWith('kr-bus-ts-bis-')).map(r=>[[r.municipalityKo,r.operatorId,r.routeNumber].join('|'),r.id]));
for(const r of eligibleCandidates){const rid=r.id.replace('kr-bus-ts-bis-',''),meta=metaById.get(rid),key=[meta.admin_id,meta.company_id,meta.route_nm].join('|');
 if(!families.has(key))families.set(key,[]);families.get(key).push(r);
}
routes.length=0;groups.clear();
for(const members of families.values()){
 members.sort((a,b)=>a.id.localeCompare(b.id));const parent={...members[0]},meta=metaById.get(parent.id.replace('kr-bus-ts-bis-',''));
 const stableId=inventory.filter(r=>r.admin_id===meta.admin_id&&r.company_id===meta.company_id&&r.route_nm===meta.route_nm).map(r=>r.route_id).sort()[0];parent.id=previousFamilies.get([parent.municipalityKo,parent.operatorId,parent.routeNumber].join('|'))||'kr-bus-ts-bis-'+stableId;
 parent.sourceRouteIds=members.map(r=>r.id.replace('kr-bus-ts-bis-',''));
 parent.verifiedJourneys=members.flatMap(r=>r.verifiedJourneys);parent.sourceRefs=[...new Map(members.flatMap(r=>r.sourceRefs).map(s=>[JSON.stringify(s),s])).values()];
 parent.operationalEvidenceByJourney=Object.fromEntries(members.flatMap(r=>r.verifiedJourneys.map(j=>[j.id,r.operationalEvidence])));
 assert(!validateRoute(parent).length,'동일 노선번호 계통 병합 오류');routes.push(parent);
 if(!groups.has(meta.admin_id))groups.set(meta.admin_id,[]);groups.get(meta.admin_id).push(parent);
}
for(const[key,items]of groups)fs.writeFileSync(path.join(base,'tsbis-'+key+'-batch.json'),JSON.stringify({schemaVersion:2,generatedBy:'tools/kr-tsbis-build.cjs',routes:items})+'\n');
const old=JSON.parse(fs.readFileSync(path.join(base,'bus-candidates.json'),'utf8')).routes.filter(r=>r.cityCode),oldIds=new Set(old.map(r=>r.sourceRouteId)),now=new Set(inventory.map(r=>r.route_id));
const report={checkedAt:new Date().toISOString(),currentInventory:inventory.length,processedOldCandidates:old.length,oldCandidatesStillCurrent:old.filter(r=>now.has(r.sourceRouteId)).length,oldCandidatesNotCurrent:old.filter(r=>!now.has(r.sourceRouteId)).length,publishedSourceCandidates:eligibleCandidates.length,publishedOldCandidates:eligibleCandidates.filter(r=>oldIds.has(r.id.replace('kr-bus-ts-bis-',''))).length,newlyDiscoveredPublished:eligibleCandidates.filter(r=>!oldIds.has(r.id.replace('kr-bus-ts-bis-',''))).length,publicRoutes:routes.length,directions:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),stops:new Set(routes.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)))).size,municipalities:Object.fromEntries([...groups].map(([k,rs])=>[rs[0].municipalityKo,rs.length])),queued:queue.length,reasons:queue.reduce((o,q)=>(o[q.reason]=(o[q.reason]||0)+1,o),{})};
fs.writeFileSync(path.join(base,'tsbis-report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(base,'tsbis-queue.json'),JSON.stringify({candidates:queue,notCurrentlyListed:old.filter(r=>!now.has(r.sourceRouteId)).map(r=>r.id)},null,2));console.log(JSON.stringify(report,null,2));
}
