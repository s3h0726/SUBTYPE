# SUBTYPE Korea transport data

대한민국 데이터는 일본 데이터와 분리됩니다. 운영기관은 `operators`, 정류장·역·선착장은 `stops`, 노선은 `routes` 아래에서 관리합니다.

- 철도와 도시철도: `routes/rail/<route-id>/`
- 버스: `routes/bus/<region>/<route-id>/`
- 수상교통: `routes/river-bus/<route-id>/`
- 버스 왕편/복편은 각각 별도의 `directions/*/direction.json`입니다. 한 방향을 `reverse()`하여 만들지 않습니다.
- 실제 선형이 확보되지 않은 노선은 `geometryStatus: "missing"`으로 남기며 역간 직선을 실제 경로로 저장하거나 렌더링하지 않습니다.
- `generated`는 빌드 산출물이므로 직접 수정하지 않습니다.

현재 데이터는 전국 확장을 위한 1차 대표 노선입니다. 전국 버스 완성본으로 가장하지 않습니다. 한국 선택 화면은 `철도 / 버스 / 수상교통 / 기타 교통`을 먼저 나누며, 버스는 `지역 → 지역 공식 분류 → 노선` 순서로 필터링합니다.

## OpenStreetMap geometry import

OSM geometry는 플레이 중 내려받지 않고 개발 시 relation을 정규화해 각 방향 폴더의 `geometry.json`으로 저장합니다. importer는 relation member way 순서와 topology를 사용하고, 반대 방향 way는 복사본만 뒤집습니다. ordered stop node의 한국어명과 canonical stop sequence를 전부 대조하고 선로 endpoint 거리를 검증하며, 불연속 way가 하나라도 있으면 저장하지 않습니다. 더 긴 OSM 운행계통의 연속 부분구간을 사용할 때도 canonical 첫 역부터 마지막 역까지만 잘라냅니다.

```bash
npm run import:osm-route -- \
  --relation 4729409 \
  --route kr-seoul-line-2 \
  --direction inner \
  --direction-file data/kr/routes/rail/seoul-line-2/directions/inner/direction.json \
  --stops-file data/kr/stops/rail/stops.json \
  --output data/kr/routes/rail/seoul-line-2/directions/inner/geometry.json
```

서울 2호선 본선은 OSM route master `7625892` 아래 내선순환 relation `4729409`, 외선순환 relation `2404374`를 사용합니다. 성수지선과 신정지선 relation은 본선 geometry에 억지로 합치지 않습니다.

신분당선은 route master `7728256` 아래 신사→광교 `6060963`, 광교→신사 `12814871`을 사용합니다. 수도권 전철 1호선 대표 계통은 route master `8691899`의 소요산↔인천 관계 `8691809`/`8691898`에서 canonical 청량리↔인천 연속 부분구간만 추출합니다. route master의 현재 하위 운행계통은 `npm run inspect:osm-master -- --master <relation-id>`로 조회할 수 있습니다.

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
