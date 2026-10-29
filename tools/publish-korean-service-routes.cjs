#!/usr/bin/env node
'use strict';
// Publish all structurally playable Korean OSM service paths in the regular
// in-game catalog. This is a GAME release, NOT operator timetable certification.
// Preserve original OSM evidence and the source preview as a build input.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const abs=p=>path.join(root,p);
const parse=p=>JSON.parse(fs.readFileSync(abs(p),'utf8'));
const indexPath='data/kr/generated/index.json';
const main=parse(indexPath),source=parse('data/kr/preview/index.json');
assert.equal(source.routes.length,123,'Unexpected source-route inventory');
const obsolete=new Set(['13695367','13695368']); // Discontinued Dongincheon limited express
const blocked=new Set(['20500831']); // Safety policy: partial route
const byId=new Map();
const skipped=[];
const operators=new Map([...main.operators,...source.operators].map(x=>[x.id,x]));
for(const route of main.routes){
 // The independently assembled passenger Line 1 journeys supersede five
 // legacy fragments. Never delete other legacy passenger lines.
 if(/^kr-metro-1-(main|gyeongin|gyeongbu|gwangmyeong|seodongtan)$/.test(route.id))continue;
 byId.set(route.id,route);
}
const audit={schemaVersion:1,note:'Game-publication only. Neither operator timetable verification nor national official approval is implied.',source:'OpenStreetMap service relations; source geometry/evidence retained in data/kr/preview and data/kr/v2',published:{},unreleased:[]};
let published=0;
for(const entry of source.routes){
 const relationId=String(entry.sourceRelationId||'');
 assert.match(relationId,/^\d+$/);
 if(obsolete.has(relationId)||blocked.has(relationId)){
  skipped.push({relationId,reason:obsolete.has(relationId)?'discontinued service':'access restriction'});
  audit.unreleased.push({relationId,reason:skipped.at(-1).reason});
  continue;
 }
 const inFile='data/kr/preview/routes/'+entry.id+'.json';
 const original=parse(inFile).route;
 assert(original&&original.id===entry.id&&original.sourceRelationId===relationId);
 assert.equal(original.playable,true);
 assert.equal(original.geometryReady,true);
 assert(Array.isArray(original.stations)&&original.stations.length>=2);
 assert(Array.isArray(original.geometry)&&original.geometry.length>=2);
 assert.equal(original.directedSegments.length,original.stations.length-1);
 const id='kr-service-'+relationId;
 const sha=crypto.createHash('sha256').update(JSON.stringify({stations:original.stations,geometry:original.geometry,directedSegments:original.directedSegments})).digest('hex');
 const serviceName=String(original.line?.ko||'').replace(/:\s*/g,' · ').trim();
 const category=({subway:'subway',light_rail:'light_rail',monorail:'monorail',tram:'tram',train:'commuter_rail'})[original.mode]||'commuter_rail';
 const material={...original,id,category,mode:original.mode==='train'?'rail':original.mode,releaseStatus:'released',playStatus:'RELEASED',visibility:'public',
   serviceValidationStatus:'external-timetable-unverified',
   schemaVersion:2,sourceStatus:'osm-service-geometry',
   sourceServiceId:original.sourceServiceId,
   line:{...original.line,ko:serviceName||original.line?.ko,ja:original.line?.ja||serviceName},
   passengerLineName:String(original.passengerLineName||'').split(':')[0].trim()};
 delete material.previewContract;
 delete material.researchEvidence;
 delete material.researchPreview;
 if(Array.isArray(material.services)){
  material.services=material.services.map(s=>({...s,nameKo:serviceName||s.nameKo,nameJa:serviceName||s.nameJa}));
 }
 const outfile='data/kr/generated/routes/'+id+'.json';
 const rendered=JSON.stringify({route:material})+'\n';
 fs.mkdirSync(path.dirname(abs(outfile)),{recursive:true});
 fs.writeFileSync(abs(outfile),rendered);
 const compact={...material,stations:[],geometry:[],directedSegments:[],services:[],lazy:true,originNames:{id:material.stations[0].id,ko:material.stations[0].ko},destinationNames:{id:material.stations.at(-1).id,ko:material.stations.at(-1).ko},
   lazySource:outfile+'?v='+crypto.createHash('sha256').update(rendered).digest('hex').slice(0,12),
   stationCount:material.stations.length,serviceCount:material.services?.length||0};
 byId.set(id,compact);
 audit.published[id]={sourceRelationId:relationId,legacyId:entry.id,geometrySha256:sha,
   sourceEvidence:original.researchEvidence||null,externalTimetableVerified:false};
 published++;
}
assert.equal(published,source.routes.length-skipped.length);
// Recover additional current passenger directions when their source relation
// omits BOTH endpoint labels but the actual ordered stations and public OSM
// track pass the complete geometry, access, and direction checks.  This is
// still a GAME publication, not an operator timetable approval.
const recoveryAudit=parse('data/kr/preview/audit.json');
const endpointless=(recoveryAudit.blocked||[]).filter(row=>
 row.reasons?.length===1&&row.reasons[0]==='CANDIDATE_ENDPOINT_MISMATCH'&&
 Array.isArray(row.candidateEndpoints)&&row.candidateEndpoints.length===2&&
 row.candidateEndpoints.every(v=>v==null||String(v).trim()===''));
const base=abs('data/kr/v2'),network=require('./lib/kr-network'),full=network.load(base);
const verified=network.validate(full,{base});
assert.equal(verified.errors.length,0,'Korean source evidence failed integrity checks');
const maps=verified.maps;
const ways=new Map(parse('data/kr/v2/source/osm-ways.json').map(w=>[String(w.id),w]));
const allServices=new Map(full.services.map(s=>[s.id,s]));
const blockedFamilies=new Set(parse('data/kr/v2/relation-access-policy.json').relations
 .filter(x=>x.passengerCandidate===false).flatMap(x=>x.lineIds||[]));
const previewRestricted=new Set(parse('data/kr/preview-policy.json').blockedServices.map(x=>x.serviceId));
audit.recoveredEndpointless=[];
for(const item of endpointless){
 const service=allServices.get(item.serviceId);
 assert(service&&service.access?.passengerCandidate!==false&&
  !blockedFamilies.has(service.passengerLineId)&&!previewRestricted.has(service.id),
  'Restricted service in endpointless recovery: '+item.serviceId);
 const relationId=String(item.relationId),id='kr-service-'+relationId;
 assert(!byId.has(id),'Duplicate endpointless service '+id);
 const journey=network.assemble(service,maps);
 assert(journey.stations.length>=2&&journey.geometry.length>=2&&
  journey.directedSegments.length===journey.stations.length-1);
 assert(journey.stations.every(st=>/[가-힣]/.test(st.ko)&&st.ko!=='MISSING_KOREAN_NAME'),'Unlabelled station '+id);
 // Verify all *used* track members; unused depot spurs elsewhere in a
 // relation do not qualify as proof of unsafe travel along the chosen path.
 let offset=0;
 const start=service.stops[0].geometryIndex,end=service.stops.at(-1).geometryIndex;
 const track=[];
 for(const part of service.paths){
  const geometry=maps.geometry.get(part.geometryId);
  assert(geometry,'Missing OSM geometry '+id);
  const last=offset+geometry.coordinates.length-1;
  if(last>start&&offset<end){
   const way=ways.get(String(geometry.sourceRef.id));
   assert(way&&['rail','subway','light_rail','tram','monorail','funicular'].includes(way.tags?.railway)&&
    !way.tags.highway&&!['yard','siding','spur'].includes(way.tags.service)&&
    !['private','no'].includes(way.tags.access)&&
    !(way.tags.oneway==='yes'&&part.reverse)&&
    !(way.tags.oneway==='-1'&&!part.reverse),
    'Restricted or unverified railway member '+id+':'+geometry.sourceRef.id);
   track.push({wayId:way.id,version:way.version,
    sourceUrl:'https://www.openstreetmap.org/way/'+way.id});
  }
  offset=last;
 }
 assert(track.length>0,'No verified OSM running track '+id);
 const line=maps['passenger-lines'].get(service.passengerLineId);
 const op=maps.operators.get(service.operatorIds?.[0]);
 // Wolmi Sea Train's imported relation lacks an operator name; Incheon
 // Transit Corporation is the confirmed public operator (2026-09-03 press release).
 const namedOperator=relationId==='14074976'?'인천교통공사':null;
 const operatorName=op?.names?.ko||namedOperator;
 const name=String(line?.names?.ko||service.names?.ko||'').trim();
 assert(line&&name&&operatorName,'Missing passenger line/operator metadata '+id);
 const operatorId=op?.id||'kr-operator-wolmi-incheon-transit';
 if(!op)operators.set(operatorId,{id:operatorId,ko:operatorName,ja:operatorName,en:'Incheon Transit Corporation'});
 const route={
  id,schemaVersion:2,countryId:'kr',category:({subway:'subway',light_rail:'light_rail',monorail:'monorail',tram:'tram',train:'commuter_rail'})[line.mode]||'commuter_rail',
  mode:line.mode==='train'?'rail':line.mode,regionId:line.regionId,
  operatorId,operator:{...op?.names,ja:operatorName,ko:operatorName,en:op?.names?.en||operatorName},
  line:{...line.names,ja:name,ko:name},lineColor:line.color||'#126499',
  passengerLineId:service.passengerLineId,passengerLineName:name,
  sourceRelationId:relationId,sourceServiceId:service.id,directionId:service.directionId,
  ...journey,loop:journey.stations[0].id===journey.stations.at(-1).id,
  services:[{id:service.id,nameKo:name,nameJa:name,nameEn:service.names?.en||name,
   stops:journey.stations.map(st=>st.id)}],
  geometryReady:true,geometryStatus:'ready',playable:true,
  visibility:'public',releaseStatus:'released',playStatus:'RELEASED',
  sourceStatus:'osm-endpointless-geometry',serviceValidationStatus:'external-timetable-unverified'
 };
 const outfile='data/kr/generated/routes/'+id+'.json',rendered=JSON.stringify({route})+'\n';
 fs.mkdirSync(path.dirname(abs(outfile)),{recursive:true});fs.writeFileSync(abs(outfile),rendered);
 const digest=crypto.createHash('sha256').update(JSON.stringify({
  stations:route.stations,geometry:route.geometry,directedSegments:route.directedSegments})).digest('hex');
 const compact={...route,stations:[],geometry:[],directedSegments:[],services:[],lazy:true,
  originNames:{id:route.stations[0].id,ko:route.stations[0].ko},
  destinationNames:{id:route.stations.at(-1).id,ko:route.stations.at(-1).ko},
  lazySource:outfile+'?v='+crypto.createHash('sha256').update(rendered).digest('hex').slice(0,12),
  stationCount:route.stations.length,serviceCount:route.services.length};
 byId.set(id,compact);
 audit.published[id]={sourceRelationId:relationId,legacyId:null,geometrySha256:digest,
  sourceEvidence:{endpointMetadata:'missing-in-source',geometryProvenance:track,
   sourceUrl:'https://www.openstreetmap.org/relation/'+relationId},
  externalTimetableVerified:false};
 audit.recoveredEndpointless.push({id,sourceRelationId:relationId,
  origin:route.stations[0].ko,destination:route.stations.at(-1).ko,
  limitation:'OSM source has no published origin or destination tags'});
}
assert.equal(audit.recoveredEndpointless.length,endpointless.length,
 'Some eligible endpointless game routes were not recovered');
const extraPublished=audit.recoveredEndpointless.length;
const index={...main,operators:[...operators.values()],routes:[...byId.values()]};
index.counts={...main.counts,routes:index.routes.length,gamePublishedServices:published+extraPublished,endpointlessRecovered:extraPublished,sourceRelationExclusions:skipped.length};
fs.writeFileSync(abs(indexPath),JSON.stringify(index)+'\n');
fs.writeFileSync(abs('js/korea-index-data.js'),'/* Published Korean game catalog; external timetables require separate verification. */\nwindow.TRT_KOREA_INDEX='+JSON.stringify(index)+';\n');
fs.mkdirSync(abs('data/kr/evidence'),{recursive:true});
fs.writeFileSync(abs('data/kr/evidence/regular-service-source-audit.json'),JSON.stringify(audit,null,2)+'\n');
const count=index.routes.filter(r=>/^kr-service-/.test(r.id)).length;
assert.equal(count,published+extraPublished);
console.log('KR_REGULAR_GAME_PUBLICATION '+JSON.stringify({existingPassengerRoutes:main.routes.length,regularServiceRoutes:count,recoveredEndpointless:extraPublished,remainingBlocked:recoveryAudit.blocked.length-extraPublished,skipped,finalCatalog:index.routes.length}));
