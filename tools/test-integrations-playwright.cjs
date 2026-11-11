#!/usr/bin/env node
'use strict';
// Non-destructive smoke: the actual Japan short-route UI and local record lifecycle.
// Existing tools/test-kr-site.cjs remains the comprehensive Korea/IME regression test.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  try{
    const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/, '')||'index.html';
    const p=path.resolve(root,rel);
    if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
    res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');
    res.end(fs.readFileSync(p));
  }catch(error){res.writeHead(404);res.end('Not found')}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=process.env.SUBTYPE_TEST_URL||'http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true});
  try{
    for(const device of ['desktop','mobile']){
      const ctx=await browser.newContext({viewport:device==='desktop'?{width:1440,height:900}:{width:390,height:844},isMobile:device==='mobile',hasTouch:device==='mobile'});
      const page=await ctx.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(()=>localStorage.setItem('trt-country','jp'));
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.documentElement.dataset.country==='jp'&&Number.parseInt(document.querySelector('#route-count')?.textContent||'0',10)>0);
      await page.locator('[data-nav="rail-map"]:visible').first().click();
      await page.locator('#route-search').fill('羽衣');
      const card=page.locator('[data-route="line-11627"]');
      await card.waitFor({state:'attached'});
      await card.click();
      await page.locator('[data-selected-play="line-11627"]').click();
      await page.waitForFunction(()=>document.body.dataset.currentScreen==='game-setup');
      await page.locator('#setup-form [name="stationAdvance"][value="auto"]').check();
      await page.locator('#setup-form button[type="submit"]').click();
      await page.waitForFunction(()=>document.body.dataset.currentScreen==='game');
      let typed=0;
      while(typed<20){
        await page.waitForFunction(()=>document.body.dataset.currentScreen==='result'||document.body.dataset.gamePhase==='TYPING');
        if(await page.evaluate(()=>document.body.dataset.currentScreen==='result'))break;
        const name=(await page.locator('#prompt-ko').innerText()).trim();
        assert.ok(name,'station prompt must not be blank');
        const before=await page.evaluate(()=>globalThis.__TRT_GAME_DEBUG__?.typedStationIds?.length||0);
        const answer=name.replace(/[^\p{L}\p{N}]/gu,'');
        await page.locator('#typing-input').evaluate((el,value)=>{
          el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
          el.value=value;
          el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}));
          el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:value}));
        },answer);
        await page.waitForFunction(n=>document.body.dataset.currentScreen==='result'||((globalThis.__TRT_GAME_DEBUG__?.typedStationIds?.length||0)>n&&document.body.dataset.gamePhase==='TYPING'),before);
        typed++;
      }
      assert.ok(typed>=2&&typed<20,'short route must finish without stalling');
      await page.waitForFunction(()=>document.body.dataset.currentScreen==='result');
      assert.ok((await page.locator('#result-route').innerText()).length>0);
      assert.deepEqual(errors,[],'browser runtime errors');
      console.log(JSON.stringify({device,status:'PASS',typedStops:typed,cloudWrite:'NOT_ATTEMPTED'}));
      await ctx.close();
    }
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
