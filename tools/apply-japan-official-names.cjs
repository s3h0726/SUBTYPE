#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadStations,read,discoverLineFolders}=require('./lib/line-workspaces');
const root=path.resolve(__dirname,'..'),apply=process.argv.includes('--apply'),{map:stations,shards}=loadStations();
const evidence=read(path.join(root,'data/source-audit/japan-official-names-20261101.json'));
const memberships=new Map;
for(const folder of discoverLineFolders()){const line=read(path.join(folder,'line.json'));for(const rel of read(path.join(folder,'stations.json'))){if(!memberships.has(rel.stationId))memberships.set(rel.stationId,[]);memberships.get(rel.stationId).push(line)}}
const file=path.join(root,'data/source-audit/japan-name-corrections-20261101.json'),corrections=read(file),touched=new Set,patches=[],conflicts=[];
// Reject homonyms before using the national booking-system list. A prefecture
// qualifier discarded during extraction must never make a name look unique.
if(apply)for(const p of corrections.patches.filter(p=>p.source.includes('Station_name.pdf')&&evidence.ambiguousPdfJapaneseNames?.includes(p.ja))){
 const station=stations.get(p.stationId);if(station.names[p.field]!==p.after)throw Error('AMBIGUOUS_PDF_PATCH_CHANGED:'+p.stationId);
 station.names[p.field]=p.before;delete station.officialNameProof[p.field];touched.add(p.file);
}
if(apply)corrections.patches=corrections.patches.filter(p=>!(p.source.includes('Station_name.pdf')&&evidence.ambiguousPdfJapaneseNames?.includes(p.ja)));
for(const station of stations.values()){
 const lines=memberships.get(station.id)||[];
 const facts=evidence.facts.filter(f=>f.ja===station.names.ja&&lines.some(l=>l.operatorId===f.operatorId||f.operatorScope?.includes(l.operatorId)));
 for(const field of ['kana','en']){
  if(corrections.mergeConflicts?.some(c=>c.key===station.id+'.names.'+field))continue;
  const all=facts.filter(f=>f[field]),direct=all.filter(f=>f.operatorId),found=direct.length?direct:all,values=new Set(found.map(f=>f[field]));if(!values.size)continue;
  if(values.size>1){conflicts.push({stationId:station.id,field,values:[...values]});continue}
  const fact=found[0],after=fact[field],before=station.names[field]||'',sourceFile=path.relative(root,shards.get(station.id)).replace(/\\/g,'/');
  if(before!==after){patches.push({kind:'station',stationId:station.id,operatorId:fact.operatorId||lines[0].operatorId,lineIds:lines.filter(l=>l.operatorId===fact.operatorId||fact.operatorScope?.includes(l.operatorId)).map(l=>l.id),ja:station.names.ja,field,before,after,file:sourceFile,source:fact.source,reason:'공식 운영사 역 목록 및 역 정보 ID 대조'});if(apply)station.names[field]=after}
  if(apply){station.officialNameProof??={};station.officialNameProof[field]={value:after,date:'2026-11-01',source:fact.source,listSource:fact.listSource,japaneseSource:fact.japaneseSource||fact.source};station.officialNameProof.ja={value:station.names.ja,date:'2026-11-01',source:fact.japaneseSource||fact.source};touched.add(sourceFile)}
 }
}
if(apply){for(const p of touched){const full=path.join(root,p);fs.writeFileSync(full,JSON.stringify(read(full).map(s=>stations.get(s.id)),null,2)+'\n')}corrections.patches.push(...patches);corrections.officialConflicts=conflicts;fs.writeFileSync(file,JSON.stringify(corrections,null,2)+'\n')}
console.log(JSON.stringify({apply,facts:evidence.facts.length,patches:patches.length,byField:patches.reduce((a,p)=>(a[p.field]=(a[p.field]||0)+1,a),{}),conflicts:conflicts.length,touchedFiles:touched.size},null,2));
