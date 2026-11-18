#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const relations=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-relations.json'),'utf8'));
const ways=JSON.parse(fs.readFileSync(path.join(root,'data/kr/v2/source/osm-ways.json'),'utf8'));
const pool=Array.isArray(relations)?relations:(relations.elements||relations.relations||[]);
const wayBy=new Map(ways.map(w=>[String(w.id),w]));
console.log('RELATION_INVENTORY '+JSON.stringify({kind:Array.isArray(relations)?'array':Object.keys(relations),count:pool.length,first:pool[0]&&Object.keys(pool[0])}));
const hits=pool.filter(r=>/경부고속선|Gyeongbu High|Gyeongbu high/i.test(JSON.stringify(r.tags||{}))||[6094351,8840844].includes(Number(r.id)));
console.log('GYEONGBU_RELATIONS '+JSON.stringify(hits.map(r=>({id:r.id,tags:r.tags,keys:Object.keys(r),members:r.members?.length,first:r.members?.slice(0,5),last:r.members?.slice(-5)}))));
for(const rel of hits){
 const refs=(rel.members||[]).filter(m=>m.type==='way'||m.type==='w');
 const valid=refs.map(m=>wayBy.get(String(m.ref))).filter(Boolean);
 const south=refs.map((m,i)=>({way:wayBy.get(String(m.ref)),i,ref:m.ref})).filter(x=>x.way?.coordinates?.some(p=>p[0]>35.05&&p[0]<35.85&&p[1]>128.8));
 console.log('GYEONGBU_RELATION_SOUTH_WAYS '+JSON.stringify({relation:rel.id,members:south.map(x=>({i:x.i,ref:x.ref,
 tags:{railway:x.way.tags?.railway,name:x.way.tags?.name,highspeed:x.way.tags?.highspeed,oneway:x.way.tags?.oneway,service:x.way.tags?.service},
 first:x.way.coordinates?.[0],last:x.way.coordinates?.at(-1),nodeFirst:x.way.nodeIds?.[0],nodeLast:x.way.nodeIds?.at(-1)})).slice(0,80)}));

 const hsr=valid.filter(w=>w.tags?.name==='경부고속선'||w.tags?.['name:ko']==='경부고속선');
 console.log('GYEONGBU_RELATION_SOURCE_COVERAGE '+JSON.stringify({id:rel.id,wayMembers:refs.length,availableWays:valid.length,hsrWays:hsr.length,
  nearGyeongju:hsr.filter(w=>w.coordinates?.some(p=>Math.abs(p[0]-35.798)<.2)).length,
  nearBusan:hsr.filter(w=>w.coordinates?.some(p=>Math.abs(p[0]-35.115)<.2)).length,
  sampleWayIds:hsr.slice(-8).map(w=>w.id)
 }));
}
