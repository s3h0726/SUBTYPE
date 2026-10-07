const typingUnits=value=>Array.from(String(value??'').normalize('NFD')).length;

export class TypingStatistics{
  constructor(started=performance.now()){this.reset(started)}
  reset(started=performance.now()){
    this.started=started;
    this.typedUnits=0;
    this.correctUnits=0;
    this.mistakeUnits=0;
    this.lastValue='';
    this.wrongLatched=false;
    this.lastUpdateMs=0
  }
  observe({value='',state='empty',isComposing=false}){
    const started=performance.now();
    const currentUnits=typingUnits(value),previousUnits=typingUnits(this.lastValue);
    const addedUnits=Math.max(0,currentUnits-previousUnits);
    const backspaced=currentUnits<previousUnits;
    this.typedUnits+=addedUnits;
    if(backspaced)this.wrongLatched=false;
    let mistakeAdded=0;
    if(!isComposing&&state==='wrong'&&!this.wrongLatched){this.mistakeUnits++;mistakeAdded=1;this.wrongLatched=true}
    if(!isComposing&&state!=='wrong')this.wrongLatched=false;
    this.lastValue=value;
    this.lastUpdateMs=performance.now()-started;
    return{addedUnits,mistakeAdded,typingUpdateMs:this.lastUpdateMs}
  }
  complete(){
    this.lastValue='';
    this.wrongLatched=false
  }
  metrics(elapsedMs){
    const minutes=Math.max(1,elapsedMs)/60000;
    const correctUnits=Math.max(0,this.typedUnits-this.mistakeUnits);
    const accuracy=this.typedUnits?Math.max(0,Math.min(100,correctUnits/this.typedUnits*100)):100;
    return{accuracy,cpm:Math.round(this.typedUnits/minutes),wpm:Math.round(this.typedUnits/5/minutes),correctUnits,typedUnits:this.typedUnits,mistakeUnits:this.mistakeUnits,typingUpdateMs:this.lastUpdateMs}
  }
}
