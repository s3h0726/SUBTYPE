#!/usr/bin/env node
'use strict';
// Direct OSM read API fallback when public Overpass workers are saturated.
// Small existing road-map windows discover intersecting relations; relation
// /full retains ALL members beyond the map window. Never route through gaps.
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../data/kr/canonical'),headers={'User-Agent':'SUBTYPE/1.0 (+https://github.com/s3h0726/SUBTYPE)'};
const regions=[['busan',129.057,35.156],['daegu',128.591,35.867],['daejeon',127.424,36.329],['gwangju',126.91,35.151],['ulsan',129.338,35.538],['sejong',127.266,36.48],['jeju',126.518,33.499]];
const failures=[],inventory=new Map,requests=[];
async function get(url,file){if(fs.existsSync(file)&&!process.argv.includes('--refresh'))return JSON.parse(fs.readFileSync(file));const r=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();fs.writeFileSync(file,JSON.stringify(data));requests.push({url,file:path.basename(file),retrievedAt:new Date().toISOString(),license:'ODbL-1.0'});return data}
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 for(const [region,x,y] of regions){try{const url='https://api.openstreetmap.org/api/0.6/map.json?bbox='+[x,y,x+.005,y+.005].join(',');const data=await get(url,path.join(dir,'bus-osm-'+region+'-map.json'));let count=0;for(const r of data.elements.filter(e=>e.type==='relation'&&e.tags?.route==='bus')){inventory.set(r.id,{...r,region});count++}console.log(region,count)}catch(e){failures.push({region,error:e.message})}}
 fs.writeFileSync(path.join(dir,'bus-osm-regional-inventory.json'),JSON.stringify({schemaVersion:2,relations:[...inventory.values()]},null,2)+'\n');
 for(const r of inventory.values()){try{await get('https://api.openstreetmap.org/api/0.6/relation/'+r.id+'/full.json',path.join(dir,'bus-osm-relation-'+r.id+'.json'));console.log(r.region,r.id,'수집')}catch(e){failures.push({region:r.region,relationId:r.id,error:e.message})}}
 fs.writeFileSync(path.join(dir,'bus-osm-fetch-report.json'),JSON.stringify({schemaVersion:2,checkedAt:'2026-10-31',relationCount:inventory.size,requests,failures,attribution:'© OpenStreetMap contributors',license:'ODbL-1.0'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
