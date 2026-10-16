# Korea railway rebuild — INCOMPLETE

Cutoff: 2026-10-15. This directory is a replacement pipeline, not the live
catalog. No candidate is marked playable. The old catalog remains in service
until the national release gate succeeds and the work branch is merged.

## Sources and regeneration

`source/osm-*.json` is extracted from the nationwide Geofabrik South Korea
snapshot recorded in `source/osm-manifest.json`. © OpenStreetMap contributors,
ODbL 1.0: https://www.openstreetmap.org/copyright . The manifest contains the
original PBF SHA-256. Source node IDs, way IDs, versions, and coordinates are
retained without smoothing or interpolation.

`source/timetables/` contains the 13 Korail workbooks recorded in `sources.json`.
They are reference evidence; their reuse licenses and calendar applicability
remain pending, so they do not authorize release. The importer records exact
sheet/cell references and unrecognized layouts. Operational abbreviations are
not silently treated as official passenger station names.

Run in order:

1. `python tools/extract-kr-osm.py` with the arguments documented in that file
   (requires pyosmium; the PBF is intentionally outside Git).
2. `npm run import:korea`
3. `python tools/import-korail-timetables.py INPUT_DIRECTORY BOARD_JSON data/kr/v2/source/timetables`
4. `node tools/match-kr-timetables.js`
5. `npm run validate:korea` and `npm run test:korea`
6. `npm run build:korea` for isolated candidate output.
7. `npm run audit:korea` for the mandatory nationwide gate.
8. Only after COMPLETE: `npm run release:korea`, full application tests/build,
   merge and Pages deployment verification.

`official-overrides.json` contains reviewed metadata overlays and survives
imports. Never edit generated entity metadata as the only source of a change.
`trips`, `reviews`, `assets`, and `coverage` are separately maintained evidence.
The compiler rejects candidate trips, missing official station/platform data,
unresolved import topology, stale evidence, non-public tracks, missing source
coordinates, direction review, and unverified official length.

## Explicit model boundaries

Infrastructure refers to source track geometry; passenger lines group explicit
directional services; trips carry calendar evidence and actual stopping calls.
Stations represent places, stops represent individual source nodes/platforms.
Only unambiguous OSM stop-area membership is merged. Transfer groups remain
relationships, not automatic station merges. Neither a reverse train nor an
all-stops train is manufactured. Express geometry retains intermediate tracks.

`timetable-matches.json` is a review queue only. Even exact text matches and
partial ordered path matches require official identity and track confirmation.
`legacy-provenance-audit.json` classifies the old 404 errors; it does not claim
they were repaired by adding provenance labels.

Synthetic tests exercise the actual resolver and Game finish behavior in both
explicit fixture directions. They are not nationwide completion tests.

## Official urban reference tables

`tools/import-kric-reference.py INPUT_DIRECTORY data/kr/v2` imports KRIC's
all-agency line (dataset 18), station (32), and operation (900) XLSX tables.
The downloaded filenames identify a 2026-06-30 collection; individual rows have
different reference dates, including older years. Those dates must not be
substituted for timetable validity or current operational status.

The import retains 47 line rows, 1,099 station rows and 223,425 operation rows
grouped into 29,727 train candidates. These are source rows and candidates,
not a national completeness claim. The urban inventory excludes the required
national high-speed/intercity/tourism audit. `official-station-reference.json`
retains official Korean/English names, codes, coordinates, operator labels and
source row numbers; it excludes Hanja from runtime names.

`node tools/match-kr-stations.js` produces a review queue using exact names and
positions within 500 metres. It does not approve or merge stations. Multiple
matches remain ambiguous, and a station centroid never replaces track geometry.
