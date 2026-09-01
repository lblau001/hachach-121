# -*- coding: utf-8 -*-
"""v16 — the seven checks, against the render."""
import json, pathlib, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

PROBE = r"""
class DCLogic {}
document.addEventListener('DOMContentLoaded',()=>{
 const b=document.createElement('style');
 b.textContent='x-dc{display:block}helmet{display:none}';
 document.head.appendChild(b);
 document.querySelectorAll('x-dc > helmet > style').forEach(s=>document.head.appendChild(s));
 setTimeout(()=>{
  const R=e=>{const r=e.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),
    w:Math.round(r.width),h:Math.round(r.height),r:Math.round(r.right),b:Math.round(r.bottom)};};
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const o={imgs:qa('img').map(e=>({src:e.getAttribute('src'),file:e.dataset.file,
      nw:e.naturalWidth,w:Math.round(e.getBoundingClientRect().width),
      h:Math.round(e.getBoundingClientRect().height),
      y:Math.round(e.getBoundingClientRect().y)})),
    av3:qa('.avs3').length, avOld:qa('.avs:not(.avs3)').length,
    txt:document.body.innerText};
  const c=q('.v4card'), p=q('.v4port');
  if(c) o.card=R(c);
  if(p) o.port=R(p);
  o.chips=qa('.v4pred .vbtn').map(R);
  // MEASURE THE CHIPS, NOT THE ELEMENT I EDITED.
  // v16 read columnGap off .v4pred, which has one child, and got a truthful
  // meaningless 18px. What matters is the daylight between two painted chips:
  // the box gap MINUS the ring each of them paints outside its own box, read
  // off the computed box-shadow rather than assumed.
  const ringOf=e=>{const m=[...getComputedStyle(e).boxShadow.matchAll(
      /rgba?\([^)]*\)\s+0px\s+0px\s+0px\s+([\d.]+)px/g)].map(x=>parseFloat(x[1]));
    return m.length?Math.max(...m):0;};
  o.rows=[...document.querySelectorAll('.b3v, .v4pred, .v-a-row')].map(el=>{
    const kids=[...el.children];
    const btns=kids.filter(k=>k.classList.contains('vbtn')||k.classList.contains('v-a'));
    const cs=getComputedStyle(el);
    const r={sel:el.className.trim().split(/\s+/).join('.'),
             kids:kids.length, btns:btns.length,
             lays:btns.length===kids.length&&btns.length>1,
             gap:cs.columnGap, disp:cs.display};
    if(r.lays){
      const b=btns.map(e=>e.getBoundingClientRect());
      const ring=Math.max(...btns.map(ringOf));
      const boxGaps=[]; for(let i=1;i<b.length;i++)
        boxGaps.push(Math.round((Math.max(b[i-1].left,b[i].left)-
                                 Math.min(b[i-1].right,b[i].right))*10)/10);
      r.ring=ring;
      r.boxGap=Math.min(...boxGaps);
      r.visible=Math.round((r.boxGap-2*ring)*10)/10;
      r.box=btns.map(e=>({w:Math.round(e.getBoundingClientRect().width),
                          h:Math.round(e.getBoundingClientRect().height)}));
    }
    return r;
  });
  o.nodeIco=qa('.node-ico').map(e=>({src:e.getAttribute('src'),...R(e)}));
  o.nodeStates=qa('.ringnode').map(e=>e.className);
  document.body.setAttribute('data-v',JSON.stringify(o));
 },500);
});
"""
def probe(f):
    with tempfile.TemporaryDirectory() as td:
        d = pathlib.Path(td)
        (d / "support.js").write_text(PROBE, encoding="utf-8")
        (d / "f.html").write_text((HERE / f).read_text(encoding="utf-8"), encoding="utf-8")
        for p in (HERE / "assets").glob("*.webp"): shutil.copy(p, d / p.name)
        for p in (ROOT / "assets" / "mk").glob("*.webp"): shutil.copy(p, d / p.name.lstrip())
        out = subprocess.run([CH, "--headless", "--disable-gpu", "--no-sandbox",
            "--virtual-time-budget=6000", "--dump-dom", str(d / "f.html")],
            capture_output=True, text=True, timeout=180).stdout
    i = out.index('data-v="') + 8; raw = out[i:out.index('"', i)]
    for a, b in (("&quot;", '"'), ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&#10;", "\n")):
        raw = raw.replace(a, b)
    return json.loads(raw)

CASC = ["V15CASC%d.dc.html" % i for i in range(1, 7)]
F = CASC + ["V15CASCNOART.dc.html", "V15SET48.dc.html", "V12B4PREDICT.dc.html",
            "V16CHIPSRING.dc.html", "V16CHIPSFLAT.dc.html", "V12B2CHAIRFULL.dc.html",
            "V16NODE.dc.html", "V15B1CARDR.dc.html", "V16B1S2.dc.html",
            "ShareA.dc.html", "ShareB.dc.html", "PathMap.dc.html", "Profile.dc.html",
            "V16KIT.dc.html"]
data = {f: probe(f) for f in F}
fails = []

print("(a) EVERY CROWN AT THE SAME y")
# measured off the PIXELS: the topmost non-ground row of each portrait in its card
def crown_y(f):
    im = np.array(Image.open(HERE / "frames-1x" / (f.replace(".dc.html", "") + ".png"))
                  .convert("RGB")).astype(int)
    d = data[f]
    if "port" not in d: return None
    x0, x1 = d["port"]["x"] + 60, d["port"]["r"] - 60
    band = im[:, max(x0, 0):x1]
    # the kraft card ground is light and flat; ink is anything far from it
    ground = np.median(band[d["card"]["y"] + 20:d["card"]["y"] + 40], axis=(0, 1))
    off = np.abs(band - ground).sum(axis=2)
    rows = np.where((off > 90).sum(axis=1) > 12)[0]
    rows = rows[rows > d["card"]["y"] + 92]
    return int(rows[0]) if len(rows) else None
ys = {}
for f in CASC:
    y = crown_y(f)
    who = [n for n in ("בן-גביר", "נתניהו", "דרעי", "לפיד", "גנץ", "מיכאלי")
           if n in data[f]["txt"]]
    ys[f] = y
    print("   %-16s %-12s crown at y=%s   (card top %d, slot top %d)"
          % (f.replace(".dc.html", ""), who[0] if who else "?", y,
             data[f]["card"]["y"], data[f]["port"]["y"]))
vals = [v for v in ys.values() if v]
print("   spread across the set: %dpx" % (max(vals) - min(vals)))
if max(vals) - min(vals) > 6:
    fails.append("crown spread is %dpx" % (max(vals) - min(vals)))
tops = {data[f]["port"]["y"] - data[f]["card"]["y"] for f in CASC}
print("   portrait slot top, below the card's edge: %s (identical: %s)"
      % (tops, len(tops) == 1))
if len(tops) != 1: fails.append("the portrait slot is not at one offset")

print("\n(b) CHIPS GAPPED AND HIT-SAFE — measured between the PAINTED edges")
print("   %-22s %-16s %5s %5s %8s %s"
      % ("frame", "row", "gap", "ring", "visible", "chips"))
for f in ("V12B4PREDICT.dc.html", "V16CHIPSRING.dc.html", "V16CHIPSFLAT.dc.html",
          "V15CASC1.dc.html", "V12B2CHAIRFULL.dc.html"):
    for r in data[f]["rows"]:
        if not r.get("lays"):
            continue
        print("   %-22s %-16s %5s %5.1f %7.1fpx %s"
              % (f.replace(".dc.html", ""), r["sel"][:16], r["gap"], r["ring"],
                 r["visible"], ", ".join("%dx%d" % (b["w"], b["h"]) for b in r["box"])))
        if "B2" not in f and r["visible"] < 8:
            fails.append("%s: only %.1fpx of daylight between chips" % (f, r["visible"]))
        if any(b["w"] < 44 or b["h"] < 44 for b in r["box"]):
            fails.append("%s: a chip is under 44px" % f)
# THE ASSERTION THAT WOULD HAVE CAUGHT IT: a row carrying a gap whose children
# are not the buttons is spacing nothing.
for f in ("V12B4PREDICT.dc.html", "V16CHIPSRING.dc.html", "V15CASC1.dc.html"):
    for r in data[f]["rows"]:
        if r["disp"] == "flex" and r["gap"] not in ("normal", "0px") and not r["lays"]:
            print("   NOTE %s: %s carries gap %s but its %d child is not a button "
                  "— vestigial here; beat 1's two answers ARE direct children of "
                  ".v4pred and do use it"
                  % (f.replace(".dc.html", ""), r["sel"][:20], r["gap"], r["kids"]))
            if r["kids"] > 1:
                fails.append("%s: %s gaps a row that is not the buttons" % (f, r["sel"]))
r = subprocess.run([sys.executable, str(HERE / "check_tokens_v16.py")],
                   capture_output=True, text=True)
for line in r.stdout.strip().split("\n"):
    if "at 3" in line: print("   " + line.strip())
if r.returncode: fails.append("the token/component check failed")

print("\n(c) THE NEW ICON ON THE MAP NODE, ALL THREE STATES")
d = data["V16NODE.dc.html"]
print("   nodes: %s" % [c.split()[-1] for c in d["nodeStates"]])
print("   icons: %s" % [(i["src"], "%dx%d" % (i["w"], i["h"])) for i in d["nodeIco"][:3]])
if len(d["nodeIco"]) < 3: fails.append("the node icon is missing from a state")
if any(not i["nw"] for i in d["imgs"] if "internal_sec" in i["src"]):
    fails.append("a topic icon failed to load")
states = " ".join(d["nodeStates"])
for st in ("is-locked", "is-live", "is-done"):
    if st not in states: fails.append("node state %s is not rendered" % st)
print("   states present: is-locked %s · is-live %s · is-done %s"
      % ("is-locked" in states, "is-live" in states, "is-done" in states))
print("   also on the live map: %d node icon(s)" % len(data["PathMap.dc.html"]["nodeIco"]))

print("\n(d) s1 AND s2 CLAIM CARDS CARRY THEIR GRAPHICS")
for f, iid in (("V15B1CARDR.dc.html", "s1"), ("V16B1S2.dc.html", "s2")):
    d = data[f]
    art = [i for i in d["imgs"] if "internal_sec_%s" % iid in i["src"]]
    print("   %-16s %s at %dx%d, loaded %s"
          % (iid, art[0]["src"] if art else "MISSING",
             art[0]["w"] if art else 0, art[0]["h"] if art else 0,
             bool(art and art[0]["nw"])))
    if not art or not art[0]["nw"]:
        fails.append("%s: the issue graphic did not load" % iid)
    elif art[0]["nw"] != art[0]["w"]:
        fails.append("%s: served at %dpx from a %dpx file" % (iid, art[0]["w"], art[0]["nw"]))

print("\n(e) TWO SHARE CARDS")
cj = json.loads((HERE / "canvas.json").read_text(encoding="utf-8"))
sh = {a["file"]: a.get("page") for a in cj["artboards"] if a["file"].startswith("Share")}
print("   " + " · ".join("%s -> %s" % (k.replace(".dc.html", ""), v) for k, v in sorted(sh.items())))
live = [k for k, v in sh.items() if v == "sharecards"]
if sorted(live) != ["ShareA.dc.html", "ShareB.dc.html"]:
    fails.append("the picked share cards are %s" % live)

print("\n(f) AV-3 EVERYWHERE")
for f in ("PathMap.dc.html", "Profile.dc.html", "ShareA.dc.html", "ShareB.dc.html",
          "V12B4PREDICT.dc.html"):
    d = data[f]
    print("   %-20s AV-3 avatars %d · old-treatment avatars %d"
          % (f.replace(".dc.html", ""), d["av3"], d["avOld"]))
    if d["avOld"]: fails.append("%s still renders %d old avatars" % (f, d["avOld"]))

print("\n(g) TOKENS, MANIFEST, COMPONENTS")
P = HERE / "prototype"
man = json.loads((P / "manifest.json").read_text(encoding="utf-8"))
css = (P / "hachach.css").read_text(encoding="utf-8")
import re as _re
toks = sorted(set(_re.findall(r"^\s*(--[\w-]+)\s*:", css, _re.M)))
print("   prototype/: %s" % ", ".join(sorted(p.name for p in P.iterdir())))
print("   README.md: %s" % (HERE / "README.md").exists())
print("   %d tokens in :root · %d motion tokens named for what they time"
      % (len(toks), len([t for t in toks if t.startswith("--t-")])))
print("   no vote-direction colour token: %s"
      % (not any(w in css for w in ("--for", "--against", "--abstain", "--vote-for"))))
print("   manifest: %d politicians with art, %d without, %d topic icons, %d issue graphics"
      % (len(man["politicians"]), len(man["politicians_without_art"]),
         sum(1 for v in man["topics"].values() if "glyph" not in v), len(man["issues"])))
b64 = "base64" in (P / "manifest.json").read_text(encoding="utf-8")
print("   assets by path, not base64: %s" % (not b64))
missing = [v for p in man["politicians"].values() for v in (p["400"], p["128"])
           if not (ROOT / v).exists()]
print("   every path in the manifest exists on disk: %s" % (not missing))
if missing: fails.append("manifest names %d files that do not exist" % len(missing))
if not toks: fails.append("no tokens found")
if b64: fails.append("the manifest embeds base64")
if r.returncode: fails.append("components do not resolve from the tokens")

print("\n" + "=" * 66)
print("ALL SEVEN CHECKS PASS" if not fails else "FAILURES (%d)" % len(fails))
for x in fails: print("  · " + x)
print("=" * 66)
sys.exit(1 if fails else 0)
