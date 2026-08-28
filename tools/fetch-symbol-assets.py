import json, pathlib, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "route-symbols"
OUT.mkdir(parents=True, exist_ok=True)

files = {}
for code in ["JY","JC","JB","JK","JA","JO","JS","JE","JM","JN","JH","JT","JU","JJ"]:
    files[f"jr-east:{code}"] = f"JR {code} line symbol.svg"
metro = {"G":"Ginza","M":"Marunouchi","H":"Hibiya","T":"Tōzai","C":"Chiyoda","Y":"Yurakucho","Z":"Hanzōmon","N":"Namboku","F":"Fukutoshin"}
for code, name in metro.items(): files[f"tokyo-metro:{code}"] = f"Logo of Tokyo Metro {name} Line.svg"
for code in ["TY","MG","SH","DT","OM","IK","TM","SG"]: files[f"tokyu:{code}"] = f"Tokyu {code} line symbol.svg"
files.update({
    "odakyu:OH":"Odakyu odawara.svg", "odakyu:OE":"Odakyu enoshima.svg", "odakyu:OT":"Odakyu tama.svg",
    "toei:A":"Toei Asakusa line symbol.svg", "toei:I":"Toei Mita line symbol.svg", "toei:S":"Toei Shinjuku line symbol.svg", "toei:E":"Toei Oedo line symbol.svg",
})

metadata = {"verifiedDate":"2026-08-22","assets":{}}
for key, commons_name in files.items():
    filename = key.replace(":", "-").lower() + ".svg"
    if (OUT / filename).exists():
        metadata["assets"][key] = {"asset":f"./assets/route-symbols/{filename}","source":f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(commons_name.replace(' ','_'))}","license":"PD-textlogo; trademark rights may apply","verifiedDate":"2026-08-22"}
        print("KEEP", key)
        continue
    url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(commons_name)
    request = urllib.request.Request(url, headers={"User-Agent":"TokyoRailTyping/1.0 (data verification)"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = response.read()
            content_type = response.headers.get_content_type()
            if content_type != "image/svg+xml" or b"<svg" not in data[:5000]: raise ValueError(content_type)
        (OUT / filename).write_bytes(data)
        metadata["assets"][key] = {"asset":f"./assets/route-symbols/{filename}","source":f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(commons_name.replace(' ','_'))}","license":"PD-textlogo; trademark rights may apply","verifiedDate":"2026-08-22"}
        print("OK", key, commons_name)
    except Exception as error:
        print("MISS", key, repr(commons_name), repr(error))
    time.sleep(1.0)

(ROOT / "data" / "route-symbol-assets.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("verified", len(metadata["assets"]), "/", len(files))
