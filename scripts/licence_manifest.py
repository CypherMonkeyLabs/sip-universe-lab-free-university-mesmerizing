#!/usr/bin/env python3
"""Check THIRD_PARTY_MANIFEST.json hashes and THIRD_PARTY_NOTICES.md.

  python3 scripts/licence_manifest.py
  python3 scripts/licence_manifest.py --write
"""
import hashlib, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAN = ROOT / "THIRD_PARTY_MANIFEST.json"
SCAN = ["vendor", "campus/vendor", "assets/fonts"]

COMPONENTS = [
    {
        "name": "three.js",
        "version": "r170 and campus r159",
        "licence": "MIT",
        "url": "https://threejs.org",
        "licence_file": "campus/vendor/THREE-LICENSE.txt",
        "paths": ["vendor/three.module.min.js", "campus/vendor/three.min.js"],
    },
    {
        "name": "anime.js",
        "version": "4.5.0",
        "licence": "MIT",
        "url": "https://animejs.com",
        "licence_file": "campus/vendor/ANIME-LICENSE.txt",
        "paths": ["vendor/anime.esm.min.js", "campus/vendor/anime.umd.min.js"],
    },
    {
        "name": "d3",
        "version": "7.9.0",
        "licence": "ISC",
        "url": "https://d3js.org",
        "licence_file": "campus/vendor/D3-LICENSE.txt",
        "paths": ["vendor/d3.min.js", "campus/vendor/d3.min.js"],
    },
    {
        "name": "rough.js",
        "version": "4.6.6",
        "licence": "MIT",
        "url": "https://roughjs.com",
        "licence_file": "campus/vendor/ROUGH-LICENSE.txt",
        "paths": ["vendor/rough.esm.js", "campus/vendor/rough.js"],
    },
    {
        "name": "canvas-confetti",
        "version": "1.9.3",
        "licence": "ISC",
        "url": "https://www.npmjs.com/package/canvas-confetti",
        "licence_file": "campus/vendor/CONFETTI-LICENSE.txt",
        "paths": ["vendor/confetti.browser.js", "campus/vendor/confetti.browser.js"],
    },
    {
        "name": "outfit and space grotesk latin subsets",
        "version": "unconfirmed",
        "licence": "unconfirmed",
        "url": "https://fonts.google.com/specimen/Outfit",
        "licence_file": "(unconfirmed — no licence file was shipped beside the woff2 files; left in place)",
        "paths": ["assets/fonts/outfit-latin.woff2", "assets/fonts/space-grotesk-latin.woff2"],
    },
    {
        "name": "markmap-view",
        "version": "0.18.12",
        "licence": "MIT",
        "url": "https://markmap.js.org",
        "licence_file": "campus/vendor/MARKMAP-LICENSE.txt",
        "paths": ["vendor/markmap-view.js", "campus/vendor/markmap-view.js"],
    },
]


def sha(path):
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def build():
    components = []
    for spec in COMPONENTS:
        files = [{"path": rel, "sha256": sha(ROOT / rel)} for rel in spec["paths"]]
        components.append({key: spec[key] for key in ("name", "version", "licence", "url", "licence_file")} | {"files": files})
    return {"components": components}


def main():
    if "--write" in sys.argv:
        MAN.write_text(json.dumps(build(), indent=2) + "\n")
        print("rewrote", MAN)
        return 0
    data = json.loads(MAN.read_text())
    files = {item["path"]: item for component in data["components"] for item in component["files"]}
    problems = []
    for path, item in files.items():
        target = ROOT / path
        if not target.is_file():
            problems.append(f"listed but missing: {path}")
        elif sha(target) != item["sha256"]:
            problems.append(f"hash mismatch: {path}")
    for folder in SCAN:
        base = ROOT / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if path.is_file() and path.suffix.lower() not in {".txt", ".md"} and path.relative_to(ROOT).as_posix() not in files:
                problems.append(f"vendored file not in manifest: {path.relative_to(ROOT)}")
    for component in data["components"]:
        for key in ("name", "version", "licence", "url", "licence_file"):
            if not component.get(key):
                problems.append(f"{component.get('name')}: missing {key}")
        licence = component.get("licence_file") or ""
        if licence and not licence.startswith("(") and not (ROOT / licence).is_file():
            problems.append(f"{component['name']}: licence file missing {licence}")
    notices = (ROOT / "THIRD_PARTY_NOTICES.md").read_text()
    if re.search(r"\bverify\b", notices, re.I):
        problems.append("THIRD_PARTY_NOTICES.md still contains an unresolved check word")
    for problem in problems:
        print("FAIL", problem)
    print("manifest:", len(files), "files,", len(data["components"]), "components,", len(problems), "problems")
    return 1 if problems else 0


sys.exit(main())
