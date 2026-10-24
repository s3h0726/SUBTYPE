# 실제 선형 감사

선형 미조립 56개 중 여객 연구 44개. 이번의 물리 선형 복구 성공은 0개이며, 네 추가 연구 플레이는 이미 연결된 실제 선로의 누락 기종점을 공식 전체 역 순서에 결합한 결과다. 직선 연결·좌표 보간·반대 승강장 대체를 하지 않았다.

| 원본 진단 코드 | 건수 |
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

## 부산 1호선 2201600

남포·서대신·대티·괴정·사하·하단 여섯 source stop이 해당 방향 way 배열과 불일치한다. 하단 실제 정차 노드는 일부 확인했으나 나머지 다섯 역과 전체 방향별 플랫폼 근거가 부족하다. 최신 relation/full 원문 요청은 HTTP 429였다. 반대 방향 8255697의 노드를 가져다 통과시키지 않았다. 전체 미조립 후보별 way ID·좌표·원인은 data/kr/v2/generated/remaining-failures.json 및 phase6-network-audit.json에 보존했다.

## 순환선

| 서비스 | OSM 방향 | 공식 전체 순서와 일치한 방향 | 닫힌 선형 | 방문 수 | 사유 |
| --- | --- | --- | --- | --- | --- |
| kr-osm-service-2404374 | OUT | IN | true | 44 | OSM_LABEL_OFFICIAL_CALL_ORDER_DIRECTION_CONFLICT |
| kr-osm-service-4729409 | IN | OUT | true | 44 | OSM_LABEL_OFFICIAL_CALL_ORDER_DIRECTION_CONFLICT |

두 경로는 43개 고유역·44회 방문·동일 플랫폼 복귀 선로를 갖지만, 방향/승강장 검토 전에는 실행 후보로 승격하지 않았다.

## 신규 연구 경로의 원본 선형

| 서비스 | 정차 | 거리 km | 샘플 점 |
| --- | --- | --- | --- |
| kr-osm-service-2195014 | 17 | 18.16646281222151 | 236 |
| kr-osm-service-2205952 | 14 | 11.865675417559 | 183 |
| kr-osm-service-8247016 | 17 | 18.133121618148785 | 234 |
| kr-osm-service-8258701 | 14 | 11.865615395964065 | 186 |

모든 조립 경로의 최대 원본 샘플 간격도 JSON에 기록한다. 긴 원본 선분이 있다는 사실만으로 가상 연결 또는 검증 완료를 선언하지 않는다.
