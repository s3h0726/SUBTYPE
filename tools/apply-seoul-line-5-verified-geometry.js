#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const write=(relative,value)=>fs.writeFileSync(path.join(root,relative),JSON.stringify(value,null,2)+'\n');
const candidatePath='data/kr/rebuild/geometry/kr-seoul-line-5.candidate.json';
const linePath='data/kr/rebuild/passenger-lines/kr-seoul-line-5.json';
const reportPath='data/kr/audit/SEOUL_LINE_5_OFFICIAL_ORDER.json';
const indexPath='data/kr/generated/index.json';
const candidate=read(candidatePath),line=read(linePath),report=read(reportPath),index=read(indexPath);
const artifacts=['kr-metro-5','kr-metro-5-section-2','kr-metro-5-section-3'],errors=[];
const stopName=stop=>stop?.names?.ko||stop?.ko||'';
const samePoint=(a,b)=>Number(a?.[0])===Number(b?.[0])&&Number(a?.[1])===Number(b?.[1]);
if(report.result!=='PASS'||candidate.officialOrderValidation?.status!=='passed')errors.push('official order/topology validation has not passed');
if(candidate.source?.license!=='ODbL-1.0'||candidate.source?.osmRouteMasterRelationId!==7879871)errors.push('traceable OSM source metadata is missing');
for(const artifact of artifacts)for(const direction of candidate.directions?.filter(item=>item.artifact===artifact)||[]){
  if(!direction.validation?.orderedStopsExact||!direction.validation?.wayMemberOrderContinuous||!direction.validation?.stationNodesOnWaysExact||direction.validation?.nearestTrackMatchingUsed!==false)errors.push(`${artifact}/${direction.direction}: topology validation incomplete`);
  if(direction.directedSegments?.length!==direction.stopNames?.length-1)errors.push(`${artifact}/${direction.direction}: segment count mismatch`);
}
if(errors.length){console.error(JSON.stringify({status:'FAIL',errors},null,2));process.exit(1)}

function hydrateDirection(route,source){
  const existing=route.directions.find(item=>item.id===source.direction);if(!existing)throw new Error(`${route.id}/${source.direction}: generated direction missing`);
  const buckets=new Map;for(const stop of existing.stops||[]){const name=stopName(stop);if(!buckets.has(name))buckets.set(name,[]);buckets.get(name).push(stop)}
  const used=new Map,stops=source.stopNames.map(name=>{const offset=used.get(name)||0,stop=buckets.get(name)?.[offset];used.set(name,offset+1);if(!stop)throw new Error(`${route.id}/${source.direction}: stop not found: ${name}`);return{...stop}});
  const geometry=[],directedSegments=[];
  source.directedSegments.forEach((segment,index)=>{
    let points=segment.geometry.map(point=>[Number(point[0]),Number(point[1])]);if(points.length<2)throw new Error(`${route.id}/${source.direction}: empty segment`);
    stops[index].geometryIndex=Math.max(0,geometry.length-1);
    if(geometry.length){if(!samePoint(geometry.at(-1),points[0]))throw new Error(`${route.id}/${source.direction}: discontinuous geometry`);points=points.slice(1)}
    geometry.push(...points);directedSegments.push({fromStationId:stops[index].id,toStationId:stops[index+1].id,geometry:segment.geometry.map(point=>[Number(point[0]),Number(point[1])]),geometryStatus:'ready',source:segment.source,endpointMismatch:false});
  });
  stops.at(-1).geometryIndex=geometry.length-1;
  return{...existing,names:{...(existing.names||{}),ko:source.name},stops,geometry,directedSegments,geometryStatus:'ready',geometrySource:{...candidate.source,osmRelationId:source.relationId},geometryValidation:{...source.validation,officialOrderStatus:'passed',officialOrderReport:reportPath}};
}

for(const artifact of artifacts){
  const relative=`data/kr/generated/routes/${artifact}.json`,payload=read(relative),route=payload.route,directions=candidate.directions.filter(item=>item.artifact===artifact).map(item=>hydrateDirection(route,item)),primary=directions.find(item=>item.id==='forward')||directions[0];
  payload.route={...route,names:{...(route.names||{}),ko:line.passengerLineName.ko,en:line.passengerLineName.en},line:{...(route.line||{}),ko:line.passengerLineName.ko,en:line.passengerLineName.en},passengerLineId:'kr-passenger-metro-5',passengerLineName:line.passengerLineName.ko,sourceStatus:'osm-topology-and-official-order-validated',sourceLicenseStatus:'verified',source:{name:'OpenStreetMap route relations',url:'https://www.openstreetmap.org/relation/7879871',license:'ODbL-1.0',attribution:candidate.source.attribution,snapshot:candidate.source.file},geometryStatus:'ready',geometryReady:true,gameValidationStatus:'browser-pending',releaseStatus:'geometry-validated-game-pending',serviceValidationStatus:'official-order-validated',stations:primary.stops,directions,geometry:primary.geometry,directedSegments:primary.directedSegments};
  write(relative,payload);
  const meta=index.routes.find(item=>item.id===artifact);if(!meta)throw new Error(`${artifact}: index entry missing`);
  Object.assign(meta,{names:payload.route.names,line:payload.route.line,passengerLineId:'kr-passenger-metro-5',passengerLineName:line.passengerLineName.ko,sourceStatus:payload.route.sourceStatus,sourceLicenseStatus:'verified',source:payload.route.source,geometryStatus:'ready',geometryReady:true,gameValidationStatus:'browser-pending',releaseStatus:'geometry-validated-game-pending',serviceValidationStatus:'official-order-validated'});
}
candidate.geometryStatus='ready';candidate.geometryReady=true;candidate.gameValidationStatus='browser-pending';candidate.directions=candidate.directions.map(direction=>({...direction,geometryStatus:'ready',validation:{...direction.validation,runtimeArtifactIntegrated:true}}));
line.geometryReady=true;line.geometryValidationStatus='topology-official-order-and-runtime-validated';line.gameValidationStatus='browser-pending';line.releaseStatus='geometry-validated-game-pending';line.sourceRefs=line.sourceRefs.map(ref=>ref.kind==='osm-route-master'?{...ref,verificationStatus:'topology-official-order-and-runtime-validated'}:ref);line.operatingPatterns=line.operatingPatterns.map(pattern=>({...pattern,serviceValidationStatus:'official-order-and-runtime-validated',geometryValidationStatus:'ready',gameValidationStatus:'browser-pending'}));
write(candidatePath,candidate);write(linePath,line);write(indexPath,index);fs.writeFileSync(path.join(root,'js','korea-index-data.js'),`/* PROVISIONAL KOREAN METRO INDEX — verification required. */\nwindow.TRT_KOREA_INDEX=${JSON.stringify(index)};\n`);
console.log(JSON.stringify({status:'PASS',passengerLineId:line.id,artifacts,directions:6,segments:candidate.directions.reduce((sum,item)=>sum+item.directedSegments.length,0),geometryReady:true,gameValidationStatus:'browser-pending'},null,2));
