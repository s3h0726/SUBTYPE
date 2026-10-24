'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/korea/phase7'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),write=(f,s)=>fs.writeFileSync(path.join(out,f),s+'\n');
const data=require('./lib/kr-network').load(path.join(root,'data/kr/v2')),preview=read('data/kr/preview/audit.json'),failures=read('data/kr/v2/generated/remaining-failures.json'),promotions=read('reports/korea/phase7/BLOCKED_PROMOTIONS.json'),approval=read('reports/korea/phase7/RELEASE_APPROVAL.json'),ktx=read('data/kr/v2/korail-highspeed-route-bindings.json'),validation=read('reports/korea/phase7/FINAL_VALIDATION.json'),browser=read('reports/korea/phase7/PLAYTHROUGH_RESULTS.json'),site=read('reports/korea/phase7/SITE_PLAYTHROUGH_RESULTS.json'),repro=read('reports/korea/phase7/REPRODUCIBILITY.json'),counts=read('reports/korea/phase7/SELECTABLE_COUNTS.json');
if(validation.checks.some(c=>c.status==='FAIL')||browser.status!=='PASS'||site.status!=='PASS'||repro.status!=='PASS')throw Error('UNRESOLVED_VERIFICATION_FAILURE');
const initial=read('reports/korea/phase7/VALIDATION.json');write('VALIDATION.json',JSON.stringify({initialPhaseA:initial.initialPhaseA||initial.checks,final:validation.checks,notTested:['OS_IME','PHYSICAL_MOBILE','SUPABASE_ACCOUNT','HONG_KONG_BRANCH_RUNTIME','LIVE_PRODUCTION_SITE'],deployment:'NOT_PERFORMED_BY_INSTRUCTION'},null,2));
const total=browser.results.reduce((n,r)=>n+r.runs.length,0),passed=browser.results.flatMap(r=>r.runs).filter(r=>r.status==='PASS').length;
write('SUMMARY.md',`# 한국 철도 Phase 7 — INCOMPLETE

작업 브랜치: rebuild/korea-phase6-2026-10-24. 기준: f18cb5a812144d16463cfeb26f7db32a75b0fa51.

실제 수정: 공식 JR 시간표 출처 타입 검증, 미등록 직통 방향 거부, 쇼난 계통 기능 검사, 신분당선 신사→광교 연구용 경로 1개 추가, 부산 1호선 하단의 해당 방향 stop_position 연결, 공식 승강장 자료 135행 추가. 일본·홍콩 원본 데이터와 main을 변경하지 않았다.

| 항목 | Phase 6 | Phase 7 |
|---|---:|---:|
| 등록 역 |1528|${data.stations.length}|
| 물리 노선 후보 |85|${data['passenger-lines'].length}|
| 운행계통 후보 |317|${data.services.length}|
| SOURCE-ASSEMBLABLE |261|${failures.counts.sourceAssemblable}|
| 연구 플레이 |127|${preview.counts.researchPlayable}|
| 연구 차단 |178|${preview.counts.researchBlocked}|
| 제외·격리 |12|${preview.counts.excluded}|
| 미조립 |56|${failures.counts.remaining}|
| 신규 정식 승격 |0|${approval.released.length}|
| 중복 제거 선택 경로 |144|${counts.after.distinctSelectableChoices}|
| 공식 정차·요일 패턴 |65|${failures.counts.officialTimetablePatterns}|
| KTX 게임 연결 |0|0|
| 전체 빌드 |FAIL|${validation.checks.find(c=>c.name==='build').status}|
| 등록된 일본 계통 회귀 |FAIL|${validation.checks.find(c=>c.name==='japan').status}|

- 선형 완전 복구 0개. 부분 복구: 2201600 하단 stop_position 355173825→14081390782. STOP_NOT_ON_ORDERED_TRACK 119→118. 나머지 5개 역 중심점은 여전히 미해결.
- 기존 127개 payload 전부 byte 동일. 신규 6060963은 기존 선로·방향·플랫폼·16개 정차점 그대로 사용하며 공식 운영기관 전체 역 목록으로 이름 차이만 검증했다. 정식 승인과 시간표 검증으로 취급하지 않는다.
- 브라우저 계약/전구간 ${passed}/${total} 시나리오 PASS: 기본·연구 완주 336회, CUSTOM 완주 4회, 나머지 기능 검사 6회. PC·모바일 각각 실행. 별도 실제 UI 검사 ${site.runs.length}/${site.runs.length} PASS. 두 검사 수치는 중복되어 합산하지 않는다.
- 한국 단위 검사 90 PASS, 연구 계약 13 PASS, 공식 출처 경계 1 PASS, 승강장 파서 3 PASS. 일본 신칸센·특급·쇼난·우에노·등록 직통 resolver 검사 PASS. 일부 신칸센 미지원 계통은 기존 차단 상태이며 일본 전체 데이터의 신규 공식 인증을 뜻하지 않는다.
- 한국 데이터 ${repro.fileCount}개 파일 2회 재생성 차이 ${repro.changed.length}.
- KTX 621열차/551패턴 중 2패턴이 기존 방향별 정차점 부분열과 연결되지만 제한 선로 및 현행성·예외 운행일 검증 부족으로 계속 차단. 게임에 연결했다고 보고하지 않는다.
- 정식 승격 0: 시간표 정차·요일 증빙을 가진 연구 후보 34개도 역·승강장·방향, 공식 거리, 운영기관/자산, 정확한 빌드의 승인 완주 증빙이 부족하다. 로고 조건 하나만 바꾸어도 승격되지 않으므로 승인 정책을 유지했다.
- 타카사키→아타미 정방향은 유지. 미등록 아타미→타카사키는 실제 역방향 데이터·증빙을 추가하지 못했으며 명시적으로 거부한다. 역방향 복구로 보고하지 않는다.
- 전국 공식 인벤토리 확정, 44개 여객 미조립 복구, 첫 정식 승격, 실제 KTX 플레이는 미완료.
- 실제 OS IME, 물리 휴대폰, Supabase 계정, 홍콩 브랜치 실행, 운영 사이트는 NOT_TESTED. Pages 배포는 지시대로 수행하지 않았다.

커밋과 원격 결과는 GIT_RESULT.json 및 최종 응답을 참조한다.`);
write('BUILD_FIXES.md',`# 빌드 수정

- tools/lib/official-service-source.cjs: legacy official 형식을 보존하고 official-timetable은 HTTPS timetables.jreast.co.jp의 정규 열차 경로와 유효한 검토 날짜만 허용한다. 임의 타입·유사 도메인·잘못된 날짜를 거부한다.
- tools/validate-service-patterns.js: 위 계약으로 정식 시간표 타입 분류의 불일치를 수정했다. 7개 출처의 타입 오류가 해소됐다. URL 접근 가능성이나 현재 운행을 타입 검사만으로 승인하지 않는다. 직접 열어 본 2610/train/110/113131.html은 고사키→아타미 1925E. 일부 다른 기존 URL은 404/캐시 실패여서 모든 출처의 현행성을 새로 확인했다고 주장하지 않는다.
- js/service-route-resolver.js: 등록하지 않은 방향은 UNSUPPORTED_THROUGH_DIRECTION으로 거부한다. 테스트는 등록된 방향 전체와 미등록 방향 거부를 함께 검증한다. 아타미→타카사키 geometry를 좌표 반전으로 만들지 않았다.
- tools/test-shonan-shinjuku-selector.cjs: 오래된 단일 코드 문자열 검사 대신 line-11343에서 실제 7개 우에노 계통을 분리하고 NEX/다른 계통 혼입을 거부하는 기능 검사를 추가했다. 기존 쇼난 12방향 검사는 유지했다.
- 전체 build와 build:app PASS. 전체 빌드가 만든 관련 없는 일본 생성 데이터 차이는 기존 HEAD로 복원하고 번들을 다시 생성했다. 목록은 BUILD_GENERATED_JAPAN_FILES.json. 한국 생성물 2회 재생성은 별도로 0차이를 확인했다.
- 테스트의 과거 고정 개수 127/178/140을 실제 추가 경로에 맞게 128/177/141로 갱신했다. 기존 payload 127개 SHA 및 신규 경로의 모든 좌표·ID·선로 동일성을 추가 검사한다.
- CI에 승강장 파서, 공식 출처 경계, Phase 7 증빙 및 신규 신분당선 motion 검사를 연결했다. 전국 승인 검사는 그대로 INCOMPLETE를 반환한다.`);
write('JAPAN_REGRESSION.md',`# 일본 회귀

${validation.checks.filter(c=>['validate:service-patterns','japan','test:shonan','test:ueno','shinkansen','limitedExpress'].includes(c.name)).map(c=>'- '+c.name+': '+c.status+' ('+c.log+')').join('\n')}

일본 원본 through-services.json, tokyo-service-patterns.json, 선로 JSON은 변경하지 않았다. 공통 resolver의 미등록 방향 차단 및 출처 validator/test만 수정했다. 7개 우에노 방향과 12개 쇼난 방향 유지. 아타미→타카사키 역방향은 미등록 상태이며 복구되지 않았다. 홍콩 브랜치를 체크아웃하거나 병합하지 않았으며 해당 브랜치 전용 런타임은 NOT_TESTED.`);
write('OFFICIAL_PROMOTION_CANDIDATES.md','# 정식 승격 후보\n\n자동 증빙 감사이며 사람이나 운영기관의 승인 기록이 아니다. 이름만 같은 승강장 조회는 연결 증빙으로 사용하지 않는다. 상세 정차점별 자료는 BLOCKED_PROMOTIONS.json.\n\n|서비스|구간|정차·요일 증빙|남은 차단|\n|---|---|---|---|\n'+promotions.candidates.map(c=>`|${c.relationId}|${c.origin}→${c.destination}|${c.fullCallDayVerification?'있음':'미확인'}|${c.blockers.join(', ')}|`).join('\n'));
write('RELEASED_SERVICES.md','# 정식 승격\n\n0개. source-eligible 0, active 차단 305개. release:korea-services를 실제 실행했고 정식 게시 가능한 경로가 없었다.\n\n정차·요일 자료가 있는 후보 34개도 승강장 방향과 공식 거리, 역·노선·운영기관 검토 및 정확한 엔진/여정 해시의 승인된 완주 기록을 충족하지 못했다. 로고의 적법한 텍스트 대체만으로 이 항목들을 해소할 수 없어 정책을 변경하지 않았다. 공식 운영기관 자료 확보와 운영기관이 SUBTYPE 자체를 인증했다는 주장을 구분한다.');
write('GEOMETRY_RECOVERY.md','# 선형 복구\n\n2201600 노포→다대포해수욕장: 하단 역 중심점 355173825를 해당 방향의 실제 선로 위 OSM stop_position 14081390782에 연결했다. 공식 40역 역순/역번호, 원본 relation/node 해시를 고정하고 다른 방향 12258680144를 사용하면 거부한다. 좌표/way/역 ID 변경 없음. 부산 1호선 6개 미일치→5개. 미조립 56개는 그대로다.\n\nOSM relation 2201600 최신 full API 응답을 source/phase7/busan1-osm-api.json에 보존했다. 동일 버전 72이며 나머지 5개는 여전히 역 시설 중심점이다. 후속 way 배치 API는 429로 차단되어 최신 태그 수정 근거로 사용하지 않았다.\n\n공식 열차와 동일 방향 donor를 사용하는 29개 조립 시도는 원본 정차점 누락 또는 siding/yard/oneway 문제로 거부됐다. RECONSTRUCTION_ATTEMPTS.json 참조. 원래 선로를 삭제하거나 반대편 플랫폼을 차용하지 않았다.\n\n신분당선 6060963은 기존에 선로 조립 가능하던 경로이며 선형 복구 수에 합산하지 않는다. 공식 전체 16역 순서를 근거로 신사·광교(경기대) 이름 차이를 해결해 연구용 선택에 연결했다.');
write('REMAINING_56.md','# 남은 미조립 경로\n\n56개: 여객 연구 44개, 제외·격리 12개. 단위는 물리 노선 수가 아니라 relation 후보다.\n\n|relation|구간/원본명|원인|\n|---|---|---|\n'+failures.rows.map(r=>`|${r.relationId}|${r.sourceName}|${r.causes.join(', ')}|`).join('\n'));
write('NEW_LINES.md','# 신규 노선 및 경로\n\n새 물리 노선 0개, 기존 신분당선의 연구용 방향 1개(6060963 신사→광교) 추가. 총 후보는 85/317로 유지된다. 운영기관 공식 전체 역 목록 https://www.shinbundang.co.kr/dxline/dxline1.jsp 원본과 해시를 보존했다. 이 페이지는 정기 열차의 요일·정차 패턴 최종 승인 자료로 취급하지 않았다. 기존 역 ID, 플랫폼 좌표, geometry와 1호선 통합 23방향을 보존했다. 전국 누락 노선 인벤토리는 이번 변경으로 완성되지 않았다.');
write('KTX_SERVICE_PATTERNS.md',`# KTX 실제 패턴 연결 감사

실제 시간표 행 ${ktx.counts.trains}, 패턴 ${ktx.counts.patterns}. 원본 적용일 ${ktx.source.effectiveDate}. 기존 방향별 정차점과 정확히 순서대로 맞는 패턴 ${ktx.counts.patternsWithSourceStopSubsequence}개(326/327 용산→익산→광주송정). 두 패턴은 원본 열차번호/요일/차종 및 정확한 stop ID 연결을 data/kr/v2/korail-highspeed-route-bindings.json에 유지한다.

각 경로에 siding/yard 등 실제 source 태그 문제가 남고, 9월 원본의 10월 현행성 및 공휴일 예외도 승인되지 않았다. 따라서 신규 게임 PLAYABLE 0, 정식 승인 0. 나머지 549패턴은 전 구간 방향별 정차점 연결이 확보되지 않았다. 무정차 셀을 실제 선로 통과 증명으로 사용하거나 11월 시간표를 조기 적용하지 않았다.

재생성: node tools/build-kr-phase7-evidence.cjs. 실제 source-stop ID와 제한 way ID를 자동 기록하고 모든 미완료 패턴은 playable:false를 유지한다. 게임 선택·예약 인터랙션이 완성됐다고 보고하지 않는다.`);
write('STATION_AUDIT.md',`# 역 및 승강장

등록 역 ${data.stations.length}, verified 역 ${data.stations.filter(s=>s.status==='verified').length}, 정차점 ${data.stops.length}, verified 정차점 ${data.stops.filter(s=>s.verification==='verified').length}. 전 역 공식 좌표/환승 검수는 INCOMPLETE.

기존 4호선 공식 승강장 96행 + 서울 2호선 101행 + 부산 3호선 34행 = 231행. 신규 135행은 2026-06-30 기준 공공데이터포털 원본과 이용허락범위 제한 없음 메타데이터 HTML 해시를 검증한다. 단, 공식 승강장 번호가 OSM stop_position/방향 연결을 자동 증명하지 않는다. 신도림 공개 자료가 신정지선 출발 승강장까지 표현하는지는 미확인. 까치산은 공개 원본에 1번 상행 1행뿐이며 반대 방향 2번 승강장을 만들어내지 않는다.

원본 공식 이름/역 식별자/승강장 좌표/선로는 유지했다. 기존 역명 표기층 및 서울역 예외, 한글 표시/정답 일치 회귀를 13개 레거시+128개 연구 payload에서 확인했다. Hadan 추가 정차점은 별도 ID로 유지하며 역 자체를 새로 만들지 않는다.`);
write('CHANGED_FILES.txt',cp.execFileSync('git',['diff','--name-only'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()+'\n'+cp.execFileSync('git',['ls-files','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\n').filter(f=>f&&!f.includes('-screens/')).join('\n'));
console.log(JSON.stringify({status:'INCOMPLETE',research:preview.counts.researchPlayable,selected:counts.after.distinctSelectableChoices,browserPassed:passed,browserScenarios:total,site:site.runs.length,tests:validation.checks.map(c=>[c.name,c.status])}));
