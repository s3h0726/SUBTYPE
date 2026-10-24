"""Extract every published train row, never synthesize endpoint combinations.
Pinned official XLSX bytes; standard library only. Zero timetable cells mean
no published call, not proof that the train physically passes that station.
"""
import hashlib
import json
import re
import zipfile
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parents[1] / 'data/kr/v2'
FILE = 'source/phase6/ktx-20260901.xlsx'
SHA = 'cf69ea35e0b6ad9fb82c0e0b44f60833e34eadab55ea610eaf6784622351e9d0'
SOURCE = 'korail-highspeed-20260901'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
SHEETS = ['경부선', '경전선', '동해선(서울~포항)', '호남선', '전라선', '동해선(부전-강릉)', '강릉선', '중앙선', '중부내륙선']
DAYS = dict(zip('월화수목금토일', ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']))


def col(n):
    value = ''
    while n:
        n, r = divmod(n - 1, 26)
        value = chr(65 + r) + value
    return value


def calendar(note):
    if note == '매일':
        return list(DAYS.values())
    if note and re.fullmatch('[월화수목금토일]+', note) and len(set(note)) == len(note):
        return [DAYS[d] for d in note]
    return None


def clock(value):
    if value is None or value == '' or Decimal(value) == 0:
        return None
    seconds = int((Decimal(value) * 86400).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    if not 0 < seconds < 86400:
        raise ValueError('UNREVIEWED_HIGH_SPEED_CLOCK:' + str(value))
    return seconds


def read_sheets(file):
    with zipfile.ZipFile(file) as z:
        strings = [''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        for s in ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', NS):
            target = rels[s.attrib['{' + REL + '}id']]
            target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            cells = {}
            for c in ET.fromstring(z.read(target)).findall('.//s:sheetData/s:row/s:c', NS):
                v = c.find('s:v', NS)
                if v is not None:
                    value = strings[int(v.text)] if c.attrib.get('t') == 's' else v.text
                    cells[c.attrib['r']] = value
            yield s.attrib['name'], cells


def extract(file):
    if hashlib.sha256(Path(file).read_bytes()).hexdigest() != SHA:
        raise ValueError('HIGH_SPEED_SOURCE_HASH_DRIFT')
    trains, sheets, sections = [], [], []
    for sheet, cells in read_sheets(file):
        sheets.append(sheet)
        headers = [a for a, v in cells.items() if v == '열차번호']
        if len(headers) != 2:
            raise ValueError('HIGH_SPEED_DIRECTION_TABLE_SCHEMA:' + sheet)
        for address in headers:
            letters, digits = re.fullmatch(r'([A-Z]+)([0-9]+)', address).groups()
            start = 0
            for letter in letters:
                start = start * 26 + ord(letter) - 64
            header = int(digits)
            if cells.get(col(start + 1) + digits) != '편성':
                raise ValueError('HIGH_SPEED_TRAIN_TYPE_HEADER')
            stop_columns = []
            for c in range(start + 2, start + 40):
                label = cells.get(col(c) + digits)
                if label and label.startswith('비고'):
                    note_column = c
                    break
                if not label:
                    raise ValueError('HIGH_SPEED_STATION_HEADER_GAP')
                stop_columns.append((c, label))
            else:
                raise ValueError('HIGH_SPEED_CALENDAR_HEADER_MISSING')
            title = cells.get(col(start) + str(header - 1), '')
            if ('하행' in title) == ('상행' in title):
                raise ValueError('HIGH_SPEED_DIRECTION_TITLE:' + title)
            direction = 'DOWN' if '하행' in title else 'UP'
            section_trains = []
            max_row = max(int(re.search('[0-9]+', a).group()) for a in cells)
            for row in range(header + 1, max_row + 1):
                number = cells.get(col(start) + str(row))
                if number is None:
                    continue
                if not re.fullmatch('[0-9]+', number):
                    raise ValueError('UNREVIEWED_HIGH_SPEED_TRAIN_NUMBER:' + number)
                kind = cells.get(col(start + 1) + str(row))
                if kind not in ['KTX', 'KTX-산천', 'KTX-이음', 'KTX-청룡']:
                    raise ValueError('UNREVIEWED_HIGH_SPEED_TRAIN_TYPE:' + str(kind))
                calls, noncalls, issues = [], [], []
                previous, offset = None, 0
                for c, name in stop_columns:
                    cell = col(c) + str(row)
                    raw = cells.get(cell)
                    seconds = clock(raw)
                    if seconds is None:
                        noncalls.append({'stationName': name, 'sourceCell': cell, 'raw': raw, 'meaning': 'NO_PUBLISHED_CALL_NOT_PROOF_OF_PHYSICAL_PASSING'})
                        continue
                    if previous is not None and seconds + offset < previous:
                        if offset == 0 and previous >= 18 * 3600 and seconds <= 6 * 3600 and seconds + 86400 - previous < 6 * 3600:
                            offset = 86400
                        else:
                            issues.append('UNREVIEWED_CALL_CLOCK_ORDER')
                    absolute = seconds + offset
                    calls.append({'stationName': name, 'time': f'{seconds // 3600:02}:{seconds // 60 % 60:02}:{seconds % 60:02}', 'dayOffset': offset // 86400, 'elapsedDaySeconds': absolute, 'sourceCell': cell, 'stationNameCell': col(c) + digits, 'raw': raw})
                    previous = absolute
                if len(calls) < 2:
                    raise ValueError('INCOMPLETE_HIGH_SPEED_TRAIN')
                note = cells.get(col(note_column) + str(row))
                days = calendar(note)
                if days is None:
                    issues.append('OPERATING_DAY_NOTE_REQUIRES_REVIEW')
                train = {'id': f'{SOURCE}-{len(trains)}', 'sourceId': SOURCE, 'sheet': sheet, 'tableTitle': title, 'publishedTableDirection': direction,
                    'trainNumber': number, 'trainType': kind, 'origin': calls[0]['stationName'], 'destination': calls[-1]['stationName'], 'calls': calls,
                    'noPublishedCalls': noncalls, 'calendarNote': note, 'weeklyDays': days, 'holidayExceptionsVerified': False,
                    'issues': issues, 'status': 'research', 'releaseApproved': False}
                trains.append(train)
                section_trains.append(train['id'])
            if not section_trains:
                raise ValueError('EMPTY_HIGH_SPEED_DIRECTION_TABLE')
            sections.append({'sheet': sheet, 'direction': direction, 'title': title, 'headerCell': address, 'trainRows': len(section_trains)})
    if sheets != SHEETS or len(sections) != 18:
        raise ValueError('HIGH_SPEED_WORKBOOK_SHEET_DRIFT')
    return trains, sections


def main():
    trains, sections = extract(BASE / FILE)
    patterns = {}
    for t in trains:
        key = json.dumps([t['sheet'], t['publishedTableDirection'], [c['stationName'] for c in t['calls']], t['calendarNote']], ensure_ascii=False)
        if key not in patterns:
            patterns[key] = {'id': f'{SOURCE}-pattern-{len(patterns)}', 'sheet': t['sheet'], 'direction': t['publishedTableDirection'], 'origin': t['origin'],
                'destination': t['destination'], 'stationNames': [c['stationName'] for c in t['calls']], 'calendarNote': t['calendarNote'], 'weeklyDays': t['weeklyDays'],
                'trainIds': [], 'trainTypes': [], 'releaseApproved': False}
        p = patterns[key]
        p['trainIds'].append(t['id'])
        if t['trainType'] not in p['trainTypes']:
            p['trainTypes'].append(t['trainType'])
    source = {'id': SOURCE, 'sourceUrl': 'https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable',
        'downloadUrl': 'https://www.korail.com/file/cubedata/COMMON/jfile/202608/25/202608251a036897009480.xlsx', 'sourceType': 'official-timetable',
        'effectiveDate': '2026-09-01', 'verifiedDate': '2026-10-24', 'sha256': SHA, 'file': FILE, 'publisher': '한국철도공사',
        'license': 'Reuse permission not established', 'confidence': 'SOURCE_BYTES_AND_EXTRACTION_ONLY', 'reviewStatus': 'CURRENTNESS_LICENSE_AND_RELEASE_REVIEW_PENDING', 'currentBoardEntryListed': False, 'subsequentNoticesAndCurrentnessVerified': False}
    supplements = json.loads((BASE / 'supplemental-sources.json').read_text(encoding='utf-8'))
    entry = {'id': SOURCE, 'kind': 'official-timetable', 'publisher': source['publisher'], 'title': 'KTX 시간표(2026. 9. 1. 기준) — 현행 게시 목록 재확인 필요',
        'url': source['sourceUrl'], 'downloadUrl': source['downloadUrl'], 'validFrom': source['effectiveDate'], 'effectiveDate': source['effectiveDate'],
        'verifiedDate': source['verifiedDate'], 'license': source['license'], 'licenseStatus': 'unverified', 'confidence': source['confidence'], 'reviewStatus': source['reviewStatus'],
        'filePaths': [FILE, 'source/phase6/korail-timetable-board-20261024.json'], 'scope': '621 published train rows only. The downloaded September KTX attachment is absent from the captured current board; November future data is not adopted. Currentness, exceptions, platform, geometry and release are NOT approved.'}
    supplements = [r for r in supplements if r['id'] != SOURCE] + [entry]
    (BASE / 'supplemental-sources.json').write_text(json.dumps(supplements, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    result = {'schemaVersion': 1, 'source': source, 'scope': 'Every published train row in 18 directional KTX tables; rolling stock is not a physical line. Zero cells do not establish pass-through stations; calendars exclude unreviewed holidays/notices.',
        'counts': {'trainRows': len(trains), 'patterns': len(patterns), 'directionTables': len(sections), 'trainsWithIssues': sum(bool(t['issues']) for t in trains), 'releasedServices': 0},
        'sections': sections, 'trains': trains, 'patterns': list(patterns.values())}
    (BASE / 'korail-highspeed-pattern-research.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps(result['counts']))


if __name__ == '__main__':
    main()
