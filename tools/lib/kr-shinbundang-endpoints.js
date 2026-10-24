'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=v=>hash(JSON.stringify(v));
// A complete official station sequence proves endpoint name equivalence only.
// It does not certify platforms, calendars, station codes, or release readiness.
function shinbundangEndpoints(service,journey,{base}={}){
 if(!base||service.id!=='kr-osm-service-6060963')return null;
 const c=JSON.parse(fs.readFileSync(path.join(base,'shinbundang-endpoint-binding.json'),'utf8'));
 const relation=JSON.parse(fs.readFileSync(path.join(base,'source/osm-relations.json'),'utf8')).find(r=>r.id==='6060963');
 if(c.scope!=='OFFICIAL_FULL_CALL_NAME_EQUIVALENCE_RESEARCH_ONLY'||c.releaseApproved!==false||c.sourceUrl!=='https://www.shinbundang.co.kr/dxline/dxline1.jsp'||digest(service.paths)!==c.pathsSha256||digest(service.stops)!==c.stopsSha256||digest(relation)!==c.relationSha256)throw Error('STALE_SHINBUNDANG_ENDPOINT_BINDING');
 const file=path.resolve(base,c.evidenceFile);if(!file.startsWith(path.resolve(base)+path.sep))throw Error('ENDPOINT_SOURCE_PATH');const bytes=fs.readFileSync(file);if(hash(bytes)!==c.evidenceSha256)throw Error('STALE_SHINBUNDANG_ENDPOINT_SOURCE');
 const html=new TextDecoder('euc-kr').decode(bytes);
 const official=[...html.matchAll(/<p class="mb10"><span id="tit(SB\d+)">[^<]*<\/span><strong>([^<]+)<\/strong>/g)].map(m=>({id:m[1],name:m[2]}));
 if(official.length!==16||journey.stations.length!==16||c.calls.length!==16||new Set(official.map(s=>s.id)).size!==16)throw Error('INCOMPLETE_SHINBUNDANG_CALLS');
 if(service.osmFrom!=='신사'||service.osmTo!=='광교(경기대)')throw Error('SHINBUNDANG_ENDPOINT_IDENTITY');
 if(!journey.stations.every((s,i)=>{const x=c.calls[i],o=official[i];return x.stationId===s.id&&x.platformId===s.platformId&&x.sourceName===s.ko&&x.officialName===o.name&&x.operatorPageCode===o.id}))throw Error('SHINBUNDANG_CALL_IDENTITY');
 return {scope:c.scope,sourceUrl:c.sourceUrl,reviewedOn:c.reviewedOn,origin:official[0].name,destination:official.at(-1).name,stops:16,officialReleaseApproved:false,remaining:['Timetable, actual platform direction and release approval remain unverified']};
}
module.exports={shinbundangEndpoints};
