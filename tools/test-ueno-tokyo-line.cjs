#!/usr/bin/env node
// Guard the Ueno–Tokyo ordinary service selector against uncontrolled catalogs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),json=p=>JSON.parse(read(p));
const C=json('data/tokyo-service-patterns.json'),T=json('data/through-services.json'),base=json('data/generated/routes/line-11343.json').route;
const app=read('js/app.js'),a=app.indexOf('function actualOperatingChoices(route){'),b=app.indexOf('function operatingDirectionLabel(choice){',a);
assert(a>=0&&b>a,'Selector source not found');
const sb={console,selected:base,
  servicePatternsForRoute:id=>C.servicePatterns.filter(x=>x.baseRouteId===id),
  serviceJourneysForRoute:id=>C.serviceJourneys.filter(j=>j.baseRouteId===id).map(j=>({...j,
    names:C.servicePatterns.find(p=>p.id===j.servicePatternId)?.names,
    originNames:C.destinations.find(d=>d.stationId===j.originStationId)?.names,
    destinationNames:C.destinations.find(d=>d.stationId===j.destinationStationId)?.names})),
  trainTypeFor:id=>C.trainTypes.find(t=>t.id===id),
  journeyLabel:x=>typeof x==='string'?x:x?.ko||x?.names?.ko||x?.ja||'',
  koreanRouteDisplayText:x=>x,
  nationwideCatalogLine:()=>{throw Error('TrainLCD catalog must not run on Ueno–Tokyo')},
  nexOperatingChoices:()=>[],famousLimitedExpressChoices:()=>[],isKoreanResearch:()=>false,koreanResearchChoices:()=>[],koreanVerifiedChoices:()=>[]
};
sb.globalThis=sb;
sb.TRT_RAIL_SYSTEM={throughServices:T.services,trainServices:[{id:'unrelated-nex',routeId:base.id,branches:[{id:'bad',stops:['上野','東京']}]}]};
vm.createContext(sb);vm.runInContext(app.slice(a,b),sb);
assert(C.servicePatterns.filter(p=>p.baseRouteId==='line-11343').every(p=>p.sources?.some(s=>s.type==='official'&&s.url.startsWith('https://'))),'Missing JR official timetable attribution');
const choices=sb.actualOperatingChoices({...base,countryId:'jp'});
assert.equal(choices.length,18,'Expose only eighteen timetable-supported directions');
assert(choices.every(x=>x.kind==='journey'&&x.patternId.startsWith('jr-ueno-')));
assert.equal(new Set(choices.map(x=>sb.operatingPatternKey(x))).size,10);
assert(choices.every(x=>!/(나리타|히타치|토키와)/.test(sb.operatingPatternLabel(x))));
assert(app.includes("['line-11333','line-11343'].includes(route?.id)?null:nationwideCatalogLine(route)"));
assert(read('js/app.bundle.js').includes("choice.patternId?.startsWith('jr-ueno-')&&choice.throughServiceId?.startsWith('jr-ueno-')"));
assert(T.services.filter(s=>s.id.startsWith('jr-ueno-')).every(s=>!/[\u3040-\u30ff\u4e00-\u9fff]/.test(s.nameKo)),'Japanese station names leaked into Korean through-service labels');
const routes=new Map(['line-11343','line-11319','line-11323','line-11301','line-11320','line-11332','line-11229--jobansen-totte-iwaki'].map(id=>[id,json('data/generated/routes/'+id+'.json').route]));
const rt=read('js/service-route-resolver.js').replace(/\bexport\s+/g,'');
const context={console};context.globalThis=context;context.TRT_TOKYO_SERVICE_PATTERNS=C;context.TRT_RAIL_SYSTEM={throughServices:T.services};
vm.createContext(context);vm.runInContext(rt,context);
for(const journey of C.serviceJourneys.filter(x=>x.baseRouteId==='line-11343')){
  const result=context.resolveServiceJourney({baseRoute:base,journeyId:journey.id,getRoute:id=>routes.get(id)});
  assert.equal(result.journey.id,journey.id);
  assert(result.service.stops.length>=12);
  assert.equal(result.route.stations[0].stationMasterId,journey.originStationId);
  assert.equal(result.route.stations.at(-1).stationMasterId,journey.destinationStationId);
  const byId=new Map(result.route.stations.map((s,i)=>[s.stationMasterId,i]));
  const positions=result.service.stops.map(id=>byId.get(id));
  assert(positions.every((p,i)=>Number.isInteger(p)&&(i===0||p>positions[i-1])));
  assert(result.route.stations.every((s,i)=>Number.isInteger(s.geometryIndex)&&s.geometryIndex>=0&&s.geometryIndex<result.route.geometry.length&&(i===0||s.geometryIndex>result.route.stations[i-1].geometryIndex)));
}
const joban=json('data/generated/routes/line-11320.json').route;
const u=base.geometry[base.stations.find(s=>s.ja==='上野').geometryIndex];
const j=joban.geometry[joban.stations.find(s=>s.ja==='上野').geometryIndex];
assert(Math.hypot(u[0]-j[0],u[1]-j[1])>.01,'Joban defect gate must be revisited if source geometry changes');
console.log('PASS: Ueno–Tokyo 12 timetable-supported directions, 7 Korean groups; Joban corridor provisional');
