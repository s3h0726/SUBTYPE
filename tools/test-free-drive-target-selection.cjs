'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const elements=new Map();
const $=id=>{
  if(!elements.has(id))elements.set(id,{
    textContent:'',innerHTML:'',hidden:false,disabled:false,readOnly:false,
    style:{setProperty(){}},classList:{add(){},remove(){}},
    closest(){return{hidden:false,classList:{add(){},remove(){}}}}
  });
  return elements.get(id);
};
const context={$,
  renderGameMap(){return null},
  renderTaiwanGameDisplay(){},
  railDataRepository:{resolveRoute(route){return route}},
  resolvePlayableRoute(route){return{stations:route.stations,geometry:[],segments:[]}},
};
vm.createContext(context);
const source=fs.readFileSync(path.join(root,'js/game.js'),'utf8')
  .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
vm.runInContext(source+';globalThis.FreeDriveGame=Game',context);
const Game=context.FreeDriveGame;

function fixture(countryId='jp'){
  elements.clear();
  const previous={id:'previous',ko:'이전역',ja:'前駅'};
  const from={id:'start',ko:'출발역',ja:'出発駅'};
  const next={id:'next',ko:'다음역',ja:'次駅',romaji:'Next'};
  const route={id:'line',countryId,lineColor:'#123456',line:{ko:'시험 노선',ja:'試験線'},stations:[previous,from,next]};
  const backward={route,routeId:route.id,index:0,to:'previous',station:previous,direction:-1};
  const forward={route,routeId:route.id,index:2,to:'next',station:next,direction:1};
  const game=Object.create(Game.prototype);
  Object.assign(game,{
    freeDriveMode:true,freeDriveAwaitingStart:false,freeDriveSelectedEdge:null,
    freeDriveTarget:null,phase:'TYPING',paused:false,finished:false,
    route,sequence:route.stations,index:1,mapRoute:null,
    freeDriveState:{route,routeId:route.id,edges:[forward,backward]},
    stats:{complete(){}},typedStationIds:[],
    stationKoDisplay(value){return value||''},
    answerValues(station){return[station.ko]},
    typing:{setTarget(values){game.acceptedAnswers=values},focus(){}},
    applyActiveBrand(){},fitPrompt(){},renderKoreanProgress(){},playTone(){}
  });
  return{game,route,from,next,previous,backward,forward};
}

for(const countryId of ['jp','kr','hk','tw'])test(countryId+': next station sign matches actual typing answer',()=>{
  const {game,next}=fixture(countryId);
  assert.equal(game.chooseFreeDriveTarget(next.id,'line'),true);
  assert.equal(game.freeDriveTarget.station.id,next.id);
  assert.equal($('#prompt-main').textContent,countryId==='kr'?'다음역':'次駅');
  assert.equal($('#prompt-ko').textContent,'다음역');
  assert.equal(game.acceptedAnswers[0],'다음역');
});

test('clicking a destination selects it but never moves the graph',()=>{
  const {game,next}=fixture('kr');
  let movements=0;
  game.onFreeDriveMove=()=>movements++;
  assert.equal(game.chooseFreeDriveTarget(next.id,'line'),true);
  assert.equal(game.index,1);
  assert.equal(movements,0);
  assert.equal(game.freeDriveTarget.to,next.id);
});

test('departure typing cannot be skipped; selected reverse destination is retained',()=>{
  const {game,from,previous}=fixture('jp');
  game.freeDriveAwaitingStart=true;
  game.freeDriveTarget={kind:'start',station:from};
  assert.equal(game.chooseFreeDriveTarget(previous.id,'line'),true);
  assert.equal(game.freeDriveTarget.kind,'start');
  game.correct();
  assert.equal(game.freeDriveTarget.to,previous.id);
  assert.equal(game.phase,'TYPING');
  assert.equal(game.acceptedAnswers[0],'이전역');
});

test('invalid or arriving selections are rejected without changing target',()=>{
  const {game}=fixture('hk');
  assert.equal(game.chooseFreeDriveTarget('not-connected','line'),false);
  assert.equal(game.freeDriveTarget,null);
  game.phase='ARRIVING';
  assert.equal(game.chooseFreeDriveTarget('next','line'),false);
  assert.equal(game.freeDriveTarget,null);
});

test('game UI changes selected typing target instead of calling moveTo directly',()=>{
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  const section=app.slice(app.indexOf("const freeMove=e.target.closest('[data-free-to][data-free-route]')"));
  assert.match(section,/chooseFreeDriveTarget\(freeMove\.dataset\.freeTo,freeMove\.dataset\.freeRoute\)/);
  assert.doesNotMatch(section.slice(0,450),/freeDrive\?\.moveTo\(/);
});

const abukumaRoute=()=>{
  const route=JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes/line-99213.json'),'utf8')).route;
  return {...route,countryId:'jp'};
};
const abukumaEdge=(route,from,to)=>({
  to:route.stations[to].id,routeId:route.id,route,index:to,
  direction:to>from?1:-1,station:route.stations[to]
});

test('Abukuma Express station order is continuous: Fukushima -> Oroshimachi -> Fukushima-Gakuinmae',async()=>{
  const route=abukumaRoute();
  assert.deepEqual(route.stations.slice(0,3).map(station=>station.ja),['福島','卸町','福島学院前']);
  const {game}=fixture('jp');
  game.route=route;game.sequence=route.stations;game.index=0;
  game.freeDriveAwaitingStart=true;game.freeDriveTarget={kind:'start',station:route.stations[0]};
  game.freeDriveState={route,routeId:route.id,stationIndex:0,station:route.stations[0],edges:[abukumaEdge(route,0,1)]};
  game.sessionId=1;const moves=[];
  game.onFreeDriveMove=(to)=>{moves.push(to);return true};
  game.trainArrival=()=>Promise.resolve(true);
  game.correct();
  assert.equal(game.freeDriveTarget.station.id,route.stations[1].id,'after start station the target must be exactly the second station');
  assert.equal($('#prompt-main').textContent,'卸町','station sign must display the second station');
  assert.deepEqual(moves,[],'typing start station must never jump or move');
  game.correct();
  await Promise.resolve();
  assert.deepEqual(moves,[route.stations[1].id],'typing second station moves exactly one station, not to third');
});

test('free-drive current station label is the actual station rather than its predecessor',()=>{
  const route=abukumaRoute();
  assert.deepEqual(route.stations.slice(2,5).map(station=>station.ja),['福島学院前','瀬上','向瀬上']);
  const {game}=fixture('jp');
  game.freeDriveAwaitingStart=false;
  const state={route,routeId:route.id,stationIndex:3,station:route.stations[3],
    historyLength:4,transferCount:0,edges:[abukumaEdge(route,3,4),abukumaEdge(route,3,2)]};
  game.renderFreeDriveState(state);
  assert.equal($('#previous-station-name').textContent,'세노우에','CURRENT must show Senoue, not Fukushima-Gakuinmae');
  assert.equal($('#prompt-main').textContent,'向瀬上','next prompt follows current station');
  assert.equal($('#next-station-name').textContent,'무카이세노우에');
  assert.equal($('#following-stop-label').textContent,'다음 역');
});

test('free-drive route startup ignores previously selected index from another line',()=>{
  const source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  const section=source.slice(source.indexOf('async function startFreeDrive(route){'),source.indexOf('function renderHome(){'));
  assert.match(section,/const startIndex=0;/);
  assert.doesNotMatch(section,/const chosenStart=Number\(/);
});

test('next station UI is outside the sign: options cannot push station name over its header',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const game=html.slice(html.indexOf('<section id="screen-game"'),html.indexOf('<section id="screen-free-drive"'));
  const title=game.indexOf('id="prompt-main"');
  const options=game.indexOf('id="game-free-drive-options"');
  const signEnd=game.indexOf('</section>',title);
  assert(title>=0&&signEnd>title&&options>signEnd,'route choices must be siblings of the sign wrapper');
  assert.equal((game.match(/id="game-free-drive-options"/g)||[]).length,1);
  const css=fs.readFileSync(path.join(root,'css/free-drive.css'),'utf8');
  assert.match(css,/#screen-game\.free-drive-active #game-free-drive-options\s*\{/);
  assert.match(css,/overflow-y:auto/);
});


test('stale IME completion cannot submit the next station after departure',()=>{
  const {game,from,next}=fixture('jp');
  game.freeDriveAwaitingStart=true;
  game.freeDriveTarget={kind:'start',station:from};
  game.correct('출발역');
  assert.equal(game.freeDriveTarget.station.id,next.id);
  assert.equal(game.phase,'TYPING');
  const before=game.typedStationIds.length;
  game.correct('출발역'); // Late duplicate compositionend from the previous target
  assert.equal(game.phase,'TYPING');
  assert.equal(game.freeDriveTarget.station.id,next.id);
  assert.equal(game.typedStationIds.length,before);
});

test('route-choice renderer cannot silently change typing destination',()=>{
  const source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  const renderer=source.slice(source.indexOf('function renderGameFreeDriveOptions(state){'),source.indexOf('// Keep the rail system lazy',source.indexOf('function renderGameFreeDriveOptions(state){')));
  assert(!renderer.includes('setFreeDriveTypingTarget'),'a redraw may not mutate the typing station');
  assert(!renderer.includes('moveTo('),'a redraw may not move the train');
  const change=source.slice(source.indexOf('freeDrive=new FreeDrive({'),source.indexOf("$('#free-drive-custom')",source.indexOf('freeDrive=new FreeDrive({')));
  assert(!change.includes('freeDriveAwaitingStart=true'),'a transfer should not restart departure typing');
  assert.match(source,/onFreeDriveMove:\(to,routeId,fromKey\)=>freeDrive\?\.moveTo\(to,routeId,fromKey\)/);
});

test('free-drive desktop and short-screen CSS preserve separate input and station rows',()=>{
  const css=fs.readFileSync(path.join(root,'css/free-drive.css'),'utf8');
  assert.match(css,/Station-name\/typing collision fix/);
  assert.match(css,/grid-template-rows:14px minmax\(30px,1fr\) minmax\(24px,auto\) 13px 56px!important/);
  assert.match(css,/grid-template-rows:12px minmax\(24px,1fr\) 21px 11px 46px!important/);
  assert.match(css,/font:650 22px\/1\.3/);
  assert.match(css,/#screen-game\.active\.free-drive-active \.station-current #ko-progress\s*\{[\s\S]*?display:none!important/);
  assert.match(css,/-webkit-text-fill-color:#13251c!important/);
});
