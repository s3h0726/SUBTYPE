#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../data/kr/canonical'),dir=path.join(root,'regional-busan-source');fs.mkdirSync(dir,{recursive:true});
const base='http://bus.busan.go.kr/busanBIMS/',manifestFile=path.join(dir,'manifest.json'),manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile)):{};
function parse(t,tag){return [...t.matchAll(new RegExp('<'+tag+'\\s+([^>]+)/>','g'))].map(m=>Object.fromEntries([...m[1].matchAll(/(\w+)=["']([^"']*)["']/g)].map(m=>[m[1],m[2]])))}
async function get(rel,file){const target=path.join(dir,file);if(fs.existsSync(target))return fs.readFileSync(target,'utf8');const url=base+rel,r=await fetch(url,{signal:AbortSignal.timeout(22000),headers:{'User-Agent':'SUBTYPE/1.0 (+https://github.com/s3h0726/SUBTYPE)'}});const b=Buffer.from(await r.arrayBuffer()),t=new TextDecoder('euc-kr').decode(b);if(!r.ok)throw Error('HTTP '+r.status+' '+rel);fs.writeFileSync(target,t);manifest[file]={url,sourceDate:'2026-11-01',retrievedAt:new Date().toISOString(),license:'부산광역시 공공데이터 이용 조건 확인 필요',sha256:crypto.createHash('sha256').update(t).digest('hex')};fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));return t}
(async()=>{
 const inventory=await get('bus_map/BLineTypeList.asp?btype=G','inventory.xml'),rows=parse(inventory,'lineno'),failures=[],ok=[];let next=0;
 async function worker(){while(next<rows.length){const row=rows[next++],key=row.val1;try{const shape=await get('Ajax/busLineCoordList.asp?busLineid='+encodeURIComponent(key),'shape-'+key+'.xml'),coords=parse(shape,'coord'),id=coords[0]?.value1;if(!/^\d+$/.test(id)||coords.length<3)throw Error('도로 경로 미확보');const detail=await get('Ajax/busLineList.asp?optBusNum='+id,'detail-'+key+'.xml'),stops=parse(detail,'line');if(stops.length<4||!stops[0].text1)throw Error('정차 목록 미확보');await get('Ajax/busCoInfo2.asp?optCoID='+id,'operator-'+key+'.xml');ok.push({key,number:row.val2,id,coords:coords.length-1,stops:stops.length-2});console.log(key,'수집',coords.length-1,stops.length-2)}catch(error){failures.push({key,error:error.message});console.log(key,'실패',error.message)}}}
 await Promise.all([worker(),worker(),worker()]);
 fs.writeFileSync(path.join(root,'regional-busan-fetch-report.json'),JSON.stringify({schemaVersion:2,checkedAt:'2026-11-01',inventory:rows.length,collected:ok.length,ok,failures},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
module.exports={parse};
