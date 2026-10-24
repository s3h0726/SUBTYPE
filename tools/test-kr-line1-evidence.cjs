'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const preview=JSON.parse(fs.readFileSync(path.join(root,'data/kr/preview/index.json'),'utf8'));
const generated=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const getRoute=route=>{const file=path.join(root,route.lazySource.split('?')[0]);assert(fs.existsSync(file),'missing source '+route.id);const data=JSON.parse(fs.readFileSync(file,'utf8'));return data.route||data};
const integratedIds=JSON.parse(fs.readFileSync(path.join(root,'data/kr/line1-integration-policy.json'),'utf8')).relationIds;
const target=preview.routes.filter(r=>r.passengerLineId==='kr-osm-line-8691899'&&(integratedIds.includes(String(r.sourceRelationId))||['13695367','13695368'].includes(String(r.sourceRelationId))));
const current=target.filter(r=>!['13695367','13695368'].includes(String(r.sourceRelationId)));
test('all 23 displayed Line 1 direction services preserve OSM actual geometry and research evidence',async()=>{
 const {integrateKoreanLine1Index}=await import(pathToFileURL(path.join(root,'js/data-loader.js')));
 const live=integrateKoreanLine1Index(generated,preview).routes.filter(r=>r.integratedLine1);
 assert.equal(target.length,25);assert.equal(live.length,23);assert.equal(current.length,23);
 assert.deepEqual(live.map(x=>x.id),current.map(x=>x.id));
 const classes=new Map;
 for(const r of live){
  assert.equal(r.releaseStatus,'research');
  assert.equal(r.playStatus,'RESEARCH_PLAYABLE');
  assert.equal(r.line1Service.evidenceStatus==='operator-service-confirmed'||r.line1Service.evidenceStatus==='timetable-unverified',true);
  assert(r.line1Service.name.includes('→'));assert(!r.line1Service.name.includes('연구용'));
  assert(['up','down'].includes(r.line1Service.travelDirection));
  assert(Array.isArray(r.researchEvidence?.unverified)&&r.researchEvidence.unverified.length);
  const route=getRoute(r);
  assert(route.geometry?.length>2,r.id);assert(route.stations?.length>=2,r.id);
  assert.equal(route.stations[0].ko,r.researchEvidence.origin);
  assert.equal(route.stations.at(-1).ko,r.researchEvidence.destination);
  assert.equal(route.services[0].stops.length,route.stations.length);
  assert(r.line1Service.group&&r.line1Service.name);
  classes.set(r.line1Service.group,(classes.get(r.line1Service.group)||0)+1);
 }
 assert.deepEqual(Object.fromEntries([...classes].sort()),Object.fromEntries([['경인선 급행',6],['경부선 일반',3],['서동탄 지선 일반',7],['1호선 일반',7]].sort()));
});
test('operator press release confirms 2026 Gyeongin express existence, but never licenses full timetable approval',async()=>{
 const {integrateKoreanLine1Index}=await import(pathToFileURL(path.join(root,'js/data-loader.js')));
 const routes=integrateKoreanLine1Index(generated,preview).routes.filter(r=>r.integratedLine1);
 const confirmed=routes.filter(r=>r.line1Service.evidenceStatus==='operator-service-confirmed');
 assert.deepEqual(confirmed.map(r=>String(r.sourceRelationId)).sort(),['8820537','8820538']);
 const updated=['대방','신길','개봉','동암','제물포'];
 for(const route of confirmed){
   const original=getRoute(route);
   const stops=original.stations.map(s=>s.ko.replace(/^수도권 1호선 /,'').replace(/역$/,'').replace(/\s*\(수도권 1호선\)$/,''));
   for(const added of updated)assert(stops.includes(added),route.id+' lacks announced express station '+added);
   assert.equal(route.releaseStatus,'research');
   assert(route.researchEvidence.unverified.some(x=>/시간표|운행계통/.test(x)));
 }
 assert.equal(routes.filter(r=>r.line1Service.evidenceStatus==='timetable-unverified').length,21);
});
