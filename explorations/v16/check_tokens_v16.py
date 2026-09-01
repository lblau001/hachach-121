# -*- coding: utf-8 -*-
"""Do the components actually resolve from the tokens?

Not "is there a :root block" — the components are rendered from the real
stylesheet in a real browser and their COMPUTED values are compared against the
token values the same stylesheet declares. A component that hardcodes a colour
instead of reading a token fails here.
"""
import json, pathlib, re, shutil, subprocess, sys, tempfile
HERE = pathlib.Path(__file__).resolve().parent
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

PROBE = """
setTimeout(()=>{
  const R=getComputedStyle(document.documentElement);
  const tok=n=>R.getPropertyValue(n).trim();
  const cs=s=>{const e=document.querySelector(s);return e?getComputedStyle(e):null;};
  const out={tokens:{},checks:[]};
  for(const n of ['--ink','--kraft','--paper','--ground','--primary','--verdict-correct',
                  '--verdict-surprise','--r-chip','--gap-visible','--ring-chip','--gap-chip',
                  '--z-press','--card-w',
                  '--card-h','--mk-port-top','--t-press','--t-stamp','--t-flip',
                  '--t-finale','--t-swipe']) out.tokens[n]=tok(n);
  const hex=h=>{h=h.replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');
    return 'rgb('+parseInt(h.slice(0,2),16)+', '+parseInt(h.slice(2,4),16)+', '+parseInt(h.slice(4,6),16)+')';};
  // Chrome reports durations in seconds whatever the source unit, so times are
  // compared as NUMBERS. 0.34s and 340ms are the same duration; a checker that
  // says otherwise is testing itself.
  const secs=v=>{v=String(v).trim();
    return v.endsWith('ms')?parseFloat(v)/1000:parseFloat(v);};
  // A LENGTH TOKEN MAY BE A calc(). Comparing the declared string against a
  // computed pixel value fails on --gap-chip:calc(9px + 2 * 4.6px) even though
  // both sides are 18.2px. Lengths are resolved through a probe element, which
  // is the browser doing the arithmetic rather than the checker guessing.
  const probe=document.createElement('div');
  probe.style.cssText='position:absolute;visibility:hidden;height:0';
  document.body.appendChild(probe);
  const px=v=>{probe.style.width='';probe.style.width=v;
    return getComputedStyle(probe).width;};
  // and compared as NUMBERS with a sub-pixel tolerance: Chrome resolves 4.6px
  // at 1/64px, so calc(9px + 2*4.6px) probes as 18.1875px while the same value
  // serialises as 18.2px off columnGap. Both are the same length.
  const near=(a,b)=>{const x=parseFloat(a),y=parseFloat(b);
    return isFinite(x)&&isFinite(y)&&Math.abs(x-y)<0.06;};
  const add=(name,got,want,num)=>out.checks.push({name,got,want,
    ok:num?Math.abs(secs(got)-secs(want))<1e-6
          :(got===want || near(got,px(want)))});
  add('.p-c background = --primary', cs('.p-c').backgroundColor, hex(tok('--primary')));
  add('.p-c radius = --r-chip', cs('.p-c').borderTopLeftRadius, tok('--r-chip'));
  add('.v-a radius = --r-chip', cs('.v-a').borderTopLeftRadius, tok('--r-chip'));
  add('.v-a background = --paper', cs('.v-a').backgroundColor, hex(tok('--paper')));
  add('.v-a-row gap = --gap-chip', cs('.v-a-row').columnGap, tok('--gap-chip'));
  add('.h-a radius = --r-chip', cs('.h-a').borderTopLeftRadius, tok('--r-chip'));
  add('.ib-b radius = --r-chip', cs('.ib-b').borderTopLeftRadius, tok('--r-chip'));
  add('.mf-b width = --card-w', cs('.mf-b').width, tok('--card-w'));
  add('.mf-b min-height = --card-h', cs('.mf-b').minHeight, tok('--card-h'));
  add('.mf-b__port top = --mk-port-top', cs('.mf-b__port').top, tok('--mk-port-top'));
  add('.d2 animation duration = --t-stamp', cs('.d2').animationDuration, tok('--t-stamp'), 1);
  add('.ov animation duration = --t-flip', cs('.ov').animationDuration, tok('--t-flip'), 1);
  add('.p-c transition = --t-press', cs('.p-c').transitionDuration.split(',')[0].trim(), tok('--t-press'), 1);
  // the three vote chips must be indistinguishable from one another
  // compared WITHIN each row: the chips are flex:1, so a row in a 340px card is
  // narrower than a row on a full-width page and that is the component working,
  // not a difference between the three.
  let rowsOk=true, rowsSeen=0;
  for(const row of document.querySelectorAll('.v-a-row')){
    const v=[...row.querySelectorAll('.v-a')].map(e=>{const c=getComputedStyle(e);
      return [c.backgroundColor,c.color,c.fontSize,c.fontWeight,c.boxShadow,
              Math.round(e.getBoundingClientRect().width),
              Math.round(e.getBoundingClientRect().height)].join('|');});
    rowsSeen++;
    if(v.length!==3 || new Set(v).size!==1) rowsOk=false;
  }
  out.checks.push({name:'each row is three identical chips',
                   got:rowsSeen+' rows checked', want:'all identical', ok:rowsOk});
  out.chipBox=[...document.querySelectorAll('.v-a')].map(e=>{const r=e.getBoundingClientRect();
    return {w:Math.round(r.width),h:Math.round(r.height)};});
  document.title=JSON.stringify(out);
},400);
"""
def run(width):
    with tempfile.TemporaryDirectory() as td:
        d = pathlib.Path(td)
        for f in ("hachach.css", "components.html"):
            shutil.copy(HERE / "prototype" / f, d / f)
        for p in (HERE.parent.parent / "assets" / "mk").glob("mk_*.webp"):
            (d / "assets" / "mk").mkdir(parents=True, exist_ok=True)
            shutil.copy(p, d / "assets" / "mk" / p.name)
        html = (d / "components.html").read_text(encoding="utf-8")
        html = html.replace("../../../assets/mk/", "assets/mk/")
        html = html.replace("</style>", "</style><script>%s</script>" % PROBE, 1)
        (d / "components.html").write_text(html, encoding="utf-8")
        out = subprocess.run([CH, "--headless", "--disable-gpu", "--no-sandbox",
            "--window-size=%d,1400" % width, "--virtual-time-budget=5000",
            "--dump-dom", str(d / "components.html")],
            capture_output=True, text=True, timeout=120).stdout
    m = re.search(r"<title>(.*?)</title>", out, re.S)
    t = m.group(1)
    for a, b in (("&quot;", '"'), ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">")):
        t = t.replace(a, b)
    return json.loads(t)

r = run(390)
print("TOKENS DECLARED IN :root")
for k, v in r["tokens"].items():
    print("   %-20s %s" % (k, v))
print("\nCOMPONENTS RESOLVING FROM THEM")
bad = []
for c in r["checks"]:
    print("   %-38s %-22s %s" % (c["name"], c["got"], "ok" if c["ok"] else "MISMATCH, want " + c["want"]))
    if not c["ok"]: bad.append(c["name"])

print("\nHIT AREAS")
for w in (390, 360):
    rr = run(w)
    box = rr["chipBox"]
    small = [b for b in box if b["w"] < 44 or b["h"] < 44]
    print("   at %dpx: chips %s — all >= 44x44: %s"
          % (w, ", ".join("%dx%d" % (b["w"], b["h"]) for b in box), not small))
    if small: bad.append("a chip drops under 44px at %dpx" % w)

print("\n" + "=" * 60)
print("TOKENS AND COMPONENTS AGREE" if not bad else "PROBLEMS (%d)" % len(bad))
for b in bad: print("  · " + b)
sys.exit(1 if bad else 0)
