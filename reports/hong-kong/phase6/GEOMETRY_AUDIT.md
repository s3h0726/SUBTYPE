# 실제 선형 검수

검증65/66서비스, 공유track segment532. 신규직통2방향은 기존 실제 선로 segment를 재사용했다. 피크트램과 Ocean Express는 원본 funicular way·노드만 사용한다. 철도 미확보 구간을 직선이나 도로로 연결하지 않았다.

3264047: 원본은 하행 정차 순서·상행 way 순서, Garden Road의 오래된 대표점, 중복way와 양쪽 교행arm을 한 여정에 혼합. 실제stop_position2525250101과 원본방향별way로6역/5구간을 양방향 회복. 12행MDB 재추출 결과도 원본추출과 전부 일치. 원본실패를 지우지 않고 RESOLVED_GEOMETRY_ONLY로 별도 기록하며 플레이는 계속 차단.

6582965·6582966: 통합 이전 역사적 튄마선relation. 현재운행에는 사용하지 않고 원본실패·INCOMPLETE를 보존. 현행 튄마선 양방향은 기존 검증 경로를 그대로 유지.

Ocean Express3366719: 정방향92167201→250700765→250700766, 역방향250700766→250700764→92167201. oneway 교행arm의 원본방향을 실제 순회와 대조. 플랫폼 대표점은 기존철도vertex에80m이내 스냅하며 sourceStopNodeId와 snapMeters를 공개; 새 연결좌표 생성 없음. 고도/3D 미검증.

APM sourceAPI429/Overpass406은 캐시하고 폭주 재요청하지 않음. [개별기록](geometry-investigation.json).
