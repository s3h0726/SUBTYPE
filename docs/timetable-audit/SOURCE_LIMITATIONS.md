# 자료 범위 및 재실행

> **감사 범위 변경:** 한국 도로 버스(시내·마을·광역·공항·시외 버스 등)는 시간표 감사 대상에서 제외한다. 철도와 지하철은 유지하며 한강 수상교통은 도로 버스로 취급하지 않는다. 기존 전체 인벤토리는 참고용으로 보존하고, 감사 대상 CSV와 검증률은 제외 후 다시 계산한다.

기준은 `main`의 `ea4696898cf2fcb17d3278eda13766e9a1540e23`이다. GTFS 비교 기간은 2026-11-11부터 2026-12-10까지다. GTFS의 개별 운행과 빈도 템플릿을 각각 하나의 원본 레코드로 집계했다. 템플릿을 실제 출발 횟수로 환산하지 않았다. 국경을 넘는 모든 운행, 다음 개정판, 향후 임시 공사·우회는 해당 운영기관 자료로 별도 확인이 필요하다.

- **JP** 도야마 GTFS에는 6개 등록 카드와 연결되는 공식 하위 계통 17개가 있다. 일부 장거리 트램 계통은 서로 다른 정차장 또는 본선 분기 참조를 사용해 대조 결과를 보류했다. 다른 철도 운영사는 ODPT 또는 개별 운영기관 자료가 필요하다.
- **KR** 철도·지하철·공항철도·광역철도·일반철도·고속철도만 시간표 감사한다. 한국 버스 데이터는 검증·수정·중복 후보 추출에서 제외하며 기존 게임 카탈로그는 보존한다. 한국 공항철도 기존 PR의 두 신규 계통은 별도 공식 역별 표로 확인했다.
- **HK** 교통서 GTFS에서 홍콩 트램과 피크트램을 비교했다. MTR 지하철·경전철은 이 파일의 시간표 범위에서 빠져 있다. 피크트램은 예약·요청 정차 운영 조건을 추가 확인해야 한다.
- **TW** TRA ODS는 구간 단위 시간표다. 구간 정차열을 열차번호로 대조하되, 일부 구간 일치만으로 전체 직통 또는 요일 예외가 검증됐다고 판단하지 않았다. TDX 접근과 전체 계통 연결 및 달력 대조가 남아 있다.
- **TH** OTP Namtang에서 도시철도와 SRT 열차번호를 대조했다. 일부 태국어 정차장과 서로 다른 터미널 표기, 운영기관 현재표와 차이가 있는 정차열은 자동 반영을 보류했다.
- **UK** Network Rail eNRT 및 TfL의 공식 자료 경로를 확인했다. 영국의 완전한 노선별 시간표 대조에는 원본별 어댑터와 일치 확인이 남아 있다.

각 등록 ID의 결과와 다음 확인 출처는 [MASS_AUDIT_RESULTS.csv](MASS_AUDIT_RESULTS.csv) 및 [UNVERIFIED_ROUTES.csv](UNVERIFIED_ROUTES.csv)에 있다. [TIMETABLE_SOURCES.csv](TIMETABLE_SOURCES.csv)는 파싱과 출처 확인을 구분하고, 실제 사용한 파일의 SHA-256을 기록한다. 원본 ZIP/ODS와 정규화한 여행 레코드는 로컬 캐시에 저장한다. Pages 빌드는 해당 캐시를 제외한다.

정차 ID가 같은 순서 또는 역순인 후보는 293그룹, 612개 레코드다. 운영사·여객 계통과 저장 기록 참조의 일치가 확인될 때까지 그대로 유지한다. [동일·역순 후보](ROUTE_DUPLICATE_CANDIDATES.csv)

## 실행

Node.js 22 이상, Python 3.11 이상이 필요하다. 감사일과 기준 커밋을 고정한 스냅샷은 현재 작업본에 반영된 신규 계통을 기준 목록에 섞지 않는다.

```sh
node --max-old-space-size=6000 tools/timetable-inventory.mjs --snapshot=.cache/timetable-audit/baseline --base=ea4696898cf2fcb17d3278eda13766e9a1540e23 --exclude-korean-buses
python tools/mass-timetable-audit.py --as-of=2026-11-11 --days=30 --resume --fetch
python tools/test_mass_timetable_audit.py
node tools/build-timetable-patterns.cjs
node tools/build-app-bundle.js
```

`--country=jp`처럼 국가를 지정하면 해당 스냅샷만 다시 만든다. `--fetch`는 캐시에 없는 공개 원본을 순차적으로 가져온다. 게시자가 배포한 자료를 별도로 받은 경우 `.cache/timetable-audit/<source-id>.zip`과 `.cache/timetable-audit/tw-tra/<file>.ods`에 넣을 수 있다. `--resume`은 원본 해시·스냅샷·어댑터 코드·비교기간이 동일할 때 국가 체크포인트를 재사용한다. 각 국가 파일을 원자적으로 기록하며, 기준 인벤토리 내용이 바뀌면 기존 CSV를 덮어쓰지 않는다.
