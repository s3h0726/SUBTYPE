"""Audit only actual timetable targets; preserve Korean road buses unchanged.

The six-country inventory is retained for baseline integrity. This filter applies
only to timetable audit rows, candidate merges, and verification denominators.
"""

import re


def in_audit_scope(route):
    if str(route.get("country", "")).upper() != "KR":
        return True
    identifier = str(route.get("route_id", "")).lower()
    mode = str(route.get("mode", "")).lower()
    return not (
        identifier.startswith("kr-bus-")
        or re.search(r"(^|[^a-z])bus([^a-z]|$)", mode)
        or "버스" in mode
    )
