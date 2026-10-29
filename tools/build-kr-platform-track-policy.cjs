'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {load,validate,assemble,km}=require('./lib/kr-network');
const root=path.resolve(__dirname,'..'),base=path.join(root,'data/kr/v2'),data=load(base),{maps,errors}=validate(data,{base});if(errors.length)throw Error(JSON.stringify(errors));
const read=f=>JSON.parse(fs.readFileSync(path.join(base,f),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=o=>hash(JSON.stringify(o));
const ways=new Map(read('source/osm-ways.json').map(w=>[w.id,w])),nodes=new Map(read('source/osm-nodes.json').map(n=>[n.id,n])),references=read('official-station-reference.json');
const highspeed=read('korail-highspeed-pattern-research.json'),areas=read('source/osm-relations.json').filter(r=>r.tags.public_transport==='stop_area');
const tidy=n=>String(n||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/역$/,'').trim(),groups=[];
for(const service of data.services){if(service.access?.passengerCandidate===false)continue;try{assemble(service,maps)}catch{continue}
 let run=[];const flush=()=>{if(!run.length)return;const selected=run;run=[];let lengthKm=0;const ids=new Set();for(const part of selected){const w=ways.get(part.geometryId.replace('kr-geometry-',''));for(let i=1;i<w.coordinates.length;i++)lengthKm+=km(w.coordinates[i-1],w.coordinates[i]);w.nodeIds.forEach(id=>ids.add(id));}
 if(lengthKm>1.5)return;
 const stops=[...ids].map(id=>nodes.get(id)).filter(n=>n?.tags.public_transport==='stop_position'&&n.tags.railway==='stop'&&!['private','no'].includes(n.tags.access)).map(n=>({node:n,reference:references.find(r=>tidy(r.names.ko)===tidy(n.tags['name:ko']||n.tags.name)&&Number.isFinite(r.coordinates?.lat)&&km([n.lat,n.lon],[r.coordinates.lat,r.coordinates.lon])<1)})).map(proof=>{if(proof.reference)return proof;const n=proof.node,area=areas.find(a=>a.members.some(m=>m.type==='n'&&m.ref===n.id)&&a.members.some(m=>/platform/.test(m.role))&&a.tags.operator==='한국철도공사');if(!area)return proof;const train=highspeed.trains.find(t=>t.calls.some(c=>tidy(c.stationName)===tidy(n.tags.name)));if(train)proof.timetable={trainId:train.id,callIndex:train.calls.findIndex(c=>tidy(c.stationName)===tidy(n.tags.name)),areaId:area.id,areaSha256:digest(area)};return proof}).filter(r=>r.reference||r.timetable);
 if(!stops.length)return;
 const records=selected.map(p=>{const w=ways.get(p.geometryId.replace('kr-geometry-',''));return {wayId:w.id,version:w.version,reverse:p.reverse,sha256:digest(w)}}),id='passenger-platform-'+digest({records,stops:stops.map(s=>s.node.id)}).slice(0,16);
 if(groups.some(g=>g.id===id))return;
 groups.push({id,classification:'PASSENGER_PLATFORM_SIDING',sourceServiceId:service.id,sourcePathsSha256:digest(service.paths),sourceStopsSha256:digest(service.stops),lengthKm,ways:records,stops:stops.map(({node,reference,timetable})=>({nodeId:node.id,nodeSha256:digest(node),name:node.tags.name,...(reference?{referenceId:reference.id,referenceSha256:digest(reference),referenceSourceId:reference.source.sourceId}:{timetable})})),scope:'Public passenger stop_position on a short contiguous station siding; not depot, private access, platform-number approval or official operating certification'});
 };
 for(const part of service.paths){const w=ways.get(part.geometryId.replace('kr-geometry-',''));if(w?.tags.service==='siding'&&['rail','subway','light_rail'].includes(w.tags.railway)&&!w.tags.highway&&!['no','private'].includes(w.tags.access)&&!['military','industrial','test'].includes(w.tags.usage)&&!((w.tags.oneway==='yes'&&part.reverse)||(w.tags.oneway==='-1'&&!part.reverse)))run.push(part);else flush();}flush();
}
const policy={schemaVersion:1,policy:'kr-passenger-platform-v1',sourceMeaning:'https://wiki.openstreetmap.org/wiki/Key:service',reviewStatus:'AUTOMATED_PROVISIONAL_CLASSIFICATION_NOT_RELEASE_APPROVAL',highspeedDocumentSha256:hash(fs.readFileSync(path.join(base,'korail-highspeed-pattern-research.json'))),officialReferenceSha256:hash(fs.readFileSync(path.join(base,'official-station-reference.json'))),groups};
fs.writeFileSync(path.join(base,'passenger-platform-sidings.json'),JSON.stringify(policy,null,2)+'\n');
const manifest=[...new Map(groups.flatMap(g=>g.ways.map(w=>[w.wayId,{wayId:w.wayId,version:w.version,groupId:g.id}]))).values()];
fs.writeFileSync(path.join(root,'js/korean-passenger-track-data.js'),'/* Generated from pinned source tracks and official station references. */\nexport const KR_PASSENGER_PLATFORM_SIDINGS='+JSON.stringify(manifest)+';\n');
console.log(JSON.stringify({platformSidingGroups:groups.length,sourceWays:manifest.length,officialApproval:0}));
