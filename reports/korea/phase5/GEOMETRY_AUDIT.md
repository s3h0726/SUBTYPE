# 실제 선형 및 연결 감사

OSM 원본 geometry/좌표/역 ID를 변경하지 않았다. 새 28개 경로는 원래 조립 가능했던 실제 ways와 전체 정차 배열을 그대로 사용한다. 원본 95개 payload 바이트 불변 검사를 유지한다.

| 원본 importer 문제 코드 | 남은 수 |
| --- | --- |
| OFFICIAL_TIMETABLE_REQUIRED | 317 |
| ORDERED_STOPS_NOT_ON_TRACK | 3 |
| STOP_NOT_ON_ORDERED_TRACK | 119 |
| AMBIGUOUS_ORIENTATION | 5 |
| MISSING_ORDERED_STOPS | 27 |
| NON_PUBLIC_TRACK_REVIEW | 556 |
| MISSING_MEMBER_WAY | 45 |
| MISSING_TRACK | 8 |
| DISCONNECTED_MEMBERS | 384 |
| DISCONNECTED_ORDERED_WAYS | 31 |
| UNKNOWN_STOP | 2 |

선형 미조립 56개 중 여객 복구 연구 대상 44개, 제외·격리 포함 12개다. 부산 1호선 2201600은 노포→다대포 방향의 남포·서대신·대티·괴정·사하·하단 정차 지점이 원본 선로 목록과 맞지 않는다. 반대 방향 승강장을 재사용하지 않았다. 기존 증거 기반 재구축 규칙으로 추가 6개 후보를 검토했으나 원래 way/stop 보존·비영업선 배제·완전 정차 패턴 조건을 통과한 새 재구축은 0개였다. RECONSTRUCTION_ATTEMPTS.json 참조.

기존 1호선 원본 5개 계통의 출처·라이선스 감사 실패도 미해결이다. 실제 선로를 삭제하거나 테스트 조건을 낮추지 않았다.

실제 곡선 주행 검사: PASS; 상세 MOTION_RESULTS.json 및 개별 batch. 전체 완주: PASS.
