#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const index=JSON.parse(read('data/kr/generated/index.json'));
const errors=[];
const ready=[];
const quarantined=[];

const loader=read('js/data-loader.js');
const renderer=read('js/route-renderer.js');
const freeDrive=read('js/free-drive.js');
const networkMap=read('js/network-map.js');
const html=read('index.html');
if((loader+renderer+freeDrive+networkMap).includes('TRT_KOREA_TRACK_GEOMETRY'))errors.push('runtime still consumes unverified global Korean track geometry');
if(/geometryReady\s*=\s*true/.test(loader))errors.push('data loader can promote geometryReady at runtime');
if(renderer.includes('koreaTrackGeometry'))errors.push('renderer still performs nearest-track Korean geometry matching');
if(html.includes('js/kr-tracks-'))errors.push('unverified Korean track bundles are still loaded by the app');
if(!renderer.includes("route.geometryReady!==true"))errors.push('renderer lacks a strict Korean geometryReady gate');
if(!freeDrive.includes("r.countryId!=='kr'||r.geometryReady===true"))errors.push('free drive lacks a strict Korean geometryReady gate');
if(!networkMap.includes("route.geometryReady!==true"))errors.push('network map lacks a strict Korean geometryReady gate');

for(const meta of index.routes||[]){
  const payload=JSON.parse(read(meta.lazySource));
  const route=payload.route;
  if(route.operatorId!==meta.operatorId)errors.push(`${meta.id}: operator metadata differs between index and detail`);
  if(typeof route.gameValidationStatus!=='string')errors.push(`${meta.id}: missing gameValidationStatus`);
  if(typeof route.releaseStatus!=='string')errors.push(`${meta.id}: missing releaseStatus`);
  const directions=route.directions||[];
  const hasCandidate=directions.some(direction=>(direction.geometry||[]).length||(direction.directedSegments||[]).length);
  if(meta.geometryReady===true||route.geometryReady===true){
    ready.push(meta.id);
    if(meta.geometryReady!==true||route.geometryReady!==true)errors.push(`${meta.id}: index/detail readiness mismatch`);
    if(meta.geometryStatus!=='ready'||route.geometryStatus!=='ready')errors.push(`${meta.id}: ready route lacks ready status`);
    if(route.sourceLicenseStatus!=='verified')errors.push(`${meta.id}: ready route lacks verified source license`);
    for(const direction of directions){
      if(direction.geometryStatus!=='ready')errors.push(`${meta.id}/${direction.id}: direction is not ready`);
      if(direction.directedSegments?.length!==(direction.stops?.length||0)-1)errors.push(`${meta.id}/${direction.id}: segment count mismatch`);
      for(const segment of direction.directedSegments||[]){
        if(segment.geometryStatus!=='ready')errors.push(`${meta.id}/${direction.id}: unverified segment in ready route`);
        if(!segment.source?.osmWayIds?.length&&!segment.source?.officialGeometryId)errors.push(`${meta.id}/${direction.id}: segment has no traceable source IDs`);
      }
    }
  }else if(hasCandidate){
    quarantined.push(meta.id);
    if(meta.geometryStatus!=='quarantined'||route.geometryStatus!=='quarantined')errors.push(`${meta.id}: candidate geometry is not quarantined`);
  }
}

const report={status:errors.length?'FAIL':'PASS',routes:index.routes.length,ready,quarantined,errors};
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
