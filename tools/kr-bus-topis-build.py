#!/usr/bin/env python3
"""Compile cached official TOPIS bus paths; independent original directions only."""
import bisect, collections, gzip, hashlib, importlib.util, json, re
from pathlib import Path
spec=importlib.util.spec_from_file_location('bus_import',Path(__file__).with_name('kr-bus-import.py'))
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
ROOT=base.ROOT; SRC=base.SRC/'topis'
LETTERS=dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', ['에이','비','씨','디','이','에프','지','에이치','아이','제이','케이','엘','엠','엔','오','피','큐','알','에스','티','유','브이','더블유','엑스','와이','지']))
CATEGORIES={1:'공항버스',2:'마을버스',3:'간선버스',4:'지선버스',5:'순환버스',6:'광역버스',7:'기타 버스',8:'급행버스'}
COLORS={1:'#8d5c31',2:'#5bb025',3:'#2965b1',4:'#46a548',5:'#e1b900',6:'#d83c3c',7:'#687584',8:'#d83c3c'}
def localize(name):
    # Korean letter readings are display aliases only. Preserve official original
    # name and stop ID; never merge or identify stops using the localized alias.
    return re.sub('[A-Za-z]',lambda m:LETTERS[m[0].upper()],str(name)).strip()

def read(rid,kind):
    with gzip.open(SRC/f'{rid}-{kind}.json.gz','rt',encoding='utf8') as f: return json.load(f)['rows']

def main():
    candidates=json.loads((base.OUT/'bus-candidates.json').read_text(encoding='utf8'))['routes']
    metadata=collections.defaultdict(list)
    for row in base.xlsx('seoul-routes-20260902.xlsx')[1:]:
        if len(row)>=5: metadata[row[1]].append(row)
    routes=[];failures=[];counts=collections.Counter();unique_stops=set()
    for candidate in candidates:
        if candidate['regionId']!='seoul':continue
        rid=candidate['sourceRouteId']
        try:
            rows=read(rid,'geometry'); stoprows=sorted(read(rid,'stops'),key=lambda s:s['stationOrd'])
            base.require(len(stoprows)>1,'현재 운행 정류장 누락')
            number=stoprows[0]['routNm']
            # Current official route name must still bind the published snapshot.
            base.require(number==candidate['routeNumber'],'노선번호 변경: 원본 갱신 필요')
            operators=sorted({localize(r[0]) for r in metadata[number] if base.ko(localize(r[0]))})
            base.require(operators,'공식 운영사 누락')
            geometry=[]
            for row in rows:
                p=[float(row['posY']),float(row['posX'])]
                base.require(base.coord(*p),'경로 좌표 오류')
                if not geometry or p!=geometry[-1]: geometry.append(p)
            cumulative=[0.0]
            for a,b in zip(geometry,geometry[1:]):
                step=base.distance(a,b)
                base.require(step<=2,'경로 단절')
                cumulative.append(cumulative[-1]+step)
            indexes=[];previous=-1
            for i,stop in enumerate(stoprows):
                p=[float(stop['posY']),float(stop['posX'])]
                base.require(base.coord(*p),'정류장 좌표 오류')
                # Bound search using the actual inter-stop distance returned by
                # TOPIS; this prevents matching the same stop on the return leg.
                if i==0: end=bisect.bisect_right(cumulative,1.5)
                else:
                    gap=max(.5,float(stop.get('guganLen') or 0)/1000)
                    end=bisect.bisect_right(cumulative,cumulative[previous]+max(2.0,gap*1.8+.5))
                base.require(end>previous+1,'정차 순서 끝점 오류')
                nearest=min(range(previous+1,end),key=lambda n:base.distance(geometry[n],p))
                base.require(base.distance(geometry[nearest],p)<=.15,
                    '정류장과 실제 경로 불일치: 순번 '+str(stop['stationOrd'])+', 거리 '+str(round(base.distance(geometry[nearest],p)*1000))+'미터')
                indexes.append(nearest); previous=nearest
            groups=[]
            for i,stop in enumerate(stoprows):
                direction=stop.get('dir')
                base.require(base.ko(localize(direction)),'공식 운행 방향 누락')
                if not groups or groups[-1][0]!=direction:groups.append((direction,[]))
                groups[-1][1].append(i)
            journeys=[]
            # Circular lines retain the complete original ordered loop. Other
            # lines follow official dir changes, never a reversed stop array.
            for gi,(direction,indices) in enumerate(groups):
                if len(indices)<2:continue
                start,end=indexes[indices[0]],indexes[indices[-1]]
                shape=geometry[start:end+1];stations=[]
                for i in indices:
                    stop=stoprows[i];name=localize(stop['stnName'])
                    base.require(base.ko(name),'한국어 정류장 이름 누락')
                    sid='kr-seoul-stop-'+str(stop['stnId'])
                    stations.append({'id':sid,'sourceStopId':str(stop['stnId']),
                        'ko':name,'ja':name,'kana':name,'romaji':name,
                        'sourceName':stop['stnName'],'nameLocalization':'라틴 문자 약어는 한국어 글자 이름으로 표시',
                        'latitude':float(stop['posY']),'longitude':float(stop['posX']),
                        'geometryIndex':indexes[i]-start})
                jid=candidate['id']+'-direction-'+str(gi+1)
                pattern=localize(direction)+' 방면'
                journey={'id':jid,'patternId':jid,'directionId':'direction-'+str(gi+1),
                    'patternName':{'ko':pattern},'tripIds':[rid+':'+str(stoprows[indices[0]]['stationOrd'])+'-'+str(stoprows[indices[-1]]['stationOrd'])],
                    'stations':stations,'geometry':shape,
                    'directedSegments':[{'fromStationId':a['id'],'toStationId':b['id'],
                        'geometry':shape[a['geometryIndex']:b['geometryIndex']+1]} for a,b in zip(stations,stations[1:])],
                    'service':{'id':jid,'nameKo':pattern,'stops':[s['id'] for s in stations]},
                    'sourceDirection':direction,'turnPlaceStationId':stoprows[0].get('turnPlaceStationId')}
                journeys.append(journey)
            base.require(journeys,'운행계통 없음')
            rt=int(stoprows[0]['rtCd']);category=CATEGORIES.get(rt,'기타 버스')
            mode='village_bus' if rt==2 else 'express_bus' if rt in (1,6,8) else 'bus'
            normalized='village_bus' if rt==2 else 'metropolitan_bus' if rt==6 else 'express_bus' if rt==8 else 'city_bus' if rt in (3,4,5) else 'other_bus'
            route={'schemaVersion':2,'id':candidate['id'],'countryId':'kr','mode':mode,
                'line':{'ko':'서울 '+localize(number)+'번'},'operatorId':'kr-bus-operator-'+hashlib.sha256(' · '.join(operators).encode('utf8')).hexdigest()[:12],'operator':{'ko':' · '.join(operators)},
                'regionId':'seoul','regionKo':'서울특별시','routeNumber':localize(number),
                'categoryKo':category,'regionalCategory':category,'category':normalized,'normalizedCategory':normalized,'color':COLORS.get(rt,'#687584'),
                'releaseStatus':'verified','geometryReady':True,
                'sourceRefs':candidate['sourceRefs']+[
                    base.source('https://topis.seoul.go.kr/map/busMap/selectBusLineList.do',base.CHECKED,'서울특별시 공공데이터 출처표시'),
                    base.source('https://topis.seoul.go.kr/map/busMap/selectBusLineStnXMLList.do',base.CHECKED,'서울특별시 공공데이터 출처표시')],
                'operationalEvidence':{'url':'https://topis.seoul.go.kr/','checkedAt':base.CHECKED,
                    'endpoint':'/map/busMap/selectBusLineStnXMLList.do','routeId':rid},
                'verifiedJourneys':journeys,'stations':journeys[0]['stations'],'geometry':journeys[0]['geometry']}
            routes.append(route);counts[category]+=1
            unique_stops.update(s['id'] for j in journeys for s in j['stations'])
        except (ValueError,KeyError,TypeError,OSError,IndexError) as exc:
            failures.append({'routeId':candidate['id'],'reason':str(exc)})
    base.write('bus-topis-batch.json',{'schemaVersion':2,'generatedBy':'tools/kr-bus-topis-build.py','routes':routes})
    summary={'publicRoutes':len(routes),'playableDirections':sum(len(r['verifiedJourneys']) for r in routes),
        'uniqueStops':len(unique_stops),'categories':dict(counts),'failedRoutes':len(failures)}
    base.write('bus-topis-report.json',{'summary':summary,'failures':failures})
    print(json.dumps(summary,ensure_ascii=True))
if __name__=='__main__':main()
