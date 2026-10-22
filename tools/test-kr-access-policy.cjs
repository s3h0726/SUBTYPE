const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {railwayWayRejection,applyAccessPolicy}=require('./lib/kr-access-policy');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),policy=JSON.parse(read('data/kr/v2/relation-access-policy.json'));
function context(){const c={normalize:v=>String(v),$:()=>null};vm.createContext(c);require('./lib/test-kr-access-context.cjs')(c);return c}
test('road, rail-road ambiguity, construction, platform and station buildings cannot qualify as operating track',()=>{
 for(const tags of [{highway:'secondary'},{highway:'track',railway:'rail'},{railway:'construction'},{railway:'platform'},{building:'train_station'}])assert(railwayWayRejection(tags));
 for(const railway of ['rail','subway','light_rail','tram','monorail'])assert.equal(railwayWayRejection({railway}),null);
});
test('all twelve restricted relations are blocked through direct and saved CUSTOM identities',()=>{
 const c=context();vm.runInContext(read('js/feature-flags.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),c);
 for(const r of policy.relations.filter(r=>!r.passengerCandidate)){
  const id='kr-osm-service-'+r.osmRelationId;
  for(const route of [{id,countryId:'kr'},{id:'custom',segments:[{lineId:id}]},{id:'custom',directedSegments:[{source:{routeId:id}}]},{id:'custom',sourceRefs:[{kind:'relation',id:r.osmRelationId}]}]){assert(c.koreanRouteBlockReason(route));assert.equal(c.isRouteVisible(route),false)}
 }
 assert.equal(c.koreanRouteBlockReason({id:'jp',sourceRefs:[{kind:'way',id:'3399104'}]}),null);
 const cycle={id:'safe'};cycle.source=cycle;assert.equal(c.koreanRouteBlockReason(cycle),null);
});
test('existing thirteen public Korean routes remain visible and source policy never approves candidates',()=>{
 const c=context();vm.runInContext(read('js/feature-flags.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,''),c);
 const index=JSON.parse(read('data/kr/generated/index.json'));assert.equal(index.routes.length,13);for(const r of index.routes)assert.equal(c.isRouteVisible(r),true,r.id);
 const services=JSON.parse(read('data/kr/v2/services.json'));applyAccessPolicy(services,policy);assert.equal(services.filter(s=>s.access?.passengerCandidate===false).length,12);assert.equal(services.find(s=>s.id==='kr-osm-service-20500839').access.passengerCandidate,false);assert(services.every(s=>s.status!=='verified'));
});
test('free-drive and CUSTOM graph exclude restricted source routes',()=>{
 const c=context();for(const name of ['free-drive','route-editor'])vm.runInContext(read('js/'+name+'.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+`;globalThis.${name==='free-drive'?'FreeDriveTest=FreeDrive':'RouteEditorTest=RouteEditor'};`,c);
 const blocked={id:'kr-osm-service-8032733',countryId:'kr',geometryReady:true,stations:[]};
 const f=Object.create(c.FreeDriveTest.prototype);f.renderMap=()=>{};f.render=()=>{};f.emit=()=>{};f.setNetwork([blocked]);assert.equal(f.graph.size,0);
 const e=Object.create(c.RouteEditorTest.prototype);e.route={id:'untouched'};e.loadRoute({id:'custom',segments:[{lineId:blocked.id}]});assert.equal(e.route.id,'untouched');
 e.renderJourneyOptions=()=>{};const forward={id:'kr-direction-fixture',countryId:'kr',schemaVersion:2,stations:[{id:'a'},{id:'b'}]};e.setRailNetwork([forward]);assert.equal(e.stationGraph.get('a').edges.length,1);assert.equal(e.stationGraph.get('b').edges.length,0);
 e.setRailNetwork([{...forward,id:'jp-fixture',countryId:'jp'}]);assert.equal(e.stationGraph.get('b').edges.length,1);
});
test('Game start refuses both saved restricted IDs and restricted repository resolutions',async()=>{
 const c=context();Object.assign(c,await import(require('node:url').pathToFileURL(path.join(root,'js/korean-research-resolver.js'))));c.toast=()=>{};vm.runInContext(read('js/game.js').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+';globalThis.GameTest=Game',c);
 const g=Object.create(c.GameTest.prototype);g.stop=()=>{};let resolves=0;c.railDataRepository={resolveRoute(){resolves++;return{id:'kr-osm-service-20042681'}}};
 assert.equal(g.start('kr-osm-service-3399104'),false);assert.equal(resolves,0);assert.equal(g.start({id:'old-alias'}),false);assert.equal(resolves,1);
 assert.equal(g.startFreeDrive({route:{id:'kr-osm-service-17585166'},station:{id:'terminal'}}),false);
});
