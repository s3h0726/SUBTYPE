'use strict';
// Official TOPIS map endpoints; no private keys, accounts, or browser scraping.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/kr/canonical/bus-source/topis');
fs.mkdirSync(dir,{recursive:true});
const candidates=JSON.parse(fs.readFileSync(path.join(root,'data/kr/canonical/bus-candidates.json'),'utf8')).routes.filter(r=>r.regionId==='seoul');
const errors=[];let index=0,done=0;
async function fetchOne(id,kind){
 const file=path.join(dir,`${id}-${kind}.json.gz`);if(fs.existsSync(file))return;
 const endpoint=kind==='geometry'?'selectBusLineList.do':'selectBusLineStnXMLList.do';
 const body=new URLSearchParams({routId:id,...kind==='stops'?{url:'/getBusPosByRtidDetourAt',url2:'/getStaionByRoute'}:{}});
 for(let attempt=0;attempt<3;attempt++)try{
  const response=await fetch(`https://topis.seoul.go.kr/map/busMap/${endpoint}`,{method:'POST',body,headers:{'User-Agent':'SUBTYPE/2.0 (+https://github.com/s3h0726/SUBTYPE)'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const data=await response.json();if(!Array.isArray(data.rows)||!data.rows.length)throw Error('empty official response');
  fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(data)));return;
 }catch(error){if(attempt===2)errors.push({id,kind,error:String(error)});}
}
async function worker(){while(index<candidates.length){const route=candidates[index++];await fetchOne(route.sourceRouteId,'geometry');await fetchOne(route.sourceRouteId,'stops');done++;if(done%50===0)console.log(`${done}/${candidates.length}`)}}
Promise.all(Array.from({length:6},worker)).then(()=>{fs.writeFileSync(path.join(root,'data/kr/canonical/bus-topis-fetch-report.json'),JSON.stringify({checkedAt:'2026-10-30',routes:candidates.length,completed:done,failures:errors},null,2)+'\n');console.log(JSON.stringify({completed:done,failures:errors.length}));});
