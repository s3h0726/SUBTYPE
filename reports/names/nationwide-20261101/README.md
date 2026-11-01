# 일본 전국 역명 감사·수정 결과

2026-11-01 수집 근거를 2026-11-02 최신 main `7edf6b436eb58e9c41e0123a1473f338b41b0b2e`에 병합했습니다. **전국 인벤토리와 대량 수정 구현은 완료했지만, 모든 역의 모든 이름 필드를 독립 검증한 것은 아닙니다.**

| 항목 | 결과 |
|---|---:|
| 일본 운영사 인벤토리 | 162 |
| 노선 원본·특수 노선 | 609 (운영 대상 608) |
| 역-노선 및 미연결 원본 기록 | 10751 |
| 운행 정차 기록 | 127608 |
| 고유 물리역 | 독립 확정 미완료; 공유 역 ID 8883 |
| 한국어 역명 수정 | 1042 |
| 일본어 역명 수정 | 0 |
| 영문 수정 | 1451 |
| 일본어 독음 수정 | 737 |
| 운영사·노선명 수정 | 0 |
| 환승 명칭 충돌 해결 | 0 |
| 편집표 한글명 변경 행 | 1216 |
| 교정 역명의 타이핑 대상 검사 | 1241 |
| 모든 필드 독립 검증 완료 | 0 |
| 추가 필드 검증이 필요한 고유 ID | 8883 |
| 한국어 개별 문서 대응 | 1393행 / 1096 ID |
| 회귀 검사 명령 | 22 PASS / 2 FAIL |
| 대표 브라우저 검사 | 9 PASS / 0 FAIL |

한국어는 나무위키 역 문서의 일본어 표제·한국어 제목 일치 또는 노선표의 정확한 일본어·한국어 링크 대응을 사용했습니다. 노선표만 일치한 경우 TABLE_MATCHED로 구분했습니다. 공식 영문·독음은 JR큐슈, JR동일본, 아이치환상철도와 JR서일본 공식 역명 자료에 한해 적용했습니다. 자동 장모음 축약과 전역 자음 치환은 하지 않았습니다.

| 운영사 ID | 노선 ID | 수정 전 | 수정 후 | 근거 |
|---|---|---|---|---|
| aichikanjotetsudo | line-99511 | 로쿠메이 | 무츠나 | [출처](https://namu.wiki/w/%EB%AC%B4%EC%B8%A0%EB%82%98%EC%97%AD) |
| abukumakyuko | line-99213 | 츠노다 | 카쿠다 | [출처](https://namu.wiki/w/%EC%B9%B4%EC%BF%A0%EB%8B%A4%EC%97%AD) |
| fukuokashikotsukyoku | line-99907 | 벳푸 | 베후 | [출처](https://namu.wiki/w/%EB%B2%A0%ED%9B%84%EC%97%AD(%ED%9B%84%EC%BF%A0%EC%98%A4%EC%B9%B4)) |
| jr-kyushu | line-11903 | NōZedaka | Minami-Setaka | [출처](https://www.westjr.co.jp/global/en/howto/train-reservation/condition/station/Station_name.pdf#page=43) |

미해결 출처 충돌:

- `station-003668.names.en`: 공식 예약 자료 `Bakurocho` / 최신 main `Bakurochō`. 최신 값을 보존하고 SOURCE_CONFLICT로 표시했습니다.
- `station-003639.names.en`: 공식 예약 자료 `Kinshicho` / 최신 main `Kinshichō`. 최신 값을 보존하고 SOURCE_CONFLICT로 표시했습니다.

나무위키 요청 제한(429)으로 확인하지 못한 문서는 완료로 표시하지 않았습니다. 미연결 공유 역 25개는 삭제하지 않고 이력 검토 대상으로 남겼습니다. 운행계통의 6769개 정차 발생은 정규화 키의 대응을 확정하지 못해 null로 보존했으며, 게임의 실제 정차 순서나 선형을 수정하지 않았습니다.

기존 회귀 검사 실패:

- `ueno-tokyo`: 기존 검사에서 참조하는 과거 경로 파일 누락 ([로그](tests/ueno-tokyo.log)).
- `legacy-data-validator`: 기존 curated 역 원본 중복 ID ([로그](tests/legacy-data-validator.log)).

대표 브라우저 검사는 8회 완주와 오카자키 환승 및 `오카자키 → 무츠나` 실제 합성 IME 입력 이동을 포함합니다. 전국 역을 개별 브라우저 검사했다고 주장하지 않습니다. 역 ID·공유 좌표·선로 형상·다른 나라 원본·로그인·랭킹 키는 변경하지 않았습니다.

재생성: `node tools/build-japan-name-assets.cjs`. 전체 감사: `node tools/audit-japan-station-registry.cjs`. 회귀: `node tools/test-japan-name-regressions.cjs`. 근거는 `data/source-audit/japan-*20261101.json`, 전수 기록은 `stations.jsonl`, 계통별 모든 정차 발생은 `operating-sequences.json`에 있습니다.
