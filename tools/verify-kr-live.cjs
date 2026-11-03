'use strict';
// 실제 Pages 산출물의 바이트와 카탈로그를 로컬 검증본에 대조한다.
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {decode}=require('./lib/kr-payload.cjs'),root='https://s3h0726.github.io/SUBTYPE/';
const sha=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function get(file){const url=new URL(file,root);url.searchParams.set('kr-release',sha);const response=await fetch(url,{signal:AbortSignal.timeout(60000),headers:{'Cache-Control':'no-cache'}});if(!response.ok)throw Error(file+' HTTP '+response.status);return Buffer.from(await response.arrayBuffer());}
(async()=>{
 const files=['data/kr/generated/index.json','js/korea-index-data.js','js/app.bundle.js'],assets=[];let index;
 for(const file of files){const remote=await get(file),local=fs.readFileSync(file);assert.equal(hash(remote),hash(local),'공개 파일 버전 불일치: '+file);assets.push({file,bytes:remote.length,sha256:hash(remote),matched:true});if(file===files[0])index=JSON.parse(remote);}
 const selected=[];for(const prefix of ['kr-bus-incheon-','kr-bus-daegu-','kr-bus-gwangju-','kr-bus-daejeon-','kr-bus-ulsan-','kr-bus-sejong-','kr-bus-jeju-','kr-bus-busan-','kr-rail-','kr-river-']){const route=index.routes.find(r=>r.id.startsWith(prefix));if(route)selected.push(route);}
 for(const mode of ['rail','high_speed_rail','river_bus']){const route=index.routes.find(r=>r.mode===mode);if(route&&!selected.some(r=>r.id===route.id))selected.push(route);}
 const samples=[];for(const meta of selected){const bytes=await get(meta.lazySource),local=fs.readFileSync(meta.lazySource);assert.equal(hash(bytes),hash(local),meta.id+' 공개 지연 로딩 파일 불일치');const route=decode(JSON.parse(bytes)).route;assert.equal(route.id,meta.id);assert(route.verifiedJourneys.length);samples.push({id:route.id,name:route.line.ko,directions:route.verifiedJourneys.length,bytes:bytes.length,matched:true});}
 const report={verifiedAt:new Date().toISOString(),commit:sha,url:root,passed:true,routes:index.routes.length,registeredDirections:index.counts.playableDirections,stopIds:index.counts.uniqueStops,assets,samples,scope:'공개 HTTP 산출물 바이트 및 표본 지연 로딩 확인. 전체 브라우저 완주 검사와 별개.'};
 fs.writeFileSync('reports/kr-rebuild/20261103-공개-산출물.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
