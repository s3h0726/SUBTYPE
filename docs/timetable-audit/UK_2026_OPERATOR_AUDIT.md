# UK railway operating timetable audit — 2026-11-12

Branch: audit/six-country-timetables. **UK baseline before this batch: 56 route cards, 284 playable directions.** After the verified short-turn implementation: **56 cards, 291 playable directions, 183 service families**.
This report documents source evidence and actual implementation, not complete schedule certification. The UK catalogue is independent from Korean road buses (excluded from the six-country audit).

## Checked against current official operator data

| Operator / route | Game scope | Operator source | Finding | Action |
|---|---|---|---|---|
| Nottingham Express Transit: Hucknall–Toton Lane | 2 normal directions | https://www.thetram.net/timetables | Operator lists weekday/Sunday late services terminating at Wilkinson Street, Nottingham Station and Shipstone Street | Add 3 shortened playable patterns |
| Nottingham Express Transit: Phoenix Park–Clifton South | 2 normal directions | https://www.thetram.net/timetables | Operator lists late services terminating at Wilkinson Street, Nottingham Station and Shipstone Street | Add 3 shortened playable patterns |
| Edinburgh Trams | 2 normal directions, 23 stops | https://edinburghtrams.com/plan-journey/timetables | Early 04:26 Gyle Centre → Newhaven trip; daytime full-length runs also present | Add one early service |
| Glasgow Subway | Inner and Outer loop, 15 stops | https://www.spt.co.uk/travel-with-spt/subway/maps-stations/ and https://www.spt.co.uk/subway/subway-timetables/ | Current game patterns match official 15-stop clockwise Outer and anticlockwise Inner circles; published Sunday opening differs from Mon–Sat | No added patterns; timetable reviewed (not full day-by-day verification) |
| Elizabeth line | 19 patterns | https://tfl.gov.uk/plan-a-journey/timetables/elizabeth-line-timetables | TfL official Heathrow branch: 6 trains/h, 4 T4 and 2 T5. Precise train-by-train calendar and all 19 game patterns not yet compared | Retain partial status; do not invent short turns |
| Tyne and Wear Metro Green | 2 directions | https://www-azure.nexus.org.uk/metro/timetables-and-stations/airport/timetable | Airport departure board confirms scheduled South Hylton trains | Terminal verified only; train-specific calls pending |
| South Yorkshire Supertram Yellow | 2 directions | https://www.travelsouthyorkshire.com/en-gb/timetabledetails/1996d28e-8689-453a-8426-328cde2a1f4c | Official route endpoints Middlewood and Meadowhall Interchange match game; October 24–31 2026 temporary changes are historical as of this audit date | Normal route kept; dates of diversions tracked |

## Seven new source-confirmed selectable patterns

Source time is **first/last departure from the named origin** in the operator's table, NOT a synthesized full timetable, nor live availability.

| Physical route | New service | Mon–Sat departure | Sunday departure | Source |
|---|---|---|---|---|
| Hucknall–Toton | Hucknall → Wilkinson Street | 01:10 | 00:10 | NET |
| Hucknall–Toton | Hucknall → Nottingham Station | 00:15 | 23:15 | NET |
| Hucknall–Toton | Toton Lane → Shipstone Street | 01:05 | 00:05 | NET |
| Phoenix Park–Clifton | Phoenix Park → Wilkinson Street | 00:56 | 23:56 | NET |
| Phoenix Park–Clifton | Phoenix Park → Nottingham Station | 00:15 | 23:15 | NET |
| Phoenix Park–Clifton | Clifton South → Shipstone Street | 00:48 | 23:48 | NET |
| Edinburgh Trams | Gyle Centre → Newhaven | 04:26 | 04:26 | Edinburgh Trams |

The pattern generator slices verified **existing forward train track sequences** and reuses exact OSM segment IDs. It creates no new route coordinates. The operator source, observed first/last time, origin, direction, and provenance are embedded in each new pattern.

**Important:** A route's status is not upgraded to fully VERIFIED solely from a terminal or selected first/last departure comparison. Other UK patterns and all calendar exceptions remain subject to further checks. For the overall six-country audit, the 11 fully verified records remain unchanged until complete audited evidence is available.

## UK 56-route audit register

The CSV [UK_ROUTE_AUDIT_56.csv](UK_ROUTE_AUDIT_56.csv) lists every currently registered UK route: **7 operator-reviewed/partially compared route cards** and **49 still requiring operator-timetable comparison**. This is a conservative status matrix, not a claim that all 56 routes were schedule verified.

TfL's [current 17 May–12 December 2026 Elizabeth line timetable](https://content.tfl.gov.uk/elizabeth-line-17-may-12-december-2026.pdf) was located and scoped. Exact per-train stopping patterns and weekdays/holiday exceptions remain unverified; 19 existing Elizabeth patterns remain unchanged.

## Reproducibility and release rules

- Run: \`node tools/apply-uk-verified-shortturns.cjs\`.
- Verify: \`node --test tools/test-uk-verified-shortturns.cjs\`.
- \`tools/build-uk-regional.cjs\` invokes the same idempotent function so a UK data rebuild does not silently discard the seven services.
- Route IDs, station IDs, track segments, geometry partitions and original operating services must be preserved.
- This PR remains Draft until the full UK route selector/playability regressions and pre-existing legacy data errors are addressed.
