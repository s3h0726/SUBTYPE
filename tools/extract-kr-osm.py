"""Extract an independently downloaded OSM country PBF; never infer services.

Requires osmium (pip install osmium). Usage:
  python tools/extract-kr-osm.py INPUT.pbf data/kr/v2/source
Raw IDs, versions, coordinates, tags and ordered members remain auditable.
"""
import hashlib
import json
import pathlib
import sys
import osmium

src = pathlib.Path(sys.argv[1]).resolve()
dest = pathlib.Path(sys.argv[2]).resolve()
dest.mkdir(parents=True, exist_ok=True)
MODES = {'rail', 'subway', 'light_rail', 'tram', 'monorail', 'funicular', 'narrow_gauge'}
ROUTES = {'train', 'subway', 'light_rail', 'tram', 'monorail', 'funicular', 'railway'}


class Rail(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.nodes, self.ways, self.relations = [], [], []

    def node(self, n):
        tags = dict(n.tags)
        if tags.get('railway') in {'station', 'halt', 'stop', 'tram_stop', 'platform'} or tags.get('public_transport') in {'stop_position', 'platform'}:
            self.nodes.append({'id': str(n.id), 'version': n.version, 'lat': n.location.lat, 'lon': n.location.lon, 'tags': tags})

    def way(self, w):
        tags = dict(w.tags)
        if tags.get('railway') not in MODES:
            return
        refs = [str(n.ref) for n in w.nodes]
        points = [[n.lat, n.lon] if n.location.valid() else None for n in w.nodes]
        self.ways.append({'id': str(w.id), 'version': w.version, 'nodeIds': refs, 'coordinates': points, 'tags': tags})

    def relation(self, r):
        tags = dict(r.tags)
        if tags.get('route') in ROUTES or tags.get('route_master') in ROUTES or tags.get('public_transport') in {'stop_area', 'stop_area_group'}:
            self.relations.append({'id': str(r.id), 'version': r.version, 'tags': tags, 'members': [{'type': m.type, 'ref': str(m.ref), 'role': m.role} for m in r.members]})


with osmium.io.Reader(str(src)) as reader:
    timestamp = reader.header().get('osmosis_replication_timestamp')
handler = Rail()
# Keep location caching before the filter, but avoid Python callbacks for millions
# of unrelated buildings, roads and untagged nodes in the country extract.
handler.apply_file(str(src), locations=True, idx='flex_mem', filters=[osmium.filter.KeyFilter('railway', 'public_transport', 'route', 'route_master')])
digest = hashlib.file_digest(src.open('rb'), 'sha256').hexdigest()
manifest = {
    'id': 'osm-geofabrik-kr-2026-10-15', 'kind': 'osm',
    'url': 'https://download.geofabrik.de/asia/south-korea.html',
    'downloadUrl': 'https://download.geofabrik.de/asia/south-korea-latest.osm.pbf',
    'snapshotTimestamp': timestamp, 'retrievedOn': '2026-10-15',
    'sha256': digest, 'bytes': src.stat().st_size,
    'license': 'ODbL-1.0', 'attribution': '© OpenStreetMap contributors',
    'licenseUrl': 'https://www.openstreetmap.org/copyright',
    'officialTimetableEvidence': False,
    'counts': {'nodes': len(handler.nodes), 'ways': len(handler.ways), 'relations': len(handler.relations)},
    'scope': 'Country extract; boundary clipping and OSM omissions require independent national completeness audit.'
}
for name, value in [('osm-nodes', handler.nodes), ('osm-ways', handler.ways), ('osm-relations', handler.relations), ('osm-manifest', manifest)]:
    (dest / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=True, indent=2))
