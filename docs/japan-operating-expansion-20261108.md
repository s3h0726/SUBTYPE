# SUBTYPE — 일본 운행계통 확장 점검 (2026-11-08)

## 반영 결과

2026-11-08 `main`에 반영한 일본 기존 노선의 **신규 운행계통 18종, 상·하행 36방향**.

| 철도회사 | 노선 | 신규 종별 | 방향 |
|---|---|---|---:|
| 오다큐 | 오다와라선 (`line-25001`) | 쾌속급행·급행 | 4 |
| 게이큐 | 본선 (`line-27001`) | 특급·쾌특(본선 구간) | 4 |
| 게이오 | 게이오선 (`line-24001`) | 특급·급행 | 4 |
| 게이오 | 이노카시라선 (`line-24006`) | 급행 | 2 |
| 세이부 | 이케부쿠로선 (`line-22001`) | 급행·준급 | 4 |
| 세이부 | 신주쿠선 (`line-22007`) | 쾌속급행·급행·준급 | 6 |
| 도큐 | 도요코선 (`line-26001`) | 특급·F라이너·통근특급·급행(종별 3종) | 6 |
| 도큐 | 덴엔토시선 (`line-26003`) | 급행·준급 | 4 |
| 도부 | 도조 본선 (`line-21001`) | 급행 | 2 |
| **합계** | **9개 물리 노선 카드** | **18종** | **36** |

노선 자체는 추가 복제하지 않았고, 기존 선로·역좌표를 재활용했다. 정차역은 원래 노선 순서를 기준으로 선택하며, 종별을 선택하면 통과역은 정답에서 제외한다. 정방향과 역방향을 하나의 운행계통 카드 아래에서 선택할 수 있게 `operatingPatternKey()`를 변경했다.

### 데이터 구조

- 원본 기반 추가 스크립트: `js/japan-extra-operating-patterns.js`
- 실제 앱 연결: `index.html`의 `js/service-data.js` 다음, `js/app.bundle.js` 이전
- 게임 렌더링: 기존 `serviceJourneysForRoute` → `resolveServiceSelection` → 운행·타이핑 로직 사용
- 18종 × 2방향 = **36개 servicePattern / serviceJourney**. 정적 점검으로 **502개 정차역 항목**(양방향 합계) 처리
- 원본 `data/tokyo-service-patterns.json`을 변경하지 않으며, 확장 스크립트는 재실행 시 동일 ID 중복 추가를 막는다
- 소스 스냅샷이 실제 현행 모든 열차의 시간표·종착역·통과역을 전부 검증한다는 의미는 **아니다**. 급행 정차역은 시간대 및 운행 구간별로 달라질 수 있다

## 참고한 정차역 출처

- 오다큐: [공식 역·노선 안내](https://www.odakyu.jp/station/), [오다와라행 쾌속급행](https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu_odawara/), [급행 정차역](https://rosen-zu.net/odakyu/odakyu-top/odakyu-rosenzu/odakyu/)
- 게이큐: [공식 노선·역 안내](https://www.keikyu.co.jp/ride/kakueki/), [본선 쾌특·특급](https://rosen-zu.net/keikyu/keikyu_honsen-top/keikyu_honsen-rosenzu/)
- 게이오: [공식 노선 안내](https://www.keio.co.jp/global/routes/), [본선 특급·급행](https://rosen-zu.net/keio/keio-top/keio-rosenzu/keio/), [이노카시라선 급행](https://rosen-zu.net/keio/keio_inogashira-top/keio_inogashira-rosenzu/)
- 세이부: [공식 노선별 정차역 안내](https://www.seiburailway.jp/railway/station/), [신주쿠선 종별별 정차역](https://rosen-zu.net/seibu-group/seibu_shinjuku-top/seibu_shinjuku-rosenzu/)
- 도큐: [공식 도요코선 급행 Q SEAT 정차역](https://www.tokyu.co.jp/railway/ticket/q-seat/ty/), [도요코선 특급·통근특급](https://rosen-zu.net/tokyu/tokyu_toyoko-top/tokyu_toyoko-rosenzu/), [덴엔토시선 급행·준급](https://rosen-zu.net/tokyu/tokyu_denentoshi-top/tokyu_denentoshi-rosenzu/tokyu_denentoshi/)
- 도부: [공식 도조 본선 운행 종별](https://www.tobu.co.jp/railway/guide/line/tojo_line.html), [급행 정차역 참고](https://rosen-zu.net/station-stops-top/station-stops/%E5%B0%8F%E5%B7%9D%E7%94%BA%E5%9F%BC%E7%8E%89%E7%9C%8C%E9%A7%85%E3%81%AE%E8%B7%AF%E7%B7%9A%E5%9B%B3/)

## 검증과 미완료

`npm run test:jp-extra-services`는 36방향에 대해 다음을 검사한다.

1. 기준 물리 노선 카드 존재 및 `geometryReady===true`
2. 기등록 역 ID만 사용하고 중복·역순 정차역이 없는지
3. 정방향/역방향의 출발·종착과 선로상 순서가 일치하는지
4. 해당 종별에 게임에서 선택할 `serviceJourney`가 있는지
5. 2회 패치 시 중복 추가가 발생하지 않는지
6. 앱 시작 전에 데이터 확장 스크립트를 로드하는지

브라우저에서 실제 타이핑 완주, 각 운행계통 실제 일자별 시간표 대조, 열차별 출발·도착 행선지와 직통운행 전 구간 검증은 **별도 검증 필요**.

**전국의 모든 미검증 계통 완료를 의미하지 않는다.** 기존 `reports/jr/destination-audit.json`에는 JR 6개사의 조사대상 907개 계통 중 정적 불일치/보수 필요 371개가 남아 있다. 일부는 폐역·선형 누락·복잡한 직통운행·정차역 순서 불일치가 원인이므로 수치만 맞추려고 일괄 활성화하지 않았다. 다른 사철·제3섹터의 미수록 종별 역시 추가 조사가 필요하다. 이 파일의 검증은 일본 전국 서비스 목록의 완전성 인증이 아니다.
