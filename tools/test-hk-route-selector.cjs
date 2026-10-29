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
