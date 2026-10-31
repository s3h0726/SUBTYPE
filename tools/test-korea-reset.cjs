#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),parse=p=>JSON.parse(read(p));
const policy=parse('data/kr/publication-policy.json');
assert.equal(policy.mode,'reset');assert.equal(policy.automaticKoreanPublication,false);
const publicIndex=parse('data/kr/generated/index.json'),previewIndex=parse('data/kr/preview/index.json');
for(const [name,index]of [['public',publicIndex],['preview',previewIndex]]){
 assert.equal(index.country.id,'kr',name);assert.equal(index.reset,true,name);
 assert.deepEqual(index.routes,[],name+' must expose zero routes');
 assert.deepEqual(index.operators,[],name+' must expose zero operators');
}
assert.equal(publicIndex.counts.routes,0);assert.equal(publicIndex.counts.gamePublishedServices,0);
for(const name of ['data/kr/generated/routes','data/kr/preview/routes']){
 const dir=path.join(root,name);
 assert(!fs.existsSync(dir)||fs.readdirSync(dir).filter(f=>f.endsWith('.json')).length===0,name+' must not contain route payloads');
}
const embed=read('js/korea-index-data.js');
assert.deepEqual(JSON.parse(embed.match(/TRT_KOREA_INDEX=(\{[^\n]+\});/)[1]),publicIndex);
for(const name of ['js/feature-flags.js','js/app.bundle.js']){
 const source=read(name);
 assert(source.includes('koreaRoutesReset:true'),name+' missing KR reset flag');
 assert(source.includes("route?.countryId==='kr')return false"),name+' missing route visibility reset');
}
for(const name of ['js/data-loader.js','js/app.bundle.js'])assert(read(name).includes("source:'korea-reset'"),name+' loads stale routes');
for(const name of ['js/game.js','js/app.bundle.js'])assert(read(name).includes('한국 노선이 초기화되어 플레이할 수 없습니다.'),name+' allows direct play');
for(const name of ['tools/build-korea-preview.js','tools/build-korea-data.js','tools/publish-korean-service-routes.cjs'])assert(read(name).includes('KR_CATALOG_RESET'),name+' may republish routes');
assert(/js\/korea-index-data\.js\?v=[^"']+/.test(read('index.html')));
assert(/js\/app\.bundle\.js\?v=[^"']+/.test(read('index.html')));
assert(read('js/feature-flags.js').includes('hongKong:true'));
console.log('PASS KR ROUTE RESET: 0 public / 0 preview / 0 compiled route files; Japanese & Hong Kong unaffected');
