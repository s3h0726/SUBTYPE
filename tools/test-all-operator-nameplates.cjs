'use strict';
/* Tests the visual identity layer without external packages or a browser.
 * Full visual/screen-reader/IME regression still requires Playwright.
 * Run: node tools/test-all-operator-nameplates.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const runtime = read('js/operator-nameplate-identity.js');
const css = read('css/operator-nameplate-identity.css');
const existing = read('css/japan-all-operator-nameplates.css');
const prefix = 'window.TRT_JAPAN_LITE_INDEX=';
const index = read('js/japan-lite-index.js');
assert.ok(index.includes(prefix), 'Japanese operator catalog missing');
const catalog = JSON.parse(index.slice(index.indexOf(prefix) + prefix.length).trim().replace(/;$/, ''));
assert.ok(catalog.operators.length >= 160, 'Japanese operator roster unexpectedly decreased');
assert.equal(new Set(catalog.operators.map(o => o.id)).size, catalog.operators.length,
  'Duplicate Japanese operator IDs');
const styles = new Map();
const attrs = new Set();
const sign = {
  dataset: {signStyle: 'operator-private'},
  style: {
    setProperty: (key, value) => styles.set(key, value),
    removeProperty: key => styles.delete(key)
  },
  hasAttribute: key => attrs.has(key)
};
const documentElement = {dataset: {country: 'jp'}};
const observers = [];
class FakeMutationObserver {
  constructor(callback) {this.callback = callback}
  observe(target, options) {observers.push({target, options, callback: this.callback})}
}
vm.runInNewContext(runtime, {
  document: {documentElement, getElementById: id => id === 'station-sign' ? sign : null},
  window: {TRT_JAPAN_LITE_INDEX: catalog},
  MutationObserver: FakeMutationObserver
});
const refresh = target => {
  const observer = observers.find(item => item.target === target);
  assert.ok(observer, 'Missing operator/country observer');
  observer.callback();
};
const combinations = new Set();
for (const operator of catalog.operators) {
  sign.dataset.operatorId = operator.id;
  refresh(sign);
  if (operator.id === 'nishinihontetsudo') {
    assert.equal(sign.dataset.operatorDesign, undefined, 'Nishitetsu original must stay untouched');
    continue;
  }
  assert.equal(sign.dataset.operatorDesign, 'subtype', 'Missing design: ' + operator.id);
  assert.ok(styles.has('--jp-board-line-bg'), 'Missing highlight: ' + operator.id);
  const key = [sign.dataset.operatorLayout, sign.dataset.operatorEdge,
    sign.dataset.operatorStripe].join('/');
  assert.ok(!combinations.has(key), 'Repeated Japan operator identity: ' + operator.id);
  combinations.add(key);
}
assert.equal(combinations.size, catalog.operators.length - 1);
// Actual photo-based operator boards and the documented Nishitetsu layout
// must not be overwritten by this generated layer.
attrs.add('data-photo-sign');
refresh(sign);
assert.equal(sign.dataset.operatorDesign, undefined);
assert.ok(!styles.has('--jp-board-line-bg'));
attrs.delete('data-photo-sign');
sign.dataset.operatorId = 'nishinihontetsudo';
refresh(sign);
assert.equal(sign.dataset.operatorDesign, undefined);
sign.dataset.operatorId = catalog.operators[0].id;
sign.dataset.signStyle = 'tokyu';
refresh(sign);
assert.equal(sign.dataset.operatorDesign, undefined, 'Dedicated layout overwritten');
// Non-Japan shared signs receive subtle borders, not the Japan background.
documentElement.dataset.country = 'kr';
sign.dataset.signStyle = 'kr-generic-rail';
refresh(documentElement);
assert.equal(sign.dataset.operatorDesign, 'subtype');
assert.ok(!styles.has('--jp-board-face'), 'Japan palette leaked across countries');
sign.dataset.signStyle = 'kr-korail';
refresh(sign);
assert.equal(sign.dataset.operatorDesign, undefined, 'Korail photo-based layout overwritten');
const cssHref = './css/operator-nameplate-identity.css?';
const jsHref = './js/operator-nameplate-identity.js?';
assert.ok(html.includes(cssHref), 'Identity CSS not loaded');
assert.ok(html.includes(jsHref), 'Identity runtime not loaded');
assert.ok(html.indexOf(cssHref) > html.indexOf('japan-all-operator-nameplates.css'),
  'Fallback CSS must load before the new identity CSS');
assert.ok(html.indexOf(jsHref) > html.indexOf('./js/app.bundle.js'),
  'Runtime must load after the existing game bundle');
assert.ok(css.includes(':not([data-photo-sign])'), 'Protect photo boards across countries');
assert.ok(existing.includes('.station-sign-main::before'), 'Existing horizontal highlight missing');
assert.ok(!/\b(?:#typing-input|\.typing-box|#ko-progress)\s*\{/.test(css),
  'Identity stylesheet must not touch the keyboard input or Korean progress cells');
assert.ok(!/typing-input|prompt-main/.test(runtime), 'Runtime must not mutate typed text');
console.log('PASS: ' + catalog.operators.length +
  ' Japan operator identities; dedicated boards, highlight, country switch, links and IME isolation');
