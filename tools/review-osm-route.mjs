#!/usr/bin/env node
// Safe wrapper around the legacy OSM importer, which normally rewrites its stops file.
// This wrapper passes a temporary COPY of the stops registry and only emits review artifacts.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const get=k=>args[args.indexOf('--'+k)+1];
const input=get('input'),relation=get('relation'),route=get('route'),direction=get('direction');
const directionFile=get('direction-file'),stopsFile=get('stops-file');
if(!/^\d+$/.test(relation||'')||![route,direction].every(v=>/^[a-z0-9_-]{1,100}$/i.test(v||''))||!input||!directionFile||!stopsFile){
 console.error('Usage: node tools/review-osm-route.mjs --input reports/osm/candidates/relation-ID.osm --relation ID --route ROUTE --direction DIR --direction-file data/...json --stops-file data/...json');
 process.exit(2);
}
const resolveSource=rel=>{
 const p=path.resolve(root,rel);
 if(!p.startsWith(root+path.sep))throw Error('Source must be within repository');
 if(!fs.existsSync(p))throw Error('Missing '+rel);
 return p;
};
const srcInput=resolveSource(input),srcDirection=resolveSource(directionFile),srcStops=resolveSource(stopsFile);
const checksum=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const before=checksum(srcStops),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'subtype-osm-'));
const safeStops=path.join(tmp,'stops.json'),resultFile=path.join(tmp,'result.json');
try{
 fs.copyFileSync(srcStops,safeStops);
 const command=[path.join(root,'tools/import-osm-route-geometry.js'),'--input',srcInput,'--relation',relation,'--route',route,'--direction',direction,'--direction-file',srcDirection,'--stops-file',safeStops,'--output',resultFile];
 const proc=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
 if(proc.status!==0)throw Error(proc.stderr||proc.stdout||'OSM importer failed');
 if(checksum(srcStops)!==before)throw Error('Canonical stop registry unexpectedly changed');
 const result=JSON.parse(fs.readFileSync(resultFile,'utf8'));
 const updated=JSON.parse(fs.readFileSync(safeStops,'utf8'));
 const byId=new Map(updated.stops.map(s=>[s.id,s]));
 const toLonLat=p=>[p[1],p[0]];
 const features=[{type:'Feature',properties:{routeId:route,directionId:direction,source:'OpenStreetMap',reviewOnly:true},geometry:{type:'LineString',coordinates:result.geometry.map(toLonLat)}}];
 for(const match of result.identityAudit){
  const loc=byId.get(match.stationId)?.coordinates;
  if(Number.isFinite(loc?.lat)&&Number.isFinite(loc?.lng))features.push({type:'Feature',properties:{id:match.stationId,name:match.canonicalName},geometry:{type:'Point',coordinates:[loc.lng,loc.lat]}});
 }
 const folder=path.join(root,'reports','osm','candidates');fs.mkdirSync(folder,{recursive:true});
 const prefix='route-'+route+'-'+direction;
 fs.writeFileSync(path.join(folder,prefix+'.geojson'),JSON.stringify({type:'FeatureCollection',features},null,2)+'\n');
 fs.writeFileSync(path.join(folder,prefix+'.review.json'),JSON.stringify({source:input,relation,route,direction,validation:result.validation,identityAudit:result.identityAudit,status:'REVIEW_ONLY',canonicalStopRegistryUnchanged:true},null,2)+'\n');
 console.log(JSON.stringify({status:'REVIEW_ONLY',geometry:('reports/osm/candidates/'+prefix+'.geojson'),stopCount:result.identityAudit.length,canonicalStopRegistryUnchanged:true}));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
