#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const km=(a,b)=>111.195*Math.hypot(a[0]-b[0],(a[1]-b[1])*Math.cos((a[0]+b[0])*Math.PI/360));
(async()=>{
  const context={};vm.runInNewContext(read('js/gtx-a-south-track-data.js'),context,{timeout:3000});
  vm.runInNewContext(read('js/gtx-a-south-service.js'),context,{timeout:3000});
  const addon=context.TRT_GTX_A_SOUTH,tracks=JSON.parse(JSON.stringify(context.TRT_GTX_A_SOUTH_TRACKS));
  const north={id:'kr-rail-national-gtx-a',countryId:'kr',schemaVersion:2,releaseStatus:'verified',
    geometryReady:true,geometryStatus:'ready',line:{ko:'GTX-A'},operator:{ko:'지티엑스에이운영'},lineColor:'#9A6292',
    verifiedJourneys:[{id:'north-legacy-service'}],services:[{id:'north-legacy-service'}]};
  assert.equal(addon.routeId,north.id);
  assert.equal(tracks.routeId,north.id);
  assert.equal(tracks.license,'ODbL-1.0');
  assert.deepEqual(Array.from(addon.stations,s=>s.ko),['수서','성남','구성','동탄']);
  assert.deepEqual(Array.from(addon.stations,s=>s.stationCode),['X108','X109','X110','X111']);
  assert.equal(addon.choices({...north,id:'kr-rail-new-gtx-a'}).length,0,'no duplicate line card');
  assert.equal(addon.choices({...north,releaseStatus:'research'}).length,0);

  const sourceWays=new Map(json('data/kr/v2/source/osm-ways.json').map(w=>[String(w.id),w]));
  const sourceGeometry=new Map(json('data/kr/v2/geometry.json').map(g=>[g.id,g]));
  const sourceServices=new Map(json('data/kr/v2/services.json').map(s=>[s.id,s]));
  const sourceStops=new Map(json('data/kr/v2/stops.json').map(s=>[s.id,s]));
  const sourceStations=new Map(json('data/kr/v2/stations.json').map(s=>[s.id,s]));
  const seong=sourceStops.get('kr-osm-stop-10787176950');
  assert.equal(sourceStations.get(seong.stationId).names.ko,'성남 GTX');

  const source=read('js/route-integrity.js').replace("import{hongKongRouteBlockReason}from'./hong-kong-policy.js';","const hongKongRouteBlockReason=()=>null;");
  const {resolvePlayableRoute}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const choices=addon.choices(north);
  assert.equal(choices.length,2,'both operating directions available under one existing card');
  const orders={forward:['수서','성남','구성','동탄'],reverse:['동탄','구성','성남','수서']};
  for(const choice of choices){
    const t=tracks.directions[choice.direction],base=sourceServices.get(t.sourceServiceId);
    assert.equal(base.passengerLineId,'kr-osm-line-17443066');
    assert.equal(String(base.id.replace('kr-osm-service-','')),t.sourceRelationId);
    assert.equal(base.paths.length,9);
    const track=[],nodes=[],ways=[];
    for(const part of base.paths){
      const g=sourceGeometry.get(part.geometryId),w=sourceWays.get(String(g.sourceRef.id));
      assert(w&&w.tags.railway==='rail'&&!w.tags.highway,'only real railway OSM source ways');
      assert.deepEqual(g.coordinates,w.coordinates,'immutable OSM geometry source');
      assert.deepEqual(g.nodeIds,w.nodeIds,'immutable OSM node sequence');
      const pts=part.reverse?[...w.coordinates].reverse():w.coordinates;
      const ids=part.reverse?[...w.nodeIds].reverse():w.nodeIds;
      if(nodes.length){assert.equal(String(nodes.at(-1)),String(ids[0]),'OSM node continuity');assert.deepEqual(track.at(-1),pts[0])}
      track.push(...pts.slice(nodes.length?1:0));nodes.push(...ids.slice(nodes.length?1:0));
      ways.push(String(w.id));
    }
    assert.deepEqual(t.geometry,track,'published geometry must exactly match pinned OSM nodes, no invented vertices');
    assert.deepEqual(Array.from(t.sourceWays,w=>String(w.id)),ways,'full original OSM source provenance');
    assert.equal(t.geometrySha256,crypto.createHash('sha256').update(JSON.stringify(track)).digest('hex'));
    const distance=track.slice(1).reduce((sum,p,i)=>sum+km(track[i],p),0);
    assert(distance>31&&distance<35,'GTX-A known physical corridor length ~32.7 km');
    assert(Math.abs(distance-t.distanceKm)<.00001,'record actual OSM length');
    assert.equal(t.stations.length,4);
    assert.deepEqual(Array.from(t.stations,s=>s.name),orders[choice.direction]);
    for(const station of t.stations){
      assert.deepEqual(track[station.geometryIndex],[station.latitude,station.longitude]);
      assert.equal(String(nodes[station.geometryIndex]),String(station.sourceNodeId));
      if(station.name==='성남')assert(km([station.latitude,station.longitude],[seong.coordinates.lat,seong.coordinates.lon])<.05,'Seongnam anchored to its OSM GTX marker near the track');
    }

    const service=addon.resolve(choice,north);
    const line=service.route;
    assert.equal(line.id,north.id,'do not create another line card');
    assert.equal(line.gtxSouthStationOnly,false,'use real track, not station-only mode');
    assert.equal(line.geometryReady,true,'only after OSM source validation');
    assert.equal(line.geometryStatus,'ready');
    assert.deepEqual(JSON.parse(JSON.stringify(line.geometry)),track);
    assert.equal(line.directedSegments.length,3);
    assert.equal(line.missingSegments.length,0);
    assert.equal(line.verifiedJourneys,north.verifiedJourneys,'keep northern journeys');
    assert.equal(line.gtxSouthTrackEvidence.sourceRelationId,t.sourceRelationId);
    assert.deepEqual(JSON.parse(JSON.stringify(line.directedSegments.map(s=>s.geometry))),Array.from(line.stations.slice(0,-1),(s,i)=>track.slice(s.geometryIndex,line.stations[i+1].geometryIndex+1)));
    const game=resolvePlayableRoute(line,{direction:service.direction,service:service.service});
    assert.notEqual(game.sequenceOnly,true,'OSM track drives map/typing game');
    assert.equal(game.stations.length,4);
    assert.equal(game.segments.length,3);
    assert.deepEqual(JSON.parse(JSON.stringify(game.geometry)),track);
    assert.deepEqual(Array.from(game.stations,s=>s.ko),orders[choice.direction]);
    assert.throws(()=>resolvePlayableRoute({...line,geometry:[],directedSegments:[],geometryReady:false,gtxSouthStationOnly:false},{direction:'forward',service:service.service}),/직선 경로 플레이를 차단/);
  }
  const app=read('js/app.js'),bundle=read('js/app.bundle.js'),html=read('index.html'),renderer=read('js/route-renderer.js');
  for(const c of [app,bundle]){
    assert(c.includes('[...koreanVerifiedChoices(route),...(globalThis.TRT_GTX_A_SOUTH?.choices(route)||[])]'),'preserve north and append south choices');
    assert(c.includes("if(choice.kind==='gtxSouth')return globalThis.TRT_GTX_A_SOUTH.resolve(choice,route)"),'service selection must resolve to track');
  }
  assert(renderer.includes("route.gtxSouthStationOnly===true"),'preserve safety for any unverified legacy fallback');
  const trackScript=html.indexOf('./js/gtx-a-south-track-data.js'),serviceScript=html.indexOf('./js/gtx-a-south-service.js'),appScript=html.indexOf('./js/app.bundle.js');
  assert(trackScript>=0&&trackScript<serviceScript&&serviceScript<appScript,'load geometry before service and game bundle');
  console.log('PASS: GTX-A original card preserved, full original OSM geometry and 4 stops on both directions; map track enabled');
})().catch(error=>{console.error(error);process.exitCode=1});
