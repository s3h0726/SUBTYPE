#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const http=require('http');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const args=Object.fromEntries(process.argv.slice(2).flatMap((value,index,list)=>value.startsWith('--')?[[value.slice(2),list[index+1]]]:[]));
const line=String(args.line||''),artifacts=String(args.artifacts||'').split(',').filter(Boolean);
if(!line||!artifacts.length)throw new Error('Usage: node tools/fetch-seoul-open-data-line.js --line 5 --artifacts id,id');
const stationNames=[...new Set(artifacts.flatMap(id=>JSON.parse(fs.readFileSync(path.join(root,'data','kr','generated','routes',`${id}.json`),'utf8')).route.stations.map(station=>station.ko)))];
const endpoint=name=>`http://openapi.seoul.go.kr:8088/sample/json/StationDstncReqreTimeHm/1/5/${encodeURIComponent(line)}/${encodeURIComponent(name)}`;
function requestJson(url){return new Promise((resolve,reject)=>{http.get(url,{headers:{'User-Agent':'SUBTYPE-Korea-Rebuild/1.0'}},response=>{let body='';response.setEncoding('utf8');response.on('data',chunk=>{body+=chunk});response.on('end',()=>{if(response.statusCode!==200)return reject(new Error(`${response.statusCode} ${url}`));try{resolve(JSON.parse(body))}catch(error){reject(new Error(`Invalid JSON for ${url}: ${error.message}`))}})}).on('error',reject)})}
(async()=>{
  const rows=[];for(let index=0;index<stationNames.length;index+=6){const batch=stationNames.slice(index,index+6),results=await Promise.all(batch.map(async name=>{const payload=await requestJson(endpoint(name)),service=payload.StationDstncReqreTimeHm,matches=(service?.row||[]).filter(row=>String(row.SBWY_ROUT_LN)===line&&row.SBWY_STNS_NM===name);if(service?.RESULT?.CODE!=='INFO-000'||!matches.length)throw new Error(`${name}: official API lookup failed`);return matches}));rows.push(...results.flat())}
  const output={schemaVersion:1,retrievedAt:new Date().toISOString(),datasetAsOf:'2024-03-25',datasetName:'서울교통공사_역간거리',provider:'서울교통공사',portal:'서울 열린데이터광장',landingPage:'https://data.seoul.go.kr/dataList/OA-12034/S/1/datasetView.do',service:'StationDstncReqreTimeHm',query:{line,artifacts,stationNames},license:{id:'KOGL-Type-1',name:'공공누리 제1유형',attributionRequired:true,commercialUse:true,modificationAllowed:true},rows:rows.sort((a,b)=>Number(a.ACML_DIST)-Number(b.ACML_DIST)||a.SBWY_STNS_NM.localeCompare(b.SBWY_STNS_NM,'ko'))};
  const stable=JSON.stringify(output,null,2)+'\n';output.sha256=crypto.createHash('sha256').update(stable).digest('hex');
  const relative=`data/kr/source/seoul-open-data/line-${line}-interstation-2024-03-25.json`,target=path.join(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',target:relative,stations:stationNames.length,rows:rows.length,sha256:output.sha256},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
