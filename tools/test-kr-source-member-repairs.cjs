const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {repairSourceMembers}=require('./lib/kr-source-member-repairs');
const {load,validate,assemble,compile}=require('./lib/kr-network');
const base=path.join(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json')));
const relations=read('source/osm-relations'),ways=new Map(read('source/osm-ways').map(w=>[w.id,w])),nodes=new Map(read('source/osm-nodes').map(n=>[n.id,n])),configs=read('source-member-repairs');
const evidence=c=>({sources:read('supplemental-sources'),workbook:fs.readFileSync(path.join(base,c.officialStopOrder.workbookFile)),researchBytes:fs.readFileSync(path.join(base,'korail-commuter-research.json'))});
const run=c=>repairSourceMembers(relations.find(r=>r.id===c.relationId),ways,nodes,c,evidence(c));
test('Daegyeong partial repairs retain every distinct original rail and all eight stop identities',()=>{
 for(const c of configs){const r=relations.find(r=>r.id===c.relationId),before=JSON.stringify(r),result=run(c),original=r.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role));
  assert.equal(JSON.stringify(r),before);assert.deepEqual([...new Set(result.members.map(m=>m.ref))].sort(),[...new Set(original.map(m=>m.ref))].sort());
  assert.deepEqual(result.stops.map(m=>nodes.get(m.ref).tags.name),c.officialStopOrder.nodes.map(n=>n.officialName));
  assert.equal(result.stops.length,8);assert(result.stops.some(m=>m.ref==='13609645235'));
  assert.equal(result.evidence.operationalDirectionVerified,false);assert.equal(result.evidence.releaseApproved,false);
 }
 assert.equal(run(configs[0]).members[102].ref,'1481662389');
 assert.equal(run(configs[1]).members.filter(m=>m.ref==='1254364849').length,1);
});
test('changed anchors, omitted stops and changed official source cannot be accepted',()=>{
 for(const mutate of [c=>c.relationSha256='0'.repeat(64),c=>c.memberRepair.waySha256='0'.repeat(64),c=>c.memberRepair.insertBeforeIndex=101,c=>c.officialStopOrder.nodes.pop(),c=>c.officialStopOrder.nodes.reverse(),c=>c.officialStopOrder.nodes[0].nodeSha256='0'.repeat(64),c=>c.officialStopOrder.tripIds.pop(),c=>c.officialStopOrder.workbookSha256='0'.repeat(64),c=>c.officialStopOrder.researchSha256='0'.repeat(64)]){
  const c=structuredClone(configs[0]);mutate(c);assert.throws(()=>run(c));
 }
 const c=structuredClone(configs[1]);c.memberRepair.retainedIndex=22;assert.throws(()=>run(c),/UNPROVEN_DUPLICATE/);
});
test('partial repairs never hide unmapped Buksam or promote either service to playable/released',()=>{
 const data=load(base),{maps,errors}=validate(data,{base});assert.deepEqual(errors,[]);const compiled=compile(data,{base});
 for(const c of configs){const s=maps.services.get('kr-osm-service-'+c.relationId);assert(s.sourceMemberRepair);assert(s.issues.some(i=>i.code==='STOP_NOT_ON_ORDERED_TRACK'&&i.nodeId==='13609645235'));assert.throws(()=>assemble(s,maps),/UNRESOLVED_IMPORT_TOPOLOGY/);assert(compiled.blocked.some(b=>b.serviceId===s.id));}
 assert.equal(compiled.counts.releasedServices,0);
});
test('Gosaek endpoint correction preserves raw Suwon tag and every source path and stop',()=>{
 const {correctSourceEndpoints}=require('./lib/kr-service-endpoints'),c=read('service-endpoint-corrections')[0],s=read('services').find(s=>s.id===c.serviceId),r=relations.find(r=>'kr-osm-service-'+r.id===c.serviceId);
 const e={sources:read('supplemental-sources'),workbook:fs.readFileSync(path.join(base,c.workbookFile)),researchBytes:fs.readFileSync(path.join(base,'korail-commuter-research.json'))};
 const corrected=correctSourceEndpoints(s,r,nodes,c,e);assert.equal(corrected.osmFrom,'수원');assert.equal(corrected.operatingEndpoints.origin,'고색');assert.deepEqual(corrected.stops,s.stops);assert.deepEqual(corrected.paths,s.paths);assert.equal(corrected.endpointCorrection.releaseApproved,false);
});
test('endpoint correction rejects a different platform, incomplete train or missing holiday',()=>{
 const {correctSourceEndpoints}=require('./lib/kr-service-endpoints'),c=read('service-endpoint-corrections')[0],s=read('services').find(s=>s.id===c.serviceId),r=relations.find(r=>'kr-osm-service-'+r.id===c.serviceId),e={sources:read('supplemental-sources'),workbook:fs.readFileSync(path.join(base,c.workbookFile)),researchBytes:fs.readFileSync(path.join(base,'korail-commuter-research.json'))};
 for(const mutate of [c=>c.origin='수원',c=>c.originNode.nodeId='5910050514',c=>c.tripIds.pop(),c=>c.tripIds[0]='korail-suin-bundang-20260822-0-K6308',c=>c.researchSha256='0'.repeat(64)]){const bad=structuredClone(c);mutate(bad);assert.throws(()=>correctSourceEndpoints(s,r,nodes,bad,e));}
});
