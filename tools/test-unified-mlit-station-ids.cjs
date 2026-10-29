'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const registry=JSON.parse(read('data/station-id-aliases.json'));
const aliases=registry.aliases;
assert.ok(Object.keys(aliases).length>1000,'Station migration registry missing');
assert.equal(aliases['station-mlit-003872'],'station-1130102','Shimbashi must share nationwide identity');
const migrated=new Set(Object.values(aliases));
for(const [from,to] of Object.entries(aliases)){
 assert.match(from,/^station-mlit-\d+$/);
 assert.match(to,/^station-(?!mlit-)[a-z0-9-]+$/i);
}
const shards=fs.readdirSync(path.join(root,'data/shared-stations')).filter(x=>x.endsWith('.json'));
const masters=new Set();
for(const shard of shards){
 const stations=JSON.parse(read('data/shared-stations/'+shard));
 for(const station of stations){
  assert.ok(!masters.has(station.id),'Duplicate station master '+station.id);
  masters.add(station.id);
 }
}
for(const id of migrated)assert.ok(masters.has(id),'Missing destination master '+id);
const regex=/station-mlit-\d{4,}/;
function check(file){
 const content=read(file);
 assert.ok(!regex.test(content),'Legacy MLIT ID remains in '+file);
}
for(const pathName of ['js/app.bundle.js','js/nex-route-resolver.js','js/data-loader.js',
 'data/lines/tokyo-metro/ginza/stations.json','data/generated/routes/line-28001.json',
 'data/lines/jr-east/yamanote/stations.json'])check(pathName);
const route=JSON.parse(read('data/generated/routes/line-28001.json')).route;
assert.ok(route.stations.length>10);
assert.ok(route.directedSegments.length===route.stations.length-1);
for(let i=0;i<route.directedSegments.length;i++){
 assert.equal(route.directedSegments[i].fromStationId,route.stations[i].id);
 assert.equal(route.directedSegments[i].toStationId,route.stations[i+1].id);
 assert.ok(route.directedSegments[i].geometry?.length>=2);
}
const future=read('tools/build-rail-system.js');
assert.ok(future.includes('stationIdAliases'),'Future MLIT imports must use migration registry');
const html=read('index.html');
assert.ok(html.includes('station-id-unified-20261029'));
console.log('PASS: '+Object.keys(aliases).length+' legacy station IDs, '+masters.size+
 ' surviving station masters, track geometry and browser cache compatibility');
