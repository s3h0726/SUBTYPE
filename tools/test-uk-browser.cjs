'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/uk');fs.mkdirSync(out,{recursive:true});
async function configurePage(page){
 const dist=process.env.UK_LEAFLET_DIST;
 if(dist)await page.route('https://unpkg.com/leaflet@1.9.4/dist/leaflet.*',route=>{
  const name=path.basename(new URL(route.request().url()).pathname);
  return route.fulfill({path:path.join(dist,name),headers:{'access-control-allow-origin':'*'}});
 });
}
const hook='globalThis.__UK_QA__={game,go,chooseRoute,openSetup,actualOperatingChoices,resolveOperatingChoice,operatingPatternKey,startFreeDrive,freeDrive,ukFreeDriveRoutes,buildTypingModel,routes:()=>routes};\n';
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,name);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{let body=fs.readFileSync(file);if(name==='js/app.bundle.js')body=Buffer.from(body.toString().replace('\n})().catch(error=>','\n'+hook+'})().catch(error=>'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body)}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={status:'FAIL',runs:[],errors:[],regressions:[],freeDrive:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),geometryRequests=[];await configurePage(page);page.on('request',r=>{const p=new URL(r.url()).pathname;if(p.startsWith('/data/uk/generated/geometry'))geometryRequests.push(p)});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('trt-country','uk'));await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__UK_QA__&&document.querySelector('[data-route="uk-bakerloo"]'),{},{timeout:60000});
 await page.evaluate(()=>__UK_QA__.go('rail-map'));assert.equal(await page.locator('button[data-country="uk"] strong').innerText(),'영국');await page.screenshot({path:path.join(out,'catalog-desktop.png'),fullPage:true});
 const ids=await page.evaluate(()=>__UK_QA__.routes().map(r=>r.id));
 for(const id of ids){
  const choices=await page.evaluate(async id=>{const q=__UK_QA__;q.go('rail-map');await q.chooseRoute(id);q.openSetup(q.routes().find(r=>r.id===id));return q.actualOperatingChoices(q.routes().find(r=>r.id===id)).map(c=>({id:c.id,key:q.operatingPatternKey(c),origin:c.originId}))},id);
  assert(choices.length,id+' has no choices');
  for(const choice of (process.env.UK_SKIP_GAMEPLAY?[]:choices)){
   console.log("Testing",id,choice.id);
   const result=await page.evaluate(async({id,choice})=>{const q=__UK_QA__;q.game.stop(false);q.go('rail-map');await q.chooseRoute(id);q.openSetup(q.routes().find(r=>r.id===id));const pattern=document.querySelector('#journey-pattern');pattern.value=choice.key;pattern.dispatchEvent(new Event('change',{bubbles:true}));const dir=document.querySelector('#journey-direction');dir.value=choice.id;dir.dispatchEvent(new Event('change',{bubbles:true}));const origin=document.querySelector('#journey-origin');const opt=[...origin.options].find(o=>o.value===choice.origin||o.value.endsWith(choice.origin));if(opt)origin.value=opt.value;origin.dispatchEvent(new Event('change',{bubbles:true}));const destination=document.querySelector('#journey-destination');if(![...destination.options].some(o=>o.value===choice.id))throw Error('UI_DIRECTION_MISSING:'+choice.id+JSON.stringify({pattern:pattern.value,expected:choice.key,direction:dir.value,origin:origin.value,options:[...destination.options].map(o=>[o.value,o.text])}));destination.value=choice.id;destination.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#game-map-mode').value='geographic';document.querySelector('#setup-form').requestSubmit();if(document.body.dataset.currentScreen!=='game')throw Error('GAME_NOT_STARTED:'+id);
    const g=q.game;g.options.motion=id==='uk-waterloo-city';g.options.stationAdvance="auto";let final=null;const old=g.onFinish;g.onFinish=r=>{final=r;old(r)};
    try{for(let i=0;i<g.sequence.length*3+3&&!g.finished;i++){
     if(g.phase==='ARRIVING'){await g.arrivalPromise;await new Promise(r=>setTimeout(r,0));continue}
     if(g.phase!=='TYPING')throw Error('WRONG_PHASE:'+g.phase);
     const station=g.targetStation(),input=document.querySelector('#typing-input'),answer=q.buildTypingModel(station.ko).inputText;if(!/[가-힣]/.test(answer))throw Error('NON_KOREAN_TARGET');
     input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value=answer;input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}));input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:answer}));await Promise.resolve();await new Promise(r=>setTimeout(r,0));
    }
    if(!g.finished||!final?.routeIntegrity)throw Error('INCOMPLETE:'+id+':'+g.phase+':'+g.index);
    return{lineId:id,serviceId:choice.id,typedStops:final.completed,geometryPoints:g.mapRoute.geometry.length,destination:g.sequence.at(-1).ko,status:'PASS'};
    }finally{g.onFinish=old}
   },{id,choice});report.runs.push(result);
  }
 }
 if(JSON.parse(fs.readFileSync(path.join(root,'data/uk/generated/index.json'))).routes.every(r=>r.geometryFiles)){
  assert(!geometryRequests.includes('/data/uk/generated/geometry.json'),'full UK geometry pool fetched during line selection');assert.equal(geometryRequests.length,new Set(geometryRequests).size,'shared geometry partition requested more than once');
  report.geometryLoading={status:'PASS',files:geometryRequests.length,wholePoolRequested:false,duplicateRequests:0};
 }
 // Full UK network loads lazily only when free driving is requested.
 await page.evaluate(async()=>{const q=__UK_QA__;q.go('rail-map');await q.chooseRoute('uk-bakerloo');await q.startFreeDrive(q.routes().find(r=>r.id==='uk-bakerloo'))});
 report.freeDrive.push(await page.evaluate(()=>{const q=__UK_QA__,before=q.freeDrive.snapshot();if(!before?.edges?.length)throw Error('NO_FREE_DRIVE_EDGES');const edge=before.edges.find(e=>e.direction>0)||before.edges[0],moved=q.freeDrive.moveTo(edge.to,edge.routeId,edge.fromKey);if(!moved)throw Error('FREE_DRIVE_MOVE_FAILED');return{status:'PASS',routes:q.freeDrive.routes.length,edgeCount:before.edges.length}}));
 await page.screenshot({path:path.join(out,'free-drive-desktop.png'),fullPage:true});
 report.freeDriveProgression=await page.evaluate(()=>{const f=__UK_QA__.freeDrive,render=f.render,emit=f.emit;let directions=0,transitions=0;try{f.render=()=>{};f.emit=()=>{};for(const route of f.routes){if(route.countryId!=='uk')continue;if(!f.start(route))throw Error('FREE_DRIVE_START:'+route.id);for(let i=1;i<route.stations.length;i++){const edge=f.current()?.edges.find(e=>e.routeId===route.id&&e.direction===1&&e.index===i);if(!edge||!f.moveTo(edge.to,route.id,f.currentKey))throw Error('FREE_DRIVE_SEQUENCE:'+route.id+':'+i);if(f.snapshot().station.id!==route.stations[i].id)throw Error('FREE_DRIVE_TARGET:'+route.id+':'+i);transitions++}directions++}return{status:'PASS',directions,transitions}}finally{f.render=render;f.emit=emit}});
 // Name editing uses the existing country table, and every station is listed.
 await page.goto(base+'/reports/korean-names/editor.html?country=uk');await page.waitForFunction(()=>document.querySelector('#table tbody tr'));await page.waitForFunction(()=>[...document.querySelectorAll('#table input')].some(i=>i.value==='런던 지하철'));
 await page.locator('[data-file="stations-by-line"]').click();await page.locator('#route-filter').selectOption('uk-circle');await page.waitForFunction(()=>[...document.querySelectorAll('#table input')].some(i=>i.value==='패딩턴'));await page.screenshot({path:path.join(out,'name-editor.png'),fullPage:true});
 report.editorOverrides=await require('./lib/uk-editor-browser.cjs')(browser,base,root,configurePage);
 for(const country of ['jp','kr','hk','th','tw']){await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__UK_QA__?.routes().length>0);await page.locator('button[data-country="'+country+'"]').click();await page.waitForFunction(c=>globalThis.__UK_QA__?.routes().length>0&&globalThis.__UK_QA__.routes().every(r=>r.countryId===c),country,{timeout:60000});const count=await page.evaluate(()=>__UK_QA__.routes().length);report.regressions.push({country,status:'PASS',routes:count})}
 await page.evaluate(()=>localStorage.setItem('trt-country','uk'));await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__UK_QA__?.routes().some(r=>r.id==='uk-bakerloo'));await page.setViewportSize({width:390,height:844});await page.evaluate(async()=>{const q=__UK_QA__;await q.chooseRoute('uk-piccadilly');q.openSetup(q.routes().find(r=>r.id==='uk-piccadilly'))});await page.screenshot({path:path.join(out,'mobile-setup.png'),fullPage:true});await page.evaluate(()=>document.querySelector('#setup-form').requestSubmit());await page.waitForFunction(()=>document.body.dataset.currentScreen==='game'&&globalThis.__TRT_MAP_DEBUG__?.trainMarkers===1);await page.waitForTimeout(2200);await page.screenshot({path:path.join(out,'mobile-nameboard.png'),fullPage:true});report.nameboard=await page.evaluate(()=>({style:document.querySelector('#station-sign').dataset.signStyle,clipped:[...document.querySelectorAll('#station-sign h1,#station-sign .prompt-ko')].some(e=>e.scrollWidth>e.clientWidth+2),map:globalThis.__TRT_MAP_DEBUG__}));assert(!report.nameboard.clipped);await page.evaluate(()=>__UK_QA__.game.stop(false));
 report.regionalNameboards=[];
 for(const id of ['uk-metrolink','uk-west-midlands-metro','uk-blackpool-tramway','uk-net-hucknall-toton','uk-lner-east-coast','uk-scotrail-shotts']){
  if(!ids.includes(id))continue;
  await page.evaluate(async id=>{const q=__UK_QA__;q.go('rail-map');await q.chooseRoute(id);q.openSetup(q.routes().find(r=>r.id===id));document.querySelector('#setup-form').requestSubmit();q.game.options.motion=false},id);
  const board=await page.evaluate(()=>{const sign=document.querySelector('#station-sign'),input=document.querySelector('#typing-input'),a=sign.getBoundingClientRect(),b=input.getBoundingClientRect();return{style:sign.dataset.signStyle,clipped:[...sign.querySelectorAll('h1,.prompt-ko,.prompt-romaji')].some(e=>e.scrollWidth>e.clientWidth+2),overlap:[...sign.querySelectorAll('h1,.prompt-ko,.prompt-romaji,.station-sign-brand,.station-sign-strip')].some(e=>{const a=e.getBoundingClientRect();return a.width>0&&a.height>0&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top})}});
  assert(!board.clipped,id+' clips bilingual text');assert(!board.overlap,id+' obscures typing area');report.regionalNameboards.push({lineId:id,...board,status:'PASS'});
  await page.screenshot({path:path.join(out,'mobile-'+id+'.png'),fullPage:true});await page.evaluate(()=>__UK_QA__.game.stop(false));
 }
 assert.equal(report.errors.length,0,report.errors.join('\n'));report.status='PASS';
}catch(e){report.error=e.stack;process.exitCode=1}finally{fs.writeFileSync(path.join(out,process.env.UK_SKIP_GAMEPLAY?'browser-ui-tests.json':'browser-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,runs:report.runs.length},null,2));await browser.close();server.close()}
})();
