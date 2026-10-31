# 한국 버스 대량 수집

`python tools/kr-bus-import.py --download`는 서울 열린데이터광장 2026-09-02
노선 기본정보·노선별 정류소 엑셀과 한국교통안전공단 2026-07-16
노선·정류소 CSV를 공식 배포 서버에서 받는다. 실행일에 자동으로 최신 자료라고
간주하지 않는다. 버전 변경 시 배포 페이지에서 파일 순번·자료 날짜를 확인한 후
스크립트의 스냅샷 설정을 갱신한다.

`python tools/kr-bus-import.py`는 보관된 원본에서 재생성한다. 외부 패키지가 필요 없다.
원본은 `data/kr/canonical/bus-source/`에 있고 출처·이용 조건·해시는
`bus-report.json`과 각 후보의 `sourceRefs`에 보존한다.

- `bus-candidates.json`: 비공개 수집 대기열. 서울의 원본 순서와 전국 노선 기종점.
- `bus-stops.json`: 유효 좌표·한국어 이름·원본 식별자를 가진 정류소.
- `bus-batch.json`: 모든 공개 검증 조건을 충족한 방향만 포함.
- `bus-report.json`: 실제 수량과 실패 행. 한 행의 실패로 다른 노선 수집을 중단하지 않음.

전국 TS-BIS 자료는 중소도시 52개 지자체의 수집 자료이다. 대한민국 모든 지역의
버스가 포함된 것으로 해석하면 안 된다. 서울 노선별 정류소 파일의 순서는 보존하되
회차점·상하행을 추측하여 나누지 않는다. 같은 이름의 정류소를 합치지 않는다.
영문 상호·약어 등이 들어간 원본 정류소는 한국어 이름을 추측하지 않고 실패 목록에
보관한다. 정류소 좌표를 직선으로 이은 경로는 생성하지 않는다.

## 실제 도로 경로 첨부

공식 GIS나 OSM 운행 relation에서 확보한 **방향별 독립 경로**를 JSON 배열로
저장하고 `--shapes 파일.json`으로 공급한다. 양방향은 각각 한 객체여야 한다.
공식 정류장 순서를 누락하거나 뒤집은 배열은 거부된다. 아래는 필드 계약이며,
실제 운행·경로 근거 없이 예시 값을 공개에 사용하면 안 된다.

```json
{
  "routeId": "kr-bus-seoul-공식노선아이디",
  "directionId": "outbound",
  "sourcePatternId": "공식방향별운행계통아이디",
  "patternNameKo": "공식 도착지 방면",
  "operatorKo": "공식 운영사",
  "categoryKo": "간선버스",
  "mode": "bus",
  "operationalEvidence": {"url": "공식 운행 안내 URL", "checkedAt": "확인일"},
  "sourceRef": {"url": "경로 출처 URL", "sourceDate": "자료일", "license": "이용 조건"},
  "geometry": [[37.5, 127.0], [37.5001, 127.0001]],
  "stopBindings": [
    {"sequence": 1, "stopId": "kr-seoul-stop-공식정류장아이디", "geometryIndex": 0},
    {"sequence": 2, "stopId": "kr-seoul-stop-다음공식정류장아이디", "geometryIndex": 1}
  ]
}
```

전국 TS-BIS 목록에는 중간 정류장 순서가 없다. 해당 노선의 경로 첨부에는 추가로
`stopSequenceSource: {"url": "공식 방향별 정차 순서 URL"}`가 필요하다.
좌표는 `[위도, 경도]`, 정류장과 경로 사이 허용 거리는 150m, 인접 경로점 사이
최대 거리는 2km다. 경로가 없거나 출처·운행 근거·한글 이름·정차지 식별자·방향
순서가 맞지 않으면 공개하지 않고 실패 기록을 남긴다. 버스 원본은 공개 게임
시작 시 일괄 로드하지 않는다. 공개 컴파일러는 `bus-batch.json`만 읽는다.
