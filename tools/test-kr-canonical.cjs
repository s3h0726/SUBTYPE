#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {readBatches,validateRoute,assembleCanonicalRoutes}=require('./lib/kr-canonical.cjs'),root=path.resolve(__dirname,'..');
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
const context=vm.createContext({console,Intl,Date,Set,Map,Math,Number,JSON,hongKongRouteBlockReason:()=>null});
for(const file of ['js/korean-service-resolver.js','js/route-integrity.js'])vm.runInContext(source(file).replace(/^import[^;]+;/gm,'').replace(/\bexport\s+/g,''),context);
const compiled=assembleCanonicalRoutes(readBatches(root));assert.deepEqual(compiled.rejected,[]);
const routes=compiled.routes,ids=new Set;let journeys=0;
for(const route of routes){
 assert(!ids.has(route.id),route.id);ids.add(route.id);assert.deepEqual(validateRoute(route),[],route.id);
 context.route={...route,canonicalContract:'kr-canonical-v1'};
 const choices=vm.runInContext('koreanVerifiedChoices(route)',context);
 for(const choice of choices){context.choice=choice;const result=vm.runInContext('resolveKoreanVerifiedChoice(choice,route)',context);context.resolved=result.route;context.service=result.service;
  const playable=vm.runInContext("resolvePlayableRoute(resolved,{direction:'forward',service})",context);
  assert(!playable.fallbackGeometry,choice.id);assert.equal(JSON.stringify(playable.stations.map(s=>s.id)),JSON.stringify(result.route.stations.map(s=>s.id)));assert.equal(playable.segments.length,result.route.stations.length-1);journeys++;
 }
}
// Regression: Korean road/water services must fail closed without real paths.
for(const mode of ['bus','village_bus','express_bus','brt','river_bus']){context.broken={id:'kr-broken',countryId:'kr',mode,geometry:[],stations:[{id:'a',ko:'가',latitude:37,longitude:127},{id:'b',ko:'나',latitude:37.1,longitude:127.1}]};assert.throws(()=>vm.runInContext('resolvePlayableRoute(broken)',context));}
// Bad IDs, Korean names, coordinates and geometry must never pass publication.
if(routes.length){const broken=structuredClone(routes[0]);broken.line.ko='English';assert(validateRoute(broken).length);const gap=structuredClone(routes[0]);gap.verifiedJourneys[0].geometry[1]=[37,131];assert(validateRoute(gap).length)}
assert(source('js/feature-flags.js').includes('hongKong:true'));
const index=JSON.parse(source('data/kr/generated/index.json'));
assert.equal(index.routes.length,routes.length);for(const meta of index.routes){assert(!meta.geometry?.length);assert(!meta.verifiedJourneys?.length);assert(fs.existsSync(path.join(root,meta.lazySource)))}
const report={passed:true,routes:routes.length,journeysResolved:journeys,geometryFallbacks:0,scope:'전체 공개 계통의 실제 게임 경로 해석 검사. 브라우저 완주 검사와 별개.'};
fs.mkdirSync(path.join(root,'reports/kr-rebuild'),{recursive:true});fs.writeFileSync(path.join(root,'reports/kr-rebuild/runtime-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
