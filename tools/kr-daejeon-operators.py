"""공식 조합 시간표에서 노선별 운영사 원문을 추출한다."""
import json, re
from pathlib import Path
import openpyxl
base=Path(__file__).resolve().parent.parent/'data/kr/canonical'
book=openpyxl.load_workbook(base/'national-source/daejeon-schedule.xlsx',read_only=True,data_only=True)
rows=list(book.worksheets[0].iter_rows(values_only=True))
register=(base/'national-source/daejeon-company-list.html').read_text(encoding='utf-8')
phones={}
for block in re.findall(r'<tr>(.*?)</tr>',register,re.S):
    cells=re.findall(r'<td[^>]*>(.*?)</td>',block,re.S)
    if len(cells)==7:
        for phone in re.findall(r'[0-9]{3}-[0-9]{4}',cells[-1]):
            phones[phone]=re.sub(r'<[^>]+>','',cells[0]).strip()
aliases={}
for row in rows:
    if row[0]=='운행사':
        for name,phone in re.findall(r'([가-힣]+)\s*\(☎\s*([0-9]{3}-[0-9]{4})\)',str(row[2])):
            if phone in phones: aliases.setdefault(name,set()).add(phones[phone])
routes={}
current=None
for row in rows:
    if isinstance(row[0],str) and re.fullmatch(r'(?:급행|외곽|마을)?[A-Z]?[0-9]+번',row[0].strip()):
        current=row[0].strip().removesuffix('번')
    if current and row[0]=='운행사':
        text=str(row[2] or '')
        # 시간표의 회사 표기 자체를 보존하고 전화번호와 설명만 제외한다.
        text=re.sub(r'\([^)]*\)','',text).strip()
        operators=[]
        for name in re.split(r'[,/·\s]+',text):
            if not re.fullmatch(r'[가-힣]{2,20}',name): continue
            matches=aliases.get(name,set())
            if len(matches)==1: operators.extend(matches)
            elif name in phones.values() or name.endswith(('교통','운수','비알티','여객')): operators.append(name)
        routes.setdefault(current,set()).update(operators)
out={'source':{'url':'https://www.daejeonbus.or.kr/sub0202.do','retrievedAt':'2026-11-02T16:22:00Z','license':'대전광역시버스운송사업조합 공개 운행 시간표 사실정보','attribution':'대전광역시버스운송사업조합'},'routes':{k:sorted(v) for k,v in routes.items() if v}}
(base/'daejeon-operators.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(out['routes']))
