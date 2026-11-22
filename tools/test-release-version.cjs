#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'subtype-release-'));
const release = path.join(__dirname, 'release-version.cjs');
const read = name => fs.readFileSync(path.join(tmp, name), 'utf8');
const run = mode => execFileSync(process.execPath, [release, mode], {
  cwd: tmp,
  env: { ...process.env, SUBTYPE_RELEASE_ROOT: tmp, SUBTYPE_RELEASE_SUMMARY: 'Verified release test' },
  encoding: 'utf8'
});
const assertVersion = (appVersion, npmVersion) => {
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.appVersion,appVersion);
  assert.equal(pkg.version,npmVersion);
  assert(read('README.md').includes('v'+appVersion+' (개발 중)'));
  assert(read('index.html').includes('app-version.css?v='+appVersion));
  assert.equal((read('index.html').match(/data-app-version/g)||[]).length,4);
  assert(read('index.html').includes('<meta name="application-version" content="'+appVersion+'">'));
  assert(read('CHANGELOG.md').includes('## [v'+appVersion+']'));
};
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"name":"subtype","version":"0.9.0","appVersion":"0.9.0.0"}\n');
  fs.writeFileSync(path.join(tmp, 'index.html'), [
    '<meta name="application-version" content="0.9.0.0">',
    '<span data-app-version>v0.9.0.0</span>',
    '<strong data-app-version>v0.9.0.0</strong>',
    '<span class="x" data-app-version>v0.9.0.0</span>',
    '<span data-app-version>v0.9.0.0</span>',
    '<link rel="stylesheet" href="./css/app-version.css?v=0.9.0.0">'
  ].join('\n'));
  fs.writeFileSync(path.join(tmp, 'README.md'), '> **현재 버전: v0.9.0.0 (개발 중)**\n');
  fs.writeFileSync(path.join(tmp, 'CHANGELOG.md'), '# SUBTYPE 변경 이력\n\n버전 형식: vMAJOR.MINOR.PATCH.REVISION\n\n## [v0.9.0.0]\n');

  run('revision');
  assertVersion('0.9.0.1','0.9.0');
  const changed=['package.json','index.html','README.md','CHANGELOG.md'].map(read);
  run('sync');
  assert.deepEqual(['package.json','index.html','README.md','CHANGELOG.md'].map(read),changed);
  run('patch');
  assertVersion('0.9.1.0','0.9.1');
  run('minor');
  assertVersion('0.10.0.0','0.10.0');
  run('major');
  assertVersion('1.0.0.0','1.0.0');
  console.log('PASS: four-part release revision/patch/minor/major/sync');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
