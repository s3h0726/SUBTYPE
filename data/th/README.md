# 태국 철도 원자료와 생성 절차

검수일: 2026-11-03. 한국어 표기는 태국어 원명을 기준으로 작성한 프로젝트 표기이며, 기관 공인 한국어 명칭으로 표시하지 않는다.

## 자료

| 자료 | 출처 | 적용 범위 |
|---|---|---|
| 국철 공식 지역·방향별 시간표 24개 | https://ttsview.railway.co.th/SRT_Schedule2022.php | 주요역·열차번호·정차/통과 대조. 소역 전체 표로 오인하지 않음 |
| 공식 시간표 종별 메타데이터 | https://ttsview.railway.co.th/timetable_modern/timetable_data.js?v=2026.01.22 | 열차종별·운행일 |
| 국철 전체 정차 공개자료 | https://datagov.mot.go.th/dataset/after32 | 공개 원본 기준일 2024-12-18. Longdo 재제공 JSON 사용 |
| 국철 역 좌표 | https://datagov.mot.go.th/dataset/after16 | 일부 빈 좌표·오류 좌표는 공개 선로에 대조 |
| 국철 공개 자료 재제공 | https://transit.longdo.com/api/ | 역·전체 정차 스냅샷. 보간 역 좌표는 자동 확정하지 않음 |
| 현행 TTS 공개 재제공 | https://rotfai.live/ | 2026-11-03 수집 여객열차 47개 전체 정차. `stopHere`가 참인 역만 입력 |
| 현행 국철 OSM 선형 | https://rotfai.live/api/network | 2026-10-15 빌드. 롭부리 2·캄싸왓 포함. 인접 선형 꼭짓점 그래프 검증 |
| 방콕 전철 OSM 선형 | https://ms.longdo.com/3dtiles/rail/bangkok-trains/20261101/lines.json | 공개 선로·역 정차 위치. 모의 배차 시각은 사용하지 않음 |
| 매끌롱 두 독립 구간 | https://www.openstreetmap.org/copyright | 지도 API bbox별 철도 객체. 강을 가로지르는 가짜 연결 없음 |

국철 전체 정차 2024년 원본은 2026년 주요역 표와 정차 집합이 일치할 때만 사용한다. 이 대조로 2026년의 모든 소역을 재인증했다고 주장하지 않는다. 최신 공개 전체 정차가 확보된 열차는 그 자료를 우선한다. 현재 공식 전국 재고 전체의 완전성은 미확인이다.

OSM 데이터 출처: © OpenStreetMap contributors, ODbL 1.0. Longdo Transit·Rotfai Radar는 별도 재제공 출처로 표시한다. 제3자 앱 코드는 제품에 복사하지 않는다. 원자료별 실제 URL·SHA-256은 `source/manifest.json`에 보존한다. 수집 시각이 남지 않은 파일은 시각을 만들어 넣지 않고 검수일만 기록한다.

## 재현

```powershell
npm run import:thailand
npm run build:thailand
npm run test:thailand
npm run test:thailand:browser
```

`node tools/fetch-thailand.cjs --refresh`로 원자료를 갱신한다. 평소에는 같은 URL의 캐시를 재사용한다. 현행 열차 API의 불투명 운행 식별자가 바뀌면 새 URL 자료를 다시 요청한다. 요청 간격 3초를 두며 공급자 오류 후 추가 열차 요청을 중단한다. 인증·Turnstile을 우회하지 않는다. 수집 실패 원본을 현재 운행 자료로 승격하지 않는다.

매끌롱 OSM 추가 수집은 `tools/fetch-thailand-map.ps1`을 사용한다. 저장된 XML을 정규화할 때는 `tools/normalize-thailand-map.cjs 원본.xml 출력.json 실제요청URL`을 사용한다. 원본 XML 캐시는 Git·배포에서 제외한다.

컴파일러는 미번역·공식 정차 충돌·선로 단절·역/선로 불일치를 격리한다. 생성 파일의 내용이 같으면 다시 쓰지 않는다. 초기 화면은 경량 색인만 받으며, 노선 선택 시 해당 gzip JSON을 풀고 SHA-256을 검증한다. 다른 국가 데이터를 재생성하지 않는다.

## 이름과 식별자

한국어 원본은 `korean-stations.txt`, 도시철도는 `korean-urban.json`이다. 같은 물리 역과 반복 방문 식별자는 구별한다. 블루라인 타프라 두 방문과 핑크라인 지선 PK10은 물리 역 식별자를 공유하되 선로별 승강장 좌표를 유지한다. 매끌롱의 서로 다른 원자료는 숫자 식별자가 충돌하므로 태국어 원명을 공식 표에 대응시킨다.

기존 한국어 편집표의 태국 링크에서 운영사·노선·역/행선지·운행계통을 수정하면 같은 출처의 열린 게임에 즉시 적용된다. 영구 반영은 내보낸 JSON으로 다음 명령을 실행한다.

```powershell
node tools/apply-thailand-names.cjs 내보낸파일.json
npm run build:thailand
```

원명·식별자·좌표는 이름 편집으로 바뀌지 않는다. 기록과 랭킹은 `th`와 방향별 운행계통 식별자로 구분한다. 실계정 로그인 상태의 Supabase 쓰기와 운영체제 네이티브 한글 IME는 자동 검증 범위에 포함하지 않는다.
