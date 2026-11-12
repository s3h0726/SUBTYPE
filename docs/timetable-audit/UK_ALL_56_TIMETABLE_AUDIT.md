# UK all 56 railway routes: timetable audit, 12 November 2026

All **56/56 UK lines** and **291/291 playable directions** were inspected for game station IDs, directed track segments and selectable service identities.
All **56/56** have a named operator or national timetable source; some links are directories or search interfaces rather than dated train-by-train PDF tables.
**Full per-train, per-day timetable certification is 0/56.** Source discovery and real-track validation do not count as full timetable verification.

| Measure | Result |
|---|---:|
| UK line IDs | 56 |
| Real-track game directions structurally checked | 291 |
| Timetable sources linked | 56 |
| Routes with prior concrete timetable, operating-rule or terminus checks | 19 |
| Published train samples whose stops align with the game | 6 |
| Missing official reverse directions | 2 |
| Fully timetable verified | 0 |

## Confirmed official schedule sample checks

| Route | Game pattern | Official schedule calls matched | Source |
|---|---|---:|---|
| uk-elizabeth | uk-osm-5793620 | 14 | https://content.tfl.gov.uk/elizabeth-line-17-may-12-december-2026.pdf |
| uk-liberty | uk-osm-141910 | 3 | https://content.tfl.gov.uk/lo-liberty-line-timetable-may-2026.pdf |
| uk-blackpool-tramway | uk-osm-10841330 | 7 | https://images.blackpooltransport.com/downloads/Tramway_Digital_Timetable_May26.pdf |
| uk-lumo-east-coast | uk-osm-20149508 | 5 | https://www.lumo.co.uk/-/media/Timetable-PDFs/Base-Timetables/EC-Timetable---May%2726---Dec%2726-v2.pdf |
| uk-merseyrail-northern | uk-osm-14095866 | 4 | https://www.merseyrail.org/media/dsoltun1/northern-line-booklet-17may26-compressed.pdf |
| uk-merseyrail-wirral | uk-osm-287847-outbound | 4 | https://www.merseyrail.org/media/rocgdyjq/wirral-line-booklet-may-26-compressed.pdf |

## Confirmed omissions and current timetable exceptions

- Heathrow Express: Paddington → Heathrow Terminal 5 missing in game; opposite direction exists. Reverse real OSM tracks needed.
- Avanti West Coast Liverpool branch: London Euston → Liverpool Lime Street direction missing in game; opposite direction exists.
- Waterloo & City: Monday–Friday 06:00–00:30, no regular weekend or bank holiday train (TfL). Calendar is stored as source metadata, without restricting sandbox gameplay.
- Glasgow Subway: Monday–Saturday 06:30–23:40, Sunday 10:00–18:12. Govan departure first/last for both loops stored (SPT).
- Merseyrail Southport and Chester/Ellesmere Port: autumn amendments overlap this date; May base PDF alone must not be treated as current departure times.
- Lumo: Stevenage is pickup-only northbound and dropoff-only southbound; station list alone does not encode boarding restrictions.

## Evidence files

- UK_ROUTE_AUDIT_56.csv: one record for each UK route with operator source and evidence level.
- UK_TIMETABLE_AUDIT_291_DIRECTIONS.csv: all 291 patterns, origins/destinations, real-track checks, train-time sample status.
- UK_OFFICIAL_TRAIN_TIME_SAMPLES.csv: 6 actual timetable column comparisons.
- data/uk/source/timetables/uk-56-official-sources.json: 56 official source URLs.
- data/uk/source/timetables/uk-56-train-time-samples.json: 5 additional actual train samples; one prior TfL Elizabeth sample reused.

**Required next stage:** extract the full dated weekday/Saturday/Sunday columns from all operator timetable sources and reconcile each of 291 patterns. Do not upgrade incomplete routes to VERIFIED.
