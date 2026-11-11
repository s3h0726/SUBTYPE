#!/usr/bin/env python3
"""Reproducibly compare SUBTYPE stop/terminal data with individually reviewed operator timetables.

Operator evidence is a small, manually transcribed factual extract from the source
URLs recorded in data/*/official-timetable-*.json. This script does NOT assert
full-train/calendar verification from a list of endpoint or stop labels.
"""

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "timetable-audit" / "OPERATOR_TIMETABLE_REVIEW.md"


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def normal(value):
    value = {"南富山駅前": "南富山", "富山駅": "富山"}.get(value, value)
    return re.sub(r"[^\w]", "", unicodedata.normalize("NFKC", value)).lower()


def main():
    hk = read("data/hk/official-tram-timetable-2026.json")
    index = read("data/hk/generated/index.json")
    routes = {row["id"]: row for row in index["routes"]}
    lines = [
        "# 실제 운영사 시간표 대조 — 홍콩 트램 12방향·도야마 시내전차 6계통",
        "",
        "기준일: **2026-11-12**. 본 문서는 실제 공식 시간표에 표시된 운행 기종점·첫차·막차 또는 정차열과 게임 데이터를 비교한다.",
        "한국 버스는 검증하지 않았다. 본 비교는 *전체 시간표 검증 완료*와 다르며 기존의 완전 검증 11건을 임의로 증가시키지 않는다.",
        "",
        "## 홍콩 트램 — 12개 운행 방향",
        "",
        f"운영사 원문: {hk['source_url']}",
        "운영사가 공표한 첫차·막차는 안내용으로, 개별 열차 시각 및 중간 정류장별 시각은 본 범위에서 검증하지 않았다.",
        "",
        "| SUBTYPE ID | 구간 | 게임 기종점 | 평일 첫·막차 | 주말 첫·막차 | 상태 |",
        "|---|---|---|---|---|---|",
    ]
    assert len(hk["routes"]) == 12
    assert len([row for row in routes if row.startswith("hk-tram-")]) == 12
    for row in hk["routes"]:
        id = row["id"]
        payload = read(routes[id]["lazySource"])
        stations = (payload.get("route") or payload)["stations"]
        origin, destination = stations[0]["ko"], stations[-1]["ko"]
        status = "기종점 일치" if (origin, destination) == (row["origin"], row["destination"]) else "불일치"
        if status != "기종점 일치":
            raise ValueError(f"{id}: {origin} -> {destination} differs from operator termini")
        lines.append(
            f"| `{id}` | {row['origin']} → {row['destination']} | "
            f"{len(stations)}정류장, 일치 | {row['weekday_first']}–{row['weekday_last']} | "
            f"{row['weekend_first']}–{row['weekend_last']} | {status} |"
        )
    lines += ["",
        "**결과:** 공식 6개 주요 운행구간의 양방향 12개 레코드가 게임 기종점과 일치. "
        "단, 게임에 첫차·막차 시각을 실행 로직으로 반영한 것은 아니며, 전 정류장별 시간표·예외일·임시운행 검증은 남았다.",
        "",
        "## 일본 도야마 지방철도 — 6계통",
        "",
        "2026년 3월 14일 개정 공식 시간표: https://www.chitetsu.co.jp/?p=70984",
        "평일 상행(남→북) 1·2계통과 순환 3계통의 실제 정차열을 게임과 비교했다. "
        "4~6계통은 공식 노선 존재와 기종점을 확인했으며, 전체 열차별 정차열은 추가 검증이 필요하다.",
        "",
        "| 게임 노선 | 게임 정차 수 | 공식에서 확인한 정차열 | 누락된 공식 정류장 | 게임 중복 | 판단 |",
        "|---|---:|---:|---|---|---|",
    ]
    jp = read("data/jp/official-toyama-timetable-2026.json")
    chunk = read("data/jp-canonical/chunk-16.json")
    game = {row["id"]: row for row in chunk["routes"]}
    mismatches = []
    for id, official in jp["stops"].items():
        loaded = game[id]
        current = [normal(station["ja"]) for station in loaded["stations"]]
        expected = [normal(stop) for stop in official]
        missing = Counter(expected) - Counter(current)
        excess = Counter(current) - Counter(expected)
        # Route 3 uses an implicit closing edge (loop=true); don't count the
        # official repeated origin station as an unmatched extra timetable call.
        if id.endswith("-3"):
            assert loaded["loop"] is True
            missing.subtract({normal("富山駅"): 1})
            missing = +missing
        missing_names = list(dict.fromkeys(
            name for name in official if missing.get(normal(name), 0)
        ))
        excess_names = list(dict.fromkeys(
            st["ja"] for st in loaded["stations"] if excess.get(normal(st["ja"]), 0)
        ))
        if not missing_names:
            raise ValueError(f"{id}: expected timetable discrepancy disappeared; review source")
        mismatches.append({"id": id, "missing": missing_names, "extra": excess_names})
        lines.append(
            f"| `{id}` | {len(current)} | {len(official)} | "
            f"{', '.join(missing_names) or '없음'} | {', '.join(excess_names) or '없음'} | 정차열 수정 필요 |"
        )
    lines += ["",
        "※ C14(電鉄富山駅エスタ前)는 게임의 해당 노선 데이터에 해당 정류장 ID와 선형이 확인되지 않았다. "
        "근거 없이 임의 좌표나 역 ID를 생성하지 않고, 정확한 실선로·정류장 매핑 확보 전에는 게임 정차열을 자동 변경하지 않는다.",
        "※ 공식 정류장 C09(中町)는 방향별 정차 차이가 있으므로 위 대조는 남→북에 한정한다. "
        "3계통의 첫 역이 게임에서는 丸の内로 순환 회전돼 있으며, 운행 방향 자체는 추가 검증해야 한다.",
        "",
        "### 공식 기종점만 확인한 계통",
        "",
        "| 게임 노선 | 운영사 표시 | 확인 범위 |",
        "|---|---|---|",
    ]
    for row in jp["related_routes"]:
        route = game[row["id"]]
        lines.append(f"| `{row['id']}` ({len(route['stations'])}정차 레코드) | "
                     f"{row['official']} | {row['scope']} |")
    lines += ["",
        "## 변경 승인 기준",
        "",
        "1. 중간역 누락/중복을 검증한 1·2·3계통은 **불일치**로 유지하고 전면 VERIFIED 처리하지 않는다.",
        "2. 4~6계통은 노선 존재 확인까지만 인정하고 미완료로 남긴다.",
        "3. 원문 PDF의 시간열·선로 좌표·운행 예외가 확정되기 전에는 신규 운행계통을 창작하거나 경로를 자동 병합하지 않는다.",
        "4. 홍콩 트램의 기종점 대조는 기존 검증 레코드 수와 별도로 증거를 보존한다.",
        "",
        "## 출처",
        "",
        f"- 홍콩 트램 공식 공고: {hk['source_url']}",
        f"- 도야마 시내전차 전체 공고: {jp['source_url']}",
    ]
    for id, url in jp["stop_sequence_sources"].items():
        lines.append(f"- 도야마 {id} 공식 정차열: {url}")
    for row in jp["related_routes"]:
        lines.append(f"- 도야마 {row['id']} 참고표: {row['official_source']}")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Verified operator termini:", len(hk["routes"]),
          "Toyama stop-sequence anomalies:", len(mismatches),
          "Toyama routes scoped:", len(jp["stops"]) + len(jp["related_routes"]))


if __name__ == "__main__":
    main()
