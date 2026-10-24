const fs=require('node:fs');
const text=fs.readFileSync('data/hk/sources/phase5/tram-map.js','utf8'),facts=[];
for(const match of text.matchAll(/\["[^\n]+?\]/g)){try{const a=JSON.parse(match[0].replace(/\\'/g,"'"));if(a.length>=6&&typeof a[4]==='number')facts.push({code:a[0],en:a[1].trim(),zh:a[2],lat:a[4],lng:a[5]})}catch{}}
const distance=(a,b)=>{const rad=x=>x*Math.PI/180,x=rad(a.lat-b.lat),y=rad(a.lng-b.lng),h=Math.sin(x/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(y/2)**2;return 12742000*Math.asin(Math.sqrt(h))};
const n=JSON.parse(fs.readFileSync('data/hk/master/network.json')),records=[];
for(const s of n.stations.filter(s=>s.id.startsWith('hk-tram-stop-'))){const p=s.coordinates,near=facts.map(f=>({...f,meters:distance(p,f)})).sort((a,b)=>a.meters-b.meters);records.push({id:s.id,osmCode:s.code,en:s.nameEn,zh:s.nameZhHant,coordinates:p,nearest:near.slice(0,3),officialMatches:facts.filter(f=>f.en===s.nameEn)});if(!s.officialIdentitySource)console.log(JSON.stringify(records.at(-1)))}
fs.mkdirSync('reports/hong-kong/phase5',{recursive:true});fs.writeFileSync('reports/hong-kong/phase5/tram-stop-investigation.json',JSON.stringify({checkedAt:'2026-10-24',officialCoordinateFacts:facts,records},null,2)+'\n');
