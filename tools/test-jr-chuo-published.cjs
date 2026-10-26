#!/usr/bin/env node
// Guard the deployed Japanese catalog, not only the canonical source workspaces.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
const readJson=file=>JSON.parse(read(file));
const sandbox={window:{}};
vm.runInNewContext(read('js/japan-lite-index.js'),sandbox,{filename:'japan-lite-index.js'});
const lite=sandbox.window.TRT_JAPAN_LITE_INDEX;
assert.ok(Array.isArray(lite?.routes),'published Japanese route list missing');
const duplicateId='line-11311--chuohonsen-tokyo-shiojiri';
assert.equal(lite.routes.some(r=>r.id===duplicateId),false,'retired Chuo Main card is STILL displayed');
const found=lite.routes.filter(r=>r.id==='line-11311');
assert.equal(found.length,1,'exactly one Chuo East card must be published');
const card=found[0];
assert.equal(card.line.ko,'츄오토선');
assert.equal(card.stationCount,42);
assert.equal(card.searchStations.includes('東京'),false,'Tokyo–Takao overlaps rapid card');
assert.equal(card.searchStations[0],'高尾');
assert.equal(card.searchStations.at(-2),'塩尻');
const source=readJson('data/generated/routes/line-11311.json').route;
assert.equal(source.id,card.id);
assert.equal(source.stations.length,42);
assert.equal(source.stations[0].ja,'高尾');
assert.equal(source.stations.at(-1).ja,'塩尻');
assert.equal(source.geometryReady,true);
assert.equal(source.directedSegments.length,41);
assert.equal(source.missingSegments.length,0);
const rapid=lite.routes.find(r=>r.id==='line-11312');
assert.ok(rapid,'Chuo Rapid card must remain');
assert.equal(rapid.stationCount,24);
const html=read('index.html');
const posLite=html.indexOf('js/japan-lite-index.js');
const posGuard=html.indexOf('js/japan-route-identity-patch.js');
const posBundle=html.indexOf('js/app.bundle.js');
assert.ok(posLite>=0 && posGuard>posLite && posBundle>posGuard,'deployed script ordering must protect routes before the app starts');
const repair=read('js/japan-route-identity-patch.js');
const stale={TRT_JAPAN_LITE_INDEX:{routes:[
  {id:'line-11311',line:{ko:'츄오 본선(도쿄~시오지리)'},stationCount:53,
   lazySource:'./data/jp-canonical/chunk-02.json?v=old',
   searchStations:['東京','도쿄','高尾','타카오','塩尻','시오지리']},
  {id:duplicateId,line:{ko:'주오 본선(도쿄~시오지리)'},lazySource:'old'},
  {id:'line-11301',line:{ko:'도카이도선'}}
]} ,console:{error(...args){throw new Error(args.join(' '))}}};
vm.runInNewContext(repair,stale,{filename:'japan-route-identity-patch.js'});
const cards=stale.TRT_JAPAN_LITE_INDEX.routes;
assert.equal(cards.length,2,'cached duplicate guard failed');
assert.equal(cards[0].stationCount,42);
assert.equal(cards[0].line.ko,'츄오토선');
assert.ok(cards[0].lazySource.includes('data/generated/routes/line-11311.json'));
assert.equal(cards[0].searchStations[0],'高尾');
console.log('PASS: deployed Chuo East 42 stations / 41 curves, retired duplicate absent, Rapid preserved, legacy cache repaired');
