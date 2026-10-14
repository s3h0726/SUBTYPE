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
  for(let i=0;i<direction.directedSegments.length;i++){
   const seg=direction.directedSegments[i],from=direction.stops[i],to=direction.stops[i+1];
   if(seg.fromStationId!==from.id||seg.toStationId!==to.id)throw Error(id+'/'+direction.id+': segment station ID mismatch at '+i);
   if(seg.geometryStatus&&seg.geometryStatus!=='ready')throw Error(id+'/'+direction.id+': segment is not geometry ready at '+i);
   if(!Array.isArray(seg.geometry)||seg.geometry.length<2)throw Error(id+'/'+direction.id+': missing track geometry at '+i);
   if(/straight.line fallback|geometry pending|synthetic/i.test(seg.source||''))throw Error(id+'/'+direction.id+': synthetic track at '+i);
   for(const pt of seg.geometry)if(!Array.isArray(pt)||pt.length!==2||!Number.isFinite(pt[0])||!Number.isFinite(pt[1])||pt[0]<33||pt[0]>40||pt[1]<124||pt[1]>132)
     throw Error(id+'/'+direction.id+': invalid Korean railway coordinate at '+i);
  }
 }
}
const expectedTermini={
 'kr-metro-1-main':['연천','구로'],
 'kr-metro-1-gyeongin':['구로','인천'],
 'kr-metro-1-gyeongbu':['구로','신창'],
 'kr-metro-1-gwangmyeong':['금천구청','광명'],
 'kr-metro-1-seodongtan':['병점','서동탄']
};
for(const [id,route] of routes){
 const actual=[route.stations[0]?.ko,route.stations.at(-1)?.ko];
 if(actual.join('|')!==expectedTermini[id].join('|'))throw Error(id+': terminal mismatch '+actual.join(' → '));
}
const ctx={console,globalThis:null,window:{},TRT_TOKYO_SERVICE_PATTERNS:{}};
ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(get('js/service-route-resolver.js').replace(/^export\s+/gm,'')+'\n;globalThis.TEST={koreanFamilyServiceChoices,resolveKoreanFamilyService};',ctx);
const integritySource=get('js/route-integrity.js').replace(/^export\s+/gm,'')+'\n;globalThis.__integrity={resolvePlayableRoute};';
vm.runInContext(integritySource,ctx,{filename:'route-integrity.js'});
const choices=ctx.TEST.koreanFamilyServiceChoices('kr-passenger-metro-1');
for(const choice of choices){if(/[一-鿿]/.test(choice.patternName?.ja||''))throw Error('Line 1 service has Chinese/Japanese characters: '+choice.id)}
for(const route of routes.values()){if(route.line.ja!==route.line.ko||route.names.ja!==route.names.ko)throw Error(route.id+': displayed as Chinese instead of Korean');}

if(choices.length!==18)throw Error('expected 9 documented Line 1 patterns in both directions, received '+choices.length);
for(const choice of choices){
 const result=ctx.TEST.resolveKoreanFamilyService(choice,id=>routes.get(id));
 const route=result.route;
 const playable=ctx.__integrity.resolvePlayableRoute(route);
 if(playable.stations.length!==route.stations.length||playable.segments.length!==route.stations.length-1)throw Error(choice.id+': route-integrity rejected physical segments');
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
 let completed=0,rendered=0;
 const simulation={finished:false,paused:false,phase:'ARRIVING',index:0,sequence:seq,boarding:true,mapRoute:result.route,
  options:{mode:'complete'},targetStation:proto.targetStation,currentStation:proto.currentStation,
  routeIndex(){return this.index},mapOptions(){return{}},
  advanceToNextStation:proto.advanceToNextStation,visitedStationIds:[],
  elapsed(){return 0},finish(){completed++;this.finished=true},renderStation(){rendered++},
  updateHud(){},syncDebug(){}};
 proto.advance.call(simulation);
 for(let index=1;index<seq.length;index++){simulation.phase='ARRIVING';proto.advance.call(simulation)}
 if(completed!==1||rendered!==seq.length-1||simulation.index!==seq.length-1||
    simulation.visitedStationIds.length!==seq.length-1||simulation.visitedStationIds.at(-1)!==arrived.id)
  throw Error(choice.id+': complete station-by-station journey failed to finish exactly once');
}
console.log('Line 1 geometry, pattern resolution, and terminal completion checks passed.');
