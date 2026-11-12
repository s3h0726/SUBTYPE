#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
function csv(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
  else if(c==='"')quoted=true;
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';}
  else if(c!=='\r')cell+=c;
 }
 if(row.length||cell){row.push(cell);rows.push(row)}
 return rows;
}
const lineRows=csv(read('reports/korean-names/lines.csv')).slice(1),
 stationRows=csv(read('reports/korean-names/stations-by-line.csv')).slice(1);
const operator='omitetsudo',originalMain='line-99601';
const metas=[
 {id:'line-ohmi-hikone-taga',ko:'히코네·타가타이샤선',ja:'彦根・多賀大社線',color:'#DC5055',start:'米原',end:'高宮',count:7},
 {id:'line-ohmi-koto-omiji',ko:'코토오미지선',ja:'湖東近江路線',color:'#478FCF',start:'高宮',end:'八日市',count:7},
 {id:'line-ohmi-minakuchi-gamono',ko:'미나쿠치·가모노선',ja:'水口・蒲生野線',color:'#E7BB44',start:'八日市',end:'貴生川',count:13}
];
const lineMap=new Map(lineRows.map(row=>[row[2],row])),editor=json('data/editor-overrides.json');
assert(!lineMap.has(originalMain),'Hidden physical Main Line should not remain editable as a separate card');
const unique=new Set();
for(const meta of metas){
 const line=lineMap.get(meta.id);
 assert(line,'Missing nickname line '+meta.id);
 assert.equal(line[0],operator);
 assert.equal(line[3],meta.ko);
 assert.equal(line[4],meta.ja);
 assert.equal(line[6].toUpperCase(),meta.color);
 assert.equal(line[7],'data/generated/routes/'+meta.id+'.json');
 assert.equal(editor.lines[meta.id]?.ko,meta.ko);
 assert.equal(editor.lines[meta.id]?.color,meta.color);
 const route=json('data/generated/routes/'+meta.id+'.json').route;
 assert.deepEqual([route.stations[0].ja,route.stations.at(-1).ja],[meta.start,meta.end]);
 assert.equal(route.stations.length,meta.count);
 assert.equal(route.services.length,1);
 const rows=stationRows.filter(row=>row[2]===meta.id);
 assert.equal(rows.length,meta.count,'Station editing rows missing for '+meta.id);
 const byStationId=new Map(rows.map(row=>[row[4],row]));
 for(const station of route.stations){
  const row=byStationId.get(station.id);
  assert(row,'Missing route station '+station.id);
  assert.equal(row[0],operator);
  assert.equal(row[3],meta.ko);
  assert.equal(row[5],station.stationMasterId);
  assert.equal(row[6],station.ko);
  assert.equal(row[11],'data/generated/routes/'+meta.id+'.json');
  unique.add(row[5]);
 }
}
assert.equal(unique.size,25,'Main Line 25 physical stations should be editable with shared junction IDs');
assert.equal(stationRows.filter(r=>r[2]===originalMain).length,0,'Old unified Main Line station rows still exported');
for(const [id,count] of [['line-99602',3],['line-99603',7]]){
 const r=lineMap.get(id);
 assert(r&&r[0]===operator,'Branch route missing in Korean name table: '+id);
 assert.equal(stationRows.filter(row=>row[2]===id).length,count,'Branch station count changed '+id);
 assert.equal(r[3],id==='line-99602'?'타가선':'요카이치선','Branch label changed');
}
const html=read('reports/korean-names/editor.html');
assert(html.includes('OHMI_NICKNAME_IDS'),'Editor must retrieve nickname routes');
assert(html.includes('flatMap(route=>routeStationRows(route))'),'Editor must expose current nickname station rows');
assert(html.includes('for(const route of await ohmiNicknameRoutes())'),'Editor must expose nickname services');
assert(html.includes("new Set(['line-99601',...OHMI_NICKNAME_IDS])"),'Editor must hide obsolete parent rows');
const lite=JSON.parse(read('js/japan-lite-index.js').split('window.TRT_JAPAN_LITE_INDEX=')[1].trim().replace(/;\s*$/,''));
const cards=lite.routes.filter(r=>r.operatorId===operator&&r.visibility!=='internal');
assert.equal(cards.length,5,'Only three nickname sections and two original branch cards should be visible');
console.log('PASS Ohmi Korean editor: 3 nickname lines, 27 station rows, 25 physical stations, unchanged Taga/Yokaichi');
