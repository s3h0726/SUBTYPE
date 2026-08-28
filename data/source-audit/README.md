# Source audit workflow

`sourceAccess: blocked`는 문서나 정보가 없다는 뜻이 아닙니다. 직접 접근이 제한된 상태이며 `namuwikiStatus: no-entry-found`와 구분합니다.

한국어 표기는 직접 문서, 검색 색인, 운영사 공식 한국어, 다른 한국어 자료, 공식 일본어 Kana 순서로 교차검증합니다. 검색 색인만 확인한 값은 단독으로 `verified: true`가 되지 않습니다. 확인된 직접 URL이 없으면 URL을 추측해 저장하지 않고 `searchReference`만 남깁니다.

작업 순서:

1. `npm run source:annotate`
2. 검증된 항목만 `data/source-audit/official-korean-evidence.json` 또는 `verified-overrides.json`에 기록
3. `npm run source:apply-verified`
4. `npm run source:audit`
5. `npm run build:data`

`CANDIDATE_DIFF.json`과 `VERIFIED_DIFF.json`은 적용 전 검토용이며, 노선·역·관계·geometry 감소나 변경이 발생하면 적용을 차단합니다.
