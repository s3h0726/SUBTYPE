'use strict';
const fs=require('node:fs'),path=require('node:path');
const clean=v=>String(v||'').normalize('NFC').trim().replace(/^(?:(?:수도권\s*전철|서울\s*지하철|수도권)\s*)?(?:\d{1,2}호선|신분당선|경의중앙선|경춘선|수인분당선)\s+/,'').replace(/\s*\([^)]*\)/g,'').replace(/\s*기차역$/,'').replace(/역$/,'').replace(/\s/g,'');
function provisionalEndpoints(service,journey,{base}={}){
 const names=[service.osmFrom,service.osmTo],st=[journey.stations[0],journey.stations.at(-1)];
 if(names.every((n,i)=>n&&clean(n)===clean(st[i].ko)))return {kind:'SOURCE_ENDPOINT_NAME_EQUIVALENCE',origin:st[0].ko,destination:st[1].ko};
 if(!base)return null;
 const rows=JSON.parse(fs.readFileSync(path.join(base,'official-line-reference.json'),'utf8')),sequence=journey.stations.map(s=>clean(s.ko));
 for(const r of rows){const calls=String(r.stationComposition||'').split(',').map(p=>p.slice(p.indexOf('-')+1)).filter(Boolean).map(clean);if(calls.length<2||calls.length!==sequence.length)continue;
  for(const [direction,expected] of [['SOURCE_ORDER',calls],['REVERSE_ORDER',calls.slice().reverse()]])if(JSON.stringify(expected)===JSON.stringify(sequence)&&names.every((n,i)=>!n||clean(n)===sequence[i]||clean(n)===sequence[sequence.length-1-i]))return {kind:'COMPLETE_OFFICIAL_LINE_CALL_ORDER',origin:st[0].ko,destination:st[1].ko,referenceId:r.id,sourceId:r.source.sourceId,direction};
 }
 if(service.id==='kr-osm-service-14074976'){
  const crypto=require('node:crypto'),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),entry=JSON.parse(fs.readFileSync(path.join(base,'tourism-route-bindings.json'),'utf8')).find(c=>c.serviceId===service.id),bytes=fs.readFileSync(path.join(base,entry.evidenceFile));
  if(entry.sourceUrl!=='https://www.ictr.or.kr/main/wst/infomation.jsp'||hash(bytes)!==entry.evidenceSha256||hash(JSON.stringify(service.paths))!==entry.pathsSha256||hash(JSON.stringify(service.stops))!==entry.stopsSha256||entry.releaseApproved!==false||!entry.officialStations.every(n=>bytes.toString('utf8').includes(n+'역'))||JSON.stringify(journey.stations.map(st=>({id:st.id,platformId:st.platformId,name:st.ko})))!==JSON.stringify(entry.orderedSourceVisits)||!journey.stations.every(st=>entry.officialStations.includes(st.ko))||new Set(journey.stations.map(st=>st.ko)).size!==4)throw Error('STALE_TOURISM_PASSENGER_BINDING');
  return {kind:'OPERATOR_STATIONS_AND_SOURCE_TOURISM_VISITS',origin:st[0].ko,destination:st[1].ko,sourceUrl:entry.sourceUrl,displayName:'월미바다열차 · 관광 모노레일',category:'monorail',returnToOriginStation:true};
 }
 const stationRefs=JSON.parse(fs.readFileSync(path.join(base,'official-station-reference.json'),'utf8')),n=require('./kr-network');
 const code=(value,line)=>{const text=String(value||'');return line==='S2802'?text.replace(/^32/,'2'):String(Number(text))};
 for(const line of rows){const parts=String(line.stationComposition||'').split(',').map(p=>({number:p.slice(0,p.indexOf('-')),name:p.slice(p.indexOf('-')+1)}));if(parts.length!==journey.stations.length||parts.length<2)continue;
  for(const direction of ['SOURCE_ORDER','REVERSE_ORDER']){const expected=direction==='SOURCE_ORDER'?parts:parts.slice().reverse(),references=expected.map(p=>stationRefs.find(r=>r.officialLineCode===line.officialLineCode&&r.number===p.number));if(references.some(r=>!r))continue;
   if(!journey.stations.every((st,i)=>st.officialCode&&code(st.officialCode,line.officialLineCode)===code(expected[i].number,line.officialLineCode)&&Number.isFinite(references[i].coordinates?.lat)&&n.km([st.latitude,st.longitude],[references[i].coordinates.lat,references[i].coordinates.lon])<1))continue;
   if(!names.every((name,i)=>!name||clean(name)===clean(st[i].ko)||clean(name)===clean(expected[i?expected.length-1:0].name)))continue;
   return {kind:'COMPLETE_OFFICIAL_LINE_CODE_AND_POSITION_IDENTITY',origin:st[0].ko,destination:st[1].ko,referenceId:line.id,sourceId:line.source.sourceId,direction,stationReferenceIds:references.map(r=>r.id),stationDisplayNames:references.map(r=>clean(r.names.ko))};
  }
 }
 if(['kr-osm-service-2404374','kr-osm-service-4729409'].includes(service.id)){
  const n=require('./kr-network'),data=n.load(base),maps=n.validate(data).maps,row=require('./kr-research-circuits').auditResearchCircuits(data,maps,base).find(r=>r.serviceId===service.id);
  if(row.closedTrack&&row.uniqueStations===43&&row.visits===44&&row.matchedTrains>0&&row.matchedOfficialDirections.length===1)return {kind:'CLOSED_PASSENGER_CIRCUIT_SOURCE_ORDER',origin:st[0].ko,destination:st[1].ko,matchedOfficialDirection:row.matchedOfficialDirections[0],sourceLabelDirection:row.sourceDirection,sourceLabelConflict:row.sourceDirection!==row.matchedOfficialDirections[0],displayName:'서울 지하철 2호선 순환 · '+journey.stations[0].ko+' → '+journey.stations[1].ko+' → '+journey.stations.at(-1).ko};
 }
 return null;
}
module.exports={provisionalEndpoints,clean};
