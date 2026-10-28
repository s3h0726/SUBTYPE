# SUBTYPE six integrations — staged, non-destructive implementation

Branch: `feature/six-integrations-staging-20261029`. **Never auto-merge to main.**
Existing Leaflet gameplay, Korean preview release states, local records, and Supabase rankings remain untouched.
No production schema changes or OSM geometry replacements were performed by this branch.

## 1. Integration delivery and acceptance gates

| Integration | Added artifact | State / gate |
| --- | --- | --- |
| Playwright automatic station typing | `tools/test-integrations-playwright.cjs`, staging CI | Smoke test; both desktop and mobile must terminate at result; existing full `test-kr-site.cjs` remains required |
| Supabase run persistence verification | `tools/verify-supabase-records.cjs` | Read-only authenticated REST smoke; writes only after a separate dedicated staging account/test design is approved |
| OSM line updates | `fetch-osm-candidate.mjs`, `review-osm-route.mjs` | Candidate XML and GeoJSON ONLY, no automatic canonical data writes |
| MapLibre | `js/maplibre-adapter.js`, `integrations/maplibre-preview.html` | Standalone opt-in preview, never replaces Leaflet player |
| Turf.js geometry QA | `tools/audit-geometry-turf.mjs` | WGS84 coordinates, approximate line length, gap warnings, 350m station offset gate |
| Supabase Realtime friendly duel | `supabase/subtype-duel-prototype.sql`, `js/realtime-duel.js` | Isolated two-player experiment only; not enabled in production or public rankings |

## 2. Run the tests locally

Requires Node.js 22, Chromium, and a checkout of this branch. The current repository has no `package-lock.json`, so **do not run `npm ci`**.

```bash
npm install --no-save --package-lock=false playwright@1.56.1 @turf/turf@7.4.0
npx playwright install chromium
node tools/test-integrations-playwright.cjs
node tools/audit-geometry-turf.mjs --input integrations/geometry-fixture.geojson
npm test
```

Also run the existing UI suite: `node tools/test-kr-site.cjs` (longer), and independent Japan/Korea regressions. Browser smoke uses synthetic IME events, not a physical mobile keyboard. Cloud login is not covered.

### Supabase record read smoke (dedicated test account)

Only reads the signed-in user’s `player_runs` and `ranking_runs`. No entries are inserted.

```bash
SUBTYPE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
SUBTYPE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY \
SUBTYPE_TEST_ACCESS_TOKEN=YOUR_TEST_USER_JWT \
node tools/verify-supabase-records.cjs
```

Avoid logging or committing JWT values, refresh tokens, or service-role keys.
A read-only PASS with zero rows confirms API access and ownership for this user **but not that a run was saved successfully**.
To validate actual persistence: create two staging test users, complete a route, confirm a `player_runs` row after login, reload, and inspect restored records and RLS cross-user isolation; do not pollute production.

## 3. OSM acquisition → review → human acceptance

Use a *verified* OSM route relation ID; never guess it. Run this manually, not on a schedule.

```bash
node tools/fetch-osm-candidate.mjs --relation RELATION_ID
node tools/review-osm-route.mjs \
 --input reports/osm/candidates/relation-RELATION_ID.osm \
 --relation RELATION_ID --route ROUTE_ID --direction DIRECTION_ID \
 --direction-file data/ACTUAL_DIRECTION.json \
 --stops-file data/ACTUAL_STOPS.json
node tools/audit-geometry-turf.mjs --input reports/osm/candidates/route-ROUTE_ID-DIRECTION_ID.geojson
```

Replace placeholders with actual existing repository paths. The review tool copies the stops registry to a temp folder because the legacy importer writes to its supplied stops-file; it never passes the original path for modification.

Review station identities, reverse directions, interchange-specific coordinates, topology, endpoint alignment, jumps, line operator/source and ODbL attribution before a *separate* data migration. `REVIEW` gap warnings must be investigated; this simple geometry heuristic cannot certify operational correctness. Do not auto-apply a candidate to Japan, Korea or Hong Kong. Avoid frequent/bulk requests to the public Overpass instance.

## 4. MapLibre independent preview

Start a local static server from the repository root (`python3 -m http.server 8080`), open `http://localhost:8080/integrations/maplibre-preview.html` and select the generated candidate GeoJSON. External CDN/map tile network access is needed. `js/maplibre-adapter.js` converts existing SUBTYPE `[lat,lon]` to WGS84 GeoJSON `[lon,lat]` before rendering. Current game Leaflet train marker, camera, transition speed and IME logic remain unchanged.

After visual QA, a separate guarded feature flag can adapt train movement to MapLibre without breaking the legacy map; that production bridge is **not implemented in this staging prototype**.

## 5. Realtime 2-person FRIENDLY prototype (isolated Supabase project ONLY)

Review SQL and RLS, then execute `supabase/subtype-duel-prototype.sql` against a **separate test project**, not the currently connected live SUBTYPE project.

A host can create a room using a signed-in `@supabase/supabase-js` v2 client:

```js
const {data:room,error}=await client.from('subtype_duel_rooms')
  .insert({host_id:hostUser.id,route_id:'verified-route-id',service_key:'verified-service-key'})
  .select('id').single();
if(error)throw error;
const host=await createFriendlyDuel({client,roomId:room.id,onProgress:console.log});
```

The guest logs in using a *different* test user and calls:

```js
const guest=await createFriendlyDuel({client:guestClient,roomId:room.id,join:true,onProgress:console.log});
await guest.sendProgress(1,20); // client-reported demo progress
await guest.close();
```

The host and guest must use exactly the same room route ID and service key from the stored room row. Only two users are admitted. Realtime Broadcast messages must use `private:true`. The DB membership and realtime.messages SELECT/INSERT policies restrict channels, but browser-sent progress is spoofable: **no ranked duel, monetary prize, or trusted victory attribution**.

Before product release: authenticated room UI, match lifecycle and disconnect/reconnect, stable server-side timer, abuse/rate limits, authoritative scores/input-event replay protection, user deletion/retention policy, test accounts with RLS attack cases, and performance tests.

## 6. Never merge automatically

Acceptance requires:
1. New Playwright and Turf gates pass;
2. Existing production UI/Japan/Korea regression suites pass;
3. No changed canonical rail geometry, station names, rank tables or records;
4. Isolated Supabase two-user trial passes (read/write ownership and channel denial for a third user);
5. MapLibre preview verified on mobile and desktop, then explicitly approved;
6. Human review of PR diff and manual merge decision.

No production deployment is implied by this branch.
