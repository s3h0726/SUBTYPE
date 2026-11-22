'use strict';

const fs = require('node:fs');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const baseline = read('data/uk/source/expansion-ii-baseline.json');
const latestBaseline = read('data/uk/source/expansion-iii-baseline.json');
const latestReview = read('data/uk/source/national/expansion-iii-service-review.json');
const validation = read('data/uk/generated/validation.json');
const index = read('data/uk/generated/index.json');
const expansion = read('data/uk/source/national/expansion-ii.json');
const queue = read('data/uk/source/national/expansion-ii-queue.json');
const release = read('reports/uk/release-status.json');
const browser = read('reports/uk/browser-tests.json');
const ciBrowserFile = 'reports/uk/ci-browser-tests.json';
const ciBrowser = fs.existsSync(ciBrowserFile) ? read(ciBrowserFile) : null;
const supplementalFile = 'reports/uk/browser-ui-tests.json';
const supplemental = fs.existsSync(supplementalFile) ? read(supplementalFile) : null;
const activePatterns = new Set(index.routes.flatMap(route => read(route.lazySource).patterns.map(pattern => pattern.id)));
const verifiedRuns = new Map();
for (const run of [ciBrowser, browser, supplemental]) {
  if (run?.status !== 'PASS') continue;
  for (const direction of run.runs) if (direction.status === 'PASS' && activePatterns.has(direction.serviceId)) verifiedRuns.set(direction.serviceId, direction);
}
const validBrowser = verifiedRuns.size === activePatterns.size;
const ui = supplemental?.freeDriveProgression?.directions === validation.playableDirections ? supplemental : browser;
const ciDirections = release.validation?.ci?.status === 'PASS' ? release.validation.ci.directions : 0;
const validatedDirections = ciDirections === activePatterns.size ? ciDirections : verifiedRuns.size;
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
  '## National Railway Mega Expansion III',
  '',
  'Latest batch baseline: ' + latestBaseline.commit + '. Every one of its ' + latestBaseline.metrics.playableDirections + ' directions is protected by station, service and geometry-reference hashes.',
  '',
  '| Metric | Before this batch | Added | Final |',
  '| --- | ---: | ---: | ---: |',
  ...Object.entries(metrics).map(([key, label]) =>
    '| ' + label + ' | ' + latestBaseline.metrics[key] + ' | ' + (validation[key] - latestBaseline.metrics[key]) + ' | ' + validation[key] + ' |'),
  '',
  'This batch adds Romsey loop, Farnham–Guildford, Portsmouth via Eastleigh, Buxton, Settle–Carlisle, Severn Beach (including Weston-super-Mare through journeys), St Ives Bay, Regatta/Henley, Atlantic Coast and Hertford East, and independently sourced Avanti outward directions. New directions retain individual stop lists; some branch coverage remains partial.',
  '',
  '| New or extended corridor | Added directions | Independent passenger relation IDs |',
  '| --- | ---: | --- |',
  ...latestReview.networks.map(network => '| ' + (network.lineEn || index.routes.find(route => route.id === 'uk-' + network.id)?.line.en || network.id) + ' | ' + network.patterns.length + ' | ' + network.patterns.map(pattern => pattern.relationId).join(', ') + ' |'),
  '',
  'Targeted comparisons use current official SWR 12/23/25, Northern 20, Avanti May–December 2026, GWR branch publications and Greater Anglia passenger information. This is service data integration, not certification of every train or an exhaustive re-audit of the existing catalogue.',
  'Machine-readable reviewed calls, source URLs, sample columns, downloaded-PDF checksums and blocked candidates: data/uk/source/national/expansion-iii-service-review.json. Reimport with node tools/import-uk-reviewed-batch.cjs <review.json> <original-snapshot-directory>, then pack and build.',
  '',
  'Latest batch blockers: ' + latestReview.blocked.map(row => row.network + ' — ' + row.reason).join(' '),
  'Resolved topology: ' + (latestReview.resolved || []).map(row => row.network + ' / ' + row.relationId + ' — ' + row.resolution).join(' '),
  '',
  '## Cumulative expansion since Mega Expansion II',
  '',
  'Source review through ' + [expansion.checkedAt, ...expansion.networks.map(n => n.checkedAt).filter(Boolean)].sort().at(-1) + '. This is a partial British railway catalogue.',
  'Baseline: ' + baseline.commit + ' (all ' + baseline.metrics.playableDirections + ' directions checked for preserved route, station and geometry references).',
  '',
  '| Metric | Before | Added | Final |',
  '| --- | ---: | ---: | ---: |',
  ...Object.entries(metrics).map(([key, label]) =>
    '| ' + label + ' | ' + baseline.metrics[key] + ' | ' + (validation[key] - baseline.metrics[key]) + ' | ' + validation[key] + ' |'),
  '',
  'The totals include seven directions added independently on main in PR #36.',
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
  '- Browser: ' + (validBrowser || ciDirections === activePatterns.size ? validatedDirections + ' complete directions, including all baseline directions; no runtime errors in the passing runs.' : validatedDirections + ' directions completed.'),
  '- Free driving: ' + (ui.freeDriveProgression?.directions === validation.playableDirections ? ui.freeDriveProgression.directions + ' directions, ' + ui.freeDriveProgression.transitions + ' station transitions.' : 'pending.'),
  '- Other countries: ' + (ui.regressions.map(r => r.country + ' ' + r.routes + ' ' + r.status).join(', ') || 'pending') + '.',
  '- Mobile signs, editor and cached geometry: ' + (ui.status === 'PASS' && ui.editorOverrides?.status === 'PASS' && ui.geometryLoading?.status === 'PASS' ? 'PASS' : 'pending') + '.',
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
