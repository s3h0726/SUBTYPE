# UK railway operating timetable audit — 2026-11-12

Branch: audit/six-country-timetables. **UK baseline before this batch: 56 route cards, 284 playable directions.** After the verified short-turn implementation: **56 cards, 291 playable directions, 183 service families**.
This report documents source evidence and actual implementation, not complete schedule certification. The UK catalogue is independent from Korean road buses (excluded from the six-country audit).

## Checked against current official operator data

| Operator / route | Game scope | Operator source | Finding | Action |
|---|---|---|---|---|
| Nottingham Express Transit: Hucknall–Toton Lane | 2 normal directions | https://www.thetram.net/timetables | Operator lists weekday/Sunday late services terminating at Wilkinson Street, Nottingham Station and Shipstone Street | Add 3 shortened playable patterns |
| Nottingham Express Transit: Phoenix Park–Clifton South | 2 normal directions | https://www.thetram.net/timetables | Operator lists late services terminating at Wilkinson Street, Nottingham Station and Shipstone Street | Add 3 shortened playable patterns |
| Edinburgh Trams | 2 normal directions, 23 stops | https://edinburghtrams.com/plan-journey/timetables | Early 04:26 Gyle Centre → Newhaven trip; daytime full-length runs also present | Add one early service |
| Glasgow Subway | Inner and Outer loop, 15 stops | https://www.spt.co.uk/travel-with-spt/subway/maps-stations/ and https://www.spt.co.uk/subway/subway-timetables/ | Current game patterns match official 15-stop clockwise Outer and anticlockwise Inner circles; published Sunday opening differs from Mon–Sat | No added patterns; timetable reviewed (not full day-by-day verification) |
| Elizabeth line | 19 patterns | https://tfl.gov.uk/plan-a-journey/timetables/elizabeth-line-timetables | TfL official Heathrow branch: 6 trains/h, 4 T4 and 2 T5. Precise train-by-train calendar and all 19 game patterns not yet compared | Retain partial status; do not invent short turns |
| Heathrow Express | 1 registered direction | https://www.heathrowexpress.com/timetable | The operator publishes regular Paddington ↔ Heathrow T5 in both directions; game has Heathrow T5 → Paddington only | **Confirmed missing Paddington → Heathrow direction**; do not reverse unverified one-way OSM track |
| Tyne and Wear Metro Green | 2 directions | https://www-azure.nexus.org.uk/metro/timetables-and-stations/airport/timetable | Airport departure board confirms scheduled South Hylton trains | Terminal verified only; train-specific calls pending |
| South Yorkshire Supertram Yellow | 2 directions | https://www.travelsouthyorkshire.com/en-gb/timetabledetails/1996d28e-8689-453a-8426-328cde2a1f4c | Official route endpoints Middlewood and Meadowhall Interchange match game; October 24–31 2026 temporary changes are historical as of this audit date | Normal route kept; dates of diversions tracked |

## Seven new source-confirmed selectable patterns

Source time is **first/last departure from the named origin** in the operator's table, NOT a synthesized full timetable, nor live availability.

| Physical route | New service | Mon–Sat departure | Sunday departure | Source |
|---|---|---|---|---|
| Hucknall–Toton | Hucknall → Wilkinson Street | 01:10 | 00:10 | NET |
| Hucknall–Toton | Hucknall → Nottingham Station | 00:15 | 23:15 | NET |
| Hucknall–Toton | Toton Lane → Shipstone Street | 01:05 | 00:05 | NET |
| Phoenix Park–Clifton | Phoenix Park → Wilkinson Street | 00:56 | 23:56 | NET |
| Phoenix Park–Clifton | Phoenix Park → Nottingham Station | 00:15 | 23:15 | NET |
| Phoenix Park–Clifton | Clifton South → Shipstone Street | 00:48 | 23:48 | NET |
| Edinburgh Trams | Gyle Centre → Newhaven | 04:26 | 04:26 | Edinburgh Trams |

The pattern generator slices verified **existing forward train track sequences** and reuses exact OSM segment IDs. It creates no new route coordinates. The operator source, observed first/last time, origin, direction, and provenance are embedded in each new pattern.

**Important:** A route's status is not upgraded to fully VERIFIED solely from a terminal or selected first/last departure comparison. Other UK patterns and all calendar exceptions remain subject to further checks. For the overall six-country audit, the 11 fully verified records remain unchanged until complete audited evidence is available.

## UK 56-route audit register

The CSV [UK_ROUTE_AUDIT_56.csv](UK_ROUTE_AUDIT_56.csv) lists every currently registered UK route: **9 operator-reviewed/partially compared route cards** and **47 still requiring operator-timetable comparison**. This is a conservative status matrix, not a claim that all 56 routes were schedule verified.

TfL's [current 17 May–12 December 2026 Elizabeth line timetable](https://content.tfl.gov.uk/elizabeth-line-17-may-12-december-2026.pdf) was located and scoped. One published weekday train's complete 14-stop timing column now matches game direction `uk-osm-5793620`. The other 18 directions and all remaining individual trains/holiday exceptions are not yet verified; the 19 original Elizabeth pattern identities remain unchanged.

## Confirmed but not yet implemented: Heathrow Express return direction

Heathrow Express official timetable states trains operate **London Paddington → Heathrow Terminals 2 & 3 → Heathrow Terminal 5**, as well as **Heathrow Terminal 5 → Heathrow Terminals 2 & 3 → London Paddington**. The current SUBTYPE `uk-heathrow-express` route has only `uk-osm-9917743` for the second of those directions. An actual Paddington→Heathrow track relation/platform alignment must be sourced and tested before release. Creating a purely reversed geometry without source-edge proof would violate the existing UK railway integrity rules.

## 추가 대조: 맨체스터 메트로링크 20방향·엘리자베스선 실제 열차 1편성

검토일: 2026-11-12. 원문은 [TfGM Metrolink 운영시간·운행구간](https://tfgm.com/plan-a-journey/schedules/tram-schedule), [TfGM 공식 노선도](https://tfgm.com/ways-to-travel/tram/network-map), [TfL 2026-05-17~2026-12-12 Elizabeth line 공식 시간표 PDF](https://content.tfl.gov.uk/elizabeth-line-17-may-12-december-2026.pdf)를 이용했다.

### TfGM: 20개 기존 계통에 공식 운행 시간대 규칙 반영

- **전일 운행 10방향**: Rochdale–East Didsbury, Manchester Airport–Victoria, Bury–Ashton, Altrincham–Etihad Campus, Trafford Centre–Crumpsall (5개 왕복 계통)
- **부분 시간대 6방향**: Altrincham–Bury, Shaw and Crompton–East Didsbury, MediaCityUK–Piccadilly (평일 07:00–20:00, 토 09:00–18:30, 일·공휴일 정규 운행 없음)
- **Eccles–Piccadilly 비경유 2방향**: 같은 부분 시간대에 MediaCityUK를 경유하지 않음
- **Eccles–Piccadilly 경유 2방향**: 상기 시간대 밖에 MediaCityUK 경유
- TfGM 일반 운행 시간(월~목 06:00–24:00, 금·토 06:00–익일 01:00, 일·공휴일 07:00–24:00)과 계통당 기본 15분 간격은 **운영 안내값**이다. 출발 열차별 확정 시각은 아니다.

기존 게임의 역·노선·20방향은 그대로 두고 각 실제 운영패턴과 선택 서비스에 \`officialSchedule\`을 기입했다. 실운행 요일, 구간운행 여부, 미디어시티 경유 조건을 나중에 게임 UI가 사용할 수 있는 구조지만 **현 단계에서 현재 시각에 따라 선택권을 제한하지 않는다**.

### TfL: 실제 평일 열차 정차 시각 대조

2026-05-17~2026-12-12 적용 공식 PDF 인쇄 **2쪽**, 'Elizabeth line – Westbound – Mondays to Fridays' 표에 있는 04:44 Shenfield 출발 → 05:27 Liverpool St (surface platforms 15–17) 도착 열차:

| 역 | 공식 시간 |
|---|---|
| Shenfield | 04:44 |
| Brentwood | 04:48 |
| Harold Wood | 04:52 |
| Gidea Park | 04:55 |
| Romford | 04:58 |
| Chadwell Heath | 05:01 |
| Goodmayes | 05:03 |
| Seven Kings | 05:05 |
| Ilford | 05:09 |
| Manor Park | 05:11 |
| Forest Gate | 05:15 |
| Maryland | 05:17 |
| Stratford | 05:19 |
| Liverpool Street (surface) | 05:27 |

SUBTYPE \`uk-osm-5793620\` 14역 정차 순서와 **14/14 일치**. 해당 1개 운행 증거를 \`officialTrainSample\`로 기록하고 실제 시각을 정차역 이름에 결합했다. 나머지 18개 방향과 날짜별 전체 열차 시간표는 아직 일치 판정을 내리지 않았다.

### 검증 범위의 제한

이번 결과로 영국 전체 노선 56개 중 운영사 시간표와 일부 대조한 노선은 9개다. 47개는 별도 일정 확보가 필요하다. **완전 시간표 검증(전 열차·전 운행일·예외일)은 영국 56개 중 0개**이며 기존 6개국 전체 11 VERIFIED 기록은 변경하지 않았다. 기존 영국 **291개 방향**과 인프라를 모두 유지한다.

## Reproducibility and release rules

- Run: \`node tools/apply-uk-verified-shortturns.cjs\`.
- Verify: \`node --test tools/test-uk-verified-shortturns.cjs\`.
- \`tools/build-uk-regional.cjs\` invokes the same idempotent function so a UK data rebuild does not silently discard the seven services.
- Route IDs, station IDs, track segments, geometry partitions and original operating services must be preserved.
- This PR remains Draft until the full UK route selector/playability regressions and pre-existing legacy data errors are addressed.
