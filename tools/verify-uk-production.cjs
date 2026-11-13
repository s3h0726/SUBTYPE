'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/uk'),base='https://s3h0726.github.io/SUBTYPE/',expected=JSON.parse(fs.readFileSync(path.join(root,'data/uk/generated/validation.json')));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={url:base,checkedAt:new Date().toISOString(),status:'FAIL',pageErrors:[],journeys:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.pageErrors.push(e.message));await page.addInitScript(()=>localStorage.setItem('trt-country','uk'));
 await page.goto(base+'?uk-verify='+Date.now()+'#rail-map',{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-route="uk-bakerloo"]',{timeout:45000});
 const releaseRef=process.env.UK_PRODUCTION_REF;
 const data=await page.evaluate(async()=>(await fetch('data/uk/generated/index.json',{cache:'no-store'})).json());
 Object.assign(report,{operators:data.operators.length,lines:data.routes.length,directions:data.routes.reduce((n,r)=>n+r.serviceCount,0),stationIds:data.stationNameIndex.length});
 report.routeCards=await page.locator('[data-route^="uk-"]').count();console.log('Public UK catalogue:',report.routeCards,'cards,',report.directions,'directions');
 const expectedRelease=releaseRef?JSON.parse(require('node:child_process').execFileSync('git',['show',releaseRef+':data/uk/generated/validation.json'],{cwd:root,maxBuffer:64*1024*1024})):expected;
 assert.equal(report.operators,expectedRelease.operators);assert.equal(report.lines,expectedRelease.lines);assert.equal(report.directions,expectedRelease.playableDirections);assert.equal(report.stationIds,expectedRelease.uniqueStations);
 await page.screenshot({path:path.join(out,'production-catalog.png'),fullPage:true});
 // Use the real settings form to keep representative full-route checks quick.
 await page.evaluate(()=>document.querySelector('[data-nav="settings"]').click());await page.locator('#settings-form input[name="motion"]').uncheck();await page.locator('#settings-form').evaluate(e=>e.requestSubmit());
 const lineIds=process.argv.slice(2);
 for(const lineId of lineIds.length?lineIds:['uk-lnwr-west-coast','uk-scotrail-borders','uk-tfw-cambrian-coast']){
  const route=data.routes.find(r=>r.id===lineId);assert(route,'missing public route: '+lineId);
  await page.evaluate(()=>document.querySelector('[data-nav="rail-map"]').click());
  await page.locator('#route-search').fill(route.line.en);
  await page.locator('[data-route="'+lineId+'"]').click();await page.locator('[data-selected-play="'+lineId+'"]').click();await page.waitForFunction(()=>document.body.dataset.currentScreen==='game-setup');
  const selectedId=await page.locator('#journey-destination').inputValue(),owner=JSON.parse(fs.readFileSync(path.join(root,route.lazySource))),pattern=owner.patterns.find(p=>p.id===selectedId);assert(pattern,'production choice not in repository');
  const wanted=pattern.stationIds.map(id=>owner.stationCatalog.find(s=>s.id===id).ko),typed=[];
  assert.equal(await page.locator('#game-map-mode').inputValue(),'geographic');await page.locator('#setup-form button[type="submit"]').click();await page.waitForFunction(()=>document.body.dataset.currentScreen==='game');
  console.log('Public playthrough:',lineId,wanted.length,'stops');
  for(let i=0;i<wanted.length+2;i++){
   if(await page.evaluate(()=>document.body.dataset.currentScreen==='result'))break;
   await page.waitForFunction(()=>{const e=document.querySelector('#typing-input');return e&&!e.readOnly&&!e.disabled});
   const answer=await page.locator('#prompt-ko').innerText();assert.equal(answer.replace(/\s/g,''),wanted[typed.length].replace(/\s/g,''));typed.push(answer);
   await page.evaluate(answer=>{const input=document.querySelector('#typing-input');input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value=answer.replace(/\s/g,'');input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}));input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:input.value}))},answer);
   await page.waitForFunction(old=>document.body.dataset.currentScreen==='result'||document.querySelector('#prompt-ko')?.textContent!==old,answer,{timeout:30000});
  }
  assert.equal(await page.evaluate(()=>document.body.dataset.currentScreen),'result');assert.equal(typed.length,wanted.length);report.journeys.push({lineId,patternId:pattern.id,typedStations:typed,status:'PASS'});
 }
 report.gameplay='PASS';await page.screenshot({path:path.join(out,'production-result.png'),fullPage:true});await page.locator('#result-open-ranking').click();await page.waitForFunction(()=>window.TRTLeaderboard?.currentLine()?.countryId==='uk');report.leaderboardCountry='uk';
 report.bundle=await page.locator('script[src*="app.bundle.js"]').getAttribute('src');const body=await page.evaluate(async src=>(await fetch(src,{cache:'no-store'})).text(),report.bundle);report.bundleSha256=crypto.createHash('sha256').update(body).digest('hex');assert(body.includes('ukGeometryRequests'));assert(body.includes('function ukOperatingChoices('));
 const geometry=await page.evaluate(async()=>(await fetch('data/uk/generated/geometry.json',{cache:'no-store'})).json());
 const geometryFile='data/uk/generated/geometry.json';
 const expectedGeometry=releaseRef?require('node:child_process').execFileSync('git',['show',releaseRef+':'+geometryFile],{cwd:root,maxBuffer:64*1024*1024}):fs.readFileSync(path.join(root,geometryFile));
 assert.deepEqual(geometry,JSON.parse(expectedGeometry));report.geometryMatchesRepository=true;
 assert.equal(report.pageErrors.length,0);report.status='PASS';
}catch(e){report.error=e.stack;process.exitCode=1}finally{fs.writeFileSync(path.join(out,'production-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close()}
})();
