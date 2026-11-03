# 전체 CI 확인 사항

태국 통합 구현의 최초 main 배포 커밋은 `bd9b2fe8e675cb588fdea5e316e62937f8580a45`이다. [Pages 작업](https://github.com/s3h0726/SUBTYPE/actions/runs/41648192570)은 태국 정적·출처 검사, 공통 자유주행 검사, Chrome 화면 배치 검사, 앱 번들·Pages 배포를 모두 통과했다. 실제 운영 색인과 23개 gzip 노선의 해시, 골드라인 3역 완주도 확인했다.

전체 저장소의 모든 CI가 통과한 것은 아니다. 다음을 구분한다.

- 공통 `game.js` 변경은 홍콩의 기존 엔진 지문을 만료시킨다. 이를 숨기거나 해시만 바꾸지 않고 `complete-hk-network.cjs`로 105개 계통을 AUTO/SPACE 각각 실제 Game/TypingController 로직으로 재완주했다. 전체 210회 완주와 홍콩 최신 검증 23개가 통과했으며, 홍콩 원선형·정차·역명은 바꾸지 않았다. 지도 그리기와 애니메이션은 이 DOM 검증기의 모의 구현이므로 실제 브라우저 인증과 구별한다.
- [구형 홍콩 대량 검사](https://github.com/s3h0726/SUBTYPE/actions/runs/41648192399)는 공개 계통 수를 92개로 고정하지만 최신 데이터는 105개다. 구형 `complete-hk-bulk.cjs`도 과거 3294f7a와의 원본 비교가 이후 507P 환승 추가와 충돌한다. 최신 `complete-hk-network.cjs`와 `test-hk-completion.cjs`를 사용해 검증했으며, 과거 검사나 정당한 신규 원자료를 삭제하지 않았다.
- [이름 표 내보내기](https://github.com/s3h0726/SUBTYPE/actions/runs/41648192605)와 [이요 철도 검사](https://github.com/s3h0726/SUBTYPE/actions/runs/41648192524)는 웹 편집값 `마츠야마 시내선 1호선`과 생성 데이터 `마츠야마 시내선 1호선(외선순환)`의 불일치를 지적한다. 해당 일본 원본·웹 편집값·내보내기 코드는 통합 직전 `93b63f8c7`과 동일하게 보존했다. 사용자의 동시 이름 편집을 되돌리지 않았다.
- [이름 편집 배포 검사](https://github.com/s3h0726/SUBTYPE/actions/runs/41648192365)는 `line-99812:station-9980803` 편집 대상 누락으로 실패한다. 해당 일본 원본과 편집값 역시 태국 통합에서 바꾸지 않았다.
- [전국 역명 재생성 감사](https://github.com/s3h0726/SUBTYPE/actions/runs/41648191935)는 기존 보고서와 재생성 결과의 차이를 지적한다.
- [공통 구형 데이터 검사](https://github.com/s3h0726/SUBTYPE/actions/runs/41648192381)는 일본 station master 중복을 포함한 기존 원본 문제로 실패한다. `data/stations`, `data/lines`, `data/generated`, 관련 검증 코드는 통합 직전 main과 동일하다. 같은 검사를 호출하는 행선지·지하철 복구 작업에도 이 실패가 나타난다.

따라서 태국 165개 실제 브라우저 완주·공개 노선 해석·이름 편집·기록·운영 배포 통과와, 저장소 전체 CI의 기존 실패를 함께 보고한다. 한국·홍콩·대만·일본 국가 선택 전환은 실제 브라우저에서 확인했으나 이것으로 기존 국가의 모든 데이터 문제를 해결했다고 주장하지 않는다.
