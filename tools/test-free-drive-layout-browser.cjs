'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {spawnSync}=require('node:child_process');
const candidates=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
const chrome=candidates.find(name=>spawnSync('which',[name],{encoding:'utf8'}).status===0);
if(!chrome)throw Error('A headless Chrome/Chromium binary is required');
const fixture=pathToFileURL(path.join(__dirname,'free-drive-layout-fixture.html')).href;
for(const [width,height] of [[1624,900],[1280,580],[1624,430],[390,844]]){
  test('free-drive label and input never overlap at '+width+'x'+height,()=>{
    const run=spawnSync(chrome,[
      '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--allow-file-access-from-files','--hide-scrollbars',
      '--window-size='+width+','+height,
      '--virtual-time-budget=1200','--dump-dom',fixture
    ],{encoding:'utf8',timeout:30000,maxBuffer:5*1024*1024});
    assert.equal(run.status,0,'Chrome could not render fixture: '+(run.stderr||'').slice(-700));
    const result=run.stdout.match(/data-layout-result="(PASS|FAIL)"/);
    assert(result,'No layout inspection result in rendered DOM');
    const issues=run.stdout.match(/data-layout-errors="([^"]*)"/)?.[1]||'overlapping nameplate elements';
    assert.equal(result[1],'PASS',issues);
  });
}
