#!/usr/bin/env node
'use strict';
// Explicit identity-based patches only. Does not change IDs, relationships,
// coordinates, Japanese orthography, English spelling or station codes.
const fs=require('node:fs'),path=require('node:path');
const {loadStations,read,discoverLineFolders}=require('./lib/line-workspaces');
const root=path.resolve(__dirname,'..'),apply=process.argv.includes('--apply');
const evidence=read(path.join(root,'data/source-audit/japan-name-evidence-20261101.json'));
const articles=read(path.join(root,'data/source-audit/japan-station-articles-20261101.json')).articles;
const {map:stations,shards}=loadStations(),routeFile='data/japan-route-station-names.json',scoped=read(path.join(root,routeFile)),editor=read(path.join(root,'data/editor-overrides.json'));
const relations=new Map(discoverLineFolders().map(folder=>{const l=read(path.join(folder,'line.json'));return[l.id,{line:l,stops:read(path.join(folder,'stations.json'))}]}));
const articleMap=new Map(articles.filter(a=>a.identityMatched).map(a=>[a.key,a]));
const byIdentity=new Map,conflicts=[],patches=[],touched=new Set;
const correctionFile=path.join(root,'data/source-audit/japan-name-corrections-20261101.json');
const previous=fs.existsSync(correctionFile)?read(correctionFile):{schemaVersion:1,date:'2026-11-01',patches:[]};
const titleKo=a=>a.title.replace(/ - 나무위키$/,'').replace(/역(?:\([^)]*\))?$/,'');
for(const p of evidence.pages)for(const m of p.matches){
 const rel=relations.get(p.lineId);if(!rel?.stops.some(s=>s.stationId===m.stationId))throw Error('UNKNOWN_ROUTE_IDENTITY:'+p.lineId+'::'+m.stationId);
 const master=stations.get(m.stationId),specific=scoped.routes[p.lineId]?.[m.stationId];
 const ja=specific?.ja||master.names.ja;if(ja!==m.ja)throw Error('JAPANESE_IDENTITY_CHANGED:'+p.lineId+'::'+m.stationId);
 let article=articleMap.get(m.href+'::'+m.ja);
 if(article&&titleKo(article)!==m.ko)continue;
 if(!article){
  const linkTitle=decodeURIComponent(m.href.slice(3)).split('#')[0].replace(/역(?:\([^)]*\))?$/,'');
  if(linkTitle!==m.ko||master.koVerified===true||specific?.namuwikiVerified===true)continue;
  article={url:p.url,sha256:p.sha256,reading:null,proofKind:'EXACT_ROUTE_TABLE'};
 }
 const key=m.stationId+'::'+m.ja;
 if(!byIdentity.has(key))byIdentity.set(key,[]);
 byIdentity.get(key).push({lineId:p.lineId,operatorId:p.operatorId,...m,article,tableUrl:p.url});
}
// A direct article can confirm an existing Korean name even when the line
// article was unavailable. It cannot infer a new route association.
for(const a of articles.filter(a=>a.identityMatched)){
 const master=stations.get(a.stationId);if(!master||master.names.ja!==a.ja)continue;
 const key=a.stationId+'::'+a.ja;if(byIdentity.has(key))continue;
 if(titleKo(a)!==a.ko)continue;
 const routes=[...relations].filter(([,r])=>r.stops.some(s=>s.stationId===a.stationId)&&!scoped.routes[r.line.id]?.[a.stationId]);
 if(routes.length)byIdentity.set(key,routes.map(([lineId,r])=>({lineId,operatorId:r.line.operatorId,stationId:a.stationId,ja:a.ja,ko:a.ko,article:a,tableUrl:null})));
}
function patch(target,field,value,meta,file){
 const before=target[field]||'';if(before===value)return;
 const item={...meta,field,before,after:value,file};patches.push(item);
 if(apply){target[field]=value;touched.add(file)}
}
for(const [key,proofs] of byIdentity){
 const names=new Set(proofs.map(p=>p.ko)),readings=new Set(proofs.map(p=>p.article.reading).filter(Boolean));
 if(names.size!==1||readings.size>1){conflicts.push({key,reason:'SOURCE_DISAGREEMENT',names:[...names],readings:[...readings]});continue}
 const first=proofs[0],master=stations.get(first.stationId),canonical=master.names.ja===first.ja;
 const ko=first.ko,meta={stationId:first.stationId,ja:first.ja,operatorId:first.operatorId,lineIds:[...new Set(proofs.map(p=>p.lineId))],source:first.article.url,tableSource:first.tableUrl,sourceSha256:first.article.sha256,reason:first.article.proofKind==='EXACT_ROUTE_TABLE'?'나무위키 노선표의 일본어 역명·한국어 링크 표제 및 노선별 ID 대응; 개별 문서 재확인 필요':'나무위키 역 문서 제목·일본어 역명 및 노선별 정체성 일치'};
 if(canonical){
  // Retain independently reviewed conflicting Korean names for human review.
  if(master.koVerified&&master.names.ko!==ko&&master.koSourceUrl!==first.article.url){conflicts.push({key,reason:'EXISTING_REVIEWED_NAME_CONFLICT',current:master.names.ko,proposed:ko,source:meta.source});continue}
  const file=path.relative(root,shards.get(master.id)).replace(/\\/g,'/');
  patch(master.names,'ko',ko,{...meta,kind:'station'},file);
  if(readings.size===1&&!master.officialNameProof?.kana)patch(master.names,'kana',[...readings][0],{...meta,kind:'station',reason:'나무위키 역 문서의 정확한 일본어 역명에 연결된 루비 독음'},file);
 if(apply){const tableOnly=proofs.every(p=>p.article.proofKind==='EXACT_ROUTE_TABLE');master.nameRevalidation={date:'2026-11-01',ko:{status:tableOnly?'TABLE_MATCHED':'VERIFIED',source:meta.source,sha256:meta.sourceSha256},kana:{status:readings.size===1?'SUPPORTING_REFERENCE':'UNVERIFIED',source:readings.size===1?meta.source:null},ja:{status:'SUPPORTING_REFERENCE',source:meta.source},en:{status:'UNVERIFIED'},identity:'station-id + route-membership + exact Japanese source name'};master.koVerified=!tableOnly;master.koSource=tableOnly?'namuwiki-route-table':'namuwiki-article';master.koSourceFamily='namuwiki';master.koSourceMethod=tableOnly?'exact-route-table-and-station-link':'article-header-identity-match';master.koSourceUrl=meta.source;master.koVerifiedDate='2026-11-01';master.koReviewStatus=tableOnly?'ARTICLE_REVIEW_REQUIRED':'VERIFIED';master.koConfidence='HIGH';touched.add(file)}
 }
 for(const proof of proofs){
  const specific=scoped.routes[proof.lineId]?.[proof.stationId];
  if(specific){patch(specific,'ko',ko,{...meta,kind:'route-station',lineIds:[proof.lineId]},routeFile);if(readings.size===1)patch(specific,'kana',[...readings][0],{...meta,kind:'route-station',lineIds:[proof.lineId]},routeFile)}
 }
 // Update every stale route-scoped editor override of the same verified
 // Japanese identity, including routes reusing the physical station.
 for(const [lineId,values] of Object.entries(editor.stations||{})){
  if((scoped.routes[lineId]?.[first.stationId]?.ja||master.names.ja)!==first.ja)continue;
  if(!relations.get(lineId)?.stops.some(s=>s.stationId===first.stationId))continue;
  for(const overrideKey of [first.stationId,first.ja])if(typeof values[overrideKey]==='string')patch(values,overrideKey,ko,{...meta,kind:'editor-station',field:'ko',lineIds:[lineId]},'data/editor-overrides.json');
 }
}
if(apply){
 for(const file of touched){
  const full=path.join(root,file);
  if(file===routeFile)fs.writeFileSync(full,JSON.stringify(scoped,null,2)+'\n');
  else if(file==='data/editor-overrides.json')fs.writeFileSync(full,JSON.stringify(editor,null,2)+'\n');
  else{const rows=read(full).map(s=>stations.get(s.id));fs.writeFileSync(full,JSON.stringify(rows,null,2)+'\n')}
 }
 const seen=new Set(previous.patches.map(p=>[p.kind,p.stationId,p.field,p.lineIds.join('|'),p.before,p.after].join('::')));
 for(const p of patches){const k=[p.kind,p.stationId,p.field,p.lineIds.join('|'),p.before,p.after].join('::');if(!seen.has(k))previous.patches.push(p)}
 previous.conflicts=conflicts;previous.evidenceIdentities=byIdentity.size;
 for(const p of previous.patches)if(p.field==='ko'&&evidence.pages.some(page=>page.url===p.source)&&!articles.some(a=>a.identityMatched&&a.url===p.source))p.reason='나무위키 노선표의 일본어 역명·한국어 링크 표제 및 노선별 ID 대응; 개별 문서 재확인 필요';
 fs.writeFileSync(correctionFile,JSON.stringify(previous,null,2)+'\n');
}
console.log(JSON.stringify({apply,evidenceIdentities:byIdentity.size,patches:patches.length,byField:patches.reduce((a,p)=>(a[p.field]=(a[p.field]||0)+1,a),{}),conflicts:conflicts.length,touchedFiles:touched.size},null,2));
