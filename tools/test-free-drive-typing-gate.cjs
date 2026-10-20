#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const app=read('js/app.js'),bundle=read('js/app.bundle.js');
assert(app.includes("selectFreeDriveTarget(freeMove.dataset.freeTo,freeMove.dataset.freeRoute)"),'Next-station button must choose a typing target');
assert(!app.includes("freeDrive?.moveTo(freeMove.dataset.freeTo,freeMove.dataset.freeRoute)"),'Click may not teleport without typing');
assert(app.includes("if(game.paused||game.phase!=='TYPING')"),'TAB and click must respect train arrival');
const start=app.indexOf('function paintFreeDriveTarget(){'),end=app.indexOf('function renderGameFreeDriveOptions(',start);
assert(start>=0&&end>start,'Free-drive target selection must exist');
const states=[],warnings=[];
const buttons=[{dataset:{freeTo:'b2',freeRoute:'jp-b'},selected:false,classList:{toggle(_name,active){buttons[0].selected=active}},setAttribute(){}}];
const document={querySelectorAll:()=>buttons};
const edge={to:'b2',routeId:'jp-b',station:{id:'b2',ko:'오테마치'},direction:1,index:1};
let moved=0,changed=0,armed=0;
const freeDrive={
  activeRoute:'jp-a',
  snapshot(){return{routeId:this.activeRoute,edges:[edge]}},
  stationForRoute(){return edge.station},
  selectRoute(id){changed++;this.activeRoute=id;return true},
  moveTo(){moved++;throw Error('Cannot move by clicking an untyped destination')}
};
const game={
  freeDriveMode:true,freeDriveAwaitingStart:true,paused:false,phase:'TYPING',freeDriveTarget:null,
  setFreeDriveTypingTarget(selected,station){
    assert.equal(selected,edge);assert.equal(station,edge.station);
    armed++;this.freeDriveTarget={to:selected.to,routeId:selected.routeId,station};
  }
};
const context={game,freeDrive,document,toast:message=>warnings.push(message)};
vm.createContext(context);
vm.runInContext(app.slice(start,end)+';globalThis.selectFreeDrive=selectFreeDriveTarget',context);
assert.equal(context.selectFreeDrive('b2','jp-b'),false,'Cannot skip initial station typing');
game.freeDriveAwaitingStart=false;game.phase='ARRIVING';
assert.equal(context.selectFreeDrive('b2','jp-b'),false,'Cannot skip arriving animation');
game.phase='TYPING';game.paused=true;
assert.equal(context.selectFreeDrive('b2','jp-b'),false,'Cannot switch while paused');
game.paused=false;
assert.equal(context.selectFreeDrive('not-an-edge','jp-b'),false,'Cannot invent an unconnected neighbor');
assert.equal(context.selectFreeDrive('b2','jp-b'),true,'Selecting a valid next station must arm typing');
assert.equal(moved,0,'No physical move until typing completion');
assert.equal(changed,1,'Selected interchange line must be activated');
assert.equal(armed,1,'Typing target set exactly once');
assert.equal(game.freeDriveTarget.station.id,'b2','Typing must use destination line station, not shared interchange point');
assert.equal(buttons[0].selected,true,'Selected destination must be visible');
for(const marker of ['function selectFreeDriveTarget(', 'function paintFreeDriveTarget(', 'if(game.paused||game.phase!==\'TYPING\')', 'function famousLimitedExpressBrandIds(']){
  assert(bundle.includes(marker),'Deployed bundle missing control: '+marker);
}
new vm.Script(bundle,{filename:'js/app.bundle.js'});
// Free drive must use TypingStatistics.metrics() rather than nonexistent direct
// stats.cpm and stats.accuracy values.
const gameSource=read('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const viewNodes=new Map(),getView=id=>{
  if(!viewNodes.has(id))viewNodes.set(id,{textContent:''});
  return viewNodes.get(id);
};
const view={$:getView,formatTime:value=>String(value)};
vm.createContext(view);
vm.runInContext(gameSource+';globalThis.hudTick=Game.prototype.tick;globalThis.hudUpdate=Game.prototype.updateHud',view);
const session={
  freeDriveMode:true,paused:false,options:{mode:'free-drive'},
  sequence:[{id:'x'}],freeDriveState:{historyLength:3,transferCount:2},
  typedStationIds:[{id:'x'}],combo:14,metrics:()=>({elapsed:5500,cpm:320,accuracy:96.4}),
  updateHud(){return view.hudUpdate.call(this)}
};
view.hudTick.call(session);
assert.equal(getView('#hud-cpm').textContent,320);
assert.equal(getView('#hud-accuracy').textContent,'96.4%');
assert.equal(getView('#hud-progress').textContent,'3 VISITED');
assert.equal(getView('#hud-combo').textContent,'×14 · 환승 2');

console.log(JSON.stringify({status:'PASS',startGate:true,arrivalGate:true,pausedGate:true,noTeleport:true,transferTarget:'b2',warnings:warnings.length}));
