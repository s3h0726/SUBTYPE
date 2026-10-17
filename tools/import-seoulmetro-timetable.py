"""Import official 2026-09-01 Seoul Metro CSV, preserving source row evidence.

No route, stop, reverse service or release approval is manufactured here.
Usage: python tools/import-seoulmetro-timetable.py
"""
import csv, datetime, hashlib, json, pathlib, re
from collections import defaultdict

base = pathlib.Path(__file__).resolve().parent.parent/'data'/'kr'/'v2'
source = base/'source'/'seoulmetro'/'timetable-20260901.csv'
source_id = 'seoulmetro-official-20260901'
trains, invalid = {}, []
def seconds(value):
    if not value: return None
    if not re.fullmatch(r'\d{1,2}:\d{2}:\d{2}', value): raise ValueError('INVALID_TIME:'+value)
    h,m,s=map(int,value.split(':'))
    if h>47 or m>59 or s>59: raise ValueError('INVALID_TIME:'+value)
    return h*3600+m*60+s

with source.open(encoding='cp949',newline='') as stream:
    reader=csv.DictReader(stream)
    expected=['고유번호','호선','역사코드','역사명','주중주말','방향','급행여부','열차코드','열차도착시간','열차출발시간','출발역','도착역']
    if reader.fieldnames!=expected: raise ValueError('UNRECOGNIZED_SOURCE_COLUMNS:'+repr(reader.fieldnames))
    for row_number,row in enumerate(reader,2):
        if None in row: raise ValueError('MALFORMED_CSV_ROW:'+str(row_number))
        key=tuple(row[k] for k in ['호선','주중주말','방향','급행여부','열차코드','출발역','도착역'])
        if key not in trains:
            trains[key]={'id':source_id+'-train-'+str(len(trains)),'sourceId':source_id,'officialLineCode':key[0], 'calendarLabel':key[1], 'directionId':key[2], 'express':key[3]=='1','trainNumber':key[4],'originOperationalName':key[5], 'destinationOperationalName':key[6], 'dataReferenceDate':'2026-09-01','calls':[],'status':'candidate','reviewRequired':[]}
        arrival,departure=row['열차도착시간'],row['열차출발시간']
        seconds(arrival);seconds(departure)
        trains[key]['calls'].append({'operationalStationName':row['역사명'],'officialStationCode':row['역사코드'],'arrival':arrival or None,'departure':departure or None,'sourceRow':row_number,'sourceRecordId':row['고유번호']})

for trip in trains.values():
    if trip['calendarLabel'] not in ['DAY','SAT','END'] or trip['directionId'] not in ['UP','DOWN','IN','OUT']:trip['reviewRequired'].append('UNKNOWN_CALENDAR_OR_DIRECTION')
    if any(not c['arrival'] and not c['departure'] for c in trip['calls']):trip['reviewRequired'].append('MISSING_CALL_TIME')
    trip['calls'].sort(key=lambda c:(seconds(c['arrival'] or c['departure']) if c['arrival'] or c['departure'] else float('inf'),c['sourceRow']))
    if trip['calls'][0]['operationalStationName']!=trip['originOperationalName'] or trip['calls'][-1]['operationalStationName']!=trip['destinationOperationalName']:trip['reviewRequired'].append('PROVIDER_SECTION_DOES_NOT_COVER_FULL_TRIP')
    trip['reviewRequired']+=['OFFICIAL_STATION_IDENTITY','TRACK_AND_DIRECTION','CALENDAR_EXCEPTIONS']

def save(name,value):
    text=json.dumps(value,ensure_ascii=False,indent=2) if name=='sources' else json.dumps(value,ensure_ascii=False,separators=(',',':'))
    (base/(name+'.json')).write_text(text+'\n',encoding='utf-8')
save('seoulmetro-trip-candidates',list(trains.values()))
registry=json.loads((base/'sources.json').read_text(encoding='utf-8'))
metadata={'id':source_id,'kind':'official-timetable','publisher':'서울교통공사 / 공공데이터포털','title':'서울교통공사_서울 도시철도 열차운행시각표_20260901','url':'https://www.data.go.kr/data/15098251/fileData.do','downloadUrl':'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000007671122&fileDetailSn=1&insertDataPrcus=N','license':'data.go.kr-unrestricted','licenseStatus':'verified','licenseEvidenceUrl':'https://www.data.go.kr/data/15098251/fileData.do','dataReferenceDate':'2026-09-01','validFrom':'2026-09-01','validityBasis':'Latest official published timetable snapshot; portal last modified 2026-09-14. Reference date is preserved separately. Subsequent operator notices remain applicable.','retrievedOn':'2026-10-17','files':[{'path':'source/seoulmetro/timetable-20260901.csv','sha256':hashlib.file_digest(source.open('rb'),'sha256').hexdigest()}]}
save('sources',[s for s in registry if s['id']!=source_id]+[metadata])
summary={'sourceId':source_id,'tripCandidates':len(trains),'callRows':sum(len(t['calls']) for t in trains.values()),'completeSourceTrips':sum('PROVIDER_SECTION_DOES_NOT_COVER_FULL_TRIP' not in t['reviewRequired'] for t in trains.values()),'releaseApproved':0}
save('seoulmetro-import-report',summary)
print(json.dumps(summary))
