# -*- coding: utf-8 -*-
"""Write prototype/manifest.json from the same tables the board draws from.

Generated, never hand-kept: the ids come out of data.js and the file list comes
off disk, so the manifest cannot describe an asset that is not there or miss one
that is. Every path is a PATH — nothing in this bundle is base64.
"""
import json, pathlib, math
from PIL import Image
import numpy as np
HERE = pathlib.Path(__file__).resolve().parent.parent
ROOT = HERE.parent.parent
MK = ROOT / "assets" / "mk"
REL = "assets/mk"                       # relative to the app's own index.html
TOPICS = ROOT / "assets" / "topics"
TREL = "assets/topics"

src = (ROOT / "data.js").read_text(encoding="utf-8")
D = json.loads(src[src.index("{"):src.index("const AVATARS")].rstrip().rstrip(";").rstrip())

# THE LIST COMES OFF DISK, not out of a tuple kept by hand here. A stem is
# accepted only if it is a data.js politician id AND both exports exist, so a
# half-written pair, a stray style-comparison file, or a source with no data.js
# id (lazimi, may_golan, ohanah, troper — a client question, not a fix) can
# never reach the manifest. Adding a portrait is running frame_mk.py; nothing
# in this file has to be edited to keep up.
PORTRAITS = tuple(sorted(
    pid for pid in D["politicians"]
    if (MK / ("mk_%s_400.webp" % pid)).exists()
       and (MK / ("mk_%s_128.webp" % pid)).exists()))
# THE MAP'S TOPIC ICONS — one drawn object per topic, all eight, framed by
# tools/prep_topic.py into assets/topics/. The value is the FILE STEM, which is
# the topic id for seven of them and deliberately is not for the eighth.
#
# internal_sec IS THE POLICE HAT. Two files were rejected for that node and
# both are still on disk:
#   assets/mk/internal_sec_main.png   a PADLOCK. Seven object nodes and one
#       padlock reads as "this topic is locked", and locks are on the §3.3 /
#       §8 NEVER list for the map. Retired from here; the issue cards may
#       still reference the framed set, so the files stay.
#   assets/topics/internal_sec_main.webp   a SHIELD carrying a Star of David.
#       A national symbol where the other seven are neutral objects — a
#       receipt, a lectern, a plant, a briefcase. Left in place, unregistered.
# The hat is the neutral object for משטרה, פשיעה ונשק, so it is the one used.
TOPIC_ICONS = {
    "accountability": "accountability",
    "branches":       "branches",
    "economy":        "economy",
    "environment":    "environment",
    "gender":         "gender",
    "internal_sec":   "policehat",
    "military":       "military",
    "religion":       "religion",
}
# THE SMALLEST SIZE EACH OBJECT STILL READS AT, judged on the exports
# themselves at 4x nearest-neighbour against the node's own ground — not
# asserted, and not the same number for all eight. The map renders at 60px off
# the 64px file, so every one of these is comfortably inside its floor; this is
# here so a future screen that wants a 40px topic icon knows which three it
# cannot have.
#   economy   the receipt IS its ruled lines and its torn zigzag edge. At 40px
#             the rules mush into a red block and the tear flattens: it reads
#             as a red slip of paper, not as a receipt.
#   religion  the seal IS its scalloped rim. At 40px the scallops round off to
#             a plain disc and the two ribbon tails merge into one blob.
#   gender    the beam and the two hanger strings are 1px hairlines at 40px and
#             largely dissolve; the pans survive as two dashes. Marginal, not
#             gone — 52 is the honest floor.
# The other five are objects with one strong silhouette and hold at 40.
READS_DOWN_TO = {
    "accountability": 40, "branches": 40, "economy": 64, "environment": 40,
    "gender": 52, "internal_sec": 40, "military": 40, "religion": 64,
}

ISSUE_ART = {"s1": ("internal_sec_s1", 300, 180),
             "s2": ("internal_sec_s2", 116, 210)}

# THE LARGEST CSS SIZE EACH ASSET IS DRAWN AT, MEASURED, NOT ASSERTED.
# Every number here came off a real render of the prototype through every
# screen and every beat at 393x852 and 430x932 — the audit in
# explorations/v19/REPORT.md lists the call sites it found for each one. They
# are the input to the DPR-3 rule, so a wrong number here is a wrongly sized
# asset, which is why they are measured rather than read off the stylesheet.
#
# The card portrait is the one worth explaining: .mf-b__port is
# `width:118%` of a --card-w:340px card, so it is drawn at 401.2 CSS px and
# --card-scale can only ever make it SMALLER. 401 is the ceiling, on every
# phone, and it is the same for all 21 portraits because one CSS rule sizes
# them all — nothing per-MK enters it.
DISPLAY_CSS = {
    "portrait":      401.2,   # .mf-b__port, the cascade and claim cards
    "portrait_sm":    34.0,   # .gx-port, the guess-vs-reality strip
    "topic_icon":    190.0,   # claimArt()'s topic fallback, enlarged by §1.3
                              # from 128. The map node's 56.6 is the SMALLER
                              # of this asset's two sites and is served by 256.
    "law_art":        65.0,   # .stmodal__art, the law modal's placeholder
    "chair":         288.5,   # .i-chair (intro) and .b2chair (tachles)
    "building":      390.0,   # .i-build, the intro
    "issue_art_s1":  300.0,   # .b1art on the claim card
    # the card back's DRIVING dimension is its height: `cover` against a
    # 340x620 box scales by max(340/1536, 620/2752) = 0.2253, height-driven,
    # so the image paints 346 x 620. Measured off offsetHeight, NOT
    # getBoundingClientRect() — the deck rotates its cards and the rotated
    # bounding box reads 359-387px, which would have over-sized the file 12%.
    "card_back":     620.0,
}
DPR = 3

def need(name):
    p = MK / name
    assert p.exists(), "manifest names a file that is not on disk: " + name
    return "%s/%s" % (REL, name)

def need_topic(name):
    p = TOPICS / name
    assert p.exists(), "manifest names a file that is not on disk: " + name
    return "%s/%s" % (TREL, name)

def need_asset(rel):
    """An asset under assets/ that is not part of the MK set. Same guarantee:
    the manifest cannot name a file that is not there."""
    assert (ROOT / rel).exists(), "manifest names a file that is not on disk: " + rel
    return rel

man = {
    "_": ("Generated by tools/make_manifest.py. Ids are data.js's own. "
          "Sizes are the pixel size each file is written at."),
    "sizing_rule": (
        "DPR 3. A file must be written at about THREE TIMES the largest CSS "
        "size the asset is ever displayed at, anywhere in the app. "
        "This replaces the old rule -- 'never let the browser downscale a file "
        "more than 1.2x' -- which was written in CSS pixels and silently "
        "assumed DPR 1. On the phones this ships to, a file at 1.0x the CSS "
        "size is UPSCALED THREE TIMES on device, and that is the softness. "
        "1.2x was not a small error, it was the wrong unit. "
        "THE TARGET IS THE LARGEST DISPLAY SITE, NOT THE NEAREST ONE. An asset "
        "drawn at 52px on the map and 128px on a card is a 384px asset; "
        "picking a size per call site means every new call site is a silent "
        "regression. One file, sized for the worst case. "
        "OVER-TARGET IS ALSO A DEFECT, in bytes rather than in pixels: a file "
        "more than ~1.3x the target is paying for detail no screen can show. "
        "WHERE THE MASTER CANNOT REACH 3x, the shortfall is recorded per asset "
        "as 'dpr' below rather than hidden by upscaling. Upscaling a master to "
        "hit the number adds file size and no detail, and on flat illustration "
        "it softens the alpha edge the #dcw die-cut filter depends on."),
    "portrait_aspect": "3:4 — 400x533 and 128x171",
    "portrait_crop_rule": {
        "face_width_pct_of_frame": 68.3,
        "crown_pct_from_top": 2.4,
        "anchor": "crown",
        "note": ("Top-anchored in the card at --mk-port-top. The bottom is the "
                 "variable edge: a long figure clips at the jacket, never at the head."),
    },
    "politicians": {},
    "topics": {},
    "issues": {},
    "props": {
        # THE PROPS HAD NO TOOL until this pass and it showed: a 300px chair
        # drawn at 288.5 CSS px is DPR 1.04 on a phone that wants 3. Both are
        # now prep_topic.py jobs, sized at 3x their measured display size and
        # inside their masters' own ink boxes, so nothing is upscaled.
        "chair": {"900": need("knesset_chair_900.webp"),
                  "300": need("knesset_chair_300.webp"),
                  "128": need("knesset_chair_128.webp"),
                  "aspect": round(300 / 350, 4),
                  "display_css": DISPLAY_CSS["chair"],
                  "dpr": round(900 / DISPLAY_CSS["chair"], 2)},
        "building": {"1170": need("knesset_building_1170.webp"),
                     "390": need("knesset_building_390.webp"),
                     "display_css": DISPLAY_CSS["building"],
                     "dpr": round(1170 / DISPLAY_CSS["building"], 2)},
        # THE DECK'S CARD BACK, drawn full-bleed and bottom-anchored.
        # `background-size:cover` into the card's own 340x620 box, and cover is
        # driven by whichever axis needs the larger scale — 620/2752 beats
        # 340/1536, so HEIGHT drives and the image paints at 346 x 620 CSS px.
        # 3x that is 1038 x 1860, which is what the file now is. It was
        # 1536x2752 (DPR 4.44) and 1322KB, which made it 89% of the round's
        # first-load payload; it is 324KB now. It has no master and was
        # re-encoded from itself — see the CARD_BACK note in prep_topic.py.
        "card_back": {"file": need_asset("assets/card_background.webp"),
                      "display_css": DISPLAY_CSS["card_back"],
                      "dpr": round(1860 / 620.0, 2)},
    },
}

# THE NATIVE EXPORT IS DISCOVERED, NOT DECLARED. frame_mk.py writes each
# portrait at its own crop-box width — 474 for lahav, 723 for netanyahu — so
# there is no constant to write here, and a hand-kept one would go stale the
# first time a source is replaced. The rule is "the largest mk_<id>_*.webp
# that is not one of the two fixed sizes", which is exactly what the tool
# produces and nothing else.
def native_export(pid):
    best = None
    for f in MK.glob("mk_%s_*.webp" % pid):
        try: px = int(f.stem.rsplit("_", 1)[1])
        except ValueError: continue
        if px in (400, 128): continue
        if best is None or px > best[0]: best = (px, f.name)
    return best

for pid in PORTRAITS:
    assert pid in D["politicians"], pid
    e = {
        "name": D["politicians"][pid]["name"],
        "party": D["politicians"][pid].get("party", ""),
        "400": need("mk_%s_400.webp" % pid),
        "128": need("mk_%s_128.webp" % pid),
    }
    nat = native_export(pid)
    if nat:
        px, fname = nat
        e["hi"] = need(fname)
        e["hi_px"] = px
        # THE SHORTFALL, RECORDED RATHER THAN HIDDEN. The rule wants 3x the
        # 401px card; the masters are 832x1248 and the frame is a sub-rectangle
        # of that, so the honest ceiling is 1.18x to 1.80x. Upscaling to hit 3
        # would add bytes and no detail. Closing this needs larger SOURCES.
        e["dpr"] = round(px / DISPLAY_CSS["portrait"], 2)
    man["politicians"][pid] = e
missing = [p for p in D["politicians"] if p not in PORTRAITS]
man["politicians_without_art"] = sorted(missing)
man["fallback"] = {
    "kind": "initials-badge",
    "rule": ("First letter of each part of the shipped name, joined with a gershayim, "
             "set on the set's own eyeline at 37.7% of the box. NEVER substitute "
             "another politician's portrait."),
}

# ASPECT AND VISUAL MASS ARE MEASURED, NOT DECLARED. The map sizes an icon by
# its LARGER dimension and derives the other from the aspect, so a hand-typed
# ratio here would silently stretch the artwork. Both numbers are read off the
# 128px export — the same file the smaller ones were cut from.
#
# node_scale IS WHY THE EIGHT NO LONGER LOOK LIKE EIGHT DIFFERENT SIZES.
# Sizing every icon so its LARGER DIMENSION is the same makes a solid round
# seal read enormous and a tall narrow receipt read small: the eye weighs
# area, not the longest edge. So each icon is scaled to a common AREA, and
# node_scale is the per-icon multiplier that does it, normalised so the eight
# average 1.0 — the map multiplies it by --node-ico-avg and nothing else.
#
# THE AREA IS THE GEOMETRIC MEAN of the ink area (opaque pixels) and the box
# area (w*h), and the middle is where it belongs. Equalising BOX area ignores
# density, so a hairline drawing and a solid block come out the same size.
# Equalising INK area over-rewards sparse line art: measured on this set it
# pushes the scales to 80.6px wide on a 76px disc — wider than the node they
# sit on — while shrinking the briefcase to 45. sqrt(ink * box) splits the
# difference and keeps every icon inside the ring.
def node_mass(stem):
    im = Image.open(TOPICS / ("%s_128.webp" % stem)).convert("RGBA")
    ink = int((np.array(im)[..., 3] > 8).sum())
    return math.sqrt(ink * im.width * im.height), im.size

_mass = {tid: node_mass(stem) for tid, stem in TOPIC_ICONS.items()}
# a scale is 1/sqrt(mass); normalise so the mean MAX DIMENSION is 1.0
_raw = {tid: 1.0 / math.sqrt(m) for tid, (m, _) in _mass.items()}
_mean = sum(_raw[t] * max(_mass[t][1]) for t in _raw) / len(_raw)

for tid, stem in sorted(TOPIC_ICONS.items()):
    assert any(t["id"] == tid for t in D["topics"]), (
        "topic icon has no matching topic id in data.js: " + tid)
    man["topics"][tid] = {k: need_topic("%s_%d.webp" % (stem, k))
                          for k in (40, 52, 64, 128, 256, 384, 576)}
    # 576 = 3 x the 190px claim-card fallback, which is this asset's largest
    # call site since §1.3 enlarged it. The map node's 56.6px wants 170 and
    # is served by 256.
    man["topics"][tid]["display_css"] = DISPLAY_CSS["topic_icon"]
    man["topics"][tid]["dpr"] = round(576 / DISPLAY_CSS["topic_icon"], 2)
    w, h = _mass[tid][1]
    man["topics"][tid]["aspect"] = round(w / h, 4)
    man["topics"][tid]["node_scale"] = round(_raw[tid] * max(w, h) / _mean, 4)
    man["topics"][tid]["source"] = stem
    man["topics"][tid]["reads_down_to"] = READS_DOWN_TO[tid]
# the emoji stays the fallback for a topic with no drawn object. There are none
# today; the loop is the guarantee, not a placeholder.
for t in D["topics"]:
    if t["id"] not in man["topics"]:
        man["topics"][t["id"]] = {"glyph": t["icon"]}

# w/h ARE THE CSS SIZE, `file` IS THE PIXELS. claimArt() writes w and h onto
# the <img> as its layout box and takes the source from `file`, so the two are
# allowed to differ and under the DPR-3 rule they have to: s1 is laid out at
# 300x180 and served from a 900px file. `small` keeps the 1x around for
# anything that wants it; nothing does today.
for iid, (stem, w, h) in ISSUE_ART.items():
    assert any(i["id"] == iid for i in D["issues"]), iid
    big = MK / ("%s_%d.webp" % (stem, max(w, h) * DPR))
    e = {"file": need(big.name) if big.exists() else need("%s_%d.webp" % (stem, max(w, h))),
         "w": w, "h": h,
         "small": need("%s_%d.webp" % (stem, max(w, h)))}
    e["display_css"] = float(max(w, h))
    e["dpr"] = round(int(pathlib.Path(e["file"]).stem.rsplit("_", 1)[1]) / max(w, h), 2)
    man["issues"][iid] = e

out = HERE / "prototype" / "manifest.json"
out.write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote %s — %d politicians with art, %d without, %d topic icons, %d issue graphics"
      % (out.relative_to(HERE), len(man["politicians"]),
         len(man["politicians_without_art"]),
         sum(1 for v in man["topics"].values() if "glyph" not in v),
         len(man["issues"])))
