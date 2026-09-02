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
    ("internal_sec_s1",   [(300, None), (128, None)]),
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
# 256 IS THE ONE THE MAP ACTUALLY USES. The node draws an icon at 36-49 CSS
# px, and a 3x phone therefore asks for 107-147 DEVICE pixels — so the 64px
# file it used to load was being upscaled about 2.5x, which is the softness
# on device. 256 downscales 1.7-2.4x instead, which costs 14-19KB a file. The manifest's "never downscale more than 1.2x" rule
# is written in CSS pixels and silently assumes DPR 1; at DPR 3 the file
# has to be about three times the CSS size, not equal to it.
TOPIC_SIZES = [40, 52, 64, 128, 256]

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
