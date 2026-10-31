"""Read the official PDF's spot-colour RGB alternates; requires pypdf.

Line associations were visually reviewed against the PDF legend on 2026-10-20.
This records source colour facts, not a licence to copy operator artwork.
"""
import hashlib
import json
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/hk/sources/phase2/mtr-map.pdf'
spaces = PdfReader(SOURCE).pages[0]['/Resources']['/ColorSpace']
lookup = {v.get_object()[1]: v.get_object() for v in spaces.values()
          if isinstance(v.get_object(), list) and len(v.get_object()) > 3}
mapping = {'ISL': '285', 'TWL': '485', 'KTL': '354', 'SIL': '390',
           'TCL': '144', 'EAL': '2915', 'TML': '174', 'TKL': '2583',
           'AEL': '322', 'DRL': '2375'}
result = {
    'checkedAt': '2026-10-20',
    'sourceUrl': 'https://www.mtr.com.hk/archive/en/services/routemap.pdf',
    'sourceFile': SOURCE.relative_to(ROOT).as_posix(),
    'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'review': 'Line-to-colour association checked against the rendered official map and legend. Hex values are the PDF spot colour DeviceRGB alternate at full tint, not a claim about an independent web brand standard.',
    'lines': {},
}
for code, pantone in mapping.items():
    name = '/PANTONE ' + pantone + ' C'
    rgb = [float(x) for x in lookup[name][3].get_object()['/C1']]
    result['lines'][code] = {'spotName': name[1:], 'alternateRgb': rgb,
                             'hex': '#' + ''.join(f'{round(x * 255):02x}' for x in rgb),
                             'status': 'verified'}
(ROOT / 'data/hk/master/line-colors.json').write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
