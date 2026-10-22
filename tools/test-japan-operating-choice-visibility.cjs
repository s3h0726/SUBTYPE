#!/usr/bin/env node
'use strict';
// Regressions for displaying ALL Japanese operating patterns without
// incorrectly allowing unassembled/unverified patterns to launch.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('js/app.js'),bundle=read('js/app.bundle.js');
function extract(start,end){
  const i=source.indexOf(start),j=source.indexOf(end,i+start.length);
  assert(i>=0&&j>i,'Missing production function '+start);
  return source.slice(i,j);
}
const listCode=extract('function actualOperatingChoices(route){','function operatingPatternKey(choice){');
const pickerCode=extract('function configureJourneyPicker(){','function openSetup(route){');
test('full catalog is unchanged and display no longer filters unplayable services',()=>{
  const text=read('js/nationwide-service-catalog.js');
  const catalog=JSON.parse(text.split('window.TRT_NATIONWIDE_SERVICE_CATALOG=')[1].trim().replace(/;\\s*$/,''));
  assert(Object.keys(catalog.lines).length>=600);
  assert(Object.values(catalog.lines).reduce((n,line)=>n+(line.patterns||[]).length,0)>=2571);
  assert(!listCode.includes('choices.filter(choice=>operatingChoicePlayable'));
  assert(!listCode.includes('if(!duplicate)add(choice)'));
  assert(bundle.includes('function operatingChoiceStatus(choice,route){'));
  assert(bundle.includes('if(choices.length)return choices.sort'));
  assert(bundle.includes('if(selected?.countryId===\'jp\'){const state=operatingChoiceStatus'));
});
test('unplayable Shinkansen patterns remain listed in both directions without deduplication',()=>{
  const shared={originNames:{ja:'東京',ko:'도쿄'},destinationNames:{ja:'博多',ko:'하카타'},originId:'tokyo',destinationId:'hakata',trainType:{id:'nozomi',names:{ko:'노조미'}},patternName:{ko:'노조미'}};
  const fakePatterns=[{id:'a',type:{ko:'노조미'}},{id:'b',type:{ko:'노조미'}},{id:'c',type:{ko:'고다마'}}];
  const context={
    serviceJourneysForRoute:()=>[],servicePatternsForRoute:()=>[],trainTypeFor:()=>null,
    nexOperatingChoices:()=>[{id:'nex-1'},{id:'nex-2'}],
    famousLimitedExpressChoices:()=>[{id:'express-1'},{id:'express-2'}],
    koreanVerifiedChoices:()=>[],
    nationwideCatalogLine:()=>({data:{patterns:fakePatterns}}),
    catalogPatternChoice:(route,p,reverse)=>({...shared,id:p.id+(reverse?'-reverse':'-forward'),kind:'catalog',direction:reverse?'reverse':'forward',catalogPattern:p}),
    journeyLabel:value=>typeof value==='string'?value:value?.names?.ko||value?.ko||'',
    normalize:v=>String(v).trim(),
    globalThis:{TRT_RAIL_SYSTEM:{throughServices:[],trainServices:[]}}
  };
  vm.createContext(context);
  vm.runInContext(listCode+';globalThis.readOperatingChoices=actualOperatingChoices',context);
  const list=context.globalThis.readOperatingChoices({id:'shinkansen-tokaido',countryId:'jp',stations:[{id:'tokyo',ja:'東京'},{id:'hakata',ja:'博多'}],services:[]});
  assert.equal(list.length,6,'must preserve all three patterns in both directions, even identical endpoints');
  assert.equal(new Set(list.map(item=>item.id)).size,6);
  assert.equal(context.globalThis.readOperatingChoices({id:'line-11328',countryId:'jp'}).length,2,'NEX must retain unavailable directions');
  assert.equal(context.globalThis.readOperatingChoices({id:'famous',countryId:'jp',famousExpress:true}).length,2,'famous expresses must not be silently filtered');
});
test('picker shows unavailable journeys with reason and disables launch only for them',()=>{
  function element(){
    const e={hidden:false,value:'',disabled:false,dataset:{},style:{},textContent:'',options:[],onchange:null};
    Object.defineProperty(e,'innerHTML',{get(){return e._html||''},set(v){e._html=v;const values=[...v.matchAll(/<option value="([^"]*)"/g)].map(x=>x[1]);e.options=values;e.value=values[0]||''}});
    e.replaceChildren=()=>{e.innerHTML=''};
    return e;
  }
  const nodes=new Map(['#journey-picker','#journey-pattern','#journey-direction','#journey-origin','#journey-destination','#journey-summary','#service-direction','#setup-form button[type="submit"]','#setup-route .route-endpoints'].map(key=>[key,element()]));
  const make=(id,playable)=>({kind:'catalog',id,originId:'tokyo',destinationId:'hakata',originNames:{ko:'도쿄',ja:'東京'},destinationNames:{ko:'하카타',ja:'博多'},direction:'forward',patternName:{ko:'노조미'},trainType:{id:'nozomi',names:{ko:'노조미'}},catalogPattern:{id},playable});
  const list=[make('ok',true),make('blocked-one',false),make('blocked-two',false)];
  const ctx={
    $:key=>nodes.get(key),selected:{countryId:'jp',id:'shinkansen-tokaido'},
    koreaFamilyChoices:null,actualOperatingChoices:()=>list,
    operatingChoiceStatus:choice=>choice.playable?{playable:true,reason:''}:{playable:false,reason:'검증되지 않은 분기 선형'},
    operatingPatternKey:choice=>choice.patternName.ko,
    operatingPatternLabel:choice=>choice.patternName.ko,
    operatingDirectionLabel:()=> '도쿄 → 하카타',
    journeyStationKey:(names,id)=>names?.ja||id,
    journeyLabel:n=>typeof n==='string'?n:n?.ko||n?.names?.ko||n?.ja||'',
    normalize:v=>String(v).trim().toLowerCase(),
    escapeHtml:v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;')
  };
  vm.createContext(ctx);
  vm.runInContext(pickerCode+';globalThis.displayServices=configureJourneyPicker',ctx);
  ctx.globalThis.displayServices();
  const dest=nodes.get('#journey-destination'),submit=nodes.get('#setup-form button[type="submit"]'),summary=nodes.get('#journey-summary');
  assert.equal(dest.options.length,3,'same-type same-destination patterns must remain separately selectable');
  assert.equal(submit.disabled,false,'playable entry should be preselected');
  assert.match(summary.textContent,/등록 3개 \/ 실행 가능 1개/);
  dest.value='blocked-one';dest.onchange();
  assert.equal(submit.disabled,true,'unverified route must never start game');
  assert.match(summary.textContent,/실행 불가: 검증되지 않은 분기 선형/);
  dest.value='ok';dest.onchange();
  assert.equal(submit.disabled,false,'working route remains playable');
});
