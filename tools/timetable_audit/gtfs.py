"""Read GTFS Schedule without extracting archives or redistributing trip data."""

import csv
import io
import re
from collections import defaultdict
from datetime import date, timedelta
from zipfile import ZipFile

DAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def rows(archive, table, required=True):
    members = [name for name in archive.namelist() if name.rsplit("/", 1)[-1] == table + ".txt"]
    if not members and not required:
        return
    if len(members) != 1:
        raise ValueError(f"{table}: expected exactly one table, found {len(members)}")
    with archive.open(members[0]) as raw:
        yield from csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig", newline=""))


def by_id(records, key):
    result = {}
    for record in records:
        value = record[key]
        if value in result:
            raise ValueError(f"duplicate {key}: {value}")
        result[value] = record
    return result


def seconds(value):
    if not value:
        return None
    if not re.fullmatch(r"\d{1,3}:[0-5]\d:[0-5]\d", value):
        raise ValueError(f"invalid GTFS time {value!r}")
    hours, minutes, seconds = map(int, value.split(":"))
    return hours * 3600 + minutes * 60 + seconds


def calendar_windows(archive, first, last):
    regular = by_id(rows(archive, "calendar", False), "service_id")
    exceptions = defaultdict(dict)
    for row in rows(archive, "calendar_dates", False):
        service, day = row["service_id"], date.fromisoformat(row["date"])
        kind = row["exception_type"]
        if kind not in {"1", "2"} or day in exceptions[service]:
            raise ValueError(f"invalid calendar exception: {service}, {day}, {kind}")
        exceptions[service][day] = kind
    for service in sorted(regular.keys() | exceptions.keys()):
        record = regular.get(service)
        changes = exceptions[service]
        start = date.fromisoformat(record["start_date"]) if record else None
        end = date.fromisoformat(record["end_date"]) if record else None
        active = []
        for offset in range((last - first).days + 1):
            day = first + timedelta(days=offset)
            scheduled = bool(record and start <= day <= end and record[DAYS[day.weekday()]] == "1")
            if changes.get(day) == "1" or (scheduled and day not in changes):
                active.append(day.isoformat())
        yield service, {
            "from": start.isoformat() if start else min(changes).isoformat(),
            "to": end.isoformat() if end else max(changes).isoformat(),
            "weekdays": [name for name in DAYS if record and record[name] == "1"],
            "exceptions": {day.isoformat(): kind for day, kind in changes.items()},
            "active_dates": active,
        }


def read_feed(path, first, last, keep_route):
    """Keep every selected trip and preserve stop times as service-day offsets."""
    with ZipFile(path) as archive:
        all_routes = by_id(rows(archive, "routes"), "route_id")
        selected = {key: value for key, value in all_routes.items() if keep_route(value)}
        agency_ids = {route["agency_id"] for route in selected.values()}
        agencies = by_id((row for row in rows(archive, "agency") if row["agency_id"] in agency_ids), "agency_id")
        calendars = dict(calendar_windows(archive, first, last))
        stops = by_id(rows(archive, "stops"), "stop_id")
        selected_trips = by_id((r for r in rows(archive, "trips") if r["route_id"] in selected), "trip_id")
        trip_calls = defaultdict(list)
        invalid_trips = {}
        for call in rows(archive, "stop_times"):
            trip = call["trip_id"]
            if trip not in selected_trips:
                continue
            try:
                trip_calls[trip].append({
                    "stop": call["stop_id"], "sequence": int(call["stop_sequence"]),
                    "arrival": seconds(call["arrival_time"]), "departure": seconds(call["departure_time"]),
                    "pickup": call.get("pickup_type") or "0", "drop_off": call.get("drop_off_type") or "0",
                })
            except (KeyError, ValueError) as error:
                invalid_trips[trip] = str(error)
        frequencies = defaultdict(list)
        for row in rows(archive, "frequencies", False):
            trip = row["trip_id"]
            if trip in selected_trips:
                frequencies[trip].append({
                    "start": seconds(row["start_time"]), "end": seconds(row["end_time"]),
                    "headway_seconds": int(row["headway_secs"]), "exact": row.get("exact_times") == "1",
                })
        normalized, issues = [], []
        for trip, metadata in selected_trips.items():
            route_id = metadata["route_id"]
            calendar_id = metadata["service_id"]
            calls = sorted(trip_calls[trip], key=lambda call: call["sequence"])
            passenger = [call["stop"] for call in calls if (call["pickup"], call["drop_off"]) != ("1", "1")]
            error = invalid_trips.get(trip)
            if not error and (calendar_id not in calendars or len(passenger) < 2
                              or len({call["sequence"] for call in calls}) != len(calls)
                              or any(call["stop"] not in stops for call in calls)):
                error = "unresolved calendar, fewer than two calls, or invalid stop sequence/identity"
            if error:
                issues.append({"route_id": route_id, "trip_id": trip, "reason": error})
                continue
            normalized.append({
                "trip_id": trip, "official_route_id": route_id, "agency": selected[route_id]["agency_id"],
                "service_id": calendar_id, "direction": metadata.get("direction_id", ""),
                "headsign": metadata.get("trip_headsign", ""),
                "mode": selected[route_id].get("route_type", ""),
                "service_class": metadata.get("service_class", ""),
                "train_number": metadata.get("trip_short_name", ""),
                "origin": passenger[0], "destination": passenger[-1], "stops": passenger,
                "calls": calls, "frequencies": frequencies[trip],
            })
        return {"agencies": agencies, "routes": selected, "stops": stops, "calendars": calendars,
                "trips": normalized, "issues": issues, "total_routes": len(all_routes)}
