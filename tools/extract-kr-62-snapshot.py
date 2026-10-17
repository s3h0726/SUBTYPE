"""Read the latest country extract without filtering road/construction evidence.
Usage: python tools/extract-kr-62-snapshot.py INPUT.pbf TARGET_IDS.json OUTPUT_DIR
Requires osmium. Original snapshots and the normal railway importer are separate.
"""
import sys, pathlib, json, hashlib
import osmium

src, ids_file, dest = map(pathlib.Path, sys.argv[1:4])
ids = set(json.loads(ids_file.read_text(encoding='utf-8')))
dest.mkdir(parents=True, exist_ok=True)

class Relations(osmium.SimpleHandler):
    def __init__(self):
        super().__init__(); self.rows=[]; self.ways=set(); self.nodes=set()
    def relation(self,r):
        if str(r.id) not in ids: return
        self.rows.append({'id':str(r.id),'version':r.version,'timestamp':r.timestamp.isoformat(),'tags':dict(r.tags),'members':[{'type':m.type,'ref':str(m.ref),'role':m.role} for m in r.members]})
        self.ways.update(int(m.ref) for m in r.members if m.type=='w')
        self.nodes.update(int(m.ref) for m in r.members if m.type=='n')

class Members(osmium.SimpleHandler):
    def __init__(self,relations):
        super().__init__(); self.targets=relations; self.ways=[]; self.nodes=[]
    def node(self,n):
        if n.id in self.targets.nodes:
            self.nodes.append({'id':str(n.id),'version':n.version,'timestamp':n.timestamp.isoformat(),'lat':n.location.lat,'lon':n.location.lon,'tags':dict(n.tags)})
    def way(self,w):
        if w.id in self.targets.ways:
            self.ways.append({'id':str(w.id),'version':w.version,'timestamp':w.timestamp.isoformat(),'nodeIds':[str(n.ref) for n in w.nodes],'coordinates':[[n.lat,n.lon] if n.location.valid() else None for n in w.nodes],'tags':dict(w.tags)})

with osmium.io.Reader(str(src)) as reader:
    timestamp=reader.header().get('osmosis_replication_timestamp')
relations=Relations(); relations.apply_file(str(src))
members=Members(relations); members.apply_file(str(src),locations=True,idx='flex_mem')
for name,rows in [('osm-relations',relations.rows),('osm-ways',members.ways),('osm-nodes',members.nodes)]:
    (dest/(name+'.json')).write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
manifest={'id':'osm-62-geofabrik-20261017','kind':'osm','snapshotTimestamp':timestamp,'retrievedOn':'2026-10-17','publisher':'OpenStreetMap / Geofabrik','url':'https://download.geofabrik.de/asia/south-korea.html','downloadUrl':'https://download.geofabrik.de/asia/south-korea-latest.osm.pbf','sha256':hashlib.file_digest(src.open('rb'),'sha256').hexdigest(),'bytes':src.stat().st_size,'license':'ODbL-1.0','licenseStatus':'verified','attribution':'© OpenStreetMap contributors','scope':'Latest country extract after live API HTTP 429; extract timestamp is not a claim of a live full-relation response','counts':{'requestedRelations':len(ids),'relations':len(relations.rows),'ways':len(members.ways),'nodes':len(members.nodes)},'missingRelationIds':sorted(ids-{r['id'] for r in relations.rows}),'missingWayIds':sorted(str(i) for i in relations.ways-{int(w['id']) for w in members.ways})}
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(manifest,ensure_ascii=True))
