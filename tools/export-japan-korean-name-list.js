#!/usr/bin/env node
/* Generates a read-only review document from canonical Japanese rail data. */
const fs=require('fs'),path=require('path');
const {projectRoot,loadAll}=require('./lib/line-workspaces');
const data=loadAll(),output=path.join(projectRoot,'data','source-audit','JAPAN_RAIL_KOREAN_NAME_LIST.md');
const text=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
const sortByName=(left,right)=>String(left.names?.ko||left.ko||'').localeCompare(String(right.names?.ko||right.ko||''),'ko')||String(left.names?.ja||left.ja||'').localeCompare(String(right.names?.ja||right.ja||''),'ja');
const heading=(title,rows)=>[`## ${title}`,'','| ID | 한국어 canonical | 일본어 | English / Romaji |','| --- | --- | --- | --- |',...rows,''].join('\n');
const operators=[...data.operators.values()].sort(sortByName);
const lines=data.workspaces.map(workspace=>workspace.line).sort(sortByName);
const stations=[...data.stations.values()].sort(sortByName);
const operatorRows=operators.map(item=>`| ${text(item.id)} | ${text(item.names?.ko)} | ${text(item.names?.ja)} | ${text(item.names?.en)} |`);
const lineRows=lines.map(item=>`| ${text(item.id)} | ${text(item.names?.ko)} | ${text(item.names?.ja)} | ${text(item.names?.en)} |`);
const stationRows=stations.map(item=>`| ${text(item.id)} | ${text(item.names?.ko)} | ${text(item.names?.ja)} | ${text(item.names?.en)} |`);
const document=[
  '# SUBTYPE 일본 철도 한국어명 목록',
  '',
  '> 이 문서는 canonical source를 읽어 자동 생성한 검수용 목록입니다. 수정은 이 파일이 아니라 `operator.json`, `line.json`, 또는 `data/shared-stations/*.json`에서 해야 합니다.',
  '',
  `- 운영사: ${operators.length}개`,
  `- 노선: ${lines.length}개`,
  `- canonical 역: ${stations.length}개`,
  '- 생성 명령: `node tools/export-japan-korean-name-list.js`',
  '',
  heading('운영사',operatorRows),
  heading('노선',lineRows),
  heading('역',stationRows)
].join('\n');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,document,'utf8');
console.log(JSON.stringify({status:'PASS',output:path.relative(projectRoot,output).replaceAll('\\\\','/'),operators:operators.length,lines:lines.length,stations:stations.length,bytes:Buffer.byteLength(document)},null,2));
