'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {findMatches, readTrack} = require('./lib/fr-track-evidence.cjs');

const repo = path.resolve(__dirname, '..');
const scheduleDir = path.join(repo, 'data/fr/source/schedules');
const cache = process.argv[2];
if (!cache) throw new Error('Usage: node tools/audit-fr-track-evidence.cjs <source-cache>');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const inventories = ['83582.json', '80921.json'].map(file => read(path.join(scheduleDir, file)));
const aliases = read(path.join(repo, 'data/fr/source/station-aliases.json'));
const exclusions = read(path.join(repo, 'data/fr/source/track-call-exclusions.json'));
const outcomes = [];

for (const file of fs.readdirSync(cache).filter(file => /^fr-osm-\d+\.json$/.test(file)).sort()) {
  const relationId = Number(file.match(/\d+/)[0]);
  const {elements} = read(path.join(cache, file));
  const relation = elements.find(element => element.type === 'relation' && element.id === relationId);
  if (relation?.tags?.type !== 'route') continue;
  const result = {relationId, name: relation.tags.name, reference: relation.tags.ref};
  try {
    const track = readTrack(relation, elements, exclusions[relationId]);
    result.trackCalls = track.stops.map(stop => stop.tags?.name || null);
    result.matches = findMatches(relation, track, inventories, aliases).map(match => ({
      sourceId: match.sourceId, routeId: match.line.sourceRouteId, brand: match.pattern.brand,
      patternId: match.pattern.id, calls: match.calls.map(call => call.name),
      maxStationOffsetKm: match.maxStationOffsetKm,
    }));
    result.status = result.matches.length ? 'MATCHED' : 'BLOCKED';
    if (!result.matches.length) result.reason = 'No independently verified ordered timetable match';
  } catch (error) {
    result.status = 'BLOCKED';
    result.reason = error.message;
  }
  outcomes.push(result);
}
const report = path.join(repo, 'reports/fr/track-evidence.json');
fs.mkdirSync(path.dirname(report), {recursive: true});
fs.writeFileSync(report, JSON.stringify(outcomes, null, 2) + '\n');
console.log(JSON.stringify({checked: outcomes.length, matched: outcomes.filter(result => result.matches?.length).length}));
