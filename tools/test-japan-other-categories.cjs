#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const categoryByRouteId=JSON.parse(read('data/japan-route-category-overrides.json')).categoryByRouteId;
const index=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
const other=index.routes.filter(route=>route.category==='other');
assert.equal(other.length,0,'Miscellaneous tab must not contain misclassified lines');
assert.equal(Object.keys(categoryByRouteId).length,19);
for(const [id,category]of Object.entries(categoryByRouteId)){
 const route=index.routes.find(item=>item.id===id);
 assert.ok(route,'Missing original route '+id);
 assert.equal(route.category,category,'Reclassification lost: '+id);
}
const js=read('js/japan-route-category-patch.js');
const context={window:{TRT_JAPAN_LITE_INDEX:JSON.parse(JSON.stringify(index))}};vm.createContext(context);vm.runInContext(js,context);
for(const [id,category] of Object.entries(categoryByRouteId))assert.equal(context.window.TRT_JAPAN_CATEGORY_OVERRIDES[id],category);
for(const file of ['js/app.js','js/app.bundle.js']){
 const src=read(file);
 assert.ok(src.includes("['automated-guideway','신교통']"),'Missing guideway tab in '+file);
 assert.ok(src.includes('TRT_JAPAN_CATEGORY_OVERRIDES?.[route.id]'),'Hydrated route override missing in '+file);
}
assert.ok(read('tools/build-japan-lazy-catalog.cjs').includes('categoryOverrides[r.id]||r.category'));
const html=read('index.html');
assert.ok(html.includes('japan-route-category-patch.js'));
assert.ok(html.indexOf('japan-route-category-patch.js')<html.indexOf('app.bundle.js'));
new Function(read('js/app.bundle.js'));
console.log('PASS: all 19 miscellaneous routes reclassified, 0 other, runtime and builder consistent');
