'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),zlib=require('node:zlib'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');process.chdir(root);
const index=JSON.parse(fs.readFileSync('data/th/generated/index.json')),ids=new Set(),stationNames=new Map(),operators=new Set(index.operators.map(o=>o.id)),report={status:'PASS',routes:0,patterns:0,stops:0,sourceCompletenessVerified:false,failures:[]};
const context={console,localStorage:{getItem:()=>null},document:{},crypto:crypto.webcrypto,Blob,Response,TextDecoder,atob,DecompressionStream};vm.createContext(context);
for(const file of ['js/thailand-network.js','js/hong-kong-policy.js','js/route-integrity.js'])vm.runInContext(fs.readFileSync(file,'utf8').replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,''),context,{filename:file});
vm.runInContext('globalThis.thTest={thailandOperatingChoices,resolveThailandChoice,resolvePlayableRoute}',context);
for(const meta of index.routes)try{
 assert.equal(meta.countryId,'th');assert.equal(meta.operationalStatus,'OPERATIONAL');assert(operators.has(meta.operatorId));assert(!ids.has(meta.id));ids.add(meta.id);
 const payload=JSON.parse(fs.readFileSync(meta.lazySource)),plain=zlib.gunzipSync(Buffer.from(payload.data,'base64'));assert.equal(crypto.createHash('sha256').update(plain).digest('hex'),payload.sha256);
 const route=JSON.parse(plain).route;assert.equal(route.id,meta.id);assert.equal(route.patterns.length,meta.serviceCount);assert.equal(route.geometrySource.straightLineFallback,false);
 const choices=context.thTest.thailandOperatingChoices(route);assert.equal(choices.length,route.patterns.length);
 for(const choice of choices){assert(!ids.has(choice.id));ids.add(choice.id);const selected=context.thTest.resolveThailandChoice(choice,route),resolved=context.thTest.resolvePlayableRoute(selected.route,{service:selected.service});
  assert.equal(resolved.stations.length,selected.service.stops.length);assert.equal(resolved.stations[0].id,choice.originId);assert.equal(resolved.stations.at(-1).id,choice.destinationId);
  let prior=-1;const visits=new Set();for(const s of resolved.stations){assert(/[가-힣]/.test(s.ko),s.id);assert(s.th&&/[\u0e00-\u0e7f]/.test(s.th),s.id);assert(s.geometryIndex>prior,s.id);prior=s.geometryIndex;assert(!visits.has(s.id),'중복 방문 식별자');visits.add(s.id);const old=stationNames.get(s.station_id);if(old)assert.equal(old,s.ko,'공통 역명 불일치');stationNames.set(s.station_id,s.ko);report.stops++;}
  for(const segment of resolved.segments)assert(!segment.endpointMismatch,'역·선로 접속 불일치');
  assert.equal(resolved.geometry.length>1,true);report.patterns++;
 }
 if(route.id==='th-bem-blue'){const p=route.patterns[0],tha=p.stations.filter(s=>s.stationCode==='BL01');assert.equal(tha.length,2);assert.equal(tha[0].station_id,tha[1].station_id);assert.notEqual(tha[0].id,tha[1].id);assert.equal(p.stations.length,39);}
 if(route.id==='th-nbm-pink'){assert.equal(route.patterns.filter(p=>p.branch).length,2);const main=route.patterns[0].stations.find(s=>s.stationCode==='PK10'),branch=route.patterns.find(p=>p.branch).stations[0];assert.equal(main.station_id,branch.station_id);assert.notDeepEqual([main.latitude,main.longitude],[branch.latitude,branch.longitude]);}
 if(route.id==='th-bts-sukhumvit'){const s=route.patterns[0].stations;assert.equal(s.length,47);assert(s.some(s=>s.stationCode==='N8'));assert(!s.some(s=>s.stationCode==='N6'));assert(route.stations.find(s=>s.stationCode==='N8').transfers.includes('th-bem-blue'));}
 if(route.id==='th-srt-sawankhalok')assert(route.patterns.every(p=>p.stations.some(s=>s.sourceStationId==='1143')),'표의 빈칸을 지선 경유로 분류하면 안 됨');
 if(route.id==='th-srt-maeklong-east'){const current=route.patterns.find(p=>p.trainNumbers.includes('9347'));if(current){assert.equal(current.stations.find(s=>s.th==='วุฒากาศ').station_id,'th-srt-5036');assert.equal(current.stations.find(s=>s.th==='นิคมรถไฟมหาชัย').station_id,'th-srt-5037')}}
 report.routes++;
}catch(e){report.status='FAIL';report.failures.push({route:meta.id,error:e.stack})}
assert.equal(fs.readdirSync('data/th/generated/routes').filter(f=>f.endsWith('.json')).length,index.routes.length,'미공개 잔여 노선 파일');
fs.mkdirSync('reports/thailand',{recursive:true});fs.writeFileSync('reports/thailand/static-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
