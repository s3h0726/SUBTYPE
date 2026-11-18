'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const app=read('js/app.js');
const start=app.indexOf('function customSearchValue(');
const stop=app.indexOf('const editor=new RouteEditor(',start);
assert(start>0&&stop>start,'On-demand search helper must be present');
const source=app.slice(start,stop);
const loadIndex=country=>JSON.parse(read('data/'+country+'/generated/index.json')).routes;
const cacheFor=routes=>({catalog:routes,ready:new Map(),pending:new Map(),failures:new Map()});
const ctx=vm.createContext({
 console:{warn:()=>{}},
 cache:cacheFor([]),
 normalize:value=>String(value??'').normalize('NFC').trim().toLowerCase(),
 hongKongRouteBlockReason:()=>false,
 koreanRouteBlockReason:()=>false,
 hydrateCalls:[],
 hydrateRailLine:async function(route){
  ctx.hydrateCalls.push(route.id);
  return {...route,lazy:false,stations:[
   {id:route.id+':1',ko:'테스트 출발',countryId:route.countryId,latitude:51.5,longitude:-0.1},
   {id:route.id+':2',ko:'테스트 도착',countryId:route.countryId,latitude:51.51,longitude:-0.11}
  ],patterns:[]};
 },
 ukPatternRoute:(owner,pattern)=>({...owner,stations:pattern.stations}),
 francePatternRoute:(owner,pattern)=>({...owner,stations:pattern.stations}),
});
ctx.customForeignRailIndex=async()=>ctx.cache;
vm.runInContext(source+
 ';globalThis.findCustomRail=searchCustomForeignRail;globalThis.rankCustomRail=customRailSearchRank;globalThis.foldCustomRail=customSearchValue;globalThis.expandCustomRail=customExpandRailPatterns;',ctx);
test('case, whitespace and punctuation normalization are consistent',()=>{
 assert.equal(ctx.foldCustomRail('Gare du Nord'),ctx.foldCustomRail('Gare-du-Nord'));
 assert.equal(ctx.foldCustomRail('Heathrow T5'),'heathrowt5');
 assert.equal(ctx.rankCustomRail({searchStations:['Gare du Nord']},ctx.foldCustomRail('Gare-du-Nord')),0);
});
test('indexed UK railway search does not lose routes after the eighth matching line',async()=>{
 ctx.cache=cacheFor(loadIndex('uk'));ctx.hydrateCalls=[];
 const result=await ctx.findCustomRail({countryId:'uk',query:'Paddington'});
 assert(result.matchedRoutes>=9,'Paddington must appear in more than eight UK railway routes');
 assert.equal(ctx.hydrateCalls.length,result.matchedRoutes,'Every indexed matching UK route must be checked');
 assert(result.stations.length>=9);
 const firstCount=ctx.hydrateCalls.length;
 await ctx.findCustomRail({countryId:'uk',query:'Paddington'});
 assert.equal(ctx.hydrateCalls.length,firstCount,'Loaded routes should be cached on repeat searches');
});
test('French station lookup handles punctuation variants and complete catalog',async()=>{
 ctx.cache=cacheFor(loadIndex('fr'));ctx.hydrateCalls=[];
 const result=await ctx.findCustomRail({countryId:'fr',query:'Gare-du-Nord'});
 assert(result.matchedRoutes>=8);
 assert(ctx.hydrateCalls.length>=8);
});
test('Thai station search discovers indexed station names',async()=>{
 ctx.cache=cacheFor(loadIndex('th'));ctx.hydrateCalls=[];
 const result=await ctx.findCustomRail({countryId:'th',query:'Siam'});
 assert(result.matchedRoutes>=2);
 assert(result.routes.length>=2);
});
test('all verified UK service patterns remain searchable, not just the first',()=>{
 const a={id:'A',ko:'출발',latitude:51.5,longitude:-0.1},b={id:'B',ko:'중간',latitude:51.51,longitude:-0.11},c={id:'C',ko:'도착',latitude:51.52,longitude:-0.12};
 const owner={id:'uk-test',countryId:'uk',selectedServiceId:'first',stations:[a,b],
  patterns:[{id:'first',stations:[a,b]},{id:'second',stations:[b,c]}]};
 const variants=ctx.expandCustomRail(owner);
 assert.equal(variants.length,2);
 assert.equal(variants[1].id,'uk-test--second');
 assert.equal(variants[1].oneWay,true);
 assert(variants[1].stations.some(station=>station.id==='C'));
});
test('editor merges newly found routes instead of deleting an airport arrival connection',async()=>{
 const editorSource=read('js/route-editor.js').replace(/\bimport(?=\s|\{)[^;]+;/g,'').replace(/\bexport\s+/g,'');
 const input={value:'Paddington'};
 const Editor=new Function('$','normalize','CustomShortestPath','customAirportOptions','customAirportTransferValid',
  'koreanRouteBlockReason','hongKongRouteBlockReason',
  editorSource+';return RouteEditor;')(
   selector=>selector==='#station-master-search'?input:null,
   value=>String(value??'').trim().toLowerCase(),
   class{setRoutes(){}},()=>[],()=>true,()=>false,()=>false);
 const editor=Object.create(Editor.prototype);
 editor.countryNetworks=new Map([['uk',{routes:[{id:'airport',countryId:'uk'}],stations:[{id:'airport-station',ko:'히스로 공항'}]}]]);
 editor.activeCountryId='uk';editor.route={countryId:'kr',stations:[{id:'CT01',countryId:'uk'}]};
 editor.lastForeignSearchKey='';editor.stationSearchStatus=null;
 editor.renderSearch=()=>{};
 editor.setRailNetwork=(routes,{countryId})=>{editor.countryNetworks.get(countryId).routes=routes;};
 editor.setStationMaster=(stations,{countryId})=>{editor.countryNetworks.get(countryId).stations=stations;};
 editor.onSearchForeignRail=async()=>({routes:[{id:'paddington',countryId:'uk'}],stations:[{id:'paddington-station',ko:'패딩턴'}],matchedRoutes:1,failedRoutes:0});
 await editor.searchForeignStations('Paddington');
 assert.deepEqual(editor.countryNetworks.get('uk').routes.map(route=>route.id),['airport','paddington']);
 assert.deepEqual(editor.countryNetworks.get('uk').stations.map(station=>station.id),['airport-station','paddington-station']);
 assert.equal(editor.stationSearchStatus.loading,false);
});
