#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=JSON.parse(read('data/kr/preview/index.json'));
const published=JSON.parse(read('data/kr/generated/index.json'));
const audit=JSON.parse(read('data/kr/evidence/regular-service-source-audit.json'));
const excluded=new Set(['13695367','13695368']);
assert.equal(source.routes.length,123);
const expected=source.routes.filter(x=>!excluded.has(x.sourceRelationId));
const promoted=published.routes.filter(x=>/^kr-service-\d+$/.test(x.id));
const extra=[...(audit.recoveredEndpointless||[]),...(audit.recoveredEndpointAliases||[])];
assert.equal(promoted.length,expected.length+extra.length,'Regular catalog must include source routes and endpointless recoveries');
assert.equal(expected.length,121,'Existing promoted services must be preserved');
for(const e of expected)assert(promoted.some(p=>p.id==='kr-service-'+e.sourceRelationId),'Published source route disappeared: '+e.sourceRelationId);
for(const e of extra){
 assert(!expected.some(p=>p.sourceRelationId===e.sourceRelationId),'Recovery duplicated an existing route');
 assert(promoted.some(p=>p.id===e.id),'Recovered missing-endpoint route absent from public index');
 assert(e.origin&&e.destination,'Recovered route lacks ordered station endpoints');
}
assert.equal(published.counts.gamePublishedServices,promoted.length);
assert.equal(published.counts.endpointlessRecovered,(audit.recoveredEndpointless||[]).length);
assert.equal(published.counts.endpointAliasesRecovered,(audit.recoveredEndpointAliases||[]).length);
assert.equal(published.counts.routes,published.routes.length);
assert(published.routes.length>=129,'Existing passenger lines lost');
const ids=new Set(published.routes.map(x=>x.id));
assert.equal(ids.size,published.routes.length,'Duplicate public route ID');
assert(published.routes.some(x=>x.id==='kr-metro-2'),'Legacy Korean Line 2 missing');
assert(!published.routes.some(x=>/^kr-preview-/.test(x.id)),'Research preview ID in public catalog');
for(const route of promoted){
 assert.equal(route.playable,true,route.id);
 assert.equal(route.releaseStatus,'released',route.id);
 assert.equal(route.playStatus,'RELEASED',route.id);
 assert.equal(route.geometryReady,true,route.id);
 assert(!route.previewContract&&!route.researchEvidence,'Source review fields leaked to game catalog '+route.id);
 assert(route.lazySource.startsWith('data/kr/generated/routes/'+route.id+'.json'),'Lazy payload not promoted '+route.id);
 const candidate=JSON.parse(read(route.lazySource.split('?')[0])).route;
 assert.equal(candidate.id,route.id);
 assert.equal(candidate.stations.length,route.stationCount);
 assert.equal(candidate.directedSegments.length,candidate.stations.length-1);
 assert(candidate.services?.length>=1);
 assert(candidate.geometry.length>=candidate.stations.length);
 assert.deepEqual(candidate.services[0].stops,candidate.stations.map(x=>x.id),'Service call order changed '+route.id);
 let preceding=-1;
 for(const [i,station] of candidate.stations.entries()){
  assert(Number.isInteger(station.geometryIndex)&&station.geometryIndex>preceding,'Invalid track stop '+route.id);
  assert.deepEqual(candidate.geometry[station.geometryIndex],[station.latitude,station.longitude],'Station not on source track '+route.id);
  preceding=station.geometryIndex;
  if(i){const seg=candidate.directedSegments[i-1];assert.equal(seg.fromStationId,candidate.stations[i-1].id);assert.equal(seg.toStationId,station.id);assert(seg.geometry.length>=2);}
 }
 assert(audit.published[route.id]&&!audit.published[route.id].externalTimetableVerified,'Source evidence lost '+route.id);
 assert.equal(audit.published[route.id].geometrySha256,crypto.createHash('sha256').update(JSON.stringify({stations:candidate.stations,geometry:candidate.geometry,directedSegments:candidate.directedSegments})).digest('hex'));
}
const app=read('js/app.js'),bundle=read('js/app.bundle.js'),stats=read('js/statistics.js'),loader=read('js/data-loader.js');
for(const sourceCode of [app,bundle]){
 assert(sourceCode.includes('koreanGameRouteChoice'),'Korean normal choices missing');
 assert(sourceCode.includes('koreanGameService'),'Korean service resolver missing');
 assert(sourceCode.includes("const hkLine=e.target.closest('[data-hk-line-family]')"),'HK selector damaged');
 assert(!sourceCode.includes('data-korea-mode="research"'),'Research tab returned');
 assert(!sourceCode.includes('research-card-status'),'Research card returned');
 assert(!sourceCode.includes('연구용 미리보기 · 공식 운행 미승인'),'Research UI returned');
}
assert(!loader.includes("const previewUrl=new URL("),'Runtime still loads research mode index');
assert(!stats.includes('<option value="research">'),'Research-only record selector returned');
assert(read('js/korea-index-data.js').includes('"kr-service-443803"'));
console.log('PASS Korean regular-game routes: '+promoted.length+' = '+expected.length+' prior + '+extra.length+' verified endpointless; historical '+excluded.size+' excluded; legacy paths, real geometry, HK/JP compatibility retained');
