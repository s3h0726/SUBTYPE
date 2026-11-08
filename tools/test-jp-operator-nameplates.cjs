'use strict';
/* Regression contract for phase-1 Japanese operator nameboards.
 * Run: node tools/test-jp-operator-nameplates.cjs
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
const html=read('index.html');
const css=read('css/japan-all-operator-nameplates.css');
const major=read('css/japan-major-private-nameplates.css');
const bundle=read('js/app.bundle.js');
const original=read('js/station-sign-templates.js');
const indexText=read('js/japan-lite-index.js');
const prefix='window.TRT_JAPAN_LITE_INDEX=';
const offset=indexText.indexOf(prefix);
assert.ok(offset>=0,'Japan route index missing');
const catalog=JSON.parse(indexText.slice(offset+prefix.length).trim().replace(/;$/,''));
assert.ok(catalog.operators.length>=161,'unexpected loss of Japanese operators');
assert.ok(catalog.routes.length>=608,'unexpected loss of Japan route catalog');
const operatorIds=new Set(catalog.operators.map(operator=>operator.id));
for(const route of catalog.routes)assert.ok(operatorIds.has(route.operatorId),'unregistered operator for '+route.id);
const context={};
vm.createContext(context);
vm.runInContext(original.replace(/\bexport /g,'')+';globalThis.resolve=resolveStationSignTemplate;',context);
const named=new Set(['jr-east','jr-central','jr-west','jr-hokkaido','jr-shikoku','jr-kyushu',
  'shinkansen-east','shinkansen-central-west','shinkansen-kyushu',
  'metro','toei','osaka-metro','tokyu','odakyu','keio','seibu','tobu','keikyu',
  'keisei','sotetsu','hankyu','hanshin','kintetsu','keihan','nankai',
  'meitetsu','yurikamome','enoden']);
const fallback=new Set(['operator-local','operator-tram','operator-metro',
  'operator-monorail','operator-new-transit','operator-private','local','tram','monorail']);
const unknown=new Map();
const coverage=new Map();
for(const route of catalog.routes){
  const template=context.resolve(route);
  assert.ok(template&&template.style,'unresolved sign on '+route.id);
  const style=template.style;
  coverage.set(style,(coverage.get(style)||0)+1);
  if(!named.has(style)&&!fallback.has(style))unknown.set(route.id,style);
}
assert.equal(unknown.size,0,'uncovered nameplate styles: '+JSON.stringify([...unknown]));
const stylesheetHref='./css/japan-all-operator-nameplates.css?';
assert.ok(html.includes(stylesheetHref),'CSS not included in game HTML');
assert.ok(html.indexOf(stylesheetHref)>html.indexOf('japan-major-private-nameplates.css'),
  'fallback stylesheet must load after custom operator rules');
assert.ok(css.includes('html[data-country="jp"]'),'must not change other countries');
assert.ok(css.includes(':not([data-photo-sign])'),'photo nameplates must remain unchanged');
assert.ok(css.includes(':not([data-operator-id="nishinihontetsudo"])'),'Nishitetsu original sign must survive');
assert.ok(css.includes('station-sign-main::before'),'full-width highlight missing');
assert.ok(css.includes('pointer-events:none!important'),'the stripe must not intercept focus');
assert.ok(css.includes('--route-color'),'the actual line color must drive the strip');
assert.ok(!/\.station-sign-input\s*(?:\{|,)/.test(css),'new styles must not hide native IME');
assert.ok(bundle.includes('sign.dataset.operatorId=active.operatorId'),
  'runtime must retain operator ID for per-operator nameplate variants');
assert.ok(bundle.includes('sign.dataset.signStyle=template.style'),
  'runtime must select the route sign template');
assert.ok(major.includes('data-sign-style="tobu"'),'major railway nameplates removed');
console.log('PASS: '+catalog.operators.length+' Japan operators, '+catalog.routes.length+
  ' routes resolved to '+coverage.size+' supported sign families; photo/IME/stripe isolation confirmed');
