const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Japanese Shonan–Shinjuku runtime supports 7 service patterns in both directions',()=>{
 execFileSync(process.execPath,['tools/build-shonan-shinjuku-services.cjs','--check'],{cwd:root});
 const context={console};context.globalThis=context;vm.createContext(context);
 vm.runInContext(read('js/shonan-shinjuku-service-data.js'),context);
 const source=read('js/app.js'),start=source.indexOf('function shonanShinjukuChoices('),end=source.indexOf('function resolveOperatingChoice(',start);
 assert(start>=0&&end>start,'Shonan service resolver present');
 vm.runInContext(source.slice(start,end)+';globalThis.shonanChoices=shonanShinjukuChoices;globalThis.shonanResolve=resolveShonanShinjukuChoice;',context);
 const integrity=read('js/route-integrity.js').replace(/\bexport\s+/g,'');
 vm.runInContext(integrity+';globalThis.checkRoute=resolvePlayableRoute;',context);
 const base={...JSON.parse(read('data/generated/routes/line-11333.json')).route,countryId:'jp'};
 assert.equal(base.stations.length,16,'The original Omiya–Ofuna physical section remains intact');
 const data=context.TRT_SHONAN_SHINJUKU_SERVICES,choices=context.shonanChoices(base);
 assert.equal(data.patterns.length,7);assert.equal(choices.length,14);
 const uniq=new Set;for(const choice of choices){
  assert(!uniq.has(choice.id),'duplicate choice');uniq.add(choice.id);
  const built=context.shonanResolve(choice,base),route=built.route;
  assert.equal(route.directedSegments.length,route.stations.length-1);
  assert(route.geometry.length>route.stations.length);
  assert.equal(route.stations[0].id,built.service.stops[0]);
  assert.equal(route.stations.at(-1).id,built.service.stops.at(-1));
  const playable=context.checkRoute(route,{direction:built.direction,service:built.service});
  assert.equal(playable.fallbackGeometry,undefined,'No invented straight-line fallback');
  assert.equal(playable.segments.length,playable.stations.length-1);
  assert.equal(playable.stations[0].id,choice.originId);
  assert.equal(playable.stations.at(-1).id,choice.destinationId);
  assert(!playable.segments.some(s=>s.endpointMismatch),'No endpoint gaps');
 }
});
test('Distinct rapid and special-rapid stop patterns reflect service families',()=>{
 const context={};context.globalThis=context;vm.createContext(context);vm.runInContext(read('js/shonan-shinjuku-service-data.js'),context);
 const data=context.TRT_SHONAN_SHINJUKU_SERVICES;
 function stopNames(id){const p=data.patterns.find(x=>x.id===id);return p.stopStationIds.map(sid=>data.corridors[p.corridor].stations.find(s=>s.id===sid)?.ja)}
 const yokosuka=stopNames('utsunomiya-zushi-rapid'),tokaido=stopNames('takasaki-odawara-rapid'),special=stopNames('takasaki-odawara-special-rapid');
 for(const name of ['西大井','新川崎','保土ケ谷','東戸塚']){assert(yokosuka.includes(name));assert(!tokaido.includes(name));assert(!special.includes(name))}
 assert(tokaido.includes('恵比寿'));assert(!special.includes('恵比寿'));
 for(const name of ['国府津','平塚','藤沢','大船'])assert(special.includes(name));
 for(const name of ['辻堂','大磯','二宮','鴨宮'])assert(!special.includes(name));
});
