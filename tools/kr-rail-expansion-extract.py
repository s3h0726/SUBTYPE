"""Read full official train rows/columns and retain original cell references."""
from pathlib import Path
import datetime, hashlib, json, re
import openpyxl
root=Path(__file__).resolve().parents[1]
out=root/'data/kr/canonical'
trips=[];sources=[]
def text(v): return re.sub(r'\s+','',str(v or ''))
def timed(v): return isinstance(v,datetime.time) and v!=datetime.time(0)
for kind,name,url in [
 ('highspeed','rail-expansion-ktx-20261101.xlsx','https://www.korail.com/file/cubedata/COMMON/jfile/202610/13/202610131a130b1ac0b200.xlsx'),
 ('conventional','rail-expansion-conventional-20261101.xlsx','https://www.korail.com/file/cubedata/COMMON/jfile/202610/12/202610121a13004f8b1730.xlsx')]:
 file=out/name;book=openpyxl.load_workbook(file,read_only=True,data_only=True)
 sourceid='korail-'+kind+'-20261101'
 sources.append({'id':sourceid,'url':url,'sourceDate':'2026-11-01','checkedAt':'2026-11-01','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'path':name,'license':'공식 운행 사실 검증용; 원본 문서 재배포 이용조건 별도 확인'})
 for sheet in book:
  rows=list(sheet.values)
  for ri,row in enumerate(rows):
   for start in [i for i,v in enumerate(row) if text(v)=='열차번호']:
    if kind=='highspeed':
     end=next((i for i in range(start+2,len(row)) if text(row[i])=='비고'),None)
     if end is None:continue
     cols=[(i,text(row[i])) for i in range(start+2,end) if isinstance(row[i],str) and re.search('[가-힣]',row[i])]
     for rj,data in enumerate(rows[ri+1:],ri+2):
      if not isinstance(data[start],(int,float)):continue
      calls=[{'ko':n,'time':data[c].isoformat(),'sourceCell':f'{openpyxl.utils.get_column_letter(c+1)}{rj}'} for c,n in cols if timed(data[c])]
      if len(calls)<2:continue
      trips.append({'id':f'{sourceid}-{sheet.title}-{int(data[start])}','sourceId':sourceid,'sheet':sheet.title,'trainNumber':str(int(data[start])),'trainType':data[start+1],'calendar':data[end],'calls':calls})
    else:
     # In each vertical block the start/end labels are authoritative. Never
     # turn the first visible part of a through train into a new service.
     originrow=next((j for j in range(ri-1,max(-1,ri-9),-1) if text(rows[j][start])=='시발역'),None)
     destrow=next((j for j in range(ri+1,len(rows)) if text(rows[j][start])=='종착역'),None)
     if originrow is None or destrow is None:continue
     notesrow=next((j for j in range(ri+1,destrow) if text(rows[j][start])=='비고'),destrow)
     for c in range(start+1,len(row)):
      if not isinstance(row[c],(int,float)):continue
      origin=text(rows[originrow][c]);dest=text(rows[destrow][c]);calls=[]
      for j in range(ri+1,notesrow):
       station=text(rows[j][start]);value=rows[j][c]
       if not re.fullmatch('[가-힣0-9·()]+',station) or not timed(value):continue
       station=re.sub(r'\((?:도착|출발)\)','',station)
       if calls and station==calls[-1]['ko']:continue
       calls.append({'ko':station,'time':value.isoformat(),'sourceCell':f'{openpyxl.utils.get_column_letter(c+1)}{j+1}'})
      if len(calls)<2 or calls[0]['ko']!=origin or calls[-1]['ko']!=dest:continue
      train_type=rows[ri-1][c]
      if not isinstance(train_type,str) or not any(k in train_type for k in ['무궁화','새마을','ITX','누리로','통근','마음']):continue
      calendar=rows[notesrow][c] if notesrow<destrow else None
      trips.append({'id':f'{sourceid}-{sheet.title}-{int(row[c])}','sourceId':sourceid,'sheet':sheet.title,'trainNumber':str(int(row[c])),'trainType':train_type,'calendar':calendar if isinstance(calendar,str) else None,'calls':calls})
result={'checkedAt':'2026-11-01','sources':sources,'trips':trips}
(out/'rail-expansion-official-patterns.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'highSpeedFullRows':sum(t['sourceId'].startswith('korail-highspeed') for t in trips),'conventionalFullColumns':sum(t['sourceId'].startswith('korail-conventional') for t in trips),'sourceFiles':len(sources)}))
