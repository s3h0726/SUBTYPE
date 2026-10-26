#!/usr/bin/env node
// JR Chuo East boundary, preserved rapid line and source-to-runtime duplicate guard.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const east='data/lines/jr-east/chuohonsen-tokyo-shiojiri/';
const other='data/lines/jr-east/chuohonsen-tokyo-shiojiri-2/';
const e=read(east+'line.json'),dup=read(other+'line.json');
const es=read(east+'stations.json'),eg=read(east+'geometry.json');
const rapid=read('data/lines/jr-east/chuo-line-rapid/stations.json');
assert.equal(e.id,'line-11311');assert.equal(e.names.ko,'츄오토선');
assert.equal(dup.legacy.retiredDuplicate,true);
assert.equal(dup.legacyRouteAliasFor,e.id);
assert.equal(es.length,42);
assert.equal(es[0].stationId,'station-mlit-004029');
assert.equal(es.at(-1).stationId,'station-mlit-002616');
assert.equal(Object.keys(eg).length,es.length-1);
for(let i=0;i<es.length;i++){
 assert.equal(es[i].order,i+1);
 if(i+1<es.length){
   const a=es[i].stationId,b=es[i+1].stationId,edge=eg[a+'::'+b];
   assert.ok(edge && edge.fromStationId===a && edge.toStationId===b && edge.geometry.length>=2,'missing track '+a+' -> '+b);
 }
}
assert.equal(rapid[0].stationId,'station-1130101');
assert.equal(rapid.at(-1).stationId,'station-mlit-004029');
assert.equal(rapid.length,24);
// The published workspace must be rebuilt from the canonical source, not merely hidden in the UI.
const runtime='js/line-workspace-data.js';
if(fs.existsSync(runtime)){
 const s=fs.readFileSync(runtime,'utf8'),tag='window.TRT_EMBEDDED_LINE_WORKSPACES=';
 const idx=s.indexOf(tag);
 if(idx>=0){
  const ws=JSON.parse(s.slice(idx+tag.length).trim().replace(/;\\s*$/,''));
  const cards=ws.routes.filter(r=>r.id==='line-11311');
  assert.equal(cards.length,1,'canonical Chuo East card');
  assert.equal(ws.routes.some(r=>r.id==='line-11311--chuohonsen-tokyo-shiojiri'),false,'retired duplicate in runtime');
  assert.equal(cards[0].stations.length,42);
  assert.equal(cards[0].stations[0].ja,'高尾');
  assert.equal(cards[0].stations.at(-1).ja,'塩尻');
  assert.equal(cards[0].geometryReady,true,'Chuo East curve geometry must be fully connected');
  assert.equal(cards[0].directedSegments.length,41);
 }
}
console.log('PASS JR Chuo East: Takao–Shiojiri, 42 stations, 41 tracks; rapid retained, duplicate retired');
