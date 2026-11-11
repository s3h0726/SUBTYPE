import csv
import io
import unittest
from datetime import date
from zipfile import ZipFile

from timetable_audit.compare import compare, index_feed
from timetable_audit.gtfs import read_feed, seconds
from timetable_audit.tra_ods import extract_locals


class ScheduleAudit(unittest.TestCase):
    def test_gtfs_overnight_frequency_and_exceptions(self):
        tables = {
            "agency": [["agency_id"], ["a"]],
            "routes": [["route_id", "agency_id", "route_type"], ["r", "a", "0"]],
            "stops": [["stop_id", "stop_name", "stop_lat", "stop_lon"],
                      ["a", "Station A", "35", "137"], ["b", "Station B", "35.001", "137"]],
            "calendar": [["service_id", "monday", "tuesday", "wednesday", "thursday", "friday",
                          "saturday", "sunday", "start_date", "end_date"],
                         ["d", 1, 1, 1, 1, 1, 0, 0, "20261111", "20261210"]],
            "calendar_dates": [["service_id", "date", "exception_type"], ["d", "20261111", 2], ["d", "20261114", 1]],
            "trips": [["route_id", "service_id", "trip_id", "direction_id"],
                      ["r", "d", "t1", 0], ["r", "d", "t2", 0]],
            "stop_times": [["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"],
                           ["t1", "24:15:00", "24:15:00", "b", 2], ["t1", "23:55:00", "23:55:00", "a", 1],
                           ["t2", "25:15:00", "25:15:00", "b", 2], ["t2", "25:00:00", "25:00:00", "a", 1]],
            "frequencies": [["trip_id", "start_time", "end_time", "headway_secs", "exact_times"],
                            ["t2", "25:00:00", "26:00:00", 600, 0]],
        }
        file = io.BytesIO()
        with ZipFile(file, "w") as archive:
            for table, values in tables.items():
                output = io.StringIO()
                csv.writer(output).writerows(values)
                archive.writestr(table + ".txt", output.getvalue())
        feed = read_feed(file, date(2026, 11, 11), date(2026, 11, 14), lambda route: True)
        self.assertEqual(feed["calendars"]["d"]["active_dates"], ["2026-11-12", "2026-11-13", "2026-11-14"])
        self.assertEqual(feed["trips"][0]["stops"], ["a", "b"])
        self.assertEqual(feed["trips"][0]["calls"][1]["arrival"], 87300)
        self.assertEqual(feed["trips"][1]["frequencies"][0]["exact"], False)
        self.assertEqual(seconds("25:00:00"), 90000)
        with self.assertRaises(ValueError):
            seconds("00:65:00")
        route = {
            "country": "JP", "directions": "forward", "sequence": ["A", "B"],
            "station_records": [["A", ["Station A"], 35, 137], ["B", ["Station B"], 35.001, 137]],
            "runtime_patterns": [{"stops": ["A", "B"]}],
        }
        metrics = compare(route, feed, index_feed(feed), ["r"])
        self.assertEqual((metrics["trip_records"], metrics["source_patterns"], metrics["matched"]), (2, 1, 1))
        route["station_records"].append(["B-other", ["Station B"], 35.001001, 137])
        ambiguous = compare(route, feed, index_feed(feed), ["r"])
        self.assertEqual(ambiguous["matched"], 0)
        self.assertEqual(ambiguous["ambiguous"][0]["unresolved_stop_ids"], ["b"])

    def test_tra_section_preserves_call_order_and_does_not_invent_pass_times(self):
        grid = [
            ["車", "區 次", "", "站 名 間", "二", "源", "濁"],
            ["", "", "", "", "水", "泉", "水"],
            ["區間快", "", "2703", "彰化－濁水", "05:54", "↓", "06:12"],
        ]
        trip, = extract_locals("Jiji", grid)
        self.assertEqual((trip["origin"], trip["destination"]), ("彰化", "濁水"))
        self.assertEqual(trip["calls"], [["二水", "05:54"], ["濁水", "06:12"]])


if __name__ == "__main__":
    unittest.main()
