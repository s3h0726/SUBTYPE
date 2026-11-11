# 한국 도로 버스 시간표 감사 제외

이번 변경은 6개국 전체 감사에서 **한국의 도로 버스 노선만 제외**한다. 한국 철도·지하철·공항철도·광역철도·일반철도·고속철도 및 기존 비도로 교통은 유지한다. 다른 국가의 교통 노선은 그대로 둔다.

- `tools/timetable-inventory.mjs --exclude-korean-buses`는 버스 노선을 역·경로 해석 전에 건너뛰며, 기존 일반 카탈로그·정규 기준 비교 동작을 변경하지 않는다.
- `tools/mass-timetable-audit.py`는 과거의 버스 포함 스냅샷을 불러온 경우에도 해당 노선을 필터링하므로 미검증·완전 검증·중복 후보·추가 계통 후보에 넣지 않는다.
- `ALL_ROUTES_INVENTORY.csv`는 변경 전 전체 기준을 보존하는 기록이다. 최신 감사 대상은 `AUDITED_ROUTES_INVENTORY.csv`, 최신 집계는 `COVERAGE_BY_COUNTRY.md`, 상태는 `MASS_AUDIT_RESULTS.csv`에 기록한다.
- 실행하지 않은 이전 보고서 수치를 새 결과로 오인하지 않는다. 실행 후에만 재계산된 수치를 확정한다.

## 재실행

```sh
node --max-old-space-size=6000 tools/timetable-inventory.mjs --snapshot=.cache/timetable-audit/baseline --base=ea4696898cf2fcb17d3278eda13766e9a1540e23 --exclude-korean-buses
python tools/test_mass_timetable_audit.py
python tools/mass-timetable-audit.py --as-of=2026-11-11 --days=30 --resume --fetch
```

공식 GTFS·ODS 자료가 누락된 노선은 완료로 처리하지 않으며, 남은 범위와 접근 제한을 보고한다.
