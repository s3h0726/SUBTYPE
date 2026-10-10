# 대한민국 철도 재구축 원본 모델

이 디렉터리는 기존 `generated/routes` 수록본과 분리된 새 원본 계층이다.

- `passenger-lines/`: 노선 선택 화면에 한 번만 나타나는 여객 노선
- `operatingPatterns`: 같은 카드에서 고르는 본선·지선·순환·행선 계통
- `geometry/`: OSM relation/way ID를 보존한 방향별 실제 선형 후보
- `sourceRefs`: 역 순서·운행계통·선형을 각각 검증한 출처와 라이선스

`geometryReady`와 `gameValidationStatus`는 서로 독립적이다. OSM 위상 검사를
통과해도 공식 역 순서 확인, 운행계통 확인, 브라우저 주행 검증이 남아 있으면
노선을 배포 완료로 승격하지 않는다.

서울 2호선 파일은 이 모델의 첫 기준 구현이다. 하나의 노선 아래 본선 순환,
성수지선, 신정지선을 두며 OSM route master relation `7625892`의 여섯 방향
relation을 역 좌표 근접 스냅 없이 원래 member 순서대로 추출한다.
