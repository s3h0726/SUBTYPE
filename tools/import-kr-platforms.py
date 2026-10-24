"""Import pinned official platform facts; never infer OSM platform assignments."""
import csv
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'data/kr/v2'
SNAPSHOTS = [
    dict(id='kr-line4-platforms-20260630', path='source/platforms/kr-line4-platforms-20260630.csv', sha256='9815302ab9df23fb13570a78d8799e28f73bdb534ec46f3bf64355e3ac70a66c', rows=96, line='4호선', portal='15041194', attachment='FILE_000000007709410', retrieved='2026-10-18'),
    dict(id='kr-line2-platforms-20260630', path='source/phase7/line2-platforms.csv', sha256='f679bb1a25ac8a841d68f54d68fecc04d76e2e02f10f23c7d52970906a54fa68', rows=101, line='2호선', portal='15041195', attachment='FILE_000000007709406', retrieved='2026-10-25'),
    dict(id='kr-busan3-platforms-20260630', path='source/phase7/busan3-platforms.csv', sha256='d1b6fa2292a68a63a03340e2659518cc52d9987752a9ef4e8b00773d5867ea36', rows=34, line='3호선', portal='15041174', attachment='FILE_000000007709482', retrieved='2026-10-25')
]
FIELDS = ['철도운영기관명', '선명', '역명', '승강장번호', '상하행', '지상구분', '역층', '승강장연결 여부', '스크린도어 유무', '안전발판 유무']
DIRECTIONS = {'상행': 'UP', '하행': 'DOWN', '내선': 'IN', '외선': 'OUT'}


def parse_snapshot(raw, config):
    sha = hashlib.sha256(raw).hexdigest()
    if sha != config['sha256']:
        raise ValueError('OFFICIAL_PLATFORM_SNAPSHOT_DRIFT_REQUIRES_REVIEW')
    reader = csv.DictReader(raw.decode('cp949').splitlines())
    if reader.fieldnames != FIELDS:
        raise ValueError('OFFICIAL_PLATFORM_SCHEMA_DRIFT')
    rows = list(reader)
    if len(rows) != config['rows'] or any(r['선명'] != config['line'] or r['상하행'] not in DIRECTIONS or not r['역명'] or not r['승강장번호'] for r in rows):
        raise ValueError('OFFICIAL_PLATFORM_CONTENT_DRIFT')
    return [dict(id=f"{config['id']}-row-{line}", sourceId=config['id'], sourceRow=line, sourceFileSha256=sha,
                 operatorName=row['철도운영기관명'], lineName=row['선명'], stationName=row['역명'], platformCode=row['승강장번호'],
                 directionId=DIRECTIONS[row['상하행']], original=row, status='reference',
                 scope='Published platform facts only; no OSM track binding or release approval')
            for line, row in enumerate(rows, 2)]


def write(name, value):
    (BASE / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    references = []
    sources = json.loads((BASE / 'supplemental-sources.json').read_text(encoding='utf-8'))
    for c in SNAPSHOTS:
        raw = (BASE / c['path']).read_bytes()
        references.extend(parse_snapshot(raw, c))
        license_files = []
        if c['portal'] in ['15041195', '15041174']:
            evidence_path = 'source/phase7/data-go-' + c['portal'] + '.html'
            evidence = (BASE / evidence_path).read_bytes()
            expected = {'15041195': '644d1d708e903371fc2e4ae93ce1244b904964d20aef0145644f0f8ba4674807', '15041174': '95a5efc0747915d76769d195b2eca0f584b9be7889ab7f5364793b43e25bcc63'}[c['portal']]
            if hashlib.sha256(evidence).hexdigest() != expected or '이용허락범위 제한 없음' not in evidence.decode('utf-8'):
                raise ValueError('OFFICIAL_PLATFORM_LICENSE_EVIDENCE_DRIFT')
            license_files.append(evidence_path)
        entry = dict(id=c['id'], kind='official-platforms', publisher='국가철도공단',
                     url='https://www.data.go.kr/data/' + c['portal'] + '/fileData.do',
                     downloadUrl='https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=' + c['attachment'] + '&fileDetailSn=1&insertDataPrcus=N',
                     dataReferenceDate='2026-06-30', retrievedOn=c['retrieved'], license='이용허락범위 제한 없음', licenseStatus='verified',
                     sha256=c['sha256'], bytes=len(raw), encoding='cp949', rows=c['rows'], filePaths=[c['path']] + license_files,
                     scope='Published platform facts only; terminal turnbacks, OSM track binding and release approval are not provided')
        sources = [s for s in sources if s['id'] != c['id']] + [entry]
    write('official-platform-reference', references)
    write('supplemental-sources', sources)
    print(json.dumps(dict(platformRows=len(references), sources=len(SNAPSHOTS), releaseApproved=0)))


if __name__ == '__main__':
    main()
