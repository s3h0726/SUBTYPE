"""Import published platform facts without assigning OSM tracks or approving services."""
import csv
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / 'data/kr/v2'
RELATIVE = 'source/platforms/kr-line4-platforms-20260630.csv'
SOURCE_ID = 'kr-line4-platforms-20260630'


def write(name, value):
    (BASE / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    raw = (BASE / RELATIVE).read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != '9815302ab9df23fb13570a78d8799e28f73bdb534ec46f3bf64355e3ac70a66c':
        raise ValueError('OFFICIAL_PLATFORM_SNAPSHOT_DRIFT_REQUIRES_REVIEW')
    reader = csv.DictReader(raw.decode('cp949').splitlines())
    expected = ['철도운영기관명', '선명', '역명', '승강장번호', '상하행', '지상구분', '역층', '승강장연결 여부', '스크린도어 유무', '안전발판 유무']
    if reader.fieldnames != expected:
        raise ValueError('OFFICIAL_PLATFORM_SCHEMA_DRIFT')
    rows = list(reader)
    if len(rows) != 96 or any(r['선명'] != '4호선' or r['상하행'] not in ['상행', '하행'] for r in rows):
        raise ValueError('OFFICIAL_PLATFORM_CONTENT_DRIFT')
    references = []
    for line, row in enumerate(rows, 2):
        references.append({'id': f'{SOURCE_ID}-row-{line}', 'sourceId': SOURCE_ID, 'sourceRow': line,
                           'sourceFileSha256': sha, 'operatorName': row['철도운영기관명'],
                           'lineName': row['선명'], 'stationName': row['역명'],
                           'platformCode': row['승강장번호'], 'directionId': 'UP' if row['상하행'] == '상행' else 'DOWN',
                           'original': row, 'status': 'reference',
                           'scope': 'Published platform facts only; no OSM track binding or release approval'})
    write('official-platform-reference', references)
    sources = json.loads((BASE / 'supplemental-sources.json').read_text(encoding='utf-8'))
    entry = {'id': SOURCE_ID, 'kind': 'official-platforms', 'publisher': '국가철도공단',
             'url': 'https://www.data.go.kr/data/15041194/fileData.do',
             'downloadUrl': 'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000007709410&fileDetailSn=1&insertDataPrcus=N',
             'dataReferenceDate': '2026-06-30', 'retrievedOn': '2026-10-18',
             'license': '이용허락범위 제한 없음', 'licenseStatus': 'verified',
             'sha256': sha, 'bytes': len(raw), 'encoding': 'cp949', 'rows': len(rows),
             'filePaths': [RELATIVE], 'scope': 'Platform number and published direction; terminal turnback movements and track geometries are not provided'}
    sources = [entry if s['id'] == SOURCE_ID else s for s in sources] + (
        [] if any(s['id'] == SOURCE_ID for s in sources) else [entry])
    write('supplemental-sources', sources)
    print(json.dumps({'platformRows': len(references), 'sha256': sha, 'releaseApproved': 0}))


if __name__ == '__main__':
    main()
