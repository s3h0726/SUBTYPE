#!/usr/bin/env node
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),get=p=>fs.readFileSync(path.join(root,p),'utf8');
const ids=['kr-metro-1-main','kr-metro-1-gyeongin','kr-metro-1-gyeongbu','kr-metro-1-gwangmyeong','kr-metro-1-seodongtan'];
const routes=new Map(ids.map(id=>[id,JSON.parse(get('data/kr/generated/routes/'+id+'.json')).route]));
const index=JSON.parse(get('data/kr/generated/index.json'));
for(const [id,route] of routes){
 if(!index.routes.some(r=>r.id===id&&r.geometryReady&&r.lazySource))throw Error(id+' missing in game index');
 for(const direction of route.directions){
  if(!direction.geometry?.length||direction.stops.length<2)throw Error(id+' incomplete direction');
  let last=-1;for(const station of direction.stops){
   if(station.geometryIndex<last||station.geometryIndex>=direction.geometry.length)throw Error(id+' station offset out of order');
   last=station.geometryIndex;
  }
  if(direction.directedSegments.length!==direction.stops.length-1)throw Error(id+' segment count mismatch');
 }
}
const ctx={console,globalThis:null,window:{},TRT_TOKYO_SERVICE_PATTERNS:{}};
ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(get('js/service-route-resolver.js').replace(/^export\s+/gm,'')+'\n;globalThis.TEST={koreanFamilyServiceChoices,resolveKoreanFamilyService};',ctx);
const choices=ctx.TEST.koreanFamilyServiceChoices('kr-passenger-metro-1');
if(choices.length!==10)throw Error('expected 5 through patterns in both directions, received '+choices.length);
for(const choice of choices){
 const result=ctx.TEST.resolveKoreanFamilyService(choice,id=>routes.get(id));
 const route=result.route;
 if(route.stations.length<2||route.geometry.length<2)throw Error(choice.id+' unplayable');
 const first=route.stations[0],last=route.stations.at(-1);
 if(first.geometryIndex!==0||last.geometryIndex!==route.geometry.length-1)throw Error(choice.id+' incorrect endpoints');
 for(let i=1;i<route.stations.length;i++)if(route.stations[i].geometryIndex<route.stations[i-1].geometryIndex)throw Error(choice.id+' geometry order');
 console.log('READY',choice.id,first.ko,'→',last.ko,'stations',route.stations.length,'track nodes',route.geometry.length);
}
const gameContext={console,clearInterval,clearTimeout,queueMicrotask,renderGameMap(){},$(){return{hidden:false}},globalThis:null};
gameContext.globalThis=gameContext;vm.createContext(gameContext);
vm.runInContext(get('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/^export\s+/gm,'')+'\n;globalThis.GameToTest=Game;',gameContext);
const proto=gameContext.GameToTest.prototype;
for(const choice of choices){
 const result=ctx.TEST.resolveKoreanFamilyService(choice,id=>routes.get(id));
 const seq=result.route.stations,arrived=seq.at(-1);
 let completed=0,afterTerminal=false;
 const simulation={finished:false,paused:false,phase:'ARRIVING',index:seq.length-2,sequence:seq,boarding:false,
  options:{mode:'complete'},targetStation(){return this.sequence[this.index+1]},
  currentStation(){return this.sequence[this.index]},advanceToNextStation:proto.advanceToNextStation,
  visitedStationIds:[],elapsed(){return 0},finish(){completed++},renderStation(){afterTerminal=true},
  updateHud(){},syncDebug(){}};
 proto.advance.call(simulation);
 if(completed!==1||afterTerminal||simulation.index!==seq.length-1||simulation.visitedStationIds.at(-1)!==arrived.id)
  throw Error(choice.id+': terminal arrival does not finish exactly once');
}
console.log('Line 1 geometry, pattern resolution, and terminal completion checks passed.');
