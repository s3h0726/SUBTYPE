'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {makeGraph,sourceRoute,proveCandidate,rebuild}=require('./repair-kr-ktx-proven-graph.cjs');
const a=[36,127],b=[36.007,127.004],c=[36.014,127.006],d=[36.021,127.011];
const src=[
 {id:101,nodeIds:['1','2','3','4'],tags:{railway:'rail',name:'경부고속선',oneway:'yes'},coordinates:[a,b,c,d]}
];
const ref=(from,to)=>({wayId:'101',fromNodeId:String(from),toNodeId:String(to)});
test('only connected original OSM node ids can form a KTX track path',()=>{
 const g=makeGraph(src);
 const path=sourceRoute(g,{p:a,ref:ref(1,2)},{p:d,ref:ref(3,4)},'경부고속선',20);
 assert.ok(path.geometry);
 assert.deepEqual(path.geometry[0],a);
 assert.deepEqual(path.geometry.at(-1),d);
 assert.ok(proveCandidate(path,g));
 assert.ok(path.fastFraction>.99);
 assert.ok(path.namedFraction>.99);
 assert.ok(path.proofs.every(x=>x.wayId==='101'));
});
test('one-way OSM source track cannot be traversed in reverse',()=>{
 const g=makeGraph(src);
 const reverse=sourceRoute(g,{p:d,ref:ref(3,4)},{p:a,ref:ref(1,2)},'경부고속선',20);
 assert.equal(reverse.geometry,undefined);
});
test('coincident but distinct OSM node IDs cannot create a fake junction',()=>{
 const g=makeGraph([
  {id:201,nodeIds:['11','12'],tags:{railway:'rail',name:'경부고속선'},coordinates:[a,b]},
  {id:202,nodeIds:['13','14'],tags:{railway:'rail',name:'경부고속선'},coordinates:[b,c]}
 ]);
 const out=sourceRoute(g,{p:a,ref:{wayId:'201',fromNodeId:'11',toNodeId:'12'}},
  {p:c,ref:{wayId:'202',fromNodeId:'13',toNodeId:'14'}},'경부고속선',20);
 assert.equal(out.geometry,undefined);
});
test('source stop endpoint off its actual OSM way cannot be snapped',()=>{
 const g=makeGraph(src);
 const out=sourceRoute(g,{p:[a[0],a[1]+.001],ref:ref(1,2)},{p:d,ref:ref(3,4)},'경부고속선',20);
 assert.equal(out.reason,'ENDPOINT_SOURCE_NODE_MISSING');
});
test('rebuild preserves service stop identities and per-edge OSM proofs',()=>{
 const g=makeGraph(src);
 const out=sourceRoute(g,{p:a,ref:ref(1,2)},{p:d,ref:ref(3,4)},'경부고속선',20);
 const old={
  stations:[{id:'A',ko:'가',geometryIndex:0},{id:'B',ko:'나',geometryIndex:1}],
  directedSegments:[{fromStationId:'A',toStationId:'B',geometry:[a,d]}]
 };
 const fixed=rebuild(old,[out.geometry],[out.proofs]);
 assert.deepEqual(fixed.stations.map(x=>x.id),['A','B']);
 assert.equal(fixed.stations[1].geometryIndex,fixed.geometry.length-1);
 assert.equal(fixed.sourceEdgeRefs.length,fixed.geometry.length-1);
 assert.deepEqual(fixed.directedSegments[0].geometry,fixed.geometry);
});
