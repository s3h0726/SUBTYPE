# Hong Kong railway workspace

Status: **INCOMPLETE**, checked 2026-10-18. Only services accepted by `hongKongRouteBlockReason` appear in PLAY. Registered inventory and traceable OSM geometry are not claims of full operational coverage.

- `master/config.json`: editable region, operators, Korean spelling decisions, baseline services and transfer review queue.
- `sources/`: pinned official CSV/HTML and OSM network snapshots; `manifest.json` records URLs, hashes, dates and retrieval failures. The individual relation download cache is ignored because `osm-network.json` contains the combined source.
- `master/network.json`: compiled, inspectable normalized registry, generated from config and pinned sources. Edit the inputs and rebuild.
- `generated/index.json`: small service/search index; detailed stop lists and track geometry load only on selection.
- `generated/routes/`: compiler-owned per-service outputs.

```sh
node tools/fetch-hk-sources.mjs
node tools/fetch-hk-osm.mjs --direct
node tools/build-hk-data.cjs
node tools/build-app-bundle.js
node --test tools/test-hk-network.cjs
node tools/audit-hk-data.cjs
node tools/audit-hk-data.cjs --require-complete
```

The final command intentionally exits nonzero until national scope, all source checks, all 180 requirements and UI acceptance are complete. Source retrieval and offline compilation are separate. A failed source request is INCOMPLETE; do not invent a substitute.

MTR CSV directions are separate service identities. UT/DT have independently sourced tracks. The CSV identifies TKL LOHAS Park shuttle patterns; it does not by itself authorize an additional full-day through service. Racecourse special patterns need additional timetable evidence. Light Rail target 12 is a baseline, not an exhaustive current inventory: the official page also mentions 506P, 507P, 720 and 610P. Tram major services share one physical-line identity. Directional tram stops are distinct records; registry record count is not a verified physical-station total.

OSM extraction retains source nodes/way IDs, rejects disused/razed ways, requires shared way endpoints and monotonic stop binding, and never bridges disconnected ways. Source stops may bind to an existing source vertex within 80 m; this is recorded in the candidate. Long edges remain original OSM vertices, not station-to-station substitutes. Reviewed Korean spellings and an official stop pattern are separate release requirements.

MTR station codes in the open-data CSV are stored as official source identifiers, not invented public platform numbers. Korean names without a reviewed source remain pending. Historical tourism material can support spelling, not current operation. Operator logos and official colours remain unaudited: the UI uses text identities and explicitly non-official learning layouts. No imitation logos are shipped.

OSM derived data: © OpenStreetMap contributors, ODbL 1.0, <https://www.openstreetmap.org/copyright>. Other source rights remain recorded as REVIEW_REQUIRED; the source-code MIT licence does not relicense operator branding or source documents.

Do not merge, auto-merge, release or change production Pages configuration. All implementation commits belong to `feature/hong-kong-railway`.
