# -*- coding: utf-8 -*-
"""Frame every MK illustration the way Ben Gvir was framed.

Ben Gvir's shipped master is a 628x838 crop at (102,142) of the 832x1248
source — exactly 3:4. This tool recovers the RULE behind that box, in terms of
features rather than pixels, and applies the same rule to the rest of the set,
so the whole cascade is framed identically instead of approximately.

Three features are measured on every source:
  crown     the topmost row carrying ink
  eyeline   the row carrying the most very-dark ink inside the head band
            (glasses sit on the eyes, so a frame reads as the eyeline too)
  shoulder  the row where the figure first reaches 95% of its widest
Nothing here is asserted: --report prints the numbers and --contact writes a
sheet with the three lines drawn on, so the detection can be looked at.
"""
import argparse, json, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw

MK = pathlib.Path(__file__).resolve().parents[3] / "assets" / "mk"
AR = 3 / 4                       # the set's aspect, from Ben Gvir's master
REF = "bengvir_styleB"           # the framing every other portrait is matched to

def ink_mask(im):
    """Ink is anything that is neither transparent nor the flat paper ground."""
    a = np.array(im.convert("RGBA")).astype(int)
    alpha = a[..., 3] > 8
    rgb = a[..., :3]
    # the ground is the modal colour of the top-left corner block
    corner = rgb[:40, :40].reshape(-1, 3)
    ground = np.median(corner, axis=0)
    off = np.abs(rgb - ground).sum(axis=2)
    return alpha & (off > 26)

def skin_mask(im):
    """Broad skin range. Used only to find WHERE the face is, never to alter it."""
    a = np.array(im.convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 95) & (r > g + 12) & (g > b) & (r - b > 18)

def features(im):
    m = ink_mask(im)
    rows = m.sum(axis=1)
    on = np.where(rows > 0)[0]
    if not len(on):
        raise SystemExit("no ink found")
    crown = int(on[0])

    # THE FACE BOX. The eyeline detector below counts dark pixels per row, and
    # on its own that finds the biggest dark mass in the picture — which for a
    # portrait with dark hair is the hair, not the eyes. Michaeli's eyeline came
    # out 120px too high for exactly that reason. Confining the count to the
    # skin region fixes it: eyes, brows and spectacle frames are dark pixels
    # INSIDE the face, and hair is not.
    sk = skin_mask(im) & m
    ys, xs = np.where(sk)
    if not len(ys):
        raise SystemExit("no face found")
    y0, y1 = int(np.percentile(ys, 1)), int(np.percentile(ys, 99))
    x0, x1 = int(np.percentile(xs, 3)), int(np.percentile(xs, 97))

    a = np.array(im.convert("RGB")).astype(int)
    dark = (a.sum(axis=2) < 300) & m

    # EYES ARE DARK INK WITH SKIN BOTH ABOVE AND BELOW IT.
    # That one condition is what separates them from the two things that kept
    # winning the row count: hair has hair above it (Michaeli's eyeline came out
    # at her hairline, 150px high) and a beard has beard below it (Deri's came
    # out at his upper lip). A brow qualifies too, and that is fine — a brow is
    # 20px from an eye, not 150.
    def near_skin(lo, hi):
        acc = np.zeros_like(sk)
        for d in range(lo, hi):
            acc |= np.roll(sk, d, axis=0)
        return acc
    enclosed = dark & near_skin(8, 26) & near_skin(-26, -8)
    prof = enclosed[y0:y1, x0:x1].sum(axis=1)
    # the upper 45% of the face box, not 60%: at 60% a full beard's dark ink
    # reaches the mouth and Deri's "eyeline" landed on his moustache. Eyes are
    # never in the lower half of a face; mouths are never in the upper.
    top = prof[: max(1, int(len(prof) * 0.45))]
    eyeline = int(y0 + int(np.argmax(top)))

    # FACE WIDTH AT THE EYELINE is the scale reference, and it is the only one
    # of the three that survives all six faces: it is temple-to-temple skin, so
    # hair beside the face (Michaeli) and beard below it (Deri) do not enter it,
    # and unlike a detected shoulder line it does not depend on what the person
    # is wearing. Shoulder detection was tried first and failed on half the set
    # — flare tests found beards and shawls, and three of six fell through to
    # the bottom of the canvas.
    band = sk[max(eyeline - 6, 0):eyeline + 6]
    cols = np.where(band.any(axis=0))[0]
    face_w = int(cols[-1] - cols[0]) if len(cols) else max(x1 - x0, 1)
    face_cx = int((cols[0] + cols[-1]) // 2) if len(cols) else (x0 + x1) // 2

    # The shoulder line is still MEASURED, but only to report where it lands as
    # a consequence. Scanning UP from the bottom for the last row at least 1.6x
    # the face width finds the garment's shoulder rather than a beard.
    wide = np.where(rows >= 1.6 * face_w)[0]
    wide = wide[wide > eyeline]
    shoulder = int(wide[0]) if len(wide) else int(on[-1])

    return dict(crown=crown, eyeline=eyeline, shoulder=shoulder,
                face_w=face_w, face_cx=face_cx, face=(x0, y0, x1, y1), h=im.height, w=im.width)

def crop_box(f, W, H):
    """3:4, face at FACE_AT of the frame width, CROWN at CROWN_AT of its height.

    v15 anchored on the eyeline and Deri paid for it: his crown landed 16.7% of
    a frame height ABOVE the crop box, so the top of his head was cut off in the
    exported file — not by the card, by the export. Anchoring on the crown makes
    that impossible by construction. The top of the head is the one edge a
    portrait cannot lose, and it is now the fixed one.

    Face-width scaling stays, because heads being one size is what makes the set
    a set. The consequence is that the EYELINE now varies instead, by however
    much foreheads differ — a few px, reported rather than hidden, where the
    shoulder line varied by half a frame.
    """
    cw = round(f["face_w"] / FACE_AT)
    ch = round(cw / AR)
    if ch > H:
        ch = H; cw = round(ch * AR)
    if cw > W:
        cw = W; ch = round(cw / AR)
    top = round(f["crown"] - CROWN_AT * ch)
    clamped = top < 0 or top + ch > H
    top = max(0, min(top, H - ch))
    f["clamped"] = clamped
    left = max(0, min(f["face_cx"] - cw // 2, W - cw))
    return left, top, left + cw, top + ch

ap = argparse.ArgumentParser()
ap.add_argument("names", nargs="*")
ap.add_argument("--report", action="store_true")
ap.add_argument("--contact")
ap.add_argument("--write", action="store_true")
ap.add_argument("--out", default=str(MK))
A = ap.parse_args()

names = A.names or [REF, "netanyahu", "deri", "lapid", "gantz", "michaeli"]
srcs, feats, ink_mask_cache = {}, {}, {}
for n in names:
    p = MK / (n + ".webp")
    if not p.exists(): p = MK / (" " + n + ".webp")     # the set has one stray space
    im = Image.open(p).convert("RGBA")
    srcs[n] = im
    ink_mask_cache[n] = ink_mask(im)
    f = features(im); f["key"] = n; feats[n] = f

# calibrate the two constants off Ben Gvir's shipped crop, so "the same prep"
# means the same numbers he was framed with rather than a fresh guess.
REF_BOX = (102, 142, 730, 980)
rf = feats[REF]
CROWN_AT = (rf["crown"] - REF_BOX[1]) / (REF_BOX[3] - REF_BOX[1])
EYE_AT = (rf["eyeline"] - REF_BOX[1]) / (REF_BOX[3] - REF_BOX[1])
SHOULDER_AT = (rf["shoulder"] - REF_BOX[1]) / (REF_BOX[3] - REF_BOX[1])
FACE_AT = rf["face_w"] / (REF_BOX[2] - REF_BOX[0])

if A.report:
    print("Ben Gvir's shipped crop %s puts:" % (REF_BOX,))
    print("   crown at %.1f%% of the frame" % (100 * CROWN_AT))
    print("   eyeline at %.1f%%" % (100 * EYE_AT))
    print("   shoulder line at %.1f%%" % (100 * SHOULDER_AT))
    print("   face %.1f%% of the frame width" % (100 * FACE_AT))
    print()
    print("%-16s %-26s %s" % ("", "source features", "after framing"))
    print("%-16s %6s %6s %6s   %8s %8s %8s" %
          ("name", "crown", "eye", "shldr", "crown%", "eye%", "shldr%"))
rows = []
for n in names:
    f = feats[n]; im = srcs[n]
    box = crop_box(f, im.width, im.height)
    ch = box[3] - box[1]
    got = [(f[k] - box[1]) / ch for k in ("crown", "eyeline", "shoulder")]
    rows.append((n, box, got))
    if A.report:
        print("%-16s %6d %6d %6d   %7.1f%% %7.1f%% %7.1f%%" %
              (n, f["crown"], f["eyeline"], f["shoulder"],
               100 * got[0], 100 * got[1], 100 * got[2]))
if A.report:
    cl = [n for n in names if feats[n].get("clamped")]
    print("crops clamped by the edge of their source: %s" % (cl or "none"))
    for i, lbl in enumerate(("crown", "eyeline", "shoulder")):
        v = [r[2][i] * 100 for r in rows]
        print("%-9s spread across the set: %.1f%%  (min %.1f%%, max %.1f%%)"
              % (lbl, max(v) - min(v), min(v), max(v)))

if A.contact:
    sheet = []
    for n, box, got in rows:
        im = srcs[n].convert("RGB").crop(box).resize((300, 400), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        for frac, col in zip(got, ((255, 0, 0), (0, 140, 255), (0, 190, 60))):
            y = int(frac * 400)
            d.line([(0, y), (300, y)], fill=col, width=2)
        d.text((6, 6), n, fill=(0, 0, 0))
        sheet.append(im)
    c = Image.new("RGB", (sum(i.width + 8 for i in sheet) + 8, 416), (255, 255, 255))
    x = 8
    for i in sheet: c.paste(i, (x, 8)); x += i.width + 8
    c.save(A.contact); print("contact sheet ->", A.contact)

if A.write:
    out = pathlib.Path(A.out)
    for n, box, got in rows:
        big = srcs[n].crop(box)
        for px in (400, 128):
            r = big.resize((px, round(px / AR)), Image.LANCZOS)
            f = out / ("mk_%s_%d.webp" % (n.replace("bengvir_styleB", "ben_gvir"), px))
            r.save(f, "WEBP", quality=88, method=6, exact=True)
            print("wrote %-30s %dx%d" % (f.name, r.width, r.height))
