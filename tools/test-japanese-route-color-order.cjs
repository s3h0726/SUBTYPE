#!/usr/bin/env node
'use strict';
// Selector regression: Japanese cards only; route records and game data must remain untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=['js/app.js','js/app.bundle.js'];
function loadSorter(file){
 const source=read(file),a=source.indexOf('function japaneseRouteRgb('),b=source.indexOf('function filteredRoutes()',a);
 assert(a>=0&&b>a,'Missing Japanese selector sorter in '+file);
 assert(source.includes("return countryId==='jp'?sortJapaneseRouteCards(filtered):filtered;"),'Japanese-only filter guard missing in '+file);
 return vm.runInNewContext(source.slice(a,b)+'\nsortJapaneseRouteCards;');
}
const script=read('js/japan-lite-index.js'),marker='window.TRT_JAPAN_LITE_INDEX=';
assert(script.includes(marker),'Japanese route catalog not found');
const routes=JSON.parse(script.slice(script.indexOf(marker)+marker.length).trim().replace(/;\s*$/,'')).routes;
assert(routes.length>=590,'Unexpectedly short Japanese route catalog');
function sourceHasSimilarColorSort(source){
 const begin=source.indexOf('function japaneseRouteRgb('),end=source.indexOf('function filteredRoutes()',begin);
 const sorter=source.slice(begin,end);
 return sorter.includes('japaneseRouteHue')||sorter.includes('previous=group.rgb')||sorter.includes('Math.hypot(')||sorter.includes('remaining.length');
}
for(const file of files){
 const sort=loadSorter(file),sorted=sort(routes);
 assert.equal(sorted.length,routes.length,'Route count changed in '+file);
 assert.deepEqual(Array.from(sorted,r=>r.id).sort(),routes.map(r=>r.id).sort(),'Route IDs changed in '+file);
 const seenOperators=new Set(),seenColors=new Set();
 let lastOperator=null,lastColor=null;
 for(const route of sorted){
  const operator=String(route.operatorId||route.operator?.ko||route.operator?.ja||'');
  if(operator!==lastOperator){
   assert(!seenOperators.has(operator),'Operator split across Japanese cards: '+operator);
   seenOperators.add(operator);lastOperator=operator;lastColor=null;
  }
  const color=String(route.lineColor||route.lineTheme?.color||'').toLowerCase();
  if(color!==lastColor){
   const key=operator+'|'+color;
   assert(!seenColors.has(key),'Same RGB split across Japanese cards: '+key);
   seenColors.add(key);lastColor=color;
  }
 }
 const firstByOperator=new Map();
 for(const route of sorted){
  const op=String(route.operatorId||route.operator?.ko||route.operator?.ja||'');
  if(!firstByOperator.has(op))firstByOperator.set(op,route);
 }
 for(const [operator,first] of firstByOperator){
  const hasMainline=routes.some(r=>String(r.operatorId||r.operator?.ko||r.operator?.ja||'')===operator&&/본선|本線/u.test([r.line?.ko,r.line?.ja].filter(Boolean).join(' ')));
  if(hasMainline)assert(/본선|本線/u.test([first.line?.ko,first.line?.ja].filter(Boolean).join(' ')),'Mainline not first for operator '+operator);
 }
 assert(!sourceHasSimilarColorSort(read(file)),'Approximate RGB sort must not be restored');
 const sample=[
  {id:'redBranch',operatorId:'a',lineColor:'#ff0000',line:{ko:'북부지선'}},
  {id:'blue1',operatorId:'b',lineColor:'#0000ff',line:{ko:'블루선'}},
  {id:'far',operatorId:'a',lineColor:'#0000ff',line:{ko:'남부선'}},
  {id:'similar',operatorId:'a',lineColor:'#ff1000',line:{ko:'빨간색 유사선'}},
  {id:'redMain',operatorId:'a',lineColor:'#FF0000',line:{ko:'동서본선'}},
  {id:'blueMain',operatorId:'a',lineColor:'#0000FF',line:{ja:'中央本線'}},
  {id:'blue2',operatorId:'b',lineColor:'#0000ff',line:{ko:'또다른선'}}
 ];
 const result=Array.from(sort(sample),r=>r.id);
 assert.deepEqual(result,['redMain','redBranch','blueMain','far','similar','blue1','blue2'],
  'Mainline-first / exact RGB / original remaining order failed');
 assert.equal(sample[1].id,'blue1','Source array mutated');
 console.log('PASS '+file+': '+sorted.length+' Japanese cards, '+seenOperators.size+' operators, exact RGB groups; mainlines first; original other-color order');
}
