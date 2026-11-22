# United Kingdom railway expansion progress

## National Railway Mega Expansion III

Latest batch baseline: 9bfe2421d886ecc5cf51e009e151029c5c5d5aac. Every one of its 673 directions is protected by station, service and geometry-reference hashes.

| Metric | Before this batch | Added | Final |
| --- | ---: | ---: | ---: |
| Operating organisations | 36 | 0 | 36 |
| Lines / corridors | 167 | 10 | 177 |
| Service pattern families | 390 | 17 | 407 |
| Playable directions | 673 | 28 | 701 |
| Station IDs | 2569 | 90 | 2659 |
| Physical station groups | 2264 | 86 | 2350 |
| Shared track segments | 5778 | 210 | 5988 |

This batch adds Romsey loop, Farnham–Guildford, Portsmouth via Eastleigh, Buxton, Settle–Carlisle, Severn Beach (including Weston-super-Mare through journeys), St Ives Bay, Regatta/Henley, Atlantic Coast and Hertford East, and independently sourced Avanti outward directions. New directions retain individual stop lists; some branch coverage remains partial.

| New or extended corridor | Added directions | Independent passenger relation IDs |
| --- | ---: | --- |
| Romsey loop via Eastleigh and Southampton | 2 | 172798, 19786853 |
| Farnham–Guildford branch | 2 | 8763249, 8763250 |
| Portsmouth via Eastleigh | 2 | 2463076, 8845998 |
| Buxton line | 2 | 9530104, 9530105 |
| Severn Beach line | 4 | 167218, 21103790, 21105147, 21105148 |
| St Ives Bay line | 4 | 21378577, 21378576, 285806, 21378578 |
| Regatta line to Henley-on-Thames | 2 | 917536, 11579248 |
| Atlantic Coast line | 2 | 3822453, 21419558 |
| Hertford East branch | 2 | 9107254, 9107253 |
| West Coast Main Line Manchester branches | 3 | 6345555, 6345556, 6345557 |
| West Coast Main Line Liverpool branch | 1 | 6346054 |
| Settle–Carlisle line | 2 | 9902815, 9902816 |

Targeted comparisons use current official SWR 12/23/25, Northern 20, Avanti May–December 2026, GWR branch publications and Greater Anglia passenger information. This is service data integration, not certification of every train or an exhaustive re-audit of the existing catalogue.
Machine-readable reviewed calls, source URLs, sample columns, downloaded-PDF checksums and blocked candidates: data/uk/source/national/expansion-iii-service-review.json. Reimport with node tools/import-uk-reviewed-batch.cjs <review.json> <original-snapshot-directory>, then pack and build.

Latest batch blockers: gwr-st-ives — Official K5 has once-daily Lelant Saltings calls, but these source tracks lack a named stop-position. Explicit 3/4-call patterns are partial station coverage.
Resolved topology: gwr-atlantic-coast / 21419558 — Use the existing reviewed source graph assembler on this independent return relation. All seven original stop node IDs match exact graph vertices, maximum offset 0 km; no synthetic edge and no automatic reversal of the outward service.

## Cumulative expansion since Mega Expansion II

Source review through 2026-11-18. This is a partial British railway catalogue.
Baseline: 520e00ec0 (all 284 directions checked for preserved route, station and geometry references).

| Metric | Before | Added | Final |
| --- | ---: | ---: | ---: |
| Operating organisations | 21 | 15 | 36 |
| Lines / corridors | 56 | 121 | 177 |
| Service pattern families | 176 | 231 | 407 |
| Playable directions | 284 | 417 | 701 |
| Station IDs | 1146 | 1513 | 2659 |
| Physical station groups | 1065 | 1285 | 2350 |
| Shared track segments | 2588 | 3400 | 5988 |

The totals include seven directions added independently on main in PR #36.

Korean localisation: 2659/2659 station IDs. These are editable Korean editorial names. Original English names and existing user overrides are preserved.
Physical groups include nearby records that share the same reviewed English and Korean names and existing TfL interchange identifiers. Track geometry is reused by its original OSM node sequence and loaded in cached geographic partitions.

## Current operating organisations

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
- Nottingham Trams Limited — 노팅엄 트램스
- Avanti West Coast — 아반티 웨스트 코스트
- Greater Thameslink Railway — 그레이터 템스링크 철도
- Great Western Railway — 그레이트 웨스턴 철도
- Heathrow Express — 히스로 익스프레스
- West Midlands Trains — 웨스트미들랜즈 트레인스
- TransPennine Express — 트랜스페나인 익스프레스
- Grand Central — 그랜드 센트럴
- Lumo (First Rail Stirling) — 루모 (퍼스트 레일 스털링)
- Transport for Wales — 트랜스포트 포 웨일스
- Southeastern — 사우스이스턴
- South Western Railway — 사우스웨스턴 철도
- Greater Anglia — 그레이터 앵글리아
- c2c — C2C
- Chiltern Railways — 칠턴 철도
- East Midlands Railway — 이스트미들랜즈 철도
- CrossCountry — 크로스컨트리
- Northern — 노던
- Caledonian Sleeper — 칼레도니언 슬리퍼
- Eurostar — 유로스타

## This phase by operator and corridor

| Operating organisation | Added or extended corridor | Direction IDs added |
| --- | --- | ---: |
| West Midlands Trains | London Northwestern · West Coast Main Line | 4 |
| West Midlands Trains | London Northwestern · Northampton and Coventry corridor | 4 |
| ScotRail | Inverclyde Line | 4 |
| ScotRail | Ayrshire Coast Line | 6 |
| ScotRail | Argyle Line | 10 |
| ScotRail | Glasgow–Lanark Line | 2 |
| ScotRail | Glasgow South Western Line | 10 |
| TransPennine Express | TransPennine · Anglo-Scottish corridor | 4 |
| Grand Central | Grand Central · North East route | 2 |
| Lumo (First Rail Stirling) | Lumo · Stirling–London | 2 |
| ScotRail | Maryhill Line | 2 |
| ScotRail | North Clyde Line | 8 |
| ScotRail | Far North Line | 2 |
| ScotRail | Kyle of Lochalsh Line | 2 |
| ScotRail | Aberdeen–Inverness Line | 4 |
| ScotRail | West Highland Line | 4 |
| ScotRail | East Lothian corridor | 4 |
| ScotRail | Cumbernauld–Falkirk corridor | 4 |
| ScotRail | Dunblane Line | 2 |
| ScotRail | Alloa Line | 2 |
| ScotRail | Edinburgh–Glasgow via Falkirk High | 2 |
| ScotRail | Fife and Tay corridors | 10 |
| ScotRail | East Coast Main Line · Edinburgh and Aberdeen | 8 |
| ScotRail | Glasgow–Dundee–Aberdeen corridor | 4 |
| ScotRail | Highland Main Line | 4 |
| ScotRail | Borders Railway | 2 |
| Transport for Wales | Ebbw Valley and Maesteg lines | 4 |
| Transport for Wales | Conwy Valley Line | 4 |
| Transport for Wales | Cardiff Bay Line | 4 |
| Transport for Wales | Rhymney and Vale of Glamorgan lines | 8 |
| Transport for Wales | Coryton and Penarth lines | 2 |
| Transport for Wales | Rhondda Line | 2 |
| Transport for Wales | Cambrian Coast Line | 2 |
| Transport for Wales | West Wales Lines · Pembroke Dock | 2 |
| Southeastern | South Eastern Main Line · Grove Park corridor | 2 |
| Southeastern | Bromley North Line | 2 |
| South Western Railway | South West Main Line | 6 |
| South Western Railway | Portsmouth Direct Line | 2 |
| South Western Railway | Lymington Branch Line | 2 |
| South Western Railway | West of England Main Line | 2 |
| South Western Railway | Alton Line | 2 |
| South Western Railway | Shepperton Branch Line | 2 |
| South Western Railway | Ascot–Aldershot corridor | 2 |
| Greater Thameslink Railway | Southern · Uckfield Line | 4 |
| Southeastern | Hayes Line | 2 |
| Southeastern | Hastings Line | 2 |
| Southeastern | Chatham Main Line | 6 |
| Southeastern | South Eastern Main Line · Kent | 4 |
| Southeastern | Medway Valley Line | 2 |
| Southeastern | High Speed 1 · Kent Javelin | 6 |
| Greater Anglia | Great Eastern Main Line | 2 |
| Greater Anglia | Stansted Express | 2 |
| Greater Anglia | West Anglia Main Line | 2 |
| Greater Anglia | East Suffolk Line | 2 |
| Greater Anglia | Breckland Line | 2 |
| c2c | London, Tilbury and Southend line | 6 |
| Chiltern Railways | Chiltern Main Line | 8 |
| Chiltern Railways | Oxford–Bicester corridor | 6 |
| Chiltern Railways | London–Aylesbury lines | 6 |
| Chiltern Railways | Stratford-upon-Avon branch | 2 |
| East Midlands Railway | Midland Main Line | 4 |
| East Midlands Railway | Liverpool–Norwich corridor | 2 |
| East Midlands Railway | Poacher Line | 2 |
| East Midlands Railway | Derwent Valley Line | 2 |
| East Midlands Railway | Lincolnshire regional corridors | 6 |
| West Midlands Trains | Cross-City Line | 4 |
| West Midlands Trains | Stourbridge Town branch | 2 |
| West Midlands Trains | Abbey Line | 2 |
| West Midlands Trains | Marston Vale Line | 2 |
| CrossCountry | CrossCountry · Birmingham–Stansted corridor | 2 |
| CrossCountry | CrossCountry · Nottingham–Cardiff corridor | 2 |
| CrossCountry | CrossCountry · Manchester–Bournemouth corridor | 2 |
| Northern | Tyne Valley Line | 2 |
| Northern | Tees Valley Line | 4 |
| Northern | Esk Valley Line | 2 |
| Northern | Cumbrian Coast and Furness lines | 2 |
| Northern | Windermere branch | 2 |
| Northern | Liverpool–Manchester via Earlestown | 2 |
| Northern | Crewe–Manchester corridor | 8 |
| Northern | South Fylde Line | 2 |
| Transport for Wales | Heart of Wales Line | 2 |
| Transport for Wales | Cambrian Main Line | 4 |
| Transport for Wales | North Wales Coast Line | 4 |
| Transport for Wales | Welsh Marches Line | 6 |
| Transport for Wales | Severn Estuary Line | 2 |
| Transport for Wales | West Wales Lines · Fishguard and Milford Haven | 4 |
| Great Western Railway | Great Western Main Line · Bristol and South Wales | 8 |
| Great Western Railway | Reading–Taunton line · Penzance and Frome | 4 |
| Great Western Railway | Cotswold Line | 4 |
| Great Western Railway | North Downs Line | 4 |
| Great Western Railway | Reading–Basingstoke Line | 2 |
| Great Western Railway | Greenford Branch Line | 2 |
| Great Western Railway | Marlow Branch Line | 2 |
| Great Western Railway | Slough–Windsor branch | 2 |
| Great Western Railway | Avocet and Riviera lines | 4 |
| Great Western Railway | Dartmoor Line | 2 |
| Great Western Railway | Tarka Line | 2 |
| Caledonian Sleeper | Lowland Sleeper | 4 |
| West Midlands Trains | Camp Hill Line | 2 |
| West Midlands Trains | Snow Hill Lines | 8 |
| West Midlands Trains | Chase Line | 2 |
| West Midlands Trains | Birmingham–Shrewsbury line | 4 |
| West Midlands Trains | Birmingham–Hereford via Worcester | 4 |
| West Midlands Trains | Coventry–Leamington and Coventry–Nuneaton lines | 2 |
| West Midlands Trains | London Northwestern · Liverpool–Birmingham corridor | 4 |
| Northern | Sheffield–Lincoln line | 2 |
| Transport for Wales | Borderlands Line | 2 |
| Greater Thameslink Railway | Southern · Marshlink and East Coastway | 2 |
| Eurostar | Eurostar · London–Paris via the Channel Tunnel | 2 |
| Eurostar | Eurostar · London–Brussels via the Channel Tunnel | 2 |
| Eurostar | Eurostar · London–Amsterdam via Brussels and Rotterdam | 2 |
| South Western Railway | Romsey loop via Eastleigh and Southampton | 2 |
| South Western Railway | Farnham–Guildford branch | 2 |
| South Western Railway | Portsmouth via Eastleigh | 2 |
| Northern | Buxton line | 2 |
| Great Western Railway | Severn Beach line | 4 |
| Great Western Railway | St Ives Bay line | 4 |
| Great Western Railway | Regatta line to Henley-on-Thames | 2 |
| Great Western Railway | Atlantic Coast line | 2 |
| Greater Anglia | Hertford East branch | 2 |
| Northern | Settle–Carlisle line | 2 |

## Validation and production

- Route resolver, stable IDs, Korean names, geographical station bounds, directional endpoints and original OSM edges: PASS.
- Browser: 701 complete directions, including all baseline directions; no runtime errors in the passing runs.
- Free driving: 701 directions, 9665 station transitions.
- Other countries: jp 607 PASS, kr 8275 PASS, hk 105 PASS, th 23 PASS, tw 46 PASS, fr 69 PASS, mo 3 PASS.
- Mobile signs, editor and cached geometry: PASS.
- Leaderboard identity: PASS.
- Implementation commit: 23612cf4fd383dfa0d6a73236013998c66d15cd2. Batches: 2276e770a, 192f36c99, d16f67c33, 3a078e5a8, 63334e03f, 1803d5386, 23612cf4fd383dfa0d6a73236013998c66d15cd2, f4d255eba2943a00c7a01df17da6fd89562e591e, 4ac4dc6905f622b12bfeb827007318d1c60643ba, e2751176b2a5db8275d9d5b57bed933956e4b377.
- UK GitHub Actions: PASS — https://github.com/s3h0726/SUBTYPE/actions/runs/45027270726.
- Main integration: 701 directions integrated into main at 23612cf4fd383dfa0d6a73236013998c66d15cd2; subsequent v0.15.0 release preserves the same UK data.
- GitHub Pages: PASS, checked 2026-11-22T13:32:00.232Z — https://s3h0726.github.io/SUBTYPE/.
- Public browser journeys: uk-swr-romsey (13 stops), uk-northern-buxton (15 stops), uk-northern-settle-carlisle (19 stops), uk-gwr-atlantic-coast (7 stops), uk-greater-anglia-hertford (12 stops), uk-avanti-liverpool (6 stops).

## Sources and reproducibility

- Completed service IDs, ordered calls and operator evidence are in data/uk/source/national/expansion-ii.json. Operator identities are recorded in data/uk/operator-evidence.json.
- Archived OSM snapshots and their uncompressed SHA-256 checksums are in data/uk/source/manifest.json. Geofabrik extracts retain OSM node IDs, way IDs, versions and ordered relation membership. © OpenStreetMap contributors, ODbL-1.0.
- Services use individually reviewed passenger relations and official operator or authority maps. This expansion did not repeat an exhaustive timetable comparison.
- The existing UK selection, typing, editable Korean names, ranking, regional nameboards and free drive remain in the same application.

## Remaining candidate queue

Resume from data/uk/source/national/expansion-ii-queue.json. Only candidates represented in the generated catalogue are playable.

| Priority | Operator / network | Remaining corridor | State and next verification |
| --- | --- | --- | --- |
| A1 | South Western Railway | Windsor, Kingston, Chessington, Island Line and Portsmouth variants | partial — Romsey loop, Farnham–Guildford and Portsmouth via Eastleigh added (6 directions). Windsor, Kingston, Chessington and Island Line remain. Chessington 8646998 ends at Tolworth; Portsmouth direct fast pair still has conflicting Farncombe calls. |
| A1 | Southern / Gatwick Express | Brighton Main Line, Gatwick Express and Coastway branches | pending — Uckfield and Marshlink/East Coastway added. Remaining source relationships need complete ordered directions and passenger stops. |
| A1 | Southeastern | More London Metro and Kent patterns | pending — Hayes–Charing Cross snapshot omits Waterloo East; Victoria–Orpington relations truncate at Herne Hill. Main line and other branches added |
| A1 | Greater Anglia / Stansted Express | Hertford East, rural branches, other regular airport calls | partial — Hertford East both directions added with distinct reviewed calls (outward passes Waltham Cross). Stratford–Meridian Water still has disconnected source ways; further Ely patterns need call review. |
| A1 | c2c | Other distinct regular variants | pending — All three operator route families added, via Basildon, Ockendon and Rainham |
| A1 | Chiltern Railways | Further through-running and express variants | pending — Main, Aylesbury, Oxford and Stratford corridors added; retain separate verified stopping patterns |
| A2 | East Midlands Railway | Remaining regional branches | pending — Main intercity and key east–west/regional corridors added |
| A2 | West Midlands Railway / London Northwestern Railway | Further local branches and express variants | pending — Main regional corridors added. Walsall–Wolverhampton 20188633 has unnamed stop 1870159460 and asymmetric calls |
| A2 | CrossCountry | North East–South West, Birmingham–Stansted and Wales | pending — Check exact calls of archived relations 21116357 and 21116358. Leeds stop nodes lack names; connect only source track |
| A3 | Northern | Northumberland, Settle–Carlisle, Hope Valley, Manchester and other branches | partial — Buxton and Settle–Carlisle added in both directions; Leeds source stop 6589429702 identified at the real platform. Hope Valley, Mid-Cheshire, Morecambe and Glossop/Hadfield remain. Northumberland sources omit new stations; do not release them as current all-stations services. |
| A3 | TransPennine Express | South TransPennine and remaining North routes | pending — 237386/4234434 have connected tracks and valid Cleethorpes/Dore platform nodes. Chinley is absent from the current operator station directory, so verify a current calling pattern before release. |
| A3 | Hull Trains / Grand Central | Hull and Bradford branches | pending — Verify both directions and their real ordered calls from an operator-supported source |
| A4 | Transport for Wales | Remaining valley variants and local branches | pending — Borderlands and major cross-border links added. Aberdare–Merthyr 195448/20622496 still needs current through-service evidence. |
| A4 | Great Western Railway | Further local and night services | partial — Severn Beach including Weston through journeys, St Ives 3/4-call patterns, Henley and both Atlantic Coast directions added. Newquay return 21419558 reconstructed from its own original graph, exact stop nodes, zero offset. Lelant Saltings named track stop missing. Falmouth 19902608 uses disused siding 300616008; Maidenhead/Marlow and sleeper variants remain. |
| A5 | ScotRail | Remaining routes and regional variants | pending — Fife circle relation 20044083 and minor short workings need distinct regular commercial evidence |
| A5 | Caledonian Sleeper | Highland services | pending — Lowland Glasgow and Edinburgh added. Archived Highland passenger calls predate the Birmingham International change |
| A6 | Avanti / Heathrow Express / LNER / Lumo | Missing reverse and branch patterns | partial — Four independent London→Manchester/Liverpool Avanti directions added from original track and current book columns. Heathrow Express return, other WCML variants and further LNER calls still require independent source paths. |
| C | Southeastern HS1 | Further through journeys beyond Kent branches | pending — Six directions via Ashford or the Medway towns added. Check Dover/Ramsgate through workings and peak-only variants separately |
| C | Eurostar | Lille Europe stopping variants | blocked — London–Paris, London–Brussels and London–Amsterdam via Rotterdam and Brussels are implemented. Source relations for these services omit Lille Europe or use its bypass; obtain a verified station-platform path for a Lille-calling service. |
| C | HS2 | Commercial passenger service | blocked — Exclude until passenger operation is officially established |
| D | West Midlands Metro | Wolverhampton through-running via Millennium Point | blocked — Official April 2026 opening and service evidence verified. OSM 20439814/20439815 cover Millennium Point–Edgbaston section; find complete through-track and preserve the reversal |
| D | Existing regional light rail | Metrolink, Edinburgh, Blackpool, Tyne and Wear, Sheffield | pending — Existing regular service catalogue preserved; verify additional distinct operating patterns after major National Rail gaps |

## Earlier releases

- PR #33 introduced 129 directions. London recovery 26abc3946 restored all 12 previously blocked official TfL patterns. Regional expansion 8931d5535 added the four major tram systems and intercity coverage.
- Previous production release: ea4696898cf2fcb17d3278eda13766e9a1540e23. The baseline stores its 284 directions independently of the new batches.
