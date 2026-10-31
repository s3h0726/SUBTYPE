"""Extract complete published KTX rows without inferring missing call times."""
from pathlib import Path
import datetime, hashlib, json
import openpyxl

root=Path(__file__).resolve().parents[1]
file=root/'data/kr/canonical/rail-ktx-timetable-20260901.xlsx'
book=openpyxl.load_workbook(file,read_only=True,data_only=True)
trips=[]
for sheet in book:
    rows=list(sheet.values)
    for ri,row in enumerate(rows):
        heads=[i for i,value in enumerate(row) if value=='열차번호']
        for start in heads:
            end=next((i for i in range(start+2,len(row)) if row[i]=='비고'),None)
            if end is None: continue
            stationcols=[(i,row[i]) for i in range(start+2,end) if isinstance(row[i],str) and any('\uac00'<=c<='\ud7a3' for c in row[i])]
            for rj,data in enumerate(rows[ri+1:],ri+2):
                if not isinstance(data[start],(int,float)): continue
                calls=[]
                for col,name in stationcols:
                    value=data[col]
                    if isinstance(value,datetime.time) and value!=datetime.time(0,0):
                        calls.append({'ko':name.replace(' ','').replace('\n',''),'time':value.isoformat(),'sourceCell':f'{openpyxl.utils.get_column_letter(col+1)}{rj}'})
                if len(calls)<2: continue
                trips.append({'id':f'korail-20260901-{sheet.title}-{int(data[start])}', 'trainNumber':str(int(data[start])),'trainType':data[start+1], 'calendar':data[end], 'sheet':sheet.title,'sourceRow':rj,'calls':calls})
out={'sourceDate':'2026-09-01','retrievedAt':'2026-10-31','sourceUrl':'https://www.korail.com/file/cubedata/COMMON/jfile/202608/25/202608251a036897009480.xlsx','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'license':'공식 운행 사실 확인용; 원본 시간표 이용조건 별도 확인','trips':trips}
(root/'data/kr/canonical/rail-ktx-official-patterns.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'officialFullRows':len(trips),'honamRows':sum(t['sheet']=='호남선' for t in trips)}))
