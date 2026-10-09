#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/free-drive.js'),'utf8');
const bundle=fs.readFileSync(path.join(root,'js/app.bundle.js'),'utf8');
const pattern=/const finite=n=>[^;]+;\s*const coords=s=>[^;]+;/;
const m=source.match(pattern);assert(m,'free-drive coordinate helper missing');
assert(bundle.includes(m[0]),'free-drive bundle out of sync with source');
const context={};vm.runInNewContext(m[0]+'this.testCoords=coords;',context);
const coords=context.testCoords;
for(const s of [{latitude:null,longitude:null},{latitude:undefined,longitude:undefined},{latitude:'',longitude:''},{latitude:null,longitude:127},{latitude:37.5,longitude:null}])assert.strictEqual(coords(s),null,'missing coordinates incorrectly projected');
assert.deepStrictEqual(Array.from(coords({latitude:37.5,longitude:127})),[37.5,127]);
const index=JSON.parse(fs.readFileSync(path.join(root,'data/kr/generated/index.json'),'utf8'));
const nonGeo=index.routes.filter(r=>r.regionId&&r.regionId!=='capital').length;
console.log(JSON.stringify({status:'PASS',missingCoordinatesRemainNull:true,bundleConsistent:true,regionalRoutes:nonGeo},null,2));
