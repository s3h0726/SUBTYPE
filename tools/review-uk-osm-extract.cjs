'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const {assemble} = require('./lib/uk-osm.cjs');

const directory = process.argv[2];
if (!directory) throw new Error('Usage: node tools/review-uk-osm-extract.cjs <extract-directory>');

const inventory = JSON.parse(fs.readFileSync(path.join(directory, 'inventory.json')));
for (const record of inventory) {
  if (record.missingMembers) {
    record.error = 'incomplete extract';
    continue;
  }
  const file = path.join(directory, record.id + '.json.gz');
  const {elements} = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
  const relation = elements.find(element => element.type === 'relation' && element.id === record.id);
  try {
    const result = assemble(relation, elements, {activeRailOnly: true});
    record.calls = result.stops.map(stop => stop.tags?.name || '#' + stop.id);
  } catch (error) {
    record.error = error.message;
  }
}
process.stdout.write(JSON.stringify(inventory, null, 2) + '\n');
