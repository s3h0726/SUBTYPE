import importlib.util
from pathlib import Path
import tempfile
import unittest
import sys

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('commuter', Path(__file__).with_name('import-korail-commuter.py'))
commuter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(commuter)


class PublishedCommuterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.trains = [t for b in commuter.BOOKS for t in commuter.parse_book(b)]

    def test_all_published_columns_and_day_direction_groups(self):
        self.assertEqual([sum(t['sourceId'] == b['id'] for t in self.trains) for b in commuter.BOOKS], [779, 194])
        for b in commuter.BOOKS:
            ts = [t for t in self.trains if t['sourceId'] == b['id']]
            self.assertEqual({(t['calendarGroup'], t['publishedDirection']) for t in ts},
                             {('WEEKDAY', 'UP'), ('WEEKDAY', 'DOWN'), ('HOLIDAY', 'UP'), ('HOLIDAY', 'DOWN')})
            self.assertTrue(all(not t['releaseApproved'] and not t['calendarExceptionsVerified'] for t in ts))
            for t in ts:
                self.assertEqual(t['calls'][0]['operationalStationName'], t['originOperationalName'])
                self.assertEqual(t['calls'][-1]['operationalStationName'], t['destinationOperationalName'])

    def test_passage_clocks_are_never_stop_calls(self):
        ts = [t for t in self.trains if t['sourceId'] == 'korail-daegyeong-20260901']
        for t in ts:
            self.assertTrue(t['passages'])
            self.assertFalse({'가천', '고모', '지천', '신동', '연화', '약목'} & {c['operationalStationName'] for c in t['calls']})
            self.assertTrue(all(p['arrival'] is None and p['departure'] for p in t['passages']))
            # The operational origin is the one exception to a blank arrival.
            self.assertIsNone(t['calls'][0]['arrival'])
            self.assertTrue(t['calls'][0]['departure'])

    def test_buksam_is_a_real_intermediate_call_in_both_directions(self):
        down = ['구미', '사곡', '북삼', '왜관', '서대구', '대구', '동대구', '경산']
        for direction, names in [('DOWN', down), ('UP', down[::-1])]:
            for group in ['WEEKDAY', 'HOLIDAY']:
                ts = [t for t in self.trains if t['sourceId'] == 'korail-daegyeong-20260901' and t['publishedDirection'] == direction
                      and t['calendarGroup'] == group and t['originOperationalName'] == names[0] and t['destinationOperationalName'] == names[-1]]
                self.assertTrue(ts)
                self.assertTrue(all([c['operationalStationName'] for c in t['calls']] == names for t in ts))

    def test_unknown_time_or_changed_workbook_fails_closed(self):
        self.assertEqual(commuter.clock('0'), '00:00:00')
        self.assertEqual(commuter.clock('3.4722222222222224E-4'), '00:00:30')
        self.assertEqual(commuter.clock('1.01'), '24:14:24')
        for bad in ['통과', '-', 'NaN', '-0.1', '2']:
            with self.assertRaises(ValueError):
                commuter.clock(bad)
        with tempfile.TemporaryDirectory() as d:
            file = Path(d) / 'changed.xlsx'
            file.write_bytes((commuter.BASE / commuter.BOOKS[0]['file']).read_bytes() + b'changed')
            with self.assertRaisesRegex(ValueError, 'WORKBOOK_DRIFT'):
                commuter.parse_book(commuter.BOOKS[0], file)


if __name__ == '__main__':
    unittest.main()
