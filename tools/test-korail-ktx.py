import importlib.util
from pathlib import Path
import sys
import unittest
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('ktx', Path(__file__).with_name('import-korail-ktx.py'))
ktx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ktx)


class OfficialKtxTests(unittest.TestCase):
    def test_complete_published_four_call_trains_and_real_day_notes(self):
        trains = ktx.extract()
        self.assertEqual(len(trains), 141)
        four = [t for t in trains if [c['stationName'] for c in t['calls']] == ['서울', '대전', '동대구', '부산']]
        self.assertEqual([(t['trainNumber'], t['operatingDayNote']) for t in four], [('43', '월화수목'), ('181', '금토일')])
        for t in four:
            self.assertFalse(t['releaseApproved'])
            self.assertTrue(all(c['sourceCell'] and c['stationCell'] for c in t['calls']))
            self.assertEqual(sorted(c['time'] for c in t['calls']), [c['time'] for c in t['calls']])
        via_suwon = next(t for t in trains if t['trainNumber'] == '171' and t['publishedDirection'] == 'DOWN')
        self.assertIn('수원', [c['stationName'] for c in via_suwon['calls']])
        self.assertNotIn(via_suwon, four)

    def test_zero_is_a_nonstop_sentinel_in_this_workbook(self):
        self.assertIsNone(ktx.clock('0'))
        self.assertIsNone(ktx.clock('0.0'))
        self.assertIsNone(ktx.clock('        '))
        self.assertEqual(ktx.clock('0.5'), '12:00:00')
        for bad in ['통과', '-1', '2']:
            with self.assertRaises(ValueError):
                ktx.clock(bad)


if __name__ == '__main__':
    unittest.main()
