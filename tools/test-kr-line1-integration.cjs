const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const published=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const preview=JSON.parse(fs.readFileSync(path.join(root,'data/kr/preview/index.json'),'utf8'));
const runtime=import(pathToFileURL(path.join(root,'js/data-loader.js')));
test('metro Line 1 replaces five legacy cards with reviewed research directions only',async()=>{
 const {integrateKoreanLine1Index}=await runtime;
 const merged=integrateKoreanLine1Index(published,preview);
 const integrated=merged.routes.filter(route=>route.integratedLine1===true);
 assert.equal(published.routes.filter(r=>/^kr-metro-1-/.test(r.id)).length,5);
 assert.equal(integrated.length,23);
 assert.equal(merged.integratedLine1.replacedLegacySections,5);
 assert.equal(merged.integratedLine1.officialReleased,0);
 assert(!merged.routes.some(route=>/^kr-metro-1-/.test(route.id)));
 assert(!integrated.some(route=>['13695367','13695368'].includes(String(route.sourceRelationId))));
 assert(integrated.every(route=>route.releaseStatus==='research'&&route.playStatus==='RESEARCH_PLAYABLE'&&route.previewContract==='kr-research-v1'&&route.lazySource));
 const preserved=published.routes.filter(route=>!/^kr-metro-1-/.test(route.id)).map(route=>route.id);
 assert.deepEqual(merged.routes.filter(route=>!route.integratedLine1).map(route=>route.id),preserved);
 assert.equal(preview.routes.length,95);
 assert.equal(published.routes.length,13);
 for(const route of integrated){const file=route.lazySource.split('?')[0];assert(fs.existsSync(path.join(root,file)),route.id+' missing source file')}
});
test('invalid previews fail closed instead of becoming official services',async()=>{
 const {integrateKoreanLine1Index}=await runtime;
 assert.throws(()=>integrateKoreanLine1Index(published,{...preview,previewContract:'invalid'}),/INVALID_LINE1_PREVIEW_INDEX/);
 assert.throws(()=>integrateKoreanLine1Index(published,{...preview,routes:[]}),/NO_VERIFIED_LINE1_RESEARCH_PREVIEWS/);
});
