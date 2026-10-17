#!/usr/bin/env node
const path=require('path'),{pathToFileURL}=require('url');
(async()=>{const{buildTypingModel}=await import(pathToFileURL(path.resolve(__dirname,'..','js','typing-model.js')));
const fixtures=[
['경의·중앙선','경의중앙선'],['4·19민주묘지','419민주묘지'],
['A-B','AB'],['A/B','AB'],['A.B','AB'],['A&B','AB'],
['A(B)','AB'],['공항 제2빌딩(제2여객터미널)','공항제2빌딩제2여객터미널'],
['나리타공항（제1여객터미널）','나리타공항제1여객터미널'],
['신주쿠(서쪽 출구)행','신주쿠서쪽출구행'],
['서울역(지하)(1호선)','서울역지하1호선'],
['독협대학앞〈소카마츠바라〉','독협대학앞소카마츠바라'],
['하네다공항【국내선】','하네다공항국내선'],
['도쿄[임시 승강장]','도쿄임시승강장'],
['오사카《특급》','오사카특급'],
['도쿄(특급(임시) 정차)','도쿄특급임시정차'],
['(임시역)','임시역'],['이름(미완성','이름미완성']];
const errors=[];for(const[display,input]of fixtures){const m=buildTypingModel(display);if(m.displayText!==display||m.inputText!==input||m.cells.length!==Array.from(display).length)errors.push(display+': '+m.inputText+' != '+input);if(m.cells.some(c=>(c.type==='fixed')===/[\p{L}\p{N}]/u.test(c.character)))errors.push(display+': wrong fixed glyph')}
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',cases:fixtures.length,bracketsOnlyAutoFilled:true,errors},null,2));process.exitCode=errors.length?1:0})().catch(e=>{console.error(e);process.exitCode=1});
