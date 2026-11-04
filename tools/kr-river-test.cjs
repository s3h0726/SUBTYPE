'use strict';
const assert=require('node:assert/strict');
const {routes}=require('../data/kr/canonical/river-batch.json');
const report=require('../data/kr/canonical/river-report.json');
assert.equal(routes.length,2);assert.equal(report.publicServiceDirectionCount,10);
assert.equal(report.failures.length,0);assert.ok(report.maxEdgeMeters<2000);assert.ok(report.maxStopOffsetMeters<150);
const ids=new Set;
for(const r of routes)for(const j of r.verifiedJourneys){
 assert.ok(!ids.has(j.id));ids.add(j.id);
 assert.equal(j.stations[0].geometryIndex,0);assert.equal(j.stations.at(-1).geometryIndex,j.geometry.length-1);
 for(const [i,s] of j.stations.entries()){assert.match(s.ko,/[가-힣]/u);if(i)assert.ok(s.geometryIndex>j.stations[i-1].geometryIndex)}
 for(const [i,s] of j.directedSegments.entries())assert.deepEqual(s.geometry,j.geometry.slice(j.stations[i].geometryIndex,j.stations[i+1].geometryIndex+1));
 if(r.id.endsWith('east')){
  if(j.patternId.endsWith('-forest')) assert.equal(j.serviceDates.validThrough,'2026-10-31'); else assert.ok(!j.serviceDates.validThrough);
  assert.equal(j.stations.filter(s=>['옥수','압구정'].includes(s.ko)).length,1);
  assert.equal(j.stations.some(s=>s.ko==='서울숲'),j.patternId.endsWith('-forest'));
 }else assert.deepEqual([...j.stations.map(s=>s.ko)].sort(),['마곡','망원','여의도'].sort());
}
console.log('한강버스 2개 구간·10개 방향: 항로 연결, 기종점, 선착장 순서, 교차 정차, 임시 운항 종료일 검증 통과');
