#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),json=p=>JSON.parse(read(p));
const C=json('data/tokyo-service-patterns.json'),T=json('data/through-services.json');
const ids=['line-11343','line-11320','line-11332','line-11301','line-11229'];
const R=new Map(ids.map(id=>[id,json('data/generated/routes/'+id+'.json').route]));
const ctx={console};ctx.globalThis=ctx;ctx.TRT_TOKYO_SERVICE_PATTERNS=C;ctx.TRT_RAIL_SYSTEM={throughServices:T.services};
vm.createContext(ctx);vm.runInContext(read('js/service-route-resolver.js').replace(/\bexport\s+/g,''),ctx);
const patterns=C.servicePatterns.filter(p=>p.baseRouteId==='line-11343'&&p.id.startsWith('jr-ueno-joban-'));
assert.equal(patterns.length,11,'Eleven official timetable directions');
for(const [pid,num,from,to] of [
['jr-ueno-joban-tsuchiura-local-forward',19,'土浦','品川'],
['jr-ueno-joban-tsuchiura-local-reverse',19,'品川','土浦'],
['jr-ueno-joban-toride-rapid-forward',13,'取手','品川'],
['jr-ueno-joban-toride-rapid-reverse',13,'品川','取手'],
['jr-ueno-joban-tsuchiura-special-rapid-reverse',15,'品川','土浦'],
['jr-ueno-joban-mito-local-forward',29,'水戸','品川'],
['jr-ueno-joban-mito-local-reverse',29,'品川','水戸'],
['jr-ueno-joban-katsuta-local-forward',30,'勝田','品川'],
['jr-ueno-joban-katsuta-local-reverse',30,'品川','勝田'],
['jr-ueno-joban-takahagi-local-forward',38,'高萩','品川'],
['jr-ueno-joban-takahagi-local-reverse',38,'品川','高萩']
]){
 const p=patterns.find(p=>p.id===pid);assert(p,'Missing '+pid);
 assert.equal(p.stopStationIds.length,num);
 assert(p.sources[0].url.startsWith('https://timetables.jreast.co.jp/2611/train/'));
 const out=ctx.resolveServiceJourney({baseRoute:R.get('line-11343'),journeyId:'journey-'+pid,getRoute:id=>R.get(id)});
 assert.equal(out.route.stations[0].ja,from);assert.equal(out.route.stations.at(-1).ja,to);
 assert(out.route.geometry.length>350,'Missing real curved source geometry');
 const sid=s=>String(s.stationMasterId||s.sourceStationId||s.internalId||s.id);
 const map=new Map(out.route.stations.map((s,i)=>[sid(s),i]));
 const positions=out.service.stops.map(key=>map.get(key));
 assert(positions.every((p,i)=>Number.isInteger(p)&&(i===0||p>positions[i-1])),'Bad stop order: '+pid);
 const names=positions.map(i=>out.route.stations[i].ja);
 for(const skipped of ['綾瀬','亀有','金町','北松戸','馬橋','新松戸','北小金','南柏','北柏','鶯谷'])assert(!names.includes(skipped),'Nonstop station: '+skipped);
 if(p.trainTypeId==='jr-ueno-joban-special-rapid')for(const skipped of ['三河島','南千住','我孫子','天王台'])assert(!names.includes(skipped));
 assert(out.route.stations.every((s,i)=>Number.isInteger(s.geometryIndex)&&s.geometryIndex>=0&&s.geometryIndex<out.route.geometry.length&&(i===0||s.geometryIndex>out.route.stations[i-1].geometryIndex)));
}
const km=(a,b)=>{const rad=Math.PI/180,lat=(b[0]-a[0])*rad,lon=(b[1]-a[1])*rad;return 2*6371*Math.asin(Math.sqrt(Math.sin(lat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(lon/2)**2))};
const coord=(id,ja)=>{const r=R.get(id),s=r.stations.find(s=>s.ja===ja);return r.geometry[s.geometryIndex]};
assert(km(coord('line-11332','上野'),coord('line-11343','上野'))<1e-5);
assert(km(coord('line-11332','日暮里'),coord('line-11320','日暮里'))<1e-5);
assert(km(coord('line-11320','取手'),coord('line-11229','取手'))<1e-5);
const specs=T.services.filter(s=>s.id.startsWith('jr-ueno-joban-'));
assert.equal(specs.length,6);
assert(specs.every(s=>s.geometryProvenance.status==='parallel-jr-track-proxy'&&s.geometryProvenance.exactJobanAlignmentVerified===false));
assert(specs.every(s=>s.segmentIdentityOverrides?.['line-11332']?.line?.ko.includes('조반선')));
assert(read('js/app.js').includes("'jr-ueno-joban-toride-rapid':'조반선"));
assert(read('js/app.js').includes("'jr-ueno-joban-takahagi-local':'조반선"));
assert(read('js/app.js').includes("const trackNote=choice.patternId?.startsWith('jr-ueno-joban-')"));
assert(read('js/app.bundle.js').includes('const segmentIdentity=spec.segmentIdentityOverrides?.[part.id]'));
console.log('PASS: 11 November 2026 JR Joban journeys, accurate stop order, no 0m gaps; approach track provisional');
