'use strict';
// 공식 계통 ID와 운영사 근거를 유지하며, 노선 카드와 운행계통을 구분한다.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const model=require('./lib/kr-city-model.cjs'),{epsg5187}=require('./lib/kr-projection.cjs'),city=process.argv[2],base=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(base,city+'-source');
const read=(id,kind)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,id+'-'+kind+'.json.gz')))),rows=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'),'utf8').replace(/^\uFEFF/,'')),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
const operatorFile=path.join(base,city+'-operators.json'),operators=fs.existsSync(operatorFile)?JSON.parse(fs.readFileSync(operatorFile)):null;
const names={daegu:'대구광역시',gwangju:'광주광역시',daejeon:'대전광역시',ulsan:'울산광역시',sejong:'세종특별자치시'},families=new Map,outcomes=[];
for(const meta of rows){const id=String(meta.routeId??meta.LINE_ID??meta.route_id??meta.brtid??meta.routeCd);try{
 let number,operator,category='city_bus',categoryKo='시내버스',mode='bus',patterns=[],family,sourceKinds=['info','stops','shape'];
 if(city==='daegu'){
  const info=read(id,'info').body,calls=read(id,'stops').body,wfs=read(id,'shape');number=info.routeNo;operator=info.comNm;family=number;
  const cats={1:['급행버스','express_bus','express_bus'],2:['순환버스','city_bus','bus'],3:['간선버스','city_bus','bus'],4:['지선버스','city_bus','bus'],5:['맞춤버스','other_bus','bus'],6:['농어촌버스','rural_bus','bus'],7:['직행버스','express_bus','express_bus']};if(!cats[meta.routeTCd])throw Error('공식 분류 미확인');[categoryKo,category,mode]=cats[meta.routeTCd];
  for(const feature of wfs.features.filter(f=>f.geometry.type==='MultiLineString'&&f.properties.routeId===id)){
   const direction=String(feature.properties.moveDir),stops=calls.filter(s=>String(s.moveDir)===direction),parts=feature.geometry.coordinates;
   for(let i=1;i<parts.length;i++)if(JSON.stringify(parts[i-1].at(-1))!==JSON.stringify(parts[i][0]))throw Error('대구 원본 선형 다중 구간 단절');
   patterns.push(model.journey(city,'kr-'+city+'-'+id+'-'+direction,info.routeNote,stops.map(s=>({id:s.bsId,name:s.bsNm,lat:s.lat,lon:s.lng,sequence:s.seq})),parts.flat().map(p=>epsg5187(...p)),{sourcePatternId:id,directionId:direction,sourceCrs:'EPSG:5187',sourceFeatureId:feature.id}));
  }
 }else if(city==='gwangju'){
  const info=read(id,'info').detail,calls=read(id,'stops').list,links=read(id,'shape').list;number=meta.LINE_NAME;operator=info?.COMP_NAME?.replace(/<br\s*\/?>/gi,' · ').replace(/<[^>]+>/g,'');family=id;
  if(Number(meta.METRO_FLAG)!==0)throw Error('외부 지자체 노선은 원 제공기관 대조 필요');
  const cats={1:['급행간선버스','express_bus','express_bus'],2:['간선버스','city_bus','bus'],3:['지선버스','city_bus','bus'],4:['마을버스','village_bus','village_bus'],5:['공항버스','other_bus','express_bus']};if(!cats[meta.LINE_KIND])throw Error('공식 분류 미확인');[categoryKo,category,mode]=cats[meta.LINE_KIND];
  const turn=calls.findIndex(s=>Number(s.RETURN_FLAG)===3),allShape=links.map(p=>[Number(p.LATITUDE),Number(p.LONGITUDE)]);
  const whole=model.journey(city,'kr-'+city+'-'+id+'-complete','전체 운행',calls.map((s,i)=>({id:s.BUSSTOP_ID,name:s.BUSSTOP_NAME,lat:s.LATITUDE,lon:s.LONGITUDE,sequence:i+1})),allShape,{sourcePatternId:id,directionId:'complete'});
  if(meta.DIR_UP_NAME!==meta.DIR_DOWN_NAME&&turn>0&&turn<calls.length-1){for(const [direction,start,end]of [['outbound',0,turn],['inbound',turn,calls.length-1]])patterns.push(model.sliceJourney(whole,'kr-'+city+'-'+id+'-'+direction,direction,start,end));}else patterns.push(whole);
 }else{({number,operator,category,categoryKo,mode,patterns,family,sourceKinds}=require('./lib/kr-other-city-patterns.cjs')({city,id,meta,read,operators}));}
 if(!patterns.length)throw Error('공식 방향과 정류장 또는 선형 결합 실패');if(!operator)throw Error('공식 운영사명 미확인');
 const key=family;if(!families.has(key))families.set(key,{number,operator:new Set,category,categoryKo,mode,patterns:[],sourceIds:[],sources:[]});const group=families.get(key);group.operator.add(operator);group.patterns.push(...patterns);group.sourceIds.push(id);group.sources.push(...sourceKinds.filter(k=>manifest[id+'-'+k+'.json.gz']).map(k=>({...manifest[id+'-'+k+'.json.gz'],license:'공개 버스 운행 사실정보; 제공 지자체 공공데이터 이용 조건',attribution:names[city]+' 공식 버스정보시스템'})));if(operators)group.sources.push(operators.source);outcomes.push({id,status:'PUBLISHED',directions:patterns.length});
 }catch(e){outcomes.push({id,status:/운영사/.test(e.message)?'OPERATOR_UNRESOLVED':/정류장|정차/.test(e.message)?'STOP_SEQUENCE_UNRESOLVED':/제공기관/.test(e.message)?'INSUFFICIENT_SOURCE':'GEOMETRY_UNRESOLVED',reason:e.message})}}
const routes=[];for(const[key,g]of families){const operator=[...g.operator].sort().join(' · '),stableId=['daegu','ulsan','sejong'].includes(city)?crypto.createHash('sha256').update(key).digest('hex').slice(0,14):key;try{routes.push(model.route({prefix:city,id:stableId,regionId:city,regionKo:names[city],name:names[city].replace(/광역시|특별자치시/,'')+' '+g.number+'번',operator,operatorKey:crypto.createHash('sha256').update(operator).digest('hex').slice(0,14),journeys:g.patterns,category:g.category,categoryKo:g.categoryKo,mode:g.mode,sources:g.sources,sourceRouteIds:g.sourceIds,extra:{routeNumber:g.number}}))}catch(e){for(const id of g.sourceIds){const o=outcomes.find(o=>o.id===id);o.status='OTHER_BLOCKED';o.reason=e.message;}}}
const report={city,checkedAt:new Date().toISOString(),inventory:rows.length,routes:routes.length,directions:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),outcomes};fs.writeFileSync(path.join(base,city+'-batch.json'),JSON.stringify({schemaVersion:2,generatedBy:'tools/kr-city-build.cjs',routes})+'\n');fs.writeFileSync(path.join(base,city+'-report.json'),JSON.stringify(report,null,2)+'\n');console.log({city,inventory:rows.length,routes:report.routes,directions:report.directions,remaining:outcomes.filter(o=>o.status!=='PUBLISHED').length});
