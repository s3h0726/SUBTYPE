'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const inventory = read('reports/fr/inventory.json');
const catalog = read('reports/fr/playable-catalog.json');
const track = read('reports/fr/track-evidence.json');
const manifest = read('data/fr/source/manifest.json');
const browser = read('reports/fr/browser-gameplay.json');
const tested = new Set(browser.testedDirections.map(direction => direction.id));
const mobile = new Set(browser.mobileDirections.map(direction => direction.id));
const freeDrive = new Set(browser.freeDrive.map(direction => direction.id));
const servicePatterns = new Set();
const scheduleFamilies = new Map();
const lines = [];

for (const line of catalog.lines) {
  const directions = line.patterns.map(pattern => {
    for (const source of pattern.sourcePatterns) servicePatterns.add(source);
    return {id:pattern.id, scheduleResourceId:pattern.scheduleResourceId, sourcePatterns:pattern.sourcePatterns,
      relationId:pattern.relationId, ...(pattern.relationIds ? {relationIds:pattern.relationIds} : {}),
      status:tested.has(pattern.id)&&mobile.has(pattern.id)&&freeDrive.has(pattern.id)
        ? 'VERIFIED_ADDED' : 'PARTIALLY_IMPLEMENTED'};
  });
  const detail = read('data/fr/generated/routes/' + line.id + '.json');
  const source = read('data/fr/source/schedules/' + line.patterns[0].scheduleResourceId + '.json');
  const official = source.lines.find(candidate => candidate.sourceRouteId === line.sourceRouteId);
  const implemented = new Set(directions.flatMap(direction => direction.sourcePatterns));
  for (const pattern of official.patterns) {
    if (implemented.has(pattern.id)) scheduleFamilies.set(pattern.id, pattern.family);
  }
  const remaining = official.patterns.filter(pattern => !implemented.has(pattern.id));
  lines.push({id:line.id, category:line.category, regions:line.regions,
    sourceRouteId:line.sourceRouteId, sourceLineId:official.id,
    status:remaining.length || directions.some(direction => direction.status !== 'VERIFIED_ADDED')
      ? 'PARTIALLY_IMPLEMENTED' : 'VERIFIED_ADDED',
    serviceFamilies:new Set(detail.patterns.map(pattern => pattern.familyId)).size,
    discoveredSchedulePatterns:official.patterns.length, coveredSchedulePatterns:implemented.size,
    remainingSourcePatternIds:remaining.map(pattern => pattern.id), directions});
}
const verified = lines.flatMap(line => line.directions).filter(direction => direction.status === 'VERIFIED_ADDED');
const verifiedSourcePatterns = new Set(verified.flatMap(direction => direction.sourcePatterns));
const discovered = inventory.scheduleTotals.blockedDirections;
const byFamily = Object.entries(inventory.patternsByFamily).map(([family, count]) => {
  const published = lines.filter(line => (family === 'high-speed' && line.category === 'high_speed_rail') ||
    (family === 'subway' && line.category === 'subway') ||
    (family === 'rer' && line.category === 'rer') ||
    (family === 'transilien' && line.category === 'commuter_rail') ||
    (family === 'international' && line.category === 'international') ||
    ((family === 'intercites' || family === 'intercites-night') && line.category === 'intercity' &&
      line.directions.some(direction => direction.sourcePatterns.some(id => scheduleFamilies.get(id) === family))) ||
    (family === 'ter' && line.category === 'regional_rail') ||
    (family === 'tram-train' && line.category === 'tram_train'));
  const covered = [...scheduleFamilies].filter(([, sourceFamily]) => sourceFamily === family);
  const verifiedRecords = covered.filter(([id]) => verifiedSourcePatterns.has(id)).length;
  return {family, sourcePatternRecords:count, catalogLines:published.length,
    coveredSourcePatternRecords:covered.length, verifiedSourcePatternRecords:verifiedRecords,
    remainingSourcePatternRecords:count-covered.length,
    playableDirections:published.flatMap(line => line.directions).length,
    testedDirections:published.flatMap(line => line.directions).filter(direction => direction.status === 'VERIFIED_ADDED').length};
});
const coverage = {
  asOf:inventory.asOf, baselineRef:inventory.baselineRef, nationalCoveragePercent:null,
  sourceDenominator:inventory.denominator, discoveredSourcePatternRecords:discovered,
  coveredSourcePatternRecords:servicePatterns.size, verifiedSourcePatternRecords:verifiedSourcePatterns.size,
  remainingSourcePatternRecords:discovered-servicePatterns.size,
  verifiedShareOfSourcePatternRecordsPercent:100*verifiedSourcePatterns.size/discovered,
  existingFranceLinesOnBaseline:0, catalogLines:lines.length, operators:catalog.operators,
  catalogServiceFamilies:lines.reduce((total,line) => total+line.serviceFamilies,0),
  playableDirections:catalog.playableDirections, verifiedPlayableDirections:verified.length,
  catalogDirectionsPendingVerification:catalog.playableDirections-verified.length,
  koreanNamedStations:catalog.koreanNamedStations, stationIds:catalog.stationIds,
  physicalStationGroups:catalog.physicalStationGroups, sharedPhysicalWays:catalog.sharedPhysicalWays,
  uniquePhysicalWays:catalog.uniquePhysicalWays, physicalInfrastructure:manifest.infrastructureSources,
  sourcesByStatus:manifest.scheduleSources.reduce((counts,source) => {
    counts[source.verificationStatus]=(counts[source.verificationStatus]||0)+1;
    return counts;
  }, {}),
  trackRelations:{examined:track.length, matched:track.filter(candidate => candidate.status === 'MATCHED').length,
    blocked:track.filter(candidate => candidate.status === 'BLOCKED').length},
  reviewedTrackServices:track.flatMap(candidate => candidate.reviewedServices || [])
    .filter(service => service.status === 'MATCHED').length,
  byFamily, lines,
  regionalCoverage:inventory.mainlandRegions.map(region => {
    const regionalLines = lines.filter(line => line.regions.includes(region.code));
    const directions = regionalLines.flatMap(line => line.directions);
    return {...region, catalogLines:regionalLines.length, catalogLineIds:regionalLines.map(line => line.id),
      playableDirections:directions.length,
      verifiedPlayableDirections:directions.filter(direction => direction.status === 'VERIFIED_ADDED').length};
  }),
  overseasSources:inventory.overseas,
};
fs.writeFileSync(path.join(root, 'reports/fr/coverage.json'), JSON.stringify(coverage,null,2)+'\n');
console.log(JSON.stringify({catalogLines:lines.length, verifiedPlayableDirections:verified.length,
  remainingSourcePatternRecords:coverage.remainingSourcePatternRecords}));
