#!/usr/bin/env node
'use strict';
// The Korean-name editor must display the two *playable* Matsuyama tram loops,
// not the obsolete combined source, without changing historical source data.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'');
const parse=text=>{
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}
  else if(c==='"')quoted=true;
  else if(c===','){row.push(cell);cell=''}
  else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}
  else if(c!=='\r')cell+=c;
 }
 if(cell||row.length){row.push(cell);rows.push(row)}
 return rows;
};
const csv=file=>parse(read('reports/korean-names/'+file));
const lines=csv('lines.csv'),stations=csv('stations-by-line.csv'),unique=csv('stations-unique.csv');
const ids=['line-99809-1','line-99809-2'];
for(const id of ids){
 const route=JSON.parse(read('data/generated/routes/'+id+'.json')).route;
 assert.equal(route.stations.length,23,id+' includes both ends of circular line');
 assert.equal(route.stations[0].stationMasterId,route.stations.at(-1).stationMasterId,id+' returns to physical first station');
 assert.equal(route.stations.at(-1).virtualLoopReturn,true,id+' uses dedicated virtual arrival event');
 const found=lines.filter(r=>r[2]===id);
 assert.equal(found.length,1,id+' is listed once');
 assert.equal(found[0][0],'iyotetsudo');
 assert.equal(found[0][3],route.line.ko,'Korean name matches playable route');
 assert.equal(found[0][4],route.line.ja,'Japanese name matches playable route');
 assert.equal(stations.filter(r=>r[2]===id).length,23,id+' contains all 23 stopping positions');
 const names=new Map(stations.filter(r=>r[2]===id).map(r=>[r[4],r[6]]));
 for(const st of route.stations)assert.equal(names.get(st.id),st.ko,id+' '+st.id+' Korean station name');
}
assert.equal(lines.filter(r=>r[2]==='line-99809').length,0,'Obsolete combined line hidden');
assert.equal(stations.filter(r=>r[2]==='line-99809').length,0,'Obsolete combined station rows hidden');
assert(unique.some(r=>r[2]==='松山市駅'),'Unique table retains Matsuyama-shi station');
console.log(JSON.stringify({status:'PASS',loops:ids,stationRows:46,source:'2026-11-02 Iyotetsu verified reconstruction'}));
