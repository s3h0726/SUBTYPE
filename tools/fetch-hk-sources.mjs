import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const dir=path.join(root,'data/hk/sources');fs.mkdirSync(dir,{recursive:true});
const items=[
 ['tourism-ko.pdf','https://www.discoverhongkong.com/content/dam/dhk/market-site/kr/e-guidebooks/Magic_Lamp_Plus_KR.pdf'],
 ['disney-travel-ko.html','https://www.hongkongdisneyland.com/ko/guest-services/travel-information/'],
 ['mtr-stations.csv','https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv'],
 ['mtr-system-en.html','https://www.mtr.com.hk/en/customer/services/system_map.html'],
 ['mtr-system-zh.html','https://www.mtr.com.hk/ch/customer/services/system_map.html'],
 ['light-rail.html','https://www.mtr.com.hk/en/customer/services/schedule_index.html'],
 ['light-rail-services.html','https://www.mtr.com.hk/en/customer/services/lt_bus_index.html'],
 ['tram-services.html','https://www.hktramways.com/en/schedules-fares/'],
 ['peak-faq.html','https://www.thepeak.com.hk/en/faq'],
 ['hsr-destinations.html','https://www.highspeed.mtr.com.hk/en/guide/destination.html'],
 ['osm-relations.json',(process.env.HK_OVERPASS_ENDPOINT||'https://overpass.private.coffee/api/interpreter')+'?data='+encodeURIComponent('[out:json][timeout:90];relation[route~"^(subway|train|light_rail|tram|funicular)$"](22.15,113.8,22.57,114.45);out body;')]
];
const manifest=fs.existsSync(path.join(dir,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')):{};
for(const [file,url] of items){
 if(fs.existsSync(path.join(dir,file))&&!process.argv.includes('--refresh')){console.log('cached',file);continue;}
 try{const response=await fetch(url,{signal:AbortSignal.timeout(150000),headers:{'User-Agent':'SUBTYPE-HK-research/1.0'}});if(!response.ok)throw Error('HTTP '+response.status);const bytes=Buffer.from(await response.arrayBuffer());fs.writeFileSync(path.join(dir,file),bytes);manifest[file]={sourceUrl:url,checkedAt:'2026-10-18',retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),license:file.startsWith('osm-')?'ODbL-1.0':'REVIEW_REQUIRED',sourceType:file.startsWith('osm-')?'osm':'official',status:'retrieved'};console.log('saved',file,bytes.length)}catch(error){manifest[file]={sourceUrl:url,status:'INCOMPLETE',reason:error.message};console.error(file,error.message)}
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
