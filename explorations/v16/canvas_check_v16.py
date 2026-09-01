# -*- coding: utf-8 -*-
"""Canvas-level geometry: do any two sticky notes, or a note and a frame,
overlap on the same page?

The in-frame overlap audit cannot see this — it renders one artboard at a
time. This is the check that caught the v8 pile-up, and the estimator it uses
(note_height, NOTE_SAFETY) is calibrated against a published render, so it is
an ESTIMATE with headroom, not a measurement: it will not catch a note that
overflows by a few pixels, and it is deliberately pessimistic about height.

    python3 explorations/v13/canvas_check_v16.py
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_v16 as B

C = json.loads((HERE / "canvas.json").read_text(encoding="utf-8"))
PAGE0 = C["pages"][0]["id"]

def boxes(page):
    out = []
    for a in C["artboards"]:
        if a.get("page", PAGE0) == page:
            # the name strip and tweak chips sit above each frame
            out.append(("frame " + a["file"], a["x"], a["y"] - 34, a["w"], a["h"] + 34))
    for n in C["annotations"]:
        if n.get("page", PAGE0) == page:
            h = B.note_height(n["text"], n["w"], B.NOTE_SIZE_PX.get(n.get("size", "s"), 13))
            out.append(("note " + n["id"], n["x"], n["y"], n["w"], h))
    return out

def hit(a, b):
    return not (a[1] + a[3] <= b[1] or b[1] + b[3] <= a[1]
                or a[2] + a[4] <= b[2] or b[2] + b[4] <= a[2])

bad = 0
for pid, pname in [(p["id"], p["name"]) for p in C["pages"]]:
    bs = boxes(pid)
    hits = [(x[0], y[0]) for i, x in enumerate(bs) for y in bs[i + 1:] if hit(x, y)]
    print("%-26s %3d boxes · %d collisions" % (pname, len(bs), len(hits)))
    for u, v in hits:
        print("   !! %s  x  %s" % (u, v))
    bad += len(hits)
print("\n%s" % ("CANVAS CLEAN — nothing stacked on any page."
                if not bad else "%d CANVAS COLLISIONS" % bad))
sys.exit(1 if bad else 0)
