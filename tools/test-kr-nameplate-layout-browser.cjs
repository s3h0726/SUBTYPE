'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {spawnSync}=require('node:child_process');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
 .find(name=>spawnSync('which',[name],{encoding:'utf8'}).status===0);
if(!chrome)throw Error('Headless Chrome/Chromium required for nameplate layout QA');
const fixture=pathToFileURL(path.resolve(__dirname,'kr-nameplate-layout-fixture.html')).href;
for(const sign of ['kr-korail','kr-seoul-metro']){
 for(const [width,height] of [[1593,315],[1593,430],[1280,580],[390,844]]){
  test(sign+' no clipped station name/typing/footer at '+width+'x'+height,()=>{
   const result=spawnSync(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--allow-file-access-from-files','--window-size='+width+','+height,
    '--virtual-time-budget=1100','--dump-dom',fixture+'?sign='+sign
   ],{encoding:'utf8',timeout:40000,maxBuffer:5*1024*1024});
   assert.equal(result.status,0,'Chrome failed '+(result.stderr||'').slice(-500));
   const outcome=result.stdout.match(/data-nameplate-result="(PASS|FAIL)"/)?.[1];
   const errors=result.stdout.match(/data-nameplate-errors="([^"]*)"/)?.[1]||'No browser QA result';
   assert.equal(outcome,'PASS',errors);
  });
 }
}
