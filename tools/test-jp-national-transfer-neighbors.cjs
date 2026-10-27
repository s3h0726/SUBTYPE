#!/usr/bin/env node
'use strict';
// Audit nationwide transfer compilation; assertions run only after a full
// canonical data rebuild in the Japan publish workflow.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const prefix='window.TRT_JAPAN_LITE_INDEX=';
const source=read('js/japan-lite-index.js'),i=source.indexOf(prefix);
assert.ok(i>=0,'missing published Japan catalog');
const index=JSON.parse(source.slice(i+prefix.length).trim().replace(/;\s*$/,''));
const compiled=json('data/generated/japan-transfer-neighbors.json');
// Every operator-specific station name must hydrate from its newest
// generated route file. A fixed query string can silently restore old names.
const crypto=require('node:crypto'),nameOverrides=json('data/japan-route-station-names.json').routes;
for(const id of [...Object.keys(nameOverrides),'line-28002-honancho-branch']){
 const item=index.routes.find(r=>r.id===id);
 assert.ok(item,'missing signed route '+id);
 const file='data/generated/routes/'+id+'.json';
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
 assert.equal(item.lazySource,'./'+file+'?v='+hash,id+' station signs could be cached after regeneration');
}
const neighbor=index.transferNeighbors;
assert.ok(index.routes.length>=590,'missing nationwide rail routes');
assert.ok(neighbor&&typeof neighbor==='object','the live lite index has no nationwide transfer graph');
assert.deepEqual(neighbor,compiled.neighbors,'published graph and audit output differ');
assert.equal(compiled.audit.routeCount,index.routes.length);
assert.ok(compiled.audit.groupCount>=29,'documented regional groups lost');
assert.ok(compiled.audit.identityLinks>0,'same-ID interchanges missing');
assert.ok(Object.keys(neighbor).length>100,'nationwide transfer graph suspiciously empty');
const ids=new Set(index.routes.map(r=>r.id));
let edges=0;
for(const [id,otherIds] of Object.entries(neighbor)){
 assert.ok(ids.has(id),'unknown source route '+id);
 assert.ok(Array.isArray(otherIds),'invalid transfer peers '+id);
 assert.equal(new Set(otherIds).size,otherIds.length,'duplicate peers '+id);
 for(const peer of otherIds){
  assert.ok(ids.has(peer),'unknown transfer route '+peer);
  assert.notEqual(peer,id,'self-transfer on '+id);
  assert.ok(neighbor[peer]?.includes(id),'asymmetric transfer '+id+'/'+peer);
  edges++;
 }
}
assert.ok(edges>300,'not enough national transfer links');
for(const [a,b] of [
 ['line-11302','line-28002'], // Tokyo/Yamanote and Marunouchi: independent platforms, same stop ID
 ['line-11602','line-99618'], // Osaka JR and Osaka Metro: distinct operator station names
 ['line-28001','line-28008'] // Akasaka-mitsuke / Nagatacho
])assert.ok(neighbor[a]?.includes(b),a+' missing transfer neighbor '+b);
const runtime=read('js/app.bundle.js');
assert.ok(runtime.includes('const nationalNeighbors=globalThis.TRT_JAPAN_LITE_INDEX?.transferNeighbors;')
 &&runtime.includes('const neighborIds=new Set(nationalNeighbors?.[route.id]||[])'),
 'free-drive start ignores the published national graph');
assert.ok(runtime.includes('if(!nationalNeighbors||!Object.keys(nationalNeighbors).length)'),
 'pre-regeneration nationwide fallback missing');
assert.ok(runtime.includes('if(s?.jpIsolatedStopKey)return s.jpIsolatedStopKey'),
 'unverified same-grid stations are still merged without evidence');
assert.ok(runtime.includes('function assignJapanNearbySameNameTransfers(routes)'),
 'same-named independently identified platforms cannot transfer');
console.log(JSON.stringify({status:'PASS',routeCount:index.routes.length,linkedRoutes:Object.keys(neighbor).length,
 bidirectionalEdges:edges/2,identityLinks:compiled.audit.identityLinks,
 nearbyLinks:compiled.audit.nearbySameNameLinks,officialGroupLinks:compiled.audit.namedGroupLinks}));
