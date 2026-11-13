"""Build an auditable French passenger-rail inventory from pinned source files."""

import argparse
import csv
import hashlib
import io
import json
import re
import zipfile
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAIL_MODES = {"rail", "subway", "tramway", "light_rail", "funicular", "monorail"}
REGIONS = dict(zip(
    "11 24 27 28 32 44 52 53 75 76 84 93 94".split(),
    ("Île-de-France", "Centre-Val de Loire", "Bourgogne-Franche-Comté", "Normandie",
     "Hauts-de-France", "Grand Est", "Pays de la Loire", "Bretagne", "Nouvelle-Aquitaine",
     "Occitanie", "Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d’Azur", "Corse"),
))
OVERSEAS = {"01", "02", "03", "04", "06", "975", "977", "978", "986", "987", "988"}
PRIORITY = {83582: 0, 80921: 1}
TERRITORY = {
    "2A": "94", "2B": "94", "59": "32", "62": "32", "60": "32", "02": "32", "80": "32",
    "14": "28", "27": "28", "50": "28", "61": "28", "76": "28",
    "22": "53", "29": "53", "35": "53", "56": "53", "44": "52", "49": "52",
    "53": "52", "72": "52", "85": "52", "18": "24", "28": "24", "36": "24",
    "37": "24", "41": "24", "45": "24", "08": "44", "10": "44", "51": "44",
    "52": "44", "54": "44", "55": "44", "57": "44", "67": "44", "68": "44", "88": "44",
    "21": "27", "25": "27", "39": "27", "58": "27", "70": "27", "71": "27", "89": "27",
    "90": "27", "01": "84", "03": "84", "07": "84", "15": "84", "26": "84", "38": "84",
    "42": "84", "43": "84", "63": "84", "69": "84", "73": "84", "74": "84",
    "16": "75", "17": "75", "19": "75", "23": "75", "24": "75", "33": "75", "40": "75",
    "47": "75", "64": "75", "79": "75", "86": "75", "87": "75", "09": "76", "11": "76",
    "12": "76", "30": "76", "31": "76", "32": "76", "34": "76", "46": "76", "48": "76",
    "65": "76", "66": "76", "81": "76", "82": "76", "04": "93", "05": "93", "06": "93",
    "13": "93", "83": "93", "84": "93", "75": "11", "77": "11", "78": "11", "91": "11",
    "92": "11", "93": "11", "94": "11", "95": "11",
    "971": "01", "972": "02", "973": "03", "974": "04", "976": "06",
}


def json_read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def json_write(path, value, *, pretty=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2 if pretty else None,
                            separators=None if pretty else (",", ":"))
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(serialized + "\n", encoding="utf-8", newline="\n")
    temporary.replace(path)


def sha_file(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def stable_id(*values):
    encoded = json.dumps(values, ensure_ascii=False, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()[:24]


def gtfs_mode(value):
    code = int(value)
    if code in {0, 5} or 900 <= code < 1000:
        return "tramway"
    if code == 1 or 400 <= code <= 404:
        return "subway"
    if code in {2, 12} or 100 <= code < 200 or 300 <= code < 400:
        return "monorail" if code == 12 else "rail"
    if code == 7 or 1400 <= code < 1500:
        return "funicular"
    return None


def catalog_sources(catalog):
    for dataset in catalog:
        if dataset.get("type") != "public-transit":
            continue
        for resource in dataset["resources"]:
            if resource.get("format") != "GTFS":
                continue
            metadata = resource.get("metadata") or {}
            modes = set(metadata.get("modes") or [])
            if modes and not modes.intersection(RAIL_MODES):
                continue
            if not modes and not resource.get("is_available"):
                continue
            area = dataset.get("covered_area") or []
            yield {
                "resourceId": resource["id"], "datasetId": dataset["id"], "slug": dataset["slug"],
                "publisher": dataset.get("publisher"), "datasetUrl": dataset["page_url"],
                "downloadUrl": resource.get("original_url") or resource["url"],
                "catalogDownloadUrl": resource.get("url"), "license": dataset.get("licence"),
                "publishedAt": resource.get("updated"), "validFrom": metadata.get("start_date"),
                "validTo": metadata.get("end_date"), "reportedModes": sorted(modes),
                "coveredArea": area, "overseas": any(
                    item["type"] == "region" and item["insee"] in OVERSEAS or
                    item["type"] in {"departement", "commune"} and
                    (item["insee"][:3] in {"971", "972", "973", "974", "975", "976", "977", "978", "986", "987", "988"})
                    for item in area
                ),
            }


class Feed:
    def __init__(self, archive):
        self.archive = archive
        self.tables = {}
        for name in archive.namelist():
            table = name.rsplit("/", 1)[-1]
            if table.endswith(".txt"):
                if table in self.tables:
                    raise ValueError(f"Ambiguous GTFS table {table}")
                self.tables[table] = name
        required = {"agency.txt", "routes.txt", "trips.txt", "stops.txt", "stop_times.txt"}
        if not required <= self.tables.keys() or not {"calendar.txt", "calendar_dates.txt"} & self.tables.keys():
            raise ValueError("Incomplete GTFS schedule")

    def rows(self, table):
        name = self.tables.get(table + ".txt")
        if name:
            with io.TextIOWrapper(self.archive.open(name), encoding="utf-8-sig", newline="") as stream:
                reader = csv.DictReader(stream)
                if reader.fieldnames is None:
                    return
                cleaned = [field.strip() for field in reader.fieldnames]
                padded = cleaned != reader.fieldnames
                reader.fieldnames = cleaned
                if padded:
                    for row in reader:
                        yield {key: value.strip() if isinstance(value, str) else value for key, value in row.items()}
                else:
                    yield from reader

    def calls(self, trips):
        with io.TextIOWrapper(self.archive.open(self.tables["stop_times.txt"]), encoding="utf-8-sig", newline="") as stream:
            reader = csv.reader(stream)
            original = next(reader)
            header = [field.strip() for field in original]
            padded = header != original
            trip, stop, seq = (header.index(key) for key in ("trip_id", "stop_id", "stop_sequence"))
            pickup = header.index("pickup_type") if "pickup_type" in header else None
            dropoff = header.index("drop_off_type") if "drop_off_type" in header else None
            for row in reader:
                if padded:
                    row = [value.strip() for value in row]
                if row[trip] in trips:
                    yield row[trip], (int(row[seq]), row[stop],
                                      row[pickup] or "0" if pickup is not None else "0",
                                      row[dropoff] or "0" if dropoff is not None else "0")

    def active_dates(self, start):
        dates = defaultdict(set)
        weekdays = "monday tuesday wednesday thursday friday saturday sunday".split()
        for row in self.rows("calendar"):
            first = max(start, date.fromisoformat(row["start_date"]))
            last = date.fromisoformat(row["end_date"])
            for offset in range((last - first).days + 1):
                day = first + timedelta(days=offset)
                if row[weekdays[day.weekday()]] == "1":
                    dates[row["service_id"]].add(day)
        for row in self.rows("calendar_dates"):
            day = date.fromisoformat(row["date"])
            if day >= start:
                service_dates = dates[row["service_id"]]
                if row["exception_type"] == "1":
                    service_dates.add(day)
                elif row["exception_type"] == "2":
                    service_dates.discard(day)
        return {key: value for key, value in dates.items() if value}


def sncf_brand(stop_ids):
    brands = Counter(match[1] for stop in stop_ids
                     if (match := re.fullmatch(r"StopPoint:OCE(.+)-[0-9]{8}", stop)))
    return brands.most_common(1)[0][0] if brands else None


def service_family(mode, brand, source, route):
    slug = source["slug"]
    brand_key = (brand or "").lower()
    if any(x in slug for x in ("eurostar", "trenitalia", "ave-espagne")):
        return "international"
    if "nuit" in brand_key:
        return "intercites-night"
    if any(x in brand_key for x in ("lyria", "ice", "eurostar", "thalys", "db ", "alleo")):
        return "international"
    if "classique" in brand_key and "ouigo" in brand_key:
        return "ouigo-classique"
    if any(x in brand_key for x in ("tgv", "ouigo")):
        return "high-speed"
    if "intercit" in brand_key:
        return "intercites"
    if "ter" in brand_key:
        return "ter"
    if brand_key == "tramtrain":
        return "tram-train"
    if "corse" in slug:
        return "regional-independent"
    if "ile-de-france-mobilites" in slug or "transilien" in slug:
        if route["route_short_name"] in {"A", "B", "C", "D", "E"} and mode == "rail":
            return "rer"
        if mode == "rail":
            if route["route_short_name"] in {"H", "J", "K", "L", "N", "P", "R", "U", "V"}:
                return "transilien"
            return "ile-de-france-rail-review"
    return mode


def import_feed(feed, source, start):
    source_id = source["resourceId"]
    routes = {r["route_id"]: r for r in feed.rows("routes") if gtfs_mode(r["route_type"])}
    active = feed.active_dates(start)
    agencies = {r.get("agency_id", ""): r for r in feed.rows("agency")}
    stops = {r["stop_id"]: r for r in feed.rows("stops")}
    trips = {r["trip_id"]: r for r in feed.rows("trips")
             if r["route_id"] in routes and r["service_id"] in active}
    trips_calls = defaultdict(list)
    for trip, call in feed.calls(trips):
        trips_calls[trip].append(call)
    patterns = defaultdict(dict)
    stations = {}
    invalid = Counter()
    excluded = Counter()
    for trip_id, trip in trips.items():
        route_id = trip["route_id"]
        sequence = sorted(trips_calls.get(trip_id, ()))
        if any(stop not in stops for _, stop, _, _ in sequence) or len({row[0] for row in sequence}) != len(sequence):
            invalid[route_id] += 1
            continue
        calls = [(stop, pickup, dropoff) for _, stop, pickup, dropoff in sequence
                 if (pickup, dropoff) != ("1", "1")]
        if len(calls) < 2:
            invalid[route_id] += 1
            continue
        station_ids = [stops[stop].get("parent_station") or stop for stop, _, _ in calls]
        brand = sncf_brand([row[0] for row in calls]) if source["slug"] == "horaires-sncf" else None
        if brand and brand.lower().startswith(("car ", "bus ")):
            excluded[route_id] += 1
            continue
        access = [row[1:] for row in calls]
        pattern_id = "fr-pattern-" + stable_id(source["slug"], route_id, brand, station_ids, access)
        route_patterns = patterns[route_id]
        if pattern_id not in route_patterns:
            route_patterns[pattern_id] = {
                "id": pattern_id, "stationIds": station_ids, "callAccess": access,
                "brand": brand, "family": service_family(gtfs_mode(routes[route_id]["route_type"]),
                                                        brand, source, routes[route_id]),
                "serviceIds": set(), "shapeTripCounts": Counter(), "directionIds": set(),
                "sampleTripId": trip_id, "tripRecords": 0, "status": "BLOCKED",
                "reason": "track-alignment-and-korean-localization-unverified",
            }
        pattern = route_patterns[pattern_id]
        pattern["serviceIds"].add(trip["service_id"])
        pattern["directionIds"].add(trip.get("direction_id", ""))
        pattern["shapeTripCounts"][trip.get("shape_id", "")] += 1
        pattern["sampleTripId"] = min(pattern["sampleTripId"], trip_id)
        pattern["tripRecords"] += 1
        for station_id, (stop_id, _, _) in zip(station_ids, calls):
            row = stops.get(station_id)
            if not row:
                row = stops[stop_id]
            if station_id not in stations:
                stations[station_id] = {"id": station_id, "name": row["stop_name"],
                                        "latitude": row.get("stop_lat"), "longitude": row.get("stop_lon"),
                                        "platformIds": set()}
                if source_id == 80921:
                    stations[station_id]["platformLocations"] = {}
            stations[station_id]["platformIds"].add(stop_id)
            if source_id == 80921 and stop_id not in stations[station_id]["platformLocations"]:
                platform = stops[stop_id]
                if platform.get("stop_lat") and platform.get("stop_lon"):
                    stations[station_id]["platformLocations"][stop_id] = [
                        float(platform["stop_lat"]), float(platform["stop_lon"]),
                    ]
    line_inventory = []
    for route_id, route in sorted(routes.items()):
        variants = sorted(patterns[route_id].values(), key=lambda p: p["id"])
        for pattern in variants:
            operating_dates = set().union(*(active[key] for key in pattern.pop("serviceIds")))
            pattern["firstDate"] = min(operating_dates).isoformat()
            pattern["lastDate"] = max(operating_dates).isoformat()
            pattern["operatingDays"] = len(operating_dates)
            pattern["directionIds"] = sorted(pattern["directionIds"])
            pattern["shapeTripCounts"] = dict(pattern["shapeTripCounts"])
        agency = agencies.get(route.get("agency_id", "")) or (next(iter(agencies.values())) if len(agencies) == 1 else {})
        excluded_from_scope = source_id in {11681, 82880}
        expired = bool(source.get("validTo") and source["validTo"] < start.isoformat())
        if excluded_from_scope:
            reason = "no-French-passenger-rail-calls" if source_id == 11681 else "aerial-cableway"
            status = "OUT_OF_SCOPE"
        elif variants:
            status = "BLOCKED"
            reason = "track-alignment-and-korean-localization-unverified"
        elif expired or invalid[route_id]:
            status = "UNVERIFIABLE"
            reason = "expired-snapshot" if expired else "invalid-passenger-call-data"
        else:
            status = "NOT_OPERATIONAL"
            reason = "replacement-coach-only" if excluded[route_id] else "no-active-trip-in-snapshot"
        line_inventory.append({
            "id": "fr-line-" + stable_id(source["slug"], route_id), "sourceRouteId": route_id,
            "agencyId": agency.get("agency_id"), "operator": agency.get("agency_name"),
            "shortName": route["route_short_name"], "longName": route["route_long_name"],
            "mode": gtfs_mode(route["route_type"]), "routeType": route["route_type"],
            "invalidTrips": invalid[route_id], "excludedBusTrips": excluded[route_id], "patterns": variants,
            "status": status, "reason": reason,
        })
    for station in stations.values():
        station["platformIds"] = sorted(station["platformIds"])
    return {
        "sourceId": source_id, "feedInfo": next(feed.rows("feed_info"), {}),
        "agencies": [agencies[k] for k in sorted(agencies)], "lines": line_inventory,
        "stations": [stations[k] for k in sorted(stations)],
    }


def infrastructure(path, tracks):
    features = json_read(path)["features"]
    records = []
    for feature in features:
        item = feature["properties"]
        fields = ("code_ligne", "rg_troncon", "pk_debut_r", "pk_fin_r")
        fields += ("idgaia", "code_voie", "type_voie") if tracks else ("mnemo", "libelle")
        records.append({key: item.get(key) for key in fields})
    return {
        "archiveSha256": sha_file(path), "featureCount": len(records),
        "infrastructureLineCodes": len({r["code_ligne"] for r in records}),
        "records": sorted(records, key=lambda r: json.dumps(r, sort_keys=True)),
    }


def inventory_source(task):
    source, cache, source_dir, start = task
    source_id = source["resourceId"]
    archive = cache / f"fr-{source_id}.zip"
    source["verificationStatus"] = "MISSING" if source["reportedModes"] else "UNVERIFIABLE"
    if not archive.exists():
        return source, None
    destination = source_dir / "schedules" / f"{source_id}.json"
    try:
        archive_hash = sha_file(archive)
        try:
            inventory = json_read(destination) if destination.exists() else {}
        except (UnicodeDecodeError, json.JSONDecodeError):
            inventory = {}
        identity = {"asOf": start.isoformat(), "archiveSha256": archive_hash,
                    "schemaVersion": 3 if source_id in {11681, 82880, 83882, 80921, 80931, 67595} else 1}
        if inventory.get("snapshot") != identity:
            with zipfile.ZipFile(archive) as zip_file:
                inventory = import_feed(Feed(zip_file), source, start)
            inventory["snapshot"] = identity
            json_write(destination, inventory)
        source.update(archiveSha256=archive_hash, verificationStatus="SCHEDULE_INVENTORIED",
                      stationGroups=len(inventory["stations"]), lineRecords=len(inventory["lines"]))
    except (zipfile.BadZipFile, OSError, KeyError, ValueError) as error:
        source.update(verificationStatus="BLOCKED", reason=str(error))
        return source, None
    totals = Counter()
    families = Counter()
    for line in inventory["lines"]:
        totals["lineRecords"] += 1
        totals[line["status"]] += 1
        if line["status"] == "OUT_OF_SCOPE":
            continue
        for pattern in line["patterns"]:
            families[pattern["family"]] += 1
            totals["blockedDirections"] += 1
    print(f"{source_id}: {len(inventory['lines'])} rail line records", flush=True)
    return source, (totals, families)


def run(args):
    catalog = args.cache / "fr-pan.json"
    sources = sorted(catalog_sources(json_read(catalog)),
                     key=lambda s: (PRIORITY.get(s["resourceId"], 2), s["resourceId"]))
    source_dir = args.root / "data/fr/source"
    reports = args.root / "reports/fr"
    totals = Counter()
    families = Counter()
    region_sources = defaultdict(set)
    tasks = [(source, args.cache, source_dir, args.as_of) for source in sources]
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        results = list(executor.map(inventory_source, tasks))
    sources = [source for source, _ in results]
    for source, counts in results:
        source_id = source["resourceId"]
        if counts is None:
            continue
        for area in source["coveredArea"]:
            code = area.get("insee")
            if area.get("type") == "departement":
                code = TERRITORY.get(code)
            elif area.get("type") != "region":
                continue
            if code:
                region_sources[code].add(source_id)
        totals["feedsScanned"] += 1
        totals["feedStationGroups"] += source["stationGroups"]
        totals.update(counts[0])
        families.update(counts[1])
    infrastructure_sources = []
    for filename, slug, tracks in (
        ("fr-rfn.geojson", "formes-des-lignes-du-rfn", False),
        ("fr-rfn-tracks.geojson", "fichier-de-formes-des-voies-du-reseau-ferre-national", True),
    ):
        path = args.cache / filename
        base = "https://ressources.data.sncf.com"
        entry = {"datasetId": slug, "datasetUrl": f"{base}/explore/dataset/{slug}/",
                 "downloadUrl": f"{base}/api/explore/v2.1/catalog/datasets/{slug}/exports/geojson",
                 "publisher": "SNCF Réseau", "license": "odc-odbl",
                 "publishedAt": "2026-08-12" if tracks else "2026-02-19", "validFrom": None,
                 "validTo": None, "verificationStatus": "MISSING"}
        if path.exists():
            payload = infrastructure(path, tracks)
            json_write(source_dir / f"{slug}.json", payload)
            entry.update({k: v for k, v in payload.items() if k != "records"})
            entry["verificationStatus"] = "INFRASTRUCTURE_INVENTORIED"
        infrastructure_sources.append(entry)
    json_write(source_dir / "manifest.json", {
        "schemaVersion": 1, "asOf": args.as_of.isoformat(),
        "catalogUrl": "https://transport.data.gouv.fr/api/datasets", "catalogSha256": sha_file(catalog),
        "scheduleSources": sources, "infrastructureSources": infrastructure_sources,
    }, pretty=True)
    json_write(reports / "inventory.json", {
        "asOf": args.as_of.isoformat(), "baselineRef": args.baseline,
        "denominator": "Source-scoped GTFS rail line records and distinct ordered passenger-call patterns, including overlaps across feeds",
        "scheduleTotals": dict(totals), "patternsByFamily": dict(families),
        "mainlandRegions": [{"code": key, "name": name, "regionalFeedIds": sorted(region_sources[key])}
                            for key, name in REGIONS.items()],
        "overseas": [s["resourceId"] for s in sources if s["overseas"]],
        "nationalCoveragePercent": None, "verifiedPlayableDirections": 0,
        "releaseBlockers": ["cross-feed service identity", "physical track path per direction",
                            "reviewed Korean station and service names", "gameplay and production tests"],
    }, pretty=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, required=True, help="Pinned PAN, GTFS and RFN downloads")
    parser.add_argument("--as-of", type=date.fromisoformat, required=True)
    parser.add_argument("--baseline", required=True, help="Git commit audited for existing France data")
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--root", type=Path, default=ROOT)
    run(parser.parse_args())
