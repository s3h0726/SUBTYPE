#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const editor=JSON.parse(read('data/editor-overrides.json'));
const context={console,URL,document:{baseURI:'https://example.invalid/SUBTYPE/'}};
vm.createContext(context);
vm.runInContext(read('js/rail-data-repository.js').replace(/^export /gm,'')+';globalThis.repository=railDataRepository;',context);
const repo=context.repository;let checked=0;
for(const [routeId,changes] of Object.entries(editor.stations||{})){
  const f='data/generated/routes/'+routeId+'.json';
  if(!fs.existsSync(path.join(root,f)))continue;
  const route=JSON.parse(read(f)).route,resolved=repo.resolveRoute(route);
  for(const [stationId,want] of Object.entries(changes)){
    const station=route.stations.find(s=>s.id===stationId||s.ja===stationId);
    assert.ok(station,routeId+': missing '+stationId);
    assert.equal(station.ko,want,routeId+': generated name is stale');
    assert.equal(station.routeSpecificStationName,true,routeId+': route-specific name flag absent');
    assert.ok(station.canonicalStationNames?.ko,routeId+': shared canonical name missing');
    assert.equal(resolved.stations.find(s=>s.id===station.id)?.ko,want,routeId+': gameplay overwrote name');
    checked++;
  }
}
assert.ok(checked>0,'No editor station corrections were checked');
repo.reset();
const shared={id:'shared',ja:'共通',ko:'공통',romaji:'Shared'};
const edited={...shared,ko:'노선별 수정',routeSpecificStationName:true,canonicalStationNames:{ja:'共通',ko:'공통',kana:'',en:'Shared'}};
const line=(id,stop)=>({id,operatorId:'test',operator:{ja:'Test',ko:'테스트'},line:{ja:id,ko:id},stations:[stop,{id:'last-'+id,ja:'終点',ko:'종점'}]});
repo.configure({lines:[line('edited',edited),line('other',shared)]});
assert.equal(repo.resolveRoute(repo.getRoute('edited')).stations[0].ko,'노선별 수정');
assert.equal(repo.resolveRoute(repo.getRoute('other')).stations[0].ko,'공통');
console.log(JSON.stringify({result:'PASS',checkedEditorStations:checked,sharedStationIsolation:true}));
