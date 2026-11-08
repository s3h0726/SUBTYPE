# SUBTYPE 일본 운행계통 확장 현황 — 2026-11-08

## 실제 적용

- 신규 `js/japan-service-pattern-expansion-20261108.js`를 `js/service-data.js` 다음, 앱 번들보다 먼저 로드한다.
- 기존 `TRT_TOKYO_SERVICE_PATTERNS`에 **9개 열차종별, 17개 운행방향**을 추가한다.
- 오다큐 오다와라선(빠른 급행/급행 상·하행, 통근급행 상행 구간): **5방향**
- 게이큐 본선(특급, 쾌특 본선 구간 상·하행): **4방향**
- 게이오 본선(특급, 급행 상·하행): **4방향**
- 세이부 이케부쿠로선(급행, 준급 상·하행): **4방향**
- 상·하행은 개별 ID 및 정차역 목록을 사용한다. 오다큐 쾌속급행의 `開成` 상행 정차 차이를 별도로 반영한다.
- 기존 선형/역 ID와 연결되는 계통만 공개하고, 데이터에 없는 연결 선로를 직선으로 생성하지 않는다.
- 새 계통은 실제 종일 운행표와 열차번호를 검증한 자료가 아니라 **공개 정차 패턴을 재현한 게임 계통**이다. 쾌특(본선 구간) 등은 다른 노선과 직통하는 열차의 특정 노선 구간만 나타낸다.

## 원본 정차 패턴 자료

- [오다큐](https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/) / [오다큐 공식 상모오노 역](https://www.odakyu.jp/station/sagami_ono/)
- [게이큐](https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/keikyu_honsen/) / [게이큐 공식 열차종별](https://keikyufaq.fastcloud.jp/fa/keikyucall/web/knowledge774.html)
- [게이오](https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/) / [게이오 공식 신주쿠 역](https://www.keio.co.jp/train/station/ko01_shinjuku/)
- [세이부](https://rosen-zu.net/seibu-group/seibu_ikebukuro-top/seibu_ikebukuro-rosenzu/seibu_ikebukuro_hanno/) / [세이부 공식 역별 정차종별](https://www.seiburailway.jp/railway/station/)

## 아직 미검증 또는 미등록된 전국 계통

**일본 전국 전체를 추가하거나 최신 시간표를 검증한 결과가 아니다.**

기존 JR 여섯 여객회사 `reports/jr/destination-audit.json`에는 패턴 **907건**, 정적 일치 **536건**, 보수 필요 **371건**이 기록되어 있다. 이 재고는 과거 생성 당시의 정적 감사이며 최신 시간표 확정 자료는 아니다.

| 운영사 | 전체 기존 패턴 | 정적 일치 | 보수 필요 |
|---|---:|---:|---:|
| JR 동일본 | 377 | 258 | 119 |
| JR 도카이 | 69 | 37 | 32 |
| JR 서일본 | 271 | 135 | 136 |
| JR 홋카이도 | 67 | 19 | 48 |
| JR 시코쿠 | 30 | 29 | 1 |
| JR 큐슈 | 93 | 58 | 35 |
| **합계** | **907** | **536** | **371** |

기존 오류 유형(한 패턴에 둘 이상 해당 가능): 정차역 누락 355건, 순서 문제 42건, 선형 문제 42건, 미등록 노선 9건. 폐역·오래된 TrainLCD 행선지나 서로 단절된 선로의 계통을 임의로 활성화하지 않는다.

향후 확대 시 운영사 공식 최신 시간표 또는 행선지 자료, 정차역 매핑, 선로 연결 및 실제 완주 검사를 별도로 통과시킬 것.

## 점검

`node tools/test-japan-service-expansion-20261108.cjs`

이 검사는 파일의 정적 일관성/브라우저 스크립트 연결만 점검한다. 브라우저 실제 게임 완주는 별도 확인 대상이다.
