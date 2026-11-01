"""Extract station-name facts; retain PDF page and original orthography."""
import json, re, hashlib, unicodedata
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parent.parent
pdf = root / 'tmp/pdfs/jr-west-station-names.pdf'
target = root / 'data/source-audit/japan-official-names-20261101.json'
source = 'https://www.westjr.co.jp/global/en/howto/train-reservation/condition/station/Station_name.pdf'
data = json.loads(target.read_text(encoding='utf-8'))
data['facts'] = [f for f in data['facts'] if f.get('listSource') != source]
rows = []
all_names = []
radicals = str.maketrans({'⻑': '長', '⻄': '西', '⻘': '青', '⻲': '亀'})
for page_index, page in enumerate(PdfReader(pdf).pages):
    for line in page.extract_text().splitlines():
        match = re.match(r'^\s*(\d+)\s*([^A-Za-z]+?)\s+([A-Za-z].+?)\s*$', line)
        if not match:
            continue
        number, original_ja, en = match.groups()
        ja = unicodedata.normalize('NFKC', original_ja).translate(radicals).replace(' ', '')
        all_names.append(re.sub(r'\([^)]*\)', '', ja))
        # Search-system qualifiers and ambiguous names require another source.
        if '(' in ja or '(' in en:
            continue
        if len(en.split()) > 2 and all(len(t) == 1 for t in en.split()):
            en = ''.join(en.split())
        if re.search(r'\b[A-Za-z] [A-Za-z] [A-Za-z]\b', en):
            continue
        rows.append({'operatorScope': ['jr-hokkaido', 'jr-east', 'jr-central', 'jr-west', 'jr-shikoku', 'jr-kyushu'], 'ja': ja, 'en': en, 'originalJapaneseInPdf': original_ja, 'source': source + '#page=' + str(page_index + 1), 'listSource': source, 'pdfRow': int(number), 'pdfPage': page_index + 1})
from collections import Counter
ambiguous = {name for name, count in Counter(all_names).items() if count > 1}
rows = [row for row in rows if row['ja'] not in ambiguous]
data['ambiguousPdfJapaneseNames'] = sorted(ambiguous)
data['pages'] = [p for p in data['pages'] if p['url'] != source]
data['pages'].append({'url': source, 'retrievedDate': '2026-11-01', 'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(), 'pages': 81})
data['facts'].extend(rows)
target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pdfRowsAccepted': len(rows), 'officialFacts': len(data['facts'])}))
