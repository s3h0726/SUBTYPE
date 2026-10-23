# SUBTYPE 홍콩 철도 Phase 4

기준일: 2026-10-24(KST). 전체 상태 **INCOMPLETE**. 실제 플레이 가능한 방향은 **22 → 42개(+20)**다. 경전철 11개 정규 계통의 20방향을 추가했고, 기존22개도 새 공통 코드에서 전 구간 재완주했다. 705/706은 시작역 재방문을 포함한16회 정차 후 종료한다. 751P·일반 트램·피크트램·고속철도는 검증 부족으로 계속 차단한다.

## 1. 변경 전후

| 지표 | Phase 3 | Phase 4 |
|---|---|---|
| 전체 서비스 패턴 | 57 | 61 |
| PLAYABLE 방향 | 22 | 42 |
| 한국어 검수 레코드 | 97 | 165 |
| 미검수 레코드 | 180 | 118 |
| 전체 역·방향별 정차 레코드 | 277 | 283 |
| 정차 순서 검증 | 43 | 44 |
| geometry 검증 | 54 | 59 |
| track segment | 508 | 520 |
| 요구사항 PASS | 66 | 74 |
| INCOMPLETE | 113 | 105 |
| OUT_OF_SCOPE | 1 | 1 |
| 요구사항 FAIL | 0 | 0 |
| 실효 UI 검사 FAIL | 4 | 1 |
| 보존한 기존 정규식 FAIL | 4 | 4 |
| 로고 재배포 승인 | 0/3 | 0/3 |
| 공식 MTR 중전철/공항 색 | 10 | 10 |
| 공식 LR 지도 색 | 0 | 11 |

지정 시작 HEAD71f7493ac2aba14d117343cbee17c1ba54486e68과 실제 로컬·원격 홍콩 HEAD가 일치했고 작업 트리는 깨끗했다. [시작 Git 관측](git-start.json), [보존한 Phase3 감사](before.json). before.json branchCommitSha는 보고서 최종커밋보다 앞선 구현 시점의 메타데이터이며 기준 수치는 일치한다. 277→283은 방향별 트램 정차 레코드 추가다. 물리 역 총합을283으로 주장하지 않는다.

## 2. 경전철 구축 및 신규 PLAYABLE

| 계통 | 승인 방향/후보 | 방향별 정차 수 | 결과 |
|---|---|---|---|
| 505 | 2/2 | 14 / 16 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 507 | 2/2 | 16 / 16 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 610 | 2/2 | 26 / 26 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 614 | 2/2 | 24 / 24 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 614p | 2/2 | 13 / 13 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 615 | 2/2 | 26 / 26 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 615p | 2/2 | 16 / 16 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 705 | 1/1 | 16 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 706 | 1/1 | 16 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 751 | 2/2 | 22 / 23 | 공식 순서·실선형·한국어·전체 완주 PASS |
| 751p | 0/3 | 9 / 9 / 15 | 751P 평일 혼잡시간 조건부, 전체 정차·시간 창 미확정; 차단 |
| 761p | 2/2 | 14 / 14 | 공식 순서·실선형·한국어·전체 완주 PASS |

신규20개 서비스ID·운영사·출발/종착·방향·공식/OSM 출처와 차단 사유는 [61개 서비스 표](SERVICES.md), [JSON](services.json)에 모두 기록한다. [42개 완주 기록](browser-runs.json)은 첫 역부터 모든 중간역 입력, 100%·종착 종료, 데이터 fingerprint를 보존한다. 자동 fill은 실제 브라우저 DOM 조작이며 사람 타자 속도나 실제 OS IME의 증거가 아니다. full animation/reducedMotion=false로 실행했다.

공식 MTR [CSV](https://opendata.mtr.com.hk/data/light_rail_routes_and_stops.csv)와 [현행 운행표](https://www.mtr.com.hk/en/customer/services/schedule_index.html)를 교차 확인했다. CSV의507/751/761P 중복 인접 종점행은 동일StopID/StopCode만 축약하고 원본을 보존했다. 705/706의Direction1/2는 반대 운행이 아니라 순환 구간의 연속 섹션이어서 실제 순서대로 합쳤다. 방향별 차이(751 On Ting 등)는 유지했다.

614P relation5955256은 기존 마지막 railway way276687999의 원본 끝 node1723162796(ref001)을 누락 stop member로만 보완했다. 공식 CSV/운행표의13개 정차와 일치하며 way·좌표·직선 연장은 추가하지 않았다.

## 3. 일반 트램과 OSM 조사

공식 [운행 안내](https://www.hktramways.com/en/schedules-fares/)의6개 구간 쌍을12방향 후보로 정리했다. Western Market기존빈후보ID를 유지하고 실제 relation4088368을 연결했다. 누락4방향만 추가해 후보57→61이며 모든 원래57ID를 보존했다. 공식nextTramData의128개 방향별 코드/중문/영문 사실 중114개 원본 노드 정체성을 대조했다. 이 목록은 각 서비스의 완전한 정차 순서가 아니므로12방향 전부 정차/한국어 미검증 상태로 차단한다. 도로 way 대체는 없다.

[OSM 개별 조사](geometry-investigation.json):

- 3263757·4088518: Broadwood Road stop member가 Happy Valley종점 뒤에 잘못 붙어 있었다. 공식106→107→108→HVT_K 순서에 따라 기존 stop만 이동했다. 원본 모든 railway way/vertex 불변 및 마지막4정류장 exact vertex검사. geometry만 복구했고 PLAYABLE은 차단한다.
- 3264047: Peak Tram 정차/way방향 충돌 미해결, INCOMPLETE.
- 6582965·6582966: 통합 전 Tuen Mun–Hung Hom 역사 relation, non-railway member 거부 유지. 현행 통합 튄마선 서비스에 쓰지 않는다.
- Phase4 최신 OSM API 시도는5개 각각1회·2초 간격으로 모두429. 반복 폭주 없이 Phase2/3 보관 원본을 사용했다. 새 OSM 상태 검증에 성공했다고 보고하지 않는다. 역사적 FAIL과 원본은 그대로 남겼다.

남은 오류 relation은 **3264047,6582965,6582966**. 서비스 geometry 미검증2개(Peak/HSR)와 오류 relation3개는 다른 집계다.

## 4. 한국어·역명판·운영사 자산

97개 기존 MTR 검수를 보존하고 경전철68개를 추가해165개 레코드를 검수했다. 추가 표기는 공식 한국어 지정명이 아니라 **공개 한국어 통용 표기를 수동 검토한 medium등급**이다. 공식 MTR 중문/영문/StopID와 연결했고 기계번역 단독 승인은0이다. [검수 원본](../../../data/hk/master/surface-name-review.json), [누락118개 추적](surface-name-audit.json). Shan King North404 대체 근거와 Locwood문서 내부 표기 충돌도 기록한다. 미검수118개를 임의 확정하지 않았다.

MTR색10개 유지, 공식 [LR 지도PDF](https://www.mtr.com.hk/archive/en/services/LR_routemap.pdf)의11개 서비스 색을 확인했다. 지도 표시색이며 별도 상표 색규정/로고 이용권을 뜻하지 않는다. MTR·Hong Kong Tramways·Peak Tram 로고 재배포 승인 **0/3** 유지, 임의 로고 생성 없음. 경전철 전용 역명판과 서비스번호·검증된 색을 적용했다. 학습 UI이며 실제 역명판의 정밀 복제품이라고 주장하지 않는다.

## 5. 실제 TAB 환승·UI 수정

공식 물리 환승역8곳을 별도 [review](../../../data/hk/master/transfer-review.json)로 관리한다. 플랫폼별 route-stop 좌표를 그대로 사용하며 보행 통로를 train edge로 만들지 않는다. network.transfers=3은 원격 홍콩 커밋에서 보존한 Central–Hong Kong, Tsim Sha Tsui–East Tsim Sha Tsui, Kowloon–Austin의 명시적 보행 연결 레코드이며 train geometry가 아니다. 같은 물리역8곳의 노선별 탑승 전환과 별도 집계다. 출구/개찰구 조건도 원격 원본을 보존했다. 미검토·이름/근접성만 일치하는 연결은 차단한다. 도착 전용 방향은 출발 가능한 방향으로 잘못 노출하지 않는다.

[실제 브라우저5시나리오](browser-transfers.json): 홍콩섬↔남홍콩섬(ADM), 췬완↔홍콩섬(ADM), 췬완↔군통(YMT), 동철↔튄마(HUH), LR507↔505(Tin King). 각 TAB A→B→A→B 총15회 후 새 노선의 환승역을 첫 정답으로 입력하고 종착까지 진행했다. 외부 홍콩 커밋 통합 후 위5시나리오와 비환승TAB을 모두 다시 검사했다. 추가로 [Central–Hong Kong별도명 환승](browser-named-transfer.json)을 TAB왕복3회 후 공항철도5역 종착까지 검증했다. 나머지 별도명2쌍은 브라우저NOT_TESTED(원격원본·자동검사보존)다. 실제 양방향 탭 전환과 최종 선택 방향의 이후 완주를 검증했으며 모든 다른 환승역 전수를 주장하지 않는다. 환승 없는 Ocean Park에서는 TAB 전후 게임 상태 불변 PASS. numeric train 좌표는 자동 route-stop 검사가 담당하고 브라우저는 실제 표시·지도현재역·이후 이동을 확인했다.

자유주행 다음 입력역 표시와 실제 정답 불일치, 종착 후 이전 target잔류, 순환선 닫힘 방문 index오인, 환승 탭 방향 식별을 수정했다. 마지막 QA에서 결과 거리·경로재생도 반복 물리역ID를 첫 방문으로 찾는 오류를 확인하여 홍콩 방문순서별 정차객체로 수정했다. 705/706의15개 구간을 원본 곡선으로 계산하고 재생하는 추가 회귀 및 실제 브라우저 재완주·결과지도 검사를 포함한다. 모바일390×844에서 환승 탭/헤더/운행HUD겹침을 실제 재현해 홍콩 CSS배치만 수정했다. 수정 후 탭y4–97, 헤더107–161, HUD166–220, 역명판464–826으로 분리됐고 page가로overflow없음. [라이트](images/mobile-light-transfer.jpg)·[다크](images/mobile-dark-transfer.jpg) 및 실제 모바일TAB확인.

기존4FAIL은 [원래 정규식 결과](legacy-ui-investigation.json)에 그대로 보존한다. inputValueIsNfcSoleSource·koreanProgressUsesAnswerLength·firstAnswerIsStartStation은 실제 TypingController/Game동작 fixture와 브라우저 근거로 재평가했다. NFC/NFD·조합 중/확정·Backspace·괄호/고정문자·중복완료·첫 입력역을 검사한다. 문자열 맞추기용 코드 추가는 없다.

AUTO는150ms최소 응답과 실제 선로 애니메이션 완료를 모두 기다린다. 완료시240ms유한 곡선 애니메이션을 적용하고 임의 직선/강제 생략을 하지 않았다. 최종 전환에서 **901.3ms outlier가 남아 AUTO목표검사는 FAIL**, 요구138도 INCOMPLETE다. 이후 약240–272ms샘플과 별개로 실패를 지우지 않았다.

## 6. 자동 검사와 한국·일본 회귀

| 범위 | 기존 | 신규 | 최종 결과 |
|---|---|---|---|
| 통합 Node 회귀 | 94 | 13 + 원격2 | 109 PASS / 0 FAIL / 0 SKIP |
| 그중 홍콩 | 30 | 13 + 원격1 | 44 PASS (위109에 포함) |
| 타이핑 모델 | 18 | 0 | 18 PASS, 별도 |
| IME 컨트롤러 fixture | 10 | 0 | 10 PASS, 별도 |
| 검사 명령 | — | — | 9 PASS / 1 FAIL(UI감사) |
| 실효 UI 핵심 검사 | — | — | AUTO1 FAIL, 기존정규식4FAIL별도보존 |

명령: node tools/validate-hk-branch.cjs, node tools/check-hk-ui-baseline.cjs. [전체 출력](../validation.txt), [명령별 결과](../validation.json). 전체 검사 exit1을 PASS로 바꾸지 않았다. 신규 테스트 작성 중 발견한 fixture가정 오류(대용량git출력버퍼·CSV중복코드·tram전정류장snap0·relation필드위치)는 실제 원본/스키마에 맞춰 고쳤고 원래 실패 검사를 삭제하지 않았다. 고속철도 원본을 manifest에 추가한 직후 첫 최종 검사에서 network의 manifest 사본이 갱신되지 않아 byte-stability1건이 FAIL했다. 생성기를 정상 재실행한 뒤 같은 검사를 재수행했으며 조건을 완화하지 않았다. 기존 truncated614P거부 검사는 공식13정차복구 후에도12정차를 거부하도록 유지했다.

한국 성수지선5역, 일본 니시큐슈 신칸센5역·나리타 익스프레스 신주쿠발6역 실제 완주 PASS. 한국 자유주행 시청→충정로→아현 타이핑 이동과 인접역버튼 이동 확인. 자유주행통계0오류를 주장하지 않는다. 일본NEX설정묶음캡션 불일치와 기존일부추정거리 표시는 Phase3동일한 기존한계로 남겼다. 한국·일본 전수 실제브라우저검증/환승은 NOT_TESTED이며 기존 graph환승자동검사만 PASS다.

CUSTOM 기존3개 저장여정 보존. Phase3실제역3정차 경로를 저장→브라우저새로고침→재실행→전체완주 PASS. [증거](browser-custom.json), [회귀표본](browser-regressions.json). 원본/생성물 byte-stability·manifestSHA256 검증 PASS 및 [생성물해시](generated-hashes.json).

## 7. 피크트램·고속철도·미실행

Peak Tram공식 페이지는403이어서 현행 조건부 중간정차를 확인하지 못했다. relation3264047도 미해결. 현재 승하차 목록·양방향·언덕선형·고도3D는 INCOMPLETE/NOT_TESTED이며 과거역을 임의 승인하지 않았다.

MTR [고속철도목적지](https://www.highspeed.mtr.com.hk/en/ticket/destination.html) 현행 원본을2026-10-24보관했다. 이 자료는2026-09-27효력, 광둥 단거리 및 본토 장거리와114개역 연결을 안내하고 열차별 중간정차 차이를 명시한다. 목적지목록을 곧바로 하나의 실제 정차계통으로 만들지 않았다. 국경을 포함한 전구간 railwaygeometry·개별열차정차/한국어 검수 부족으로 HSR계통 승인0이다.

**NOT_TESTED:** 실제 Windows한국어IME·모바일한글키보드(브라우저DOM입력만가능, nativeOS API없음), Supabase인증/클라우드저장·복원·사용자분리(설정/테스트계정없음), 기타모든환승역 전수. fixture통과와 실제OS검사를 구분한다.

## 8. 180개 요구사항과 Git

[180개 전수표](REQUIREMENTS.md), [ID별근거·코드위치·테스트·미완료사유](requirements-audit.json): **PASS74, INCOMPLETE105, OUT_OF_SCOPE1**. Phase3 PASS66개 유지, 61·65·69·70·117·130·137·148의8개만 추가 PASS. 하위미실행은NOT_TESTED를 명시하며 요구사항 전체상태INCOMPLETE와별도다.

- 브랜치: feature/hong-kong-railway
- 시작: 71f7493ac2aba14d117343cbee17c1ba54486e68
- 실제 구현 커밋: 2a11536f89d5b2a3085ac90035280e97effb345c
- 원격 푸시: SUCCESS; [Git영수증](git-result.json)
- [변경파일목록](changed-files.txt)
- local main: 67f9b780b4f60fd2586d302ddea41a4d94b6baa2, 미수정
- 시작 원격 main: 510d3d9734914d13499de08785ea355e684e9381; 캐시origin/main: 438f605b1e1f2a2a97991bb6e84e226c8bd0f91a. 외부main변경 미통합
- 한국·일본 원본데이터 및 workflow 변경0, main병합·리베이스·직접수정/푸시·강제푸시·새브랜치·Pages배포 모두미수행
- 로컬검증 http://127.0.0.1:8081/ ; 외부preview NOT_CONFIGURED

작업 중 원격 홍콩 브랜치가60df997c057079cf1bf225134d3f5a1d739a8870로 진행했음을 푸시 전에 발견했다. 로컬 작업을bda35bf456fe47c566b6b55e6fb48bfbfbe618d9에 보존한 뒤 같은 홍콩 브랜치에서 해당 커밋만 merge했다. 원격의 별도명 환승3쌍·순환선 폐합가드·테스트2개를 보존하고 생성물을 정상 재빌드했다. main병합/리베이스와 다르며 main의 외부 변경은 가져오지 않았다. 상세는git-integration.json.

Git커밋은 자기SHA를 자기본문에 넣을 수 없으므로 구현푸시SHA를 이 보고서후속커밋에 기록한다. 최종보고커밋의 원격HEAD일치는 최종응답에서 제공한다.
