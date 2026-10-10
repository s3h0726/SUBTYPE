#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const line=read('data/kr/rebuild/passenger-lines/kr-seoul-line-2.json');
const candidate=read('data/kr/rebuild/geometry/kr-seoul-line-2.candidate.json');
const errors=[];
if(line.id!=='kr-seoul-line-2'||line.passengerLineName?.ko!=='서울 지하철 2호선')errors.push('canonical passenger line identity mismatch');
if(line.operatingPatterns?.length!==3)errors.push('Line 2 must expose main loop, Seongsu branch, and Sinjeong branch from one card');
for(const id of ['kr-seoul-line-2-main-loop','kr-seoul-line-2-seongsu-branch','kr-seoul-line-2-sinjeong-branch'])if(!line.operatingPatterns.some(pattern=>pattern.id===id))errors.push(`missing operating pattern ${id}`);
if(candidate.source?.osmRouteMasterRelationId!==7625892||candidate.source?.license!=='ODbL-1.0')errors.push('OSM route master provenance mismatch');
if(candidate.geometryReady!==false||line.geometryReady!==false)errors.push('pilot route was promoted before official-order and game validation');
if(candidate.directions?.length!==6)errors.push('expected six directional patterns');
for(const direction of candidate.directions||[]){
  if(direction.directedSegments?.length!==direction.stopNames?.length-1)errors.push(`${direction.relationId}: station segment count mismatch`);
  if(!direction.validation?.orderedStopsExact||!direction.validation?.wayMemberOrderContinuous||!direction.validation?.stationNodesOnWaysExact)errors.push(`${direction.relationId}: topology evidence incomplete`);
  if(direction.validation?.nearestTrackMatchingUsed!==false)errors.push(`${direction.relationId}: nearest-track matching was used`);
  for(const segment of direction.directedSegments||[]){
    if(segment.geometry?.length<2)errors.push(`${direction.relationId}: empty segment ${segment.from} -> ${segment.to}`);
    if(!segment.source?.osmWayIds?.length)errors.push(`${direction.relationId}: segment lacks OSM way IDs`);
  }
}
const result={status:errors.length?'FAIL':'PASS',passengerLineCards:1,operatingPatterns:line.operatingPatterns?.length||0,directions:candidate.directions?.length||0,segments:(candidate.directions||[]).reduce((sum,direction)=>sum+(direction.directedSegments?.length||0),0),geometryReady:false,errors};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
