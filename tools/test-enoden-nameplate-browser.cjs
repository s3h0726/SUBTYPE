'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {spawnSync}=require('node:child_process');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
 .find(x=>spawnSync('which',[x],{encoding:'utf8'}).status===0);
if(!chrome)throw Error('Chrome/Chromium is needed to verify the Enoden nameboard');
const fixture=pathToFileURL(path.resolve(__dirname,'enoden-nameplate-layout-fixture.html')).href;
for(const [width,height] of [[1593,430],[1280,580],[1024,720],[390,844]]){
 test('Enoden Yuigahama EN13 nameplate at '+width+'x'+height,()=>{
  const r=spawnSync(chrome,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--allow-file-access-from-files','--window-size='+width+','+height,
    '--virtual-time-budget=1000','--dump-dom',fixture
  ],{encoding:'utf8',timeout:40000,maxBuffer:6*1024*1024});
  assert.equal(r.status,0,(r.stderr||'').slice(-900));
  const result=r.stdout.match(/data-enoden-result="(PASS|FAIL)"/)?.[1];
  const error=r.stdout.match(/data-enoden-errors="([^"]*)"/)?.[1]||'No Enoden browser result';
  assert.equal(result,'PASS',error);
 });
}
