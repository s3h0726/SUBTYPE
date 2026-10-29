'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const n=require('./lib/kr-network'),data=n.load(base),maps=n.validate(data,{base}).maps,ways=new Map(read('data/kr/v2/source/osm-ways.json').map(w=>[w.id,w])),baseline=read('reports/korea/phase8/BASELINE.json'),index=read('data/kr/preview/index.json');
const runtime=import('../js/korean-research-resolver.js'),geometry=import('../js/korean-provisional-geometry.js');
async function routeFor(meta){const raw=read(meta.lazySource.split('?')[0]).route;return (await geometry).expandKoreanPatternGeometry(raw,async url=>read(url));}
test('all original 128 routes and geometry remain byte-identical; 197 unique additions have separate identities',()=>{
 assert.equal(baseline.previewPayloads.length,128);for(const p of baseline.previewPayloads)assert.equal(hash(fs.readFileSync(path.join(root,p.path))),p.sha256,p.path);
 assert.equal(index.routes.length,325);assert.equal(new Set(index.routes.map(r=>r.id)).size,325);assert.equal(index.routes.filter(r=>!baseline.previewPayloads.some(p=>p.id===r.id)).length,197);assert.equal(index.routes.filter(r=>r.provisionalContract).length,125);
 const audit=read('data/kr/preview/audit.json');assert.equal(audit.counts.researchBlocked,105);assert.equal(audit.counts.sourceAssemblable,263);assert.equal(audit.counts.excluded,12);assert.equal(audit.counts.officialReleased,0);
});
test('every expanded provisional pattern uses real source geometry, actual full published calls and strict research contracts',async()=>{
 const api=await runtime,source=read('data/kr/v2/seoulmetro-trip-candidates.json'),ktx=read('data/kr/v2/korail-highspeed-pattern-research.json');
 for(const meta of index.routes){const r=await routeFor(meta);api.assertKoreanResearchRoute(r);assert.equal(r.stations[0].geometryIndex,0);assert.equal(r.stations.at(-1).geometryIndex,r.geometry.length-1);assert.equal(r.releaseStatus,'research');if(!r.provisionalContract)continue;
  const rows=r.provisionalEvidence.kind==='ktx'?ktx.trains:source;for(const id of r.provisionalEvidence.sourceTripIds){const t=rows.find(t=>t.id===id);assert(t);assert.deepEqual(t.calls.map(c=>c.operationalStationName||c.stationName),r.stations.map(s=>s.ko));}
  const donor=n.assemble(maps.services.get(r.provisionalEvidence.donorServiceId),maps),[a,b]=r.geometryRef.range;assert.deepEqual(r.geometry,donor.geometry.slice(a,b+1));assert.equal(hash(JSON.stringify(r.geometry)),r.geometryRef.sha256);
 }
});
test('station sidings require pinned passenger stop evidence; yards, private tracks and direction conflicts never pass',async()=>{
 const api=await runtime,policy=require('./lib/kr-passenger-platforms.cjs'),allowed=policy.loadPassengerPlatforms(base,data,ways);assert.equal(allowed.size,137);
 const meta=index.routes.find(r=>r.sourceRelationId==='2718884'),r=await routeFor(meta),position=r.researchEvidence.track.findIndex(w=>w.service==='siding');assert(position>=0);api.assertKoreanResearchRoute(r);
 for(const mutate of [w=>w.access='private',w=>w.service='yard',w=>w.service='spur',w=>w.highway='service',w=>delete w.passengerPlatformReview,w=>w.version+=1,w=>{w.oneway='yes';w.reverse=true}]){const copy=structuredClone(r);mutate(copy.researchEvidence.track[position]);assert.throws(()=>api.assertKoreanResearchRoute(copy));}
 const changed=new Map(ways),id=[...allowed.keys()][0];changed.set(id,{...ways.get(id),tags:{...ways.get(id).tags,access:'private'}});assert.throws(()=>policy.loadPassengerPlatforms(base,data,changed));
});
test('KTX uses published 429/473 stopping pattern and shared real tracks; Kongju is passed without a typing call',async()=>{
 const added=index.routes.filter(r=>r.provisionalEvidence?.kind==='ktx');assert.equal(added.length,1);const r=await routeFor(added[0]);assert.deepEqual(r.stations.map(s=>s.ko),['용산','익산','광주송정']);assert.deepEqual(r.provisionalEvidence.trainNumbers,['429','473']);assert.equal(r.category,'high_speed_rail');assert.equal(r.provisionalEvidence.timetableCurrentness,'UNVERIFIED');assert.equal(r.provisionalEvidence.officialReleaseApproved,false);
 assert(r.researchEvidence.track.some(w=>w.service==='siding'&&w.passengerPlatformReview));assert(!r.stations.some(s=>s.ko==='공주'));
 const original=read(added[0].lazySource.split('?')[0]).route,bad=structuredClone(original);bad.geometryRef.sha256='0'.repeat(64);await assert.rejects((await geometry).expandKoreanPatternGeometry(bad,async url=>read(url)),/HASH_MISMATCH/);
});
test('two actual directional source reconstructions and two complete Line 2 circuits preserve source topology',async()=>{
 for(const id of ['16665961','16665962']){const s=maps.services.get('kr-osm-service-'+id),j=n.assemble(s,maps);assert.equal(j.stations.length,14);assert(s.reconstruction.officialTripIds.length>0);assert(index.routes.some(r=>r.sourceServiceId===s.id));}
 for(const id of ['2404374','4729409']){const r=await routeFor(index.routes.find(r=>r.sourceRelationId===id)),j=n.assemble(maps.services.get('kr-osm-service-'+id),maps);assert.equal(r.stations.length,44);assert.equal(new Set(r.stations.map(s=>s.id)).size,43);assert.equal(r.stations[0].id,r.stations.at(-1).id);assert.deepEqual(r.geometry,j.geometry);assert.deepEqual(r.geometry[0],r.geometry.at(-1));assert.equal(r.researchEvidence.provisionalEndpoint.sourceLabelConflict,true);assert(!/내선|외선/.test(r.line.ko));}
});
test('regional name corrections retain platform coordinates and genuine tourist railway visits',async()=>{
 for(const id of ['7685464','7845970']){const r=await routeFor(index.routes.find(r=>r.sourceRelationId===id));assert.equal(r.stations.length,35);assert(r.stations.some(s=>s.ko==='서부정류장'));}
 const wolmi=await routeFor(index.routes.find(r=>r.sourceRelationId==='14074976'));assert.equal(wolmi.stations.length,6);assert.equal(new Set(wolmi.stations.map(s=>s.ko)).size,4);assert.equal(wolmi.category,'monorail');assert(wolmi.researchEvidence.provisionalEndpoint.sourceUrl.startsWith('https://www.ictr.or.kr/'));
});
test('physical selector families unify variants without changing research or official record contracts',async()=>{
 const api=await runtime;assert.equal(api.koreanSelectorFamily({countryId:'kr',passengerLineId:'kr-osm-line-7625893'}),'kr-passenger-metro-4');assert.equal(api.koreanSelectorFamily({countryId:'kr',passengerLineId:'kr-passenger-metro-4'}),'kr-passenger-metro-4');assert.equal(api.koreanSelectorFamily({countryId:'jp',id:'line-11343'}),null);
 const denied=read('data/kr/v2/relation-access-policy.json').relations.filter(r=>r.passengerCandidate===false).map(r=>r.relationId);assert(!index.routes.some(r=>denied.includes(r.sourceRelationId)));assert(!index.routes.some(r=>r.sourceRelationId==='20500831'));
});

test('hydrated Korean route station names survive the shared repository without merging another platform or timetable alias',async()=>{const {railDataRepository:repo}=await import('../js/rail-data-repository.js'),{normalizeLine}=await import('../js/data-loader.js'),api=await runtime;repo.reset();for(const meta of index.routes){const r=await routeFor(meta);for(const st of r.stations)repo.registerStation({...st,ko:'다른 계통의 이름'});const resolved=repo.resolveRoute(normalizeLine(r));assert.deepEqual(resolved.stations.map(s=>s.ko),r.stations.map(s=>s.ko));assert.deepEqual(resolved.stations.map(s=>[s.id,s.latitude,s.longitude]),r.stations.map(s=>[s.id,s.latitude,s.longitude]));api.assertKoreanResearchRoute(resolved);}repo.reset();});
