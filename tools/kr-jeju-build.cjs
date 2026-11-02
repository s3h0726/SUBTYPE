'use strict';
// 제주 공식 업체별 노선 배정표와 계통별 정류장·도로 원본을 결합한다.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const model=require('./lib/kr-city-model.cjs'),base=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(base,'jeju-source');
const html=fs.readFileSync(path.join(base,'national-source/jeju-schedule.html'),'utf8'),table=html.match(/<table[^>]*summary="운수업체별 버스노선 현황"[\s\S]*?<\/table>/)[0];
const allocations=new Map,spans=[];
for(const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)(?=<tr\b|<\/tbody>|<\/table>)/g)){
 const cells=[],next=[];for(let i=0;i<spans.length;i++)if(spans[i]?.left){cells[i]=spans[i].text;if(spans[i].left>1)next[i]={text:spans[i].text,left:spans[i].left-1};}
 for(const cell of row[1].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)){let col=0;while(cells[col]!==undefined)col++;const value=cell[2].replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim();cells[col]=value;const count=Number(cell[1].match(/rowspan="(\d+)"/)?.[1]||1);if(count>1)next[col]={text:value,left:count-1};}
 spans.length=0;spans.push(...next);if(!cells.length)continue;
 const company=cells[0]?.split('\n')[0];if(!company||!/여객|교통|운수|공영버스/.test(company)||/수요응답형/.test(company))continue;
 for(const col of [1,3])for(const match of (cells[col]||'').matchAll(/(?<![0-9])[0-9]{2,4}(?:-[0-9]+)?(?![0-9])/g)){const n=match[0];if(!allocations.has(n))allocations.set(n,new Set);allocations.get(n).add(company);}
}
const inventory=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'),'utf8').replace(/^\uFEFF/,'')),families=new Map,outcomes=[];
const read=(id,k)=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,id+'-'+k+'.json.gz'))));
for(const meta of inventory){const id=String(meta.routeId);try{
 const info=read(id,'info'),originalCalls=info.stationInfoList,shape=read(id,'shape');
 const calls=originalCalls?.filter(s=>!s.stationNm.includes('가상')); 
 if(/가상/.test(info.routeNm)||info.useYn==='N'){outcomes.push({id,status:'INACTIVE',reason:'공식 가상 또는 비운영 계통'});continue;}
 if(!calls||calls.length<2)throw Error('정류장 순서 미확인');
 const number=String(info.routeNum),companies=allocations.get(number);if(!companies)throw Error('공식 운영사 배정 미확인: '+number);
 if((!info.orgtNm?.includes('가상')&&String(originalCalls[0].stationId)!==String(info.orgtStationId))||(!info.dstNm?.includes('가상')&&String(originalCalls.at(-1).stationId)!==String(info.dstStationId)))throw Error('공식 기종점과 정류장 순서 불일치');
 const categories={'급행':['express_bus','급행버스','express_bus'],'일반간선':['city_bus','일반간선버스','bus'],'시내간선':['city_bus','시내간선버스','bus'],'시내지선':['city_bus','시내지선버스','bus'],'읍면지선':['rural_bus','읍면지선버스','bus'],'마을':['village_bus','마을버스','village_bus'],'공항':['other_bus','공항버스','express_bus'],'간선':['city_bus','간선버스','bus'],'지선':['city_bus','지선버스','bus'],'리무진':['other_bus','공항리무진버스','express_bus'],'심야':['city_bus','심야버스','bus']},category=categories[info.busTypeStr];if(!category)throw Error('공식 분류 미확인: '+info.busTypeStr);
 const trip=model.journey('jeju','kr-jeju-'+id,info.routeSubNm,calls.map(s=>({id:s.stationId,name:s.stationNm,lat:s.localY,lon:s.localX,sequence:s.linkOrd})),shape.map(p=>[Number(p.localY),Number(p.localX)]),{sourcePatternId:id,directionId:info.upDnDir||id});
 // 공식 노선번호를 카드 기준으로 사용한다. 세부 계통 번호는 서비스에 남긴다.
 const key=number;if(!families.has(key))families.set(key,{companies:new Set,category,patterns:[],ids:[],sources:[]});const group=families.get(key);for(const c of companies)group.companies.add(c);group.patterns.push(trip);group.ids.push(id);
 for(const k of ['info','shape']){const s=JSON.parse(fs.readFileSync(path.join(dir,id+'-'+k+'.json.gz.source.json'),'utf8').replace(/^\uFEFF/,''));group.sources.push({...s,license:'제주 버스정보시스템 공개 운행 사실정보; 제주특별자치도 공공데이터 이용 조건',attribution:'제주특별자치도 버스정보시스템'});}
 outcomes.push({id,status:'PUBLISHED',directions:1});
 }catch(e){outcomes.push({id,status:/운영사/.test(e.message)?'OPERATOR_UNRESOLVED':/정류장|기종점/.test(e.message)?'STOP_SEQUENCE_UNRESOLVED':/ENOENT/.test(e.message)?'INSUFFICIENT_SOURCE':/분류/.test(e.message)?'OTHER_BLOCKED':'GEOMETRY_UNRESOLVED',reason:e.message});}}
const routes=[];for(const[number,g]of families){const operator=[...g.companies].sort().join(' · ');try{routes.push(model.route({prefix:'jeju',id:number,regionId:'jeju',regionKo:'제주특별자치도',name:'제주 '+number+'번',operator,operatorKey:crypto.createHash('sha256').update(operator).digest('hex').slice(0,14),journeys:g.patterns,category:g.category[0],categoryKo:g.category[1],mode:g.category[2],sources:[...g.sources,{url:'https://bus.jeju.go.kr/publicTrafficInformation/generalBusSchedule',retrievedAt:new Date(fs.statSync(path.join(base,'national-source/jeju-schedule.html')).mtimeMs).toISOString(),license:'제주특별자치도 공개 운수업체별 버스노선 현황',attribution:'제주특별자치도'}],sourceRouteIds:g.ids,extra:{routeNumber:number}}));}catch(e){for(const id of g.ids){const o=outcomes.find(o=>o.id===id);o.status='OTHER_BLOCKED';o.reason=e.message;}}}
const report={checkedAt:new Date().toISOString(),inventory:inventory.length,routes:routes.length,directions:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),operatorAllocations:Object.fromEntries([...allocations].map(([n,c])=>[n,[...c]])),outcomes};
fs.writeFileSync(path.join(base,'jeju-batch.json'),JSON.stringify({schemaVersion:2,generatedBy:'tools/kr-jeju-build.cjs',routes})+'\n');fs.writeFileSync(path.join(base,'jeju-report.json'),JSON.stringify(report,null,2)+'\n');console.log({inventory:inventory.length,routes:report.routes,directions:report.directions,remaining:outcomes.filter(o=>o.status!=='PUBLISHED').length});
