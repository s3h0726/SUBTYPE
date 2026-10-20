const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCorridorReviewer,turnDegrees,hash}=require('./lib/kr-corridor-repairs');
const {load,validate,assemble,compile}=require('./lib/kr-network');
const base=path.join(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'))),config=read('corridor-repairs'),ways=new Map(read('source/osm-ways').map(w=>[w.id,w])),relations=new Map(read('source/osm-relations').map(r=>[r.id,r])),files=new Map(config.segments.map(s=>[s.sourceFile,fs.readFileSync(path.join(base,s.sourceFile))]));
test('thirteen exact mainline joins reuse nine source ways across seven incomplete relations',()=>{
 const review=createCorridorReviewer(ways,config,files);assert.equal(config.segments.length,9);assert.equal(config.relations.length,7);let joins=0,contiguous=0;
 for(const c of config.relations){const relation=relations.get(c.relationId),before=JSON.stringify(relation),r=review(relation),original=relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role)),added=new Set(r.evidence.insertions.map(p=>p.wayId));
  assert.equal(JSON.stringify(relation),before);assert.deepEqual(r.members.filter(m=>!added.has(m.ref)),original);assert.equal(r.members.length,original.length+c.insertions.length);
  assert.deepEqual(r.evidence.originalStopMembers,relation.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)));
  assert(r.evidence.insertions.every(p=>p.turnDegrees.every(a=>a<12)));assert.equal(r.evidence.operatingPatternVerified,false);assert.equal(r.evidence.releaseApproved,false);joins+=r.evidence.insertions.length;contiguous+=Number(r.evidence.sourceTrackContiguous);
 }
 assert.equal(joins,13);assert.equal(contiguous,1);assert.equal(review(relations.get('11208903')).evidence.sourceTrackContiguous,true);
});
test('stale way versions, copied coordinates, changed anchors and duplicate insertions fail closed',()=>{
 for(const mutate of [c=>c.sourceWaysSha256='0'.repeat(64),c=>c.segments[0].fileSha256='0'.repeat(64),c=>c.segments[0].sourceVersion++,c=>c.segments.push(c.segments[0])]){const c=structuredClone(config);mutate(c);assert.throws(()=>createCorridorReviewer(ways,c,files))}
 for(const mutate of [c=>c.relations[0].relationSha256='0'.repeat(64),c=>c.relations[0].insertions[0].sourceIndex++,c=>c.relations[0].insertions.push(c.relations[0].insertions[0]),c=>c.relations[0].operatingPatternVerified=true]){const c=structuredClone(config);mutate(c);const review=createCorridorReviewer(ways,c,files);assert.throws(()=>review(relations.get(c.relations[0].relationId)))}
 const proofFiles=new Map(files),s=config.segments[0],v=JSON.parse(proofFiles.get(s.sourceFile));v.elements.find(n=>n.type==='node').lat+=0.001;const bytes=Buffer.from(JSON.stringify(v)),c=structuredClone(config);c.segments[0].fileSha256=crypto.createHash('sha256').update(bytes).digest('hex');proofFiles.set(s.sourceFile,bytes);assert.throws(()=>createCorridorReviewer(ways,c,proofFiles),/LATEST_CORRIDOR_GEOMETRY_DRIFT/);
});
test('an exact endpoint alone cannot justify an ambiguous branch, private track or switchback',()=>{
 const review=createCorridorReviewer(ways,config,files),first=config.relations[0],segment=config.segments.find(s=>s.id===first.insertions[0].segmentId),w=ways.get(segment.wayId);
 // A second geometrically identical real rail option must remain ambiguous.
 const cloned=structuredClone(w);cloned.id='unreviewed-alternative';ways.set(cloned.id,cloned);assert.throws(()=>review(relations.get(first.relationId)),/AMBIGUOUS_CORRIDOR_CONNECTOR/);ways.delete(cloned.id);
 const c=structuredClone(config),changed=new Map(ways),privateWay=structuredClone(w);privateWay.tags.access='private';changed.set(privateWay.id,privateWay);c.sourceWaysSha256=hash([...changed.values()]);c.segments.find(s=>s.id===segment.id).waySha256=hash(privateWay);assert.throws(()=>createCorridorReviewer(changed,c,files),/UNPROVEN_CORRIDOR_MAINLINE/);
 assert.equal(turnDegrees([37,127],[37.001,127],[37,127]),180);assert(Number.isNaN(turnDegrees([37,127],[37,127],[37.001,127])));
});
test('physically repaired corridors remain blocked for incomplete operating patterns; all existing candidates survive',()=>{
 const data=load(base),{maps,errors}=validate(data,{base});assert.deepEqual(errors,[]);const result=compile(data,{base});let playable=0;
 for(const service of data.services){try{assemble(service,maps);if(service.access?.passengerCandidate!==false)playable++}catch{}}
 assert.equal(playable,262);assert.equal(result.counts.releasedServices,0);assert.equal(result.counts.activeServiceCandidates,305);assert.equal(result.excluded.length,12);
 for(const c of config.relations){const service=maps.services.get('kr-osm-service-'+c.relationId);assert(service.corridorRepair);assert(service.issues.some(i=>i.code==='SOURCE_STOP_PATTERN_REVIEW_REQUIRED'));assert.throws(()=>assemble(service,maps),/UNRESOLVED_IMPORT_TOPOLOGY/);assert(result.blocked.some(b=>b.serviceId===service.id))}
});
