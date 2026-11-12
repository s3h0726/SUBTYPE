'use strict';
const {assemble}=require('./build-uk-rail.cjs');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/uk');
const read=p=>{let f=path.join(dir,p);if(!fs.existsSync(f))f+='.gz';let b=fs.readFileSync(f);if(f.endsWith('.gz'))b=zlib.gunzipSync(b);return JSON.parse(b.toString().replace(/^\uFEFF/,''))};
const write=(p,d)=>fs.writeFileSync(path.join(dir,p),JSON.stringify(d)+'\n');
const names=Object.fromEntries(['expansion-station-names-ko.txt','station-names-ko.txt','regional-station-names-ko.txt'].flatMap(f=>fs.readFileSync(path.join(dir,f),'utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split('='))));
const nameFileByEnglish=Object.fromEntries(['expansion-station-names-ko.txt','station-names-ko.txt','regional-station-names-ko.txt'].flatMap(file=>fs.readFileSync(path.join(dir,file),'utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>[s.split('=')[0],file])));
const index=read('generated/index.json'),pool=read('generated/geometry.json'),evidence=read('source/regional/release-evidence.json'),validation=read('generated/validation.json'),regionalResults=[];
const national=read('source/national/expansion-ii.json');
for(const network of [...evidence.networks,...national.networks]){
 const routeId='uk-'+network.id,operatorId=network.operatorId||routeId,operator={ko:network.operatorKo,en:network.operatorEn,ja:network.operatorEn},stationMap=new Map(),patterns=[];
 const specs=network.patterns||network.relations.map((relationId,n)=>({relationId,expectedStops:network.expectedStops[n],expectedCalls:network.expectedCalls?.[n]}));
 for(const spec of specs){
  const id=spec.relationId;try{
   const d=read('source/osm/'+id+'.json'),r=d.elements.find(e=>e.type==='relation'&&e.id===id);
   const graphElements=spec.graphRelations?[...new Map(spec.graphRelations.flatMap(id=>read('source/osm/'+id+'.json').elements).map(e=>[e.type+e.id,e])).values()]:d.elements;
   const graphRelations=spec.graphRelations?spec.graphRelations.map(id=>graphElements.find(e=>e.type==='relation'&&e.id===id)):[r];
   const assembled=spec.reviewedGraph?require('./lib/uk-reviewed-graph.cjs').assembleReviewedGraph(graphRelations,graphElements,spec.calls,spec.aliases):spec.calls?require('./lib/uk-osm.cjs').assembleCalls(r,d.elements,spec.calls):assemble(r,d.elements,{reviewedTrackStops:network.reviewedTrackStops});
   const {geometry,refs}=assembled,stops=assembled.stops.slice(spec.fromIndex||0,spec.toIndex===undefined?undefined:spec.toIndex+1),aligned=assembled.aligned.slice(spec.fromIndex||0,spec.toIndex===undefined?undefined:spec.toIndex+1);
   if(stops.length!==spec.expectedStops)throw Error('reviewed-stop-count-mismatch');
   if(spec.expectedCalls&&JSON.stringify(stops.map(s=>s.tags.name))!==JSON.stringify(spec.expectedCalls))throw Error('reviewed-stop-sequence-mismatch');
   const stationIds=stops.map(s=>{const en=s.tags.name,ko=names[en];if(!ko)throw Error('missing-Korean-name:'+en);const key='uk-'+(network.operatorId||network.id)+'-'+crypto.createHash('sha256').update(en.toLowerCase().replace(/[^a-z0-9]/g,'')).digest('hex').slice(0,12);if(!stationMap.has(key))stationMap.set(key,{id:key,stationMasterId:key,physicalStationId:key,countryId:'uk',ja:en,en,romaji:en,ko,kana:'',latitude:s.lat,longitude:s.lon,koVerified:false,koSource:'SUBTYPE editorial Korean dictionary (reviewable)',koSourceUrl:'data/uk/'+nameFileByEnglish[en],osmNodeId:s.id});return key});
   const segmentIds=[];
   for(let i=0;i<stops.length-1;i++){
    const points=geometry.slice(aligned[i],aligned[i+1]+1),nodeIds=refs.slice(aligned[i],aligned[i+1]+1);if(points.length<2)throw Error('empty-segment');
    const key='osm-'+crypto.createHash('sha256').update(nodeIds.join(',')).digest('hex').slice(0,20),pair=stationIds[i]+'::'+stationIds[i+1];
    pool.segments[key]??={geometry:points,nodeIds,stationPairs:[],sourceRelationId:id};if(!pool.segments[key].stationPairs.includes(pair))pool.segments[key].stationPairs.push(pair);segmentIds.push(key);
   }
   const first=stationMap.get(stationIds[0]),last=stationMap.get(stationIds.at(-1)),patternId='uk-osm-'+id+(spec.idSuffix?'-'+spec.idSuffix:''),familyId='uk-pattern-'+crypto.createHash('sha256').update([stationIds.join(','),stationIds.slice().reverse().join(',')].sort()[0]).digest('hex').slice(0,16);
   patterns.push({id:patternId,stationIds,segmentIds,sourceRelationId:id,sourceRelationIds:spec.graphRelations||[id],timetablePage:spec.timetablePage,timetableColumn:spec.timetableColumn,showStoppingPattern:!!spec.timetablePage,familyId,nameKo:network.id==='glasgow-subway'?(id===225658?'외선순환 · 시계방향':'내선순환 · 반시계방향'):first.ko+' → '+last.ko,viaStationId:spec.via?stationIds[stops.findIndex(s=>s.tags.name===spec.via)]:network.id==='blackpool-tramway'&&stops.some(s=>s.tags.name==='North Station')?stationIds[stops.findIndex(s=>s.tags.name==='North Station')]:spec.calls?.includes('MediaCityUK')&&![first.en,last.en].includes('MediaCityUK')?stationIds[spec.calls.indexOf('MediaCityUK')]:undefined,nameEn:spec.calls?first.en+' → '+last.en:r.tags.name,sourceName:r.tags.name,validation:{reviewedRegionalSequence:true,officialSequence:false,trackContinuity:true,stationIdentity:true,maxStationOffsetKm:assembled.maxStationOffsetKm||0},evidence:{officialUrl:network.officialUrl,osmUrl:'https://www.openstreetmap.org/relation/'+id,osmVersion:r.version,osmTimestamp:r.timestamp,checkedAt:evidence.checkedAt}});
   regionalResults.push({lineId:routeId,relationId:id,status:'PASS',stops:stops.length});
  }catch(error){regionalResults.push({lineId:routeId,relationId:id,status:'BLOCKED',reason:error.message})}
 }
 if(!patterns.length)continue;
 if(network.defaultPatternId)patterns.sort((a,b)=>Number(b.id===network.defaultPatternId)-Number(a.id===network.defaultPatternId));
 const stations=[...stationMap.values()],route={schemaVersion:1,id:routeId,countryId:'uk',mode:network.category==='tram'?'tram':'rail',category:network.category,operatorId,operator,line:{ja:network.lineEn,en:network.lineEn,ko:network.lineKo},lineColor:network.color,stationCatalog:stations,stations,patterns,playable:true,geometryReady:true,geometryStatus:'verified-osm-track',geometrySource:{type:'openstreetmap',license:'ODbL-1.0',officialUrl:network.officialUrl,attribution:'© OpenStreetMap contributors'},services:patterns.map(p=>({id:p.id,nameKo:p.nameKo,nameJa:p.nameEn,nameEn:p.nameEn,stops:p.stationIds})),serviceCount:patterns.length};
 write('generated/routes/'+routeId+'.json',route);
 index.routes.push({...route,stations:undefined,stationCatalog:undefined,patterns:undefined,services:undefined,lazy:true,lazySource:'data/uk/generated/routes/'+routeId+'.json',stationCount:stations.length,stationSequence:stations.map(s=>s.id),searchStations:stations.flatMap(s=>[s.ko,s.en])});
 if(!index.operators.some(o=>o.id===operatorId))index.operators.push({id:operatorId,names:operator});
}
const routes=index.routes.map(r=>read('generated/routes/'+r.id+'.json'));
const published=read('source/released-baseline-20261108.json'),publishedIds=new Set(published.routes.flatMap(r=>r.stationCatalog.map(s=>s.id))),groups=new Map();
const normalizedName=s=>s.en.toLowerCase().replace(/^london /,'').replace(/[^a-z0-9]/g,'');
// A shared name alone is insufficient (London and Merseyside both have Waterloo).
// Preserve published hub IDs; merge new records only with the same normalized
// English name, same Korean name, and coordinates within 500 metres.
for(const s of routes.flatMap(r=>r.stationCatalog).sort((a,b)=>Number(publishedIds.has(b.id))-Number(publishedIds.has(a.id)))){
 const key=normalizedName(s),near=(groups.get(key)||[]).find(t=>t.ko===s.ko&&Math.hypot((t.latitude-s.latitude)*111.195,(t.longitude-s.longitude)*111.195*Math.cos(s.latitude*Math.PI/180))<.5);
 if(near&&!publishedIds.has(s.id))s.physicalStationId=near.physicalStationId||near.stationMasterId;
 if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);
}
const geometryBuckets=new Map(),segmentBucket=new Map();
for(const [id,segment]of Object.entries(pool.segments)){
 const [lat,lon]=segment.geometry[0],file='data/uk/generated/geometry/'+Math.floor(lat*4)+'_'+Math.floor(lon*4)+(segment.nodeIds.length>400?'_long':'')+'.json';
 if(!geometryBuckets.has(file))geometryBuckets.set(file,{segments:{}});geometryBuckets.get(file).segments[id]=segment;segmentBucket.set(id,file);
}
fs.mkdirSync(path.join(dir,'generated/geometry'),{recursive:true});
for(const name of fs.readdirSync(path.join(dir,'generated/geometry'))){const file='data/uk/generated/geometry/'+name;if(/^\d+_-?\d+(?:_long)?\.json$/.test(name)&&!geometryBuckets.has(file))fs.unlinkSync(path.join(root,file))}
for(const [file,payload]of geometryBuckets)fs.writeFileSync(path.join(root,file),JSON.stringify(payload)+'\n');
for(const r of routes){const byId=new Map(r.stationCatalog.map(s=>[s.id,s]));r.stations=r.stations.map(s=>({...s,...byId.get(s.id)}));r.geometryFiles=[...new Set(r.patterns.flatMap(p=>p.segmentIds).map(id=>segmentBucket.get(id)))].sort();index.routes.find(meta=>meta.id===r.id).geometryFiles=r.geometryFiles;write('generated/routes/'+r.id+'.json',r)}
const stationIds=new Set(routes.flatMap(r=>r.stationCatalog.map(s=>s.id))),physicalIds=new Set(routes.flatMap(r=>r.stationCatalog.map(s=>s.physicalStationId||s.stationMasterId)));
index.stationNameIndex=[...new Map(routes.flatMap(r=>r.stationCatalog).map(s=>[s.id,{id:s.id,nameGroup:(s.physicalStationId||s.stationMasterId)+'::'+s.ko}])).values()];
write('generated/index.json',index);write('generated/geometry.json',pool);
Object.assign(validation,{operators:index.operators.length,lines:routes.length,servicePatterns:routes.reduce((n,r)=>n+new Set(r.patterns.map(p=>p.familyId)).size,0),playableDirections:routes.reduce((n,r)=>n+r.patterns.length,0),uniqueStations:stationIds.size,uniquePhysicalStationGroups:physicalIds.size,koreanNamedStations:stationIds.size,sharedSegments:Object.keys(pool.segments).length,regionalResults,linesDetail:index.routes.map(r=>({id:r.id,name:r.line.en,stationCount:r.stationCount,directions:r.serviceCount}))});
write('generated/validation.json',validation);console.log(JSON.stringify({operators:validation.operators,lines:validation.lines,directions:validation.playableDirections,uniqueStations:stationIds.size,regionalResults},null,2));
