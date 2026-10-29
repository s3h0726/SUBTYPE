const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const c={console,setTimeout,clearTimeout,performance};vm.createContext(c);const utils=read('js/utils.js');vm.runInContext(utils.slice(utils.indexOf('export const koreanStationDisplayName'),utils.indexOf('export const normalize')).replace(/export /g,'')+';globalThis.label=koreanStationDisplayName;globalThis.title=koreanRouteDisplayText',c);
vm.runInContext(read('js/typing-model.js').replace(/export /g,''),c);vm.runInContext(read('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';globalThis.GameTest=Game',c);vm.runInContext(read('js/typing.js').replace('export class TypingController','globalThis.Controller=class TypingController'),c);
test('Korean suffix is removed exactly once; middle syllables and other countries stay unchanged',()=>{for(const [a,b] of [['용산역','용산'],['부산역','부산'],['시청역','시청'],['고속터미널역','고속터미널'],['서울역사','서울역사'],['역삼','역삼'],['역역','역'],['역','']]){assert.equal(c.label(a,'kr'),b);assert.equal(c.label(a,'jp'),a);assert.equal(c.label(a,'hk'),a)}assert.equal(c.label('용산역'.normalize('NFD'),'kr'),'용산')});
test('railway qualifiers at both ends and in brackets are removed from the Korean game label',()=>{
 for(const [raw,expected] of [
   ['경강선 이매역','이매'],['수인분당선 이매','이매'],
   ['보문역 우이신설선','보문'],['석계역 (6호선)','석계'],
   ['가산디지털단지 7호선','가산디지털단지'],
   ['수도권 1호선 부평역','부평'],['인천 2호선 인천시청역','인천시청'],
   ['상봉역 (경춘선/경의중앙선)','상봉'],['초지(서해)','초지'],
   ['구성 수인분당선','구성'],['고속터미널 (9호선)','고속터미널'],
   ['서울역 GTX','서울역'],['서울역 기차역','서울역'],
   ['둔촌오륜역 2번출구','둔촌오륜'],['동탄역 KTX','동탄'],
   ['역삼','역삼'],['남부터미널(예술의전당)','남부터미널(예술의전당)'],
   ['잠실(송파구청)','잠실(송파구청)']
 ]){
   assert.equal(c.label(raw,'kr',{mode:'subway'}),expected,raw);
   assert.equal(c.label(raw,'jp'),raw);
 }
 assert.equal(c.label('경강선 이매역'.normalize('NFD'),'kr',{mode:'subway'}),'이매');
});
test('the primary typing target is the station only, the source alias stays accepted',()=>{
 const g=Object.create(c.GameTest.prototype);g.route={countryId:'kr',mode:'subway'};
 for(const ko of ['경강선 이매역','보문역 우이신설선','석계역 (6호선)','가산디지털단지 7호선']){
   const values=g.answerValues({ko});
   assert.equal(values[0],c.buildTypingModel(c.label(ko,'kr',g.route)).inputText);
   assert(values.includes(c.buildTypingModel(ko).inputText));
 }
});

test('Seoul subway name is explicit and does not change the conventional railway station rule',()=>{for(const mode of ['subway','commuter_rail','light_rail'])assert.equal(c.label('서울역','kr',{mode}),'서울역');for(const mode of ['train','high_speed_rail'])assert.equal(c.label('서울역','kr',{mode}),'서울')});
test('service titles format only known station references, never generic UI or official source strings',()=>{const route={countryId:'kr',mode:'subway',stations:[{ko:'용산역'},{ko:'부산(지하)역'}]};const before=JSON.stringify(route);assert.equal(c.title('용산역 → 부산(지하)역 · 출발역 / 환승역 / 서울역사',route),'용산 → 부산(지하) · 출발역 / 환승역 / 서울역사');assert.equal(JSON.stringify(route),before)});
test('all 13 legacy and 325 research payloads retain names, station IDs, coordinates and geometry',()=>{let routes=0,calls=0;for(const dir of ['data/kr/generated/routes','data/kr/preview/routes','data/kr/provisional/routes'])for(const f of fs.readdirSync(path.join(__dirname,'..',dir))){const data=JSON.parse(read(dir+'/'+f)),r=data.route||data,before=JSON.stringify(r),g=Object.create(c.GameTest.prototype);g.route=r;for(const s of r.stations){const values=g.answerValues(s);assert.equal(values[0],c.buildTypingModel(c.label(s.ko,'kr',r)).inputText);assert(values.includes(c.buildTypingModel(s.ko).inputText));calls++}assert.equal(JSON.stringify(r),before);routes++}assert.equal(routes,338);assert(calls>2000)});
function controller(targets){const handlers={},input={value:'',disabled:false,readOnly:false,addEventListener:(k,f)=>handlers[k]=f,removeEventListener(){},closest:()=>({classList:{add(){},remove(){}}})};let finishes=0,last;const value=new c.Controller(input,{onChange:e=>last=e,onSubmit:()=>finishes++});value.setTarget(targets);return{value,input,handlers,get finishes(){return finishes},get last(){return last}}}
test('NFC and decomposed legacy suffix answers each complete once while the primary answer stays short',()=>{for(const answer of ['용산','용산역','용산역'.normalize('NFD')]){const f=controller(['용산','용산역']);f.input.value=answer;f.value.evaluate();f.value.evaluate();assert.equal(f.finishes,1);assert.equal(f.value.targets[0],'용산');assert.equal(f.last.state,'correct');f.value.destroy()}});
test('composition, Backspace and an error recover to the short default without duplicate submission',()=>{const f=controller(['부산','부산역']);f.input.value='부';f.value.evaluate('부',false,true);assert.equal(f.finishes,0);f.value.evaluate('붓',false,false);assert.equal(f.last.state,'wrong');f.input.value='';f.value.evaluate();f.handlers.compositionstart();f.input.value='부산'.normalize('NFD');f.value.evaluate(f.input.value,false,true);assert.equal(f.finishes,0);f.handlers.compositionend();assert.equal(f.finishes,1);f.value.evaluate();assert.equal(f.finishes,1);f.value.destroy()});
test('legacy suffix input uses short-target progress and combo units; wrong input and Backspace still recover',()=>{vm.runInContext(read('js/statistics-engine.js').replace('export class TypingStatistics','globalThis.Stats=class TypingStatistics'),c);const progress=[];c.document={body:{dataset:{}}};c.$=()=>({style:{},textContent:''});c.setTrainTypingProgress=p=>progress.push(p);const g=Object.create(c.GameTest.prototype);Object.assign(g,{route:{countryId:'kr',mode:'subway'},options:{motion:false,reducedMotion:true},targetStation:()=>({ko:'부산역'}),renderKoreanProgress(){},updateHud(){},stats:new c.Stats,phase:'TYPING',paused:false,combo:0,maxCombo:0,comboPrefixUnits:0});g.onInput({value:'부산역',state:'correct'});assert.equal(g.stats.lastValue,'부산');assert.equal(g.stats.typedUnits,Array.from('부산'.normalize('NFD')).length);assert.equal(progress.at(-1),1);assert.equal(g.errors,0);g.onInput({value:'붓',state:'wrong'});assert.equal(g.errors,1);assert.equal(g.combo,0);g.onInput({value:'',state:'empty'});g.onInput({value:'부산'.normalize('NFD'),state:'correct'});assert.equal(progress.at(-1),1);assert.equal(g.errors,1);assert(g.combo>0)});
