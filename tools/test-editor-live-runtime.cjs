#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/data-loader.js'),'utf8');
const slice=(from,to)=>{
 const start=source.indexOf(from),end=source.indexOf(to,start);
 assert.ok(start>=0&&end>start,'Game loader boundary changed: '+from);
 return source.slice(start,end).replace(/^export /gm,'');
};
const storage=new Map();
const put=(key,rows)=>storage.set('metrot-korean-edit-20261102-nationwide-revalidated-'+key,JSON.stringify(rows));
put('jp-operators',{'op-1':['op-1','수정 운영사']});
put('jp-lines',{'line-a':['op-1','기존 운영사','line-a','수정 노선','原線','Original','#0033FF','','특급','#CC0066']});
put('jp-stations-by-line',{'line-a::station-1':['op-1','수정 운영사','line-a','수정 노선','station-1','shared-1','수정 역','一']});
put('jp-services',{'svc-a':['svc-a','운행계통','line-a','Local','수정 계통']});
const localStorage={
 get length(){return storage.size},
 key:i=>[...storage.keys()][i]||null,
 getItem:key=>storage.get(key)||null,
 setItem:(key,value)=>storage.set(key,value),
 removeItem:key=>storage.delete(key)
};
let remote={operators:{'op-1':'원래 운영사'},lines:{'line-a':{ko:'원래 노선'}},stations:{},services:{}};
const context={
 URL,Date,console,localStorage,document:{baseURI:'https://example.org/SUBTYPE/'},
 fetch:async()=>({ok:true,json:async()=>remote}),
 restoreKrRailServiceNames:route=>route,restoreKrBusLatinRoute:route=>route,
 normalizeStation:station=>({...station,id:station.id,ja:station.ja,kana:station.kana||'',romaji:station.romaji||'',ko:station.ko}),
 applyRouteTrackCoordinates:(_route,stations)=>stations,
 isKoreanRailRoute:()=>false,
 cleanDisplayLineName:value=>value,
 text:(...values)=>String(values.find(value=>typeof value==='string'&&value.trim())||'').normalize('NFC').trim()
};
vm.createContext(context);
vm.runInContext(
 slice('let editorNameOverrides=','export function normalizeStation(')+
 slice('export function normalizeLine(','function validLine(')+
 ';globalThis.__names={loadEditorNameOverrides,normalizeLine,normalizeLazyLine};',
 context
);
(async()=>{
 const edits=await context.__names.loadEditorNameOverrides();
 assert.equal(edits.operators['op-1'],'수정 운영사');
 assert.equal(edits.lines['line-a'].ko,'수정 노선');
 assert.equal(edits.lines['line-a'].color,'#0033FF');
 assert.equal(edits.lines['line-a'].label,'특급');
 assert.equal(edits.stations['line-a']['station-1'],'수정 역');
 assert.equal(edits.services['svc-a'],'수정 계통');

 const original={id:'line-a',countryId:'jp',category:'jr',operatorId:'op-1',
  operator:{ko:'원래 운영사',ja:'鉄道',en:'Railway'},
  line:{ja:'原線',ko:'원래 노선',en:'Original'},
  stations:[{id:'station-1',ja:'一',ko:'원래 역'},{id:'station-2',ja:'二',ko:'종점'}],
  stationCatalog:[{id:'station-1',ja:'一',ko:'원래 역'}],
  services:[{id:'svc-a',nameKo:'원래 계통',stops:['station-1','station-2']}],
  directions:[{id:'forward',stops:[{id:'station-1',ja:'一',ko:'원래 역'}]}]
 };
 const route=context.__names.normalizeLine(original);
 assert.equal(route.line.ko,'수정 노선');
 assert.equal(route.line.names.ko,'수정 노선');
 assert.equal(route.operator.ko,'수정 운영사');
 assert.equal(route.operator.names.ko,'수정 운영사');
 assert.equal(route.stations[0].ko,'수정 역');
 assert.equal(route.stations[0].names.ko,'수정 역');
 assert.equal(route.stations[0].editorStationNameOverride,true);
 assert.equal(route.stationCatalog[0].ko,'수정 역');
 assert.equal(route.directions[0].stops[0].ko,'수정 역');
 assert.equal(route.services.find(s=>s.id==='svc-a').nameKo,'수정 계통');
 assert.equal(context.__names.normalizeLazyLine({...original,stationCount:2,searchStations:['원래 역'],lazySource:'test.json'}).searchStations.includes('수정 역'),true);

 // A family-level edit must reach a directional Hong Kong service without renaming its ID.
 storage.set('metrot-korean-edit-20261102-nationwide-revalidated-hk-stations-by-line-hk-main',
  JSON.stringify({'hk-main::hk-stop':['mtr','홍콩','hk-main','본선','hk-stop','','홍콩 수정역']}));
 await context.__names.loadEditorNameOverrides();
 const hk=context.__names.normalizeLine({...original,id:'hk-main-direction-a',canonicalLineId:'hk-main',countryId:'hk',
  stations:[{id:'hk-stop',ja:'站',ko:'기존역'},{id:'hk-end',ja:'終',ko:'종점'}],services:[]});
 assert.equal(hk.stations[0].ko,'홍콩 수정역');
 assert.equal(hk.id,'hk-main-direction-a');

 // Published names are usable immediately in the same browser, before Pages refreshes.
 storage.clear();
 storage.set('subtype-editor-published-pending-v1',JSON.stringify({
  branch:'main',savedAt:Date.now(),overrides:{operators:{'op-1':'발행한 운영사'},lines:{},stations:{},services:{}}
 }));
 const committed=await context.__names.loadEditorNameOverrides();
 assert.equal(committed.operators['op-1'],'발행한 운영사');
 console.log(JSON.stringify({result:'PASS',operator:true,line:true,station:true,service:true,search:true,hongKongFamily:true,pendingPublish:true}));
})().catch(error=>{console.error(error);process.exitCode=1});
