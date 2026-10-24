'use strict';
const crypto=require('node:crypto');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const legacy=v=>String(v||'').normalize('NFC').replace(/\([^)]*\)/g,'').replace(/역$/,'').replace(/\s/g,'');
const canonical=v=>String(v||'').normalize('NFC').trim().replace(/^(?:(?:수도권\s*)?\d{1,2}호선|경춘선|경의중앙선|동해선|서해선|교외선|신분당선|신림선)\s+/u,'').replace(/\s+(?:GTX(?:-[A-Z])?)$/u,'').replace(/\s*\((?:경춘선\/경의중앙선|인천국제공항철도)\)$/u,'').replace(/역$/u,'').replace(/\s/g,'');
// Explicit, source-pinned name equivalence only. Never infer missing endpoints,
// reverse a service, alter platforms or accept a truncated calling sequence.
function endpointIdentityMatches(service,journey,bindings=[]){
 const names=[service.operatingEndpoints?.origin||service.osmFrom,service.operatingEndpoints?.destination||service.osmTo];
 const stations=[journey.stations[0],journey.stations.at(-1)];
 if(names.every((n,i)=>legacy(n)===legacy(stations[i].ko)))return true;
 const binding=bindings.find(b=>b.serviceId===service.id);if(!binding)return false;
 if(binding.scope!=='OSM_ENDPOINT_NAME_EQUIVALENCE_ONLY'||binding.serviceStopsSha256!==digest(service.stops)||binding.servicePathsSha256!==digest(service.paths))throw Error('STALE_ENDPOINT_IDENTITY:'+service.id);
 return ['origin','destination'].every((key,i)=>{const p=binding[key];return !!names[i]&&p.candidateName===names[i]&&p.stationId===stations[i].id&&p.stationName===stations[i].ko&&p.sourceUrl==='https://www.openstreetmap.org/relation/'+service.id.split('-').at(-1)&&p.canonicalName&&p.canonicalName===canonical(p.stationName)&&p.candidateCanonicalName===canonical(names[i])&&p.canonicalName===p.candidateCanonicalName});
}
module.exports={endpointIdentityMatches,digest,canonical};
