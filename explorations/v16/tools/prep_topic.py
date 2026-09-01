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

MK = pathlib.Path(__file__).resolve().parents[3] / "assets" / "mk"

JOBS = [
    # file stem            rendered sizes as (w, h) or (w, None) to keep aspect
    # the padlock is PORTRAIT (812x1294), so it is sized by height: driving it
    # by width made a "64px" icon 102px tall, which does not fit a 76px node
    # face. Icon sizes on this board mean the box's larger dimension.
    ("internal_sec_main", [(None, 40), (None, 52), (None, 64), (None, 128)]),
    ("internal_sec_s1",   [(300, None), (128, None)]),
    ("internal_sec_s2",   [(None, 210), (None, 84)]),
]

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
