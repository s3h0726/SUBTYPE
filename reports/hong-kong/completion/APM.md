# 홍콩국제공항 APM 부분 공개

홍콩공항공사의 별도 automated_people_mover 시스템이다. Airport Express와 합치지 않았다. 한 카드에서 다음 네 방향을 선택한다.

- 스카이피어 ↔ T1 동대합실: relation 14244774 / 14244775.
- T1 미드필드 탑승동 → T1 서대합실 → T1 동대합실: 14244778.
- 반대 방향: 14244779.

방향별 stop node와 실제 railway way를 사용하며 모든 정차 위치는 원본 선형 정점에 일치한다. 도로·보행로·직선 보간은 쓰지 않았다. 기존 오래된 T2 disused:stop은 포함하지 않았다. 전용 APM 차량 표시와 실제 곡선 이동을 사용한다. 네 방향 모두 엔진 AUTO/SPACE 및 브라우저 완주를 확인했다. 모바일 390×844에서 한국어가 주 표시이고 가로 넘침은 0px였다.

공식 근거: [공항 APM 안내](https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/automated-people-mover), [접근 안내](https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/special-needs-access), 정부 EMSD 안전 자료. 원본과 해시는 sources/completion 및 manifest.json에 보존한다. 오래된 정부 안전 자료는 기반 시설 보조 근거로 사용하며 2026년 T2 운영 상태의 유일한 근거로 삼지 않는다.

제한구역·보안검색·출입국·적격 항공/해상 환승 조건을 선택 화면에 표시한다. SkyPier는 시내 승객의 자유 환승역이 아니다. 실제 TAB 검사에서도 시내 철도로 전환되지 않았다. 한국어는 시설 명칭을 검수한 안내 표기이며 공식 한국어 지정명으로 주장하지 않는다.

T2 출발 시설은 [2026-05-27 개통 발표](https://www.hongkongairport.com/en/media-centre/press-release/2026/pr_1868)와 달리 보존 OSM에 과거 정차점·공사 선로가 혼재하므로 정확한 현행 승강장과 전체 선형을 확보할 때까지 미공개다. T2 Concourse는 별도 미래 시설로 구분한다. RR 회복선 한 방향의 stop snap 및 승객 운행 근거도 미해결이다. **APM 전체 완성으로 표시하지 않는다.**
