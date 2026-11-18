# SUBTYPE 변경 이력

버전 형식: `vMAJOR.MINOR.PATCH` ([Semantic Versioning](https://semver.org/lang/ko/))

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
