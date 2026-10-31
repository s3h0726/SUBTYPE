const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const engineFiles=['js/game.js','js/typing.js','js/typing-model.js','js/statistics-engine.js','js/route-integrity.js','js/hong-kong-policy.js','tools/lib/hk-game-completion.cjs'];
// Git's Windows checkout may use CRLF; line endings do not change the engine.
const engineFingerprint=()=>crypto.createHash('sha256').update(engineFiles.map(f=>f+'\0'+fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n')).join('\0')).digest('hex');
async function complete(route,{advance='AUTO'}={}){
 const nodes=new Map,events={},mapVisits=[],arrivals=[],classes=()=>({add(){},remove(){},toggle(){},contains(){return true}});
 const element=()=>({children:[],classList:classes(),style:{setProperty(){}},dataset:{},value:'',textContent:'',readOnly:false,disabled:false,hidden:false,clientWidth:900,scrollWidth:900,addEventListener(n,f){this.events??={};this.events[n]=f},removeEventListener(){},closest(){return this},replaceChildren(...c){this.children=c},focus(){},blur(){},getBoundingClientRect(){return{width:900,height:100}}});
 const $=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)};
 const context={console,performance,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},queueMicrotask,requestAnimationFrame:()=>1,cancelAnimationFrame(){},location:{hostname:'127.0.0.1'},document:{body:{dataset:{}},createElement:element,addEventListener:(n,f)=>events[n]=f},$,escapeHtml:s=>String(s??''),formatTime:String,toast:s=>{throw Error(s)},railDataRepository:{resolveRoute:r=>r,getOperator:()=>null,getLine:()=>null},resolveTransportStopTemplate:()=>({style:'hk',family:'hk',referenceSource:'fixture'}),transportStopNoun:()=> '역',operatorLogoMarkup:()=>'',lineBadgeMarkup:()=>'',lineBadgeMeta:()=>({}),
  renderGameMap:(r,i)=>{assert(r.geometry.length>=2);const s=r.stations[i];assert(s);assert.deepEqual([s.latitude,s.longitude],Array.from(r.geometry[s.geometryIndex]));mapVisits.push(i);return Promise.resolve(true)},
  setTrainTypingProgress:(p)=>{arrivals.push(p);return Promise.resolve(true)}};
 vm.createContext(context);
 for(const file of ['hong-kong-policy.js','korean-access-data.js','korean-access-policy.js','feature-flags.js','typing-model.js','typing.js','statistics-engine.js','route-integrity.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,''),context,{filename:file});
 vm.runInContext('globalThis.api={Game,buildTypingModel}',context);let result;
 const g=new context.api.Game({onFinish:r=>{assert.equal(result,undefined,'only one terminal result');result=r}});
 // Layout/paint and animation scheduling belong to representative browser QA.
 // Typing, start, stop sequence, advance, statistics and finish run unmodified.
 g.fitPrompt=()=>{};g.fitProgressCells=()=>{};
 assert.equal(g.start(route,{mode:'complete',stationAdvance:advance.toLowerCase(),motion:true}),true);
 const input=$('#typing-input'),steps=[];
 for(let i=0;i<route.stations.length;i++){
  const s=route.stations[i];assert.equal(g.targetStation()?.id,s.id);assert.equal($('#prompt-main').textContent,s.ja);assert.equal(input.readOnly,false);
  const expected=context.api.buildTypingModel(s.ko).inputText;assert.equal(g.typing.targets[0],expected);
  input.value=expected.normalize('NFD');input.events.input({isComposing:false});
  const count=g.typedStationIds.length;assert.equal(count,i+1);input.events.input({isComposing:false});assert.equal(g.typedStationIds.length,count,'duplicate input does not advance twice');
  await g.arrivalPromise;await Promise.resolve();await Promise.resolve();
  if(advance==='SPACE'){assert.equal(g.phase,'CORRECT_WAITING');events.keydown({code:'Space',key:' ',preventDefault(){}})}
  steps.push({visit:i,stationId:s.id,targetMatched:true});
 }
 assert.equal(g.finished,true);assert.equal(g.phase,'FINISHED');assert.equal(result.routeIntegrity,true);assert.equal(result.errors,0);assert.equal(result.completed,route.stations.length);
 assert.deepEqual(Array.from(result.typedStationIds),route.stations.map(s=>s.id));assert.deepEqual(Array.from(result.visitedStationIds),route.stations.slice(1).map(s=>s.id));
 assert.equal(g.currentStation().id,route.stations.at(-1).id);assert.equal(g.targetStation(),null);
 assert(arrivals.filter(p=>p===1).length>=route.stations.length-1);g.stop();g.typing.destroy();
 return{status:'PASS',started:true,routeIntegrity:true,terminalReached:true,terminalStationId:route.stations.at(-1).id,completed:result.completed,errors:result.errors,typedStationIds:Array.from(result.typedStationIds),visitedStationIds:Array.from(result.visitedStationIds),steps,advance,mapVisits,engineFingerprint:engineFingerprint(),scope:'Actual Game.start, TypingController input events, Game.advance and Game.finish in a DOM fixture. Map paint/animation scheduling mocked; not a browser, OS IME or performance measurement.'};
}
module.exports={complete,engineFingerprint};
