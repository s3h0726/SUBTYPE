#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/kr/canonical'),file=path.join(dir,'river-osm-terminals.json');
if(fs.existsSync(file)&&!process.argv.includes('--refresh')){console.log('보관된 한강버스 OSM 원본 사용');process.exit(0)}
const query='[out:json][timeout:50];(way[route=ferry](37.45,126.78,37.62,127.15);nwr[amenity=ferry_terminal](37.45,126.78,37.62,127.15););out geom;';
(async()=>{
 const url='https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query);
 const response=await fetch(url,{headers:{'User-Agent':'SUBTYPE/1.0 (+https://github.com/s3h0726/SUBTYPE)'},signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error('OSM HTTP '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer()),data=JSON.parse(bytes);
 if(data.remark||!data.elements?.some(e=>e.tags?.route==='ferry'))throw Error(data.remark||'운항 경로 없음; 기존 원본 보존');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,bytes);
 fs.writeFileSync(path.join(dir,'river-fetch-report.json'),JSON.stringify({url,query,retrievedAt:new Date().toISOString(),sourceDate:data.osm3s.timestamp_osm_base,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),elements:data.elements.length},null,2)+'\n');
 console.log('한강버스 수상 경로·선착장 원본 저장: '+data.elements.length);
})().catch(error=>{console.error(error.message);process.exitCode=1});
