'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const {SPECS}=require('./lib/hk-school-special-routes.cjs');
const {reviewedGameplay,gameplayFingerprint}=require('./lib/hk-release.cjs');
test('506P and 720 added without either Voyager route',()=>{
 const index=read('data/hk/generated/index.json'),review=read('data/hk/master/gameplay-review.json');
 const selected=index.routes.filter(r=>['hk-light-rail-506p','hk-light-rail-720'].includes(r.canonicalLineId));
 assert.equal(selected.length,2);
 assert.equal(SPECS.length,2);
 assert(!index.routes.some(r=>/voyager/i.test(r.id+' '+r.line?.en)));
 for(const spec of SPECS){
  const route=read('data/hk/generated/routes/'+spec.id+'.json');
  const meta=selected.find(r=>r.id===spec.id);
  assert(meta,'Missing lazy catalog route '+spec.id);
  assert.equal(route.category,'light_rail');
  assert.equal(route.canonicalLineId,spec.lineId);
  assert.equal(route.playable,true);
  assert.equal(route.releaseStatus,'ready');
  assert.equal(route.geometryReady,true);
  assert.equal(route.geometryStatus,'verified');
  assert.deepEqual(route.stations.map(s=>s.id),spec.stationCodes.map(code=>'hk-lr-'+code));
  assert.deepEqual(route.services[0].stops,route.stations.map(s=>s.id));
  assert.equal(route.directedSegments.length,route.stations.length-1);
  assert.deepEqual(route.validWhen.departureTimes,spec.departureTimes);
  assert.equal(route.validationFingerprint,gameplayFingerprint(route));
  assert(reviewedGameplay(route,review),'Missing exact engine-completion evidence: '+spec.id);
  assert.equal(meta.stationCount,route.stations.length);
  for(let i=0;i<route.stations.length;i++){
   const stop=route.stations[i],point=route.geometry[stop.geometryIndex];
   assert.deepEqual([stop.latitude,stop.longitude],point);
   assert.equal(stop.nameStatus,'verified');
   if(i<route.directedSegments.length){
    const edge=route.directedSegments[i];
    assert.equal(edge.fromStationId,stop.id);
    assert.equal(edge.toStationId,route.stations[i+1].id);
    assert(edge.sourceWayIds.length>0);
    assert(edge.sourceUrl.startsWith('https://www.openstreetmap.org/relation/'));
    assert(edge.geometry.length>1);
    assert((edge.stopOffsetReview?.gaps||[]).every(g=>g.gapMeters<=25));
   }
  }
 }
});
