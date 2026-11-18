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
