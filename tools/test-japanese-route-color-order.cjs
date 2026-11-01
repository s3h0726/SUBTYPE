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
 const sample=[
  {id:'red1',operatorId:'a',lineColor:'#ff0000'},
  {id:'blue1',operatorId:'b',lineColor:'#0000ff'},
  {id:'red2',operatorId:'a',lineColor:'#FF0000'},
  {id:'orange',operatorId:'a',lineColor:'#ff1000'},
  {id:'blue2',operatorId:'b',lineColor:'#0000ff'}
 ];
 const result=sort(sample).map(x=>x.id);
 assert.deepEqual(Array.from(result),['red1','red2','orange','blue1','blue2'],'Synthetic RGB/operator grouping failed');
 assert.equal(sample[1].id,'blue1','Source array mutated');
 console.log('PASS '+file+': '+sorted.length+' Japanese cards, '+seenOperators.size+' operators, contiguous RGB groups');
}
