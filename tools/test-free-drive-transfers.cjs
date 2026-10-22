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

test('Japanese differently named railway interchange retains individual station positions',()=>{
 const r=(id,name,lat,lon)=>({id,countryId:'jp',geometryReady:true,stations:[{id:id+'-a',ja:name,ko:name,latitude:lat,longitude:lon},{id:id+'-b',ja:'別',ko:'다음',latitude:lat+.003,longitude:lon+.003}]});
 const h=r('hamamatsucho','浜松町',35.6552,139.757),d=r('daimon','大門',35.6569,139.7577),unrelated=r('far-daimon','大門',36.1,139.757);
 const f=engine([h,d,unrelated]);
 const key='jp-transfer:hamamatsucho-daimon';assert.equal(f.graph.get(key).routeIds.size,2);
 f.currentKey=key;f.currentRouteId=h.id;f.history=[key];
 assert.equal(f.switchRouteAtCurrentStation(d.id),true);
 assert.equal(f.snapshot().station.ja,'大門');assert.equal(f.snapshot().station.latitude,35.6569);
 assert.equal(f.history.length,1);assert.equal(f.switchRouteAtCurrentStation(unrelated.id),false);
});
