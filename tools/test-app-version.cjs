#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const pkg=JSON.parse(read('package.json'));
const version=pkg.version;
assert.match(version,/^\d+\.\d+\.\d+$/,'Semantic version must use MAJOR.MINOR.PATCH');
const html=read('index.html'),labels=[...html.matchAll(/<(?:span|strong)\b[^>]*\bdata-app-version\b[^>]*>([^<]*)<\/(?:span|strong)>/g)].map(m=>m[1].trim());
assert.equal(labels.length,4,'home, topbar, home footer and settings must display the version');
assert(labels.every(label=>label==='v'+version),'All visible version labels must match package.json');
assert(html.includes('<meta name="application-version" content="'+version+'">'),'Application version meta tag mismatch');
assert(html.includes('./css/app-version.css?v='+version),'Version stylesheet cache key mismatch');
assert(read('CHANGELOG.md').includes('## [v'+version+']'),'Changelog must contain the current version');
const script=read('tools/build-app-bundle.js');
assert(script.includes("const appVersion=JSON.parse(read('package.json')).version"),'Bundle build must source version from package.json');
console.log('PASS: SUBTYPE v'+version+' matched package.json, HTML, CSS and changelog');
