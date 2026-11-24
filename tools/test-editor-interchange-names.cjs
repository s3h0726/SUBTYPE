#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path'),root=path.resolve(__dirname,'..');
const load=(file,exports)=>{
 const source=fs.readFileSync(path.join(root,file),'utf8').replace(/^export\s+/gm,'');
 const context={console,Set,Map};
 vm.createContext(context);
 vm.runInContext(source+';globalThis.__testExports={'+exports.join(',')+'};',context);
 return context.__testExports;
};
const UK=load('js/uk-network.js',['configureUKNames','ukPresentation']);
UK.configureUKNames({stations:{'uk-A':{'uk-station':'노선 A역'},'uk-B':{'uk-station':'노선 B역'}},
 operators:{'uk-operator':'편집 운영사'},lines:{'uk-A':{ko:'편집 노선 A'}},services:{}},
 [{id:'uk-station',nameGroup:'same-physical-station'}]);
const sampleUK=id=>({id,countryId:'uk',operatorId:'uk-operator',operator:{ko:'원본 운영사'},
 line:{ko:'원본 노선'},stationCatalog:[{id:'uk-station',ko:'원본역',en:'Interchange'}],
 stations:[{id:'uk-station',ko:'원본역',en:'Interchange'}],services:[]});
const ukA=UK.ukPresentation(sampleUK('uk-A')),ukB=UK.ukPresentation(sampleUK('uk-B'));
assert.equal(ukA.stations[0].ko,'노선 A역');
assert.equal(ukB.stations[0].ko,'노선 B역');
assert.equal(ukA.stations[0].names.ko,'노선 A역');
assert.equal(ukA.line.ko,'편집 노선 A');
assert.equal(ukA.line.names.ko,'편집 노선 A');
assert.equal(ukA.operator.names.ko,'편집 운영사');
const FR=load('js/france-network.js',['configureFranceNames','franceStationPresentation','franceSearchNames']);
FR.configureFranceNames({stations:{'fr-A':{'fr-stop-1':'프랑스 A역'},'fr-B':{'fr-stop-1':'프랑스 B역'}}},
 {'fr-stop-1':'same-physical-station'});
assert.equal(FR.franceStationPresentation({id:'fr-stop-1',ko:'원본역'},'fr-A').ko,'프랑스 A역');
assert.equal(FR.franceStationPresentation({id:'fr-stop-1',ko:'원본역'},'fr-B').ko,'프랑스 B역');
assert.equal(FR.franceStationPresentation({id:'fr-stop-1',ko:'직접 편집명',editorStationNameOverride:true},'fr-C').ko,'직접 편집명');
assert.ok(FR.franceSearchNames({id:'fr-A',stationSequence:['fr-stop-1'],searchStations:[]}).includes('프랑스 A역'));
console.log(JSON.stringify({status:'PASS',countries:['uk','fr'],independentInterchangeNames:true,gameAndEditorNames:true}));
