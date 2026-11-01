#!/usr/bin/env node
'use strict';
// Regression for the Hong Kong card click handlers lost during branch merge.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const aliases=[{id:'hk-island-dt',countryId:'hk',canonicalLineId:'hk-island',operator:{ko:'홍콩 MTR'},line:{ko:'홍콩섬선'},lineColor:'#14568b',stationCount:17},
 {id:'hk-island-ut',countryId:'hk',canonicalLineId:'hk-island',operator:{ko:'홍콩 MTR'},line:{ko:'홍콩섬선'},lineColor:'#14568b',stationCount:17},
 {id:'hk-tram-a',countryId:'hk',canonicalLineId:'hk-tramway',tramServiceGroup:'tram-a',operator:{ko:'홍콩 트램'},line:{ko:'홍콩 트램'},lineColor:'#123456',stationCount:15}];
function simulate(file){
 const source=read(file);
 assert(source.includes("countryId==='hk'?hongKongRouteCards(visible)"),'HK route family renderer missing in '+file);
 const begin=source.indexOf("$('#route-grid').addEventListener('click',e=>{");
 const end=source.indexOf("$('#selected-line-preview').addEventListener('click'",begin);
 assert(begin>=0&&end>begin,'Missing route grid event delegation in '+file);
 const snippet=source.slice(begin,end).trim();
 let handler=null;
 const calls=[],notices=[];
 const ctx={routes:[...aliases],selectedGroup:null,selected:null,routeSelectionRevision:0,
  routeRenderLimit:96,$:()=>({addEventListener:(name,cb)=>{assert.equal(name,'click');handler=cb}}),
  filteredRoutes:()=>ctx.routes,
  koreanRouteUnavailableReason:r=>r.blocked?'blocked':'',
  krLineFamily:r=>r.countryId==='kr'?'kr-family':null,
  chooseRoute:id=>{calls.push(id);return Promise.resolve(true)},
  toast:message=>notices.push(message),
  renderRoutes:()=>{},renderSelected:()=>{},
  NETWORK_GROUPS:{},category:'all',transportGroup:'all'};
 vm.createContext(ctx);
 vm.runInContext(snippet,ctx);
 assert.equal(typeof handler,'function','Click handler missing in '+file);
 const click=(selector,dataset={})=>handler({target:{closest:s=>s===selector?{dataset}:null}});
 click('[data-hk-line-family]',{hkLineFamily:'hk-island'});
 assert.equal(calls.at(-1),'hk-island-dt','Hong Kong MTR group click did not choose route');
 click('[data-hk-tram-family]');
 assert.equal(calls.at(-1),'hk-tram-a','Hong Kong tram click did not choose route');
 ctx.routes.unshift({id:'kr-main',countryId:'kr'});
 click('[data-kr-family]',{krFamily:'kr-family'});
 assert.equal(calls.at(-1),'kr-main','Korean card selection regressed');
 ctx.routes.push({id:'jp-main',countryId:'jp'});
 click('[data-route]',{route:'jp-main'});
 assert.equal(calls.at(-1),'jp-main','Japanese direct card selection regressed');
 const before=calls.length;
 click('[data-hk-line-family]',{hkLineFamily:'not-real'});
 assert.equal(calls.length,before,'Unknown HK group must not select unrelated route');
 assert(notices.at(-1).includes('홍콩'),'Missing selector failure feedback');
 assert(source.includes('data-hk-line-family')&&source.includes('data-hk-tram-family'),
   'HK group card attributes missing in '+file);
 console.log('PASS '+file+': HK MTR/TRAM, KR, JP click selectors');
}
simulate('js/app.js');
simulate('js/app.bundle.js');
const html=read('index.html');
assert(/app\.bundle\.js\?v=[^"']+/.test(html),'App bundle cache key missing');
const hk=JSON.parse(read('data/hk/generated/index.json')).routes;
assert(hk.length>=90&&hk.some(r=>r.canonicalLineId==='hk-tramway')&&hk.some(r=>r.canonicalLineId==='hk-island'));
console.log('PASS selector assets: '+hk.length+' HK route records');

for(const file of ['js/app.js','js/app.bundle.js']){
 const app=read(file);
 assert(app.includes('class="line-card hk-line-card'),'Hong Kong Japanese-style cards missing in '+file);
 assert(app.includes('class="hk-line-native" lang="zh-Hant"'),'Hong Kong native Chinese line label missing in '+file);
 assert(app.includes('class="tw-card-native" lang="zh-Hant"'),'Taiwan native Chinese line label missing in '+file);
 assert(app.includes('class="hk-selected-native" lang="zh-Hant"'),'Hong Kong selected-line detail missing in '+file);
 assert(app.includes('class="tw-selected-native" lang="zh-Hant"'),'Taiwan selected-line detail missing in '+file);
}
const hkStyle=read('css/hong-kong.css'),twStyle=read('css/taiwan.css');
assert(hkStyle.includes('#prompt-main{grid-area:auto!important;order:2!important'),'Hong Kong native name must be above Korean');
assert(twStyle.includes('#prompt-main{order:2'),'Taiwan native name must be above Korean');
assert(hkStyle.includes('#prompt-ko{grid-area:auto!important;order:3!important'),'Hong Kong Korean subtitle must follow native name');
assert(twStyle.includes('#prompt-ko{order:3'),'Taiwan Korean subtitle must follow native name');
console.log('PASS JP-style Hong Kong/Taiwan cards and native-first station signs');
