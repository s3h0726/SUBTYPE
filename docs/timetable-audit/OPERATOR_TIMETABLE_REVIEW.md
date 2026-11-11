# 실제 운영사 시간표 대조 — 홍콩 트램 12방향·도야마 시내전차 6계통

기준일: **2026-11-12**. 본 문서는 실제 공식 시간표에 표시된 운행 기종점·첫차·막차 또는 정차열과 게임 데이터를 비교한다.
한국 버스는 검증하지 않았다. 본 비교는 *전체 시간표 검증 완료*와 다르며 기존의 완전 검증 11건을 임의로 증가시키지 않는다.

## 홍콩 트램 — 12개 운행 방향

운영사 원문: https://www.hktramways.com/en/schedules-fares/en/schedules-fares
운영사가 공표한 첫차·막차는 안내용으로, 개별 열차 시각 및 중간 정류장별 시각은 본 범위에서 검증하지 않았다.

| SUBTYPE ID | 구간 | 게임 기종점 | 평일 첫·막차 | 주말 첫·막차 | 상태 |
|---|---|---|---|---|---|
| `hk-tram-western-market-shau-kei-wan-4088321` | 샤우케이완 → 웨스턴마켓 | 40정류장, 일치 | 05:42–00:06 | 05:42–00:06 | 기종점 일치 |
| `hk-tram-western-market-shau-kei-wan` | 웨스턴마켓 → 샤우케이완 | 41정류장, 일치 | 06:40–00:06 | 06:40–00:06 | 기종점 일치 |
| `hk-tram-happy-valley-shau-kei-wan-4088517` | 해피밸리 → 샤우케이완 | 31정류장, 일치 | 06:29–00:00 | 06:29–00:00 | 기종점 일치 |
| `hk-tram-happy-valley-shau-kei-wan-4088518` | 샤우케이완 → 해피밸리 | 30정류장, 일치 | 05:46–23:15 | 05:46–23:15 | 기종점 일치 |
| `hk-tram-shek-tong-tsui-north-point-4088457` | 노스포인트 → 섹통추이 | 33정류장, 일치 | 05:50–23:00 | 05:50–23:00 | 기종점 일치 |
| `hk-tram-shek-tong-tsui-north-point-4088481` | 섹통추이 → 노스포인트 | 32정류장, 일치 | 05:00–22:05 | 05:00–22:05 | 기종점 일치 |
| `hk-tram-shek-tong-tsui-causeway-bay-4088086` | 코즈웨이베이 → 섹통추이 | 26정류장, 일치 | 07:30–19:00 | 09:30–19:30 | 기종점 일치 |
| `hk-tram-shek-tong-tsui-causeway-bay-4088087` | 섹통추이 → 코즈웨이베이 | 25정류장, 일치 | 06:45–18:15 | 08:45–18:45 | 기종점 일치 |
| `hk-tram-kennedy-town-happy-valley-3263757` | 케네디타운 → 해피밸리 | 31정류장, 일치 | 05:00–00:00 | 05:00–00:00 | 기종점 일치 |
| `hk-tram-kennedy-town-happy-valley-4088000` | 해피밸리 → 케네디타운 | 33정류장, 일치 | 05:45–00:45 | 05:45–00:45 | 기종점 일치 |
| `hk-tram-kennedy-town-shau-kei-wan-4088262` | 케네디타운 → 샤우케이완 | 51정류장, 일치 | 05:30–19:00 | 05:30–19:00 | 기종점 일치 |
| `hk-tram-kennedy-town-shau-kei-wan-4088263` | 샤우케이완 → 케네디타운 | 54정류장, 일치 | 07:00–19:10 | 07:00–19:10 | 기종점 일치 |

**결과:** 공식 6개 주요 운행구간의 양방향 12개 레코드가 게임 기종점과 일치. 단, 게임에 첫차·막차 시각을 실행 로직으로 반영한 것은 아니며, 전 정류장별 시간표·예외일·임시운행 검증은 남았다.

## 일본 도야마 지방철도 — 6계통

2026년 3월 14일 개정 공식 시간표: https://www.chitetsu.co.jp/?p=70984
평일 상행(남→북) 1·2계통과 순환 3계통의 실제 정차열을 게임과 비교했다. 4~6계통은 공식 노선 존재와 기종점을 확인했으며, 전체 열차별 정차열은 추가 검증이 필요하다.

| 게임 노선 | 게임 정차 수 | 공식에서 확인한 정차열 | 누락된 공식 정류장 | 게임 중복 | 판단 |
|---|---:|---:|---|---|---|
| `line-toyama-city-1` | 13 | 15 | 中町（西町北）, 電鉄富山駅エスタ前 | 없음 | 정차열 수정 필요 |
| `line-toyama-city-2` | 21 | 22 | 中町（西町北）, 電鉄富山駅エスタ前 | 富山 | 정차열 수정 필요 |
| `line-toyama-city-3` | 12 | 14 | 電鉄富山駅エスタ前 | 없음 | 정차열 수정 필요 |

※ C14(電鉄富山駅エスタ前)는 게임의 해당 노선 데이터에 해당 정류장 ID와 선형이 확인되지 않았다. 근거 없이 임의 좌표나 역 ID를 생성하지 않고, 정확한 실선로·정류장 매핑 확보 전에는 게임 정차열을 자동 변경하지 않는다.
※ 공식 정류장 C09(中町)는 방향별 정차 차이가 있으므로 위 대조는 남→북에 한정한다. 3계통의 첫 역이 게임에서는 丸の内로 순환 회전돼 있으며, 운행 방향 자체는 추가 검증해야 한다.

### 공식 기종점만 확인한 계통

| 게임 노선 | 운영사 표시 | 확인 범위 |
|---|---|---|
| `line-toyama-city-4` (27정차 레코드) | 岩瀬浜～南富山駅前 | route endpoints only; stop-by-stop pending |
| `line-toyama-city-5` (23정차 레코드) | 岩瀬浜～富山大学前 | route endpoints only; stop-by-stop pending; game duplicates C15 |
| `line-toyama-city-6` (44정차 레코드) | 岩瀬浜～環状線 | route existence checked; complete through-service trip chain pending |

## 변경 승인 기준

1. 중간역 누락/중복을 검증한 1·2·3계통은 **불일치**로 유지하고 전면 VERIFIED 처리하지 않는다.
2. 4~6계통은 노선 존재 확인까지만 인정하고 미완료로 남긴다.
3. 원문 PDF의 시간열·선로 좌표·운행 예외가 확정되기 전에는 신규 운행계통을 창작하거나 경로를 자동 병합하지 않는다.
4. 홍콩 트램의 기종점 대조는 기존 검증 레코드 수와 별도로 증거를 보존한다.

## 출처

- 홍콩 트램 공식 공고: https://www.hktramways.com/en/schedules-fares/en/schedules-fares
- 도야마 시내전차 전체 공고: https://www.chitetsu.co.jp/?p=70984
- 도야마 line-toyama-city-1 공식 정차열: https://www.chitetsu.co.jp/wp-content/uploads/2026/02/2398199bf8bd2d69b65457b87e4cc62d.pdf
- 도야마 line-toyama-city-2 공식 정차열: https://www.chitetsu.co.jp/wp-content/uploads/2026/02/2398199bf8bd2d69b65457b87e4cc62d.pdf
- 도야마 line-toyama-city-3 공식 정차열: https://www.chitetsu.co.jp/wp-content/uploads/2026/02/7a042e5a17a51de1989f2c493cbb1589.pdf
- 도야마 line-toyama-city-4 참고표: https://www.chitetsu.co.jp/wp-content/uploads/2026/02/51911fc1650255c2c2db48b4b5f728bb.pdf
- 도야마 line-toyama-city-5 참고표: https://www.chitetsu.co.jp/wp-content/uploads/2026/02/51911fc1650255c2c2db48b4b5f728bb.pdf
- 도야마 line-toyama-city-6 참고표: https://www.chitetsu.co.jp/wp-content/uploads/2026/02/51911fc1650255c2c2db48b4b5f728bb.pdf
