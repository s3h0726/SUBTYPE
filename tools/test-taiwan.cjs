const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),network=JSON.parse(fs.readFileSync(path.join(root,'data/tw/generated/network.json'),'utf8'));
const c={console,globalThis:{}};vm.createContext(c);for(const file of ['taiwan-display','hong-kong-policy','taiwan-network','route-integrity'])vm.runInContext(fs.readFileSync(path.join(root,'js/'+file+'.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),c);
vm.runInContext(';globalThis.api={configureTaiwanNetwork,taiwanKoreanPresentation,taiwanOperatingChoices,resolveTaiwanChoice,resolvePlayableRoute}',c);const api=c.globalThis.api;
const lines=network.lines.map(api.taiwanKoreanPresentation);api.configureTaiwanNetwork(lines,network.patterns);const publicLines=lines.filter(l=>l.visibility!=='internal');
test('기존 38개 카드와 관광철도 8개 카드 보존',()=>{assert.equal(network.operators.length,11);assert.equal(publicLines.length,46);for(const id of require('../data/tw/source/completion/baseline.json').publicLineIds)assert(publicLines.some(l=>l.id===id));assert.equal(network.patterns.length,new Set(network.patterns.map(p=>p.id)).size);assert.equal(publicLines.filter(l=>l.operatorId==='tw-trtc').length,7);assert.equal(publicLines.filter(l=>l.operatorId==='tw-tra').length,17)});
test('every service resolves over actual retained tracks in timetable order',()=>{for(const l of publicLines){assert(l.taiwanServices.length,l.id);for(const choice of api.taiwanOperatingChoices(l)){const resolved=api.resolveTaiwanChoice(choice,l),r=api.resolvePlayableRoute(resolved.route,{service:resolved.service});assert(r.geometry.length>=2,choice.id);assert(!r.fallbackGeometry,choice.id);assert.equal(r.segments.length,r.stations.length-1);assert(r.segments.every(s=>!s.endpointMismatch),choice.id);const actual=r.stations.filter(s=>!s.loopArrivalOnly).map(s=>s.networkKey),spec=network.patterns.find(p=>p.id===choice.id);assert.deepEqual(Array.from(actual),spec.calls.map(id=>resolved.route.stations.find(s=>s.id===id).networkKey),choice.id);}}});
test('Korean is mandatory in every display slot and station IDs are line specific',()=>{for(const l of lines){assert(/[가-힣]/.test(l.line.ja));assert(/[가-힣]/.test(l.operator.ja));assert(/[\p{Script=Han}]/u.test(l.operator.zh),'Missing operator Traditional Chinese: '+l.id);for(const s of l.stations){assert.equal(s.id,s.station_id);assert(s.line_id===l.id);assert(!('mlit_station_id'in s));assert(/[가-힣]/.test(s.ko));assert.equal(s.ja,s.ko);assert(!/[\p{Script=Han}]/u.test(s.ko));assert(s.zh);}}});
test('THSR has all 12 stations and express passes are excluded from prompts',()=>{const l=publicLines.find(l=>l.operatorId==='tw-thsr');assert.equal(l.stations.length,12);assert.equal(l.stations[0].ko,'난강');assert.equal(l.stations.at(-1).ko,'쭤잉');const choices=api.taiwanOperatingChoices(l);const patterns=choices.map(x=>api.resolveTaiwanChoice(x,l));assert(patterns.some(r=>r.service.stops.length===12));assert(patterns.some(r=>r.service.stops.length<=6));for(const r of patterns){const route=api.resolvePlayableRoute(r.route,{service:r.service});assert.equal(route.stations.length,r.service.stops.length)}});
test('Airport express stops, excluded construction stations and unilateral short turns',()=>{const l=publicLines.find(l=>l.id==='tw-tymc-airport');assert.equal(l.stations.length,22);assert(!l.stations.some(s=>['A14','A23'].includes(s.officialCode)));const choices=api.taiwanOperatingChoices(l);const express=choices.find(x=>x.patternName.ko==='공항 급행');const r=api.resolveTaiwanChoice(express,l);assert.deepEqual(Array.from(r.service.stops,id=>r.route.stations.find(s=>s.id===id).officialCode),['A1','A3','A8','A12','A13']);assert.equal(choices.filter(x=>x.patternName.ko==='공항행 보통').length,2)});
test('Circular light rail retains its closing curve and one arrival-only boundary',()=>{const l=publicLines.find(l=>l.id==='tw-krtc-circular-light-rail');assert(l.loopClosingGeometry.length>2);for(const choice of api.taiwanOperatingChoices(l)){const r=api.resolveTaiwanChoice(choice,l),p=api.resolvePlayableRoute(r.route,{service:r.service});assert.equal(p.stations.length,39);assert.equal(p.stations.filter(s=>s.loopArrivalOnly).length,1);assert.equal(new Set(p.stations.filter(s=>!s.loopArrivalOnly).map(s=>s.zh)).size,38);assert.deepEqual(Array.from(p.geometry[0]),Array.from(p.geometry.at(-1)));assert(p.segments.at(-1).geometry.length>2)}});
test('same-named platforms retain coordinates and unapproved transfers cannot merge',()=>{const same=lines.flatMap(l=>l.stations).filter(s=>s.zh==='板橋');assert(same.length>=3);assert(new Set(same.map(s=>s.latitude+','+s.longitude)).size>=3);assert.equal(new Set(same.map(s=>s.id)).size,same.length);const far=lines.flatMap(l=>l.stations).filter(s=>s.zh==='頂埔');assert(new Set(far.map(s=>s.latitude.toFixed(2))).size>=2);assert(network.transferGroups.length>5)});
test('Alishan retains thousands of original mountain vertices and no yard tracks as cards',()=>{const l=publicLines.find(l=>l.id==='tw-afr-main');assert(l.geometry.length>5000);assert.equal(publicLines.filter(l=>l.operatorId==='tw-afr').length,4);assert(!publicLines.some(l=>l.id.includes('YARD')));assert(api.taiwanOperatingChoices(l).some(c=>c.destinationNames.ko==='아리산'))});
test('free-drive loop crossings use only the retained closing track in either direction',()=>{
 const r={};vm.createContext(r);vm.runInContext(fs.readFileSync(path.join(root,'js/route-renderer.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.segment=typingSegment;globalThis.travel=travelGeometry',r);
 const l=publicLines.find(l=>l.id==='tw-krtc-circular-light-rail'),rail={segmentCache:new Map(),stationOffsets:l.stations.map(s=>s.geometryIndex),points:l.geometry,loopClosingGeometry:l.loopClosingGeometry};
 assert.equal(JSON.stringify(r.segment(rail,37,0).segment),JSON.stringify(l.loopClosingGeometry));assert.equal(JSON.stringify(r.segment(rail,0,37).segment),JSON.stringify(l.loopClosingGeometry.slice().reverse()));assert.equal(JSON.stringify(r.travel(l).points.at(-1)),JSON.stringify(l.geometry[0]));
 const area=l.loopClosingGeometry.reduce((v,p,i,a)=>v+(i?a[i-1][1]*p[0]-p[1]*a[i-1][0]:0),0);assert(Number.isFinite(area));
});
test('editor station overrides reach the actual Taiwan journey and its destination selector',async()=>{
 const d={console,URL,crypto:require('crypto').webcrypto,document:{baseURI:'https://subtype.test/'}};vm.createContext(d);
 const line=network.lines.find(l=>l.id==='tw-trtc-wenhu'),id=line.stations[0].id;
 d.fetch=async url=>({ok:true,json:async()=>String(url).includes('editor-overrides')?{stations:{[line.id]:{[id]:'편집된출발역'}}}:network});
 for(const name of ['taiwan-display','taiwan-network','data-loader'])vm.runInContext(fs.readFileSync(path.join(root,'js/'+name+'.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),d);
 vm.runInContext(';globalThis.api={loadTransportData,taiwanOperatingChoices,resolveTaiwanChoice}',d);
 const data=await d.api.loadTransportData('tw'),l=data.lines.find(l=>l.id===line.id),choice=d.api.taiwanOperatingChoices(l)[0],resolved=d.api.resolveTaiwanChoice(choice,l);
 assert.equal(choice.originNames.ko,'편집된출발역');assert.equal(resolved.route.stations[0].ja,'편집된출발역');assert.equal(resolved.route.stations[0].zh,line.stations[0].zh);
});

test('Taiwan uses Hong Kong/Japan common sign geometry and preserves native labels',()=>{
 const css=fs.readFileSync(path.join(root,'css/taiwan.css'),'utf8');
 assert(css.includes('#screen-game.active{display:block!important;height:100dvh;overflow:hidden}'));
 assert(!css.includes('grid-template-rows:100px 90px'));
 assert(!css.includes('min-height:310px!important'));
 assert(css.includes('#prompt-main{order:2'));
 assert(css.includes('#prompt-ko{order:3'));assert(css.includes('.tw-card-native'));
 assert(css.includes('font-family:"Noto Sans TC"')||css.includes('"Noto Sans TC"'));
 const ui=fs.readFileSync(path.join(root,'js/taiwan-display.js'),'utf8');
 assert(ui.includes("lineHeading.querySelector('.game-line-symbol,.line-badge,.line-symbol-asset')"));
 assert(ui.includes("lineLabel.querySelector(':scope > small')"));
 const n=vm.runInContext("getTaiwanDisplayNames({ko:'타이베이',zh:'臺北',en:'Taipei',ja:'타이베이'})",c);
 assert.equal(n.ko,'타이베이');assert.equal(n.zh,'臺北');
 assert(vm.runInContext("taiwanNameMarkup({ko:'타이베이',zh:'臺北'})",c).includes('lang="zh-Hant"'));
});

test('Taiwan selector shares HK/JP/KR visual templates with selective Traditional Chinese',()=>{
 const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),bundle=fs.readFileSync(path.join(root,'js/app.bundle.js'),'utf8');
 for(const source of [app,bundle]){
  assert(source.includes('renderTaiwanSetupHeader(selected,stops.length)'));
  assert(source.includes('class="tw-selected-native" lang="zh-Hant"'));
  assert(!source.includes('taiwanNameMarkup(route.operator)'));
  assert(!source.includes('taiwanNameMarkup(choice.patternName)'));
  assert(!source.includes('taiwanNameMarkup(s,{english:true})'));
  assert(source.includes('if(selected.countryId===\'tw\')renderTaiwanSetupHeader(selected)'));
  assert(source.includes('taiwanNameText(choice.originNames,{english:true})'));
  assert(source.includes('function taiwanSetupStationRows(stations)'));
  assert(source.includes('if(list)list.innerHTML=taiwanSetupStationRows(stops)'));
  assert(source.includes('getTaiwanDisplayNames(choice.patternName).ko'));
  assert(source.includes('class="tw-setup-station"'));
 }
 const display=fs.readFileSync(path.join(root,'js/taiwan-display.js'),'utf8');
 assert(display.includes('if(heading)heading.textContent=line.ko'));
 assert(display.includes("set('game-operator',getTaiwanDisplayNames(route.operator).ko)"));
 const map=fs.readFileSync(path.join(root,'js/network-map.js'),'utf8');
 assert(map.includes("panel.querySelector('.map-kicker').textContent=getTaiwanDisplayNames(route.operator).ko"));
 assert(bundle.includes('function renderTaiwanSetupHeader(route,stationCount)'));
 assert(bundle.includes("set('game-operator',getTaiwanDisplayNames(route.operator).ko)"));
 const css=fs.readFileSync(path.join(root,'css/taiwan.css'),'utf8');
 assert(css.includes('li.tw-setup-station'));
 assert(css.includes('grid-template-columns:minmax(0,42%) minmax(0,1fr)'));
 assert(css.includes('.selected-line-card>.tw-selected-native'));
});
