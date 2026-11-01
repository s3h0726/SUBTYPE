'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const route={...JSON.parse(fs.readFileSync(path.join(root,'data/generated/routes/line-99213.json'),'utf8')).route,countryId:'jp'};
const elements=new Map();
const $=key=>{
  if(!elements.has(key))elements.set(key,{
    textContent:'',innerHTML:'',hidden:false,disabled:false,readOnly:false,dataset:{},
    style:{setProperty(){}},classList:{add(){},remove(){}},
    closest(){return{hidden:false,classList:{add(){},remove(){}}}}
  });
  return elements.get(key);
};
const c={
  $,normalize:value=>String(value),
  koreanStationDisplayName:value=>value||'',
  koreanRouteDisplayText:value=>value||'',
  hongKongRouteBlockReason:()=>'',
  hongKongTransferAllowed:()=>true,
  koreanRouteBlockReason:()=>'',
  railDataRepository:{resolveRoute:route=>route},
  resolvePlayableRoute:route=>({stations:route.stations,geometry:route.geometry||[],segments:route.directedSegments||[]}),
  renderGameMap:()=>Promise.resolve(),
  renderTaiwanGameDisplay:()=>{}
};
vm.createContext(c);
function compile(name){
  const source=fs.readFileSync(path.join(root,'js',name+'.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
  vm.runInContext(source,c);
}
compile('free-drive');
compile('game');
const FreeDrive=vm.runInContext('FreeDrive',c);
const Game=vm.runInContext('Game',c);
function fixture(){
  elements.clear();
  const drive=Object.create(FreeDrive.prototype);
  drive.renderMap=()=>{};drive.render=()=>{};drive.populateStartStations=()=>{};
  drive.setNetwork([structuredClone(route)]);
  const live=drive.routes[0];
  const game=Object.create(Game.prototype);
  Object.assign(game,{
    freeDriveMode:true,freeDriveAwaitingStart:true,freeDriveSelectedEdge:null,
    sessionId:1,phase:'TYPING',paused:false,finished:false,
    stats:{complete(){}},typedStationIds:[],
    stationKoDisplay:value=>value||'',
    answerValues:station=>[station.ko],
    typing:{setTarget(values){game.targetAnswers=values},focus(){},clear(){}},
    applyActiveBrand(){},renderKoreanProgress(){},fitPrompt(){},playTone(){},
    trainArrival(){return Promise.resolve(true)},
    onFreeDriveMove(to,routeId,fromKey){return drive.moveTo(to,routeId,fromKey)}
  });
  drive.onChange=state=>{if(game.freeDriveMode)game.renderFreeDriveState(state)};
  drive.start(live,0);
  game.renderFreeDriveState(drive.snapshot());
  return{drive,game,live};
}

test('Abukuma free drive advances one station per correct answer, never two',async()=>{
  const {game,drive,live}=fixture();
  assert.equal(game.freeDriveTarget.kind,'start');
  assert.equal(drive.snapshot().station.ja,'福島');
  game.correct(live.stations[0].ko);
  assert.equal(game.freeDriveTarget.station.ja,'卸町');
  assert.equal(drive.snapshot().station.ja,'福島');
  assert.equal(drive.history.length,1);
  // A late IME completion for the same departure must NOT move the next station.
  game.correct(live.stations[0].ko);
  assert.equal(game.freeDriveTarget.station.ja,'卸町');
  assert.equal(drive.history.length,1);
  for(let i=1;i<=4;i++){
    game.correct(live.stations[i].ko);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(drive.snapshot().station.ja,live.stations[i].ja,'arrived '+i);
    assert.equal(drive.history.length,i+1,'history count '+i);
    assert.equal(game.freeDriveTarget.station.ja,live.stations[i+1].ja,'next prompt '+i);
    assert.equal($('#previous-station-name').textContent,live.stations[i].ko,'current label '+i);
  }
});
test('stale transition source cannot skip stops or change history',()=>{
  const {drive,live}=fixture();
  const initial=drive.currentKey;
  const to=drive.edges().find(edge=>edge.station.ja==='卸町');
  assert(to);
  assert.equal(drive.moveTo(to.to,to.routeId,'stale-node'),false);
  assert.equal(drive.currentKey,initial);
  assert.equal(drive.history.length,1);
  assert.equal(drive.moveTo(to.to,to.routeId,initial),true);
  assert.equal(drive.snapshot().station.ja,'卸町');
  assert.equal(drive.history.length,2);
});
