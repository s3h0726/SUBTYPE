const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
module.exports=async function verifyUKEditor(browser,base,root,configurePage=async()=>{}){
 const page=await browser.newPage(),raw=JSON.parse(fs.readFileSync(path.join(root,'data/uk/generated/routes/uk-bakerloo.json'))),pattern=raw.patterns[0],stationId=pattern.stationIds[0];
 await configurePage(page);
 const edits={operators:{[raw.operatorId]:'운영사 편집 검증'},lines:{[raw.id]:{ko:'노선 편집 검증'}},services:{[pattern.id]:'계통 편집 검증'},stations:{[raw.id]:{[stationId]:'공통역 편집 검증'}}};
 await page.route('**/data/editor-overrides.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(edits)}));
 await page.addInitScript(()=>localStorage.setItem('trt-country','uk'));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.__UK_QA__?.routes().some(r=>r.id==='uk-bakerloo'));
  assert((await page.locator('#operator-filters').innerText()).includes('운영사 편집 검증'));
  assert((await page.locator('[data-route="uk-bakerloo"]').innerText()).includes('노선 편집 검증'));
  const result=await page.evaluate(async({stationId,patternId})=>{const q=__UK_QA__;await q.chooseRoute('uk-bakerloo');const route=q.routes().find(r=>r.id==='uk-bakerloo');q.openSetup(route);const choice=q.actualOperatingChoices(route).find(c=>c.id===patternId);if(choice.patternName.ko!=='계통 편집 검증')throw Error('SERVICE_EDIT_MISSING');const resolved=q.resolveOperatingChoice(choice,route);if(resolved.route.stations[0].ko!=='공통역 편집 검증')throw Error('STATION_EDIT_MISSING');document.querySelector('#setup-form').requestSubmit();const g=q.game;if(g.sequence[0].ko!=='공통역 편집 검증'||!g.answerValues(g.targetStation()).some(s=>s.replace(/\s/g,'')==='공통역편집검증'))throw Error('GAME_ANSWER_EDIT_MISSING');g.stop(false);await q.startFreeDrive(route);if(q.freeDrive.snapshot().station.ko!=='공통역 편집 검증')throw Error('FREE_DRIVE_EDIT_MISSING');return{status:'PASS',operator:true,line:true,service:true,station:true,gameAnswer:true,freeDrive:true};},{stationId,patternId:pattern.id});
  return result;
 }finally{await page.close()}
};
