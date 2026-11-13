export const FRANCE_CATEGORIES = [
  ['all', '전체'], ['high_speed_rail', '고속철도'], ['intercity', '도시간 철도'],
  ['regional_rail', '지역철도'], ['rer', '광역급행철도'], ['commuter_rail', '교외철도'],
  ['subway', '지하철'], ['tram', '트램'], ['light_rail', '경전철'], ['funicular', '케이블 철도'],
  ['international', '국제철도'], ['custom', '커스텀'],
];

let franceEdits = new Map();
let franceNameGroups = new Map();

export function configureFranceNames(edits, stationNameGroups = {}) {
  franceEdits = new Map();
  franceNameGroups = new Map(Object.entries(stationNameGroups));
  for (const [line, stations] of Object.entries(edits.stations || {}).sort()) {
    if (!line.startsWith('fr-')) continue;
    for (const [id, name] of Object.entries(stations)) {
      if (id.startsWith('fr-stop-') && typeof name === 'string' && name.trim()) {
        franceEdits.set(franceNameGroups.get(id) || id, name.trim());
      }
    }
  }
}

export function franceStationPresentation(station) {
  return {
    ...station, ko: franceEdits.get(franceNameGroups.get(station.id) || station.id) || station.ko, kana: '',
    routeSpecificStationName: true,
  };
}

export function franceSearchNames(route) {
  return [...new Set([...route.searchStations,
    ...route.stationSequence.map(id => franceEdits.get(franceNameGroups.get(id) || id)).filter(Boolean)])];
}

export function francePatternRoute(owner, pattern) {
  const stationsById = new Map(owner.stationCatalog.map(station => [station.id, station]));
  const geometry = [];
  const stations = [];
  const directedSegments = [];
  const {evidence, stationIds, legs} = pattern;
  if (!evidence?.relationId || legs.length !== stationIds.length - 1 || !legs.length) {
    throw new Error('프랑스 운행계통의 선로 근거가 없습니다.');
  }
  for (const [index, leg] of legs.entries()) {
    const points = [];
    let lastNode = evidence.stationNodes[index];
    for (const [wayId, from, to] of leg) {
      const way = owner.franceWays[wayId];
      if (!way || !Number.isInteger(from) || !Number.isInteger(to) || from === to ||
          way.nodes[from] !== lastNode || way.nodes[to] === undefined) {
        throw new Error('프랑스 운행계통의 선로가 연결되지 않았습니다.');
      }
      const span = way.points.slice(Math.min(from, to), Math.max(from, to) + 1);
      if (from > to) span.reverse();
      points.push(...(points.length ? span.slice(1) : span));
      lastNode = way.nodes[to];
    }
    const fromStation = stationsById.get(stationIds[index]);
    const toStation = stationsById.get(stationIds[index + 1]);
    if (!fromStation || !toStation || points.length < 2 || lastNode !== evidence.stationNodes[index + 1]) {
      throw new Error('프랑스 운행계통의 정차역과 선로가 일치하지 않습니다.');
    }
    stations.push({...fromStation, latitude: points[0][0], longitude: points[0][1],
      geometryIndex: Math.max(0, geometry.length - 1)});
    geometry.push(...(geometry.length ? points.slice(1) : points));
    directedSegments.push({fromStationId: fromStation.id, toStationId: toStation.id, geometry: points,
      source: {type: 'openstreetmap', relationId: evidence.relationId, verified: true}});
  }
  const [latitude, longitude] = geometry.at(-1);
  stations.push({...stationsById.get(stationIds.at(-1)), latitude, longitude, geometryIndex: geometry.length - 1});
  const service = owner.services.find(item => item.id === pattern.id);
  if (!service) throw new Error('프랑스 열차의 운행 등급이 없습니다.');
  return {...owner, lazy: false, loop: false, geometry, stations, directedSegments,
    selectedServiceId: pattern.id, services: [service], serviceJourney: {id: pattern.id},
    operatingPatternName: service.nameKo};
}

export function franceOperatingChoices(route) {
  if (route?.lazy || !route?.playable || !route.geometryReady) return [];
  const stations = new Map(route.stationCatalog.map(station => [station.id, station]));
  return route.patterns.map(pattern => {
    const originId = pattern.stationIds[0], destinationId = pattern.stationIds.at(-1);
    const via = pattern.viaStationId ? ' · ' + stations.get(pattern.viaStationId).ko + ' 경유 · ' + pattern.stationIds.length + '개 역' : '';
    const service = route.services.find(item => item.id === pattern.id);
    return {kind: 'france', id: pattern.id, patternId: pattern.familyId, legacyServiceId: pattern.id,
      originId, destinationId, originNames: stations.get(originId), destinationNames: stations.get(destinationId),
      patternName: {ko: service.nameKo + via, fr: pattern.nameFr}, direction: pattern.id};
  });
}

export function resolveFranceChoice(choice, owner) {
  const pattern = owner?.patterns?.find(item => item.id === choice.id);
  if (!pattern || !owner.playable || !owner.geometryReady) throw new Error('검증된 운행계통을 찾을 수 없습니다.');
  const route = francePatternRoute(owner, pattern);
  const originStationId = route.stations[0].id;
  const destinationStationId = route.stations.at(-1).id;
  return {route, service: route.services[0], direction: 'forward', destinationStationId,
    pattern: {id: pattern.id, names: choice.patternName},
    journey: {id: pattern.id, originStationId, destinationStationId}};
}

export function franceFreeDriveRoutes(routes) {
  return routes.filter(route => route.countryId === 'fr' && !route.lazy && route.patterns?.length)
    .flatMap(route => route.patterns.map((pattern, index) => ({
      ...francePatternRoute(route, pattern), id: index ? route.id + '--' + pattern.id : route.id,
      patterns: [], physicalLineId: route.id, oneWay: true,
    })));
}
