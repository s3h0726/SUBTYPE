"""Strict snapshot boundaries and honest terminal-platform semantics."""
import importlib.util
import unittest
import sys
sys.dont_write_bytecode = True
from pathlib import Path

spec = importlib.util.spec_from_file_location('platforms', Path(__file__).with_name('import-kr-platforms.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class PlatformsTest(unittest.TestCase):
    def test_all_pinned_snapshots(self):
        self.assertEqual([len(p.parse_snapshot((p.BASE / c['path']).read_bytes(), c)) for c in p.SNAPSHOTS], [96, 101, 34])
    def test_mutated_snapshot_rejected(self):
        c = p.SNAPSHOTS[1]
        with self.assertRaisesRegex(ValueError, 'SNAPSHOT_DRIFT'):
            p.parse_snapshot((p.BASE / c['path']).read_bytes() + b'changed', c)
    def test_wrong_line_or_count_rejected(self):
        c = p.SNAPSHOTS[2]
        for change in [dict(rows=33), dict(line='4호선')]:
            with self.assertRaisesRegex(ValueError, 'CONTENT_DRIFT'):
                p.parse_snapshot((p.BASE / c['path']).read_bytes(), dict(c, **change))

if __name__ == '__main__':
    unittest.main()
