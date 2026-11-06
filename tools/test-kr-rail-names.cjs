'use strict';
// 실제 공항철도 반대편 플랫폼과 직통 계통으로 편집표·검색·행선지·게임 정답의 일치를 검사한다.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{const route=JSON.parse(fs.readFileSync('data/kr/canonical/rail-urban-national-batch.json')).routes.find(r=>r.id==='kr-rail-national-airport');assert(route);
 const original=JSON.stringify(route.verifiedJourneys),trip=route.verifiedJourneys[0],end=trip.stations.at(-1),edited='편집 검증 종착역',line='편집 검증 공항철도';
 const overrides={operators:{[route.operatorId]:'편집 검증 운영사'},lines:{[route.id]:{ko:line}},stations:{[route.id]:{[end.id]:edited}},services:{}};
 const context=vm.createContext({console,URL,crypto,document:{baseURI:'https://s3h0726.github.io/SUBTYPE/'},fetch:async()=>({ok:true,json:async()=>overrides})});
 vm.runInContext(fs.readFileSync('js/data-loader.js','utf8').replace(/^import[^;]+;/gm,'').replace(/\bexport\s+/g,''),context);await vm.runInContext('loadEditorNameOverrides()',context);
 context.input=route;const normalized=vm.runInContext('normalizeLine(input)',context),actual=normalized.verifiedJourneys.find(j=>j.id===trip.id);
 assert.equal(actual.stations.at(-1).ko,edited);assert(actual.patternName.ko.includes(edited));assert(actual.service.nameKo.includes(edited));assert.equal(normalized.line.ko,line);assert.equal(normalized.operator.ko,'편집 검증 운영사');assert.equal(normalized.services.length,route.services.length);
 assert.equal(JSON.stringify(actual.geometry),JSON.stringify(trip.geometry));assert.equal(actual.stations.at(-1).geometryIndex,end.geometryIndex);assert.equal(actual.stations.at(-1).latitude,end.latitude);assert.equal(JSON.stringify(route.verifiedJourneys),original);
 vm.runInContext(fs.readFileSync('js/korean-service-resolver.js','utf8').replace(/\bexport\s+/g,''),context);context.normalized=normalized;const resolved=vm.runInContext('resolveKoreanVerifiedChoice(koreanVerifiedChoices(normalized)[0],normalized)',context);assert.equal(resolved.route.stations.at(-1).ko,edited);assert.equal(resolved.journey.destinationNames.ko,edited);
 const lazy=vm.runInContext('normalizeLazyLine(input)',context);assert(lazy.searchStations.includes(edited));
 const html=fs.readFileSync('reports/korean-names/editor.html','utf8');assert(html.includes("import('../../js/route-payload.js')"));
 const editor=vm.createContext({country:'kr',HEADERS:{services:[], 'stations-by-line':[], 'stations-unique':[]}});vm.runInContext(html.slice(html.indexOf('function stationName('),html.indexOf('async function thaiCatalog(')),editor);editor.input=route;
 const rows=vm.runInContext('tableForRoute(input,"stations-by-line")',editor),ids=new Set(route.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)));assert.equal(rows.length-1,ids.size);assert.equal(new Set(rows.slice(1).map(r=>r[4])).size,ids.size);assert(ids.size>route.stations.length);
 // 새 배치도 같은 편집표에서 모든 방향의 정차 ID를 중복 없이 제공한다.
 for(const name of ['rail-continuity-recovery-batch.json','rail-urban-recovery-batch.json','airport-seoul-batch.json','airport-gbis-batch.json','airport-busan-batch.json','rail-platform-recovery-batch.json']){
  const file='data/kr/canonical/'+name;if(!fs.existsSync(file))continue;
  for(const candidate of JSON.parse(fs.readFileSync(file)).routes){editor.input=candidate;const table=vm.runInContext('tableForRoute(input,"stations-by-line")',editor),all=new Set(candidate.verifiedJourneys.flatMap(j=>j.stations.map(s=>s.id)));assert.equal(table.length-1,all.size,name+' '+candidate.id);assert.equal(new Set(table.slice(1).map(r=>r[4])).size,all.size);}
 }
 console.log('한국 철도 편집 회귀 통과: 압축 상세 연동·전체 방향 역 목록·검색·행선지·정답·운영사·노선·좌표 보존');
})().catch(e=>{console.error(e);process.exitCode=1});
