#!/usr/bin/env node
// Validate famous train brand cards, documented stops, both directions and no straight-line fallbacks.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ids=['23006','32001','32002','22001','22002','22007','25001'];
const routes=ids.map(id=>JSON.parse(read('data/generated/routes/line-'+id+'.json')).route);
const context={console:{warn(){}}};context.globalThis=context;vm.createContext(context);
vm.runInContext(read('js/famous-limited-express.js').replace(/\bexport\s+/g,''),context,{filename:'js/famous-limited-express.js'});
vm.runInContext(read('js/route-integrity.js').replace(/\bexport\s+/g,''),context,{filename:'js/route-integrity.js'});
const branded=context.buildFamousLimitedExpressRoutes(routes);
assert.equal(context.famousLimitedExpressBrandIds().length,5,'The canonical list must include all five express brands');
for(const id of context.famousLimitedExpressBrandIds())assert(branded.some(route=>route.id===id),'Every expected express brand must be generated: '+id);
assert.equal(branded.length,5,'Expected 5 separately playable famous train brands');
const names=new Set(branded.map(x=>x.id));
for(const id of ['skyliner','rapit','laview','romancecar','redarrow'])assert(names.has('famous-express-'+id),id+' not in brand cards');
const choices=branded.flatMap(route=>context.famousLimitedExpressChoices(route).map(choice=>({route,choice})));
const app=read('js/app.js');
assert(app.includes('missingBefore=famousLimitedExpressBrandIds()'),'Partial load may not suppress retries');
assert(app.includes('ensureFamousExpressRoutes({retry:true})'),'Express recovery button must really retry');
assert.equal(choices.length,13,'2 Skyliner + 4 Rapi:t + 4 Laview + 1 Homeway + 2 Red Arrow');
const report=[];
for(const {route,choice} of choices){
 const result=context.resolveFamousLimitedExpressChoice(route,choice),r=result.route,service=result.service;
 assert.equal(result.direction,'forward','Do not reverse a built reversed route twice');
 assert.equal(r.dataKind,'trainService');
 assert(r.geometry.length>40);
 assert(r.stations.length>=service.stops.length);
 assert(r.stations.every((st,i)=>i===0||st.geometryIndex>r.stations[i-1].geometryIndex));
 assert.equal(r.stations[0].geometryIndex,0);
 assert.equal(r.stations.at(-1).geometryIndex,r.geometry.length-1);
 assert.equal(JSON.stringify(r.stations.filter(st=>service.stops.includes(st.id)).map(st=>st.id)),JSON.stringify(service.stops),'Stop sequence mismatches real train');
 const played=context.resolvePlayableRoute(r,{direction:result.direction,service});
 assert.notEqual(played.fallbackGeometry,true,'Never allow straight line geometry fallback');
 assert.notEqual(played.sequenceOnly,true,'Actual track required for train playback');
 for(const segment of played.segments||[]){
   assert(segment.geometry.length>1,'No point geometry');
   assert.notEqual(segment.fallbackGeometry,true,'No geometry fallback segment');
 }
 assert(!String(played.renderKey||'').includes('fallback'),'Unexpected fallback');
 report.push({brand:route.id,choice:choice.id,stops:service.stops.length,trackPoints:r.geometry.length});
}
assert(!choices.some(x=>x.choice.id==='romancecar-homeway-1:reverse'),'Homeway 1 does not run in reverse as the same named train');
console.log(JSON.stringify({status:'PASS',brands:branded.length,choices:choices.length,report},null,2));
