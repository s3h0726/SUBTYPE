#!/usr/bin/env node
// Prove that one public Marunouchi card retains real Honancho branch journeys.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const main=json('data/generated/routes/line-28002.json').route;
const branch=json('data/generated/routes/line-28002-honancho-branch.json').route;
const patterns=json('data/tokyo-service-patterns.json');
const mainId='line-28002',branchId='line-28002-honancho-branch';
assert.equal(main.stations.length,25);
assert.equal(branch.stations.length,4);
assert.equal(branch.parentLineId,mainId);
assert.equal(branch.visibility,'internal');
assert.equal(branch.playable,false);
assert.equal(main.geometryReady,true);
assert.equal(branch.geometryReady,true);
assert.equal(branch.directedSegments.length,3);
assert.equal(main.stations[19].id,branch.stations[0].id);
const liteContext={window:{}};
vm.runInNewContext(read('js/japan-lite-index.js'),liteContext);
const lite=liteContext.window.TRT_JAPAN_LITE_INDEX;
const parents=lite.routes.filter(r=>r.id===mainId),children=lite.routes.filter(r=>r.id===branchId);
assert.equal(parents.length,1,'one Marunouchi card');
assert.equal(children.length,1,'the branch geometry must remain lazy-loadable');
assert.equal(children[0].visibility,'internal','branch card must never be public');
assert.equal(children[0].playable,false);
assert.equal(children[0].parentLineId,mainId);
assert.equal(parents[0].stationCount,25);
assert.equal(children[0].stationCount,4);
assert.ok(children[0].lazySource?.includes('/chunk-'),'physical branch still referenced by deployed geometry chunks');
const visibilitySource=read('js/feature-flags.js')
  .replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+/g,'');
const visibilityVM={koreanRouteBlockReason:()=>'',TRT_TOKYO_AREA:null};
vm.runInNewContext(visibilitySource+';globalThis.visibleTest=isRouteVisible',visibilityVM);
assert.equal(visibilityVM.visibleTest({...parents[0],countryId:'jp'}),true);
assert.equal(visibilityVM.visibleTest({...children[0],countryId:'jp'}),false);
const resolverSource=read('js/service-route-resolver.js').replace(/\bexport\s+/g,'');
const env={TRT_TOKYO_SERVICE_PATTERNS:patterns};
vm.runInNewContext(resolverSource+';globalThis.resolveTest=resolveServiceSelection',env);
const cases=[
  ['base-journey-marunouchi-full-forward','池袋','荻窪',25],
  ['base-journey-marunouchi-full-reverse','荻窪','池袋',25],
  ['base-journey-marunouchi-ikebukuro-honancho','池袋','方南町',23],
  ['base-journey-marunouchi-honancho-ikebukuro','方南町','池袋',23],
  ['base-journey-marunouchi-nakanosakaue-honancho','中野坂上','方南町',4],
  ['base-journey-marunouchi-honancho-nakanosakaue','方南町','中野坂上',4]
];
for(const [id,start,end,count] of cases){
 const result=env.resolveTest({baseRoute:main,servicePatternId:id,getRoute:lineId=>lineId===mainId?main:lineId===branchId?branch:null});
 const route=result.route;
 assert.equal(route.stations.length,count,id+' station count');
 assert.equal(route.stations[0].ja,start,id+' origin');
 assert.equal(route.stations.at(-1).ja,end,id+' destination');
 assert.ok(route.geometry.length>=route.stations.length,id+' must follow real rail geometry');
 assert.equal(route.geometryReady,true,id+' geometry readiness');
 assert.equal(result.service.stops.length,count,id+' train stops');
 assert.equal(new Set(route.stations.map(s=>s.id)).size,count,id+' repeated interchange');
}
const app=read('js/app.js'),bundle=read('js/app.bundle.js');
for(const [label,source] of [['app',app],['published bundle',bundle]]){
 assert.ok(source.includes('if(branch.parentLineId!==route.id)continue;'),label+' must load child geometry when selecting parent');
 assert.ok(source.includes('const physicalReady=source.geometryReady===true'),label+' must resolve physical branch curves');
}
const guard=read('js/japan-route-identity-patch.js');
const cached=JSON.parse(JSON.stringify(lite));
const staleBranch=cached.routes.find(r=>r.id===branchId);
delete staleBranch.visibility;staleBranch.playable=true;
const sandbox={TRT_JAPAN_LITE_INDEX:cached,console};
vm.runInNewContext(guard,sandbox);
assert.equal(staleBranch.visibility,'internal','stale browser catalog must hide the child');
assert.equal(staleBranch.playable,false);
const html=read('index.html');
for(const name of ['japan-lite-index','japan-route-identity-patch','app.bundle'])
 assert.ok(new RegExp('js/'+name+'\\.js\\?v=20261027-marunouchi').test(html)
          ||(name==='app.bundle'&&html.includes('app.bundle.js?v=20261027-marunouchi')),
          'missing updated browser cache key for '+name);
console.log(JSON.stringify({status:'PASS',visibleCards:1,internalBranch:1,mainStations:25,branchStations:4,operatingJourneys:cases.length,geometry:'physical railway curves'}));
