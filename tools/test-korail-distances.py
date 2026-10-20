import json,unittest,tempfile,sys
sys.dont_write_bytecode=True
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
spec=spec_from_file_location('distances',Path(__file__).with_name('import-korail-distances.py'));m=module_from_spec(spec);spec.loader.exec_module(m)
class DistanceTests(unittest.TestCase):
    def test_source_cells_and_reproducibility(self):
        r=m.extract();self.assertEqual(r,json.loads((m.BASE/'official-distance-reference.json').read_text('utf-8')))
        self.assertEqual([x['cell'] for x in r['legs']],['R5','W22','AC27']);self.assertEqual(r['total']['km'],417.4)
        self.assertFalse(r['releaseApproved']);self.assertEqual(r['referenceDate'],'2024-09-01')
    def test_source_byte_drift(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d);p=base/m.BOOK;p.parent.mkdir(parents=True);p.write_bytes(b'altered')
            with self.assertRaisesRegex(ValueError,'DISTANCE_SOURCE_DRIFT'):m.extract(base)
if __name__=='__main__':unittest.main()
