# United Kingdom railway data contract

The UK catalogue is part of the existing SUBTYPE application. It does not replace any other country's data. Country ID: `uk`.

## Identities and loading

- An operator is an operating organisation. First Rail London, GTS Rail Operations and KeolisAmey Docklands are separate from the Overground, Elizabeth line and DLR network brands. Operator evidence and effective dates are in `data/uk/operator-evidence.json`.
- A catalogue route is a physical passenger line or metro/tram route. Its `patterns` contain independently verified ordered passenger calls. `familyId` groups matching opposite stopping sequences; a direction remains an explicit selectable service ID.
- `stationCatalog` contains the line's complete released station inventory. A resolved playable route's `stations` contain only the selected direction's ordered calls, including repeated visits where necessary.
- `stationMasterId` is the stable naming identity. TfL `physicalStationId`/hub references supply explicit interchange relationships, instead of merging stations by similar names or geographic grid cells.
- Only the small index loads on country selection. The selected line loads on demand. One cached geometry promise serves every line. Patterns refer to shared OSM node paths; they do not copy the entire infrastructure into the index.
- The existing production renderer is Leaflet. This expansion preserves that renderer rather than introducing a separate MapLibre application. Track geometry is resolved before entering the existing typing/movement engine.

## Sources and licences

London calls and station coordinates come from the [TfL Unified API](https://api.tfl.gov.uk/), requested with `serviceTypes=Regular`. Powered by TfL Open Data. Use is subject to the [Transport Data Service terms](https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service). Static route descriptions do not represent live disruptions or an exhaustive daily timetable.

Every released geometry coordinate and every consecutive track edge is traceable to the downloaded [OpenStreetMap](https://www.openstreetmap.org/copyright) node/way data. © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The UK OSM-derived database remains available under ODbL, independently of the repository's application-code licence. Compressed source snapshots and their original SHA-256 checksums are in `data/uk/source/manifest.json`. Source archives remain in Git and are excluded from the Pages runtime.

The initial source investigation also inspected TubeCreature, but its geometry is **not included** in the released dataset. Released paths are derived directly from the OSM API.

Regional release evidence is explicitly enumerated in `data/uk/source/regional/release-evidence.json`. OSM supplies ordered calls and track nodes. Operator/authority maps cross-check the reviewed services. Regional evidence is not labelled as a TfL-verified sequence.

Korean names are an explicit, editable editorial dictionary. They are not represented as official operator translations or as verified Namuwiki readings. English source names remain intact. Shared station IDs and interchange naming groups propagate saved overrides across affected UK lines. Distinct named stations in a common complex, such as Bank and Monument, retain their distinct names.

## Rebuild and validation

```sh
npm run build:uk
npm run test:uk
node tools/test-uk-leaderboard.cjs
npm run build:app
npm run test:uk:browser
```

For a nonstandard Playwright installation, set `PLAYWRIGHT_MODULE` to its module directory. Set `CHROME_PATH` to Chrome on non-Windows systems. The UK workflow installs a pinned Playwright version and runs all services through real browser typing input, with synthetic Hangul composition events. This is automated IME coverage, not a physical Korean keyboard test.

The builder rejects missing coordinates, unknown Korean dictionary entries, disconnected OSM ways, unprojectable official calls and unsupported services. The graph can join shared OSM nodes from several route relations; it cannot bridge nearby disconnected tracks. `generated/validation.json` records rejected source relations and each unresolved current TfL pattern. Source-only regional relations do not become playable automatically.

`tools/test-uk-rail.cjs` independently checks every rendered coordinate and edge against the original OSM data, passes every released direction through the existing route-integrity engine, and checks naming overrides and service identities. `tools/test-uk-track-graph.cjs` also checks that disconnected and reverse-direction paths are rejected.

The existing Korean name editing table is `reports/korean-names/editor.html?country=uk`. It edits the existing `data/editor-overrides.json` format. The UK runtime reads that file directly, so UK names do not depend on rebuilding Japanese workspaces.

## Leaderboard

UK guest-history entries and active-line ranking filters retain country ID `uk`. The production database migration `allow_uk_ranking_country` extends the existing ranking constraint and INSERT policy to `uk`, preserving ownership, score bounds, RLS and the prohibition on anonymous inserts. Schema/policy verification passed; no fabricated score was inserted into the production leaderboard. Authenticated score upload was not tested with a real user session.
