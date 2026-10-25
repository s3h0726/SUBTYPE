# 홍콩 여객 철도 재조사

EMSD는 MTR·공항APM·Hong Kong Tramways·Peak Tram을 철도 안전 감독 대상으로 열거한다. 공원 내부 운송인 Ocean Express는 운영사 자료로 별도 조사했다. 이 법정 분류만으로 모든 시설 철도의 완성을 주장하지 않는다.

| 시스템 | 현재 상태 | 근거·범위 |
|---|---|---|
| hk-mtr-heavy | operational | Nine MTR heavy-rail lines plus separately classified Airport Express; existing directions preserved. Racecourse and official short turns remain research unless a complete current calling pattern is verified. |
| hk-light-rail | operational | Official Phase6 CSV and schedule are byte-identical to Phase4 snapshots. 751P evening variants verified as official partial751. Morning Tin Wing platform commissioning and special chained numbers require separate calling/platform review. |
| hk-tramways | operational | One operator card, independent directional stops and original railway=tram ways; all Phase5 source identities retained. |
| hk-peak-tram | operational | Read-only government MDB yields both six-stop sequences. Actual source geometry recovered, Korean names/request-stop release incomplete. |
| hk-airport-apm | operational | Overpass406, OSM API429 twice with independent-work backoff and smaller retry. No further repeated requests or substitute road geometry. Platform/direction paths remain unverified, so no empty playable card is emitted. |
| hk-ocean-express | operational | Official Korean/Chinese identity and existing direction-specific OSM funicular ways, including one-way passing arms. |
| hk-disneyland-railroad | temporarily-suspended | Official park page explicitly announces temporary suspension; distinct from operational MTR Disneyland Resort Line. |
| ngong-ping-360 | OUT_OF_SCOPE | Cable transport, not a railway way; original requirement90 preserved. |
| ocean-park-toto-loco | OUT_OF_SCOPE | Official attractions list a mini train as a Family Fun ride; excluded under user instruction distinguishing enclosed amusement rides from passenger transport. |

운영 시스템 묶음6 = MTR 중전철(공항철도 포함), 경전철, 트램, 피크트램, 공항APM, Ocean Express. APM이 미구축이므로 홍콩 전체 완성은 INCOMPLETE. 디즈니랜드 파크 철도는2026-03-02부터 추가 공지까지 운휴이며, MTR 디즈니랜드선과 구별한다. Ngong Ping360·토토 미니 놀이기구는 철도 집계에서 제외.

정규 원본: [national-inventory.json](../../../data/hk/master/national-inventory.json). 정부 인벤토리: https://www.emsd.gov.hk/en/railway_safety/about_railway_safety/index.html
