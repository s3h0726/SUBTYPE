#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const errors=[],warnings=[];
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const index=read('data/kr/generated/index.json');
const routeIds=new Set(),stationIds=new Set(),operatorIds=new Set((index.operators||[]).map(o=>o.id));
let totalLineStationEntries=0,geometryReady=0,missingCoordinates=0;
const ensure=(ok,msg)=>{if(!ok)errors.push(msg)};
ensure(index.country?.id==='kr','index country is not kr');
ensure(Array.isArray(index.routes)&&index.routes.length>0,'no Korean routes');
for(const meta of index.routes||[]){
 ensure(!routeIds.has(meta.id),'duplicate route id '+meta.id);routeIds.add(meta.id);
 ensure(meta.countryId==='kr'&&meta.id.startsWith('kr-'),'country-scoped id '+meta.id);
 ensure(operatorIds.has(meta.operatorId),'unknown operator '+meta.id);
 ensure(meta.lazy===true&&typeof meta.lazySource==='string','missing lazy data '+meta.id);
 const pathToDetail=path.join(root,meta.lazySource||'INVALID');
 if(!fs.existsSync(pathToDetail)){errors.push('detail missing '+meta.id);continue}
 const detail=JSON.parse(fs.readFileSync(pathToDetail,'utf8')).route;
 if(!detail){errors.push('route payload missing '+meta.id);continue}
 ensure(detail.id===meta.id,'id mismatch '+meta.id);
 ensure(detail.countryId==='kr','detail country mismatch '+meta.id);
 ensure(detail.operatorId===meta.operatorId,'operator mismatch '+meta.id);
 ensure(detail.stations?.length===meta.stationCount,'station count mismatch '+meta.id);
 ensure(detail.directions?.length===meta.directionCount,'direction count mismatch '+meta.id);
 const primary=detail.directions?.[0]?.stops||[];
 totalLineStationEntries+=primary.length;
 ensure(primary.length>=3,'fewer than three stations '+meta.id);
 ensure(meta.searchStations?.every(s=>primary.some(x=>x.names?.ko===s)),'search name mismatch '+meta.id);
 const ids=new Set(),stopNames=[];
 for(const st of primary){
  ensure(!!st.id&&!!st.names?.ko,'missing station id or Korean name '+meta.id);
  if(ids.has(st.id)&&!(detail.loop&&st.id===primary[0]?.id&&st===primary.at(-1)))errors.push('duplicated station id '+meta.id+'/'+st.id);
  ids.add(st.id);stationIds.add(st.id);stopNames.push(st.names?.ko);
  const lat=st.latitude,lng=st.longitude;
  if(lat===null&&lng===null)missingCoordinates++;
  else ensure(typeof lat==='number'&&typeof lng==='number'&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=33&&lat<=39&&lng>=124&&lng<=132,'invalid or partial coordinate '+meta.id+'/'+st.id);
 }
 if(detail.directions?.length===2){
  const reverse=detail.directions[1].stops?.map(x=>x.id)||[];
  ensure(JSON.stringify(primary.map(x=>x.id).reverse())===JSON.stringify(reverse),'reversed stations inconsistent '+meta.id);
 }
 for(const direction of detail.directions||[]){
  ensure(direction.stops?.length===primary.length,'direction station count mismatch '+meta.id+'/'+direction.id);
  if(direction.geometryStatus!=='ready'){
   ensure(!(direction.geometry||[]).length&&!(direction.directedSegments||[]).length,'fake geometry '+meta.id+'/'+direction.id);
  }else{
   ensure(direction.directedSegments?.length===direction.stops?.length-1,'geometry segments mismatch '+meta.id+'/'+direction.id);
  }
 }
 if(detail.geometryReady)geometryReady++;
 if(detail.sourceStatus==='secondary-unverified')warnings.push('secondary source needs checking: '+meta.id);
}
ensure(index.counts?.routes===routeIds.size,'index route count mismatch');
ensure(index.counts?.operators===operatorIds.size,'index operator count mismatch');
ensure(index.counts?.stops===totalLineStationEntries,'index station entry count mismatch');
const report={status:errors.length?'FAIL':'PASS',routes:routeIds.size,stationEntries:totalLineStationEntries,uniqueStationIds:stationIds.size,geometryReady,missingCoordinates,sourceReviewPending:warnings.length,errors,warningsSample:warnings.slice(0,10)};
console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
