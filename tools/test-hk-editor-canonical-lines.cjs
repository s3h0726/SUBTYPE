'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'reports/korean-names/editor.html'),'utf8');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/hk/generated/index.json'),'utf8'));
const script=html.split('<script>')[1]?.split('</script>')[0];
assert(script,'Korean-name editor script not found');
new Function(script); // Syntax-check browser code.
const start=script.indexOf('function hongKongLineGroups(index){');
const end=script.indexOf('function stationName(s,field){');
assert(start>=0&&end>start,'Canonical line helpers missing');
const defs=script.slice(start,end);
const api=new Function('country','indexCache','routeSelection','file','index',defs+
 '\nreturn {groups:hongKongLineGroups,lines:routeRows,targets:hongKongStationTargets,doc:routeDoc};');
const groups=api('hk',{hk:index},{hk:'hk-island'},'services',index);
const uniqueIds=new Set(index.routes.map(r=>r.canonicalLineId||r.id));
const displayed=groups.lines(index);
assert.equal(displayed.length,uniqueIds.size);
assert.equal(new Set(displayed.map(r=>r[2])).size,displayed.length);
assert(displayed.length<index.routes.length,'No grouping applied');
assert.deepEqual(new Set(displayed.map(r=>r[2])),uniqueIds);
const services=index.routes.flatMap(route=>route.services||[]);
assert.equal(new Set(services.map(s=>s.id)).size,services.length);
for(const route of index.routes){
 const id=route.canonicalLineId||route.id;
 for(const stationId of route.stationSequence||[])
  assert(groups.targets(id,stationId).includes(route.id),route.id+' missing '+stationId);
}
(async()=>{
 const line='hk-tseung-kwan-o';
 const svc=api('hk',{hk:index},{hk:line},'services',index);
 const actual=await svc.doc(index);
 assert.equal(actual.id,line);
 assert.equal(actual.services.length,index.routes.filter(r=>r.canonicalLineId===line).reduce((n,r)=>n+(r.services||[]).length,0));
 const fixture={routes:[
  {id:'A',canonicalLineId:'C',operatorId:'OP',operator:{ko:'운영사'},line:{ko:'라인'},stations:[{id:'S1'},{id:'S2'}],services:[{id:'A'}],stationSequence:['S1','S2']},
  {id:'B',canonicalLineId:'C',operatorId:'OP',operator:{ko:'운영사'},line:{ko:'라인'},stations:[{id:'S2'},{id:'S3'}],services:[{id:'B'}],stationSequence:['S2','S3']}
 ]};
 const test=api('hk',{hk:fixture},{hk:'C'},'stations-by-line',fixture);
 const merged=await test.doc(fixture);
 assert.deepEqual(merged.stations.map(s=>s.id),['S1','S2','S3']);
 assert.equal(merged.services.length,2);
 assert.deepEqual(test.targets('C','S2'),['A','B']);
 assert.deepEqual(test.targets('C','S3'),['B']);
 console.log('PASS: '+index.routes.length+' Hong Kong entries → '+displayed.length+' canonical editor lines');
})().catch(error=>{console.error(error);process.exitCode=1;});
