#!/usr/bin/env node
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {project,graphFromWays,graphRoute,rebuild,classify}=require('./repair-kr-ktx-all-alignments.cjs');
test('projection uses the actual existing source edge',()=>{
 const a=[36,127],b=[36,127.1],m=project([36,127.05],a,b);
 assert(m.offset<.00001);
 assert(Math.abs(m.t-.5)<.00001);
});
test('graph route preserves high-speed OSM vertices and both exact endpoints',()=>{
 const a=[36,127],b=[36.02,127],c=[36.04,127],d=[36.06,127];
 const graph=graphFromWays([
  {id:10,tags:{railway:'rail',name:'경부고속선'},coordinates:[a,b,c,d]},
  {id:11,tags:{railway:'rail',name:'경부선'},coordinates:[a,[36.03,127.03],d]}
 ]);
 const result=graphRoute(graph,a,d,'경부고속선',30);
 assert(result.geometry);
 assert.deepEqual(result.geometry[0],a);
 assert.deepEqual(result.geometry.at(-1),d);
 assert(result.geometry.some(p=>p[0]===b[0]));
 assert(result.fastShare>.9);
 assert(result.wayIds.includes('10'));
});
test('disconnected high-speed track is not joined by a fabricated line',()=>{
 const graph=graphFromWays([
  {id:2,tags:{railway:'rail',name:'호남고속선'},coordinates:[[35,127],[35.02,127]]},
  {id:3,tags:{railway:'rail',name:'호남고속선'},coordinates:[[35.04,127],[35.06,127]]}
 ]);
 const result=graphRoute(graph,[35,127],[35.06,127],'호남고속선',20);
 assert.equal(result.reason,'NO_CONNECTED_OSM_ROUTE');
});
test('rebuild preserves station identities and changes geometry indices only',()=>{
 const a=[36,127],b=[36.01,127],c=[36.02,127],d=[36.03,127];
 const stations=[a,b,d].map((p,i)=>({id:'s'+i,ko:['가','나','다'][i],latitude:p[0],longitude:p[1],geometryIndex:[0,1,2][i]}));
 const j={stations,directedSegments:[{fromStationId:'s0',toStationId:'s1',geometry:[a,b]},
  {fromStationId:'s1',toStationId:'s2',geometry:[b,d]}]};
 const got=rebuild(j,[[a,b],[b,c,d]]);
 assert.deepEqual(got.stations.map(s=>s.id),['s0','s1','s2']);
 assert.deepEqual(got.stations.map(s=>s.geometryIndex),[0,1,3]);
 assert.deepEqual(got.geometry,[a,b,c,d]);
});
test('conventional rail is not mistaken for a named high-speed line',()=>{
 assert.equal(classify({name:'경부선',railway:'rail'}).fast,false);
 assert.equal(classify({name:'경부고속선',railway:'rail'}).fast,true);
});
