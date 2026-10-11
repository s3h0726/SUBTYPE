#!/usr/bin/env python3
"""Inspect real OSM line 1 route relation data; never fabricate straight track segments.

Usage:
  python tools/prepare-line1-osm.py input.osm > data/kr/line1-osm-audit.json

Download an OSM relation AND its full member ways/nodes separately before running.
Route-master relations may contain child route relations; supply their expanded XML too.
"""
import json,sys,xml.etree.ElementTree as ET
from collections import defaultdict

def read(path):
    root=ET.parse(path).getroot()
    nodes={e.attrib["id"]:(float(e.attrib["lat"]),float(e.attrib["lon"])) for e in root.findall("node")}
    ways={e.attrib["id"]:[n.attrib["ref"] for n in e.findall("nd")] for e in root.findall("way")}
    relations={e.attrib["id"]:e for e in root.findall("relation")}
    return nodes,ways,relations

def main(path):
    nodes,ways,relations=read(path)
    routes=[]
    missing=[]
    for rid,rel in relations.items():
        tags={t.attrib["k"]:t.attrib["v"] for t in rel.findall("tag")}
        if tags.get("route") not in ("subway","train","light_rail"):
            continue
        members=rel.findall("member")
        tracks=[]
        for member in members:
            if member.attrib["type"]!="way" or member.attrib.get("role","") in ("platform","stop"):
                continue
            wid=member.attrib["ref"]
            ids=ways.get(wid)
            if not ids or any(n not in nodes for n in ids):
                missing.append({"relation":rid,"way":wid,"reason":"missing way nodes"})
                continue
            coords=[nodes[n] for n in ids]
            if len(coords)>1:tracks.append({"wayId":wid,"coordinates":coords})
        stops=[]
        for member in members:
            if member.attrib.get("role","") not in ("stop","stop_entry_only","stop_exit_only","platform"):
                continue
            ref=member.attrib["ref"]
            if member.attrib["type"]=="node" and ref in nodes:
                stops.append({"nodeId":ref,"coordinate":nodes[ref]})
        routes.append({"relationId":rid,"name":tags.get("name",""),"ref":tags.get("ref",""),
                       "from":tags.get("from",""),"to":tags.get("to",""),
                       "rawTrackWays":tracks,"stopCoordinates":stops})
    result={"source":"OpenStreetMap API route relation full XML","license":"ODbL-1.0",
            "attribution":"© OpenStreetMap contributors","verifiedGameGeometry":False,
            "note":"Track ways are raw segments, NOT an ordered or connected playable geometry. Validate continuity, stops and directions before publishing.",
            "routes":routes,"missingMembers":missing}
    print(json.dumps(result,ensure_ascii=False,separators=(",",":")))

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("usage: prepare-line1-osm.py input.osm")
    main(sys.argv[1])
