#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const ids=['line-99601','line-99602','line-99603'];
const expected=[
 {names:['米原','フジテック前','鳥居本','彦根','ひこね芹川','彦根口','高宮','尼子','豊郷','愛知川','五箇荘','河辺の森','八日市','長谷野','大学前','京セラ前','桜川','朝日大塚','朝日野','日野','水口松尾','水口','水口石橋','水口城南','貴生川'],code:[1,2,3,4,5,6,7,10,11,12,13,14,15,26,27,28,29,30,31,32,33,34,35,36,37],name:'본선'},
 {names:['高宮','スクリーン','多賀大社前'],code:[7,8,9],name:'타가선'},
 {names:['八日市','新八日市','太郎坊宮前','市辺','平田','武佐','近江八幡'],code:[15,16,17,18,19,20,21],name:'요카이치선'}
];
const lines=['omitetsudohonsen','omitetsudotagasen','omitetsudoyokaichisen'];
const routes=new Map,masters=new Set;
for(let i=0;i<3;i++){
 const id=ids[i],spec=expected[i];
 const route=json('data/generated/routes/'+id+'.json').route;
 const line=json('data/lines/omitetsudo/'+lines[i]+'/line.json');
 const listed=json('data/lines/omitetsudo/'+lines[i]+'/stations.json');
 const nationwide=json('data/nationwide/routes/'+id+'.json').route;
 assert.deepEqual(route.stations.map(s=>s.ja),spec.names);
 assert.deepEqual(nationwide.stations.map(s=>s.ja),spec.names);
 assert.equal(route.line.ko,spec.name);
 assert.equal(line.names.ko,spec.name);
 assert.equal(route.operator.ko,'오미 철도');
 assert.equal(route.geometryReady,true);
 assert.equal(route.directedSegments.length,route.stations.length-1);
 assert.equal(route.missingSegments.length,0);
 assert.equal(line.services.length,1);
 assert.deepEqual(line.services[0].stopPattern,route.stations.map(s=>s.id));
 assert.deepEqual(route.services[0].stops,route.stations.map(s=>s.id));
 assert.deepEqual(route.stations.map(s=>s.stationCode),spec.code.map(n=>'OR'+String(n).padStart(2,'0')));
 assert.deepEqual(listed.map(s=>s.stationCode),route.stations.map(s=>s.stationCode));
 assert(route.stations.every(s=>s.hasOfficialStationCode));
 for(const s of route.stations)masters.add(s.stationMasterId);
 routes.set(id,route);
}
assert.equal(masters.size,33,'All 33 physical station IDs must be unique across three routes');
const y=routes.get('line-99603').stations;
assert.equal(y.find(s=>s.ja==='武佐').ko,'무사');
assert.equal(y.find(s=>s.ja==='太郎坊宮前').ko,'타로보구마에');
assert.equal(routes.get('line-99602').stations[1].ko,'스크린');
const a=routes.get('line-99601').stations;
for(const [ja,ko] of Object.entries({'フジテック前':'후지테크마에','尼子':'아마고','愛知川':'에치가와','五箇荘':'고카쇼','長谷野':'나가타니노','水口':'미나쿠치'})){
 assert.equal(a.find(s=>s.ja===ja).ko,ko);
}
const thru=json('data/through-services.json').services.filter(s=>s.id.startsWith('ohmi-'));
assert.equal(thru.length,3,'Three timetable-confirmed through operations');
const embedded=JSON.parse(read('js/rail-system-data.js').split('window.TRT_RAIL_SYSTEM=')[1].trim().replace(/;\s*$/,''));
for(const spec of thru){
 assert.deepEqual(embedded.throughServices.find(x=>x.id===spec.id),spec,'Browser service catalog out of sync');
 for(const id of spec.participatingLineIds)assert(routes.get(id).throughServiceIds.includes(spec.id));
}
const code=read('js/service-route-resolver.js').replace(/\bexport\s+/g,'');
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx);
const required={
 'ohmi-maibara-omihachiman-local':[['米原','近江八幡'],['近江八幡','米原']],
 'ohmi-kibukawa-omihachiman-local':[['貴生川','近江八幡'],['近江八幡','貴生川']],
 'ohmi-hikone-taga-local':[['彦根','多賀大社前'],['多賀大社前','彦根']]
};
for(const spec of thru)for(const [i,direction] of ['forward','reverse'].entries()){
 const route=ctx.buildThroughServiceRoute(spec,id=>routes.get(id),direction);
 assert.deepEqual([route.stations[0].ja,route.stations.at(-1).ja],required[spec.id][i]);
 assert.equal(new Set(route.stations.map(s=>s.stationMasterId)).size,route.stations.length);
 assert(route.stations.every((s,j)=>Number.isInteger(s.geometryIndex)&&s.geometryIndex<route.geometry.length&&(j===0||s.geometryIndex>route.stations[j-1].geometryIndex)));
}
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
assert.equal(lite.routes.filter(x=>ids.includes(x.id)).length,3,'Do not create duplicate line cards');
for(const id of ids){const card=lite.routes.find(x=>x.id===id);assert(card.lazySource.includes('data/generated/routes/'+id+'.json?v=20261112-ohmi-rebuild'));}
const html=read('index.html');
assert(html.includes('japan-lite-index.js?v=20261112-ohmi-namuwiki'));
assert(html.includes('rail-system-data.js?v=20261112-ohmi-through-v1'));
console.log('PASS: Ohmi 3 lines, 33 stations, official OR codes, all-stops and 6 through directions');
