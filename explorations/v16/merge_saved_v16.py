# -*- coding: utf-8 -*-
"""Merge this round's change onto the version Lion saved from inside the page.

His save moved every row heading and both page titles by hand — a few px in x
and a variable amount in y — and changed no artboard content and no note text
(122 of 144 artboards were byte-identical; the 22 that differed are exactly the
frames this round's chip fix touches).

So: his canvas.json is the base for POSITIONS, my build is the source for
artboard CONTENT, and only what I actually changed is applied on top.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
SAVED = pathlib.Path("/tmp/v16saved/canvas.json")
MINE = HERE / "canvas.json"
ROW6_Y, COL_W, GAP_FRAME_NOTE = 18887, 470, 44

saved = json.loads(SAVED.read_text(encoding="utf-8"))
mine = json.loads(MINE.read_text(encoding="utf-8"))
mine_ab = {a["file"]: a for a in mine["artboards"]}
mine_no = {a["id"]: a for a in mine["annotations"]}
saved_ids = {a["file"] for a in saved["artboards"]}

# 1 · the two frames this round adds, appended to row 6 at the saved row's y so
#     nothing already on that row has to move. RTL reads larger x first, so the
#     default (RING) comes first.
new = [("V16CHIPSRING.dc.html", 2 + 6 * COL_W),
       ("V16CHIPSFLAT.dc.html", 2 + 5 * COL_W)]
for f, x in new:
    assert f not in saved_ids, f
    a = dict(mine_ab[f]); a.update(x=x, y=ROW6_Y, page="screens")
    saved["artboards"].append(a)

# 2 · their notes, placed the way every other frame note is: below the frame
for f, x in new:
    nid = "n-" + f.replace(".dc.html", "").lower()
    n = dict(mine_no[nid])
    h = mine_ab[f]["h"]
    n.update(x=x, y=ROW6_Y + h + GAP_FRAME_NOTE, page="screens")
    saved["annotations"].append(n)

# 3 · the row-6 heading gains this round's paragraph. Its POSITION is Lion's and
#     is left exactly as he dragged it; only the text changes.
by_id = {a["id"]: a for a in saved["annotations"]}
h6 = by_id["h-screens6"]
kept_xy = (h6["x"], h6["y"])
h6["text"] = mine_no["h-screens6"]["text"]
assert (h6["x"], h6["y"]) == kept_xy

moved = sum(1 for a in saved["annotations"]
            if a["id"] in mine_no and a.get("id", "").startswith(("h-", "t-"))
            and (a["x"], a["y"]) != (mine_no[a["id"]]["x"], mine_no[a["id"]]["y"]))
MINE.write_text(json.dumps(saved, ensure_ascii=False, indent=2), encoding="utf-8")
print("merged: %d artboards, %d notes, %d pages"
      % (len(saved["artboards"]), len(saved["annotations"]), len(saved["pages"])))
print("Lion's hand-placed headings preserved: %d" % moved)
print("added: %s" % ", ".join(f for f, _ in new))
