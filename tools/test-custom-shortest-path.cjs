'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../js/custom-shortest-path.js'),'utf8')
  .replace(/\bexport\s+/g,'');
const context={Math,Map,Number,Array,String};
vm.createContext(context);
vm.runInContext(src+';globalThis.routing={CustomShortestPath,customTrackLength,customRailDistance}',context);
const {CustomShortestPath,customTrackLength}=context.routing;
const stop=(id,lat,lon,extra={})=>({id,stationMasterId:id,ja:id,ko:id,latitude:lat,longitude:lon,...extra});
const route=(id,stops,options={})=>({id,countryId:'jp',geometry:[],stations:stops,...options});
test('shortest track metres can beat fewer stops, with no invented straight-line shortcut',()=>{
  const a=stop('A',37,127),b=stop('B',37,127.001),d=stop('D',37,127.002),c=stop('C',37.02,127.001);
  const r=new CustomShortestPath([route('short',[a,b,d]),route('long',[a,c,d])]);
  const p=r.find('A','D');
  assert(p);assert.deepEqual(Array.from(p.edges,e=>e.route.id),['short','short']);
  assert(p.distanceMeters>150&&p.distanceMeters<220);
  assert.equal(p.approximateEdges,2);
  assert.equal(r.find('A','UNCONNECTED'),null);
  assert.equal(r.find('A','D',{maxEdges:1}),null);
});
test('verified polyline is weighted rather than stop-to-stop aerial distance',()=>{
  const a=stop('A',37,127),b=stop('B',37,127.001);
  const detour=route('detour',[{...a,geometryIndex:0},{...b,geometryIndex:2}],{
    geometry:[[37,127],[37.01,127.0005],[37,127.001]]
  });
  const direct=route('direct',[a,b]);
  assert(customTrackLength(detour,0,1).metres>2000);
  assert.equal(new CustomShortestPath([detour,direct]).find('A','B').edges[0].route.id,'direct');
});
test('direction restrictions preserve Hong Kong and Korea schema v2',()=>{
  const a=stop('A',37,127),b=stop('B',37,127.001);
  for(const [countryId,schemaVersion]of[['hk',undefined],['kr',2]]){
    const r=new CustomShortestPath([route(countryId,[a,b],{countryId,schemaVersion})]);
    assert(r.find('A','B'));assert.equal(r.find('B','A'),null);
  }
  assert(new CustomShortestPath([route('jp',[a,b])]).find('B','A'));
});
test('routes interchange only on the same canonical station identity',()=>{
  const a=stop('A',37,127),b=stop('B',37,127.001),c=stop('C',37,127.002);
  const alias=stop('ALIAS',37,127.001,{ja:'B',ko:'B'});
  const r=new CustomShortestPath([route('one',[a,b]),route('two',[alias,c])]);
  assert.equal(r.find('A','C'),null);
  const yes=new CustomShortestPath([route('one',[a,b]),route('two',[{...alias,stationMasterId:'B'},c])]);
  assert.equal(yes.find('A','C').transferCount,1);
});
