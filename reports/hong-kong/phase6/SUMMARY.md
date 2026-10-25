# SUBTYPE 홍콩 철도 Phase 6

**기존 54방향을 보존하고, 플레이 가능한 서비스를 62방향으로 늘렸다.** 고속철도 신규 추가는 사용자 후속 지시에 따라 제외했다. 홍콩 전체 철도망은 아직 INCOMPLETE다.

| 지표 | Phase 5 | Phase 6 |
|---|---:|---:|
| 등록 서비스 후보 | 61 | 66 |
| PLAYABLE 방향 | 54 | 62 |
| 정차 순서 검증 | 56 | 64 |
| 실제 geometry 검증 | 59 | 65 |
| 한국어 검수 레코드 | 283 | 285 |
| 한국어 미검수 | 0 | 6 |
| Track segment | 520 | 532 |
| 신규 물리 노선 | — | 1 |
| 신규 고속철도 계통 | 0 | 0 |
| Node 회귀 PASS | 117 | 127 |
| 요구사항 PASS | 85 | 96 |
| INCOMPLETE | 93 | 82 |
| FAIL | 1 | 1 |
| OUT_OF_SCOPE | 1 | 1 |
| AUTO 표본 | 997 | 1242 |
| AUTO 중앙값 | 263.2ms | 263.2ms |
| AUTO p95 | 965.4ms | 966.5ms |
| AUTO 최악 | 1306.7ms | 1248.5ms |
| 300ms 초과 | 244 | 218 |

후보 집계는 기존 61개 + Ocean Express 2방향 + 정관오선 직통 2방향 + 피크트램 역방향 1개 = 66개다. 기존 후보 중 셔틀 2방향과 751P 저녁 2방향을 복구하고, 신규 Ocean Express 2방향과 직통 2방향을 승인해 PLAYABLE이 8개 늘었다. APM 연구와 CUSTOM 3개는 이 집계에서 제외한다. 291개 역·방향 레코드는 홍콩의 물리 역 총수가 아니다.

## 구현과 실제 플레이

신규 PLAYABLE:

- hk-tseung-kwan-o-tks-dt · 3정차 · LOHAS Park → Tiu Keng Leng
- hk-tseung-kwan-o-tks-ut · 3정차 · Tiu Keng Leng → LOHAS Park
- hk-tseung-kwan-o-lohas-peak-ut · 6정차 · North Point → LOHAS Park
- hk-tseung-kwan-o-lohas-peak-dt · 6정차 · LOHAS Park → North Point
- hk-light-rail-751p-osm-2929802 · 9정차 · Tin Yat → Tin Shui Wai
- hk-light-rail-751p-osm-6485219 · 9정차 · Tin Shui Wai → Tin Yat
- hk-ocean-express-up · 2정차 · Waterfront → Summit
- hk-ocean-express-down · 2정차 · Summit → Waterfront

홍콩은 24개 노선 카드 안에서 운행계통과 방향을 고른다. 트램은 기존 운영사 카드 하나와 6개 구간·12방향 구조를 유지한다. CUSTOM은 별도 집계한다. 조건부 운행 안내는 선택 화면에 표시하며, 안내 내용의 별도 fingerprint도 브라우저 완주 증거와 대조한다.

751P는 MTR의 ‘751 일부 구간 운행’ 설명, 공식 전체 정차 CSV, 현행 시간 안내, 방향별 OSM 9정차를 교차 검증했다. 과거 Tin Yat → Siu Hong 후보는 차단한다. 751P의 공식 색상은 미검증이므로 중립 UI 색상만 사용한다.

공식 노선도로 7개 환승역을 추가 검수했다: Sunny Bay, Lai King, Nam Cheong, Kowloon Tong, Yau Tong, Tiu Keng Leng, Quarry Bay. 기존 8개 조합과 신규 7개 조합, 총 15개에서 TAB 왕복 전환·새 노선의 첫 입력 역·종착 도착을 실제 확인했다.

검사 중 발견한 **환승 가능한 종착역에서 TAB을 누르기 전에 다른 노선의 다음 역을 잡는 오류**를 홍콩에 한정해 수정했다. 종착 상태를 유지하고 명시적인 TAB 전환을 기다린다. 노선별 정차 좌표는 유지하며 보행 통로를 철도 way로 만들지 않았다.

## 테스트

- 통합 Node: 기존 117개 + 신규 10개 = **127 PASS / 0 FAIL / 0 SKIP**.
- typing 모델 18개, IME controller 10개 fixture는 별도다.
- 검증 명령: 9 PASS / 1 FAIL. 실패는 AUTO UI 감사다.
- 요청된 npm 스크립트는 공식 npm CLI를 임시 폴더에 풀어 실행했다. 전역 설치·프로젝트 의존성 설치는 하지 않았다.
- 초기 pnpm 대체 시도의 실행 환경 실패도 별도로 보존했다.
- audit:hk:complete는 실제로 INCOMPLETE, exit 1이다.

[전체 출력](validation.txt), [요청 명령 결과](requested-commands.txt), [테스트 전환 기록](test-migration-initial.txt).

62방향 모두 브라우저에서 전 구간을 완주했다. 신규 8방향과 705·706은 모바일 390×844에서도 완주했다. AUTO·SPACE·암기·연속 입력, 라이트·다크 모드, 페이지 가로 넘침, 환승 탭과 HUD 분리를 검사했다. 실제 모바일 운영체제 검사는 아니다.

기존 CUSTOM 3개를 보존한 채 내용을 그대로 저장하고, 새로고침 후 3정차를 오류 없이 완주하고 결과 경로를 재생했다. 한국 성수지선 5역, 일본 니시큐슈 신칸센 5역, 나리타 익스프레스 6정차도 오류 없이 완주했다. 한국·일본 원본 데이터 변경은 없다. 모든 국가·자유주행·계정 시나리오를 브라우저로 전수 검사했다고 주장하지 않는다.

한 트램 입력 fixture는 최초에 99.8%·오류 1건을 기록했고 재검사에서는 100%로 완주했다. 최초 실패와 측정값도 보존했다. UI 도구 시간 제한으로 중단된 긴 검사는 저장된 정차 순서부터 이어갔으며 RUNNING을 PASS로 세지 않았다. 일본 NEX 계통 묶음 캡션의 기존 불일치는 Phase 5 한계로 남겼다.

## AUTO와 미실행 항목

지도 도착 때 모든 역 마커를 다시 만들던 작업을 변경된 최대 6개로 줄이고, 중복 invalidateSize 호출을 제거했다. 최소 150ms와 실제 선형을 따르는 240ms 애니메이션은 유지했다.

그러나 visible 상태에서도 1~2개 프레임 사이에 약 1초 간격이 생기는 사례가 남아 **요구사항 138은 FAIL**이다. 원래 997개 표본과 Phase 6의 모든 실측 표본을 보존했다. 느린 표본 삭제, 300ms 기준 완화, 타임아웃 성공 처리, 애니메이션 생략은 하지 않았다. 정확도 검사 중단으로 미포착된 마지막 전환 1개는 추측으로 채우지 않았다. 프레임 지연의 정확한 원인은 아직 확정하지 못했다.

**NOT_TESTED**: 실제 Windows 한글 IME, 실제 모바일 OS 키보드, Supabase 인증·클라우드 저장·계정 격리. Native 앱 접근과 테스트 설정·계정이 없다. DOM 입력 fixture를 실제 OS 키보드 검사로 계산하지 않는다. 기존 정규식 감사 4개 실패도 행동 검사와 분리해 보존했다.

## 남은 작업

- **피크트램:** 정부 6역·양방향 원본 선형 복구 완료. 한국어 6개, 요청 정차 세부 운영 조건과 브라우저 동작 검증 전까지 플레이 차단.
- **공항 APM:** 공식 운영과 T2 출발시설 개통 확인. 선형 API가 429·406을 반환해 캐시하고 제한된 재시도 후 중단. 빈 PLAY 카드는 만들지 않았다.
- **751P 오전편:** 새 Tin Wing 플랫폼과 정차 위치의 정합성 미확정. 기존 역사적 후보를 오전편으로 억지 승인하지 않았다.
- 기타 경전철 특별편 전체 정차, Racecourse, 모든 환승 전수 검사는 미완료다.
- 역사적 튄마선 relation 6582965·6582966은 현행 운행에 편입하지 않는다. 원본 실패 3건은 보존하면서 피크트램의 선형 복구만 분리 기록했다.
- 기존 운영사 로고 3개 재배포 승인 0건을 유지한다. Ocean Park도 공식 로고를 생성·배포하지 않고 텍스트로 표시한다.
- 고속철도 신규 코드·서비스·정차역·선형 추가는 0개다. 기존 대기 후보와 요구사항은 삭제하거나 임의 완료 처리하지 않았다.

[서비스](SERVICES.md), [전체 인벤토리](NATIONAL_INVENTORY.md), [차단 내역](BLOCKED_SERVICES.md), [선형](GEOMETRY_AUDIT.md), [한국어 검수](STATION_NAME_AUDIT.md), [180개 요구사항](requirements-audit.json).

## Git

- 작업 브랜치: feature/hong-kong-railway
- 시작 커밋: 9272e1d3afe57bd72461942600fc4d3d472d90ca
- 구현 커밋: 338f5acbe868207bcea97d014e531542ff8bbcd5
- 원격 푸시: **SUCCESS**
- [Git 영수증](git-result.json), [변경 파일](changed-files.txt), [생성물 SHA](generated-hashes.json)
- local main 67f9b780b4f60fd2586d302ddea41a4d94b6baa2 보존. 원격 main의 외부 변경은 통합하지 않았다.
- main 수정·병합·리베이스·푸시, 강제 푸시, 새 브랜치, 운영 Pages 배포는 수행하지 않았다.

자기 커밋 SHA를 같은 커밋의 파일에 넣을 수 없으므로 구현 커밋의 실제 푸시 영수증을 후속 보고 커밋에 남긴다. 최종 보고 HEAD와 원격 HEAD 일치는 최종 응답으로 제공한다.
