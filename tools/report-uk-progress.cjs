'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const v=read('data/uk/generated/validation.json'),b=read('reports/uk/browser-tests.json'),index=read('data/uk/generated/index.json');
const release=read('reports/uk/release-status.json');
const head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const text=`# United Kingdom railway expansion progress

Updated: 2026-11-08 (Asia/Seoul). Status: **partial implementation, not a completed UK network**.

## Repository and validation snapshot

- Feature branch: \`feature/uk-railway-expansion\`.
- Inspected/reported Git HEAD: \`${head}\`. The final report commit may follow this snapshot; use Git history for that commit's own SHA.
- Base inspected before implementation: \`e1771623bbb9854ed430d366389e53f223bd20e7\`.
- Main integration: ${release.mainIntegration}; verified merge commit: \`${release.mergeCommit||'pending'}\`.
- Actual production: ${release.productionDeployment?.status||'pending'}; public-site UI playthrough: ${release.productionDeployment?.actualUIPlaythrough||'pending'}. See \`reports/uk/production-verification.json\` and \`reports/uk/release-status.json\` for the observed deployment commit, timestamp and bundle hash.

## Released, playable inventory

| Metric | Actual generated value |
| --- | ---: |
| Operating organisations | ${v.operators} |
| Physical passenger line/route entries | ${v.lines} |
| Opposite-direction stopping families | ${v.servicePatterns} |
| Independently selectable verified directions | ${v.playableDirections} |
| Unique source station IDs | ${v.uniqueStations} |
| Physical/interchange station groups | ${v.uniquePhysicalStationGroups} |
| Korean-named source stations | ${v.koreanNamedStations} / ${v.uniqueStations} |
| Shared OSM track segments | ${v.sharedSegments} |

Physical/interchange groups are derived from explicit TfL hubs and regional station identities; they are not a claim that each hub has a single passenger-facing name. Korean coverage is 100% editorial coverage, not 100% external linguistic verification.

| Line / passenger route | Source stations | Playable directions |
| --- | ---: | ---: |
${v.linesDetail.map(r=>'| '+r.name+' | '+r.stationCount+' | '+r.directions+' |').join('\n')}

Operators: ${index.operators.map(o=>o.names.en).join('; ')}.

## Implemented integration

UK country, operating organisation and railway-category filters; physical line cards; pattern families and independently selectable directions; current-pattern station lists; geographical track maps and movement; Korean typing and answer validation; line-specific station/nameboard presentation; shared station overrides; existing country-specific Korean editor; lazy loading and one shared geometry cache; explicit hub transfers and one-way verified free-drive patterns; UK leaderboard country identity.

The production renderer remains the application's existing Leaflet renderer. No separate app or unverified straight-line railway fallback was introduced.

## Validation evidence

- All ${v.playableDirections} directions pass the existing route-integrity resolver with valid endpoints, coordinates, stopping order and zero geometry endpoint mismatches.
- Every generated coordinate and track edge is independently checked against original OSM nodes and railway ways.
- Directed graph tests: real shared-node joins pass; disconnected tracks and invented reverse directions are rejected.
- Playwright: ${b.status}; ${b.runs.length} full service playthroughs through the real game, using synthetic Hangul composition input. Runtime page errors: ${b.errors.length}.
- A real movement-animation service is exercised on Waterloo & City; other full playthroughs disable motion to keep the batch bounded.
- Map/nameboard: actual tile layer, station markers and train marker; 390-pixel mobile nameboard has no measured clipping. Screenshots are in \`reports/uk/\`.
- Free-driving progression: ${b.freeDrive.every(x=>x.status==='PASS')?'PASS':'CHECK REPORT'}.
- Existing-country browser switching: ${b.regressions.map(x=>x.country+' '+x.status+' ('+x.routes+' routes)').join('; ')}. This is catalogue/load smoke coverage, not a full playthrough of every existing-country route.
- Existing targeted checks pass: Korean canonical network (8,277 routes / 18,097 journeys); Taiwan (12 tests); typing/IME; Shonan-Shinjuku (12 directions); free-drive targeting/flow/transfers (22 tests).
- Existing baseline failures remain: global data validator reports 267 pre-existing station-ID duplicates; global route audit has 40 blocked legacy routes; Ueno–Tokyo test references missing \`line-11229--jobansen-totte-iwaki.json\`. Non-UK railway datasets are unchanged. The complete legacy test suite is therefore **not** claimed green.
- Shared leaderboard backend: production migration \`allow_uk_ranking_country\` applied and verified; country constraint accepts UK, ownership predicate remains, RLS enabled, anonymous insert forbidden. No fabricated production score was inserted. Real authenticated score upload remains untested.

Full reports: \`reports/uk/data-tests.json\`, \`reports/uk/browser-tests.json\`, and the \`existing-*\` reports. Source/licensing/rebuild details: \`docs/uk-railway-data.md\`.

## Remaining London work

Every requested London network has a playable entry, but not every service variant is released. ${v.unresolvedOfficialPatterns.length} current TfL patterns remain blocked by the present source-geometry verification:

${v.unresolvedOfficialPatterns.map(p=>'- '+p.lineId+': '+p.name.replace(/&harr;/g,'↔').replace(/\s+/g,' ').trim()+' — '+p.reason).join('\n')}

The TfL Route Sequence endpoint is not an exhaustive timetable: peak-only short turns, Metropolitan fast/semi-fast calls and temporary operating changes need independently verified timetable evidence. Rejected OSM short turns are retained as source evidence; they are not automatically advertised as active services.

## Remaining national, international and regional work

- **National Rail has not been implemented in this batch.** Avanti West Coast, LNER, GWR, South Western Railway, Southern, Thameslink, Great Northern, Southeastern, Greater Anglia, c2c, Chiltern, EMR, West Midlands Railway, London Northwestern Railway, CrossCountry, Northern, TransPennine Express, ScotRail, Transport for Wales and Merseyrail still need current full stopping-pattern evidence, station identity matching, track topology and Korean review.
- High Speed 1, Southeastern high-speed and UK-connected Eurostar: not implemented. Do not create international services until their complete cross-border geometry and actual station sequences are verified.
- Manchester Metrolink, West Midlands Metro, Nottingham Express Transit and Blackpool Tramway: original OSM route relations have been collected, but remain source-only. Review current operator maps/timetables, handle platform-only OSM members (especially West Midlands Metro and missing NET stop members), confirm all branches and service patterns, localise every stop, and run the same release gates before adding these networks to \`release-evidence.json\`.
- Edinburgh short turns and other urban rail systems remain unimplemented.
- Korean dictionaries need independent Korean-language-reference review. Editorial names remain explicitly marked as such.

## Resume procedure

1. Read this progress file, \`docs/uk-railway-data.md\`, \`data/uk/generated/validation.json\` and \`reports/uk/release-status.json\`.
2. Reuse the compressed, checksummed source snapshots in \`data/uk/source/manifest.json\`; do not regenerate names or fabricate missing geometry.
3. Resolve the exact blocked London patterns above, then add verified National Rail batches. Keep operators, infrastructure lines and service patterns separate.
4. For regional additions, review both the official service evidence and complete OSM stopping calls, then explicitly update the release evidence and dictionaries.
5. Run \`npm run build:uk\`, \`npm run test:uk\`, \`node tools/test-uk-leaderboard.cjs\`, \`npm run build:app\`, and the full UK Playwright batch. Commit validated batches and update this report.
6. Check CI and the actual production site before changing integration/deployment status. Existing-country baseline failures must remain visible until separately repaired.
`;
fs.writeFileSync(path.join(root,'docs/uk-railway-expansion-progress.md'),text);console.log('Wrote resumable UK inventory and validation progress.');
