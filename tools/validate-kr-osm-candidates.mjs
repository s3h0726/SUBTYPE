#!/usr/bin/env node
// Run: node tools/validate-kr-osm-candidates.mjs
// Candidate coordinates are NOT approved playable track geometry.
import fs from 'node:fs';
let failed = 0;
for (const line of [3, 7]) {
  const routeId = 'kr-metro-' + line;
  const base = 'data/kr/osm-candidates/' + routeId;
  const candidate = JSON.parse(fs.readFileSync(base + '.json', 'utf8'));
  const audit = JSON.parse(fs.readFileSync(base + '.audit.json', 'utf8'));
  const order = audit.stationOrder;
  const problems = [];
  const seen = new Set();
  for (const segment of candidate.segments) {
    const i = segment.stationPairIndex;
    if (seen.has(i)) problems.push('duplicate pair ' + i);
    seen.add(i);
    if (order[i] !== segment.from || order[i + 1] !== segment.to) problems.push('station order ' + i);
    if (!Array.isArray(segment.polylineLatLon) || segment.polylineLatLon.length < 2 ||
      segment.polylineLatLon.some(p => !Array.isArray(p) || p.length !== 2 ||
        !Number.isFinite(p[0]) || !Number.isFinite(p[1]) ||
        p[0] < 33 || p[0] > 39 || p[1] < 124 || p[1] > 132)) problems.push('invalid coordinates ' + i);
    if (segment.reviewStatus !== 'candidate_not_verified') problems.push('unexpected review flag ' + i);
  }
  const missing = Array.from({length: order.length - 1}, (_, i) => i).filter(i => !seen.has(i));
  if (JSON.stringify(missing) !== JSON.stringify(candidate.missing.map(s => s.index))) problems.push('missing list mismatch');
  if (missing.length !== audit.missingSegmentCount || seen.size !== audit.candidateSegmentCount) problems.push('audit counts mismatch');
  if (candidate.geometryReady !== false || audit.geometryReady !== false || audit.gameExposed !== false) problems.push('unverified route enabled');
  console.log(routeId + ': ' + seen.size + '/' + (order.length-1) + ' candidate pairs, ' + missing.length + ' missing; ' + (problems.length ? 'FAIL' : 'gated OK'));
  if (problems.length) { console.error(problems.join('\n')); failed++; }
}
process.exitCode = failed ? 1 : 0;
