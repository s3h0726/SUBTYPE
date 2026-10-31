#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
const fromBranch=p=>execFileSync('git',['show','origin/feature/hong-kong-railway:'+p],{cwd:root,maxBuffer:15e6}).toString('utf8');
function swap(s,oldText,newText,label){if(!s.includes(oldText))throw Error('HK adaptation anchor missing '+label);return s.replace(oldText,newText)}
const hkApp=fromBranch('js/app.js');
let app=read('js/app.js');
if(!app.includes('function hongKongRouteCards(')){
 const start=hkApp.indexOf('function hongKongRouteCards('),end=hkApp.indexOf('\nfunction routeCard(',start);
 if(start<0||end<0)throw Error('HK group card implementation missing in branch');
 app=swap(app,'function routeCard(r){',hkApp.slice(start,end)+'\nfunction routeCard(r){','route cards');
}
if(!app.includes('const COUNTRY_UI={hk:')){
 const start=hkApp.indexOf('const COUNTRY_UI={')+'const COUNTRY_UI={'.length,end=hkApp.indexOf(',jp:',start);
 if(start<18||end<0)throw Error('Missing country heading definition');
 app=swap(app,'const COUNTRY_UI={','const COUNTRY_UI={'+hkApp.slice(start,end)+',','country heading');
}
if(!app.includes("if(countryId==='hk'){groupTabs.hidden")){
 app=swap(app,"if(countryId==='jp'){groupTabs.hidden",
 "if(countryId==='hk'){groupTabs.hidden=true;regionTabs.hidden=true;categoryTabs.hidden=false;renderTabs(categoryTabs,HONG_KONG_CATEGORIES,'category',category);return}if(countryId==='jp'){groupTabs.hidden",'HK categories');
}
if(!app.includes("countryId==='hk'?hongKongRouteCards(visible)")){
 app=swap(app,"countryId==='kr'?krRouteCards(visible):visible.map(routeCard).join('')",
 "countryId==='kr'?krRouteCards(visible):countryId==='hk'?hongKongRouteCards(visible):visible.map(routeCard).join('')",'HK route group rendering');
}
write('js/app.js',app);
let loader=read('js/data-loader.js');
if(!loader.includes('TRT_HONG_KONG_INDEX')){
 const hkLoader=fromBranch('js/data-loader.js');
 const a=hkLoader.indexOf("  if(countryId==='hk'){"),b=hkLoader.indexOf('\n  }',a);
 if(a<0||b<0)throw Error('Missing HK loader branch');
 loader=swap(loader,"export async function loadTransportData(countryId='jp',koreaMode='released'){\n",
 "export async function loadTransportData(countryId='jp',koreaMode='released'){\n"+hkLoader.slice(a,b+4)+'\n','HK data loader');
}
if(!loader.includes("route.countryId==='hk'&&(sourceRoute.countryId")){
 loader=swap(loader,"const normalized=normalizeLine(sourceRoute,{category:route.category});",
 "if(route.countryId==='hk'&&(sourceRoute.countryId!=='hk'||sourceRoute.id!==route.id))throw new Error('홍콩 노선 파일 식별자가 일치하지 않습니다.');const normalized=normalizeLine(sourceRoute,{category:route.category});if(normalized.countryId==='hk'&&hongKongRouteBlockReason(normalized))throw new Error(hongKongRouteBlockReason(normalized));",'HK payload identity');
}
write('js/data-loader.js',loader);
let fd=read('js/free-drive.js');
if(!fd.includes('TRT_HONG_KONG_INDEX')){
 const addition=[
 '    const hkPairs=new Map;',
 '    for(const pair of globalThis.TRT_HONG_KONG_INDEX?.transfers||[]){',
 "      if(pair.status!=='verified'||pair.enabled!==true||!pair.from||!pair.to)continue;",
 '      for(const id of [pair.from,pair.to]){',
 "        if(hkPairs.has(id))throw new Error('Conflicting Hong Kong interchange '+id);",
 '        hkPairs.set(id,pair);',
 '      }',
 '    }',
 "    for(const route of routes||[])if(route.countryId==='hk')for(const stop of route.stations||[]){",
 "      if(stop.countryId&&stop.countryId!=='hk')throw new Error('Cross-country stop in '+route.id);",
 "      stop.countryId='hk';delete stop.hkTransferKey;delete stop.hkTransferRequiresExit;",
 '      const pair=hkPairs.get(String(stop.stationMasterId||stop.sourceStationId||stop.id));',
 "      if(pair){stop.hkTransferKey='hk-transfer:'+pair.id;stop.hkTransferRequiresExit=pair.requiresExit===true;}",
 '    }'
 ].join('\n');
 fd=swap(fd,'  setNetwork(routes){','  setNetwork(routes){\n'+addition+'\n','HK verified transfer map');
}
fd=fd.replace('this.routes=(routes||[]).filter(r=>!koreanRouteBlockReason(r)).filter(',
 'this.routes=(routes||[]).filter(r=>!koreanRouteBlockReason(r)&&!hongKongRouteBlockReason(r)).filter(');
if(!fd.includes('if(station.hkTransferKey)node.transferRequiresExit'))
 fd=swap(fd,'      node.routeIds.add(route.id);',
 '      node.routeIds.add(route.id);if(station.hkTransferKey)node.transferRequiresExit=station.hkTransferRequiresExit===true;','transfer-node metadata');
if(!fd.includes('  availableRouteIds(){')){
 const src=fromBranch('js/free-drive.js'),a=src.indexOf('  availableRouteIds(){'),b=src.indexOf('\n  snapshot(){',a);
 if(a<0||b<0)throw Error('Missing HK transfer route choice');
 fd=swap(fd,'  snapshot(){',src.slice(a,b)+'\n  snapshot(){','HK transfer choice');
}
fd=fd.replace('!node.routeIds.has(routeId)||','!this.availableRouteIds().includes(routeId)||');
write('js/free-drive.js',fd);
console.log('HK adapters injected into main app, loader and free drive');
