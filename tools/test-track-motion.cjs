const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/track-motion.js'),'utf8').replace(/export /g,'')+';globalThis.api={pointAtTrackDistance,advanceTrackDistance}',c);
test('smoothing follows each retained curved edge instead of cutting its corner',()=>{
 const path={segment:[[0,0],[0,1],[1,1]],lengths:[0,1,2],total:2};let d=0,seenBend=false;
 for(let i=0;i<100;i++){const next=c.api.advanceTrackDistance(d,2,16);assert(next>=d&&next<=2);d=next;const p=c.api.pointAtTrackDistance(path,d);assert(p[0]===0||p[1]===1);if(p[0]>0)seenBend=true}assert(seenBend);
 assert.deepEqual(Array.from(c.api.pointAtTrackDistance(path,20)),[1,1]);assert.deepEqual(Array.from(c.api.pointAtTrackDistance(path,-1)),[0,0]);
});
test('rapid partial input and stale lower progress never reverse train distance',()=>{let d=.6;for(const target of [.7,.8,1]){d=c.api.advanceTrackDistance(d,target,40);assert(d>=.6&&d<=target)}assert.equal(c.api.advanceTrackDistance(d,.1,16),d)});

test('Korean station boundaries share the retained source vertex between adjacent segments',()=>{const r={};vm.createContext(r);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/route-renderer.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.travel=travelGeometry',r);const a=[37,127],b=[37.1,127.2],c=[37.2,127.3],d=[37.3,127.4],route={countryId:'kr',geometryReady:true,stations:[{},{},{}],directedSegments:[{geometryStatus:'ready',geometry:[a,b,c]},{geometryStatus:'ready',geometry:[c,d]}]};const v=r.travel(route);assert.deepEqual(Array.from(v.offsets),[0,2,3]);assert.deepEqual(Array.from(v.points[v.offsets[1]]),c)});
