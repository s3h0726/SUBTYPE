# Canonical Korean Naming Policy

SUBTYPE에서 운영사명·노선명·역명·지선명·계통명·열차 서비스명 등 한국어 철도 고유명칭의 canonical source family는 `namuwiki`입니다.

일본 운영사 공식자료는 일본어 공식명, Kana, 역번호, 역 순서, 운행정보를 확인하는 검증 출처입니다. 공식 한국어 표기는 `officialKo`와 `officialKoSource`에 별도로 보존할 수 있지만, 나무위키와의 대응이 확인되지 않은 상태에서 canonical `names.ko`의 출처를 `official-ko`로 확정하지 않습니다.

허용 상태:

- `namuwiki-direct`: 실제 문서와 URL을 직접 확인
- `namuwiki-search`: 검색 색인에서 실제 문서 URL과 대상 대응을 확인
- `namuwiki-unresolved`: 아직 확인되지 않았으며 `REVIEW_REQUIRED`

직접 접근 차단은 문서 부재가 아닙니다. 실제로 확인되지 않은 URL은 추측하지 않으며, 조사하지 않은 레코드에 `namuwiki` 검증 완료를 일괄 기록하지 않습니다.

이름 검수 작업은 표시명과 source metadata만 변경합니다. `operatorId`, `lineId`, `stationId`, 역 순서, 좌표, segment 및 geometry는 변경하지 않습니다.
