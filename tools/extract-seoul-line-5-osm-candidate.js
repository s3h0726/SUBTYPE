#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const sourcePath='data/kr/source/osm/seoul-line-5-relation-7879871.json';
const source=JSON.parse(fs.readFileSync(path.join(root,sourcePath),'utf8'));
const elements=new Map(source.osm.elements.map(element=>[`${element.type}:${element.id}`,element]));
const configs=[
  {artifact:'kr-metro-5',direction:'forward',relationId:4744340,pattern:'kr-seoul-line-5-main',name:'방화 → 상일동'},
  {artifact:'kr-metro-5',direction:'reverse',relationId:4744339,pattern:'kr-seoul-line-5-main',name:'상일동 → 방화'},
  {artifact:'kr-metro-5-section-2',direction:'forward',relationId:4744338,pattern:'kr-seoul-line-5-macheon-branch',name:'강동 → 마천'},
  {artifact:'kr-metro-5-section-2',direction:'reverse',relationId:4744337,pattern:'kr-seoul-line-5-macheon-branch',name:'마천 → 강동'},
  {artifact:'kr-metro-5-section-3',direction:'forward',relationId:12497486,pattern:'kr-seoul-line-5-hanam-extension',name:'상일동 → 하남검단산'},
  {artifact:'kr-metro-5-section-3',direction:'reverse',relationId:12497485,pattern:'kr-seoul-line-5-hanam-extension',name:'하남검단산 → 상일동'}
];
const baseName=value=>String(value||'').normalize('NFC').replace(/\s*[（(][^）)]*[）)]/g,'').replace(/역$/,'').trim();
const same=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);

function relationSegments(relationId){
  const relation=elements.get(`relation:${relationId}`);if(!relation)throw new Error(`Missing relation ${relationId}`);
  const stops=(relation.members||[]).filter(member=>member.type==='node'&&member.role?.startsWith('stop'));
  const wayMembers=(relation.members||[]).filter(member=>member.type==='way'&&!['platform','stop'].includes(member.role));
  if(stops.length<2||wayMembers.length<1)throw new Error(`${relationId}: missing ordered stops or ways`);
  const ways=wayMembers.map(member=>{const way=elements.get(`way:${member.ref}`);if(!way?.nodes?.length)throw new Error(`${relationId}: missing way ${member.ref}`);return{id:member.ref,nodes:way.nodes.slice()}});
  if(ways.length>1){const next=ways[1].nodes,first=ways[0].nodes,shared=[first[0],first.at(-1)].find(node=>node===next[0]||node===next.at(-1));if(shared===undefined)throw new Error(`${relationId}: first two ways disconnected`);if(first.at(-1)!==shared)first.reverse()}
  for(let index=1;index<ways.length;index++){const previous=ways[index-1].nodes.at(-1),nodes=ways[index].nodes;if(nodes[0]===previous)continue;if(nodes.at(-1)===previous){nodes.reverse();continue}throw new Error(`${relationId}: way ${ways[index-1].id} does not connect to ${ways[index].id}`)}
  const track=[];for(const way of ways)for(let index=0;index<way.nodes.length;index++){const nodeId=way.nodes[index];if(track.length&&index===0&&track.at(-1).nodeId===nodeId){track.at(-1).wayIds.add(way.id);continue}const node=elements.get(`node:${nodeId}`);if(!node||!Number.isFinite(node.lat)||!Number.isFinite(node.lon))throw new Error(`${relationId}: missing node ${nodeId}`);track.push({nodeId,point:[node.lat,node.lon],wayIds:new Set([way.id])})}
  const indexes=[];let cursor=0;for(const member of stops){const index=track.findIndex((entry,at)=>at>=cursor&&entry.nodeId===member.ref);if(index<0)throw new Error(`${relationId}: stop node ${member.ref} is not on ordered ways`);indexes.push(index);cursor=index+1}
  const names=stops.map(member=>{const stop=elements.get(`node:${member.ref}`);return baseName(stop?.tags?.['name:ko']||stop?.tags?.name)});
  const segments=indexes.slice(0,-1).map((fromIndex,index)=>{const entries=track.slice(fromIndex,indexes[index+1]+1);if(entries.length<2)throw new Error(`${relationId}: empty segment ${names[index]} -> ${names[index+1]}`);return{from:names[index],to:names[index+1],geometry:entries.map(entry=>entry.point),source:{osmRelationId:relationId,osmWayIds:[...new Set(entries.flatMap(entry=>[...entry.wayIds]))],osmNodeIds:entries.map(entry=>entry.nodeId),license:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}}});
  return{relation,names,segments};
}
function selectSequence(extracted,expected,relationId){
  let start=-1;for(let index=0;index<=extracted.names.length-expected.length;index++)if(same(extracted.names.slice(index,index+expected.length),expected)){start=index;break}
  if(start<0)throw new Error(`${relationId}: OSM stop sequence differs\nexpected ${expected.join(' > ')}\nactual   ${extracted.names.join(' > ')}`);
  const segments=extracted.segments.slice(start,start+expected.length-1),geometry=[];for(const segment of segments){let points=segment.geometry.map(point=>point.slice());if(geometry.length){if(geometry.at(-1)[0]!==points[0][0]||geometry.at(-1)[1]!==points[0][1])throw new Error(`${relationId}: selected segment discontinuity`);points=points.slice(1)}geometry.push(...points)}
  return{segments,geometry,stopSlice:[start,start+expected.length-1]};
}

const directions=[];
for(const config of configs){
  const route=JSON.parse(fs.readFileSync(path.join(root,`data/kr/generated/routes/${config.artifact}.json`),'utf8')).route,direction=route.directions.find(item=>item.id===config.direction),expected=(direction?.stops||[]).map(stop=>baseName(stop.names?.ko||stop.ko));
  const extracted=relationSegments(config.relationId),selected=selectSequence(extracted,expected,config.relationId);
  directions.push({...config,stopNames:expected,geometry:selected.geometry,directedSegments:selected.segments,validation:{orderedStopsExact:true,wayMemberOrderContinuous:true,stationNodesOnWaysExact:true,nearestTrackMatchingUsed:false,osmStopSlice:selected.stopSlice,officialOrderStatus:'pending'}})
}
const output={schemaVersion:1,passengerLineId:'kr-seoul-line-5',source:{file:sourcePath,osmRouteMasterRelationId:7879871,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',retrieved:source.source.retrieved,sha256:source.source.sha256},geometryStatus:'topology-validated-official-order-pending',geometryReady:false,directions};
const relative='data/kr/rebuild/geometry/kr-seoul-line-5.candidate.json',target=path.join(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
const graphNodes=new Map,graphEdges=new Map;
for(const direction of directions)for(const segment of direction.directedSegments){const nodeIds=segment.source.osmNodeIds;for(let index=0;index<nodeIds.length;index++){const id=String(nodeIds[index]),point=segment.geometry[index],node=graphNodes.get(id)||{id:`osm-node-${id}`,osmNodeId:Number(id),coordinates:point,connectedTrackIds:[]};graphNodes.set(id,node);if(index===nodeIds.length-1)continue;const next=String(nodeIds[index+1]),key=Number(id)<Number(next)?`${id}::${next}`:`${next}::${id}`,trackId=`osm-track-${key.replace('::','-')}`,edge=graphEdges.get(key)||{id:trackId,fromNodeId:`osm-node-${id}`,toNodeId:`osm-node-${next}`,geometry:[point,segment.geometry[index+1]],osmWayIds:[],routeRelationIds:[],observedDirections:[],source:{provider:'OpenStreetMap',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors'},geometryStatus:'candidate'};edge.osmWayIds=[...new Set([...edge.osmWayIds,...segment.source.osmWayIds])];edge.routeRelationIds=[...new Set([...edge.routeRelationIds,direction.relationId])];edge.observedDirections=[...new Set([...edge.observedDirections,`${id}->${next}`])];graphEdges.set(key,edge)}}
for(const edge of graphEdges.values()){const from=graphNodes.get(String(edge.fromNodeId).replace('osm-node-','')),to=graphNodes.get(String(edge.toNodeId).replace('osm-node-',''));from.connectedTrackIds.push(edge.id);to.connectedTrackIds.push(edge.id)}
const topology={schemaVersion:1,passengerLineId:'kr-seoul-line-5',coordinateSystem:'WGS84 / EPSG:4326',transformation:'none',source:output.source,geometryStatus:'candidate-official-order-pending',nodes:[...graphNodes.values()],tracks:[...graphEdges.values()],junctionNodeIds:[...graphNodes.values()].filter(node=>new Set(node.connectedTrackIds).size>=3).map(node=>node.id)};
const graphRelative='data/kr/rebuild/topology/kr-seoul-line-5.graph.json',graphTarget=path.join(root,graphRelative);fs.mkdirSync(path.dirname(graphTarget),{recursive:true});fs.writeFileSync(graphTarget,JSON.stringify(topology,null,2)+'\n');
console.log(JSON.stringify({status:'CANDIDATE',directions:directions.length,segments:directions.reduce((sum,item)=>sum+item.directedSegments.length,0),points:directions.reduce((sum,item)=>sum+item.geometry.length,0),graphNodes:topology.nodes.length,graphTracks:topology.tracks.length,junctionNodes:topology.junctionNodeIds.length,geometryReady:false,target:relative,topology:graphRelative},null,2));
