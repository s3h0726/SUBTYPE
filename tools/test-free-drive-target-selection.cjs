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
