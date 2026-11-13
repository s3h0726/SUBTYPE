'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {assembleTrack,assembleCalls}=require('./lib/uk-osm.cjs'),{assembleReviewedGraph}=require('./lib/uk-reviewed-graph.cjs');
const node=(id,lat,name)=>({type:'node',id,lat,lon:0,tags:{name,railway:'stop',public_transport:'stop_position'}});
const elements=[node(1,51,'Alpha'),node(2,51.01,'Beta'),node(3,51.02,'Gamma'),{type:'way',id:10,nodes:[1,2,3],tags:{railway:'rail',oneway:'yes'}}];
const relation={id:20,members:[{type:'way',ref:10,role:''}]};
test('explicit passenger calls may omit an intermediate physical station',()=>{const a=assembleCalls(relation,elements,['Alpha','Gamma']);assert.deepEqual(a.refs,[1,2,3]);assert.deepEqual(a.stops.map(s=>s.tags.name),['Alpha','Gamma']);assert.deepEqual(a.aligned,[0,2])});
test('an absent or incorrectly ordered requested call is never discarded',()=>{assert.throws(()=>assembleCalls(relation,elements,['Gamma','Alpha']),/not-on-ordered-track/);assert.throws(()=>assembleCalls(relation,elements,['Alpha','Missing','Gamma']),/Missing/)});
test('active passenger review rejects a disconnected or disused siding',()=>{
 const disused=elements.map(element=>element.type==='way'?{...element,tags:{railway:'disused','disused:railway':'rail'}}:element);
 assert.throws(()=>assembleTrack(relation,disused,{activeRailOnly:true}),/inactive-track-way:10/);
 assert.deepEqual(assembleTrack(relation,elements,{activeRailOnly:true}).refs,[1,2,3]);
});
test('reviewed graph respects a one-way railway and cannot create the return direction',()=>{assert.deepEqual(assembleReviewedGraph([relation],elements,['Alpha','Gamma']).refs,[1,2,3]);assert.throws(()=>assembleReviewedGraph([relation],elements,['Gamma','Alpha']),/no-connected/)});
test('nearby physical tracks without a source node junction remain disconnected',()=>{const es=elements.concat(node(4,51.02001,'Delta'),node(5,51.03,'Epsilon'),{type:'way',id:11,nodes:[4,5],tags:{railway:'rail'}});assert.throws(()=>assembleReviewedGraph([{id:21,members:[...relation.members,{type:'way',ref:11,role:''}]}],es,['Alpha','Epsilon']),/no-connected/)});
