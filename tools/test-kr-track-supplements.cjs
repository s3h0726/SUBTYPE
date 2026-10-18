const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {supplementSourceTrack}=require('./lib/kr-track-supplements');
const {load,validate,assemble,compile}=require('./lib/kr-network');
const base=path.join(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'))),config=read('service-track-supplements')[0],relation=read('source/osm-relations').find(r=>r.id===config.relationId),ways=new Map(read('source/osm-ways').map(w=>[w.id,w])),nodes=new Map(read('source/osm-nodes').map(n=>[n.id,n]));
const evidence={wayFiles:new Map(config.insertions.map(p=>[p.sourceFile,fs.readFileSync(path.join(base,p.sourceFile))])),sources:read('supplemental-sources'),workbook:fs.readFileSync(path.join(base,config.officialPattern.workbookFile)),researchBytes:fs.readFileSync(path.join(base,'korail-ktx-research.json'))};
test('Seoul–Busan retains every source member and exactly four original stop positions on real mainline geometry',()=>{
 const result=supplementSourceTrack(relation,ways,nodes,config,evidence),original=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role));assert.equal(result.members.length,original.length+2);for(const m of original)assert(result.members.some(n=>n.ref===m.ref&&n.role===m.role));
 const data=load(base),{maps,errors}=validate(data,{base});assert.deepEqual(errors,[]);const service=maps.services.get('kr-osm-service-11214334'),journey=assemble(service,maps);
 assert.deepEqual(journey.stations.map(s=>s.ko),['서울','대전','동대구','부산']);assert.equal(journey.geometry.length,1759);assert(journey.lengthKm>400&&journey.lengthKm<450);
 assert.equal(service.stops.length,4);assert.deepEqual(service.stops.map(c=>maps.stops.get(c.stopId).osmNodeId),relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)).map(m=>m.ref));
 for(const p of config.insertions){const g=maps.geometry.get('kr-geometry-'+p.wayId),w=ways.get(p.wayId);assert.deepEqual(g.nodeIds,w.nodeIds);assert.deepEqual(g.coordinates,w.coordinates)}
 const c=compile(data,{base});assert(c.blocked.some(b=>b.serviceId===service.id));assert.equal(c.counts.releasedServices,0);assert.equal(result.evidence.platformDirectionVerified,false);
});
test('a different route, source way, missing link, branch or train cannot certify the supplement',()=>{
 for(const mutate of [c=>c.relationSha256='0'.repeat(64),c=>c.swap.firstIndex=12,c=>c.insertions.pop(),c=>c.insertions[0].wayId='490932450',c=>c.insertions[0].fileSha256='0'.repeat(64),c=>c.officialPattern.tripIds[0]='korail-ktx-20260515-gyeongbu-DOWN-171',c=>c.officialPattern.operatingDayNotes['43']='매일']){
  const bad=structuredClone(config);mutate(bad);assert.throws(()=>supplementSourceTrack(relation,ways,nodes,bad,evidence));
 }
 const e={...evidence,wayFiles:new Map(evidence.wayFiles)},file=config.insertions[0].sourceFile;e.wayFiles.set(file,Buffer.from('{}'));assert.throws(()=>supplementSourceTrack(relation,ways,nodes,config,e),/UNPROVEN_MAINLINE/);
});
test('official SR pilot evidence forbids inferring SRT merely from a Suseo terminal',()=>{
 const review=read('train-brand-reviews'),bytes=fs.readFileSync(path.join(base,review.sourceFile)),text=bytes.toString('utf8').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),review.sha256);
 for(const phrase of ['2026. 5. 15.','KTX 4141','KTX 4863','월 ~ 목은 SRT 328, 341','운행시각 및 정차역은 기존과 동일'])assert(text.includes(phrase));
 assert.equal(review.patterns.find(p=>p.trainNumber==='4141').trainBrand,'KTX');assert.equal(review.patterns.find(p=>p.trainNumber==='341').trainBrand,'SRT');assert.deepEqual(review.patterns[0].calls,review.patterns[1].calls);assert.equal(review.releaseApproved,false);
});
test('official train station names correct display only and reject changed station identity',()=>{
 const {applyTrainStationNames}=require('./lib/kr-track-supplements'),reviews=read('train-station-name-corrections'),stops=read('stops');
 const fixture=()=>{const m=new Map(read('stations').map(s=>[s.id,s]));for(const r of reviews)m.get(r.stationId).names.ko=r.expectedSourceName;return m};
 const stations=fixture(),coordinates=reviews.map(r=>({...stations.get(r.stationId).coordinates}));applyTrainStationNames(stations,stops,nodes,reviews,evidence);
 assert.deepEqual(reviews.map(r=>stations.get(r.stationId).names.ko),['서울','대전','부산']);assert.deepEqual(reviews.map(r=>stations.get(r.stationId).coordinates),coordinates);
 assert(reviews.every(r=>stations.get(r.stationId).status==='candidate'));
 const bad=structuredClone(reviews);bad[0].stationSha256='0'.repeat(64);assert.throws(()=>applyTrainStationNames(fixture(),stops,nodes,bad,evidence),/STALE_TRAIN_STATION_IDENTITY/);
});
