import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const file = path => readFile(new URL(path, root), 'utf8');
const json = async path => JSON.parse(await file(path));
const countries = ['jp', 'kr', 'hk', 'tw', 'th', 'uk'];
const countryIndexes = {
  kr: 'data/kr/generated/index.json',
  hk: 'data/hk/generated/index.json',
  tw: 'data/tw/generated/network.json',
  th: 'data/th/generated/index.json',
  uk: 'data/uk/generated/index.json'
};

// Run the shipped data scripts in HTML order, including the catalog patches.
const page = await file('index.html');
globalThis.window = globalThis;
const runtimeData = /^(?:hong-kong-index-data|japan-lite-index|japan-route-.*-patch|jr-hokkaido-hakodate-split|meitetsu-mikawa-sections-patch|tosakuroshio-nakamura-sukumo-patch|dedupe-toyama-line3|korea-index-data|service-data|japan-.*(?:operating-patterns|pattern-expansion.*)|line-theme-data|rail-system-data|nationwide-service-catalog|disney-resort-line-data)\.js$/;
for (const [, path] of page.matchAll(/<script\b[^>]*src="\.\/js\/([^"?]+)/g)) {
  if (runtimeData.test(path)) vm.runInThisContext(await file('js/' + path), { filename: path });
}

globalThis.document = { baseURI: root.href };
globalThis.fetch = async input => {
  const url = new URL(input, root);
  assert.equal(url.protocol, 'file:');
  try {
    const bytes = await readFile(url);
    const response = new Response(bytes);
    response.json = async () => {
      const data = JSON.parse(bytes);
      if (data.encoding !== 'subtype-route-gzip-v1') return data;
      const decoded = JSON.parse(gunzipSync(Buffer.from(data.data, 'base64')));
      assert.equal(decoded.route.id, data.routeId);
      assert.equal(decoded.route.countryId, 'kr');
      return decoded;
    };
    return response;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return new Response(null, { status: 404 });
  }
};

const { loadTransportData, hydrateRailLine } = await import('../js/data-loader.js');
const { isRouteVisible, canonicalRouteId } = await import('../js/feature-flags.js');
const { resolvePlayableRoute } = await import('../js/route-integrity.js');
const { famousLimitedExpressSourceIds, buildFamousLimitedExpressRoutes } = await import('../js/famous-limited-express.js');
const { servicePatternsForRoute, serviceJourneysForRoute } = await import('../js/service-route-resolver.js');
const { ukOperatingChoices, resolveUKChoice } = await import('../js/uk-network.js');
const { thailandOperatingChoices, resolveThailandChoice } = await import('../js/thailand-network.js');
const { taiwanOperatingChoices, resolveTaiwanChoice } = await import('../js/taiwan-network.js');
const { koreanVerifiedChoices, resolveKoreanVerifiedChoice } = await import('../js/korean-service-resolver.js');
const adapters = {
  uk: [ukOperatingChoices, resolveUKChoice],
  th: [thailandOperatingChoices, resolveThailandChoice],
  tw: [taiwanOperatingChoices, resolveTaiwanChoice],
  kr: [koreanVerifiedChoices, resolveKoreanVerifiedChoice]
};
const evidence = await json('docs/timetable-audit/evidence.json');
const labels = value => value?.ko || value?.en || value?.ja || value?.zh || value || '';
const idOf = station => String(station.id ?? station.station_id);
const signatures = new Map();
const rows = [];
const totals = {};

for (const country of countries) {
  const index = countryIndexes[country];
  const loaded = await loadTransportData(country);
  const current = new Map(loaded.lines.filter(isRouteVisible).map(line => [line.id, line]));
  const rawIndex = index ? await json(index) : globalThis.TRT_JAPAN_LITE_INDEX;
  const rawRoutes = rawIndex.routes ?? rawIndex.lines;
  assert.equal(new Set(rawRoutes.map(route => route.id)).size, rawRoutes.length, country + ' duplicate route IDs');
  const registered = new Map(rawRoutes.map(route => [route.id, route]));
  for (const route of loaded.lines) if (!registered.has(route.id)) registered.set(route.id, route);

  if (country === 'jp') {
    const sources = new Set(famousLimitedExpressSourceIds());
    const parents = await Promise.all(loaded.lines.filter(route => sources.has(route.id)).map(hydrateRailLine));
    for (const route of buildFamousLimitedExpressRoutes(parents)) {
      registered.set(route.id, route);
      if (isRouteVisible(route)) current.set(route.id, route);
    }
  }

  console.log(country, registered.size, 'registered,', current.size, 'visible');
  for (const [position, [id, raw]] of [...registered].entries()) {
    if (position && position % 1000 === 0) console.log(country, position, 'routes checked');
    const record = {
      country: country.toUpperCase(), route_id: id, operator: labels(raw.operator) || raw.operatorId || '',
      name: labels(raw.line ?? raw.names ?? raw.name), mode: raw.mode || raw.category || '',
      infrastructure: raw.physicalLineId || raw.sourceKey || raw.canonicalLineId || raw.lazySource || index || id,
      passenger_service: raw.passengerLineId || raw.canonicalLineId || raw.servicePatternId || id,
      catalog: index || 'js/japan-lite-index.js', legacy_alias_target: canonicalRouteId(id) === id ? '' : canonicalRouteId(id),
      selectable: current.has(id), playable: false, real_geometry_playable: false, failed_choices: 0,
      validation_error: '', stations: raw.stationCount ?? raw.stations?.length ?? 0,
      patterns: '', directions: '', branches: '', through_services: '', shared_sequence: '',
      existing_sources: '', status: 'REQUIRES_REVIEW', timetable_url: '', effective_date: '',
      accessed_date: '', finding: 'Current official schedule comparison pending', added: 0, corrected: 0, merged: 0
    };
    const findings = evidence[id];
    if (findings) Object.assign(record, findings);

    let route = raw;
    const visible = current.get(id);
    if (visible) {
      try {
        route = await hydrateRailLine(visible);
        const adapter = country === 'kr' && route.schemaVersion !== 2 ? null : adapters[country];
        const choices = adapter ? adapter[0](route) : [];
        assert.ok(!adapter || choices.length, 'No selectable patterns');
        record.directions = [...new Set(choices.map(choice => choice.direction))].join('|');
        record.patterns = choices.map(choice => choice.id).join('|');
        const runs = choices.length ? choices : [null];
        for (const choice of runs) {
          try {
            const selected = choice ? adapter[1](choice, route) : { route, direction: 'forward', service: route.services?.[0] };
            const run = resolvePlayableRoute(selected.route, selected);
            if (choice) {
              assert.equal(idOf(run.stations[0]), String(choice.originId), 'Origin differs from selector');
              assert.equal(idOf(run.stations.at(-1)), String(choice.destinationId), 'Terminus differs from selector');
              if (selected.service?.stops) {
                assert.deepEqual(run.stations.map(idOf), selected.service.stops.map(String), 'Calls differ from selected pattern');
              }
            }
            record.playable = true;
            record.real_geometry_playable ||= !run.fallbackGeometry;
          } catch (error) {
            record.failed_choices++;
            record.validation_error ||= error.message;
          }
        }
      } catch (error) {
        record.validation_error = error.message;
      }
    }
    const servicePatterns = country === 'jp' ? servicePatternsForRoute(id) : [];
    const journeys = country === 'jp' ? serviceJourneysForRoute(id) : [];
    record.patterns ||= [...new Set([...servicePatterns.map(item => item.id), ...(route.services || []).map(item => item.id), raw.servicePatternId].filter(Boolean))].join('|');
    record.directions ||= [...new Set([raw.directionId, raw.direction, ...journeys.map(item => item.directionId), ...(route.directions || []).map(item => item.id)].filter(Boolean))].join('|');
    if (!record.directions && record.playable) record.directions = route.oneWay ? 'forward' : 'forward|reverse';
    record.mode = route.mode || record.mode;
    record.branches = [...new Set(servicePatterns.map(item => item.branchId).filter(Boolean))].join('|');
    record.through_services = [...new Set([...servicePatterns, ...journeys].map(item => item.throughServiceId).filter(Boolean))].join('|');
    const references = [raw.sourceRefs, route.sourceRefs, route.sources]
      .filter(Array.isArray).flat().map(source => source?.url || source?.sourceUrl || source?.localFile || source);
    record.existing_sources = [...new Set([raw.sourceUrl, route.sourceUrl, route.source?.url, route.geometrySource?.officialUrl, route.geometrySource?.sourceFile, ...references].filter(value => typeof value === 'string'))].join('|');
    if (route.stations?.length >= 2) {
      record.stations = route.stations.length;
      const sequence = route.stations.map(idOf);
      const canonicalSequence = [sequence.join('>'), sequence.reverse().join('>')].sort()[0];
      const key = country + ':' + createHash('sha256').update(canonicalSequence).digest('hex');
      const peers = signatures.get(key) || [];
      peers.push(record);
      signatures.set(key, peers);
    }
    rows.push(record);
  }
  const group = rows.filter(row => row.country === country.toUpperCase());
  totals[country] = {
    registered: group.length, selectable: group.filter(row => row.selectable).length,
    playable: group.filter(row => row.playable).length,
    realGeometry: group.filter(row => row.real_geometry_playable).length,
    failedRoutes: group.filter(row => row.selectable && !row.playable).length,
    failedChoices: group.reduce((sum, row) => sum + row.failed_choices, 0),
    verified: group.filter(row => row.status === 'VERIFIED').length,
    added: group.reduce((sum, row) => sum + row.added, 0),
    corrected: group.reduce((sum, row) => sum + row.corrected, 0),
    merged: group.reduce((sum, row) => sum + row.merged, 0)
  };
  console.log(country, JSON.stringify(totals[country]));
}

for (const group of signatures.values()) {
  if (group.length < 2) continue;
  for (const row of group) row.shared_sequence = group.filter(peer => peer !== row).map(peer => peer.route_id).join('|');
}
for (const id of Object.keys(evidence)) assert.ok(rows.some(row => row.route_id === id), 'Unknown evidence route: ' + id);
if (process.argv.includes('--compare-baseline')) {
  const baseline = await json('docs/timetable-audit/baseline.json');
  const failures = rows.filter(row => row.validation_error).map(row => row.route_id).sort();
  assert.deepEqual(failures, baseline.failedRouteIds, 'Runtime resolver failures changed');
  for (const country of countries) {
    for (const key of ['registered', 'selectable', 'playable', 'realGeometry']) {
      assert.equal(totals[country][key], baseline.countries[country][key], country + ' ' + key);
    }
  }
}
const fields = Object.keys(rows[0]);
const cell = value => '"' + String(value).replaceAll('"', '""') + '"';
const csv = [fields.join(','), ...rows.map(row => fields.map(field => cell(row[field])).join(','))].join('\n') + '\n';
const report = new URL('docs/timetable-audit/', root);
await writeFile(new URL('ROUTE_TIMETABLE_AUDIT.csv', report), csv);
await writeFile(new URL('inventory-totals.json', report), JSON.stringify(totals, null, 2) + '\n');
