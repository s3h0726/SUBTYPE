'use strict';
const fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('the actual shipped game bundle defines KTX reference and map-fix functions before loading',()=>{
 const bundle=read('js/app.bundle.js');
 for(const marker of ['function loadKtxMapReference(){','function mapOnlyKtxJourneySegments(','TRT_KTX_GYEONGBU_DISPLAY_REFERENCE','KTX_MAP_REFERENCE_SCHEMA','function applySuseoTrack('])
  assert.ok(bundle.includes(marker),'missing from playable production bundle: '+marker);
 assert.ok(bundle.indexOf('function loadKtxMapReference(){')<bundle.indexOf('loadKtxMapReference().catch('));
 assert.ok(bundle.indexOf('function mapOnlyKtxJourneySegments(')<bundle.indexOf('mapOnlyKtxJourneySegments(route,'));
 assert.ok(bundle.includes('mapDisplaySegments:displaySegments'),'real game journey route must use corrected map-only segments');
 assert.ok(bundle.includes("const directed=Array.isArray(route.mapDisplaySegments)?route.mapDisplaySegments:route.directedSegments"),'map renderer must draw actual corrected segments');
});
test('the production HTML references precisely the freshly built bundled code',()=>{
 const html=read('index.html');
 assert.match(html,/\.\/js\/app\.bundle\.js\?v=[a-f0-9]{12}/);
 const build=read('tools/build-app-bundle.js');
 assert.match(build,/"ktx-gyeongbu-map-display\.js"/);
});
