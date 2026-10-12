#!/usr/bin/env node
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const { loadStations, writeAtomic } = require('./lib/line-workspaces');
const base = path.join(root, 'data', 'lines', 'toyamachihotetsudo');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const stationMap = loadStations().map;
const southFile = path.join(base, 'toyamachitetsushinaisen-1-2keito');
const loopFile = path.join(base, 'toyamachitetsutoyamatoshinsen-3keito-kanjosen');
const portFile = path.join(base, 'toyamakosen');
const southRows = readJson(path.join(southFile, 'stations.json'));
const loopRows = readJson(path.join(loopFile, 'stations.json'));
const portRows = readJson(path.join(portFile, 'stations.json'));
const southIds = southRows.map(x => x.stationId).filter((id, i, a) => !(id === 'station-9941321'));
const toyamaIndex = southIds.indexOf('station-1140501');
if (toyamaIndex < 0) throw new Error('Toyama Station missing from city-line source');
const southToToyama = southIds.slice(0, toyamaIndex + 1);
const toyamaToUniversity = southIds.slice(toyamaIndex);
const loopIds = loopRows.map(x => x.stationId);
const portIds = portRows.map(x => x.stationId);
const loopOnly = loopIds.filter((id, i) => i === 0 || id !== loopIds[i - 1]);
const edgeMap = new Map();
for (const dir of [southFile, loopFile, portFile]) {
  const file = path.join(dir, 'geometry.json');
  for (const [key, value] of Object.entries(readJson(file))) if (!edgeMap.has(key) || (!edgeMap.get(key).geometry?.length && value.geometry?.length)) edgeMap.set(key, value);
}
const routeSpecs = [
  { n: 1, ja: '富山地鉄市内電車 1系統', kana: 'とやまちてつしないでんしゃ1けいとう', ko: '도야마 지방철도 시내전차 1계통', en: 'Toyama City Tram Route 1', ids: southToToyama, loop: false },
  { n: 2, ja: '富山地鉄市内電車 2系統', kana: 'とやまちてつしないでんしゃ2けいとう', ko: '도야마 지방철도 시내전차 2계통', en: 'Toyama City Tram Route 2', ids: [...southToToyama, ...toyamaToUniversity.slice(1)], loop: false },
  { n: 3, ja: '富山地鉄市内電車 3系統(環状線)', kana: 'とやまちてつしないでんしゃ3けいとう(かんじょうせん)', ko: '도야마 지방철도 시내전차 3계통(순환선)', en: 'Toyama City Tram Route 3 (Loop)', ids: loopOnly, loop: true },
  { n: 4, ja: '富山地鉄市内電車 4系統', kana: 'とやまちてつしないでんしゃ4けいとう', ko: '도야마 지방철도 시내전차 4계통', en: 'Toyama City Tram Route 4', ids: [...portIds].reverse().concat(southToToyama.slice(0, -1).reverse()), loop: false },
  { n: 5, ja: '富山地鉄市内電車 5系統', kana: 'とやまちてつしないでんしゃ5けいとう', ko: '도야마 지방철도 시내전차 5계통', en: 'Toyama City Tram Route 5', ids: [...portIds].reverse().concat(toyamaToUniversity.slice(1)), loop: false },
  { n: 6, ja: '富山地鉄市内電車 6系統(環状線直通)', kana: 'とやまちてつしないでんしゃ6けいとう(かんじょうせんちょくつう)', ko: '도야마 지방철도 시내전차 6계통(순환선 직통)', en: 'Toyama City Tram Route 6 (Loop through-service)', ids: [...portIds].reverse().concat(['station-9941314', 'station-9941315', 'station-9941316'], loopOnly.slice(1), ['station-1140501'], portIds.slice(1)), loop: false }
];
function stationRows(ids) {
  return ids.map((stationId, i) => {
    if (!stationMap.has(stationId)) throw new Error('Unknown station in route: ' + stationId);
    return { stationId, order: i + 1, stationCode: null, hasOfficialStationCode: false, stationCodeSource: { type: 'none', url: '', verified: false, confidence: null, status: 'NO_OFFICIAL_CODE' } };
  });
}
function routeGeometry(ids) {
  const out = {};
  for (let i = 0; i < ids.length - 1; i++) {
    const from = ids[i], to = ids[i + 1], key = from + '::' + to, reverseKey = to + '::' + from;
    if (edgeMap.has(key)) out[key] = { ...edgeMap.get(key), fromStationId: from, toStationId: to };
    else if (edgeMap.has(reverseKey)) {
      const value = edgeMap.get(reverseKey);
      out[key] = { ...value, fromStationId: from, toStationId: to, geometry: (value.geometry || []).slice().reverse(), source: (value.source || 'shared geometry') + ' [reversed for service pattern]' };
    } else out[key] = { fromStationId: from, toStationId: to, geometry: [], source: 'geometry pending; route sequence derived from existing line datasets', verified: false };
  }
  return out;
}
for (const spec of routeSpecs) {
  const id = 'line-toyama-city-' + spec.n;
  const folder = path.join(base, 'toyama-city-route-' + spec.n);
  const line = {
    schemaVersion: 1, id, legacyId: id, operatorId: 'toyamachihotetsudo', category: 'tram',
    names: { ja: spec.ja, kana: spec.kana, ko: spec.ko, en: spec.en },
    code: String(spec.n), color: ['#7FBE2D','#7FBE2D','#36BE2D','#7FBE2D','#7FBE2D','#36BE2D'][spec.n-1],
    symbol: { asset: null, officialSymbolExists: false, source: 'https://www.chitetsu.co.jp/english/jp/trams/', verified: true },
    loop: spec.loop, stationSignTemplate: 'toyamachihotetsudo', services: [], throughServiceIds: [],
    sources: { official: 'https://www.chitetsu.co.jp/english/jp/trams/', korean: '', geometry: 'reused from existing Toyama city-tram and Toyama Port Line geometry', routePattern: 'officially listed service pattern' },
    legacy: { origin: 'official-service-pattern', coverage: 'operating-route', dataKind: 'operatingRoute' }
  };
  fs.mkdirSync(folder, { recursive: true });
  writeAtomic(path.join(folder, 'line.json'), line);
  writeAtomic(path.join(folder, 'stations.json'), stationRows(spec.ids));
  writeAtomic(path.join(folder, 'geometry.json'), routeGeometry(spec.ids));
  fs.writeFileSync(path.join(folder, 'README.md'), '# ' + spec.ja + '\n\n- Korean: ' + spec.ko + '\n- Official reference: https://www.chitetsu.co.jp/english/jp/trams/\n- This is an operating service pattern, not a separate physical track line.\n');
}
// Remove the old combined 1・2 route so it is no longer presented as one route.
fs.rmSync(southFile, { recursive: true, force: true });
console.log(JSON.stringify({ routes: routeSpecs.map(x => ({ id: 'line-toyama-city-' + x.n, stations: x.ids.length })), removedCombinedRoute: true }, null, 2));
