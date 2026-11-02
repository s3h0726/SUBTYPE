'use strict';
const fs=require('node:fs'),path=require('node:path'),{km}=require('./thailand-geometry.cjs');
function loadMaps(root,filter='map-'){
 const elements=new Map(),files=fs.readdirSync(root).filter(f=>f.startsWith(filter)&&f.endsWith('.json'));
 for(const file of files)for(const e of JSON.parse(fs.readFileSync(path.join(root,file))).elements)elements.set(e.type+':'+e.id,e);
 const nodes=new Map([...elements.values()].filter(e=>e.type==='node').map(e=>[e.id,e])),ways=[...elements.values()].filter(e=>e.type==='way'&&e.tags.railway==='rail'&&(!e.tags.gauge||e.tags.gauge==='1000')&&!e.tags.service),adj=new Map();
 for(const w of ways)for(let i=1;i<w.nodes.length;i++){const a=nodes.get(w.nodes[i-1]),b=nodes.get(w.nodes[i]);if(!a||!b)continue;for(const[from,to]of[[a,b],[b,a]]){if(!adj.has(from.id))adj.set(from.id,new Map());adj.get(from.id).set(to.id,{to:to.id,weight:km([from.lat,from.lon],[to.lat,to.lon]),wayId:w.id})}}
 const stationNodes=[...nodes.values()].filter(n=>n.tags?.name&&['station','halt','stop'].includes(n.tags.railway)&&n.tags.subway!=='yes'&&n.tags.station!=='subway');
 return{nodes,ways,adj,stationNodes,files};
}
function pathBetween(map,a,b){const distances=new Map([[a,0]]),previous=new Map(),done=new Set();while(true){let current=null,best=Infinity;for(const[id,d]of distances)if(!done.has(id)&&d<best){current=id;best=d}if(current===null)throw Error('OSM 실제 레일 단절: '+a+' → '+b);if(current===b)break;done.add(current);for(const e of map.adj.get(current)?.values()||[])if(best+e.weight<(distances.get(e.to)??Infinity)){distances.set(e.to,best+e.weight);previous.set(e.to,{from:current,...e})}}
 const ids=[b],wayIds=[];let v=b;while(v!==a){const e=previous.get(v);wayIds.unshift(e.wayId);ids.unshift(e.from);v=e.from}return{points:ids.map(id=>{const n=map.nodes.get(id);return[n.lat,n.lon]}),nodeIds:ids,wayIds:[...new Set(wayIds)]};}
module.exports={loadMaps,pathBetween};
