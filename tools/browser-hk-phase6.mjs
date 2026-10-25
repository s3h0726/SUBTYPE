// Invoke inside cua_repl with its already selected tab; no separate browser driver.
import fs from 'node:fs/promises';
const read=async(root,file)=>JSON.parse(await fs.readFile(root+'/'+file,'utf8'));
export async function start(tab,root,id,{mode='normal',advance='AUTO'}={}){
 const r=await read(root,'data/hk/generated/routes/'+id+'.json');let state=await tab.playwright.domSnapshot();
 if(state.includes('button "× 종료"')){await tab.playwright.getByRole('button',{name:'× 종료',exact:true}).press('Enter');state=await tab.playwright.domSnapshot()}
 if(state.includes('heading "운행 완료!"'))await tab.playwright.getByRole('button',{name:'CHANGE LINE · 다른 노선',exact:true}).press('Enter');
 else if(!state.includes('heading "노선 선택"'))await tab.playwright.getByRole('navigation',{name:'주 메뉴'}).getByRole('button',{name:'PLAY',exact:true}).press('Enter');
 await tab.playwright.getByRole('searchbox',{name:'⌕',exact:true}).fill(r.line.ko);await tab.playwright.domSnapshot();
 if(r.canonicalLineId==='hk-tramway'){
 await tab.playwright.locator('[data-hk-tram-family]').press('Enter');await tab.playwright.domSnapshot();
 await tab.playwright.getByRole('button',{name:'PLAY THIS LINE →',exact:true}).press('Enter');
 await tab.playwright.getByRole('combobox',{name:'운행 구간',exact:true}).waitFor({state:'visible'});
 await tab.playwright.getByRole('combobox',{name:'운행 구간',exact:true}).selectOption(r.tramServiceGroup);
 await tab.playwright.getByRole('combobox',{name:'방향',exact:true}).selectOption(r.id);
 await tab.playwright.getByRole('combobox',{name:'출발 정류장',exact:true}).selectOption({label:r.stations[0].ko});
 }else{
 await tab.playwright.locator('[data-hk-line-family="'+r.canonicalLineId+'"]').press('Enter');await tab.playwright.domSnapshot();
 await tab.playwright.getByRole('button',{name:'PLAY THIS LINE →',exact:true}).press('Enter');
 await tab.playwright.getByRole('combobox',{name:'운행계통',exact:true}).waitFor({state:'visible'});
 const group=[r.stations[0].id,r.stations.at(-1).id].sort().join(':');
 await tab.playwright.getByRole('combobox',{name:'운행계통',exact:true}).selectOption(group);
 await tab.playwright.getByRole('combobox',{name:'방향',exact:true}).selectOption(r.id);
 }
 await tab.playwright.getByRole('radio',{name:mode==='memory'?'암기 번체중문·영문만 보고 입력':'일반 · 따라쓰기 한국어 정답을 보고 입력',exact:true}).press('Space');
 await tab.playwright.getByRole('radio',{name:advance==='SPACE'?'SPACE · 확인 후 이동':'AUTO · 자동 이동',exact:true}).press('Space');
 const setup=await tab.playwright.domSnapshot();if(!setup.includes(r.stations[0].ko+' 출발')||!setup.includes(r.stations.at(-1).ko+' 행선지')||!setup.includes(r.stations.length+' STATIONS'))throw Error('Setup endpoints mismatch '+id);
 if(r.validWhen?.noteKo&&!setup.includes(r.validWhen.noteKo))throw Error('Operating condition notice missing '+id);await fs.writeFile(root+'/output/hk/phase6/'+id+'-setup.json',JSON.stringify({setup,conditionFingerprint:r.operatingConditionFingerprint||null},null,2));
 await tab.playwright.getByRole('button',{name:'운행 시작 →',exact:true}).press('Enter');await tab.playwright.locator('#typing-input').waitFor({state:'visible',timeoutMs:15000});return setup;
}
export async function finish(tab,root,id,{mode='normal',advance='AUTO',resume=false,inputStyle='burst',stopLimit=Infinity}={}){
 const r=await read(root,'data/hk/generated/routes/'+id+'.json'),progressFile='output/hk/phase6/'+id+'-progress.json';
 const p=resume?await read(root,progressFile):{serviceId:id,status:'RUNNING',fingerprint:r.validationFingerprint,conditionFingerprint:r.operatingConditionFingerprint||null,checkedAt:new Date().toISOString(),stationCount:r.stations.length,mode,advance,inputStyle,dataReleaseStatusAtRun:r.releaseStatus,viewport:await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight,theme:document.documentElement.dataset.theme})),reducedMotion:false,steps:[]};
 if(p.fingerprint!==r.validationFingerprint)throw Error('Changed data during browser validation');
 const end=Math.min(r.stations.length,p.steps.length+stopLimit);
 for(let i=p.steps.length;i<end;i++){
  const stop=r.stations[i];let shown,observed;
  for(let retry=0;retry<100;retry++){observed=await tab.playwright.evaluate(()=>({shown:document.querySelector('#prompt-main')?.textContent,ko:document.querySelector('#prompt-ko')?.textContent,advanceMs:document.body.dataset.autoAdvanceMs,transition:JSON.parse(document.body.dataset.autoTransition||'null')}));shown=observed.shown;if(shown===stop.ja)break}
  if(shown!==stop.ja)throw Error('Unexpected visible stop '+id+' '+i+': '+shown);
  const korean=observed.ko;if(korean!==(mode==='memory'?'정답 비공개':stop.ko))throw Error('Korean visibility mismatch '+id+' '+i);
  if(i&&advance==='AUTO'){p.steps[i-1].advanceMs=observed.advanceMs;p.steps[i-1].transition=observed.transition;}
  const input=tab.playwright.getByRole('textbox',{name:/^한국어 (역 이름|정류장 이름) 입력/});
  if(inputStyle==='sequential')await input.pressSequentially(stop.ko);else await input.fill(stop.ko);
  if(advance==='SPACE')await input.press('Space');
  p.steps.push({order:i,id:stop.id,zh:stop.ja,ko:stop.ko,shown:true,koreanVisible:mode!=='memory',entered:true,errorsAfterInput:await tab.playwright.locator('#error-count').textContent()});
  await fs.writeFile(root+'/'+progressFile,JSON.stringify(p,null,2)+'\n');
 }
 if(p.steps.length<r.stations.length)return{id,status:'RUNNING',completed:p.steps.length,total:r.stations.length};
 await tab.playwright.getByRole('heading',{name:'운행 완료!',exact:true}).waitFor({state:'visible',timeoutMs:15000});
 p.resultSnapshot=await tab.playwright.domSnapshot();if(!p.resultSnapshot.includes('100.0%'))throw Error('Not clean completion '+id);
 p.status='PASS';p.timing=advance==='AUTO'?await tab.playwright.evaluate(()=>({advanceMs:document.body.dataset.autoAdvanceMs,arrivalMs:document.body.dataset.autoArrivalMs})):null;
 if(advance==='AUTO')p.steps.at(-1).transition=await tab.playwright.evaluate(()=>JSON.parse(document.body.dataset.autoTransition||'null'));
 p.screenshot='output/hk/phase6/'+id+'-result.jpg';await fs.writeFile(root+'/'+p.screenshot,await tab.screenshot({fullPage:false}));
 const file='reports/hong-kong/phase6/browser-runs.json';let runs=[];try{runs=await read(root,file)}catch{}
 const historyFile=root+'/reports/hong-kong/phase6/browser-history.json';let history=[];try{history=JSON.parse(await fs.readFile(historyFile,'utf8'))}catch{}history.push(p);await fs.writeFile(historyFile,JSON.stringify(history,null,2)+'\n');runs=runs.filter(p=>p.serviceId!==id);runs.push(p);await fs.writeFile(root+'/'+file,JSON.stringify(runs,null,2)+'\n');
 return{id,stops:p.stationCount,status:p.status,timing:p.timing};
}
async function displayed(tab,selector,text){let value;for(let i=0;i<120;i++){value=await tab.playwright.locator(selector).textContent();if(value===text)return}throw Error('Expected visible '+selector+' '+text+', got '+value)}
export async function freeStart(tab,root,id){
 const r=await read(root,'data/hk/generated/routes/'+id+'.json');let state=await tab.playwright.domSnapshot();
 if(state.includes('button "× 종료"')){await tab.playwright.getByRole('button',{name:'× 종료',exact:true}).press('Enter');state=await tab.playwright.domSnapshot()}
 if(state.includes('heading "운행 완료!"'))await tab.playwright.getByRole('button',{name:'CHANGE LINE · 다른 노선',exact:true}).press('Enter');
 else if(!state.includes('heading "노선 선택"'))await tab.playwright.getByRole('navigation',{name:'주 메뉴'}).getByRole('button',{name:'PLAY',exact:true}).press('Enter');
 await tab.playwright.getByRole('searchbox',{name:'⌕',exact:true}).fill(r.line.ko);await tab.playwright.domSnapshot();
 await tab.playwright.locator('[data-hk-line-family="'+r.canonicalLineId+'"]').press('Enter');await tab.playwright.domSnapshot();
 await tab.playwright.locator('#selected-line-preview [data-route="'+r.id+'"]').press('Enter');await tab.playwright.domSnapshot();
 await tab.playwright.getByRole('button',{name:'FREE DRIVE ↗',exact:true}).press('Enter');
 await tab.playwright.locator('#typing-input').waitFor({state:'visible',timeoutMs:15000});
 await displayed(tab,'#prompt-main',r.stations[0].ja);return r;
}
export async function transfer(tab,root,{from,to,stationId,toStationId=stationId,roundTrip=true}){
 const source=await freeStart(tab,root,from),destination=await read(root,'data/hk/generated/routes/'+to+'.json'),at=source.stations.findIndex(s=>s.id===stationId),targetAt=destination.stations.findIndex(s=>s.id===toStationId);
 if(at<0||targetAt<0)throw Error('Missing reviewed transfer identity');
 const proof={from,to,stationId,toStationId,checkedAt:new Date().toISOString(),status:'RUNNING',approach:[],tabChanges:[],completion:[],coordinateCheck:'Exact route-stop geometry vertices verified separately in automated tests. Browser verifies current map label, new route brand and first typing prompt; numeric train coordinates are not read from hidden application state.'};
 if(at>0)for(let i=0;i<=at;i++){const stop=source.stations[i];await displayed(tab,'#prompt-main',stop.ja);await tab.playwright.locator('#typing-input').fill(stop.ko);proof.approach.push({id:stop.id,ko:stop.ko});}
 await displayed(tab,'#map-station-info b',source.stations[at].ja);
 const switchByTab=async id=>{let active;for(let count=0;count<24;count++){active=await tab.playwright.locator('#game-free-drive-tabs button.active').getAttribute('data-free-drive-tab');if(active===id)break;await tab.playwright.locator('#typing-input').press('Tab');await tab.playwright.domSnapshot();}if(active!==id)throw Error('TAB failed to select '+id);const stop=(id===from?source:destination).stations.find(s=>s.id===(id===from?stationId:toStationId));await displayed(tab,'#prompt-main',stop.ja);await displayed(tab,'#prompt-ko',stop.ko);const value=await tab.playwright.locator('#typing-input').getAttribute('readonly');if(value!==null)throw Error('Transfer start not editable');proof.tabChanges.push({routeId:id,stationId,shown:stop.ja,ko:stop.ko,firstAnswerIsTransferStation:true,mapLabel:await tab.playwright.locator('#map-station-info b').textContent()});};
 await switchByTab(to);if(roundTrip){await switchByTab(from);await switchByTab(to)}
 proof.transferSnapshot=await tab.playwright.domSnapshot();proof.transferScreenshot='output/hk/phase6/transfer-'+from+'-'+to+'.jpg';await fs.writeFile(root+'/'+proof.transferScreenshot,await tab.screenshot({fullPage:false}));
 for(let i=targetAt;i<destination.stations.length;i++){const stop=destination.stations[i];await displayed(tab,'#prompt-main',stop.ja);await tab.playwright.locator('#typing-input').fill(stop.ko);proof.completion.push({id:stop.id,ko:stop.ko});}
 await displayed(tab,'#station-context','종착역 도착 · 자유주행');
 await displayed(tab,'#map-station-info b',destination.stations.at(-1).ja);
 proof.terminalSnapshot=await tab.playwright.domSnapshot();proof.terminal=destination.stations.at(-1).id;proof.status='PASS';
 proof.terminalScreenshot='output/hk/phase6/terminal-'+from+'-'+to+'.jpg';await fs.writeFile(root+'/'+proof.terminalScreenshot,await tab.screenshot({fullPage:false}));
 const file='reports/hong-kong/phase6/browser-transfers.json';let proofs=[];try{proofs=await read(root,file)}catch{}proofs=proofs.filter(p=>p.from!==from||p.to!==to);proofs.push(proof);await fs.writeFile(root+'/'+file,JSON.stringify(proofs,null,2)+'\n');return{from,to,stationId,status:proof.status,tabSwitches:proof.tabChanges.length,completedStops:proof.completion.length};
}
export async function noTransfer(tab,root){
 const r=await freeStart(tab,root,'hk-south-island-ut');for(const stop of r.stations.slice(0,2)){await displayed(tab,'#prompt-main',stop.ja);await tab.playwright.locator('#typing-input').fill(stop.ko)}
 await displayed(tab,'#map-station-info b',r.stations[1].ja);
 const observe=()=>tab.playwright.evaluate(()=>({prompt:document.querySelector('#prompt-main')?.textContent,map:document.querySelector('#map-station-info b')?.textContent,line:document.querySelector('#game-line-name')?.textContent,progress:document.querySelector('#hud-progress')?.textContent}));
 const before=await observe();await tab.playwright.locator('#typing-input').press('Tab');const snapshot=await tab.playwright.domSnapshot(),after=await observe();
 if(JSON.stringify(before)!==JSON.stringify(after))throw Error('TAB changed game state at a non-transfer stop');
 const proof={checkedAt:new Date().toISOString(),stationId:r.stations[1].id,status:'PASS',before,after,snapshot};await fs.writeFile(root+'/reports/hong-kong/phase6/browser-no-transfer.json',JSON.stringify(proof,null,2)+'\n');return proof;
}
