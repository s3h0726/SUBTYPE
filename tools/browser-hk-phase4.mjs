// Invoke inside cua_repl with its already selected tab; no separate browser driver.
import fs from 'node:fs/promises';
const read=async(root,file)=>JSON.parse(await fs.readFile(root+'/'+file,'utf8'));
export async function start(tab,root,id,{mode='normal',advance='AUTO'}={}){
 const r=await read(root,'data/hk/generated/routes/'+id+'.json');let state=await tab.playwright.domSnapshot();
 if(state.includes('button "× 종료"')){await tab.playwright.getByRole('button',{name:'× 종료',exact:true}).click();state=await tab.playwright.domSnapshot()}
 if(state.includes('heading "운행 완료!"'))await tab.playwright.getByRole('button',{name:'CHANGE LINE · 다른 노선',exact:true}).click();
 else if(!state.includes('heading "노선 선택"'))await tab.playwright.getByRole('navigation',{name:'주 메뉴'}).getByRole('button',{name:'PLAY',exact:true}).click();
 await tab.playwright.getByRole('searchbox',{name:'⌕',exact:true}).fill(r.line.ko);await tab.playwright.domSnapshot();
 const prefix=r.operator.ko+' '+r.line.ko+' '+r.serviceLabel+' '+r.stations.length+'개 역';
 const pattern=new RegExp('^'+prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' ');
 await tab.playwright.getByRole('button',{name:pattern}).click();await tab.playwright.domSnapshot();
 await tab.playwright.getByRole('button',{name:'PLAY THIS LINE →',exact:true}).click();
 await tab.playwright.getByRole('radio',{name:mode==='memory'?'암기 번체중문·영문만 보고 입력':'일반 · 따라쓰기 한국어 정답을 보고 입력',exact:true}).check();
 await tab.playwright.getByRole('radio',{name:advance==='SPACE'?'SPACE · 확인 후 이동':'AUTO · 자동 이동',exact:true}).check();
 const setup=await tab.playwright.domSnapshot();if(!setup.includes(r.stations[0].ko+' 출발')||!setup.includes(r.stations.at(-1).ko+' 행선지')||!setup.includes(r.stations.length+' STATIONS'))throw Error('Setup endpoints mismatch '+id);
 await tab.playwright.getByRole('button',{name:'운행 시작 →',exact:true}).click();return setup;
}
export async function finish(tab,root,id,{mode='normal',advance='AUTO',resume=false}={}){
 const r=await read(root,'data/hk/generated/routes/'+id+'.json'),progressFile='output/hk/phase4/'+id+'-progress.json';
 const p=resume?await read(root,progressFile):{serviceId:id,status:'RUNNING',fingerprint:r.validationFingerprint,checkedAt:new Date().toISOString(),stationCount:r.stations.length,mode,advance,reducedMotion:false,steps:[]};
 if(p.fingerprint!==r.validationFingerprint)throw Error('Changed data during browser validation');
 for(let i=p.steps.length;i<r.stations.length;i++){
  const stop=r.stations[i];let shown;
  for(let retry=0;retry<100;retry++){shown=await tab.playwright.locator('#prompt-main').textContent();if(shown===stop.ja)break}
  if(shown!==stop.ja)throw Error('Unexpected visible stop '+id+' '+i+': '+shown);
  const korean=await tab.playwright.locator('#prompt-ko').innerText();if(korean!==(mode==='memory'?'정답 비공개':stop.ko))throw Error('Korean visibility mismatch '+id+' '+i);
  if(i&&advance==='AUTO')p.steps[i-1].advanceMs=await tab.playwright.evaluate(()=>document.body.dataset.autoAdvanceMs);
  await tab.playwright.getByRole('textbox',{name:/^한국어 역 이름 입력/}).fill(stop.ko);
  if(advance==='SPACE')await tab.playwright.getByRole('textbox',{name:/^한국어 역 이름 입력/}).press('Space');
  p.steps.push({order:i,id:stop.id,zh:stop.ja,ko:stop.ko,shown:true,koreanVisible:mode!=='memory',entered:true});
  await fs.writeFile(root+'/'+progressFile,JSON.stringify(p,null,2)+'\n');
 }
 await tab.playwright.getByRole('heading',{name:'운행 완료!',exact:true}).waitFor({state:'visible',timeoutMs:15000});
 p.resultSnapshot=await tab.playwright.domSnapshot();if(!p.resultSnapshot.includes('100.0%'))throw Error('Not clean completion '+id);
 p.status='PASS';p.timing=advance==='AUTO'?await tab.playwright.evaluate(()=>({advanceMs:document.body.dataset.autoAdvanceMs,arrivalMs:document.body.dataset.autoArrivalMs})):null;
 p.screenshot='output/hk/phase4/'+id+'-result.jpg';await fs.writeFile(root+'/'+p.screenshot,await tab.screenshot({fullPage:false}));
 const file='reports/hong-kong/phase4/browser-runs.json';let runs=[];try{runs=await read(root,file)}catch{}
 runs=runs.filter(p=>p.serviceId!==id);runs.push(p);await fs.writeFile(root+'/'+file,JSON.stringify(runs,null,2)+'\n');
 return{id,stops:p.stationCount,status:p.status,timing:p.timing};
}
async function displayed(tab,selector,text){let value;for(let i=0;i<120;i++){value=await tab.playwright.locator(selector).textContent();if(value===text)return}throw Error('Expected visible '+selector+' '+text+', got '+value)}
export async function freeStart(tab,root,id){
 const r=await read(root,'data/hk/generated/routes/'+id+'.json');let state=await tab.playwright.domSnapshot();
 if(state.includes('button "× 종료"')){await tab.playwright.getByRole('button',{name:'× 종료',exact:true}).click();state=await tab.playwright.domSnapshot()}
 if(state.includes('heading "운행 완료!"'))await tab.playwright.getByRole('button',{name:'CHANGE LINE · 다른 노선',exact:true}).click();
 else if(!state.includes('heading "노선 선택"'))await tab.playwright.getByRole('navigation',{name:'주 메뉴'}).getByRole('button',{name:'PLAY',exact:true}).click();
 await tab.playwright.getByRole('searchbox',{name:'⌕',exact:true}).fill(r.line.ko);await tab.playwright.domSnapshot();
 const prefix=r.operator.ko+' '+r.line.ko+' '+r.serviceLabel+' '+r.stations.length+'개 역';
 await tab.playwright.getByRole('button',{name:new RegExp('^'+prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' ')}).click();await tab.playwright.domSnapshot();
 await tab.playwright.getByRole('button',{name:'FREE DRIVE ↗',exact:true}).click();
 await tab.playwright.locator('#typing-input').waitFor({state:'visible',timeoutMs:15000});
 await displayed(tab,'#prompt-main',r.stations[0].ja);return r;
}
export async function transfer(tab,root,{from,to,stationId,roundTrip=true}){
 const source=await freeStart(tab,root,from),destination=await read(root,'data/hk/generated/routes/'+to+'.json'),at=source.stations.findIndex(s=>s.id===stationId),targetAt=destination.stations.findIndex(s=>s.id===stationId);
 if(at<0||targetAt<0)throw Error('Missing reviewed transfer identity');
 const proof={from,to,stationId,checkedAt:new Date().toISOString(),status:'RUNNING',approach:[],tabChanges:[],completion:[],coordinateCheck:'Exact route-stop geometry vertices verified separately in automated tests. Browser verifies current map label, new route brand and first typing prompt; numeric train coordinates are not read from hidden application state.'};
 if(at>0)for(let i=0;i<=at;i++){const stop=source.stations[i];await displayed(tab,'#prompt-main',stop.ja);await tab.playwright.locator('#typing-input').fill(stop.ko);proof.approach.push({id:stop.id,ko:stop.ko});}
 await displayed(tab,'#map-station-info b',source.stations[at].ja);
 const switchByTab=async id=>{let active;for(let count=0;count<24;count++){active=await tab.playwright.locator('#game-free-drive-tabs button.active').getAttribute('data-free-drive-tab');if(active===id)break;await tab.playwright.locator('#typing-input').press('Tab');await tab.playwright.domSnapshot();}if(active!==id)throw Error('TAB failed to select '+id);const stop=(id===from?source:destination).stations.find(s=>s.id===stationId);await displayed(tab,'#prompt-main',stop.ja);await displayed(tab,'#prompt-ko',stop.ko);const value=await tab.playwright.locator('#typing-input').getAttribute('readonly');if(value!==null)throw Error('Transfer start not editable');proof.tabChanges.push({routeId:id,stationId,shown:stop.ja,ko:stop.ko,firstAnswerIsTransferStation:true,mapLabel:await tab.playwright.locator('#map-station-info b').textContent()});};
 await switchByTab(to);if(roundTrip){await switchByTab(from);await switchByTab(to)}
 proof.transferSnapshot=await tab.playwright.domSnapshot();proof.transferScreenshot='output/hk/phase4/transfer-'+from+'-'+to+'.jpg';await fs.writeFile(root+'/'+proof.transferScreenshot,await tab.screenshot({fullPage:false}));
 for(let i=targetAt;i<destination.stations.length;i++){const stop=destination.stations[i];await displayed(tab,'#prompt-main',stop.ja);await tab.playwright.locator('#typing-input').fill(stop.ko);proof.completion.push({id:stop.id,ko:stop.ko});}
 await displayed(tab,'#station-context','종착역 도착 · 자유주행');
 await displayed(tab,'#map-station-info b',destination.stations.at(-1).ja);
 proof.terminalSnapshot=await tab.playwright.domSnapshot();proof.terminal=destination.stations.at(-1).id;proof.status='PASS';
 proof.terminalScreenshot='output/hk/phase4/terminal-'+from+'-'+to+'.jpg';await fs.writeFile(root+'/'+proof.terminalScreenshot,await tab.screenshot({fullPage:false}));
 const file='reports/hong-kong/phase4/browser-transfers.json';let proofs=[];try{proofs=await read(root,file)}catch{}proofs=proofs.filter(p=>p.from!==from||p.to!==to);proofs.push(proof);await fs.writeFile(root+'/'+file,JSON.stringify(proofs,null,2)+'\n');return{from,to,stationId,status:proof.status,tabSwitches:proof.tabChanges.length,completedStops:proof.completion.length};
}
export async function noTransfer(tab,root){
 const r=await freeStart(tab,root,'hk-south-island-ut');for(const stop of r.stations.slice(0,2)){await displayed(tab,'#prompt-main',stop.ja);await tab.playwright.locator('#typing-input').fill(stop.ko)}
 await displayed(tab,'#map-station-info b',r.stations[1].ja);
 const observe=()=>tab.playwright.evaluate(()=>({prompt:document.querySelector('#prompt-main')?.textContent,map:document.querySelector('#map-station-info b')?.textContent,line:document.querySelector('#game-line-name')?.textContent,progress:document.querySelector('#hud-progress')?.textContent}));
 const before=await observe();await tab.playwright.locator('#typing-input').press('Tab');const snapshot=await tab.playwright.domSnapshot(),after=await observe();
 if(JSON.stringify(before)!==JSON.stringify(after))throw Error('TAB changed game state at a non-transfer stop');
 const proof={checkedAt:'2026-10-24',stationId:r.stations[1].id,status:'PASS',before,after,snapshot};await fs.writeFile(root+'/reports/hong-kong/phase4/browser-no-transfer.json',JSON.stringify(proof,null,2)+'\n');return proof;
}
