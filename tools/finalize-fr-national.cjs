'use strict';
// Overlay actual three-mode gameplay evidence; source line completeness stays separate.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2) + '\n');
const browser = read('reports/fr/browser-gameplay.json');
const catalog = read('reports/fr/playable-catalog.json');
const all = catalog.lines.flatMap(line => line.patterns);
if (browser.status !== 'PASS' || !['testedDirections','mobileDirections','freeDrive'].every(key => {
  const ids = new Set(browser[key].map(row => row.id));
  return all.every(pattern => ids.has(pattern.id));
})) throw new Error('Full current catalog must pass desktop, mobile and directed free drive first');
if (browser.franceEditor?.length !== catalog.lines.length) throw new Error('Every line requires Korean editor verification');
const baseline = JSON.parse(cp.execFileSync('git', ['show','9bfe2421:reports/fr/playable-catalog.json'], {cwd:root,maxBuffer:128*1024*1024}));
const previous = new Set(baseline.lines.flatMap(line => line.patterns.map(pattern => pattern.id)));
if (![...previous].every(id => all.some(pattern => pattern.id === id))) throw new Error('Existing direction ID removed');
const relationIds = pattern => pattern.relationIds || [pattern.relationId];
const oldRelations = new Set(baseline.lines.flatMap(line => line.patterns.flatMap(relationIds)));
const usedRelations = new Set(all.flatMap(relationIds));
const audit = new Map(read('reports/fr/track-evidence.json').map(row => [row.relationId,row]));
const discovery = read('data/fr/source/national-track-discovery.json');
discovery.outcomesVerifiedOn = '2026-11-22';
discovery.sourceFile = 'data/fr/source/osm-national-masters.json';
discovery.limitations = ['Route-master discovery is not a complete inventory of operational French passenger lines.', 'Unparented train-relation discovery timed out; operators and networks absent from these route masters still require catalog discovery.', 'OSM membership is infrastructure evidence, not proof of passenger operation. Official schedule matching and gameplay are required.'];
for (const row of discovery.candidates) {
  if (usedRelations.has(row.relationId)) {
    row.status = oldRelations.has(row.relationId) ? 'ALREADY_IMPLEMENTED' : 'VERIFIED_ADDED';
    row.reason = 'Official ordered calls, connected source geometry, Korean names and complete desktop/mobile/free-drive gameplay verified';
  } else if (audit.has(row.relationId)) {
    const result = audit.get(row.relationId);
    row.status = 'BLOCKED';
    row.reason = result.status === 'MATCHED' ? 'Schedule match exists; eligible operating dates, operator binding, independent directions, geometry identity and Korean/gameplay release review remain' : result.reason || result.error || 'No valid connected source geometry and ordered passenger timetable match';
  }
}
discovery.outcomeCounts = discovery.candidates.reduce((counts,row) => {counts[row.status]=(counts[row.status]||0)+1;return counts;}, {});
const candidates = new Map(discovery.candidates.map(row => [row.relationId,row]));
for (const master of discovery.masters) {
  const outcomes = master.members.filter(member => member.type === 'relation').map(member => candidates.get(member.ref)).filter(Boolean);
  master.outcomeCounts = outcomes.reduce((counts,row) => {counts[row.status]=(counts[row.status]||0)+1;return counts;}, {});
  master.status = outcomes.some(row => ['VERIFIED_ADDED','ALREADY_IMPLEMENTED'].includes(row.status)) ? 'PARTIALLY_IMPLEMENTED'
    : outcomes.length && outcomes.every(row => row.status === 'UNVERIFIABLE') ? 'UNVERIFIABLE'
    : outcomes.some(row => row.status === 'MISSING') ? 'MISSING' : 'BLOCKED';
  master.reason = 'Candidate member outcomes only; official stopping-pattern completeness and current passenger operation require independent evidence';
}
const includedMasters = new Set(discovery.masters.map(master => master.id));
discovery.excludedMasters = read('data/fr/source/osm-national-masters.json').elements.filter(master => !includedMasters.has(master.id))
  .map(master => ({relationId:master.id,tags:master.tags,status:'OUTSIDE_SCOPE',reason:'Outside this French operator/network discovery scope; SNCFT is Tunisian, not SNCF'}));
write('data/fr/source/national-track-discovery.json', discovery);
const metadata = read('data/fr/source/national-route-metadata.json');
const coverage = read('reports/fr/coverage.json');
for (const row of metadata.lines) {
  const line = coverage.lines.find(line => line.id === row.lineId);
  row.status = line.status;
  row.playableDirections = line.directions.length;
  row.testedDirections = line.directions.filter(direction => direction.status === 'VERIFIED_ADDED').length;
  row.reason = 'Selected directions passed complete desktop/mobile/free-drive gameplay and Korean editor integration; source corridor completeness is recorded separately';
}
write('data/fr/source/national-route-metadata.json',metadata);
const proposals = read('reports/fr/national-service-candidates.json');
for (const group of proposals.groups) {
  for (const pattern of group.patterns) {
    const matches = all.filter(candidate => relationIds(candidate).includes(pattern.relationId) && candidate.sourcePatterns.some(id => pattern.sourcePatternIds.includes(id)));
    if (matches.length) {
      pattern.status = matches.every(candidate => previous.has(candidate.id)) ? 'ALREADY_IMPLEMENTED' : 'VERIFIED_ADDED';
      pattern.directionIds = matches.map(candidate => candidate.id);
      pattern.reason = 'Official calls, source tracks, Korean names and full desktop/mobile/free-drive gameplay passed';
    }
  }
  if (group.patterns.every(pattern => ['VERIFIED_ADDED','ALREADY_IMPLEMENTED'].includes(pattern.status))) group.status = 'VERIFIED_ADDED';
  else if (group.patterns.some(pattern => ['VERIFIED_ADDED','ALREADY_IMPLEMENTED'].includes(pattern.status))) group.status = 'PARTIALLY_IMPLEMENTED';
}
write('reports/fr/national-service-candidates.json',proposals);
const added = all.filter(pattern => !previous.has(pattern.id));
const batchFile = 'reports/fr/national-batch-2026-11-22.json';
const priorBatch = fs.existsSync(path.join(root,batchFile)) ? read(batchFile) : {};
write(batchFile, {
  ...priorBatch,
  asOf:'2026-11-22',baselineRef:'9bfe2421',sourceSnapshotAsOf:'2026-11-12',
  status:'PASS',newCatalogLines:catalog.lines.length-baseline.lines.length,newDirections:added.length,
  currentCatalogLines:catalog.lines.length,currentDirections:all.length,koreanStationIds:catalog.stationIds,
  preservedDirectionIds:previous.size,testedDirections:all.length,editorLines:browser.franceEditor.length,
  nationalCoveragePercent:null,remainingSourcePatternRecords:coverage.remainingSourcePatternRecords,
  discoveryMasters:discovery.masters.length,discoveryCandidates:discovery.candidates.length,
  discoveryOutcomes:discovery.outcomeCounts,newDirectionIds:added.map(pattern => pattern.id),
  releaseLineIds:metadata.lines.map(line => line.lineId),
  productionStatus:priorBatch.productionStatus || 'PENDING',evidence:['browser-gameplay.json','name-overrides-gameplay.json','coverage.json','track-evidence.json'],
});
console.log(JSON.stringify({newLines:catalog.lines.length-baseline.lines.length,newDirections:added.length,allDirections:all.length,discoveryOutcomes:discovery.outcomeCounts}));
