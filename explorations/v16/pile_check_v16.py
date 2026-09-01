# -*- coding: utf-8 -*-
"""Does the pile touch the stamp or the axis? Answered by difference, not by
coordinates: render each frame as built, then again with the pile suppressed and
with the stamp+axis suppressed, and intersect the two ink masks. Any overlap is
a real collision in the rendered pixels."""
import pathlib, shutil, subprocess, tempfile, sys
import numpy as np
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SUPPORT = "class DCLogic {}\n"

def shot(html, extra_css):
    with tempfile.TemporaryDirectory() as td:
        d = pathlib.Path(td)
        (d / "support.js").write_text(SUPPORT, encoding="utf-8")
        src = html.replace("</helmet>", "<style>%s</style></helmet>" % extra_css, 1)
        (d / "f.html").write_text(src, encoding="utf-8")
        shutil.copy(HERE / "assets" / "mk-portrait.webp", d / "mk-portrait.webp")
        for p in (ROOT / "assets" / "mk").glob("*.webp"):
            shutil.copy(p, d / p.name)
        png = d / "o.png"
        subprocess.run([CH, "--headless", "--disable-gpu", "--no-sandbox",
                        "--force-device-scale-factor=1", "--hide-scrollbars",
                        "--window-size=760,1000", "--virtual-time-budget=6000",
                        "--screenshot=" + str(png), str(d / "f.html")],
                       capture_output=True, timeout=180)
        return np.array(Image.open(png).convert("RGB")).astype(int)

FRAMES = ["V14PILE5.dc.html", "V14PILE2.dc.html", "V14TOPB.dc.html", "V15CASC1.dc.html",
          "V15B1CARDR.dc.html", "V15B4RIGHTAXIS.dc.html",
          "V12B4PREDICT.dc.html", "V12B4AXIS.dc.html", "V12B4LANDED.dc.html"]
bad = []
for f in FRAMES:
    html = (HERE / f).read_text(encoding="utf-8")
    base = shot(html, "")
    nopile = shot(html, ".v4pile{display:none!important}")
    nomark = shot(html, ".vs,.v4gx{display:none!important}")
    if base.shape != nopile.shape or base.shape != nomark.shape:
        print("%-22s SIZE MISMATCH" % f); continue
    pile = (np.abs(base - nopile).sum(axis=2) > 24)      # pixels only the pile paints
    mark = (np.abs(base - nomark).sum(axis=2) > 24)      # pixels only the stamp/axis paint
    hit = pile & mark
    n = int(hit.sum())
    print("%-22s pile ink %6d px · stamp+axis ink %6d px · overlap %d"
          % (f.replace(".dc.html", ""), int(pile.sum()), int(mark.sum()), n))
    if n:
        ys, xs = np.where(hit)
        print("      overlap box x %d..%d  y %d..%d" % (xs.min(), xs.max(), ys.min(), ys.max()))
        bad.append("%s: pile overlaps the stamp/axis in %d px" % (f, n))
print()
print("PILE CLEARS THE STAMP AND THE AXIS" if not bad else "COLLISIONS:")
for b in bad: print("  · " + b)
sys.exit(1 if bad else 0)
