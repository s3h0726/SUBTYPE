#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const descriptionSrc=read('js/route-service-descriptions.js').replace(/\bexport\s+/g,'');
const ctx={};vm.createContext(ctx);
vm.runInContext(descriptionSrc+';globalThis.descriptions={describeRoute,describeOperatingPattern,describeOperatingJourney}',ctx);
const {describeRoute,describeOperatingPattern,describeOperatingJourney}=ctx.descriptions;
const index=read('js/japan-lite-index.js');
const japan=JSON.parse(index.slice(index.indexOf('=')+1,index.lastIndexOf(';')));
const koreanSrc=read('js/korea-index-data.js');
const korea=JSON.parse(koreanSrc.slice(koreanSrc.indexOf('=')+1,koreanSrc.lastIndexOf(';')));
let total=0;
for(const route of [...japan.routes,...korea.routes]){
  const label=describeRoute(route);
  assert.ok(label&&label.length<112,route.id+': missing or long description');
  assert.ok(!/undefined|null|NaN/.test(label),route.id+': invalid description');
  total++;
}
const loop=describeRoute({category:'subway',loop:true,stations:[{ko:'시청'},{ko:'시청'}]});
assert.match(loop,/순환/);
const express={originNames:{ko:'용산'},destinationNames:{ko:'동인천'},trainType:{ko:'급행'},throughServiceId:'sample'};
assert.match(describeOperatingPattern(express,{}),/급행/);
assert.match(describeOperatingPattern(express,{}),/직통/);
assert.match(describeOperatingJourney(express,{}),/직통/);
assert.match(describeOperatingJourney({kind:'fallback'},{}),/기본 운행/);
assert.match(describeRoute({description:'운영사 확인을 거친 노선 설명',category:'jr'}),/운영사 확인/);
for(const file of ['js/app.js','js/app.bundle.js']){
 const src=read(file);
 for(const marker of ['describeRoute(r)','describeRoute(selected)','describeOperatingPattern(choice,selected)','describeOperatingJourney(choice,selected)','operating-pattern-description','journey-card-description','line-card-description'])
   assert.ok(src.includes(marker),file+': missing UI blurb '+marker);
}
const bundle=read('js/app.bundle.js');
assert.ok(bundle.includes('function describeRoute('));
assert.doesNotThrow(()=>new Function(bundle),'Deployed bundle syntax must remain valid');
const css=read('css/service-picker-rebuild.css');
assert.ok(css.includes('.line-card-description')&&css.includes('.operating-pattern-description'));
console.log('PASS: '+total+' Japanese/Korean route card descriptions and service UI/bundle checks');
