'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/kr/canonical/provincial-gbis-source');
fs.mkdirSync(dir,{recursive:true});
const endpoint='https://www.gbis.go.kr/gbis2014/schBusAPI.action';
const errors=[];let requests=0;
async function request(body,file){
 const target=path.join(dir,file+'.json.gz');
 if(fs.existsSync(target))return JSON.parse(zlib.gunzipSync(fs.readFileSync(target)));
 for(let attempt=0;attempt<3;attempt++)try{
  const r=await fetch(endpoint,{method:'POST',body:new URLSearchParams(body),signal:AbortSignal.timeout(45000),headers:{'User-Agent':'SUBTYPE/2.0 (+https://github.com/s3h0726/SUBTYPE)'}});
  if(!r.ok)throw Error(`HTTP ${r.status}`);const data=await r.json();
  if(!data.success)throw Error(JSON.stringify(data.result));
  fs.writeFileSync(target,zlib.gzipSync(JSON.stringify(data)));requests++;return data;
 }catch(error){if(attempt===2){errors.push({body,error:String(error)});return null;}}
}
async function main(){
 const inventory=new Map;
 for(const keyword of ['0','1','2','3','4','5','6','7','8','9','M','G','P','A','B','C','H','N']){
  let page=1,total=1;
  do{
   const r=await request({cmd:'searchAllJson',searchKeyword:keyword,pageOfRoute:String(page),pageOfBus:'1',pageOfSubway:'1',pageOfPOI:'1',searchGubun:'route',routeNameType:/^\d$/.test(keyword)?'number':'string'},`inventory-${keyword}-${page}`);
   const data=r?.result?.busRoute;
   if(!data)break;
   total=Math.ceil(Number(data.totalCount||0)/10);
   for(const route of data.list||[])inventory.set(route.routeId,route);
   page++;
  }while(page<=total);
  console.log(`inventory ${keyword}: ${inventory.size}`);
 }
 const routes=[...inventory.values()].sort((a,b)=>a.routeId.localeCompare(b.routeId));
 fs.writeFileSync(path.join(root,'data/kr/canonical/provincial-gbis-inventory.json'),JSON.stringify({sourceUrl:endpoint,checkedAt:'2026-11-01',routes}));
 let next=0,done=0;
 async function worker(){while(next<routes.length){const route=routes[next++];await request({cmd:'searchMapLineJson',routeId:route.routeId},route.routeId+'-geometry');await request({cmd:'searchRouteJson',routeId:route.routeId},route.routeId+'-detail');done++;if(done%100===0)console.log(`${done}/${routes.length}`)}}
 await Promise.all(Array.from({length:6},worker));
 fs.writeFileSync(path.join(root,'data/kr/canonical/provincial-gbis-fetch-report.json'),JSON.stringify({checkedAt:'2026-11-01',inventoryRoutes:routes.length,requests,failures:errors},null,2));
 console.log(JSON.stringify({routes:routes.length,requests,failures:errors.length}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
