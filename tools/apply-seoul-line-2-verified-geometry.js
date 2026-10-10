#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const write=(relative,value)=>fs.writeFileSync(path.join(root,relative),JSON.stringify(value,null,2)+'\n');
const candidatePath='data/kr/rebuild/geometry/kr-seoul-line-2.candidate.json';
const linePath='data/kr/rebuild/passenger-lines/kr-seoul-line-2.json';
const officialReportPath='data/kr/audit/SEOUL_LINE_2_OFFICIAL_ORDER.json';
const indexPath='data/kr/generated/index.json';
const candidate=read(candidatePath),line=read(linePath),officialReport=read(officialReportPath),index=read(indexPath);
const errors=[];
const requiredArtifacts=['kr-metro-2','kr-metro-2-section-2','kr-metro-2-section-3'];
const pointEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&Number(a[0])===Number(b[0])&&Number(a[1])===Number(b[1]);
const stopName=stop=>stop?.names?.ko||stop?.ko||'';

if(officialReport.result!=='PASS'||candidate.officialOrderValidation?.status!=='passed')errors.push('official station-order validation has not passed');
if(candidate.source?.license!=='ODbL-1.0'||!candidate.source?.osmRouteMasterRelationId)errors.push('traceable OSM source metadata is missing');
for(const artifact of requiredArtifacts){
  const directions=candidate.directions?.filter(item=>item.artifact===artifact)||[];
  if(directions.length!==2)errors.push(`${artifact}: expected two verified directions`);
  for(const direction of directions){
    if(!direction.validation?.orderedStopsExact||!direction.validation?.wayMemberOrderContinuous||!direction.validation?.stationNodesOnWaysExact||direction.validation?.nearestTrackMatchingUsed!==false)errors.push(`${artifact}/${direction.direction}: topology validation incomplete`);
    if(direction.directedSegments?.length!==direction.stopNames?.length-1)errors.push(`${artifact}/${direction.direction}: segment count mismatch`);
  }
}
if(errors.length){console.error(JSON.stringify({status:'FAIL',errors},null,2));process.exit(1)}

function hydrateDirection(route,candidateDirection){
  const existing=route.directions.find(item=>item.id===candidateDirection.direction);
  if(!existing)throw new Error(`${route.id}/${candidateDirection.direction}: generated direction missing`);
  const stopsByName=new Map;
  for(const stop of existing.stops||[]){const name=stopName(stop);if(!stopsByName.has(name))stopsByName.set(name,[]);stopsByName.get(name).push(stop)}
  const seen=new Map,stops=candidateDirection.stopNames.map(name=>{const offset=seen.get(name)||0,source=stopsByName.get(name)?.[offset];seen.set(name,offset+1);if(!source)throw new Error(`${route.id}/${candidateDirection.direction}: stop not found: ${name}`);return{...source}});
  const geometry=[],directedSegments=[];
  candidateDirection.directedSegments.forEach((source,index)=>{
    let points=source.geometry.map(point=>[Number(point[0]),Number(point[1])]);
    if(points.length<2)throw new Error(`${route.id}/${candidateDirection.direction}: empty geometry ${source.from} -> ${source.to}`);
    stops[index].geometryIndex=Math.max(0,geometry.length-1);
    if(geometry.length){if(!pointEqual(geometry.at(-1),points[0]))throw new Error(`${route.id}/${candidateDirection.direction}: discontinuous geometry ${source.from} -> ${source.to}`);points=points.slice(1)}
    geometry.push(...points);
    directedSegments.push({
      fromStationId:stops[index].id,
      toStationId:stops[index+1].id,
      geometry:source.geometry.map(point=>[Number(point[0]),Number(point[1])]),
      geometryStatus:'ready',
      source:source.source,
      endpointMismatch:false
    });
  });
  stops.at(-1).geometryIndex=Math.max(0,geometry.length-1);
  return{...existing,names:{...(existing.names||{}),ko:candidateDirection.name},stops,geometry,directedSegments,geometryStatus:'ready',geometrySource:{...candidate.source,osmRelationId:candidateDirection.relationId},geometryValidation:{...candidateDirection.validation,officialOrderStatus:'passed',officialOrderReport:officialReportPath}};
}

for(const artifact of requiredArtifacts){
  const relative=`data/kr/generated/routes/${artifact}.json`,payload=read(relative),route=payload.route;
  const directions=candidate.directions.filter(item=>item.artifact===artifact).map(item=>hydrateDirection(route,item));
  const primary=directions.find(item=>item.id==='forward')||directions[0];
  const canonicalPattern=line.operatingPatterns.find(pattern=>pattern.artifactRouteId===artifact);
  payload.route={...route,passengerLineId:line.id,passengerLineName:line.passengerLineName.ko,operatingPatternId:canonicalPattern?.id||route.operatingPatternId,operatingPatternName:canonicalPattern?.name,sourceStatus:'osm-topology-and-official-order-validated',sourceLicenseStatus:'verified',source:{name:'OpenStreetMap route relations',url:`https://www.openstreetmap.org/relation/${candidate.source.osmRouteMasterRelationId}`,license:candidate.source.license,attribution:candidate.source.attribution,snapshot:candidate.source.file},geometryStatus:'ready',geometryReady:true,gameValidationStatus:'browser-pending',releaseStatus:'geometry-validated-game-pending',serviceValidationStatus:'official-order-validated',stations:primary.stops,directions,geometry:primary.geometry,directedSegments:primary.directedSegments};
  write(relative,payload);
  const meta=index.routes.find(item=>item.id===artifact);
  if(!meta)throw new Error(`${artifact}: generated index entry missing`);
  Object.assign(meta,{passengerLineId:line.id,passengerLineName:line.passengerLineName.ko,operatingPatternId:canonicalPattern?.id||meta.operatingPatternId,operatingPatternName:canonicalPattern?.name,sourceStatus:payload.route.sourceStatus,sourceLicenseStatus:'verified',source:payload.route.source,geometryStatus:'ready',geometryReady:true,gameValidationStatus:'browser-pending',releaseStatus:'geometry-validated-game-pending',serviceValidationStatus:'official-order-validated'});
}

candidate.geometryStatus='ready';
candidate.geometryReady=true;
candidate.gameValidationStatus='browser-pending';
candidate.directions=candidate.directions.map(direction=>({...direction,geometryStatus:'ready',validation:{...direction.validation,officialOrderStatus:'passed',runtimeArtifactIntegrated:true}}));
line.geometryReady=true;
line.geometryValidationStatus='topology-and-official-order-validated';
line.gameValidationStatus='browser-pending';
line.releaseStatus='geometry-validated-game-pending';
line.operatingPatterns=line.operatingPatterns.map(pattern=>({...pattern,geometryValidationStatus:'ready',gameValidationStatus:'browser-pending'}));
write(candidatePath,candidate);
write(linePath,line);
write(indexPath,index);
fs.writeFileSync(path.join(root,'js','korea-index-data.js'),`/* PROVISIONAL KOREAN METRO INDEX — verification required. */\nwindow.TRT_KOREA_INDEX=${JSON.stringify(index)};\n`);
console.log(JSON.stringify({status:'PASS',passengerLineId:line.id,artifacts:requiredArtifacts,directions:6,segments:candidate.directions.reduce((sum,item)=>sum+item.directedSegments.length,0),geometryReady:true,gameValidationStatus:'browser-pending'},null,2));
