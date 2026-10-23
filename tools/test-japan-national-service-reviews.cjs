#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const label='window.TRT_NATIONWIDE_SERVICE_CATALOG=';
const original=read('js/nationwide-service-catalog.js');
const catalog=JSON.parse(original.split(label)[1].trim().replace(/;\s*$/,''));
const review=json('data/japan-national-service-reviews.json');
const all=Object.entries(catalog.lines).flatMap(([code,line])=>(line.patterns||[]).map(pattern=>({code,pattern})));
test('Japan catalog keeps existing entries, adds documented patterns and rebuilds deterministically',()=>{
 assert.equal(Object.keys(catalog.lines).length,624);
 assert(all.length>=2577);
 assert.equal(catalog.japanServiceReview.reviewedAt,review.reviewedAt);
 execFileSync(process.execPath,['tools/apply-japan-national-service-reviews.cjs','--check'],{cwd:root});
});
test('Nishi Kyushu Shinkansen KAMOME has three distinct physical stopping variants, never RELAY KAMOME',()=>{
 const entries=catalog.lines['1012'].patterns,active=entries.filter(p=>!p.status);
 assert.equal(active.length,3);
 assert(entries.find(p=>p.id==='366').status==='superseded');
 const track=json('data/generated/routes/shinkansen-nishi-kyushu.json').route;
 assert.equal(track.geometryReady,true);
 const names=track.stations.map(s=>s.ja);
 assert.deepEqual(names,review.shinkansen.stations);
 for(const v of review.shinkansen.variants){
  const p=active.find(x=>x.id===v.id);assert(p,p?.id);
  assert.equal(p.type.operatingNameJa,'かもめ');
  assert.equal(p.segments.length,1);
  assert.equal(p.segments[0].lineCode,'1012');
  assert.deepEqual(p.segments[0].stations.filter(x=>x[1]===0).map(x=>x[0]),v.stopNames);
  assert.equal(p.segments[0].stations.length,names.length);
 }
});
test('conventional RELAY KAMOME terminates at Takeo-onsen without inventing a train to Nagasaki',()=>{
 const ids=review.relay.lineCodes,patterns=ids.map(code=>catalog.lines[code].patterns.find(p=>p.id===review.relay.patternId));
 for(const p of patterns){assert(p);assert(!p.status);assert.equal(p.segments.length,3);
   assert.equal(p.segments[0].stations[0][0],'博多');
   assert.equal(p.segments.at(-1).stations.at(-1)[0],'武雄温泉');
   assert(!p.segments.some(x=>x.lineCode==='1012'))}
 assert(!catalog.lines['1012'].patterns.some(p=>p.id===review.relay.patternId));
 for(const s of review.relay.segments){
  const stations=json('data/generated/routes/line-'+s.lineCode+'.json').route.stations.map(s=>s.ja);
  assert(stations.indexOf(s.from)>=0&&stations.indexOf(s.from)<stations.indexOf(s.to));
  assert(s.calls.every(name=>stations.includes(name)));
 }
});
test('obsolete Keiyo commuter rapid and Expo Liner services are retained for audit but hidden from current choices',()=>{
 for(const id of ['244','582','584','1094']){
  const entries=all.filter(x=>x.pattern.id===id);
  assert(entries.length>=2);
  assert(entries.every(x=>x.pattern.status==='discontinued'));
 }
 for(const file of ['js/app.js','js/app.bundle.js']){
  const source=read(file);assert(source.includes("if(pattern.status==='discontinued'||pattern.status==='superseded')continue;"));
 }
});
test('all approved service-name translations match their original Japanese types',()=>{
 for(const fix of review.koreanNameFixes){
   const matching=all.filter(({pattern:p})=>p.type?.ja===fix.ja);
   assert(matching.length>=1,fix.ja);
   assert(matching.every(({pattern:p})=>p.type.ko===fix.to),fix.ja);
 }
 for(const line of Object.values(catalog.lines)){
  const active=line.patterns.filter(p=>!p.status);
  assert.equal(active.length,new Set(active.map(p=>p.id)).size,'duplicate service in '+line.ja);
 }
});
