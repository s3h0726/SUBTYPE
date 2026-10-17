#!/usr/bin/env node
// Current Japanese passenger services, as of October 2026.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const active=read('data/generated/routes/line-11111.json').route;
const canonical=read('data/lines/jr-hokkaido/hidakahonsen/stations.json');
const expected=['苫小牧','勇払','浜厚真','鵡川'];
assert.deepEqual(active.stations.map(s=>s.ja),expected,
 'Hidaka Line must serve Tomakomai–Mukawa only, without abolished Hamataura or Mukawa–Samani');
assert.equal(canonical.length,4,'Do not regenerate abolished Hidaka stations');
for(const id of ['11113','99708']){
 const route=read('data/generated/routes/line-'+id+'.json').route;
 assert.equal(route.visibility,'internal',id+' closed line must be hidden');
 assert.equal(route.playable,false,id+' closed line must not be playable');
}
for(const spec of ['jr-hokkaido/rumoehonsen','sukairerusabisu/sukairerumidorizakasen']){
 const j=read('data/lines/'+spec+'/line.json');
 assert.equal(j.visibility,'internal','closed canonical line accidentally made visible: '+spec);
 assert.equal(j.playable,false,'closed canonical line accidentally playable: '+spec);
}
const built=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
assert(built.includes('isRouteVisible'),'Game must retain closure visibility filter');
console.log(JSON.stringify({status:'PASS',hidakaActiveStations:expected,closedLinesHidden:['11113','99708']},null,2));
