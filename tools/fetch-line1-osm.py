#!/usr/bin/env python3
"""Download real OSM Line 1 route relations, not invented station-to-station lines.
Output is raw source/audit only; publishing playable routes requires connectivity validation.
"""
import json, pathlib, urllib.request, xml.etree.ElementTree as ET, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"kr"/"source"/"osm"/"line-1"
BASE="https://www.openstreetmap.org/api/0.6/"
MASTER=8691899
def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":"SUBTYPE railway data verifier (noncommercial GitHub project)"})
    with urllib.request.urlopen(req,timeout=50) as response:return response.read()
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    master=get(BASE+f"relation/{MASTER}")
    (OUT/f"relation-{MASTER}.osm").write_bytes(master)
    root=ET.fromstring(master)
    members=[int(m.attrib["ref"]) for m in root.findall(".//member") if m.attrib.get("type")=="relation"]
    if not members:
        print("No child relations; master alone is insufficient to build a through service.",file=sys.stderr)
    report={"routeMaster":MASTER,"childRelations":members,"downloaded":[],"errors":[],"publishedAsVerified":False}
    for relation in members:
        try:
            data=get(BASE+f"relation/{relation}/full")
            xml=ET.fromstring(data)
            ways=len(xml.findall("way"));nodes=len(xml.findall("node"))
            if not ways or not nodes:raise ValueError("Missing referenced ways/nodes")
            (OUT/f"relation-{relation}-full.osm").write_bytes(data)
            report["downloaded"].append({"id":relation,"ways":ways,"nodes":nodes})
        except Exception as exc:report["errors"].append({"id":relation,"error":str(exc)})
    (OUT/"audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,ensure_ascii=False))
    if report["errors"] or not report["downloaded"]:sys.exit(1)
if __name__=="__main__":main()
