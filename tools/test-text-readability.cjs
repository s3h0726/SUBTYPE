#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const app = read('css/text-readability.css');
const editor = read('dev/rail-data-editor-readability.css');
const names = read('reports/korean-names/editor-readability.css');
const html = read('index.html');
const editorHtml = read('editor/index.html');
const namesHtml = read('reports/korean-names/editor.html');
const styles = [app, editor, names];

for (const [i, css] of styles.entries()) {
  let balance = 0;
  for (const c of css) {
    if (c === '{') ++balance;
    if (c === '}') --balance;
    assert.ok(balance >= 0, 'unbalanced CSS near file ' + i);
  }
  assert.equal(balance, 0, 'unbalanced CSS in file ' + i);
}
assert.ok(html.includes('css/text-readability.css'));
assert.ok(html.indexOf('css/text-readability.css') > html.indexOf('css/settings-v2.css'));
assert.ok(editorHtml.includes('dev/rail-data-editor-readability.css'));
assert.ok(namesHtml.includes('editor-readability.css'));
for (const selector of [
  '#screen-home.world-home',
  '#screen-select #route-grid.line-card-grid',
  '.service-setup-page',
  '.settings-v2',
  '#screen-game .hud-strip span',
  '#screen-game .station-current .prompt-romaji',
  '.free-drive-station-buttons button span',
  '.ranking-table th'
]) assert.ok(app.includes(selector), 'missing readability coverage for ' + selector);

function luminance(hex) {
  const channels = hex.replace('#', '').match(/.{2}/g).map(s => parseInt(s, 16) / 255);
  const [r,g,b] = channels.map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return .2126*r + .7152*g + .0722*b;
}
function contrast(fg, bg) {
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
// Known opaque UI surfaces. Translucent photography/operator signage is
// intentionally excluded from this static test and needs browser QA.
const samples = {
  lightSecondary: ['#495a53','#f5f4ef'],
  darkSecondary: ['#b8cbc1','#111a17'],
  atlasSidebar: ['#c5dae7','#102230'],
  atlasCardDetail: ['#d3e4ef','#152a38'],
  atlasPlaceholder: ['#bfd3df','#0b1c29'],
  editorTableHeading: ['#233f53','#dfeaf2'],
  gameHud: ['#d1e1d8','#0b1913']
};
for (const [name,[fg,bg]] of Object.entries(samples)) {
  assert.ok(contrast(fg,bg) >= 4.5, name + ' fails WCAG AA contrast: ' + contrast(fg,bg).toFixed(2));
}
console.log('PASS · readable CSS loaded last, screen coverage present, opaque samples at or above 4.5:1');
