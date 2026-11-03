'use strict';
// OSM 지도 API의 작은 사각형들을 순차 수집한다. 철도 관련 객체만 보존한다.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../data/th/source');
const tiles={
 'bangkok-gap':[100.54,13.82,100.56,13.84],
 'yommaraj-gap':[100.512,13.748,100.527,13.765],
 'maeklong-01':[100.463,13.695,100.505,13.735],
 'maeklong-02':[100.429,13.675,100.477,13.714],
 'maeklong-03':[100.397,13.647,100.445,13.689],
 'maeklong-04':[100.373,13.615,100.419,13.662],
 'maeklong-05':[100.34,13.587,100.387,13.633],
 'maeklong-06':[100.303,13.56,100.354,13.605],
 'maeklong-07':[100.26,13.535,100.315,13.578],
 'maeklong-08':[100.218,13.518,100.272,13.56],
 'maeklong-09':[100.175,13.49,100.23,13.54],
 'maeklong-10':[100.133,13.465,100.188,13.51],
 'maeklong-11':[100.09,13.44,100.146,13.49],
 'maeklong-12':[100.045,13.417,100.103,13.465],
 'maeklong-13':[99.985,13.393,100.059,13.439],
 'donmueang':[100.584,13.9,100.611,13.928]
};
const decode=s=>s.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attrs=t=>Object.fromEntries([...t.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
function parse(xml){const nodes=[],ways=[];for(const m of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)){const a=attrs(m[1]),tags=Object.fromEntries([...String(m[2]||'').matchAll(/<tag\b([^>]+)\/>/g)].map(m=>{const a=attrs(m[1]);return[a.k,a.v]}));nodes.push({type:'node',id:a.id,lat:+a.lat,lon:+a.lon,tags})}for(const m of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)){const a=attrs(m[1]),tags=Object.fromEntries([...m[2].matchAll(/<tag\b([^>]+)\/>/g)].map(m=>{const a=attrs(m[1]);return[a.k,a.v]}));if(tags.railway==='rail'&&!['construction','abandoned','disused'].some(k=>tags[k]==='yes'))ways.push({type:'way',id:a.id,nodes:[...m[2].matchAll(/<nd ref="(\d+)"/g)].map(m=>m[1]),tags})}const used=new Set(ways.flatMap(w=>w.nodes));return{elements:[...nodes.filter(n=>used.has(n.id)||['station','halt','stop'].includes(n.tags.railway)),...ways]};}
module.exports={tiles,parse};
if(require.main===module&&process.argv.includes('--list')){console.log(JSON.stringify(tiles));process.exit(0)}
if(require.main===module)(async()=>{for(const[key,bbox]of Object.entries(tiles)){
 const file=path.join(dir,'map-'+key+'.json');if(fs.existsSync(file))continue;
 await new Promise(r=>setTimeout(r,4500));
 const url='https://api.openstreetmap.org/api/0.6/map?bbox='+bbox.join(',');
 try{const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status);const xml=await r.text(),data=parse(xml);fs.writeFileSync(file,JSON.stringify({...data,provenance:{url,retrievedAt:new Date().toISOString(),license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',rawSha256:crypto.createHash('sha256').update(xml).digest('hex')}}));console.log('철도 지도 수집: '+key+' '+data.elements.length)}catch(e){console.warn('지도 수집 보류: '+key+' '+e.message)}
}})();
