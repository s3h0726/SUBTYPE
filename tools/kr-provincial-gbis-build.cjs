'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {bindStopsToShape}=require('./lib/kr-road-binding.cjs');
const {validateRoute,korean,coordinate}=require('./lib/kr-canonical.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/canonical'),dir=path.join(base,'provincial-gbis-source');
const endpoint='https://www.gbis.go.kr/gbis2014/schBusAPI.action';
const read=(id,kind)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,`${id}-${kind}.json.gz`))));
// Source coordinate system is spherical Mercator metres, as used by the
// official GBIS map client. Convert coordinates; never road-route stop pairs.
function wgs84(x,y){return[Math.atan(Math.sinh(Number(y)/6378137))*180/Math.PI,Number(x)/6378137*180/Math.PI]}
const letters=Object.fromEntries([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((c,i)=>[c,['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지'][i]]));
const ko=name=>String(name||'').replace(/[A-Za-z]/g,c=>letters[c.toUpperCase()]).normalize('NFC');
const categories={11:['직행좌석버스','metropolitan_bus','express_bus','#e4473c'],12:['좌석버스','city_bus','bus','#338bd0'],13:['일반시내버스','city_bus','bus','#3bad5a'],14:['광역급행버스','metropolitan_bus','express_bus','#338bd0'],15:['맞춤형버스','other_bus','bus','#3bad5a'],16:['경기순환버스','metropolitan_bus','express_bus','#e4473c'],21:['직행좌석 농어촌버스','rural_bus','bus','#e4473c'],22:['좌석 농어촌버스','rural_bus','bus','#338bd0'],23:['일반 농어촌버스','rural_bus','bus','#3bad5a'],30:['마을버스','village_bus','village_bus','#eab500'],41:['고속형 시외버스','express_bus','express_bus','#7961ad'],42:['좌석형 시외버스','express_bus','express_bus','#7961ad'],43:['일반형 시외버스','express_bus','express_bus','#7961ad'],51:['리무진 공항버스','other_bus','express_bus','#7961ad'],52:['좌석형 공항버스','other_bus','express_bus','#7961ad'],53:['일반형 공항버스','other_bus','express_bus','#7961ad']};
function requireValue(v,message){if(!v)throw Error(message)}
function compile(candidate){
 const rid=candidate.routeId,raw=read(rid,'detail'),rawGeometry=read(rid,'geometry'),data=raw.result.gg;
 requireValue(data?.route,'GBIS_GYEONGGI_ROUTE_DETAIL_MISSING');
 const route=data.route,code=Number(data.routeTypeCd||candidate.routeTp),category=categories[code];
 requireValue(category,'OFFICIAL_CATEGORY_UNSUPPORTED:'+code);
 requireValue(route.routeId===rid,'OFFICIAL_ROUTE_ID_MISMATCH');
 requireValue(route.routeNm===candidate.routeNm,'OFFICIAL_ROUTE_NUMBER_CHANGED');
 requireValue(korean(ko(route.companyNm)),'KOREAN_OPERATOR_MISSING');
 requireValue(route.adminNm?.startsWith('경기도'),'OTHER_AUTHORITY_QUEUE');
 const municipality=route.adminNm.replace(/^경기도\s*/,'')||'경기도',journeys=[],failed=[];
 for(const direction of ['up','down'])try{
  const sourceShape=rawGeometry.result.gg?.[direction+'Line']?.list;
  requireValue(sourceShape?.length>1,'OFFICIAL_DIRECTION_SHAPE_MISSING');
  const shape=sourceShape.map(p=>wgs84(p.lon,p.lat)).filter((p,i,a)=>!i||JSON.stringify(p)!==JSON.stringify(a[i-1]));
  const rawStops=data[direction]?.list;
  requireValue(rawStops?.length>1,'OFFICIAL_DIRECTION_STOPS_MISSING');
  // GBIS explicitly labels type 6 nodes as pass-through, not boarding stops.
  // Preserve these nodes in road geometry, omit them only from typing targets.
  const boarding=rawStops.filter(s=>String(s.stationTp)!=='6'&&!/\((경유|미정차)\)/.test(s.stationNm));
  requireValue(boarding.length>1,'EMPTY_BOARDING_DIRECTION');
  const estimate=raw.result.estimateTime||[];
  let previousSequence=0;
  const normalized=boarding.map((s,i)=>{
   const p=wgs84(s.lon,s.lat),sequence=Number(s.estiSeq);
   const length=estimate.filter(e=>Number(e.staOrder)>previousSequence&&Number(e.staOrder)<=sequence).reduce((sum,e)=>sum+Number(e.length||0),0);
   previousSequence=sequence;
   return{...s,posY:p[0],posX:p[1],stationOrd:sequence,guganLen:i?length:0};
  });
  const bound=bindStopsToShape(shape,normalized);
  const start=bound.indexes[0],end=bound.indexes.at(-1),geometry=bound.geometry.slice(start,end+1);
  const stations=normalized.map((s,i)=>{
   const name=ko(s.stationNm);requireValue(korean(name),'KOREAN_STOP_NAME_MISSING:'+s.stationId);
   requireValue(coordinate([s.posY,s.posX]),'STOP_COORDINATE_INVALID');
   return{id:'kr-gbis-stop-'+s.stationId,sourceStopId:s.stationId,sourceName:s.stationNm,arsId:s.stationNo,
    ko:name,ja:name,kana:name,romaji:name,latitude:s.posY,longitude:s.posX,
    geometryIndex:bound.indexes[i]-start,sourceStationOrder:s.stationOrd};
  });
  const jid='kr-bus-gbis-'+rid+'-'+direction,destination=ko(direction==='up'?route.edStaNm:route.stStaNm);
  requireValue(korean(destination),'KOREAN_DESTINATION_MISSING');
  const pattern=destination+' 방면';
  journeys.push({id:jid,patternId:jid,directionId:direction,patternName:{ko:pattern},tripIds:[rid+':'+direction],
   stations,geometry,sourcePattern:{routeId:rid,direction,boardingStopIds:boarding.map(s=>s.stationId),turnSequence:route.turnSeq},
   geometryEvidence:{kind:'official-gbis-road-polyline',sourceFile:`data/kr/canonical/provincial-gbis-source/${rid}-geometry.json.gz`,
    sourceDirection:direction+'Line',sourcePositions:bound.sourcePositions.slice(start,end+1),maximumStopOffsetKm:bound.maximumOffsetKm},
   directedSegments:stations.slice(1).map((s,i)=>({fromStationId:stations[i].id,toStationId:s.id,
    geometry:geometry.slice(stations[i].geometryIndex,s.geometryIndex+1)})),
   service:{id:jid,nameKo:pattern,stops:stations.map(s=>s.id)}});
 }catch(error){failed.push({direction,error:String(error.message||error)})}
 requireValue(journeys.length,'NO_VALID_DIRECTION:'+failed.map(f=>f.direction+':'+f.error).join(';'));
 const result={schemaVersion:2,id:'kr-bus-gbis-'+rid,countryId:'kr',mode:category[2],
  line:{ko:'경기 '+(municipality==='경기도'?'':municipality+' ')+ko(route.routeNm)+'번'},operator:{ko:ko(route.companyNm)},
  operatorId:'kr-gbis-operator-'+crypto.createHash('sha256').update(route.companyNm.normalize('NFC')).digest('hex').slice(0,16),
  regionId:'gyeonggi',regionKo:'경기도',municipalityKo:municipality,routeNumber:ko(route.routeNm),
  category:category[1],normalizedCategory:category[1],categoryKo:category[0],regionalCategory:category[0],color:category[3],
  releaseStatus:'verified',geometryReady:true,verifiedJourneys:journeys,stations:journeys[0].stations,geometry:journeys[0].geometry,
  sourceRefs:[{url:endpoint,sourceDate:'2026-11-01',retrievedAt:'2026-11-01',license:'이용허락범위 제한 없음',
   attribution:'경기도 경기버스정보',licenseUrl:'https://www.data.go.kr/data/15080662/openapi.do',
   routeId:rid,commands:['searchRouteJson','searchMapLineJson'],coordinateSystem:'EPSG:3857'},
   {url:'https://www.gbis.go.kr/gbis2014/publicService.action?cmd=mBusRouteLine',sourceDate:'2026-11-01',license:'이용허락범위 제한 없음'}],
  operationalEvidence:{url:'https://www.gbis.go.kr/gbis2014/schBus.action',checkedAt:'2026-11-01',routeId:rid,
   upFirstTime:route.upFirstTime,upLastTime:route.upLastTime,downFirstTime:route.downFirstTime,downLastTime:route.downLastTime}};
 requireValue(!validateRoute(result).length,'CANONICAL_VALIDATION:'+validateRoute(result).join(','));
 return{route:result,failed};
}
const inventory=JSON.parse(fs.readFileSync(path.join(base,'provincial-gbis-inventory.json'),'utf8')).routes;
const groups=new Map,failures=[],summary={inventoryRoutes:inventory.length,publicRoutes:0,playableDirections:0,categories:{},municipalities:{},uniqueStops:0},stopIds=new Set;
for(let i=0;i<inventory.length;i++){
 const candidate=inventory[i];
 try{
  const {route,failed}=compile(candidate),city=route.municipalityKo;
  if(!groups.has(city))groups.set(city,[]);groups.get(city).push(route);
  summary.publicRoutes++;summary.playableDirections+=route.verifiedJourneys.length;
  summary.categories[route.categoryKo]=(summary.categories[route.categoryKo]||0)+1;
  summary.municipalities[city]=(summary.municipalities[city]||0)+1;
  for(const j of route.verifiedJourneys)for(const s of j.stations)stopIds.add(s.id);
  for(const f of failed)failures.push({routeId:route.id,...f,partial:true});
 }catch(error){failures.push({routeId:'kr-bus-gbis-'+candidate.routeId,error:String(error.message||error),partial:false})}
 if(i%100===0)console.log(`compile ${i}/${inventory.length}: ${summary.publicRoutes}`);
}
for(const[city,routes]of groups){
 const codes=[...city].map(c=>c.codePointAt(0).toString(16)).join('-');
 const target=path.join(base,`provincial-gbis-${codes}-batch.json`),temporary=target+'.tmp';
 fs.writeFileSync(temporary,JSON.stringify({schemaVersion:2,generatedBy:'tools/kr-provincial-gbis-build.cjs',municipalityKo:city,routes})+'\n');
 fs.renameSync(temporary,target);
}
summary.uniqueStops=stopIds.size;summary.failedRoutes=failures.filter(f=>!f.partial).length;summary.failedDirections=failures.filter(f=>f.partial).length;
fs.writeFileSync(path.join(base,'provincial-gbis-report.json'),JSON.stringify({summary,failures},null,2)+'\n');
console.log(JSON.stringify(summary));
