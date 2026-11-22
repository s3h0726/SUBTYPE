#!/usr/bin/env node
'use strict';
// A catalogue service may reuse an already validated physical route rather
// than an unplayable duplicate. Never infer a missing track or join operators.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function resolver(file,routes){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const start=source.indexOf('const jpCatalogNameCache=new WeakMap();');
  const end=source.indexOf('// TrainLCD line IDs predate',start);
  assert(start>=0&&end>start,file+': catalog route helper not found');
  const sandbox={
    builtin:routes,
    globalThis:{TRT_NATIONWIDE_SERVICE_CATALOG:{lines:{
      '11503':{ja:'東海道本線(岐阜～米原)'}
    }}}
  };
  vm.createContext(sandbox);
  vm.runInContext(source.slice(start,end)+';globalThis.find=routeForCatalogLine;',sandbox);
  return sandbox.globalThis.find;
}
const physical=(id,operatorId,category,names,playable=true)=>({
  id,operatorId,category,countryId:'jp',geometryReady:true,playable,
  searchStations:names,stations:[],
  line:{ja:id==='line-11503'?'東海道本線(岐阜～米原)':id}
});
for(const file of ['js/app.js','js/app.bundle.js']){
  test(file+': reuse the existing JR Central main line for blocked 2-stop catalog segments',()=>{
    const blocked=physical('line-11503','jr-central','jr',['岐阜','西岐阜','大垣','米原'],false);
    const verified=physical('line-11502','jr-central','jr',['豊橋','名古屋','岐阜','大垣','米原']);
    const wrongOperator=physical('line-foreign','jr-east','jr',['岐阜','米原']);
    const wrongCategory=physical('line-shinkansen','jr-central','shinkansen',['岐阜','米原']);
    const find=resolver(file,[blocked,wrongOperator,wrongCategory,verified]);
    assert.equal(find('11503',['岐阜','米原']).id,'line-11502');
    assert.equal(find('11503',['米原','岐阜']).id,'line-11502');
    assert.equal(find('11503',['岐阜','大垣','米原']).id,'line-11502');
    assert.equal(blocked.playable,false,'the unverified source must remain blocked');
  });
  test(file+': original verified track wins; unrelated or ambiguous parallels do not unlock services',()=>{
    const blocked=physical('line-11503','jr-central','jr',['岐阜','大垣','米原'],false);
    const good=physical('line-11502','jr-central','jr',['岐阜','大垣','米原']);
    const other=physical('line-foreign','jr-east','jr',['岐阜','米原']);
    const highSpeed=physical('line-shinkansen','jr-central','shinkansen',['岐阜','米原']);
    assert.equal(resolver(file,[blocked,other,highSpeed])('11503',['岐阜','米原']).id,
      'line-11503','other operators or categories must not substitute for a blocked 2-stop track');
    const second=physical('line-alternative','jr-central','jr',['岐阜','米原']);
    assert.equal(resolver(file,[blocked,good,second])('11503',['岐阜','米原']).id,
      'line-11503','ambiguous same-operator alternatives must not be chosen');
    blocked.playable=true;
    assert.equal(resolver(file,[blocked,good])('11503',['岐阜','米原']).id,
      'line-11503','prefer the original route once it is verified');
  });
}
