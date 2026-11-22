'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const airports=require('../js/airport-free-drive.js');
const source=fs.readFileSync(path.join(__dirname,'../js/custom-airport-routes.js'),'utf8').replace(/\bexport\s+/g,'');
const ctx={};vm.createContext(ctx);vm.runInContext(source+';globalThis.api={customAirportOptions,customAirportTransferValid}',ctx);
const {customAirportOptions,customAirportTransferValid}=ctx.api;
const icn1={id:'ICN-T1',stationMasterId:'ICN-T1',ko:'인천공항1터미널',latitude:37.447,longitude:126.452};
const icn2={id:'ICN-T2',stationMasterId:'ICN-T2',ko:'인천공항2터미널',latitude:37.469,longitude:126.433};
const gmp={id:'GMP',stationMasterId:'GMP',ko:'김포공항',latitude:37.562,longitude:126.801};
const routes=[
 {id:'icn-access',countryId:'kr',mode:'rail',line:{ko:'공항철도'},stations:[icn1,icn2]},
 {id:'gmp-access',countryId:'kr',mode:'rail',line:{ko:'공항철도'},stations:[gmp]},
 {id:'nrt-access',countryId:'jp',mode:'rail',line:{ko:'나리타공항선'},stations:[{ja:'成田空港',latitude:35.765,longitude:140.39,id:'NRT'}]},
 {id:'bus',countryId:'kr',mode:'bus',stations:[{...gmp,id:'fake-bus'}]}
];
test('registered departure airport shows valid same-country airport rail portals only',()=>{
 const choices=customAirportOptions(icn1,'kr',routes,airports);
 assert(choices.some(item=>item.fromCode==='ICN'&&item.toCode==='GMP'&&item.portalId==='main'));
 assert(choices.some(item=>item.fromCode==='ICN'&&item.toCode==='ICN'&&item.portalId==='t2'&&item.kind==='terminal-transfer'));
 assert(!choices.some(item=>item.toCode==='NRT'));
 assert(!choices.some(item=>item.targetStation.id==='fake-bus'));
});
test('airport transfer requires correct source and canonical destination',()=>{
 const options=customAirportOptions(icn1,'kr',routes,airports);
 const g=options.find(item=>item.toCode==='GMP'),meta={fromCode:g.fromCode,toCode:g.toCode,portalId:g.portalId,kind:g.kind};
 assert(customAirportTransferValid(icn1,gmp,meta,'kr',routes,airports));
 assert(!customAirportTransferValid(icn1,icn2,meta,'kr',routes,airports));
 assert(!customAirportTransferValid(gmp,icn1,meta,'kr',routes,airports));
 assert(!customAirportTransferValid(icn1,gmp,{...meta,portalId:'t2'},'kr',routes,airports));
});
test('non-airport stations cannot trigger arbitrary flights',()=>{
 assert.equal(customAirportOptions({id:'dummy',stationMasterId:'dummy',ko:'서울역',latitude:37.55,longitude:126.97},'kr',routes,airports).length,0);
});
test('saved custom virtual legs do not become shortest path rail edges',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../js/custom-shortest-path.js'),'utf8').replace(/\bexport\s+/g,'');
 const context={};vm.createContext(context);vm.runInContext(js+';globalThis.Route=CustomShortestPath',context);
 const fake={id:'custom-flight',category:'custom',countryId:'kr',stations:[icn1,{...gmp,airportIncomingTransfer:{fromCode:'ICN',toCode:'GMP'}}]};
 const valid={id:'real',category:'rail',countryId:'kr',stations:[icn1,icn2]};
 const graph=new context.Route([valid,fake]);
 assert.equal(graph.find('ICN-T1','GMP'),null);
 assert(graph.find('ICN-T1','ICN-T2'));
});

test('international airports are listed as unresolved choices until the foreign railway has loaded',()=>{
 const first=customAirportOptions({...icn1,countryId:'kr'},'kr',routes,airports,{allowForeign:true});
 const japan=first.filter(item=>item.toCode==='NRT');
 assert(japan.some(item=>item.portalId==='t1'&&item.loadRequired===true));
 assert(japan.some(item=>item.portalId==='t23'&&item.loadRequired===true));
 const nrt={id:'NRT-1',stationMasterId:'NRT-1',ja:'成田空港',countryId:'jp',latitude:35.765,longitude:140.39};
 const foreignRoute={id:'narita',countryId:'jp',mode:'rail',line:{ja:'成田空港線'},stations:[nrt,{id:'NRT-2',ja:'空港第2ビル',latitude:35.772,longitude:140.39}]};
 const ready=customAirportOptions({...icn1,countryId:'kr'},'kr',[...routes,foreignRoute],airports,{allowForeign:true});
 const arrival=ready.find(item=>item.toCode==='NRT'&&item.portalId==='t1');
 assert(arrival&&arrival.loadRequired===false);
 assert.equal(arrival.toCountryId,'jp');
 assert.equal(arrival.targetStationKey,'NRT-1');
});
test('international airport record validates both countries and real terminal',()=>{
 const icn={...icn1,countryId:'kr'};
 const nrt={id:'NRT-1',stationMasterId:'NRT-1',ja:'成田空港',countryId:'jp',latitude:35.765,longitude:140.39};
 const foreignRoute={id:'narita',countryId:'jp',mode:'rail',line:{ja:'成田空港線'},stations:[nrt,{id:'NRT-2',ja:'空港第2ビル',countryId:'jp',latitude:35.772,longitude:140.39}]};
 const meta={kind:'virtual-flight',fromCode:'ICN',toCode:'NRT',portalId:'t1',fromCountryId:'kr',toCountryId:'jp'};
 assert.equal(customAirportTransferValid(icn,nrt,meta,'kr',[...routes,foreignRoute],airports),true);
 assert.equal(customAirportTransferValid(icn,nrt,{...meta,toCountryId:'kr'},'kr',[...routes,foreignRoute],airports),false);
 assert.equal(customAirportTransferValid(icn,nrt,{...meta,portalId:'t23'},'kr',[...routes,foreignRoute],airports),false);
 assert.equal(customAirportTransferValid(icn,{...nrt,latitude:37.447,longitude:126.45},meta,'kr',[...routes,foreignRoute],airports),false);
});
