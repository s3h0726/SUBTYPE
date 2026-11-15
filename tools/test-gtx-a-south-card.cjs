#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
  const context={};vm.runInNewContext(read('js/gtx-a-south-service.js'),context,{timeout:3000});
  const addon=context.TRT_GTX_A_SOUTH,route={id:'kr-rail-national-gtx-a',countryId:'kr',schemaVersion:2,releaseStatus:'verified',line:{ko:'GTX-A'},operator:{ko:'지티엑스에이운영'},lineColor:'#9A6292'};
  assert.equal(addon.routeId,route.id);
  const choices=addon.choices(route);
  assert.equal(choices.length,2,'both south section directions are selectable');
  assert.deepEqual(Array.from(addon.stations,s=>s.ko),['수서','성남','구성','동탄']);
  assert.deepEqual(Array.from(addon.stations,s=>s.stationCode),['X108','X109','X110','X111']);
  assert.deepEqual(Array.from(choices,c=>c.originNames.ko+'→'+c.destinationNames.ko),['수서→동탄','동탄→수서']);
  assert.equal(addon.choices({...route,id:'kr-new-gtx-a'}).length,0,'never create a second card');
  assert.equal(addon.choices({...route,releaseStatus:'research'}).length,0,'preserve verified route policy');
  assert.throws(()=>addon.resolve({kind:'gtxSouth',id:'kr-gtx-a-south-unknown'},route));

  const module=read('js/route-integrity.js').replace("import{hongKongRouteBlockReason}from'./hong-kong-policy.js';","const hongKongRouteBlockReason=()=>'';");
  const {resolvePlayableRoute}=await import('data:text/javascript;base64,'+Buffer.from(module).toString('base64'));
  for(const choice of choices){
    const service=addon.resolve(choice,route);
    assert.equal(service.route.id,route.id,'keep existing GTX-A route identity');
    assert.equal(service.route.geometryReady,false,'do not claim an unverified tunnel is mapped');
    assert.equal(service.route.geometry.length,0);
    assert.equal(service.route.directedSegments.length,0);
    const game=resolvePlayableRoute(service.route,{direction:service.direction,service:service.service});
    assert.equal(game.sequenceOnly,true,'station-order typing is available');
    assert.equal(game.unverifiedRailGeometry,true);
    assert.equal(game.geometry.length,0,'no synthetic straight-line tracks');
    assert.equal(game.segments.length,0,'no invented railway edges');
    assert.deepEqual(Array.from(game.stations,s=>s.ko),choice.direction==='reverse'?['동탄','구성','성남','수서']:['수서','성남','구성','동탄']);
    assert.throws(()=>resolvePlayableRoute({...service.route,gtxSouthStationOnly:false},{direction:service.direction,service:service.service}),/직선 경로 플레이를 차단/,'other Korean trains remain guarded');
  }
  const app=read('js/app.js'),bundle=read('js/app.bundle.js'),renderer=read('js/route-renderer.js'),html=read('index.html');
  for(const script of [app,bundle]){
    assert.ok(script.includes('[...koreanVerifiedChoices(route),...(globalThis.TRT_GTX_A_SOUTH?.choices(route)||[])]'),'append to existing north choices');
    assert.ok(script.includes("if(choice.kind==='gtxSouth')return globalThis.TRT_GTX_A_SOUTH.resolve(choice,route)"),'play southern journeys');
    assert.ok(script.includes("if(choice.kind==='gtxSouth'){"),'show correct southern stop list');
  }
  for(const script of [read('js/route-integrity.js'),bundle]){
    assert.ok(script.includes('unverifiedRailGeometry:true'),'avoid false geometry in game');
  }
  for(const script of [renderer,bundle]){
    assert.ok(script.includes('GTX-A 남부 · 역명 타이핑 전용 (선로 미검증)'),'honest map status');
  }
  assert.ok(renderer.includes('gtxSouthStationOnly===true'),'renderer must suppress a fictitious track');
  assert.ok(html.includes('./js/gtx-a-south-service.js'));
  assert.ok(html.indexOf('./js/gtx-a-south-service.js')<html.indexOf('./js/app.bundle.js'),'load service before app');
  console.log('PASS: one GTX-A card; 4 official southern stations; 2 directions; no fabricated track.');
})().catch(error=>{console.error(error);process.exitCode=1});
