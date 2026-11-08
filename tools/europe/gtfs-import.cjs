#!/usr/bin/env node
'use strict';
// Import extracted, licensed GTFS directories; never derive rail geometry from station pairs.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,14);
function csv(input){
  const rows=[];let cells=[],field='',quoted=false;
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(c==='"'){if(quoted&&input[i+1]==='"'){field+='"';i++}else quoted=!quoted}
    else if(c===','&&!quoted){cells.push(field);field=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;cells.push(field);if(cells.some(x=>x.length))rows.push(cells);cells=[];field=''}
    else field+=c;
  }
  if(quoted)throw Error('Unclosed GTFS CSV quote');
  if(field||cells.length){cells.push(field);rows.push(cells)}
  const [head,...items]=rows;if(!head)return[];
  head[0]=head[0].replace(/^\uFEFF/,'');
  return items.map(item=>Object.fromEntries(head.map((key,i)=>[key,item[i]||''])));
}
function read(dir,file,optional=false){const target=path.join(dir,file+'.txt');if(!fs.existsSync(target)){if(optional)return[];throw Error('Missing GTFS '+target)}return csv(fs.readFileSync(target,'utf8'))}
function verifyName(table,key,where){
  const value=table?.[key];
  if(!value||typeof value!=='object'||value.reviewStatus!=='verified'||!/[\uAC00-\uD7A3]/u.test(value.ko||'')||!value.source)throw Error('Korean-name review missing for '+where+': '+key);
  return value;
}
function weekday(date){return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)+'T12:00:00Z').getUTCDay()]}
function activeServices(date,calendar,changes){
  if(!calendar.length&&!changes.length)throw Error('GTFS lacks calendar/calendar_dates; date validity cannot be certified');
  const enabled=new Set(calendar.filter(c=>c.start_date<=date&&date<=c.end_date&&c[weekday(date)]==='1').map(c=>c.service_id));
  for(const c of changes.filter(x=>x.date===date)){if(c.exception_type==='1')enabled.add(c.service_id);else if(c.exception_type==='2')enabled.delete(c.service_id)}
  return enabled;
}
function railCategory(routeType){
  const t=Number(routeType);
  if(t===0||t===900)return'tram';
  if(t===1||t===400)return'subway';
  if(t===12)return'monorail';
  if(t===109||t===102)return'high_speed_rail';
  if(t===2||t===100||t===101||t===103||t===104||t===105||t===106||t===107||t===108)return'rail';
  return null;
}
function km(a,b){return Math.hypot((a[0]-b[0])*111.195,(a[1]-b[1])*111.195*Math.cos((a[0]+b[0])*Math.PI/360))}
function projection(p,a,b){
  const scale=Math.cos(p[0]*Math.PI/180),dx=(b[1]-a[1])*scale,dy=b[0]-a[0],len=dx*dx+dy*dy;
  const t=len?Math.max(0,Math.min(1,(((p[1]-a[1])*scale)*dx+(p[0]-a[0])*dy)/len)):0;
  const at=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  return{at,t,distanceKm:km(p,at)};
}
function snap(stations,shape,thresholdKm=0.5){
  if(shape.length<3)throw Error('No usable track shape: requires at least 3 verified vertices');
  const positions=[];
  for(const station of stations){
    const p=[Number(station.stop_lat),Number(station.stop_lon)];
    if(!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180)throw Error('Invalid stop coordinates');
    let best=null;
    for(let i=0;i<shape.length-1;i++){
      const candidate=projection(p,shape[i],shape[i+1]);
      if(!best||candidate.distanceKm<best.distanceKm)best={...candidate,segment:i,progress:i+candidate.t};
    }
    if(best.distanceKm>thresholdKm)throw Error('Stop is not on official railway shape: '+station.stop_id);
    if(positions.length&&best.progress<=positions.at(-1).progress+1e-8)throw Error('Wrong stop/shape order: '+station.stop_id);
    positions.push(best);
  }
  const geometry=[],indices=[];
  for(let j=0;j<positions.length;j++){
    const point=positions[j];if(j===0){geometry.push(point.at);indices.push(0);continue}
    const before=positions[j-1];
    for(let k=before.segment+1;k<=point.segment;k++)geometry.push(shape[k]);
    geometry.push(point.at);indices.push(geometry.length-1);
  }
  if(geometry.length<3)throw Error('Insufficient track geometry');
  return{geometry,indices};
}
function build(input,opts){
 const {country,feedKey,sourceUrl,license,snapshotDate,serviceDate,names}=opts;
 if(!/^(gb|fr|de|es|it|ch|nl|at|be|pt|cz|pl)$/.test(country))throw Error('Unsupported country');
 if(!/^[a-z][a-z0-9-]{1,24}$/.test(feedKey))throw Error('Invalid scoped feed key');
 if(!/^https:\/\//.test(sourceUrl)||!license||!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)||!/^\d{8}$/.test(serviceDate))throw Error('Source URL, license, snapshot date, service date required');
 const routes=input.routes||[],trips=input.trips||[],stops=input.stops||[],times=input.stop_times||[],shapes=input.shapes||[],agencies=input.agency||[];
 const stopMap=new Map(stops.map(s=>[s.stop_id,s]));
 const routeMap=new Map(routes.map(r=>[r.route_id,r]));
 const agencyMap=new Map(agencies.map(a=>[a.agency_id||'default',a]));
 const active=activeServices(serviceDate,input.calendar||[],input.calendar_dates||[]);
 const byTrip=new Map();
 for(const row of times){if(!byTrip.has(row.trip_id))byTrip.set(row.trip_id,[]);byTrip.get(row.trip_id).push(row)}
 for(const list of byTrip.values())list.sort((a,b)=>Number(a.stop_sequence)-Number(b.stop_sequence));
 const shapeMap=new Map();
 for(const s of shapes){if(!shapeMap.has(s.shape_id))shapeMap.set(s.shape_id,[]);shapeMap.get(s.shape_id).push(s)}
 for(const [id,rows]of shapeMap)shapeMap.set(id,rows.sort((a,b)=>Number(a.shape_pt_sequence)-Number(b.shape_pt_sequence)).map(s=>[Number(s.shape_pt_lat),Number(s.shape_pt_lon)]));
 const patterns=new Map(),unresolved=[];
 for(const trip of trips){
  if(!active.has(trip.service_id))continue;
  const raw=routeMap.get(trip.route_id);if(!raw||!railCategory(raw.route_type))continue;
  const calls=byTrip.get(trip.trip_id)||[],shape=shapeMap.get(trip.shape_id);
  if(calls.length<2||!shape){unresolved.push({tripId:trip.trip_id,reason:'missing-stop-or-shape'});continue}
  const stopList=calls.map(s=>stopMap.get(s.stop_id));
  if(stopList.some(s=>!s)){unresolved.push({tripId:trip.trip_id,reason:'missing-stop'});continue}
  const key=trip.route_id+'|'+trip.shape_id+'|'+calls.map(s=>s.stop_id).join('>');
  if(patterns.has(key))continue;
  try{
   const agency=agencyMap.get(raw.agency_id||'default')||agencies[0];
   if(!agency)throw Error('no-agency');
   const lineId='eu-'+country+'-'+feedKey+'-line-'+hash(trip.route_id);
   const koOperator=verifyName(names.operators,agency.agency_id||agency.agency_name,'operator');
   const koLine=verifyName(names.lines,raw.route_id,'line');
   const snapped=snap(stopList,shape);
   const stationEntries=stopList.map((s,i)=>{
    const parent=s.parent_station?stopMap.get(s.parent_station):null;
    const canonical=parent||s;
    const n=verifyName(names.stations,canonical.stop_id,'station');
    return{id:'eu-'+country+'-stop-'+feedKey+'-'+hash(canonical.stop_id),stationMasterId:'eu-'+country+'-stop-'+feedKey+'-'+hash(canonical.stop_id),sourceStopId:s.stop_id,officialCode:s.stop_code||canonical.stop_code||'',ja:canonical.stop_name,ko:n.ko,romaji:n.en||canonical.stop_name,native:canonical.stop_name,latitude:Number(s.stop_lat),longitude:Number(s.stop_lon),geometryIndex:snapped.indices[i],nameReviewStatus:'verified',koSource:n.source,koVerified:true,countryId:country,sharedStationRef:/^\d{7}$/.test(canonical.stop_code||'')?'uic:'+canonical.stop_code:null};
   });
   const patternId='eu-'+country+'-pattern-'+hash(key);
   const p={id:patternId,nameKo:koLine.ko+' '+(trip.trip_headsign?stationEntries.at(-1).ko+' 방면':''),nameNative:raw.route_long_name||raw.route_short_name||'',nameEn:raw.route_long_name||'',direction:trip.direction_id==='1'?'reverse':'forward',sourceTripId:trip.trip_id,sourceShapeId:trip.shape_id,serviceDate,stations:stationEntries,geometry:snapped.geometry};
   patterns.set(key,{p,route:raw,agency,lineId,koLine,koOperator});
  }catch(error){unresolved.push({tripId:trip.trip_id,reason:String(error.message).slice(0,180)})}
 }
 const grouped=new Map();
 for(const obj of patterns.values()){const id=obj.lineId;if(!grouped.has(id))grouped.set(id,{...obj,all:[]});grouped.get(id).all.push(obj.p)}
 const published=[];
 for(const group of grouped.values()){
  const {route:r,agency,all,lineId,koLine,koOperator}=group;const distinct=all.sort((a,b)=>a.id.localeCompare(b.id)).slice(0,64);const first=distinct[0];
  const category=railCategory(r.route_type);const color=/^[0-9A-Fa-f]{6}$/.test(r.route_color||'')?'#'+r.route_color:'#777777';
  const data={schemaVersion:1,id:lineId,countryId:country,operatorId:'eu-'+country+'-'+feedKey+'-operator-'+hash(agency.agency_id||agency.agency_name),operator:{ko:koOperator.ko,ja:agency.agency_name,en:agency.agency_name,native:agency.agency_name},line:{ko:koLine.ko,ja:r.route_long_name||r.route_short_name,en:r.route_long_name||r.route_short_name,native:r.route_long_name||r.route_short_name},category,mode:category,lineColor:color,code:r.route_short_name||'',operationalStatus:'OPERATIONAL',playable:true,geometryReady:true,geometryStatus:'ready',physicalCorridorRefs:[],passengerLineId:lineId,stationCount:first.stations.length,serviceCount:distinct.length,stations:first.stations,geometry:first.geometry,patterns:distinct,sourceEvidence:{type:'official-GTFS',sourceUrl,license,snapshotDate,serviceDate,feedKey,sourceRouteId:r.route_id,geometrySource:'gtfs-shapes.txt',attribution:agency.agency_name}};
  published.push(data);
 }
 return{routes:published,unresolved,stats:{activeTrips:trips.filter(t=>active.has(t.service_id)).length,eligiblePatterns:patterns.size,publishedLines:published.length,unresolved:unresolved.length}};
}
function loadFeed(directory){const out={};for(const key of ['agency','routes','trips','stop_times','stops','shapes','calendar','calendar_dates'])out[key]=read(directory,key,key==='calendar'||key==='calendar_dates');return out}
function run(argv){
 const options=Object.fromEntries(argv.filter(x=>x.startsWith('--')).map(x=>{const p=x.indexOf('=');return[x.slice(2,p),x.slice(p+1)]}));
 for(const key of ['input','country','feed-key','source-url','license','snapshot','date','names'])if(!options[key])throw Error('Required --'+key+'=...');
 const root=path.resolve(__dirname,'../..'),cc=options.country,names=JSON.parse(fs.readFileSync(options.names,'utf8'));
 const compiled=build(loadFeed(options.input),{country:cc,feedKey:options['feed-key'],sourceUrl:options['source-url'],license:options.license,snapshotDate:options.snapshot,serviceDate:options.date.replace(/-/g,''),names});
 if(!compiled.routes.length)throw Error('Publication blocked: zero fully validated shapes and Korean naming sets');
 const folder=path.join(root,'data/eu',cc,'generated'),indexPath=path.join(folder,'index.json'),index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
 if(index.country.id!==cc)throw Error('Target country mismatch');
 const catalog=new Map((index.routes||[]).map(x=>[x.id,x]));
 for(const route of compiled.routes){
  fs.mkdirSync(path.join(folder,'routes'),{recursive:true});
  const lazySource='data/eu/'+cc+'/generated/routes/'+route.id+'.json';
  fs.writeFileSync(path.join(root,lazySource),JSON.stringify({route},null,2)+'\n');
  catalog.set(route.id,{...route,stations:undefined,patterns:undefined,geometry:undefined,lazy:true,lazySource,searchStations:[...new Set(route.stations.map(s=>s.ko))],stationSequence:route.stations.map(s=>({id:s.id,ko:s.ko,native:s.native})),sourceEvidence:route.sourceEvidence});
 }
 index.routes=[...catalog.values()].sort((a,b)=>a.id.localeCompare(b.id));
 index.operators=[...new Map(index.routes.map(r=>[r.operatorId,{id:r.operatorId,countryId:cc,names:{ko:r.operator.ko,ja:r.operator.ja,en:r.operator.en}}])).values()];
 index.status='PARTIALLY_VERIFIED';index.sourceNotice='검증 완료된 노선만 공개합니다. 전국 전체 구축이 아닙니다.';
 fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
 const report=path.join(root,'reports/europe');fs.mkdirSync(report,{recursive:true});
 fs.writeFileSync(path.join(report,cc+'-'+options['feed-key']+'-import.json'),JSON.stringify({country:cc,feed:options['feed-key'],source:options['source-url'],...compiled.stats,unresolved:compiled.unresolved.slice(0,1000)},null,2)+'\n');
 console.log(JSON.stringify(compiled.stats));
}
if(require.main===module)try{run(process.argv.slice(2))}catch(error){console.error(error.stack);process.exitCode=1}
module.exports={csv,activeServices,railCategory,snap,build,loadFeed,run};
