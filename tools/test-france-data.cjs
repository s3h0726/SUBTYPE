'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {loadTrackCorrections, readServiceTrack} = require('./lib/fr-track-evidence.cjs');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const readRelation = id => read('data/fr/source/osm/' + id + '.json');

async function run() {
  const runtime = await import(pathToFileURL(path.join(root, 'js/france-network.js')));
  const index = read('data/fr/generated/index.json');
  const exclusions = read('data/fr/source/track-call-exclusions.json');
  const corrections = loadTrackCorrections(path.join(root, 'data/fr/source'));
  assert.throws(() => readServiceTrack([3019054,3019053], readRelation, [], corrections),
    /do not meet at the same track node/, 'Different Champ de Mars platforms must not bridge a through service');
  assert.throws(() => readServiceTrack([3019054,3019053], readRelation, [], corrections,
    {joinNodes:[-1]}), /Invalid track junction/, 'A missing node must not bridge rail sections');
  const specifications = read('data/fr/source/release-lines.json');
  const official = new Map([...new Set(specifications.map(spec => spec.sourceId))].map(resource => [
    resource, read('data/fr/source/schedules/' + resource + '.json'),
  ]));
  const korean = /[가-힣]/;
  assert.equal(index.country.id, 'fr');
  assert.match(index.country.names.ko, korean);
  const wayDefinitions = new Map();
  const stationDefinitions = new Map();
  const directionIds = new Set();
  for (const meta of index.routes) {
    assert.equal(meta.countryId, 'fr');
    assert.equal(meta.lazy, true);
    // RER A–E are the official passenger-facing line identifiers used in
    // French and Korean contexts. They are not untranslated station names.
    // Keep strict Hangul validation for every other line/operator and for
    // all station signs and service choices below.
    if(meta.category==='rer'&&/^RER [A-E]$/.test(meta.line.ko)){
      assert.equal(meta.line.ko,meta.line.fr,'Official RER designation changed');
      assert.equal(meta.line.ko,'RER '+meta.code,'RER line code mismatch');
    }else assert.match(meta.line.ko,korean);
    assert.match(meta.operator.ko, korean);
    const route = read(meta.lazySource);
    assert.equal(route.id, meta.id);
    assert.equal(route.patterns.length, meta.serviceCount);
    assert.deepEqual(route.stationCatalog.map(station => station.id), meta.stationSequence);
    assert.deepEqual([...new Set(route.stationCatalog.map(station => station.physicalStationId))], meta.transferStationIds);
    assert.equal(new Set(meta.stationSequence).size, meta.stationCount);
    for (const station of route.stationCatalog) {
      assert.match(station.ko, korean);
      assert.ok(station.fr);
      assert.equal(station.countryId, 'fr');
      assert.deepEqual(station, stationDefinitions.get(station.id) || station);
      stationDefinitions.set(station.id, station);
    }
    route.franceWays = {};
    for (const file of route.geometryFiles) {
      for (const [id, definition] of Object.entries(read(file).ways)) {
        assert.deepEqual(definition, wayDefinitions.get(id) || definition);
        assert.equal(definition.nodes.length, definition.points.length);
        if (id.includes('@')) {
          const fingerprint = require('node:crypto').createHash('sha256')
            .update(JSON.stringify([definition.nodes,definition.points])).digest('hex').slice(0,24);
          assert.equal(id.split('@')[1],fingerprint,'Track snapshot key must identify its exact source coordinates');
        }
        wayDefinitions.set(id, definition);
        route.franceWays[id] = definition;
      }
    }
    const choices = runtime.franceOperatingChoices(route);
    assert.equal(choices.length, route.patterns.length);
    const endpoints = new Set();
    for (const [index, pattern] of route.patterns.entries()) {
      assert.ok(!directionIds.has(pattern.id), pattern.id);
      directionIds.add(pattern.id);
      const choice = choices[index];
      assert.match(choice.patternName.ko, korean);
      const {route: playable, journey} = runtime.resolveFranceChoice(choice, route);
      assert.equal(journey.originStationId, pattern.stationIds[0]);
      assert.equal(journey.destinationStationId, pattern.stationIds.at(-1));
      assert.deepEqual(playable.stations.map(station => station.id), pattern.stationIds);
      for (let stop = 1; stop < playable.stations.length; stop++) {
        assert.notEqual(playable.stations[stop].physicalStationId, playable.stations[stop - 1].physicalStationId,
          'Adjacent calls must stay separate in free drive for ' + pattern.id);
      }
      endpoints.add(playable.stations[0].physicalStationId + ':' + playable.stations.at(-1).physicalStationId);
      const evidence = pattern.evidence;
      const line = official.get(evidence.scheduleResourceId).lines.find(line => line.sourceRouteId === route.sourceRouteId);
      const sourcePatterns = line.patterns.filter(pattern => evidence.sourcePatterns.includes(pattern.id));
      assert.equal(sourcePatterns.length, evidence.sourcePatterns.length);
      for (const source of sourcePatterns) {
        assert.deepEqual(playable.stations.map(station => station.sourceId), source.stationIds);
      }
      const {track} = readServiceTrack(evidence.relationIds || [evidence.relationId],
        readRelation, evidence.excludedCalls || exclusions[evidence.relationId], corrections, evidence);
      assert.deepEqual(track.stops.map(stop => stop.id), evidence.stationNodes);
      assert.deepEqual(playable.geometry, track.geometry.slice(track.aligned[0],track.aligned.at(-1)+1));
      assert.equal(playable.directedSegments.length, playable.stations.length - 1);
      assert.ok(playable.geometry.every(point => point.every(Number.isFinite)));
    }
    for (const pair of endpoints) {
      assert.ok(endpoints.has(pair.split(':').reverse().join(':')), 'Missing opposite direction for ' + meta.id);
    }
    if (route.category === 'subway') assert.equal(route.patterns[0].nameKo, '각역정차');
  }
  const station = [...stationDefinitions.values()][0];
  const massy = [...stationDefinitions.values()].filter(station => station.physicalStationId === 'fr-massy-palaiseau');
  assert.equal(massy.length, 2, 'SNCF and IDFM Massy-Palaiseau must share the signed interchange');
  // A station-ID edit belongs to one route; it must not rename another
  // operator's transfer platform simply because they share a physical ID.
  runtime.configureFranceNames({stations:{'fr-ouigo-edit':{[massy[0].id]:'마시 개별 수정'}}}, index.stationNameGroups);
  assert.equal(runtime.franceStationPresentation(massy[0],'fr-ouigo-edit').ko,'마시 개별 수정');
  assert.equal(runtime.franceStationPresentation(massy[1],'fr-ouigo-edit').ko,massy[1].ko);
  // An explicit named group edit is the only broadcast mechanism.
  runtime.configureFranceNames({stations:{'fr-ouigo-edit':{'fr-massy-palaiseau':'마시 그룹 수정'}}}, index.stationNameGroups);
  assert.ok(massy.every(stop=>runtime.franceStationPresentation(stop).ko==='마시 그룹 수정'));
  const lazare = [...stationDefinitions.values()].filter(stop => index.stationNameGroups[stop.id] === 'fr-name-gare-saint-lazare');
  const haussmann = [...stationDefinitions.values()].find(stop => stop.fr === 'Haussmann Saint-Lazare');
  assert.equal(lazare.length,2,'SNCF and IDFM Gare Saint-Lazare names must remain linked for transfers');
  runtime.configureFranceNames({stations:{'fr-editor':{[lazare[0].id]:'생라자르 개별 수정'}}},index.stationNameGroups);
  assert.equal(runtime.franceStationPresentation(lazare[0],'fr-editor').ko,'생라자르 개별 수정');
  assert.equal(runtime.franceStationPresentation(lazare[1],'fr-editor').ko,lazare[1].ko);
  assert.equal(runtime.franceStationPresentation(haussmann,'fr-editor').ko,haussmann.ko,
    'A nearby but separate Haussmann station must keep its name');
  runtime.configureFranceNames({stations:{'fr-edited':{[station.id]:'한국어 수정 이름'}}}, index.stationNameGroups);
  assert.equal(runtime.franceStationPresentation(station,'fr-edited').ko,'한국어 수정 이름');
  assert.equal(runtime.franceStationPresentation(station,'fr-edited').fr,station.fr);
  assert.deepEqual(runtime.franceSearchNames({id:'fr-edited',searchStations:[station.fr],stationSequence:[station.id]}),
    [station.fr,'한국어 수정 이름']);
  const grouped=Object.entries(index.stationNameGroups||{});
  const repeatedGroup=grouped.find(([id,group])=>grouped.some(([other,value])=>id!==other&&value===group));
  if(repeatedGroup){
    const [id,group]=repeatedGroup;
    const [other]=grouped.find(([other,value])=>id!==other&&value===group);
    runtime.configureFranceNames({stations:{'fr-marseille-metro-1':{[group]:'수정된 공통 역명'}}},index.stationNameGroups);
    assert.equal(runtime.franceStationPresentation(stationDefinitions.get(other)).ko,'수정된 공통 역명');
  }
  console.log(JSON.stringify({lines:index.routes.length, directions:directionIds.size, stationIds:stationDefinitions.size}));
}

run().catch(error => {console.error(error); process.exitCode = 1;});
