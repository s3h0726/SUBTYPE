const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c={normalize:v=>String(v),$:()=>null};vm.createContext(c);
require('./lib/test-kr-access-context.cjs')(c);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/free-drive.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.FreeDriveTest=FreeDrive',c);
function engine(routes){const f=Object.create(c.FreeDriveTest.prototype);f.renderMap=()=>{};f.render=()=>{};f.emit=()=>{};f.setNetwork(routes);return f}
function route(id,countryId='kr',schemaVersion=1){return{id,countryId,schemaVersion,geometryReady:true,stations:[{id:id+'-city',ko:'시청',ja:'시청',latitude:37.56,longitude:126.97},{id:id+'-next',ko:'다음',ja:id,latitude:37.57,longitude:126.98}]}}
test('only explicitly confirmed Korean station pairs transfer; selection preserves position and history',()=>{
 const a=route('kr-metro-1-section-2'),b=route('kr-metro-2'),other=route('unconfirmed');const f=engine([a,b,other]);
 f.currentKey='kr-transfer:capital:시청';f.currentRouteId=a.id;f.history=[f.currentKey];
 assert.equal(f.current().routeIds.size,2);assert.equal(f.switchRouteAtCurrentStation(other.id),false);assert.equal(f.switchRouteAtCurrentStation(b.id),true);
 assert.equal(f.currentRouteId,b.id);assert.equal(f.snapshot().station.id,b.stations[0].id);assert.equal(f.history.length,1);assert.equal(f.switchRouteAtCurrentStation(b.id),false);
});
test('directional Korean service never manufactures a reverse edge at its terminus',()=>{const r=route('directional','kr',2),f=engine([r]);f.currentKey=r.stations[1].id;f.currentRouteId=r.id;assert.equal(f.edges().length,0);f.currentKey=r.stations[0].id;assert.equal(f.edges().length,1);assert.equal(f.edges()[0].direction,1)});
test('three or more connected Japanese lines remain individually selectable',()=>{const rs=['a','b','c','d'].map(id=>route(id,'jp')),f=engine(rs);f.currentKey=[...f.graph.keys()].find(k=>f.graph.get(k).routeIds.size===4);f.currentRouteId='a';f.history=[f.currentKey];for(const id of ['b','c','d','a'])assert.equal(f.switchRouteAtCurrentStation(id),true);assert.equal(f.history.length,1);assert.equal(f.switchRouteAtCurrentStation('absent'),false)});

test('stopping free drive removes Japanese choices before a Korean typing session starts',()=>{
 const make=()=>({hidden:false,innerHTML:'old Japanese route',dataset:{transferOpen:'true'},classList:{remove(){}},closest(){return{hidden:false}}}),elements=new Map(['#game-free-drive-options','#game-free-drive-tabs','#screen-game','#pause-overlay','#departure-overlay','#typing-input','#ko-progress','#pause-button'].map(id=>[id,make()]));
 const ctx={clearInterval(){},clearTimeout(){},document:{body:{dataset:{freeDrive:'true'}}},$:id=>elements.get(id)};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.GameTest=Game',ctx);
 const game={freeDriveMode:true,freeDriveState:{routeId:'old'},freeDriveTarget:{station:{id:'old'}},pendingFreeDriveMove(){assert.fail('stale move')}};ctx.GameTest.prototype.stop.call(game,false);
 for(const id of ['#game-free-drive-options','#game-free-drive-tabs']){assert.equal(elements.get(id).hidden,true);assert.equal(elements.get(id).innerHTML,'');assert.equal(elements.get(id).dataset.transferOpen,'false')}assert.equal(game.freeDriveMode,false);assert.equal(game.freeDriveState,null);assert.equal(game.freeDriveTarget,null);assert.equal(game.pendingFreeDriveMove,null);
});

test('named Hong Kong links retain separate names, actual stop coordinates and keep pending links disabled',()=>{
 c.TRT_HONG_KONG_INDEX=require('../data/hk/generated/index.json');
 const before=c.hongKongRouteBlockReason;c.hongKongRouteBlockReason=()=>'';
 try{
 const hkRoute=(id,stationId,ko,lat)=>({id,countryId:'hk',geometryReady:true,releaseStatus:'ready',geometryStatus:'verified',playable:true,stations:[{id:stationId,stationMasterId:stationId,ko,ja:ko,latitude:lat,longitude:114.16},{id:id+'-next',stationMasterId:id+'-next',ko:'다음',ja:'다음',latitude:lat+0.01,longitude:114.17}]});
 const a=hkRoute('hk-island-fixture','hk-mtr-CEN','센트럴',22.28),b=hkRoute('hk-airport-fixture','hk-mtr-HOK','홍콩',22.29),c1=hkRoute('hk-austin-fixture','hk-mtr-AUS','어스틴',22.30),c2=hkRoute('hk-kowloon-fixture','hk-mtr-KOW','구룡',22.31),unlinked=hkRoute('hk-unlinked-fixture','hk-mtr-TWW','추엔완웨스트',22.32);
 const f=engine([a,b,c1,c2,unlinked]);f.currentKey='hk-transfer:central-hong-kong';f.currentRouteId=a.id;f.history=[f.currentKey];
 assert.equal(f.graph.get(f.currentKey).routeIds.size,2);assert.equal(f.switchRouteAtCurrentStation(b.id),true);assert.equal(f.snapshot().station.ko,'홍콩');assert.equal(f.snapshot().station.latitude,22.29);assert.equal(f.history.length,1);
 f.currentKey='hk-transfer:kowloon-austin';f.currentRouteId=c1.id;assert.equal(f.switchRouteAtCurrentStation(c2.id),true);assert.equal(f.snapshot().station.ko,'구룡');
 f.currentKey=unlinked.stations[0].id;f.currentRouteId=unlinked.id;assert.equal(f.switchRouteAtCurrentStation(a.id),false);
 }finally{c.hongKongRouteBlockReason=before}
});
