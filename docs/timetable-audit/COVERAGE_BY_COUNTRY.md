# 국가별 시간표 감사 범위

검증률의 분모는 감사 대상 등록 레코드다. **한국 도로 버스는 제외하며**, 홍콩은 방향별 레코드를 포함한다.
이 수치는 기존 시간표 감사 결과의 범위 재집계이며, 새 시간표 검증이 추가로 수행된 것은 아니다.
계통 추가는 기준 main 대비 PR 전체 수치다.

| Country | Total Routes | Fully Verified | Partial/Unverified | Patterns Added | Patterns Corrected | Routes Merged | Verification % |
|---|---:|---:|---:|---:|---:|---:|---:|
| JP | 618 | 1 | 617 | 2 | 0 | 0 | 0.162% |
| KR | 55 | 0 | 55 | 2 | 0 | 0 | 0.000% |
| HK | 106 | 10 | 96 | 0 | 0 | 0 | 9.434% |
| TW | 48 | 0 | 48 | 1 | 0 | 0 | 0.000% |
| TH | 23 | 0 | 23 | 0 | 0 | 0 | 0.000% |
| UK | 56 | 0 | 56 | 0 | 0 | 0 | 0.000% |
| TOTAL | 906 | 11 | 895 | 5 | 0 | 0 | 1.214% |

기준 전체 9,128개 중 한국 도로 버스 8,222개를 제외했다.
버스 원본 데이터는 변경하지 않았다. 원본 전체 목록은 [ALL_ROUTES_INVENTORY.csv](ALL_ROUTES_INVENTORY.csv)에 보존한다.
새 범위 목록은 [AUDITED_ROUTES_INVENTORY.csv](AUDITED_ROUTES_INVENTORY.csv), 상태는 [MASS_AUDIT_RESULTS.csv](MASS_AUDIT_RESULTS.csv), 미검증 목록은 [UNVERIFIED_ROUTES.csv](UNVERIFIED_ROUTES.csv)를 참조한다.
