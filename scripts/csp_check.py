#!/usr/bin/env python3
"""Report off-origin loads. Anchor citations are allowed. Exit 1 if any load is off-origin."""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
fail = []
patterns = [
    (r'<(?:script|img|iframe|source|video|audio)[^>]+\bsrc="(https?://[^"]+)"', "html src"),
    (r'<link[^>]+href="(https?://[^"]+)"', "html link"),
    (r'url\(\s*["\']?(https?://[^)"\']+)', "css url()"),
    (r'@import\s+["\'](https?://[^"\']+)', "css @import"),
    (r'\bimport\s*(?:\(|[^;]*from\s*)["\'](https?://[^"\']+)', "js import"),
    (r'\bfetch\(\s*["\'`](https?://[^"\'`]+)', "js fetch"),
    (r'new (?:Worker|WebSocket|EventSource)\(\s*["\'`](https?://[^"\'`]+)', "js net"),
]
files = []
for pattern in ("*.html",):
    files.extend(ROOT.glob(pattern))
    files.extend((ROOT / "rooms").glob(pattern))
    files.extend((ROOT / "tracks").glob(pattern))
files.extend((ROOT / "assets").rglob("*.css"))
files.extend((ROOT / "assets").rglob("*.js"))
files.extend((ROOT / "guide").glob("*.js"))
files.extend((ROOT / "guide").glob("*.mjs"))
files.extend((ROOT / "shared").rglob("*.js"))
files.append(ROOT / "sw.js")
seen = set()
for path in files:
    if not path.is_file() or path in seen:
        continue
    seen.add(path)
    text = path.read_text(errors="replace")
    for pat, kind in patterns:
        for match in re.finditer(pat, text):
            fail.append(f"{path.relative_to(ROOT)}: off-origin {kind}: {match.group(1)}")
for item in fail:
    print("FAIL", item)
print("csp_check:", len(fail), "off-origin loads")
sys.exit(1 if fail else 0)
