'use strict';

// Import independently reviewed passenger services without replacing any published source.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const { assemble, assembleCalls, assembleTrack } = require('./lib/uk-osm.cjs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const review = read(process.argv[2]);
assert(review.sourceExtract?.url && /^\d{4}-\d{2}-\d{2}$/.test(review.sourceExtract.fetchedAt), 'Original extract provenance is required');
const snapshots = path.resolve(process.argv[3]);
const nationalFile = 'data/uk/source/national/expansion-ii.json';
const regionalFile = 'data/uk/source/regional/release-evidence.json';
const provenanceFile = 'data/uk/source/national/osm-extract-sources.json';
const national = read(nationalFile), regional = read(regionalFile), provenance = read(provenanceFile);
const names = new Map(['expansion-station-names-ko.txt', 'station-names-ko.txt', 'regional-station-names-ko.txt'].flatMap(file => fs.readFileSync('data/uk/' + file, 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => line.split('='))));
const copies = new Map();
let imported = 0;
for (const network of review.networks) {
  const destination = network.appendTo === 'regional' ? regional : national;
  let target = destination.networks.find(row => row.id === network.id);
  if (!target) {
    assert(!network.appendTo, 'An append batch must name an existing corridor');
    target = { ...network, patterns: [] };
    destination.networks.push(target);
  }
  const existing = target.patterns || [];
  assert(target.patterns, 'Expected explicit reviewed patterns');
  for (const spec of network.patterns) {
    const name = spec.relationId + '.json.gz';
    const destinationFile = path.join('data/uk/source/osm', name);
    const file = fs.existsSync(destinationFile) ? destinationFile : path.join(snapshots, name);
    const source = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
    const relation = source.elements.find(row => row.type === 'relation' && row.id === spec.relationId);
    assembleTrack(relation, source.elements, { activeRailOnly: true });
    const result = spec.reviewedGraph
      ? require('./lib/uk-reviewed-graph.cjs').assembleReviewedGraph([relation], source.elements, spec.calls, spec.aliases)
      : spec.calls ? assembleCalls(relation, source.elements, spec.calls) : assemble(relation, source.elements);
    if (spec.expectedStopNodeIds) assert.deepEqual(result.aligned.map(index => result.refs[index]), spec.expectedStopNodeIds, 'Reviewed graph must reach each original stop node exactly');
    const calls = result.stops.map(stop => spec.stationNames?.[stop.id]?.official || stop.tags?.name || spec.unnamedStops?.[stop.id]);
    assert.deepEqual(calls, spec.expectedCalls, 'Reviewed passenger calls differ: ' + spec.relationId);
    assert.equal(calls.length, spec.expectedStops);
    for (const call of calls) assert(/[가-힣]/.test(names.get(call) || ''), 'Missing Korean name: ' + call);
    const previous = existing.find(row => row.relationId === spec.relationId && row.idSuffix === spec.idSuffix);
    if (previous) {
      assert.deepEqual(previous.expectedCalls, spec.expectedCalls, 'A batch cannot replace an existing pattern');
      continue;
    }
    existing.push({ ...spec, officialUrl: spec.officialUrl || network.officialUrl });
    if (!fs.existsSync(destinationFile)) copies.set(destinationFile, file);
    provenance[spec.relationId] ||= { ...review.sourceExtract };
    imported++;
  }
}
// All candidates must pass before any source or catalogue is changed.
for (const [destination, source] of copies) fs.copyFileSync(source, destination);
write(nationalFile, national);
write(regionalFile, regional);
write(provenanceFile, provenance);
console.log('Imported ' + imported + ' reviewed directions; preserved all existing snapshots.');
