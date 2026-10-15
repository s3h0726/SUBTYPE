#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const route=JSON.parse(read('data/kr/generated/routes/kr-metro-3.json')).route;
const index=JSON.parse(read('data/kr/generated/index.json'));
const meta=index.routes.filter(m=>m.id==='kr-metro-3');
const fail=msg=>{throw Error('3호선: '+msg)};
if(meta.length!==1||!meta[0].geometryReady||meta[0].stationCount!==44)fail('published index missing');
if(route.stations.length!==44||route.directions.length!==2||route.geometryReady!==true)fail('invalid topology');
const names=route.stations.map(s=>s.ko);
if(names[0]!=='대화'||names.at(-1)!=='오금'||names[10]!=='지축'||names[11]!=='구파발')fail('wrong operator split/termini');
if(names.some((s,i)=>!s||s!==route.stations[i].ja))fail('non-Korean railway display names');
const d=(a,b)=>Math.hypot((a[0]-b[0])*111000,(a[1]-b[1])*88000);
if(route.geometry.some((p,i)=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||(i&&d(p,route.geometry[i-1])>1900)))fail('unverified track jump');
const ctx={};vm.createContext(ctx);
vm.runInContext(read('js/route-integrity.js').replace(/^export\s+/gm,'')+';globalThis.run=resolvePlayableRoute',ctx);
for(const dir of route.directions){
 const full={...route,stations:dir.stops,geometry:dir.geometry,directedSegments:dir.directedSegments};
 const result=ctx.run(full,{direction:'forward'});
 if(result.stations.length!==44||result.segments.length!==43)fail(dir.id+': game route rejected');
 if(result.segments.some(s=>s.endpointMismatch||s.geometry.length<2))fail(dir.id+': track mismatch');
 const expected=dir.id==='forward'?names:names.slice().reverse();
 if(dir.stops.some((s,i)=>s.ko!==expected[i]))fail(dir.id+': wrong station order');
 for(const [i,seg] of dir.directedSegments.entries()){
   if(seg.fromStationId!==dir.stops[i].id||seg.toStationId!==dir.stops[i+1].id)fail(dir.id+' wrong edges');
   if(!seg.source||seg.source.geometryDataset!=='matassp-seoul-isochrone-lines-geojson')fail('missing OSM provenance');
 }
 console.log(dir.id+': '+dir.stops[0].ko+' → '+dir.stops.at(-1).ko+' 44 stops; 43 OSM-derived track segments');
}
for(const svc of route.services||[]){
 const selected=svc.stops.map(id=>route.stations.find(s=>s.id===id));
 if(selected.some(x=>!x)||selected.length<2||selected.some((x,i)=>i>0&&x.geometryIndex<=selected[i-1].geometryIndex))fail('bad service '+svc.id);
 const d0=selected[0],d1=selected.at(-1);
 const start=d0.geometryIndex,end=d1.geometryIndex;
 if(end<=start||route.geometry.slice(start,end+1).length<2)fail('missing service tracks: '+svc.id);
 console.log('SERVICE '+svc.nameKo+' '+selected.length+' stops, '+(end-start+1)+' map points');
}
const gameContext={console,clearInterval,clearTimeout,queueMicrotask,renderGameMap(){},$(){return{hidden:false}},globalThis:null};
gameContext.globalThis=gameContext;vm.createContext(gameContext);
vm.runInContext(read('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/^export\s+/gm,'')+'\n;globalThis.GameToTest=Game;',gameContext);
const proto=gameContext.GameToTest.prototype;
for(const dir of route.directions){
 const seq=dir.stops;let completed=0,rendered=0;
 const simulation={finished:false,paused:false,phase:'ARRIVING',index:0,sequence:seq,boarding:true,mapRoute:route,
 options:{mode:'complete'},targetStation:proto.targetStation,currentStation:proto.currentStation,
 routeIndex(){return this.index},mapOptions(){return{}},advanceToNextStation:proto.advanceToNextStation,visitedStationIds:[],
 elapsed(){return 0},finish(){completed++;this.finished=true},renderStation(){rendered++},updateHud(){},syncDebug(){}};
 proto.advance.call(simulation);
 for(let i=1;i<seq.length;i++){simulation.phase='ARRIVING';proto.advance.call(simulation)}
 if(completed!==1||rendered!==seq.length-1||simulation.index!==seq.length-1||
 simulation.visitedStationIds.length!==seq.length-1||simulation.visitedStationIds.at(-1)!==seq.at(-1).id)
 fail(dir.id+': typed station-by-station journey did not finish exactly once');
}

console.log('Line 3 simulated full-route forward/reverse topology and partial services PASS.');
