#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
function parse(text){
 const out=[];let line=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++}else if(c==='"')quoted=false;else value+=c}
  else if(c==='"')quoted=true;else if(c===','){line.push(value);value=''}
  else if(c==='\n'){line.push(value);out.push(line);line=[];value=''}
  else if(c!=='\r')value+=c;
 }
 if(value||line.length){line.push(value);out.push(line)}return out;
}
const lines=parse(read('reports/korean-names/lines.csv'));
const stops=parse(read('reports/korean-names/stations-by-line.csv'));
assert.equal(lines.filter(r=>r[2]==='line-11103').length,0);
assert.equal(stops.filter(r=>r[2]==='line-11103').length,0);
const defs=[
 {id:'line-11103-otaru-sapporo',ja:'函館本線(小樽～札幌)',ko:'하코다테 본선(오타루~삿포로)',n:15,start:'小樽',end:'札幌',source:'hakodate-west.json'},
 {id:'line-11103-sapporo-asahikawa',ja:'函館本線(札幌～旭川)',ko:'하코다테 본선(삿포로~아사히카와)',n:27,start:'札幌',end:'旭川',source:'hakodate-east.json'}
];
for(const d of defs){
 const row=lines.filter(x=>x[2]===d.id);assert.equal(row.length,1);
 assert.equal(row[0][3],d.ko);assert.equal(row[0][4],d.ja);
 assert.ok(row[0][7].endsWith(d.source));
 const stations=stops.filter(x=>x[2]===d.id);
 assert.equal(stations.length,d.n);assert.ok(stations.some(x=>x[7]===d.start));
 assert.ok(stations.some(x=>x[7]===d.end));
 assert.ok(stations.every(x=>x[3]===d.ko&&x[11].endsWith(d.source)));
}
assert.equal(stops.filter(x=>x[2]==='line-11103-sapporo-asahikawa'&&x[7]==='厚別')[0][6],'아쓰베쓰');
assert.equal(stops.filter(x=>x[2]==='line-11103-sapporo-asahikawa'&&x[7]==='大麻')[0][6],'오아사');
console.log('PASS: Hakodate split name editor 15+27 stations, no redundant legacy card');
