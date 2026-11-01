const assert=require('node:assert/strict'),path=require('node:path');
async function visibleChinese(page,selector){
 await page.waitForFunction(selector=>[...document.querySelectorAll(selector)].some(el=>el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true})&&/[\p{Script=Han}]/u.test(el.textContent)),selector,{timeout:8000});
 const result=await page.locator(selector).evaluateAll(nodes=>nodes.map(el=>({text:el.textContent,visible:el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}),size:parseFloat(getComputedStyle(el).fontSize),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 assert(result.length,'Missing '+selector);assert(result.some(r=>r.visible&&r.width>0&&r.height>0&&/[\p{Script=Han}]/u.test(r.text)),JSON.stringify({selector,result}));return result;
}
async function catalog(page,report){
 report.multilingual={catalog:await page.evaluate(()=>{const q=globalThis.__TW_QA__,cards=[...document.querySelectorAll('.tw-line-card')];if(cards.length!==38)throw Error('Expected 38 bilingual cards');for(const c of cards){const r=q.routes().find(r=>r.id===c.dataset.route),zh=c.querySelector('h3 .tw-zh');if(!zh||zh.textContent!==r.line.zh||!zh.checkVisibility({checkVisibilityCSS:true}))throw Error('Chinese card hidden '+r.id);if(!c.querySelector('[data-operator-logo] img'))throw Error('Missing official logo '+r.id);}return{cards:cards.length,operators:document.querySelectorAll('#operator-filters [data-operator]:not([data-operator="all"])').length}}),operators:[]};
 await page.locator('#route-search').fill('文湖線');await page.waitForFunction(()=>document.querySelectorAll('.tw-line-card').length===1&&document.querySelector('.tw-line-card').dataset.route==='tw-trtc-wenhu');await page.locator('#route-search').fill('');await page.waitForFunction(()=>document.querySelectorAll('.tw-line-card').length===38);report.multilingual.chineseSearch='PASS';
 await visibleChinese(page,'#operator-filters .tw-zh');await visibleChinese(page,'.tw-line-card .operator .tw-zh');await visibleChinese(page,'.tw-card-direction .tw-zh');
}
async function setup(page,report,lineId,out){
 await visibleChinese(page,'#setup-route h3 .tw-zh');await visibleChinese(page,'#operating-pattern-cards .tw-zh');await visibleChinese(page,'#operating-journey-grid .tw-zh');await visibleChinese(page,'#operating-direction-cards');
 const state=await page.evaluate(()=>{const r=globalThis.__TW_QA__.routes().find(r=>r.id===document.querySelector('#selected-line-preview [data-selected-play]')?.dataset.selectedPlay);return{operator:r.operatorId,lineId:r.id,origin:document.querySelector('#journey-origin').selectedOptions[0].textContent,destination:document.querySelector('#journey-destination').selectedOptions[0].textContent}});
 assert(/[\p{Script=Han}]/u.test(state.origin)&&/[\p{Script=Han}]/u.test(state.destination));
 if(!report.multilingual.operators.includes(state.operator)){await page.screenshot({path:path.join(out,state.operator+'-setup-dark.png'),fullPage:true});}
 return state;
}
async function game(page,report,state,out){
 await page.waitForFunction(()=>document.querySelector('#departure-overlay').hidden);
 await page.evaluate(async()=>{await globalThis.__TW_QA__.game.mapReady});
 await visibleChinese(page,'#prompt-main');await visibleChinese(page,'#game-operator .tw-zh');await visibleChinese(page,'#game-line-name .tw-zh');await visibleChinese(page,'#game-service-name .tw-zh');await visibleChinese(page,'#map-station-info .tw-zh');
 await visibleChinese(page,'.osm-station-label .tw-zh');
 report.multilingual.layout=await page.evaluate(()=>Object.fromEntries(['screen-game','game-operator','game-line-name','game-service-name','prompt-main','prompt-ko','typing-input'].map(id=>{const e=document.getElementById(id),c=getComputedStyle(e),b=e.getBoundingClientRect();return[id,{position:c.position,display:c.display,width:b.width,height:b.height,x:b.x,y:b.y}]})));
 const fonts=await page.evaluate(()=>({zh:parseFloat(getComputedStyle(document.querySelector('#prompt-main')).fontSize),ko:parseFloat(getComputedStyle(document.querySelector('#prompt-ko')).fontSize)}));assert(fonts.zh>fonts.ko,'Traditional Chinese must be the primary station-sign label');
 if(!report.multilingual.operators.includes(state.operator)){report.multilingual.operators.push(state.operator);await page.screenshot({path:path.join(out,state.operator+'-game-dark.png'),fullPage:true});}
}
async function result(page,report,out){await visibleChinese(page,'#result-route .tw-zh');if(!report.multilingual.result){await page.screenshot({path:path.join(out,'result-dark.png'),fullPage:true});report.multilingual.result='PASS'}}
async function extras(page,report,out){
 await page.screenshot({path:path.join(out,'free-drive-dark.png'),fullPage:true});
 await visibleChinese(page,'#game-free-drive-tabs');await visibleChinese(page,'#game-free-drive-options');await visibleChinese(page,'#prompt-main');
 // Standalone panel is a retired hidden screen; exercise the active game free-drive UI above.
 await page.evaluate(()=>{const q=globalThis.__TW_QA__;q.freeDrive.render();if(!/[\p{Script=Han}]/u.test(document.querySelector('#free-drive-station-ja').textContent))throw Error('Legacy free-drive metadata lost Chinese')});
 report.multilingual.transferAndFreeDrive='PASS';
 await page.evaluate(()=>{const q=globalThis.__TW_QA__;q.go('custom-editor');q.editor.createNew();q.editor.renderSearch('動物園')});
 await visibleChinese(page,'#station-search-results .tw-zh');await page.locator('#station-search-results [data-add-master]').first().click();await visibleChinese(page,'#journey-options .tw-zh');await page.locator('#journey-options [data-journey-edge]').first().click();
 await page.evaluate(()=>{const q=globalThis.__TW_QA__,r=q.routes().find(r=>r.id==='tw-trtc-wenhu');q.editor.route.line={...r.line};q.editor.route.operator={...r.operator};q.editor.render()});
 await visibleChinese(page,'#station-editor .tw-zh');await page.screenshot({path:path.join(out,'custom-editor-dark.png'),fullPage:true});
 await page.locator('#save-route').click();await page.evaluate(()=>{globalThis.__TW_QA__.go('custom-list');globalThis.__TW_QA__.renderCustomLibrary()});await visibleChinese(page,'#custom-route-library .tw-zh');report.multilingual.custom='PASS';
 await page.evaluate(()=>globalThis.__TW_QA__.go('records'));await visibleChinese(page,'#records-table .tw-zh');await page.screenshot({path:path.join(out,'records-dark.png'),fullPage:true});report.multilingual.records='PASS';
 await page.evaluate(()=>{const q=globalThis.__TW_QA__;q.go('home')});await visibleChinese(page,'#recent-list .tw-zh');report.multilingual.recent='PASS';
 const fixture=await page.evaluate(()=>{const q=globalThis.__TW_QA__,r=q.routes().find(r=>r.id==='tw-trtc-wenhu'),c=q.actualOperatingChoices(r)[0];return{nickname:'표시 검증',route_id:r.id,route_name:r.line.ko,country_id:'jp',service_key:'journey:'+c.id+'|type:|origin:'+c.originId+'|dest:'+c.destinationId+'|direction:'+c.direction,service_name:c.patternName.ko,cpm:300,accuracy:99,elapsed_ms:30000,completed:24,created_at:'2026-11-01T00:00:00Z'}});
 let queries=0;await page.route('https://tw-ui-test.supabase.co/rest/v1/ranking_best?**',async route=>{assert.equal(route.request().method(),'GET');assert.equal(new URL(route.request().url()).searchParams.get('route_id'),'eq.'+fixture.route_id);queries++;await route.fulfill({json:[fixture]})});
 await page.evaluate(row=>{globalThis.TRT_SUPABASE_CONFIG={url:'https://tw-ui-test.supabase.co',anonKey:'ui-fixture-public-key-for-read-tests'};globalThis.TRTLeaderboard.openRoute(globalThis.__TW_QA__.routes().find(r=>r.id===row.route_id))},fixture);
 await page.waitForFunction(()=>document.querySelector('.ranking-service-group .tw-zh'));
 await visibleChinese(page,'#ranking-line-name .tw-zh');await visibleChinese(page,'#ranking-line-operator .tw-zh');await visibleChinese(page,'.ranking-service-group .tw-zh');assert(queries>=2);await page.screenshot({path:path.join(out,'ranking-dark.png'),fullPage:true});
 report.multilingual.rankings={status:'PASS',source:'Intercepted read-only Supabase-shaped response; no production writes',queries};
 await page.evaluate(()=>{globalThis.__TW_QA__.go('rail-map');document.documentElement.dataset.theme='light'});await page.screenshot({path:path.join(out,'catalog-light.png'),fullPage:true});
 // All 38 actual rendered cards remain readable at mobile width in light mode.
 await page.setViewportSize({width:390,height:844});await visibleChinese(page,'.tw-line-card h3 .tw-zh');
 const clipping=await page.locator('.tw-line-card .tw-zh').evaluateAll(nodes=>nodes.filter(el=>el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1).map(el=>el.textContent));assert.deepEqual(clipping,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:path.join(out,'catalog-mobile-light.png'),fullPage:true});
 await page.evaluate(async()=>{const q=globalThis.__TW_QA__;await q.startFreeDrive(q.routes().find(r=>r.id==='tw-trtc-wenhu'));document.documentElement.dataset.theme='light'});await visibleChinese(page,'#prompt-main');await page.locator('#typing-input').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:path.join(out,'game-mobile-light.png'),fullPage:true});report.multilingual.mobileGame='PASS';
 await page.setViewportSize({width:1440,height:1000});
}
module.exports={catalog,setup,game,result,extras};
