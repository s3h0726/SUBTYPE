'use strict';
const assert=require('node:assert/strict');
const {routes}=require('../data/kr/canonical/river-batch.json');
const report=require('../data/kr/canonical/river-report.json');
assert.equal(routes.length,2);assert.equal(report.publicServiceDirectionCount,10);
assert.equal(report.failures.length,0);assert.equal(report.validation.activeEastBypassesSeoulForestPier,true);assert.ok(report.maxEdgeMeters<2000);assert.ok(report.maxStopOffsetMeters<150);
const {elements}=require('../data/kr/canonical/river-osm-terminals.json');
const forest=elements.find(e=>e.id===1458956838);
assert.ok(forest?.geometry?.length,'서울숲 선착장 OSM 원본 필요');
const outline=forest.geometry.slice(0,-1),pier=[outline.reduce((sum,p)=>sum+p.lat,0)/outline.length,outline.reduce((sum,p)=>sum+p.lon,0)/outline.length];
const distance=(a,b)=>Math.hypot((a[0]-b[0])*111195,(a[1]-b[1])*88200);
const nearestPierDistance=geometry=>Math.min(...geometry.map(p=>distance(p,pier)));
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
  const offset=nearestPierDistance(j.geometry);
  if(j.patternId.endsWith('-forest')){
   assert.ok(offset<30,'과거 임시 서울숲 경유 운행의 원형 보존');
   assert.ok(!j.sourceWayIds.includes(1443233864),'과거 경로가 우회경로로 덮어써짐');
  }else{
   assert.ok(offset>=300,'현재 동부노선이 서울숲 선착장으로 굽어 들어감: '+offset.toFixed(1)+'m');
   assert.ok(j.sourceWayIds.includes(1443233864),'현재 수상 우회 경로 OSM 출처 누락');
   assert.ok(j.geometry.some(p=>distance(p,[37.5349219,127.0392701])<1),'우회항로 중앙부 누락');
  }
 }else assert.deepEqual([...j.stations.map(s=>s.ko)].sort(),['마곡','망원','여의도'].sort());
}
assert.equal(routes.find(r=>r.id==='kr-hangang-east').verifiedJourneys.filter(j=>!j.serviceDates.validThrough).length,4);
console.log('한강버스 2개 구간·10개 방향: 현재 동부선 서울숲 접근 선형 우회 · 과거 임시계통 보존 확인');
