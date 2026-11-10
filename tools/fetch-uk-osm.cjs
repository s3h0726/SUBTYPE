'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const root=path.resolve(__dirname,'../data/uk/source/osm'),ids=process.argv.slice(2).filter(s=>/^\d+$/.test(s)),seen=new Set();
async function get(id,depth=0){if(seen.has(id)||depth>3)return;seen.add(id);const file=path.join(root,id+'.json.gz');let data;
 if(fs.existsSync(file))data=JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));else{const r=await fetch('https://api.openstreetmap.org/api/0.6/relation/'+id+'/full.json',{headers:{'User-Agent':'SUBTYPE verified railway importer'}});if(!r.ok)throw Error(id+': '+r.status);const bytes=Buffer.from(await r.arrayBuffer());data=JSON.parse(bytes);fs.writeFileSync(file,zlib.gzipSync(bytes,{level:9}));console.log('Fetched',id,bytes.length)}
 const relation=data.elements.find(e=>e.type==='relation'&&e.id===Number(id));if(!relation)throw Error('Missing relation '+id);
 if(['network','route_master','superroute'].includes(relation.tags?.type))for(const member of relation.members.filter(m=>m.type==='relation'))await get(String(member.ref),depth+1);
}
(async()=>{for(const id of ids)await get(id);console.log('Visited',seen.size,'relations')})().catch(e=>{console.error(e);process.exitCode=1});
