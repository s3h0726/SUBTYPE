"""Extract pinned published Seohae train columns using only the Python stdlib.

Keep full origins/termini, repeated Hongseong calls, source cell addresses and
contradictory summary clocks. Never turn an intermediate leg into a service.
"""
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

BASE = Path(__file__).resolve().parents[1] / 'data/kr/v2'
FILE = 'source/korail/conventional-timetable-20260901.xlsx'
SOURCE = 'korail-conventional-20260901'
SHA = '2c1531ebce6ffd9aa18f51cc91d8fe4bffd7d95093dc970e21f5cc1964d3b61d'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def write(name, value):
    (BASE / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def clock(value):
    if value in (None, '', '0'):
        return None
    seconds = int((Decimal(value) * 86400).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    if not 0 < seconds < 86400:
        raise ValueError('UNREVIEWED_KORAIL_CLOCK')
    return f'{seconds // 3600:02}:{seconds // 60 % 60:02}:{seconds % 60:02}'


def main():
    raw = (BASE / FILE).read_bytes()
    if hashlib.sha256(raw).hexdigest() != SHA:
        raise ValueError('KORAIL_WORKBOOK_DRIFT_REQUIRES_REVIEW')
    with zipfile.ZipFile(BASE / FILE) as z:
        shared = [''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        sheet = next(s for s in workbook.find('s:sheets', NS) if s.attrib['name'] == '서해선')
        relations = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target = next(r.attrib['Target'] for r in relations if r.attrib['Id'] == sheet.attrib['{' + REL + '}id'])
        xmlpath = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        cells = {}
        for c in ET.fromstring(z.read(xmlpath)).findall('.//s:sheetData/s:row/s:c', NS):
            value = c.find('s:v', NS)
            if value is not None:
                text = value.text
                cells[c.attrib['r']] = shared[int(text)] if c.attrib.get('t') == 's' else text
    if cells.get('A1') != '서해선 하행' or cells.get('M1') != '서해선 상행':
        raise ValueError('KORAIL_SHEET_SCHEMA_DRIFT')
    trains = []
    for label, station_col, columns in [('DOWN', 'A', 'BCDEFGH'), ('UP', 'M', 'NOPQRST')]:
        for col in columns:
            number = cells.get(col + '9')
            if not number or cells.get(col + '8') != 'ITX-마음':
                raise ValueError('KORAIL_TRAIN_HEADER_DRIFT')
            calls = []
            for row in range(10, 25):
                at = clock(cells.get(f'{col}{row}'))
                if not at:
                    continue
                original_name = cells[f'{station_col}{row}']
                name = {'홍성(출발)': '홍성', '홍성(도착)': '홍성'}.get(original_name, original_name)
                calls.append({'stationName': name, 'time': at, 'sourceCell': f'{col}{row}', 'stationNameCell': f'{station_col}{row}', 'originalStationLabel': original_name})
            origin, destination = cells[col + '4'], cells[col + '26']
            if calls[0]['stationName'] != origin or calls[-1]['stationName'] != destination:
                raise ValueError('KORAIL_FULL_TRIP_ENDPOINT_DRIFT')
            if any(a['time'] > b['time'] for a, b in zip(calls, calls[1:])):
                raise ValueError('KORAIL_CALL_CLOCK_ORDER')
            summary = {'origin': clock(cells[col + '7']), 'destination': clock(cells[col + '29'])}
            issues = [] if summary['origin'] == calls[0]['time'] and summary['destination'] == calls[-1]['time'] else ['PUBLISHED_SUMMARY_AND_CALL_CLOCK_DISAGREE']
            trains.append({'id': f'{SOURCE}-seohae-{number}', 'sourceId': SOURCE, 'sheet': '서해선', 'trainNumber': number,
                           'trainType': 'ITX-마음', 'publishedTableDirection': label, 'origin': origin, 'destination': destination,
                           'calls': calls, 'publishedSummaryClocks': summary, 'calendarNote': cells.get(col + '25'),
                           'operatingDaysVerified': False, 'issues': issues, 'status': 'research', 'releaseApproved': False})
    legs = [t for t in trains if any(a['stationName'] == '평택' and b['stationName'] == '안중' for a, b in zip(t['calls'], t['calls'][1:]))]
    complete = [t for t in trains if [c['stationName'] for c in t['calls']] == ['평택', '안중']]
    if len(trains) != 14 or [t['trainNumber'] for t in legs] != ['1242', '1244', '1246'] or complete:
        raise ValueError('KORAIL_PARTIAL_SERVICE_REVIEW_DRIFT')
    write('korail-seohae-pattern-research', {'sourceId': SOURCE, 'dataReferenceDate': '2026-09-01', 'reviewedOn': '2026-10-18',
        'scope': 'Published full train columns and intermediate leg comparison only; calendars, notices, platform, direction and release remain unverified',
        'trains': trains, 'relationReviews': [{'relationId': '20500839', 'status': 'INTERMEDIATE_LEG_ONLY_IN_REVIEWED_OFFICIAL_SOURCE',
          'matchedLegTrainNumbers': [t['trainNumber'] for t in legs], 'matchedCompleteTrainNumbers': [],
          'actualEndpoints': [{'trainNumber': t['trainNumber'], 'origin': t['origin'], 'destination': t['destination']} for t in legs],
          'decision': 'Quarantine the two-stop candidate as a standalone service. Retain actual track repair separately; never invent a Pyeongtaek-origin train.'}]})
    sources = json.loads((BASE / 'supplemental-sources.json').read_text(encoding='utf-8'))
    entry = {'id': SOURCE, 'kind': 'official-timetable', 'publisher': '한국철도공사',
             'url': 'https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable', 'postId': 25324,
             'title': '일반열차 시간표(2026. 9. 1. 기준)',
             'downloadUrl': 'https://www.korail.com/file/cubedata/COMMON/jfile/202608/25/202608251a036890aa0430.xlsx',
             'validFrom': '2026-09-01', 'dataReferenceDate': '2026-09-01', 'retrievedOn': '2026-10-18',
             'sha256': SHA, 'license': 'Reuse permission not established', 'licenseStatus': 'unverified', 'filePaths': [FILE],
             'scope': 'Current-date source research. Future 2026-11-01 timetable is not adopted for 2026-10-18. Full release verification is pending.'}
    sources = [entry if s['id'] == SOURCE else s for s in sources] + ([] if any(s['id'] == SOURCE for s in sources) else [entry])
    write('supplemental-sources', sources)
    print(json.dumps({'officialTrainColumns': len(trains), 'matchedIntermediateLegs': len(legs), 'matchedStandaloneServices': len(complete), 'releaseApproved': 0}))


if __name__ == '__main__':
    main()
