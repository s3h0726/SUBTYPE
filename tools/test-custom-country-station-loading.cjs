'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const editorSource=read('js/route-editor.js')
 .replace(/\bimport(?=\s|\{)[^;]+;/g,'').replace(/\bexport\s+/g,'');
const search={value:''};
const Editor=new Function('$','CustomShortestPath',editorSource+';return RouteEditor;')(
 selector=>selector==='#station-master-search'?search:null,
 class{setRoutes(routes){this.routes=routes;}}
);
const makeEditor=()=>{
 const editor=Object.create(Editor.prototype);
 editor.route={countryId:'jp',stations:[]};
 editor.countryNetworks=new Map();
 editor.activeCountryId='jp';editor.master=[{id:'old',countryId:'jp'}];
 editor.railRoutes=[{id:'old-jp',countryId:'jp'}];
 editor.stationGraph=new Map([['old',{}]]);
 editor.shortestPath={setRoutes(routes){this.routes=routes}};
 editor.renderSearch=()=>{};editor.renderJourneyOptions=()=>{};editor.renderAirportOptions=()=>{};
 editor.lastForeignSearchKey='jp:stale';editor.stationSearchStatus={loading:true};
 editor.searchResultLimit=50;
 return editor;
};
test('an empty editor draft adopts the selected country and discards stale stations',()=>{
 const editor=makeEditor();
 editor.syncCountry('fr');
 assert.equal(editor.route.countryId,'fr');
 assert.equal(editor.activeCountryId,'fr');
 assert.equal(editor.master.length,0);
 assert.equal(editor.railRoutes.length,0);
 assert.equal(editor.stationGraph.size,0);
 assert.equal(editor.shortestPath.routes.length,0);
 assert.equal(editor.lastForeignSearchKey,'');
 assert.equal(editor.stationSearchStatus,null);
});
test('switching back to a cached country restores its station master and routes',()=>{
 const editor=makeEditor();
 const station={id:'mo-lrt-1',ko:'타이파',countryId:'mo'};
 const route={id:'mo-lrt-taipa',countryId:'mo',stations:[station,{id:'mo-lrt-2',countryId:'mo'}]};
 editor.countryNetworks.set('mo',{stations:[station],routes:[route]});
 editor.syncCountry('mo');
 assert.equal(editor.activeCountryId,'mo');
 assert.equal(editor.master[0].id,'mo-lrt-1');
 assert.equal(editor.railRoutes[0].id,'mo-lrt-taipa');
 assert(editor.stationGraph.has('mo-lrt-1'));
});
test('cross-border in-progress custom journeys are not discarded by selector changes',()=>{
 const editor=makeEditor();
 editor.route.stations=[{id:'CT01',countryId:'jp'}];
 assert.equal(editor.syncCountry('mo'),false);
 assert.equal(editor.route.countryId,'jp');
 assert.equal(editor.route.stations.length,1);
});
test('app bootstraps eager station masters and rail graphs for non-lazy countries',()=>{
 const app=read('js/app.js');
 const start=app.indexOf('const eagerRail=builtin.filter(');
 const end=app.indexOf('refreshRoutes();renderHome();',start);
 assert(start>=0&&end>start,'eager station bootstrap must exist');
 const bootstrap=app.slice(start,end);
 const run=(countryId,builtin,stations=[])=>{
  const calls={};
  const editor={
   syncCountry(id){calls.country=id},
   setRailNetwork(routes,options){calls.routes=routes;calls.routeCountry=options.countryId},
   setStationMaster(data,options){calls.stations=data;calls.stationCountry=options.countryId}
  };
  vm.runInNewContext(bootstrap,{countryId,builtin,stations,editor});
  return calls;
 };
 const macau={id:'mo-lrt',countryId:'mo',mode:'light_rail',stations:[
  {id:'mo-a',ko:'타이파'},{id:'mo-b',ko:'코타이'}]};
 const c=run('mo',[macau],[]);
 assert.equal(c.country,'mo');
 assert.equal(c.routes.length,1);
 assert.equal(c.stations.length,2);
 assert(c.stations.every(s=>s.countryId==='mo'));
 const tw={id:'tw-rail',countryId:'tw',mode:'rail',stations:[
  {id:'tw-a',ko:'타이베이'},{id:'tw-b',ko:'반차오'}]};
 assert.equal(run('tw',[tw]).routes.length,1);
 const uk={id:'uk-rail',countryId:'uk',lazy:true,stations:[]};
 assert.equal(run('uk',[uk]).routes.length,0);
 const krBus={id:'kr-bus',countryId:'kr',mode:'bus',stations:[{id:'1'},{id:'2'}]};
 assert.equal(run('kr',[krBus]).routes.length,0);
});

test('Korean bus and ferry catalogs are excluded before station hydration',()=>{
 const app=read('js/app.js');
 const a=app.indexOf('const customForeignRailCache=new Map();');
 const b=app.indexOf('async function customForeignRailIndex(',a);
 assert(a>=0&&b>a);
 const context=vm.createContext({});
 vm.runInContext(app.slice(a,b)+';globalThis.isRail=customRailEligible;',context);
 const isRail=context.isRail;
 assert.equal(isRail({mode:'rail',category:'high_speed_rail'}),true);
 assert.equal(isRail({mode:'subway',category:'subway'}),true);
 for(const mode of ['bus','airport_bus','express_bus','village_bus','river_bus','ferry']){
  assert.equal(isRail({mode,category:'other'}),false,mode+' must not be hydrated');
 }
 assert.equal(isRail({mode:'other',category:'city_bus'}),false);
 assert.match(app,/if\(countryId==='hk'\)void loadHongKongEditorNetwork\(\)/);
});
