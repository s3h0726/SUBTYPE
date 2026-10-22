#!/usr/bin/env node
'use strict';
// Independent regression for disappearing Shinkansen operating patterns.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalogSource=read('js/nationwide-service-catalog.js');
const label='window.TRT_NATIONWIDE_SERVICE_CATALOG=';
assert(catalogSource.includes(label),'National Japanese service catalog missing');
const catalog=JSON.parse(catalogSource.split(label)[1].trim().replace(/;\s*$/,''));
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
const available=new Map(lite.routes.map(route=>[route.id,route]));
const shinkansen=Object.entries(catalog.lines).filter(([code,line])=>/新幹線/.test(line.ja)&&line.patterns?.length);
assert(shinkansen.length>=9,'Expected nationwide Shinkansen timetable service definitions');
let records=[];
for(const [code,line] of shinkansen){
 const physical=lite.routes.find(r=>r.line?.ja===line.ja);
 if(!physical){records.push({line:line.ja,patterns:line.patterns.length,problem:'physical route not indexed'});continue;}
 const missing=new Set;
 for(const pattern of line.patterns)for(const part of pattern.segments||[]){
   const catalogLine=catalog.lines[part.lineCode];
   if(!catalogLine||!lite.routes.some(r=>r.line?.ja===catalogLine.ja))
     missing.add(part.lineCode+':'+(catalogLine?.ja||'?'));
 }
 records.push({line:line.ja,routeId:physical.id,patterns:line.patterns.length,
  types:[...new Set(line.patterns.map(p=>p.type?.ko))],missingSegments:[...missing]});
}
const tokaido=records.find(r=>r.routeId==='shinkansen-tokaido');
assert(tokaido, 'Tokaido line no longer available');
for(const name of ['노조미','히카리','고다마'])
 assert(tokaido.types.includes(name),'Missing timetable train type: '+name);
const app=read('js/app.js'),bundle=read('js/app.bundle.js');
for(const src of [app,bundle]){
 assert(src.includes('async function hydrateJapaneseOperatingConnections(route)'),'Missing Japanese service hydration');
 assert(src.includes('await hydrateJapaneseOperatingConnections(route)'),'Shinkansen service hydration is not awaited before drawing selector');
}
console.log(JSON.stringify({status:'PASS',sourceLines:shinkansen.length,reportedRoutes:records,sourcePatterns:shinkansen.reduce((sum,entry)=>sum+entry[1].patterns.length,0)},null,2));
// Reproduce route assembly without the UI to catch mismatched segment endpoints.
const context={console,globalThis:{}};
vm.createContext(context);
vm.runInContext(read('js/service-route-resolver.js').replace(/\bexport\s+/g,'')+';globalThis.assemble=buildThroughServiceRoute',context);
const data=new Map();
for(const route of lite.routes.filter(r=>r.id.startsWith('shinkansen-'))){
 const file=path.join(root,'data/generated/routes/'+route.id+'.json');
 if(fs.existsSync(file)){
  const j=JSON.parse(fs.readFileSync(file,'utf8')).route;
  data.set(j.line.ja,j);
 }
}
for(const name of ['のぞみ','ひかり','こだま']){
 const pattern=catalog.lines['1002'].patterns.find(p=>p.type?.ja===name);
 const specs=pattern.segments.map(segment=>{
  const x=catalog.lines[segment.lineCode];
  const route=data.get(x.ja);
  if(!route)throw new Error('Missing physical route '+x.ja);
  const first=segment.stations[0][0],last=segment.stations.at(-1)[0];
  const a=route.stations.findIndex(st=>st.ja===first),b=route.stations.findIndex(st=>st.ja===last);
  if(a<0||b<0)throw new Error('Missing endpoint '+first+' / '+last);
  return {routeId:route.id,direction:b>=a?'forward':'reverse',startStationJa:first,endStationJa:last};
 });
 const spec={id:'test-'+name,nameJa:name,nameKo:name,nameEn:name,routeSegments:specs,boundarySnapToleranceKm:1.2};
 try{
  const value=context.globalThis.assemble(spec,id=>[...data.values()].find(r=>r.id===id));
  assert(value?.stations?.length>15, 'Too few assembled Shinkansen stations');
  console.log('PLAYABLE '+name+' stations='+value.stations.length+' geometry='+value.geometry.length);
 }catch(error){
  console.log('ASSEMBLY_FAILURE '+name+' '+error.message);
  throw error;
 }
}
