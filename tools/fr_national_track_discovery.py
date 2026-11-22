"""Cache every child train relation in a saved French OSM master inventory."""

import argparse
import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--masters", type=Path, required=True)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    source = read(args.masters)
    # This query can also return Polish Intercity and domestic OUIGO Spain.
    # Keep the raw discovery export; do not count those as French candidates.
    masters = [master for master in source["elements"] if
               any(token in master.get("tags", {}).get("network", "")
                   for token in ("TGV", "Lyria", "Intercités", "Ouigo Train Classique")) or
               re.search(r"\bSNCF\b", master.get("tags", {}).get("operator", "")) or
               master.get("tags", {}).get("gtfs:feed") == "FR-SNCF"]
    relation_ids = sorted({member["ref"] for master in masters for member in master["members"]
                           if member["type"] == "relation"})
    coverage = read(ROOT / "reports/fr/coverage.json")
    verified = {relation_id for line in coverage["lines"] for direction in line["directions"]
                if direction["status"] == "VERIFIED_ADDED"
                for relation_id in direction.get("relationIds", [direction["relationId"]])}

    def acquire(relation_id):
        target = args.cache / f"fr-osm-{relation_id}.json"
        url = f"https://api.openstreetmap.org/api/0.6/relation/{relation_id}/full.json"
        result = {"relationId": relation_id, "sourceUrl": url, "license": "ODbL-1.0"}
        try:
            if not target.exists():
                if args.offline:
                    raise FileNotFoundError("Missing cached relation export")
                for attempt in range(3):
                    try:
                        request = urllib.request.Request(url, headers={"User-Agent": "SUBTYPE-France-Evidence/1.0"})
                        with urllib.request.urlopen(request, timeout=45) as response:
                            content = response.read()
                        data = json.loads(content)
                        temporary = target.with_suffix(".download")
                        temporary.write_bytes(content)
                        temporary.replace(target)
                        time.sleep(0.5)
                        break
                    except (OSError, ValueError):
                        if attempt == 2:
                            raise
                        time.sleep(2 ** attempt)
            data = read(target)
            relation = next(element for element in data["elements"]
                            if element["type"] == "relation" and element["id"] == relation_id)
            tags = relation.get("tags", {})
            if tags.get("type") != "route" or tags.get("route") != "train":
                raise ValueError("Not a passenger train route candidate")
            result.update(name=tags.get("name"), operator=tags.get("operator"), network=tags.get("network"),
                          sourceVersion=relation.get("version"), sourceTimestamp=relation.get("timestamp"),
                          status="MISSING", reason="Requires official timetable, track, Korean and gameplay validation")
            saved = ROOT / f"data/fr/source/osm/{relation_id}.json"
            if relation_id in verified and saved.exists() and read(saved) == data:
                result.update(status="ALREADY_IMPLEMENTED", reason="Identical source with recorded complete gameplay outcomes")
        except (OSError, ValueError, KeyError, StopIteration) as error:
            result.update(status="UNVERIFIABLE", reason=str(error) or "Requested relation missing from export")
        return result

    with ThreadPoolExecutor(max_workers=2) as pool:
        candidates = []
        for index, result in enumerate(pool.map(acquire, relation_ids), 1):
            candidates.append(result)
            if index % 25 == 0 or index == len(relation_ids) or result["status"] == "UNVERIFIABLE":
                print(f"{index}/{len(relation_ids)} cached; latest {result['relationId']}: {result['status']}", flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "scope": "OSM French network/operator route-master candidates, not verified operational lines",
        "sourceFile": args.masters.name, "discoveryApi": "https://overpass-api.de/api/interpreter",
        "sourceTimestamp": source.get("osm3s", {}).get("timestamp_osm_base"),
        "license": "ODbL-1.0", "masters": masters, "candidates": candidates,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
