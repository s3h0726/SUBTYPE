#!/usr/bin/env node
/* Correct the canonical Keio New Line order and split its existing verified MLIT geometry. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const stationFile = path.join(root, 'data', 'lines', 'keio', 'keioshinsen', 'stations.json');
const geometryFile = path.join(root, 'data', 'lines', 'keio', 'keioshinsen', 'geometry.json');
const stations = JSON.parse(fs.readFileSync(stationFile, 'utf8'));
const geometry = JSON.parse(fs.readFileSync(geometryFile, 'utf8'));

const ids = {
  shinjuku: 'station-1130208',
  hatsudai: 'station-mlit-003764',
  hatagaya: 'station-mlit-003791',
  sasazuka: 'station-2400104'
};
const byId = new Map(stations.map(station => [station.stationId, station]));
const desiredIds = [ids.shinjuku, ids.hatsudai, ids.hatagaya, ids.sasazuka];
if (desiredIds.some(id => !byId.has(id))) throw new Error('Keio New Line canonical station set is incomplete');

const master = geometry[`${ids.shinjuku}::${ids.sasazuka}`]?.geometry;
const hatsudaiPoint = geometry[`${ids.sasazuka}::${ids.hatsudai}`]?.geometry?.at(-1);
const hatagayaPoint = geometry[`${ids.hatsudai}::${ids.hatagaya}`]?.geometry?.at(-1);
if (!master || !hatsudaiPoint || !hatagayaPoint) throw new Error('Verified Keio New Line MLIT geometry is unavailable');

const distanceSquared = (a, b) => ((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2);
const nearestIndex = point => master.reduce(
  (best, candidate, index) => distanceSquared(candidate, point) < best.distance
    ? { index, distance: distanceSquared(candidate, point) }
    : best,
  { index: -1, distance: Number.POSITIVE_INFINITY }
).index;
const hatsudaiIndex = nearestIndex(hatsudaiPoint);
const hatagayaIndex = nearestIndex(hatagayaPoint);
if (!(0 < hatsudaiIndex && hatsudaiIndex < hatagayaIndex && hatagayaIndex < master.length - 1)) {
  throw new Error(`Cannot split Keio New Line geometry: ${hatsudaiIndex}, ${hatagayaIndex}`);
}

const orderedStations = desiredIds.map((id, index) => ({ ...byId.get(id), order: index + 1 }));
const parts = [
  [ids.shinjuku, ids.hatsudai, master.slice(0, hatsudaiIndex + 1)],
  [ids.hatsudai, ids.hatagaya, master.slice(hatsudaiIndex, hatagayaIndex + 1)],
  [ids.hatagaya, ids.sasazuka, master.slice(hatagayaIndex)]
];
const correctedGeometry = Object.fromEntries(parts.map(([fromStationId, toStationId, coordinates]) => [
  `${fromStationId}::${toStationId}`,
  { fromStationId, toStationId, geometry: coordinates }
]));

fs.writeFileSync(stationFile, `${JSON.stringify(orderedStations, null, 2)}\n`);
fs.writeFileSync(geometryFile, `${JSON.stringify(correctedGeometry, null, 2)}\n`);
console.log(JSON.stringify({
  stationOrder: orderedStations.map(station => station.stationId),
  geometrySegments: parts.map(([, , coordinates]) => coordinates.length)
}, null, 2));
