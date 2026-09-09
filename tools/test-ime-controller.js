const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/typing.js'),'utf8').replace('export class TypingController','globalThis.TypingController=class TypingController'),context);
const handlers={},classes=new Set(),input={value:'',addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:()=>{},closest:()=>({classList:{add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x))}})};
let updates=[],completions=0;const controller=new context.TypingController(input,{onChange:event=>updates.push(event),onSubmit:()=>completions++});
const emit=(type,value,isComposing=false)=>{input.value=value;handlers[type]({target:input,isComposing})};
const names=['도쿄','신주쿠','이케부쿠로','롯폰기','롯폰기잇초메','오차노미즈','모토마치주카가이'];
for(const name of names){controller.setTarget([name]);updates=[];const before=completions;emit('compositionstart','');let value='';for(const char of name){value+=char;emit('input',value,true);assert.equal(updates.at(-1).visualValue,value,'Composing text must render in the input callback');assert.equal(completions,before,'Composition must not submit');assert.equal(controller.committedValue,'')}
emit('compositionend',name);assert.equal(completions,before+1,'Exact answer must submit synchronously at compositionend');assert.equal(controller.committedValue,name);emit('input',name);assert.equal(completions,before+1,'Trailing input must not submit twice');}
controller.setTarget(['도쿄']);emit('compositionstart','');emit('input','ㄷ',true);assert.equal(updates.at(-1).state,'composing');emit('compositionend','도');assert.equal(updates.at(-1).state,'typing');emit('input','도쿄');assert.equal(completions,names.length+1);
console.log(JSON.stringify({status:'PASS',fixtures:names.length,visualUpdate:'synchronous during composition',completion:'synchronous after compositionend',duplicateCompletions:0},null,2));
