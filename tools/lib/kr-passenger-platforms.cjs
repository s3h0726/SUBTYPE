'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{assemble,km}=require('./kr-network');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=o=>hash(JSON.stringify(o));
const evidenceTextSha256=bytes=>hash(bytes.toString('utf8').replace(/\r\n/g,'\n'));
function loadPassengerPlatforms(base,data,ways){
 if(!base||!fs.existsSync(path.join(base,'passenger-platform-sidings.json')))return new Map();
 const policy=JSON.parse(fs.readFileSync(path.join(base,'passenger-platform-sidings.json'),'utf8')),bytes=fs.readFileSync(path.join(base,'official-station-reference.json'));
 if(policy.policy!=='kr-passenger-platform-v1'||policy.documentHashEncoding!=='sha256-utf8-lf'||evidenceTextSha256(bytes)!==policy.officialReferenceSha256)throw Error('STALE_PASSENGER_PLATFORM_REFERENCE');
 const highspeed=JSON.parse(fs.readFileSync(path.join(base,'korail-highspeed-pattern-research.json'),'utf8')),areas=new Map(JSON.parse(fs.readFileSync(path.join(base,'source/osm-relations.json'),'utf8')).map(r=>[r.id,r]));if(evidenceTextSha256(fs.readFileSync(path.join(base,'korail-highspeed-pattern-research.json')))!==policy.highspeedDocumentSha256)throw Error('STALE_PASSENGER_TIMETABLE');
 const refs=new Map(JSON.parse(bytes).map(r=>[r.id,r])),nodes=new Map(JSON.parse(fs.readFileSync(path.join(base,'source/osm-nodes.json'))).map(n=>[n.id,n])),services=new Map(data.services.map(s=>[s.id,s])),result=new Map(),tidy=n=>String(n||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/역$/,'').trim();
 for(const group of policy.groups){const s=services.get(group.sourceServiceId);if(!s||s.access?.passengerCandidate===false||group.classification!=='PASSENGER_PLATFORM_SIDING'||digest(s.paths)!==group.sourcePathsSha256||digest(s.stops)!==group.sourceStopsSha256||!group.stops.length||!group.ways.length)throw Error('STALE_PASSENGER_PLATFORM_SERVICE');
  const start=s.paths.findIndex((p,i)=>group.ways.every((w,j)=>s.paths[i+j]?.geometryId==='kr-geometry-'+w.wayId&&s.paths[i+j].reverse===w.reverse));if(start<0)throw Error('PASSENGER_PLATFORM_NOT_SOURCE_CHAIN');
  const nodeIds=new Set();let length=0,previous=null;
  for(const record of group.ways){const w=ways.get(record.wayId);if(!w||w.version!==record.version||digest(w)!==record.sha256||w.tags.service!=='siding'||!['rail','subway','light_rail'].includes(w.tags.railway)||w.tags.highway||['no','private'].includes(w.tags.access)||['military','industrial','test'].includes(w.tags.usage)||(w.tags.oneway==='yes'&&record.reverse)||(w.tags.oneway==='-1'&&!record.reverse))throw Error('PASSENGER_PLATFORM_TRACK_SOURCE');
   const ids=record.reverse?w.nodeIds.slice().reverse():w.nodeIds;if(previous!==null&&previous!==ids[0])throw Error('PASSENGER_PLATFORM_CHAIN_GAP');previous=ids.at(-1);ids.forEach(id=>nodeIds.add(id));for(let i=1;i<w.coordinates.length;i++)length+=km(w.coordinates[i-1],w.coordinates[i]);
  }
  if(length>1.5||Math.abs(length-group.lengthKm)>1e-8)throw Error('PASSENGER_PLATFORM_TOO_LONG');
  for(const proof of group.stops){const n=nodes.get(proof.nodeId);if(!n||digest(n)!==proof.nodeSha256||!nodeIds.has(n.id)||n.tags.public_transport!=='stop_position'||n.tags.railway!=='stop'||['private','no'].includes(n.tags.access))throw Error('PASSENGER_PLATFORM_STOP_EVIDENCE');
   if(proof.referenceId){const r=refs.get(proof.referenceId);if(!r||digest(r)!==proof.referenceSha256||tidy(n.tags['name:ko']||n.tags.name)!==tidy(r.names.ko)||km([n.lat,n.lon],[r.coordinates.lat,r.coordinates.lon])>=1)throw Error('PASSENGER_PLATFORM_STATION_IDENTITY');}
   else{const t=proof.timetable,train=highspeed.trains.find(x=>x.id===t?.trainId),area=areas.get(t?.areaId);if(!train||tidy(train.calls[t.callIndex]?.stationName)!==tidy(n.tags.name)||!area||digest(area)!==t.areaSha256||area.tags.public_transport!=='stop_area'||area.tags.operator!=='한국철도공사'||!area.members.some(m=>m.type==='n'&&m.ref===n.id)||!area.members.some(m=>/platform/.test(m.role)))throw Error('PASSENGER_PLATFORM_TIMETABLE_IDENTITY');}
  }
  for(const w of group.ways)result.set(w.wayId,{groupId:group.id,wayId:w.wayId,version:w.version});
 }
 return result;
}
module.exports={loadPassengerPlatforms,evidenceTextSha256};
