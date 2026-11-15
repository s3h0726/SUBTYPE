#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
(async()=>{
  const source=read('js/route-integrity.js')
    .replace("import{hongKongRouteBlockReason}from'./hong-kong-policy.js';","const hongKongRouteBlockReason=()=>'';");
  const {resolvePlayableRoute}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const ids=['line-35001','line-35002','line-35003','line-hanshin-kobe-kosoku'];
  const routes=ids.map(id=>({...JSON.parse(read('data/generated/routes/'+id+'.json')).route,countryId:'jp'}));
  assert.equal(new Set(routes.map(r=>r.id)).size,4,'must retain four existing Hanshin lines');
  for(const route of routes.slice(0,3)){
    assert.equal(route.geometryReady,true,route.id+' verified track changed');
    assert.equal(route.missingSegments.length,0,route.id+' track gap introduced');
  }
  const kobe=routes[3],original=kobe.stations.map(station=>station.id);
  assert.equal(kobe.geometryReady,false,'unverified Kobe track must not be marked ready');
  assert.ok(kobe.missingSegments.length>0,'Kobe has missing track data');
  for(const direction of ['forward','reverse']){
    const result=resolvePlayableRoute(kobe,{direction,service:{id:'local',stops:original}});
    assert.equal(result.sequenceOnly,true,direction+' should allow station-order typing');
    assert.equal(result.unverifiedRailGeometry,true);
    assert.deepEqual(result.stations.map(station=>station.id),direction==='forward'?original:original.slice().reverse());
    assert.deepEqual(result.geometry,[],'must never fabricate a rail line');
    assert.deepEqual(result.segments,[],'must never fabricate a railway segment');
    assert.equal(result.stations.length,7,'preserve the already registered stations');
  }
  assert.throws(()=>resolvePlayableRoute({...kobe,id:'not-hanshin',geometry:[],geometryStatus:'missing'},{service:{id:'local',stops:original}}),/직선 경로 플레이를 차단/, 'no blanket railway geometry bypass');
  const context={window:{}};
  vm.runInNewContext(read('js/japan-lite-index.js'),context,{timeout:4000});
  const indexed=context.window.TRT_JAPAN_LITE_INDEX.routes.filter(r=>r.operatorId==='hanshindentetsu');
  assert.deepEqual(indexed.map(r=>r.id).slice().sort(),ids.slice().sort(),'no new or missing Hanshin lines');
  assert.match(indexed.find(r=>r.id===kobe.id).lazySource,/data\/generated\/routes\/line-hanshin-kobe-kosoku\.json/,'hydrate the actual existing route');
  for(const file of ['js/app.js','js/app.bundle.js']){
    const content=read(file);
    assert.match(content,/line-hanshin-kobe-kosoku.*missingSegments/,'existing Kobe selection must be enabled');
    assert.match(content,/선로 미검증 구간은 지도에 표시하지 않습니다/,'truthful game setup notice');
    assert.match(content,/sequenceOnly:this.resolvedRoute.sequenceOnly===true/,'preserve station-only mode through game launch');
  }
  for(const file of ['js/route-renderer.js','js/app.bundle.js'])
    assert.match(read(file),/선로 일부 미검증 · 역명 타이핑 전용/,'never show unverified track as live OSM');
  console.log('Hanshin regression: PASS — 4 existing lines; Kobe 7-stop forward/reverse typing; no synthetic rail geometry.');
})().catch(error=>{console.error(error);process.exitCode=1});
