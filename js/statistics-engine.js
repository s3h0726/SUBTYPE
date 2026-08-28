export class TypingStatistics{
  constructor(started=performance.now()){this.reset(started)}
  reset(started=performance.now()){this.started=started;this.correctUnits=0;this.mistakeUnits=0;this.lastValue='';this.wrongLatched=false;this.lastUpdateMs=0}
  observe({value='',state='empty'}){const started=performance.now(),backspaced=Array.from(value).length<Array.from(this.lastValue).length;if(backspaced)this.wrongLatched=false;if(state==='wrong'&&!this.wrongLatched){this.mistakeUnits++;this.wrongLatched=true}if(state!=='wrong')this.wrongLatched=false;this.lastValue=value;this.lastUpdateMs=performance.now()-started;return this.lastUpdateMs}
  complete(value=''){this.correctUnits+=Array.from(value).length;this.lastValue='';this.wrongLatched=false}
  metrics(elapsedMs){const minutes=Math.max(1,elapsedMs)/60000,total=this.correctUnits+this.mistakeUnits;return{accuracy:total?this.correctUnits/total*100:100,cpm:Math.round(this.correctUnits/minutes),wpm:Math.round(this.correctUnits/5/minutes),correctUnits:this.correctUnits,mistakeUnits:this.mistakeUnits,typingUpdateMs:this.lastUpdateMs}}
}
