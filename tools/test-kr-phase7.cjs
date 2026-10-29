'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'../data/kr/v2'),root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const {load,validate,assemble}=require('./lib/kr-network'),d=load(base),m=validate(d).maps,{shinbundangEndpoints}=require('./lib/kr-shinbundang-endpoints');
test('all 127 Phase 6 research payloads remain identical; exactly one source-backed endpoint repair is added',()=>{
 const b=read('reports/korea/phase7/BASELINE.json'),index=read('data/kr/preview/index.json');assert.equal(b.previewPayloads.length,127);
 for(const p of b.previewPayloads)assert.equal(hash(fs.readFileSync(path.join(root,p.path))),p.sha256,p.path);
 const added=index.routes.filter(r=>r.sourceRelationId==='6060963');assert.deepEqual(added.map(r=>r.sourceRelationId),['6060963']);
 const s=m.services.get('kr-osm-service-6060963'),j=assemble(s,m),r=read(added[0].lazySource.split('?')[0]).route;assert.deepEqual(r.geometry,j.geometry);assert.deepEqual(r.stations,j.stations);assert.equal(r.playStatus,'RESEARCH_PLAYABLE');assert.equal(r.researchEvidence.officialEndpoints.officialReleaseApproved,false);assert.equal(r.stations.length,16);
});
test('Shinbundang full official order does not accept missing stops, alternate platforms, reversed or stale geometry',()=>{
 const s=m.services.get('kr-osm-service-6060963'),j=assemble(s,m);assert(shinbundangEndpoints(s,j,{base}));
 for(const mutate of [j=>j.stations.pop(),j=>j.stations.reverse(),j=>j.stations[0].platformId='other-platform',j=>j.stations[15].id='same-name-other-station',j=>j.stations[1].ko='다른역']){const copy=structuredClone(j);mutate(copy);assert.throws(()=>shinbundangEndpoints(s,copy,{base}));}
 const other=structuredClone(s);other.paths[0].reverse=!other.paths[0].reverse;assert.throws(()=>shinbundangEndpoints(other,j,{base}),/STALE/);
});
test('new official platform references retain published directions and terminal ambiguity without assigning OSM tracks',()=>{
 const rows=read('data/kr/v2/official-platform-reference.json');assert.equal(rows.length,231);assert.equal(rows.filter(r=>r.sourceId==='kr-line4-platforms-20260630').length,96);assert.equal(rows.filter(r=>r.sourceId==='kr-line2-platforms-20260630').length,101);assert.equal(rows.filter(r=>r.sourceId==='kr-busan3-platforms-20260630').length,34);
 for(const row of rows){assert.equal(row.status,'reference');assert(!row.osmNodeId);assert(!row.releaseApproved);assert(['UP','DOWN','IN','OUT'].includes(row.directionId));}
 const k=rows.filter(r=>r.sourceId==='kr-line2-platforms-20260630'&&r.stationName==='까치산');assert.equal(k.length,1);assert.equal(k[0].directionId,'UP');assert.equal(k[0].platformCode,'1');
});

test('Busan 1 Hadan uses its own directional source stop; five other missing positions remain blocked',()=>{
 const configs=read('data/kr/v2/stop-position-bindings.json'),c=configs.find(c=>c.relationId==='2201600'),relation=read('data/kr/v2/source/osm-relations.json').find(r=>r.id==='2201600'),nodes=new Map(read('data/kr/v2/source/osm-nodes.json').map(n=>[n.id,n])),bytes=fs.readFileSync(path.join(base,c.officialFile)),{bindSourceStops}=require('./lib/kr-stop-bindings');
 const calls=bindSourceStops(relation,nodes,c,bytes);assert.equal(calls.length,40);assert(calls.some(m=>m.ref==='14081390782'));assert(!calls.some(m=>m.ref==='12258680144'));
 const s=m.services.get('kr-osm-service-2201600');assert(s.stops.some(c=>c.stopId==='kr-osm-stop-14081390782'));assert.equal(s.issues.filter(i=>i.code==='STOP_NOT_ON_ORDERED_TRACK').length,5);assert.throws(()=>assemble(s,m),/UNRESOLVED/);
 assert.throws(()=>bindSourceStops(relation,nodes,{...c,reverseOfficialOrder:false},bytes),/IDENTITY/);
 const wrong=structuredClone(c);wrong.bindings[0].boundNodeId='12258680144';assert.throws(()=>bindSourceStops(relation,nodes,wrong,bytes),/EVIDENCE/);
});

test('KTX source-stop bindings retain real trains and block restricted tracks and unverified currentness',()=>{
 const doc=read('data/kr/v2/korail-highspeed-route-bindings.json'),source=read('data/kr/v2/korail-highspeed-pattern-research.json');assert.equal(doc.patterns.length,551);assert.equal(doc.counts.trains,621);assert.equal(doc.counts.patternsWithSourceStopSubsequence,2);assert.equal(doc.counts.playable,0);
 for(const p of doc.patterns){const original=source.patterns.find(s=>s.id===p.patternId);assert(original);assert.deepEqual(p.stationNames,original.stationNames);assert.deepEqual(p.trainIds,original.trainIds);assert.equal(p.playable,false);assert.equal(p.releaseApproved,false);assert(p.blockers.includes('OFFICIAL_CURRENTNESS_NOT_VERIFIED'));}
 for(const p of doc.patterns.filter(p=>p.bindingCandidates.length)){assert.deepEqual(p.stationNames,['용산','익산','광주송정']);assert(p.blockers.includes('RESTRICTED_OR_NON_PUBLIC_TRACK'));for(const b of p.bindingCandidates){assert.equal(b.stopIds.length,3);assert(b.restrictedWays.length>0);assert(b.restrictedWays.every(w=>/^[0-9]+$/.test(String(w.wayId))));}}
});
