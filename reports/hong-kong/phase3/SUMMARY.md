# SUBTYPE 홍콩 철도 Phase 3

기준일: 2026-10-22. 전체 상태는 **INCOMPLETE**. 검증을 통과한 정규 MTR 서비스는 **6 → 22개(+16)**이며, 전체 후보 수 57개는 유지했다. 췬완·군통·홍콩섬선부터 정관오 본선·뚱충·동철 양 국경 종착·통합 튄마선까지 실제 양방향 완주했다. 기존 디즈니랜드·남홍콩섬·공항철도 6개도 모두 재완주했다.

## A. 변경 전후

| 지표 | Phase 2 | Phase 3 |
|---|---|---|
| 전체 서비스 패턴 | 57 | 57 |
| 플레이 가능 (방향별) | 6 | 22 |
| 한국어 역명 검수 | 26 | 97 |
| 정차 순서 검증 | 43 | 43 |
| 실제 geometry 검증 | 53 | 54 |
| track segment | 501 | 508 |
| PASS | 45 | 66 |
| INCOMPLETE | 134 | 113 |
| OUT_OF_SCOPE | 1 | 1 |
| 요구사항 FAIL | 0 | 0 |
| 기존 UI 검사 FAIL | 4 | 4 |
| 로고 재배포 승인 | 0/3 | 0/3 |
| 공식 MTR 노선색 | 10 | 10 |

시작 로컬/원격 홍콩 HEAD는 지정 기준 80507af1cd12a2c56e81fc108dca1635044d6204와 일치했고 작업 트리는 깨끗했다. 보존한 [Phase 2 감사](before.json)의 branchCommitSha는 구현 커밋 a0877152bd0b6b691f642427a6764c704f906297로, Phase 2 최종 보고 커밋 80507af...보다 앞서 생성된 메타데이터다. 수치 57/6/26/43/53/45/134/1은 실제 원본과 일치한다. before.json의 remote main은 당시 캐시값이며, 최신 원격 main과 구분한다.

## B. 노선별 결과 및 데이터 근거

[전체 57개 서비스 표](SERVICES.md), [기계 판독 자료](services.json), [실제 22회 완주 기록](browser-runs.json), [노선별 정차 위치](stop-position-audit.json). 각 표에 운영사, 역 수, 출발·종착·방향, 공식 정차 자료와 OSM relation, 한국어 검수·플레이·차단 사유가 있다.

- 췬완 16역, 군통 17역, 홍콩섬 17역: 각각 DT/UT 전 구간 완료.
- 정관오 본선 7역, 뚱충 8역, 튄마 27역: 각각 DT/UT 완료. 동철 14역의 Lo Wu 및 Lok Ma Chau 두 종착지 각각 DT/UT 완료.
- 디즈니랜드 2역·남홍콩섬 5역·공항철도 5역: 기존 6개 방향 유지·재검증.
- LOHAS Park 조건부 셔틀 2개는 운행 시간 조건 검증 부족으로 차단. Racecourse 특별 정차는 구현·플레이 완료로 세지 않았다. 따라서 모든 지선·특별 계통의 완료를 주장하지 않는다.

한국어는 등록 MTR 물리 역 코드 97개를 검수했다(신규 71개). 기존 공식 관광 표기를 우선 보존했다. 나머지는 한국어 현지 작성자 KEIhk/AAHK의 2025-04-24 다국어 역명표, 기존 한국어 철도 자료를 대조한 **통용 표기**이며 MTR 공식 한국어 지정명으로 주장하지 않는다(officialKoreanDesignation=false, confidence=medium). 출처별 중문·영문 식별과 대조 링크를 [검수 원본](../../../data/hk/master/korean-name-review.json)에 보존했다. 학습용 UI의 한글 표기이며 기계 번역만으로 승인하지 않았다. 전체 277개 역/방향 정류장 레코드 중 180개는 여전히 미검수다. 홍콩 전체 물리 역 수는 NOT_VERIFIED.

공식 역명·코드·정차 순서는 [MTR CSV](https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv), 공식 10개 노선색은 [MTR 노선도](https://www.mtr.com.hk/archive/en/services/routemap.pdf)를 기준으로 한다. 한국어 사실 자료는 data/hk/sources/phase3/aahk-*-facts.json에 필요한 역명 사실만 보존했으며 기사·사진·전체 HTML을 배포하지 않는다. 파일 해시와 출처·권리 상태는 [manifest](../../../data/hk/sources/manifest.json)에 기록했다.

### 실제 선로 6건 조사

[6개 relation 개별 조사](geometry-investigation.json). 뚱충 5317704는 원본에 이미 포함된 1176509649/1558652644/1558652643의 순서만 1558652640 뒤로 교정했다. 공유 끝점이 정확히 연결되며 새 좌표나 직선은 만들지 않았다. 잔여 construction 태그는 기본 차단하고, 이 3개 way에 한해 [MTR PR055/26](https://www.mtr.com.hk/archive/corporate/en/press_release/PR-26-055-E.pdf)의 **2026-09-13 홍콩 방면 새 선로 영업 개시** 근거를 명시적으로 요구한다. 아직 개통하지 않은 Tung Chung East 역은 추가하지 않았다.

남은 OSM 오류 relation: **3263757, 3264047, 4088518, 6582965, 6582966**. Happy Valley 2건은 종점 뒤에 붙은 Broadwood Road 정차 순서, Peak는 역·way 방향 및 현재 중간 정차, 옛 튄마 2건은 2021-06-20 종료/철거 선형 문제다. 마지막 2건을 현재 통합 튄마선과 중복 서비스로 등록하지 않았다. 3263757/4088518/6582965의 최신 재요청은 HTTP429여서 10-20 보관 원본을 사용했다고 명시했다. 접근 실패를 검증 성공으로 바꾸지 않았다.

공통 stationMasterId/physicalStationId와 서비스별 stopId/lineId/sourceStopNodeId/stopPosition을 분리했다. 검증 선형의 모든 정차 위치를 실제 경로 정점으로 맞췄고, 승인 22개는 모두 snapMeters=0이다. Admiralty 네 노선의 서로 다른 정차 위치를 보존한다. 환승 통로를 철도로 사용하지 않으며, 미검증 홍콩 환승 edge는 0개 활성 상태다. CUSTOM은 선택한 선로 위로 첫 역도 재배치하고 기존 저장값을 덮어쓰지 않고 재구성한다.

### 로고·역명판·UI

로고 재배포 승인 **0/3 유지**. MTR·Tramways 출처·권리 검토와 Peak 접근 한계는 network.assetReview에 남기고 임의 로고는 생성하지 않았다. 역명판은 승인 노선에서 한국어·번체중문·영문, 공식 역 코드·노선 식별·공식 색을 표시한다. 실제 공식 역명판을 복제했다고 주장하지 않는다. 모바일 390×844에서 숨겨진 PRE 코드를 발견해 홍콩 전용 CSS로 수정하고 밝은/어두운 모드에서 코드·긴 프린스에드워드 표기·가로 넘침 없음·역명판 하단 826px을 확인했다.

[UI 검증](ui-verification.json), [기존 UI 실패 4개 원인](legacy-ui-investigation.json). 원래 정규식 감사는 수정하지 않았고 FAIL 4개를 보존했다. AUTO 150–300ms 전체 애니메이션 목표는 여전히 미확인(요구사항 138 INCOMPLETE). 신규 모바일 코드 오류의 수정 결과와 기존 FAIL을 분리했다.

## C. 요구사항 180개 전수 재평가

[180개 전체 표](REQUIREMENTS.md), [상태·근거·코드 위치·테스트·미완료 사유 JSON](requirements-audit.json). **PASS 66, INCOMPLETE 113, OUT_OF_SCOPE 1, FAIL 0**은 요구사항 집계다. 기존 UI 검사 FAIL 4개는 별도이며 전체 검사 성공으로 표현하지 않는다. 90번 케이블카는 원본 NOT_REQUESTED를 보존하고 이 보고서에서 OUT_OF_SCOPE로 매핑했다. Phase 2 PASS 45개를 하나도 내리지 않았다.

## D. 자동 회귀와 실제 브라우저 검사

| 구분 | 기존 | 신규 | 결과 |
|---|---|---|---|
| Node 공통 회귀 | 86 | 8 | 94 PASS / 0 FAIL / 0 미실행 |
| 그중 홍콩 | 22 | 8 | 30 PASS (위 94개에 포함) |
| 타이핑 모델 | 18 | 0 | 18 PASS (별도) |
| IME 컨트롤러 fixture | 10 | 0 | 10 PASS (별도) |
| 전체 검사 명령 | — | — | 10개 중 9 PASS / 1 FAIL(기존 UI) |
| 기존 UI 정규식 | — | — | FAIL 4 유지 |

실행: node tools/validate-hk-branch.cjs. [명령별 결과](../validation.json), [전체 출력](../validation.txt). 전체 명령은 기존 UI 감사 때문에 **exit 1**이며 통과로 바꾸지 않았다. 데이터/서비스/한국 데이터/단일 원본 검사와 bundle 문법 검사를 통과했다. 원본 해시 및 compiler byte stability는 HK 회귀에 포함하며 [생성물 SHA256](generated-hashes.json)에 기록했다.

실제 로컬 브라우저에서는 22개 방향의 첫 표시역→모든 중간역 한국어 입력→종착 종료를 확인했다. normal/AUTO 11개, memory/SPACE 11개이며 모두 100%·오류0. reduced motion=true와 자동 fill을 사용했으므로 사람 타자 속도 또는 실제 OS IME/전체 애니메이션 성능의 증거로 사용하지 않는다. 검증 데이터 fingerprint가 바뀌면 브라우저 승인이 자동 무효화되며 최종 산출물에는 validation-preview가 없다.

CUSTOM: PRE→SSP→CSW 신규 경로 저장·새로고침·재실행·완주 PASS. Phase 1 디즈니랜드 및 Phase 2 ADM→OCP→WCH 저장 경로도 각각 재실행·완주 PASS. 사용자 저장 데이터를 삭제하지 않았다.

한국 성수지선 5역 완주, 자유주행 시청→을지로입구→을지로3가 이동 PASS. 일본 니시큐슈 신칸센 5역 및 나리타 익스프레스 신주쿠 발 6역 완주 PASS. 일본 NEX 기존 설정 화면의 묶음 서비스 캡션 불일치와 거리 일부 추정 표시는 별도 기존 한계로 기록했다. 한국·일본 원본 데이터, 신칸센·특급 구현 및 workflow diff는 0이다.

**NOT_TESTED:** Supabase 설정이 없어 로그인/클라우드 저장·복원, 실제 OS 한글 IME, 실제 환승 실행(TAB), Phase 3 전체 애니메이션 타이밍. 한국·일본 모든 계통의 전수 브라우저 검증을 주장하지 않는다. 브라우저 앱 콘솔 오류는 검사한 로컬 탭 범위 0건. 설정은 기존 dark/reducedMotion=false로 복구했다.

## E. Git 결과와 배포 보호

- 작업 브랜치: feature/hong-kong-railway
- 시작 커밋: 80507af1cd12a2c56e81fc108dca1635044d6204
- 구현·검증 커밋 SHA: e2b353bb62dcc346c11a63d1df20f75233d18321
- 커밋·원격 확인 영수증: [git-result.json](git-result.json)
- 원격 구현 푸시: SUCCESS
- [전체 변경 파일](changed-files.txt)
- local main: 67f9b780b4f60fd2586d302ddea41a4d94b6baa2 (미수정)
- 시작 시 직접 관측한 remote main: fa2b73c67e17614bf576920e900941f3e967fed9; 이전 캐시 origin/main: 438f605b1e1f2a2a97991bb6e84e226c8bd0f91a. 외부 main 변경은 통합하지 않았다.
- main 병합·리베이스·직접 수정/푸시·강제 푸시·새 브랜치·GitHub Pages 배포: 전부 미수행.
- 외부 브랜치 미리보기: NOT_CONFIGURED. 실제 검사는 로컬 http://127.0.0.1:8081/ 에서 수행.

Git 커밋은 자신의 SHA를 파일 내용에 포함할 수 없다. 위 SHA와 영수증은 실제 구현 푸시를 가리키며, 이 보고서를 담는 후속 커밋의 최종 HEAD/원격 일치는 최종 응답에서 별도로 제공한다.

추가 Git 관측: 구현 푸시 직후 remote main은 7bc7c34623daf56e01a9f5c9266fb3f6f25433af로 외부에서 다시 진행했다. 이 작업은 main에 푸시하거나 그 변경을 가져오지 않았다. 실제 구현 푸시와 보고 근거가 확보되어 요구사항 10·180을 추가 PASS로 전환했다(기능·데이터 관련 신규 PASS 19개 + 산출물 검증 2개). 남은 선형 오류 5개 중 2개는 현재 서비스로 쓰지 않는 역사 relation이므로 서비스 geometry 미검증 3개와 오류 relation 수 5개는 서로 다른 집계다.

보관한 화면 증거: [모바일 라이트](images/mobile-light.jpg), [모바일 다크](images/mobile-dark.jpg), [췬완 전구간 완료](images/tsuen-wan-complete.jpg). 나머지 완주 DOM 기록은 browser-runs.json, 로컬 원본 화면은 output/hk/에 있다.
