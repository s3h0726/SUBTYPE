'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {findMatches, readTrack} = require('./lib/fr-track-evidence.cjs');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, data) => {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, JSON.stringify(data) + '\n');
};
const stable = (...values) => createHash('sha256').update(JSON.stringify(values)).digest('hex').slice(0, 24);
const names = read('data/fr/source/station-names-ko.json');
const aliases = read('data/fr/source/station-aliases.json');
const exclusions = read('data/fr/source/track-call-exclusions.json');
const specs = read('data/fr/source/release-lines.json');
const inventories = new Map([...new Set(specs.map(spec => spec.sourceId))].map(id =>
  [id, read('data/fr/source/schedules/' + id + '.json')]));
const ratp = {ko: '파리 교통공사', fr: 'Régie autonome des transports parisiens', en: 'RATP'};
const sncf = {ko: '프랑스국철 여객', fr: 'SNCF Voyageurs', en: 'SNCF Voyageurs'};
const lyon = {ko: '파리 교통공사 개발 리옹', fr: 'RATP Dev Lyon', en: 'RATP Dev Lyon'};
const sourceUrls = {
  83582: 'https://transport.data.gouv.fr/datasets/horaires-sncf',
  80921: 'https://transport.data.gouv.fr/datasets/reseau-urbain-et-interurbain-dile-de-france-mobilites',
  81943: 'https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-transports-en-commun-lyonnais',
};
const geometryTiles = new Map();
const usedWays = new Map();
const allStations = new Map();
const routes = [];
// RATP's Gare de Lyon interchange and SNCF's halls share one station complex.
const gareDeLyon = new Set(['80921:IDFM:73626', '83582:StopArea:OCE87686006']);

function tileWay(way, nodes) {
  const points = way.nodes.map(id => {
    const node = nodes.get(id);
    if (!node) throw new Error('Missing physical node ' + id);
    return [node.lat, node.lon];
  });
  const [lat, lon] = points[0];
  const tile = Math.floor(lat) + '_' + Math.floor(lon);
  if (!geometryTiles.has(tile)) geometryTiles.set(tile, {});
  const ways = geometryTiles.get(tile);
  const value = {nodes: way.nodes, points};
  if (ways[way.id] && JSON.stringify(ways[way.id]) !== JSON.stringify(value)) {
    throw new Error('Conflicting track evidence for way ' + way.id);
  }
  ways[way.id] = value;
  return 'data/fr/generated/geometry/' + tile + '.json';
}

function connectedLegs(relation, track, files) {
  const edgeRefs = new Map();
  for (const member of relation.members) {
    if (member.type !== 'way' || member.role.includes('platform') || member.role.startsWith('stop')) continue;
    const way = track.ways.get(member.ref);
    files.add(tileWay(way, track.nodes));
    for (let index = 1; index < way.nodes.length; index++) {
      const start = way.nodes[index - 1];
      const end = way.nodes[index];
      edgeRefs.set(start + ':' + end, [way.id, index - 1, index]);
      edgeRefs.set(end + ':' + start, [way.id, index, index - 1]);
    }
  }
  return track.aligned.slice(1).map((to, legIndex) => {
    const spans = [];
    for (let index = track.aligned[legIndex]; index < to; index++) {
      const edge = edgeRefs.get(track.refs[index] + ':' + track.refs[index + 1]);
      if (!edge) throw new Error('Track edge has no source way');
      const previous = spans.at(-1);
      if (previous?.[0] === edge[0] && previous[2] === edge[1] &&
          Math.sign(previous[2] - previous[1]) === Math.sign(edge[2] - edge[1])) {
        previous[2] = edge[2];
      } else {
        spans.push([...edge]);
      }
    }
    return spans;
  });
}

for (const spec of specs) {
  const inventory = inventories.get(spec.sourceId);
  const isLyon = spec.sourceId === 81943;
  const isMetro = spec.sourceId === 80921 || isLyon;
  const stationCatalog = new Map();
  const files = new Set();
  const patterns = [];
  let officialLineId;
  let color;
  for (const relationId of spec.relations) {
    const {elements} = read('data/fr/source/osm/' + relationId + '.json');
    const relation = elements.find(element => element.type === 'relation' && element.id === relationId);
    // Lyon’s old OSM operator label remains useful for track identity. TCL
    // confirms RATP Dev took over metro operation on 2025-01-01.
    const operatorMatches = isLyon ? relation?.tags?.network === 'TCL' :
      relation?.tags?.operator === (isMetro ? 'RATP' : 'SNCF Voyageurs');
    if (!operatorMatches) {
      throw new Error('Unexpected operator for relation ' + relationId);
    }
    const track = readTrack(relation, elements, exclusions[relationId]);
    const matches = findMatches(relation, track, [inventory], aliases).filter(match =>
      spec.routeId ? match.line.sourceRouteId === spec.routeId : match.pattern.brand === spec.brand);
    if (!matches.length) throw new Error('No current timetable match for ' + relationId);
    const {calls, line, maxStationOffsetKm} = matches[0];
    if (officialLineId && officialLineId !== line.sourceRouteId ||
        matches.some(match => match.line.sourceRouteId !== line.sourceRouteId ||
          match.calls.some((call, index) => call.id !== calls[index].id))) {
      throw new Error('Ambiguous timetable line or stations for ' + relationId);
    }
    officialLineId = line.sourceRouteId;
    color = relation.tags.colour || '#804357';
    const stationIds = calls.map(call => {
      const id = 'fr-stop-' + stable(spec.sourceId, call.id);
      const ko = names[call.name];
      if (!/[가-힣]/.test(ko || '')) throw new Error('Missing reviewed Korean name for ' + call.name);
      const physicalStationId = gareDeLyon.has(spec.sourceId + ':' + call.id) ? 'fr-gare-de-lyon' : id;
      const station = {id, stationMasterId: id, physicalStationId, countryId: 'fr',
        sourceId: call.id, ko, fr: call.name, ja: call.name, en: call.name, romaji: call.name,
        latitude: Number(call.latitude), longitude: Number(call.longitude),
        koSource: 'data/fr/source/station-names-ko.json'};
      stationCatalog.set(id, station);
      allStations.set(id, station);
      return id;
    });
    const legs = connectedLegs(relation, track, files);
    for (const wayId of new Set(legs.flat().map(span => span[0]))) {
      usedWays.set(wayId, (usedWays.get(wayId) || 0) + 1);
    }
    const directionless = [stationIds.join(','), [...stationIds].reverse().join(',')].sort()[0];
    const via = (spec.via || (spec.id === 'fr-tgv-paris-besancon' ? ['Dole', 'Besançon Franche-Comté TGV'] : []))
      .map(name => stationIds[calls.findIndex(call => call.name === name)]).find(Boolean) || null;
    const familyId = isMetro ? spec.id + '-local' : 'fr-service-' + stable(spec.id, directionless);
    patterns.push({
      id: 'fr-play-' + stable(spec.id, stationIds), familyId, stationIds, legs, viaStationId: via,
      nameKo: isMetro ? '각역정차' : spec.serviceKo || '테제베 이누이',
      nameFr: isMetro ? 'Métro' : spec.brand,
      evidence: {
        relationId, version: relation.version, timestamp: relation.timestamp, maxStationOffsetKm,
        stationNodes: track.stops.map(stop => stop.id),
        sourcePatterns: matches.map(match => match.pattern.id), scheduleResourceId: spec.sourceId,
        firstDate: matches.map(match => match.pattern.firstDate).sort()[0],
        lastDate: matches.map(match => match.pattern.lastDate).sort().at(-1),
      },
    });
  }
  const stations = [...stationCatalog.values()];
  const operator = isLyon ? lyon : isMetro ? ratp : sncf;
  const route = {id: spec.id, countryId: 'fr', operatorId: isLyon ? 'fr-ratp-dev-lyon' : isMetro ? 'fr-ratp' : 'fr-sncf-voyageurs',
    operator, line: {ko: spec.ko, fr: spec.fr, ja: spec.fr, en: spec.fr}, code: spec.code,
    lineColor: color, category: isMetro ? 'subway' : spec.category || (spec.international ? 'international' : 'high_speed_rail'), mode: 'rail',
    playable: true, geometryReady: true, geometryStatus: 'verified-osm-track',
    geometrySource: {type: 'openstreetmap', license: 'ODbL-1.0', attribution: '© OpenStreetMap contributors'},
    sourceUrl: sourceUrls[spec.sourceId], sourceRouteId: officialLineId, regionCodes: spec.regionCodes,
    ...(isLyon ? {operatorSourceUrl: 'https://www.tcl.fr/a-propos/offres-demploi'} : {}),
    stationCatalog: stations, stations, patterns, geometryFiles: [...files].sort(),
    services: patterns.map(pattern => ({id: pattern.id, nameKo: pattern.nameKo, nameEn: pattern.nameFr,
      nameJa: pattern.nameFr, stops: pattern.stationIds})), serviceCount: patterns.length,
  };
  routes.push(route);
}

for (const [tile, ways] of geometryTiles) write('data/fr/generated/geometry/' + tile + '.json', {ways});
for (const route of routes) write('data/fr/generated/routes/' + route.id + '.json', route);
const indexRoutes = routes.map(({stations, stationCatalog, patterns, services, ...meta}) => ({
  ...meta, lazy: true, lazySource: 'data/fr/generated/routes/' + meta.id + '.json',
  stationCount: stationCatalog.length, stationSequence: stationCatalog.map(station => station.id),
  transferStationIds: [...new Set(stationCatalog.map(station => station.physicalStationId))],
  searchStations: [...new Set(stationCatalog.flatMap(station => [station.ko, station.fr]))],
}));
const operators = [...new Map(routes.map(route => [route.operatorId, {id:route.operatorId,names:route.operator}])).values()];
write('data/fr/generated/index.json', {
  country: {id: 'fr', names: {ko: '프랑스', fr: 'France', en: 'France'}},
  operators, routes: indexRoutes,
  sourceNotice: '운행 정보: 프랑스국철 여객·일드프랑스 모빌리테·시트랄 모빌리테 · 선로: © OpenStreetMap 기여자 (ODbL)',
});
write('reports/fr/playable-catalog.json', {
  operators: operators.length, serviceLines: routes.length,
  playableDirections: routes.reduce((total, route) => total + route.patterns.length, 0),
  stationIds: allStations.size, koreanNamedStations: allStations.size,
  physicalStationGroups: new Set([...allStations.values()].map(station => station.physicalStationId)).size,
  uniquePhysicalWays: usedWays.size, sharedPhysicalWays: [...usedWays.values()].filter(count => count > 1).length,
  lines: routes.map(route => ({id: route.id, sourceRouteId: route.sourceRouteId, category: route.category,
    regions: route.regionCodes, status: 'PARTIALLY_IMPLEMENTED',
    patterns: route.patterns.map(pattern => ({id: pattern.id, ...pattern.evidence,
      status: 'VERIFIED_ADDED', stationCount: pattern.stationIds.length}))})),
});
console.log('Generated ' + routes.length + ' France lines using ' + allStations.size + ' localized stations');
