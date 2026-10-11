const normalizeTypingValue=value=>String(value??'').normalize('NFC').replace(/\s+/gu,'');
export class TypingController{
  constructor(input,{onChange,onSubmit}){this.input=input;this.onChange=onChange;this.onSubmit=onSubmit;this.composing=false;this.imeCompletionTimer=null;this.visualValue='';this.committedValue='';this.submitted=false;this.handlers={compositionstart:()=>{this.composing=true},compositionend:()=>{this.composing=false;this.evaluate()},beforeinput:event=>{if(event.inputType==='insertText'&&/^\s+$/u.test(event.data||''))event.preventDefault()},input:event=>{this.evaluate(this.input.value,false,this.composing||event.isComposing===true)},keydown:event=>{if(event.code==='Space'||event.key===' '){event.preventDefault();return}if(event.key==='Enter'&&!this.composing&&!event.isComposing)this.evaluate(this.input.value,true)}};Object.entries(this.handlers).forEach(([event,handler])=>input.addEventListener(event,handler))}
  setTarget(values){clearTimeout(this.imeCompletionTimer);this.imeCompletionTimer=null;this.targets=[...new Set(values.filter(Boolean).map(normalizeTypingValue))];this.input.value='';this.visualValue='';this.committedValue='';this.submitted=false;this.input.closest('.typing-box')?.classList.remove('wrong','correct')}
  evaluate(rawValue=this.input.value,force=false,isComposing=this.composing){const raw=String(rawValue??'').normalize('NFC'),value=normalizeTypingValue(raw),target=this.targets?.[0]||'';if(raw!==value&&this.input.value===raw)this.input.value=value;this.visualValue=value;clearTimeout(this.imeCompletionTimer);this.imeCompletionTimer=null;if(!isComposing)this.committedValue=value;const exact=(this.targets||[]).includes(value),prefix=(this.targets||[]).some(candidate=>candidate.startsWith(value)),state=!value?'empty':isComposing?'composing':exact?'correct':prefix?'typing':'wrong';this.onChange?.({value,visualValue:value,committedValue:this.committedValue,isComposing,state,target});if(isComposing&&exact&&!this.submitted){
  // Some Korean IMEs keep the final syllable underlined until Space/blur.
  // Accept an unchanged exact answer without waiting for compositionend.
  this.imeCompletionTimer=setTimeout(()=>{
   if(this.submitted||this.input.disabled||this.input.readOnly)return;
   if(normalizeTypingValue(this.input.value)!==value||!this.targets.includes(value))return;
   this.input.blur();if(this.submitted)return;this.submitted=true;this.committedValue=value;this.composing=false;
   this.input.closest('.typing-box')?.classList.add('correct');this.onSubmit?.(value);
  },50);
 }
 if(isComposing||this.submitted)return;if(exact){this.submitted=true;this.input.closest('.typing-box')?.classList.add('correct');this.onSubmit?.(value)}else if(force||value&&!prefix)this.input.closest('.typing-box')?.classList.add('wrong');else this.input.closest('.typing-box')?.classList.remove('wrong')}
  focus(){if(this.input.disabled)return;this.input.focus({preventScroll:true});requestAnimationFrame(()=>{if(document.activeElement!==this.input&&!this.input.disabled)this.input.focus({preventScroll:true})})}
  isComposing(){return this.composing}
  destroy(){clearTimeout(this.imeCompletionTimer);Object.entries(this.handlers).forEach(([e,h])=>this.input.removeEventListener(e,h))}
}
