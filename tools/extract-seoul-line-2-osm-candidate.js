#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const sourcePath='data/kr/source/osm/seoul-line-2-relation-7625892.json';
const source=JSON.parse(fs.readFileSync(path.join(root,sourcePath),'utf8'));
const elements=new Map(source.osm.elements.map(element=>[`${element.type}:${element.id}`,element]));
const configs=[
  {artifact:'kr-metro-2',direction:'forward',relationId:2404374,pattern:'kr-seoul-line-2-main-loop',name:'외선순환'},
  {artifact:'kr-metro-2',direction:'reverse',relationId:4729409,pattern:'kr-seoul-line-2-main-loop',name:'내선순환'},
  {artifact:'kr-metro-2-section-2',direction:'forward',relationId:4729406,pattern:'kr-seoul-line-2-seongsu-branch',name:'성수 → 신설동'},
  {artifact:'kr-metro-2-section-2',direction:'reverse',relationId:4729405,pattern:'kr-seoul-line-2-seongsu-branch',name:'신설동 → 성수'},
  {artifact:'kr-metro-2-section-3',direction:'forward',relationId:4729407,pattern:'kr-seoul-line-2-sinjeong-branch',name:'신도림 → 까치산'},
  {artifact:'kr-metro-2-section-3',direction:'reverse',relationId:4729408,pattern:'kr-seoul-line-2-sinjeong-branch',name:'까치산 → 신도림'}
];
const baseName=value=>String(value||'').normalize('NFC').replace(/\s*\([^)]*\)/g,'').trim();

function relationPath(relationId){
  const relation=elements.get(`relation:${relationId}`);
  if(!relation)throw new Error(`Missing relation ${relationId}`);
  const members=relation.members||[];
  const stops=members.filter(member=>member.role==='stop');
  const wayMembers=members.filter(member=>member.type==='way'&&!member.role);
  if(stops.length<2||wayMembers.length<1)throw new Error(`${relationId}: missing ordered stops or ways`);
  const ways=wayMembers.map(member=>{const way=elements.get(`way:${member.ref}`);if(!way?.nodes?.length)throw new Error(`${relationId}: missing way ${member.ref}`);return{id:member.ref,nodes:way.nodes.slice()}});
  if(ways.length>1){
    const next=ways[1].nodes,first=ways[0].nodes;
    const shared=[first[0],first.at(-1)].find(node=>node===next[0]||node===next.at(-1));
    if(shared===undefined)throw new Error(`${relationId}: first two ways are disconnected`);
    if(first.at(-1)!==shared)first.reverse();
  }
  for(let index=1;index<ways.length;index++){
    const previous=ways[index-1].nodes.at(-1),nodes=ways[index].nodes;
    if(nodes[0]===previous)continue;
    if(nodes.at(-1)===previous){nodes.reverse();continue}
    throw new Error(`${relationId}: way ${ways[index-1].id} does not connect to ${ways[index].id}`);
  }
  const path=[];
  for(const way of ways){
    for(let index=0;index<way.nodes.length;index++){
      const nodeId=way.nodes[index];
      if(path.length&&index===0&&path.at(-1).nodeId===nodeId){path.at(-1).wayIds.add(way.id);continue}
      const node=elements.get(`node:${nodeId}`);
      if(!node||!Number.isFinite(node.lat)||!Number.isFinite(node.lon))throw new Error(`${relationId}: missing node ${nodeId}`);
      path.push({nodeId,point:[node.lat,node.lon],wayIds:new Set([way.id])});
    }
  }
  const stopIndexes=[];
  let cursor=0;
  for(const member of stops){
    const index=path.findIndex((entry,at)=>at>=cursor&&entry.nodeId===member.ref);
    if(index<0)throw new Error(`${relationId}: stop node ${member.ref} is not on the ordered ways`);
    stopIndexes.push(index);cursor=index+1;
  }
  const stopNames=stops.map(member=>{const stop=elements.get(`${member.type}:${member.ref}`);return baseName(stop?.tags?.['name:ko']||stop?.tags?.name)});
  const segments=stopIndexes.slice(0,-1).map((fromIndex,index)=>{
    const toIndex=stopIndexes[index+1],entries=path.slice(fromIndex,toIndex+1);
    if(entries.length<2)throw new Error(`${relationId}: empty segment ${stopNames[index]} -> ${stopNames[index+1]}`);
    return{from:stopNames[index],to:stopNames[index+1],geometry:entries.map(entry=>entry.point),source:{osmRelationId:relationId,osmWayIds:[...new Set(entries.flatMap(entry=>[...entry.wayIds]))],license:'ODbL-1.0',attribution:'© OpenStreetMap contributors'}};
  });
  return{relation,stopNames,path,segments};
}

const directions=[];
for(const config of configs){
  const artifact=JSON.parse(fs.readFileSync(path.join(root,`data/kr/generated/routes/${config.artifact}.json`),'utf8')).route;
  const direction=artifact.directions.find(item=>item.id===config.direction);
  const expected=(direction?.stops||[]).map(stop=>baseName(stop.names?.ko||stop.ko));
  const extracted=relationPath(config.relationId);
  if(JSON.stringify(expected)!==JSON.stringify(extracted.stopNames))throw new Error(`${config.relationId}: OSM stop sequence differs from ${config.artifact}/${config.direction}\nexpected ${expected.join(' > ')}\nactual   ${extracted.stopNames.join(' > ')}`);
  directions.push({...config,stopNames:extracted.stopNames,geometry:extracted.path.map(entry=>entry.point),directedSegments:extracted.segments,validation:{orderedStopsExact:true,wayMemberOrderContinuous:true,stationNodesOnWaysExact:true,nearestTrackMatchingUsed:false,officialOrderStatus:'pending'}});
}
const output={schemaVersion:1,passengerLineId:'kr-seoul-line-2',source:{file:sourcePath,osmRouteMasterRelationId:7625892,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',retrieved:source.source.retrieved,sha256:source.source.sha256},geometryStatus:'topology-validated-official-order-pending',geometryReady:false,directions};
const target=path.join(root,'data/kr/rebuild/geometry/kr-seoul-line-2.candidate.json');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(output)+'\n');
console.log(JSON.stringify({status:'CANDIDATE',directions:directions.length,segments:directions.reduce((sum,direction)=>sum+direction.directedSegments.length,0),geometryReady:false,target:path.relative(root,target).replaceAll('\\','/')},null,2));
