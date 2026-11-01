#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/names/nationwide-20261101');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const summary=read('reports/names/nationwide-20261101/summary.json'),changes=read('data/source-audit/japan-name-corrections-20261101.json'),tests=read('reports/names/nationwide-20261101/tests.json'),browser=read('reports/names/nationwide-20261101/browser.json');
function csv(input){const rows=[];let row=[],value='',quote=false;for(let i=0;i<input.length;i++){const c=input[i];if(quote){if(c==='"'&&input[i+1]==='"'){value+='"';i++}else if(c==='"')quote=false;else value+=c}else if(c==='"')quote=true;else if(c===','){row.push(value);value=''}else if(c==='\n'){row.push(value);rows.push(row);row=[];value=''}else if(c!=='\r'&&c!=='\uFEFF')value+=c}return rows}
const tablePath='reports/korean-names/stations-by-line.csv',before=csv(cp.execFileSync('git',['show',changes.rebasedOn+':'+tablePath],{cwd:root,maxBuffer:64000000}).toString()),after=csv(fs.readFileSync(path.join(root,tablePath),'utf8'));
const names=new Map(before.slice(1).map(r=>[[r[2],r[4],r[7]].join('::'),r[6]]));
const editorChanged=after.slice(1).filter(r=>/^(line-|shinkansen-|jp-)/.test(r[2])&&names.has([r[2],r[4],r[7]].join('::'))&&names.get([r[2],r[4],r[7]].join('::'))!==r[6]).length;
const registryLog=fs.readFileSync(path.join(out,'tests/registry.log'),'utf8');const targetCount=JSON.parse(registryLog.trim().split('\n').find(l=>l.startsWith('{'))).routeSpecificTypingTargets;
const count=field=>new Set(changes.patches.filter(p=>p.field===field).map(p=>p.kind+'::'+p.stationId+'::'+(p.kind==='station'?'':p.lineIds.join('|')))).size;
const result={...summary,correctionCounts:{korean:count('ko'),japanese:count('ja'),reading:count('kana'),english:count('en'),operatorsAndLines:0,transferConflictsResolved:0,editorKoreanRowsChanged:editorChanged,gameplayTypingOccurrencesChecked:targetCount,stationIdsChanged:0,coordinatesChanged:0},regressions:{passed:tests.passed,failed:tests.failed,browserPassed:browser.passed,browserFailed:browser.failed},implementationComplete:true,nationwideIndependentNameVerificationComplete:false};
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
const items=[['일본 운영사 인벤토리',summary.operators],['노선 원본·특수 노선',summary.lineRecords+' (운영 대상 '+summary.activeLines+')'],['역-노선 및 미연결 원본 기록',summary.stationRecords],['운행 정차 기록',summary.operationStationOccurrences],['고유 물리역', '독립 확정 미완료; 공유 역 ID '+summary.uniqueStationIds],['한국어 역명 수정',count('ko')],['일본어 역명 수정',count('ja')],['영문 수정',count('en')],['일본어 독음 수정',count('kana')],['운영사·노선명 수정',0],['환승 명칭 충돌 해결',0],['편집표 한글명 변경 행',editorChanged],['교정 역명의 타이핑 대상 검사',targetCount],['모든 필드 독립 검증 완료',0],['추가 필드 검증이 필요한 고유 ID',summary.unresolvedUniqueIds],['한국어 개별 문서 대응',summary.koreanCheckedRecords+'행 / '+summary.koreanCheckedUniqueIds+' ID'],['회귀 검사 명령',tests.passed+' PASS / '+tests.failed+' FAIL'],['대표 브라우저 검사',browser.passed+' PASS / '+browser.failed+' FAIL']];
const esc=s=>String(s).replaceAll('|','\\|');
const examples=['station-9951102','station-9921320','station-9990710','station-1190324'].map(id=>changes.patches.find(p=>p.stationId===id&&p.field===(id==='station-1190324'?'en':'ko'))).filter(Boolean);
const text='# 일본 전국 역명 감사·수정 결과\n\n'+
 '2026-11-01 수집 근거를 2026-11-02 최신 main `'+changes.rebasedOn+'`에 병합했습니다. **전국 인벤토리와 대량 수정 구현은 완료했지만, 모든 역의 모든 이름 필드를 독립 검증한 것은 아닙니다.**\n\n'+
 '| 항목 | 결과 |\n|---|---:|\n'+items.map(([a,b])=>'| '+a+' | '+b+' |').join('\n')+'\n\n'+
 '한국어는 나무위키 역 문서의 일본어 표제·한국어 제목 일치 또는 노선표의 정확한 일본어·한국어 링크 대응을 사용했습니다. 노선표만 일치한 경우 TABLE_MATCHED로 구분했습니다. 공식 영문·독음은 JR큐슈, JR동일본, 아이치환상철도와 JR서일본 공식 역명 자료에 한해 적용했습니다. 자동 장모음 축약과 전역 자음 치환은 하지 않았습니다.\n\n'+
 '| 운영사 ID | 노선 ID | 수정 전 | 수정 후 | 근거 |\n|---|---|---|---|---|\n'+examples.map(p=>'| '+[p.operatorId,p.lineIds.join(', '),p.before,p.after,'[출처]('+p.source+')'].map(esc).join(' | ')+' |').join('\n')+'\n\n'+
 '미해결 출처 충돌:\n\n'+(changes.mergeConflicts||[]).filter(c=>c.key.includes('.names.')).map(c=>'- `'+c.key+'`: 공식 예약 자료 `'+c.batch+'` / 최신 main `'+c.current+'`. 최신 값을 보존하고 SOURCE_CONFLICT로 표시했습니다.').join('\n')+'\n\n'+
 '나무위키 요청 제한(429)으로 확인하지 못한 문서는 완료로 표시하지 않았습니다. 미연결 공유 역 '+summary.unassociatedMasterStations+'개는 삭제하지 않고 이력 검토 대상으로 남겼습니다. 운행계통의 '+summary.unresolvedOperationOccurrences+'개 정차 발생은 정규화 키의 대응을 확정하지 못해 null로 보존했으며, 게임의 실제 정차 순서나 선형을 수정하지 않았습니다.\n\n'+
 '기존 회귀 검사 실패:\n\n'+tests.knownFailures.map(t=>'- `'+t.name+'`: '+t.classification+' ([로그]('+t.log+')).').join('\n')+'\n\n'+
 '대표 브라우저 검사는 8회 완주와 오카자키 환승 및 `오카자키 → 무츠나` 실제 합성 IME 입력 이동을 포함합니다. 전국 역을 개별 브라우저 검사했다고 주장하지 않습니다. 역 ID·공유 좌표·선로 형상·다른 나라 원본·로그인·랭킹 키는 변경하지 않았습니다.\n\n'+
 '재생성: `node tools/build-japan-name-assets.cjs`. 전체 감사: `node tools/audit-japan-station-registry.cjs`. 회귀: `node tools/test-japan-name-regressions.cjs`. 근거는 `data/source-audit/japan-*20261101.json`, 전수 기록은 `stations.jsonl`, 계통별 모든 정차 발생은 `operating-sequences.json`에 있습니다.\n';
fs.writeFileSync(path.join(out,'README.md'),text);console.log(JSON.stringify(result.correctionCounts));
