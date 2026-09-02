# -*- coding: utf-8 -*-
"""Prep the topic and issue graphics the way the rest of the set is prepped.

Every file is trimmed to its own ink and written at the EXACT pixel size it is
rendered at, so the browser never resamples one. That is stricter than the
board's standing rule (nothing under 150px served from a source over 150px) and
it is cheap here, because these are a handful of objects rather than 21 faces.
"""
import pathlib
from PIL import Image
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[3]
MK = ROOT / "assets" / "mk"
TOPICS = ROOT / "assets" / "topics"

# ---- THE PROPS, which until now had no tool at all ---------------------
# knesset_chair_300.webp, knesset_chair_128.webp and knesset_building_390.webp
# were in the repo with nothing that could regenerate them: the sizes were
# whatever somebody exported once. That is why they were the two worst-served
# assets in the audit — a 300px chair drawn at 288 CSS px is DPR 1.04 on a
# phone that wants DPR 3.
#
# Sizes below are 3x the LARGEST measured CSS size, and every one of them is
# inside its master's own ink box, so nothing here is upscaled:
#   chair     drawn at 288.5 x 336.6 CSS (the intro, and the tachles seat,
#             both height-capped against the viewport) -> 900 x 1050.
#             Master ink is 1133 x 1323, so 900 is real pixels.
#   building  drawn at 390 x 260 CSS in the intro, 1:1 with its file today
#             -> 1170 x 780. Master is 2496 x 1664.
#   s1 art    the claim card's own graphic, drawn at 300 x 180 -> 900 x 540.
#             Master ink is 1747 x 1047.
# The old sizes are kept alongside: the manifest names both and the renderer
# picks, so a screen that wants the small one is not forced onto the big one.
PROP_JOBS = [
    # stem in assets/mk/   source                       sizes (w, h)
    ("knesset_chair",      MK / "knessetchair.webp",    [(900, 1050), (300, 350), (128, 149)]),
    ("knesset_building",   MK / "knessetbuilding.webp", [(1170, 780), (390, 260)]),
]

JOBS = [
    # file stem            rendered sizes as (w, h) or (w, None) to keep aspect
    # the padlock is PORTRAIT (812x1294), so it is sized by height: driving it
    # by width made a "64px" icon 102px tall, which does not fit a 76px node
    # face. Icon sizes on this board mean the box's larger dimension.
    # THE PADLOCK IS OFF THE MAP and out of manifest.json — it read as "this
    # topic is locked" beside seven object nodes. It is still built and still
    # on disk because the issue cards may reference it; it is simply not
    # registered any more. Deleting it is a separate decision.
    ("internal_sec_main", [(None, 40), (None, 52), (None, 64), (None, 128)]),
    # s1 IS the only active issue with drawn art. 900 = 3 x its 300px slot.
    ("internal_sec_s1",   [(900, None), (300, None), (128, None)]),
    ("internal_sec_s2",   [(None, 210), (None, 84)]),
]

# THE MAP'S TOPIC ICONS. Eight 2048x2048 RGBA masters, one per topic id, framed
# to the same four sizes the padlock was framed to — same trim-to-ink, same
# "the size is the box's LARGER dimension" convention, same encoder settings.
# These are square masters of objects at every aspect, so they are driven by
# MAXDIM rather than by width or height: a landscape briefcase and a portrait
# lectern both come out inside a 64px box.
#
# internal_sec IS THE POLICE HAT, and it is the one entry whose file stem is
# not its topic id. The supplied internal_sec master is a shield carrying a
# Star of David — a national symbol, where the other seven are neutral
# objects — so it is left in assets/topics/ and never registered. The stem
# names the object; manifest.json maps the topic to it.
TOPIC_JOBS = [
    ("accountability", TOPICS / "accountability_main.webp"),
    ("branches",       TOPICS / "branches_main.webp"),
    ("economy",        TOPICS / "economy_main.webp"),
    ("environment",    TOPICS / "environment_main.webp"),
    ("gender",         TOPICS / "gender_main.webp"),
    ("military",       TOPICS / "military_main.webp"),
    ("religion",       TOPICS / "religion_main.webp"),
    ("internal_sec",   MK / "policehat.webp"),
]
# THE SIZES ARE SET BY THE LARGEST CALL SITE, ONE FILE PER ASSET.
# The rule is DPR 3: file ~= 3x the largest CSS size the asset is ever drawn
# at. See manifest.json's "sizing_rule" for the whole statement of it.
#
# A topic icon has TWO call sites and they are 2.5x apart:
#   the map node        up to 56.6 CSS px  (the scales, gender, node_scale
#                       1.1105 x --node-ico-avg 51) -> 170 device px
#   the claim card      128 CSS px flat, claimArt()'s topic fallback for the
#                       14 issues with no drawn art of their own -> 384
# So the set needs a 384. 256 was sized against the map alone and against the
# OLD 76px disc; the map is now comfortable at 256 even after the node grew
# 15% (170 needed, 256 written), but the claim card has been rendering the
# 128px file at 128 CSS px — 1:1, which is a 3x upscale on a 3x phone, and it
# is the single worst-served surface in the app.
#
# 40/52/64 ARE KEPT BUT NOTHING READS THEM. Under the DPR-3 rule a 40px file
# can only serve a 13px display, and there is no 13px icon in this app. They
# are left on disk rather than deleted because deleting an asset is a
# separate decision from re-sizing one; the audit lists them as unreferenced.
TOPIC_SIZES = [40, 52, 64, 128, 256, 384]

print("%-20s %-14s %-24s %s" % ("source", "canvas", "ink box", "exports"))
for stem, sizes in JOBS:
    src = MK / (stem + ".png")
    im = Image.open(src).convert("RGBA")
    a = np.array(im)[..., 3]
    bb = im.split()[3].getbbox()
    ink = im.crop(bb)
    out = []
    for w, h in sizes:
        if w is None:
            w = round(h * ink.width / ink.height)
        if h is None:
            h = round(w * ink.height / ink.width)
        r = ink.resize((w, h), Image.LANCZOS)
        name = "%s_%d.webp" % (stem, max(w, h))
        r.save(MK / name, "WEBP", quality=90, method=6, exact=True)
        out.append("%s %dx%d %.0fKB" % (name, w, h, (MK / name).stat().st_size / 1024))
    print("%-20s %-14s %-24s %s"
          % (stem, "%dx%d" % im.size, "%dx%d" % (ink.width, ink.height), out[0]))
    for o in out[1:]:
        print("%-20s %-14s %-24s %s" % ("", "", "", o))
    print("%-20s alpha: %.1f%% opaque, %.1f%% transparent, %d levels — hard edge, "
          "no baked shadow" % ("", 100 * (a == 255).mean(), 100 * (a == 0).mean(),
                               len(np.unique(a))))



# ---- the props ------------------------------------------------------------
# Same contract as everything else here: trim to ink, write at the EXACT pixel
# size the file is named for, never resample in the browser.
print()
print("%-20s %-14s %-24s %s" % ("prop", "source", "ink box", "exports"))
for stem, src, sizes in PROP_JOBS:
    im = Image.open(src).convert("RGBA")
    bb = im.split()[3].getbbox()
    ink = im.crop(bb) if bb else im
    # the building is opaque; keeping it RGBA costs an alpha plane that is
    # 100% opaque, which is bytes for nothing
    opaque = bool((np.array(ink)[..., 3] > 250).all())
    out = []
    for w, h in sizes:
        r = ink.resize((w, h), Image.LANCZOS)
        # PROPS ARE NAMED BY WIDTH, not by their larger dimension. The chair is
        # 300x350 and has always been knesset_chair_300; renaming it to _350 to
        # match the icon convention would orphan the manifest key and every
        # reference to it for no gain.
        name = "%s_%d.webp" % (stem, w)
        if opaque:
            r.convert("RGB").save(MK / name, "WEBP", quality=88, method=6)
        else:
            r.save(MK / name, "WEBP", quality=88, method=6, exact=True)
        out.append("%s %dx%d %.0fKB" % (name, w, h, (MK / name).stat().st_size / 1024))
    print("%-20s %-14s %-24s %s"
          % (stem, "%dx%d" % im.size, "%dx%d" % (ink.width, ink.height), out[0]))
    for o in out[1:]:
        print("%-20s %-14s %-24s %s" % ("", "", "", o))


# ---- the topic icons ------------------------------------------------------
print()
print("%-16s %-12s %-14s %-7s %s" % ("topic", "source", "ink box", "aspect", "exports"))
for topic, src in TOPIC_JOBS:
    im = Image.open(src).convert("RGBA")
    a = np.array(im)[..., 3]
    bb = im.split()[3].getbbox()
    ink = im.crop(bb)
    out = []
    for s_ in TOPIC_SIZES:
        k = s_ / max(ink.width, ink.height)
        w, h = max(1, round(ink.width * k)), max(1, round(ink.height * k))
        name = "%s_%d.webp" % (src.stem.replace("_main", ""), s_)
        ink.resize((w, h), Image.LANCZOS).save(
            TOPICS / name, "WEBP", quality=90, method=6, exact=True)
        out.append("%s %dx%d %.0fKB" % (name, w, h, (TOPICS / name).stat().st_size / 1024))
    print("%-16s %-12s %-14s %-7.4f %s"
          % (topic, src.stem, "%dx%d" % (ink.width, ink.height),
             ink.width / ink.height, out[0]))
    for o in out[1:]:
        print("%-16s %-12s %-14s %-7s %s" % ("", "", "", "", o))
