#!/usr/bin/env python3
"""Emit campus/data JSON from the curriculum sources."""

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "content"))

import extras  # noqa: E402
import tracks_2  # noqa: E402
import tracks_3  # noqa: E402

OUT = ROOT / "campus" / "data"
ILLUSTRATIONS = {"layers", "states", "table", "nodes"}
LAB_KINDS = {"ladder", "dissect", "sdp", "sandbox", "capture", "config"}


def load_frozen(name):
    return json.loads((ROOT / "content" / "frozen" / name).read_text(encoding="utf-8"))


def walk_cites(node, found):
    if isinstance(node, dict):
        if "url" in node and "label" in node and isinstance(node["url"], str):
            found.append(node)
        for value in node.values():
            walk_cites(value, found)
    elif isinstance(node, list):
        for value in node:
            walk_cites(value, found)


def validate(tracks):
    problems = []
    seen = set()
    for track in tracks:
        tid = track.get("id")
        if not tid or tid in seen:
            problems.append(f"bad track id {tid}")
        seen.add(tid)
        for key in ("title", "summary", "level", "order", "lessons"):
            if key not in track:
                problems.append(f"{tid} missing {key}")
        lids = set()
        for lesson in track.get("lessons", []):
            lid = lesson.get("id")
            where = f"{tid}/{lid}"
            if not lid or lid in lids:
                problems.append(f"bad lesson id {where}")
            lids.add(lid)
            for key in ("title", "summary", "minutes", "illustration", "flow", "quiz", "cards", "lab", "fault"):
                if not lesson.get(key):
                    problems.append(f"{where} missing {key}")
            ill = lesson.get("illustration") or {}
            if ill.get("type") not in ILLUSTRATIONS and ill.get("type") != "nodes" and "nodes" not in ill and ill.get("type") not in (None, "layers", "states", "table"):
                problems.append(f"{where} illustration {ill.get('type')}")
            if ill and ill.get("type") not in (None, "layers", "states", "table") and "nodes" not in ill:
                problems.append(f"{where} illustration {ill.get('type')}")
            flow = lesson.get("flow") or {}
            steps = flow.get("steps") or []
            if len(steps) < 2 or not flow.get("parties"):
                problems.append(f"{where} flow too short")
            for step in steps:
                if not {"from", "to", "label", "message"} <= set(step):
                    problems.append(f"{where} hop missing fields")
                    break
            quiz = lesson.get("quiz") or []
            if len(quiz) < 4:
                problems.append(f"{where} quiz {len(quiz)}")
            for i, item in enumerate(quiz):
                choices = item.get("choices") or []
                if not (0 <= item.get("answer", -1) < len(choices)):
                    problems.append(f"{where} quiz {i} answer")
            if len(lesson.get("cards") or []) < 2:
                problems.append(f"{where} cards")
            lab = lesson.get("lab") or {}
            if lab.get("kind") not in LAB_KINDS:
                problems.append(f"{where} lab kind {lab.get('kind')}")
            fault = lesson.get("fault") or {}
            fchoices = fault.get("choices") or []
            if not (0 <= fault.get("answer", -1) < len(fchoices)):
                problems.append(f"{where} fault answer")
            cites = []
            walk_cites(lesson, cites)
            if len(cites) < 1:
                problems.append(f"{where} no cites")
            for cite in cites:
                if not str(cite.get("url", "")).startswith("http"):
                    problems.append(f"{where} bad cite {cite}")
                    break
    return problems


def rfc_dates(numbers):
    """Publication month printed in the RFC text header, not the index row.

    The rfc-index month disagrees with the document header for several SIP
    RFCs (3261 and 3264 say June 2002 in the text and July 2002 in the index).
    The header is what the linked document shows.
    """
    import re
    cache_path = ROOT / "content" / "frozen" / "rfc-dates.json"
    cached = {}
    if cache_path.exists():
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
    # Drop index-era values that lack a source tag.
    if cached and not cached.get("_source"):
        cached = {}
    missing = [n for n in numbers if n not in cached]
    month = re.compile(
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b"
    )
    for n in missing:
        try:
            req = urllib.request.Request(
                f"https://www.rfc-editor.org/rfc/rfc{n}.txt",
                headers={"User-Agent": "sip-universe-build"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                head = resp.read(4000).decode("utf-8", "replace")
            found = month.search(head)
            if found:
                cached[n] = f"{found.group(1)} {found.group(2)}"
        except Exception as err:
            print(f"rfc {n} date skipped: {err}", file=sys.stderr)
    cached["_source"] = "rfc-editor txt header"
    cache_path.write_text(json.dumps(cached, indent=1) + "\n", encoding="utf-8")
    return cached


def main():
    tracks = []
    tracks.extend(load_frozen("tracks_1.json"))
    tracks.extend(tracks_2.tracks())
    tracks.extend(tracks_3.tracks())
    tracks.extend(load_frozen("tracks_4.json"))
    tracks.sort(key=lambda t: t["order"])
    problems = validate(tracks)
    if problems:
        print("\n".join(problems[:40]))
        print(f"{len(problems)} problems")
        sys.exit(1)

    OUT.mkdir(parents=True, exist_ok=True)
    track_dir = OUT / "tracks"
    track_dir.mkdir(exist_ok=True)
    catalog_tracks = []
    counts = {"quizzes": 0, "cards": 0, "labs": 0, "faults": 0, "cites": 0, "flows": 0, "illustrations": 0}
    featured = []
    flows = []
    samples_src = {"dissect": None, "sdp": None, "cube": None, "acme": None, "capture": None}

    for track in tracks:
        fname = f"{track['order']:02d}-{track['id']}.json"
        (track_dir / fname).write_text(json.dumps(track, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        catalog_tracks.append({
            "id": track["id"],
            "title": track["title"],
            "summary": track["summary"],
            "level": track["level"],
            "order": track["order"],
            "file": f"data/tracks/{fname}",
            "lessons": [
                {
                    "id": lesson["id"],
                    "title": lesson["title"],
                    "summary": lesson["summary"],
                    "minutes": lesson["minutes"],
                    "tags": lesson.get("tags") or [],
                }
                for lesson in track["lessons"]
            ],
        })
        if track["lessons"]:
            flow = dict(track["lessons"][0]["flow"])
            flow["title"] = f"{track['title']}: {flow.get('title') or track['lessons'][0]['title']}"
            flows.append(flow)
        for lesson in track["lessons"]:
            counts["quizzes"] += len(lesson["quiz"])
            counts["cards"] += len(lesson["cards"])
            counts["labs"] += 1
            counts["faults"] += 1
            counts["flows"] += 1
            counts["illustrations"] += 1
            cites = []
            walk_cites(lesson, cites)
            counts["cites"] += len(cites)
            lab = lesson["lab"]
            href = f"#/lesson/{track['id']}/{lesson['id']}"
            if lab["kind"] != "ladder" or len(featured) < 28:
                featured.append({
                    "title": lab["title"],
                    "kind": lab["kind"],
                    "prompt": lab.get("prompt") or lesson["summary"],
                    "href": href,
                    "track": track["id"],
                })
            kind = lab["kind"]
            if kind == "dissect" and samples_src["dissect"] is None and lab.get("message"):
                samples_src["dissect"] = lab["message"]
            if kind == "sdp" and samples_src["sdp"] is None and lab.get("offer") and lab.get("answer"):
                samples_src["sdp"] = lab
            if kind == "sandbox" and lab.get("dialect") == "cube" and samples_src["cube"] is None:
                samples_src["cube"] = lab
            if kind == "sandbox" and lab.get("dialect") == "acme" and samples_src["acme"] is None:
                samples_src["acme"] = lab
            if kind == "capture" and samples_src["capture"] is None and lab.get("message"):
                samples_src["capture"] = lab["message"]

    # Prefer non-ladder labs, then fill to at least 24.
    preferred = [lab for lab in featured if lab["kind"] != "ladder"]
    ladders = [lab for lab in featured if lab["kind"] == "ladder"]
    picked = preferred + ladders
    # Unique by href
    seen_href = set()
    labs = []
    for lab in picked:
        if lab["href"] in seen_href:
            continue
        seen_href.add(lab["href"])
        labs.append({k: lab[k] for k in ("title", "kind", "prompt", "href")})
        if len(labs) >= 28:
            break

    glossary = extras.glossary()
    boss = extras.boss()
    interview = extras.interview()
    ecosystem = extras.ecosystem()
    certs = extras.certs()
    preview = extras.preview()

    numbers = []
    for row in ecosystem["timeline"]:
        digits = "".join(ch for ch in row["rfc"] if ch.isdigit())
        if digits:
            numbers.append(digits)
    dates = rfc_dates(numbers)
    for row in ecosystem["timeline"]:
        digits = "".join(ch for ch in row["rfc"] if ch.isdigit())
        if digits in dates:
            row["date"] = dates[digits]

    for blob in (glossary, boss, interview, ecosystem, certs):
        cites = []
        walk_cites(blob, cites)
        counts["cites"] += len(cites)

    catalog = {
        "stats": {
            "tracks": len(tracks),
            "lessons": sum(len(t["lessons"]) for t in tracks),
            "quizzes": counts["quizzes"],
            "cards": counts["cards"],
            "labs": counts["labs"],
            "faults": counts["faults"],
            "boss": len(boss["incidents"]),
            "interview": len(interview["items"]),
            "glossary": len(glossary["terms"]),
            "cites": counts["cites"],
        },
        "preview": preview,
        "tracks": catalog_tracks,
    }

    invite = samples_src["dissect"] or preview["steps"][0]["message"]
    sdp = samples_src["sdp"] or {}
    cube = samples_src["cube"] or {}
    samples = {
        "flows": flows,
        "messages": {"invite": invite},
        "sdp": {
            "offer": sdp.get("offer") or "v=0\no=- 1 1 IN IP4 203.0.113.10\ns=-\nc=IN IP4 203.0.113.10\nt=0 0\nm=audio 49170 RTP/AVP 0 8 101\na=rtpmap:0 PCMU/8000\na=rtpmap:8 PCMA/8000\na=rtpmap:101 telephone-event/8000\na=sendrecv\n",
            "answer": sdp.get("answer") or "v=0\no=- 2 1 IN IP4 203.0.113.20\ns=-\nc=IN IP4 203.0.113.20\nt=0 0\nm=audio 19642 RTP/AVP 0 101\na=rtpmap:0 PCMU/8000\na=rtpmap:101 telephone-event/8000\na=sendrecv\n",
        },
        "sandbox": {
            "rules": cube.get("rules") or "request INVITE sip-header Diversion remove\n",
            "message": cube.get("message") or invite,
        },
        "capture": samples_src["capture"] or "Received:\n" + invite,
    }
    if not samples_src["sdp"]:
        print("warning: no sdp lab with offer and answer; using built-in sample", file=sys.stderr)
    if not samples_src["capture"]:
        print("warning: no capture lab message", file=sys.stderr)

    def dump(name, obj):
        path = OUT / name
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        return path.stat().st_size

    sizes = {
        "catalog.json": dump("catalog.json", catalog),
        "glossary.json": dump("glossary.json", glossary),
        "boss.json": dump("boss.json", boss),
        "interview.json": dump("interview.json", interview),
        "ecosystem.json": dump("ecosystem.json", ecosystem),
        "certs.json": dump("certs.json", certs),
        "labs.json": dump("labs.json", {"labs": labs}),
        "samples.json": dump("samples.json", samples),
    }
    print(json.dumps({"stats": catalog["stats"], "featuredLabs": len(labs), "bytes": sizes}, indent=2))


if __name__ == "__main__":
    main()
