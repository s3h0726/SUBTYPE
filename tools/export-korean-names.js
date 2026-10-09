#!/usr/bin/env node
// Read-only Korean name inventory: original operator/line workspaces and generated station data.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const walk=(d,name)=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name),name):e.name===name?[path.join(d,e.name)]:[]):[];
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const toRel=p=>path.relative(root,p).replaceAll(path.sep,'/');
const csv=(rows)=>'\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const output=path.join(root,'reports/korean-names');fs.mkdirSync(output,{recursive:true});
const operators=walk(path.join(root,'data/operators'),'operator.json').map(file=>({file,meta:load(file)}));
const lines=walk(path.join(root,'data/lines'),'line.json').map(file=>({file,meta:load(file)}));
const opMap=new Map(operators.map(x=>[x.meta.id,x.meta]));
operators.sort((a,b)=>(a.meta.names?.ko||'').localeCompare(b.meta.names?.ko||'','ko'));
lines.sort((a,b)=>(a.meta.operatorId||'').localeCompare(b.meta.operatorId||'')||(a.meta.names?.ko||'').localeCompare(b.meta.names?.ko||'','ko'));
fs.writeFileSync(path.join(output,'operators.csv'),csv([['운영사ID','한국어명','일본어명','영어명','데이터경로'],...operators.map(x=>[x.meta.id,x.meta.names?.ko,x.meta.names?.ja,x.meta.names?.en,toRel(x.file)])]));
fs.writeFileSync(path.join(output,'lines.csv'),csv([['운영사ID','운영사 한글명','노선ID','노선 한글명','노선 일본어명','노선 영어명','RGB 색상','원본경로'],...lines.map(x=>[x.meta.operatorId,opMap.get(x.meta.operatorId)?.names?.ko,x.meta.id,x.meta.names?.ko,x.meta.names?.ja,x.meta.names?.en,x.meta.color||'',toRel(x.file)])]));
const stationFiles=walk(path.join(root,'data/generated/routes'),'__none__'); // no-op for directory access
const generatedDir=path.join(root,'data/generated/routes');
const byId=new Map();
if(fs.existsSync(generatedDir))for(const name of fs.readdirSync(generatedDir).filter(n=>n.endsWith('.json'))){try{const route=load(path.join(generatedDir,name)).route; if(route?.id)byId.set(route.id,route)}catch(e){console.warn('skipped',name,e.message)}}
const stationRows=[];const missing=[];
for(const x of lines){const route=byId.get(x.meta.id);if(!route){missing.push(x.meta.id);continue}for(const s of route.stations||[])stationRows.push([x.meta.operatorId,opMap.get(x.meta.operatorId)?.names?.ko,x.meta.id,x.meta.names?.ko,s.id,s.stationMasterId||'',s.ko,s.ja,s.kana||'',s.romaji||'',s.nameKoSource||'', 'data/generated/routes/'+x.meta.id+'.json']);}
stationRows.sort((a,b)=>String(a[2]).localeCompare(String(b[2]))||String(a[4]).localeCompare(String(b[4])));
fs.writeFileSync(path.join(output,'stations-by-line.csv'),csv([['운영사ID','운영사 한글명','노선ID','노선 한글명','역ID','공통역ID','역 한글명','역 일본어명','가나','로마자','한글명 출처','데이터경로'],...stationRows]));
const unique=new Map();for(const r of stationRows){const k=r[5]||r[7]+'|'+r[6];if(!unique.has(k))unique.set(k,r)}
fs.writeFileSync(path.join(output,'stations-unique.csv'),csv([['공통역ID','역 한글명','역 일본어명','가나','로마자','한글명 출처','예시 노선ID'],...Array.from(unique.values(),r=>[r[5],r[6],r[7],r[8],r[9],r[10],r[2]])]));
fs.writeFileSync(path.join(output,'README.md'),'# 메트로타이핑 한글명 현황\n\n현재 저장소 원본 및 생성 데이터에서 추출한 자료입니다. 게임 코드와 운영 데이터는 수정하지 않습니다.\n\n- 운영사: '+operators.length+'개\n- 노선: '+lines.length+'개\n- 역-노선 표기: '+stationRows.length+'건\n- 고유 역 표기: '+unique.size+'건\n- 생성 노선 상세정보 누락: '+missing.length+'개 ('+missing.slice(0,20).join(', ')+')\n\nCSV는 UTF-8 BOM으로 저장되어 Excel에서 바로 열 수 있습니다. 동일 역의 한글명이 노선마다 다를 수 있어 stations-by-line.csv와 stations-unique.csv를 모두 제공합니다.\n');
console.log(JSON.stringify({operators:operators.length,lines:lines.length,stationRecords:stationRows.length,uniqueStations:unique.size,missingGeneratedRoutes:missing.length}));
