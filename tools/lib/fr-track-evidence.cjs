'use strict';

const {assemble} = require('./uk-osm.cjs');

const railKinds = new Set(['rail', 'subway', 'light_rail', 'tram', 'narrow_gauge', 'funicular', 'monorail']);
const gtfsModes = {train: 'rail', subway: 'subway', tram: 'tramway', light_rail: 'tramway', funicular: 'funicular'};
const plain = name => String(name || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const stationKey = name => plain(name).replace(/^gare (?:de |d['’])?/, '').replace(/[^a-z0-9]+/g, '');

function readTrack(relation, elements, excludedCalls = []) {
  const ways = new Map(elements.filter(element => element.type === 'way').map(way => [way.id, way]));
  const members = relation.members.filter(member => member.type === 'way' &&
    !member.role.includes('platform') && !member.role.startsWith('stop'));
  for (const member of members) {
    const way = ways.get(member.ref);
    if (!railKinds.has(way?.tags?.railway) || way.tags.service === 'yard') {
      throw new Error('Unverified railway way ' + member.ref);
    }
  }
  const track = assemble(relation, elements);
  for (const name of excludedCalls) {
    if (track.stops.filter(stop => stop.tags?.name === name).length !== 1) {
      throw new Error('Unverified non-passenger track waypoint ' + name);
    }
  }
  const retained = track.stops.map((stop,index) => ({stop,index}))
    .filter(({stop}) => !excludedCalls.includes(stop.tags?.name));
  return {...track, stops:retained.map(({stop}) => stop),
    aligned:retained.map(({index}) => track.aligned[index])};
}

function stationDistance(station, node) {
  if (station.latitude === '' || station.longitude === '') return Infinity;
  const coordinates = [[Number(station.latitude), Number(station.longitude)],
    ...Object.values(station.platformLocations || {})];
  return Math.min(...coordinates.map(([latitude, longitude]) =>
    Math.hypot((latitude - node.lat) * 111.2,
      (longitude - node.lon) * 111.2 * Math.cos(latitude * Math.PI / 180))));
}

function identifyCalls(track, stations, aliases, mode) {
  if (track.stops.length !== stations.length) return null;
  const offsets = stations.map((station, index) => {
    const node = track.stops[index];
    const official = stationKey(station.name);
    const mapped = stationKey(aliases[node.tags?.name] || node.tags?.name);
    if (!official || official !== mapped) return Infinity;
    return stationDistance(station, node);
  });
  const maximum = Math.max(...offsets);
  return maximum <= (mode === 'rail' ? 0.65 : 0.30) ? maximum : null;
}

function findMatches(relation, track, inventories, aliases) {
  const matches = [];
  for (const inventory of inventories) {
    const stations = new Map(inventory.stations.map(station => [station.id, station]));
    for (const line of inventory.lines) {
      if (gtfsModes[relation.tags.route] !== line.mode) continue;
      for (const pattern of line.patterns) {
        if (pattern.brand && /^(car|bus) /i.test(pattern.brand)) continue;
        const calls = pattern.stationIds.map(id => stations.get(id));
        const maxStationOffsetKm = identifyCalls(track, calls, aliases, line.mode);
        if (maxStationOffsetKm !== null) {
          matches.push({sourceId: inventory.sourceId, line, pattern, calls, maxStationOffsetKm});
        }
      }
    }
  }
  return matches;
}

module.exports = {findMatches, readTrack, stationKey};
