"""Export complete passenger relations from regional Geofabrik PBF extracts.

Requires pyosmium. Input extracts should be from the same daily publication.
Missing members are reported instead of bridging gaps or emitting partial paths.
"""

import argparse
import gzip
import json
import re
from pathlib import Path

import osmium


def record(item, kind):
    return {
        "type": kind,
        "id": item.id,
        "version": item.version,
        "timestamp": str(item.timestamp),
        "tags": dict(item.tags),
    }


def scan(files, entity_type, callback, ids=None):
    for file in files:
        processor = osmium.FileProcessor(str(file), entity_type)
        if ids is not None:
            processor = processor.with_filter(osmium.filter.IdFilter(ids))
        for item in processor:
            callback(item)


def remember(records, value):
    previous = records.get(value["id"])
    if previous is None or value["version"] > previous["version"]:
        records[value["id"]] = value


def extract(files, output, operator_pattern):
    relations, ways, nodes = {}, {}, {}

    def read_relation(item):
        if item.tags.get("route") not in {"train", "tram", "light_rail", "subway"}:
            return
        if not operator_pattern.search(item.tags.get("operator", "")):
            return
        members = [
            {"type": {"n": "node", "w": "way", "r": "relation"}[m.type],
             "ref": m.ref, "role": m.role}
            for m in item.members
        ]
        remember(relations, {**record(item, "relation"), "members": members})

    scan(files, osmium.osm.RELATION, read_relation)
    print(f"Discovered {len(relations)} passenger relations", flush=True)
    way_ids = {m["ref"] for r in relations.values() for m in r["members"] if m["type"] == "way"}
    node_ids = {m["ref"] for r in relations.values() for m in r["members"] if m["type"] == "node"}

    def read_way(item):
        if item.id in way_ids:
            remember(ways, {**record(item, "way"), "nodes": [n.ref for n in item.nodes]})

    scan(files, osmium.osm.WAY, read_way, way_ids)
    node_ids.update(n for w in ways.values() for n in w["nodes"])

    def read_node(item):
        if item.id in node_ids and item.location.valid():
            remember(nodes, {**record(item, "node"), "lat": item.location.lat, "lon": item.location.lon})

    scan(files, osmium.osm.NODE, read_node, node_ids)
    output.mkdir(parents=True, exist_ok=True)
    inventory = []
    for relation in sorted(relations.values(), key=lambda r: r["id"]):
        members = relation["members"]
        relation_ways = {m["ref"]: ways.get(m["ref"]) for m in members if m["type"] == "way"}
        relation_node_ids = {m["ref"] for m in members if m["type"] == "node"}
        relation_node_ids.update(n for w in relation_ways.values() if w for n in w["nodes"])
        required = [m for m in members if "platform" not in m["role"]]
        required_ways = [ways.get(m["ref"]) for m in required if m["type"] == "way"]
        required_nodes = {m["ref"] for m in required if m["type"] == "node"}
        required_nodes.update(n for w in required_ways if w for n in w["nodes"])
        missing = (sum(w is None for w in required_ways)
                   + sum(n not in nodes for n in required_nodes)
                   + sum(m["type"] == "relation" for m in required))
        inventory.append({"id": relation["id"], "tags": relation["tags"], "missingMembers": missing})
        if missing:
            continue
        elements = [nodes[n] for n in sorted(relation_node_ids) if n in nodes]
        elements.extend(relation_ways[k] for k in sorted(relation_ways)
                        if relation_ways[k] and all(n in nodes for n in relation_ways[k]["nodes"]))
        elements.append(relation)
        payload = json.dumps({"elements": elements}, ensure_ascii=False, separators=(",", ":"))
        (output / f'{relation["id"]}.json.gz').write_bytes(gzip.compress(payload.encode("utf-8"), mtime=0))
    (output / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {sum(not r['missingMembers'] for r in inventory)} of {len(inventory)} relations")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--operator", required=True)
    parser.add_argument("inputs", type=Path, nargs="+")
    args = parser.parse_args()
    extract(args.inputs, args.output, re.compile(args.operator, re.IGNORECASE))
