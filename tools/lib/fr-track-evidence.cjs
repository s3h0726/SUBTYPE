'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {assemble} = require('./uk-osm.cjs');

const railKinds = new Set(['rail', 'subway', 'light_rail', 'tram', 'narrow_gauge', 'funicular', 'monorail']);
const gtfsModes = {train: 'rail', subway: 'subway', tram: 'tramway', light_rail: 'tramway', funicular: 'funicular'};
const plain = name => String(name || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const stationKey = name => plain(name).replace(/^gare (?:de |d['’])?/, '').replace(/[^a-z0-9]+/g, '');

function loadTrackCorrections(sourceDir) {
  const read = file => JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
  const corrections = read('track-stop-corrections.json');
  for (const correction of Object.values(corrections)) {
    correction.supplementalElements = (correction.insertWays || []).flatMap(([, id]) => {
      const {elements} = read('osm/way-' + id + '.json');
      if (!elements.some(element => element.type === 'way' && element.id === id)) {
        throw new Error('Missing supplemental way ' + id);
      }
      return elements;
    });
  }
  return corrections;
}

function readTrack(relation, elements, excludedCalls = [], correction) {
  let reviewed = relation;
  if (correction) {
    const members = relation.members.map(member => ({...member}));
    const supplementalElements = correction.supplementalElements || [];
    if (supplementalElements.length) {
      const combined = new Map(elements.map(element => [element.type + ':' + element.id, element]));
      for (const item of supplementalElements) {
        const key = item.type + ':' + item.id;
        const previous = combined.get(key);
        if (item.type === 'node' && previous && (previous.lat !== item.lat || previous.lon !== item.lon)) {
          throw new Error('Conflicting supplemental track node ' + item.id);
        }
        if (!previous) combined.set(key, item);
      }
      elements = [...combined.values()];
    }
    for (const [after, id] of correction.insertWays || []) {
      const index = members.findIndex(member => member.type === 'way' && member.ref === after);
      if (index < 0 || members.some(member => member.type === 'way' && member.ref === id)) {
        throw new Error('Invalid supplemental way placement ' + id);
      }
      members.splice(index + 1, 0, {type:'way', ref:id, role:''});
    }
    const stopIndex = ref => {
      const index = members.findIndex(member => member.type === 'node' &&
        member.role.startsWith('stop') && member.ref === ref);
      if (index < 0) throw new Error('Reviewed OSM stop member missing: ' + ref);
      return index;
    };
    if (correction.moveStopBefore) {
      const [stop, next] = correction.moveStopBefore;
      const [member] = members.splice(stopIndex(stop), 1);
      members.splice(stopIndex(next), 0, member);
    }
    if (correction.replaceStop) {
      const [stop, replacement] = correction.replaceStop;
      const original = elements.find(element => element.type === 'node' && element.id === stop);
      const other = elements.find(element => element.type === 'node' && element.id === replacement);
      if (!original?.tags?.name || original.tags.name !== other?.tags?.name ||
          stationDistance({latitude:original.lat,longitude:original.lon}, other) > 0.02) {
        throw new Error('Reviewed replacement stop no longer matches: ' + replacement);
      }
      members[stopIndex(stop)].ref = replacement;
    }
    reviewed = {...relation, members};
  }
  const ways = new Map(elements.filter(element => element.type === 'way').map(way => [way.id, way]));
  const members = reviewed.members.filter(member => member.type === 'way' &&
    !member.role.includes('platform') && !member.role.startsWith('stop'));
  for (const member of members) {
    const way = ways.get(member.ref);
    if (!railKinds.has(way?.tags?.railway) || way.tags.service === 'yard') {
      throw new Error('Unverified railway way ' + member.ref);
    }
  }
  const track = assemble(reviewed, elements);
  for (const name of excludedCalls) {
    if (track.stops.filter(stop => stop.tags?.name === name).length !== 1) {
      throw new Error('Unverified non-passenger track waypoint ' + name);
    }
  }
  const retained = track.stops.map((stop,index) => ({stop,index}))
    .filter(({stop}) => !excludedCalls.includes(stop.tags?.name));
  return {...track, members, stops:retained.map(({stop}) => stop),
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

function identifyCalls(track, stations, aliases, mode, family) {
  if (track.stops.length !== stations.length) return null;
  const offsets = stations.map((station, index) => {
    const node = track.stops[index];
    const official = stationKey(station.name);
    const name = node.tags?.name;
    const mapped = stationKey((family === 'rer' && aliases.rer?.[name]) || aliases[name] || name);
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
        const maxStationOffsetKm = identifyCalls(track, calls, aliases, line.mode, pattern.family);
        if (maxStationOffsetKm !== null) {
          matches.push({sourceId: inventory.sourceId, line, pattern, calls, maxStationOffsetKm});
        }
      }
    }
  }
  return matches;
}

module.exports = {findMatches, loadTrackCorrections, readTrack, stationKey};
