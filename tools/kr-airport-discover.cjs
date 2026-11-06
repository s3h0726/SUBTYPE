'use strict';
// 공식 공항 페이지의 노선 목록만 수집한다. 시간표·배차 시각은 검사하지 않는다.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const dir='data/kr/canonical/airport-source';fs.mkdirSync(dir,{recursive:true});
const url='https://www.airport.kr/bus/ap_ko/busRouteList.do',routes=new Map,failures=[],sources=[];
(async()=>{for(const [region,regionKo] of [[1,'서울'],[2,'경기'],[3,'인천'],[4,'강원'],[5,'충청'],[6,'경상'],[7,'전라']]){
 const file=path.join(dir,'incheon-inventory-'+region+'.html.gz');let html;
 try{if(fs.existsSync(file))html=zlib.gunzipSync(fs.readFileSync(file)).toString();else{const r=await fetch(url,{method:'POST',body:new URLSearchParams({routeArea:String(region),siteId:'ap_ko',searchVal:''}),signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);html=await r.text();fs.writeFileSync(file,zlib.gzipSync(html));}
 let count=0;for(const m of html.matchAll(/data-id="(\d+)"[^>]*>\s*([^<]+)<\/a>/g)){const id=m[1],label=m[2].trim();routes.set(id,{sourceRouteId:id,label,regionKo,airportId:'incheon',sourceUrl:url,status:'BLOCKED_MISSING_DATA',reason:'공식 공항 노선 목록 확보. 방향별 정차 ID·좌표·도로 선형 대조 필요'});count++;}
 if(!count)throw Error('공식 목록 형식 또는 지역 조회 결과 변경');sources.push({url,region,regionKo,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sourceDate:'2026-11-05',license:'인천국제공항공사 공개 노선 사실 정보; 제공기관 이용조건'});console.log(regionKo,count);
 }catch(e){failures.push({region,regionKo,reason:e.message});}}
 fs.writeFileSync('data/kr/canonical/airport-incheon-inventory.json',JSON.stringify({checkedAt:new Date().toISOString(),routes:[...routes.values()],sources,failures},null,2)+'\n');console.log({routes:routes.size,failures:failures.length});})().catch(e=>{console.error(e);process.exitCode=1});
