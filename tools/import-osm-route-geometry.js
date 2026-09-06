#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2).reduce((result,value,index,list)=>{if(value.startsWith('--'))result[value.slice(2)]=list[index+1]&&!list[index+1].startsWith('--')?list[index+1]:true;return result},{});
const required=name=>{if(!args[name])throw new Error(`Missing --${name}`);return args[name]};
const decode=value=>String(value||'').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const attrs=value=>{const result={};for(const match of value.matchAll(/([:\w-]+)="([^"]*)"/g))result[match[1]]=decode(match[2]);return result};
const tags=value=>Object.fromEntries([...String(value||'').matchAll(/<tag\b([^>]*)\/>/g)].map(match=>{const data=attrs(match[1]);return[data.k,data.v]}));
const parseXml=xml=>{
  const nodes=new Map,ways=new Map,relations=new Map;
  for(const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)){const data=attrs(match[1]);nodes.set(data.id,{id:data.id,lat:Number(data.lat),lng:Number(data.lon),tags:tags(match[2])})}
  for(const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)){const data=attrs(match[1]),body=match[2];ways.set(data.id,{id:data.id,nodes:[...body.matchAll(/<nd\b([^>]*)\/>/g)].map(item=>attrs(item[1]).ref),tags:tags(body)})}
  for(const match of xml.matchAll(/<relation\b([^>]*)>([\s\S]*?)<\/relation>/g)){const data=attrs(match[1]),body=match[2];relations.set(data.id,{id:data.id,members:[...body.matchAll(/<member\b([^>]*)\/>/g)].map(item=>attrs(item[1])),tags:tags(body)})}
  return{nodes,ways,relations};
};
const same=(a,b)=>a===b;
function orientWays(memberIds,ways){
  const source=memberIds.map(id=>ways.get(id)).filter(Boolean);if(source.length!==memberIds.length)throw new Error(`OSM response lacks ${memberIds.length-source.length} member ways`);
  const oriented=[];let gaps=0;
  for(let index=0;index<source.length;index++){
    let refs=source[index].nodes.slice();
    if(index===0&&source[1]){const next=source[1].nodes;if(!next.some(id=>same(id,refs.at(-1)))&&next.some(id=>same(id,refs[0])))refs.reverse()}
    else if(oriented.length){const end=oriented.at(-1).refs.at(-1);if(same(end,refs.at(-1)))refs.reverse();else if(!same(end,refs[0]))gaps++}
    oriented.push({id:source[index].id,refs});
  }
  return{oriented,gaps};
}
const radians=value=>value*Math.PI/180;
const distance=(a,b)=>{const lat=(a[0]+b[0])/2,dy=(a[0]-b[0])*111.32,dx=(a[1]-b[1])*111.32*Math.cos(radians(lat));return Math.hypot(dx,dy)};
const closest=(geometry,point,start)=>{let best={index:-1,distance:Infinity};for(let index=start;index<geometry.length;index++){const current=distance(geometry[index],point);if(current<best.distance)best={index,distance:current}}return best};
const normalizedStopName=value=>String(value||'').normalize('NFC').replace(/[（(][^）)]*[）)]/g,'').replace(/역$/,'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
const osmStopName=node=>node?.tags?.['name:ko']||node?.tags?.name||'';
function selectOrderedStops(allNodes,stopRelations,stopMap,routeId,directionId){
  const expected=stopRelations.map(item=>{const stop=stopMap.get(item.stopId);if(!stop)throw new Error(`Unknown canonical stop ${item.stopId}`);return normalizedStopName(stop.names.ko)});
  for(let start=0;start<=allNodes.length-expected.length;start++){
    const candidate=allNodes.slice(start,start+expected.length);
    if(candidate.every((node,index)=>normalizedStopName(osmStopName(node))===expected[index]))return{nodes:candidate,start,end:start+expected.length-1};
  }
  const osmNames=allNodes.map(osmStopName);
  throw new Error(`${routeId}/${directionId}: canonical station sequence was not found in OSM stops (${expected.length}/${allNodes.length}); OSM=${JSON.stringify(osmNames)}`);
}
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n')};
async function main(){
  const relationId=String(required('relation')),routeId=String(required('route')),directionId=String(required('direction')),directionFile=path.resolve(root,required('direction-file')),stopsFile=path.resolve(root,required('stops-file')),output=path.resolve(root,required('output'));
  const input=args.input?path.resolve(args.input):null,xml=input?fs.readFileSync(input,'utf8'):await fetch(`https://api.openstreetmap.org/api/0.6/relation/${relationId}/full`,{headers:{'User-Agent':'SUBTYPE-geometry-import/1.0 (build-time; OpenStreetMap attribution retained)'}}).then(async response=>{if(!response.ok)throw new Error(`OSM HTTP ${response.status}: ${await response.text()}`);return response.text()});
  const {nodes,ways,relations}=parseXml(xml),relation=relations.get(relationId);if(!relation)throw new Error(`Relation ${relationId} not found`);
  const wayIds=relation.members.filter(member=>member.type==='way'&&!['platform','stop'].includes(member.role)).map(member=>member.ref),stopNodeIds=relation.members.filter(member=>member.type==='node'&&member.role.startsWith('stop')).map(member=>member.ref);
  if(!wayIds.length){
    const children=relation.members.filter(member=>member.type==='relation').map(member=>{const child=relations.get(member.ref);return{id:member.ref,role:member.role||'',tags:child?.tags||{}}});
    throw new Error(`${relationId}: no route ways${children.length?`; route-master children: ${JSON.stringify(children)}`:''}`);
  }
  if(!stopNodeIds.length)throw new Error(`${relationId}: no ordered stop nodes`);
  const assembled=orientWays(wayIds,ways);if(assembled.gaps)throw new Error(`${relationId}: ${assembled.gaps} disconnected way boundaries`);
  const geometry=[];for(const way of assembled.oriented){const part=way.refs.map(ref=>{const node=nodes.get(ref);if(!node)throw new Error(`Way ${way.id}: node ${ref} missing`);return[node.lat,node.lng]});if(geometry.length&&same(way.refs[0],assembled.oriented[assembled.oriented.indexOf(way)-1]?.refs.at(-1)))geometry.push(...part.slice(1));else geometry.push(...part)}
  const direction=readJson(directionFile),registry=readJson(stopsFile),stopMap=new Map(registry.stops.map(stop=>[stop.id,stop])),allOrderedNodes=stopNodeIds.map(id=>nodes.get(id));
  if(allOrderedNodes.some(node=>!node))throw new Error(`${relationId}: stop node missing from response`);
  const stopRelations=direction.stopSequence,selection=selectOrderedStops(allOrderedNodes,stopRelations,stopMap,routeId,directionId),orderedNodes=selection.nodes;
  const identityAudit=[];for(let index=0;index<stopRelations.length;index++){const stop=stopMap.get(stopRelations[index].stopId),node=orderedNodes[index],osmName=osmStopName(node);stop.coordinates={lat:node.lat,lng:node.lng};identityAudit.push({stationId:stop.id,canonicalName:stop.names.ko,osmName,osmNodeId:node.id,matchedBy:'normalized-korean-name-and-route-order'})}
  let cursor=0;const aligned=[];for(let index=0;index<stopRelations.length;index++){const node=orderedNodes[index],match=closest(geometry,[node.lat,node.lng],cursor);if(match.distance>.35)throw new Error(`${stopRelations[index].stopId}: railway alignment is ${match.distance.toFixed(3)} km from OSM stop`);cursor=match.index;aligned.push({...match,stationId:stopRelations[index].stopId})}
  const directedSegments=[];for(let index=0;index<aligned.length-1;index++){const from=aligned[index],to=aligned[index+1];if(to.index<=from.index)throw new Error(`${from.stationId} -> ${to.stationId}: non-monotonic OSM geometry`);const segment=geometry.slice(from.index,to.index+1);if(segment.length<2)throw new Error(`${from.stationId} -> ${to.stationId}: empty segment`);directedSegments.push({fromStationId:from.stationId,toStationId:to.stationId,geometry:segment,source:{type:'openstreetmap',relationId,verified:true}})}
  const routeGeometry=geometry.slice(aligned[0].index,aligned.at(-1).index+1);
  const result={schemaVersion:1,routeId,directionId,geometryStatus:'ready',geometry:routeGeometry,directedSegments,source:{type:'openstreetmap',license:'ODbL',attribution:'© OpenStreetMap contributors',relationId,relationName:relation.tags.name||'',osmWayIds:wayIds,fetchedAt:new Date().toISOString(),sourceUrl:`https://www.openstreetmap.org/relation/${relationId}`},validation:{stopCount:stopRelations.length,osmStopCount:allOrderedNodes.length,osmStopSlice:[selection.start,selection.end],wayCount:wayIds.length,pointCount:routeGeometry.length,segmentCount:directedSegments.length,maxStationAlignmentKm:Math.max(...aligned.map(item=>item.distance)),disconnectedWayBoundaries:assembled.gaps,endpointVerified:true,identityVerified:true},identityAudit};
  writeJson(output,result);writeJson(stopsFile,registry);console.log(JSON.stringify({status:'PASS',routeId,directionId,relationId,points:routeGeometry.length,segments:directedSegments.length,maxStationAlignmentKm:result.validation.maxStationAlignmentKm,osmStopSlice:result.validation.osmStopSlice},null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
