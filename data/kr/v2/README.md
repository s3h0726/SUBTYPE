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

## Source repairs on 2026-10-17

`topology-corrections.json` repairs conflicting direction roles in 24 source
relations (416 member roles). These are topology corrections, not official
operational-direction reviews. Every relation retains all original ways in
their original order, and all source stop nodes in their original order.
The importer checks the relation SHA-256, way version, old role, unique exact
node traversal and one-way tags before applying a correction. A changed source
fails closed. Two otherwise connected candidates were left unresolved because
they contradict source one-way tags. The release compiler independently blocks
one-way conflicts even if a review is marked verified.

After reimport, disconnected member boundaries are 403 (previously 862),
disconnected ordered relations 33 (57), and unmatched stop nodes 148 (230).
The original snapshot files and all geometry coordinates remain unchanged.
There are still 317 unapproved service candidates and no released services.

KRIC's operation table mixes scalar calls with indexed station/time lists in
individual cells. `tools/lib/kric-calls.js` expands those lists when matching,
joining times by source code rather than by column position. It preserves
descending/alphanumeric codes, repeated visits, row numbers, reference dates,
missing times and literal zero-time placeholders. Malformed lists and headway
prose remain explicit unparsed trips; no missing station or time is invented.
Archived KRIC cells remain unchanged. The corrected match queue has 34 exact
patterns covering 16 source services, and 81 patterns with partial paths.
These matches do not validate calendars, current operation, licenses or tracks.

`node tools/test-kr-browser.cjs` exercises four repaired candidates with the
actual game, IME events, map renderer, result transition and records at desktop
and mobile viewport sizes. `--all-assemblable` tests all structurally assemblable
candidates and lists the excluded topology failures. The test injects a hook
only into its local HTTP response; it never edits the deployed catalogue or
changes candidate release status. Install Playwright and its Chromium browser
in the test environment first, or set `PLAYWRIGHT_MODULE` to an existing package.
Optional `KR_BROWSER_REPORT` and `KR_BROWSER_SCREENSHOTS` select output paths.
Browser traversal success is distinct from official geometry, timetable,
physical transfer and national release approval.

The local 2026-10-17 run completed 248 candidate traversals on desktop and 248
on mobile, with zero traversal failures and 69 candidates excluded for unresolved
topology. Motion was disabled for batch traversal; these are synthetic IME
composition events, not physical-device IME or animation-timing certification.
The Korean test suite has 33 passing tests. The separate Japanese resolver
regression covers 85 journeys. The common single-source check still has the
same 58 failures reproduced with the starting commit's application files in
this Windows checkout; none were deleted or suppressed. The production build
remains blocked by the nationwide gate. CI now runs the candidate browser job
before the national release job, and retains its report as an artifact.

`node tools/match-kr-stations.js` produces a review queue using exact names and
positions within 500 metres. It does not approve or merge stations. Multiple
matches remain ambiguous, and a station centroid never replaces track geometry.
