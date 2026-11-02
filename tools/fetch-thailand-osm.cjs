'use strict';
// 단절된 매끌롱 철도와 국경 구간을 독립적인 OSM 선로 그래프로 수집한다.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/th/source');
const queries={maeklong:'(13.35,99.9,13.76,100.51)',laos:'(17.84,102.55,18.05,102.85)',cambodia:'(13.58,102.45,13.8,102.65)',saiyok:'(14.15,98.98,14.27,99.13)'};
(async()=>{for(const[key,bbox]of Object.entries(queries)){
 const file=path.join(dir,'osm-'+key+'.json');if(fs.existsSync(file)&&!process.argv.includes('--refresh'))continue;
 const query=`[out:json][timeout:100];(way[railway=rail]${bbox};node[railway~"^(station|halt|stop)$"]${bbox};);out body;>;out skel qt;`;
 for(const endpoint of ['https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass.private.coffee/api/interpreter'])try{
  const r=await fetch(endpoint+'?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(125000)});if(!r.ok)throw Error('HTTP '+r.status);const text=await r.text(),data=JSON.parse(text);if(data.remark)throw Error(data.remark);fs.writeFileSync(file,text);fs.writeFileSync(file+'.provenance.json',JSON.stringify({endpoint,query,attribution:'© OpenStreetMap contributors',license:'ODbL-1.0',retrievedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(text).digest('hex')}));console.log('선로 수집 완료: '+key+' '+data.elements.length);break;
 }catch(e){console.error('선로 수집 보류: '+key+' '+e.message)}
}})();
