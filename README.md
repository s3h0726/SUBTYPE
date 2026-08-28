# SUBTYPE — 일본 철도 타이핑

**東京レールタイピング — 타이핑으로 도쿄를 달리다**

일본 전국 철도 노선을 따라 역명을 입력하며 열차를 움직이는 정적 HTML5 타이핑 게임입니다. 일본어 역명판을 보고 한국어로 정답을 입력하며, 한국어 IME와 사용자가 직접 만드는 커스텀 노선을 지원합니다.

## 실행

별도 빌드가 필요 없습니다. 정적 웹 서버에서 이 폴더의 `index.html`을 여세요.

```bash
python -m http.server 8080
```

그런 다음 `http://localhost:8080`으로 접속합니다. 브라우저 보안 정책상 `file://`로 직접 열면 JSON 로딩이 차단될 수 있지만, 앱은 최소 플레이가 가능한 안전한 기본 데이터로 대체합니다.

기본 데이터는 `data/lines/<operator>/<line>/`의 노선 workspace를 자동 탐색해 생성한 브라우저 bundle을 `js/data-loader.js`가 공통 구조로 정규화합니다.

## 플레이 방법

1. `PLAY`에서 ALL / JR / SUBWAY / PRIVATE RAILWAY / OTHER / SHINKANSEN / LIMITED EXPRESS / CUSTOM 분류를 선택합니다.
2. 입력 방식(따라쓰기·암기), 게임 모드, 열차 종류, 운행 방향, 난이도를 고릅니다.
3. 따라쓰기는 밑줄 셀에 입력 글자가 진행되고, 암기는 한국어 정답을 숨긴 채 일본어·로마자만 보고 입력합니다.
4. AUTO는 정답 직후 자동 출발하고, SPACE는 정답 확인 후 스페이스바로 출발합니다.
5. `Esc` 또는 일시정지 버튼으로 멈추고 다시 시작할 수 있습니다.

한글 입력은 `compositionstart`, `compositionupdate`, `compositionend`, `input`, `keydown`을 분리 처리합니다. IME 조합 중에는 오답으로 판정하지 않으며 비교 문자열에 NFC 정규화를 적용합니다.

## 포함 기능

- 노선 완주, 랜덤 60초, 노선 순서 맞히기, 무한 모드
- 한국식 분당 타수(CPM), WPM, 정확도, 오타, 콤보, 기록
- 역/노선 통합 검색, 즐겨찾기, 최근 플레이, 개인 통계
- 선택 화면에서 지도를 제거한 JR / Tokyo Metro / Toei / 사철 카드 목록
- JR·Tokyo Metro·Toei·사철의 역명판 특성을 반영한 한국어 전용 입력 HUD
- PLAY 전용 Leaflet + OpenStreetMap 단일 지도, 실제 역 좌표 폴리라인, OSM 화면 내 attribution
- 현재·이전·다음 역의 일본어/한국어 라벨, 완료·미완료 구간, 역 마커, 좌표 보간 열차 이동과 카메라 추적
- 게임 시작 후 지도 객체·OSM 타일 레이어를 재생성하지 않는 싱글턴 렌더러
- 재배포 조건을 확인한 실제 노선 심볼은 원본 SVG로 표시하고, 미확인 노선은 모조 심볼 대신 일반 문자 코드로 표시
- 현재 입력한 글자 비율만큼 MLIT 실제 철도 선형의 누적 길이를 따라 이동하는 열차와 두 역 중심 카메라 추적
- 물리 노선·여객 노선·열차 서비스·직통 서비스·신칸센 계통을 분리한 5계층 데이터 모델
- N'EX 신주쿠·오후나 방면과 후쿠토신선–도요코선–미나토미라이선 3사 직통운전
- 요코하마·가나가와 주요 노선과 현행 신칸센 10개 계통 및 3종 신칸센 역명판
- 현재역 강조, 다음 정차역 안내, 열차 이동 및 출발 오버레이
- DARK / LIGHT / SYSTEM 테마, 게임 중 즉시 전환, 기존 설정 자동 병합
- 도요코선 각역정차·급행·통근특급·특급 및 정·역방향 운행
- 모든 다른 노선은 검증되지 않은 급행 패턴을 만들지 않고 각역정차를 기본 제공
- 일본어·한국어·가나·로마자를 지원하는 2,760역 station master 검색 기반 커스텀 노선
- 검색 결과의 실제 좌표·운영사·노선 정보를 보존하고 최대 300역 순서 변경 및 OSM 미리보기
- 로컬 저장, 수정, 삭제, JSON 가져오기/내보내기
- 잘못된 JSON과 개별 데이터 로딩 실패 방어

## 지원 데이터

첫 화면에는 자동 발견된 601개 고유 노선을 표시합니다. 현재 workspace는 161개 운영사와 9,145개 canonical 역을 포함합니다.

- JR: 도쿄권 JR East 재래선과 도카이도·도호쿠 계통 신칸센 연결 레이어
- Subway: Tokyo Metro 9개, Toei Subway 4개, 요코하마 블루·그린 라인
- Private: 도큐·오다큐·게이오·세이부·도부·게이큐·게이세이·소테츠·미나토미라이선 등
- Other: 도쿄 모노레일, 유리카모메, 린카이선, 츠쿠바 익스프레스, 요코하마 시사이드라인 등
- Shinkansen: 도카이도·산요·도호쿠·홋카이도·조에츠·호쿠리쿠·큐슈·니시큐슈·야마가타·아키타 신칸센

지도용 station master는 2,760개입니다. 노선 게임에서는 도쿄 경계 밖 연결역도 끊지 않고 제공합니다.

## Rail Data Editor

개발 서버에서는 `dev/rail-data-editor.html`, GitHub Pages에서는 `/editor/`를 열면 601개 workspace가 운영사별 Tree로 표시됩니다. SUBTYPE 배포 주소 기준 에디터 URL은 `https://s3h0726.github.io/SUBTYPE/editor/`입니다. 기본정보·역 순서·지도/Geometry·로고·역명판·검증 탭에서 현재 노선 폴더 하나를 편집합니다. 역방향 목록은 별도 저장하지 않고 canonical 정방향에서 자동 생성합니다.

내보내기는 누락 역, 새 인접 역쌍의 실제 segment 누락, 또는 10% 이상의 비정상 역 수 감소가 있으면 차단됩니다. 현재 원본 데이터에서 geometry가 불완전한 39개 노선은 직선으로 위장하지 않고 명시적으로 차단되며, 562개 노선 workspace는 정·역방향 검증을 통과합니다.

에디터에서 내보낸 검증 JSON은 `npm run editor:apply -- <파일>`로 현재 노선의 `line.json`과 `stations.json`만 원자적으로 반영합니다. `npm run validate:line -- yamanote`, `npm run build:line -- yamanote`, `npm run new:line`도 제공합니다. 전체 구조는 `data/EDITOR_GUIDE.md`를 참고하세요.

## GitHub Pages 배포

1. 저장소 루트에 이 폴더의 내용을 올립니다.
2. GitHub 저장소의 **Settings → Pages**에서 배포 브랜치와 루트 폴더를 선택합니다.
3. 모든 리소스 경로가 `./` 상대경로이므로 저장소 하위 경로에서도 동작합니다.

### 지도 제공자

PLAY 화면은 OpenStreetMap만 사용하며 API 키가 필요하지 않습니다. Leaflet 지도와 타일 레이어는 운행 시작 시 한 번만 만들고, 역 이동 때는 노선 진행선·역 상태·열차 위치만 갱신합니다. 기본 노선은 MLIT N02 2025 철도 중심선에서 계산한 실제 선형을 사용합니다.

## 커스텀 노선 JSON

`data/sample-custom-route.json`은 실제 노선이 아닌 **Sample Fictional Route**입니다.

```json
{
  "version": 1,
  "type": "custom-route",
  "operator": {"ja":"運営者","en":"Operator","ko":"운영사"},
  "line": {"ja":"新路線","en":"New Line","ko":"새 노선"},
  "code": "CT",
  "lineColor": "#e84747",
  "loop": false,
  "stations": [
    {"id":"CT01","ja":"東京","kana":"とうきょう","romaji":"Tokyo","ko":"도쿄","koAliases":[],"map":{"x":60,"y":170}}
  ]
}
```

가져오기 시 버전, 타입, 역 배열, 최대 역 수, 문자열 길이, 색상, 좌표를 검사합니다. 커뮤니티 공유는 샘플을 복사하여 수정한 뒤 `custom-routes/` 폴더를 만들고 Pull Request로 제출하는 방식을 권장합니다.

## 새 기본 노선 추가

`data/routes.json`의 `routes` 배열에 노선 객체를 추가합니다. 게임 코드는 수정할 필요가 없습니다. 각 역은 `id`, `ja`, `kana`, `romaji`, `ko`, 선택적 `koAliases`를 가집니다. 제출 전 공식 사업자 공개 정보 등 신뢰 가능한 출처로 역 순서와 표기를 검증하고, 전체 데이터가 아니면 `coverage: "starter"`로 표시해 주세요.

## 데이터·라이선스

검증된 운영사 SVG 22개와 원본 노선 심볼 SVG 11개를 포함합니다. 전국 164개 운영사 중 로컬 로고가 연결된 운영사는 22곳이며 나머지는 문자 운영사명으로 표시합니다. 출처·라이선스·검증 상태는 `data/operator-assets.json`, `data/route-symbol-assets.json`, `ASSET_CREDITS.md`에 기록했습니다. 역 데이터는 변경될 수 있으므로 실제 여행에는 각 운영사의 최신 안내를 확인하세요.

소스 코드는 MIT License로 배포됩니다. 철도 사업자명 및 노선명은 각 권리자의 상표일 수 있으며, 본 프로젝트는 해당 사업자와 제휴하거나 승인받은 공식 서비스가 아닙니다.

## DATA STATUS (2026-08-23)

데이터 상태는 `node tools/validate-data.js`로 재계산할 수 있습니다. 소스 모듈이나 JSON을 수정한 뒤 `node tools/build-static.js`를 실행하면 `file://`에서도 동작하는 임베디드 데이터와 `app.bundle.js`가 다시 생성됩니다.

```text
Operators: 25
Lines: 103
Station master: 2,760
Physical lines: 97
Passenger routes: 2
Train services: 1
Through services: 1
Shinkansen routes: 10
MLIT geometry: 103 / 103

Nationwide source operators: 164
Nationwide source lines: 596
Nationwide unique stations: 8,824
Nationwide lazy route chunks: 596 / 596
Nationwide MLIT geometry: 583 / 596
Nationwide geometry review: 13
Nationwide Korean-name human review: 8,657
Korean fields containing Japanese characters: 0
Nationwide strict audit: PARTIAL_WITH_AUDITED_GAPS

JR Lines / station entries: 27 / 612
Subway Lines / station entries: 15 / 333
Private Lines / station entries: 42 / 625
Other Rail Lines / station entries: 9 / 140
Shinkansen Lines / station entries: 10 / 133

Gameplay curation
N'EX train service:        2 branches
Through services:          1
Input modes:               Shadowing / Memory
Verified operator assets:  22
Playable real symbols:     7 / 103
```

자동 표기는 일본어 형태소 사전의 가나를 거쳐 생성했으며 공식 한국어 표기와 다를 수 있습니다. 이 상태를 숨기지 않도록 각 station master의 `nameSource`에 기록했습니다. 상세 출처와 이용조건은 [DATA_SOURCES.md](DATA_SOURCES.md)를 참조하세요.

전국 결과의 기계 판독 감사표는 `data/nationwide/FINAL_AUDIT.json`, 미매칭 선형은 `data/nationwide/GEOMETRY_MISSING.json`, 사람 검수 대기 이름은 `data/nationwide/REVIEW_REQUIRED.json`에서 확인할 수 있습니다. `node tools/audit-nationwide.js`로 다시 생성합니다.
