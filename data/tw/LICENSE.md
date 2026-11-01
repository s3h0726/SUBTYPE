# Taiwan railway data and operator marks

The factual snapshots in `source/` include Taiwan MOTC TDX / operator open data and OpenStreetMap-derived railway data. They are not relicensed as upstream software. The intermediate distributor explicitly excludes third-party datasets from its software license. No upstream application code or music is included here.

- © OpenStreetMap contributors. OSM-derived data is subject to the [Open Database License 1.0](https://www.openstreetmap.org/copyright). Preserve attribution and applicable database share-alike obligations when distributing adapted databases.
- Taiwan government open data is subject to the [Taiwan Open Government Data License 1.0](https://data.gov.tw/license), with the original dataset/operator conditions retained. This notice does not claim that every third-party source is government-owned.
- Original source notes remain in the snapshots. `source/manifest.json` records retrieval URL, content hash and available pinned Git blob provenance. Geometry provenance is retained per generated line. Consult those records for the component used.
- `assets/operators/tw-*` are official operator marks used for identification, not newly created artwork. Copyright and trademarks remain with the operators. `branding.json` records each official source and asset hash. Their presence does not grant a blanket reuse license or imply endorsement.
- Korean readings in `korean-names.txt` were manually curated for this implementation and are marked as awaiting linguistic review.

See [implementation report](../../docs/taiwan-railway.md) for scope, limitations, source processing, and QA status. Live accuracy or official approval is not implied by the provenance records.
