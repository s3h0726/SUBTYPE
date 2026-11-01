#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {loadStations,loadOperators,discoverLineFolders,read}=require('./lib/line-workspaces');
const root=path.resolve(__dirname,'..'),date='2026-11-01',out=path.join(root,'reports/names/nationwide-20261101');
const {map:master}=loadStations(),scoped=read(path.join(root,'data/japan-route-station-names.json')).routes,editor=read(path.join(root,'data/editor-overrides.json'));
const evidence=read(path.join(root,'data/source-audit/japan-name-evidence-20261101.json'));
const articles=read(path.join(root,'data/source-audit/japan-station-articles-20261101.json')).articles;
const changes=read(path.join(root,'data/source-audit/japan-name-corrections-20261101.json'));
const articleById=new Map;
for(const a of articles.filter(a=>a.identityMatched)){const key=a.stationId+'::'+a.ja;if(!articleById.has(key))articleById.set(key,[]);articleById.get(key).push(a)}
const original=(id,ja,field,current)=>changes.patches.find(p=>p.stationId===id&&p.ja===ja&&p.field===field&&p.kind==='station')?.before??current;
const records=[],routes=[],operators=new Set,used=new Set,defects=[];
for(const folder of discoverLineFolders()){
 const line=read(path.join(folder,'line.json')),relations=read(path.join(folder,'stations.json')),seen=new Set;
 const route={id:line.id,operatorId:line.operatorId,ja:line.names.ja,retiredDuplicate:line.legacy?.retiredDuplicate===true,records:[]};routes.push(route);operators.add(line.operatorId);
 for(const rel of relations){
  const s=master.get(rel.stationId);if(!s){defects.push({kind:'UNKNOWN_STATION_ID',lineId:line.id,stationId:rel.stationId});continue}
  const specific=scoped[line.id]?.[s.id],names={...s.names,...specific};
  const ko=editor.stations?.[line.id]?.[s.id]??editor.stations?.[line.id]?.[names.ja]??names.ko;
  const proof=articleById.get(s.id+'::'+names.ja)||[],koreanMatch=proof.find(a=>a.title.replace(/ - 나무위키$/,'').replace(/역(?:\([^)]*\))?$/,'')===ko);
  const corrected=changes.patches.some(p=>p.stationId===s.id&&p.ja===names.ja&&(p.kind==='station'||p.lineIds.includes(line.id)));
  const issues=[];
  for(const [key,value] of Object.entries({ko,ja:names.ja,kana:names.kana,en:names.en}))if(!String(value||'').trim())issues.push('MISSING_'+key.toUpperCase());
  if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(ko))issues.push('JAPANESE_IN_KOREAN');
  if(/[가-힣]/.test(names.ja))issues.push('KOREAN_IN_JAPANESE');
  if(/[\u3400-\u9fff]/.test(names.kana))issues.push('KANJI_IN_READING');
  if(/[A-Za-z]/.test(ko)&&!/^Jビ?빌리지$/.test(ko))issues.push('KOREAN_LATIN_REVIEW');
  if(String(ko)!==String(ko).trim()||/[\u200b-\u200f\u2060\ufeff]/u.test(ko))issues.push('KOREAN_WHITESPACE_REVIEW');
  if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(names.en))issues.push('NON_LATIN_ENGLISH');
  if(/[a-zāēīōū][A-Z]/u.test(names.en))issues.push('ENGLISH_CAMELCASE_REVIEW');
  if((String(ko).match(/\(/g)||[]).length!==(String(ko).match(/\)/g)||[]).length)issues.push('KOREAN_PARENTHESES_REVIEW');
  if(seen.has(s.id)&&!line.loop)issues.push('REPEATED_ID_ON_NON_LOOP');seen.add(s.id);
  const record={key:['jp',line.operatorId,line.id,s.id,rel.order].join('::'),country:'jp',stationId:s.id,operatorId:line.operatorId,lineId:line.id,order:rel.order,originalKorean:original(s.id,names.ja,'ko',ko),correctedKorean:ko,japanese:names.ja,reading:names.kana||'',english:names.en||'',romaji:names.en||'',stationCode:rel.stationCode||'',verificationSource:koreanMatch?.url||null,verificationDate:koreanMatch?date:null,status:corrected?'CORRECTED':koreanMatch?'NEEDS_REVIEW':'UNVERIFIED',fieldStatus:{ko:koreanMatch?'VERIFIED':'UNVERIFIED',ja:koreanMatch?'SUPPORTING_REFERENCE':'UNVERIFIED',kana:proof.some(a=>a.reading===names.kana)?'SUPPORTING_REFERENCE':'UNVERIFIED',en:'UNVERIFIED',romaji:'UNVERIFIED',stationCode:rel.stationCodeSource?.verified?'LEGACY_CLAIM_NOT_RECHECKED':'UNVERIFIED',operator:'MEMBERSHIP_CHECKED',physicalLine:'MEMBERSHIP_CHECKED',identity:'ID_AND_ROUTE_CHECKED'},reason:corrected?'개별 역 문서에 근거한 필드별 수정; 공식 영문·역번호 재확인 필요':koreanMatch?'한국어·일본어 정체성 확인; 나머지 필드 재확인 필요':'접근 실패·불일치·미대응은 검증 완료로 간주하지 않음',issues};
  records.push(record);route.records.push(record);used.add(s.id);
 }
}
// Include all master records even if no playable line currently references them.
for(const s of master.values())if(!used.has(s.id))records.push({key:'jp::UNASSOCIATED::'+s.id,country:'jp',stationId:s.id,operatorId:null,lineId:null,originalKorean:original(s.id,s.names.ja,'ko',s.names.ko),correctedKorean:s.names.ko,japanese:s.names.ja,reading:s.names.kana,english:s.names.en,romaji:s.names.en,stationCode:null,verificationSource:null,verificationDate:null,status:'NEEDS_REVIEW',reason:'공유 역 원본에 있으나 노선 연결 없음',issues:['NO_LINE_ASSOCIATION']});
const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'js/disney-resort-line-data.js'),'utf8'),c);const disney=c.TRT_DISNEY_RESORT_ROUTE||c.window.TRT_DISNEY_RESORT_ROUTE;
operators.add(disney.operatorId);const special={id:disney.id,operatorId:disney.operatorId,ja:disney.line.ja,records:[]};routes.push(special);
disney.stations.forEach((s,index)=>{const r={key:['jp',disney.operatorId,disney.id,s.id,index].join('::'),country:'jp',stationId:s.id,operatorId:disney.operatorId,lineId:disney.id,order:index,originalKorean:s.ko,correctedKorean:s.ko,japanese:s.ja,reading:s.kana||'',english:s.romaji||s.en||'',romaji:s.romaji||s.en||'',stationCode:s.officialCode||'',verificationSource:null,verificationDate:null,status:'UNVERIFIED',reason:'수동 특수 노선; 공식 다국어 독립 대조 필요',issues:[]};records.push(r);special.records.push(r)});
const operations=[];
const resolve=(lineId,id)=>{const route=routes.find(r=>r.id===lineId);return route?.records.find(r=>r.stationId===id||r.stationId==='station-'+id)?.key||null};
const services=read(path.join(root,'data/services.json'));
for(const [lineId,patterns] of Object.entries(services.routes))for(const p of patterns)operations.push({source:'data/services.json',lineId,id:p.id,stationKeys:p.stops.map(id=>resolve(lineId,id)),rawStationIds:p.stops});
const tokyo=read(path.join(root,'data/tokyo-service-patterns.json'));
for(const p of tokyo.servicePatterns)operations.push({source:'data/tokyo-service-patterns.json',lineId:p.baseRouteId,id:p.id,stationKeys:p.stopStationIds.map(id=>resolve(p.baseRouteId,id)),rawStationIds:p.stopStationIds});
vm.runInNewContext(fs.readFileSync(path.join(root,'js/nationwide-service-catalog.js'),'utf8'),c);
for(const [code,line] of Object.entries(c.window.TRT_NATIONWIDE_SERVICE_CATALOG.lines))for(const p of line.patterns)for(const [segmentIndex,segment] of p.segments.entries()){
 const meta=c.window.TRT_NATIONWIDE_SERVICE_CATALOG.lines[segment.lineCode];
 const candidates=routes.filter(r=>r.id==='line-'+segment.lineCode||r.ja===meta?.ja);
 const route=candidates.find(r=>segment.stations.every(([ja])=>r.records.filter(s=>s.japanese===ja).length===1))||candidates[0];
 operations.push({source:'js/nationwide-service-catalog.js',catalogLine:code,lineId:route?.id||null,id:p.id,segmentIndex,stationKeys:segment.stations.map(([ja])=>{const match=route?.records.filter(s=>s.japanese===ja)||[];return match.length===1?match[0].key:null}),rawJapanese:segment.stations.map(s=>s[0]),stopFlags:segment.stations.map(s=>s[1])});
}
for(const journey of tokyo.serviceJourneys){const pattern=operations.find(p=>p.source==='data/tokyo-service-patterns.json'&&p.id===journey.servicePatternId);operations.push({source:'data/tokyo-service-patterns.json:serviceJourneys',lineId:journey.baseRouteId,id:journey.id,stationKeys:pattern?.stationKeys||[null],patternId:journey.servicePatternId})}
function routeSlice(routeId,start,end){const route=routes.find(r=>r.id===routeId),a=route?.records.findIndex(r=>r.japanese===start)??-1,b=route?.records.findIndex(r=>r.japanese===end)??-1;if(a<0||b<0)return[null];const list=route.records.slice(Math.min(a,b),Math.max(a,b)+1).map(r=>r.key);return a>b?list.reverse():list}
for(const service of read(path.join(root,'data/through-services.json')).services)for(const [direction,parts] of Object.entries(service.directionVariants||{})){
 if(!Array.isArray(parts))continue;
 parts.forEach((part,i)=>operations.push({source:'data/through-services.json',lineId:part.routeId,id:service.id,direction,segmentIndex:i,stationKeys:routeSlice(part.routeId,part.startStationJa,part.endStationJa)}));
}
vm.runInNewContext(fs.readFileSync(path.join(root,'js/famous-limited-express.js'),'utf8').replace(/^export /gm,'')+';globalThis.specs=FAMOUS_EXPRESS_SPECS;',c);
for(const spec of c.specs)for(const pattern of spec.patterns){
 const partRows=spec.parts.flatMap(part=>{const r=routes.find(r=>r.id===part.id);return r?.records||[]});
 operations.push({source:'js/famous-limited-express.js',lineId:spec.id,id:pattern.id,rawJapanese:pattern.stops,stationKeys:pattern.stops.map(ja=>{const found=partRows.filter(r=>r.japanese===ja);return found[0]?.key||null})});
}
for(const branch of tokyo.branches)operations.push({source:'data/tokyo-service-patterns.json:branches',lineId:branch.legacyRouteId,id:branch.id,stationKeys:branch.stationSequence.map(id=>resolve(branch.legacyRouteId,id)),rawStationIds:branch.stationSequence});
for(const r of records){const conflict=changes.conflicts.find(c=>c.key===r.stationId+'::'+r.japanese);if(conflict){r.status='SOURCE_CONFLICT';r.reason=conflict.reason}}
for(const r of records){const conflict=changes.mergeConflicts?.find(c=>c.key.startsWith(r.stationId+'.names.'));if(conflict){r.status='SOURCE_CONFLICT';r.sourceConflict=conflict;r.reason=JSON.stringify(conflict);}}
for(const r of records){
 const s=master.get(r.stationId);if(!s||s.names.ja!==r.japanese)continue;
 r.fieldStatus??={ko:'UNVERIFIED',ja:'UNVERIFIED',kana:'UNVERIFIED',en:'UNVERIFIED',romaji:'UNVERIFIED',stationCode:'UNVERIFIED',identity:'ID_AND_ROUTE_CHECKED'};
 r.fieldSources={ko:r.verificationSource};
 if(s.nameRevalidation?.ko?.status==='TABLE_MATCHED'&&s.names.ko===r.correctedKorean){r.fieldStatus.ko='TABLE_MATCHED';r.fieldSources.ko=s.nameRevalidation.ko.source;r.reason='노선표 대응 확인; 개별 문서 및 나머지 필드 재확인 필요'}
 for(const field of ['ja','kana','en'])if(s.officialNameProof?.[field]?.value===s.names[field]){r.fieldStatus[field]='VERIFIED';r.fieldSources[field]=s.officialNameProof[field].source}
 if(r.fieldStatus.en==='VERIFIED'){r.fieldStatus.romaji='VERIFIED';r.fieldSources.romaji=r.fieldSources.en}
 r.verificationSource=r.verificationSource||r.fieldSources.en||r.fieldSources.kana||r.fieldSources.ja||r.fieldSources.ko||null;
 if(r.verificationSource)r.verificationDate=date;
 if(r.sourceConflict)r.reason=JSON.stringify(r.sourceConflict);
}
const physicalIds=new Set(records.map(r=>r.stationId));
const summary={date,operators:operators.size,lineRecords:routes.length,activeLines:routes.filter(r=>!r.retiredDuplicate).length,stationRecords:records.length,uniqueStationIds:physicalIds.size,uniquePhysicalStations:'공유 station ID 기준; 실제 물리역 독립 실사는 미완료',masterStations:master.size,unassociatedMasterStations:[...master.keys()].filter(id=>!used.has(id)).length,operationSequences:operations.length,operationStationOccurrences:operations.reduce((n,p)=>n+p.stationKeys.length,0),unresolvedOperationOccurrences:operations.reduce((n,p)=>n+p.stationKeys.filter(k=>k===null).length,0),koreanCheckedRecords:records.filter(r=>r.fieldStatus?.ko==='VERIFIED').length,koreanCheckedUniqueIds:new Set(records.filter(r=>r.fieldStatus?.ko==='VERIFIED').map(r=>r.stationId)).size,fullyVerifiedRecords:records.filter(r=>r.status==='VERIFIED').length,unresolvedUniqueIds:physicalIds.size,statuses:records.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}),changes:changes.patches.reduce((a,p)=>(a[p.kind+':'+p.field]=(a[p.kind+':'+p.field]||0)+1,a),{}),sourceConflicts:changes.conflicts.length,sourceLinePages:evidence.pages.length,sourceArticleAttempts:articles.length,sourceArticleIdentityMatches:articles.filter(a=>a.identityMatched).length,structuralDefects:records.reduce((n,r)=>n+r.issues.length,0),defects};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'stations.jsonl'),records.map(r=>JSON.stringify(r)).join('\n')+'\n');
fs.writeFileSync(path.join(out,'operating-sequences.json'),JSON.stringify({schemaVersion:1,date,policy:'Every stop occurrence retained. Null keys expose ambiguous/missing route-specific matches; no names-only station merging.',sequences:operations})+'\n');
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const operatorRecords=[...loadOperators().values()].map(o=>({operatorId:o.id,names:o.names,status:'UNVERIFIED',legacyKoreanReference:o.sources?.koreanName||null}));
operatorRecords.push({operatorId:disney.operatorId,names:disney.operator,status:'UNVERIFIED'});
summary.operators=operatorRecords.length;
summary.auditDate='2026-11-02';
summary.namingSourceConflicts=changes.mergeConflicts?.filter(c=>c.key.includes('.names.')).length||0;
summary.sourceConflicts+=summary.namingSourceConflicts;
summary.usedOperators=operators.size;
summary.officialJapaneseRecords=records.filter(r=>r.fieldStatus?.ja==='VERIFIED').length;
summary.officialEnglishRecords=records.filter(r=>r.fieldStatus?.en==='VERIFIED').length;
summary.officialReadingRecords=records.filter(r=>r.fieldStatus?.kana==='VERIFIED').length;
summary.tableMatchedKoreanRecords=records.filter(r=>r.fieldStatus?.ko==='TABLE_MATCHED').length;
fs.writeFileSync(path.join(out,'operators-and-lines.json'),JSON.stringify({operators:operatorRecords,lines:routes.map(({records,...r})=>({...r,status:'UNVERIFIED'}))},null,2)+'\n');
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
