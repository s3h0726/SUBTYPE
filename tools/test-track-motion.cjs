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
