#!/usr/bin/env node
'use strict';
// Exhaustive, offline reconciliation of names and Namuwiki-source evidence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rel=p=>path.relative(root,p).replace(/\\/g,'/');
function files(dir,name){const result=[];function go(folder){if(!fs.existsSync(folder))return;for(const item of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,item.name);if(item.isDirectory())go(p);else if(item.name===name)result.push(rel(p));}}go(path.join(root,dir));return result.sort();}
function write(p,data){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),JSON.stringify(data,null,2)+'\n');}
const manifest=read('data/japan-namuwiki-verified-batch-20261031.json');
const batchById=new Map([...manifest.lines.map(x=>['line:'+x.id,x]),...manifest.operators.map(x=>['operator:'+x.id,x])]);
const records=[],total={line:0,station:0,operator:0,routeSpecificStation:0},statuses={},issueCounts={};
const isNamuUrl=u=>/^https:\/\/(?:[a-z]+\.)?(?:namu\.wiki|namu\.moe)\/w\//i.test(String(u||''));
const isLatin=txt=>/^[\p{Script=Latin}0-9\s.,·()/'"&+:\-–〜~]*$/u.test(txt);
const hasKanjikana=txt=>/[\u3040-\u30ff\u3400-\u9fff]/u.test(txt);
const warn=(record,code)=>{record.issues.push(code);issueCounts[code]=(issueCounts[code]||0)+1;};
function add(kind,id,source,names,file,extra={}){
 total[kind]++;
 const ja=String(names?.ja||''),ko=String(names?.ko||''),en=String(names?.en||'');
 const fromBatch=batchById.get(kind+':'+id),proof=kind==='station'?source?.namuwikiBatchProof:null;
 const url=kind==='station'?source?.koSourceUrl:kind==='routeSpecificStation'?source?.namuwikiUrl:(source?.sources?.koreanName?.url||'');
 const meta=kind==='station'?{verified:source?.koVerified,method:source?.koSourceMethod}:kind==='routeSpecificStation'?{verified:source?.namuwikiVerified,method:'manual'}:source?.sources?.koreanName;
 const batchProofValid=kind==='station'?
   (proof&&proof.stationJa===ja&&proof.stationKo===ko&&isNamuUrl(proof.source)&&url===proof.source):
   kind==='routeSpecificStation'?
   (source?.namuwikiVerified===true&&isNamuUrl(url)&&source?.proofKind==='route-scoped-Japanese-name-and-Korean-station-list'):
   (fromBatch&&fromBatch.names?.ko===ko&&fromBatch.wikiUrl===url&&isNamuUrl(url)&&meta?.verified===true);
 const claimVerified=meta?.verified===true;
 const status=batchProofValid?'NAMUWIKI_BATCH_CROSSCHECKED':claimVerified?'LEGACY_CLAIM_NOT_RECHECKED':'SOURCE_REVIEW_REQUIRED';
 statuses[status]=(statuses[status]||0)+1;
 const item={kind,id,ja,ko,en,file,status,issues:[],...extra};
 if(batchProofValid)item.namuwikiEvidence={url:kind==='station'?proof.source:url,scope:kind==='station'?proof.routeId:kind==='routeSpecificStation'?extra.routeId:fromBatch.id};
 if(!ja)warn(item,'EMPTY_JA');
 if(!ko)warn(item,'EMPTY_KO');
 if(!en)warn(item,'EMPTY_EN');
 if(hasKanjikana(ko))warn(item,'JAPANESE_CHARACTERS_IN_KO');
 if(!isLatin(en))warn(item,'EN_INCLUDES_NON_LATIN_OR_SYMBOLS');
 if(/[a-zāēīōū][A-Z]/u.test(en))warn(item,'SUSPICIOUS_ROMAJI_CAMELCASE');
 if(/온선|게이세이|도죠|니이쿠라시키|카고시마츄오/.test(ko))warn(item,'PRIORITY_KOREAN_POLICY_REVIEW');
 if(claimVerified&&!isNamuUrl(url))warn(item,'CLAIM_WITHOUT_NAMUWIKI_ARTICLE_URL');
 if(claimVerified&&!batchProofValid)warn(item,'LEGACY_CITATION_RECHECK_REQUIRED');
 records.push(item);return item;
}
const ops=new Map,lines=new Map,stations=new Map;
for(const file of files('data/operators','operator.json')){const op=read(file);if(ops.has(op.id))throw Error('DUPLICATE_OPERATOR:'+op.id);ops.set(op.id,op);add('operator',op.id,op,op.names,file);}
for(const file of files('data/lines','line.json')){const line=read(file);if(lines.has(line.id))throw Error('DUPLICATE_LINE:'+line.id);lines.set(line.id,line);add('line',line.id,line,line.names,file,{operatorId:line.operatorId});}
const stationFiles=fs.readdirSync(path.join(root,'data/shared-stations')).filter(f=>/^stations-\d+\.json$/.test(f)).sort();
for(const file of stationFiles){
 const p='data/shared-stations/'+file;
 for(const st of read(p)){if(stations.has(st.id))throw Error('DUPLICATE_STATION:'+st.id);stations.set(st.id,st);add('station',st.id,st,st.names,p,{kana:st.names?.kana||'',sourceAccess:st.sourceAccess||''});}
}
const routeNames=read('data/japan-route-station-names.json').routes||{};
for(const [routeId,stops] of Object.entries(routeNames))for(const [stationId,names] of Object.entries(stops)){
 const item=add('routeSpecificStation',routeId+'::'+stationId,names,names,'data/japan-route-station-names.json',{routeId,stationId});
 if(!lines.has(routeId))warn(item,'ROUTE_SPECIFIC_LINE_NOT_FOUND');
 if(!stations.has(stationId))warn(item,'ROUTE_SPECIFIC_STATION_NOT_FOUND');
}
const editor=read('data/editor-overrides.json'),editorConflicts=[];
for(const [id,value] of Object.entries(editor.lines||{})){
 const line=lines.get(id),canonical=line?.names?.ko;
 if(line&&value?.ko&&value.ko!==canonical)editorConflicts.push({type:'line',id,source:canonical,display:value.ko,decision:'retain operator-context short form until explicit article title verified'});
}
const disney=fs.readFileSync(path.join(root,'js/disney-resort-line-data.js'),'utf8'),ctx={};vm.runInNewContext(disney,ctx);
const extra=ctx.TRT_DISNEY_RESORT_ROUTE;
add('line',extra.id,{},extra.line,'js/disney-resort-line-data.js',{operatorId:extra.operatorId,special:true});
add('operator',extra.operatorId,{},extra.operator,'js/disney-resort-line-data.js',{special:true});
for(const s of extra.stations||[])add('routeSpecificStation',extra.id+'::'+s.id,{},s,'js/disney-resort-line-data.js',{special:true});
const summary={total,allNameRecords:records.length,statuses,issueCounts,
 sourceKnown:statuses.NAMUWIKI_BATCH_CROSSCHECKED||0,
 previousVerificationClaimsNotYetRechecked:statuses.LEGACY_CLAIM_NOT_RECHECKED||0,
 sourceReviewRequired:statuses.SOURCE_REVIEW_REQUIRED||0,
 editorDisplayExceptions:editorConflicts.length,
 coveragePercent:Number(((statuses.NAMUWIKI_BATCH_CROSSCHECKED||0)/Math.max(1,records.length)*100).toFixed(2)),
 completeNamuwikiVerification:false};
const report={schemaVersion:1,generatedAt:new Date().toISOString(),policy:{
 canonicalKorean:'namuwiki exact article title or Japanese-name matched station list',
 originalJapanese:'retain official identity and route-specific Japanese variant',
 english:'independent naming; romaji requires official confirmation',
 notVerifiedMeans:'cannot claim every JA, KO and EN name has been checked against source pages',
 noGlobalPhoneticReplacement:true},summary,editorConflicts,records};
write('reports/names/NAMUWIKI_FULL_JAPAN_20261031.json',report);
const csv=(v)=>'"'+String(v??'').replaceAll('"','""')+'"';
const cols=['kind','id','ja','ko','en','status','file','issues'];
const rows=records.filter(r=>r.status!=='NAMUWIKI_BATCH_CROSSCHECKED'||r.issues.length).map(r=>cols.map(k=>csv(k==='issues'?r.issues.join('|'):r[k])).join(','));
fs.writeFileSync(path.join(root,'reports/names/NAMUWIKI_FULL_REVIEW_QUEUE.csv'),[cols.join(','),...rows].join('\n')+'\n');
fs.writeFileSync(path.join(root,'reports/names/NAMUWIKI_FULL_RECHECK_SUMMARY.md'),
 '# 일본 철도 나무위키 재검증: 전체 출처 감사\n\n'+
 '대상: 공유 역 '+total.station+'개, 노선 '+total.line+'개(디즈니 포함), 운영사 '+total.operator+'개(디즈니 포함), 노선별 별도 역명 '+total.routeSpecificStation+'개.\n\n'+
 '| 판정 | 건수 |\n|---|---:|\n'+
 Object.entries(statuses).map(([k,v])=>'| '+k+' | '+v+' |').join('\n')+
 '\n\n개별 문서나 일본어 역명을 함께 확인하지 못한 항목은 자동 음역을 그대로 검증 완료로 간주하지 않습니다.\n'+
 '한글 역명 나무위키 기준: 장음 원칙적 미표기, え단 + い의 에이 유지, 개별 표제어 우선.\n'+
 '표기 표준화를 이유로 역 ID, 역 순서, 선로 좌표, 운행계통을 바꾸지 않습니다.\n');
console.log(JSON.stringify({status:'AUDITED_REVIEW_REQUIRED',...summary},null,2));
if(process.argv.includes('--check')&&(issueCounts.EMPTY_JA||issueCounts.EMPTY_KO||issueCounts.EMPTY_EN||issueCounts.JAPANESE_CHARACTERS_IN_KO||issueCounts.EN_INCLUDES_NON_LATIN_OR_SYMBOLS))process.exitCode=1;
