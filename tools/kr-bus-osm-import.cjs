'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../data/kr/canonical');
const files=fs.readdirSync(dir).filter(f=>/^bus-osm-relation-\d+\.json$/.test(f));
const report=[];
for(const file of files){
 const d=JSON.parse(fs.readFileSync(path.join(dir,file))),id=Number(file.match(/(\d+)\.json$/)[1]);
 const es=new Map(d.elements.map(e=>[e.type+':'+e.id,e])),r=es.get('relation:'+id),ways=r.members.filter(m=>m.type==='way'&&!/platform|stop/.test(m.role));
 let prev,gaps=[];
 for(const [i,m] of ways.entries()){
  const w=es.get('way:'+m.ref);let a=w.nodes[0],b=w.nodes.at(-1);
  if(i===0&&ways[1]){const next=es.get('way:'+ways[1].ref);if(next.nodes.includes(a)&&!next.nodes.includes(b))[a,b]=[b,a]}
  if(prev&&a!==prev){if(b===prev)[a,b]=[b,a];else gaps.push({from:prev,to:a,wayId:m.ref})}
  prev=b;
 }
 const nodes=r.members.filter(m=>m.type==='node');
 const stops=nodes.map(m=>{const n=es.get('node:'+m.ref);return{id:'osm-node-'+m.ref,role:m.role,ko:n?.tags?.['name:ko']||n?.tags?.name,latitude:n?.lat,longitude:n?.lon,tags:n?.tags}});
 report.push({id:'kr-bus-osm-'+id,sourceRef:{url:'https://www.openstreetmap.org/relation/'+id,sourceDate:'2026-10-31',license:'ODbL-1.0'},tags:r.tags,wayCount:ways.length,stopCount:stops.length,gaps,stops,status:gaps.length?'disconnected':'connected',blockers:gaps.length?['OSM 관계의 도로 연결 단절']:['공식 방향별 정차 목록 대조 필요']});
}
fs.writeFileSync(path.join(dir,'bus-osm-report.json'),JSON.stringify({schemaVersion:2,candidates:report},null,2)+'\n');
console.log(JSON.stringify(report.map(({stops,gaps,...r})=>({...r,gapCount:gaps.length})),null,2));
