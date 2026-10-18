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

Browser reports record the input hashes and reject input changes during a run.
Motion is disabled for batch traversal; the interactive scenarios separately
exercise real curves, delayed map readiness, pause/resume and multi-line TAB.
Synthetic IME events do not certify physical device input. The Japanese resolver
regression covers 85 journeys. The common validation and single-source checks
pass; the earlier 58 failures are historical, not current ignored failures.
The production build remains blocked by the nationwide gate. CI runs the
candidate browser job before the national release job and retains its report.

`node tools/match-kr-stations.js` produces a review queue using exact names and
positions within 500 metres. It does not approve or merge stations. Multiple
matches remain ambiguous, and a station centroid never replaces track geometry.

## 62-relation repair, 2026-10-17

`relation62-baseline.json` freezes the 62 outstanding source failures at commit
7b15c9ee. `relation-access-policy.json` retains every requested ID and number.
Run `npm run audit:korea-relations62` for per-relation JSON, CSV and Markdown
under `generated/`; a completed source metadata audit does not imply PASS.

`source/osm-62-20261017/` preserves all 62 relations, their 5,157 directly
referenced ways and 405 directly referenced nodes, including roads, buildings,
platforms and construction. Its replication timestamp is 2026-10-16T20:21:21Z.
The live OSM API returned HTTP 429, so these are country-extract snapshots,
not live API full-relation responses or recursive relation closure. Recreate
with `tools/extract-kr-62-snapshot.py PBF IDS_JSON OUTPUT_DIR` (pyosmium).
The original nationwide geometry and relation snapshots remain unchanged.
The newer version of relation 12239797 is research evidence, not silently
substituted into the older importer snapshot.

Six road/unopened/nonpassenger records are excluded. Three unidentified records
and two restricted airport shuttles remain quarantined for research. All eleven
are blocked in route loading, PLAY, saved CUSTOM segments, the CUSTOM graph and
free drive. The airport operator confirms that returning to the terminal after
boarding the departure shuttle is restricted; unrestricted reverse service is
not generated. Rail/road co-tagged ways retain their original tags and block
release pending review. Source research geometry is never renamed as public rail.

Five of those 62 source candidates now assemble: Busan 1 (8255697), Bulamsan to
Geumjeong (16665960), Nowon to Sadang (16665969), Seoul to Kwangwoon University
(16712693), and Seoul to Dongmyo (16712696). Busan preserves all source ways and
binds six station facilities to explicit existing stop-position nodes, checked
against the operator's forty-station code/name order. Its yard way lies before
the boarding interval and is not travelled; the stricter release review remains.
The four capital-area reconstructions retain every original source way/stop and
use complete actual official train calls on existing directional donor tracks.
No new geometry, coordinate snapping or inferred reverse edge is introduced.

Twelve explicit line 1 and five southern line 4 display-name/code crosswalks link pinned KRIC
identity records to current timetable station codes. Coordinates check these
already specified identities; they never select a track or merge station places.
The original sixteen line 4 name reviews remain. The thirty-eight timetable
bindings preserve complete clocks and all DAY/SAT/END groups for 2,271 uniquely
calendar-qualified train records. Only Seoul to Kwangwoon of the five recovered
candidates has all three day groups. Others retain incomplete calendar review.
Holiday exceptions, station/platform metadata, operating direction and release
approval remain separate requirements. There are zero release-approved services.

Source assembly totals are 260 of 317, with 57 still failing (including the eleven
excluded/quarantined records). Against the older 69-failure baseline, twelve have
recovered. The sixty Korean tests and separate Japanese regression are required;
none of these counts certify nationwide completeness. Main integration was explicitly
requested by the user; national publication remains gated.

CI also runs `tools/test-kr-browser.cjs --services=8255697,16665960,16665969,16712693,16712696 --interactive-all`.
This separately samples actual first-segment motion for each recovered service
on desktop and mobile, retains screenshots and tests stale-animation cancellation.
It complements full stop traversal; it is not an official operating-direction,
platform or complete per-segment animation certification.

## Follow-up evidence, 2026-10-18

`npm run import:korea-platforms` imports the authority's 96 published line 4
platform records, preserving the raw CP949 CSV and hash. These are reference
facts; they do not bind track coordinates or certify terminal turnback operation.
The Oido DOWN candidate uses source platform 1, labelled UP by the authority.
No track tags, platform assignments or release rules are changed to hide this.
`npm run audit:korea-failures` lists every remaining source failure with IDs,
way IDs, coordinates, access categories and the evidence still needed.

Main retained package commands referencing helpers removed in the earlier Korea
reset. They now call their supported v2 import/recovery planning counterparts;
legacy published-route checks call the existing provenance and geometry gates.
No test file is removed. `audit:korea` retains the strict nationwide completeness
requirement. OSM recovery imports only pinned local sources; it is not an
unreviewed live-network repair.
