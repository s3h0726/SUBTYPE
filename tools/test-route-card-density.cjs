'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('css/route-card-density.css','utf8');
const old='css/route-card-typography.css',current='css/route-card-density.css';
assert.equal(html.split(current).length,2,'Density CSS linked once');
assert.ok(html.indexOf(current)>html.indexOf(old),'Density overrides after typography');
for(const token of [
 'minmax(min(100%,156px),1fr)','min-height:122px',
 'min-width:356px','repeat(2,minmax(0,1fr))',
 'max-width:355px','minmax(0,1fr)',
 'route-card-native-name','tw-route-native-subtitle','route-user-label',
 'overflow:visible!important','overflow-wrap:anywhere'
])assert.ok(css.includes(token),'Missing compact layout token: '+token);
assert.ok(!css.includes('text-overflow:ellipsis'),'No title truncation');
assert.ok(!css.includes('#screen-game')&&!css.includes('#screen-home'),'No unrelated screen styling');
let n=0;for(const x of css){if(x==='{')n++;if(x==='}'){n--;assert.ok(n>=0)}}assert.equal(n,0,'Balanced braces');
console.log('PASS: desktop dense cards, mobile 2 columns, native name preservation and CSS load order');
