'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const n=require('./lib/kr-network'),data=n.load(base),{maps}=n.validate(data),{officialRouteEndpoints}=require('./lib/kr-official-route-endpoints');
test('all 123 Phase 5 payloads remain byte-identical; four new full Busan directions preserve original track and platform positions',()=>{
 const baseline=read('reports/korea/phase6/BASELINE.json'),index=read('data/kr/preview/index.json');assert.equal(baseline.previewPayloads.length,123);
 for(const old of baseline.previewPayloads)assert.equal(hash(fs.readFileSync(path.join(root,old.path))),old.sha256,old.path);
 const added=index.routes.filter(r=>['2195014','2205952','8247016','8258701'].includes(r.sourceRelationId));assert.deepEqual(added.map(r=>r.sourceRelationId),['2195014','2205952','8247016','8258701']);
 for(const meta of added){const s=maps.services.get(meta.sourceServiceId),j=n.assemble(s,maps),r=read(meta.lazySource.split('?')[0]).route;assert.deepEqual(r.geometry,j.geometry);assert.deepEqual(r.stations.map(st=>{const {sourceStationCode,stationCodeSource,stationCodeVerification,...rest}=st;return {...rest,officialCode:sourceStationCode,stationCode:sourceStationCode,hasOfficialStationCode:!!sourceStationCode}}),j.stations);assert.equal(r.releaseStatus,'research');assert.equal(r.researchEvidence.officialEndpoints.officialReleaseApproved,false);assert(officialRouteEndpoints(s,j,{base}));assert(r.stations.every(st=>st.stationCodeSource==='https://work.humetro.busan.kr/homepage/cyberstation/map.do'));if(meta.sourceRelationId==='2195014')assert.equal(r.stations.find(st=>st.ko==='덕천').officialCode,'313');}
});
test('official endpoint bindings reject partial routes, the other platform, reordered calls, and a changed source path',()=>{
 for(const id of ['2195014','8247016','2205952','8258701']){const original=maps.services.get('kr-osm-service-'+id),journey=n.assemble(original,maps);
 for(const mutate of [j=>j.stations.pop(),j=>j.stations.reverse(),j=>j.stations[0].platformId='other-platform',j=>j.stations[0].id='same-name-other-station',j=>j.stations[0].ko='가짜역']){const j=structuredClone(journey);mutate(j);assert.throws(()=>officialRouteEndpoints(original,j,{base}));}
 const s=structuredClone(original);s.paths[0].reverse=!s.paths[0].reverse;assert.throws(()=>officialRouteEndpoints(s,journey,{base}),/STALE_OFFICIAL_ENDPOINT_BINDING/);
 }
 assert.equal(officialRouteEndpoints(maps.services.get('kr-osm-service-2404374'),n.assemble(maps.services.get('kr-osm-service-2404374'),maps),{base}),null);
});
test('closed Line 2 geometry does not conceal the source label and official direction conflict',()=>{
 const rows=require('./lib/kr-research-circuits').auditResearchCircuits(data,maps,base),index=read('data/kr/preview/index.json');assert.equal(rows.length,2);
 for(const r of rows){assert.equal(r.closedTrack,true);assert.equal(r.uniqueStations,43);assert.equal(r.visits,44);assert(r.matchedTrains>0);assert.equal(r.reason,'OSM_LABEL_OFFICIAL_CALL_ORDER_DIRECTION_CONFLICT');assert(!r.matchedOfficialDirections.includes(r.sourceDirection));assert(!index.routes.some(p=>p.sourceServiceId===r.serviceId));assert.equal(r.releaseApproved,false);}
});
test('all published KTX tables retain full trains, actual origin/terminus and day offsets without fabricating physical passing stations',()=>{
 const doc=read('data/kr/v2/korail-highspeed-pattern-research.json');assert.equal(hash(fs.readFileSync(path.join(base,doc.source.file))),doc.source.sha256);assert.equal(doc.sections.length,18);assert.equal(doc.trains.length,621);assert.equal(doc.patterns.length,551);assert.equal(new Set(doc.trains.map(t=>t.id)).size,621);
 assert.deepEqual([...new Set(doc.trains.map(t=>t.trainType))].sort(),['KTX','KTX-산천','KTX-이음','KTX-청룡'].sort());
 for(const t of doc.trains){assert.equal(t.origin,t.calls[0].stationName);assert.equal(t.destination,t.calls.at(-1).stationName);assert(t.calls.length>=2);assert.deepEqual(t.issues,[]);assert.equal(t.releaseApproved,false);assert.equal(t.holidayExceptionsVerified,false);assert(t.noPublishedCalls.every(c=>c.meaning==='NO_PUBLISHED_CALL_NOT_PROOF_OF_PHYSICAL_PASSING'));for(let i=1;i<t.calls.length;i++)assert(t.calls[i].elapsedDaySeconds>=t.calls[i-1].elapsedDaySeconds);}
 const viaSuwon=doc.trains.find(t=>t.sheet==='경부선'&&t.trainNumber==='171');assert(viaSuwon.calls.some(c=>c.stationName==='수원'));assert(!viaSuwon.calls.some(c=>c.stationName==='광명'));assert(viaSuwon.noPublishedCalls.some(c=>c.stationName==='광명'));
 assert(doc.trains.some(t=>t.calls.at(-1).dayOffset===1));assert.equal(doc.patterns.reduce((n,p)=>n+p.trainIds.length,0),621);
});
test('Korea preview index is revalidated independently of the production engine hash',()=>{const code=fs.readFileSync(path.join(root,'js/data-loader.js'),'utf8');assert.equal((code.match(/fetchJson\(previewUrl,\{cache:'no-cache'\}\)/g)||[]).length,2);});
