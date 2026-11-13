# France railway expansion

The baseline is SUBTYPE `main` at `520e00ec0f00e114005b7a616dff16f049a7b148`. It contained no France country or route catalog. The evidence snapshot uses 2026-11-12.

## Playable batch

France has 39 selectable routes, 91 directions, and 610 Korean-localized station IDs. The catalog includes eight domestic TGV INOUI corridors, two cross-border TGV INOUI corridors, the Bordeaux–Marseille daytime Intercités, and the regular full-length services of all Paris, Lyon, Rennes, Toulouse, Lille and Marseille Métro lines. Paris lines 7 and 13 include both branches. The two Métro 7 bis directions preserve their distinct stops on the terminal loop. A temporary works closure through 13 November was published for 7 bis. The schedule evidence covers its operating dates after that closure. [RATP service notice](https://www.ratp.fr/infos-trafic/metro/7B)

- TGV INOUI includes Paris Nord–Valenciennes, Paris Nord–Dunkerque, Paris Nord–Rang-du-Fliers, Paris Lyon–Besançon, Paris Lyon–Mulhouse, Paris Lyon–Perpignan, Strasbourg–Bordeaux, Strasbourg–Quimper, Strasbourg–Brussels and Nantes–Brussels.
- France route cards, destination and service selection, station lists, station signs, gameplay answers and free drive use Korean as the primary language. French names remain in the underlying records and secondary displays. The existing Korean-name editor can edit every playable France station. Rare station names use an editorial Korean rendering and can be corrected through the editor.
- See the [browser results](../reports/fr/browser-gameplay.json) for completed desktop, 390 px mobile, and directed free-drive checks. The country-switch test exercised all six existing countries and France in the redesigned directory. Free drive also passed a Métro-to-TGV transfer at Gare de Lyon. The editor test verified that the France station list opens and exposes its Korean names.
- Geometry uses ordered OpenStreetMap way and node IDs, tied to the official timetable by ordered station identity and a geographic check. Shared ways are stored once in geographic tiles. Route detail and relevant tiles are fetched on demand. The Paris Gare de Lyon metro and main-line stations share a transfer group. [RATP station information](https://www.ratp.fr/en/vos-lignes/vos-stations/gare-de-lyon)

## Coverage and evidence

The per-feed denominator counts distinct ordered station calls and access restrictions within each source route. It includes overlapping regional and national feeds. The data does not yet support a nationwide percentage for distinct operational railway lines.

- [Coverage](../reports/fr/coverage.json) records source-scoped counts by service family and region, playable directions, tested directions, unimplemented source pattern IDs for partly implemented lines, and infrastructure totals.
- [Inventory](../reports/fr/inventory.json) covers the 13 metropolitan regions and identifies overseas feed candidates separately. The [source manifest](../data/fr/source/manifest.json) records publisher, URL, license, date window, archive hash and acquisition outcome where available.
- [Schedules](../data/fr/source/schedules/) contain per-feed line and direction outcomes. A raw `BLOCKED` pattern requires track and localization evidence. The coverage report overlays verified additions by their exact source pattern IDs.
- [Track audit](../reports/fr/track-evidence.json) contains examined OSM relations, matched timetable patterns and block reasons. In the selected Bordeaux–Marseille relations, Lacourtensourt remains part of the connected track. It is omitted from gameplay stops because the matching official Intercités runs pass it without passenger calls. The matched Marseille–Toulouse short workings still lack independently verified reverse alignments in the examined data.
- The RFN line and track inventories record physical line codes, operational infrastructure flags and track types. An infrastructure flag alone does not establish passenger operation. [SNCF Réseau line geometry](https://data.sncf.com/explore/dataset/formes-des-lignes-du-rfn/), [SNCF Réseau track geometry](https://ressources.data.sncf.com/explore/dataset/fichier-de-formes-des-voies-du-reseau-ferre-national/)

## Resume

Use Python 3.12 and Node.js 22 or newer. A cache can be outside the checkout. Keep the snapshot files if reproducing the original run, since publishers replace their downloads over time.

```sh
python -B tools/fr_fetch.py --cache ../fr-cache --include-unknown-mode
python -B tools/fr_inventory.py --cache ../fr-cache --as-of 2026-11-12 --baseline 520e00ec0f00e114005b7a616dff16f049a7b148
node tools/audit-fr-track-evidence.cjs ../fr-cache 83582 80921 81943 83281 81678 81995 39589
node tools/build-fr.cjs
node tools/test-france-data.cjs
node tools/build-app-bundle.js
node tools/test-france-browser.cjs
node tools/report-fr-coverage.cjs
```

The track audit accepts OpenStreetMap full relation exports named `fr-osm-<relation-id>.json` in the cache. For each accepted direction, retain the source relation in `data/fr/source/osm/` and add the candidate to `data/fr/source/release-lines.json`. Review aliases and Korean names before building. The browser test uses Playwright. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` if they are installed outside the project. Set `FRANCE_PUBLIC_URL` to exercise representative directions on the published site.

The next eligible work is the remaining high-speed and OUIGO patterns, then Intercités daytime and overnight directions and all TER regions. Follow with the missing Île-de-France modes, regional metros and tramways, Corsica, independent railways and international services. Compare overlapping source line identities, especially for regional aggregates and SNCF. Additional work remains on NeTEx-only services, operator feeds with missing or unavailable schedules, local systems outside the national catalog, and the overseas inventory. Compare timetable service, infrastructure, and special railway public access independently before releasing any heritage or mountain railway.

The Corsica GTFS snapshot expired in March 2026. The operator independently publishes a November 2–January 3 timetable, which is the source to use for the next Corsica validation. Chemins de Fer de Provence independently publishes the Nice–Digne schedule effective September 1, 2026. Both require separate alignment and stop validation. [Corsica operator schedules](https://cf-corse.corsica/horaires/), [Provence operator schedules](https://www.cpzou.fr/telecharger-nos-horaires-et-plans/)

## Attribution

- SNCF Voyageurs schedule extracts and SNCF Réseau infrastructure extracts retain the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/). [SNCF Voyageurs schedules](https://transport.data.gouv.fr/datasets/horaires-sncf)
- Île-de-France Mobilités schedule extracts retain the [Licence Mobilité](https://prim.iledefrance-mobilites.fr/fr/licences). The France game credits name the producer. [Île-de-France Mobilités schedules](https://prim.iledefrance-mobilites.fr/jeux-de-donnees/offre-horaires-tc-gtfs-idfm)
- Lyon schedules are published by SYTRAL Mobilités. The local network identifies RATP Dev as its metro operator. [TCL operator information](https://www.tcl.fr/a-propos/offres-demploi)
- STAR timetable extracts use ODbL. Keolis Rennes Métropole operates the metro for Rennes Métropole. [STAR operator information](https://www.star.fr/foire-aux-questions?question=qui-exploite-le-reseau-star)
- Track geometry © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright). The corresponding raw relation snapshots and build code are available in this repository.
- Source schedule files from other operators retain the dataset-specific licenses in the source manifest.
