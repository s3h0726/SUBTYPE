const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {load,validate,assemble}=require('./lib/kr-network'),{reconstructService}=require('./lib/kr-service-reconstruction');
const base=path.join(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8')),data=load(base),{maps}=validate(data),configs=read('service-reconstructions'),relations=read('source/osm-relations'),trips=read('seoulmetro-trip-candidates');
const endpointEvidence={passengerPlatforms:require('./lib/kr-passenger-platforms.cjs').loadPassengerPlatforms(base,data,new Map(read('source/osm-ways').map(w=>[w.id,w]))),references:read('official-station-reference'),files:new Map(configs.flatMap(c=>(c.endpointNameCorrections||[]).map(r=>[r.officialFile,fs.readFileSync(path.join(base,r.officialFile))])))};

test('twelve incomplete source relations recover every official call on retained directional source geometry',()=>{assert.equal(configs.length,12);for(const config of configs){const target=maps.services.get(config.serviceId),donor=maps.services.get(config.donorServiceId),relation=relations.find(r=>'kr-osm-service-'+r.id===target.id),result=reconstructService(target,donor,maps,config,relation,trips,endpointEvidence),journey=assemble(result,maps);assert.deepEqual(journey.stations.map(s=>s.ko),config.calls.map(c=>c.officialStationName));assert.equal(result.status,'candidate');assert.equal(result.issues[0].code,'OFFICIAL_TIMETABLE_REQUIRED');assert(result.paths.every(p=>donor.paths.some(q=>q.geometryId===p.geometryId&&q.reverse===p.reverse)));assert(target.sourceIssues.some(i=>i.code==='MISSING_ORDERED_STOPS'))}});
test('stale donor, changed official calls, omitted original ways and non-public or opposite track fail closed',()=>{const config=configs[0],target=maps.services.get(config.serviceId),donor=maps.services.get(config.donorServiceId),relation=relations.find(r=>'kr-osm-service-'+r.id===target.id),run=(t=target,d=donor,m=maps,c=config,ts=trips)=>reconstructService(t,d,m,c,relation,ts);
 assert.throws(()=>run(target,{...donor,names:{ko:'changed'}}),/STALE_RECONSTRUCTION_SOURCE/);
 const c=structuredClone(config);c.calls[1].officialStationName='wrong';assert.throws(()=>run(target,donor,maps,c),/OFFICIAL_CALL_PATTERN_MISMATCH/);
 assert.throws(()=>run({...target,paths:[{geometryId:'absent'}]}),/ORIGINAL_WAY_OMITTED/);
 assert.throws(()=>run(target,donor,maps,config,[]),/MISSING_OFFICIAL_TRAINS/);
 const m={...maps,infrastructure:new Map([...maps.infrastructure].map(([k,v])=>[k,{...v,service:'yard'}]))};assert.throws(()=>run(target,donor,m),/NON_PUBLIC_TRACK/);
});

test('renamed endpoint requires pinned official history and station identity, preserving the raw source name',()=>{
 const c=configs.find(c=>c.serviceId==='kr-osm-service-16665964'),target=maps.services.get(c.serviceId),donor=maps.services.get(c.donorServiceId),relation=relations.find(r=>r.id==='16665964'),run=(config=c,evidence=endpointEvidence)=>reconstructService(target,donor,maps,config,relation,trips,evidence);
 const result=run();assert.equal(result.osmTo,'당고개');assert.equal(result.operatingEndpoints.destination,'불암산');assert.equal(assemble(result,maps).stations.at(-1).ko,'불암산');assert.equal(result.stops.length,4);assert.equal(c.officialTripIds.length,3);assert(result.sourceNames.ko.includes('당고개'));assert.equal(result.status,'candidate');
 assert.throws(()=>run(c,{references:[],files:new Map()}),/UNVERIFIED_ENDPOINT_RENAME/);
 for(const mutate of [c=>c.endpointNameCorrections[0].referenceSha256='0'.repeat(64),c=>c.endpointNameCorrections[0].officialSha256='0'.repeat(64),c=>c.endpointNameCorrections[0].officialStationCode='0410',c=>c.endpointNameCorrections[0].expectedStationCoordinates.lat=36]){const bad=structuredClone(c);mutate(bad);assert.throws(()=>run(bad),/UNVERIFIED_ENDPOINT_RENAME/)}
});
