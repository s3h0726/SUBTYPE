# SUBTYPE Europe staging

Europe is opt-in by country, with one lazy index and one independently editable Korean naming table per country. A country with zero released routes is intentionally **not** represented as playable.

## Publication gates
1. Timetable must be active for a requested service date, with a known route / stop order.
2. Each public stop, line and operator must have a reviewed Korean name, native name, stable source ID, provenance and license.
3. Every published service pattern must have official GTFS shape geometry or independently validated track-geometry evidence. No interpolated straight-line tracks.
4. Source URL, version date, snapshot date, licence and attribution must be preserved per route.
5. Import must be deterministic and pass the Europe route audit before changing a generated index.
6. Reversed runs are service patterns, not physical railway lines. Cross-border services may reference stations from multiple country namespaces.

## Current coverage
The 12 country selectors and empty lazy indexes are infrastructure only; **zero European routes are published** at this stage. National coverage has not been claimed. Candidate source portals are documented in `source-catalog.json`.
