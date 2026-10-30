#!/usr/bin/env node
'use strict';
// Name-only, exact-ID guarded Namuwiki batch. No fabricated tracks / closures,
// no branch merges, no station order changes and no service activation.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {projectRoot,discoverLineFolders,loadStations,read,writeAtomic}=require('./lib/line-workspaces');
const root=projectRoot,manifest=read(path.join(root,'data/jr-namuwiki-destination-batch-20261031.json'));
const apply=process.argv.includes('--apply'),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const folders=discoverLineFolders();
const catalog=new Map(folders.map(folder=>{const file=path.join(folder,'line.json'),line=read(file);return[line.id,{folder,file,line}]}));
const stations=loadStations(),shards=new Map,records=[],review=[],touched=new Set,seen=new Set;
const before={lines:folders.length,stations:stations.map.size,relations:new Map(),tracks:new Map()};
for(const {folder,line} of catalog.values()){
 before.relations.set(line.id,hash(read(path.join(folder,'stations.json'))));
 before.tracks.set(line.id,hash(read(path.join(folder,'geometry.json'))));
}
function record(kind,id,field,oldValue,newValue,source){if(oldValue!==newValue)records.push({kind,id,field,oldValue,newValue,source});}
function verifyURL(entry){if(!/^https:\/\/namu\.moe\/w\/\S+$/.test(entry?.source?.url||''))throw Error('Invalid source URL: '+JSON.stringify(entry));}
for(const item of manifest.lines){
 verifyURL(item);
 const entry=catalog.get(item.id);if(!entry)throw Error('Missing JR source line: '+item.id);
 if(!entry.line.operatorId?.startsWith('jr-'))throw Error('Not JR company: '+item.id);
 if(entry.line.names?.ja!==item.expectedJa)throw Error('JR Japanese identity mismatch: '+item.id+' '+entry.line.names?.ja);
 const relations=read(path.join(entry.folder,'stations.json'));
 if(!Array.isArray(relations)||relations.length<2)throw Error('Missing canonical stop relations '+item.id);
 const first=stations.map.get(relations[0].stationId),last=stations.map.get(relations.at(-1).stationId);
 const routeScoped=read(path.join(root,'data/japan-route-station-names.json')).routes?.[item.id]||{};
 const firstJa=routeScoped[first?.id]?.ja||first?.names?.ja,lastJa=routeScoped[last?.id]?.ja||last?.names?.ja;
 if(firstJa!==item.expectedStartJa||lastJa!==item.expectedEndJa){
  throw Error('Unexpected stop boundaries for '+item.id+': '+firstJa+' -> '+lastJa+' / wanted '+item.expectedStartJa+' -> '+item.expectedEndJa);
 }
 const oldKo=entry.line.names.ko;
 if(oldKo!==item.expectedKo&&oldKo!==item.ko)throw Error('Source line Korean changed, manual review: '+item.id+' '+oldKo);
 const current=entry.line;
 record('line',item.id,'ko',oldKo,item.ko,item.source.url);
 if(apply){
  current.names.ko=item.ko;
  current.namuwikiDestination={url:item.source.url,article:item.source.title,scope:item.source.scope,checkedDate:manifest.batchDate,
   routeStartJa:firstJa,routeEndJa:lastJa,status:'IDENTITY_AND_ROUTE_BOUNDS_CROSSCHECKED',
   scopeNotice:'Article may verify physical line or individual station name, not every current train timetable service'};
  writeAtomic(entry.file,current);touched.add(path.relative(root,entry.file));
 }
 seen.add('line:'+item.id);
}
for(const item of manifest.stations){
 verifyURL(item);
 const source=stations.map.get(item.id),file=stations.shards.get(item.id);
 if(!source||!file)throw Error('Missing station canonical record '+item.id);
 if(source.names?.ja!==item.expectedJa)throw Error('Station Japanese identity mismatch '+item.id);
 if(source.koVerified===true&&source.names.ko!==item.names.ko&&source.koSourceFamily!=='namuwiki')
  throw Error('Protected previously verified station name mismatch '+item.id);
 if(!shards.has(file))shards.set(file,read(file));
 const target=shards.get(file).find(st=>st.id===item.id);
 if(!target)throw Error('Cannot locate station in shard: '+item.id);
 for(const key of ['ko','kana','en']){
  const newValue=item.names[key],oldValue=target.names?.[key];
  if(!newValue||typeof newValue!=='string')throw Error('Missing new '+key+' '+item.id);
  record('station',item.id,key,oldValue,newValue,item.source.url);
  if(apply)target.names[key]=newValue;
 }
 if(apply){
  target.koSourceFamily='namuwiki';target.koSource='namuwiki-manual';target.koSourceMethod='manual';
  target.koSourceUrl=item.source.url;target.koVerified=true;target.koVerifiedDate=manifest.batchDate;
  target.koConfidence='HIGH';target.koReviewStatus='VERIFIED';target.canonicalKoreanPolicy='namuwiki';
  target.namuwikiDestinationIdentity={article:item.source.title,ja:item.expectedJa,ko:item.names.ko,
   url:item.source.url,scope:item.source.scope,verifiedDate:manifest.batchDate};
  touched.add(path.relative(root,file));
 }
 seen.add('station:'+item.id);
}
if(apply)for(const [file,items] of shards)writeAtomic(file,items);
const after=loadStations(),foldersAfter=discoverLineFolders(),missing=[];
if(foldersAfter.length!==before.lines||after.map.size!==before.stations)throw Error('Source inventory changed');
for(const {folder,line} of catalog.values()){
 if(hash(read(path.join(folder,'stations.json')))!==before.relations.get(line.id))missing.push('STATIONS_CHANGED:'+line.id);
 if(hash(read(path.join(folder,'geometry.json')))!==before.tracks.get(line.id))missing.push('GEOMETRY_CHANGED:'+line.id);
}
if(missing.length)throw Error('JR DATA PRESERVATION VIOLATED '+missing.slice(0,8));
const report={schemaVersion:1,date:manifest.batchDate,status:'PASS',applied:apply,
 scopedRailwayRoutes:manifest.lines.length,scopedStations:manifest.stations.length,
 changedFields:records.length,changedEntries:new Set(records.map(r=>r.kind+':'+r.id)).size,
 untouchedJRLineCards:'Every other JR route retained original canonical names',
 preserved:{lines:before.lines,stations:before.stations,geometryAltered:0,relationsAltered:0,servicesAltered:0},
 excluded:manifest.excluded,review,records,touchedFiles:[...touched].sort()};
if(apply)writeAtomic(path.join(root,'reports/jr/namuwiki-destination-batch-applied.json'),report);
console.log(JSON.stringify({status:'PASS',applied:apply,correctedRoutes:manifest.lines.length,stations:manifest.stations.length,changedFields:records.length,touched:touched.size,trackPreservation:'PASS'},null,2));
