const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {bindSourceStops,officialHumetroStations}=require('./lib/kr-stop-bindings'),{load,validate,assemble,compile}=require('./lib/kr-network');
const base=path.resolve(__dirname,'../data/kr/v2'),read=n=>JSON.parse(fs.readFileSync(path.join(base,n+'.json'),'utf8')),config=read('stop-position-bindings')[0],relation=read('source/osm-relations').find(r=>r.id===config.relationId),nodes=new Map(read('source/osm-nodes').map(n=>[n.id,n])),official=fs.readFileSync(path.join(base,config.officialFile));
test('Busan 1 source stop positions restore all forty official calls without changing track',()=>{
 const calls=bindSourceStops(relation,nodes,config,official);assert.equal(calls.length,40);assert.equal(calls.filter((c,i)=>c.ref!==relation.members.filter(m=>m.type==='n'&&/^stop/.test(m.role))[i].ref).length,6);
 const data=load(base),{maps}=validate(data,{base}),service=maps.services.get('kr-osm-service-'+config.relationId),journey=assemble(service,maps);assert.equal(journey.stations.length,40);
 const codes=service.stops.map(c=>String(Number(maps.stops.get(c.stopId).number)));assert.deepEqual(codes,officialHumetroStations(official.toString()).map(s=>s.code));
 assert.deepEqual(new Set(service.paths.map(p=>p.geometryId)),new Set(relation.members.filter(m=>m.type==='w'&&!/platform|stop/.test(m.role)).map(m=>'kr-geometry-'+m.ref)));
 assert.equal(compile(data).counts.releasedServices,0);assert(service.issues.some(i=>i.code==='NON_PUBLIC_TRACK_REVIEW'));assert(service.issues.some(i=>i.code==='OFFICIAL_TIMETABLE_REQUIRED'));
});
test('source drift, changed official order and mismatched station identity fail closed',()=>{
 assert.throws(()=>bindSourceStops({...relation,version:relation.version+1},nodes,config,official),/STALE/);
 assert.throws(()=>bindSourceStops(relation,nodes,config,Buffer.from('changed')),/STALE/);
 const bad=new Map(nodes),id=config.bindings[0].boundNodeId;bad.set(id,{...nodes.get(id),tags:{...nodes.get(id).tags,ref:'999'}});assert.throws(()=>bindSourceStops(relation,bad,config,official),/IDENTITY/);
});
