# GTX-A 수서–동탄 실제 선로 (OSM 근거)

## 목적과 운영 사실

이 자료는 **기존** `kr-rail-national-gtx-a` 노선 카드에 추가한 수서–동탄 양방향 운행계통의 실제 지도 선로다. **새 노선 카드나 가상의 역간 직선을 만들지 않는다.** 기존 운정중앙–서울역 구간 및 운행계통은 보존한다.

국토교통부는 수서–동탄 구간이 SRT 수서평택고속선 약 30km를 공용한다고 설명했다.

- 공식 노선·4개 역·32.7km: https://cppr.koti.re.kr/site/railwyDetail?railwyId=RID241201000009
- 공용 선로 국토교통부 설명: https://www.korea.kr/news/policyNewsView.do?newsId=148910012

## 실제 OSM 선로 근거

- 고정 원본: `data/kr/v2/source/osm-ways.json` 및 `data/kr/v2/{services,geometry,stops,stations}.json`
- 원본 시점: 2026-10-14 한국 OSM 스냅샷 (저장소 출처 고정)
- 라이선스: ODbL-1.0, © OpenStreetMap contributors
- 수서→동탄: [GTX-A OSM relation 17413294](https://www.openstreetmap.org/relation/17413294), 9개 실제 선로 way, **98개 좌표점, 33.10094km**
- 동탄→수서: [GTX-A OSM relation 17413296](https://www.openstreetmap.org/relation/17413296), 9개 실제 선로 way, **97개 좌표점, 32.66634km**

모든 인접 way의 경계에서 **OSM 노드 ID와 위경도가 완전히 일치하는지** 검사한다. 좌표는 원본 way의 WGS84 `[위도, 경도]` 값을 그대로 기록한다. 역 사이를 임의로 직선 보간한 지점은 없다. 두 방향 선로는 각각 실제 원본에 따라 따로 사용한다.

| 방향 | 수서 X108 | 성남 X109 | 구성 X110 | 동탄 X111 |
| --- | --- | --- | --- | --- |
| 수서→동탄 | index 0 | index 40 | index 73 | index 97 |
| 동탄→수서 | index 96 | index 54 | index 24 | index 0 |

원래 OSM GTX-A 서비스 관계는 성남역의 여객 정차가 누락돼 있으므로 별도로 등록된 `성남 GTX` OSM 정차지 `10787176950`을 확인하고, **그 정차지에서 50m 이내인 기존 OSM 원본 선로 노드**를 두 방향에서 선택한다. 이때 새로운 선로 좌표나 가상 플랫폼은 만들지 않는다.

원본 GTX-A 여객 관계의 일부 역 진입 선로는 OSM `service=siding` 태그를 갖고 있다. 이는 승강장 접근에 사용하는 선로일 수 있으므로 **운행계통 관계에 이미 포함된 way만** 채택하고, `service=yard`와 `service=spur`는 배제한다. 이 GIS 복구가 운영기관의 개별 편성·시간표나 열차운전 관련 안전 승인을 의미하지는 않는다.

## 구현과 검증

- 원본에서 재현 가능한 검사/생성기: `node tools/build-gtx-a-srt-geometry.cjs`
- 좌표 자료를 다시 출력할 때: `node tools/build-gtx-a-srt-geometry.cjs --dump`
- 런타임 자산: `js/gtx-a-south-track-data.js` (위 원본에서 생성된 좌표 + 각 way ID·version)
- 남부 계통 해석: `js/gtx-a-south-service.js`
- 검사: `node tools/test-gtx-a-south-card.cjs`
- 검사 대상: 기존 노선 카드 ID 보존, 북부 계통 유지, 남부 양방향 4개 역 및 선로 순서, 실제 OSM 노드·좌표 해시 동일성, 9개 way의 인접 노드 연결, 3개 역간 세그먼트, 실제 지도 선형 활성화

※ 약 32.7km는 사업 구간의 공시 연장이다. OSM 남·북행 주행 선로의 좌표 기반 길이는 플랫폼 접근 선로와 원본의 지도 정밀도에 따라 약간 달라진다.
