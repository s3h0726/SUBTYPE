"""Read pinned Korail commuter workbooks without inferring stops from pass clocks.

These are source observations, not release-approved trips. A numeric clock on
the second row of a blank arrival is a passage, except at the published origin.
Keep operational abbreviations verbatim until separate station identity review.
"""
import hashlib
import json
import re
import zipfile
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parents[1] / 'data/kr/v2'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
BOOKS = [
    dict(id='korail-suin-bundang-20260822', file='source/korail/suin-bundang-timetable-20260822.xlsx',
         sha256='44543f0280afb17acbcdb12aefcd40ec79ff28fc28b6c1e1f80d9743ee3d14d0',
         url='https://www.korail.com/file/cubedata/COMMON/jfile/202608/21/202608211a02345f4b6660.xlsx',
         title='수인분당선 전동열차 시각표(2026.8.22.부터)', postId=25702, validFrom='2026-08-22',
         sheets=['평일상행', '평일하행', '휴일상행', '휴일하행'], first=5, last=129),
    dict(id='korail-daegyeong-20260901', file='source/korail/daegyeong-timetable-20260901.xlsx',
         sha256='c28dcdcc504edf22db4267434ba3c8743ec275c997d976ccd3b6063df903187e',
         url='https://www.korail.com/file/cubedata/COMMON/jfile/202608/28/202608281a045c8597c240.xlsx',
         title='대경선 전동열차 시각표(2026.9.1.부터)', postId=25748, validFrom='2026-09-01',
         sheets=['평일_상', '평일_하', '휴일_상', '휴일_하'], first=5, last=31),
]


def clock(value):
    if value is None or not str(value).strip():
        return None
    if not re.fullmatch(r'\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?', value):
        raise ValueError('UNKNOWN_CLOCK_NOTATION:' + value)
    seconds = int((Decimal(value) * 86400).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    if not 0 <= seconds < 172800:
        raise ValueError('UNREVIEWED_CLOCK_RANGE')
    return f'{seconds // 3600:02}:{seconds // 60 % 60:02}:{seconds % 60:02}'


def parse_book(config, file=None):
    file = file or BASE / config['file']
    if hashlib.sha256(file.read_bytes()).hexdigest() != config['sha256']:
        raise ValueError('COMMUTER_WORKBOOK_DRIFT')
    trains = []
    with zipfile.ZipFile(file) as z:
        shared = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        targets = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = workbook.find('s:sheets', NS)
        if [s.attrib['name'] for s in sheets] != config['sheets']:
            raise ValueError('COMMUTER_SHEET_DRIFT')
        for si, sheet in enumerate(sheets):
            target = targets[sheet.attrib['{' + REL + '}id']]
            target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            cells = {}
            for c in ET.fromstring(z.read(target)).findall('.//s:sheetData/s:row/s:c', NS):
                v = c.find('s:v', NS)
                if v is not None:
                    cells[c.attrib['r']] = shared[int(v.text)] if c.attrib.get('t') == 's' else v.text
            if [cells.get(f'A{r}') for r in (2, 3, 4)] != ['시발역', '종착역', '열차번호']:
                raise ValueError('COMMUTER_HEADER_DRIFT')
            station_rows = [(r, cells.get(f'A{r}', '').strip()) for r in range(config['first'], config['last'] + 1, 2)]
            if not all(n for _, n in station_rows) or len(set(n for _, n in station_rows)) != len(station_rows):
                raise ValueError('COMMUTER_STATION_ROWS_DRIFT')
            columns = [(k[:-1], v.strip()) for k, v in cells.items() if re.fullmatch(r'[A-Z]+4', k) and re.fullmatch(r'K\d+', v.strip())]
            if not columns:
                raise ValueError('MISSING_TRAIN_COLUMNS')
            for col, number in columns:
                origin, destination = cells[col + '2'].strip(), cells[col + '3'].strip()
                calls, passages = [], []
                for row, name in station_rows:
                    arrival, departure = clock(cells.get(f'{col}{row}')), clock(cells.get(f'{col}{row+1}'))
                    if arrival is None and departure is None:
                        continue
                    event = dict(operationalStationName=name, arrival=arrival, departure=departure,
                                 stationCell=f'A{row}', arrivalCell=f'{col}{row}', departureCell=f'{col}{row+1}')
                    (calls if arrival is not None or name == origin else passages).append(event)
                if not calls or calls[0]['operationalStationName'] != origin or calls[-1]['operationalStationName'] != destination:
                    raise ValueError('COMMUTER_FULL_ENDPOINT_MISMATCH:' + number)
                # Excel fractional times roll over midnight. Preserve a day offset
                # only for the late-night -> early-morning transition.
                previous = -1
                for event in sorted(calls + passages, key=lambda e: int(re.search(r'\d+', e['arrivalCell'])[0])):
                    for key in ('arrival', 'departure'):
                        if event[key] is None:
                            continue
                        h, m, s = map(int, event[key].split(':'))
                        seconds = h * 3600 + m * 60 + s
                        if seconds < previous:
                            if previous >= 20 * 3600 and seconds < 5 * 3600:
                                seconds += 86400
                            else:
                                raise ValueError('COMMUTER_CLOCK_ORDER:' + number)
                        if seconds < previous:
                            raise ValueError('COMMUTER_CLOCK_ORDER_AFTER_MIDNIGHT:' + number)
                        event[key] = f'{seconds//3600:02}:{seconds//60%60:02}:{seconds%60:02}'
                        previous = seconds
                trains.append(dict(id=f"{config['id']}-{si}-{number}", sourceId=config['id'], sheet=sheet.attrib['name'],
                    trainNumber=number, sourceColumn=col, originOperationalName=origin, destinationOperationalName=destination,
                    calendarGroup='WEEKDAY' if si < 2 else 'HOLIDAY', publishedDirection='UP' if si % 2 == 0 else 'DOWN',
                    calls=calls, passages=passages, calendarExceptionsVerified=False, stationIdentityVerified=False,
                    platformDirectionVerified=False, releaseApproved=False))
    if len({t['id'] for t in trains}) != len(trains):
        raise ValueError('DUPLICATE_SOURCE_TRAIN')
    return trains


def main():
    trains = [t for b in BOOKS for t in parse_book(b)]
    result = dict(reviewedOn='2026-10-18', status='research',
        scope='Published train columns, operational station labels, stop/pass clocks and weekday/holiday tables only. No station alias, platform, exceptional date, license or release approval.', trains=trains)
    (BASE / 'korail-commuter-research.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    sources = json.loads((BASE / 'supplemental-sources.json').read_text(encoding='utf-8'))
    for b in BOOKS:
        source = dict(id=b['id'], kind='official-timetable', publisher='한국철도공사', title=b['title'], postId=b['postId'],
            url='https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable', downloadUrl=b['url'],
            validFrom=b['validFrom'], dataReferenceDate=b['validFrom'], retrievedOn='2026-10-18', sha256=b['sha256'],
            license='Reuse permission not established', licenseStatus='unverified', filePaths=[b['file']],
            scope='Pinned official train-column observations; operational abbreviations, date exceptions and final release remain unverified.')
        sources = [source if s['id'] == source['id'] else s for s in sources] + ([] if any(s['id'] == source['id'] for s in sources) else [source])
    (BASE / 'supplemental-sources.json').write_text(json.dumps(sources, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps({b['id']: sum(t['sourceId'] == b['id'] for t in trains) for b in BOOKS}))


if __name__ == '__main__':
    main()
