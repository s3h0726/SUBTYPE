'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const {load,validate,assemble}=require('./lib/kr-network'),{endpointIdentityMatches}=require('./lib/kr-endpoint-identities'),data=load(path.join(root,'data/kr/v2')),{maps}=validate(data),bindings=read('data/kr/v2/endpoint-identities.json');
test('all original 95 payloads remain byte-identical and 28 restored routes retain source paths',()=>{
 const index=read('data/kr/preview/index.json'),prior=read('reports/korea/phase5/BASELINE_ROUTES.json');assert.equal(prior.length,95);assert.equal(index.routes.length,325);
 for(const old of prior){const route=index.routes.find(r=>r.id===old.id);assert(route,old.id);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,route.lazySource.split('?')[0]))).digest('hex'),old.sha256)}
 const restored=read('data/kr/v2/phase5-restored-services.json');assert.equal(restored.serviceIds.length,28);for(const id of restored.serviceIds){const s=maps.services.get(id),j=assemble(s,maps),meta=index.routes.find(r=>r.sourceServiceId===id);assert(meta,id);const r=read(meta.lazySource.split('?')[0]).route;assert.deepEqual(r.geometry,j.geometry);assert.deepEqual(r.stations,j.stations);assert.equal(r.playStatus,'RESEARCH_PLAYABLE');assert.equal(r.releaseStatus,'research');assert(endpointIdentityMatches(s,j,bindings))}
});
test('aliases cannot authorize missing endpoints, wrong visits, changed ways or stopped-short services',()=>{
 const b=bindings.find(b=>b.serviceId==='kr-osm-service-2718901'),s=maps.services.get(b.serviceId),j=assemble(s,maps);assert(endpointIdentityMatches(s,j,bindings));
 for(const change of [s=>s.osmFrom=null,s=>s.osmFrom='의정부',s=>s.stops.pop(),s=>s.paths.reverse()]){const v=structuredClone(s);change(v);let pass=false;try{pass=endpointIdentityMatches(v,j,bindings)}catch(e){assert.match(e.message,/STALE_ENDPOINT_IDENTITY/)}assert.equal(pass,false)}
 const shortened=structuredClone(j);shortened.stations.pop();assert.equal(endpointIdentityMatches(s,shortened,bindings),false);
 const forged=structuredClone(bindings);forged.find(b=>b.serviceId===s.id).origin.stationName='다른역';assert.equal(endpointIdentityMatches(s,j,forged),false);
});
test('identity restoration retains all private, one-way, partial and excluded blockers',()=>{
 const a=read('data/kr/preview/audit.json');assert.equal(a.counts.excluded,12);assert.equal(a.counts.researchBlocked,105);assert.equal(a.counts.officialReleased,0);
 for(const id of ['8691898','12623857','10713827','20500831'])assert(a.blocked.some(b=>b.relationId===id),id);
 for(const id of ['2718901','7919018','18828088','18828089','18581442','18581443'])assert(read('data/kr/preview/index.json').routes.some(r=>r.sourceRelationId===id),id);
});

test('GTX official reference separates operating company from infrastructure company',()=>{const facts=read('data/kr/v2/phase5-official-facts.json')[0],bytes=fs.readFileSync(path.join(root,'data/kr/v2',facts.evidenceFile));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),facts.sha256);assert.equal(facts.releaseApproved,false);assert.deepEqual(facts.sourceStationOrder,['운정중앙','킨텍스','대곡','연신내','서울역']);for(const name of [...facts.sourceStationOrder,'서울교통공사','에스지레일'])assert(bytes.toString('utf8').includes(name));for(const id of facts.serviceIds)assert.deepEqual(maps.services.get(id).operatorIds,[facts.operatingOperatorId]);assert(facts.remaining.includes('CURRENT_TRAIN_TIMETABLE_AND_CALENDAR'));});
