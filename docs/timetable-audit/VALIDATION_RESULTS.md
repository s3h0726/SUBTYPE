# 빌드 및 검증 결과

## 일괄 시간표 배치

| 검사 | 결과 | 범위 |
|---|---|---|
| `python tools/test_mass_timetable_audit.py` | 통과, 2개 | 자정 이후 시간, 달력 예외, 빈도 템플릿, 정차 순서 중복 제거, 동명 정류장 보류 및 TRA 구간 추출 |
| `python tools/mass-timetable-audit.py --resume` | 통과 | GTFS 3개, GTFS 레코드 4,163건, TRA ODS 23개 및 구간 레코드 1,854건. 기준 ID 9,128개와 감사 결과의 ID 집합 일치 |
| `node --max-old-space-size=6000 tools/timetable-inventory.mjs --compare-baseline` | 통과 | 6개국의 기존 등록·선택·경로 해석 수치와 기존 오류 15건이 기준과 일치 |
| `node tools/build-timetable-patterns.cjs`, `node tools/build-app-bundle.js` 및 JS 문법 검사 | 통과 | 신규 도야마 운행계통 생성과 앱 번들 재생성 |
| `node tools/test-timetable-browser.cjs` | 통과, 11개 | 6개국, 도야마 평일 구간운행 양방향 8역과 실제 선형, 전체 구간 각역정차 기본값 |
| 타이핑·IME·Free Drive·서비스 리졸버 회귀 | 통과, 21개 | 신규 계통 외 기존 지상·수상·철도 운행과 공통 게임 동작 |
| 전체 저장소 필수 빌드와 테스트 | 실패 | 기준 main에 있던 `validate-data.js` 오류 267건이 재현됨. 한국 버스 이름 검사는 통과한 뒤 같은 데이터 검사에서 중단됨 |

도야마 브라우저 검사에서 첫 시도는 중복 플랫폼 경계 때문에 정차역이 9개였다. 신규 계통의 선로 구간을 자르는 시점에 같은 출발역 ID의 연속 경계를 처리하고, 공식 정차열과 일치할 때만 해당 계통이 시작되도록 변경했다. 양방향 모두 정차역 8개와 실제 선형 30점을 확인했다.

2026-11-12 운영 Pages는 HTTP 200이었다. 운영 HTML에는 새 도야마 계통 스크립트가 없었다. 감사 PR을 초안으로 유지했다.

## 이전 감사 배치

| 검사 | 결과 | 범위 |
|---|---|---|
| `node --max-old-space-size=6000 tools/timetable-inventory.mjs --compare-baseline` | 통과 | 6개국과 9,128개 레코드. 기존 경로 해석 실패 15건과 국가별 등록·선택·주행 수가 기준과 같다. 한국 정규 공개 계통 및 대만·태국·영국에서는 선택 계통별 기종점과 정차열을 런타임 경로와 비교했다. 일본·홍콩 인벤토리의 해석은 대표 방향을 사용했다. |
| `node tools/build-taiwan.cjs` 및 기존 다국어 브라우저 증거로 보고서 재생성 | 통과 | 공개 카드 46개와 기존 패턴 505개를 유지했다. 새 방향 1개를 생성했다. |
| `node --max-old-space-size=9000 tools/build-kr-canonical.cjs --publish` | 통과 | 공개 노선 8,277개, 방향별 계통 18,103개, 거부 0건. 기존 공개 패턴 보존 검사도 통과했다. |
| `node tools/build-app-bundle.js`, `node --check js/app.bundle.js` | 통과 | 번들과 카탈로그 캐시 식별자 갱신. |
| `node --test tools/test-taiwan.cjs` | 통과, 13개 | 대만 정차열·한글 역명·선형·자유주행과 추가 계통의 통과역 제외. |
| `node --test tools/test-typing-model.js tools/test-ime-controller.js tools/test-free-drive-target-selection.cjs tools/test-free-drive-step-flow.cjs tools/test-hk-route-selector.cjs` | 통과, 20개 | 타이핑, IME, 자유주행 목표 전환 및 홍콩 노선 그룹. |
| `node tools/test-timetable-browser.cjs` | 통과, 9개 시나리오 | Chromium에서 6개국의 노선 선택과 게임 시작. 일본 모노레일, 한국 공항철도 2개 추가 계통·시내버스·수상버스, 홍콩 지하철, 대만 새 공항철도 계통, 태국 광역철도, 영국 지하철. |
| `TW_SCENARIO=tw-tymc-airport node tools/test-taiwan-browser.cjs` | 통과, 2개 완주 | 공항 급행 5회와 평일 아침 통과 보통 13회 타이핑 입력. 다안역 Free Drive에서 TAB으로 단수이신이선 환승도 확인했다. |
| 저장소 전체 `build` 및 `test` 스크립트 | 실패 | 필수 `tools/validate-data.js`에서 오류 267건. 기준 `main`과 작업 브랜치의 검사 로그 SHA-256이 동일했다. Windows 샌드박스에서 패키지 실행기의 심볼릭 링크 생성이 차단되어 스크립트 본문도 직접 실행했다. 소스 줄바꿈을 LF로 맞춘 재실행에서 한국 버스 이름 테스트는 통과했고, 다음 단계인 데이터 검사에서 중단됐다. |

기존 267건 중에는 중복 역 마스터 ID 오류가 포함된다. 기존 일본 15개 경로의 선형 해석 실패는 CSV의 `validation_error` 및 [baseline.json](baseline.json)에 있다. 태국 로더의 정규화 로그에는 일부 장거리·직통 계통의 호출역이 기본 물리 노선에 없다는 경고가 남지만, 계통별 리졸버 검사에서는 실패가 없었다. 전체 시간표 대조 및 모든 모드의 브라우저 완주는 아직 남아 있다.

Playwright는 프로젝트에서 사용하는 `PLAYWRIGHT_MODULE`과 설치된 Chrome 경로 `CHROME_PATH`로 실행했다. Taiwan 브라우저 테스트는 실제 UI의 한글 IME 조합 이벤트를 합성한다.

GitHub의 [PR #36](https://github.com/s3h0726/SUBTYPE/pull/36)은 초안이다. 운영 Pages는 HTTP 200을 반환했고 운영 데이터에서 두 AREX 단축 계통과 타오위안 평일 통과 계통의 ID가 없음을 확인했다.
