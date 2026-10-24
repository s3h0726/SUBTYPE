#!/usr/bin/env node
// Regression check for Shonan-Shinjuku local/rapid/special-rapid through journeys.
// Run: node tools/test-shonan-shinjuku-service-journeys.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const catalog = json('data/tokyo-service-patterns.json');
const through = json('data/through-services.json');
const ids = ['line-11319', 'line-11323', 'line-11333', 'line-11308', 'line-11301'];
const routes = new Map(ids.map(id => [id, json('data/generated/routes/' + id + '.json').route]));
const sandbox = { console };
sandbox.globalThis = sandbox;
sandbox.TRT_TOKYO_SERVICE_PATTERNS = catalog;
sandbox.TRT_RAIL_SYSTEM = { throughServices: through.services };
vm.createContext(sandbox);
vm.runInContext(read('js/service-route-resolver.js').replace(/\bexport\s+/g, ''), sandbox, {
  filename: 'service-route-resolver.js',
});

const expected = {
  'jr-shonan-utsunomiya-yokosuka-local': 36,
  'jr-shonan-utsunomiya-yokosuka-rapid': 29,
  'jr-shonan-takasaki-tokaido-rapid': 39,
  'jr-shonan-takasaki-tokaido-special-rapid': 28,
  'jr-shonan-koganei-zushi': 32,
  'jr-shonan-kagohara-hiratsuka': 27,
};
let checked = 0;
for (const [id, count] of Object.entries(expected)) {
  for (const direction of ['forward', 'reverse']) {
    const journeyId = 'journey-' + id + '-' + direction;
    const baseRoute = routes.get('line-11333');
    const output = sandbox.resolveServiceJourney({
      baseRoute,
      journeyId,
      getRoute: routeId => routes.get(routeId),
    });
    assert.equal(output.journey.id, journeyId, 'journey must resolve: ' + journeyId);
    assert.equal(output.service.stops.length, count, 'stop count: ' + journeyId);
    assert.ok(output.route.geometry.length > 100, 'physical geometry missing: ' + journeyId);
    assert.equal(output.route.stations[0].stationMasterId, output.journey.originStationId);
    assert.equal(output.route.stations.at(-1).stationMasterId, output.journey.destinationStationId);
    const byId = new Map(output.route.stations.map((s, i) => [s.stationMasterId, i]));
    const stopIndices = output.service.stops.map(stopId => {
      assert.ok(byId.has(stopId), 'orphan stop: ' + stopId);
      return byId.get(stopId);
    });
    assert.ok(stopIndices.every((index, i) => i === 0 || index > stopIndices[i - 1]), 'stop order: ' + journeyId);
    assert.ok(output.route.stations.every((s, i) =>
      Number.isInteger(s.geometryIndex) &&
      s.geometryIndex >= 0 &&
      s.geometryIndex < output.route.geometry.length &&
      (i === 0 || s.geometryIndex > output.route.stations[i - 1].geometryIndex)
    ), 'station geometry order: ' + journeyId);
    const stationNames = output.service.stops.map(stopId => output.route.stations[byId.get(stopId)].ja);
    if (id.endsWith('special-rapid')) {
      for (const skipped of ['恵比寿', '西大井', '新川崎', '保土ケ谷', '東戸塚', '辻堂', '大磯', '二宮', '鴨宮'])
        assert.ok(!stationNames.includes(skipped), 'special rapid must skip ' + skipped);
    }
    checked++;
  }
}
assert.equal(checked, 12);
console.log('PASS: ' + checked + ' Shonan-Shinjuku through-service journey directions');
