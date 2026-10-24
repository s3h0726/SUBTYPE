'use strict';
const fs=require('node:fs'),path=require('node:path'),{assemble}=require('./kr-network');
// Audit only: a closed source line does not establish its operational direction.
// No configuration in this module can authorize a preview or a public service.
function auditResearchCircuits(data,maps,base){
 const source=JSON.parse(fs.readFileSync(path.join(base,'source/osm-relations.json'),'utf8')),trips=JSON.parse(fs.readFileSync(path.join(base,'seoulmetro-trip-candidates.json'),'utf8'));
 const clean=n=>n.replace(/^2호선\s+/,'').replace(/\s*\(2호선\)$/,'').replace(/\(송파구청\)$/,'').replace(/역$/,'').trim();
 return ['2404374','4729409'].map(id=>{
  const s=maps.services.get('kr-osm-service-'+id),j=assemble(s,maps),r=source.find(r=>r.id===id),names=j.stations.slice(0,-1).map(s=>clean(s.ko)),sourceDirection=r.tags.name.includes('외선')?'OUT':'IN';
  const matches=trips.filter(t=>{
   if(t.officialLineCode!=='2'||t.calls.length!==names.length+1||t.calls[0].officialStationCode!==t.calls.at(-1).officialStationCode)return false;
   const calls=t.calls.slice(0,-1).map(c=>c.operationalStationName),offset=calls.indexOf(names[0]);return offset>=0&&names.every((n,i)=>n===calls[(offset+i)%calls.length]);
  });
  const directions=[...new Set(matches.map(t=>t.directionId))],closedTrack=j.stations[0].platformId===j.stations.at(-1).platformId&&JSON.stringify(j.geometry[0])===JSON.stringify(j.geometry.at(-1));
  return{serviceId:s.id,sourceDirection,matchedOfficialDirections:directions,matchedTrains:matches.length,exampleTripIds:[...new Set(matches.map(t=>t.calendarLabel))].map(day=>matches.find(t=>t.calendarLabel===day).id),closedTrack,visits:j.stations.length,uniqueStations:new Set(j.stations.map(s=>s.id)).size,lengthKm:j.lengthKm,missingSourceCodes:j.stations.filter(s=>!s.officialCode).map(s=>s.id),reason:directions.length===1&&directions[0]!==sourceDirection?'OSM_LABEL_OFFICIAL_CALL_ORDER_DIRECTION_CONFLICT':'DIRECTIONAL_PLATFORM_REVIEW_REQUIRED',status:'BLOCKED',releaseApproved:false,sourceUrl:'https://www.data.go.kr/data/15098251/fileData.do',scope:'Cyclic calling-order comparison only. Do not reverse ways, relabel direction or invent a missing terminus to pass.'};
 });
}
module.exports={auditResearchCircuits};
