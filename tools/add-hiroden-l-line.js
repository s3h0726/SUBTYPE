#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'data', 'lines', 'hiroshimadentetsu');
const target = path.join(base, 'hiroden-l-junkansen');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');

const line = {
  schemaVersion: 1,
  id: 'line-99719',
  legacyId: 'line-99719',
  operatorId: 'hiroshimadentetsu',
  category: 'tram',
  names: {
    ja: '広電循環線(L)',
    kana: 'ひろでんじゅんかんせん(L)',
    ko: '히로덴 순환선(L계통)',
    en: 'Hiroden Loop Line (L)'
  },
  code: 'L',
  color: '#009944',
  symbol: {
    asset: null,
    officialSymbolExists: false,
    source: 'https://www.hiroden.co.jp/train/route-guide/route-all.html',
    verified: true,
    identificationSource: 'official-operator-route-guide',
    identificationUrl: 'https://www.hiroden.co.jp/train/route-guide/route-all.html',
    identificationSearch: '',
    sourceAccess: 'official-page',
    assetSource: 'none',
    assetSourceUrl: '',
    licenseVerified: false,
    identificationFamily: 'official',
    identificationMethod: 'official-route-list',
    identificationVerified: true
  },
  loop: true,
  stationSignTemplate: 'hiroshimadentetsu',
  services: [],
  throughServiceIds: [],
  sources: {
    official: 'https://www.hiroden.co.jp/train/route-guide/route-all.html',
    korean: '',
    geometry: 'reused-existing-hiroden-track-segments',
    koreanName: {
      family: 'manual',
      method: 'translated-from-official-route-name',
      type: 'manual-translation',
      url: 'https://www.hiroden.co.jp/train/route-guide/route-all.html',
      searchReference: '',
      sourceAccess: 'official-page',
      namuwikiStatus: 'not-used',
      verified: true,
      confidence: 'HIGH',
      verifiedDate: '2026-10-12',
      status: 'VERIFIED',
      canonicalPolicy: 'official-route-name',
      note: '공식 운행계통 목록의 循環線(L)을 기준으로 작성.'
    }
  },
  legacy: {
    origin: 'official-route-service',
    coverage: 'service-pattern',
    dataKind: 'operatingRoute'
  },
  officialKoSource: null
};

const stationIds = [
  'station-9971016', 'station-9971015', 'station-9971014', 'station-9971013',
  'station-9971012', 'station-9971011', 'station-9970901', 'station-9971009',
  'station-9971008', 'station-9971007', 'station-9971006', 'station-9971005',
  'station-9971004', 'station-9971003', 'station-9971304', 'station-9971305',
  'station-9971306', 'station-9971307', 'station-9971308', 'station-9971018',
  'station-9971017', 'station-9971016'
];

const sourceDirs = fs.readdirSync(base, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name !== path.basename(target))
  .map(entry => path.join(base, entry.name));
const stationRows = new Map();
const edgeGeometry = new Map();
for (const dir of sourceDirs) {
  const stationsFile = path.join(dir, 'stations.json');
  if (fs.existsSync(stationsFile)) {
    for (const row of readJson(stationsFile)) stationRows.set(row.stationId, row);
  }
  const geometryFile = path.join(dir, 'geometry.json');
  if (fs.existsSync(geometryFile)) {
    for (const [key, value] of Object.entries(readJson(geometryFile))) {
      if (!edgeGeometry.has(key) || (!edgeGeometry.get(key).geometry?.length && value.geometry?.length)) edgeGeometry.set(key, value);
    }
  }
}
const stations = stationIds.map((stationId, index) => {
  const row = stationRows.get(stationId);
  if (!row) throw new Error('Missing station metadata: ' + stationId);
  return { ...row, order: index + 1 };
});
const geometry = {};
for (let i = 0; i < stationIds.length - 1; i++) {
  const from = stationIds[i], to = stationIds[i + 1];
  const key = from + '::' + to, reverseKey = to + '::' + from;
  const found = edgeGeometry.get(key), reverse = edgeGeometry.get(reverseKey);
  if (found) geometry[key] = { ...found, fromStationId: from, toStationId: to };
  else if (reverse) geometry[key] = {
    ...reverse, fromStationId: from, toStationId: to,
    geometry: (reverse.geometry || []).slice().reverse(),
    source: (reverse.source || 'existing track geometry') + ' [reversed for L route]'
  };
  else geometry[key] = {
    fromStationId: from, toStationId: to, geometry: [],
    source: 'existing Hiroden track segment; geometry pending', verified: false
  };
}
fs.mkdirSync(target, { recursive: true });
writeJson(path.join(target, 'line.json'), line);
writeJson(path.join(target, 'stations.json'), stations);
writeJson(path.join(target, 'geometry.json'), geometry);
fs.writeFileSync(path.join(target, 'README.md'),
  '# 広電循環線(L)\n\n' +
  '- ID: line-99719\n' +
  '- Korean: 히로덴 순환선(L계통)\n' +
  '- Route: 広電本社前 → 市役所前・紙屋町東 → 八丁堀 → 稲荷町 → 的場町 → 段原一丁目 → 皆実町六丁目 → 広電本社前\n' +
  '- Official reference: https://www.hiroden.co.jp/train/route-guide/route-all.html\n' +
  '- This is an operating service pattern that reuses existing physical track segments.\n');
console.log('Created Hiroden L-loop route with ' + stations.length + ' ordered station entries.');
