#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
function csvRows(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
   const c=text[i];
   if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}
   else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}
   else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}
   else if(c!=='\r')cell+=c;
 }
 if(cell.length||row.length){row.push(cell);rows.push(row)}
 return rows;
}
const lines=csvRows(read('reports/korean-names/lines.csv')),stations=csvRows(read('reports/korean-names/stations-by-line.csv'));
const expected=[
 {id:'line-30005-yama',ko:'메이테츠 미카와선(산선)',ja:'名鉄三河線（山線）',end:'猿投',file:'meitetsu-mikawa-yama.json'},
 {id:'line-30005-umi',ko:'메이테츠 미카와선(해선)',ja:'名鉄三河線（海線）',end:'碧南',file:'meitetsu-mikawa-umi.json'}
];
assert.equal(lines.filter(r=>r[2]==='line-30005').length,0,'Old unified Mikawa line should not be an editor card');
assert.equal(stations.filter(r=>r[2]==='line-30005').length,0,'Old unified Mikawa station rows should be retired');
for(const e of expected){
 const line=lines.filter(r=>r[2]===e.id);
 assert.equal(line.length,1,e.id+' line table row count');
 assert.equal(line[0][3],e.ko);
 assert.equal(line[0][4],e.ja);
 assert.ok(line[0][7].endsWith(e.file));
 const routeStations=stations.filter(r=>r[2]===e.id);
 assert.equal(routeStations.length,12,e.id+' station table row count');
 assert.equal(routeStations[0][7],'知立');
 assert.ok(routeStations.some(r=>r[7]===e.end),e.id+' must include '+e.end);
 assert.ok(routeStations.every(r=>r[3]===e.ko&&r[11].endsWith(e.file)));
}
const sources=expected.map(e=>JSON.parse(read('data/route-overrides/'+e.file)).route);
assert.equal(sources[0].stations[0].id,sources[1].stations[0].id,'Chiryu must be the same station');
console.log('PASS: Korean name editor lists two Mikawa cards, 12 stations each, no obsolete unified card');
