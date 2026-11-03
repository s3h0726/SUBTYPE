#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),css=read('css/bootstrap-route-explorer.css');
const app=read('js/app.js'),bundle=read('js/app.bundle.js');
const countries=new Map([['hk','홍콩'],['jp','일본'],['kr','대한민국'],['th','태국'],['tw','대만']]);
assert.match(html,/bootstrap@5\.3\.8\/dist\/css\/bootstrap-grid\.min\.css/);
assert.match(html,/bootstrap@5\.3\.8\/dist\/css\/bootstrap-utilities\.min\.css/);
assert.match(html,/bootstrap-route-explorer\.css\?v=/);
assert.match(html,/app\.bundle\.js\?v=[^"']+/);
assert.match(html,/class="line-select-layout row gx-3 gy-3"/);
assert.match(html,/class="selected-line-panel col-12 col-lg-4"/);
assert.match(html,/class="line-list-panel col-12 col-lg-8"/);
assert.match(html,/id="route-grid" class="line-card-grid subtype-route-grid"/);
const pickers=[...html.matchAll(/<div class="(?:country-switch|route-country-switch)[^"]*"[^>]*>([\s\S]*?)<\/div>/g)];
assert.equal(pickers.length,2,'home and line explorer country pickers both exist');
for(const picker of pickers){
  const buttons=[...picker[1].matchAll(/<button\b[^>]*data-country="(hk|jp|kr|th|tw)"[^>]*>([^<]*)<\/button>/g)];
  assert.equal(buttons.length,5);
  for(const [,id,label] of buttons)assert.equal(label,countries.get(id),'Korean-only country name '+id);
}
for(const content of [app,bundle]){
 assert.match(content,/switchCountryFromPicker/,'both country pickers share one handler');
 assert.match(content,/\.country-switch,\.route-country-switch/);
 assert.match(content,/button\.setAttribute\('aria-pressed'/);
 assert.match(content,/grid\.querySelectorAll\(':scope > \.line-card'\)/);
 assert.doesNotMatch(content,/element\.before\(column\)/,'no extra wrappers around route cards');
 assert.match(content,/role="tab" aria-selected=/);
 assert.match(content,/scrollIntoView\(\{block:'start'/);
}
assert.match(css,/#route-grid\.subtype-route-grid\{[\s\S]*?display:grid!important/,'route cards must use CSS Grid');
assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/,'two columns on medium widths');
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/,'three columns on desktop');
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/,'four columns on large screens');
assert.match(css,/\.operator-logo-filters\{\s*display:flex;flex-wrap:nowrap/,'operator overflow guard');
for(const breakpoint of [576,992,1200,1600])assert(css.includes('@media(min-width:'+breakpoint+'px)'),'Bootstrap-responsive breakpoint '+breakpoint);
assert.doesNotThrow(()=>new Function(bundle),'combined app bundle JS parses');
console.log('PASS Bootstrap route explorer: country=5, pickers=2, Bootstrap layout and 1-4-column CSS route grid, filters, source/bundle.');
