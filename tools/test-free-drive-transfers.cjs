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

test('different Japanese station names become switchable only for reviewed nearby interchange groups',()=>{
 const route=(id,ja,lat,lon,countryId='jp')=>({id,countryId,geometryReady:true,stations:[{id:id+'-a',ja,ko:ja,latitude:lat,longitude:lon},{id:id+'-b',ja:'次駅',ko:'다음 역',latitude:lat+0.01,longitude:lon+0.01}]});
 const h=engine([route('metro-hibiya','日比谷',35.674,139.758),route('metro-yurakucho','有楽町',35.675,139.762),route('toei-kasuga','春日',35.709,139.753),route('metro-korakuen','後楽園',35.708,139.753),route('foreign-yurakucho','有楽町',36.6,139.76)]);
 h.currentKey='jp-transfer:tokyo-hibiya-yurakucho';h.currentRouteId='metro-hibiya';h.history=[h.currentKey];
 assert.equal(h.switchRouteAtCurrentStation('metro-yurakucho'),true);assert.equal(h.snapshot().station.ja,'有楽町');assert.equal(h.snapshot().station.latitude,35.675);assert.equal(h.history.length,1);
 assert.equal(h.switchRouteAtCurrentStation('toei-kasuga'),false);
 h.currentKey='jp-transfer:tokyo-korakuen-kasuga';h.currentRouteId='metro-korakuen';assert.equal(h.switchRouteAtCurrentStation('toei-kasuga'),true);
 assert.notEqual(h.currentKey,'foreign-yurakucho-a');assert.equal(c.FreeDriveTest.prototype.stationForRoute.call(h,'foreign-yurakucho-a','foreign-yurakucho').ja,'有楽町');
});
test('Japanese loop graph refuses to invent a final edge unless a closed source stop exists',()=>{
 const r={id:'unfinished-jp-loop',countryId:'jp',loop:true,stations:[{id:'A',ja:'甲',latitude:35.5,longitude:139.5},{id:'B',ja:'乙',latitude:35.51,longitude:139.51},{id:'C',ja:'丙',latitude:35.52,longitude:139.52}]};
 const f=engine([r]);assert.equal(f.graph.get(c.FreeDriveTest.prototype.stationForRoute? [...f.graph.keys()].find(x=>x.includes('丙')):'').edges.filter(e=>e.to.includes('甲')).length,0);
});
