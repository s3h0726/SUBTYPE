#!/usr/bin/env python3
import json, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
import math
U='https://api.openstreetmap.org/api/0.6/relation/6094351/full'
req=urllib.request.Request(U,headers={'User-Agent':'SUBTYPE-OSM-KTX-Track-Audit/1.0 (OpenStreetMap ODbL research)'})
with urllib.request.urlopen(req, timeout=50) as response:
    payload=response.read()
print('OSM_KTX_FULL_RELATION_BYTES',len(payload))
root=ET.fromstring(payload)
relation=next((x for x in root.findall('relation') if x.attrib.get('id')=='6094351'),None)
if relation is None:
    raise RuntimeError('MISSING_GYEONGBU_HSR_RELATION')
members=[(m.attrib.get('type'),m.attrib.get('ref'),m.attrib.get('role')) for m in relation.findall('member')]
nodes={n.attrib['id']:(float(n.attrib['lat']),float(n.attrib['lon'])) for n in root.findall('node')}
ways={}
for w in root.findall('way'):
    ids=[n.attrib['ref'] for n in w.findall('nd')]
    tags={t.attrib['k']:t.attrib['v'] for t in w.findall('tag')}
    coords=[nodes.get(k) for k in ids]
    ways[w.attrib['id']]={'ids':ids,'tags':tags,'coords':coords}
available=[ways.get(ref) for kind,ref,role in members if kind=='way' and ref in ways]
south=[(kind,ref,role,ways[ref]) for kind,ref,role in members if kind=='way' and ref in ways and any(p and 34.95<p[0]<35.86 and p[1]>128.65 for p in ways[ref]['coords'])]
print('OSM_KTX_RELATION_DIAG',json.dumps({
 'members':len(members),'ways':len(ways),'nodes':len(nodes),'availableMembers':len(available),
 'tags':{t.attrib['k']:t.attrib['v'] for t in relation.findall('tag')},
 'memberKinds':dict(Counter(x[0] for x in members)),
 'southMembers':len(south),
 'southSample':[{'id':ref,'role':role,'name':w['tags'].get('name'),'railway':w['tags'].get('railway'),
  'highspeed':w['tags'].get('highspeed'),'oneway':w['tags'].get('oneway'),'nodes':len(w['ids']),
  'first':w['coords'][0],'last':w['coords'][-1]} for _,ref,role,w in south[:20]]
},ensure_ascii=False))

# A map-only route can traverse either source track direction, but may never
# connect different OSM node identities at coincident coordinates.
from collections import defaultdict
import heapq
def km(a,b):
    x=(a[0]-b[0])*111.195
    y=(a[1]-b[1])*111.195*math.cos(math.radians((a[0]+b[0])/2))
    return math.hypot(x,y)
adj=defaultdict(list)
for kind,ref,role in members:
    if kind!='way' or ref not in ways: continue
    w=ways[ref]
    tags=w['tags']
    if tags.get('railway') not in ('rail','light_rail') or tags.get('service') in ('yard','spur','siding') :continue
    for i in range(1,len(w['ids'])):
        a,b=w['ids'][i-1],w['ids'][i]
        if a not in nodes or b not in nodes:continue
        d=km(nodes[a],nodes[b])
        if d>5 or d<=0:continue
        factor=1 if tags.get('name')=='경부고속선' else 2
        adj[a].append((b,d*factor,ref,d))
        adj[b].append((a,d*factor,ref,d))
goals=[('경주→부산',(35.79820124687369,129.13983712406198),(35.115579612248546,129.04249896695902)),
       ('동대구→부산',(35.8799722,128.6300202),(35.115579612248546,129.04249896695902)),
       ('대전→동대구',(36.3305619,127.4359359),(35.8799722,128.6300202))]
for name,start,end in goals:
    candidates_a=sorted(((km(pos,start),id) for id,pos in nodes.items() if id in adj))[:150]
    candidates_b=sorted(((km(pos,end),id) for id,pos in nodes.items() if id in adj))[:150]
    dist={};prior={};queue=[];ends={n:dist for dist,n in candidates_b if dist<.7}
    for delta,node in candidates_a:
        if delta>.7:continue
        value=delta*5
        if value>=(dist.get(node) or 1e9):continue
        dist[node]=value
        heapq.heappush(queue,(value,node))
    best=None
    while queue:
        cost,node=heapq.heappop(queue)
        if cost!=dist[node]:continue
        if cost>1000:break
        if node in ends:
            result=cost+ends[node]*5
            if best is None or best[0]>result:best=(result,node)
            if cost>best[0]:break
        for next,w,way,actual in adj[node]:
            nc=cost+w
            if nc<dist.get(next,1e12):
                dist[next]=nc;prior[next]=(node,actual,way)
                heapq.heappush(queue,(nc,next))
    if best:
        ids=[best[1]]
        actual=0
        while ids[0] in prior:
            step=prior[ids[0]]
            actual+=step[1]
            ids.insert(0,step[0])
        latitudes=[nodes[n][0] for n in ids]
        print('OSM_KTX_RELATION_PATH',json.dumps({'name':name,'scoreKm':round(best[0],2),
          'distanceKm':round(actual,2),'nodeCount':len(ids),'start':nodes[ids[0]],'end':nodes[ids[-1]],
          'minLat':min(latitudes),'maxLat':max(latitudes),'firstNodes':ids[:3],'lastNodes':ids[-3]},ensure_ascii=False))
    else:
        print('OSM_KTX_RELATION_PATH',json.dumps({'name':name,'reason':'NO_CONNECTED_HSR_NODES',
            'candidateA':candidates_a[:3],'candidateB':candidates_b[:3]}))
