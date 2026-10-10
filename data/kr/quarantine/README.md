# Korean imported snapshot quarantine

The provisional Korean dataset present at commit `29cfff8` is preserved by the
`backup/pre-korea-rebuild-20261010` branch and Git history.

The snapshot is not an authoritative production source. Its repository does
not publish a reusable data license, its line/station order has not been
matched to official operating patterns, and its geometry candidates do not
record an inspected OSM relation or way lineage for every segment.

Candidate geometry remains in the generated route payloads only for manual
comparison. It is marked `quarantined`, must never be consumed by the runtime,
and cannot become `ready` without passing `tools/test-kr-geometry-gating.js`.

Quarantined candidate routes as of 2026-10-10:

- `kr-metro-19` (Seoul Sillim Line)
- `kr-metro-21` (Gimpo Goldline)
- `kr-metro-22` (Yongin EverLine)
- `kr-metro-23` (Uijeongbu LRT)
