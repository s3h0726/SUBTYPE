const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),cp=require('node:child_process');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),index=read('data/hk/generated/index.json'),network=read('data/hk/master/network.json');
const routes=index.routes.filter(r=>r.playable).map(r=>read(r.lazySource)),byId=new Map(routes.map(r=>[r.id,r]));
const source=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
test('92 baseline directions retain exact source geometry, names, order and validation identity',()=>{
 const old=JSON.parse(cp.execFileSync('git',['show','84840e09:data/hk/generated/index.json'],{encoding:'utf8',maxBuffer:16e6}));
 assert.equal(old.routes.filter(r=>r.playable).length,92);assert.equal(routes.length,103);
 for(const m of old.routes.filter(r=>r.playable)){const a=byId.get(m.id),b=JSON.parse(cp.execFileSync('git',['show','84840e09:'+m.lazySource],{encoding:'utf8',maxBuffer:8e6}));assert(a,m.id);assert.equal(a.validationFingerprint,b.validationFingerprint);assert.deepEqual(a.geometry,b.geometry);assert.deepEqual(a.stations,b.stations);}
});
test('all released directions have unique identities, Korean calls and connected sourced railway segments',()=>{
 assert.equal(new Set(index.routes.map(r=>r.id)).size,index.routes.length);
 for(const r of routes){assert.equal(r.releaseStatus,'ready');assert(r.stations.length>=2);assert.equal(r.directedSegments.length,r.stations.length-1);let last=-1;
  for(const s of r.stations){assert.equal(s.nameStatus,'verified');assert(/[가-힣]/.test(s.ko));assert(s.ja&&s.romaji);assert(s.geometryIndex>last);last=s.geometryIndex;assert.deepEqual([s.latitude,s.longitude],r.geometry[s.geometryIndex]);}
  r.directedSegments.forEach((e,i)=>{assert(e.sourceWayIds.length);assert(e.geometry.length>=2);assert.deepEqual(e.geometry[0],r.geometry[r.stations[i].geometryIndex]);assert.deepEqual(e.geometry.at(-1),r.geometry[r.stations[i+1].geometryIndex]);});
 }
});
test('103 actual-engine proofs are fresh for AUTO and SPACE, including duplicate-event and terminal checks',()=>{
 const {engineFingerprint}=require('./lib/hk-game-completion.cjs'),release=require('./lib/hk-release.cjs'),proof=read('reports/hong-kong/completion/engine-completions.json');assert.equal(proof.runs.length,103);
 for(const r of routes){const p=proof.runs.find(p=>p.serviceId===r.id);assert(p);for(const mode of ['auto','space']){assert.equal(p[mode].engineFingerprint,engineFingerprint());assert.equal(p[mode].routeIntegrity,true);assert.equal(p[mode].terminalReached,true);assert.equal(p[mode].errors,0);assert.deepEqual(p[mode].typedStationIds,r.stations.map(s=>s.id));}assert.equal(p.fingerprint,release.gameplayFingerprint(r));}
});
test('Peak six identities and passing loop remain original, with an explicit all-requested simulation',()=>{
 const a=byId.get('hk-peak-tram-pending'),b=byId.get('hk-peak-tram-down');assert.equal(a.stations.length,6);assert.deepEqual(a.stations.map(s=>s.id),b.stations.map(s=>s.id).reverse());
 for(const r of [a,b]){const old=JSON.parse(cp.execFileSync('git',['show','84840e09:data/hk/generated/routes/'+r.id+'.json'],{encoding:'utf8'}));assert.deepEqual(r.geometry,old.geometry);assert.equal(r.validWhen.type,'request-stop-simulation');assert.equal(r.validWhen.simulation,true);assert.equal(r.validWhen.currentRequestRuleStatus,'INCOMPLETE');assert.match(r.validWhen.noteKo,/모의운행/);assert(r.stations.every(s=>!s.hasOfficialStationCode));}
});
test('APM uses operational relation railways and retains restricted passenger access',()=>{
 const apm=routes.filter(r=>r.canonicalLineId==='hk-airport-apm'),raw=read('data/hk/sources/completion/apm-map.json'),ways=new Map(raw.elements.filter(e=>e.type==='way').map(e=>[e.id,e]));assert.equal(apm.length,4);
 for(const r of apm){assert.equal(r.category,'automated_people_mover');assert.match(r.validWhen.noteKo,/제한구역/);assert(!r.stations.some(s=>/T2|Terminal 2/.test(s.ko+' '+s.romaji)));for(const e of r.directedSegments)for(const id of e.sourceWayIds){const w=ways.get(id);assert(w,id);assert(w.tags.railway);assert(!['construction','proposed','disused','abandoned'].includes(w.tags.railway));}}
 assert.equal(new Set(apm.flatMap(r=>r.stations.map(s=>s.physicalStationId))).size,4);
});
test('751 historical ID is retained under verified current 751 identity; timed 751P remains',()=>{
 const r=byId.get('hk-light-rail-751p-osm-12619403');assert.equal(r.canonicalLineId,'hk-light-rail-751');assert.match(r.validWhen.noteKo,/06:52.*07:11/);assert.match(r.validWhen.noteKo,/507P/);assert.equal(r.stations.length,15);
 assert.equal(byId.get('hk-light-rail-751-morning-ho-tin').stations.length,19);assert.equal(routes.filter(r=>r.canonicalLineId==='hk-light-rail-751p').length,3);
});
test('unified latest-main selector groups directions and distinguishes Racecourse services',()=>{
 const c={};vm.createContext(c);vm.runInContext(source('js/hong-kong-tram.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),Object.assign(c,{hongKongRouteBlockReason:()=>''}));
 const choices=c.hongKongLineChoices(routes,'hk-east-rail'),race=choices.filter(c=>c.lineGroup.endsWith(':racecourse'));assert.equal(race.length,3);for(const c of race)assert.match(c.lineGroupLabel,/마장/);
 const app=source('js/app.js');const a=app.indexOf('function operatingPatternKey('),b=app.indexOf('function operatingPatternLabel(',a);vm.runInContext(app.slice(a,b),c);
 const peak=c.hongKongLineChoices(routes,'hk-peak-tram');assert.equal(c.operatingPatternKey(peak[0]),c.operatingPatternKey(peak[1]));assert.equal(new Set(routes.map(r=>r.canonicalLineId)).size,26);
});
test('circular routes retain 16 distinct visits and 15 real track legs',()=>{
 for(const id of ['hk-light-rail-705-osm-2941692','hk-light-rail-706-osm-2941790']){const r=byId.get(id);assert.equal(r.stations.length,16);assert.equal(r.directedSegments.length,15);assert.equal(r.stations[0].id,r.stations.at(-1).id);assert.notEqual(r.stations[0].stopId,r.stations.at(-1).stopId);}
});
test('archived high speed stays byte-equivalent and is excluded from active categories',()=>{
 assert(!routes.some(r=>r.category==='high_speed_rail'));const file='data/hk/generated/routes/hk-high-speed-pending.json';assert.equal(source(file),cp.execFileSync('git',['show','84840e09:'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'));assert(!source('js/hong-kong-policy.js').includes("['high_speed_rail'"));
});
test('source archives still match every pinned retrieval hash',()=>{
 for(const [file,p]of Object.entries(read('data/hk/sources/manifest.json')))if(p.status==='retrieved')assert.equal(crypto.createHash('sha256').update(fs.readFileSync('data/hk/sources/'+file)).digest('hex'),p.sha256,file);
});
test('Latest integrated Korea, Japan and authentication/storage sources are preserved',()=>{
 const protectedBase=process.env.HK_PROTECTED_BASE_REF||'HEAD';const names=cp.execFileSync('git',['diff','--name-only',protectedBase],{encoding:'utf8'}).trim().split('\n');assert(!names.some(p=>/^data\/(?:kr|jp|japan|generated)\//.test(p)));for(const file of ['js/auth.js','js/storage.js','js/leaderboard.js','js/feature-flags.js','supabase/ranking.sql'])assert.equal(source(file),cp.execFileSync('git',['show',protectedBase+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
});
test('Hong Kong CUSTOM retains stored format and real edges after a fresh storage instance',()=>{
 const map=new Map(),localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)},c={console,localStorage,Map,Set,JSON};vm.createContext(c);
 const load=ctx=>{for(const file of ['js/hong-kong-policy.js','js/feature-flags.js','js/storage.js'])vm.runInContext(source(file).replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),ctx);vm.runInContext('globalThis.api={storage,buildHongKongCustomRoute,hongKongRouteBlockReason}',ctx);};load(c);
 const parent=byId.get('hk-tsuen-wan-ut'),stations=parent.stations.slice(0,3).map((s,i)=>({...s,id:'CT'+i,sourceStationId:s.id,hkIncomingEdge:i?{...parent.directedSegments[i-1],sourceServicePatternId:parent.id}:null}));
 const custom=c.api.buildHongKongCustomRoute({...parent,id:'hk-completion-fixture',category:'custom',coverage:'rail-network',stations});assert.equal(c.api.hongKongRouteBlockReason(custom),'');assert(c.api.storage.saveRoute(custom));
 const fresh={console,localStorage,Map,Set,JSON};vm.createContext(fresh);load(fresh);const restored=fresh.api.storage.routes().find(r=>r.id===custom.id);assert(restored);assert.equal(fresh.api.hongKongRouteBlockReason(restored),'');assert.deepEqual(JSON.parse(JSON.stringify(restored.stations.map(s=>s.ko))),stations.map(s=>s.ko));assert.deepEqual(JSON.parse(JSON.stringify(restored.geometry)),JSON.parse(JSON.stringify(custom.geometry)));
});

test('production bundle and merged canonical application parse without syntax errors',()=>{new vm.Script(source('js/app.bundle.js'));new vm.Script('(async()=>{'+source('js/app.js').replace(/^import[^\n]*\n/gm,'')+'})()');});
