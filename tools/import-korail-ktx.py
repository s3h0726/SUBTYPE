"""Preserve actual KTX train rows, zero-as-no-call cells and published notes."""
import hashlib
import json
import re
import zipfile
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parents[1] / 'data/kr/v2'
FILE = 'source/korail/ktx-timetable-20260515.xlsx'
SHA = 'd49c68ac1245baaba42b8adfab4d67c0ea98b2bc2af3bb6b58f0da2c2d5e6c11'
SOURCE = 'korail-ktx-20260515'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def column(name):
    n = 0
    for c in name:
        n = n * 26 + ord(c) - 64
    return n


def colname(n):
    out = ''
    while n:
        n, r = divmod(n - 1, 26)
        out = chr(65 + r) + out
    return out


def clock(value):
    if value is None or value.strip() in ('', '0'):
        return None  # This workbook explicitly uses zero for no call.
    if not re.fullmatch(r'\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?', value):
        raise ValueError('UNKNOWN_KTX_TIME:' + value)
    if Decimal(value) == 0:
        return None
    seconds = int((Decimal(value) * 86400).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    if not 0 < seconds < 172800:
        raise ValueError('INVALID_KTX_TIME')
    return f'{seconds // 3600:02}:{seconds // 60 % 60:02}:{seconds % 60:02}'


def extract():
    if hashlib.sha256((BASE / FILE).read_bytes()).hexdigest() != SHA:
        raise ValueError('KTX_WORKBOOK_DRIFT')
    trains = []
    with zipfile.ZipFile(BASE / FILE) as z:
        strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        targets = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        for sheet in workbook.find('s:sheets', NS):
            # The first recovery uses the complete two published Gyeongbu tables.
            # Other sheets remain in the pinned original for separate review.
            if sheet.attrib['name'] != '경부선':
                continue
            target = targets[sheet.attrib['{' + REL + '}id']]
            target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            cells = {}
            for c in ET.fromstring(z.read(target)).findall('.//s:sheetData/s:row/s:c', NS):
                v = c.find('s:v', NS)
                if v is not None:
                    cells[c.attrib['r']] = strings[int(v.text)] if c.attrib.get('t') == 's' else v.text
            maxrow = max(int(re.search(r'\d+', k)[0]) for k in cells)
            for traincol, first, last, notecol, direction in [('B', 'D', 'X', 'Y', 'DOWN'), ('AA', 'AC', 'AW', 'AX', 'UP')]:
                if cells.get(traincol + '8') != '열차번호' or not cells.get(notecol + '8', '').startswith('비고'):
                    raise ValueError('KTX_HEADER_DRIFT')
                cols = [colname(i) for i in range(column(first), column(last) + 1)]
                for row in range(11, maxrow + 1):
                    number = cells.get(f'{traincol}{row}', '')
                    kindcol = colname(column(traincol) + 1)
                    kind = cells.get(f'{kindcol}{row}', '')
                    if not number.isdigit() or not kind.startswith(('KTX', 'SRT')):
                        continue
                    calls = []
                    previous = -1
                    for col in cols:
                        at = clock(cells.get(f'{col}{row}'))
                        if at is None:
                            continue
                        seconds = sum(v * m for v, m in zip(map(int, at.split(':')), [3600, 60, 1]))
                        if seconds < previous:
                            if previous >= 20 * 3600 and seconds < 5 * 3600:
                                seconds += 86400
                                at = f'{seconds//3600:02}:{seconds//60%60:02}:{seconds%60:02}'
                            else:
                                raise ValueError('KTX_CLOCK_ORDER:' + number)
                        if seconds < previous:
                            raise ValueError('KTX_CLOCK_ORDER_AFTER_MIDNIGHT:' + number)
                        previous = seconds
                        calls.append(dict(stationName=cells[col + '8'], time=at, sourceCell=f'{col}{row}', stationCell=col + '8'))
                    if len(calls) < 2:
                        raise ValueError('INCOMPLETE_KTX_TRAIN:' + number)
                    trains.append(dict(id=f'{SOURCE}-gyeongbu-{direction}-{number}', sourceId=SOURCE, sheet='경부선', trainNumber=number,
                        trainBrand=kind, publishedDirection=direction, origin=calls[0]['stationName'], destination=calls[-1]['stationName'],
                        calls=calls, operatingDayNote=cells.get(f'{notecol}{row}'), operatingDayCell=f'{notecol}{row}',
                        calendarExceptionsVerified=False, platformDirectionVerified=False, releaseApproved=False))
    if len({t['id'] for t in trains}) != len(trains):
        raise ValueError('DUPLICATE_KTX_TRAIN')
    return trains


def main():
    trains = extract()
    write = lambda name, value: (BASE / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    write('korail-ktx-research', dict(sourceId=SOURCE, reviewedOn='2026-10-18', scope='Full Gyeongbu published train rows and literal operating-day notes only; other sheets, platforms, exceptional dates and release remain unverified.', trains=trains))
    sources = json.loads((BASE / 'supplemental-sources.json').read_text(encoding='utf-8'))
    entry = dict(id=SOURCE, kind='official-timetable', publisher='한국철도공사', title='KTX 시간표(2026.5.15.기준)', postId=24281,
        url='https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable',
        downloadUrl='https://www.korail.com/file/cubedata/COMMON/jfile/202604/24/2026042419dbe8dce18380.xlsx',
        validFrom='2026-05-15', dataReferenceDate='2026-05-15', retrievedOn='2026-10-18', sha256=SHA,
        license='Reuse permission not established', licenseStatus='unverified', filePaths=[FILE],
        scope='Current applicable source; future November timetable is not applied. No release approval.')
    sources = [entry if s['id'] == SOURCE else s for s in sources] + ([] if any(s['id'] == SOURCE for s in sources) else [entry])
    write('supplemental-sources', sources)
    print(json.dumps(dict(publishedGyeongbuTrains=len(trains), fourCallSeoulBusan=[t['trainNumber'] for t in trains if [c['stationName'] for c in t['calls']] == ['서울', '대전', '동대구', '부산']])))


if __name__ == '__main__':
    main()
