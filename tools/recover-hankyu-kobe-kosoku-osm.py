#!/usr/bin/env python3
"""Recover actual OSM underground rail ways for Hankyu Kobe Kosoku. Fail closed."""
import collections,heapq,json,math,os,pathlib,sys,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/'data/lines/hankyudentetsu/hankyukobekosokusen/geometry.json'
DST=ROOT/'data/generated/routes/line-hankyu-kobe-kosoku.json'
ST=[('station-1160313',34.694766,135.195058),('station-9963002',34.686117,135.181524),('station-9963005',34.679362,135.174441),('station-9963006',34.675981,135.169291)]
Q='[out:json][timeout:100];way["railway"="rail"](34.672,135.165,34.699,135.199);out geom tags;'
HOSTS=['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter','https://overpass.nchc.org.tw/api/interpreter']
def dist(a,b):return math.hypot((a[0]-b[0])*111000,(a[1]-b[1])*91000)
def fetch():
 if os.getenv('OSM_TRACK_JSON'):return json.loads(pathlib.Path(os.environ['OSM_TRACK_JSON']).read_text())
 for url in HOSTS:
  try:
   req=urllib.request.Request(url,urllib.parse.urlencode({'data':Q}).encode(),headers={'User-Agent':'SUBTYPE rail audit / https://github.com/s3h0726/SUBTYPE'})
   with urllib.request.urlopen(req,timeout=125) as response: payload=json.load(response)
   if payload.get('elements'):return payload
  except Exception as e:print('OSM fetch failed',url,str(e),file=sys.stderr)
 raise RuntimeError('Cannot fetch original OSM rail geometry; no route files modified')
def graph(payload):
 g=collections.defaultdict(list)
 for way in payload['elements']:
  tags=way.get('tags',{}); points=way.get('geometry',[])
  try:layer=int(tags.get('layer','0'))
  except (TypeError,ValueError):layer=0
  if tags.get('railway')!='rail' or (tags.get('tunnel') not in ('yes','building_passage') and layer>=0):continue
  for a,b in zip(points,points[1:]):
   x=(round(a['lat'],7),round(a['lon'],7));y=(round(b['lat'],7),round(b['lon'],7));d=dist(x,y)
   if 0<d<600:g[x].append((y,d));g[y].append((x,d))
 return g
def path(g,start,end):
 q=[(0,start)];cost={start:0};prev={};seen=set()
 while q:
  c,v=heapq.heappop(q)
  if v in seen:continue
  seen.add(v)
  if v==end:
   result=[v]
   while result[-1] in prev:result.append(prev[result[-1]])
   return c,result[::-1]
  for u,w in g[v]:
   if c+w<cost.get(u,1e30):cost[u]=c+w;prev[u]=v;heapq.heappush(q,(c+w,u))
 return 1e30,[]
def segment(g,a,b):
 start=a[1:];end=b[1:];straight=dist(start,end);vertices=list(g);best=None
 start_nodes=sorted(vertices,key=lambda p:dist(start,p))[:12]
 end_nodes=sorted(vertices,key=lambda p:dist(end,p))[:12]
 for x in start_nodes:
  dx=dist(start,x)
  if dx>220:continue
  for y in end_nodes:
   dy=dist(end,y)
   if dy>220:continue
   length,track=path(g,x,y)
   if not(3<=len(track) and length<=straight*1.65+180):continue
   score=length+2*(dx+dy)
   if best is None or score<best[0]:best=(score,track,dx,dy,length)
 if best is None:raise RuntimeError('No connected underground OSM track for '+a[0]+' to '+b[0])
 _,points,dx,dy,length=best
 return [[lat,lon] for lat,lon in points],{'startSnapMeters':round(dx),'endSnapMeters':round(dy),'trackMeters':round(length)}
def main():
 network=graph(fetch())
 if len(network)<8:raise RuntimeError('OSM tunnel track network is insufficient')
 edges={};audit=[]
 for a,b in zip(ST,ST[1:]):
  geometry,metrics=segment(network,a,b);key=a[0]+'::'+b[0]
  edges[key]={'fromStationId':a[0],'toStationId':b[0],'geometry':geometry,'source':'OSM Overpass underground railway ways; © OpenStreetMap contributors (ODbL)','verified':True}
  audit.append({'key':key,'points':len(geometry),**metrics})
 original=json.loads(SRC.read_text());data=json.loads(DST.read_text());route=data['route']
 if [s['id'] for s in route['stations']]!=[s[0] for s in ST]:raise RuntimeError('Station order changed; refusing to publish')
 if len(route['directedSegments'])!=3:raise RuntimeError('Route topology changed')
 original.update(edges)
 route['directedSegments']=[edges[a[0]+'::'+b[0]] for a,b in zip(ST,ST[1:])]
 route['geometry']=[pt for i,s in enumerate(route['directedSegments']) for pt in (s['geometry'] if not i else s['geometry'][1:])]
 route['geometryReady']=True;route['geometryStatus']='ready';route['missingSegments']=[];route['coverage']='osm-underground-rail-ways'
 route['sources']['geometry']='© OpenStreetMap contributors; Open Database License (ODbL)'
 for file,obj in [(SRC,original),(DST,data)]:file.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'data/source-audit/HANKYU_KOBE_KOSOKU_OSM.json').write_text(json.dumps({'segments':audit,'source':'OSM underground rail way geometries','license':'ODbL','attribution':'© OpenStreetMap contributors'},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(audit,ensure_ascii=False))
if __name__=='__main__':main()
