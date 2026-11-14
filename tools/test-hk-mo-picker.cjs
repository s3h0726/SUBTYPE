'use strict';
/**
 * Optional browser regression: node tools/test-hk-mo-picker.cjs
 * Requires Playwright/Chromium (PLAYWRIGHT_MODULE may override the package).
 * Verifies map pin -> region picker -> native hk/mo country engine.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html';
  const target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'}).end(fs.readFileSync(target));}
  catch{res.writeHead(404).end();}
});
async function waitSelected(page,id){
  await page.waitForFunction(id=>
    localStorage.getItem('trt-country')===id &&
    document.querySelector('button[data-country="'+id+'"]')?.classList.contains('active'),id,
    {timeout:30000});
}
async function test(page,base){
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const group=page.locator('#screen-home [data-country-group="sar"]');
  await group.waitFor({state:'visible',timeout:45000});
  await group.click();
  const picker=page.locator('#hk-mo-country-picker');
  await picker.waitFor({state:'visible'});
  assert.equal(await picker.evaluate(el=>el.open),true,'group click did not open a native picker');
  await picker.locator('[data-hk-mo-choice="hk"]').click();
  await waitSelected(page,'hk');
  assert.equal(await picker.evaluate(el=>el.open),false,'picker did not close');

  await group.click();
  await picker.locator('[data-hk-mo-choice="mo"]').click();
  await waitSelected(page,'mo');

  const mapPin=page.locator('#world-map-markers [data-map-country="sar"]');
  await mapPin.waitFor({state:'attached'});
  await mapPin.evaluate(el=>el.click());
  assert.equal(await picker.evaluate(el=>el.open),true,'map marker did not open the picker');
  await picker.locator('[data-picker-close]').click();
  assert.equal(await picker.evaluate(el=>el.open),false,'close button did not work');
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch({headless:true});
  try{
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
      const page=await browser.newPage({viewport});
      try{await test(page,base);process.stdout.write('PASS Hong Kong/Macau selection '+viewport.width+'px\n');}
      finally{await page.close();}
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
