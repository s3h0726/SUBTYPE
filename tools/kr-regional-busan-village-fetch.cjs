#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/kr/canonical/regional-busan-source'),base='http://bus.busan.go.kr/busanBIMS/';
const decoder=new TextDecoder('euc-kr'),table=new Map;
for(let a=0x81;a<=0xfe;a++)for(let b=0x41;b<=0xfe;b++){const c=decoder.decode(Uint8Array.of(a,b));if(c.length===1&&!c.includes('\ufffd'))table.set(c,'%'+a.toString(16)+'%'+b.toString(16))}
const encode=s=>[...s].map(c=>c.charCodeAt(0)<128?encodeURIComponent(c):table.get(c)||(()=>{throw Error('인코딩 불가: '+c)})()).join('');
const districts=['강서구','금정구','기장군','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구'];
const manifestFile=path.join(dir,'manifest.json'),manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile)):{};
const parse=(t,tag)=>[...t.matchAll(new RegExp('<'+tag+'\\s+([^>]+)/>','g'))].map(m=>Object.fromEntries([...m[1].matchAll(/(\w+)=["']([^"']*)["']/g)].map(m=>[m[1],m[2]])));
async function get(rel,file){const target=path.join(dir,file);if(fs.existsSync(target))return fs.readFileSync(target,'utf8');const url=base+rel,r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);const t=decoder.decode(await r.arrayBuffer());fs.writeFileSync(target,t);manifest[file]={url,sourceDate:'2026-11-01',retrievedAt:new Date().toISOString(),license:'부산광역시 공개 버스정보; 사실정보 추출',sha256:crypto.createHash('sha256').update(t).digest('hex')};fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));return t}
(async()=>{
 const inventory=new Map,failures=[],ok=[];
 for(const district of districts){try{const t=await get('bus_map/frm_busRoute.asp?key='+encode(district),'search-'+district+'.html');for(const m of t.matchAll(/value="(\d+)_([^"]+)"/g))if(m[2].includes(district))inventory.set(m[1],{id:m[1],val1:m[2],val2:m[2],district});console.log(district,inventory.size)}catch(e){failures.push({district,error:e.message})}}
 const rows=[...inventory.values()];fs.writeFileSync(path.join(dir,'inventory-village.xml'),'<BUSLINENO>'+rows.map(r=>'<lineno val1="'+r.val1+'" val2="'+r.val2+'"/>').join('\n')+'</BUSLINENO>');let next=0;
 async function worker(){while(next<rows.length){const row=rows[next++],key=row.val1;try{const shape=await get('Ajax/busLineCoordList.asp?busLineid='+encode(key),'shape-'+key+'.xml'),coords=parse(shape,'coord'),id=coords[0]?.value1;if(id!==row.id||coords.length<3)throw Error('실제 도로 경로 미확보');await get('Ajax/busLineList.asp?optBusNum='+id,'detail-'+key+'.xml');await get('Ajax/busCoInfo2.asp?optCoID='+id,'operator-'+key+'.xml');ok.push(row);console.log(key,'수집',coords.length-1)}catch(e){failures.push({key,error:e.message})}}}
 await Promise.all([worker(),worker(),worker()]);fs.writeFileSync(path.resolve(dir,'../regional-busan-village-fetch-report.json'),JSON.stringify({schemaVersion:2,checkedAt:'2026-11-01',inventory:rows.length,collected:ok.length,failures},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
