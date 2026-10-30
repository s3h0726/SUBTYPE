# JR 전 노선 행선지·구간명 검증

출처 확정: 나무위키 개별 문서에서 실제 노선 구간을 교차 확인한 것만. 나머지는 내부 물리 선로·역순서 기반 감사이며 나무위키 직접 검증을 주장하지 않습니다.

| 항목 | 결과 |
|---|---:|
| cards | 223 |
| sourceBacked | 8 |
| sourceMismatch | 4 |
| titleRangeMismatch | 29 |
| cardsNeedingReview | 39 |
| catalogPatternEndpointIssues | 1 |

| 회사 | 카드 | 구간명 검증 | 불일치 | 나무위키 대조 | 출처 불일치 | 운행계통 패턴 | 목적지 개수 |
|---|---:|---:|---:|---:|---:|---:|---:|
| jr-east | 85 | 12 | 5 | 2 | 1 | 377 | 373 |
| jr-central | 17 | 8 | 3 | 2 | 0 | 69 | 84 |
| jr-west | 64 | 18 | 8 | 4 | 3 | 271 | 302 |
| jr-hokkaido | 19 | 7 | 4 | 0 | 0 | 67 | 69 |
| jr-shikoku | 8 | 0 | 0 | 0 | 0 | 30 | 30 |
| jr-kyushu | 30 | 12 | 9 | 0 | 0 | 93 | 99 |

## 이름과 실제 경계가 다른 카드

- line-11414 이다선(텐류쿄~다쓰노) / 天竜峡 → 辰野 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11413 이다선(도요하시~텐류쿄) / 豊橋 → 天竜峡 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11508 간사이 본선(나고야~가메야마) / 名古屋 → 亀山 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11416 다카야마 본선 / 岐阜 → 富山 / ROUTE_BLOCKED
- line-11503 도카이도 본선(기후~마이바라) / 岐阜 → 米原 / ROUTE_BLOCKED
- line-11225 반에쓰사이선(고리야마~아이즈와카마쓰) / 郡山 → 会津若松 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11317 하치코선(하치오지~고마가와) / 八王子 → 高麗川 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11318 하치코선(고마가와~다카사키) / 高麗川 → 高崎 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11409 오이토선 / 松本 → 糸魚川 / ROUTE_BLOCKED
- line-11226 반에쓰사이선(아이즈와카마쓰~니쓰) / 会津若松 → 新津 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11231 도호쿠 본선(구로이소~리후·모리오카) / 黒磯 → 盛岡 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11319 우쓰노미야선 / 上野 → 黒磯 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11111 히다카 본선 / 苫小牧 → 鵡川 / ROUTE_BLOCKED
- line-11104 무로란 본선(오샤만베·무로란~도마코마이) / 長万部 → 苫小牧 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11105 무로란 본선(도마코마이~이와미자와) / 苫小牧 → 岩見沢 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11107 네무로 본선(신토쿠~구시로) / 新得 → 釧路 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11106 네무로 본선(다키카와~신토쿠) / 滝川 → 新得 / KOREAN_TITLE_ENDPOINT_MISMATCH, ROUTE_BLOCKED
- line-11113 루모이 본선 / 深川 → 留萌 / ROUTE_BLOCKED
- line-11925 에비노 고원선(야쓰시로~요시마쓰) / 八代 → 吉松 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11911 후쿠호쿠유타카선(오리오~가쓰라가와) / 折尾 → 桂川 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11926 히사쓰선(요시마쓰~하야토) / 吉松 → 隼人 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11903 가고시마 본선(하카타~야쓰시로) / 博多 → 八代 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11904 가고시마 본선(센다이~가고시마) / 川内 → 鹿児島 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11917 가시선(가시이~우미) / 香椎 → 宇美 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11909 지쿠히선(메이노하마~니시카라쓰) / 姪浜 → 西唐津 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11920 지쿠히선(니시카라쓰~이마리) / 西唐津 → 伊万里 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11905 나가사키 본선(도스~나가사키) / 鳥栖 → 長崎 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11626 한와선(덴노지~와카야마) / 天王寺 → 和歌山 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11415 호쿠리쿠 본선(마이바라~가나자와) / 米原 → 金沢 / KOREAN_TITLE_ENDPOINT_MISMATCH, ROUTE_BLOCKED
- line-11509 간사이 본선(가메야마~가모) / 亀山 → 加茂 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11634 기신선(사요~니미) / 佐用 → 新見 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11608 고베선(고베~히메지) / 神戸 → 姫路 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11603 고베선(오사카~고베) / 大阪 → 神戸 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11615 산인 본선(소노베~도요오카) / 園部 → 豊岡 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11616 산인 본선(도요오카~요나고) / 豊岡 → 米子 / KOREAN_TITLE_ENDPOINT_MISMATCH
- line-11612 산요 본선(이와쿠니~시모노세키) / 岩国 → 下関 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11611 산요 본선(미하라~이와쿠니) / 三原 → 岩国 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11610 산요 본선(오카야마~미하라) / 岡山 → 三原 / NAMUWIKI_EXPECTED_ENDPOINT_MISMATCH
- line-11710 세토대교선 / 茶屋町 → 宇多津 / ROUTE_BLOCKED

각 카드의 상세 결과 및 원본출처: [namuwiki-destination-inventory.json](./namuwiki-destination-inventory.json)
