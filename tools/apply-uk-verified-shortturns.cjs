'use strict';
// Verified source-based short-turns added to existing real UK tram track segments.
// Never creates new geometry or invents timetable minutes; idempotent on rebuilds.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const URL_NET='https://www.thetram.net/timetables';
const URL_EDINBURGH='https://edinburghtrams.com/plan-journey/timetables';
const reviewedAt='2026-11-12';

// First/last departures are from the named origin in the operator's public
// table. The chosen times are evidence of an operating short-turn, not game
// timing instructions; games may select any verified service pattern.
const SHORT_TURNS=[
 {routeId:'uk-net-hucknall-toton',parentId:'uk-osm-1984324',from:'Hucknall',to:'Wilkinson Street',serviceKey:'hucknall-wilkinson',timeMonSat:'01:10',timeSunday:'00:10',timeType:'last',url:URL_NET},
 {routeId:'uk-net-hucknall-toton',parentId:'uk-osm-1984324',from:'Hucknall',to:'Nottingham Station',serviceKey:'hucknall-nottingham',timeMonSat:'00:15',timeSunday:'23:15',timeType:'last',url:URL_NET},
 {routeId:'uk-net-hucknall-toton',parentId:'uk-osm-170076',from:'Toton Lane',to:'Shipstone Street',serviceKey:'toton-shipstone',timeMonSat:'01:05',timeSunday:'00:05',timeType:'last',url:URL_NET},
 {routeId:'uk-net-phoenix-clifton',parentId:'uk-osm-1984325',from:'Phoenix Park',to:'Wilkinson Street',serviceKey:'phoenix-wilkinson',timeMonSat:'00:56',timeSunday:'23:56',timeType:'last',url:URL_NET},
 {routeId:'uk-net-phoenix-clifton',parentId:'uk-osm-1984325',from:'Phoenix Park',to:'Nottingham Station',serviceKey:'phoenix-nottingham',timeMonSat:'00:15',timeSunday:'23:15',timeType:'last',url:URL_NET},
 {routeId:'uk-net-phoenix-clifton',parentId:'uk-osm-1984359',from:'Clifton South',to:'Shipstone Street',serviceKey:'clifton-shipstone',timeMonSat:'00:48',timeSunday:'23:48',timeType:'last',url:URL_NET},
 {routeId:'uk-edinburgh-trams',parentId:'uk-osm-4116776',from:'Gyle Centre',to:'Newhaven',serviceKey:'gyle-newhaven-early',timeMonSat:'04:26',timeSunday:'04:26',timeType:'first',url:URL_EDINBURGH},
];
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data)+'\n','utf8');

function applyShortTurns(dir=path.join(root,'data/uk'),index) {
 const ownIndex=!index;
 index??=read(path.join(dir,'generated/index.json'));
 const grouped=new Map();
 for(const spec of SHORT_TURNS){
  if(!grouped.has(spec.routeId))grouped.set(spec.routeId,[]);
  grouped.get(spec.routeId).push(spec);
 }
 for(const [routeId,specs] of grouped){
  const file=path.join(dir,'generated/routes',routeId+'.json');
  const route=read(file);
  const names=new Map(route.stationCatalog.map(s=>[s.id,s]));
  assert.equal(route.id,routeId);
  for(const spec of specs){
   const parent=route.patterns.find(p=>p.id===spec.parentId);
   assert(parent,'missing source pattern '+spec.parentId);
   const stopNames=parent.stationIds.map(id=>names.get(id)?.en);
   const begin=stopNames.indexOf(spec.from),end=stopNames.indexOf(spec.to);
   assert(begin>=0&&end>begin,'short turn not a continuous forward track: '+spec.serviceKey);
   assert.equal(stopNames.lastIndexOf(spec.from),begin,'ambiguous origin');
   assert.equal(stopNames.lastIndexOf(spec.to),end,'ambiguous destination');
   const stationIds=parent.stationIds.slice(begin,end+1);
   const segmentIds=parent.segmentIds.slice(begin,end);
   assert(stationIds.length>1&&segmentIds.length===stationIds.length-1);
   const id='uk-tt-'+spec.serviceKey;
   const previous=route.patterns.find(p=>p.id===id);
   if(previous){
    assert.deepEqual(previous.stationIds,stationIds,'existing short-turn mismatch');
    assert.deepEqual(previous.segmentIds,segmentIds,'existing segment mismatch');
    continue;
   }
   const origin=names.get(stationIds[0]),destination=names.get(stationIds.at(-1));
   const prefix=spec.timeType==='first'?'이른 아침 구간운행':'심야 구간운행';
   const nameKo=prefix+' · '+origin.ko+' → '+destination.ko;
   const nameEn=(spec.timeType==='first'?'Early':'Late')+' short turn: '+spec.from+' → '+spec.to;
   const evidence={
    ...parent.evidence,officialUrl:spec.url,checkedAt:reviewedAt,
    sourcePatternId:spec.parentId,
    auditScope:'operator-published short-turn terminus; stop path is sliced from existing real tracked route',
    timetableEvidence:{
     origin:spec.from,destination:spec.to,departureType:spec.timeType,
     mondayToSaturday:spec.timeMonSat,sunday:spec.timeSunday,
     note:'Schedule departure at origin. Source schedule may be revised.'
    }
   };
   route.patterns.push({...parent,id,familyId:'uk-timetable-'+spec.serviceKey,
     stationIds,segmentIds,showStoppingPattern:false,nameKo,nameEn,sourceName:nameEn,
     validation:{...parent.validation},evidence});
   route.services??=[];
   route.services.push({id,nameKo,nameJa:nameEn,nameEn,stops:stationIds});
  }
  route.serviceCount=route.patterns.length;
  write(file,route);
  const meta=index.routes.find(r=>r.id===routeId);
  assert(meta,'route absent from index '+routeId);
  meta.serviceCount=route.serviceCount;
 }
 if(ownIndex){
  write(path.join(dir,'generated/index.json'),index);
  const validationFile=path.join(dir,'generated/validation.json');
  const validation=read(validationFile);
  const allRoutes=index.routes.map(meta=>read(path.join(root,meta.lazySource)));
  validation.playableDirections=allRoutes.reduce((sum,r)=>sum+r.patterns.length,0);
  validation.servicePatterns=allRoutes.reduce((sum,r)=>sum+new Set(r.patterns.map(p=>p.familyId)).size,0);
  if(Array.isArray(validation.linesDetail))for(const row of validation.linesDetail) {
   const meta=index.routes.find(r=>r.id===row.id);
   if(meta)row.directions=meta.serviceCount;
  }
  write(validationFile,validation);
  console.log(JSON.stringify({shortTurns:SHORT_TURNS.length,directions:validation.playableDirections,
    serviceFamilies:validation.servicePatterns,changedRoutes:[...grouped.keys()]}));
 }
 return {entries:SHORT_TURNS,updatedRoutes:[...grouped.keys()]};
}
module.exports={applyShortTurns,SHORT_TURNS};
if(require.main===module) applyShortTurns();
