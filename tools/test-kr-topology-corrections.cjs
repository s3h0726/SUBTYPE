const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {relationHash,applyTopologyCorrection}=require('./lib/kr-topology-corrections');
const {orientOrderedWays}=require('./lib/kr-osm-order');
const {load,validate,assemble,compile}=require('./lib/kr-network');
function fixture(){
 const relation={id:'route',members:[{type:'n',ref:'1',role:'stop'},{type:'n',ref:'5',role:'stop'},{type:'w',ref:'a',role:'forward'},{type:'w',ref:'b',role:'forward'}]};
 const ways=new Map([['a',{version:1,nodeIds:['1','2','3'],tags:{oneway:'yes'}}],['b',{version:2,nodeIds:['5','4','3'],tags:{}}]]);
 const correction={relationId:'route',relationSha256:relationHash(relation),reason:'CONFLICTING_MEMBER_ROLES',roles:[{memberIndex:1,wayId:'b',sourceVersion:2,sourceRole:'forward',role:'backward'}]};
 return {relation,ways,correction};
}
test('role correction retains source member and stop order without mutating source',()=>{
 const {relation,ways,correction}=fixture(),before=JSON.stringify(relation);
 const result=applyTopologyCorrection(relation,ways,correction);
 assert.equal(result.evidence.operationalDirectionVerified,false);
 assert.equal(JSON.stringify(relation),before);
 assert.deepEqual(orientOrderedWays(result.members,ways,['1','5']).nodeIds,['1','2','3','4','5']);
});
test('stale source relation or way cannot silently reuse a correction',()=>{
 for(const mutate of [f=>f.relation.members.reverse(),f=>f.ways.get('b').version++,f=>f.correction.roles[0].sourceRole='backward',f=>f.correction.roles[0].memberIndex=20]){
  const f=fixture();mutate(f);assert.throws(()=>applyTopologyCorrection(f.relation,f.ways,f.correction));
 }
});
test('correction cannot bridge gaps, ignore a stop or run against one-way track',()=>{
 for(const mutate of [f=>f.ways.get('b').nodeIds=['5','4','9'],f=>{f.relation.members[1].ref='absent';f.correction.relationSha256=relationHash(f.relation)},f=>f.ways.get('b').tags.oneway='yes']){
  const f=fixture();mutate(f);assert.throws(()=>applyTopologyCorrection(f.relation,f.ways,f.correction));
 }
});
test('all reviewed national corrections preserve exact source geometry and remain blocked for release',()=>{
 const base=path.resolve(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8'));
 const relations=new Map(read('source/osm-relations').map(r=>[r.id,r])),ways=new Map(read('source/osm-ways').map(w=>[w.id,w]));
 const data=load(base),{maps,errors}=validate(data,{base});assert.deepEqual(errors,[]);
 const compiled=compile(data,{base}),corrections=read('topology-corrections');assert(corrections.length>0);
 for(const c of corrections){
  const r=relations.get(c.relationId),result=applyTopologyCorrection(r,ways,c),service=maps.services.get('kr-osm-service-'+r.id);
  const stops=r.members.filter(m=>m.type==='n'&&/^stop(?:_|$)/.test(m.role)).map(m=>m.ref);
  const oriented=orientOrderedWays(result.members,ways,stops),journey=assemble(service,maps);
  assert.equal(oriented.status,'UNIQUE_SOURCE_ORDER');assert.equal(journey.stations.length,stops.length);
  assert.deepEqual(service.paths,oriented.parts.map(p=>({geometryId:'kr-geometry-'+p.wayId,reverse:p.reverse})));
  assert.deepEqual(service.stops.map(s=>maps.stops.get(s.stopId).osmNodeId),stops);
  assert(compiled.blocked.find(s=>s.serviceId===service.id).reasons.includes('OFFICIAL_TIMETABLE_REQUIRED'));
  for(const [i,p] of service.paths.entries()){
   const source=ways.get(oriented.parts[i].wayId),geometry=maps.geometry.get(p.geometryId);
   assert.deepEqual(geometry.nodeIds,source.nodeIds);assert.deepEqual(geometry.coordinates,source.coordinates);
  }
 }
});
