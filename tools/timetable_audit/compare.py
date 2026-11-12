"""Explicit route bindings and conservative station matching."""

import math
import re
import unicodedata
from collections import Counter, defaultdict

TH_URBAN = {
    "th-bts-sukhumvit": "1", "th-bts-silom": "2", "th-bem-blue": "3",
    "th-bem-purple": "4", "th-aera1-arl": "5", "th-bts-gold": "2025",
    "th-srtet-darkred": "2026", "th-srtet-lightred": "2027",
    "th-ebm-yellow": "2224", "th-nbm-pink": "2436",
}
HK_TRAM = {
    "western-market-shau-kei-wan": "4001", "happy-valley-shau-kei-wan": "4002",
    "kennedy-town-happy-valley": "4003", "shek-tong-tsui-causeway-bay": "4004",
    "shek-tong-tsui-north-point": "4005", "kennedy-town-shau-kei-wan": "4007",
}
JP_TOYAMA = {
    "1": {"3001"}, "2": {"3002", "3008"}, "3": {"3003"},
    "4": {"3004"}, "5": {"3005"}, "6": {"3006"},
}


def binding(route, feeds):
    identifier = route["route_id"]
    if identifier.startswith("line-toyama-city-"):
        codes = JP_TOYAMA.get(identifier.rsplit("-", 1)[-1], set())
        source = "jp-toyama"
        ids = [key for key in feeds.get(source, {}).get("routes", {})
               if re.search(r"\((\d+)-\d+\)$", key) and re.search(r"\((\d+)-\d+\)$", key)[1] in codes]
        return source, ids
    if identifier.startswith("hk-peak-tram-"):
        return "hk-td", ["5001"]
    for prefix, key in HK_TRAM.items():
        if identifier.startswith("hk-tram-" + prefix):
            return "hk-td", [key]
    if identifier in TH_URBAN:
        return "th-otp", [TH_URBAN[identifier]]
    if identifier.startswith("th-srt-") and "th-otp" in feeds:
        train_numbers = {p["id"].removeprefix("th-srt-train-") for p in route["runtime_patterns"]
                         if p["id"].startswith("th-srt-train-")}
        return "th-otp", [key for key, r in feeds["th-otp"]["routes"].items()
                          if r["agency_id"] == "SRT" and r.get("route_short_name") in train_numbers]
    return "", []


def normalize(value):
    return "".join(char for char in unicodedata.normalize("NFKC", str(value)).casefold()
                   if char.isalnum() or unicodedata.category(char).startswith("M"))


def distance_m(source, lat, lon):
    if lat is None or lon is None:
        return math.inf
    try:
        latitude, longitude = float(source["stop_lat"]), float(source["stop_lon"])
    except (KeyError, ValueError):
        return math.inf
    return 111195 * math.hypot(latitude - lat, (longitude - lon) * math.cos(math.radians(lat)))


def match_stop(source, station_records, country, allow_geo=False):
    name = source["stop_name"]
    options = {normalize(part) for part in re.split(r"[;|]", name)}
    options |= {normalize(re.sub(r"^(BTS|MRT|SRT|ARL)\s+", "", part, flags=re.I))
                for part in re.split(r"[;|]", name)}
    if country == "JP":
        options |= {normalize(re.sub(r"駅(?:前)?$", "", name))}
    source_codes = {source.get("stop_id", ""), source.get("stop_code", "")} - {""}
    coded, named, nearby = set(), [], []
    for identifier, names, lat, lon in station_records:
        distance = distance_m(source, lat, lon)
        if identifier in source_codes or distance <= 350 and source_codes.intersection(names):
            coded.add(identifier)
        if distance <= 350 and options.intersection(map(normalize, names)):
            named.append((distance, identifier))
        if distance <= 65:
            nearby.append((distance, identifier))
    if coded:
        return next(iter(coded)) if len(coded) == 1 else None
    candidates = sorted(named or (nearby if allow_geo else []))
    if not candidates or (len(candidates) > 1 and candidates[1][0] - candidates[0][0] < 12):
        return None
    return candidates[0][1]


def index_feed(feed):
    groups = defaultdict(dict)
    for trip in feed["trips"]:
        cal = feed["calendars"][trip["service_id"]]
        if not cal["active_dates"]:
            continue
        key = (trip["direction"], tuple(trip["stops"]), trip["headsign"])
        bucket = groups[trip["official_route_id"]]
        if key not in bucket:
            bucket[key] = {"trip": trip, "calendars": set(), "records": 0}
        bucket[key]["calendars"].add(trip["service_id"])
        bucket[key]["records"] += 1
    return groups


def compare(route, feed, groups, official_ids):
    registered = {tuple(pattern["stops"]) for pattern in route["runtime_patterns"]}
    if route["country"] == "JP" and route["directions"] == "forward|reverse":
        registered |= {sequence[::-1] for sequence in registered}
    if not registered and route["sequence"]:
        registered.add(tuple(route["sequence"]))
    matched, missing, uncertain = set(), [], []
    calls = Counter()
    memo = {}
    for official_id in official_ids:
        for entry in groups.get(official_id, {}).values():
            trip = entry["trip"]
            # These directional HK records share an official bidirectional ID.
            # Leave the opposite full-length direction to its peer.
            stops = trip["stops"]
            if route["country"] == "HK" and route["sequence"]:
                start, end = (feed["stops"][stops[i]] for i in (0, -1))
                reverse_first = match_stop(start, route["station_records"], "HK", True)
                reverse_last = match_stop(end, route["station_records"], "HK", True)
                if (reverse_first, reverse_last) == tuple(route["sequence"][i] for i in (-1, 0)):
                    continue
            mapped = []
            for stop in stops:
                if stop not in memo:
                    memo[stop] = match_stop(feed["stops"][stop], route["station_records"], route["country"], route["country"] == "HK")
                mapped.append(memo[stop])
            calls["source_patterns"] += 1
            calls["trip_records"] += entry["records"]
            sample = {"official_route_id": official_id, "direction": trip["direction"], "headsign": trip["headsign"],
                      "calendar_ids": sorted(entry["calendars"]), "trip_records": entry["records"]}
            if None in mapped:
                uncertain.append({**sample, "unresolved_stop_ids": [stop for stop, target in zip(stops, mapped) if target is None]})
            elif tuple(mapped) in registered:
                matched.add(tuple(mapped))
            else:
                missing.append({**sample, "mapped_stops": mapped})
    return {"source_patterns": calls["source_patterns"], "trip_records": calls["trip_records"],
            "matched": len(matched), "baseline_patterns": len(registered),
            "unmatched_baseline": len(registered - matched), "missing_candidates": missing, "ambiguous": uncertain}
