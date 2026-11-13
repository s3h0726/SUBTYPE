'use strict';

const fs = require('node:fs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const baseline = read('data/uk/source/expansion-ii-baseline.json');
const validation = read('data/uk/generated/validation.json');
const index = read('data/uk/generated/index.json');
const expansion = read('data/uk/source/national/expansion-ii.json');
const queue = read('data/uk/source/national/expansion-ii-queue.json');
const release = read('reports/uk/release-status.json');
const browser = read('reports/uk/browser-tests.json');
const validBrowser = browser.status === 'PASS' && browser.runs.length === validation.playableDirections;
const published = release.productionDeployment;
const regionalResults = new Map(validation.regionalResults.map(row => [row.relationId, row]));
const metrics = {
  operators: 'Operating organisations',
  lines: 'Lines / corridors',
  servicePatterns: 'Service pattern families',
  playableDirections: 'Playable directions',
  uniqueStations: 'Station IDs',
  uniquePhysicalStationGroups: 'Physical station groups',
  sharedSegments: 'Shared track segments'
};

const report = [
  '# United Kingdom railway expansion progress',
  '',
  '## National Railway Mega Expansion II',
  '',
  'Source review: ' + expansion.checkedAt + '. This is a partial British railway catalogue.',
  'Baseline: ' + baseline.commit + ' (all ' + baseline.metrics.playableDirections + ' directions checked for preserved route, station and geometry references).',
  '',
  '| Metric | Before | Added | Final |',
  '| --- | ---: | ---: | ---: |',
  ...Object.entries(metrics).map(([key, label]) =>
    '| ' + label + ' | ' + baseline.metrics[key] + ' | ' + (validation[key] - baseline.metrics[key]) + ' | ' + validation[key] + ' |'),
  '',
  'Korean localisation: ' + validation.koreanNamedStations + '/' + validation.uniqueStations + ' station IDs. These are editable Korean editorial names. Original English names and existing user overrides are preserved.',
  'Physical groups include nearby records that share the same reviewed English and Korean names and existing TfL interchange identifiers. Track geometry is reused by its original OSM node sequence and loaded in cached geographic partitions.',
  '',
  '## Current operating organisations',
  '',
  ...index.operators.map(o => '- ' + o.names.en + ' — ' + o.names.ko),
  '',
  '## This phase by operator and corridor',
  '',
  '| Operating organisation | Added or extended corridor | Direction IDs added |',
  '| --- | --- | ---: |',
  ...expansion.networks.map(n => '| ' + n.operatorEn + ' | ' + n.lineEn + ' | ' +
    n.patterns.filter(p => regionalResults.get(p.relationId)?.status === 'PASS').length + ' |'),
  '',
  '## Validation and production',
  '',
  '- Route resolver, stable IDs, Korean names, geographical station bounds, directional endpoints and original OSM edges: ' + (release.validation?.data || 'pending') + '.',
  '- Browser: ' + (validBrowser ? browser.runs.length + ' complete directions, including all baseline directions; ' + browser.errors.length + ' runtime errors.' : 'A complete passing run for this catalogue is pending.'),
  '- Free driving: ' + (validBrowser ? browser.freeDriveProgression.directions + ' directions, ' + browser.freeDriveProgression.transitions + ' station transitions.' : 'pending.'),
  '- Other countries: ' + (validBrowser ? browser.regressions.map(r => r.country + ' ' + r.routes + ' ' + r.status).join(', ') : 'pending.') + '.',
  '- Leaderboard identity: ' + (release.validation?.leaderboardIdentity || 'pending') + '.',
  '- Implementation commit: ' + (release.sourceCommit || 'pending') + '. Batches: ' + Object.values(release.commits || {}).join(', ') + '.',
  '- UK GitHub Actions: ' + (release.validation?.ci?.status || 'pending') + (release.validation?.ci?.url ? ' — ' + release.validation.ci.url : '') + '.',
  '- Main integration: ' + release.mainIntegration + '.',
  '- GitHub Pages: ' + (published?.status || 'pending') + (published?.checkedAt ? ', checked ' + published.checkedAt : '') + (published?.url ? ' — ' + published.url : '') + '.',
  '- Public browser journeys: ' + (published?.routes?.map(r => r.lineId + ' (' + r.stops + ' stops)').join(', ') || 'pending') + '.',
  '',
  '## Sources and reproducibility',
  '',
  '- Completed service IDs, ordered calls and operator evidence are in data/uk/source/national/expansion-ii.json. Operator identities are recorded in data/uk/operator-evidence.json.',
  '- Archived OSM snapshots and their uncompressed SHA-256 checksums are in data/uk/source/manifest.json. Geofabrik extracts retain OSM node IDs, way IDs, versions and ordered relation membership. © OpenStreetMap contributors, ODbL-1.0.',
  '- Services use individually reviewed passenger relations and official operator or authority maps. This expansion did not repeat an exhaustive timetable comparison.',
  '- The existing UK selection, typing, editable Korean names, ranking, regional nameboards and free drive remain in the same application.',
  '',
  '## Remaining candidate queue',
  '',
  'Resume from data/uk/source/national/expansion-ii-queue.json. Only candidates represented in the generated catalogue are playable.',
  '',
  '| Priority | Operator / network | Remaining corridor | State and next verification |',
  '| --- | --- | --- | --- |',
  ...queue.items.map(x => '| ' + [x.priority, x.operator, x.corridor, x.status + ' — ' + x.next].join(' | ') + ' |'),
  '',
  '## Earlier releases',
  '',
  '- PR #33 introduced 129 directions. London recovery 26abc3946 restored all 12 previously blocked official TfL patterns. Regional expansion 8931d5535 added the four major tram systems and intercity coverage.',
  '- Previous production release: ea4696898cf2fcb17d3278eda13766e9a1540e23. The baseline stores its 284 directions independently of the new batches.',
  ''
].join('\n');
fs.writeFileSync('docs/uk-railway-expansion-progress.md', report);
console.log(JSON.stringify(Object.fromEntries(Object.keys(metrics).map(k => [k, validation[k]]))));
