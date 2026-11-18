"""Refresh Transilien OSM candidates without changing the verified playable catalog."""

import argparse
import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
API = "https://api.openstreetmap.org/api/0.6/"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def acquire(cache, name, endpoint, offline, refresh):
    target = cache / name
    if target.exists() and (offline or not refresh):
        return read(target)
    if offline:
        raise FileNotFoundError(f"Missing cached source: {name}")
    request = urllib.request.Request(
        API + endpoint, headers={"User-Agent": "SUBTYPE-France-Evidence/1.0"}
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                content = response.read()
            result = json.loads(content)
            temporary = target.with_suffix(".tmp")
            temporary.write_bytes(content)
            temporary.replace(target)
            time.sleep(1)
            return result
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", required=True, type=Path)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    config = read(ROOT / "data/fr/source/transilien-discovery.json")
    configured = {line["sourceRouteId"]: line for line in config["lines"]}
    schedule = read(ROOT / "data/fr/source/schedules/80921.json")
    outcomes = []
    for official in schedule["lines"]:
        if not any(pattern["family"] == "transilien" for pattern in official["patterns"]):
            continue
        item = {"sourceRouteId": official["sourceRouteId"], "code": official["shortName"],
                "schedulePatterns": len(official["patterns"]), "candidates": []}
        outcomes.append(item)
        known = configured.get(official["sourceRouteId"])
        if not known:
            item.update(status="MISSING", reason="No independently verified OSM route master")
            continue
        code, master_id = known["code"], known["routeMasterId"]
        try:
            source = acquire(args.cache, f"master-{code}.json", f"relation/{master_id}.json",
                             args.offline, args.refresh)
            master = next(element for element in source["elements"]
                          if element["type"] == "relation" and element["id"] == master_id)
            tags = master.get("tags", {})
            if (tags.get("type") != "route_master" or tags.get("network") != "Transilien"
                    or tags.get("ref") != code or tags.get("ref:FR:STIF") != official["sourceRouteId"].removeprefix("IDFM:")):
                raise ValueError("OSM master identity differs from the official timetable line")
            item.update(routeMasterId=master_id, sourceUrl=API + f"relation/{master_id}.json",
                        sourceVersion=master.get("version"), sourceTimestamp=master.get("timestamp"))
            relation_ids = sorted({member["ref"] for member in master["members"]
                                   if member["type"] == "relation"})
            for relation_id in relation_ids:
                candidate = {"relationId": relation_id, "sourceUrl": API + f"relation/{relation_id}/full.json"}
                item["candidates"].append(candidate)
                try:
                    data = acquire(args.cache, f"fr-osm-{relation_id}.json",
                                   f"relation/{relation_id}/full.json", args.offline, args.refresh)
                    relation = next(element for element in data["elements"]
                                    if element["type"] == "relation" and element["id"] == relation_id)
                    route_tags = relation.get("tags", {})
                    if (route_tags.get("type") != "route" or route_tags.get("route") != "train"
                            or route_tags.get("network") != "Transilien" or route_tags.get("ref") != code):
                        raise ValueError("Child relation is not the corresponding passenger train route")
                    candidate.update(status="MISSING", sourceVersion=relation.get("version"),
                                     sourceTimestamp=relation.get("timestamp"),
                                     reason="Requires ordered timetable, connected track, Korean and gameplay validation")
                    saved = ROOT / f"data/fr/source/osm/{relation_id}.json"
                    previous = next((row for row in known["candidates"]
                                     if row["relationId"] == relation_id), None)
                    if previous and saved.exists() and read(saved) == data:
                        candidate["status"] = ("ALREADY_IMPLEMENTED" if previous["status"] == "VERIFIED_ADDED"
                                               else previous["status"])
                        candidate["reason"] = previous["outcome"]
                except (OSError, ValueError, KeyError, StopIteration) as error:
                    candidate.update(status="UNVERIFIABLE", reason=str(error) or "Requested relation missing from source export")
            item["status"] = "DISCOVERED"
        except (OSError, ValueError, KeyError, StopIteration) as error:
            item.update(status="UNVERIFIABLE", reason=str(error) or "Requested master missing from source export")
        print(f"{code}: {item['status']}, {len(item['candidates'])} candidates", flush=True)
    output = {"generatedAt": datetime.now(timezone.utc).isoformat(), "sourceId": 80921,
              "license": "ODbL-1.0", "scope": "Source-scoped Transilien railway lines; candidates are not playable approvals",
              "lines": outcomes}
    (args.cache / "fr-transilien-discovery.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if any(line["status"] == "UNVERIFIABLE" or
           any(candidate["status"] == "UNVERIFIABLE" for candidate in line["candidates"])
           for line in outcomes):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
