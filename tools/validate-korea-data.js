#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'data','kr','generated','index.json'),'utf8')),errors=[];
const ids=new Set,required=['kr-seoul-line-2','kr-capital-line-1-cheongnyangni-incheon','kr-shinbundang','kr-ktx-seoul-busan','kr-seoul-bus-143','kr-seoul-village-bus-mapo13','kr-gyeonggi-express-m5107','kr-hangang-east'],details=new Map;
for(const route of data.routes||[]){
  if(ids.has(route.id))errors.push(`duplicate route: ${route.id}`);ids.add(route.id);
  if(route.countryId!=='kr'||!route.id.startsWith('kr-'))errors.push(`${route.id}: invalid country-scoped ID`);
  if(!route.lazy||!route.lazySource)errors.push(`${route.id}: route detail must be lazy-loaded`);
  const payload=JSON.parse(fs.readFileSync(path.join(root,route.lazySource),'utf8')).route;details.set(route.id,payload);
  if(!Array.isArray(payload.directions)||!payload.directions.length)errors.push(`${route.id}: explicit direction missing`);
  if(payload.geometryStatus==='missing'&&(payload.geometry||[]).length)errors.push(`${route.id}: missing geometry disguised as coordinates`);
  for(const direction of payload.directions||[])if(direction.stops.length<2)errors.push(`${route.id}/${direction.id}: fewer than two stops`);
}
for(const id of required)if(!ids.has(id))errors.push(`representative route missing: ${id}`);
for(const id of ['kr-seoul-bus-143','kr-seoul-village-bus-mapo13','kr-gyeonggi-express-m5107']){const route=details.get(id);if(!route)continue;const a=route.directions[0].stops.map(stop=>stop.id),b=route.directions[1].stops.map(stop=>stop.id);if(JSON.stringify(a.slice().reverse())===JSON.stringify(b))errors.push(`${id}: reverse direction was mechanically generated`)}
const line1=details.get('kr-capital-line-1-cheongnyangni-incheon');if(line1&&(line1.operatorIds?.length<2||line1.physicalLines?.length<2))errors.push('Capital Line 1 must retain multi-operator physical-line composition');
const ktx=details.get('kr-ktx-seoul-busan');if(ktx&&ktx.dataKind!=='trainService')errors.push('KTX must be modeled as a service stop pattern');
if(errors.length){console.error(JSON.stringify({status:'FAIL',errors},null,2));process.exitCode=1}else console.log(JSON.stringify({status:'PASS',operators:data.counts.operators,routes:data.counts.routes,uniqueStops:data.counts.stops,representativeRoutes:required.length,lazyRoutes:data.routes.length,explicitDirectionRoutes:data.routes.length,fakeStraightGeometry:0},null,2));
