"""Import KRIC all-agency reference workbooks without asserting current service.
Usage: python tools/import-kric-reference.py INPUT_DIRECTORY data/kr/v2
Input files: kric-18.xlsx (lines), kric-32.xlsx (stations), kric-900.xlsx (trains).
Dates in these tables are data reference dates, NOT train operating validity.
"""
import datetime, hashlib, json, pathlib, shutil, sys
import openpyxl
sys.stdout.reconfigure(encoding='utf-8')
directory, base = map(pathlib.Path, sys.argv[1:3])
source_dir = base/'source'/'kric'
source_dir.mkdir(parents=True, exist_ok=True)
def scalar(v):
    if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
        return v.isoformat()
    return v.strip() if isinstance(v,str) else v
def save(name, value):
    (base/(name+'.json')).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
sources, lines, stations, trains, issues = [], [], [], {}, []
for number, kind, title in [(18,'official-urban-line-inventory','전체 도시철도 노선정보'),(32,'official-stations','전체 도시철도 역사정보'),(900,'official-timetable','전체 도시철도 운행정보')]:
    file=directory/f'kric-{number}.xlsx'
    target=source_dir/file.name
    if file.resolve()!=target.resolve(): shutil.copyfile(file,target)
    source_id=f'kric-standard-{number}'
    sources.append({'id':source_id,'kind':kind,'title':title,'publisher':'국가철도공단 철도산업정보센터 / 전국도시철도운영기관','url':f'https://data.kric.go.kr/rips/M_01_01/detail.do?id={number}','downloadUrl':f'https://data.kric.go.kr/rips/dataset/download.file?type=filedata&id={number}&operation=1','retrievedOn':datetime.date.today().isoformat(),'license':'unverified','licenseStatus':'pending','validFrom':None,'files':[{'path':f'source/kric/{file.name}','sha256':hashlib.file_digest(file.open('rb'),'sha256').hexdigest()}]})
    book=openpyxl.load_workbook(file,read_only=True,data_only=True)
    for sheet in book:
        rows=sheet.iter_rows(values_only=True)
        headers=[str(x or '').strip() for x in next(rows)]
        for row_number, values in enumerate(rows,2):
            if not any(v is not None for v in values): continue
            row={h:scalar(v) for h,v in zip(headers,values) if h}
            evidence={'sourceId':source_id,'sheet':sheet.title,'row':row_number}
            if number==18:
                lines.append({'id':f'{source_id}-row-{row_number}','officialLineCode':str(row.get('노선번호') or ''),'names':{'ko':row.get('노선명')},'origin':row.get('기점명'),'destination':row.get('종점명'),'stationComposition':row.get('정거장구성'),'lengthMeters':row.get('노선연장'),'openedOn':row.get('개통일자'),'operatorName':row.get('운영기관명'),'dataReferenceDate':row.get('데이터기준일자'),'source':evidence,'status':'reference'})
            elif number==32:
                stations.append({'id':f'{source_id}-row-{row_number}','number':str(row.get('역번호') or ''),'names':{'ko':row.get('역사명'),'en':row.get('영문역사명')},'officialLineCode':str(row.get('노선번호') or ''),'lineName':row.get('노선명'),'coordinates':{'lat':row.get('역위도'),'lon':row.get('역경도')},'operatorName':row.get('운영기관명'),'transferLineCodes':row.get('환승노선번호'),'dataReferenceDate':row.get('데이터기준일자'),'source':evidence,'status':'reference'})
            else:
                key=tuple(str(row.get(k) or '') for k in ['노선번호','열차번호','요일구분','운행구간기점명','운행구간종점명','운행유형'])
                if key not in trains: trains[key]={'id':f'{source_id}-train-{len(trains)}','officialLineCode':key[0],'trainNumber':key[1],'calendarLabel':key[2],'originOperationalName':key[3],'destinationOperationalName':key[4],'serviceType':key[5],'lineName':row.get('노선명'),'sourceId':source_id,'sheet':sheet.title,'calls':[],'status':'candidate','reviewRequired':['STOP_VERSUS_PASS','CURRENT_TIMETABLE_VALIDITY','OFFICIAL_STATION_IDENTITY','TRACK_AND_DIRECTION','CALENDAR_EXCEPTIONS']}
                trains[key]['calls'].append({'operationalStationName':row.get('운행구간정거장'),'arrival':row.get('정거장도착시각'),'departure':row.get('정가장출발시각'),'sourceRow':row_number,'dataReferenceDate':row.get('데이터기준일자')})
    book.close()
save('official-line-reference',lines)
save('official-station-reference',stations)
save('kric-trip-candidates',list(trains.values()))
registry=base/'sources.json'
existing=json.loads(registry.read_text(encoding='utf-8'))
ids={s['id'] for s in sources}
save('sources',[s for s in existing if s['id'] not in ids]+sources)
summary={'status':'INCOMPLETE','officialLineRows':len(lines),'officialStationRows':len(stations),'tripCandidates':len(trains),'callRows':sum(len(t['calls']) for t in trains.values()),'note':'Urban/commuter source rows, not unique physical lines/stations or a complete national passenger inventory. Reference dates are not validity dates.'}
save('kric-import-report',summary)
print(json.dumps(summary,ensure_ascii=False))
