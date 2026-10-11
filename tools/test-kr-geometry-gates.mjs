import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('Korean published routes have OSM rail provenance and contiguous segments',()=>{
  const output=execFileSync(process.execPath,['tools/validate-kr-published-geometry.mjs'],{encoding:'utf8'});
  assert.match(output,/KR GEOMETRY GATE PASS/);
});
test('Incomplete 3 and 7 geometry remains outside the game catalogue',()=>{
  assert.match(execFileSync(process.execPath,['tools/validate-kr-osm-candidates.mjs'],{encoding:'utf8'}),/kr-metro-7/);
});
