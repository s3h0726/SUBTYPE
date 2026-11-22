'use strict';
// Reproduce the actual typing/game engine for the newly documented morning
// variants. A source-only route cannot be published until a completion proof
// has been recorded against the exact route + engine fingerprints.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,value)=>{
 const file=path.join(root,p),serialized=JSON.stringify(value,null,2)+'\n';
 fs.mkdirSync(path.dirname(file),{recursive:true});
 if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==serialized)fs.writeFileSync(file,serialized);
};
const {SPECS}=require('./lib/hk-school-special-routes.cjs');
const {complete,engineFingerprint}=require('./lib/hk-game-completion.cjs');
const {gameplayFingerprint}=require('./lib/hk-release.cjs');
(async()=>{
 const reviewFile='data/hk/master/gameplay-review.json',review=read(reviewFile);
 const report={schemaVersion:1,engineFingerprint:engineFingerprint(),routes:[]};
 for(const spec of SPECS){
  const route=read('data/hk/generated/routes/'+spec.id+'.json');
  assert.equal(route.id,spec.id);
  assert.equal(route.canonicalLineId,spec.lineId);
  assert.equal(route.releaseStatus,'validation-preview');
  assert.equal(route.validationPreview,true);
  assert.deepEqual(route.stations.map(s=>s.id),spec.stationCodes.map(s=>'hk-lr-'+s));
  assert.equal(route.directedSegments.length,route.stations.length-1);
  const result=await complete(route);
  assert.equal(result.status,'PASS');
  assert.equal(result.completed,route.stations.length);
  assert.deepEqual(result.typedStationIds,route.stations.map(s=>s.id));
  assert.equal(result.engineFingerprint,report.engineFingerprint);
  const fingerprint=gameplayFingerprint(route);
  assert.equal(route.validationFingerprint,fingerprint);
  review.services[spec.id]={
   status:'PASS',method:'automated-game-completion',fingerprint,
   conditionFingerprint:route.operatingConditionFingerprint,
   checkedAt:'2026-11-22T00:00:00.000Z',
   evidenceFile:'reports/hong-kong/completion/school-specials-20261122.json',
   officialSources:[spec.timetableUrl,spec.callingOrderUrl],
   completion:result
  };
  report.routes.push({id:spec.id,fingerprint,conditionFingerprint:route.operatingConditionFingerprint,completion:result,
   geometryOffsetReviews:route.directedSegments.flatMap(s=>s.stopOffsetReview?.gaps||[])});
 }
 write(reviewFile,review);
 write('reports/hong-kong/completion/school-specials-20261122.json',report);
 console.log('PASS Hong Kong Light Rail 506P & 720 engine completions with exact source route fingerprints');
})().catch(error=>{console.error(error);process.exitCode=1;});
