# Data sources and audit scope

검증일: **2026-08-22**

## 철도 선형과 역 좌표

- 일본 국토교통성 국토수치정보 철도 데이터 N02, 2025년도판
- 원문: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html
- 사용 필드: 운영회사, 물리 노선명, 철도 중심선, 역명, 역 그룹 코드

`tools/build-rail-system.js`는 큐레이션 103개 노선을, `tools/build-nationwide-geometry.js`는 전국 596개 노선 청크를 N02 그래프에 대응시킵니다. 큐레이션 노선은 103/103, 전국 청크는 583/596이 `geometrySource: MLIT-N02-2025` 실제 철도 선형을 갖습니다. 나머지 13개는 억지 직선을 만들지 않고 `GEOMETRY_MISSING.json`에 격리했습니다.

동명역은 역명만으로 합치지 않습니다. 예를 들어 도카이도 신칸센 신후지역은 시즈오카현의 `station-mlit-005554`(35.142068, 138.663009)이며 홋카이도 네무로 본선 신후지역과 별도 ID입니다.

## 노선·역 순서

- 駅データ.jp: https://www.ekidata.jp/
- 재배포 스냅샷: https://github.com/ny-a/ekidata
- 이용조건: https://www.ekidata.jp/agreement.php

EkiData의 회사·노선·역 코드와 역 순서를 기초 레코드로 사용하고 N02 복합 대응으로 좌표·물리 선형을 보정합니다. 도쿄 행정구역에서 노선을 자르지 않으며 각 플레이 노선의 제공 범위 전체를 유지합니다.

전국 생성기는 `node tools/generate-data.js --nationwide`입니다. 검색용 경량 `data/nationwide/index.json`과 노선별 `data/nationwide/routes/*.json`을 나눠 저장하여 선택 전에는 596개 상세 역 배열을 한꺼번에 읽지 않습니다.

## 교통 오픈데이터 참고 범위

- 국토교통성 GTFS-JP 안내: https://www.mlit.go.jp/sogoseisaku/transport/sosei_transport_tk_000067.html
- 공공교통 오픈데이터센터/ODPT 공개 데이터: https://challenge2025.odpt.org/ja/opendata.html
- ODPT GTFS/GTFS-JP 카탈로그: https://ckan.odpt.org/ja/dataset/?_organization_limit=0&license_id=odpt-ptodcll&res_format=GTFS%2FGTFS-JP

위 카탈로그는 운행 데이터 확장·교차검증 후보입니다. 이번 정적 번들에는 제공 조건과 범위를 개별 확인하지 않은 GTFS를 무단 병합하지 않았습니다.

## 운행 계통

- JR East Narita Express: https://www.jreast.co.jp/en/multi/nex/
- Tokyo Metro Fact Book 2026: https://www.tokyometro.jp/lang_en/corporate/ir/library/factbook/pdf/factbook_2026.pdf

N'EX는 물리 노선이 아니라 `trainService`로 저장하며 신주쿠 방면과 오후나 방면 정차 패턴 및 별도 실제 선형을 갖습니다. 후쿠토신선–도큐 도요코선–미나토미라이선은 `throughService`로 저장하며 시부야·요코하마 경계에서 운영사, 노선명, 로고, 코드와 안내색을 바꿉니다.

## 신칸센

- JR Central 역 안내: https://global.jr-central.co.jp/en/info/station/index.html
- JR East 노선도: https://www.jreast.co.jp/multi/en/routemaps/
- JR West: https://www.westjr.co.jp/global/en/timetable/
- JR Hokkaido: https://www.jrhokkaido.co.jp/global/english/train/shinkansen/
- JR Kyushu: https://www.jrkyushu.co.jp/english/train/shinkansen.html

도카이도·산요·도호쿠·홋카이도·조에쓰·호쿠리쿠·규슈·니시큐슈·야마가타·아키타 10개 계통을 전 구간 역 목록과 N02 실제 선형으로 제공합니다.

## 지도와 라이브러리

- Leaflet 1.9.4: https://leafletjs.com/
- OpenStreetMap: https://www.openstreetmap.org/copyright

게임 지도는 OpenStreetMap 한 종류만 사용합니다. 게임 한 판에서 Leaflet 지도 객체, OSM 타일 레이어, 열차 마커는 각각 한 번만 생성합니다.

## 한국어 표기와 자산 감사

한국어 역명에는 수동 교정값과 일본어 읽기 기반 전사가 함께 있으며 각 레코드의 `nameSource`/`nameKoSource`로 구분됩니다. 공항명, 핵심 노선명과 오류가 확인된 표기는 수동 교정했습니다. 자동 전사 레코드 전부가 운영사 공식 한국어 표기라는 뜻은 아닙니다.

운영사 로고와 노선 심볼은 `data/operator-assets.json`, `data/route-symbol-assets.json`, `ASSET_CREDITS.md`에서 출처와 재배포 상태를 확인할 수 있습니다. 현재 플레이 노선에 실제 SVG가 연결된 심볼은 7개이며, 나머지 96개는 검증되지 않은 모조 이미지를 만들지 않고 문자 코드 또는 `—`로 표시합니다. 따라서 전체 실제 심볼 수집은 미완료 감사 항목입니다.

전국 8,824개 고유 역 중 8,658개는 자동 전사 기반이라 사람 검수가 필요합니다. 한국어 필드의 일본어 문자 잔존은 0건이지만 이는 관용 표기 검증 완료를 의미하지 않습니다. 전국 공식 심볼 자산 감사 역시 `INCOMPLETE`이며, 실물 자산이 없는 곳은 원형 모조 로고를 만들지 않습니다.
# Canonical Korean naming source

SUBTYPE의 운영사명, 철도회사명, 노선명, 역명, 지선명, 계통명, 열차 서비스명과 특급명 등 한국어 철도 고유명칭은 나무위키를 canonical Korean source family로 사용합니다.

일본 운영사 공식자료는 일본어 공식명·Kana·역번호·운행정보를 확인하는 검증 출처입니다. 공식 한국어 표기는 필요하면 `officialKo`에 별도로 보존하지만, 나무위키와 대응을 확인하지 않은 상태에서 canonical 한국어명의 출처로 확정하지 않습니다.

나무위키 직접 접근이 차단된 경우 실제 검색 색인에서 문서 URL과 대상 대응을 확인합니다. 직접 문서나 검색 색인 어느 쪽에서도 확인하지 못한 값은 `namuwiki-unresolved`, `REVIEW_REQUIRED`로 유지하며 URL을 추측하지 않습니다.
