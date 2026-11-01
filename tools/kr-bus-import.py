#!/usr/bin/env python3
"""Bulk Korean bus ingestion. Only source-bound complete road shapes may publish.

Run: python tools/kr-bus-import.py [--download] [--shapes source-shapes.json]
No credentials needed for the official Seoul and TS-BIS downloadable snapshots.
Shapes are independently sourced direction objects, never reversed or road-routed
from stop names. See tools/kr-bus-import.md for the attachment contract.
"""
import argparse, collections, csv, hashlib, json, math, re, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/kr/canonical'
SRC = OUT / 'bus-source'
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
CHECKED = '2026-10-30'
SEOUL_STOPS = 'https://data.seoul.go.kr/dataList/OA-1095/S/1/datasetView.do'
SEOUL_ROUTES = 'https://data.seoul.go.kr/dataList/OA-15066/F/1/datasetView.do'
NATION_ROUTES = 'https://www.data.go.kr/data/15105964/fileData.do'
NATION_STOPS = 'https://www.data.go.kr/data/15106249/fileData.do'

def write(name, value):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')

def fetch(url, target, body=None):
    request = urllib.request.Request(url, urllib.parse.urlencode(body).encode() if body else None,
                                     headers={'User-Agent': 'SUBTYPE-public-transport-import/2.0'})
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read()
    (SRC / target).write_bytes(data)
    return data

def download():
    SRC.mkdir(parents=True, exist_ok=True)
    for dataset, seq, infseq, target in [('OA-1095','58','2','seoul-stops-20260902.xlsx'),
                                        ('OA-15066','73','1','seoul-routes-20260902.xlsx')]:
        fetch('https://datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do?useCache=false',target,
              {'infId':dataset,'seq':seq,'infSeq':infseq,'seqNo':''})
    for dataset, detail, kind in [('15105964','795b124f-36e7-46d8-9a78-a5423b27b8e0','routes'),
                                  ('15106249','ca2b7ce1-24e7-4ab9-b5b9-e25c3f25cb95','stops')]:
        data = fetch('https://www.data.go.kr/tcs/dss/selectFileDataDownload.do',
                     f'nationwide-{kind}-download.json',
                     {'publicDataPk':dataset,'publicDataDetailPk':'uddi:'+detail,
                      'atchFileId':'','fileDetailSn':'1','publicDataTyCode':'PR0051'})
        meta = json.loads(data)
        if meta.get('status') is not True:
            raise ValueError(f'{dataset}: official download resolver failed')
        fetch('https://www.data.go.kr/cmm/cmm/fileDownload.do?'+urllib.parse.urlencode(
              {'atchFileId':meta['atchFileId'],'fileDetailSn':meta['fileDetailSn']}),
              f'nationwide-{kind}-official.csv')

def xlsx(name):
    with zipfile.ZipFile(SRC/name) as archive:
        strings = [''.join(si.itertext()) for si in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        rows = []
        for row in ET.fromstring(archive.read('xl/worksheets/sheet1.xml')).findall('.//m:row', NS):
            cells = {}
            for cell in row:
                column = 0
                for ch in re.match('[A-Z]+', cell.attrib['r'])[0]:
                    column = column*26 + ord(ch)-64
                value = cell.findtext('m:v', '', NS)
                cells[column-1] = strings[int(value)] if cell.attrib.get('t') == 's' and value else value
            rows.append([cells.get(i, '') for i in range(max(cells,default=-1)+1)])
        return rows

def csvrows(name):
    with (SRC/name).open(encoding='cp949', newline='') as handle:
        return list(csv.DictReader(handle))

def ko(value):
    return bool(re.search('[가-힣]', value or '')) and not re.search('[A-Za-z\u3040-\u30ff\u3400-\u9fff]', value or '')

def coord(lat, lon):
    return math.isfinite(lat) and math.isfinite(lon) and 32 <= lat <= 39.5 and 124 <= lon <= 132

def source(url, date, license):
    return {'url':url,'sourceDate':date,'retrievedAt':CHECKED,'license':license}

def ingest():
    errors, candidates, stops = [], [], {}
    metadata = collections.defaultdict(list)
    for row in xlsx('seoul-routes-20260902.xlsx')[1:]:
        if len(row) >= 5:
            metadata[row[1]].append({'operatorKo':row[0], 'categoryKo':row[2],
                                     'originKo':row[3], 'destinationKo':row[4]})
    sequences = collections.defaultdict(list)
    numbers = {}
    for row in xlsx('seoul-stops-20260902.xlsx')[1:]:
        try:
            rid, number, order, sid, ars, name, lng, lat = row[:8]
            stop = {'id':'kr-seoul-stop-'+sid,'sourceStopId':sid,'arsId':ars,
                    'ko':name,'latitude':float(lat),'longitude':float(lng)}
            if not coord(stop['latitude'],stop['longitude']) or not ko(name):
                raise ValueError('정류장 한국어 이름 또는 좌표 오류')
            stops[stop['id']] = stop
            sequences[rid].append({'sequence':int(order),'stopId':stop['id']})
            numbers[rid] = number
        except (ValueError, IndexError) as exc:
            errors.append({'source':'서울 노선별 정류소','row':row,'reason':str(exc)})
    for rid, sequence in sorted(sequences.items()):
        number = numbers[rid]
        meta = metadata.get(number, [])
        # An official number may have multiple operators. Retain all, rather than
        # selecting the first or creating a false single-operator identity.
        operators = sorted({item['operatorKo'] for item in meta if ko(item['operatorKo'])})
        categories = sorted({item['categoryKo'] for item in meta})
        candidates.append({'id':'kr-bus-seoul-'+rid,'sourceRouteId':rid,'routeNumber':number,
                           'line':{'ko':'서울 '+number+'번'},'regionId':'seoul','regionKo':'서울특별시',
                           'mode':'bus','operatorNamesKo':operators,'officialCategoriesKo':categories,
                           'stopSequence':sorted(sequence,key=lambda s:s['sequence']),
                           'directionStatus':'원본 순서 보존 · 회차·방향 분할 자료 대기',
                           'publicationStatus':'queued','blockers':['실제 도로 경로 미확보','방향별 운행·회차 근거 미확보'],
                           'sourceRefs':[source(SEOUL_STOPS,'2026-09-02','공공누리 제1유형'),
                                         source(SEOUL_ROUTES,'2026-09-02','공공누리 제1유형')]})
    national_stops = csvrows('nationwide-stops-official.csv')
    for row in national_stops:
        try:
            sid = row['정류소노드 아이디']
            stop = {'id':'kr-ts-bis-stop-'+sid,'sourceStopId':sid,'ko':row['정류소명'],
                    'latitude':float(row['위도']),'longitude':float(row['경도']),
                    'regionKo':row['지자체명'],'cityCode':row['지자체코드']}
            if not coord(stop['latitude'],stop['longitude']) or not ko(stop['ko']):
                raise ValueError('정류장 한국어 이름 또는 좌표 오류')
            stops[stop['id']] = stop
        except (ValueError, KeyError) as exc:
            errors.append({'source':'전국 정류소','row':row,'reason':str(exc)})
    for row in csvrows('nationwide-routes-official.csv'):
        rid, region, number = row['노선 아이디'],row['지자체명'],row['노선명']
        candidates.append({'id':'kr-bus-ts-bis-'+rid,'sourceRouteId':rid,'routeNumber':number,
                           'line':{'ko':region+' '+number+'번'},'regionId':'ts-bis-'+row['지자체코드'],
                           'regionKo':region,'cityCode':row['지자체코드'],'mode':'bus',
                           'origin':{'stopId':'kr-ts-bis-stop-'+row['기점노드 아이디'],'ko':row['기점정류장']},
                           'destination':{'stopId':'kr-ts-bis-stop-'+row['종점노드 아이디'],'ko':row['종점정류장']},
                           'operatorNamesKo':[],'stopSequence':[], 'publicationStatus':'queued',
                           'blockers':['방향별 전체 정류장 순서 미확보','실제 도로 경로 미확보','운영사·공식 분류 미확보','현재 운행 상태 미확인'],
                           'sourceRefs':[source(NATION_ROUTES,'2026-07-16','이용허락범위 제한 없음'),
                                         source(NATION_STOPS,'2026-07-16','이용허락범위 제한 없음')]})
    return candidates, stops, errors

def distance(a,b):
    return 111.195 * math.hypot(a[0]-b[0],(a[1]-b[1])*math.cos((a[0]+b[0])*math.pi/360))

def require(condition, reason='출판 검증 실패'):
    if not condition:
        raise ValueError(reason)

def attach(candidates, stops, shapes, errors):
    lookup = {c['id']:c for c in candidates}
    published = {}
    for shape in shapes:
        try:
            candidate = lookup[shape['routeId']]
            geometry, bindings = shape['geometry'], shape['stopBindings']
            require(shape['sourceRef'].get('license') and shape['sourceRef'].get('url'),'경로 출처·이용 조건 누락')
            require(shape['sourceRef'].get('sourceDate') or shape['sourceRef'].get('retrievedAt'),'경로 자료 날짜 누락')
            require(shape['operationalEvidence'].get('url') and shape['operationalEvidence'].get('checkedAt'),'운행 근거 누락')
            require(ko(shape['operatorKo']) and ko(shape['patternNameKo']) and ko(candidate['line']['ko']),'한국어 표시 이름 오류')
            require(shape.get('mode','bus') in ('bus','village_bus','express_bus','brt'),'버스 수단 오류')
            require(shape.get('directionId') and shape.get('sourcePatternId') and ko(shape['categoryKo']),'방향·운행계통·분류 누락')
            require(len(geometry)>1 and all(coord(*p) for p in geometry),'경로 좌표 오류')
            require(all(distance(geometry[i-1],geometry[i]) <= 2 for i in range(1,len(geometry))),'경로 단절')
            require(len(bindings)>1 and bindings[0]['geometryIndex']==0 and bindings[-1]['geometryIndex']==len(geometry)-1,'시종점 불일치')
            journey_stops=[]
            last=-1
            expected={s['sequence']:s['stopId'] for s in candidate['stopSequence']}
            # National inventories lack direction sequences: require separate
            # official sequence provenance and explicit stop IDs in attachment.
            if not expected:
                require(shape.get('stopSequenceSource',{}).get('url'),'방향별 정차 순서 근거 누락')
            else:
                sequence_numbers=[b['sequence'] for b in bindings]
                require(sequence_numbers==list(range(sequence_numbers[0],sequence_numbers[-1]+1)),
                        '원본 방향별 정류장 누락 또는 역순')
            for binding in bindings:
                sid=binding['stopId']
                if expected:
                    require(expected.get(binding['sequence'])==sid,'동명 정류장 또는 정차 순서 불일치')
                stop=stops[sid]
                index=binding['geometryIndex']
                require(index>last and distance(geometry[index],[stop['latitude'],stop['longitude']])<=.15,'정류장 경로 순서·좌표 불일치')
                journey_stops.append({**stop,'ja':stop['ko'],'kana':stop['ko'],'romaji':stop['ko'],'geometryIndex':index})
                last=index
            jid=candidate['id']+'-'+shape['directionId']
            require(jid not in {j['id'] for j in published.get(candidate['id'],{}).get('verifiedJourneys',[])},'운행 방향 중복')
            route=published.setdefault(candidate['id'],{
                'schemaVersion':2,'id':candidate['id'],'countryId':'kr','mode':shape.get('mode','bus'),
                'line':candidate['line'],'operator':{'ko':shape['operatorKo']},
                'regionId':candidate['regionId'],'regionKo':candidate['regionKo'],
                'categoryKo':shape['categoryKo'],'routeNumber':candidate['routeNumber'],
                'releaseStatus':'verified','geometryReady':True,
                'sourceRefs':candidate['sourceRefs']+[shape['sourceRef']],
                'operationalEvidence':shape['operationalEvidence'],'verifiedJourneys':[]})
            route['verifiedJourneys'].append({'id':jid,'patternId':jid,'patternName':{'ko':shape['patternNameKo']},
                'directionId':shape['directionId'],'tripIds':[shape['sourcePatternId']],
                'stations':journey_stops,'geometry':geometry,
                'directedSegments':[{'fromStationId':a['id'],'toStationId':b['id'],
                    'geometry':geometry[a['geometryIndex']:b['geometryIndex']+1]} for a,b in zip(journey_stops,journey_stops[1:])],
                'service':{'id':jid,'nameKo':shape['patternNameKo'],'stops':[s['id'] for s in journey_stops]}})
        except (KeyError,ValueError,TypeError,IndexError) as exc:
            errors.append({'source':'도로 경로 첨부','routeId':shape.get('routeId'),'reason':str(exc) or '출판 검증 실패'})
    for route in published.values():
        route['stations']=route['verifiedJourneys'][0]['stations']
        route['geometry']=route['verifiedJourneys'][0]['geometry']
    return list(published.values())

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download',action='store_true')
    parser.add_argument('--shapes',type=Path)
    args=parser.parse_args()
    if args.download: download()
    candidates, stops, errors=ingest()
    shapes=json.loads(args.shapes.read_text(encoding='utf-8')) if args.shapes else []
    routes=attach(candidates,stops,shapes,errors)
    duplicate_ids=[rid for rid,count in collections.Counter(c['id'] for c in candidates).items() if count>1]
    require(not duplicate_ids, '중복 노선 식별자: '+','.join(duplicate_ids))
    summary={'candidateRoutes':len(candidates),'publicRoutes':len(routes),
             'seoulRoutes':sum(c['regionId']=='seoul' for c in candidates),
             'nationwideRoutes':sum(c['regionId']!='seoul' for c in candidates),
             'uniqueStops':len(stops),'orderedSeoulStopCalls':sum(len(c['stopSequence']) for c in candidates),
             'regions':dict(sorted(collections.Counter(c['regionKo'] for c in candidates).items())),
             'failedRowsOrShapes':len(errors),'duplicateRouteIds':len(duplicate_ids),
             'geometryPolicy':'실제 출처와 독립 방향 근거가 없는 경로는 공개하지 않음'}
    write('bus-candidates.json',{'schemaVersion':2,'publicationStatus':'non-public-import-queue',
                               'sourceDate':CHECKED,'routes':candidates})
    write('bus-stops.json',{'schemaVersion':2,'publicationStatus':'non-public-import-queue',
                          'sourceRefs':[source(SEOUL_STOPS,'2026-09-02','공공누리 제1유형'),
                                        source(NATION_STOPS,'2026-07-16','이용허락범위 제한 없음')],
                          'stops':list(stops.values())})
    write('bus-batch.json',{'schemaVersion':2,'generatedBy':'tools/kr-bus-import.py','routes':routes})
    write('bus-report.json',{'summary':summary,'failures':errors,'sourceFiles':[
        {'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
        for p in sorted(SRC.glob('*')) if p.suffix in ('.csv','.xlsx')]})
    print(json.dumps(summary,ensure_ascii=True,indent=2))

if __name__=='__main__': main()
