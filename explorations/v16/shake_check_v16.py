# -*- coding: utf-8 -*-
"""The emit pipeline changed; the render must not have.

v15 prunes each artboard's stylesheet to the rules that could match it and
subsets the headline face to the characters the board sets. Both are invisible
if they are right and catastrophic if they are wrong, so every artboard is
rendered from the v14 build and from the v15 build and the two are compared
pixel for pixel."""
import pathlib, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent
OLD = HERE.parent / "v14"
ROOT = HERE.parent.parent
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def shot(path):
    with tempfile.TemporaryDirectory() as td:
        d = pathlib.Path(td)
        (d / "support.js").write_text("class DCLogic {}\n", encoding="utf-8")
        (d / "f.html").write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
        for src in (HERE / "assets", OLD / "assets"):
            for p in src.glob("*.webp"):
                if not (d / p.name).exists(): shutil.copy(p, d / p.name)
        for p in (ROOT / "assets" / "mk").glob("*.webp"):
            shutil.copy(p, d / p.name.lstrip())
        png = d / "o.png"
        subprocess.run([CH, "--headless", "--disable-gpu", "--no-sandbox",
                        "--force-device-scale-factor=1", "--hide-scrollbars",
                        "--window-size=760,1000", "--virtual-time-budget=6000",
                        "--screenshot=" + str(png), str(d / "f.html")],
                       capture_output=True, timeout=180)
        return np.array(Image.open(png).convert("RGB")).astype(int)

names = sys.argv[1:] or sorted(p.name for p in HERE.glob("*.dc.html")
                               if (OLD / p.name).exists())
bad, checked = [], 0
for n in names:
    a, b = shot(OLD / n), shot(HERE / n)
    if a.shape != b.shape:
        bad.append("%s: size %s vs %s" % (n, a.shape, b.shape)); continue
    diff = np.abs(a - b).sum(axis=2)
    nz = int((diff > 12).sum())
    checked += 1
    if nz:
        bad.append("%s: %d pixels differ (max delta %d)" % (n, nz, int(diff.max())))
        print("  DIFF %-26s %d px" % (n, nz))
print("\n%d artboards rendered both ways" % checked)
print("IDENTICAL — pruning and subsetting changed nothing" if not bad
      else "DIFFERENCES (%d):" % len(bad))
for x in bad: print("  · " + x)
sys.exit(1 if bad else 0)
