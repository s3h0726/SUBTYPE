#!/usr/bin/env node
const path=require('path'),{pathToFileURL}=require('url');
(async()=>{
 const {buildTypingModel}=await import(pathToFileURL(path.resolve(__dirname,'..','js','typing-model.js')));
 const fixtures=[
  ['경의·중앙선','경의중앙선'],
  ['4·19민주묘지','419민주묘지'],
  ['A-B','AB'],['A/B','AB'],['A.B','AB'],['A&B','AB'],
  ['A(B)','A'],['공항 제2빌딩(제2여객터미널)','공항제2빌딩'],
  ['나리타공항（제1여객터미널）','나리타공항'],
  ['신주쿠(서쪽 출구)행','신주쿠행'],
  ['서울역(지하)(1호선)','서울역'],
  ['독협대학앞〈소카마츠바라〉','독협대학앞'],
  ['하네다공항【국내선】','하네다공항'],
  ['도쿄[임시 승강장]','도쿄'],
  ['오사카《특급》','오사카'],
  ['도쿄(특급(임시) 정차)','도쿄'],
  ['(임시역)','임시역'],
  ['이름(미완성','이름미완성']
 ];
 const errors=[];
 for(const [display,input] of fixtures){
  const model=buildTypingModel(display);
  if(model.displayText!==display||model.inputText!==input)errors.push(display+': '+model.inputText+' != '+input);
  if(model.cells.length!==Array.from(display).length)errors.push(display+': lost full-display cells');
  if(Array.from(model.inputText).length!==model.inputLength)errors.push(display+': incorrect input length');
  const originalFixed=Array.from(display).filter(ch=>!/[\p{L}\p{N}]/u.test(ch));
  if(originalFixed.some(ch=>!model.cells.some(cell=>cell.type==='fixed'&&cell.character===ch)))errors.push(display+': punctuation not auto filled');
 }
 const result={status:errors.length?'FAIL':'PASS',fixtures:fixtures.length,parenthesesAndAnnotationsAutoFilled:true,displayNamesPreserved:true,errors};
 console.log(JSON.stringify(result,null,2));process.exitCode=errors.length?1:0;
})().catch(error=>{console.error(error);process.exitCode=1});
