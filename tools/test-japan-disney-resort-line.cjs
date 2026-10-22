#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),test=require('node:test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={console};vm.createContext(ctx);
vm.runInContext(read('js/disney-resort-line-data.js'),ctx);
const route=ctx.TRT_DISNEY_RESORT_ROUTE;
const official=['リゾートゲートウェイ・ステーション','東京ディズニーランド・ステーション','ベイサイド・ステーション','東京ディズニーシー・ステーション'];
function km(a,b){
 const rad=x=>x*Math.PI/180,dy=rad(a[0]-b[0]),dx=rad(a[1]-b[1]);
 const c=Math.sin(dy/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dx/2)**2;
 return 12742*Math.atan2(Math.sqrt(c),Math.sqrt(1-c));
}
test('official four-stop counterclockwise resort line closes at Resort Gateway',()=>{
 assert.equal(route.id,'jp-disney-resort-line');
 assert.equal(route.loop,true);
 assert.equal(route.oneWay,true);
 assert.equal(route.category,'other');
 assert.equal(route.mode,'monorail');
 assert.deepEqual(Array.from(route.stations.slice(0,4),s=>s.ja),official);
 assert.equal(route.stations.length,5);
 assert.equal(route.stations.at(-1).ja,official[0]);
 assert.notEqual(route.stations.at(-1).id,route.stations[0].id,'return platform needs unique path-order ID');
 assert.equal(route.services.length,1);
 assert.equal(route.services[0].stops.length,5);
 assert.equal(route.services[0].id,'disney-loop');
 assert.equal(route.geometry[0][0],route.geometry.at(-1)[0]);
 assert.equal(route.geometry[0][1],route.geometry.at(-1)[1]);
});
test('surveyed physical loop geometry stays curved and near real OSM stop locations',()=>{
 assert(route.geometry.length>=40);
 const indices=route.stations.map(s=>s.geometryIndex);
 assert.deepEqual(Array.from(indices),[0,5,14,34,route.geometry.length-1]);
 let length=0;
 for(let i=1;i<route.geometry.length;i++)length+=km(route.geometry[i-1],route.geometry[i]);
 assert(length>4.0&&length<6.4,'MLIT simplified track must represent a roughly 5km loop; got '+length);
 for(const station of route.stations){
  const point=route.geometry[station.geometryIndex];
  const d=km(point,[station.latitude,station.longitude]);
  assert(d<0.15,station.ja+': track vertex '+d.toFixed(3)+'km away from platform');
 }
});
test('actual game route integrity follows real geometry, types five stations, finishes at start',()=>{
 const source=read('js/route-integrity.js').replace(/\bexport\s+/g,'');
 vm.runInContext(source+';globalThis.resolvePlayableRoute=resolvePlayableRoute',ctx);
 const ready=ctx.resolvePlayableRoute(route,{direction:'forward',service:route.services[0]});
 assert(!ready.fallbackGeometry,'must not fall back to straight segments');
 assert.equal(ready.segments.length,4);
 assert.equal(ready.stations.length,5);
 assert.equal(ready.stations[0].id,route.stations[0].id);
 assert.equal(ready.stations.at(-1).id,route.stations.at(-1).id);
 assert.equal(ready.geometry[0][0],ready.geometry.at(-1)[0]);
 assert.equal(ready.geometry[0][1],ready.geometry.at(-1)[1]);
 assert(ready.segments.every(segment=>segment.geometry.length>=2));
});
test('country catalog registration is additive and one-way selector has no reverse journey',async()=>{
 const source=read('js/data-loader.js');
 assert(source.includes('globalThis.TRT_DISNEY_RESORT_ROUTE'));
 assert(source.includes('if(extra&&!data.lines.some(line=>line.id===extra.id))'));
 const app=read('js/app.js'),bundle=read('js/app.bundle.js');
 assert(app.includes('if(!route.oneWay)add({kind:\'legacy\''));
 assert(bundle.includes('if(!route.oneWay)add({kind:\'legacy\''));
 assert(bundle.includes('globalThis.TRT_DISNEY_RESORT_ROUTE'));
 const html=read('index.html');
 assert(html.indexOf('./js/disney-resort-line-data.js')>0);
 assert(html.indexOf('./js/disney-resort-line-data.js')<html.indexOf('./js/app.bundle.js'));
});

test('Maihama walking transfer uses two names but retains distinct per-route coordinates',()=>{
  const source=read('js/free-drive.js').replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,'');
  const context={console,normalize:name=>String(name||'').normalize('NFC').toLowerCase().trim(),$:()=>null,koreanRouteBlockReason:()=>null};
  vm.createContext(context);
  vm.runInContext(source+';globalThis.FreeDriveTest=FreeDrive;globalThis.disneyKey=freeDriveStationKey',context);
  const drive=Object.create(context.FreeDriveTest.prototype);
  drive.renderMap=()=>{};
  const jr={id:'line-11326',countryId:'jp',line:{ko:'게이요선'},lineColor:'#cf2834',
    stations:[{id:'maihama',ja:'舞浜',latitude:35.6361,longitude:139.8840},
              {id:'shinu',ja:'新浦安',latitude:35.649,longitude:139.912}]};
  const physical=JSON.parse(JSON.stringify(route));
  drive.setNetwork([jr,physical]);
  const start=drive.routes.find(item=>item.id===route.id),jrLine=drive.routes.find(item=>item.id===jr.id);
  const gateway=context.disneyKey(start.stations[0]),maihama=context.disneyKey(jrLine.stations[0]);
  assert.equal(gateway,maihama,'official differently named transfer must share a graph key');
  assert.equal(drive.graph.get(gateway).routeIds.size,2);
  const coords=drive.graph.get(gateway).coordsByRoute;
  assert.notDeepEqual(Array.from(coords.get(route.id)),Array.from(coords.get(jr.id)),
    'station coordinates are route-specific, not overwritten by transfer node');
  const disneyEdges=[...drive.graph.values()].flatMap(node=>node.edges).filter(edge=>edge.routeId===route.id);
  assert(disneyEdges.length>=4);
  assert(disneyEdges.every(edge=>edge.direction===1),'one-way loop must not allow counterflow');
});
