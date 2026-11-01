#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SUBTYPE_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/names/nationwide-20261101');fs.mkdirSync(out,{recursive:true});
const hook='globalThis.__JP_NAME_QA__={game,go,chooseRoute,openSetup,actualOperatingChoices,operatingChoiceStatus,operatingPatternKey,journeyStationKey,freeDrive,freeDriveNetworkRoutes,railDataRepository,buildTypingModel,routes:()=>routes};\n';
const server=http.createServer((req,res)=>{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{let body=fs.readFileSync(file);if(relative==='js/app.bundle.js')body=Buffer.from(body.toString().replace('\n})().catch(error=>','\n'+hook+'})().catch(error=>'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body)}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'}),report={scope:'대표 노선의 실제 UI 선택·합성 한글 IME·실제 게임 엔진. 전국 개별 브라우저 검사는 아님.',runs:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('trt-country','jp');localStorage.setItem('trt:settings',JSON.stringify({theme:'dark',motion:false,sound:false,stationAdvance:'auto'}))});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>globalThis.__JP_NAME_QA__?.routes().some(r=>r.id==='line-99511'),{},{timeout:60000});
 for(const [lineId,wantedDirection] of [['line-99511','forward'],['line-99511','reverse'],['shinkansen-sanyo','forward'],['line-11903','forward'],['line-11801','forward'],['line-11101','forward'],['line-28001','reverse'],['line-99907','forward']]){
  try{
   const setup=await page.evaluate(async({lineId,wantedDirection})=>{const q=globalThis.__JP_NAME_QA__;q.go('rail-map');await q.chooseRoute(lineId);const route=q.routes().find(r=>r.id===lineId),choices=q.actualOperatingChoices(route),playable=choices.filter(c=>q.operatingChoiceStatus(c,route).playable),choice=playable.find(c=>c.direction===wantedDirection)||playable[0];if(!choice)throw Error('NO_PLAYABLE_CHOICE '+lineId);q.openSetup(route);return{lineId,choiceId:choice.id,direction:choice.direction}},{lineId,wantedDirection});
   await page.evaluate(({lineId,choiceId})=>{const q=globalThis.__JP_NAME_QA__,route=q.routes().find(r=>r.id===lineId),choice=q.actualOperatingChoices(route).find(c=>c.id===choiceId);for(const [id,value] of [['journey-pattern',q.operatingPatternKey(choice)],['journey-direction',choice.direction],['journey-origin',q.journeyStationKey(choice.originNames,choice.originId)],['journey-destination',choiceId]]){const input=document.getElementById(id);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('#setup-form').requestSubmit()},setup);
   await page.waitForFunction(()=>document.body.dataset.currentScreen==='game',{},{timeout:15000});
   const run=await page.evaluate(async()=>{
    const q=globalThis.__JP_NAME_QA__,g=q.game;g.options.motion=false;let result=null,count=0;const finish=g.onFinish;g.onFinish=r=>{result=r;count++;finish(r)};
    try{for(let i=0;i<350&&!g.finished;i++){
     if(g.phase==='ARRIVING'){if(await g.arrivalPromise===false)throw Error('ARRIVAL_FAILED');await new Promise(r=>setTimeout(r,0));continue}
     if(g.phase!=='TYPING')throw Error('UNEXPECTED_PHASE '+g.phase);
     const station=g.targetStation();if(document.querySelector('#prompt-ko').textContent!==station.ko)throw Error('VISIBLE_KOREAN_DIFFERS '+station.id);
     const answer=q.buildTypingModel(station.ko).inputText;if(!g.answerValues(station).includes(answer))throw Error('ANSWER_DIFFERS');
     const input=document.querySelector('#typing-input');input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value=answer;input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}));input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:answer}));await new Promise(r=>setTimeout(r,0));
    }
    if(!g.finished||count!==1||!result?.routeIntegrity)throw Error('RESULT_INTEGRITY '+JSON.stringify({phase:g.phase,count,finished:g.finished}));
    return{status:'PASS',lineId:g.route.id,typedStops:result.completed,destination:g.sequence.at(-1).ko,routeIntegrity:result.routeIntegrity,rankingServiceId:result.servicePatternId};
    }finally{g.onFinish=finish}
   });report.runs.push({...run,requestedLine:lineId,requestedDirection:wantedDirection});
  }catch(e){report.runs.push({status:'FAIL',lineId,wantedDirection,error:e.message});await page.evaluate(()=>globalThis.__JP_NAME_QA__.game.stop(false))}
 }
 try{
  report.freeDrive=await page.evaluate(async()=>{const q=globalThis.__JP_NAME_QA__;await q.chooseRoute('line-11502');await q.chooseRoute('line-99511');const route=q.routes().find(r=>r.id==='line-99511'),f=q.freeDrive;f.setNetwork(q.freeDriveNetworkRoutes());f.start(route,0);const before=f.snapshot();if(!before.node.routeIds.has('line-11502'))throw Error('MISSING_OKAZAKI_TRANSFER');if(!f.switchRouteAtCurrentStation('line-11502'))throw Error('TRANSFER_FAILED');const after=f.snapshot();if(after.historyLength!==before.historyLength)throw Error('TRANSFER_ADDED_MOVE');if(!f.switchRouteAtCurrentStation('line-99511'))throw Error('RETURN_TRANSFER_FAILED');q.game.startFreeDrive(f.snapshot());q.go('game');const target=q.game.targetStation();if(!target||!q.game.answerValues(target).includes(q.buildTypingModel(target.ko).inputText))throw Error('FREE_DRIVE_ANSWER');return{status:'PASS',station:before.station.ja,transferTo:after.routeId,nextTarget:target.ko,beforeCoordinates:[before.station.latitude,before.station.longitude],afterCoordinates:[after.station.latitude,after.station.longitude]}});
  report.freeDrive.typing=await page.evaluate(async()=>{const q=globalThis.__JP_NAME_QA__,typed=[];for(let i=0;i<2;i++){const g=q.game,s=g.targetStation(),answer=q.buildTypingModel(s.ko).inputText;typed.push(s.ko);const input=document.querySelector('#typing-input');input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value=answer;input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText'}));input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:answer}));await new Promise(r=>setTimeout(r,350));if(g.arrivalPromise)await g.arrivalPromise}const state=q.freeDrive.snapshot();if(state.historyLength<2)throw Error('FREE_DRIVE_DID_NOT_MOVE');return{status:'PASS',typed,arrived:state.station.ko,historyLength:state.historyLength}});
  await page.screenshot({path:path.join(out,'free-drive.png'),fullPage:true});
 }catch(e){report.freeDrive={status:'FAIL',error:e.message}}
 report.passed=report.runs.filter(r=>r.status==='PASS').length+(report.freeDrive?.status==='PASS'?1:0);report.failed=report.runs.filter(r=>r.status==='FAIL').length+(report.freeDrive?.status==='FAIL'?1:0);report.status=report.failed||report.errors.length?'FAIL':'PASS';
}catch(e){report.status='FAIL';report.errors.push(e.message)}finally{fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close()}
 console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
