'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('css/route-card-typography.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const needle='css/route-card-typography.css';
assert.equal(html.split(needle).length,2,'One final typography stylesheet');
assert.ok(html.indexOf(needle)>html.indexOf('css/native-line-name-fix.css'),'Load after native name override');
for(const selector of ['.line-card .operator','.line-card-line-name','route-card-korean-name','tw-route-native-subtitle','route-user-label','footer > span:last-child','selected-line-heading','selected-line-korean-name','selected-line-meta','selected-line-actions','data-theme="dark"','max-width:620px','line-card:disabled']){
 assert.ok(css.includes(selector),'Missing text treatment: '+selector);
}
let depth=0;for(const ch of css){if(ch==='{')depth++;if(ch==='}'){depth--;assert.ok(depth>=0,'Unmatched }')}}assert.equal(depth,0,'Unbalanced CSS');
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
for(const [a,b] of [['#172820','#ffffff'],['#43594e','#ffffff'],['#f4faf6','#182720'],['#c5d6cb','#182720']]){
 const x=lum(a),y=lum(b);assert.ok((Math.max(x,y)+.05)/(Math.min(x,y)+.05)>=4.5,'WCAG AA text contrast: '+a+' / '+b);
}
console.log('PASS: route card selectors, themes, stylesheet order and text contrast');
