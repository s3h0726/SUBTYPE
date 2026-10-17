'use strict';
function applyOfficialStationNames(stations,stops,reviews,trips){
 const byStop=new Map(stops.map(s=>[s.id,s]));
 for(const r of reviews){
  const station=stations.get(r.stationId);if(!station||station.names.ko!==r.expectedSourceName)throw Error('STALE_STATION_NAME:'+r.stationId);
  if(!r.stopBindings.length||r.stopBindings.some(b=>{const s=byStop.get(b.stopId);return!s||s.stationId!==r.stationId||s.number!==b.expectedSourceNumber}))throw Error('STATION_CODE_BINDING_DRIFT');
  const names=new Set(trips.filter(t=>t.sourceId===r.sourceId&&t.officialLineCode===r.officialLineCode).flatMap(t=>t.calls.filter(c=>c.officialStationCode===r.officialStationCode).map(c=>c.operationalStationName)));
  if(names.size!==1||!names.has(r.officialName))throw Error('OFFICIAL_STATION_NAME_AMBIGUOUS');
  // Correct only the display name. Platform/direction/status are not approved.
  station.names={...station.names,ko:r.officialName};
 }
}
module.exports={applyOfficialStationNames};
