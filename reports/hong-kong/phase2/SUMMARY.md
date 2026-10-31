# 홍콩 철도 2차 개발 보고

상태: **INCOMPLETE**. 최종 점검 2026-10-22, 운행자료·역명·OSM 조사 기준 2026-10-20. 기존 feature/hong-kong-railway에서만 작업하며 main 병합·리베이스·운영 배포는 수행하지 않았습니다.

| 항목 | 변경 전 | 변경 후 |
|---|---:|---:|
| 전체 서비스 패턴 | 55 | 57 |
| 플레이 가능한 서비스 패턴 | 2 | 6 |
| 한국어 역명 검증 완료 | 2 | 26 |
| 정차 순서 검증 완료 | 25 | 43 |
| 실제 geometry 검증 완료 | 50 | 53 |
| 한국어 명칭 미입력 | 270 | 246 |
| 한국어 명칭 검토 대기 | 275 | 251 |
| geometry 문제 relation | 9 | 6 |
| 로고 사용 승인 | 0 | 0 |
| 공식 MTR 노선색 검증 | 0 | 10 |
| 요구사항 PASS | 36 | 45 |
| 요구사항 INCOMPLETE | 143 | 134 |

역명 수는 기존 감사와 동일한 277개 역/방향별 정류장 레코드 기준입니다. 실제 물리 역 전체 수를 새로 확정한 수치는 아닙니다. 요구사항 90번 선택 케이블카는 기존 NOT_REQUESTED 1개를 유지합니다. 전체 180개 항목 상태는 [requirements.json](../../../docs/hong-kong/requirements.json) 및 [comparison.json](comparison.json)에 보존했습니다.

## 추가 플레이 승인

남홍콩섬선 UT/DT(각 5역), 공항철도 DT/UT(각 5역)를 추가했습니다. 기존 디즈니랜드 DT/UT를 유지해 총 6개입니다. 공식 MTR 정차 순서·종점과 각각의 방향별 OSM railway 경로를 대조하고 6개 방향 모두 브라우저 완주를 확인했습니다. 신규 네 방향의 거리: 6.95 / 6.93 / 34.94 / 34.95km. 반대 방향 geometry를 단순 뒤집어 사용하지 않습니다.

Island·Tsuen Wan·Kwun Tong·Tung Chung·East Rail·Tuen Ma·Tseung Kwan O는 필요한 모든 한국어 역명을 확인하지 못해 차단을 유지했습니다. 우선순위별 남은 역 코드는 [mtr-priority-review.json](mtr-priority-review.json)에 기록했습니다. 승인된 역명은 물리 역 코드로 공유합니다. 한국어 이름이 없는 역을 생성 번역으로 승인하지 않았습니다.

한국어 출처의 한계: 일부 공식 HKTB PDF는 직접 다운로드가 403으로 차단되어 검색 인덱스의 공식 문서 발췌를 대조했습니다. 칭이·에어포트·아시아 월드 엑스포·올림픽은 2014년 HKTB 발행본의 제3자 보관본을 사용했고 medium confidence로 구분했습니다. 이 자료는 표기 근거이며 현재 운행 근거는 재수집한 MTR CSV입니다. 공식 도메인에서 PDF 전체를 내려받아 검수한 것으로 보고하지 않습니다. [역명별 출처](../../../data/hk/master/korean-name-review.json)를 확인하십시오.

## 경전철·선로

공식 LR 표의 종착역 departure=-를 무정차로 해석하던 오류를 수정했습니다. 대체 승강장 행은 물리 정류장으로 통합하고 방향별 정차 차이를 유지했습니다. 누락 종착역이 있는 614P relation 5955256은 검증 완료에서 제외했습니다. 정차 순서 검증은 총 43개이며, 경전철은 한국어 역명 등 승인 요건 부족으로 아직 PLAY에 추가하지 않았습니다.

506P·507P·720·610P는 공식 시간·방향·경유와 학교 방학 예외를 [조사 원본](../../../data/hk/master/light-rail-service-review.json)에 기록했습니다. 507P의 방학 예외는 자료에서 확인되지 않아 불명으로 남겼습니다. 전체 정류장 순서가 없는 경유 안내만으로 신규 상시 운행을 만들지 않았습니다. 751P도 조건부 운행으로 보존했습니다. 공유 선로는 기존 track edge를 재사용합니다.

9개 geometry 문제를 모두 개별 조사했습니다. 706 relation 2941790은 실제 폐곡선의 시작점 정렬로, 751/751P 6485218·6485219는 공유 way의 최신 OSM 버전 선택으로 해결했습니다. 임의 직선·도로 way 추가는 0개입니다.

남은 relation ID: **3263757, 3264047, 4088518, 5317704, 6582965, 6582966**. 트램 두 건은 종착역 이후에 배치된 stop 순서, Peak Tram은 stop/way 방향 불일치, Tung Chung은 약 765m 원본 단절, 옛 Tuen Ma 두 건은 2021 종료·razed/disused 선로입니다. 현재 승인 서비스와 별도로 차단합니다. [9건 개별 조사](geometry-investigation.json). 문제 relation 6개와 미검증 서비스 geometry 4개는 서로 다른 집계입니다.

## 로고·역명판

MTR·Tramways는 공식 원본 위치·이용조건을 기록했고 Peak Tram은 원본 접근 제한으로 INCOMPLETE입니다. 재배포 사용 승인 0/3으로 로고를 삽입하거나 모방 생성하지 않았습니다. MTR 10개 노선색은 공식 system map PDF의 spot color RGB 대체값을 추출·대조했습니다. 별도 웹용 브랜드 HEX 규격으로 주장하지 않습니다. 역명판은 승인된 6개 서비스에서 번체중문·영문·한국어, 실제 역 코드와 노선 정보를 표시합니다. 나머지 역명·운영사 로고까지 완성한 상태는 아닙니다. [자산 감사](../../../data/hk/master/asset-review.json).

## 회귀·제한

- 자동 네트워크·한국·선로·접근정책 등 **86/86 PASS**, 타이핑·IME 및 기존 데이터/운행계통/단일원본 검사 PASS. 상세 [validation.txt](../validation.txt). 한국·일본 데이터와 배포 workflow 변경 없음.
- 기존 source-regex UI 감사 실패 4개는 FAIL 그대로 유지: inputValueIsNfcSoleSource, koreanProgressUsesAnswerLength, autoAdvance150ms, firstAnswerIsStartStation. 기존 main과 동일하며 신규 PASS로 계산하지 않았습니다.
- 신규 SIL/AEL 양방향, 기존 DRL 양방향 완주; 모바일 390×844 라이트/다크·암기 정답 숨김, 데스크톱 1280×900, AUTO/SPACE 확인. SIL UT는 열차 이동 애니메이션으로 검사했고 다른 기록된 완주는 reduced motion을 사용했습니다. 네이티브 OS IME는 NOT_TESTED이고 자동 IME 검사를 대신 실제 OS 입력 검사로 주장하지 않습니다.
- CUSTOM ADM→OCP→WCH 저장·새로고침·재실행·완주 PASS. 실제 동일 서비스·연결 좌표를 확인해 반대 방향 서비스 혼입을 차단했습니다. 직접 #custom-editor 접속 때 HK 검색망이 비는 문제도 수정했습니다.
- 한국·일본 홈 전환 PASS. 기존 기능 자동 회귀 PASS, 이번 단계에서 한국·일본 모든 노선 브라우저 완주를 반복하지 않았습니다.
- Supabase 설정 부재 항목은 **NOT_TESTED** 유지. 클라우드 저장·인증 성공으로 보고하지 않습니다. 콘솔 오류 관측 0(로컬 검증 범위).

재생성 SHA-256 일치: [build-reproducibility.json](build-reproducibility.json). 원본 조사 파일·컴파일러·생성 JSON을 함께 커밋합니다. 테스트 화면은 output/hk/phase2-*.jpg(로컬 증거, Git 제외)에 보관했습니다. 브랜치 커밋 SHA는 audit.json의 branchCommitSha가 가리키는 구현 커밋이며, 보고서 자체를 추가하는 마지막 커밋 SHA는 최종 응답에 별도로 기록합니다.

구현 커밋 SHA: `a0877152bd0b6b691f642427a6764c704f906297`.
