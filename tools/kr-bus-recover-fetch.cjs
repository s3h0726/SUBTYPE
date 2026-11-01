#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/kr/canonical/bus-recovered-source');fs.mkdirSync(dir,{recursive:true});
const candidates=JSON.parse(fs.readFileSync(path.join(root,'data/kr/canonical/bus-topis-report.json'),'utf8')).failures;
let cursor=0,done=0;const failures=[],requests=[];
async function fetchOne(id,kind){
 const file=path.join(dir,id+'-'+kind+'.json.gz');if(fs.existsSync(file)&&!process.argv.includes('--refresh'))return;
 const endpoint=kind==='geometry'?'selectBusLineList.do':'selectBusLineStnXMLList.do',url='https://topis.seoul.go.kr/map/busMap/'+endpoint;
 for(let attempt=0;attempt<2;attempt++)try{
  const body=new URLSearchParams({routId:id,...kind==='stops'?{url:'/getBusPosByRtidDetourAt',url2:'/getStaionByRoute'}:{}});
  const response=await fetch(url,{method:'POST',body,signal:AbortSignal.timeout(20000),headers:{'User-Agent':'SUBTYPE/3.0 (+https://github.com/s3h0726/SUBTYPE)'}});
  if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(!data.rows?.length)throw Error('EMPTY_OFFICIAL_RESPONSE');
  fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(data)));requests.push({id,kind,url,retrievedAt:new Date().toISOString()});return;
 }catch(error){if(attempt===1)failures.push({id,kind,error:error.message})}
}
async function worker(){while(cursor<candidates.length){const candidate=candidates[cursor++],id=candidate.routeId.replace('kr-bus-seoul-','');await fetchOne(id,'geometry');await fetchOne(id,'stops');done++;if(done%25===0)console.log(done+'/'+candidates.length)}}
Promise.all(Array.from({length:6},worker)).then(()=>{fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({checkedAt:'2026-11-01',candidates:candidates.length,requests,failures},null,2)+'\n');console.log(JSON.stringify({completed:done,failures:failures.length}))});
