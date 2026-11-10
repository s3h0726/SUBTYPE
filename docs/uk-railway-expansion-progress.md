# United Kingdom railway expansion progress

Updated: 2026-11-11 (Asia/Seoul). **Substantial partial implementation; the full UK railway network is not complete.**

## Current measured inventory

| Metric | Repository value |
| --- | ---: |
| operators | 17 |
| lines | 44 |
| servicePatterns | 161 |
| playableDirections | 259 |
| uniqueStations | 1044 |
| uniquePhysicalStationGroups | 983 |
| koreanNamedStations | 1044 |
| sharedSegments | 2370 |

Station IDs count source records. Physical station groups reuse published TfL hubs and merge new identically named, identically localized records only within 500 metres. Different cities' stations with the same name remain separate. Korean coverage is editorial coverage, not a claim of official Korean translations.

| Line / passenger corridor | Source station IDs | Playable directions |
| --- | ---: | ---: |
| Bakerloo | 25 | 2 |
| Central | 49 | 10 |
| Circle | 36 | 2 |
| District | 60 | 14 |
| DLR | 45 | 10 |
| Elizabeth line | 43 | 19 |
| Hammersmith & City | 29 | 2 |
| Jubilee | 27 | 2 |
| Liberty | 3 | 2 |
| Lioness | 19 | 2 |
| Metropolitan | 35 | 8 |
| Mildmay | 29 | 4 |
| Northern | 52 | 16 |
| Piccadilly | 53 | 6 |
| Suffragette | 13 | 2 |
| Tram | 39 | 6 |
| Victoria | 16 | 2 |
| Waterloo & City | 2 | 2 |
| Weaver | 25 | 6 |
| Windrush | 29 | 8 |
| Edinburgh Trams | 23 | 2 |
| Glasgow Subway | 15 | 2 |
| Tyne and Wear Metro Green line | 31 | 2 |
| Tyne and Wear Metro Yellow line | 41 | 2 |
| Supertram Yellow route | 25 | 2 |
| Supertram Blue route | 33 | 2 |
| Supertram Purple route | 14 | 2 |
| Supertram Tram Train | 15 | 2 |
| Blackpool Tramway | 40 | 4 |
| East Coast Main Line · Lumo | 8 | 8 |
| West Midlands Metro | 33 | 4 |
| Manchester Metrolink | 99 | 20 |
| Merseyrail Northern line | 37 | 6 |
| Merseyrail Wirral line | 34 | 8 |
| Neilston line | 12 | 2 |
| East Kilbride line | 10 | 2 |
| Paisley Canal line | 7 | 2 |
| Shotts line | 20 | 2 |
| Edinburgh–Glasgow via Carstairs | 7 | 2 |
| Cathcart Circle | 11 | 2 |
| Newton line via Langside | 11 | 2 |
| East Coast Main Line · LNER | 27 | 50 |
| Hucknall–Toton Lane line | 36 | 2 |
| Phoenix Park–Clifton South line | 30 | 2 |

## Operating organisations

- London Underground — 런던 지하철
- KeolisAmey Docklands — 케올리스아메이 도클랜즈
- GTS Rail Operations — GTS 레일 오퍼레이션스
- First Rail London — 퍼스트 레일 런던
- Tram Operations Limited — 트램 오퍼레이션스
- Edinburgh Trams — 에든버러 트램
- Strathclyde Partnership for Transport — 스트래스클라이드 교통공사
- Nexus — 넥서스
- South Yorkshire Supertram — 사우스요크셔 슈퍼트램
- Blackpool Transport — 블랙풀 트랜스포트
- Lumo — 루모
- Midland Metro Limited — 미들랜드 메트로
- KeolisAmey Metrolink — 케올리스아메이 메트로링크
- Merseyrail — 머지레일
- ScotRail — 스코트레일
- London North Eastern Railway — 런던 노스이스턴 철도
- Nottingham Express Transit — 노팅엄 익스프레스 트랜싯

## Implementation batches and preserved baseline

- PR #33 introduced 9 organisations, 28 lines, 73 families, 129 directions, 657 station IDs, 605 physical groups and 1,504 segments. Report commit: 55fda6a9161e7138cfef42b76daf87908707d63c. Merge: 97d34ea5f9abf854645c5d2579b72faec4d8232e.
- London repair commit: 26abc3946. All 12 previously blocked TfL directions were restored. The original 129 pattern IDs, station sequences and segment references remain frozen and automatically checked.
- Repairs: import real track edges independently of incomplete stop membership; backtrack failed platform choices; consider 128 candidate vertices within the original 300 metre gate; explicitly anchor Heathrow T5 to documented OSM platform nodes 1508864707/254350058. No synthetic junctions or straight-line railway segments were added.
- Fresh District, DLR, Elizabeth and Northern TfL stopping sequences matched the preserved official source sequences on November 10. No London regular sequence remains blocked: 0.
- Regional expansion: Manchester Metrolink covers all 99 stops and current regular/part-day routes, including the Trafford Centre–Crumpsall service and Eccles variants. NET includes both lines, all 50 stops, and different northbound/southbound city loops. Blackpool includes direct coastal and North Station variants. West Midlands Metro includes both Wolverhampton termini; Millennium Point through-running remains excluded pending sufficient route evidence.
- National expansion includes Lumo, Merseyrail Northern/Wirral branches, seven ScotRail corridors, and LNER stopping patterns individually connected to real track nodes. Further operators are inventoried in the table above as they are released.
- Additional timetable comparison was stopped at the user's request. Previously completed LNER evidence remains reproducible reference data. Further expansion uses official network maps and source OSM route relations, with geometry and gameplay checks; it does not claim timetable certification.

## Validation actually observed

- Source-node/edge integrity, station coordinates, Korean names, service selection, endpoints and preserved baseline: see reports/uk/data-tests.json.
- Gameplay runs completed in reports/uk/browser-tests.json: 259; report status: FAIL. The full run completed its gameplay list but stopped on an additional UI assertion: AssertionError [ERR_ASSERTION]: uk-metrolink obscures typing area. The corrected independent UI run has status PASS.
- No new browser runtime errors recorded: yes.
- Existing country switch regression: jp 606 PASS; kr 8275 PASS; hk 105 PASS; th 23 PASS; tw 46 PASS.
- Free driving, edit propagation, English/Korean nameboards and mobile checks are recorded in the browser reports. Regional nameboard checks: 0.
- UK ranking identity test uses isolated guest data. No authenticated fabricated score is uploaded.
- Known pre-existing global issues remain separate: 267 legacy station-master duplicates, 40 previously blocked route-audit cases, and missing Ueno payload line-11229--jobansen-totte-iwaki.json. These are not claimed fixed by this expansion.

## Source accuracy and licensing

- Source archive and SHA-256 checksums: data/uk/source/manifest.json. OSM track geometry and station records: ODbL-1.0, © OpenStreetMap contributors. TfL official sequences retain their source attribution.
- Per-service evidence, expected calls, reviewed source relations and official URLs: data/uk/source/regional/release-evidence.json. Source geometry is shared by node-sequence hash. The existing lazy country/line loader and cached geometry pool are retained.
- LNER source call/track exclusions remain in data/uk/source/timetables/lner-track-review.json. Excluded records are not catalogue entries. No HS2, Eurostar or unverified cross-border service has been released.

## Git and deployment

- Working branch: feature/uk-railway-completion.
- Report predecessor HEAD: 26abc39464297c713b6cbe084ccecbe05e545066. The report's own commit can be found in Git history.
- Main integration of this expansion: pending.
- Production verification for this expansion: pending; actual public UI: pending.
- This section reflects reports/uk/release-status.json. The November 8 deployment is stored separately as previousRelease and is not evidence of this expansion's deployment.

## Precise remaining work

1. West Midlands Millennium Point services: source relations 20439814/20439815 exist, but complete passenger through-running and reversal assumptions are not released. Do not treat all track stop nodes as a certified stopping pattern.
2. Manchester early/late depot and short-turn variants beyond published regular services; Blackpool additional turnbacks; Edinburgh short turns; additional Tyne/Wear and Sheffield variants.
3. Remaining National Rail corridors/operators: South Western Railway, Southern, Southeastern, Greater Anglia, c2c, Chiltern, East Midlands Railway, West Midlands Railway/London Northwestern Railway, CrossCountry, Northern, TransPennine Express, Transport for Wales, Hull Trains, Grand Central and all unlisted branches of operators already present. Check the current inventory before adding any duplicate.
4. Remaining high-speed/international coverage: Southeastern HS1, Eurostar complete UK/Channel Tunnel/continental alignments, and international station localization. HS2 remains excluded until actual passenger operations are evidenced.
5. Continue Korean editorial review against established Korean references, preserve existing overrides, and add explicitly evidenced interchanges whose official English station names differ.
6. For each additional batch, preserve stable IDs, assemble only source railway node edges, run full direction gameplay and regressions, commit, push main and verify the public site. Source OSM API parent discovery returned HTTP 429 during this session; do not treat unavailable source data as permission to invent a route.
