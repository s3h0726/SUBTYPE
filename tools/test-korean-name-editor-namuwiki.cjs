#!/usr/bin/env node
'use strict';
// Regression gate for the public Japanese/Korean names editor after canonical
// name changes, station transfer aliases and manually authored special routes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
function parseCSV(input){
 const result=[];let row=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
  else if(c==='"')quoted=true;
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'){row.push(cell);result.push(row);row=[];cell='';}
  else if(c!=='\r')cell+=c;
 }
 if(cell||row.length){row.push(cell);result.push(row);}return result;
}
function table(file){const rows=parseCSV(read('reports/korean-names/'+file));const header=rows.shift();assert(header?.length>1,'Missing '+file);return{header,rows};}
const lines=table('lines.csv'),ops=table('operators.csv'),
 stations=table('stations-by-line.csv'),unique=table('stations-unique.csv');
const batch=json('data/japan-namuwiki-verified-batch-20261031.json');
const editor=json('data/editor-overrides.json');
const get=(t,name)=>{const i=t.header.indexOf(name);assert(i>=0,name+' missing in '+t.header.join(', '));return i;};
const byLine=new Map(lines.rows.map(r=>[r[get(lines,'노선ID')],r]));
const nameIdx=get(lines,'노선 한글명'),jaIdx=get(lines,'노선 일본어명'),enIdx=get(lines,'노선 영어명');
const stationLineIdx=get(stations,'노선ID'),stationJaIdx=get(stations,'역 일본어명'),
stationKoIdx=get(stations,'역 한글명'),stationSourceIdx=get(stations,'출처 검증'),
stationUrlIdx=get(stations,'근거 URL'),stationPathIdx=get(stations,'데이터경로');
assert.equal(get(stations,'역ID'),4,'Do not shift editor stable station ID');
assert.equal(get(stations,'역 한글명'),6,'Do not shift editor name field');
for(const entry of batch.lines){
 const r=byLine.get(entry.id);assert(r,'Editor missing Namuwiki line '+entry.id);
 assert.equal(r[nameIdx],editor.lines?.[entry.id]?.ko||entry.names.ko,'Korean label '+entry.id);
 assert.equal(r[jaIdx],entry.names.ja,'Japanese label '+entry.id);
 assert.equal(r[enIdx],entry.names.en,'English label '+entry.id);
}
for(const entry of batch.operators){
 const row=ops.rows.find(x=>x[get(ops,'운영사ID')]===entry.id);
 assert(row,'Editor missing operator '+entry.id);
 assert.equal(row[get(ops,'한국어명')],editor.operators?.[entry.id]||entry.names.ko);
 assert.equal(row[get(ops,'영어명')],entry.names.en);
}
const shonan=stations.rows.filter(r=>r[stationLineIdx]==='line-99326'&&r[stationJaIdx]==='湘南江の島');
assert.equal(shonan.length,1,'Shonan-Enoshima must be listed on its own monorail route');
assert.equal(shonan[0][stationKoIdx],'쇼난에노시마');
assert.equal(shonan[0][stationSourceIdx],'나무위키 확인(노선별)');
assert(/^https:\/\/namu\.moe\/w\//.test(shonan[0][stationUrlIdx]));
assert(stations.rows.some(r=>r[stationJaIdx]==='江ノ島'&&r[stationKoIdx]==='에노시마'),
 'Enoden Enoshima station must retain its other Japanese/Korean name');
assert(unique.rows.some(r=>r[get(unique,'역 일본어명')]==='湘南江の島'&&r[get(unique,'역 한글명')]==='쇼난에노시마'),
 'Unique station table must preserve the operator-specific Shonan name');
assert(unique.rows.some(r=>r[get(unique,'역 일본어명')]==='江ノ島'&&r[get(unique,'역 한글명')]==='에노시마'));
const disney=stations.rows.filter(r=>r[stationLineIdx]==='jp-disney-resort-line');
assert.equal(disney.length,5,'Editor must include entire Disney 4-stop loop and return stop');
assert(disney.every(r=>r[stationPathIdx]==='js/disney-resort-line-data.js'));
assert(byLine.has('jp-disney-resort-line'));
assert(ops.rows.some(r=>r[get(ops,'운영사ID')]==='maihama-resort-line'));
assert.equal(stations.rows.filter(r=>r[stationLineIdx]==='line-30005').length,0,'Retired line returned');
assert.equal(stations.rows.filter(r=>r[stationLineIdx]==='line-11103').length,0,'Retired line returned');
const html=read('reports/korean-names/editor.html');
assert(html.includes("DATA_VERSION='20261031-namuwiki-revalidated'"),
 'Old browser drafts must not supersede new source-of-truth names');
assert(html.includes("heads[j]==='근거 URL'"),'The source links must be shown in the editor');
console.log(JSON.stringify({status:'PASS',lines:lines.rows.length,operators:ops.rows.length,stations:stations.rows.length,uniqueStations:unique.rows.length,monorailLines:batch.lines.length,NamuwikiOperatorChecks:batch.operators.length,shonanAliases:2,disneyStops:disney.length}));
