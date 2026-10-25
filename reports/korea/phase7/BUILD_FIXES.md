# 빌드 수정

- tools/lib/official-service-source.cjs: legacy official 형식을 보존하고 official-timetable은 HTTPS timetables.jreast.co.jp의 정규 열차 경로와 유효한 검토 날짜만 허용한다. 임의 타입·유사 도메인·잘못된 날짜를 거부한다.
- tools/validate-service-patterns.js: 위 계약으로 정식 시간표 타입 분류의 불일치를 수정했다. 7개 출처의 타입 오류가 해소됐다. URL 접근 가능성이나 현재 운행을 타입 검사만으로 승인하지 않는다. 직접 열어 본 2610/train/110/113131.html은 고사키→아타미 1925E. 일부 다른 기존 URL은 404/캐시 실패여서 모든 출처의 현행성을 새로 확인했다고 주장하지 않는다.
- js/service-route-resolver.js: 등록하지 않은 방향은 UNSUPPORTED_THROUGH_DIRECTION으로 거부한다. 테스트는 등록된 방향 전체와 미등록 방향 거부를 함께 검증한다. 아타미→타카사키 geometry를 좌표 반전으로 만들지 않았다.
- tools/test-shonan-shinjuku-selector.cjs: 오래된 단일 코드 문자열 검사 대신 line-11343에서 실제 7개 우에노 계통을 분리하고 NEX/다른 계통 혼입을 거부하는 기능 검사를 추가했다. 기존 쇼난 12방향 검사는 유지했다.
- 전체 build와 build:app PASS. 전체 빌드가 만든 관련 없는 일본 생성 데이터 차이는 기존 HEAD로 복원하고 번들을 다시 생성했다. 목록은 BUILD_GENERATED_JAPAN_FILES.json. 한국 생성물 2회 재생성은 별도로 0차이를 확인했다.
- 테스트의 과거 고정 개수 127/178/140을 실제 추가 경로에 맞게 128/177/141로 갱신했다. 기존 payload 127개 SHA 및 신규 경로의 모든 좌표·ID·선로 동일성을 추가 검사한다.
- CI에 승강장 파서, 공식 출처 경계, Phase 7 증빙 및 신규 신분당선 motion 검사를 연결했다. 전국 승인 검사는 그대로 INCOMPLETE를 반환한다.
