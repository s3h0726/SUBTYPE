#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const json=filename=>JSON.parse(read(filename));
const cat=JSON.parse(read('js/nationwide-service-catalog.js').split('window.TRT_NATIONWIDE_SERVICE_CATALOG=')[1].trim().replace(/;\s*$/,''));
const ids=['11609','11610','11611','11612'];
const routes=ids.map(id=>json('data/generated/routes/line-'+id+'.json').route);
const context={};vm.createContext(context);
vm.runInContext(read('js/route-integrity.js').replace(/\bexport\s+/g,'')+';globalThis.auditRouteIntegrity=auditRouteIntegrity;',context);
for(let i=0;i<routes.length;i++){
 const r=routes[i],id=ids[i];
 assert.equal(r.id,'line-'+id);
 assert.equal(r.operatorId,'jr-west');
 assert.equal(r.geometryReady,true,id+' must contain actual track');
 assert.equal(r.missingSegments.length,0);
 assert.equal(r.directedSegments.length,r.stations.length-1);
 assert(r.geometry.length>50,id+' should have detailed surveyed geometry');
 assert.equal(context.auditRouteIntegrity(r).pass,true,id+' actual rail route is not connected');
 if(i)assert.equal(routes[i-1].stations.at(-1).ja,r.stations[0].ja,'Sanyo section boundaries disagree');
}
assert.equal(routes[0].stations[0].ja,'姫路');
assert.equal(routes.at(-1).stations.at(-1).ja,'下関');
assert.equal(routes[0].stations[1].ja,'手柄山平和公園','March 2026 new station is missing');
const localCodes=['44','45','461','511','672','995'];
const found={};
for(const line of Object.values(cat.lines))for(const p of line.patterns||[]){
 if(localCodes.includes(p.id)){
  for(const segment of p.segments||[])if(segment.lineCode==='11609'&&segment.stations.some(s=>s[0]==='姫路')&&segment.stations.some(s=>s[0]==='英賀保')){
   assert.deepEqual(Array.from(segment.stations.slice(0,3),s=>s[0]),['姫路','手柄山平和公園','英賀保']);
   assert.equal(segment.stations[1][1],0,'2026 station must be a stop');
   found[p.id]=(found[p.id]||0)+1;
  }
 }
 if(p.id==='797'){
  assert.equal(p.type.ja,'スーパーいなば');
  assert.equal(p.type.ko,'슈퍼 이나바');
  const san=p.segments.find(s=>s.lineCode==='11609');
  if(san){assert.equal(san.stations[0][0],'岡山');assert.equal(san.stations.at(-1)[0],'上郡');}
 }
}
for(const code of localCodes)assert(found[code]>0,'missing the current Sanyo stop pattern: '+code);
const inaba=cat.lines['11609'].patterns.find(p=>p.id==='797');
assert(inaba?.segments.some(s=>s.lineCode==='11609'));
const missing=cat.lines['11612'].patterns.find(p=>p.id==='532');
assert(missing?.segments.some(s=>s.lineCode==='11612'&&s.stations.at(-1)[0]==='門司'));
assert(!routes.at(-1).stations.some(s=>s.ja==='門司'),'Do not falsely extend JR West track under the Kanmon Strait');
for(const file of ['js/app.js','js/app.bundle.js']){
 const s=read(file);
 assert(s.includes('missingCatalogTrack')&&s.includes('시모노세키~모지(JR 큐슈)'),file+' must block phantom Moji track');
}
// The Wadamisaki branch is a separate two-stop service, not an extra stop on the Sanyo trunk.
const wadamisaki=json('data/generated/routes/line-11613.json').route;
assert.equal(wadamisaki.line.ko,'와다미사키선(효고~와다미사키)');
assert.deepEqual(wadamisaki.stations.map(s=>s.ja),['兵庫','和田岬']);
assert.equal(wadamisaki.geometryReady,true);
assert(wadamisaki.geometry.length>=20,'Wadamisaki must retain surveyed track');
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\\s*$/,''));
assert.equal(lite.routes.find(r=>r.id==='line-11613')?.line.ko,wadamisaki.line.ko);
const sourcePattern=cat.lines['11610'].patterns.find(p=>p.id==='681');
assert(sourcePattern?.type?.ko==='산 라이너','Historical Sun Liner must be preserved in raw audit source');
for(const p of ['js/app.js','js/app.bundle.js'])
 assert(read(p).includes("catalogLine.code==='11610'&&String(pattern.id)==='681'"),p+': 2022 discontinued Sun Liner must not appear as an active destination');
const html=read('index.html');
assert(html.includes('nationwide-service-catalog.js?v=20261026-sanyo-current'));
console.log(JSON.stringify({status:'PASS',segments:routes.length,stations:routes.reduce((v,r)=>v+r.stations.length,0)-3,verifiedStationLinks:routes.reduce((v,r)=>v+r.directedSegments.length,0),stoppingPatterns:found,superInaba:'valid westbound track',mojiConnection:'BLOCKED until real JR Kyushu physical alignment'},null,2));
