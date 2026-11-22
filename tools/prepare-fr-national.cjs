'use strict';

// Propose only independently matched stopping sequences. Promotion still needs
// reviewed Korean names, region metadata, a source rebuild and complete gameplay.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const cache = process.argv[2];
const asOf = process.argv[3];
if (!cache || !/^\d{4}-\d{2}-\d{2}$/.test(asOf || '')) {
  throw Error('Usage: node tools/prepare-fr-national.cjs <cache> <YYYY-MM-DD>');
}
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const source = read(path.join(root, 'data/fr/source/schedules/83582.json'));
const catalog = read(path.join(root, 'reports/fr/playable-catalog.json'));
const audit = read(path.join(root, 'reports/fr/track-evidence.json'));
const names = read(path.join(root, 'data/fr/source/station-names-ko.json'));
const lines = new Map(source.lines.map(line => [line.sourceRouteId,line]));
const stations = new Map(source.stations.map(station => [station.id,station]));
const sourcePatterns = new Map(source.lines.flatMap(line => line.patterns.map(pattern => [pattern.id,pattern])));
const owners = [];
const existing = new Map();
for (const line of catalog.lines) {
  if (!line.patterns.some(pattern => pattern.scheduleResourceId === 83582)) continue;
  const detail = read(path.join(root, 'data/fr/generated/routes', line.id + '.json'));
  const byId = new Map(detail.stationCatalog.map(station => [station.id,station.sourceId]));
  const pairs = new Set(), brands = new Set();
  for (const pattern of detail.patterns) {
    const brand = sourcePatterns.get(pattern.evidence.sourcePatterns[0])?.brand;
    const ids = pattern.stationIds.map(id => byId.get(id));
    brands.add(brand);
    pairs.add(ids[0] + '|' + ids.at(-1));
    existing.set(brand + '|' + ids.join(','), {lineId:line.id, directionId:pattern.id,
      sourcePatterns:new Set(pattern.evidence.sourcePatterns)});
  }
  owners.push({id:line.id, routeId:line.sourceRouteId, stations:new Set(byId.values()), pairs, brands});
}
const selected = new Map(), outcomes = [];
for (const candidate of audit) {
  const matches = (candidate.matches || []).filter(match => match.sourceId === 83582);
  if (!matches.length) continue;
  const data = read(path.join(cache, 'fr-osm-' + candidate.relationId + '.json'));
  const relation = data.elements.find(element => element.type === 'relation' && element.id === candidate.relationId);
  const tags = relation.tags;
  for (const match of matches) {
    const line = lines.get(match.routeId);
    const pattern = sourcePatterns.get(match.patternId);
    if (!pattern || pattern.lastDate < asOf) continue;
    const result = {relationId:relation.id, sourcePatternId:pattern.id, sourceRouteId:match.routeId};
    if (!['SNCF Voyageurs','OSLO','TGV Lyria'].includes(tags.operator)) {
      outcomes.push({...result,status:'BLOCKED',reason:'Operator needs an independent reviewed binding: ' + tags.operator});
      continue;
    }
    const sequence = pattern.stationIds.join(',');
    const key = pattern.brand + '|' + sequence;
    const implemented = existing.get(key);
    if (implemented) {
      outcomes.push({...result,status:implemented.sourcePatterns.has(pattern.id) ? 'ALREADY_IMPLEMENTED' : 'PARTIALLY_IMPLEMENTED',
        lineId:implemented.lineId, directionId:implemented.directionId,
        reason:'Existing stopping sequence; cross-source and alternative-track identities are not automatically merged'});
      continue;
    }
    const pair = pattern.stationIds[0] + '|' + pattern.stationIds.at(-1);
    const possible = owners.filter(owner => owner.routeId === match.routeId && owner.brands.has(pattern.brand));
    const exact = possible.filter(owner => owner.pairs.has(pair));
    const within = possible.filter(owner => pattern.stationIds.every(id => owner.stations.has(id)));
    const owner = exact.length === 1 ? exact[0] : within.length === 1 ? within[0] : null;
    const preference = (owner ? 1000 : 0) + (tags['gtfs:route_id:FR-SNCF'] === match.routeId ? 100 : 0) +
      (line.shortName === tags.ref ? 10 : 0) + (match.routeId.startsWith('FR:Line:') ? 1 : 0);
    const row = {relationId:relation.id, sourceRouteId:match.routeId, ownerId:owner?.id,
      operator:tags.operator, network:tags.network, brand:pattern.brand, family:pattern.family,
      shortName:line.shortName, sourceName:line.longName, sequence, preference,
      sourcePatternIds:[pattern.id], firstDate:pattern.firstDate, lastDate:pattern.lastDate,
      operatingDays:pattern.operatingDays, futurePattern:pattern.firstDate > asOf,
      calls:pattern.stationIds.map(id => stations.get(id))};
    const previous = selected.get(key);
    if (!previous || preference > previous.preference) selected.set(key,row);
    else if (previous.sourceRouteId === row.sourceRouteId && previous.relationId === row.relationId) {
      previous.sourcePatternIds.push(pattern.id);
      previous.firstDate = [previous.firstDate,row.firstDate].sort()[0];
      previous.lastDate = [previous.lastDate,row.lastDate].sort().at(-1);
      previous.futurePattern = previous.firstDate > asOf;
    }
  }
}
const groups = new Map();
for (const row of selected.values()) {
  const key = row.ownerId || row.sourceRouteId + '|' + row.brand;
  const group = groups.get(key) || {sourceId:83582, sourceRouteId:row.sourceRouteId, ownerId:row.ownerId,
    brand:row.brand, family:row.family, shortName:row.shortName, sourceName:row.sourceName, patterns:[]};
  group.patterns.push(row);
  groups.set(key,group);
}
for (const group of groups.values()) {
  const owner = owners.find(owner => owner.id === group.ownerId);
  const pairs = new Set([...(owner?.pairs || []),...group.patterns.map(row => row.calls[0].id + '|' + row.calls.at(-1).id)]);
  const operating = lines.get(group.sourceRouteId).patterns.some(pattern =>
    pattern.brand === group.brand && pattern.firstDate <= asOf && pattern.lastDate >= asOf);
  for (const row of group.patterns) {
    const opposite = pairs.has(row.calls.at(-1).id + '|' + row.calls[0].id);
    row.status = opposite && operating ? 'MISSING' : 'BLOCKED';
    row.reason = !opposite ? 'No independently verified opposite endpoint direction' : !operating
      ? 'Only future timetable evidence for this service family; current operation needs verification' : 'Pending Korean review and complete gameplay';
  }
  group.patterns.sort((a,b) => Number(a.futurePattern)-Number(b.futurePattern) ||
    b.calls.length-a.calls.length || b.operatingDays-a.operatingDays || a.relationId-b.relationId);
  group.status = group.patterns.some(row => row.status === 'MISSING') ? 'MISSING' : 'BLOCKED';
  group.missingKoreanNames = [...new Set(group.patterns.filter(row => row.status === 'MISSING')
    .flatMap(row => row.calls.map(call => call.name)))].filter(name => !names[name]);
  group.proposedId = group.ownerId || 'fr-sncf-' + createHash('sha256')
    .update(group.sourceRouteId + '|' + group.brand).digest('hex').slice(0,16);
}
const report = {asOf, sourceId:83582, scope:'Exact official-call and connected-track candidates; no automatic playable approval',
  groups:[...groups.values()], existingSequenceOutcomes:outcomes};
fs.writeFileSync(path.join(root, 'reports/fr/national-service-candidates.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({groups:groups.size, eligibleGroups:report.groups.filter(group => group.status === 'MISSING').length,
  eligibleDirections:report.groups.flatMap(group => group.patterns).filter(row => row.status === 'MISSING').length,
  missingKoreanNames:new Set(report.groups.flatMap(group => group.missingKoreanNames)).size}));
