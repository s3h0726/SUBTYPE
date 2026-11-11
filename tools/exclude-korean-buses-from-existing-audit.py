#!/usr/bin/env python3
"""Migrate checked-in timetable audit reports to the Korean-road-bus-free scope.

This is a deterministic report migration, NOT additional timetable verification.
The original ALL_ROUTES_INVENTORY.csv remains untouched as baseline evidence.
"""

import csv
import json
import re
from collections import Counter
from pathlib import Path

from timetable_audit.scope import in_audit_scope

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "docs" / "timetable-audit"
COUNTRIES = ("JP", "KR", "HK", "TW", "TH", "UK")


def read_csv(name):
    with (REPORT / name).open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader), reader.fieldnames


def write_csv(name, fields, records):
    path = REPORT / name
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(records)
    temporary.replace(path)


def include_route(route):
    return in_audit_scope(route)


def main():
    baseline = json.loads((REPORT / "baseline.json").read_text(encoding="utf-8"))
    rows, fields = read_csv("MASS_AUDIT_RESULTS.csv")
    audit = [row for row in rows if include_route(row)]
    assert len(audit) == len({row["route_id"] for row in audit}), "Duplicate route IDs"
    assert len(audit) and not any(not include_route(row) for row in audit)
    write_csv("MASS_AUDIT_RESULTS.csv", fields, audit)
    write_csv("UNVERIFIED_ROUTES.csv", fields, [row for row in audit if row["status"] != "VERIFIED"])

    inventory, inventory_fields = read_csv("ALL_ROUTES_INVENTORY.csv")
    scoped = [row for row in inventory if include_route(row)]
    if {row["route_id"] for row in scoped} != {row["route_id"] for row in audit}:
        raise ValueError("Scoped inventory must match audited route IDs")
    write_csv("AUDITED_ROUTES_INVENTORY.csv", inventory_fields, scoped)

    duplicate_rows, duplicate_fields = read_csv("ROUTE_DUPLICATE_CANDIDATES.csv")
    valid = []
    for row in duplicate_rows:
        if row["country"] == "KR" and any(
            not include_route({"country": "KR", "route_id": rid, "mode": ""})
            for rid in row["route_ids"].split("|")
        ):
            continue
        valid.append(row)
    write_csv("ROUTE_DUPLICATE_CANDIDATES.csv", duplicate_fields, valid)

    checkpoints = json.loads((REPORT / "MASS_CHECKPOINTS.json").read_text(encoding="utf-8"))
    checkpoints["scope"] = "Korean road buses excluded; all other baseline services retained"
    checkpoints["excluded_counts"] = {
        **{country: baseline["countries"][country.lower()]["registered"] -
           sum(row["country"] == country for row in audit) for country in COUNTRIES},
    }
    checkpoints["excluded_counts"]["TOTAL"] = sum(checkpoints["excluded_counts"].values())
    checkpoints["status_counts"] = {}
    summary = [
        "# 국가별 시간표 감사 범위", "",
        "검증률의 분모는 감사 대상 등록 레코드다. **한국 도로 버스는 제외하며**, 홍콩은 방향별 레코드를 포함한다.",
        "이 수치는 기존 시간표 감사 결과의 범위 재집계이며, 새 시간표 검증이 추가로 수행된 것은 아니다.",
        "계통 추가는 기준 main 대비 PR 전체 수치다.", "",
        "| Country | Total Routes | Fully Verified | Partial/Unverified | Patterns Added | Patterns Corrected | Routes Merged | Verification % |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for country in (*COUNTRIES, "TOTAL"):
        group = [row for row in audit if country == "TOTAL" or row["country"] == country]
        counts = Counter(row["status"] for row in group)
        total = len(group)
        verified = counts.get("VERIFIED", 0)
        added = sum(int(row.get("added") or 0) for row in group)
        corrected = sum(int(row.get("corrected") or 0) for row in group)
        merged = sum(int(row.get("merged") or 0) for row in group)
        pct = f"{verified/total:.3%}" if total else "N/A"
        summary.append(f"| {country} | {total:,} | {verified:,} | {total-verified:,} | "
                       f"{added} | {corrected} | {merged} | {pct} |")
        checkpoints["status_counts"][country] = dict(counts)
    summary.extend(["",
        f"기준 전체 9,128개 중 한국 도로 버스 {checkpoints['excluded_counts']['KR']:,}개를 제외했다.",
        "버스 원본 데이터는 변경하지 않았다. 원본 전체 목록은 [ALL_ROUTES_INVENTORY.csv](ALL_ROUTES_INVENTORY.csv)에 보존한다.",
        "새 범위 목록은 [AUDITED_ROUTES_INVENTORY.csv](AUDITED_ROUTES_INVENTORY.csv), "
        "상태는 [MASS_AUDIT_RESULTS.csv](MASS_AUDIT_RESULTS.csv), "
        "미검증 목록은 [UNVERIFIED_ROUTES.csv](UNVERIFIED_ROUTES.csv)를 참조한다.",
    ])
    (REPORT / "COVERAGE_BY_COUNTRY.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    (REPORT / "MASS_CHECKPOINTS.json").write_text(
        json.dumps(checkpoints, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # Keep the human-readable exceptions table synchronized with the new denominator.
    unverified_md = REPORT / "UNVERIFIED_ROUTES.md"
    old = unverified_md.read_text(encoding="utf-8")
    for country in COUNTRIES:
        count = sum(row["country"] == country and row["status"] != "VERIFIED" for row in audit)
        old, matches = re.subn(
            rf"(?m)^(\| {country} \| )([\d,]+)( \|)",
            lambda m: m.group(1) + f"{count:,}" + m.group(3), old
        )
        if matches != 1:
            raise ValueError(f"Missing unverified table entry for {country}")
    old = re.sub(r"status != VERIFIED.*?레코드 [\d,]+건",
                 f"status != VERIFIED 레코드 {sum(row['status'] != 'VERIFIED' for row in audit):,}건", old)
    unverified_md.write_text(old, encoding="utf-8")
    print("Audited", len(audit), "Excluded Korean buses", checkpoints["excluded_counts"]["KR"],
          "Verified", sum(row["status"] == "VERIFIED" for row in audit))


if __name__ == "__main__":
    main()
