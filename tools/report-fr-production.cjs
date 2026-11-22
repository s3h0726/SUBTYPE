'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const catalog = read('reports/fr/playable-catalog.json');
const current = new Set(catalog.lines.flatMap(line => line.patterns.map(pattern => pattern.id)));
const suburban = new Set(catalog.lines.filter(line => line.category === 'commuter_rail')
  .flatMap(line => line.patterns.map(pattern => pattern.id)));
const inputs = process.argv.slice(2);
if (!inputs.length) {
  inputs.push('reports/fr/production-gameplay.json');
  const archived = 'reports/fr/production-transilien-20261118.json';
  if (fs.existsSync(path.join(root, archived))) inputs.push(archived);
  inputs.push('reports/fr/production-focused-gameplay.json');
}
const covered = new Set();
const runs = inputs.map(file => {
  const report = read(file);
  assert.equal(report.status, 'PASS', file + ' did not pass');
  assert.deepEqual(report.errors, [], file + ' has browser errors');
  assert.ok(report.deployment?.releaseRef && report.deployment?.workflowRunId,
    file + ' needs its verified deployment identity');
  const desktop = new Set(report.testedDirections.map(direction => direction.id));
  assert.deepEqual(new Set(report.mobileDirections.map(direction => direction.id)), desktop);
  assert.deepEqual(new Set(report.freeDrive.map(direction => direction.id)), desktop);
  for (const id of desktop) {
    assert.ok(current.has(id), 'Recorded direction is absent from the current catalog: ' + id);
    covered.add(id);
  }
  return {file, deployment:report.deployment, testedDirectionsPerMode:desktop.size};
});
assert.ok([...suburban].every(id => covered.has(id)), 'Some released Transilien directions lack a recorded production run');
const batchPath = 'reports/fr/national-batch-2026-11-22.json';
const batch = fs.existsSync(path.join(root, batchPath)) ? read(batchPath) : null;
if (batch) assert.ok(batch.newDirectionIds.every(id => covered.has(id)),
  'Some new nationwide-batch directions lack a complete recorded production run');
const result = {
  status:'PASS', generatedAt:new Date().toISOString(),
  scope:'Recorded production tests across identified releases; current catalog ID coverage, not a rerun of the whole latest catalog',
  nationalCoveragePercent:null, catalogLines:catalog.serviceLines, catalogDirections:current.size,
  uniqueRecordedProductionDirections:covered.size,
  catalogDirectionsWithoutRecordedProductionRun:current.size - covered.size,
  transilienDirections:suburban.size,
  transilienDirectionsWithRecordedProductionRun:[...suburban].filter(id => covered.has(id)).length,
  ...(batch ? {nationalBatchDirections:batch.newDirectionIds.length,
    nationalBatchDirectionsWithRecordedProductionRun:batch.newDirectionIds.filter(id => covered.has(id)).length} : {}),
  runs,
};
fs.writeFileSync(path.join(root, 'reports/fr/production-summary.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
