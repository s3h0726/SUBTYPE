#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const base='https://s3h0726.github.io/SUBTYPE/';
(async()=>{
 const read=async file=>{const response=await fetch(new URL(file+'?krcheck='+Date.now(),base));if(!response.ok)throw Error(file+': '+response.status);return response.text()};
 const [html,raw,bundle]=await Promise.all(['index.html','data/kr/generated/index.json','js/app.bundle.js'].map(read));
 const index=JSON.parse(raw),local=JSON.parse(fs.readFileSync('data/kr/generated/index.json','utf8'));
 const sampleIds=['kr-bus-seoul-100100022','kr-bus-seoul-103900013','kr-bus-gbis-204000183','kr-bus-busan-2100051033','kr-bus-busan-2100093313','kr-hangang-west','kr-rail-gyoe','kr-rail-highspeed-honam','kr-rail-expansion-gyeongbu-conventional','kr-rail-expansion-gyeongbu-highspeed'];
 const samples=await Promise.all(sampleIds.map(async id=>{const meta=index.routes.find(r=>r.id===id);if(!meta)throw Error('배포 노선 누락: '+id);const payload=JSON.parse(await read(meta.lazySource));return{id,services:payload.route.verifiedJourneys.length,geometryPoints:payload.route.geometry.length}}));
 const hash=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
 const result={checkedAt:new Date().toISOString(),url:base,publicRoutes:index.routes.length,directions:index.counts.playableDirections,canonicalContract:index.canonicalContract,localIndexMatches:hash(raw)===hash(fs.readFileSync('data/kr/generated/index.json','utf8')),bundleMatches:hash(bundle)===hash(fs.readFileSync('js/app.bundle.js','utf8')),koreaResetDisabled:bundle.includes('koreaRoutesReset:false'),samples,htmlReferences:html.match(/(?:app\.bundle|korea-index-data)\.js\?v=[^"']+/g)};
 result.passed=result.localIndexMatches&&result.bundleMatches&&result.koreaResetDisabled&&index.routes.length===local.routes.length;
 fs.mkdirSync('reports/kr-rebuild',{recursive:true});fs.writeFileSync('reports/kr-rebuild/deployment-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
})().catch(error=>{console.error(error.message);process.exitCode=1});
