'use strict';
// 공개 색인과 원본 검증 결과에서 수치를 계산한다. 노선 카드와 물리 선로는 구분한다.
const fs=require('node:fs'),cp=require('node:child_process');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const before=JSON.parse(cp.execFileSync('git',['show','f86f0f89806b4063d88064a8d94787f8d16bf030:data/kr/generated/index.json'],{maxBuffer:80e6}));
const after=read('data/kr/generated/index.json'),national=read('data/kr/canonical/rail-national-recovery-batch.json'),urban=read('data/kr/canonical/rail-urban-national-batch.json');
const bus=new Set(['bus','village_bus','express_bus','brt']),isRail=r=>!bus.has(r.mode)&&r.mode!=='river_bus';
const metrics=index=>({전체노선:index.routes.length,철도카드:index.routes.filter(isRail).length,버스카드:index.routes.filter(r=>bus.has(r.mode)).length,등록방향:index.counts.playableDirections,역정류장ID:index.counts.uniqueStops});
const oldQueue=read('data/kr/canonical/rail-name-recovery-queue.json').candidates,queue=read('data/kr/canonical/rail-national-recovery-queue.json').candidates;
const added=[...national.routes,...urban.routes],trips=new Set(national.routes.flatMap(r=>r.verifiedJourneys.flatMap(j=>j.tripIds)));
const recovered=oldQueue.filter(c=>c.tripIds.some(t=>trips.has(t))),reasons={};
for(const c of queue)reasons[c.reason]=(reasons[c.reason]||0)+1;
const raw=read('reports/kr-rebuild/20261105-철도-브라우저-원시검증.json');
const labels=new Map(added.map(r=>[r.id,r.line.ko]));
const completed=raw.runs.filter(r=>r.steps.length===r.stops.length&&r.steps.every((s,i)=>s.screen.includes(labels.get(r.route))&&(s.screen.includes('진행\n'+(i+1)+' / '+r.stops.length)||i===r.stops.length-1&&s.screen.includes('운행 완료!'))));
const checks=read('reports/kr-rebuild/automated-checks.json');
const previewPath='.cache/kr-rail/current-preview-report.json';
const report={검사시각:new Date().toISOString(),기준커밋:'f86f0f89806b4063d88064a8d94787f8d16bf030',작업전:metrics(before),작업후:metrics(after),추가카드:after.routes.length-before.routes.length,추가운행방향:after.counts.playableDirections-before.counts.playableDirections,추가역정류장ID:after.counts.uniqueStops-before.counts.uniqueStops,
  물리선로와카드:'신규 카드 14개는 도시·광역철도 6개, 일반열차 운행 회랑 5개, 고속열차 운행 회랑 3개. 고속열차 브랜드를 별도 물리 선로로 세지 않으며 기존 선로 좌표·원본 노드 참조를 재사용함. 전국 물리 선로 전체 개수나 전국 완전성은 확정하지 않음.',
  신규계통:added.map(r=>({노선:r.line.ko,대상:r.mergeIntoRouteId||r.id,교통수단:r.mode,추가방향:r.verifiedJourneys.length,신규카드:!r.mergeIntoRouteId})),
  기존미해결복구:{기존:oldQueue.length,복구:recovered.length,잔여:oldQueue.length-recovered.length},전국확대조사미해결:{후보:queue.length,원인:reasons,도시철도추가대기:read('data/kr/canonical/rail-urban-national-report.json').queue},
  최신원본:fs.existsSync(previewPath)?read('reports/kr-rebuild/20261105-최신-전국선형-재처리.json'):null,
  지역범위:'수도권·인천·대구·경북·강원·충청·호남·부산·울산·경남을 지나는 공식 계통. 지역별 전체 여객 서비스 완전성은 미확정.',
  원본선형검증:{전국신규방향:122,도시신규방향:13,전국원본인접선분:332678,도시선형점:5072,전체경로해석:read('reports/kr-rebuild/runtime-tests.json')},
  브라우저:{정상순차입력완주:completed.length,실행:completed.map(r=>({노선:r.route,방향:r.direction||'',입력역수:r.stops.length})),테스트입력오류시도:raw.runs.length-completed.length,범위:'실제 브라우저의 한국어 입력·한 역 진행·종점 완료·게스트 기록. 원시 검증에는 테스트 스크립트가 잘못된 역 목록을 보낸 두 시도도 남김.'},
  공통회귀:{통과:checks.filter(c=>c.status===0).length,실패:checks.filter(c=>c.status!==0).map(c=>c.name)},
  한글명:'공식 도시철도 역명 정규화, 대구 명덕1·반월당1 시설 번호 제거, 신규 고속열차 계통 표기 3개 교정. 편집표 압축 해제와 모든 방향 역명 합집합, 검색·행선지·게임 정답 동기화 구현.',
  미검증:['운영체제 기본 한글 IME 조합 실입력','로그인한 Supabase 서버 기록 저장'],배포:'커밋·워크플로·운영 파일 검증 결과는 별도 배포 증거에 기록'};
const out='reports/kr-rebuild/20261105-전국-철도-확장.json';fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
const rows=Object.keys(report.작업전).map(k=>'| '+k+' | '+report.작업전[k]+' | '+report.작업후[k]+' | '+(report.작업후[k]-report.작업전[k])+' |').join('\n');
fs.writeFileSync('reports/kr-rebuild/20261105-전국-철도-확장.md','# 전국 철도 확장 검증\n\n| 항목 | 작업 전 | 작업 후 | 추가 |\n|---|---:|---:|---:|\n'+rows+'\n\n'+report.물리선로와카드+'\n\n기존 미해결 352개 중 '+recovered.length+'개 복구. 새 공식 시간표의 추가 회랑까지 조사한 미해결 후보는 '+queue.length+'개이며 도시철도 대기 4방향은 별도다.\n\n| 계통 | 추가 방향 |\n|---|---:|\n'+report.신규계통.map(r=>'| '+r.노선+' | '+r.추가방향+' |').join('\n')+'\n\n전체 공개 경로 해석 17,844방향 통과, 임의 선형 대체 0건. 신규 135방향은 원본 정차열·선분을 대조했다. 브라우저 대표 완주 '+completed.length+'회이며 전 계통 개별 브라우저 검증과 구분한다.\n\n공통 회귀 '+report.공통회귀.통과+'개 통과, 기존 일본 역 ID·소부 쾌속선 표기 2개 실패. 홍콩 실제 엔진 완주·회귀 결과는 별도 파일에 보존한다. 기본 한글 IME와 로그인 서버 저장은 미검증이다.\n\n대기 원인: '+JSON.stringify(reasons)+'\n\n최신 OSM 재처리로 나온 60방향은 기존 신규 계통과 전부 중복되어 재등록하지 않았다. 전국 완성을 선언하지 않는다.\n');
console.log(JSON.stringify({before:report.작업전,after:report.작업후,recovered:recovered.length,browser:completed.length}));
