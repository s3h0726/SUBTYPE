#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const unpack=(file,marker)=>JSON.parse(read(file).split(marker)[1].trim().replace(/;\s*$/,''));
const branch=json('data/generated/routes/line-jr-central-minoakasaka.json').route;
const trunk=json('data/generated/routes/line-11503.json').route;
const lite=unpack('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const chunkFor=id=>{const meta=lite.routes.find(r=>r.id===id);assert(meta?.lazySource);const unversioned=meta.lazySource.split('?')[0];const source=unversioned.startsWith('./')?unversioned.slice(2):unversioned;assert(source.startsWith('data/jp-canonical/chunk-')&&source.endsWith('.json'));return json(source).routes;};
assert.deepEqual(branch.stations.map(s=>s.ja),['大垣','荒尾','美濃赤坂']);
assert.equal(branch.directedSegments.length,2);
assert.equal(branch.geometryReady,true);
assert.equal(branch.services.find(s=>s.id==='minoakasaka-local')?.stops?.length,3);
assert.deepEqual(trunk.stations.map(s=>s.ja),['岐阜','西岐阜','穂積','大垣','垂井','関ケ原','柏原','近江長岡','醒ケ井','米原']);
assert.equal(trunk.geometryReady,false,'unverified Ogaki–Tarui must not be treated as verified track');
assert(trunk.missingSegments.some(s=>s.includes('station-1150304::station-1150307')));
assert.equal(trunk.playable,false);
for(const id of [trunk.id,branch.id]){
  assert.equal(lite.routes.filter(r=>r.id===id).length,1,'one visible card per physical route');
  const stored=chunkFor(id).find(r=>r.id===id);assert(stored,'missing in deployed Japanese chunk: '+id);
  assert.deepEqual(stored.stations.map(s=>s.ja),id===branch.id?branch.stations.map(s=>s.ja):trunk.stations.map(s=>s.ja));
}
assert(lite.routes.find(r=>r.id===branch.id).lazySource.includes('chunk-'));
assert(read('js/app.bundle.js').includes("if(code==='11503')queue(builtin.find(item=>item.id==='line-jr-central-minoakasaka'))"));
console.log('PASS: Mino-Akasaka playable separate branch; Gifu–Maibara misconnection explicitly blocked; runtime card/chunk synchronized');
