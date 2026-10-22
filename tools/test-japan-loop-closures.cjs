const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const ctx={console,globalThis:null};ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/data-loader.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,'')+';globalThis.normalizeLineTest=normalizeLine',ctx);
test('Yamanote loop returns to Tokyo via reviewed survey corridor without changing station identity',()=>{
 const original=read('data/generated/routes/line-11302.json').route,route=ctx.normalizeLineTest(original);
 assert.equal(route.loop,true);assert.equal(route.stations.at(-1).id,route.stations[0].id);
 assert.equal(route.directedSegments.length,route.stations.length-1);
 assert.equal(route.loopGeometryReviewStatus,'REVIEW_REQUIRED');
 assert.equal(route.directedSegments.at(-1).verified,false);
});
test('Toyama loop returns Marunouchi with reused actual tram track',()=>{
 const source=read('data/generated/routes/line-toyama-city-3.json').route,route=ctx.normalizeLineTest(source);
 assert.equal(route.stations.at(-1).id,route.stations[0].id);
 assert.equal(route.directedSegments.length,route.stations.length-1);
 assert.equal(route.directedSegments.at(-1).verified,true);
});
test('Toei Oedo is not a closed circular journey',()=>{const r=ctx.normalizeLineTest(read('data/generated/routes/line-99301.json').route);assert.equal(r.loop,false);assert.notEqual(r.stations[0].id,r.stations.at(-1).id)});
test('No arbitrary Japanese line acquires a fabricated closing segment',()=>{
 const osaka=ctx.normalizeLineTest(read('data/generated/routes/line-11623.json').route);
 assert.equal(osaka.stations[0].ja,'天王寺');assert.equal(osaka.stations.at(-1).ja,'寺田町');assert.equal(osaka.directedSegments.length,osaka.stations.length-1);assert.equal(osaka.loop,false);
});
