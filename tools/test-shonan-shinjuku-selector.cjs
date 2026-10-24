#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const c=JSON.parse(read('data/tokyo-service-patterns.json')),src=read('js/app.js');
const start=src.indexOf('function actualOperatingChoices(route){'),end=src.indexOf('function operatingDirectionLabel(choice){',start);
const catStart=src.indexOf('function routeGroup(route){'),catEnd=src.indexOf('function routeTransportGroup(route){',catStart);
assert(start>=0&&end>start&&catStart>=0&&catEnd>catStart);
const context={console,countryId:'jp',selected:{id:'line-11333',countryId:'jp'},
  nexOperatingChoices:()=>[{id:'nex-original',kind:'nex'}],famousLimitedExpressChoices:()=>[],
  isKoreanResearch:()=>false,koreanResearchChoices:()=>[],koreanVerifiedChoices:()=>[],
  servicePatternsForRoute:id=>c.servicePatterns.filter(p=>p.baseRouteId===id),
  serviceJourneysForRoute:id=>c.serviceJourneys.filter(j=>j.baseRouteId===id).map(j=>({
    ...j,names:c.servicePatterns.find(p=>p.id===j.servicePatternId)?.names,
    originNames:c.destinations.find(d=>d.stationId===j.originStationId)?.names,
    destinationNames:c.destinations.find(d=>d.stationId===j.destinationStationId)?.names
  })),
  trainTypeFor:id=>c.trainTypes.find(t=>t.id===id),
  journeyLabel:v=>typeof v==='string'?v:v?.ko||v?.names?.ko||v?.ja||'',
  koreanRouteDisplayText:v=>v,
  nationwideCatalogLine:()=>{throw Error('NEX-contaminated nationwide catalog consulted')}
};
context.globalThis=context;
context.TRT_RAIL_SYSTEM={throughServices:[],trainServices:[{id:'narita-express',routeId:'line-11333'}]};
vm.createContext(context);
vm.runInContext(src.slice(start,end)+'\n'+src.slice(catStart,catEnd),context);
const choices=context.actualOperatingChoices({id:'line-11333',countryId:'jp',category:'jr',stations:[],services:[{id:'false-fallback'}]});
assert.equal(choices.length,12);
assert(choices.every(x=>x.kind==='journey'&&x.patternId?.startsWith('jr-shonan-')));
assert.equal(new Set(choices.map(x=>context.operatingPatternKey(x))).size,6);
for(const x of choices){
  const label=context.operatingPatternLabel(x);
  assert(/(우츠노미야|타카사키|코가네이|카고하라)/.test(label),label);
  assert(!/(우쓰노미야|다카사키|고가네이|나리타)/.test(label),label);
}
assert.equal(context.routeGroup({id:'line-11328',category:'jr'}),'limited-express');
assert.equal(context.actualOperatingChoices({id:'line-11328',countryId:'jp'})[0].id,'nex-original');
assert(src.includes("route?.id==='line-11333'?null:nationwideCatalogLine(route)"));
assert(read('js/app.bundle.js').includes("choice.patternId?.startsWith('jr-shonan-')&&choice.throughServiceId?.startsWith('jr-shonan-')"));
console.log('PASS: 12 exclusive Shonan directions, six Korean service groups, separate NEX');
