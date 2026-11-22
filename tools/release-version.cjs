#!/usr/bin/env node
'use strict';

// Bump or synchronize SUBTYPE's four-part app version without rebuilding large data bundles.
// Usage: node tools/release-version.cjs revision|patch|minor|major|sync
// npm requires the separate package.json "version" field to remain three-part SemVer.
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.SUBTYPE_RELEASE_ROOT || path.resolve(__dirname, '..');
const mode = process.argv[2] || 'revision';
if (!['revision', 'patch', 'minor', 'major', 'sync'].includes(mode)) {
  console.error('Expected revision, patch, minor, major or sync');
  process.exit(2);
}
const file = name => path.join(root, name);
const read = name => fs.readFileSync(file(name), 'utf8');
const write = (name, value) => {
  if (read(name) !== value) fs.writeFileSync(file(name), value, 'utf8');
};

const pkg = JSON.parse(read('package.json'));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Invalid npm package.json version (requires X.Y.Z)');
const previous = pkg.appVersion || pkg.version + '.0';
if (!/^\d+\.\d+\.\d+\.\d+$/.test(previous)) throw new Error('Invalid appVersion (requires X.Y.Z.R)');
const parts = previous.split('.').map(Number);
if (pkg.version !== parts.slice(0, 3).join('.')) {
  throw new Error('package.json version must match first three parts of appVersion');
}
if (mode === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; parts[3] = 0; }
if (mode === 'minor') { parts[1]++; parts[2] = 0; parts[3] = 0; }
if (mode === 'patch') { parts[2]++; parts[3] = 0; }
if (mode === 'revision') parts[3]++;
const version = mode === 'sync' ? previous : parts.join('.');
pkg.appVersion = version;
pkg.version = version.split('.').slice(0, 3).join('.');
write('package.json', JSON.stringify(pkg, null, 2) + '\n');

let found = 0;
const html = read('index.html')
  .replace(/(<(?:span|strong)\b[^>]*\bdata-app-version\b[^>]*>)[^<]*(<\/(?:span|strong)>)/g, (_, open, close) => {
    found++;
    return open + 'v' + version + close;
  })
  .replace(/(<meta name="application-version" content=")[^"]*(")/, '$1' + version + '$2')
  .replace(/(\.\/css\/app-version\.css)(?:\?v=[^"']*)?/g, '$1?v=' + version);
if (found !== 4 || !html.includes('<meta name="application-version" content="' + version + '">')) {
  throw new Error('Version labels or application-version metadata are missing');
}
write('index.html', html);

let readme = read('README.md');
if (!/\*\*현재 버전: v\d+\.\d+\.\d+(?:\.\d+)? \(개발 중\)\*\*/.test(readme)) {
  throw new Error('README version banner not found');
}
readme = readme.replace(/\*\*현재 버전: v\d+\.\d+\.\d+(?:\.\d+)? \(개발 중\)\*\*/, '**현재 버전: v' + version + ' (개발 중)**');
write('README.md', readme);

let changelog = read('CHANGELOG.md');
if (!changelog.includes('## [v' + version + ']')) {
  const header = /^(# SUBTYPE 변경 이력\r?\n\r?\n버전 형식:[^\n]*\r?\n)/;
  if (!header.test(changelog)) throw new Error('Unexpected CHANGELOG.md heading');
  const date = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const summary = (process.env.SUBTYPE_RELEASE_SUMMARY || 'main 브랜치 변경 사항을 통합하고 웹 버전을 동기화했습니다.')
    .replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
  const entry = '\n## [v' + version + '] — ' + date + '\n\n- ' + summary + '\n';
  changelog = changelog.replace(header, '$1' + entry);
  write('CHANGELOG.md', changelog);
}
console.log(JSON.stringify({ mode, previous, version, labels: found }));
