const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const script=fs.readFileSync(path.join(root,'js/japan-loop-closures-data.js'),'utf8');
const context={console};context.globalThis=context;vm.createContext(context);
vm.runInContext(script,context);
vm.runInContext(fs.readFileSync(path.join(root,'js/data-loader.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,'')+';globalThis.jpNormalize=normalizeLine;',context);
vm.runInContext(fs.readFileSync(path.join(root,'js/route-integrity.js'),'utf8').replace(/\bexport\s+/g,'')+';globalThis.jpResolve=resolvePlayableRoute;',context);
const specs=[
 {id:'line-11302',folder:'data/lines/jr-east/yamanote',first:'東京',last:'有楽町',stops:31,oneWay:false},
 {id:'line-toyama-city-3',folder:'data/lines/toyamachihotetsudo/toyama-city-route-3',first:'丸の内',last:'県庁前',stops:13,oneWay:true}
];
test('Japanese loop manifest is deterministic from canonical station and geometry source',()=>{
 execFileSync(process.execPath,['tools/build-japan-loop-closures.cjs','--check'],{cwd:root});
});
for(const spec of specs){
 test(spec.id+' closes at departure over sourced nonstraight railway geometry',()=>{
  const relations=read(spec.folder+'/stations.json'),pieces=read(spec.folder+'/geometry.json'),payload=read('data/generated/routes/'+spec.id+'.json'),route=payload.route;
  const key=relations.at(-2).stationId+'::'+relations[0].stationId,edge=pieces[key];
  assert.equal(relations[0].stationId,relations.at(-1).stationId);
  assert.equal(route.stations[0].ja,spec.first);assert.equal(route.stations.at(-2).ja,spec.last);
  assert.equal(route.stations.at(-1).ja,spec.first);assert.equal(route.stations.length,spec.stops);
  assert.equal(route.directedSegments.length,route.stations.length-1);
  assert(edge.verified&&edge.geometry.length>=3);
  assert.deepEqual(route.directedSegments.at(-1).geometry,edge.geometry);
  assert.deepEqual(route.geometry.at(-1),route.geometry[0]);
  const cached=structuredClone(route),closure=context.TRT_JAPAN_LOOP_CLOSURES.routes[spec.id];
  cached.stations.pop();cached.directedSegments.pop();cached.geometry.splice(-closure.geometry.length+1);
  const repaired=context.jpNormalize(cached);
  assert.equal(repaired.stations.length,spec.stops);
  assert.equal(repaired.stations[0].id,repaired.stations.at(-1).id);
  assert.equal(repaired.oneWay,spec.oneWay);
  const normalized=context.jpNormalize(route),resolved=context.jpResolve(normalized,{direction:'forward',service:normalized.services[0]});
  assert.equal(resolved.stations.length,spec.stops);
  assert.equal(resolved.segments.length,spec.stops-1);
  assert.equal(resolved.segments.at(-1).toStationId,normalized.stations[0].id);
  assert.deepEqual(resolved.geometry.at(-1),resolved.geometry[0]);
 });
}
test('circular closure is not invented on Tokyo Oedo line or Osaka loop',()=>{
 for(const id of ['line-99301','line-11623']){
  const r=read('data/generated/routes/'+id+'.json').route,normalized=context.jpNormalize(r);
  assert.equal(normalized.stations.length,r.stations.length);
  assert.notEqual(normalized.stations[0].id,normalized.stations.at(-1).id);
 }
});
