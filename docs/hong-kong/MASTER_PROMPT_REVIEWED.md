# SUBTYPE 홍콩 철도망 — 검토·수정본

기준일: 2026-10-18. 원본 180개 요구사항을 유지하며 다음 정정을 우선 적용합니다. 이 문서는 완료 선언이 아닙니다. 원본 다운로드 파일은 변경하지 않았습니다.

## 검토 결과 및 수정 사항

1. 홍콩은 특별행정구이므로 지역 키 `hk`, ISO `HK`를 사용합니다. UI의 국가·지역 선택과 영토별 집계를 구분합니다.
2. 빈 로컬 Git 폴더를 원본 저장소라고 가정하지 않습니다. 이번 실행은 원본을 `repository/` 하위에 복제한 뒤 최신 `origin/main`에서 지정 브랜치를 생성했습니다. main을 체크아웃·pull하여 사용자의 기존 작업을 바꿀 필요가 없습니다. 기존 브랜치가 있으면 이력과 원격 상태를 먼저 확인합니다.
3. MTR 일반 9개+공항철도 1개는 선로/브랜드 분류 기준이며, 방향별 서비스 수와 동일하지 않습니다. 공식 CSV는 현재 24개 방향 패턴을 제공합니다.
4. 정관오선 LOHAS Park 지선은 공식 CSV의 TKS-UT/TKS-DT 셔틀 정차순서를 우선 보존합니다. 전일 North Point 직통을 발명하지 않습니다. 추가 직통 운행은 별도 공식 시각표·시간대 근거가 있어야 합니다. Racecourse 특별 정차는 CSV 본선 순서에 임의 삽입하지 않습니다.
5. 경전철 12개 번호는 원문 대상의 최소 기준입니다. 현행 공식 시간표는 506P·507P·720·610P도 언급합니다. 특별 운행, 학기·요일·혼잡시간 조건과 through-service 전환을 조사한 후 현재 운영 목록을 확정합니다. 12개만 등록하고 전체 완료로 선언하지 않습니다.
6. 트램의 공식 6개 주요 계통은 공유 물리선의 서비스입니다. 방향별 도로 정류장은 물리 역 수와 구분합니다. 정방향 geometry를 뒤집는 것으로 실제 반대편 도로 선로를 대신하지 않습니다.
7. source의 checkedAt은 열람일, 운행 validWhen은 운행 조건입니다. 관광청 과거 PDF는 역명의 한국어 철자 근거로만 사용하며 현행 운행·종점·역 개통 근거로 삼지 않습니다.
8. 근거 미확보, HTTP 오류, 끊긴 OSM way, 좌표 누락, 미검수 한국어명은 INCOMPLETE로 남기고 플레이를 차단합니다. 스키마 예시 좌표는 null로 두며 [0,0]을 수입하지 않습니다. OSM 원본 노드로 실제 연결이 입증되지 않은 경로를 보간·직선 대체하지 않습니다.
9. 브랜드 원본과 재배포 조건을 확인하기 전에는 일반 문자 운영사명을 표시합니다. 학습용 역명판을 공식 디자인/로고라고 주장하지 않습니다. 자산 미확보는 전체 완료 판정에서 미완료입니다.
10. 자동 검사 통과, 출처 확보, 실제 서비스 검수, UI 수동 검증을 별도 기록합니다. 저장된 사용자/클라우드 데이터의 실계정 회귀는 로그인 없이 PASS로 표시하지 않습니다. unknown은 0이 아닙니다.
11. 공항 APM·테마파크 내부 철도처럼 원문에서 명확히 열거하지 않은 시스템은 범위 검토 대기 목록으로 둡니다. 본 문서의 목록만으로 홍콩의 모든 여객 궤도교통을 전수 완료했다고 주장하지 않습니다. 케이블카는 요청하지 않은 확장입니다.
12. main 병합·auto-merge·release·운영 Pages 배포는 수행하지 않습니다. 브랜치 푸시는 main 병합 승인이 아닙니다.

## 실행과 검증

- 정규 입력: data/hk/master/config.json 및 data/hk/sources/의 해시 고정 원문.
- 생성: node tools/build-hk-data.cjs, node tools/build-app-bundle.js.
- 검사: node --test tools/test-hk-network.cjs, node tools/audit-hk-data.cjs.
- 전체 완료 게이트: node tools/audit-hk-data.cjs --require-complete (미완료가 있으면 비정상 종료).
- 항목별 결과: requirements.json, REQUIREMENTS.md. 데이터 감사: reports/hong-kong/audit.json.

---

## 원본 요구사항 (위 정정을 우선 적용)

# SUBTYPE — 홍콩특별행정구 철도망 최종 통합 개선 명령

## HONG KONG RAILWAY NETWORK — 180개 세부 실행 요구사항

> 대상 프로젝트: https://github.com/s3h0726/SUBTYPE
> 기준일: 2026-10-17 (최종 실행 시 공식 현황 재확인)
> 유형: 기존 프로젝트 수정 / **홍콩 전용 작업 브랜치에서만 개발·커밋** / main 미변경

## 실행 지시

먼저 최신 `main`을 기준으로 **`feature/hong-kong-railway` 브랜치를 생성·체크아웃**하고, 이후 모든 홍콩 개발·데이터 생성·테스트·커밋을 해당 브랜치에서만 수행하십시오. 현재 SUBTYPE의 일본·한국 철도망을 보존한 채 홍콩특별행정구의 실제 여객 철도망을 추가·통합하십시오. **샘플 프로젝트를 새로 만들지 마십시오.** 각 항목을 실제 코드·정규 데이터·검증 자동화에 반영하십시오. 준비되지 않은 사항은 정직하게 미완료로 보고하십시오.

검증 우선순위: 공식 운영기관 자료 → 공식 노선도·역·운행 자료 → OSM 실제 선로 → 공공 공간자료 → 한국어 공식 관광자료 → 참고 위키. **실제 지도 선로가 없는 노선은 임의 직선으로 완성 처리하지 마십시오.**

---

## 브랜치 분리 및 병합 금지 — 최우선 실행 규칙

1. `s3h0726/SUBTYPE`의 최신 `origin/main`을 확인하고 작업 트리가 깨끗한지 검사한 뒤 `feature/hong-kong-railway` 브랜치에서만 작업하십시오. 해당 브랜치가 없으면 최신 `origin/main`에서 생성하고, 이미 있으면 브랜치 히스토리와 원격 상태를 확인해 기존 작업을 보존하십시오. 기존 원격 브랜치를 강제 덮어쓰지 마십시오.
2. 권장 초기 명령은 `git fetch origin`, `git switch main`, `git pull --ff-only origin main`, `git switch -c feature/hong-kong-railway`입니다. 브랜치가 이미 존재하면 `git switch feature/hong-kong-railway` 후 충돌 없이 최신 변경을 검토하십시오. 무조건적인 reset, force push, rebase를 실행하지 마십시오.
3. **절대 `main`에 직접 커밋·푸시·병합하지 마십시오.** 홍콩 기능이 아직 일부만 완성된 경우에도 브랜치의 작은 검증된 커밋으로 진척사항을 저장하십시오.
4. 기존 일본·한국 데이터와 공통 코드 변경의 회귀 테스트를 의무화하고, `hk` 데이터 및 국가 선택 상태가 다른 나라의 노선 목록·로고·검색·기록을 오염시키지 않도록 분리하십시오.
5. GitHub Pages의 운영 사이트가 `main`에서 배포되는 경우, 홍콩 브랜치 작업을 이유로 운영 배포 설정을 변경하지 마십시오. 브랜치 미리보기를 구성할 수 있다면 운영 주소와 분리된 별도 환경만 사용하십시오.
6. 작업 결과는 **브랜치 이름, 기준 main SHA, 홍콩 브랜치 HEAD SHA, 변경 파일, 완료·미완료 항목, 테스트 결과, 미리보기 URL(있는 경우)**을 보고하십시오.
7. 작업 후 Pull Request 초안은 생성할 수 있으나, **사용자가 명시적으로 최종 승인을 요청하기 전까지 merge·auto-merge·release·production Pages 배포를 금지**합니다. PR이 사용자의 승인 요청 없이 만들어지는 것이 불필요하다면 링크 안내만 하십시오.
8. 개발 도중 main이 업데이트되면 재기반·병합을 자동으로 강행하지 않고 차이와 충돌 위험을 확인하고 필요한 변경만 검증해 반영하십시오.
9. 테스트 실패·근거 부족은 `INCOMPLETE`로 기록하고, 이를 우회하거나 0으로 둔갑시켜 완료로 표시하지 마십시오.

---

## 0. 프로젝트 절대 원칙

### 1. 현재 저장소 `s3h0726/SUBTYPE`의 `feature/hong-kong-railway` 브랜치를 직접 수정한다. 새 데모 앱·별도 사이트·독립 게임을 만들지 않는다.

### 2. 일본 및 대한민국 데이터, 기존 기능, 기존 사용자 기록을 보존한 상태에서 `hk` 지역을 독립 추가한다.

### 3. HOME, PLAY, CUSTOM, RECORDS, SETTINGS, 로그인·회원가입, Guest, 다크모드, 모바일, GitHub Pages를 모두 회귀 검증한다.

### 4. PLAY의 한국어 일반·암기 모드, AUTO·SPACE, 한글 자모 기준 콤보·타수·정확도를 유지한다.

### 5. 철도 안내 표기는 실제 공식 자료가 우선이며, 사용자에게 그럴듯해 보이도록 노선·서비스·역명을 가공하거나 발명하지 않는다.

### 6. 역 목록과 선로를 따로 취급하지 않는다. 플레이 가능한 모든 `service`는 유효한 정차순서 및 추적 가능한 실제 `geometry`를 가져야 한다.

### 7. 선로 데이터가 없으면 역 사이를 직선으로 연결로 조용히 대체하지 않는다. `geometryStatus=unverified`로 표시하고 출시 판정에서는 미완료로 센다.

### 8. 변경 사항은 생성된 결과물에서만 고치지 않는다. 정규 원본(master/workspace)을 수정하고 생성·빌드·재배포 과정을 함께 정정한다.

### 9. 오류 발생 시 이미 완성된 일본·한국 루트의 분기·로고·타이핑·기록을 깨는 전역 정규화나 덮어쓰기를 금지한다.

### 10. 최종 산출물은 홍콩 브랜치의 코드·데이터·검증 스크립트·감사 보고서·실제 GitHub 커밋 SHA와 브랜치 독립성 검증이다. 운영 main 배포는 명시적 병합 승인 전까지 금지한다.

---

## 1. 국가·지역 범위와 네트워크 분류

### 11. 국가·지역 선택 메뉴에 `홍콩 Hong Kong / 香港`을 넣고 내부 키는 `hk`, ISO 지역 표기는 `HK`로 통일한다.

### 12. 이 작업의 기본 범위는 홍콩특별행정구의 여객 철도·궤도교통이다. 중국 본토, 마카오는 자동으로 홍콩 관할 노선으로 분류하지 않는다.

### 13. `MTR METRO`, `AIRPORT EXPRESS`, `LIGHT RAIL`, `TRAM`, `FUNICULAR`, `HIGH SPEED RAIL`, `CUSTOM` 등 분류를 제공한다.

### 14. MTR의 일반 철도 9개와 공항철도 1개를 정확하게 별도 구분하되, 물리 선로와 브랜드·운행 서비스 수를 혼동하지 않는다.

### 15. 현재 영업 중인 노선만 기본 플레이 목록에 노출한다. 계획·공사·역사적 노선은 `planned`, `construction`, `closed` 등 별도 상태로 둔다.

### 16. 홍콩섬·카오룽·신계·란터우 등 지리 구분은 검색 필터가 될 수 있으나, 운영사/노선/서비스 계층을 대신하는 도시 탭을 무분별하게 생성하지 않는다.

### 17. 동일한 레일을 사용하는 서로 다른 운행계통은 하나의 물리 그래프를 공유하게 하고, 선택 화면에서는 서비스 정체성을 보이게 한다.

### 18. 동일 역의 다중 노선 정차는 역 마스터를 공유하되 플랫폼·서비스 정차·환승 특성은 별도 개체로 기록한다.

### 19. 장래 확장 노선의 역 좌표와 geometry를 현재 영업 중인 역에 합쳐 노출하거나 플레이시키지 않는다.

### 20. 홍콩 전체를 구현했다는 선언은 운영기관별·노선별·서비스별 공개 근거와 감사 수치가 일치할 때만 한다.

---

## 2. 공식 자료와 출처 추적

### 21. 주 자료는 MTR 공식 영문/번체중문 노선도, 서비스 시간표, 역 목록, 경전철 노선도·서비스 정보를 사용한다.

### 22. 홍콩 트램은 Hong Kong Tramways 공식 6개 주요 계통 및 정류장·지도·시각표를 기준으로 한다.

### 23. 피크트램은 The Peak / Peak Tram 공식 노선·운행정보를 우선하며 역사 자료를 현재 정차 정보로 오인하지 않는다.

### 24. 고속철도는 MTR High Speed Rail 공식 목적지 및 운행 자료와 중국 본토 해당 운영기관 자료를 교차 확인한다.

### 25. 실제 선형은 OpenStreetMap의 railway `way/relation`과 공개 철도 공간자료로 추출하고, 노선도 PDF의 도식선은 실제 선형으로 사용하지 않는다.

### 26. 공식 출처가 없는 한국어 역명은 한국의 공공 관광안내·철도/관광 공식 한국어명·검증 가능한 한국어 통용 표기 순으로 확인한다.

### 27. 나무위키·위키백과는 보조 대조자료다. 1차 자료와 충돌하면 사유를 기록하고 자동 덮어쓰지 않는다.

### 28. 모든 노선·역·운행계통·선형·로고에는 `sourceUrl`, `sourceType`, `checkedAt`, `license`, `confidence` 정보를 남긴다.

### 29. 공식 노선도와 OSM이 다른 위치를 보이면 운영 여부·노선 변경 여부를 확인하고 수정 기록에 근거와 날짜를 남긴다.

### 30. 제작 당시의 기준일을 명시한다. 최신 공식 자료가 바뀌면 기존 검증 결과는 재검사 대상으로 표시한다.

---

## 3. MTR 간선 10종 완전 구현

### 31. 港島綫 Island Line: Kennedy Town–Chai Wan의 공식 역 순서, 노선색, 코드, 지상·지하 전환 구간을 검증한다.

### 32. 荃灣綫 Tsuen Wan Line: Central–Tsuen Wan의 실제 정차순서와 주요 환승역, 실제 선로 곡선을 구축한다.

### 33. 觀塘綫 Kwun Tong Line: Whampoa–Tiu Keng Leng의 실제 계통과 역·플랫폼 구성, 종점 회차 특성을 반영한다.

### 34. 將軍澳綫 Tseung Kwan O Line: North Point에서 Po Lam·LOHAS Park로 갈라지는 운행 서비스를 분리하여 구축한다.

### 35. 東涌綫 Tung Chung Line: Hong Kong–Tung Chung의 실제 영업역과 Sunny Bay 환승 및 공항철도와의 선로 구분을 검증한다.

### 36. 迪士尼綫 Disneyland Resort Line: Sunny Bay–Disneyland Resort를 독립 서비스로 구현하고 운영사의 공식 브랜드를 적용한다.

### 37. 東鐵綫 East Rail Line: Admiralty–Lo Wu/Lok Ma Chau 및 Racecourse 특별 정차 계통을 공식 시점에 맞게 구축한다.

### 38. 屯馬綫 Tuen Ma Line: Tuen Mun–Wu Kai Sha를 하나의 현재 운행계통으로 등록하고 과거 West Rail/Ma On Shan 데이터를 중복 정규 노선으로 노출하지 않는다.

### 39. 南港島綫 South Island Line: Admiralty–South Horizons의 실제 정차역과 철교·터널 geometry를 구현한다.

### 40. 機場快綫 Airport Express: Hong Kong–AsiaWorld-Expo 구간의 Hong Kong, Kowloon, Tsing Yi, Airport, AsiaWorld-Expo 정차정보를 검증해 별도 서비스로 구현한다.

---

## 4. 분기·특수 운행·역 순서

### 41. East Rail의 Sheung Shui 이후 Lo Wu와 Lok Ma Chau 방면은 분기 edge와 별도 destination pattern을 둔다.

### 42. East Rail의 Fo Tan/Racecourse 갈림 구간은 실제 철도 분기 선형을 포함하고, 경마장역 정차는 행사·운행 조건을 가진 비상시 계통으로 처리한다.

### 43. Tseung Kwan O에서 Po Lam 방향과 LOHAS Park 방향을 구분하고, 실제 시기별 각 지선의 종착·회차 서비스만 노출한다.

### 44. Tuen Ma Line은 현재 일체화된 통과 운행과 개별 선로 구간의 관계를 명확하게 하여 중간 Hung Hom을 가짜 종착역으로 만들지 않는다.

### 45. Tung Chung Line과 Airport Express가 병행하는 란터우 구간은 시각적으로 근접해도 철도 track edge를 임의로 합치지 않는다.

### 46. Sunny Bay에서는 Tung Chung/Disneyland Resort 승강장 환승이 가능하지만 두 노선을 직결열차로 만들지 않는다.

### 47. East Rail의 Lo Wu·Lok Ma Chau 출입국·국경 제약은 이동 안내 메타데이터로 관리하고 일반적인 무제한 도보환승으로 처리하지 않는다.

### 48. 모든 구간 열차는 `origin`, `destination`, `stops`, `direction`, `validity`, `serviceType`을 가지고, 실제 운행하지 않는 임의 A–B 서비스를 추가하지 않는다.

### 49. 일부 역을 통과하는 운영계통이 공식적으로 있으면 통과역을 실제 여정에서 제외하며, 물리 선로 경로는 그대로 유지한다.

### 50. 한 서비스의 마지막 역 입력 시 종료하며 미존재 역으로 계속 진행하거나 인덱스를 넘어서 루프하지 않는다.

---

## 5. 환승·보행 연결·공항 및 디즈니

### 51. Hong Kong ↔ Central처럼 지하 보행통로로 연결되는 역은 보행환승 edge로 표시하고 같은 역 ID로 강제 합치지 않는다.

### 52. Tsim Sha Tsui ↔ East Tsim Sha Tsui는 공식 조건에 맞게 역외/유료구역 외 연결 여부와 요금 규칙을 구분한다.

### 53. Mong Kok ↔ Mong Kok East 등 인근이지만 역내 직결이 아닌 경우는 거리만으로 TAB 환승을 자동 추가하지 않는다.

### 54. Admiralty, Hung Hom, Kowloon Tong, Nam Cheong, Lai King 등 주요 환승역에서 실제 연결 노선과 승강장 방향을 검증한다.

### 55. 공항철도와 Tung Chung Line의 정차역 차이를 유지한다. Olympic·Nam Cheong 등을 Airport Express가 정차한다고 가정하지 않는다.

### 56. Airport Express의 Airport와 AsiaWorld-Expo는 별개 정차역이며 실제 왕복종점·운행 상태는 공식 자료로 확인한다.

### 57. Disneyland Resort Line에는 실제 왕복하는 Sunny Bay–Disneyland Resort만 허용하며 본선과의 가상 직결 서비스는 생성하지 않는다.

### 58. 환승과 열차가 동일 선로를 이어 운행하는 `throughService`를 구분하여 이벤트·게임 UI·기록에 저장한다.

### 59. TAB은 실제 환승 가능한 시점에만 활성화하며, 입력 IME 조합 중에는 역 이름 타이핑을 방해하지 않게 한다.

### 60. 역사적 연결·미래 계획·장거리 도보 안내는 기본 환승 목록에서 제외하거나 명시적인 `walkTransfer` 옵션으로 분리한다.

---

## 6. 신계 경전철 Light Rail 12개 계통

### 61. 홍콩 MTR Light Rail의 실제 물리 선로·분기·교차·정류장을 도시철도와 별도 그래프로 구축한다.

### 62. 공식 자료에 나오는 505 계통의 정차역·행선지·방향을 개별 검증한다.

### 63. 507 계통을 실제 선형·정류장으로 생성하고 근접한 다른 서비스의 경로를 그대로 복제하지 않는다.

### 64. 610 계통의 Tuen Mun Ferry Pier–Yuen Long 장거리 운행과 모든 중간 정차·곡선 선로를 검증한다.

### 65. 614와 614P는 이름이 비슷해도 정차범위와 실제 운행구간이 다른 별개 서비스로 등록한다.

### 66. 615와 615P 역시 동명 접두어로 일괄 합치지 않고 구간·시간대·행선지를 별도 저장한다.

### 67. 705와 706은 Tin Shui Wai 순환선의 진행 방향·역 순서·폐회로 geometry를 각각 구현한다.

### 68. 751은 Tin Yat–Yau Oi 방면 서비스와 반대 방향의 공식 정차순서를 정확히 구축한다.

### 69. 751P는 상시 노선으로 고정하지 않고 공식 안내의 평일 혼잡시간대 보강 운행 조건을 기록한다.

### 70. 761P까지 포함한 505,507,610,614,614P,615,615P,705,706,751,751P,761P 총 12개 계통을 현재성 재검증 후 등록하고 불확실한 계통은 출시 차단 대상으로 보고한다.

---

## 7. Hong Kong Tramways 홍콩 노면전차

### 71. Hong Kong Tramways를 MTR 운영사와 구별되는 독립 운영사로 등록하고 실제 상표·색상 자산을 적용한다.

### 72. 공식 6개 주요 운행계통을 서비스 단위로 구축하되 노면전차 선로 원본은 공유한다.

### 73. Kennedy Town–Shau Kei Wan의 홍콩섬 동서간 본선과 각 종점 회차·도로 곡선을 실제 OSM tram track에서 추출한다.

### 74. Western Market–Shau Kei Wan 운행계통을 현재 공식 정차/행선지 자료에 맞추어 구성한다.

### 75. Happy Valley–Shau Kei Wan 계통과 Happy Valley 진입·출구 루프를 실제 선형으로 구현한다.

### 76. Shek Tong Tsui–North Point 계통을 실제 정류장과 지정된 분기 선로에 맞춰 구현한다.

### 77. Shek Tong Tsui–Causeway Bay 계통을 다른 계통과 구분하고 정차 순서를 검증한다.

### 78. Kennedy Town–Happy Valley 계통은 Happy Valley 순환과 연결 구간의 진행 방향이 정확해야 한다.

### 79. 같은 도로·정류장에 여러 트램이 겹치는 경우 지도 표시를 중복으로 겹쳐 두껍게 만드는 대신 공통 `trackSegment`를 참조한다.

### 80. 트램은 MTR 지하철 역명판을 복제하지 않는다. 실제 정류장 표지·행선판·두 층 차량 특성을 반영한 전용 디자인을 사용한다.

---

## 8. 피크트램과 다른 특수 교통

### 81. Peak Tram을 TRAM이 아닌 `FUNICULAR` 유형으로 추가한다. 상행·하행 두 차량의 선로/교행 특성을 반영한다.

### 82. Garden Road Lower Terminus와 Peak Upper Terminus의 공식 명칭·좌표·운행 상태를 확인한다.

### 83. Kennedy Road, MacDonnell Road, May Road, Barker Road 등의 중간 정류장이 현재 실제 정차 가능한지 최신 자료로 검증한다.

### 84. 1888년 개통 당시 역 목록과 현재 운영 중인 정류장 목록을 절대 혼합하지 않는다.

### 85. 피크트램 선형은 급경사·곡선·교행부를 포함하는 실제 rail geometry를 사용하고, 지도 고도 시각화는 자료가 있을 때만 활성화한다.

### 86. 피크트램의 진행률은 실제 선형 길이를 따라 보간하며 위도·경도의 단순 직선 이동을 금지한다.

### 87. 일반 지하철과 도보로 접근 가능한 Central/Admiralty 주변 연결은 독립 운임 및 실제 보행 동선이 있는 환승으로 구분한다.

### 88. 피크트램 역명판에는 MTR 노선 로고 대신 운영사 공식 브랜드를 사용한다.

### 89. Ngong Ping 360은 철도가 아닌 케이블카이므로 기본 철도 완성률 산정 대상에 섞지 않는다.

### 90. 사용자가 별도 요청할 경우 Ngong Ping 360을 `CABLE_CAR` 확장 모드로 개발하되, 항공 케이블 노선을 railway geometry로 사칭하지 않는다.

---

## 9. 고속철도 및 국경 연결

### 91. Guangzhou–Shenzhen–Hong Kong Express Rail Link의 홍콩 구간은 `HIGH_SPEED_RAIL` 물리 노선으로 등록한다.

### 92. Hong Kong West Kowloon을 고속철도 출발·도착역으로 등록하되 일반 MTR 철도역과 별개로 관리한다.

### 93. West Kowloon–Futian–Shenzhen North 등 중국 본토의 공식 정차·연결정보를 통해 단거리 서비스 패턴을 검증한다.

### 94. 중국 본토 안에서 이어지는 고속철도 선로는 `countryId=cn` 등 관할 경계를 구분하고 Hong Kong 단독 노선 집계에 중복 포함하지 않는다.

### 95. 홍콩 경계까지만 geometry를 갖춘 경우 중국 본토 목적지까지 완주할 수 있는 척하지 않는다. 전체 선형이 검증된 서비스만 완주 허용한다.

### 96. 고속철도는 열차 편명·출발지·도착지·정차 패턴을 일정 기준일의 공식 운행자료와 연결한다.

### 97. 열차 시각표가 바뀌면 고정된 가짜 운행계통으로 유지하지 말고 `checkedAt`와 유효기간을 갱신한다.

### 98. 고속철도 전용 카드·역명판·브랜드는 이용권 및 공식 소스가 확인된 실제 자산만 사용한다.

### 99. 국경검사·이민 절차가 필요한 이동은 일반 MTR의 동일 역사 내부 환승과 다르게 표시한다.

### 100. MTR/홍콩 고속철도 시스템과 중국 본토 일반 도시철도 사이에는 검증된 환승 역·통로·유효 서비스가 없으면 TAB 직결을 허용하지 않는다.

---

## 10. 역명·노선명 번체중문/영어/한국어 검증

### 101. 홍콩 역명 마스터는 `nameZhHant`, `nameEn`, `nameKo`, `aliasesKo`, `aliasesEn`, `jyutping`(선택), `source`를 지원한다.

### 102. 홍콩 공식 표기는 번체중문과 공식 영문명을 우선 저장한다. 간체자로 일괄 변환하거나 일본어 한자 발음 규칙을 적용하지 않는다.

### 103. 사용자가 입력할 정답은 한국어 `nameKo`이고, 공식 한국어 표기가 없는 경우 검증된 한국어 통용 표기 또는 별도 검수 대기 상태로 관리한다.

### 104. Central/中環, Admiralty/金鐘, Tsim Sha Tsui/尖沙咀, Mong Kok/旺角, Hong Kong/香港 등 대표역의 한국어명을 우선 검증한다.

### 105. 발음 검증에는 광둥어 원어 발음 및 영문 공식 역명을 사용하며 중국 보통화 병음만으로 한글 역명을 자동 생성하지 않는다.

### 106. 로우(Lo Wu), 록마차우(Lok Ma Chau), 포람(Po Lam), 로하스파크(LOHAS Park) 등의 철자·표기 변형은 근거가 있을 때에만 alias로 인정한다.

### 107. 공식 번체중문·영문 이름은 게임 플레이 시 같이 표시하되 두 언어를 섞은 한국어 이름을 기본 정답으로 만들지 않는다.

### 108. 동일 역명의 관광지·지명·열차 행선지와 역 자체 이름을 혼동하지 않도록 `canonicalStationId`를 유지한다.

### 109. 한국어 검수표는 원어명, 영문명, 확정 한국어명, 별칭, 자료 링크, 검수상태, 수정 전후 기록을 표시한다.

### 110. `missing nameKo`, 이상 번역, 동음이의, 동일 역의 분기별 다른 한글명, 코드/역명 불일치를 전수 감사하고 근거 없는 100% 완료 수치를 금지한다.

---

## 11. 공식 로고·노선 심볼·역명판

### 111. MTR, Hong Kong Tramways, Peak Tram, 고속철도 등 각 운영사 공식 로고를 실제 원본 자산으로 사용하고 자동 생성 SVG를 공식 로고로 주장하지 않는다.

### 112. MTR 공식 노선 색과 노선명·역 표지의 표기 규칙을 확인하여 `lineColor`, `symbol`, `operatorLogo`를 별도 관리한다.

### 113. 공식 노선 심볼이 없는 노선에 JY처럼 임의 원형 약호를 덧씌우지 않는다. `officialSymbolExists=false`로 관리한다.

### 114. 카드의 노선 심볼과 운영사 로고는 서로 다른 UI 영역에 놓고 `object-fit:contain`으로 원본 비율을 유지한다.

### 115. PLAY·HOME·RECORDS·CUSTOM·검색 목록의 모든 로고는 동일한 정식 자산 참조를 공유한다.

### 116. MTR 역명판은 번체중문·영문 역명, 한국어 학습 입력명, 실제 역번호 체계 존재 여부, 이전역·다음역 방향 정보를 명료하게 표시한다.

### 117. Light Rail 역·정류장에는 일반 MTR 역명판과 다른 경전철형 안내를 적용하며 서비스 번호를 정확히 보여준다.

### 118. Hong Kong Tramways 노면전차 정류장에는 전용 정류장판과 방향 정보를 적용한다.

### 119. Peak Tram과 HSR은 각기 다른 운송수단의 역사·정류장 안내 디자인을 적용한다.

### 120. 원본 로고 파일의 출처·라이선스·다운로드 경로를 문서화하고 빌드 결과물 재생성 시 덮어쓰이지 않는지 테스트한다.

---

## 12. OSM 실제 선로 geometry·좌표·분기

### 121. 기본 PLAY 지도는 기존 OpenStreetMap/Leaflet 기반으로 유지하고 역 사이 실제 철도 track polyline을 보인다.

### 122. 경로 선형을 공식 노선도에 그려진 직선·Bezier 도식·역 중심점 연결로 대체하지 않는다.

### 123. MTR의 지하터널·해저터널·철교·지상 곡선은 공개적으로 검증 가능한 선로 중심선을 따라 이어 붙인다.

### 124. East Rail의 Lo Wu/Lok Ma Chau 분기점과 Racecourse 선로는 분기점 좌표 및 정확한 edge 순서를 보존한다.

### 125. Tseung Kwan O의 Po Lam/LOHAS Park 분기와 터널 선로는 경로별 물리적인 갈림을 구분한다.

### 126. Light Rail의 도로 병행 구간, 궤도 교차부, 순환선 연결점, 전환기를 OSM tram/light_rail 데이터를 사용해 구축한다.

### 127. 홍콩 트램의 Happy Valley 루프와 종착 회차선, 도심 커브는 단순 타원형 가짜 루프가 아닌 실제 경로로 저장한다.

### 128. Peak Tram은 고도 데이터를 확보하면 3D/gradient 표시로 확장하되 기본 2D geometry 정확성을 먼저 충족한다.

### 129. segment는 각 역의 플랫폼 인접 선로에 정확히 스냅시키며, 끊어진 선로·점프·왕복시 뒤집힘·해외 좌표 이동을 검사한다.

### 130. 경로 데이터의 `sourceWayIds`, `sourceDate`, `segmentLengthMeters`, `geometryStatus`, `direction`을 기록하고 미검증 구간은 감사표에 모두 남긴다.

---

## 13. 한글 타이핑·열차 이동·AUTO

### 131. 한국어 IME 입력은 `input.value.normalize('NFC')`를 단일 진실원으로 삼아 도중 글자 순서를 바꾸지 않는다.

### 132. `compositionstart`, `compositionend`, `input` 중복 이벤트를 고려하여 같은 타이핑이 이중 제출·이중 콤보되지 않게 한다.

### 133. 완성형 한글 단어와 자모 진행률을 구분하고 정확도·콤보는 기존 프로젝트와 동일한 정의로 일관되게 계산한다.

### 134. 중문·영문 역명을 동시에 보여도 사용자가 한국어 정답만 타이핑하는 기본 설정을 유지한다.

### 135. 기본 모드에서 한국어 정답을 보이고 암기 모드에서는 한국어 정답을 숨기되 번체중문/영문 안내는 유지한다.

### 136. 역 이름의 괄호·공백·중점·하이픈은 현행 typing model의 자동 표시 규칙을 적용하고 괄호 속 문자·숫자는 누락 없이 입력시킨다.

### 137. 타이핑 진행률과 실제 선로 이동거리를 연결하며 경로의 누적거리로 보간한다. 경로 끝을 넘어 열차를 그리지 않는다.

### 138. AUTO에서는 정답 최종 확정 후 Enter/Space 추가 입력 없이 약 150~300ms 목표 범위에서 다음 정차역 문제로 전환한다.

### 139. SPACE에서는 사용자가 명시적으로 다음 역으로 진행하며 Space 키가 타이핑 중 공백 처리를 방해하지 않게 한다.

### 140. 입력 이벤트마다 전체 지도나 역 목록을 재생성하지 말고 문자·진행률·열차 좌표·필요한 상태만 갱신한다.

---

## 14. 노선 탐색·홈·모바일·기록

### 141. HOME의 TODAY’S ROUTE 및 추천/최근 노선에 홍콩 데이터를 정상 노출하고 일본·한국 기존 카드 레이아웃과 호환되게 한다.

### 142. PLAY 상단에서 홍콩을 선택하면 홍콩의 카테고리·운영사·노선 목록만 필터링하고 기존 국가 선택값을 몰래 바꾸지 않는다.

### 143. PC에서는 상단 여백을 최소화하여 필터·검색·노선 grid·선택 정보가 가능한 한 첫 화면에 표시되게 한다.

### 144. 휴대전화에서는 노선 선택·서비스 선택·시작역·종착역 선택을 가로 스크롤이나 텍스트 잘림 없이 이용 가능하게 한다.

### 145. 번체중문과 긴 영문역명, 한국어를 함께 출력할 때 전용 글꼴 대체(fallback)를 마련하되 사용자 폰트 파일을 불필요하게 배포하지 않는다.

### 146. 모든 카드와 역명판에 라이트/다크 대비를 점검하여 동일색 글자·배경과 로고 겹침 문제를 방지한다.

### 147. 검색은 번체중문, 영문, 한국어, 흔한 한국어 별칭, 노선 공식 코드 및 경전철 서비스 번호로 가능하게 한다.

### 148. 서비스별 정·역방향과 선택 가능한 출발역·종착역을 실제 운행 조건에 맞게 보여주고, 순환선은 실제 한 바퀴 뒤 종료한다.

### 149. RECORDS에는 홍콩 지역·실제 서비스·이동거리·정확도·콤보를 기록하며 같은 노선이라도 국가가 다른 기록과 충돌하지 않게 한다.

### 150. Guest localStorage와 로그인 사용자 클라우드 저장의 홍콩 CUSTOM·기록을 동일 규칙으로 처리하고 일본·한국 데이터의 마이그레이션을 검증한다.

---

## 15. CUSTOM 그래프·환승·직결

### 151. CUSTOM 실행 시 실제 홍콩 선로가 그려진 OSM 지도 위에서 출발역을 검색해 선택할 수 있게 한다.

### 152. 시작역에서는 그 역에서 실제로 승차 가능한 MTR·Light Rail·Tram·Peak Tram·HSR만 표시하고 연결되지 않은 노선을 숨긴다.

### 153. CUSTOM 그래프는 Station Node, Rail Edge, Transfer Edge, Service Pattern, Optional Walk Edge를 분리한다.

### 154. `NEXT STATION`은 현재 서비스의 실제 다음 정차역으로 진행하고, 완료된 경로는 실제 geometry로 누적 표시한다.

### 155. East Rail 분기역에서는 Lo Wu·Lok Ma Chau·Racecourse 등 운행 조건과 서비스 방향을 고려해 가능한 목적지 선택지를 제한한다.

### 156. Tseung Kwan O의 Po Lam·LOHAS Park 분기에서도 현재 선택한 서비스가 가지 않는 지선을 자동으로 달리게 하지 않는다.

### 157. Light Rail에서는 복수 번호가 공유하는 선로 edge와 실제 승환승 가능한 정류장을 따로 관리한다.

### 158. Hong Kong↔Central, Tsim Sha Tsui↔East Tsim Sha Tsui 같은 도보 연결은 환승 방식·운임구역 제약을 별도 표기한다.

### 159. CUSTOM 중 TAB으로 실제 가능한 환승을 실행하며, 노선 변경 시 서비스명·로고·역명판·진행경로 색·다음 역을 전부 갱신한다.

### 160. 완성 CUSTOM은 이름 지정·로컬/클라우드 저장·재실행·역방향 재생이 가능해야 하며, 역방향에서 geometry와 연결 edge의 순서도 올바르게 뒤집는다.

---

## 16. 데이터 구조·생성 파이프라인·영구성

### 161. 현재 저장소의 정규 데이터 디렉터리·스크립트·서비스 해석기를 조사한 뒤 `hk`용 master/operator/line/station/service/geometry 계층을 추가한다.

### 162. `countryId='hk'`, 안정적 운영사 ID, `canonicalLineId`, `stationId`, `servicePatternId`, `geometryId`를 중복 없이 설계한다.

### 163. 예시 데이터 스키마는 `operators`, `lines`, `stations`, `trackSegments`, `servicePatterns`, `transfers`, `assets`, `sources`, `audits`로 논리 분리한다.

### 164. 각 `station`에는 번체중문·영문·한국어명 및 `coordinates`를 저장하되 운영사 표시명과 물리 역의 ID를 혼동하지 않는다.

### 165. 각 `servicePattern`은 실제 `stopStationIds`, `trackEdgeIds`, `direction`, `validWhen`, `destination`, `sourceUrl`을 참조한다.

### 166. 명명된 열차·임시 운행 계통은 물리 노선 복사본이 아니라 원본 선로를 참조하는 서비스로 추가한다.

### 167. 홍콩 노선 index·역 검색 index를 우선 로딩하고 실제 선택 노선의 stations/geometry/services를 지연 로딩해 초기 성능을 유지한다.

### 168. 기존 `js/app.js`, `js/app.bundle.js`, `js/game.js`, `js/route-renderer.js` 등은 의존성을 확인한 뒤 수정하며 실제 파일 구성이 다르면 저장소의 구조를 우선한다.

### 169. 생성된 bundle에만 로고·역명 수정하는 오류를 금지하고, canonical source 재빌드 후 결과가 유지되는지 hash/diff 테스트한다.

### 170. **홍콩 브랜치에서만** 원본 수정 → 데이터 생성 → JS bundle 갱신 → 테스트 → (필요 시) `index.html` 캐시 버전 갱신 → 브랜치 커밋·푸시 → 별도 브랜치 미리보기 검증 순서로 개발한다. `main` 커밋·운영 GitHub Pages 배포는 사용자 병합 승인 전까지 수행하지 않는다.

---

## 17. 필수 테스트·수치·완료 보고

### 171. 모든 현재 영업 중인 MTR 일반 9개 노선과 Airport Express 1개를 실제 전 구간 정·역방향으로 테스트한다.

### 172. East Rail의 Lo Wu/Lok Ma Chau 분기, Racecourse 특별 정차, Tseung Kwan O의 Po Lam/LOHAS Park 분기를 정·역방향 시나리오로 테스트한다.

### 173. Tuen Ma Line의 Tuen Mun–Wu Kai Sha 일체형 운행과 Sunny Bay–Disneyland Resort 지선 선택을 테스트한다.

### 174. Light Rail 총 12개 대상 계통의 현재성, 순환 방향, 구간 종점, 751P 시간제 조건을 각각 테스트한다.

### 175. Hong Kong Tramways 공식 6개 계통과 Happy Valley 루프의 선로 연결·정방향·역방향·정류장 순서를 테스트한다.

### 176. Peak Tram 급경사/교행 geometry, 중간 정류장 운행 상태와 고속철도의 홍콩 국경 전후 서비스 유효성을 테스트한다.

### 177. 동일 역에 번체중문·영문·한국어가 표시되는지, 한국어 IME·AUTO·SPACE·TAB·CUSTOM·RECORDS를 PC/모바일로 테스트한다.

### 178. `missingKoNames`, `unverifiedGeometry`, `brokenCoordinates`, `duplicateStations`, `nonexistentServices`, `brokenLogoAssets`, `phantomTransfers`, `consoleErrors`를 산출한다.

### 179. 목표값 0인 항목은 실제로 검사에 통과한 경우만 0과 PASS로 표시한다. 자료 부족·미수정·실패는 FAIL 또는 INCOMPLETE와 원인을 명시한다.

### 180. 최종 보고에는 기준일·검증 소스·총 노선/역/운행계통/track edge 수·통과/미통과 목록·수정 파일·테스트 명령·**작업 브랜치/커밋 SHA·기준 main SHA·브랜치 미리보기 URL(있는 경우)·main 미변경 확인**을 기재한다. 병합·운영 배포는 사용자 승인 전까지 하지 않는다.

---

## 핵심 데이터 모델 (권장 형태 — 기존 스키마에 맞추어 조정)

```js
const hkStation = {
  id: 'hk-mtr-station-id',
  countryId: 'hk',
  nameZhHant: '中環',
  nameEn: 'Central',
  nameKo: '센트럴', // 최종 확정 표기는 공식/통용 한국어 자료와 대조
  aliasesKo: [],
  jyutping: null, // 검증된 경우에만 채움
  coordinates: null, // 실제 검증 좌표 확보 전에는 플레이 불가
  sourceUrl: null,
  nameStatus: 'unverified'
};
const hkService = {
  id: 'hk-service-id',
  canonicalLineId: 'hk-line-id',
  stopStationIds: [],
  trackEdgeIds: [],
  direction: 'forward',
  validWhen: { type: 'regular' },
  geometryStatus: 'unverified',
  sourceUrl: null
};
```

좌표 `[0,0]` 및 ID는 **스키마 예시용 placeholder**이며 실제 데이터로 수입하거나 서비스에 노출해서는 안 됩니다.

## 경로 인수 시나리오

| 시나리오 | 통과 기준 |
|---|---|
| 동철선 | Admiralty → Sheung Shui → Lo Wu / Lok Ma Chau 갈림 및 특별운행의 실제 경로 |
| 정관오선 | North Point → Tseung Kwan O → Po Lam / LOHAS Park 각각 유효한 서비스만 플레이 |
| 튄마선 | Tuen Mun ↔ Wu Kai Sha 현행 하나의 연속 여정 |
| 디즈니선 | Sunny Bay ↔ Disneyland Resort 독립 노선, Tung Chung Line 환승 구분 |
| 경전철 | 705·706 반대 방향 순환, 614/614P·615/615P 차이, 751P 유효시간 |
| 홍콩 트램 | 6개 계통과 Happy Valley 실제 루프가 화면 선로와 일치 |
| 피크트램 | 두 종점, 현행 중간 정차역, 실제 강삭선로·교행구간 |
| 고속철도 | 홍콩 서구룡 → 본토 구간 실선형·국경 메타데이터·운행 패턴 |
| CUSTOM | Central → Hong Kong 연결을 선택하고, 실제 가능한 환승·저장·역방향 재생 |
| 언어 | 번체중문/영어/한국어 정확 표기, 일본식 한자 독음·보통화 자동 음역 금지 |

## 필수 자동 검사 보고서 양식

```text
SUBTYPE — HONG KONG NETWORK BUILD
CHECKED_AT                 YYYY-MM-DD
WORK_BRANCH                feature/hong-kong-railway
MAIN_BASE_SHA              <actual SHA>
BRANCH_COMMIT_SHA          <actual GitHub SHA or NOT_COMMITTED>
MTR_CORE_LINES             <verified number / target 9>
AIRPORT_EXPRESS            <verified number / target 1>
LIGHT_RAIL_SERVICE_PATTERNS <verified number / target 12, current-status qualified>
HK_TRAM_MAIN_SERVICES      <verified number / target 6>
PEAK_TRAM                  <PASS | FAIL | INCOMPLETE>
HSR_HK_SECTION             <PASS | FAIL | INCOMPLETE>
KOREAN_STATION_NAMES       <verified / total>
CHINESE_ENGLISH_NAMES      <verified / total>
VERIFIED_GEOMETRIES        <verified / expected>
MISSING_REAL_GEOMETRY      <number>
BROKEN_BRANCH_EDGES        <number>
INVALID_SERVICE_PATTERNS   <number>
INVALID_TRANSFER_EDGES     <number>
LOGO_SOURCE_AUDIT          <verified / total>
FAKE_LOGO_PLACEHOLDERS     <number>
JAPAN_KOREA_REGRESSIONS    <PASS | FAIL | INCOMPLETE>
IME_AUTO_TAB_TESTS         <PASS | FAIL | INCOMPLETE>
CUSTOM_REVERSE_TESTS       <PASS | FAIL | INCOMPLETE>
DARK_MOBILE_TESTS          <PASS | FAIL | INCOMPLETE>
BRANCH_PREVIEW             <PASS | FAIL | NOT_CONFIGURED>
MAIN_UNCHANGED             <PASS | FAIL>
MERGE_TO_MAIN              NOT_PERFORMED
CONSOLE_ERRORS             <number or NOT_TESTED>
```

**미검증 항목을 PASS로 표시하지 마십시오.** 첫 실행에서 전수완료하지 못한 항목은 미완료 항목별 소스·막힌 이유·후속 작업·테스트를 기록하고 이어서 개발하십시오. 최종 보고의 `MAIN_UNCHANGED`는 실제 커밋 비교 후에만 PASS로 표시합니다. **홍콩 개발 완료 보고는 main 병합 허가를 의미하지 않습니다.**

## 공식 자료 기준 목록

1. [MTR 공식 System Map](https://www.mtr.com.hk/en/customer/services/system_map.html)
2. [MTR 공식 번체중문 노선·역 목록](https://www.mtr.com.hk/ch/customer/services/system_map.html)
3. [MTR Light Rail & Bus Services](https://www.mtr.com.hk/en/customer/services/lt_bus_index.html)
4. [MTR 열차 서비스·경전철 운행 시간](https://www.mtr.com.hk/en/customer/services/train_service_index.html)
5. [MTR Light Rail Route Map](https://www.mtr.com.hk/en/customer/services/more_maps.html)
6. [Hong Kong Tramways — Schedules & Fares](https://www.hktramways.com/en/schedules-fares/)
7. [Hong Kong Tramways — Interactive Map](https://www.hktramways.com/en/interactive-map)
8. [The Peak Tram 공식 역사·개요](https://www.thepeak.com.hk/en/heritage/history-of-the-peak-tram)
9. [MTR High Speed Rail — Destinations](https://www.highspeed.mtr.com.hk/en/guide/destination.html)
10. [OpenStreetMap](https://www.openstreetmap.org/)
11. [Ngong Ping 360 (철도가 아닌 선택적 케이블카 확장)](https://www.np360.com.hk/en/about-np360/overview)

## 마지막 절대 명령

> **홍콩 철도망은 지하철만으로 완성되지 않는다. 경전철 번호별 운행, 홍콩섬 2층 트램의 실제 선로, 피크트램의 강삭철도, 동철선·정관오선 분기, 중국 본토 연결 고속철도, 세 언어 역명 검증을 모두 충족한 뒤에만 완성으로 보고한다. 모든 작업은 `feature/hong-kong-railway`에서만 수행하고, 사용자의 명시적 병합 승인 없이 `main`을 수정하지 않는다.**

이 명령은 구현 지시문이며 현시점 구현 완료 보고서가 아니다.
