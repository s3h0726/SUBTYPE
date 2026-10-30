# JR 전 노선 행선지·구간명 검증

출처 확정: 나무위키 개별 문서에서 실제 노선 구간을 교차 확인한 것만. 나머지는 내부 물리 선로·역순서 기반 감사이며 나무위키 직접 검증을 주장하지 않습니다.

| 항목 | 결과 |
|---|---:|
| cards | 223 |
| sourceBacked | 8 |
| sourceMismatch | 4 |
| titleRangeMismatch | 1 |
| cardsNeedingReview | 12 |
| catalogPatternEndpointIssues | 1 |

| 회사 | 카드 | 구간명 검증 | 불일치 | 나무위키 대조 | 출처 불일치 | 운행계통 패턴 | 목적지 개수 |
|---|---:|---:|---:|---:|---:|---:|---:|
| jr-east | 85 | 12 | 0 | 2 | 1 | 377 | 373 |
| jr-central | 17 | 8 | 0 | 2 | 0 | 69 | 84 |
| jr-west | 64 | 18 | 1 | 4 | 3 | 271 | 302 |
| jr-hokkaido | 19 | 7 | 0 | 0 | 0 | 67 | 69 |
| jr-shikoku | 8 | 0 | 0 | 0 | 0 | 30 | 30 |
| jr-kyushu | 30 | 12 | 0 | 0 | 0 | 93 | 99 |

## 이름과 실제 경계가 다른 카드

- line-11416 다카야마 본선 / 岐阜 → 富山 / ROUTE_BLOCKED
- line-11503 도카이도 본선(기후~마이바라) / 岐阜 → 米原 / ROUTE_BLOCKED
- line-11409 오이토선 / 松本 → 糸魚川 / ROUTE_BLOCKED
- line-11319 우쓰노미야선 / 上野 → 黒磯 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11111 히다카 본선 / 苫小牧 → 鵡川 / ROUTE_BLOCKED
- line-11106 네무로 본선(타키가와~신토쿠) / 滝川 → 新得 / ROUTE_BLOCKED
- line-11113 루모이 본선 / 深川 → 留萌 / ROUTE_BLOCKED
- line-11415 호쿠리쿠 본선(마이바라~가나자와) / 米原 → 金沢 / KOREAN_TITLE_ENDPOINT_MISMATCH, ROUTE_BLOCKED
- line-11612 산요 본선(이와쿠니~시모노세키) / 岩国 → 下関 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11611 산요 본선(미하라~이와쿠니) / 三原 → 岩国 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11610 산요 본선(오카야마~미하라) / 岡山 → 三原 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11710 세토대교선 / 茶屋町 → 宇多津 / ROUTE_BLOCKED

각 카드의 상세 결과 및 원본출처: [namuwiki-destination-inventory.json](./namuwiki-destination-inventory.json)
