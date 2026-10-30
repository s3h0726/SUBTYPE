#!/usr/bin/env node
'use strict';
// Audits the SOURCE OF TRUTH, not the generated bundles. No network or NLP
// guesses are used to certify a foreign-language name.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),data=path.join(root,'data');
const fixSafe=process.argv.includes('--fix-safe');
const check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const relative=p=>path.relative(root,p).replace(/\\/g,'/');
function write(p,value){const abs=path.join(root,p);fs.mkdirSync(path.dirname(abs),{recursive:true});const temp=abs+'.name-audit-tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n');fs.renameSync(temp,abs);}
function filesUnder(dir,fileName){const out=[];function walk(directory){if(!fs.existsSync(directory))return;for(const x of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,x.name);if(x.isDirectory())walk(full);else if(!fileName||x.name===fileName)out.push(full);}}walk(path.join(root,dir));return out.sort();}
const issues=[],fixes=[],metrics={};
const sample=(o)=>({id:o.id,ja:o.ja,ko:o.ko,en:o.en,file:o.file});
function issue(severity,code,kind,item,explanation){
  issues.push({severity,code,kind,...sample(item),explanation});
}
function inc(key){metrics[key]=(metrics[key]||0)+1;}
const jp=/[\u3040-\u30ff\u3400-\u9fff]/u,kr=/[\uac00-\ud7af]/u;
const bad=/\b(?:undefined|null|MISSING_KOREAN_NAME|MISSING|unknown|untranslated|N\/A)\b/i;
function checkNames(kind,id,names,file){
  inc(kind+'Total');
  const item={id,ja:String(names?.ja||''),ko:String(names?.ko||''),en:String(names?.en||''),file};
  for(const lang of ['ja','en','ko']){
    const v=item[lang];const field=kind+lang.toUpperCase();
    if(!v.trim())issue('error','MISSING_'+lang.toUpperCase(),kind,item,lang+' name is empty');
    else inc(field+'Present');
    if(v!==v.trim()||v!==v.normalize('NFC')||/[\u200b-\u200f\u2060\ufeff]/u.test(v))
      issue('review','NORMALIZATION_'+lang.toUpperCase(),kind,item,'Whitespace, Unicode normalization or zero-width character');
    if(bad.test(v))issue('error','PLACEHOLDER_'+lang.toUpperCase(),kind,item,'Placeholder in published name');
  }
  if(kr.test(item.ja))issue('error','JP_HAS_HANGUL',kind,item,'Japanese field contains Hangul');
  if(jp.test(item.en)||kr.test(item.en))issue('error','EN_NON_LATIN',kind,item,'English field contains CJK or Hangul');
  if(jp.test(item.ko))issue('error','KO_HAS_JAPANESE',kind,item,'Korean field contains Japanese characters');
  if(item.ko&&/^[\p{Script=Latin}\s0-9.()·'-]+$/u.test(item.ko)&&!kr.test(item.ko))
    issue('review','KO_NON_HANGUL_ONLY',kind,item,'Korean field contains no Hangul (could be accepted abbreviation)');
  if(item.en&&/[a-zāēīōū][A-Z]/u.test(item.en))
    issue('review','EN_INTERNAL_CAMEL_CASE',kind,item,'Mixed English/romaji capitalization; confirm against official English');
  if(item.en&&/\b[a-zāēīōū]+(?:gō)?sen\b/iu.test(item.en)&&!/\bline\b/i.test(item.en)&&kind==='line')
    issue('review','EN_ROMAJI_LINE_SUFFIX',kind,item,'Line name is transliterated as -sen; check official English line name');
  if(kind==='station'&&item.ja.includes('温泉')&&item.ko.includes('온선'))
    issue('error','KO_ONSEN_TYPO',kind,item,'温泉 온せん must not be transcribed 온선; reviewed 온센 is appropriate');
  return item;
}
const stationFiles=filesUnder('data/shared-stations').filter(p=>/^stations-\d+\.json$/.test(path.basename(p)));
const stationIds=new Set(),stations=new Map();
let corrected=0,oldNameCount=0;
for(const abs of stationFiles){
  const rel=relative(abs),rows=read(rel);let dirty=false;
  for(const s of rows){
    if(stationIds.has(s.id))issue('error','DUPLICATE_STATION_ID','station',{id:s.id,ja:s.names?.ja,ko:s.names?.ko,en:s.names?.en,file:rel},'Duplicate shared station identity');
    stationIds.add(s.id);stations.set(s.id,s);
    if(s.names?.ja?.includes('温泉')&&s.names?.ko?.includes('온선')){
      oldNameCount++;
      if(fixSafe){
        const previous=s.names.ko;
        s.names.ko=previous.replaceAll('온선','온센');
        fixes.push({id:s.id,ja:s.names.ja,before:previous,after:s.names.ko,file:rel,method:'safe onsen transcription',independentKoreanVerification:false});
        corrected++;dirty=true;
      }
    }
    checkNames('station',s.id,s.names,rel);
    if(/[\u3400-\u9fff]/u.test(String(s.names?.kana||'')))issue('error','KANA_HAS_KANJI','station',{id:s.id,...s.names,file:rel},'Kana reading contains unresolved kanji from dictionary conversion');
    if(s.names?.kana)inc('stationKanaPresent');
    if(s.koVerified===true)inc('stationKoreanSourceVerified');
    else inc('stationKoreanUnverified');
    if(s.sources?.name==='dictionary-transliteration')inc('stationDictionaryTransliteration');
  }
  if(dirty)write(rel,rows);
}
const operators=new Map(),operatorFiles=filesUnder('data/operators','operator.json');
for(const abs of operatorFiles){
  const rel=relative(abs),op=read(rel);
  if(operators.has(op.id))issue('error','DUPLICATE_OPERATOR_ID','operator',{id:op.id,file:rel},'Duplicate operating company identity');
  operators.set(op.id,op);checkNames('operator',op.id,op.names,rel);
  if(op.sources?.koreanName?.verified===true)inc('operatorKoreanSourceVerified');
  else inc('operatorKoreanUnverified');
}
const lines=new Map(),lineFiles=filesUnder('data/lines','line.json'),lineStationIds=new Map();
for(const abs of lineFiles){
  const rel=relative(abs),line=read(rel),relFile=relative(path.join(path.dirname(abs),'stations.json'));
  if(lines.has(line.id))issue('error','DUPLICATE_LINE_ID','line',{id:line.id,file:rel},'Duplicate line identity');
  lines.set(line.id,line);checkNames('line',line.id,line.names,rel);
  if(!operators.has(line.operatorId))issue('error','LINE_OPERATOR_MISSING','line',{id:line.id,...line.names,file:rel},'Unknown operatorId '+line.operatorId);
  if(line.sources?.koreanName?.verified===true)inc('lineKoreanSourceVerified');
  else inc('lineKoreanUnverified');
  if(!fs.existsSync(path.join(root,relFile))){
    issue('error','LINE_STATIONS_MISSING','line',{id:line.id,...line.names,file:rel},'Missing stations.json');
    continue;
  }
  const rels=read(relFile),ids=new Set();
  for(const s of rels){ids.add(s.stationId);if(!stations.has(s.stationId))issue('error','UNKNOWN_STATION_ID','line',{id:line.id,...line.names,file:relFile},'Unknown referenced station '+s.stationId);}
  lineStationIds.set(line.id,ids);
}
const routeOverrides=read('data/japan-route-station-names.json').routes||{};
for(const [id,stops] of Object.entries(routeOverrides)){
  if(!lines.has(id)){issue('review','ROUTE_SPECIFIC_NAME_ORPHAN','line',{id,file:'data/japan-route-station-names.json'},'Line not present in source workspaces');continue;}
  for(const [stopId,names] of Object.entries(stops)){
    if(!lineStationIds.get(id)?.has(stopId))issue('review','ROUTE_SPECIFIC_STATION_ORPHAN','station',{id:id+'::'+stopId,...names,file:'data/japan-route-station-names.json'},'Station ID absent from named line');
    checkNames('routeSpecificStation',id+'::'+stopId,names,'data/japan-route-station-names.json');
  }
}
const editor=read('data/editor-overrides.json');
const overrideSummary={lines:0,operators:0,stations:0};
for(const [id,edit] of Object.entries(editor.lines||{})){
  overrideSummary.lines++;
  if(!lines.has(id)&&id!=='jp-disney-resort-line')issue('review','EDITOR_LINE_ORPHAN','line',{id,ko:edit.ko,file:'data/editor-overrides.json'},'Potential stale line-name override');
}
for(const [id,value] of Object.entries(editor.operators||{})){
  overrideSummary.operators++;
  if(!operators.has(id))issue('review','EDITOR_OPERATOR_ORPHAN','operator',{id,ko:value,file:'data/editor-overrides.json'},'Potential stale operator-name override');
}
for(const [id,values] of Object.entries(editor.stations||{})){
  overrideSummary.stations+=Object.keys(values||{}).length;
  if(!lines.has(id)&&id!=='jp-disney-resort-line')issue('review','EDITOR_STATION_ROUTE_ORPHAN','station',{id,file:'data/editor-overrides.json'},'Potential stale station override route key');
}
const disneyFile='js/disney-resort-line-data.js';
const disney=fs.readFileSync(path.join(root,disneyFile),'utf8');
if(!disney.includes("id:'jp-disney-resort-line'"))issue('error','DISNEY_MISSING','line',{id:'jp-disney-resort-line',file:disneyFile},'Manually maintained Disney line missing');
else {
  const vm=require('node:vm'),ctx={};vm.runInNewContext(disney,ctx);
  const r=ctx.TRT_DISNEY_RESORT_ROUTE;
  checkNames('line',r.id,r.line,disneyFile);
  checkNames('operator',r.operatorId,r.operator,disneyFile);
  r.stations.forEach(s=>checkNames('routeSpecificStation',r.id+'::'+s.id,{ja:s.ja,ko:s.ko,en:s.en},disneyFile));
}
const byCode={},bySeverity={},byKind={};
for(const i of issues){byCode[i.code]=(byCode[i.code]||0)+1;bySeverity[i.severity]=(bySeverity[i.severity]||0)+1;byKind[i.kind]=(byKind[i.kind]||0)+1;}
const summary={scope:'Japanese canonical + route-specific + Disney (not KR/HK)',operatorFiles:operatorFiles.length,lineFiles:lineFiles.length,stationFiles:stationFiles.length,uniqueStations:stations.size,routeOverrides:Object.values(routeOverrides).reduce((n,x)=>n+Object.keys(x).length,0),editorOverrides:overrideSummary,sourceMetrics:metrics,issueCount:issues.length,bySeverity,byKind,byCode,fixableOnsenBeforeRun:oldNameCount,fixesApplied:corrected};
const report={schemaVersion:1,generatedAt:new Date().toISOString(),verificationLimit:'Automated cross-field checks are NOT a certification of official English/Korean names. MLIT N02 is the baseline for Japanese identifiers; official operators and Korean editorial sources require individual review.',safeFixPolicy:'Only exact source Japanese 温泉 with mistaken Korean 온선 is repaired to 온센; all ambiguous phonetics remain review-only.',summary,fixes,issues};
const out='reports/names';
if(!check){
  write(out+'/japan-trilingual-audit.json',report);
  const csvEscape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  const cols=['severity','code','kind','id','ja','en','ko','file','explanation'];
  fs.writeFileSync(path.join(root,out,'japan-trilingual-issues.csv'),[cols.join(','),...issues.map(i=>cols.map(c=>csvEscape(i[c])).join(','))].join('\n')+'\n');
  const heading='# 일본 철도 일본어·영어·한국어 명칭 전수 자동검사\n\n';
  const intro='원본 범위: 공유 역명 '+summary.uniqueStations+'개, 노선 파일 '+summary.lineFiles+'개, 운영사 '+summary.operatorFiles+'개, 노선별 별도 역명 '+summary.routeOverrides+'개. 디즈니 리조트라인 별도 포함.\n\n';
  const table='| 검사항목 | 건수 |\n|---|---:|\n'+Object.entries(byCode).sort((a,b)=>b[1]-a[1]).map(([code,n])=>'| '+code+' | '+n+' |').join('\n')+'\n\n';
  const warning='**주의:** 자동검사 통과는 공식 검증 완료를 의미하지 않습니다. 출처 미확인 이름은 검증되지 않은 것으로 유지됩니다. 일본어 원문은 MLIT N02 및 운영사 공식 자료, 영어는 운영사 공식 영문 역명판/안내, 한국어는 확정된 자료와 대조가 필요합니다. 같은 이름을 사용하는 서로 다른 역과 노선별 공식 별칭을 일괄 통일하지 마세요.\n\n';
  const preview='## 우선 확인할 항목 (최대 35건)\n\n'+issues.slice(0,35).map(i=>'- '+i.code+' / '+i.id+' / '+(i.ja||'')+' / '+(i.ko||'')+' / '+i.file).join('\n')+'\n';
  fs.writeFileSync(path.join(root,out,'README.md'),heading+intro+'- 오류: '+(bySeverity.error||0)+'건\n- 재검토 후보: '+(bySeverity.review||0)+'건\n- 확실한 표기 교정: '+fixes.length+'건\n\n'+table+warning+preview);
}
console.log(JSON.stringify({status:'AUDITED',...summary},null,2));
if(check&&(oldNameCount||(byCode.EN_NON_LATIN||0))){console.error('FAIL: Source still has onsen or non-Latin English entries');process.exitCode=1;}
