'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=o=>hash(JSON.stringify(o));
function officialRouteEndpoints(service,journey,{base}={}){
 if(!base)return null;
 const shinbundang=require('./kr-shinbundang-endpoints').shinbundangEndpoints(service,journey,{base});if(shinbundang)return shinbundang;
 const bindings=JSON.parse(fs.readFileSync(path.join(base,'official-route-endpoint-bindings.json'),'utf8')),b=bindings.find(b=>b.serviceId===service.id);if(!b)return null;
 const relation=JSON.parse(fs.readFileSync(path.join(base,'source/osm-relations.json'),'utf8')).find(r=>'kr-osm-service-'+r.id===service.id);
 if(b.scope!=='OFFICIAL_LINE_FULL_CALL_ORDER_RESEARCH_ENDPOINTS'||b.officialReleaseApproved!==false||b.sourceUrl!=='https://work.humetro.busan.kr/homepage/cyberstation/map.do'||!['3','4'].includes(b.lineCode)||digest(service.paths)!==b.pathsSha256||digest(service.stops)!==b.stopsSha256||digest(relation)!==b.relationSha256)throw Error('STALE_OFFICIAL_ENDPOINT_BINDING');
 if(service.osmFrom||service.osmTo||relation.tags.operator!=='부산교통공사'||relation.tags.ref!==b.lineCode)throw Error('OFFICIAL_ENDPOINT_BINDING_SCOPE');
 const file=path.resolve(base,b.evidenceFile);if(!file.startsWith(path.resolve(base)+path.sep))throw Error('ENDPOINT_SOURCE_PATH');const bytes=fs.readFileSync(file);if(hash(bytes)!==b.evidenceSha256)throw Error('STALE_OFFICIAL_ENDPOINT_SOURCE');
 const official=[...bytes.toString('utf8').matchAll(/one_point\('(\d+)', '([34])', '([^']+)', event/g)].filter(a=>a[2]===b.lineCode).map(a=>({code:a[1],name:a[3]}));if(b.reverseOfficialOrder)official.reverse();
 if(official.length!==b.expectedStationCount||official.length!==(b.lineCode==='3'?17:14)||journey.stations.length!==official.length||b.calls.length!==official.length||new Set(official.map(s=>s.code)).size!==official.length)throw Error('INCOMPLETE_OFFICIAL_ENDPOINT_SEQUENCE');
 const clean=n=>n.replace(/\s*\(3호선\)$/,'').replace(/역$/,'').trim();
 if(!journey.stations.every((s,i)=>{const p=b.calls[i],o=official[i];return s.id===p.stationId&&s.platformId===p.platformId&&s.ko===p.sourceName&&clean(s.ko)===o.name&&p.officialName===o.name&&p.officialCode===o.code}))throw Error('OFFICIAL_ENDPOINT_CALL_IDENTITY');
 return {scope:b.scope,sourceUrl:b.sourceUrl,reviewedOn:b.reviewedOn,origin:official[0].name,destination:official.at(-1).name,stops:official.length,stationCodes:official.map(s=>s.code),officialReleaseApproved:false,remaining:b.remaining};
}
module.exports={officialRouteEndpoints};
