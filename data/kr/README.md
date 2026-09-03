# SUBTYPE Korea transport data

대한민국 데이터는 일본 데이터와 분리됩니다. 운영기관은 `operators`, 정류장·역·선착장은 `stops`, 노선은 `routes` 아래에서 관리합니다.

- 철도와 도시철도: `routes/rail/<route-id>/`
- 버스: `routes/bus/<region>/<route-id>/`
- 수상교통: `routes/river-bus/<route-id>/`
- 버스 왕편/복편은 각각 별도의 `directions/*/direction.json`입니다. 한 방향을 `reverse()`하여 만들지 않습니다.
- 실제 선형이 확보되지 않은 노선은 `geometryStatus: "missing"`으로 남기며 역간 직선을 실제 경로로 저장하지 않습니다.
- `generated`는 빌드 산출물이므로 직접 수정하지 않습니다.

현재 데이터는 전국 확장을 위한 1차 대표 노선입니다. 전국 버스 완성본으로 가장하지 않습니다.

## Phase 1 representative routes

- 서울 지하철 2호선: 내선·외선순환
- 수도권 전철 1호선: 청량리~인천 대표 계통, 서울교통공사·코레일 및 물리노선 조합 보존
- 신분당선
- KTX 서울~부산 대표 정차 패턴
- 서울 143번: 왕편·복편 독립 순서
- 마포13번: 홍대후문·창전삼성아파트 순환 패턴
- 경기 광역급행 M5107: 서울역·경희대 방면 독립 순서
- 한강버스 동부·서부노선

`npm run test:korea`는 대표 노선 존재, mode, 정차 수, 독립 방향, 복수 운영사 1호선, KTX 서비스 모델, 타이핑/차량/기록 어댑터와 일본 데이터 수 보존을 확인합니다.
