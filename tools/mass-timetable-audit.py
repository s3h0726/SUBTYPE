#!/usr/bin/env python3
"""Fetch supported schedules, compare against pinned SUBTYPE snapshots and write audit reports."""

import argparse
import csv
import hashlib
import json
import shutil
import time
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
from zipfile import BadZipFile
from xml.etree.ElementTree import ParseError

from timetable_audit.compare import binding, compare, index_feed
from timetable_audit.gtfs import read_feed
from timetable_audit.tra_ods import compare_tra, read_tra_section

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "docs/timetable-audit"
COUNTRIES = ("JP", "KR", "HK", "TW", "TH", "UK")
BASE = "ea4696898cf2fcb17d3278eda13766e9a1540e23"
USER_AGENT = "SUBTYPE-TimetableAudit/1.0"
SEOUL = timezone(timedelta(hours=9))


def json_text(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def access_date(path):
    headers = path.with_suffix(".headers")
    if headers.exists():
        for line in reversed(headers.read_text(encoding="utf-8", errors="replace").splitlines()):
            if line.lower().startswith("date:"):
                return parsedate_to_datetime(line[5:].strip()).astimezone(SEOUL).date().isoformat()
    return datetime.fromtimestamp(path.stat().st_mtime, SEOUL).date().isoformat()


def save_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def csv_file(path, fields, values, immutable=False):
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(values)
    if immutable and path.exists() and digest(path) != digest(temporary):
        temporary.unlink()
        raise ValueError("Refusing to replace the pinned baseline with different inventory data")
    temporary.replace(path)


def fetch(source, target):
    url = source["url"]
    host = urlsplit(url)
    if host.scheme != "https":
        raise ValueError("Only HTTPS schedule sources are supported")
    robots = RobotFileParser()
    robots.set_url(f"{host.scheme}://{host.netloc}/robots.txt")
    try:
        with urlopen(Request(robots.url, headers={"User-Agent": USER_AGENT}), timeout=20) as response:
            robots.parse(response.read(524288).decode("utf-8", errors="replace").splitlines())
    except HTTPError as error:
        if error.code not in (404, 410):
            raise
        robots.parse([])
    if not robots.can_fetch(USER_AGENT, url):
        raise ValueError("Publisher robots rules exclude this URL")
    pause = max(2, robots.crawl_delay(USER_AGENT) or 0)
    temporary = target.with_suffix(".download")
    for attempt in range(3):
        time.sleep(pause * (attempt + 1))
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=45) as response:
                with temporary.open("wb") as output:
                    shutil.copyfileobj(response, output)
                target.with_suffix(".headers").write_text(str(response.headers), encoding="utf-8")
            temporary.replace(target)
            return
        except HTTPError as error:
            if error.code not in (500, 502, 503, 504) or attempt == 2:
                raise
    raise RuntimeError("Source download failed")


def load_feeds(config, cache, first, last, fetch_missing):
    feeds, source_rows = {}, []
    adapter_version = digest(Path(__file__).parent / "timetable_audit/gtfs.py")
    for source in config["sources"]:
        archive = cache / (source["id"] + ".zip")
        row = dict(source)
        try:
            if not archive.is_file() and fetch_missing:
                fetch(source, archive)
            if not archive.is_file():
                raise FileNotFoundError("No cached schedule archive; use --fetch or provide publisher ZIP")
            source_hash = digest(archive)
            normalized = cache / (source["id"] + ".normalized.json")
            revision = {"source": source, "sha256": source_hash, "window": [str(first), str(last)], "adapter_version": adapter_version}
            stored = json.loads(normalized.read_text(encoding="utf-8")) if normalized.exists() else {}
            if stored.get("revision") == revision:
                feed = stored["feed"]
            else:
                def selected(route):
                    return (not source.get("agency_ids") or route["agency_id"] in source["agency_ids"]) and (
                        not source.get("route_types") or route["route_type"] in source["route_types"])
                feed = read_feed(archive, first, last, selected)
                # The cache is local. Report publication omits normalized trips.
                save_json(normalized, {"revision": revision, "feed": feed})
            # The local cache retains normalized calls for reproducible analysis.
            # Reports only contain provenance, matching metrics and exceptions.
            feeds[source["id"]] = feed
            active = [trip for trip in feed["trips"] if feed["calendars"][trip["service_id"]]["active_dates"]]
            calendars = [feed["calendars"][key] for key in {trip["service_id"] for trip in active}]
            row.update(status="PARSED", revision=source_hash, accessed_at=access_date(archive), routes=len(feed["routes"]),
                       trip_records=len(feed["trips"]), active_trip_records=len(active), issues=len(feed["issues"]),
                       valid_from=min((cal["from"] for cal in calendars), default=""),
                       valid_to=max((cal["to"] for cal in calendars), default=""))
        except (OSError, ValueError, KeyError, BadZipFile) as error:
            row.update(status="UNAVAILABLE", notes=str(error))
        source_rows.append(row)
    for country, scope, url, notes in config["discovery"]:
        source_rows.append(dict(country=country, scope=scope, url=url, status="DISCOVERED", notes=notes))
    return feeds, source_rows


def next_source(route, source_rows):
    country = route["country"]
    candidates = [row for row in source_rows if row["country"] == country and row["status"] == "DISCOVERED"]
    if country == "KR" and "bus" in route["mode"]:
        return next(row["url"] for row in candidates if row["scope"] == "Scheduled bus")
    if country == "HK" and "high-speed" in route["route_id"]:
        return next(row["url"] for row in candidates if row["scope"].startswith("Airport"))
    if country == "TW" and not route["route_id"].startswith("tw-tra-"):
        return next(row["url"] for row in candidates if row["scope"] == "THSR, TRA and Metro")
    if country == "UK" and route["operator_id"] in {"uk-tfl", "uk-london-underground", "uk-london-overground"}:
        return next(row["url"] for row in candidates if row["scope"] == "London TfL")
    return candidates[0]["url"] if candidates else ""


def load_tra(cache, source_rows, fetch_missing):
    urls = (REPORT / "tra-ods-urls.txt").read_text(encoding="utf-8").splitlines()
    directory = cache / "tw-tra"
    directory.mkdir(exist_ok=True)
    trips_by_train = defaultdict(list)
    reference = next(row["url"] for row in source_rows if row["scope"] == "TRA")
    adapter_version = digest(Path(__file__).parent / "timetable_audit/tra_ods.py")
    for url in urls:
        file = directory / Path(urlsplit(url).path).name
        row = {"id": file.stem, "country": "TW", "scope": "TRA timetable section", "url": url,
               "reference": reference, "adapter": "tra-ods", "valid_from": "2026-07-01",
               "license": "Taiwan Railway public timetable; source reference only"}
        try:
            if not file.is_file() and fetch_missing:
                fetch({"url": url}, file)
            revision = digest(file)
            normalized = file.with_suffix(".json")
            stored = json.loads(normalized.read_text(encoding="utf-8")) if normalized.exists() else {}
            if stored.get("revision") == revision and stored.get("adapter_version") == adapter_version:
                trips = stored["trips"]
            else:
                trips = read_tra_section(file)
                save_json(normalized, {"revision": revision, "adapter_version": adapter_version, "trips": trips})
            if not trips:
                raise ValueError("Unrecognized or empty TRA matrix")
            row.update(status="PARSED", revision=revision, accessed_at=access_date(file), trip_records=len(trips))
            for trip in trips:
                trips_by_train[trip["trip_id"]].append(trip)
        except (OSError, ValueError, KeyError, BadZipFile, ParseError) as error:
            row.update(status="UNAVAILABLE", notes=str(error))
        source_rows.append(row)
    patterns = json.loads((ROOT / "data/tw/generated/network.json").read_text(encoding="utf-8"))["patterns"]
    save_json(cache / "tw-tra.normalized.json", trips_by_train)
    return trips_by_train, {pattern["id"]: pattern["trainNumbers"] for pattern in patterns}


def audit_route(route, feeds, groups, sources, previous, first, last, tra):
    identifier = route["route_id"]
    original = previous.get(identifier, {})
    prior_status = {"NEW_PATTERN": "ADDED_PATTERN", "PARTIAL": "PARTIALLY_VERIFIED"}
    status = prior_status.get(original.get("status"), original.get("status", "REQUIRES_REVIEW"))
    finding = original.get("finding", "Current operator timetable and route binding pending")
    result = {
        **route, "status": status, "notes": finding,
        "source_url": original.get("timetable_url", ""), "accessed_at": original.get("accessed_date", ""),
        "validity": original.get("effective_date", ""), "added": original.get("added", 0),
        "corrected": original.get("corrected", 0), "merged": original.get("merged", 0),
        "confidence": "official" if original else "unverified", "next_source": next_source(route, sources),
    }
    if identifier.startswith("tw-tra-"):
        checked, exact, partial, differences = compare_tra(route, *tra)
        if checked:
            result.update(status="PARTIALLY_VERIFIED", source_id="tw-tra-ods",
                          source_url=result["next_source"], accessed_at="2026-11-12",
                          validity="2026-07-01/", matched=len(exact), source_patterns=len(checked),
                          baseline_patterns=len(route["runtime_patterns"]),
                          confidence="operator tables matched by train number; section scope",
                          notes=f"{len(checked)} game patterns referenced; {len(exact)} complete matches, "
                                f"{len(partial)} section matches and {len(differences)} train/pattern pairs to review")
        return result
    source_id, ids = binding(route, feeds)
    if not source_id:
        return result
    source = next(row for row in sources if row.get("id") == source_id)
    result.update(source_id=source_id, source_url=source["url"], revision=source.get("revision", ""),
                  official_ids="|".join(ids), accessed_at=source.get("accessed_at", ""), next_source=source["reference"],
                  validity=f"{source.get('valid_from', '')}/{source.get('valid_to', '')}",
                  compared_window=f"{first}/{last}")
    if not ids or source_id not in feeds:
        return dict(result, status="SOURCE_UNAVAILABLE", confidence="unverified",
                    notes="Bound GTFS timetable or official trip identifiers unavailable")
    metrics = compare(route, feeds[source_id], groups[source_id], ids)
    result.update(metrics)
    if metrics["matched"] or metrics["missing_candidates"] and not metrics["ambiguous"]:
        status = "PARTIALLY_VERIFIED"
    else:
        status = "MATCH_AMBIGUOUS" if metrics["source_patterns"] else "SOURCE_UNAVAILABLE"
    result.update(status=status, confidence="route-bound; stop matches require review",
                  notes=f"{metrics['matched']} stored stop sequences matched; "
                        f"{len(metrics['missing_candidates'])} candidate sequences differ; "
                        f"{len(metrics['ambiguous'])} source patterns have unresolved stops")
    if (source_id == "hk-td" and identifier.startswith("hk-tram-") and metrics["matched"]
            and not metrics["unmatched_baseline"] and not metrics["ambiguous"] and not metrics["missing_candidates"]
            and not any(issue["route_id"] in ids for issue in feeds[source_id]["issues"])):
        result.update(status="VERIFIED", confidence="exact directional match in published schedule window",
                      notes=result["notes"] + "; TD calendar and frequency templates included, unscheduled diversions excluded")
    if identifier == "line-toyama-city-2":
        result.update(status="ADDED_PATTERN", added=2,
                      notes=result["notes"] + "; the 3008 weekday short turn was implemented in two directions")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=ROOT / ".cache/timetable-audit")
    parser.add_argument("--as-of", type=date.fromisoformat, default=date(2026, 11, 11))
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--fetch", action="store_true", help="fetch only missing public archives")
    parser.add_argument("--resume", action="store_true", help="reuse country checkpoints whose input fingerprints match")
    args = parser.parse_args()
    if not 1 <= args.days <= 366:
        parser.error("--days must be 1–366")
    cache = args.cache.resolve()
    cache.mkdir(parents=True, exist_ok=True)
    config = json.loads((REPORT / "mass-sources.json").read_text(encoding="utf-8"))
    previous = json.loads((REPORT / "evidence.json").read_text(encoding="utf-8"))
    last = args.as_of + timedelta(days=args.days - 1)
    feeds, sources = load_feeds(config, cache, args.as_of, last, args.fetch)
    tra = load_tra(cache, sources, args.fetch)
    groups = {key: index_feed(feed) for key, feed in feeds.items()}
    csv_file(REPORT / "TIMETABLE_SOURCES.csv", [
        "id", "country", "scope", "url", "reference", "adapter", "license", "status", "revision",
        "accessed_at", "valid_from", "valid_to", "routes", "trip_records", "active_trip_records", "issues", "notes"
    ], sources)

    all_routes, all_results = [], []
    code_hashes = [digest(file) for file in [Path(__file__), *sorted(Path(__file__).parent.glob("timetable_audit/*.py")),
                                            ROOT / "data/tw/generated/network.json"]]
    for country in COUNTRIES:
        snapshot = cache / "baseline" / (country.lower() + ".jsonl")
        with snapshot.open(encoding="utf-8") as stream:
            routes = [json.loads(line) for line in stream]
        fingerprint = hashlib.sha256(json_text([digest(snapshot), code_hashes, config, previous, str(args.as_of),
                                               str(last), sources]).encode()).hexdigest()
        checkpoint = cache / (country.lower() + "-checkpoint.json")
        previous_checkpoint = json.loads(checkpoint.read_text(encoding="utf-8")) if args.resume and checkpoint.exists() else {}
        if previous_checkpoint.get("fingerprint") == fingerprint:
            results = previous_checkpoint["results"]
        else:
            results = [audit_route(route, feeds, groups, sources, previous, args.as_of, last, tra) for route in routes]
            for result in results:
                for field in ("station_records", "sequence", "runtime_patterns", "catalog_patterns", "catalog_journeys"):
                    result.pop(field, None)
            save_json(checkpoint, {"fingerprint": fingerprint, "results": results})
        all_routes.extend(routes)
        all_results.extend(results)
        print(country, len(results), dict(Counter(result["status"] for result in results)), flush=True)

    ids = [route["route_id"] for route in all_routes]
    if len(ids) != len(set(ids)) or set(ids) != {result["route_id"] for result in all_results}:
        raise ValueError("Route IDs must be unique and every baseline route must have an audit record")
    inventory = ["baseline_commit", "country", "operator_id", "operator", "route_id", "name", "mode", "infrastructure",
                 "passenger_service", "selectable", "playable", "official_code", "legacy_alias_target", "directions",
                 "branches", "through_services", "sequence", "runtime_patterns", "catalog_journeys", "catalog_patterns"]
    inventory_rows = ({**route, "baseline_commit": BASE, **{
        key: json_text(route[key]) for key in inventory[-4:]
    }} for route in all_routes)
    csv_file(REPORT / "ALL_ROUTES_INVENTORY.csv", inventory, inventory_rows, immutable=True)
    sequence_groups = defaultdict(list)
    for route in all_routes:
        stops = tuple(route["sequence"])
        if len(stops) >= 2:
            sequence_groups[(route["country"], min(stops, stops[::-1]))].append(route)
    duplicates = [
        {"country": country, "route_ids": "|".join(sorted(route["route_id"] for route in group)),
         "operators": "|".join(sorted({route["operator_id"] for route in group})),
         "call_count": len(sequence), "status": "REQUIRES_REVIEW",
         "reason": "Identical or reverse station IDs; operator service identity and saved references require review"}
        for (country, sequence), group in sequence_groups.items() if len(group) > 1
    ]
    csv_file(REPORT / "ROUTE_DUPLICATE_CANDIDATES.csv",
             ["country", "route_ids", "operators", "call_count", "status", "reason"], duplicates)
    fields = ["country", "operator_id", "operator", "route_id", "name", "mode", "status", "source_id", "source_url", "revision",
              "official_ids", "validity", "accessed_at", "compared_window", "confidence", "patterns", "source_patterns", "trip_records", "matched",
              "baseline_patterns", "unmatched_baseline", "ambiguous", "missing_candidates", "added", "corrected", "merged",
              "notes", "next_source", "validation_error"]
    for result in all_results:
        for key in ("ambiguous", "missing_candidates"):
            if key in result:
                result[key] = json_text(result[key])
    csv_file(REPORT / "MASS_AUDIT_RESULTS.csv", fields, all_results)
    csv_file(REPORT / "UNVERIFIED_ROUTES.csv", fields, (r for r in all_results if r["status"] != "VERIFIED"))
    summary = ["# 국가별 시간표 감사 범위", "",
               "검증률의 분모는 기준 카탈로그의 등록 레코드다. 홍콩은 방향별 레코드를 포함한다.",
               "추가 계통 수는 기준 main 대비 PR 전체이며, 이번 배치의 신규 계통은 일본 2방향이다.", "",
               "| Country | Total Routes | Fully Verified | Partial/Unverified | Patterns Added | Patterns Corrected | Routes Merged | Verification % |",
               "|---|---:|---:|---:|---:|---:|---:|---:|"]
    checkpoint_rows = {}
    for country in (*COUNTRIES, "TOTAL"):
        records = [r for r in all_results if country in {r["country"], "TOTAL"}]
        counts = Counter(r["status"] for r in records)
        total, verified = len(records), counts["VERIFIED"]
        added, corrected, merged = (sum(r[key] for r in records) for key in ("added", "corrected", "merged"))
        summary.append(f"| {country} | {total:,} | {verified:,} | {total-verified:,} | {added} | {corrected} | {merged} | {verified/total:.3%} |")
        checkpoint_rows[country] = dict(counts)
    summary += ["", "모든 등록 노선은 [감사 CSV](MASS_AUDIT_RESULTS.csv)에 있으며, 미검증 ID는 [별도 CSV](UNVERIFIED_ROUTES.csv)에 있다."]
    (REPORT / "COVERAGE_BY_COUNTRY.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    save_json(REPORT / "MASS_CHECKPOINTS.json", {
        "baseline_commit": BASE, "baseline_sha256": digest(REPORT / "ALL_ROUTES_INVENTORY.csv"),
        "window": [str(args.as_of), str(last)], "status_counts": checkpoint_rows,
        "country_snapshot_sha256": {country: digest(cache / "baseline" / (country.lower() + ".jsonl")) for country in COUNTRIES},
    })


if __name__ == "__main__":
    main()
