#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const {projectRoot,loadAll}=require('./lib/line-workspaces');

const source=path.resolve(process.argv.find(arg=>arg.endsWith('.md'))||'');
const apply=process.argv.includes('--apply');
if(!source||!fs.existsSync(source))throw new Error('Usage: node tools/apply-korean-name-document.js <document.md> [--apply]');

const sectionNames=new Map([['운영사','operators'],['노선','lines'],['역','stations']]);
const rows={operators:new Map(),lines:new Map(),stations:new Map()},duplicates=[];
let section=null;
for(const rawLine of fs.readFileSync(source,'utf8').split(/\r?\n/)){
  const heading=rawLine.match(/^##\s+(.+?)\s*$/);if(heading){section=sectionNames.get(heading[1])||null;continue}
  if(!section||!rawLine.startsWith('|'))continue;
  const cells=rawLine.slice(1,rawLine.endsWith('|')?-1:undefined).split('|').map(value=>value.trim().replaceAll('\\|','|'));
  if(cells.length!==4||cells[0]==='ID'||/^---/.test(cells[0]))continue;
  const [id,ko,ja,en]=cells;if(!id||!ko)throw new Error(`${section}: empty ID or Korean name`);
  if(rows[section].has(id))duplicates.push(`${section}:${id}`);else rows[section].set(id,{id,ko,ja,en});
}
if(duplicates.length)throw new Error(`Duplicate document IDs: ${duplicates.slice(0,20).join(', ')}`);

const data=loadAll(),canonical={operators:data.operators,lines:new Map(data.workspaces.map(item=>[item.line.id,item.line])),stations:data.stations};
const missingInCanonical=[],identityMismatches=[],missingInDocument={operators:[],lines:[],stations:[]},changes={operators:[],lines:[],stations:[]};
for(const type of Object.keys(rows)){
  for(const [id,row] of rows[type]){
    const item=canonical[type].get(id);if(!item){missingInCanonical.push(`${type}:${id}`);continue}
    const canonicalJa=String(item.names?.ja||'').normalize('NFC'),documentJa=String(row.ja||'').normalize('NFC');
    if(canonicalJa!==documentJa){identityMismatches.push({type,id,canonicalJa,documentJa});continue}
    if(String(item.names?.ko||'')!==row.ko)changes[type].push({id,before:item.names?.ko||'',after:row.ko});
  }
  for(const id of canonical[type].keys())if(!rows[type].has(id))missingInDocument[type].push(id);
}
if(missingInCanonical.length||identityMismatches.length){
  console.error(JSON.stringify({status:'BLOCKED',missingInCanonical,identityMismatches:identityMismatches.slice(0,50)},null,2));process.exit(1)
}

const writeJson=(file,value)=>{const temporary=`${file}.tmp-${process.pid}`;fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');JSON.parse(fs.readFileSync(temporary,'utf8'));fs.renameSync(temporary,file)};
if(apply){
  for(const change of changes.operators){const item=data.operators.get(change.id);item.names.ko=change.after;const {_folder,...plain}=item;writeJson(path.join(_folder,'operator.json'),plain)}
  for(const change of changes.lines){const workspace=data.workspaces.find(item=>item.line.id===change.id);workspace.line.names.ko=change.after;writeJson(path.join(workspace.folder,'line.json'),workspace.line)}
  const changedStations=new Set(changes.stations.map(change=>change.id)),changedShards=new Map();
  for(const id of changedStations){const item=data.stations.get(id);item.names.ko=rows.stations.get(id).ko;changedShards.set(data.stationShards.get(id),true)}
  for(const file of changedShards.keys()){const list=JSON.parse(fs.readFileSync(file,'utf8'));for(const item of list)if(changedStations.has(item.id))item.names.ko=rows.stations.get(item.id).ko;writeJson(file,list)}
}
console.log(JSON.stringify({status:apply?'APPLIED':'DRY_RUN_PASS',source,document:{operators:rows.operators.size,lines:rows.lines.size,stations:rows.stations.size},canonical:{operators:canonical.operators.size,lines:canonical.lines.size,stations:canonical.stations.size},changed:{operators:changes.operators.length,lines:changes.lines.length,stations:changes.stations.length},unchanged:{operators:rows.operators.size-changes.operators.length,lines:rows.lines.size-changes.lines.length,stations:rows.stations.size-changes.stations.length},missingInDocument:Object.fromEntries(Object.entries(missingInDocument).map(([key,value])=>[key,{count:value.length,ids:value}]))},null,2));
