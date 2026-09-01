# -*- coding: utf-8 -*-
"""Exports every v9 frame as 1x PNGs from the built .dc.html sources.
    python3 explorations/v13/export_frames_v16.py  [name-fragment …]
"""
import json, pathlib, shutil, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
DEST = HERE / "frames-1x"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CANVAS = json.loads((HERE / "canvas.json").read_text(encoding="utf-8"))

SHIM = """
class DCLogic {}
document.addEventListener('DOMContentLoaded', () => {
  const b = document.createElement('style');
  b.textContent = 'x-dc{display:block}helmet{display:none}';
  document.head.appendChild(b);
  document.querySelectorAll('x-dc > helmet > style').forEach(s => document.head.appendChild(s));
});
"""

def main():
    DEST.mkdir(exist_ok=True)
    only = sys.argv[1:]
    for a in CANVAS["artboards"]:
        f = a["file"]
        if only and not any(o.lower() in f.lower() for o in only):
            continue
        with tempfile.TemporaryDirectory() as td:
            d = pathlib.Path(td)
            (d / "support.js").write_text(SHIM, encoding="utf-8")
            (d / "f.html").write_text((HERE / f).read_text(encoding="utf-8"), encoding="utf-8")
            shutil.copy(HERE / "assets" / "mk-portrait.webp", d / "mk-portrait.webp")
            # the illustration spike's assets live in the repo's own assets/mk/
            for extra in list((ROOT / "assets" / "mk").glob("bengvir_*.webp")) \
                       + list((ROOT / "assets" / "mk").glob("knesset_*.webp")) \
                       + list((ROOT / "assets" / "mk").glob("mk_*.webp")) \
                       + list((ROOT / "assets" / "mk").glob("policehat*.webp")) \
                       + list((ROOT / "assets" / "mk").glob("topic_*.webp")) \
                       + list((ROOT / "assets" / "mk").glob("internal_sec_*.webp")):
                shutil.copy(extra, d / extra.name)
            png = DEST / (f.replace(".dc.html", "") + ".png")
            subprocess.run(
                [CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
                 "--force-device-scale-factor=1", "--window-size=390,%d" % a["h"],
                 "--virtual-time-budget=6000", "--run-all-compositor-stages-before-draw",
                 "--screenshot=" + str(png), str(d / "f.html")],
                capture_output=True, text=True, timeout=120)
            print("%-24s %6.1f KB" % (png.name, png.stat().st_size / 1024))

if __name__ == "__main__":
    main()
