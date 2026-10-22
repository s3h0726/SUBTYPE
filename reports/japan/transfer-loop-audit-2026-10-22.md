# Japan-only transfer and circular-route audit — 2026-10-22

Branch: `feature/japan-transfer-loops-20261022`, based on main commit `5473f01123eb268c36506efac5893a71a0b85947`.

## Verified named interchange links

The free-drive Japan station graph now supports named station pairs and groups from official operator guidance, without changing station display names or sharing another line's station coordinates. Connections require different names, geographical inclusion, and a maximum observed inter-station separation.

- Tokyo Metro and Toei: Ueno-hirokoji / Naka-okachimachi / Ueno-okachimachi; Hibiya / Yurakucho; Awajicho / Shin-ochanomizu / Ogawamachi; Ningyocho / Suitengumae; Tsukiji / Shintomicho; Ginza / Ginza-itchome; Toranomon / Toranomon Hills; Korakuen / Kasuga; Shinjuku / Shinjuku-nishiguchi; Akihabara / Iwamotocho. Source: https://www.tokyometro.jp/lang_en/ticket/guide/transfertime/index.html
- Osaka Metro: Umeda / Higashi-Umeda / Nishi-Umeda. Source: https://subway.osakametro.co.jp/en/guide/fare/various_fares/transit_umeda/noritugi_3.php
- Previously implemented JR Maihama / Resort Gateway is retained. Source: https://www.tokyodisneyresort.jp/kr/tdr/resortline

Transfers outside ticket barriers are graph navigation connections, not a claim of through-ticket fare equivalence. Tokyo Metro and Osaka Metro have different rules for paid-area/out-of-station transfers. Interchange policy is not generalized to unrelated locations.

## Circular services

- JR Yamanote (`line-11302`): source and published per-route JSON amended from Tokyo → Yurakucho to Tokyo → … → Yurakucho → Tokyo, with 31 station visits including repeated Tokyo station and 30 segments. Closing polyline uses adjacent Keihin-Tohoku MLIT N02-2025 survey alignment, **verified:false**, **REVIEW_REQUIRED** for actual Yamanote track. No claim of exact Yamanote running-rail geometry.
- Toyama City Tram Route 3 (`line-toyama-city-3`): closed from Marunouchi via original stops to Prefectural Office → Marunouchi using physical surveyed city tram segment already sourced in Route 2. 13 station visits, 12 segments.
- Toei Oedo (`line-99301`): flag corrected `loop:false`; the through route starts at Tochomae and ends at Hikarigaoka, and is not a station-to-same-station trip.
- Hiroshima Dentetsu L loop and Disney Resort Line: previously carry circular arrival data, preserved.

Unresolved circular line inventory (do not fabricate track geometry):
- JR Osaka Loop `line-11623`: source ends at Teradacho, starts Tennoji; physical final Teradacho → Tennoji surveyed segment is not in canonical workspace. Keep the original route playable without inventing a final track.
- Iyo Railway Circular `line-99809`: Matsuyamashi ↔ Nishi-Horibata source does not contain a complete verified returning segment. Needs a reviewed circular *service pattern* and track.
- Toyama route 6 terminates at the same named Iwasehama location, but is a through-running return trip, not an independent physical circular line.

## Build and cache notes

Canonical inputs modified in `data/lines/**`; existing individual generated routes and line-index updated. The in-browser `js/data-loader.js` adds an **idempotent, Japan-only compatibility patch** because the existing ~22 MB embedded catalog could not be republished within this change. A subsequent normal build from source should regenerate all embedded Japanese catalog/chunk files. The compiler preserves the route-source improvements; no Hong Kong or Korean source was modified.

QA: JavaScript syntax and targeted runtime invariants checked for station identity, preserved real geometry where present, no cross-country transfer changes, and named station switch coordinates. Full repository Node/browser regression suite not executed.
