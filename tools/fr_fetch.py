"""Acquire official French rail source files into an external cache."""

import argparse
import shutil
import subprocess
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fr_inventory import catalog_sources, json_read


PAN = "https://transport.data.gouv.fr/api/datasets"
RFN = "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/"


def download(task):
    destination, urls, check = task
    if destination.exists() and check(destination):
        return destination.name, True
    temporary = destination.with_suffix(destination.suffix + ".download")
    for url in dict.fromkeys(filter(None, urls)):
        result = subprocess.run([shutil.which("curl") or "curl", "--fail", "--location", "--silent",
                                 "--show-error", "--retry", "1", "--max-time", "90",
                                 "--output", str(temporary), url], capture_output=True)
        if result.returncode == 0 and check(temporary):
            temporary.replace(destination)
            return destination.name, True
    temporary.unlink(missing_ok=True)
    return destination.name, False


def valid_json(path):
    try:
        return bool(json_read(path))
    except (ValueError, OSError):
        return False


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--resource", action="append", type=int, help="Process only this resource ID; repeatable")
    parser.add_argument("--include-unknown-mode", action="store_true", help="Probe sources without mode metadata")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    catalog = args.cache / "fr-pan.json"
    _, available = download((catalog, [PAN], valid_json))
    if not available:
        raise SystemExit("Unable to acquire the Point d’Accès National catalogue.")
    tasks = []
    for source in catalog_sources(json_read(catalog)):
        resource = source["resourceId"]
        if args.resource and resource not in args.resource:
            continue
        if not args.resource and not args.include_unknown_mode and not source["reportedModes"]:
            continue
        tasks.append((args.cache / f"fr-{resource}.zip",
                      [source["downloadUrl"], source["catalogDownloadUrl"],
                       f"https://transport.data.gouv.fr/resources/{resource}/download"], zipfile.is_zipfile))
    if not args.resource:
        for name, dataset in (
            ("fr-rfn.geojson", "formes-des-lignes-du-rfn"),
            ("fr-rfn-tracks.geojson", "fichier-de-formes-des-voies-du-reseau-ferre-national"),
        ):
            tasks.append((args.cache / name, [RFN + dataset + "/exports/geojson"], valid_json))
    failures = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        for name, available in executor.map(download, tasks):
            print(f"{name}: {'cached' if available else 'unavailable'}", flush=True)
            if not available:
                failures.append(name)
    if failures:
        raise SystemExit(f"{len(failures)} source downloads unavailable.")


if __name__ == "__main__":
    run()
