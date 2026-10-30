#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const unpack=(p,s)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').split(s)[1].trim().replace(/;\s*$/,''));
const manifest=json('data/jr-namuwiki-destination-batch-20261031.json');
const result=json('reports/jr/namuwiki-destination-batch-applied.json');
const audit=json('reports/jr/namuwiki-destination-inventory.json');
const lite=unpack('js/japan-lite-index.js','window.TRT_JAPAN_LITE_INDEX=');
const editors=json('data/editor-overrides.json');
const routeLite=new Map(lite.routes.map(x=>[x.id,x]));
const allRoutes=[];
for(const filename of fs.readdirSync(path.join(root,'data/generated/routes')).filter(n=>n.endsWith('.json'))){
 try{const route=json('data/generated/routes/'+filename).route;if(route?.id)allRoutes.push(route);}catch(e){throw Error('Unparseable '+filename+': '+e.message);}
}
const byId=new Map(allRoutes.map(x=>[x.id,x]));
const companySet=new Set(['jr-hokkaido','jr-east','jr-central','jr-west','jr-shikoku','jr-kyushu']);
const jrCards=lite.routes.filter(x=>companySet.has(x.operatorId));
assert(jrCards.length>=220,'JR cards missing from game');
for(const item of manifest.lines){
 const r=byId.get(item.id),card=routeLite.get(item.id);
 assert(r&&card,'Route not found '+item.id);
 assert.equal(r.operatorId,card.operatorId);
 assert.equal(r.stations[0].ja,item.expectedStartJa,item.id+' start changed');
 assert.equal(r.stations.at(-1).ja,item.expectedEndJa,item.id+' end changed');
 assert.equal(r.line.ja,item.expectedJa,item.id+' Japanese name changed');
 assert.equal(r.line.ko,editors.lines?.[item.id]?.ko||item.ko,item.id+' Korean gameplay name');
 assert.equal(card.line.ko,r.line.ko,item.id+' selected card name differs');
 // Even when route is currently blocked (closed / disconnected), no fictitious
 // geometry or automatic service enablement is allowed.
 if(item.source.scope==='SUSPENDED_SERVICE_KEEP_BLOCKED'){
  assert(r.geometryReady===false||r.playable===false||r.stations.length>=2,'Missing suspended service inventory');
 }
}
const changes=new Map(manifest.stations.map(s=>[s.id,s]));
for(const st of manifest.stations){
 const matching=allRoutes.flatMap(route=>(route.stations||[]).filter(s=>s.id===st.id).map(s=>({route,s})))
  .filter(x=>companySet.has(x.route.operatorId));
 assert(matching.length>0,'Station not present in JR game '+st.id);
 for(const {route,s} of matching){
  if(s.routeSpecificStationName===true&&s.ja!==st.expectedJa)continue;
  assert.equal(s.ja,st.expectedJa,route.id+' Japanese station identity');
  assert.equal(s.ko,editors.stations?.[route.id]?.[st.id]||st.names.ko,route.id+' canonical station KO '+st.id);
  assert.equal(s.kana,st.names.kana,route.id+' kana station '+st.id);
  assert.equal(s.romaji,st.names.en,route.id+' English station '+st.id);
 }
}
const kobe=byId.get('line-11603'),kobe2=byId.get('line-11608');
assert.equal(kobe.stations.at(-1).ja,'神戸');
assert.equal(kobe2.stations[0].ja,'神戸');
assert.equal(kobe.stations.at(-1).id,kobe2.stations[0].id,'Transfer identities remain consistent across JR Kobe Line');
assert.equal(kobe.stations.at(-1).ko,'고베');
assert.equal(kobe2.stations[0].ko,'고베');
const kyushu=byId.get('line-11904'),sendai=kyushu.stations[0];
assert.equal(sendai.ja,'川内');assert.equal(sendai.ko,'센다이');
assert.equal(sendai.kana,'せんだい');assert.equal(sendai.romaji,'Sendai');
assert(result.preserved.geometryAltered===0&&result.preserved.relationsAltered===0&&result.preserved.servicesAltered===0);
assert(audit.counts.cards>=220,'Full-JR audit not regenerated');
assert(fs.existsSync(path.join(root,'reports/korean-names/stations-by-line.csv')),'Editor export missing');
const table=fs.readFileSync(path.join(root,'reports/korean-names/lines.csv'),'utf8');
assert(table.includes('JR 고베선(고베~히메지)'));
assert(table.includes('가고시마 본선(하카타~야츠시로)'));
const tableStops=fs.readFileSync(path.join(root,'reports/korean-names/stations-by-line.csv'),'utf8');
assert(tableStops.includes('센다이')&&tableStops.includes('야츠시로'),'Namuwiki station IDs missing in the editor');
console.log(JSON.stringify({status:'PASS',allJRRouteCards:jrCards.length,verifiedRouteLabels:manifest.lines.length,verifiedStations:manifest.stations.length,serviceGeometryPreserved:true}));
