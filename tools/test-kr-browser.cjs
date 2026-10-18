#!/usr/bin/env node
'use strict';
// Local diagnostics for source candidates. This never approves/publishes data.
// PLAYWRIGHT_MODULE may point to an already installed Playwright package.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {load,validate,assemble}=require('./lib/kr-network');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),data=load(base),{maps,errors}=validate(data,{base});
assert.deepEqual(errors,[]);
const all=process.argv.includes('--all-assemblable'),excludedTopology=[];
const selected=process.argv.find(a=>a.startsWith('--services='))?.slice(11).split(',');
const ids=selected||(all?data.services.flatMap(s=>{if(s.access?.passengerCandidate===false){excludedTopology.push({serviceId:s.id,reason:s.access.classification});return[]}try{assemble(s,maps);return[s.id.replace('kr-osm-service-','')]}catch(e){excludedTopology.push({serviceId:s.id,reason:e.message});return[]}}):['15833659','15870296','15870297','15870344']);
if(process.argv.includes('--interactive-all')&&(!selected||selected.length>10))throw Error('INTERACTIVE_ALL_REQUIRES_EXPLICIT_SMALL_SERVICE_LIST');
const candidates=ids.map(id=>{
 const s=maps.services.get('kr-osm-service-'+id),line=maps['passenger-lines'].get(s.passengerLineId),op=maps.operators.get(s.operatorIds[0]);
 return {id:s.id,countryId:'kr',schemaVersion:2,releaseStatus:'candidate',operatorId:op?.id||'unverified',operator:{...op?.names,ja:op?.names.ko||''},line:{...line.names,ja:line.names.ko},lineColor:line.color||'#126499',geometryReady:true,geometryStatus:'ready',...assemble(s,maps),services:[{id:s.id,nameKo:s.names.ko,stops:s.stops.map(c=>maps.stops.get(c.stopId).stationId)}]};
});
const inputs=['js/app.bundle.js','data/kr/v2/services.json','data/kr/v2/geometry.json'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
const qaBundle=fs.readFileSync(path.join(root,'js/app.bundle.js'),'utf8');
const hook=`
globalThis.__KR_BROWSER_QA__={game,go,storage,renderStats,renderGameMap,buildTypingModel,railDataRepository,freeDrive,FreeDrive,RouteEditor,hydrateRailLine,startFreeDrive,renderGameFreeDriveOptions,mapState:()=>gameRail};
`;
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 if(relative==='__qa-candidates.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(candidates));return}
 try{
  let body=fs.readFileSync(file);
  if(relative==='js/app.bundle.js')body=qaBundle.replace('\n})().catch',hook+'\n})().catch');
  res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body);
 }catch{res.writeHead(404).end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 let browser=await chromium.launch({headless:true});const results=[],transportRestarts=[];
 try{
  const batchSize=24;
  const batches=[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]].flatMap(([device,viewport])=>Array.from({length:Math.ceil(candidates.length/batchSize)},(_,batch)=>({device,viewport,start:batch*batchSize,end:(batch+1)*batchSize})));
  for(const {device,viewport,start,end} of batches){
   let context,page;const pageErrors=[];
   for(let attempt=0;attempt<3;attempt++){
    context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile'});page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
    try{await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!globalThis.__KR_BROWSER_QA__,{timeout:60000});break}
    catch(error){if(!String(error.message).includes('ERR_NETWORK_IO_SUSPENDED')||attempt===2)throw error;transportRestarts.push({device,batchStart:start,attempt:attempt+1,error:'ERR_NETWORK_IO_SUSPENDED'});await context.close();await browser.close();browser=await chromium.launch({headless:true})}
   }
   await page.locator('[data-country="kr"]').click({noWaitAfter:true});await page.waitForFunction(()=>document.readyState!=='loading'&&!!globalThis.__KR_BROWSER_QA__&&document.documentElement.dataset.country==='kr');
   await page.locator('[data-country="jp"]').click({noWaitAfter:true});await page.waitForFunction(()=>document.readyState!=='loading'&&!!globalThis.__KR_BROWSER_QA__&&document.documentElement.dataset.country==='jp');
   const runs=await page.evaluate(async({start,end})=>{
    const qa=globalThis.__KR_BROWSER_QA__,routes=(await(await fetch('/__qa-candidates.json')).json()).slice(start,end),results=[];
    for(const route of routes){
     let finished=0,result;const original=qa.game.onFinish;qa.game.onFinish=r=>{finished++;result=r;original(r)};
     try{
      const journey={id:route.id,baseRouteId:route.id,originStationId:route.stations[0].id,destinationStationId:route.stations.at(-1).id,directionId:route.id,originNames:route.stations[0],destinationNames:route.stations.at(-1)};
      if(!qa.game.start(route,{mode:'complete',stationAdvance:'auto',service:route.services[0].id,serviceJourney:journey,destinationStationId:journey.destinationStationId,motion:false,sound:false}))throw Error('START_FAILED');qa.go('game');
      for(let i=0;i<route.stations.length;i++){
       const target=qa.game.targetStation();if(target?.id!==route.stations[i].id)throw Error('WRONG_TARGET:'+i);
       if(document.querySelector('#prompt-main').textContent!==target.ko)throw Error('WRONG_SIGN:'+i);
       const input=document.querySelector('#typing-input'),answer=qa.buildTypingModel(target.ko).inputText;if(!answer)throw Error('EMPTY_TYPING_TARGET');
       input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
       // Hangul composition is fed in incremental NFD units, then committed.
       let value='';for(const unit of answer.normalize('NFD')){value+=unit;input.value=value.normalize('NFC');input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}))}
       input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:answer}));await Promise.resolve();await Promise.resolve();
       if(i&&qa.game.routeIndex(qa.game.currentStation())!==i)throw Error('WRONG_MAP_VISIT:'+i);
      }
      qa.game.finish();if(finished!==1||!result?.routeIntegrity||result.completed!==route.stations.length)throw Error('FINISH_INTEGRITY');
      if(result.serviceJourneyId!==route.id||result.destinationStationId!==route.stations.at(-1).id)throw Error('WRONG_RESULT_CONTEXT');
      await qa.renderGameMap(qa.game.mapRoute,qa.game.index,qa.game.mapOptions());
      if(globalThis.__TRT_MAP_DEBUG__?.routeId!==route.id||globalThis.__TRT_MAP_DEBUG__?.trainMarkers!==1)throw Error('MAP_NOT_RENDERED');
      qa.renderStats();if(!document.querySelector('#records-table').textContent.includes(route.stations.at(-1).ko))throw Error('RECORD_DESTINATION_MISSING');
      results.push({serviceId:route.id,status:'PASS',stops:route.stations.length,geometryPoints:route.geometry.length});
     }catch(e){results.push({serviceId:route.id,status:'FAIL',error:e.message})}finally{qa.game.onFinish=original}
     await new Promise(resolve=>setTimeout(resolve,0));
    }
    return results;
   },{start,end});
   if((process.argv.includes('--interactive')||process.argv.includes('--interactive-all'))&&start===0){
    for(const motionServiceId of process.argv.includes('--interactive-all')?candidates.map(r=>r.id):[undefined]){
     const interactive=await require('./kr-browser-interactive.cjs')(page,{motionServiceId});results.push({device,interactive,runs:[],pageErrors:[]});console.log(JSON.stringify({device,interactive}));
    }
   }
   await page.evaluate(()=>{
    const qa=globalThis.__KR_BROWSER_QA__;qa.renderStats();const header=document.querySelector('.record-row.header'),original=document.documentElement.dataset.theme;
    const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(x=>{const n=Number(x)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
    for(const theme of ['light','dark']){document.documentElement.dataset.theme=theme;const style=getComputedStyle(header),a=luminance(style.color),b=luminance(style.backgroundColor);if((Math.max(a,b)+.05)/(Math.min(a,b)+.05)<4.5)throw Error('RECORD_HEADER_CONTRAST:'+theme)}document.documentElement.dataset.theme=original;
   });
   if(process.env.KR_BROWSER_SCREENSHOTS&&start===0){await page.evaluate(()=>globalThis.__KR_BROWSER_QA__.go('stats'));await page.screenshot({path:path.join(process.env.KR_BROWSER_SCREENSHOTS,device+'-records.png'),fullPage:true})}
   results.push({device,viewport,batchStart:start,runs,pageErrors});console.log(JSON.stringify({device,batchStart:start,pass:runs.filter(r=>r.status==='PASS').length,fail:runs.filter(r=>r.status==='FAIL').length}));await context.close();
  }
 }finally{await browser.close();server.close()}
 for(const input of inputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,input.file))).digest('hex'),input.sha256,'INPUT_CHANGED_DURING_BROWSER_QA:'+input.file);
 const report={status:results.every(r=>!r.pageErrors.length&&r.runs.every(t=>t.status==='PASS'))?'PASS':'FAIL',scope:'Unapproved source candidate diagnostics; not national completion, verified timetable, transfer or release approval',limitations:['Synthetic composition events, not physical device IME','Motion disabled for batch traversal; animation timing not certified','TAB transfers and official timetable applicability not certified'],testedAt:new Date().toISOString(),inputs,transportRestarts,excludedTopology,results};
 console.log(JSON.stringify(report,null,2));if(process.env.KR_BROWSER_REPORT)fs.writeFileSync(process.env.KR_BROWSER_REPORT,JSON.stringify(report,null,2)+'\n');if(report.status!=='PASS')process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
