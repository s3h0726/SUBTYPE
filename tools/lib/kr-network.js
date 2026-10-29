'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const entities=['operators','infrastructure','stations','stops','passenger-lines','services','trips','geometry','sources','reviews','assets','station-signs'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const equal=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=32&&p[0]<=40&&p[1]>=123&&p[1]<=133;
function load(base){const data={};for(const name of entities)data[name]=JSON.parse(fs.readFileSync(path.join(base,name+'.json'),'utf8'));data.coverage=JSON.parse(fs.readFileSync(path.join(base,'coverage.json'),'utf8'));return data}
function validate(data,{base}={}){
 const errors=[],maps={};const fail=(code,id,detail)=>errors.push({code,id,detail});
 for(const name of entities){const rows=data[name];maps[name]=new Map();if(!Array.isArray(rows)){fail('EXPECTED_ARRAY',name);continue}for(const row of rows){if(typeof row?.id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(row.id)||maps[name].has(row.id))fail('DUPLICATE_OR_MISSING_ID',name,row?.id);else maps[name].set(row.id,row)}}
 const link=(kind,id,owner)=>{if(!maps[kind].has(id))fail('MISSING_REFERENCE',owner,kind+':'+id)};
 for(const s of data.stops||[])link('stations',s.stationId,s.id);
 for(const s of data.services||[]){link('passenger-lines',s.passengerLineId,s.id);for(const p of s.paths||[])link('geometry',p.geometryId,s.id);for(const p of s.stops||[])link('stops',p.stopId,s.id)}
 for(const i of data.infrastructure||[])link('geometry',i.geometryId,i.id);
 for(const t of data.trips||[])link('services',t.serviceId,t.id);
 for(const r of data.reviews||[])link('services',r.serviceId,r.id);
 const osmBySource=new Map();
 for(const source of data.sources||[]){
  if(!source.license||!source.url)fail('SOURCE_METADATA',source.id);
  for(const file of source.files||[]){
   if(!base)continue;
   const resolved=path.resolve(base,file.path);if(!resolved.startsWith(path.resolve(base)+path.sep)){fail('SOURCE_PATH_ESCAPE',source.id,file.path);continue}
   if(!fs.existsSync(resolved)||sha(fs.readFileSync(resolved))!==file.sha256)fail('SOURCE_HASH_MISMATCH',source.id,file.path);
   if(source.kind==='osm'&&file.path.endsWith('osm-ways.json')&&fs.existsSync(resolved))osmBySource.set(source.id,new Map(JSON.parse(fs.readFileSync(resolved,'utf8')).map(w=>[String(w.id),w])));
  }
 }
 for(const g of data.geometry||[]){
  if(!Array.isArray(g.coordinates)||g.coordinates.length<2||!g.coordinates.every(point)||g.nodeIds?.length!==g.coordinates.length){fail('GEOMETRY_COORDINATES',g.id);continue}
  link('sources',g.sourceRef?.sourceId,g.id);
  const raw=osmBySource.get(g.sourceRef?.sourceId)?.get(String(g.sourceRef?.id));
  if(base&&(!raw||JSON.stringify(raw.nodeIds)!==JSON.stringify(g.nodeIds)||JSON.stringify(raw.coordinates)!==JSON.stringify(g.coordinates)||raw.version!==g.sourceVersion))fail('GEOMETRY_NOT_IN_SOURCE',g.id);
 }
 return {errors,maps};
}
function km(a,b){const rad=x=>x*Math.PI/180,dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]),x=Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2;return 12742*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function assemble(service,maps){
 const unresolved=(service.issues||[]).filter(i=>!['OFFICIAL_TIMETABLE_REQUIRED','NON_PUBLIC_TRACK_REVIEW'].includes(i.code));
 if(unresolved.length)throw Error('UNRESOLVED_IMPORT_TOPOLOGY');
 const coordinates=[],nodeIds=[];
 for(const part of service.paths||[]){const g=maps.geometry.get(part.geometryId);if(!g)throw Error('MISSING_TRACK');const pts=part.reverse?g.coordinates.slice().reverse():g.coordinates,ids=part.reverse?g.nodeIds.slice().reverse():g.nodeIds;
  if(coordinates.length&&(nodeIds.at(-1)!==ids[0]||!equal(coordinates.at(-1),pts[0])))throw Error('DISCONNECTED_TRACK');
  const offset=coordinates.length?1:0;coordinates.push(...pts.slice(offset));nodeIds.push(...ids.slice(offset));
 }
 if(coordinates.length<2||!coordinates.every(point))throw Error('MISSING_TRACK');
 let previous=-1;const stations=[];
 for(const call of service.stops||[]){const stop=maps.stops.get(call.stopId),station=maps.stations.get(stop?.stationId),index=call.geometryIndex;
  if(!station||!Number.isInteger(index)||index<=previous||index>=coordinates.length)throw Error('STOP_ORDER');
  if(nodeIds[index]!==stop.osmNodeId||!equal(coordinates[index],[stop.coordinates.lat,stop.coordinates.lon]))throw Error('STOP_NOT_ON_SOURCE_TRACK');
  stations.push({id:station.id,stationMasterId:station.id,internalId:station.id,ko:station.names.ko,ja:station.names.ko,romaji:station.names.en,kana:station.names.ko,latitude:stop.coordinates.lat,longitude:stop.coordinates.lon,geometryIndex:index,officialCode:stop.number||'',stationCode:stop.number||'',hasOfficialStationCode:!!stop.number,platformId:stop.id,transfers:station.transferStationIds||[]});previous=index;
 }
 if(stations.length<2)throw Error('TOO_FEW_STOPS');
 const start=stations[0].geometryIndex,end=stations.at(-1).geometryIndex,geometry=coordinates.slice(start,end+1);stations.forEach(s=>s.geometryIndex-=start);
 let lengthKm=0;for(let i=1;i<geometry.length;i++)lengthKm+=km(geometry[i-1],geometry[i]);
 const directedSegments=stations.slice(0,-1).map((s,i)=>({fromStationId:s.id,toStationId:stations[i+1].id,geometry:geometry.slice(s.geometryIndex,stations[i+1].geometryIndex+1),geometryStatus:'ready',source:{sourceRefs:service.paths.map(p=>maps.geometry.get(p.geometryId).sourceRef)}}));
 return {stations,geometry,directedSegments,lengthKm};
}
function releaseReasons(service,data,maps,journey){
 const reasons=[],review=(data.reviews||[]).find(r=>r.serviceId===service.id&&r.status==='verified'),asOf=data.coverage.asOf;
 const official=(ids,kind)=>(ids||[]).some(id=>{const s=maps.sources.get(id);return s?.kind===kind&&s.licenseStatus==='verified'&&s.files?.length&&s.files.every(f=>/^[a-f0-9]{64}$/.test(f.sha256))&&s.publisher&&s.validFrom<=asOf&&(!s.validUntil||asOf<=s.validUntil)});
 if(!review||!official(review.timetableSourceIds,'official-timetable'))reasons.push('OFFICIAL_TIMETABLE_REQUIRED');
 if(!review?.trackDirectionVerified||!official(review.stationSourceIds,'official-stations'))reasons.push('OFFICIAL_STATION_AND_DIRECTION_REVIEW_REQUIRED');
 if(!review?.validFrom||review.validFrom>asOf||(review.validUntil&&review.validUntil<asOf))reasons.push('REVIEW_NOT_VALID_ON_DATE');
 if(!(review?.officialDistanceKm>0)||!journey||Math.abs(journey.lengthKm-review.officialDistanceKm)/review.officialDistanceKm>0.1)reasons.push('DISTANCE_NOT_VERIFIED');
 const trips=(data.trips||[]).filter(t=>t.serviceId===service.id);
 if(!trips.length||trips.some(t=>t.status!=='verified'||!official(t.sourceIds,'official-timetable')||!t.validFrom||t.validFrom>asOf||(t.validUntil&&t.validUntil<asOf)||!t.operatingDays?.length||JSON.stringify(t.stopIds)!==JSON.stringify(service.stops.map(s=>s.stopId))))reasons.push('VERIFIED_TRIP_REQUIRED');
 for(const call of service.stops||[]){const stop=maps.stops.get(call.stopId);if(stop?.verification!=='verified'||(!stop.number&&!stop.numberingNotApplicable)||(!stop.platformCode&&!stop.platformNotApplicable))reasons.push('STOP_METADATA_NOT_VERIFIED')}
 const line=maps['passenger-lines'].get(service.passengerLineId);
 if(!line?.names?.ko||!/^#[0-9a-f]{6}$/i.test(line.color||'')||!line.regionId||line.status!=='verified')reasons.push('LINE_METADATA_NOT_VERIFIED');
 for(const call of service.stops||[]){const st=maps.stations.get(maps.stops.get(call.stopId)?.stationId);if(st?.status!=='verified'||!st.names?.en||!/[가-힣]/.test(st.names?.ko||'')||/[\u3040-\u30ff\u3400-\u9fff]/.test(st.names?.ko||''))reasons.push('STATION_METADATA_NOT_VERIFIED')}
 if(!service.operatorIds?.length||service.operatorIds.some(id=>maps.operators.get(id)?.verification!=='verified'))reasons.push('OPERATOR_NOT_VERIFIED');
 for(const id of service.operatorIds||[])if(!(data.assets||[]).some(a=>a.kind==='operator'&&a.operatorId===id&&a.verified===true&&a.sourceUrl&&a.license&&a.license!=='unverified'&&a.asset))reasons.push('OPERATOR_LOGO_NOT_VERIFIED');
 const trackByGeometry=new Map((data.infrastructure||[]).map(i=>[i.geometryId,i]));
 if(service.paths.some(p=>trackByGeometry.get(p.geometryId)?.highway))reasons.push('ROAD_OR_AMBIGUOUS_RAIL_ROAD_WAY');
 if(service.paths.some(p=>['yard','siding','spur'].includes(trackByGeometry.get(p.geometryId)?.service)))reasons.push('NON_PUBLIC_TRACK_REQUIRES_EXCLUSION');
 if(service.paths.some(p=>{const track=trackByGeometry.get(p.geometryId);return (track?.oneway==='yes'&&p.reverse)||(track?.oneway==='-1'&&!p.reverse)}))reasons.push('ONEWAY_DIRECTION_CONFLICT');
 return [...new Set(reasons)];
}
function compile(data,options={}){
 const {errors,maps}=validate(data,options);if(errors.length)return {status:'INVALID',errors,routes:[],blocked:[]};
 const routesByLine=new Map(),blocked=[],excluded=[];let officialTimetableVerifiedServices=0;
 for(const s of data.services){if(s.access?.passengerCandidate===false){excluded.push({serviceId:s.id,classification:s.access.classification,reason:s.access.reason});continue}let journey,assemblyError;try{journey=assemble(s,maps)}catch(e){assemblyError=e.message}
  const reasons=releaseReasons(s,data,maps,journey);if(!reasons.includes('OFFICIAL_TIMETABLE_REQUIRED'))officialTimetableVerifiedServices++;if(assemblyError)reasons.push(assemblyError);
  if(reasons.length){blocked.push({serviceId:s.id,passengerLineId:s.passengerLineId,reasons});continue}
  const line=maps['passenger-lines'].get(s.passengerLineId),operator=maps.operators.get(s.operatorIds[0]);
  const service={id:s.id,nameKo:s.names.ko,nameJa:s.names.ko,nameEn:s.names.en,stops:journey.stations.map(st=>st.id)};
  const serviceTrips=data.trips.filter(t=>t.serviceId===s.id);
  const variant={id:s.id,patternId:s.patternId||s.id,patternName:s.patternNames||s.names,directionId:s.directionId,service,...journey,tripIds:serviceTrips.map(t=>t.id),availability:serviceTrips.map(t=>({tripId:t.id,operatingDays:t.operatingDays,validFrom:t.validFrom,validUntil:t.validUntil||null,calendarExceptions:t.calendarExceptions||[],departureTime:t.departureTime||null}))};
  let route=routesByLine.get(line.id);
  if(!route){route={id:line.id,schemaVersion:2,countryId:'kr',category:'commuter_rail',mode:line.mode,regionId:line.regionId,passengerLineId:line.id,passengerLineName:line.names.ko,line:{...line.names,ja:line.names.ko},lineColor:line.color,operatorId:operator.id,operator:{...operator.names,ja:operator.names.ko},geometryReady:true,geometryStatus:'ready',playable:true,releaseStatus:'verified',stationSignTemplate:'kr-temporary-jr',verifiedJourneys:[],...journey,services:[]};routesByLine.set(line.id,route)}
  route.verifiedJourneys.push(variant);route.services.push(service);
 }
 const routes=[...routesByLine.values()],coverage=data.coverage;
 const expected=coverage.officialPassengerLineIds,expectedServices=coverage.officialServiceIds;
 const releasedServiceIds=new Set(routes.flatMap(r=>r.verifiedJourneys.map(j=>j.id)));
 const coverageVerified=coverage.sourceIds?.some(id=>{const s=maps.sources.get(id);return s?.kind==='official-national-inventory'&&s.licenseStatus==='verified'&&s.publisher&&s.files?.length&&s.files.every(f=>/^[a-f0-9]{64}$/.test(f.sha256))&&s.validFrom<=coverage.asOf&&(!s.validUntil||coverage.asOf<=s.validUntil)});
 const complete=coverage.status==='verified'&&coverageVerified&&Array.isArray(expected)&&expected.length>0&&Array.isArray(expectedServices)&&expectedServices.length>0&&blocked.length===0&&expected.length===routes.length&&expected.every(id=>routesByLine.has(id))&&expectedServices.length===releasedServiceIds.size&&new Set(expectedServices).size===expectedServices.length&&expectedServices.every(id=>releasedServiceIds.has(id));
 return {status:complete?'COMPLETE':'INCOMPLETE',errors,routes,blocked,excluded,counts:{sourceStations:data.stations.length,sourcePassengerLines:data['passenger-lines'].length,sourceServices:data.services.length,activeServiceCandidates:data.services.length-excluded.length,excludedServices:excluded.length,officialTimetableVerifiedServices,releasedLines:routes.length,releasedServices:routes.reduce((n,r)=>n+r.verifiedJourneys.length,0),officialPassengerLines:expected?.length??null,officialServices:expectedServices?.length??null}};
}
module.exports={load,validate,assemble,compile,releaseReasons,km};
