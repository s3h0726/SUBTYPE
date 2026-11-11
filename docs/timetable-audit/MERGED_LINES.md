# 노선 통합

이번 감사에서 근거가 충분한 신규 통합은 없었다.

| Country | Operator | Original Routes | Consolidated Route | Reason for Merge | Service Patterns Preserved | Evidence |
|---------|----------|-----------------|--------------------|------------------|----------------------------|----------|

## 검토 후 보류한 후보

| 국가 | 운영사 | 기존 노선 ID | 검토 결과 | 근거 |
|---|---|---|---|---|
| JP | 게이세이·세이부·오다큐 | `line-23006` / `famous-express-skyliner`, `line-22007` / `famous-express-redarrow`, `line-25001` / `famous-express-romancecar` | 물리 정차역 목록을 공유한다. 실제 정차열, 브랜드 및 저장된 특급 기록의 이관을 추가 검토해야 한다. | [특급 생성 규칙](../../js/famous-limited-express.js), [공유 정차열](ROUTE_TIMETABLE_AUDIT.csv) |
| HK | MTR | `hk-airport-express-dt`, `hk-airport-express-ut` | 이미 같은 Airport Express 카드에서 방향별 계통으로 표시된다. 물리 레코드 변경에 필요한 방향별 저장 기록과 지오메트리 참조 이관을 확인하지 못했다. | [MTR 시간표](https://www.mtr.com.hk/en/customer/services/timetable_index.html) |
| TH | SRTET | `th-srtet-darkred`, `th-srtet-lightred` | 같은 Red Line 브랜드 아래에서 Krung Thep Aphiwat 환승이 필요한 별도 운행이다. | [SRTET FAQ](https://www.srtet.co.th/th/faq) |

기준 CSV의 `shared_sequence`는 전체 정류장 ID 순서가 같거나 역순인 후보를 표시한다. HK 72개, JP 6개, KR 534개 레코드가 해당한다. 정차열 일치는 별칭, 중복 카드, 동일 여객 계통 중 어느 것도 단독으로 입증하지 않는다. 일본의 기존 저장 ID 별칭은 `data/japan-duplicate-route-aliases.json` 및 `js/feature-flags.js`에 남아 있다.
