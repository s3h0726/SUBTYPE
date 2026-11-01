'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/kr/canonical/tsbis-source');fs.mkdirSync(dir,{recursive:true});
const base='https://tsbis.kr',records=[],failures=[];
async function get(kind,id,url){const file=path.join(dir,kind+'-'+id+'.json.gz');if(fs.existsSync(file))return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));for(let attempt=0;attempt<3;attempt++)try{const r=await fetch(base+url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);const body=Buffer.from(await r.text()),data=JSON.parse(body);fs.writeFileSync(file,zlib.gzipSync(body));records.push({kind,id,url:base+url,retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(body).digest('hex')});return data}catch(e){if(attempt===2){failures.push({kind,id,url:base+url,error:e.message});return null}}}
async function workers(items,fn){let cursor=0;await Promise.all(Array.from({length:6},async()=>{while(cursor<items.length){const i=cursor++;await fn(items[i],i)}}));}
(async()=>{
 const first=await get('inventory',1,'/route/getRouteList.do?pageIndex=1&main_searchKeyword=&admin_id=');if(!first)throw Error('inventory unavailable');
 await workers(Array.from({length:first.paginationInfo.totalPageCount-1},(_,i)=>i+2),async page=>{await get('inventory',page,'/route/getRouteList.do?pageIndex='+page+'&main_searchKeyword=&admin_id=');if(page%100===0)console.log('inventory',page)});
 const map=new Map;for(let page=1;page<=first.paginationInfo.totalPageCount;page++){const d=await get('inventory',page,'/route/getRouteList.do?pageIndex='+page+'&main_searchKeyword=&admin_id=');for(const r of d?.list||[])map.set(r.route_id,r);}
 const inventory=[...map.values()];fs.writeFileSync(path.join(dir,'inventory.json'),JSON.stringify({retrievedAt:new Date().toISOString(),routes:inventory}));console.log('current official routes',inventory.length);
 await workers(inventory,async(r,i)=>{await get('stops',r.route_id,'/station/getRouteStation.do?route_id='+r.route_id);await get('shape',r.route_id,'/route/getWfsRoute.do?route_id='+r.route_id);await get('wfsstops',r.route_id,'/station/getWfsRouteStation.do?route_id='+r.route_id);if(i%200===0)console.log('routes',i,'/',inventory.length)});
 fs.writeFileSync(path.join(dir,'fetch-report.json'),JSON.stringify({checkedAt:new Date().toISOString(),inventoryRoutes:inventory.length,records,failures},null,2));console.log('finished',inventory.length,'failures',failures.length);
})();
