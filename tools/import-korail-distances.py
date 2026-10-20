"""Extract a pinned historical distance table; never grants release approval."""
import hashlib,json,zipfile,posixpath,xml.etree.ElementTree as E
from decimal import Decimal
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]/'data/kr/v2'
BOOK='source/distance/korail-operating-distances-20240901.xlsx'
PAGE='source/distance/portal-15137040-20261020.html'
HASHES={BOOK:'5514e0eefde06d44171c34c69553328b7d93db1cd5611d8dacf79888e12e4697',PAGE:'2136b82027a35b2e517d5b286fed2042b9c0499746cd7bccbc1db093a3f20df6'}
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def extract(base=BASE):
    for file,digest in HASHES.items():
        if hashlib.sha256((base/file).read_bytes()).hexdigest()!=digest: raise ValueError('DISTANCE_SOURCE_DRIFT')
    page=(base/PAGE).read_text('utf-8')
    if '15137040' not in page or '제한 없음' not in page: raise ValueError('MISSING_LICENSE_EVIDENCE')
    with zipfile.ZipFile(base/BOOK) as z:
        strings=[''.join(s.itertext()) for s in E.fromstring(z.read('xl/sharedStrings.xml'))]
        rels={r.attrib['Id']:r.attrib['Target'] for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheet=next(s for s in E.fromstring(z.read('xl/workbook.xml')).find('s:sheets',NS) if s.attrib['name']=='1-경부KTX운행거리')
        target=rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        target=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
        cells={}
        for c in E.fromstring(z.read(target)).findall('.//s:sheetData/s:row/s:c',NS):
            v=c.find('s:v',NS)
            if v is not None: cells[c.attrib['r']]=strings[int(v.text)] if c.attrib.get('t')=='s' else v.text
    expected={'B2':'경부고속선 운행거리','P2':'(서울-부산)','A5':'서울','R22':'대전','W27':'동대구','AC33':'부산'}
    for address,value in expected.items():
        if cells.get(address)!=value: raise ValueError('DISTANCE_MATRIX_DRIFT '+address)
    def number(address):
        raw=cells[address]; value=Decimal(raw); rounded=value.quantize(Decimal('0.1'))
        if abs(value-rounded)>Decimal('0.000000001') or rounded<=0: raise ValueError('UNEXPECTED_DISTANCE_PRECISION')
        return {'cell':address,'raw':raw,'km':float(rounded)}
    legs=[{'from':a,'to':b,**number(c)} for a,b,c in [('서울','대전','R5'),('대전','동대구','W22'),('동대구','부산','AC27')]]
    total=number('AC5')
    if sum(Decimal(str(r['km'])) for r in legs)!=Decimal(str(total['km'])): raise ValueError('DISTANCE_SUM_MISMATCH')
    return {'id':'korail-distance-gyeongbu-hsl-20240901','sourceId':'korail-distance-20240901','referenceDate':'2024-09-01','reviewedOn':'2026-10-20','sheet':sheet.attrib['name'],'sourceFiles':HASHES,'sourceUrl':'https://www.data.go.kr/data/15137040/fileData.do','license':'data.go.kr-unrestricted','scope':'Historical published high-speed corridor distance only; current applicability and platform/direction review remain required','total':total,'legs':legs,'releaseApproved':False}
if __name__=='__main__':
    result=extract();(BASE/'official-distance-reference.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,ensure_ascii=False))
