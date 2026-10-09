# 한국 실제 선형 적용 규칙

지도에 **실제 철도 선로가 아닌 역간 직선**을 실제 선형이라고 표시하지 않습니다.

- 노선별 OpenStreetMap 철도 `route` 관계(relation)와 실제 개통 구간을 확인합니다.
- OSM의 relation ID를 포함한 GeoJSON 원본을 보관하고 `node tools/import-korea-osm-geometry.js --route <route-id> --file <geojson> --relation <id>` 로 불러옵니다.
- 관계 선로의 이어짐, 열차 방향, 역 사이 순서, 각 정차역과 선형 간 일치 여부를 확인한 다음에만 `geometryReady`를 켭니다.
- 운영기관과 역 순서 출처는 개별적으로 검증합니다. 운영기관별 회사 소유와 열차 운행회사는 서로 다를 수 있습니다.
- 분기선은 **같은 노선 선택 카드의 행선지 메뉴**에서 선택하되, 내부 경로 ID와 역순서는 보존합니다.

참고: https://wiki.openstreetmap.org/wiki/Ko:Relation:route (OSM relation 모델)

2026-10-09 현재: 실제 OSM 선형 데이터를 수집·역간 검증하여 적용하는 절차는 아직 완료되지 않았습니다.
