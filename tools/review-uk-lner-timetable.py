"""Match OSM calls to complete train columns in the official May 2026 PDF.

Run with pdfplumber installed. The PDF is a local research input, not redistributed.
Station labels are separate from arrival/departure suffixes and duplicate calls
are collapsed only when adjacent. No missing timetable cell becomes a call.
"""
import json, re, sys, hashlib
from pathlib import Path
import pdfplumber

pdf_path, candidates_path, output_path = map(Path, sys.argv[1:])
candidates = [r for r in json.loads(candidates_path.read_text(encoding='utf-8'))
              if r.get('operator') == 'London North Eastern Railway' and r.get('calls') and all(r['calls'])]
trains = []
with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        text = page.extract_text() or ''
        if not ('NORTHBOUND' in text or 'SOUTHBOUND' in text):
            continue
        rows = {}
        for word in page.extract_words():
            rows.setdefault(round(word['top'], 1), []).append(word)
        cols = [[] for _ in range(8)]
        for y, words in sorted(rows.items()):
            label = ' '.join(w['text'] for w in words if w['x0'] < 70)
            if not label or not 30 < y < 465:
                continue
            for word in words:
                if word['x0'] < 85 or not re.fullmatch(r'\d{4}[su]?', word['text']):
                    continue
                col = round((word['x0'] - 89.8) / 19.8)
                if 0 <= col < 8 and (not cols[col] or cols[col][-1] != label):
                    cols[col].append(label)
        trains.extend({'page':page_num+1, 'column':col+1, 'calls':calls}
                      for col,calls in enumerate(cols) if len(calls)>1)
def normalize(name):
    return re.sub(r'[^a-z0-9]', '', name.lower().replace('newcastle central','newcastle'))
matches=[]
for route in candidates:
    calls = list(map(normalize, route['calls']))
    found = [t for t in trains if list(map(normalize,t['calls'])) == calls]
    matches.append({'relationId':route['id'],'calls':route['calls'],
                    'status':'PASS' if found else 'BLOCKED',
                    'trainColumns':[{'page':t['page'],'column':t['column']} for t in found]})
report={'checkedAt':'2026-11-10','sourceUrl':'https://assets.ctfassets.net/mxack5k9p2sw/7jQOjS38muWdVQbPCRGxyV/809f4c4fe0a29fcd38233147ab0f48ac/LNER_May-Dec_2026_Timetable_Guide_Web.pdf',
        'pdfSha256':hashlib.sha256(pdf_path.read_bytes()).hexdigest(),'matches':matches,
        'stoppingPatterns':list({tuple(t['calls']):t for t in trains}.values())}
output_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps([(r['relationId'],r['status'],r['trainColumns'][:2]) for r in matches]))


