#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {loadStations,discoverLineFolders,read}=require('./lib/line-workspaces');
const root=path.resolve(__dirname,'..'),base='a99da94bddb853adb7a3fc15195535202cd8a778';
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const rows=text('reports/names/nationwide-20261101/stations.jsonl').trim().split('\n').map(JSON.parse),keys=new Set(rows.map(r=>r.key));
assert.equal(keys.size,rows.length,'Duplicate registry identity');
const {map:master,shards}=loadStations();
for(const s of master.values())assert(rows.some(r=>r.stationId===s.id),'Master omitted: '+s.id);
let associations=0;
for(const folder of discoverLineFolders()){const l=read(path.join(folder,'line.json'));for(const s of read(path.join(folder,'stations.json'))){assert(keys.has(['jp',l.operatorId,l.id,s.stationId,s.order].join('::')),'Route occurrence omitted');associations++}}
let geometryChecked=0;
for(const file of new Set(shards.values())){
 const rel=path.relative(root,file).replace(/\\/g,'/'),old=JSON.parse(cp.execFileSync('git',['show',base+':'+rel],{cwd:root,maxBuffer:5000000}).toString());
 for(const s of old){const now=master.get(s.id);assert(now,'Station ID removed');assert.deepEqual(now.coordinates,s.coordinates,'Platform moved: '+s.id);assert.equal(now.names.ja,s.names.ja,'Unreviewed Japanese orthography change');geometryChecked++}
}
const c={console,URL,document:{baseURI:'http://localhost/'}};vm.createContext(c);
for(const file of ['js/typing-model.js','js/rail-data-repository.js','js/game.js'])vm.runInContext(text(file).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,''),c);
vm.runInContext('globalThis.qa={repository:railDataRepository,Game,buildTypingModel}',c);
const corrections=read(path.join(root,'data/source-audit/japan-name-corrections-20261101.json'));
const changedIds=new Set(corrections.patches.filter(p=>p.kind==='station'&&p.field==='ko').map(p=>p.stationId));
let answers=0,routeTargets=0;
const activeIds=new Set(read(path.join(root,'data/generated/line-index.json')).routes.map(r=>r.id));
for(const name of fs.readdirSync(path.join(root,'data/generated/routes')).filter(n=>n.endsWith('.json'))){
 const route=read(path.join(root,'data/generated/routes',name)).route;if(!activeIds.has(route.id)||(route.countryId&&route.countryId!=='jp'))continue;
 const resolved=c.qa.repository.resolveRoute(route);
 for(const s of resolved.stations.filter(s=>changedIds.has(s.id))){
  const generated=route.stations.find(t=>t.id===s.id);assert.equal(s.ko,generated.ko,'Runtime restored stale Korean name');
  const game={route,stationKoDisplay:v=>v};const actual=c.qa.Game.prototype.answerValues.call(game,s),expected=c.qa.buildTypingModel(s.ko).inputText;
  assert(actual.includes(expected),'Corrected typing answer missing');routeTargets++;
 }
}
for(const id of changedIds){assert(rows.some(r=>r.stationId===id&&r.correctedKorean===master.get(id).names.ko),'Registry stale correction');answers++}
const operations=read(path.join(root,'reports/names/nationwide-20261101/operating-sequences.json')).sequences;
for(const op of operations)for(const key of op.stationKeys)if(key!==null)assert(keys.has(key),'Dangling service occurrence');
assert(routeTargets>1000,'Mass correction was not published');
console.log(JSON.stringify({status:'PASS',checks:7,registryRows:rows.length,masterIds:master.size,associations,geometryChecked,changedAnswers:answers,routeSpecificTypingTargets:routeTargets,operatingSequences:operations.length}));
