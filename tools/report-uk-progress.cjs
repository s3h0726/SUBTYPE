'use strict';
const fs=require('fs'),cp=require('child_process');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('data/uk/generated/validation.json'),index=read('data/uk/generated/index.json'),b=read('reports/uk/browser-tests.json'),ui=fs.existsSync('reports/uk/browser-ui-tests.json')?read('reports/uk/browser-ui-tests.json'):null,release=read('reports/uk/release-status.json');
const head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const routes=index.routes.map(r=>read(r.lazySource));
const counts=Object.fromEntries(['operators','lines','servicePatterns','playableDirections','uniqueStations','uniquePhysicalStationGroups','koreanNamedStations','sharedSegments'].map(k=>[k,v[k]]));
const txt=`# United Kingdom railway expansion progress

Updated: 2026-11-11 (Asia/Seoul). **Substantial partial implementation; the full UK railway network is not complete.**

## Current measured inventory

| Metric | Repository value |
| --- | ---: |
${Object.entries(counts).map(([k,n])=>'| '+k+' | '+n+' |').join('\n')}

Station IDs count source records. Physical station groups reuse published TfL hubs and merge new identically named, identically localized records only within 500 metres. Different cities' stations with the same name remain separate. Korean coverage is editorial coverage, not a claim of official Korean translations.

| Line / passenger corridor | Source station IDs | Playable directions |
| --- | ---: | ---: |
${v.linesDetail.map(r=>'| '+r.name+' | '+r.stationCount+' | '+r.directions+' |').join('\n')}

## Operating organisations

${index.operators.map(o=>'- '+o.names.en+' — '+o.names.ko).join('\n')}

## Implementation batches and preserved baseline

- PR #33 introduced 9 organisations, 28 lines, 73 families, 129 directions, 657 station IDs, 605 physical groups and 1,504 segments. Report commit: 55fda6a9161e7138cfef42b76daf87908707d63c. Merge: 97d34ea5f9abf854645c5d2579b72faec4d8232e.
- Regional/intercity batch commit: 8931d5535. UK free-drive repeated-visit repair: 10a6e94ff.
- London repair commit: 26abc3946. All 12 previously blocked TfL directions were restored. The original 129 pattern IDs, station sequences and segment references remain frozen and automatically checked.
- Repairs: import real track edges independently of incomplete stop membership; backtrack failed platform choices; consider 128 candidate vertices within the original 300 metre gate; explicitly anchor Heathrow T5 to documented OSM platform nodes 1508864707/254350058. No synthetic junctions or straight-line railway segments were added.
- Fresh District, DLR, Elizabeth and Northern TfL stopping sequences matched the preserved official source sequences on November 10. No London regular sequence remains blocked: ${(v.unresolvedOfficialPatterns||[]).length}.
- Regional expansion: Manchester Metrolink covers all 99 stops and current regular/part-day routes, including the Trafford Centre–Crumpsall service and Eccles variants. NET includes both lines, all 50 stops, and different northbound/southbound city loops. Blackpool includes direct coastal and North Station variants. West Midlands Metro includes both Wolverhampton termini; Millennium Point through-running remains excluded pending sufficient route evidence.
- National expansion includes Lumo, Merseyrail Northern/Wirral branches, seven ScotRail corridors, and LNER stopping patterns individually connected to real track nodes. Further operators are inventoried in the table above as they are released.
- Additional timetable comparison was stopped at the user's request. Previously completed LNER evidence remains reproducible reference data. Further expansion uses official network maps and source OSM route relations, with geometry and gameplay checks; it does not claim timetable certification.

## Validation actually observed

- Source-node/edge integrity, station coordinates, Korean names, service selection, endpoints and preserved baseline: see reports/uk/data-tests.json.
- Gameplay runs completed in reports/uk/browser-tests.json: ${b.runs.length}; report status: ${b.status}. ${b.error?'The full run completed its gameplay list but stopped on an additional UI assertion: '+b.error.split('\n')[0]+'. The corrected independent UI run has status '+ui?.status+'.':'All recorded game runs and UI assertions passed.'}
- No new browser runtime errors recorded: ${b.errors.length===0?'yes':'no'}.
- Existing country switch regression: ${b.regressions.map(r=>r.country+' '+r.routes+' '+r.status).join('; ')}.
- Full UK free-drive progression: ${JSON.stringify(ui?.freeDriveProgression||b.freeDriveProgression||'pending')}. Geometry loading: ${JSON.stringify(ui?.geometryLoading||b.geometryLoading||'pending')}.
- Edit propagation, English/Korean nameboards and mobile checks are recorded in the browser reports. Regional nameboard checks: ${(b.regionalNameboards||ui?.regionalNameboards||[]).length}.
- UK ranking identity test uses isolated guest data. No authenticated fabricated score is uploaded.
- Known pre-existing global issues remain separate: 267 legacy station-master duplicates, 40 previously blocked route-audit cases, and missing Ueno payload line-11229--jobansen-totte-iwaki.json. These are not claimed fixed by this expansion.

## Source accuracy and licensing

- Source archive and SHA-256 checksums: data/uk/source/manifest.json. OSM track geometry and station records: ODbL-1.0, © OpenStreetMap contributors. TfL official sequences retain their source attribution.
- Per-service evidence, expected calls, reviewed source relations and official URLs: data/uk/source/regional/release-evidence.json. Source geometry is shared by node-sequence hash. The lazy country/line loader fetches cached geographic geometry partitions, preserving one canonical runtime copy of each segment.
- LNER source call/track exclusions remain in data/uk/source/timetables/lner-track-review.json. Excluded records are not catalogue entries. No HS2, Eurostar or unverified cross-border service has been released.

## Git and deployment

- Working branch: feature/uk-railway-completion.
- Report predecessor HEAD: ${head}. The report's own commit can be found in Git history.
- Main integration of this expansion: ${release.mainIntegration}.
- Production verification for this expansion: ${release.productionDeployment?.status||'pending'}; actual public UI: ${release.productionDeployment?.actualUIPlaythrough||'pending'}.
- This section reflects reports/uk/release-status.json. The November 8 deployment is stored separately as previousRelease and is not evidence of this expansion's deployment.

## Precise remaining work

1. West Midlands Millennium Point services: source relations 20439814/20439815 exist, but complete passenger through-running and reversal assumptions are not released. Do not treat all track stop nodes as a certified stopping pattern.
2. Manchester early/late depot and short-turn variants beyond published regular services; Blackpool additional turnbacks; Edinburgh short turns; additional Tyne/Wear and Sheffield variants.
3. Remaining National Rail corridors/operators: South Western Railway, Southern, Southeastern, Greater Anglia, c2c, Chiltern, East Midlands Railway, West Midlands Railway/London Northwestern Railway, CrossCountry, Northern, TransPennine Express, Transport for Wales, Hull Trains, Grand Central and all unlisted branches of operators already present. Check the current inventory before adding any duplicate.
4. Remaining high-speed/international coverage: Southeastern HS1, Eurostar complete UK/Channel Tunnel/continental alignments, and international station localization. HS2 remains excluded until actual passenger operations are evidenced.
5. Continue Korean editorial review against established Korean references, preserve existing overrides, and add explicitly evidenced interchanges whose official English station names differ.
6. For each additional batch, preserve stable IDs, assemble only source railway node edges, run full direction gameplay and regressions, commit, push main and verify the public site. Source OSM API parent discovery returned HTTP 429 during this session; do not treat unavailable source data as permission to invent a route.
`;
fs.writeFileSync('docs/uk-railway-expansion-progress.md',txt);
console.log(JSON.stringify(counts));
