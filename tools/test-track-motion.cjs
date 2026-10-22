const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/track-motion.js'),'utf8').replace(/export /g,'')+';globalThis.api={pointAtTrackDistance,advanceTrackDistance}',c);
test('smoothing follows each retained curved edge instead of cutting its corner',()=>{
 const path={segment:[[0,0],[0,1],[1,1]],lengths:[0,1,2],total:2};let d=0,seenBend=false;
 for(let i=0;i<100;i++){const next=c.api.advanceTrackDistance(d,2,16);assert(next>=d&&next<=2);d=next;const p=c.api.pointAtTrackDistance(path,d);assert(p[0]===0||p[1]===1);if(p[0]>0)seenBend=true}assert(seenBend);
 assert.deepEqual(Array.from(c.api.pointAtTrackDistance(path,20)),[1,1]);assert.deepEqual(Array.from(c.api.pointAtTrackDistance(path,-1)),[0,0]);
});
test('rapid partial input and stale lower progress never reverse train distance',()=>{let d=.6;for(const target of [.7,.8,1]){d=c.api.advanceTrackDistance(d,target,40);assert(d>=.6&&d<=target)}assert.equal(c.api.advanceTrackDistance(d,.1,16),d)});

test('arrival waits for the current map render and stale sessions cannot move its successor',async()=>{
 const calls=[],g={setTrainTypingProgress:(...args)=>{calls.push(args);return true}};vm.createContext(g);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';globalThis.arrive=Game.prototype.trainArrival',g);
 let ready;const state={sessionId:1,mapRoute:{renderKey:'first'},options:{motion:true},mapReady:new Promise(r=>{ready=r})};const pending=g.arrive.call(state,1);await Promise.resolve();assert.equal(calls.length,0);ready();assert.equal(await pending,true);assert.deepEqual(calls[0],[1,true,'first']);
 state.mapReady=new Promise(r=>{ready=r});const stale=g.arrive.call(state,1);state.sessionId++;state.mapRoute={renderKey:'second'};ready();assert.equal(await stale,false);assert.equal(calls.length,1);
});

test('resuming during an arrival cannot bypass its map and animation barrier',async()=>{
 const g={$:()=>({}),performance:{now:()=>100}};vm.createContext(g);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';globalThis.pause=Game.prototype.togglePause',g);
 for(const freeDriveMode of [false,true]){let ready,moves=0;const state={finished:false,paused:true,pausedAt:0,pausedTotal:0,phase:'ARRIVING',sessionId:1,options:{stationAdvance:'auto'},freeDriveMode,arrivalPromise:new Promise(r=>{ready=r}),advance(){moves++},pendingFreeDriveMove(){moves++}};g.pause.call(state,false);await Promise.resolve();assert.equal(moves,0);ready(true);await Promise.resolve();assert.equal(moves,1)}
});

test('Korean station boundaries share the retained source vertex between adjacent segments',()=>{const r={};vm.createContext(r);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/route-renderer.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.travel=travelGeometry',r);const a=[37,127],b=[37.1,127.2],c=[37.2,127.3],d=[37.3,127.4],route={countryId:'kr',geometryReady:true,stations:[{},{},{}],directedSegments:[{geometryStatus:'ready',geometry:[a,b,c]},{geometryStatus:'ready',geometry:[c,d]}]};const v=r.travel(route);assert.deepEqual(Array.from(v.offsets),[0,2,3]);assert.deepEqual(Array.from(v.points[v.offsets[1]]),c)});


test('completed station typing catches the marker up in 50ms and never advances early',()=>{
 const src=fs.readFileSync(require('node:path').join(__dirname,'../js/route-renderer.js'),'utf8');
 const a=src.indexOf('function animateTypingTrain('),b=src.indexOf('export function setTrainTypingProgress(',a);
 assert(a>=0&&b>a);
 let now=1000,queue=[],arrivals=0;
 const ctx={
   performance:{now:()=>now},
   requestAnimationFrame:fn=>{queue.push(fn);return queue.length},
   advanceTrackDistance:(d,target,dt)=>c.api.advanceTrackDistance(d,target,dt),
   pointAtTrackDistance:(path,d)=>c.api.pointAtTrackDistance(path,d)
 };
 vm.createContext(ctx);
 vm.runInContext(src.slice(a,b)+';globalThis.animate=animateTypingTrain',ctx);
 const path={segment:[[0,0],[0,1],[1,1]],lengths:[0,1,2],total:2};
 let lastPoint=null;
 const rail={train:{setLatLng:p=>{lastPoint=p}},typingDistance:.5,typingProgress:.5,arrivalWaiters:[result=>{assert.equal(result,true);arrivals++}]};
 ctx.animate(rail,path,1,true);
 const tick=when=>{now=when;const frame=queue.shift();assert(frame,'missing animation frame');frame(now)};
 tick(1016);assert(rail.typingDistance<1);
 rail.typingProgress=1;
 ctx.animate(rail,path,2,true);
 tick(1032);assert.equal(arrivals,0);assert(rail.typingDistance<2);
 tick(1048);assert.equal(arrivals,0);
 tick(1064);assert.equal(arrivals,0);
 tick(1080);assert.equal(arrivals,1);
 assert.equal(rail.typingDistance,2);
 assert.deepEqual(Array.from(lastPoint),[1,1]);
 assert.equal(rail.typingAnimation,null);
});

test('SPACE waits for real arrival and repeated presses cannot finish a journey twice',async()=>{const c={$:()=>({hidden:false})};vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';globalThis.advance=Game.prototype.advance',c);let ready,moves=0,finishes=0;const g={finished:false,paused:false,phase:'CORRECT_WAITING',options:{stationAdvance:'space',mode:'complete'},arrivalPromise:new Promise(r=>ready=r),sessionId:1,sequence:[{id:'a'},{id:'b'}],index:0,boarding:false,targetStation:()=>({id:'b'}),advanceToNextStation(){moves++;this.index++},finish(){finishes++;this.finished=true}};g.advance=()=>c.advance.call(g);g.advance();g.advance();assert.equal(moves,0);assert.equal(finishes,0);ready(true);await Promise.resolve();await Promise.resolve();assert.equal(moves,1);assert.equal(finishes,1);g.advance();assert.equal(finishes,1)});
