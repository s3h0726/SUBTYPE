# SUBTYPE 변경 이력

버전 형식: `vMAJOR.MINOR.PATCH` ([Semantic Versioning](https://semver.org/lang/ko/))

## [v0.15.1] — 2026-11-22

- Merge remote-tracking branch 'origin/main' into feature/uk-railway-completion

## [v0.15.0] — 2026-11-22

- Merge remote-tracking branch 'origin/main' into feature/uk-railway-completion

## [v0.14.3] — 2026-11-22

- data: apply Korean names, RGB and route-card labels from editor

## [v0.14.2] — 2026-11-22

- test(jp): 신칸센 회귀검사에 역명 정규화 헬퍼 적용 * test(jp): inject station normalization helpers into Shinkansen geometry regression * ci(jp): rerun Shinkansen geometry regression when its test c

## [v0.14.1] — 2026-11-22

- data: apply Korean names and RGB edits from web editor

## [v0.14.0] — 2026-11-22

- feat: 노선 카드 사용자 라벨 및 RGB 편집 지원 (#99) * feat: add label name and RGB data columns to Korean-name editor * feat: add live label preview, RGB picker and draft tracking * feat: render 

## [v0.13.13] — 2026-11-21

- v0.8 Add KTX route-variant labels

## [v0.13.12] — 2026-11-21

- v0.8 Rename KTX service patterns by endpoints

## [v0.13.11] — 2026-11-21

- data: apply Korean names and RGB edits from web editor

## [v0.13.10] — 2026-11-20

- data: apply Korean names and RGB edits from web editor

## [v0.13.9] — 2026-11-20

- data: apply Korean names and RGB edits from web editor

## [v0.13.8] — 2026-11-19

- fix: align Hong Kong route selection cards with other countries (#95) * fix(hk): align Hong Kong line cards with shared country layout * fix(hk): align Hong Kong line cards with sh

## [v0.13.7] — 2026-11-18

- data: apply Korean names and RGB edits from web editor

## [v0.13.6] — 2026-11-18

- ci(pages): allow fresh main deployment to recover from duplicate rerun artifacts

## [v0.13.5] — 2026-11-18

- fix(custom): 외국 공항에서 도착한 철도역부터 현지 검색 누락을 해결하기 위해 모든 매칭 노선을 탐색하고 최대 8개 로딩 제한 제거
- fix(custom): 영국·프랑스의 노선별 첫 번째 운행계통만 검색하던 제한을 수정해 실제 검증된 모든 운행계통의 역 등록
- fix(custom): 현재 국가와 타국 모두 검색어로 추가 철도 데이터를 온디맨드 로딩, 공백·하이픈·영문 대소문자 정규화
- fix(custom): 검색 결과 로딩 중·실패 안내, 기존 철도망 보존, 검색 결과 더 보기, 단방향 선로의 잘못된 역방향 연결 차단
- test(custom): 실제 영국·프랑스·태국 역명 인덱스 기반 다중 노선 검색 및 캐시·노선 보존 회귀 검사

## [v0.13.4] — 2026-11-18

- feat(custom): 국제공항 이동 후 실제 도착 국가 철도망을 확인해 커스텀 노선에 연결 (기존 KTX 보정 보존)
- feat(custom): 출발 국가와 다른 철도망을 온디맨드로 로딩해 역 검색 및 최단거리 연결 이어가기
- fix(custom): 외국 역의 한국어·현지어 이름을 역 검색, 노선 편집, 게임 화면, 노선도 및 지리 지도에 국가별 표시
- fix(custom): 다른 국가를 오가는 구간은 명시적인 가상 항공 이동만 허용, 실제 공항역·터미널 검증 및 삭제·재정렬 보호
- test(custom): 국가 간 터미널·철도역 이름·미등록 한국어 역명·가짜 항공 지름길 회귀 검사

## [v0.13.3] — 2026-11-18

- fix(kr): ship actual Hangsin and Gyeongbu KTX physical map corrections in production game bundle * ci(kr): inspect Hangsin KTX approach and south-of-Daejeon map paths * diagnose(kr

## [v0.13.2] — 2026-11-18

- Merge remote-tracking branch 'origin/main'

## [v0.13.1] — 2026-11-18

- feat(custom): 검증된 공항 접근 철도역에서 같은 국가의 공항으로 가상 항공·터미널 환승 구간 추가
- feat(custom): 공항 코드 및 터미널별 선택, 점선 항공 구간, JSON 저장·역 편집 시 유효성 유지
- fix(custom): 가상 공항 이동이 철도 최단거리 그래프에 유입되지 않도록 분리
- test(custom): 공항역 매칭·터미널 식별·타국 연결 차단·철도 최단거리 보호 검사

## [v0.13.0] — 2026-11-18

- feat(custom): 기존 철도 구간·운행 방향을 기준으로 목적지 최단거리 자동 연결(Dijkstra)
- feat(custom): 경유지 탐색, 거리·환승·추정 거리 요약, 사용자 지정 노선 스튜디오 UI 개편
- fix(custom): 역 삭제·순서 변경 시 선형 재계산, 불연결 시 원복, 선형 누락 보호
- test(custom): 노선거리 가중치·단방향·환승 식별·연결 불가 회귀 검사

## [v0.12.0] — 2026-11-18

- feat: expand free-drive airports and terminal station transfers (#85) * feat: expand free-drive airports and select verified terminal rail portals * feat: honor selected airport te

## [v0.11.14] — 2026-11-18

- fix(kr): connect two KTX Suseo high-speed feeder journeys on exact original OSM railway nodes * diagnose(kr): source-proven feeder OSM rail routes for three unresolved Suseo KTX pa

## [v0.11.13] — 2026-11-18

- fix(kr): replace seven Honam KTX Iksan–Osong detours with OSM node-proven high-speed paths * feat(kr): solve all KTX corridor defects with source-node Dijkstra and exact original-w

## [v0.11.12] — 2026-11-18

- fix(kr): anchor verified KTX Suseo–Pyeongtaek station coordinates to actual railway platforms * fix(kr): anchor KTX Suseo station locations to actual OSM HSR platform and reject ne

## [v0.11.11] — 2026-11-18

- fix(kr): enforce exact source-connected directional rail geometry for KTX audits * fix(kr): require exact original OSM track edges and respect rail direction during KTX rerouting *

## [v0.11.10] — 2026-11-18

- fix(kr): restore KTX paths without verified OSM source edges and enforce provenance * fix(kr): regenerate exact OSM source-edge references for corrected KTX geometries * fix(kr): r

## [v0.11.9] — 2026-11-18

- fix(kr): correct 67 KTX track leg geometries on verified OSM rail corridors * feat(kr): add source-backed all-KTX railway geometry repair engine * fix(kr): permit provenance-checke

## [v0.11.8] — 2026-11-18

- Merge pull request #79 from s3h0726/feature/france-production-evidence Record successful production gameplay for all released Transilien directions

## [v0.11.7] — 2026-11-18

- Merge pull request #77 from s3h0726/feature/france-transilien-r-complete Add verified Transilien J and R branches; pass 300 France directions

## [v0.11.6] — 2026-11-18

- test(kr): cover SRT through-service physical junction and reject unverified joins

## [v0.11.5] — 2026-11-18

- Merge pull request #76 from s3h0726/feature/france-transilien Add all nine Transilien line selections with 87 verified directions

## [v0.11.4] — 2026-11-18

- Merge pull request #75 from s3h0726/feature/france-rer-c-pontoise Add RER C Pontoise and Massy service patterns

## [v0.11.3] — 2026-11-18

- Merge pull request #73 from s3h0726/fix/pages-enoden-following-regression Fix Pages Enoden check after free-drive following-station update

## [v0.11.2] — 2026-11-15

- deploy(kr): bust app bundle cache for Suseo–Pyeongtaek HSR track routing

## [v0.11.1] — 2026-11-15

- test(kr): audit all KTX high-speed service geometry and reject unsafe reroutes * test(kr): audit KTX path geometry against physical high-speed tracks * test(kr): cover KTX high-spe

## [v0.11.0] — 2026-11-15

- Merge PR #68: 자유주행 공항 이동 시스템 feat: 자유주행 공항 간 이동 시스템 (7개 공항)

## [v0.10.3] — 2026-11-15

- Merge pull request #69 from s3h0726/feature/france-rer-bc Add verified Paris RER B and C directions

## [v0.10.2] — 2026-11-15

- fix: correct free-drive next stop and auto-reverse at terminals * fix: preserve free-drive direction and reverse automatically at bidirectional terminals * fix: show station after 

## [v0.10.1] — 2026-11-15

- fix: make route card list denser * fix: show more route cards at once with compact grid * fix: bust cached route card CSS for compact layout

## [v0.10.0] — 2026-11-15

- feat: add Suseo–Dongtan services to the existing GTX-A card * feat(gtx-a): define four official south stops as directions on existing card * feat(gtx-a): show south service directi

## [v0.9.2] — 2026-11-15

- style: refresh SUBTYPE route selection cards * style: redesign route selection cards across countries * style: load refreshed route cards after country styles

## [v0.9.1] — 2026-11-15

### 버전 관리 개선
- `main` 변경 사항의 자동 PATCH 버전 증가 및 `feat:` 커밋의 MINOR 버전 구분 도입.
- 웹 화면·README·CHANGELOG·`package.json`·Git 태그 자동 동기화.
- GitHub Pages 배포를 자동 릴리스 성공 후 실행하도록 변경.
- 국가 선택 화면의 메인 문구 및 프로젝트 README 리뉴얼 반영.

## [v0.9.0] — 2026-11-08

개발 중인 SUBTYPE에 통일된 버전 번호를 도입한 첫 버전입니다.

### 주요 기능
- 한국·일본·홍콩·대만·태국·영국 교통 노선 및 관련 게임 화면 유지
- 국가별 운행계통 선택 및 노선별 타이핑 완주, 로컬 운행 기록과 계정 기반 기능
- 모든 국가의 기록 화면에서 한국어 노선명과 운행 구간 표시
- 일본 철도에서 선택한 운행계통의 실제 정차역만 표시하고 비직통 각역정차 계통을 우선 선택
- 홈·상단 메뉴·설정 화면에 동일한 `v0.9.0` 표기

### 개발 및 품질
- `package.json`의 `version`을 유일한 버전 원본으로 지정
- `npm run build:app`으로 웹 화면의 버전 표시를 자동 동기화
- `npm run test:version` 검사 추가
- `main` 반영 시 중복을 피하면서 의미적 버전 Git 태그를 생성하는 GitHub Actions 작업 추가

### 알려진 제한
- 모든 등록 노선의 실제 브라우저 운행, 외부 로그인, 클라우드 랭킹이 전부 검증된 정식 안정판은 아닙니다.
- 실제 운행 근거가 없는 계통은 임의로 생성하지 않습니다.
