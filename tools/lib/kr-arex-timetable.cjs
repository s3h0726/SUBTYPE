'use strict';

function applyArexShortTurns(batches, evidence) {
 const route = batches.flatMap(batch => batch.routes).find(route => route.id === evidence.routeId);
 if (!route) throw Error('AREX timetable route missing: ' + evidence.routeId);

 for (const pattern of evidence.patterns) {
  const parent = route.verifiedJourneys.find(journey => journey.id === pattern.parentJourneyId);
  if (!parent) throw Error('AREX parent journey missing: ' + pattern.parentJourneyId);
  const from = parent.stations.findIndex(station => station.ko === pattern.fromStation);
  const to = parent.stations.findIndex(station => station.ko === pattern.toStation);
  if (from < 0 || to <= from || (from === 0 && to === parent.stations.length - 1)) throw Error('AREX short-turn termini: ' + pattern.id);
  if (route.verifiedJourneys.some(j => j.id === pattern.id)) throw Error('Duplicate AREX short-turn ID: ' + pattern.id);

  const start = parent.stations[from].geometryIndex;
  const end = parent.stations[to].geometryIndex;
  const stations = parent.stations.slice(from, to + 1).map(station => ({
   ...station,
   geometryIndex: station.geometryIndex - start
  }));
  const geometry = parent.geometry.slice(start, end + 1);
  if (route.verifiedJourneys.some(j => JSON.stringify(j.stations.map(s=>s.id)) === JSON.stringify(stations.map(s=>s.id)))) throw Error('Existing AREX pattern already covers requested station sequence: ' + pattern.id);
  const timetableEvidence = {
   url: pattern.url,
   checkedAt: pattern.checkedAt || evidence.checkedAt,
   operatorNotice: evidence.operatorNotice,
   sourceId: pattern.sourceId,
   ...(pattern.serviceDay ? { serviceDay:pattern.serviceDay } : {}),
   ...(pattern.observedDeparture ? { observedDeparture:pattern.observedDeparture } : {}),
   ...(pattern.corroborationUrl ? { corroborationUrl:pattern.corroborationUrl } : {}),
   ...(pattern.evidenceExplanation ? { evidenceExplanation:pattern.evidenceExplanation } : {})
  };
  const service = {
   id: pattern.id,
   nameKo: pattern.nameKo,
   nameJa: pattern.nameKo,
   nameEn: '',
   stops: stations.map(station => station.id)
  };
  route.verifiedJourneys.push({
   id: pattern.id,
   patternId: pattern.id,
   patternName: { ko: pattern.nameKo },
   directionId: parent.directionId,
   // This operator board exposes a destination code, rather than a train number.
   tripIds: [pattern.sourceId],
   sourcePatternId: pattern.sourceId,
   timetableEvidence,
   stations,
   geometry,
   service,
   directedSegments: parent.directedSegments.slice(from, to)
  });
 }
}

module.exports = { applyArexShortTurns };
