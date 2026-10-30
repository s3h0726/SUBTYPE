#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const fromJs=(p,prefix)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').split(prefix)[1].trim().replace(/;\s*$/,''));
const manifest=read('data/japan-namuwiki-verified-batch-20261031.json');
const report=read('reports/names/NAMUWIKI_APPLIED_BATCH_20261031.json');
const audit=read('reports/names/NAMUWIKI_FULL_JAPAN_20261031.json');
const editor=read('data/editor-overrides.json');
const ws=fromJs('js/line-workspace-data.js','window.TRT_EMBEDDED_LINE_WORKSPACES=');
const lite=fromJs('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const byId=new Map(ws.routes.map(r=>[r.id,r]));
const liteById=new Map(lite.routes.map(r=>[r.id,r]));
assert(ws.routes.length>=590&&lite.routes.length>=590,'Japan inventory loss');
assert.equal(ws.routes.length,lite.routes.length);
for(const item of manifest.lines){
 const src=byId.get(item.id),card=liteById.get(item.id);
 assert(src&&card,'Missing route '+item.id);
 for(const field of ['ja','en','ko']){
  const expected=field==='ko'?(editor.lines?.[item.id]?.ko||item.names.ko):item.names[field];
  assert.equal(src.line[field],expected,item.id+' workspaces '+field);
  assert.equal(card.line[field],expected,item.id+' lightweight card '+field);
 }
 assert.equal(card.category,'monorail','Monorail classification changed '+item.id);
 const chunk=read(card.lazySource.split('?')[0].replace(/^\.\//,''));
 const stored=(chunk.routes||[chunk.route||chunk]).find(x=>x.id===item.id);
 assert(stored,'Missing route chunk '+item.id);
 assert.equal(stored.line.ja,src.line.ja);
 assert.equal(stored.line.ko,src.line.ko);
}
for(const item of manifest.operators){
 const examples=ws.routes.filter(r=>r.operatorId===item.id);
 assert(examples.length,'Missing operator route '+item.id);
 for(const r of examples){
  assert.equal(r.operator.ko,item.names.ko,item.id+' KO');
  assert.equal(r.operator.en,item.names.en,item.id+' EN');
 }
}
const missing=report.review.filter(x=>x.type==='STATION_JA_AMBIGUOUS_OR_MISSING');
const invalid=report.review.filter(x=>x.type==='EXISTING_VERIFIED_NAME_CONFLICT'||x.type==='CROSS_ROUTE_NAME_CONFLICT');
assert.equal(report.review.length,0,'Unresolved Namu wiki route station name references');
assert.equal(report.scope.routeSpecificStationNamesVerified,1,'Shonan Monorail has distinct Shonan-Enoshima station signage');
const shonan=byId.get('line-99326');
const shonanEnd=shonan?.stations?.find(s=>s.id==='station-9932006');
assert.equal(shonanEnd?.ja,'湘南江の島','Shonan route must not borrow Enoden 江ノ島 station name');
assert.equal(shonanEnd?.ko,'쇼난에노시마');
assert.equal(shonanEnd?.romaji,'Shonan-Enoshima');
assert.equal(invalid.length,0,'Manual proof conflicts with prior verified station names');
assert(report.scope.lines===9&&report.scope.operators===6&&report.scope.stationReferences===32);
assert(audit.summary.total.station>=8800&&audit.summary.total.line>=600&&audit.summary.total.operator>=160);
assert(audit.summary.sourceKnown>=15,'No newly crosschecked Namuwiki coverage recorded');
assert(fs.existsSync(path.join(root,'reports/names/NAMUWIKI_FULL_REVIEW_QUEUE.csv')));
console.log(JSON.stringify({status:'PASS',linesChecked:manifest.lines.length,operatorsChecked:manifest.operators.length,stationReferences:manifest.stationNames.length,unmatchedStationReferences:missing.length,allStationsAudited:audit.summary.total.station,allLinesAudited:audit.summary.total.line,allOperatorsAudited:audit.summary.total.operator,catalogRoutes:ws.routes.length}));
