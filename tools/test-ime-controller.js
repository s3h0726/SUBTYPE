const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
// Browser timers are part of TypingController's contract. Advance them explicitly
// so the delayed Korean IME completion path is tested without timing races.
let nextTimer=0;const timers=new Map();
const context={setTimeout:fn=>{const id=++nextTimer;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id)};
const flushTimers=()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn())};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/typing.js'),'utf8').replace('export class TypingController','globalThis.TypingController=class TypingController'),context);
const handlers={},classes=new Set(),input={value:'',disabled:false,readOnly:false,blur:()=>handlers.compositionend(),addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name],closest:()=>({classList:{add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x))}})};
let updates=[],completions=0;const controller=new context.TypingController(input,{onChange:event=>updates.push(event),onSubmit:()=>completions++});
const emit=(type,value,isComposing=false,extra={})=>{input.value=value;const event={target:input,isComposing,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...extra};handlers[type](event);return event};
const names=['도쿄','신주쿠','이케부쿠로','롯폰기','롯폰기잇초메','오차노미즈','모토마치주카가이'];
for(const name of names){controller.setTarget([name]);updates=[];const before=completions;emit('compositionstart','');let value='';for(const char of name){value+=char;emit('input',value,true);assert.equal(updates.at(-1).visualValue,value,'Composing text must render in the input callback');assert.equal(completions,before,'Composition must not submit');assert.equal(controller.committedValue,'')}
emit('compositionend',name);assert.equal(completions,before+1,'Exact answer must submit synchronously at compositionend');assert.equal(controller.committedValue,name);emit('input',name);assert.equal(completions,before+1,'Trailing input must not submit twice');}
controller.setTarget(['도쿄']);emit('compositionstart','');emit('input','ㄷ',true);assert.equal(updates.at(-1).state,'composing');emit('compositionend','도');assert.equal(updates.at(-1).state,'typing');emit('input','도쿄');assert.equal(completions,names.length+1);
controller.setTarget(['도쿄']);updates=[];const beforeWhitespace=completions;emit('input',' 도');assert.equal(input.value,'도','Leading whitespace must be removed from the input DOM');assert.equal(updates.at(-1).visualValue,'도','Leading whitespace must not enter visual state');emit('input',' 도쿄 ');assert.equal(completions,beforeWhitespace+1,'Whitespace around an exact answer must not delay completion');
controller.setTarget(['도쿄']);const keyEvent=emit('keydown','',false,{key:' ',code:'Space'}),beforeInputEvent=emit('beforeinput','',false,{inputType:'insertText',data:' '});assert.equal(keyEvent.defaultPrevented,true,'Space key insertion must be prevented');assert.equal(beforeInputEvent.defaultPrevented,true,'Whitespace beforeinput must be prevented');
for(const name of ['서울','까치산','부산역']){
 controller.setTarget([name]);const before=completions;
 emit('compositionstart','');emit('input',name,true);
 assert.equal(completions,before);assert.equal(timers.size,1);
 flushTimers();assert.equal(completions,before+1,'Unchanged exact Korean composition completes after timer');
 emit('compositionend',name);emit('input',name);flushTimers();
 assert.equal(completions,before+1,'Blur, compositionend and trailing input complete exactly once');
}
controller.setTarget(['서울']);emit('compositionstart','');emit('input','서울',true);
const beforeChanged=completions;emit('input','서우',true);flushTimers();
assert.equal(completions,beforeChanged,'Editing the composition cancels pending completion');
controller.setTarget(['서울']);emit('input','서울',true);controller.setTarget(['부산']);flushTimers();
assert.equal(completions,beforeChanged,'Changing target cancels the old timer');
for(const field of ['disabled','readOnly']){
 controller.setTarget(['서울']);emit('input','서울',true);input[field]=true;flushTimers();input[field]=false;
 assert.equal(completions,beforeChanged,'Inactive inputs cannot complete');
}
controller.setTarget(['서울']);emit('input','서울',true);controller.destroy();flushTimers();
assert.equal(completions,beforeChanged,'Destroy cancels pending completion');assert.equal(Object.keys(handlers).length,0);
console.log(JSON.stringify({status:'PASS',fixtures:names.length+3,visualUpdate:'synchronous during composition',completion:'compositionend or unchanged exact composition timer',duplicateCompletions:0,leadingWhitespaceRemoved:true,spaceInsertionPrevented:true,timerCancellation:true},null,2));
