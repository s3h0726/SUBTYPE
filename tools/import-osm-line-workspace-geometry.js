#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2).reduce((out,value,index,list)=>{if(value.startsWith('--'))out[value.slice(2)]=list[index+1];return out},{});
const required=name=>{if(!args[name])throw new Error(`Missing --${name}`);return args[name]};
const decode=value=>String(value||'').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const attrs=value=>Object.fromEntries([...value.matchAll(/([:\w-]+)="([^"]*)"/g)].map(match=>[match[1],decode(match[2])]));
function parseXml(xml){
  const nodes=new Map(),ways=new Map(),relations=new Map();
  for(const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)){const item=attrs(match[1]);nodes.set(item.id,{id:item.id,lat:Number(item.lat),lng:Number(item.lon)})}
  for(const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)){const item=attrs(match[1]);ways.set(item.id,{id:item.id,nodes:[...match[2].matchAll(/<nd\b([^>]*)\/>/g)].map(node=>attrs(node[1]).ref)})}
  for(const match of xml.matchAll(/<relation\b([^>]*)>([\s\S]*?)<\/relation>/g)){const item=attrs(match[1]);relations.set(item.id,{id:item.id,members:[...match[2].matchAll(/<member\b([^>]*)\/>/g)].map(member=>attrs(member[1]))})}
  return{nodes,ways,relations};
}
function orientWays(ids,ways){
  const parts=ids.map(id=>ways.get(id));if(parts.some(part=>!part))throw new Error('OSM relation is missing member ways');
  const oriented=[];let gaps=0;
  for(let index=0;index<parts.length;index++){
    let refs=[...parts[index].nodes];
    if(index===0&&parts[1]){const next=parts[1].nodes;if(!next.includes(refs.at(-1))&&next.includes(refs[0]))refs.reverse()}
    else if(oriented.length){const end=oriented.at(-1).refs.at(-1);if(end===refs.at(-1))refs.reverse();else if(end!==refs[0])gaps++}
    oriented.push({id:parts[index].id,refs});
  }
  if(gaps)return null;
  const geometry=[];for(const part of oriented){const points=part.refs.map(id=>{const node=nodes.get(id);if(!node)throw new Error(`Missing OSM node ${id}`);return[node.lat,node.lng]});geometry.push(...(geometry.length?points.slice(1):points))}
  return geometry;
}
const radians=value=>value*Math.PI/180;
const distance=(a,b)=>{const lat=(a[0]+b[0])/2,dy=(a[0]-b[0])*111.32,dx=(a[1]-b[1])*111.32*Math.cos(radians(lat));return Math.hypot(dx,dy)};
function align(geometry,stations){let cursor=0,total=0;const matches=[];for(const station of stations){let best={index:-1,distance:Infinity};for(let index=cursor;index<geometry.length;index++){const value=distance(geometry[index],[station.coordinates.lat,station.coordinates.lng]);if(value<best.distance)best={index,distance:value}}if(best.index<cursor)throw new Error(`Could not align ${station.id}`);cursor=best.index;total+=best.distance;matches.push({...best,stationId:station.id})}return{matches,total}}
function topologyPath(ids,ways,nodes,fromPoint,toPoint){
  const adjacency=new Map(),used=new Set();
  const add=(a,b)=>{if(!adjacency.has(a))adjacency.set(a,[]);adjacency.get(a).push({id:b,cost:distance([nodes.get(a).lat,nodes.get(a).lng],[nodes.get(b).lat,nodes.get(b).lng])})};
  for(const id of ids){const way=ways.get(id);if(!way)continue;for(const nodeId of way.nodes)used.add(nodeId);for(let index=0;index<way.nodes.length-1;index++){add(way.nodes[index],way.nodes[index+1]);add(way.nodes[index+1],way.nodes[index])}}
  const nearest=point=>{let best={id:null,distance:Infinity};for(const id of used){const node=nodes.get(id);if(!node)continue;const value=distance([node.lat,node.lng],point);if(value<best.distance)best={id,distance:value}}return best};
  const start=nearest(fromPoint),end=nearest(toPoint);if(!start.id||!end.id)throw new Error('No usable topology endpoints');
  const costs=new Map([[start.id,0]]),previous=new Map(),pending=new Set([start.id]);
  while(pending.size){let current=null,currentCost=Infinity;for(const id of pending){const value=costs.get(id);if(value<currentCost){current=id;currentCost=value}}pending.delete(current);if(current===end.id)break;for(const edge of adjacency.get(current)||[]){const next=currentCost+edge.cost;if(next<(costs.get(edge.id)??Infinity)){costs.set(edge.id,next);previous.set(edge.id,current);pending.add(edge.id)}}}
  if(!costs.has(end.id))throw new Error('OSM relation topology has no path between route endpoints');
  const path=[];for(let current=end.id;current;current=previous.get(current)){path.push(current);if(current===start.id)break}path.reverse();
  return path.map(id=>{const node=nodes.get(id);return[node.lat,node.lng]});
}
function loadStations(){const map=new Map();for(const file of fs.readdirSync(path.join(root,'data','shared-stations')).filter(name=>name.endsWith('.json'))){for(const station of JSON.parse(fs.readFileSync(path.join(root,'data','shared-stations',file),'utf8')))map.set(station.id,station)}return map}
const input=path.resolve(required('input')),lineDir=path.resolve(root,required('line-dir')),relationId=String(required('relation'));
const {nodes,ways,relations}=parseXml(fs.readFileSync(input,'utf8')),relation=relations.get(relationId);if(!relation)throw new Error(`Relation ${relationId} not found`);
const ids=relation.members.filter(member=>member.type==='way'&&!['platform','stop'].includes(member.role)).map(member=>member.ref);
const lineStations=JSON.parse(fs.readFileSync(path.join(lineDir,'stations.json'),'utf8')),stationMap=loadStations(),stations=lineStations.map(item=>stationMap.get(item.stationId));
if(stations.some(station=>!station))throw new Error('Line references unknown canonical stations');
let geometry=orientWays(ids,ways)||topologyPath(ids,ways,nodes,[stations[0].coordinates.lat,stations[0].coordinates.lng],[stations.at(-1).coordinates.lat,stations.at(-1).coordinates.lng]),forward=align(geometry,stations),reverseGeometry=[...geometry].reverse(),reverse=align(reverseGeometry,stations);
if(reverse.total<forward.total){geometry=reverseGeometry;forward=reverse}
if(forward.matches.some(match=>match.distance>.35))throw new Error(`Station alignment exceeds 0.35 km: ${JSON.stringify(forward.matches)}`);
const result={};for(let index=0;index<forward.matches.length-1;index++){const from=forward.matches[index],to=forward.matches[index+1];if(to.index<=from.index)throw new Error(`${from.stationId} -> ${to.stationId}: non-monotonic geometry`);result[`${from.stationId}::${to.stationId}`]={fromStationId:from.stationId,toStationId:to.stationId,geometry:geometry.slice(from.index,to.index+1),source:{type:'openstreetmap',relationId,license:'ODbL',attribution:'© OpenStreetMap contributors',sourceUrl:`https://www.openstreetmap.org/relation/${relationId}`,verified:true}}}
fs.writeFileSync(path.join(lineDir,'geometry.json'),`${JSON.stringify(result,null,2)}\n`);
console.log(JSON.stringify({status:'PASS',relationId,stations:stations.length,segments:Object.keys(result).length,points:Object.values(result).reduce((sum,item)=>sum+item.geometry.length,0),maxAlignmentKm:Math.max(...forward.matches.map(item=>item.distance))},null,2));
