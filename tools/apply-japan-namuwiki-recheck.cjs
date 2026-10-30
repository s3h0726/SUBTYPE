#!/usr/bin/env node
'use strict';
// Applies only explicit Namu wiki article / station-table crosschecks.
// No inferred wiki URLs, bulk Hangul substitutions, station ID changes or geometry edits.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const apply=process.argv.includes('--apply');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/japan-namuwiki-verified-batch-20261031.json'),'utf8'));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,data)=>fs.writeFileSync(path.join(root,p),JSON.stringify(data,null,2)+'\n');
const rel=p=>path.relative(root,p).replace(/\\/g,'/');
function collect(dir,file){let result=[];function visit(folder){if(!fs.existsSync(folder))return;for(const ent of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,ent.name);if(ent.isDirectory())visit(p);else if(ent.name===file)result.push(rel(p));}}visit(path.join(root,dir));return result.sort();}
const lineMap=new Map(collect('data/lines','line.json').map(file=>{const value=read(file);return[value.id,{file,value,folder:path.dirname(file)}]}));
const opMap=new Map(collect('data/operators','operator.json').map(file=>{const value=read(file);return[value.id,{file,value}]}));
const shardMap=new Map,stationMap=new Map;
for(const file of fs.readdirSync(path.join(root,'data/shared-stations')).filter(f=>/^stations-\d+\.json$/.test(f))){
 const pathname='data/shared-stations/'+file,items=read(pathname);shardMap.set(pathname,items);
 for(const item of items){if(stationMap.has(item.id))throw Error('DUPLICATE_STATION:'+item.id);stationMap.set(item.id,{file:pathname,item});}
}
const diffs=[],review=[],seen=new Set(),touched=new Set();
function change(kind,id,field,from,to,file,source){
 if(from===to)return;
 diffs.push({kind,id,field,from,to,file,source});
}
function sourceFor(entry,japaneseName,koreanName,kind){
 return {family:'namuwiki',method:'manual',type:'namuwiki-manual',verified:true,
  url:entry.wikiUrl,wikiTitle:entry.wikiTitle,sourceAccess:'verified-article-table',
  identityEvidence:{ja:japaneseName,ko:koreanName,scope:kind},
  verifiedDate:manifest.batch,status:'NAMUWIKI_ARTICLE_CROSSCHECKED',
  canonicalPolicy:'namuwiki',confidence:'HIGH'};
}
for(const entry of manifest.lines){
 const match=lineMap.get(entry.id);
 if(!match)throw Error('LINE_MISSING:'+entry.id);
 const {value:line,file}=match;
 if(line.names?.ja!==entry.expectedJa&&line.names?.ja!==entry.names.ja)throw Error('LINE_JA_IDENTITY_CHANGED:'+entry.id+':'+line.names?.ja);
 for(const key of ['ja','ko','en']){
  const value=entry.names[key],old=line.names[key];
  if(old!==value){change('line',line.id,key,old,value,file,entry.wikiUrl);if(apply)line.names[key]=value;}
 }
 if(apply){
  line.sources??={};line.sources.koreanName=sourceFor(entry,entry.names.ja,entry.names.ko,'line');
  line.namuwikiSourceLineName=entry.wikiTitle;
  write(file,line);touched.add(file);
 }
 seen.add('line:'+line.id);
}
for(const entry of manifest.operators){
 const match=opMap.get(entry.id);if(!match)throw Error('OPERATOR_MISSING:'+entry.id);
 const {value:op,file}=match;
 if(op.names?.ja!==entry.expectedJa)throw Error('OPERATOR_JA_IDENTITY_CHANGED:'+entry.id);
 for(const key of ['ko','en']){
  const value=entry.names[key],old=op.names[key];
  if(old!==value){change('operator',op.id,key,old,value,file,entry.wikiUrl);if(apply)op.names[key]=value;}
 }
 if(apply){
  op.sources??={};op.sources.koreanName=sourceFor(entry,op.names.ja,entry.names.ko,'operator');
  write(file,op);touched.add(file);
 }
 seen.add('operator:'+op.id);
}
const stationProofs=new Map;
for(const entry of manifest.stationNames){
 const line=lineMap.get(entry.routeId);if(!line)throw Error('STATION_LINE_NOT_FOUND:'+entry.routeId);
 const rows=read(line.folder+'/stations.json');
 const options=rows.map(s=>({relation:s,source:stationMap.get(s.stationId)}))
  .filter(x=>x.source?.item.names?.ja===entry.ja);
 if(options.length!==1){review.push({type:'STATION_JA_AMBIGUOUS_OR_MISSING',routeId:entry.routeId,ja:entry.ja,ko:entry.ko,matches:options.length});continue;}
 const {item:station,file}=options[0].source;
 const prior=stationProofs.get(station.id);
 if(prior&&prior!==entry.ko){review.push({type:'CROSS_ROUTE_NAME_CONFLICT',stationId:station.id,ja:entry.ja,first:prior,second:entry.ko});continue;}
 stationProofs.set(station.id,entry.ko);
 // Verified canonical spellings cannot be silently overwritten by another reference.
 if(station.koVerified===true&&station.names.ko!==entry.ko&&!station.namuwikiBatchProof){
  review.push({type:'EXISTING_VERIFIED_NAME_CONFLICT',stationId:station.id,ja:entry.ja,current:station.names.ko,proposed:entry.ko});continue;
 }
 const old=station.names.ko;
 if(old!==entry.ko){change('station',station.id,'ko',old,entry.ko,file,entry.wikiUrl);if(apply)station.names.ko=entry.ko;}
 if(apply){
  station.koVerified=true;station.koSourceFamily='namuwiki';station.koSource='namuwiki-manual';
  station.koSourceMethod='manual';station.koSourceUrl=entry.wikiUrl;
  station.koVerifiedDate=manifest.batch;station.koConfidence='HIGH';station.koReviewStatus='VERIFIED';
  station.koSearchReference=entry.wikiTitle;
  station.namuwikiBatchProof={source:entry.wikiUrl,wikiTitle:entry.wikiTitle,
   stationJa:entry.ja,stationKo:entry.ko,routeId:entry.routeId};
  touched.add(file);
 }
 seen.add('station:'+station.id);
}
if(apply){
 for(const file of [...touched].filter(x=>x.startsWith('data/shared-stations/')))write(file,shardMap.get(file));
 const file='data/editor-overrides.json',editor=read(file);
 // A prior display override has higher runtime precedence than line.json.
 // Align only stale overrides; retain card colors and intentional short names.
 const explicit={
  'line-99927':'오키나와 도시 모노레일선',
  'line-99336':'하네다 공항선',
  'line-99331':'1호선',
  'line-99332':'2호선'
 };
 for(const [id,ko] of Object.entries(explicit)){
  if(editor.lines?.[id]&&editor.lines[id].ko!==ko){
   change('editor-line',id,'ko',editor.lines[id].ko,ko,file,'verified Namuwiki line label');
   editor.lines[id].ko=ko;
  }
 }
 write(file,editor);touched.add(file);
}
const report={
 schemaVersion:1,date:manifest.batch,
 policy:'Namuwiki explicit Japanese-name / Korean-name matches only. Japanese and English forms may be independently normalized; verified Korean status does not certify English.',
 scope:{lines:manifest.lines.length,operators:manifest.operators.length,stationReferences:manifest.stationNames.length,uniqueStationsVerified:stationProofs.size},
 applied:apply,changedFields:diffs.length,
 changedEntries:new Set(diffs.map(x=>x.kind+':'+x.id)).size,
 reviewRequired:review.length,review,diffs,
 guarded:{lineIdChanges:0,stationIdChanges:0,geometryChanges:0,stopSequenceChanges:0},
};
if(apply){
 const file='reports/names/NAMUWIKI_APPLIED_BATCH_20261031.json';write(file,report);
}
console.log(JSON.stringify({status:review.length?'PARTIAL_REVIEW':'PASS',applied:apply,changes:diffs.length,reviewCount:review.length,verifiedStationEntries:stationProofs.size,touchedFiles:touched.size},null,2));
