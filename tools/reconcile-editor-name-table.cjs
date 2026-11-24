#!/usr/bin/env node
'use strict';
// Reconcile the published name editor's table with source data. The CSV is the
// authority for Korean names, never for physical station identities or track.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=p=>JSON.parse(read(p)),clean=v=>String(v??'').normalize('NFC').trim();
const check=process.argv.includes('--check'),nameFile='data/editor-overrides.json';
const audit={source:'reports/korean-names/*.csv',mode:check?'validate':'reconcile',operators:0,lines:0,stations:0,sharedStations:0,overrideChanges:0,missingRouteFiles:0,conflicts:[],examples:[]};
const cache=new Map(),changed=new Set(),originals=new Map();
function json(file){if(!cache.has(file)){if(!fs.existsSync(path.join(root,file)))return null;const content=read(file);originals.set(file,content);cache.set(file,JSON.parse(content))}return cache.get(file)}
function csv(file){
 const t=read(file).replace(/^\uFEFF/,''),data=[];let row=[],value='',quoted=false;
 for(let i=0;i<t.length;i++){const ch=t[i];if(quoted){if(ch==='"'&&t[i+1]==='"'){value+='"';i++}else if(ch==='"')quoted=false;else value+=ch}
  else if(ch==='"')quoted=true;else if(ch===','){row.push(value);value=''}
  else if(ch==='\n'){row.push(value);data.push(row);row=[];value=''}
  else if(ch!=='\r')value+=ch}
 if(value||row.length){row.push(value);data.push(row)}return data;
}
const operators=csv('reports/korean-names/operators.csv').slice(1);
const lines=csv('reports/korean-names/lines.csv').slice(1);
const stationRows=csv('reports/korean-names/stations-by-line.csv').slice(1);
assert.ok(operators.length>100&&lines.length>500&&stationRows.length>9000,'Name editor table unexpectedly incomplete');
const overrides=json(nameFile);for(const field of ['operators','lines','stations','services'])overrides[field]||={};
const fixed=(kind,key,previous,want)=>{audit[kind]++;if(audit.examples.length<35)audit.examples.push({kind,id:key,before:previous,after:want})};
function setName(target,key,want,kind,id){
 if(!target||typeof target!=='object'||!want||clean(target[key])===want)return false;
 fixed(kind,id,clean(target[key]),want);target[key]=want;return true;
}
function overrideName(section,id,want){
 if(!want)return;
 if(clean(overrides[section][id])!==want){overrides[section][id]=want;audit.overrideChanges++}
}
const uniqueOperators=new Map(),uniqueLines=new Map(),uniqueStations=new Map();
for(const row of operators){
 const [id,want,,,,file]=row; // The operator report has five columns; path is row[4].
 const operatorId=clean(row[0]),ko=clean(row[1]),source=clean(row[4]);
 if(!operatorId||!ko)continue;
 if(uniqueOperators.has(operatorId)&&uniqueOperators.get(operatorId)!==ko)throw Error('Operator table conflict: '+operatorId);
 uniqueOperators.set(operatorId,ko);
 if(/^data\/operators\/[^/]+\/operator\.json$/.test(source)){
  const doc=json(source);
  if(doc?.id===operatorId&&doc.names){
   if(setName(doc.names,'ko',ko,'operators',operatorId))changed.add(source);
  }
 }
 // Preserve the table's names over subsequent source rebuilds.
 if(clean(overrides.operators[operatorId])!==ko){
  const raw= /^data\/operators\/[^/]+\/operator\.json$/.test(source)?json(source):null;
  if(raw?.names?.ko!==ko || overrides.operators[operatorId]!==undefined)overrideName('operators',operatorId,ko);
 }
}
for(const row of lines){
 const id=clean(row[2]),ko=clean(row[3]),source=clean(row[7]);
 if(!id||!ko)continue;
 if(uniqueLines.has(id)&&uniqueLines.get(id)!==ko)throw Error('Line table conflict: '+id);
 uniqueLines.set(id,ko);
 if(/^data\/lines\/[^/]+\/[^/]+\/line\.json$/.test(source)){
  const doc=json(source);
  if(doc?.id===id&&doc.names){
   if(setName(doc.names,'ko',ko,'lines',id))changed.add(source);
  }
 }
 const base=/^data\/lines\/[^/]+\/[^/]+\/line\.json$/.test(source)?json(source):null;
 if(base?.names?.ko!==ko || overrides.lines[id]?.ko!==undefined){
  const previous=overrides.lines[id]||{};
  if(previous.ko!==ko){overrides.lines[id]={...previous,ko};audit.overrideChanges++}
 }
}
const stationsByMaster=new Map();
const perLine=new Map();
for(const row of stationRows){
 const lineId=clean(row[2]),id=clean(row[4]),masterId=clean(row[5]),ko=clean(row[6]),ja=clean(row[7]),routeFile=clean(row[11]);
 if(!lineId||!id||!ko)continue;
 const key=lineId+'::'+id;
 if(uniqueStations.has(key)&&uniqueStations.get(key)!==ko){
  audit.conflicts.push({type:'same-line-different-name',key,names:[uniqueStations.get(key),ko]});
  continue;
 }
 uniqueStations.set(key,ko);
 if(masterId.startsWith('station-')){
  if(!stationsByMaster.has(masterId))stationsByMaster.set(masterId,{names:new Set(),originals:new Set()});
  stationsByMaster.get(masterId).names.add(ko);stationsByMaster.get(masterId).originals.add(ja);
 }
 if(!perLine.has(lineId))perLine.set(lineId,[]);
 perLine.get(lineId).push({id,masterId,ko,ja,routeFile});
}
const canonStations=new Map();
for(const [masterId,row] of stationsByMaster){
 if(row.names.size===1&&row.originals.size===1)canonStations.set(masterId,{ko:[...row.names][0],ja:[...row.originals][0]});
}
const stationDir=path.join(root,'data/shared-stations');
for(const fileName of fs.readdirSync(stationDir).filter(f=>/^stations-\d+\.json$/.test(f))){
 const file='data/shared-stations/'+fileName,items=json(file);let edits=0;
 if(!Array.isArray(items))throw Error('Invalid shared station shard: '+file);
 for(const station of items){
  const name=canonStations.get(station.id);
  if(!name||!station.names||clean(station.names.ja)!==name.ja)continue;
  if(clean(station.names.ko)!==name.ko){
   fixed('sharedStations',station.id,station.names.ko,name.ko);
   station.names.ko=name.ko;edits++;
  }
 }
 if(edits)changed.add(file);
}
const normalizedRoute=new Map(),loadRoute=(lineId,file)=>{
 if(!file||!file.endsWith('.json')||!fs.existsSync(path.join(root,file)))return null;
 const data=json(file);
 if(!data)return null;
 if(data.route?.id===lineId)return data.route;
 if(data.id===lineId)return data;
 if(Array.isArray(data.lines))return data.lines.find(route=>route.id===lineId)||null;
 return null;
};
for(const [lineId,rows] of perLine){
 // The exported data path is the same source shown in the editor's "source" column.
 const file=rows[0].routeFile;
 const route=loadRoute(lineId,file);
 if(!route)audit.missingRouteFiles++;
 const byId=new Map((route?.stations||[]).map(station=>[String(station.id),station]));
 for(const row of rows){
  const actual=byId.get(row.id),before=clean(actual?.ko||actual?.names?.ko||'');
  const previous=clean(overrides.stations[lineId]?.[row.id]);
  // Shared interchange stations with multiple line names must retain a
  // route-specific edit even if a previous generated build already matches.
  const ambiguous=stationsByMaster.get(row.masterId)?.names.size>1;
  if(before!==row.ko||(previous&&previous!==row.ko)||(ambiguous&&previous!==row.ko)){
   fixed('stations',lineId+'::'+row.id,before||previous,row.ko);
   overrides.stations[lineId]||={};
   if(previous!==row.ko){overrides.stations[lineId][row.id]=row.ko;audit.overrideChanges++}
  }
 }
}
if(audit.conflicts.length)throw Error('Name editor station ID collisions: '+JSON.stringify(audit.conflicts.slice(0,5)));
if(check){
 const outstanding=[];
 for(const [lineId,rows] of perLine){
  const route=loadRoute(lineId,rows[0].routeFile);if(!route)continue;
  const stationMap=new Map((route.stations||[]).map(s=>[String(s.id),s]));
  for(const row of rows){const station=stationMap.get(row.id);if(station&&clean(station.ko||station.names?.ko)!==row.ko&&outstanding.length<40)outstanding.push({lineId,stationId:row.id,actual:station.ko,want:row.ko})}
 }
 if(outstanding.length)throw Error('Generated game stations still disagree with editor table: '+JSON.stringify(outstanding));
 console.log(JSON.stringify({status:'PASS',checkedOperators:operators.length,checkedLines:lines.length,checkedStationRows:stationRows.length,missingRouteFiles:audit.missingRouteFiles}));
 process.exit(0);
}
for(const file of changed){
 const value=cache.get(file),data=JSON.stringify(value,null,2)+'\n';
 if(data!==originals.get(file))fs.writeFileSync(path.join(root,file),data);
}
if(JSON.stringify(overrides)!==originals.get(nameFile).trim())fs.writeFileSync(path.join(root,nameFile),JSON.stringify(overrides,null,2)+'\n');
const report='reports/korean-names/reconciliation-audit.json';
if((audit.operators+audit.lines+audit.stations+audit.sharedStations+audit.overrideChanges)>0||!fs.existsSync(path.join(root,report))){
 fs.writeFileSync(path.join(root,report),JSON.stringify(audit,null,2)+'\n');
}
console.log(JSON.stringify({status:'RECONCILED',sourceRows:{operators:operators.length,lines:lines.length,stations:stationRows.length},...audit}));
