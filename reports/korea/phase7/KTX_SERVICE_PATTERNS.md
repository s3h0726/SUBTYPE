# KTX 실제 패턴 연결 감사

실제 시간표 행 621, 패턴 551. 원본 적용일 2026-09-01. 기존 방향별 정차점과 정확히 순서대로 맞는 패턴 2개(326/327 용산→익산→광주송정). 두 패턴은 원본 열차번호/요일/차종 및 정확한 stop ID 연결을 data/kr/v2/korail-highspeed-route-bindings.json에 유지한다.

각 경로에 siding/yard 등 실제 source 태그 문제가 남고, 9월 원본의 10월 현행성 및 공휴일 예외도 승인되지 않았다. 따라서 신규 게임 PLAYABLE 0, 정식 승인 0. 나머지 549패턴은 전 구간 방향별 정차점 연결이 확보되지 않았다. 무정차 셀을 실제 선로 통과 증명으로 사용하거나 11월 시간표를 조기 적용하지 않았다.

재생성: node tools/build-kr-phase7-evidence.cjs. 실제 source-stop ID와 제한 way ID를 자동 기록하고 모든 미완료 패턴은 playable:false를 유지한다. 게임 선택·예약 인터랙션이 완성됐다고 보고하지 않는다.
