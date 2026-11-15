'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {km,segmentDistanceKm,expectedCorridor,samples,indexTracks,nearest}=require('./audit-kr-ktx-track-alignment.cjs');
test('OSM high-speed ways are spatially indexed and snapped',()=>{
 const a=[36.1,127.1],b=[36.11,127.11],t=indexTracks([{id:'1',tags:{railway:'rail',name:'경부고속선'},coordinates:[a,b]}]);
 assert.equal(nearest([36.105,127.105],'경부고속선',t).distanceKm,0);
 const off=nearest([36.3,127.3],'경부고속선',t);
 assert(off.distanceKm===null||off.distanceKm>1);
 assert(segmentDistanceKm([36.105,127.105],a,b)<.02);
 assert(km(a,b)>1);
});
test('conventional KTX bypasses are not misclassified as high-speed trunk',()=>{
 assert.equal(expectedCorridor('광명','대전',['광명','대전']),'경부고속선');
 assert.equal(expectedCorridor('광명','대전',['광명','수원','대전']),null);
 assert.equal(expectedCorridor('광명','대전',['서울','광명','대전','동대구','밀양','구포','부산']),'경부고속선');
 assert.equal(expectedCorridor('오송','익산',['오송','공주','익산']),'호남고속선');
 assert.equal(expectedCorridor('오송','익산',['오송','서대전','익산']),null);
 assert.equal(expectedCorridor('서울','광명',['서울','광명']),null);
 assert(samples([[36,127],[36.03,127.03]]).length>2);
});
