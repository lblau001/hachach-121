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
# ---- §5.1 · CUTTING THE SKY OFF THE KNESSET BUILDING -----------------------
# The art is flat line-and-fill and the sky is effectively pure white
# (#FEFEFE, per-channel std under 1 across the top 120 rows), so a colour key
# is the right tool. A GLOBAL key is not: the flags are cream with blue
# stripes, and keying every white pixel deletes the flag bodies along with
# the sky.
#
# So it is a FLOOD FILL FROM THE BORDER — white that is connected to the edge
# of the canvas is sky, white enclosed by artwork is not. The flags survive
# because each one is drawn with a closed dark outline.
#
# THAT ALONE IS NOT ENOUGH, and this is the part worth knowing. Between the
# flags there are pockets of sky fully enclosed by flag + pole + flag, which
# connectivity cannot distinguish from intended white; left in, they render
# as cream blobs floating in the gaps. They ARE separable, by colour:
#   enclosed SKY    mean distance-from-white  4.0 - 10.6,  #FCFDFB, neutral
#   flag CREAM      mean distance-from-white 23.0 - 29.3,  #FDF6E7, warm
# so an enclosed component is sky if it is both near-white AND neutral. The
# gap between the two populations is a factor of two with nothing in it.
#
# THE EDGE IS UN-PREMULTIPLIED. A binary mask leaves every anti-aliased pixel
# as a half-white blend, which on the app's charcoal ground is a white
# fringe — exactly the failure the brief says to stop for. Instead alpha
# ramps over the 6..34 band and the colour is recovered as
# (observed - (1-a)*white) / a, which is the correct inverse of compositing
# over a white matte. The result has no fringe: see the report's crops.
#
# CACHED, because the flood fill is a 4M-pixel BFS. The cut is written once
# as its own master and the exports come off that; the original
# knessetbuilding.webp is never modified.
def cut_white_sky(src, dst, t_lo=6.0, t_hi=34.0, neutral_max=15.0, spread_max=10.0):
    from collections import deque
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float64)
    H, W, _ = a.shape
    dist = np.abs(a - 255.0).max(axis=2)
    whiteish = dist < t_hi

    ext = np.zeros((H, W), bool)
    q = deque()
    def seed(y, x):
        if whiteish[y, x] and not ext[y, x]:
            ext[y, x] = True; q.append((y, x))
    for x in range(W): seed(0, x); seed(H - 1, x)
    for y in range(H): seed(y, 0); seed(y, W - 1)
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and whiteish[ny, nx] and not ext[ny, nx]:
                ext[ny, nx] = True; q.append((ny, nx))

    # enclosed white: keep the warm cream, drop the neutral sky pockets
    interior = whiteish & ~ext
    lab = np.zeros((H, W), bool)
    pockets = 0
    ys, xs = np.nonzero(interior)
    for sy, sx in zip(ys, xs):
        if lab[sy, sx]: continue
        qq = deque([(sy, sx)]); lab[sy, sx] = True; px = [(sy, sx)]
        while qq:
            y, x = qq.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and interior[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = True; qq.append((ny, nx)); px.append((ny, nx))
        arr = np.array(px)
        v = a[arr[:, 0], arr[:, 1]]
        if dist[arr[:, 0], arr[:, 1]].mean() < neutral_max and \
           (v.max(axis=1) - v.min(axis=1)).mean() < spread_max:
            ext[arr[:, 0], arr[:, 1]] = True
            pockets += 1

    alpha = np.ones((H, W))
    alpha[ext] = np.clip((dist[ext] - t_lo) / (t_hi - t_lo), 0, 1)
    al = alpha[..., None]
    rgb = np.clip(np.where(al > 0.004, (a - 255.0 * (1 - al)) / np.maximum(al, 0.004), a), 0, 255)
    Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8)).save(
        dst, "WEBP", lossless=True, exact=True)
    return 100 * (alpha < 0.02).mean(), pockets, int(((alpha > .02) & (alpha < .98)).sum())

BUILDING_CUT = MK / "knessetbuilding_cut.webp"
if not BUILDING_CUT.exists():
    pct, pk, edge = cut_white_sky(MK / "knessetbuilding.webp", BUILDING_CUT)
    print("sky cut: %.1f%% removed, %d enclosed sky pockets closed, %d soft-edge px -> %s"
          % (pct, pk, edge, BUILDING_CUT.name))

PROP_JOBS = [
    # stem in assets/mk/   source                       sizes (w, h)
    ("knesset_chair",      MK / "knessetchair.webp",    [(900, 1050), (300, 350), (128, 149)]),
    # the building ships WITHOUT its sky — see cut_white_sky() above
    # h=None keeps the INK aspect. Cutting the sky trimmed 26 transparent
    # rows off the top, so the ink box is 2496x1638 rather than 2496x1664 —
    # forcing the old (1170,780) would squash it 1.6% vertically.
    ("knesset_building",   BUILDING_CUT,                [(1170, None), (390, None)]),
]

# ---- THE CARD BACK, and the one job here with no master --------------------
# assets/card_background.webp is its OWN source: one blob, one commit
# (ffc488c), nothing larger in tools/, in explorations/v16/build/, or anywhere
# in the git object store — checked. It is also not a crop of
# knessetbuilding.webp: different palette, different composition, portrait
# where that one is landscape. So this is the one asset in the bundle that is
# re-encoded FROM A LOSSY FILE rather than framed from a master.
#
# THE OLD FILE WAS OVER TARGET, NOT UNDER IT, which is why this is a shrink.
# .cardback paints with `background-size:cover` into the card's own 340x620
# box, and cover is driven by whichever axis needs the larger scale:
#   340/1536 = 0.2214   620/2752 = 0.2253  -> HEIGHT drives
# so the image is painted at 346 x 620 CSS px, and --card-scale can only ever
# make that smaller. 3x that is 1038 x 1860. The 1536x2752 file was DPR 4.44 --
# 1.48x more than any screen can resolve, for 1322KB, which made it 89% of the
# round's entire first-load payload.
#
# MEASURE THE PAINTED BOX, NOT getBoundingClientRect(). The deck rotates its
# cards (.deckcard has rotate(.9deg), .pile more), and a rotated element's
# bounding rect is its axis-aligned box -- 359 and 387px, not 340. Sizing off
# that would have over-shot by 12%. offsetWidth/offsetHeight is the box the
# background actually paints into.
#
# QUALITY 88 ON A RECOMPRESS. The 0.68x downscale averages most of the first
# generation's artefacts away before re-encoding, which is why lossy->lossy at
# a REDUCED size is safe where lossy->lossy at the same size would not be.
# Measured against a lossless LANCZOS downscale to the same 1038x1860: q88 is
# 38.1 dB at 324KB, q80 is 35.9 dB at 203KB. No quality level from 76 to 92
# introduces banding beyond what the source gradient already carries -- the
# sky's own step count is 311 in the lossless reference and every candidate
# came in below it. 88 is the conservative pick on a chain that cannot be
# undone; the extra 121KB q80 would save is not worth a second generation of
# loss on the only copy that exists.
CARD_BACK = (ROOT / "assets" / "card_background.webp", 1038, 1860, 88)

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
# 576 IS FOR THE ENLARGED CLAIM-CARD FALLBACK. §1.3 grows that graphic from
# 128 to 190 CSS px — the card is 308px wide inside its padding and 128 was
# using 42% of it — so the DPR-3 target moves 384 -> 576. It costs about
# 30KB more on the one topic icon a claim card loads, against a round whose
# whole first load is now 765KB.
TOPIC_SIZES = [40, 52, 64, 128, 256, 384, 576]

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
        if h is None:                      # keep the ink box's own aspect
            h = max(1, round(w * ink.height / ink.width))
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


# ---- the card back --------------------------------------------------------
print()
src, cw, ch, cq = CARD_BACK
im = Image.open(src).convert("RGB")
before = src.stat().st_size
# IDEMPOTENT, AND IT HAS TO BE. This is the one job whose source and
# destination are the same file, so a second run would re-encode an already
# re-encoded file and lose another generation — silently, every time anybody
# regenerates the bundle. The guard is the size: the job runs only on the
# 1536x2752 original and refuses anything else. Recovering the original to
# re-run is `git checkout -- assets/card_background.webp`.
if (im.width, im.height) == (cw, ch):
    print("card back            already %dx%d — SKIPPED. This job re-encodes its"
          % (cw, ch))
    print("%-20s own source; re-running it would cost another generation." % "")
    print("%-20s To redo it: git checkout -- assets/card_background.webp" % "")
elif (im.width, im.height) != (1536, 2752):
    print("card back            REFUSED: expected the 1536x2752 original, found "
          "%dx%d" % im.size)
else:
    im.resize((cw, ch), Image.LANCZOS).save(src, "WEBP", quality=cq, method=6)
    after = src.stat().st_size
    print("card back            %s -> %dx%d q%d   %.0fKB -> %.0fKB  (%.0f%% off)"
          % ("%dx%d" % im.size, cw, ch, cq, before / 1024, after / 1024,
             100 * (before - after) / before))
    print("%-20s NOTE: re-encoded from itself. There is no master; the previous"
          % "")
    print("%-20s      file is recoverable only from git (blob f345e369)." % "")


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
