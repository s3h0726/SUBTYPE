# Tokyo Rail Typing nationwide integration QA

검증일: 2026-08-23

## 2026-08-25 긴급 데이터 복구 감사

- 마지막 정상 커밋: `4dff800`
- 전국 데이터 전후 동일: 운영사 164, 원본 노선 596, canonical 역 8,824, 노선-역 관계 10,590
- 누락 노선 0, 누락 노선-역 관계 0, 설명되지 않은 데이터 손실 0
- 병합·중복 제거 후 로컬 카탈로그 601개 표시
- 대표 검색: 야마노테선, 츄오·소부선, 도카이도 신칸센, 유리카모메, 긴자선, 미도스지선, 구마가와 지방 사철 통과
- 빈 데이터 또는 기준 대비 10% 초과 급감 시 생성 번들 교체 전 빌드를 차단
- 로컬 콘솔 오류 0
- 실제 GitHub Pages는 최종적으로 601개를 로드했으며, 초기 지연 때문에 소실처럼 보였던 로더/표시 문제로 판별

## 2026-08-25 오프라인 103개 제한 수정

- 원인: 서버 없이 `index.html`을 직접 열 때 전국 인덱스/상세 JSON `fetch()`가 차단되어 내장 curated 103개만 표시
- 수정: 전국 인덱스 596개와 상세 노선 파일 596개를 `js/nationwide-data.js`에 생성 번들로 포함
- 초기 카탈로그: 601개 노선
- 전국 상세 노선 검증: 구마가와 철도 유노마에선 선택, 14개 역 운행 설정 진입 통과
- 전국 JSON 추가 네트워크 요청: 0
- 브라우저 콘솔 오류: 0

## 통과

- 전국 원본 164개 운영사, 596개 노선, 8,824개 고유 역 생성
- 전국 검색 인덱스 + 596/596 노선별 지연 로딩 청크 존재
- 앱의 중복 병합 후 601개 고유 노선 표시
- JR / SUBWAY / PRIVATE / THIRD SECTOR / TRAM / OTHER / SHINKANSEN 필터 표시
- 한국어 지역 검색: 삿포로 3, 오사카 4, 하카타 7, 가고시마추오 4, 마쓰야마 3, 고치 2, 나가사키 3개 노선 검색
- 브라우저에서 `삿포로` 검색 → 하코다테 본선 상세 청크 로드 → 선택 → 역방향 설정 → 실제 게임 진입
- 역방향 기점 아사히카와, 종점 오타루, 41개 역과 OpenStreetMap 지도 표시
- 1366×768 / 1920×1080 게임 화면에서 가로·세로 문서 오버플로 없음
- 큐레이션 MLIT geometry 103/103, 전국 MLIT geometry 583/596
- 유리카모메 시바우라후토–오다이바카이힌코엔 곡선 구간 26포인트, 곡률비 1.29 통과
- 전국 노선·역 한국어 필드 누락 0, 한국어 필드 내 일본어 문자 0
- 임의 `RAIL` 원형 심볼과 문자 코드 pseudo-symbol 제거; 검증된 실제 SVG가 없으면 심볼 영역 숨김
- 데이터 감사 페이지가 `FINAL_AUDIT.json`을 읽고 `STRICT PASS: NO`를 실제 상태대로 표시
- 브라우저 한글 입력 순서: `히|토|요|시|온|센`, Backspace 후 순서 유지
- `人吉温泉` 정답 `히토요시온센` 6셀, 내부 ID `9992001` 비노출, 공식 코드가 없으므로 배지 숨김
- `江坂`은 오사카 메트로 공식 코드 `M11` 표시, 오사카 메트로 전용 역명판 템플릿 적용
- AUTO 모드에서 정답 입력 후 설정값 150ms(180ms 대기 관측 시 다음 역)로 Enter/Space 없이 이동
- `お台場海浜公園` 정답 `오다이바카이힌코엔` 9셀, 1366/1920px 단일 행 표시
- 입력 업데이트 계측 0.5–2.8ms, 테스트 흐름 중 브라우저 콘솔 오류 0건
- 노선 선택은 601개 중 한 번에 96개 노선 카드만 렌더링

## P0 현재역·다음역 동기화 회귀검사 (2026-08-25)

- 모든 노선은 canonical `route[0]`을 첫 타이핑 정답으로 표시하고 출발역 입력 중 열차 진행률을 0으로 유지
- 유리카모메 시작: 현재역·정답 `신바시(U1)`, `START STATION`, 지도 index 0, 진행 `0 / 16`
- `신바시` 입력: 현재역·지도는 `U1`에 그대로 있고 다음 정답만 `시오도메(U2)`로 전환, 열차 진행률 0
- `시오도메` 입력: 현재역·열차·지도 index가 `시오도메(U2)`로 일치하고 다음 정답은 `타케시바(U3)`, 진행 `2 / 16`
- 두 테스트 모두 AUTO에서 Space/Enter 없이 150ms 후 진행, input 초기화·focus 복구, 콘솔 오류 0건
- `#game` 직접 접근은 초기 demo 값을 노출하지 않고 노선 선택 화면으로 복귀
- 1280×720 브라우저 제한 환경에서 노선 첫 행 표시 및 게임 화면 가로·세로 overflow 0
- 배포본은 601개 노선을 로드하지만 Supabase 공개 설정이 비어 있어 실계정 인증은 차단 상태

## 엄격한 완료 조건 미통과

- 전국 13개 노선은 2025 N02 선형에 안전하게 매칭되지 않아 게임 선형 감사 대기
- 전국 한국어 역명 8,657개는 자동 전사 기반이라 사람 검수 대기
- 전국 공식 노선 심볼 자산 감사 미완료(로컬 실제 SVG 11개)
- 운영사 164곳 중 검증된 로컬 로고 연결은 22곳이며 142곳은 미완료
- 선형 거리 이상치 3건과 단절 역 쌍 1건 수동 검수 대기
- 기존 큐레이션 검증기의 분기 구간 geometry index 역행 3건(마루노우치 지선, 게이세이 공항 분기, 게이오 신선) 대기
- 외부 계정 정보가 없어 Supabase 실계정 SIGN UP/LOGIN 회귀검사는 실행하지 않음

따라서 이 빌드는 전국 카탈로그·지연 로딩·실지도 기반 플레이의 작동 가능한 통합판이지만, 데이터 전수 검수까지 끝난 최종 PASS판으로 표시하지 않습니다. 상세 수치는 `data/nationwide/FINAL_AUDIT.json`과 `data/nationwide/GEOMETRY_MISSING.json`을 기준으로 합니다.

## 재현 명령

```powershell
node tools/generate-data.js --nationwide
node tools/build-nationwide-geometry.js
node tools/audit-nationwide.js
node tools/audit-railway-emoji.js
node tools/audit-ui-quality.js
node tools/audit-quality.js
node tools/build-static.js
```

## 철도 이모지 UI 감사

- RAILWAY EMOJI IN PRODUCTION UI: 0
- EMOJI USED AS LINE SYMBOL: 0
- EMOJI USED AS OPERATOR LOGO: 0
- EMOJI USED AS TRAIN MARKER: 0
- EMOJI USED AS STATION ICON: 0
- EMOJI USED AS BUTTON ICON: 0
- 신칸센 지도 marker의 Unicode 그림문자를 제거하고 CSS 기반 전두부 실루엣으로 교체
- 검증된 실제 심볼 asset이 없는 노선은 심볼 영역을 숨김
