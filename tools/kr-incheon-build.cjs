'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const model=require('./lib/kr-city-model.cjs'),base=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(base,'incheon-source'),rows=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'))),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
const cats={1:['지선버스','city_bus','bus'],2:['간선버스','city_bus','bus'],3:['좌석버스','city_bus','bus'],4:['광역버스','metropolitan_bus','express_bus'],5:['공항버스','other_bus','express_bus'],6:['마을버스','village_bus','village_bus'],8:['급행버스','express_bus','express_bus'],9:['지선버스','city_bus','bus'],10:['좌석버스','city_bus','bus']};
const routes=[],outcomes=[],directions=[];
for(const meta of rows){const id=meta.routeid;try{
 const data=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,id+'.json.gz')))),cat=cats[meta.routetpcd];if(!cat)throw Error('공식 버스 분류 미확인');
 if(!data.viaStopList?.length||!data.vertexList?.length)throw Error('정차 순서 또는 도로 원본 누락');
 const calls=data.viaStopList;for(let i=1;i<calls.length;i++)if(Number(calls[i].pathseq)<=Number(calls[i-1].pathseq))throw Error('공식 정류장 순서 역전');
 const journeys=[];
 for(const direction of [...new Set(calls.map(s=>s.dircd))]){try{
  let stops=calls.filter(s=>s.dircd===direction);if(direction==='1'){const turn=calls.filter(s=>s.dircd==='0').at(-1);if(turn)stops=[turn,...stops];}
  const shape=data.vertexList.filter(v=>v.dircd===direction).map(v=>[Number(v.lat),Number(v.lng)]);
  journeys.push(model.journey('incheon', 'kr-incheon-'+id+'-'+direction, direction==='2'?'순환 운행':direction==='0'?'상행':'하행',stops.map(s=>({id:s.bstopid,name:s.nodenm,lat:s.lat,lon:s.lng,sequence:Number(s.pathseq)})),shape,{sourcePatternId:id,directionId:direction,officialTurningStop:direction==='1'?stops[0].bstopid:null}));
 }catch(e){directions.push({routeId:id,direction,status:'GEOMETRY_UNRESOLVED',reason:e.message})}}
 if(!journeys.length)throw Error('모든 운행 방향의 선형·정류장 결합 실패');
 const operator=meta.compnm||calls[0]?.compnm;
 routes.push(model.route({prefix:'incheon',id,regionId:'incheon',regionKo:'인천광역시',name:'인천 '+meta.routeno+'번',operator,operatorKey:crypto.createHash('sha256').update(operator).digest('hex').slice(0,12),journeys,categoryKo:cat[0],category:cat[1],mode:cat[2],sources:[{...manifest[id],license:'공개 버스 운행 사실정보; 인천광역시 공공데이터 이용 조건',attribution:'인천광역시 버스정보시스템'}],extra:{routeNumber:meta.routeno,municipalityKo:'인천광역시',officialCategoryCode:meta.routetpcd}}));
 outcomes.push({id,status:'PUBLISHED',directions:journeys.length});
 }catch(e){outcomes.push({id,status:/운영사/.test(e.message)?'OPERATOR_UNRESOLVED':/정차|정류장/.test(e.message)?'STOP_SEQUENCE_UNRESOLVED':'GEOMETRY_UNRESOLVED',reason:e.message})}}
const report={checkedAt:new Date().toISOString(),inventory:rows.length,routes:routes.length,directions:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),outcomes,failedDirections:directions};
fs.writeFileSync(path.join(base,'incheon-batch.json'),JSON.stringify({schemaVersion:2,generatedBy:'tools/kr-incheon-build.cjs',routes})+'\n');fs.writeFileSync(path.join(base,'incheon-report.json'),JSON.stringify(report,null,2)+'\n');console.log({inventory:rows.length,routes:report.routes,directions:report.directions,failedDirections:directions.length,queue:outcomes.filter(x=>x.status!=='PUBLISHED').length});
