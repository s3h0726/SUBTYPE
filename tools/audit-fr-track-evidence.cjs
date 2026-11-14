'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {findMatches, readTrack} = require('./lib/fr-track-evidence.cjs');

const repo = path.resolve(__dirname, '..');
const scheduleDir = path.join(repo, 'data/fr/source/schedules');
const cache = process.argv[2];
if (!cache) throw new Error('Usage: node tools/audit-fr-track-evidence.cjs <source-cache>');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const requestedSources = process.argv.slice(3);
const inventories = (requestedSources.length ? requestedSources : ['83582', '80921']).map(source => {
  if (!/^\d+$/.test(source)) throw new Error('Invalid source resource ID: ' + source);
  return read(path.join(scheduleDir, source + '.json'));
});
const aliases = read(path.join(repo, 'data/fr/source/station-aliases.json'));
const exclusions = read(path.join(repo, 'data/fr/source/track-call-exclusions.json'));
const callVariants = read(path.join(repo, 'data/fr/source/track-call-variants.json'));
const corrections = read(path.join(repo, 'data/fr/source/track-stop-corrections.json'));
const outcomes = [];
const describeMatches = (relation, track) => findMatches(relation, track, inventories, aliases).map(match => ({
  sourceId: match.sourceId, routeId: match.line.sourceRouteId, brand: match.pattern.brand,
  patternId: match.pattern.id, calls: match.calls.map(call => call.name),
  maxStationOffsetKm: match.maxStationOffsetKm,
}));

for (const file of fs.readdirSync(cache).filter(file => /^fr-osm-\d+\.json$/.test(file)).sort()) {
  const relationId = Number(file.match(/\d+/)[0]);
  const {elements} = read(path.join(cache, file));
  const relation = elements.find(element => element.type === 'relation' && element.id === relationId);
  if (relation?.tags?.type !== 'route') continue;
  const result = {relationId, name: relation.tags.name, reference: relation.tags.ref};
  try {
    const track = readTrack(relation, elements, exclusions[relationId], corrections[relationId]);
    result.trackCalls = track.stops.map(stop => stop.tags?.name || null);
    result.matches = describeMatches(relation, track);
    if (callVariants[relationId]) result.variants = callVariants[relationId].map(variant => ({
      ...variant, matches:describeMatches(relation, readTrack(relation, elements, variant.excludedCalls, corrections[relationId])),
    }));
    result.status = result.matches.length || result.variants?.some(variant => variant.matches.length) ? 'MATCHED' : 'BLOCKED';
    if (result.status === 'BLOCKED') result.reason = 'No independently verified ordered timetable match';
  } catch (error) {
    result.status = 'BLOCKED';
    result.reason = error.message;
  }
  outcomes.push(result);
}
const report = path.join(repo, 'reports/fr/track-evidence.json');
fs.mkdirSync(path.dirname(report), {recursive: true});
fs.writeFileSync(report, JSON.stringify(outcomes, null, 2) + '\n');
console.log(JSON.stringify({checked: outcomes.length, matched: outcomes.filter(result => result.status === 'MATCHED').length}));
