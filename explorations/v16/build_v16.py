# -*- coding: utf-8 -*-
"""v13 — the beats settled. Presentation layer only.

CHAIR ASPECT, standardised. Lion set the intro chair to 278x309 on the board —
an aspect of 0.900 against the source crop's 1133x1323, which is 0.856. Beat 2
was drawing the same object at the source ratio, so the same chair was 5% wider
in one place than the other. Everything now uses LION'S 0.900: it is the newer
and deliberate value, and the intro is where the chair is largest and most
looked at. The cost is that every chair on the board is stretched 5% wider than
the artwork; restoring 0.856 on the intro is the one-line alternative.

v12 header follows.

v12 — ROUND BEATS, developed. Presentation layer only.

INT-D carries Lion's stated subtitle size (26px). The chair is enlarged; the
exact figure is mine, because no saved edit exists on either published board to
read it from — see the note on the frame.

v11 header follows.

v11 — REVISION PASS over v10. Presentation layer only.

Picks applied on the Screens page:
  verdict   VD-D2, the heaviest stamp, everywhere a verdict appears
  palette   VP-2 (lime + magenta). The control pair is retired; VP-1 is
            archived with its measured clearances.
  sheet     SP-B, with the preview as large as 390px actually allows
  progress  PI-C
New: a Round Beats page, five options for each of the five beats.

v10 header follows.

v10 — REVISION PASS over v9. Presentation layer only.

The picks, applied everywhere:
  ground     BG-1, charcoal + dot grid (BG-2..5 archived)
  chip       H-A, and ONE radius for every chip and pill in the system
  avatar     AS-D, the die-cut that follows the silhouette
  picker     PK-A, every option visible at once
  layout     CR-C, rebuilt as one bottom sheet per step
  verdict    VD-D, rebuilt as a pressed stamp
  MK art     style B (line + flat fill); style A archived, not deleted
  titles     straight — the per-letter jitter is gone

v9 header follows.

v9 — REVISION PASS over v8. Presentation layer only.

What v9 changes, and nothing else:
  PART 1  the picked components (P-A primary, R-B secondary, IB-B icon
          button, H-B HUD chip, V-A vote set, MF-B MK frame) become the
          shared implementation, applied to every frame on the Screens
          board — and ALL ROTATION is removed from the interface. The
          only page that keeps a tilt is Share Cards.
  PART 2  the verdict is rebuilt as four options that differ in SHAPE and
          PLACEMENT, each straddling the MK card edge, each in all three
          states. Verdict copy is placeholder tokens: the shipped words
          are forbidden here (see VERDICT_TOKENS).
  PART 3  five background directions under one screen, honestly (the
          white die-cut edge is not tuned per ground).
  PART 4  the character set, read out of app.js rather than described.

v7 notes, still true:
THE FULL SCREEN SET, sticker style. One world.

The direction is settled (sticker culture, v4 lane 3 -> v6); this board runs it
through every screen of the revised flow (hachach121-revised-flow-v5.svg):
intro, character creation (shipped mechanic + builder concept), path map, the
round's five beats, end-game allocation, share card.

Style corrections from v6, applied everywhere:
  1  pole-grey ground with grain + ghost remnants (v4 lane 3), everywhere
  2  multicolour pile backs with white die-cut edges, everywhere a pile exists
  3  the v6 court stamp survives; no invented ring text, ever
  4  every numeral in SimplerPro with tabular figures — Bibush is gone from
     numerals entirely (2 reads as Z, 6 as b, 5 as S at every size), and is
     unused on the board because the two display strings it was offered both
     contain characters missing from its cmap
  5  topic titles as per-letter die-cut stickers (SVG text, paint-order:
     stroke fill, per-letter tilt); the tilted pill is dead
  6  chrome icons from the pack in assets/icons (license UNVERIFIED — flagged
     in the caption of every frame that uses one); the avatar button is the
     player's own sticker, never an icon

Copy: data.js + app.js + index.html (the shipped prototype's own markup),
read at build time. Where no shipped string exists the slot renders an
OBVIOUS bracketed placeholder «[טקסט — תמר]» and is listed in TAMAR_TODO.

Writes only into explorations/v13/.

    python3 explorations/v13/tools/frame_portrait.py   # once, for the photo
    python3 explorations/v13/build_v16.py
"""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT  = pathlib.Path(__file__).resolve().parent

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ------------------------------------------------------------- derotation
# v9: every button, chip, card and frame sits straight. Rather than hunting
# ~40 hand-placed tilts through the file and hoping none was missed, the tilt
# is stripped from the stylesheet at emit time — so a rule reintroduced later
# is also caught, and the scrub is one auditable place.
#
# THREE EXEMPTIONS, all deliberate, all reversible by deleting a line here:
#   1  the Share Cards board keeps its tilt (the brief says so);
#   2  the confetti (.cf-*) keeps its tilt — it is falling paper, not a control;
#   3  the per-letter title stickers keep theirs — that jitter is typography,
#      asked for by name, and is set inline in letter_stickers(), not here.
#   4  the beat-4 card pile (.v4pile) keeps its tilt — it is a deck of cards
#      being worked through, asked for by name in the v14 brief as "slightly
#      rotated and offset", and the tilt is the thing that makes it read as
#      cards rather than as a printing misregistration. Not a control.
ROT_KEEP = (".cf-", ".v4pile")

def lean(css):
    """The comments in this file are the record of why each rule is what it is,
    and they belong in this file. They do not belong in 127 copies inside the
    published page — at 1.2 MiB of the bundle they were the difference between
    fitting under the 16 MiB cap and not. Stripped at emit time only; nothing
    here changes what renders."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find("/*", i)
        if j < 0:
            out.append(css[i:]); break
        out.append(css[i:j])
        k = css.find("*/", j + 2)
        if k < 0: break
        i = k + 2
    css = "".join(out)
    # collapse the blank lines the comments leave behind, and trailing spaces
    return "\n".join(l.rstrip() for l in css.split("\n") if l.strip())

SEL_SPLIT = re.compile(r",(?![^(]*\))")

def _needs(sel, classes, ids, body):
    """Would this selector's own name tokens ever be present in this artboard?

    Conservative by construction: a selector is DROPPED only when a class or id
    it names appears nowhere in the artboard's markup, in which case it cannot
    match anything no matter what the rest of the selector says. Anything with an
    attribute selector, or with no name tokens at all (element, :root, *), is
    always kept.
    """
    if "[" in sel:
        return True
    cls = re.findall(r"\.(-?[_A-Za-z][\w-]*)", sel)
    idz = re.findall(r"#(-?[_A-Za-z][\w-]*)", sel)
    if not cls and not idz:
        return True
    return all(c in classes for c in cls) and all(i in ids for i in idz)

def shake(css, body):
    """Drop the rules this artboard cannot use.

    Every artboard carries the whole shared stylesheet — 93 KB of it against a
    6 KB body, of which 43 rules out of 219 could ever match. 127 copies of the
    other 176 rules were most of the published bundle. Pruning is per-artboard
    and purely by name presence; the render is verified pixel-identical before
    and after by shake_check_v16.py.
    """
    classes = set()
    for m in re.finditer(r'class="([^"]*)"', body):
        classes.update(m.group(1).split())
    ids = set(re.findall(r'id="([^"]*)"', body))
    # a filter's url(#id) is a reference, not a selector, but keyframe and
    # font names are matched by name from inside a declaration
    out, i, n = [], 0, len(css)
    kept_decls = []
    while i < n:
        # at-rules keep their whole block: @font-face, @keyframes, @media
        m = re.compile(r"\s*@[\w-]+").match(css, i)
        if m:
            j = css.index("{", m.end())
            depth, k = 1, j + 1
            while depth and k < n:
                if css[k] == "{": depth += 1
                elif css[k] == "}": depth -= 1
                k += 1
            out.append(css[i:k]); i = k; continue
        j = css.find("{", i)
        if j < 0:
            break
        k = css.find("}", j)
        if k < 0:
            break
        sel, decl = css[i:j].strip(), css[j + 1:k]
        if sel and any(_needs(p.strip(), classes, ids, body)
                       for p in SEL_SPLIT.split(sel) if p.strip()):
            out.append(css[i:k + 1]); kept_decls.append(decl)
        i = k + 1
    kept = "\n".join(x.strip() for x in out if x.strip())
    # An @keyframes nobody names any more is dead weight too. The ranges are
    # collected against ONE string and then cut from the END backwards: cutting
    # forwards invalidates every later offset, and the second cut then lands in
    # the middle of whatever followed. That bug ate the rule immediately after a
    # keyframes block and took the character-sheet panel with it.
    decls = " ".join(kept_decls)
    cuts = []
    for m in re.finditer(r"@(?:-\w+-)?keyframes\s+([\w-]+)", kept):
        if re.search(r"animation[^;{}]*\b%s\b" % re.escape(m.group(1)), decls):
            continue
        b = kept.index("{", m.end()); depth, e = 1, b + 1
        while depth and e < len(kept):
            if kept[e] == "{": depth += 1
            elif kept[e] == "}": depth -= 1
            e += 1
        cuts.append((m.start(), e))
    for a, b in reversed(cuts):
        kept = kept[:a] + kept[b:]
    return kept

def derotate(css):
    out = []
    for line in css.split("\n"):
        if any(k in line for k in ROT_KEEP):
            out.append(line); continue
        line = re.sub(r"rotate:\s*-?[\d.]+deg\s*;?", "", line)
        line = re.sub(r"\s*rotate\(-?[\d.]+deg\)", "", line)
        out.append(line)
    return "\n".join(out)

def assert_one_chair_aspect(files):
    """Every chair on the board, at one aspect. The failure this catches is a
    hardcoded height slipping back in beside chair_box() — which is exactly how
    the two beat-2 chairs came to be at 0.898 while the intro was at 0.900."""
    seen = {}
    for name, html in files:
        for m in re.finditer(r'class="(?:ichair|b2chair)[^"]*"[^>]*?'
                             r'width:(\d+)px;height:(\d+)px', html):
            w, h = int(m.group(1)), int(m.group(2))
            seen.setdefault(round(w / h, 3), []).append("%s %dx%d" % (name, w, h))
        for m in re.finditer(r'width:(\d+)px;height:(\d+)px[^>]*?'
                             r'class="(?:ichair|b2chair)', html):
            w, h = int(m.group(1)), int(m.group(2))
            seen.setdefault(round(w / h, 3), []).append("%s %dx%d" % (name, w, h))
    if not seen:
        raise SystemExit("chair check found no chairs — the pattern has drifted")
    target = round(CHAIR_AR, 3)
    off = {k: v for k, v in seen.items() if abs(k - target) > 0.005}
    for k in sorted(seen):
        print("   chair aspect %.3f  x%d  %s" % (k, len(seen[k]), seen[k][0]))
    if off:
        raise SystemExit("CHAIR ASPECT DRIFT: %s (want %.3f)" % (off, target))
    return sum(len(v) for v in seen.values())

# ---------------------------------------------------------------- sources
_src = (ROOT / "data.js").read_text(encoding="utf-8")
DATA = json.loads(_src[_src.index("{"):_src.index("const AVATARS")].rstrip().rstrip(";").rstrip())
_app = (ROOT / "app.js").read_text(encoding="utf-8")
_idx = (ROOT / "index.html").read_text(encoding="utf-8")

def from_app(s, why):
    assert s in _app, ("not in app.js: %r (%s)" % (s, why))
    return s
def from_idx(s, why):
    assert s in _idx, ("not in index.html: %r (%s)" % (s, why))
    return s

# the 8 preset avatars — the flow doc says 21; data.js says 8, and the brief's
# own correction agrees. Extracted whole: the brief forbids redesigning them.
_av_blob = _src[_src.index("const AVATARS"):]
_av_blob = _av_blob[_av_blob.index("["):_av_blob.index(";")]
AVATARS = json.loads(_av_blob)
assert len(AVATARS) == 8, len(AVATARS)

TOPICS = DATA["topics"]
ISSUES = {i["id"]: i for i in DATA["issues"]}
R1, E2 = ISSUES["r1"], ISSUES["e2"]
assert "_tally" in R1 and "_tally" not in E2
GANTZ  = DATA["politicians"]["gantz"]
R1_GANTZ = [p for p in R1["politicians"] if p["id"] == "gantz"][0]
TOPIC_R1 = [t for t in TOPICS if t["id"] == R1["topic"]][0]     # דת ומדינה

# ---- ILLUSTRATION SPIKE: Itamar Ben Gvir -----------------------------------
# He is in the data: 6 MK-card appearances (r2, b1, g1, a1, s1, s2), every one
# of them a "for" vote. s1 is the card the illustration goes on — his own
# police law, where he is the only MK on the issue flagged key:true and the
# vote is basis "doc", i.e. documented rather than inferred from his bloc.
# Nothing here is written: name, party, note and both votes come out of data.js.
BGV     = DATA["politicians"]["ben_gvir"]
S1      = ISSUES["s1"]
BGV_S1  = [p for p in S1["politicians"] if p["id"] == "ben_gvir"][0]
TOPIC_S1 = [t for t in TOPICS if t["id"] == S1["topic"]][0]
assert BGV_S1["vote"] == "for" and BGV_S1["key"] is True and BGV_S1["basis"] == "doc"
assert BGV["name"] == "איתמר בן-גביר"
BGV_APPEARANCES = [i["id"] for i in DATA["issues"]
                   if any(p["id"] == "ben_gvir" for p in i["politicians"])]
assert BGV_APPEARANCES == ["r2", "b1", "g1", "a1", "s1", "s2"], BGV_APPEARANCES

# ---------------------------------------------------------------- strings
S = dict(
    # intro — the shipped intro screen, verbatim (index.html)
    intro_tag   = from_idx("מבית המגדלור · פרוטוטייפ", "intro tag"),
    intro_sub   = from_idx("מה באמת קורה בכנסת?", "intro subtitle"),
    intro_para  = from_idx("לא בוחן ידע. לא אומר למי להצביע. משחק שמראה מה קרה — ומה אתם חושבים על זה.", "intro paragraph"),
    intro_cta   = from_idx("בואו נשחק", "intro CTA"),
    intro_note  = from_idx("סוגיה אחת = דקה · אפשר לשחק כמה שרוצים", "intro note"),
    # character creation (index.html + app.js)
    av_title    = from_idx("בחרו את הדמות שלכם", "avatar screen title"),
    av_sub      = from_idx("בחרו דמות שתלווה אתכם במפה", "avatar screen sub"),
    guest_title = from_idx("כניסה כאורח/ת", "guest card"),
    guest_sub   = from_idx("דלג על בחירת הדמות — ממשיכים ישר למשחק", "guest card sub"),
    b_skin      = from_idx("גוון עור", "builder label"),
    b_hair      = from_idx("שיער", "builder label"),
    b_hairc     = from_idx("צבע שיער", "builder label"),
    b_clothes   = from_idx("חליפה", "builder label"),
    b_eyes      = from_idx("עיניים", "builder label"),
    av_cta      = from_idx("קדימה למפה ›", "avatar CTA"),
    name_label  = from_idx("איך לקרוא לכם? (אופציונלי)", "name field label"),
    name_ph     = from_idx("השם שלכם", "name field placeholder"),
    g_f         = from_idx("לשון נקבה", "gender chip"),
    g_m         = from_idx("לשון זכר", "gender chip"),
    # map (app.js)
    map_start   = from_app("בחר נושא ותתחיל לשחק 🚀", "map empty-state sub"),
    st_done     = from_app("✓ הושלם", "topic status"),
    st_half     = from_app("1/2 סוגיות", "topic status"),
    st_none     = from_app("2 סוגיות", "topic status"),
    # round (app.js) — the v4 claim strings are asserted against data.js below
    ans_t       = from_app("אמת", "claim answer"),
    ans_f       = from_app("שקר", "claim answer"),
    vote_q      = from_app("איך ", "own-vote prompt stem") and "איך היית מצביע?",
    v_for       = from_app("בעד", "vote"),
    v_against   = from_app("נגד", "vote"),
    v_abstain   = from_app("נמנע", "vote"),
    bill_label  = from_app("🏛️ הצעה אמיתית בכנסת", "bill label"),
    verdict_wrong   = from_app("טעית", "wrong verdict"),
    verdict_right   = from_app("צדקת", "correct verdict"),
    guess_label = from_app("הניחוש שלך", "reveal column head"),
    voted_label = from_app("הצביע/ה", "reveal column head"),
    basis_doc   = from_app("מתועד", "basis == doc"),
    go          = from_app("המשך", "continue"),
    passed      = from_app("העבירה", "tally verb"),
    knesset     = from_app("הכנסת: ", "tally stem").strip(),
    src_prefix  = from_app("🔗 מקור: ", "source link prefix"),
    knesset_link= from_app("🏛️ הצבעה רשמית בכנסת", "knesset link"),
    coins_plus  = from_app("מטבעות", "coin unit"),
    # end-game (index.html)
    end_title   = from_idx("סיימתם את כל המפה!", "celebrate title"),
    end_sub     = from_idx("עכשיו אתם יודעים על הכנסת יותר מרוב הישראלים. הגיע הזמן להחליט מה חשוב לכם.", "celebrate sub"),
    end_alloc   = from_idx("בחרתי להקצות את הכספים לטובת:", "allocation label"),
    share_btn   = from_idx("📤 שתף עם חברים", "share button"),
)
# WRITTEN, NOT SHIPPED — the only such string on the board. There is no label
# anywhere in data.js, app.js or index.html for "open the builder", because the
# shipped app has exactly one character screen and the door between the two
# routes has never needed a name. Every annotation on a frame that uses it says
# so, rather than dressing it up as a placeholder.
TWEAK_CTA = "התאימו את הדמות"

# ---------------------------------------------------------------- verdict copy
# THE VERDICT HAS NO COPY YET, AND THAT IS THE POINT.
#
# The two shipped words that used to sit here are both wrong for the job:
#   «טעית»  — "you were wrong". The player was not wrong; the Knesset did
#             something they did not expect. Blaming the player for that is
#             the opposite of what this game is for, so the word is out.
#   «אמת»   — cannot be a correctness verdict. It is one of the two ANSWER
#             words (אמת / שקר) the claim buttons already use, so reusing it
#             as a verdict makes one word mean two different things on two
#             consecutive screens. It stays on beat 1 and on beat 5's claim
#             resolution, where it means what it says.
#
# So the verdict renders neutral tokens, in Latin, in brackets, unmistakably
# unwritten. Tamar writes the three real strings; nothing here guesses at them.
VD_RIGHT, VD_S1, VD_S2 = "[RIGHT]", "[SURPRISE-1]", "[SURPRISE-2]"
VERDICT_TOKENS = ((VD_RIGHT, "right"), (VD_S1, "surp"), (VD_S2, "surp"))

# «איך היית מצביע?» is assembled by app.js from g("היית מצביע","היית מצביעה");
# both halves are asserted present rather than trusting the assembly blindly:
assert "איך " in _app and "היית מצביע" in _app and "?" in _app

# the v4 claim, still split only so the highlighter has something to land on
CLAIM_1 = "הצעת חוק הגיוס שהקואליציה קידמה "
CLAIM_2 = "ב-2024"
CLAIM_3 = " מבוססת על "
CLAIM_4 = "מתווה שכתב... בני גנץ"
assert CLAIM_1 + CLAIM_2 + CLAIM_3 + CLAIM_4 + "." == R1["tf"]

# the MK note, split around the surprise phrase, byte-asserted
_PH = "המתווה שהוא עצמו כתב"
_i = R1_GANTZ["note"].index(_PH)
NOTE_PRE, NOTE_HL, NOTE_POST = R1_GANTZ["note"][:_i], _PH, R1_GANTZ["note"][_i + len(_PH):]
assert NOTE_PRE + NOTE_HL + NOTE_POST == R1_GANTZ["note"]

# no glossary term occurs in the r1 CLAIM string (checked, not assumed): the
# terms that touch r1 live in bill_title/tf_explain («דין רציפות»), and
# «קואליציה» appears only prefix-fused as «שהקואליציה», which the shipped
# markupText word-boundary regex also would not match. So the tappable-term
# treatment is demonstrated on the claim's existing highlighted phrase, and the
# caption says so.
assert not any(term in R1["tf"] for term in DATA["glossary"]
               if " " + term in " " + R1["tf"])
assert "דין רציפות" in R1["bill_title"]

# ---------------------------------------------------------------- placeholders
# Every invented-copy slot renders this obvious bracketed form and nothing else.
def ph(hint, en=None):
    """A copy slot nobody has written yet.

    Two audiences, two languages: the slot RENDERS in Hebrew, because it sits
    inside a Hebrew screen and a placeholder has to read as displaced copy
    rather than as a foreign object; the TODO entry is English, because it is
    an annotation and every annotation on this board is English.
    """
    t = "[טקסט — תמר" + (": " + hint if hint else "") + "]"
    TAMAR_TODO.append(en or hint)
    return '<span class="ph">' + esc(t) + "</span>"
TAMAR_TODO = []
TAMAR_TODO.append("Verdict, all three states. The shipped wrong-verdict word is out "
                  "(the Knesset surprised the player; they did not fail) and the "
                  "claim's TRUE answer word cannot double as a verdict, since the "
                  "beat-1 buttons already use it. Three strings needed.")

# ---------------------------------------------------------------- assets
PHOTO   = OUT / "assets" / "mk-portrait.webp"
FRAMING = json.loads((OUT / "build" / "framing-report.json").read_text(encoding="utf-8"))
assert PHOTO.exists() and FRAMING["output"]["file"] == PHOTO.name
CREDIT    = "צילום: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0"
ICON_FLAG = "אייקונים: זמניים — רישיון לא אומת"
SLOT_W, SLOT_H = FRAMING["constants"]["slot"]

FONT_SRC = ROOT / "fonts" / "SimplerPro_HLAR-Black.woff2"

def subset_font(text):
    """The headline face, cut down to the characters this board actually sets.

    The full woff2 is 71 KB of base64 and it was embedded in every one of the
    127 artboards — 9 MiB of the published bundle, and far more than everything
    else on the page put together. The board sets a fixed, known string set, so
    the face is subset to exactly those codepoints once and reused."""
    from fontTools import subset as fsub
    font = fsub.load_font(str(FONT_SRC), fsub.Options(flavor="woff2"))
    opt = fsub.Options(flavor="woff2", layout_features=["*"], notdef_outline=True,
                       hinting=True, desubroutinize=False)
    sub = fsub.Subsetter(options=opt)
    sub.populate(text=text)
    sub.subset(font)
    import io
    buf = io.BytesIO(); font.flavor = "woff2"; font.save(buf)
    return base64.b64encode(buf.getvalue()).decode()
# Bibush Chunky is deliberately NOT embedded any more. Two independent reasons,
# both measured rather than argued:
#   · numerals — 2/5/6 misread as Z/S/b at every size tested (23-40px);
#   · display  — its cmap is 47 glyphs with no "-" and no gershayim (U+05F4),
#     and the only two strings it was offered are «הח״כ» and «הח״כ ה-121»,
#     which need both. It cannot set either one.
# It IS embedded on one frame — the numerals specimen — so the call can be made
# by looking. Nowhere else on the board carries it.
BIBUSH = base64.b64encode((ROOT / "fonts" / "BibushChunky.v1.0.otf").read_bytes()).decode()
# Asserted here so the second reason cannot rot silently if the copy changes.
_BIBUSH_CMAP = set(" !,.0123456789:;?אבגדהוזחטיךכלםמןנסעףפץצקרשת")
for _s in ("הח״כ", "הח״כ ה-121"):
    assert not set(_s) <= _BIBUSH_CMAP, ("Bibush could now set %r — revisit" % _s)

def icon(rel):
    """Inline an icon from the pack: viewBox + path, recoloured by currentColor.
    The pack's license is unverified, so every frame that calls this carries
    ICON_FLAG in its caption — enforced in build()."""
    src = (OUT / "assets" / "icons" / rel).read_text(encoding="utf-8")
    vb = re.search(r'viewBox="([^"]+)"', src).group(1)
    body = src[src.index(">") + 1:src.rindex("</svg>")]
    return '<svg class="pk-ico" viewBox="%s" aria-hidden="true">%s</svg>' % (vb, body)

# 2-items/map.svg is a folded map with an X marker drawn through it, which
# reads as "close map" on a button. The compass is the pack's other navigation
# glyph and carries no marker at all.
ICONS = dict(map=icon("2-items/compass.svg"), share=icon("9-media/share.svg"),
             settings=icon("8-ui/settings.svg"), close=icon("8-ui/cross.svg"))

# ------------------------------------------------------- the Knesset building
# THE BUILDING, NOT THE MARK. Checked before drawing: the Knesset's own
# institutional identity is the menorah-and-olive-branches emblem, and the
# building is also widely reduced to a flat, symmetrical, straight-on colonnade
# silhouette — a logo. This is deliberately neither:
#   - it is drawn in three-quarter view with a receding side, so it has a
#     viewpoint rather than being a symbol;
#   - the composition is asymmetric (cypresses to one side, the slab cantilevering
#     past the podium on the other);
#   - it carries construction a mark would drop: the podium, the recessed wall
#     behind the colonnade, the thickness of the roof slab.
# Recognisably the Knesset rather than a generic parliament: flat cantilevered
# roof slab, NO dome and NO pediment, slender full-height rectangular columns
# (not fluted, not tapered), a broad low podium, and cypresses.
#
# Geometry is computed, not hand-typed, so the columns stand on the podium and
# the slab actually overhangs.
_KDX, _KDY = 30, 13

def _ksh(p, k=1.0):
    return (p[0] + _KDX * k, p[1] - _KDY * k)

def _kpoly(pts, fill):
    d = " ".join("%s%.1f %.1f" % ("M" if i == 0 else "L", x, y)
                 for i, (x, y) in enumerate(pts))
    return '<path d="%s Z" fill="%s"/>' % (d, fill)

def knesset_svg():
    o = []
    # the podium: flat horizontal bars, front faces only. A three-quarter podium
    # under a three-quarter box interleaves badly at this size — tried it, the
    # steps read as standing in front of the columns.
    o.append(_kpoly([(20, 160), (242, 160), (242, 176), (20, 176)], "#CFC3A4"))
    o.append(_kpoly([(30, 148), (232, 148), (232, 160), (30, 160)], "#E4DCC4"))
    WL, WR, WT, WB = 46, 198, 66, 148
    o.append(_kpoly([(WL, WT), (WR, WT), (WR, WB), (WL, WB)], "#55503F"))
    o.append(_kpoly([(WL, WT + 8), (WR, WT + 8), (WR, WT + 13), (WL, WT + 13)], "#3E3A2E"))
    o.append(_kpoly([(WR, WT), _ksh((WR, WT)), _ksh((WR, WB)), (WR, WB)], "#3A3529"))
    for i in range(7):
        x = 55 + i * 21.5
        o.append(_kpoly([(x, WT + 2), (x + 7, WT + 2), (x + 7, WB), (x, WB)], "#F6F1E2"))
    for k, fill in ((0.36, "#DED4B6"), (0.74, "#CFC3A4")):
        o.append(_kpoly([_ksh((200, WT + 2), k), _ksh((205.5, WT + 2), k),
                         _ksh((205.5, WB), k), _ksh((200, WB), k)], fill))
    SL, SR, ST, SB = 34, 210, 54, 64
    o.append(_kpoly([(SL, ST), (SR, ST), (SR, SB), (SL, SB)], "#D8CCAD"))
    o.append(_kpoly([(SR, ST), _ksh((SR, ST)), _ksh((SR, SB)), (SR, SB)], "#C4B896"))
    o.append(_kpoly([(SL, ST), (SR, ST), _ksh((SR, ST)), _ksh((SL, ST))], "#F8F4E8"))
    o.append('<path d="M22 158 C12 137 18 110 26 99 C34 110 40 137 31 158 Z" fill="#3F6B4A"/>')
    o.append('<path d="M42 162 C35 145 39 124 45 116 C51 124 57 145 50 162 Z" fill="#4E7C57"/>')
    return ('<svg class="knesset" viewBox="0 0 262 186" aria-hidden="true">'
            '<g fill="none" stroke="#131310" stroke-width="3" stroke-linejoin="round" '
            'stroke-linecap="round">%s</g></svg>' % "".join(o))

# ---------------------------------------------------------------- components
TILTS = [-3.2, 2.4, -1.6, 2.8, -2.4, 1.8, -2.8, 3.0]   # deterministic, reused
LS_MIN = 28   # px. Below this the die-cut stroke does not survive rasterisation.

MESSY_DY = [4, -6, 7, -3, 5, -7, 2, -5]      # per-letter vertical wander, px at 100
MESSY_TILT = [-7.5, 5.5, -4, 8, -6.5, 3.5, -8, 6]

def letter_stickers(text, size, cls="", messy=False):
    """A word spelled in letter stickers. Each letter is its own tiny SVG with
    paint-order: stroke fill — the white die-cut edge hugs the LETTERFORM, which
    no text-shadow or box can do — plus its own small tilt. The letters sit
    straight on one baseline as a flex row (RTL by inheritance); a space is a
    gap, not a sticker."""
    # Below LS_MIN the white die-cut stroke is sub-pixel: the row stops
    # reading as stickers and reads as loose tracking, which is strictly
    # worse than plain type. So below the threshold it IS plain type.
    if size < LS_MIN:
        return ('<span class="lsplain %s" style="font-size:%dpx">%s</span>'
                % (cls, size, esc(text)))
    out = ['<span class="lsrow %s" style="font-size:%dpx" aria-label="%s">'
           % (cls, size, esc(text))]
    # digit runs must read LTR inside the RTL row: the row lays children
    # right-to-left, so a run emitted in logical order comes out mirrored.
    text = re.sub(r"[0-9]+", lambda m: m.group(0)[::-1], text)
    k = 0
    for ch in text:
        if ch == " ":
            out.append('<span class="lsgap"></span>')
            continue
        # v10: NO JITTER. Every letter sits straight on one baseline. The
        # per-letter tilt and vertical offset are both gone; what survives from
        # the "stuck by hand" treatment is the horizontal OVERLAP in .ls-messy,
        # which is density rather than jitter and is what makes the die-cut
        # stroke do its work.
        k += 1
        out.append(
            '<svg class="ls" viewBox="0 0 100 116" aria-hidden="true">'
            '<text class="ls-t" x="50" y="92">%s</text></svg>' % esc(ch))
    out.append("</span>")
    return "".join(out)

def numeral(s, cls="", size=0):
    """A numeral. SimplerPro, tabular figures. Never Bibush.

    v7.1 tried to save Bibush for large numerals on the theory that its "2"
    only collapsed into a "Z" at small ppem. Rendering 0-9 at 23, 30, 34 and
    40px killed that theory: 2 reads as Z, 6 as b and 5 as S at EVERY size,
    because those are the glyph shapes and not a rasterisation artefact.
    Three of ten digits misreading is unusable for a game whose payload is
    tallies, coin totals and a count-up, so every numeral is SimplerPro now.

    The count-up still cannot jitter, but NOT because the font is tabular.
    A first measurement said SimplerPro's digits were all 20.000px at 40px;
    that measurement was wrong — it was taken in a scratch page where the
    @font-face had not loaded, so it measured the fallback. Measured inside a
    real frame with the font live, SimplerPro Black at 40px advances 25.7824px
    for every digit except "0", which is 25.5325px, and declaring both
    font-variant-numeric: tabular-nums and font-feature-settings: "tnum" does
    not change it: the face has no working tabular feature.

    A quarter of a pixel is invisible, but a count-up gains and loses zeroes
    constantly and "cannot jitter" should not rest on it being too small to
    see. So every digit sits in a fixed-width cell, as it did under Bibush.
    The mechanism is font-independent: swap the face and the guarantee holds.

    `size` is accepted and ignored — it documents the rendered size at each
    call site, and the audit reads the call sites.
    """
    out, run = [], ""
    def flush():
        if run:
            out.append('<span class="bd-t" dir="auto">%s</span>' % esc(run))
    for ch in s:
        if ch.isdigit():
            flush(); run = ""
            out.append('<span class="bd">%s</span>' % esc(ch))
        else:
            run += ch
    flush()
    return '<span class="bnum %s">%s</span>' % (cls, "".join(out))

def stamp(word, var, extra_cls=""):
    """The v6 court stamp, verbatim mechanism: ring + word as one artwork, ink
    bleed by low-frequency displacement, density knocked out by finer noise,
    multiply onto whatever the card is. The ring carries rules and a tick
    course; the only word is a string app.js already uses."""
    return ('<span class="stamp %s" aria-hidden="true"><svg viewBox="0 0 200 200">'
            '<g class="st-ink" filter="url(#ink-%s)">'
            '<circle cx="100" cy="100" r="93" stroke-width="7"></circle>'
            '<circle cx="100" cy="100" r="79" stroke-width="2.5"></circle>'
            '<circle cx="100" cy="100" r="86" stroke-width="5.5" stroke-dasharray="3 9.35" stroke-linecap="butt"></circle>'
            '<path d="M46 74h108" stroke-width="3.5"></path>'
            '<path d="M46 126h108" stroke-width="3.5"></path>'
            '<text class="st-word" x="100" y="115" font-size="44">%s</text>'
            '</g></svg></span>') % (extra_cls, var, esc(word))

AV_PICK = "AV-3"      # v16: the pick, applied everywhere rather than proposed

def avatar_sticker(idx, cls="", plate=False):
    """Every avatar on the board. AV-3 is the picked treatment, so this is where
    it is applied — one function, and every screen follows. avatar_legacy() is
    the old flat-vector figure, kept only for the archived AV proposal frames
    and the AS-* shape study that is ABOUT the old artwork."""
    if AV_PICK == "AV-3":
        return av3(idx, cls)
    return avatar_legacy(idx, cls, plate)

def avatar_legacy(idx, cls="", plate=False):
    """One preset avatar from data.js AVATARS, as shipped — the brief forbids
    redesigning the characters, so ONLY the treatment is applied: the die-cut
    edge rides on a wrapper, the artwork inside is byte-identical.

    AS-D is the pick, so the default now STRIPS THE BACKGROUND PLATE: a die-cut
    that follows the silhouette cannot follow anything if the artwork carries an
    opaque rounded rectangle behind the figure. The plate is the first <rect> in
    every one of the eight presets and nothing else in the drawing is a rect
    with rx="12" — asserted, not assumed. Pass plate=True to keep it."""
    a = AVATARS[idx]
    svg = a["svg"]
    if not plate:
        # TWO leading rects are background in all eight presets, not one: the
        # full-bleed plate (rx="12") and a colour band across the lower third at
        # opacity .3. Strip both. The THIRD rect is the neck and must survive —
        # which is why this asserts each signature instead of counting.
        for sig in ('rx="12"', 'opacity=".3"'):
            i = svg.index("<rect")
            j = svg.index("/>", i) + 2
            assert sig in svg[i:j], (a["id"], sig, svg[i:j][:90])
            svg = svg[:i] + svg[j:]
        assert '<rect x="45" y="60"' in svg, a["id"]      # the neck is still there
    return '<span class="avs %s" data-av="%s">%s</span>' % (cls, a["id"], svg)

# ---------------------------------------------------------------- AV-3
# AV-3 IS THE PICK, SO IT IS NOT A PROPOSAL FRAME ANY MORE — it replaces the
# figure everywhere avatar_sticker() is called, which is every place an avatar
# appears: the HUD, the map's "you are here", the character sheets and pickers,
# the beat-2 overlay, the 121st-vote row and the share cards. One function, one
# change, no screen left on the old treatment.
#
# THE PRESETS STAY DISTINGUISHABLE. Skin, hair and garment are read out of each
# shipped preset's own SVG rather than invented, so the eight characters data.js
# defines are still eight different characters — only the treatment changes,
# which is what the brief has forbidden redesigning them past.
_SKIN_OK = ("#f4c9a5", "#f0c090", "#c68b5c", "#e8b088")

def _av_palette(a):
    fills = re.findall(r'fill="(#[0-9a-fA-F]{3,6})"', a["svg"])
    skin = next((f for f in fills if f.lower() in _SKIN_OK), "#e8b088")
    def lum(h):
        h = h.lstrip("#")
        if len(h) == 3: h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
        return 0.299 * r + 0.587 * g + 0.114 * b
    rest = [f for f in fills if f.lower() != skin.lower() and f.lower() != "#fff"]
    hair = min(rest, key=lum) if rest else "#2A2118"
    garment = max(rest, key=lum) if rest else "#6E7F5C"
    return skin, hair, garment

def av3(idx, cls="", px=None):
    """The player, as layered paper. No facial features at any size.

    AT 40px, WHICH IS WHERE IT MATTERS: the axis marker and the HUD chip are
    40px, and that is the size at which the MK portraits are still recognisably
    photographic heads in a 3:4 box. AV-3 at 40px is a circle, a flat silhouette
    and one hair shape with a white cut edge — no eyes, no 3:4, no name under
    it. The distinction does not depend on detail surviving, which is exactly
    why it survives: there is no detail to lose."""
    a = AVATARS[idx]
    skin, hair, garment = _av_palette(a)
    uid = "av3%d" % idx
    return ('<span class="avs avs3 %s" data-av="%s">'
            '<svg viewBox="0 0 100 100" aria-hidden="true"%s>'
            '<defs><clipPath id="c-%s"><circle cx="50" cy="50" r="48"/></clipPath></defs>'
            '<circle cx="50" cy="50" r="48" fill="#C9BFA6"/>'
            '<g clip-path="url(#c-%s)">'
            '<path d="M22 100 v-9 a28 28 0 0 1 56 0 v9 z" fill="%s" stroke="#131310" '
            'stroke-width="3.4" stroke-linejoin="round"/>'
            '<rect x="44" y="55" width="12" height="10" fill="%s" stroke="#131310" '
            'stroke-width="3.4"/>'
            '<circle cx="50" cy="40" r="21" fill="%s" stroke="#131310" stroke-width="3.4"/>'
            '<path d="M29 36 a21 21 0 0 1 42 0 q-10 -7 -21 -7 t-21 7 z" fill="%s" '
            'stroke="#131310" stroke-width="3.4" stroke-linejoin="round"/>'
            '<path d="M29 36 a21 21 0 0 1 42 0 q-10 -7 -21 -7 t-21 7 z" fill="none" '
            'stroke="#FBF7EE" stroke-width="2.2" stroke-linejoin="round" opacity=".9"/>'
            '</g>'
            '<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,.55)" '
            'stroke-width="1.6"/></svg></span>'
            % (cls, a["id"],
               ' width="%d" height="%d"' % (px, px) if px else "",
               uid, uid, garment, skin, skin, hair))

PLAYER_AV = 2   # אמיר — one fixed choice so the same face recurs across screens

def pile(cls=""):
    return ('<div class="pile %s" aria-hidden="true">'
            '<div class="pile-card pile-3"></div>'
            '<div class="pile-card pile-2"></div>'
            '<div class="pile-card pile-1"></div></div>' % cls)

def pinned():
    """The round chrome's pinned beat-1 answer: the player's אמת sticker,
    slightly tilted, stuck over the frame's top edge — an identity artifact,
    not a progress pip (flow doc). Shown on the beat 2–5 components."""
    return pinned_word(S["ans_t"])

def pinned_word(word):
    """The same chip, carrying whichever answer the issue on screen actually
    has. s1's tf_answer is "false", so its card must pin שקר — a card whose
    every other string is data.js verbatim cannot pin the wrong answer."""
    return ('<span class="pinned" aria-hidden="true"><span class="pinned-word">%s</span></span>'
            % esc(word))

def hud(topic_label=None, coins="240"):
    # 21px is below LS_MIN, so this resolves to plain type — deliberately.
    mid = letter_stickers(topic_label, 21, "hud-ls") if topic_label else ""
    return ('<header class="hud">'
            '<div class="hud-coins chip"><span class="coin-glyph" aria-hidden="true"></span>%s</div>'
            '<div class="hud-mid%s">%s</div>'
            '<div class="hud-you">'
            '<button type="button" class="map-btn chip" aria-label="מפה">%s</button>'
            '%s'
            '</div></header>'
            % (numeral(coins, "coin-num", 22), " chip" if mid else "", mid, ICONS["map"],
               avatar_sticker(PLAYER_AV, "avs-hud")))

# the shared filter defs; every artboard carries them once
def DEFS(var):
    return '''<svg class="defs" width="0" height="0" aria-hidden="true"><defs>
      <filter id="dc-%V%" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
        <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="r2"></feMorphology>
        <feOffset in="r2" dx="3" dy="5" result="r2o"></feOffset>
        <feFlood flood-color="#3D5BFF" result="f2"></feFlood>
        <feComposite in="f2" in2="r2o" operator="in" result="tint"></feComposite>
        <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="r1"></feMorphology>
        <feFlood flood-color="#fff" result="f1"></feFlood>
        <feComposite in="f1" in2="r1" operator="in" result="cut"></feComposite>
        <feMerge><feMergeNode in="tint"></feMergeNode><feMergeNode in="cut"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
      </filter>
      <filter id="dcw-%V%" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
        <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="w1"></feMorphology>
        <feFlood flood-color="#fff" result="wf"></feFlood>
        <feComposite in="wf" in2="w1" operator="in" result="cut"></feComposite>
        <feMerge><feMergeNode in="cut"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
      </filter>
      <filter id="av-sm-%V%" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="a1"></feMorphology>
        <feFlood flood-color="#fff" result="af"></feFlood>
        <feComposite in="af" in2="a1" operator="in" result="acut"></feComposite>
        <feMerge><feMergeNode in="acut"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
      </filter>
      <filter id="gh-%V%" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
        <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="g1"></feMorphology>
        <feFlood flood-color="#BFAC83" result="gf"></feFlood>
        <feComposite in="gf" in2="g1" operator="in"></feComposite>
      </filter>
      <filter id="ink-%V%" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
        <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="5" result="wob"></feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="wob" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="pressed"></feDisplacementMap>
        <feTurbulence type="fractalNoise" baseFrequency="0.105" numOctaves="3" seed="13" result="dry"></feTurbulence>
        <feColorMatrix in="dry" type="saturate" values="0" result="dryg"></feColorMatrix>
        <feComponentTransfer in="dryg" result="holes"><feFuncA type="linear" slope="0.72" intercept="-0.70"></feFuncA></feComponentTransfer>
        <feComposite in="pressed" in2="holes" operator="out" result="inked"></feComposite>
        <feGaussianBlur in="inked" stdDeviation="0.4"></feGaussianBlur>
      </filter>
    </defs></svg>'''.replace("%V%", var)

# ---------------------------------------------------------------- shared CSS
SHARED = """
@font-face{font-family:'SimplerPro';src:url(data:font/woff2;base64,%FONT%) format('woff2');font-weight:900;font-style:normal;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#9A9A97;font-family:system-ui,"Segoe UI",Arial,sans-serif;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
a{color:#1a3acc}a:hover{color:#0f2894}
.defs{position:absolute;width:0;height:0}

/* The artboard is the phone and nothing else. Every annotation lives on the
   canvas as a sticky note beside its frame — English, neutral canvas styling,
   sharing no edge and no background with the design. */
.stage{width:390px}

/* ---- THE WORLD: pole grey, two grains, ghost remnants — every frame ---- */
.frame{position:relative;width:390px;overflow:hidden;isolation:isolate;
  display:flex;flex-direction:column;padding:12px 16px 20px;
  background:#403E3A;color:#131310;box-shadow:0 3px 14px rgba(0,0,0,.3)}
.frame::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:
    radial-gradient(rgba(255,255,255,.07) .5px,transparent .6px),
    radial-gradient(rgba(0,0,0,.34) .5px,transparent .6px);
  background-size:4px 4px,7px 7px;background-position:0 0,2px 3px}
.fz{position:relative;z-index:1}

/* ---- placeholder copy — deliberately loud, unmistakably not real ---- */
.ph{display:inline-block;background-color:#FFD60A;background-image:repeating-linear-gradient(45deg,#FFE03D 0 8px,#FFD60A 8px 16px);
  color:#131310;border:2px dashed #131310;border-radius:4px;padding:2px 8px 3px;
  font-size:13px;font-weight:700;line-height:1.4}

/* ---- per-letter sticker type ---- */
.lsrow{display:inline-flex;align-items:baseline;line-height:1}
.ls{width:.86em;height:1em;overflow:visible;flex:none;margin:0 -.035em}
.ls-t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:92px;
  text-anchor:middle;fill:#131310;stroke:#fff;stroke-width:21px;stroke-linejoin:round;
  paint-order:stroke fill}
.lsgap{width:.34em;flex:none}
/* the fallback below LS_MIN — plain title, normal tracking, no fake stickers */
.lsplain{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;letter-spacing:0;
  line-height:1.15;display:inline-block}
.ls-drop .ls{filter:drop-shadow(0 2px 0 rgba(0,0,0,.30))}
/* stuck by hand: the letters overlap and sit off the baseline. The die-cut
   stroke is doing real work here — it is the only thing separating one
   letterform from the one lying on top of it — so it is heavier, and each
   letter paints over its neighbour in source order. */
.ls-messy{align-items:center}
.ls-messy .ls{margin:0 -.115em;position:relative}
.ls-messy .ls-t{stroke-width:29px}
.ls-messy .ls:nth-child(2n){z-index:2}
.ls-messy .ls:nth-child(3n){z-index:3}

/* Every numeral on the board. Bibush is gone from numerals entirely — see
   the note in numeral(). */
.bnum{display:inline-flex;direction:ltr;line-height:1;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
/* .66em is above SimplerPro Black's widest digit advance (.645em measured);
   the cell, not the face, is what makes the count-up steady */
.bd{display:inline-block;width:.66em;text-align:center;flex:none}
/* non-digit runs — a slash, a space, the Hebrew of "3 of 9" — are ordinary
   text and are NOT cell-ised; doing that collided the letters */
.bd-t{display:inline-block;flex:none;white-space:pre}
.bd-p{width:auto;min-width:.3em}

/* ---- HUD ---- */
/* THE HUD HAS NO SURFACE OF ITS OWN. It was reading as a strip because the
   background gradient started below it, leaving a flat band across the top.
   The container is now fixed, transparent, and every element is its own
   die-cut chip — white edge, thin dark keyline, flat fill, a degree or two of
   rotation so no two sit on the same axis. Nothing here is a bar. */
.hud{position:absolute;top:0;left:0;right:0;z-index:40;min-height:64px;display:flex;
  align-items:center;justify-content:space-between;gap:8px;padding:12px 16px 0;
  background:none;border:0;pointer-events:none}
.hud > *{pointer-events:auto}
/* one construction, used by every chip in the HUD */
/* HUD CHIP = H-A, the pill — H-B survives nowhere. It carries the system's
   ONE radius token, which every decorative pill inside a card now carries too:
   the intro tag, the bill date, the beat-5 source chips and the end-game coin
   were all separate 999px declarations and are now the same 20px as this. */
.chip{background:#FBF7EE;border:3px solid #fff;border-radius:20px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.42),0 3px 0 rgba(0,0,0,.34)}
.hud-coins{display:flex;align-items:center;gap:7px;flex:none;padding:5px 13px 6px;rotate:-1.6deg}
.coin-glyph{width:22px;height:22px;flex:none;border-radius:50%;background:#FFD60A;
  box-shadow:inset 0 0 0 2px #000}
.coin-num{font-size:22px;color:#131310}
.hud-mid{display:flex;justify-content:center;min-width:0;padding:5px 14px 7px;rotate:1.4deg}
.hud-ls .ls-t{stroke-width:23px}
.hud-you{display:flex;align-items:center;gap:7px;flex:none}
/* THE HUD PAIR. Both controls are one shape at one size: a 40x40 circle with
   a white die-cut ring, pale fill, dark glyph. The map button used to be a
   dark disc, which fought a light HUD and made the two read as different
   kinds of thing. The 44px touch target is preserved by bleeding ::after
   past the visual box on every side. */
/* ICON BUTTON = IB-B: the rounded square. The avatar button takes the same
   radius so the HUD pair still reads as one pair of controls rather than a
   sticker parked next to a button. */
.map-btn{position:relative;width:40px;height:40px;flex:none;cursor:pointer;
  display:grid;place-items:center;padding:0;color:#131310;border-radius:14px}
.map-btn::after{content:"";position:absolute;inset:-2px}
.map-btn:focus-visible{outline:3px solid #131310;outline-offset:4px}
.pk-ico{width:21px;height:21px;display:block}
/* used on two different frames, so it belongs to the shared sheet. It was
   first declared inside one frame's stylesheet and grew to fill its button on
   the other — and the patch that was supposed to move it anchored on a
   selector that no longer existed, so it silently did nothing. */
.tweak-ico{width:19px;height:19px;flex:none;fill:none;stroke:currentColor;stroke-width:2;
  stroke-linecap:round;stroke-linejoin:round}
/* the avatar button IS the player's sticker — never an icon. Masked to the
   same circle as the map button, with the same white die-cut ring, so the two
   read as a pair rather than as a sticker next to a control. */
.avs{display:inline-block;flex:none}
.avs svg{display:block;width:100%;height:100%}
/* AS-D in the HUD: no box, no plate, no crop — the white die-cut edge rides
   the figure itself. It is the one control on the screen that is not a
   rectangle, which is the point: the player's own sticker should not look like
   another button. */
.avs-hud{position:relative;width:40px;height:40px;background:none;border:0;
  box-shadow:none;filter:url(#av-sm-%VAR%) drop-shadow(0 2px 0 rgba(0,0,0,.3))}
.avs-hud svg{width:100%;height:100%;overflow:visible}

/* ---- the pile: multicolour backs, white die-cut edges (correction 2) ---- */
.pile{position:absolute;inset:0;pointer-events:none}
.pile-card{position:absolute;inset:0;border:5px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.42)}
.pile-1{background:#FF3B6B;transform:translateY(-11px) rotate(-3.4deg)}
.pile-2{background:#3D5BFF;transform:translateY(-20px) rotate(4.6deg)}
.pile-3{background:#FF8A00;transform:translateY(-29px) rotate(-7deg)}

/* ---- the court stamp (correction 3) ---- */
.stamp{position:absolute;z-index:7;pointer-events:none;mix-blend-mode:multiply;
  width:196px;height:196px;rotate:-13deg;color:#C4133F;opacity:.94}
.stamp svg{display:block;width:100%;height:100%;overflow:visible}
.st-ink{fill:none;stroke:currentColor}
.st-word{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;fill:currentColor;
  text-anchor:middle}

/* ---- the pinned beat-1 answer: identity artifact on the round chrome ---- */
.pinned{position:absolute;z-index:8;top:-14px;right:26px;rotate:-7deg;
  background:#FFFFFF;border:4px solid #131310;border-radius:10px;padding:8px 18px 10px;
  box-shadow:0 4px 0 rgba(0,0,0,.4)}
.pinned-word{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:24px;
  line-height:1;color:#131310}

/* ---- cards & buttons, lane-3 grammar ---- */
.scard{position:relative;background:#FFF3CE;border:7px solid #fff;
  box-shadow:0 7px 0 rgba(0,0,0,.42),0 16px 26px rgba(0,0,0,.28)}
/* PRIMARY = P-C, app-wide. The white stroke IS the treatment now, not something
   added to the old one: the mustard extrusion (#C7A408) is gone entirely, and
   the depth comes from the button's own white-and-keyline edge repeated 6px
   below itself. Against the yellow plaza ground on the intro, a mustard shadow
   had nothing to sit against; a white stroke has.
   The press still reads as pressed INTO the surface: the face translates down
   by the full extrusion depth and the offset copy goes to 0, over 80ms. */
.sbtn{appearance:none;cursor:pointer;border:0;background:#FFD60A;color:#131310;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:22px;line-height:1;
  min-height:56px;padding:14px 16px;border-radius:16px;
  box-shadow:0 0 0 3px #fff,0 0 0 4.6px rgba(0,0,0,.5),0 6px 0 0 rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:transform 80ms linear,box-shadow 80ms linear}
.sbtn:active,.sbtn.is-pressed{transform:translateY(6px);
  box-shadow:0 0 0 3px #fff,0 0 0 4.6px rgba(0,0,0,.5),0 0 0 0 rgba(0,0,0,.5)}
.sbtn:focus-visible{outline:4px solid #000;outline-offset:4px}
/* SECONDARY = R-B, and the brief's constraint is the whole point: it keeps
   P-A's box exactly — same min-height, same padding, same font-size, same
   radius — and reads as secondary through FILL, BORDER and INK alone. Nothing
   about it is smaller. It has no extrusion, so it also does not press. */
.sbtn2{appearance:none;cursor:pointer;background:none;color:#EFECE4;border:0;
  box-shadow:inset 0 0 0 2.5px #EFECE4;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:22px;line-height:1;
  min-height:56px;padding:14px 16px;border-radius:16px;
  display:flex;align-items:center;justify-content:center;gap:9px}
.sbtn2:focus-visible{outline:4px solid #EFECE4;outline-offset:4px}
/* VOTE SET = V-A. Shared, because beat 1's two answers and beat 2's three
   votes are the same kind of thing: a set of equal choices. One construction,
   one fill, one ink, one size — the constraint is enforced by there being
   only one rule. */
.vbtn{appearance:none;cursor:pointer;border:0;background:#FBF7EE;color:#131310;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:22px;line-height:1;
  min-height:56px;padding:14px 16px;border-radius:14px;box-shadow:0 4px 0 0 #C6C0AE;
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:transform 80ms linear,box-shadow 80ms linear}
.vbtn:active{transform:translateY(4px);box-shadow:0 0 0 0 #C6C0AE}
.vbtn:focus-visible{outline:4px solid #131310;outline-offset:4px}
/* TERTIARY: text and an icon. No plate, no border, no extrusion, no rotation —
   every one of those is a signal of pressability, and this action must read as
   a caption sitting next to the one primary on the screen. */
.tertiary{appearance:none;background:none;border:0;padding:6px 4px;cursor:pointer;
  display:inline-flex;align-items:center;gap:7px;
  font-family:system-ui,"Segoe UI",Arial,sans-serif;font-weight:700;font-size:14px;
  color:#BEB9AC;text-decoration:underline;text-underline-offset:3px}
.tertiary:focus-visible{outline:3px solid #FBF7EE;outline-offset:3px}
.avs-die svg{overflow:visible}

/* the grammar chips. They were defined twice — a 999px pill on the character
   detail, a 10px rounded rect on the creation layouts — which is how a system
   drifts. One definition, taking H-B's corner like every other chip. */
.gchip{display:inline-flex;align-items:center;background:#FBF7EE;border-radius:12px;
  padding:9px 15px;font-size:13.5px;font-weight:700;color:#131310;
  box-shadow:0 3px 0 rgba(0,0,0,.3)}
.gchip.on{box-shadow:0 0 0 3px #FBF7EE,0 0 0 5.5px #131310,0 4px 0 rgba(0,0,0,.32)}

/* the floating ID badge. It lives HERE and not in one board's sheet because
   three boards print it; on the two that did not carry that sheet it fell back
   to an unpositioned block and .frame's flex stretch blew it out to full width.
   width:fit-content is the fix — align-self alone is not enough. */
.bgv-tag{position:absolute;z-index:50;top:10px;left:16px;width:fit-content;
  align-self:flex-start}

/* the pickable ID badge and the spec line under an option. They live in the
   shared sheet because four different boards print them now, and the last
   time a rule like this was declared inside one board's stylesheet it went
   missing on the next board that used it. */
.cs-id{direction:ltr;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:10.5px;letter-spacing:.08em;color:#131310;background:#FBF7EE;border-radius:5px;
  padding:2px 7px 3px;box-shadow:0 0 0 1.5px rgba(0,0,0,.45);
  /* an explicit width means a flex parent's align stretch never applies — this
     badge was being blown out to the full frame width on every board whose
     container was a plain flex column. */
  width:fit-content}
.cs-spec{direction:ltr;text-align:left;font-size:11px;font-weight:700;color:#BEB9AC;
  line-height:1.45}

/* ---- THE VERDICT ---------------------------------------------------------
   Four shapes are offered (v9 Verdict board); everything they share lives
   here, so no option can win by being built better than the others.

   SHARED, and non-negotiable across all four:
     - the copy is LARGER than the v8 verdict: 26px, up from 18px;
     - the interior is semi-transparent with a backdrop blur, so the card and
       the ground behind it are visibly still there;
     - it STRADDLES an edge — part on the card, part off it. Every option
       below is positioned against .vdcard/.mk-card and hangs past its edge on
       purpose, which is also why they all sit above the card in z-order.
   COLOUR CODES CORRECTNESS AND NOTHING ELSE: one ink for "you called it",
   one ink for "the Knesset surprised you". SURPRISE-1 and SURPRISE-2 are two
   different sentences for the same state, so they share the same ink — the
   difference between them is copy, never colour. No vote direction is ever
   coloured anywhere on this board. */
.vd{position:absolute;z-index:9;direction:ltr;
  display:grid;place-items:center;text-align:center;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;line-height:1.05;
  white-space:nowrap;color:#131310;border:3px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(7px) saturate(1.3);backdrop-filter:blur(7px) saturate(1.3);
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5),0 5px 0 rgba(0,0,0,.28)}
/* the two inks. .62 alpha is the trade being shown: lower and the card reads
   through better, higher and the token stays legible where it crosses from
   the light card onto the dark ground. */
.vd-right{background:rgba(46,196,182,.62)}
.vd-surp{background:rgba(255,214,10,.62)}
/* VD-A — pill straddling the card's BOTTOM edge, centred. */
.vd-a{border-radius:20px;padding:11px 28px 13px;left:50%;translate:-50% 0;bottom:-26px}
/* VD-B — corner badge on the card's TOP corner. RTL, so it is the top-right
   corner; it hangs past both the top and the side edge at once. */
.vd-b{border-radius:14px;padding:10px 20px 12px;top:-22px;right:-18px}
/* VD-C — banner across the card's lower third, bleeding past BOTH side edges. */
.vd-c{border-radius:5px;padding:13px 0 15px;left:-16px;right:-16px;bottom:22%}
/* VD-D — stamp over the portrait's corner: it lands on the portrait, the card
   and the ground in one go, so it straddles two edges rather than one. */
.vd-d{width:118px;height:118px;border-radius:50%;font-size:16px;padding:0 9px;
  white-space:normal;top:26%;right:-36px}

/* die-cut treatment on preset avatar stickers: the artwork is untouched, the
   edge rides on the wrapper via the alpha-dilate filter */
.avs-cut{filter:url(#dcw-%VAR%) drop-shadow(0 3px 0 rgba(0,0,0,.28))}

/* ---- GROUND INK, last word in the sheet ---------------------------------
   The ground is dark, so text sitting directly ON it is light. This block is
   deliberately the final rule in the stylesheet: an earlier attempt put it
   near the top and the HUD's own .coin-num colour, declared later, quietly
   won — the coin digits came out near-black on a near-black ground and only
   the contrast audit caught it. Every LIGHT card keeps the dark default, so a
   card can never inherit ground ink by accident. */
.coin-num,.hud-mid,.hud-mid .lsplain,.meter-num,.meter-sub,.node-name,.node-status,
.intro-sub,.intro-para,.intro-note,.peel-title,.peel-sub,.bcat,.bcat .lsplain,
.end-title,.end-sub,.end-alloc,.hold-h,.hold-n,.bskip,.sort-prompt{color:#EFECE4}
.meter-sub,.node-status,.intro-note,.peel-sub,.hold-n,.bskip{color:#BEB9AC}
/* anything sitting ON a chip is on a light surface again, so it takes ink.
   This has to come after the ground block, which is the last word otherwise. */
.chip,.chip .coin-num,.chip .meter-num,.chip .lsplain,.chip .hud-ls{color:#131310}

@media (prefers-reduced-motion: reduce){*{animation:none !important;transition:none !important}}
"""

PAGE = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>%SHARED%
%CSS%
  </style>
</helmet>
<div class="stage %VAR%">
  <div class="frame" dir="rtl" lang="he" style="min-height:%FH%px">
    %DEFS%
    %BODY%
  </div>
</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":390,"height":%PH%}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
"""

BOARDS = []   # (file, num, he, en, meta, credit?, frame_h, body, css)

# ================================================================= 1 · intro
_intro_body = """
  <div class="fz intro-wrap">
    <p class="intro-tag">%TAG%</p>
    <div class="intro-title">%T1%%T2%</div>
    <p class="intro-sub">%SUB%</p>
    <p class="intro-para">%PARA%</p>
    <div class="intro-peek">%KNESSET%</div>
    <button type="button" class="sbtn intro-cta">%CTA%</button>
    <p class="intro-note">%NOTE%</p>
  </div>"""

def board_intro():
    body = (_intro_body
        .replace("%TAG%", esc(S["intro_tag"]))
        .replace("%T1%", letter_stickers("הח״כ", 108, "ls-drop ls-messy", messy=True))
        .replace("%T2%", letter_stickers("ה-121", 108, "ls-drop ls-messy", messy=True))
        .replace("%SUB%", esc(S["intro_sub"]))
        .replace("%PARA%", esc(S["intro_para"]))
        .replace("%KNESSET%", knesset_svg())
        .replace("%CTA%", esc(S["intro_cta"]))
        .replace("%NOTE%", esc(S["intro_note"])))
    css = """
.intro-wrap{display:flex;flex-direction:column;align-items:center;gap:0;text-align:center;
  padding-top:26px}
.intro-tag{font-size:12px;font-weight:700;color:#3E3B33;background:#fff;border:2px solid #131310;
  border-radius:20px;padding:4px 13px;rotate:-1.5deg;box-shadow:0 2px 0 rgba(0,0,0,.3)}
.intro-title{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:20px}
.intro-sub{margin-top:20px;font-size:19px;font-weight:700}
.intro-para{margin-top:12px;max-width:30ch;font-size:16px;font-weight:700;line-height:1.55}
/* v10: the framed collage is gone — the MK photograph and both player-character
   stickers with it — and the building takes the space it occupied. */
.intro-peek{position:relative;width:300px;margin-top:34px}
.knesset{display:block;width:100%;height:auto;overflow:visible;
  filter:url(#dcw-%VAR%) drop-shadow(0 4px 0 rgba(0,0,0,.30))}
.intro-cta{margin-top:34px;width:280px;font-size:26px;background:#FFD60A;rotate:-1deg}
.intro-note{margin-top:14px;font-size:13px;font-weight:700;color:#BEB9AC}
"""
    BOARDS.append(dict(file="Main.dc.html", var="intro", num="1", he="Intro", en="Intro",
        note="",
        fh=880, body=body, css=css))

# ==================================================== 2A · peel your sticker
def board_peel():
    cells = []
    for i, a in enumerate(AVATARS):
        peel = ' avp-peel' if i == PLAYER_AV else ''
        cells.append(
            '<div class="avp%s"><span class="avp-well" aria-hidden="true"></span>%s'
            '<span class="avp-name">%s</span>%s</div>'
            % (peel, avatar_sticker(i, "avs-cut avp-st"), esc(a["name"]),
               '<span class="avp-lift" aria-hidden="true"></span>' if i == PLAYER_AV else ""))
    body = """
  <div class="fz peel-wrap">
    <h2 class="peel-title">%T%</h2>
    <p class="peel-sub">%SUB%</p>
    <div class="sheet">%CELLS%</div>
    <button type="button" class="sbtn peel-cta">%CTA%</button>
    <button type="button" class="sbtn2 tweak-cta">
      <svg class="tweak-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9z"></path><path d="M14 6.5l3.5 3.5"></path></svg>
      %TWEAK%
    </button>
    <p class="guest-line">%GT% · %GS%</p>
  </div>"""
    body = (body.replace("%T%", esc(S["av_title"])).replace("%SUB%", esc(S["av_sub"]))
                .replace("%CELLS%", "".join(cells)).replace("%CTA%", esc(S["av_cta"]))
                .replace("%TWEAK%", esc(TWEAK_CTA))
                .replace("%GT%", esc(S["guest_title"])).replace("%GS%", esc(S["guest_sub"])))
    css = """
.peel-wrap{display:flex;flex-direction:column;align-items:center;padding-top:24px}
.peel-title{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:30px}
.peel-sub{margin-top:6px;font-size:16px;font-weight:700;color:#BEB9AC}
/* the uncut sheet: glossy backing paper, kiss-cut wells, the presets waiting */
.sheet{margin-top:20px;width:340px;padding:20px 16px;display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr));gap:18px 12px;justify-items:center;
  background:
    linear-gradient(102deg,rgba(255,255,255,.5) 0 16%,rgba(255,255,255,0) 40%,
                    rgba(255,255,255,0) 62%,rgba(255,255,255,.3) 88%),#E9ECEA;
  border:5px solid #fff;box-shadow:0 6px 0 rgba(0,0,0,.4)}
.avp{position:relative;width:92px;display:flex;flex-direction:column;align-items:center;gap:6px}
.avp-well{position:absolute;top:-5px;left:50%;translate:-50% 0;width:88px;height:88px;
  border:1.5px dashed #9AA4A0;border-radius:14px}
.avp-st{position:relative;z-index:2;width:78px;height:78px}
.avp-name{position:relative;z-index:2;font-size:13px;font-weight:700}
/* one sticker mid-peel: lifted, tilted, its corner curling off the backing */
.avp-peel .avp-st{rotate:-9deg;translate:6px -9px;
  filter:url(#dcw-%VAR%) drop-shadow(-6px 10px 9px rgba(0,0,0,.38))}
.avp-lift{position:absolute;z-index:1;top:0;left:8px;width:30px;height:30px;
  background:linear-gradient(135deg,#fff 0 48%,#D6D9D7 52%,#C2C6C4 100%);
  border-radius:0 0 24px 0;rotate:-9deg;box-shadow:-2px 3px 5px rgba(0,0,0,.22)}
.peel-cta{margin-top:22px;width:280px}
/* the door to the builder. Deliberately the SECOND action, not the first:
   the preset sheet is the cheap route that ships, and most players should be
   able to finish here without ever opening the builder. */
/* R-B in use: the same 280px box as the primary above it, stacked as a set.
   It is the second route, not a smaller button. */
.tweak-cta{margin-top:12px;width:280px}
.guest-line{margin-top:6px;max-width:300px;text-align:center;font-size:12.5px;
  font-weight:700;line-height:1.45;color:#B2AD9F}

"""
    BOARDS.append(dict(file="PeelSheet.dc.html", var="peel", num="2a", he="Peel Your Sticker", en="Peel Your Sticker",
        note="",
        fh=780, body=body, css=css))

# ================================ 2b · character detail, opened from the HUD
def board_profile():
    """Tapping the character in the HUD opens this. That gesture is not new —
    index.html wires both the app-bar button and the map's user chip to
    goAvatar() already — but it has never had a screen designed for it: the
    shipped build drops you straight into the whole selector. This is the
    detail view that belongs in between: who you are, your name, and the two
    doors out (swap the preset, or open the builder)."""
    body = """
  <div class="fz prof">
    <div class="prof-head">
      <button type="button" class="map-btn prof-close" aria-label="%CLOSE%">%CLOSEICO%</button>
    </div>
    <div class="prof-hero">%AV%</div>
    <div class="prof-name">
      <label class="prof-lbl">%NLBL%</label>
      <div class="prof-field"><span class="prof-ph">%NPH%</span></div>
    </div>
    <div class="prof-gender">
      <span class="gchip">%GF%</span><span class="gchip on">%GM%</span>
    </div>
    <div class="prof-actions">
      <button type="button" class="sbtn prof-swap">%SWAP%</button>
      <button type="button" class="sbtn2 prof-tweak">
        <svg class="tweak-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9z"></path><path d="M14 6.5l3.5 3.5"></path></svg>
        %TWEAK%
      </button>
    </div>
  </div>"""
    body = (body.replace("%CLOSE%", esc(S["guest_title"]))
            .replace("%CLOSEICO%", ICONS["close"])
            .replace("%AV%", avatar_sticker(PLAYER_AV, "avs-cut prof-st"))
            .replace("%NLBL%", esc(S["name_label"])).replace("%NPH%", esc(S["name_ph"]))
            .replace("%GF%", esc(S["g_f"])).replace("%GM%", esc(S["g_m"]))
            .replace("%SWAP%", esc(S["av_title"])).replace("%TWEAK%", esc(TWEAK_CTA)))
    css = """
.prof{flex:1;display:flex;flex-direction:column;align-items:center;padding-top:6px}
.prof-head{width:100%;display:flex;justify-content:flex-start}
.prof-hero{margin-top:14px}
.prof-st{width:156px;height:156px;rotate:-3deg}
.prof-name{margin-top:22px;width:330px;display:flex;flex-direction:column;gap:7px}
.prof-lbl{font-size:13px;font-weight:700;color:#BEB9AC}
.prof-field{background:#FBF7EE;border-radius:14px;padding:14px 16px;
  box-shadow:0 6px 14px rgba(0,0,0,.34)}
.prof-ph{font-size:17px;font-weight:700;color:#6B6759}
.prof-gender{margin-top:14px;display:flex;gap:9px}
.prof-actions{margin-top:auto;margin-bottom:8px;width:300px;display:flex;flex-direction:column;
  align-items:stretch;gap:4px}
.prof-swap{font-size:19px}
.prof-tweak{font-size:19px}
.prof-actions{gap:10px}
"""
    BOARDS.append(dict(file="Profile.dc.html", var="prof", num="2b",
        he="Character detail", en="Character · detail", note="",
        fh=620, body=body, css=css))

# ============================== 2B–2F · character builder (concept, 5 frames)
# Pattern: Bitmoji / Duolingo. A big live preview is the hero, one category per
# step, tap-only, instant feedback. No sliders, no stat sheets — the thing being
# assembled is a sticker, and the preview IS that sticker.
#
# EVERY CATEGORY AND EVERY LABEL HERE IS SHIPPED. app.js already carries the
# five arrays the running prototype builds its selector from, including the
# headwear options (כיפה, חיג'אב) that live inside שיער and the eyewear that
# lives inside עיניים. An earlier pass invented placeholder categories for
# those because it had not read the arrays. There are no placeholders here now.
_ARR = _app[_app.index("const SKINS"):_app.index("function buildAvatarSvg")]

def _opts(name):
    b = _ARR[_ARR.index("const %s" % name):]
    b = b[b.index("["):b.index("];") + 1]
    out = [(i, c, l1 or l2) for i, c, l1, l2 in re.findall(
        r"\{id:'([^']+)'(?:,color:'([^']+)')?,label:(?:'([^']*)'|\"([^\"]*)\")\}", b)]
    assert out, name
    return out

SKINS, HAIRS = _opts("SKINS"), _opts("HAIRS")
HAIR_COLORS, CLOTHES, EYES = _opts("HAIR_COLORS"), _opts("CLOTHES"), _opts("EYES_OPTS")

# step -> (category label, options, index selected). Five steps, one per
# shipped category, in the order the running builder presents them.
BUILDER_CATS = [
    (S["b_skin"],    SKINS,       0, "swatch"),   # lightest
    (S["b_hair"],    HAIRS,       2, "word"),     # מתולתל
    (S["b_hairc"],   HAIR_COLORS, 0, "swatch"),   # שחור
    (S["b_eyes"],    EYES,        1, "word"),     # משקפיים
    (S["b_clothes"], CLOTHES,     0, "swatch"),   # כחול
]

def _opt_cells(opts, sel, kind):
    cells = []
    for i, (oid, colour, label) in enumerate(opts):
        on = " on" if i == sel else ""
        if kind == "swatch":
            cells.append('<i class="opt opt-sw%s" style="background:%s" title="%s"></i>'
                         % (on, colour, esc(label)))
        else:
            cells.append('<button type="button" class="opt opt-w%s">%s</button>'
                         % (on, esc(label)))
    return '<div class="opt-cells %s">%s</div>' % (
        "cells-sw" if kind == "swatch" else "cells-w", "".join(cells))

def board_builder_steps():
    for n, (label, opts, sel, kind) in enumerate(BUILDER_CATS, start=1):
        segs = "".join('<i class="st-seg%s"></i>' % (" on" if k < n else "")
                       for k in range(len(BUILDER_CATS) + 1))
        body = """
  <div class="fz bld">
    <div class="bhead">
      <span class="bsteps">%SEGS%</span>
      <span class="bskip">%SKIP%</span>
    </div>
    <div class="bpreview">%AV%</div>
    <div class="bcat">%CAT%</div>
    <div class="brows">
      <div class="opt-row">%CELLS%</div>
    </div>
    <button type="button" class="sbtn bnext">%NEXT%</button>
  </div>"""
        body = (body.replace("%SEGS%", segs)
                    .replace("%SKIP%", esc(S["guest_title"]))
                    .replace("%AV%", avatar_sticker(PLAYER_AV, "avs-cut bst"))
                    .replace("%CAT%", letter_stickers(label, 30, "ls-drop"))
                    .replace("%CELLS%", _opt_cells(opts, sel, kind))
                    .replace("%NEXT%", esc(S["av_cta"])))
        BOARDS.append(dict(file="Builder%d.dc.html" % n, var="bld%d" % n,
            num="2%s" % "bcdef"[n - 1], he="Builder " + label,
            en="Builder · %d · %s" % (n, ("Skin", "Hair", "Hair colour",
                                          "Eyes", "Outfit")[n - 1]),
            note="", fh=500, body=body, css=BUILDER_CSS))
    # ---- the result -------------------------------------------------------
    body = """
  <div class="fz bld">
    <div class="bhead">
      <span class="bsteps">%SEGS%</span>
      <span class="bskip">%SKIP%</span>
    </div>
    <div class="bresult">
      <span class="bres-well" aria-hidden="true"></span>
      <span class="bres-lift" aria-hidden="true"></span>
      %AV%
    </div>
    <div class="bcat">%CAT%</div>
    <div class="bslot">
      <span class="bslot-hud">%HUDAV%<span class="bslot-arrow">←</span></span>
      <span class="bslot-well" aria-hidden="true"></span>
    </div>
    <button type="button" class="sbtn bnext bnext-go">%NEXT%</button>
  </div>"""
    body = (body.replace("%SEGS%", "".join('<i class="st-seg on"></i>'
                                           for _ in range(len(BUILDER_CATS) + 1)))
                .replace("%SKIP%", esc(S["guest_title"]))
                .replace("%AV%", avatar_sticker(PLAYER_AV, "avs-cut bres-st"))
                .replace("%CAT%", letter_stickers(S["av_title"], 26, "ls-drop"))
                .replace("%HUDAV%", avatar_sticker(PLAYER_AV, "avs-hud"))
                .replace("%NEXT%", esc(S["av_cta"])))
    BOARDS.append(dict(file="Builder6.dc.html", var="bld6", num="2h",
        he="Builder Result", en="Builder · 6 · Result", note="",
        fh=680, body=body, css=BUILDER_CSS))

    # ---- the transition, caught mid-flight --------------------------------
    # An animation cannot be read in a still, and this board is mostly read as
    # stills. So one frame freezes the moment between two steps: the category
    # that has been answered leaving by the trailing edge, the next one already
    # entering from the leading one, and the preview holding still between them
    # because it is the thing being built, not a page being turned.
    out_row = _opt_cells(BUILDER_CATS[0][1], BUILDER_CATS[0][2], BUILDER_CATS[0][3])
    in_row = _opt_cells(BUILDER_CATS[1][1], BUILDER_CATS[1][2], BUILDER_CATS[1][3])
    tr_body = """
  <div class="fz bld bld-tr">
    <div class="bhead">
      <span class="bsteps">%SEGS%</span>
      <span class="bskip">%SKIP%</span>
    </div>
    <div class="bpreview">%AV%</div>
    <div class="tr-stage">
      <div class="tr-lane tr-out">
        <div class="tr-cat">%CAT1%</div>
        <div class="opt-row">%OUT%</div>
      </div>
      <div class="tr-lane tr-in">
        <div class="tr-cat">%CAT2%</div>
        <div class="opt-row">%IN%</div>
      </div>
    </div>
    <div class="tr-arrow" aria-hidden="true">
      <svg viewBox="0 0 240 24"><path d="M6 12h228"></path><path d="M218 4l16 8-16 8"></path></svg>
    </div>
    <button type="button" class="sbtn bnext">%NEXT%</button>
  </div>"""
    tr_body = (tr_body.replace("%SEGS%", "".join('<i class="st-seg%s"></i>' % (" on" if k < 2 else "")
                                           for k in range(len(BUILDER_CATS) + 1)))
                .replace("%SKIP%", esc(S["guest_title"]))
                .replace("%AV%", avatar_sticker(PLAYER_AV, "avs-cut bst"))
                .replace("%CAT1%", letter_stickers(BUILDER_CATS[0][0], 30, "ls-drop"))
                .replace("%CAT2%", letter_stickers(BUILDER_CATS[1][0], 30, "ls-drop"))
                .replace("%OUT%", out_row).replace("%IN%", in_row)
                .replace("%NEXT%", esc(S["av_cta"])))
    BOARDS.append(dict(file="BuilderMotion.dc.html", var="bldm", num="2g",
        he="Builder Transition", en="Builder · transition", note="",
        fh=560, body=tr_body, css=BUILDER_CSS + """
/* the two lanes share one row of the layout, so they overlap the way they do
   in flight; nothing here is animated, it is a frozen frame */
.bld-tr .tr-stage{position:relative;width:358px;height:158px;margin-top:14px;overflow:hidden}
.tr-lane{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;gap:12px}
.tr-out{transform:translateX(62%);opacity:.42}
.tr-in{transform:translateX(-14%);opacity:1}
.tr-cat{height:38px}
.tr-arrow{width:250px;margin-top:6px;opacity:.55}
.tr-arrow svg{width:100%;height:22px;fill:none;stroke:#EFECE4;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round}
.bld-tr .bnext{margin-top:auto}
"""))


BUILDER_CSS = """
/* ---- THE BUILDER HAS ITS OWN WORLD --------------------------------------
   Everywhere else on the board is the game's charcoal ground. Here it goes
   near-black with a cool cast and a soft spotlight behind the preview: this
   is a booth, not a screen in the journey, and the thing under the light is
   the character being made. It also does the practical job of separating a
   CONCEPT flow from the shipped screens at a glance across the canvas. */
.frame{background:#131019}
.frame::before{background-image:
  radial-gradient(rgba(255,255,255,.055) .5px,transparent .6px),
  radial-gradient(rgba(0,0,0,.4) .5px,transparent .6px);
  background-size:4px 4px,7px 7px;background-position:0 0,2px 3px}
.frame::after{content:"";position:absolute;left:50%;top:52px;translate:-50% 0;
  width:330px;height:330px;border-radius:50%;z-index:0;pointer-events:none;
  background:radial-gradient(circle,rgba(255,214,10,.13),rgba(255,214,10,.05) 45%,transparent 70%)}
.bld{flex:1;display:flex;flex-direction:column;align-items:center;padding-top:14px}
.bhead{width:100%;display:flex;align-items:center;gap:10px}
/* the step indicator is a segmented bar in the HEADER: dots under the content
   read as a carousel, and here a sideways swipe is an answer */
.bsteps{flex:1;display:flex;gap:4px}
.st-seg{flex:1;height:7px;background:rgba(255,255,255,.22);border-radius:20px}
.st-seg.on{background:#FFD60A}
.bskip{flex:none;font-size:11.5px;font-weight:700;text-decoration:underline}
.bpreview{margin-top:18px}
.bst{width:140px;height:140px;rotate:-3deg}
.bcat{margin-top:16px}
/* ONE SCREEN, STEP BY STEP. The preview never moves — it is the constant the
   player is building. Only the category travels: the next one enters from the
   leading edge and the last one leaves by the trailing one, so the screen
   reads as a single object being worked on rather than as five pages.
   Direction follows RTL forward motion: in, from the left; out, to the right. */
@keyframes bld-in{
  from{transform:translateX(-128%);opacity:0}
  60%{opacity:1}
  to{transform:translateX(0);opacity:1}}
@keyframes bld-title-in{
  from{transform:translateX(-60%);opacity:0}
  to{transform:translateX(0);opacity:1}}
.bcat{animation:bld-title-in .38s cubic-bezier(.22,.9,.28,1) both}
.brows{margin-top:16px;width:340px;display:flex;flex-direction:column;gap:10px;
  animation:bld-in .46s cubic-bezier(.22,.9,.28,1) .06s both}
/* THE OPTION ROW HAS NO STROKE. A long list surface is not a button, and the
   3px keyline that makes a button feel pressable makes a row feel like a
   fence. It sits on the ground as a raised card instead: light fill, soft
   shadow, no outline. Buttons keep their stroke. */
.opt-row{background:#FBF7EE;border-radius:16px;padding:13px 14px;
  box-shadow:0 6px 14px rgba(0,0,0,.34),0 2px 0 rgba(0,0,0,.18)}
.opt-cells{display:flex;gap:9px;justify-content:center;flex-wrap:wrap}
/* SELECTED STATE on three channels — fill, lift and ring. Never on size. */
.opt{flex:none;border:0;cursor:pointer;background:#EDE9DE;color:#131310;
  display:grid;place-items:center;padding:0}
.opt-sw{width:46px;height:46px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(0,0,0,.18)}
.opt-w{min-height:44px;padding:0 15px;border-radius:12px;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:16px}
.opt.on{translate:0 -3px;box-shadow:0 0 0 3px #FBF7EE,0 0 0 6px #131310,0 5px 0 rgba(0,0,0,.35)}
.opt-sw.on{box-shadow:inset 0 0 0 2px rgba(0,0,0,.18),0 0 0 3px #FBF7EE,
  0 0 0 6px #131310,0 5px 0 rgba(0,0,0,.35)}
.opt:focus-visible{outline:3px solid #131310;outline-offset:5px}
.bnext{margin-top:auto;margin-bottom:6px;width:290px;background:#FFD60A;rotate:-1deg}
/* ---- the result ---- */
.bresult{position:relative;margin-top:22px;width:180px;height:180px;display:grid;place-items:center}
.bres-well{position:absolute;inset:8px;border:2px dashed rgba(255,255,255,.3);border-radius:22px}
.bres-lift{position:absolute;left:16px;top:16px;width:42px;height:42px;
  background:linear-gradient(135deg,#fff 0 48%,#D6D9D7 52%,#C2C6C4 100%);
  border-radius:0 0 32px 0;rotate:-9deg;box-shadow:-2px 3px 6px rgba(0,0,0,.3)}
.bres-st{position:relative;z-index:2;width:150px;height:150px;rotate:-8deg;translate:8px -8px}
.bslot{margin-top:20px;display:flex;align-items:center;gap:14px;background:#FBF7EE;
  border-radius:16px;padding:12px 18px;box-shadow:0 6px 14px rgba(0,0,0,.34)}
.bslot-well{width:40px;height:40px;border-radius:50%;border:2px dashed #A9A69C}
.bslot-hud{display:flex;align-items:center;gap:9px}
.bslot-arrow{font-size:19px;font-weight:900;color:#131310}
.bnext-go{margin-top:20px}
"""

# ================================================================ 3 · path map
PATH_W, NODE_D = 358, 88          # usable width, node diameter
PATH_TOP, PATH_AMP = 84, 96

def path_points(n, step=172, total_h=None):
    """Node centres along a serpentine that CLIMBS.

    Topic 0 sits at the BOTTOM and the map is read upward, which is what makes
    a long map feel like progress rather than like a list: what you finished is
    below you. The weave starts at the RIGHT edge because the screen is RTL, so
    the first node sits where the reading eye already is.

    The path and the nodes come from this one list, which is the point: a node
    cannot be off the path, because the path is defined as the line through the
    nodes."""
    import math
    cx = PATH_W / 2
    h = total_h if total_h is not None else PATH_TOP + (n - 1) * step
    # +cos so i=0 starts at the right edge; y counts UP from the bottom
    return [(cx + PATH_AMP * math.cos(i * math.pi / 3.0),
             h - PATH_TOP - i * step) for i in range(n)]

def catmull_rom(pts, tension=0.5):
    """A smooth curve through every point, as cubic Béziers. Catmull-Rom rather
    than a hand-tuned S-curve so that adding a ninth topic later re-flows the
    path instead of breaking it."""
    d = ["M%.1f %.1f" % pts[0]]
    ext = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d.append("C%.1f %.1f %.1f %.1f %.1f %.1f" % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return " ".join(d)

def sample_path(pts, per_seg=26):
    """Points along the Catmull-Rom curve, for path styles that place objects
    ON the path rather than stroking it."""
    out, ext = [], [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        for k in range(per_seg):
            t = k / per_seg
            u = 1 - t
            x = (u**3 * p1[0] + 3 * u*u*t * c1[0] + 3 * u*t*t * c2[0] + t**3 * p2[0])
            y = (u**3 * p1[1] + 3 * u*u*t * c1[1] + 3 * u*t*t * c2[1] + t**3 * p2[1])
            out.append((x, y))
    out.append(pts[-1])
    return out

# Four ways to draw the line between nodes, so the choice can be made by
# looking. Every other thing on the four option frames is identical.
PATH_STYLES = {
  "dots":   ("Dotted trail",   """
.pl-under{fill:none;stroke:rgba(0,0,0,.34);stroke-width:11;stroke-linecap:round;
  stroke-dasharray:2 17;transform:translateY(4px)}
.pl-dots{fill:none;stroke:rgba(255,255,255,.30);stroke-width:9;stroke-linecap:round;
  stroke-dasharray:2 17}"""),
  "road":   ("Raised road",    """
/* a ribbon with a lit top and a shadowed under-edge, so the path itself has
   the same thickness the nodes do */
.pl-under{fill:none;stroke:#2A2924;stroke-width:23;stroke-linecap:round;
  transform:translateY(6px)}
.pl-dots{fill:none;stroke:#615D53;stroke-width:19;stroke-linecap:round}
.path-line::after{content:""}"""),
  "stones": ("Stepping stones", """
.pl-under,.pl-dots{display:none}
.stone-w{fill:#23221C}
.stone-f{fill:#A29D8F}"""),
  "glow":   ("Light trail",    """
/* no hard edge at all: the route is a glow the nodes sit in, which keeps the
   eye on the nodes and lets the background gradient do the wayfinding */
.pl-under{fill:none;stroke:rgba(255,214,10,.16);stroke-width:36;stroke-linecap:round;
  filter:blur(9px)}
.pl-dots{fill:none;stroke:rgba(255,255,255,.16);stroke-width:8;stroke-linecap:round;
  filter:blur(2.5px)}"""),
}

# ---- THE NODE ------------------------------------------------------------
# Duolingo's node is three separate objects, and the version this replaces had
# collapsed them into one: a FACE, a WALL under it, and a RING that is DETACHED
# from both. Getting them apart is most of the work.
#
#   · the ring must clear the face. Glued to it, it reads as a fat collar.
#   · the segment ends must not touch. With round caps a dasharray gap of G
#     renders as G minus the stroke width, because each cap eats half a stroke
#     at each end — so a 11px gap on a 9px stroke came out as 2px, which is
#     what made the ring look like a broken circle instead of a progress dial.
#     Every gap below is specified as the VISIBLE gap and the cap is added back.
#   · the wall is the crescent left visible between the face and a second
#     ellipse below it, and it has to be thick enough to read as a side.
# ---- THE NODE: a thick game token seen slightly from above ----------------
# v7.9 replaces the ellipse-and-crescent construction. That version was a
# raised button floating over the map: a blurred wall behind the face, offset
# far enough to paint over the ring. This one is a SOLID object with physical
# thickness, built the way Duolingo actually builds it:
#   · TWO LAYERS ONLY — a flat face, and a base that is the same circle offset
#     straight down by the thickness. Zero blur, zero spread:
#     box-shadow: 0 depth 0 0 shade. The base is a darker shade of the face's
#     OWN colour (~22%), never black and never neutral grey.
#   · face and base are flush by construction (a box-shadow cannot open a seam)
#   · the PRESS is what sells the thickness: on :active the face translates
#     down by the full depth and the shadow offset goes to 0, 80ms linear.
#   · the ring is a separate element BEHIND the node, a clear gap between it
#     and the face, stroke thinner than the depth so it reads as track.
NODE_STYLES = {
  "A": dict(label="Faithful", box=(116,), face=76, depth=7,
            ring_gap=6, ring_w=6, seg_gap=18, badge=False),
  "B": dict(label="Deep plinth", box=(116,), face=76, depth=12,
            ring_gap=6, ring_w=6, seg_gap=18, badge=False),
  "C": dict(label="Thin track", box=(116,), face=76, depth=7,
            ring_gap=7, ring_w=5, seg_gap=20, badge=False, track=True),
  "D": dict(label="Ringless", box=(104,), face=84, depth=8,
            ring_gap=0, ring_w=0, seg_gap=0, badge=True),
}

def darken(hex_colour, f=0.22):
    """The base is the face's own hue, ~22% darker — never neutral. Computed,
    so a face recolour can never leave a stale hand-picked base behind."""
    h = hex_colour.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return "#%02X%02X%02X" % tuple(max(0, round(v * (1 - f))) for v in (r, g, b))

# the per-state palette — face solid, base derived from it
NODE_FACE = {"locked": "#C9C5B9", "live": "#FFD3DF", "done": "#FFD3DF"}

def node_geometry(st):
    W = st["box"][0]
    fw = fh = st["face"]
    cx = W / 2
    cy = st["ring_w"] + max(st["ring_gap"], 0) + fh / 2 + 2
    # the ring wraps the TOKEN — face plus its depth — not the face alone:
    # centred half the depth lower and grown by half the depth, so the base
    # cannot break through the lower arc
    ring_cy = cy + st["depth"] / 2
    R = fh / 2 + st["depth"] / 2 + st["ring_gap"] + st["ring_w"] / 2 if st["ring_w"] else 0
    # the box ends where the token ends: face bottom plus its depth, or the
    # ring's own bottom — whichever reaches further; pips get their room
    H = cy + fh / 2 + st["depth"] + (26 if st["badge"] else 6)
    if R:
        H = max(H, ring_cy + R + st["ring_w"] / 2 + 6)
    return W, H, fw, fh, cx, cy, ring_cy if st["ring_w"] else cy, R

def ring_node(topic, played, total, bonus, current, style="A"):
    st = NODE_STYLES[style]
    W, H, fw, fh, cx, cy, rcy, R = node_geometry(st)
    parts = []
    if st["ring_w"]:
        C = 2 * 3.14159265 * R
        gap = st["seg_gap"] + st["ring_w"]      # visible gap + the round caps
        seg = max(6.0, C / total - gap)
        arcs = "".join(
            '<circle class="seg %s" cx="%.1f" cy="%.1f" r="%.1f" fill="none" '
            'stroke-dasharray="%.2f %.2f" stroke-dashoffset="%.2f" '
            'stroke-linecap="round"></circle>'
            % ("seg-on" if k < played else "seg-off", cx, rcy, R,
               seg, C - seg, -(k * (seg + gap)))
            for k in range(total))
        track = ('<circle class="seg-track" cx="%.1f" cy="%.1f" r="%.1f" fill="none"></circle>'
                 % (cx, rcy, R)) if st.get("track") else ""
        parts.append('<svg class="ring" viewBox="0 0 %d %.0f" aria-hidden="true">%s'
                     '<g transform="rotate(-90 %.1f %.1f)">%s</g></svg>'
                     % (W, H, track, cx, rcy, arcs))
    cls = ("ringnode" + (" is-current" if current else "")
           + (" is-done" if played == total else "")
           + (" is-live" if (played and played < total) or current else "")
           + (" is-locked" if played == 0 and not current else ""))
    # the badge lives INSIDE the face, anchored to its edge, so it presses with
    # it and can never reach the ring
    check = '<span class="node-check" aria-hidden="true">✓</span>' if played == total else ""
    sat = '<span class="node-sat" aria-hidden="true"><i>+</i></span>' if bonus else ""
    pips = ""
    if st["badge"] and not check:
        pips = ('<span class="node-pips" aria-hidden="true">%s</span>'
                % "".join('<i class="%s"></i>' % ("on" if k < played else "")
                          for k in range(total)))
    return ('<span class="%s">%s'
            '<button type="button" class="node-face">%s%s%s</button>%s</span>'
            % (cls, "".join(parts), topic_icon(topic, 52), check, sat, pips))

def node_css(style="A"):
    st = NODE_STYLES[style]
    W, H, fw, fh, cx, cy, rcy, R = node_geometry(st)
    d = st["depth"]
    return """
.node{width:%(W)dpx}
.ringnode{position:relative;width:%(W)dpx;height:%(H).0fpx;display:block}
/* the ring: BEHIND the node, %(GAP)dpx clear of the face, stroke thinner than
   the depth so it reads as track rather than as an object */
.ring{position:absolute;left:0;top:0;width:%(W)dpx;height:%(H).0fpx;overflow:visible;z-index:1}
.seg{stroke-width:%(RW).1fpx}
.seg-track{stroke:#54524B;stroke-width:%(RW).1fpx}
.seg-on{stroke:#FF3B6B}
.seg-off{stroke:#8E8C82}
/* THE TOKEN. Face + base are one element: the base is the same circle offset
   straight down by the depth — zero blur, zero spread — in a darker shade of
   the face's own colour. No gradient, no inner shadow, no highlight. */
.node-face{position:absolute;left:%(FX).1fpx;top:%(FY).1fpx;width:%(FW)dpx;height:%(FH)dpx;
  border-radius:50%%;z-index:2;display:grid;place-items:center;font-size:%(EM)dpx;line-height:1;
  border:0;padding:0;cursor:pointer;
  background:%(LOCKF)s;box-shadow:0 %(D)dpx 0 0 %(LOCKB)s;
  transition:transform 80ms linear,box-shadow 80ms linear}
/* the mark inside the face: a glyph for the seven topics that still have one,
   an image for the one that now has art. Both are centred by the same grid, so
   the node needs no per-topic layout. */
.node-ico{display:block;filter:drop-shadow(0 2px 0 rgba(0,0,0,.28))}
.is-locked .node-ico{filter:grayscale(1) opacity(.62)}
/* the press sells the thickness: the face drops by the full depth and the
   base collapses to nothing — the token is pushed flush into the board */
.node-face:active{transform:translateY(%(D)dpx);box-shadow:0 0 0 0 %(LOCKB)s}
.is-live .node-face,.is-done .node-face{background:%(LIVEF)s;
  box-shadow:0 %(D)dpx 0 0 %(LIVEB)s}
.is-live .node-face:active,.is-done .node-face:active{
  transform:translateY(%(D)dpx);box-shadow:0 0 0 0 %(LIVEB)s}
.is-locked .node-face{filter:grayscale(1)}
/* a pressed specimen for the stills — same numbers as :active */
.is-pressed .node-face{transform:translateY(%(D)dpx);box-shadow:0 0 0 0 %(LOCKB)s}
.is-pressed.is-live .node-face,.is-pressed.is-done .node-face{
  transform:translateY(%(D)dpx);box-shadow:0 0 0 0 %(LIVEB)s}
/* the badge: anchored to the face's edge inside the ring gap, never over the
   ring; the same extrusion at 2px, in a darker shade of its own colour; a
   child of the face, so it presses with it */
.node-check{position:absolute;right:3px;bottom:3px;width:22px;height:22px;
  border-radius:50%%;background:#2B2926;color:#fff;display:grid;place-items:center;
  font-size:12px;font-weight:900;border:2px solid #FBF7EE;
  box-shadow:0 2px 0 0 %(CHKB)s}
.node-sat{position:absolute;right:3px;top:3px;width:20px;height:20px;
  border-radius:50%%;background:#FFD60A;border:2px solid #FBF7EE;display:grid;place-items:center;
  box-shadow:0 2px 0 0 %(SATB)s}
.node-sat i{font-style:normal;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:12px;line-height:1;color:#131310}
.node-pips{position:absolute;z-index:3;left:0;right:0;top:%(PY).1fpx;display:flex;gap:7px;
  justify-content:center}
.node-pips i{width:11px;height:11px;border-radius:50%%;background:#56544D}
.node-pips i.on{background:#FF3B6B;box-shadow:0 1.5px 0 0 %(LIVEB)s}
.start-tip{position:absolute;z-index:6;bottom:100%%;left:50%%;translate:-50%% 0;margin-bottom:7px;
  background:#FBF7EE;color:#C4133F;border-radius:12px;padding:7px 15px 8px;white-space:nowrap;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:15px;
  box-shadow:0 4px 0 rgba(0,0,0,.35)}
.start-tip i{position:absolute;top:100%%;left:50%%;translate:-50%% 0;width:0;height:0;
  border:8px solid transparent;border-top-color:#FBF7EE;border-bottom:0}
""" % dict(W=W, H=H, FW=fw, FH=fh, RW=st["ring_w"] or 1, D=d, GAP=st["ring_gap"],
           FX=cx - fw / 2, FY=cy - fh / 2, EM=int(fh * 0.46),
           LOCKF=NODE_FACE["locked"], LOCKB=darken(NODE_FACE["locked"]),
           LIVEF=NODE_FACE["live"], LIVEB=darken(NODE_FACE["live"]),
           CHKB=darken("#2B2926", 0.5), SATB=darken("#FFD60A"),
           PY=cy + fh / 2 + d + 10)

def board_map(style="road", n=None, fname="PathMap.dc.html", num="3",
              en="Path Map", var="map", node="A"):
    done_ids = {"religion", "economy", "branches"}
    current_id = "gender"
    played_map = {t["id"]: (2 if t["id"] in done_ids else (1 if t["id"] == current_id else 0))
                  for t in TOPICS}
    counts = {t["id"]: len([i for i in DATA["issues"] if i["topic"] == t["id"]])
              for t in TOPICS}
    topics = TOPICS[:n] if n else TOPICS
    _nw, _nh, _fw, _fh, _ncx, _ncy, _nrcy, _nr = node_geometry(NODE_STYLES[node])
    # pitch = the node, its two label lines, and room for the START tooltip
    step = int(_nh + 40 + 44)
    path_h = PATH_TOP * 2 + (len(topics) - 1) * step
    pts = path_points(len(topics), step=step, total_h=path_h)
    nodes = []
    for i, t in enumerate(topics):
        cx, cy = pts[i]
        core, bonus = min(counts[t["id"]], 2), counts[t["id"]] > 2
        cur = t["id"] == current_id
        status = S["st_done"] if played_map[t["id"]] == core else (
            S["st_half"] if played_map[t["id"]] else S["st_none"])
        tip = ('<span class="start-tip">%s<i></i></span>' % esc(S["intro_cta"])) if cur else ""
        me = ('<span class="path-me">%s</span>' % avatar_sticker(PLAYER_AV, "avs-cut path-avs")
              if cur else "")
        nodes.append(
            '<div class="node" style="left:%.1fpx;top:%.1fpx">%s%s'
            '<span class="node-name">%s</span><span class="node-status">%s</span>%s</div>'
            % (cx - _nw / 2, cy - _ncy, tip,
               ring_node(t, played_map[t["id"]], core, bonus, cur, node),
               letter_stickers(t["label"], 14, "node-ls"), esc(status), me))
    gate_y = int(pts[-1][1] - 122)
    # the stroke gets one extra point, the gate; the nodes do not
    road_pts = list(pts) + [(PATH_W / 2, gate_y)]
    height = path_h
    stones = ""
    if style == "stones":
        # discs ON the path rather than a stroke along it, each extruded the
        # same way the nodes are so the whole map shares one light source
        stones = "".join(
            '<ellipse class="stone-w" cx="%.1f" cy="%.1f" rx="9.5" ry="6.5"></ellipse>'
            '<ellipse class="stone-f" cx="%.1f" cy="%.1f" rx="9.5" ry="6.5"></ellipse>'
            % (x, y + 4, x, y)
            for j, (x, y) in enumerate(sample_path(road_pts)) if j % 8 == 4)
    body = """
  %HUD%
  <p class="map-meter">%COUNT%</p>
  <div class="fz mapwin%EXCERPT%">
   <div class="path" style="height:%HH%px;transform:translateY(%SCROLL%px)">
    <div class="path-glow" aria-hidden="true"></div>
    <svg class="path-line" viewBox="0 0 %PW% %HH%" aria-hidden="true">
      <path class="pl-under" d="%D%"></path>
      <path class="pl-dots" d="%D%"></path>
      %STONES%
    </svg>
    %NODES%
    <div class="gate" style="top:%GY%px"><span class="gate-8">%G8%</span></div>
   </div>
  </div>
  <div class="fz map-corner">%CORNER%<span class="corner-tag">b</span></div>"""
    # the current node, parked two-thirds down the window
    _cur_i = next((i for i, t in enumerate(topics) if t["id"] == current_id), 0)
    win_h = 760 if n is None else int(path_h)
    scroll = 0 if n is not None else round(win_h * 0.66 - pts[_cur_i][1])
    body = (body.replace("%EXCERPT%", "" if n is None else " is-excerpt")
                .replace("%SCROLL%", str(int(scroll)))
                .replace("%HUD%", hud(coins="240"))
                .replace("%COUNT%", numeral("3/8", "meter-num", 15))
                .replace("%NODES%", "".join(nodes))
                .replace("%D%", catmull_rom(road_pts)).replace("%STONES%", stones)
                .replace("%PW%", str(PATH_W)).replace("%HH%", str(int(path_h)))
                .replace("%GY%", str(gate_y))
                .replace("%G8%", numeral("8/8", "gate-num", 30))
                .replace("%CORNER%", avatar_sticker(PLAYER_AV, "avs-cut corner-avs")))
    css = """
/* PART 5: the progress count is TYPE, and nothing else. It was a 34px numeral
   on its own plated chip, sitting directly under the coin chip and matching it
   for weight — two objects of equal loudness saying different things. It is now
   bare 15px type in the muted ink, tucked under the coin chip and right-
   aligned to it. Adjacency is fine once only one of the two is an object: the
   coin chip is a plated thing, this is a caption. No fill, no plate, no border,
   no keyline, no rotation. */
.map-meter{position:absolute;z-index:40;top:60px;right:19px;
  font-size:15px;font-weight:700;color:#BEB9AC;background:none;border:0;padding:0}
.meter-num{font-size:15px;color:#BEB9AC}
/* the window onto the map. The path is taller than it; the transform is the
   scroll position the app would restore on load. */
.mapwin{position:relative;flex:1;margin:0 -16px;overflow:hidden}
/* an excerpt parks at scroll 0, so its top node would sit under the floating
   HUD — the window starts below the HUD instead */
.mapwin.is-excerpt{margin-top:76px}
.path{position:absolute;left:16px;right:16px}
/* the ground under the path is not the flat frame colour: a soft vertical
   gradient runs the length of the journey, warm at the start and cool by the
   8/8 gate, so scrolling the map feels like travelling somewhere rather than
   like paging a list */
.path-glow{position:absolute;left:-24px;right:-24px;top:-40px;bottom:-40px;z-index:0;
  pointer-events:none;
  background:
    radial-gradient(120% 42% at 50% 0%,rgba(255,214,10,.16),transparent 70%),
    radial-gradient(120% 34% at 50% 100%,rgba(61,91,255,.20),transparent 72%),
    linear-gradient(180deg,#4A463E 0%,#43423E 38%,#3C3D40 68%,#353844 100%)}
.path-line{position:absolute;inset:0;width:100%;height:100%;z-index:1;overflow:visible}
.node{position:absolute;z-index:2;display:flex;flex-direction:column;align-items:center}
.node-name{margin-top:2px;font-size:14px;line-height:1.2;text-align:center;color:#EFECE4}
.node-status{font-size:11px;font-weight:700;color:#BEB9AC}
.path-me{position:absolute;z-index:6;left:-46px;top:26px}
.path-avs{width:52px;height:52px;rotate:-7deg}
.gate{position:absolute;z-index:5;left:50%;translate:-50% 0;display:flex;
  align-items:center;justify-content:center;background:#131310;border:4px solid #FBF7EE;
  padding:10px 22px 12px;rotate:-2deg;box-shadow:0 5px 0 rgba(0,0,0,.5)}
.gate-num{font-size:30px;color:#FFD60A}
.map-corner{position:absolute;bottom:12px;left:12px;z-index:7;display:flex;align-items:flex-end;
  gap:4px;background:rgba(64,62,58,.92);border-radius:30px;padding:5px 8px 5px 5px}
.corner-avs{width:48px;height:48px;rotate:4deg}
.corner-tag{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:13px;
  background:#FBF7EE;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;
  color:#131310}
"""
    BOARDS.append(dict(file=fname, var=var, num=num, he=en, en=en, note="",
        fh=(760 if n is None else int(path_h) + 40), body=body,
        css=css + PATH_STYLES[style][1] + node_css(node)))

def board_node_options():
    """The node in its four states, four ways. Everything except the node is
    identical across the four frames: same ground, same gradient, same shipped
    status lines, same states in the same order."""
    states = [(0, 2, False, S["st_none"], ""), (1, 2, False, S["st_half"], ""),
              (2, 2, False, S["st_done"], ""), (1, 2, True, S["st_half"], ""),
              (1, 2, False, S["st_half"], " is-pressed")]
    for i, key in enumerate("ABCD"):
        cells = []
        for j, (played, total, cur, status, extra) in enumerate(states):
            tip = ('<span class="start-tip">%s<i></i></span>' % esc(S["intro_cta"])) if cur else ""
            n_html = ring_node(TOPICS[j % len(TOPICS)], played, total, False, cur, key)
            if extra:
                n_html = n_html.replace('class="ringnode', 'class="ringnode' + extra, 1)
            cells.append('<div class="ns-cell">%s%s<span class="node-status">%s</span></div>'
                         % (tip, n_html, esc(status)))
        body = ('  <div class="fz ns"><div class="ns-grid">%s</div></div>' % "".join(cells))
        BOARDS.append(dict(file="Node%s.dc.html" % key, var="nd" + key.lower(),
            num="3%s" % "efgh"[i], he="Node " + NODE_STYLES[key]["label"],
            en="Node · " + NODE_STYLES[key]["label"], note="",
            fh=560, body=body, css="""
.ns{flex:1;display:grid;place-items:center;position:relative}
.ns::before{content:"";position:absolute;inset:-12px -16px;z-index:0;
  background:
    radial-gradient(120% 42% at 50% 0%,rgba(255,214,10,.16),transparent 70%),
    radial-gradient(120% 34% at 50% 100%,rgba(61,91,255,.20),transparent 72%),
    linear-gradient(180deg,#4A463E 0%,#43423E 42%,#3A3B40 100%)}
.ns-grid{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;
  gap:56px 22px;place-items:center}
.ns-cell{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px}
.node-status{font-size:11px;font-weight:700;color:#BEB9AC}
""" + node_css(key)))

def board_path_options():
    """The same four nodes, four ways. Everything except the line between them
    is identical by construction — same nodes, same gradient, same states."""
    for i, key in enumerate(("dots", "road", "stones", "glow")):
        board_map(style=key, n=4, fname="Path%s.dc.html" % key.capitalize(),
                  num="3%s" % "abcd"[i], en="Path · " + PATH_STYLES[key][0],
                  var="pt" + key)

# ============================================== 4 · the round — beat 1, full
ROUND_BODY = """
  %HUD%
  <div class="fz deck">
    <div class="stack">
      %PILE%
      <article class="scard claim-card">
        <div class="art"><span class="art-em">%EMOJI%</span></div>
        <h2 class="claim-title">%TITLE%</h2>
        <p class="claim-text">%C1%<mark class="hl">%C2%</mark>%C3%<span class="gloss"><mark class="hl">%C4%</mark></span>.<span class="gloss-tag">מילון</span></p>
      </article>
    </div>
    <div class="answers">
      <button type="button" class="vbtn ans ans-true">%ANS_T%
        <svg class="ans-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4"></path><path d="M10 6l-6 6 6 6"></path></svg></button>
      <button type="button" class="vbtn ans ans-false">%ANS_F%
        <svg class="ans-arrow af" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4"></path><path d="M10 6l-6 6 6 6"></path></svg></button>
    </div>
  </div>"""
def board_round():
    body = (ROUND_BODY.replace("%HUD%", hud(TOPIC_R1["label"], "240"))
                .replace("%PILE%", pile())
                .replace("%EMOJI%", esc(R1["emoji"]))
                .replace("%TITLE%", esc(R1["title"]))
                .replace("%C1%", esc(CLAIM_1)).replace("%C2%", esc(CLAIM_2))
                .replace("%C3%", esc(CLAIM_3)).replace("%C4%", esc(CLAIM_4))
                .replace("%ANS_T%", esc(S["ans_t"])).replace("%ANS_F%", esc(S["ans_f"])))
    css = ROUND_CSS
    BOARDS.append(dict(file="Round.dc.html", var="round", num="4",
        he="The Round · Beat 1", en="The Round · Beat 1",
        note="",
        fh=880, body=body, css=css))

ROUND_CSS = """
.deck{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding-top:26px}
.stack{position:relative;width:340px;height:470px;flex:none}
.claim-card{position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;padding:0 18px 16px;rotate:-1.4deg}
.art{flex:none;height:206px;margin-top:-44px;overflow:visible;z-index:4}
.art-em{display:block;font-size:200px;line-height:1;rotate:-7deg;
  filter:contrast(1.12) saturate(1.18) url(#dc-%VAR%) drop-shadow(0 11px 13px rgba(0,0,0,.3))}
.claim-title{background:#000;color:#fff;border:5px solid #fff;padding:6px 14px 9px;rotate:1.4deg;
  align-self:flex-start;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:56px;line-height:1;box-shadow:0 4px 0 rgba(0,0,0,.45);margin-top:auto}
.claim-text{margin-top:18px;margin-bottom:auto;font-size:20px;line-height:1.5;font-weight:700;
  max-width:27ch;text-wrap:balance;text-align:center}
.hl{background:linear-gradient(104deg,rgba(0,0,0,0) 0,#F3D26A 1.5%,#F3D26A 98%,rgba(0,0,0,0) 100%);
  color:inherit;opacity:.999;box-decoration-break:clone;-webkit-box-decoration-break:clone;
  padding:1px 3px;mix-blend-mode:multiply}
/* BEAT 1 EXTRA — the tappable-term treatment, demonstrated on the claim's own
   highlighted phrase: dotted underline + a small sticker tag. NO glossary term
   occurs in the r1 claim string (checked at build time — «דין רציפות» lives in
   bill_title, beat 3), so the treatment is shown, not a fake term. */
.gloss .hl{text-decoration:underline dotted 2.5px #131310;text-underline-offset:4px}
.gloss-tag{display:inline-block;vertical-align:2px;margin:0 4px;rotate:-6deg;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:11px;line-height:1;
  background:#37c4ff;color:#0B2430;border:2.5px solid #fff;border-radius:7px;padding:3px 7px 4px;
  box-shadow:0 2px 0 rgba(0,0,0,.35)}
.answers{position:relative;z-index:3;width:340px;display:flex;gap:10px;margin-top:8px}
/* the two beat-1 answers ARE the vote set: same construction, no colour,
   no size difference, nothing marking one as the likely answer. */
.ans{flex:1;font-size:24px}
.ans-true{flex-direction:row-reverse;rotate:-1.8deg}
.ans-false{rotate:1.8deg}
.ans-arrow{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:2.6;
  stroke-linecap:round;stroke-linejoin:round}
.af{transform:scaleX(-1)}
"""


# ============================================ beat components (round chrome)
def comp_page(inner):
    """The beat 2–5 skeleton: pole world, pinned beat-1 answer over the top
    edge, the component centred. One skeleton, five uses."""
    return '<div class="fz comp">%s%s</div>' % (pinned(), inner)

COMP_CSS = """
.comp{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding-top:34px}
.comp .stack{position:relative;width:340px;flex:none}
.ccard{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;
  padding:18px 20px 16px;rotate:-1.4deg}
"""

# ---------------------------------------------------------------- beat 2
def board_beat2():
    inner = """
    <div class="stack" style="height:472px">
      %PILE%
      <article class="scard ccard vote-card">
        <div class="vc-me">%AV%</div>
        <div class="vc-bill">
          <span class="vc-label">%BLABEL%</span>
          <span class="vc-title">%BTITLE%</span>
        </div>
        <p class="vc-q">%Q%</p>
        <div class="vc-btns">
          <button type="button" class="vbtn">%V1%</button>
          <button type="button" class="vbtn">%V2%</button>
          <button type="button" class="vbtn">%V3%</button>
        </div>
      </article>
    </div>"""
    inner = (inner.replace("%PILE%", pile())
             .replace("%AV%", avatar_sticker(PLAYER_AV, "avs-cut vc-avs"))
             .replace("%BLABEL%", esc(S["bill_label"]))
             .replace("%BTITLE%", esc(R1["bill_title"]))
             .replace("%Q%", esc(S["vote_q"]))
             .replace("%V1%", esc(S["v_for"])).replace("%V2%", esc(S["v_against"]))
             .replace("%V3%", esc(S["v_abstain"])))
    css = COMP_CSS + """
/* THE 121st MK: the player's own sticker sits ON the ballot card. The three
   surfaces are one construction — same size, same ink, no colour, no order
   bias beyond reading order. Direction is never colour-coded. */
.vote-card{min-height:472px}
.vc-me{position:absolute;top:-34px;left:18px;z-index:5}
.vc-avs{width:92px;height:92px;rotate:6deg}
.vc-bill{display:flex;flex-direction:column;gap:6px;margin-top:10px;padding:13px 15px;
  background:#fff;border-radius:14px;box-shadow:0 5px 12px rgba(0,0,0,.22)}
.vc-label{font-size:12.5px;font-weight:700;color:#3E3B33}
.vc-title{font-weight:700;font-size:17px;line-height:1.45}
.vc-q{margin-top:auto;padding-top:18px;text-align:center;font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;font-size:27px}
.vc-btns{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.vbtn{font-size:23px}
.vbtn:nth-child(1){rotate:-1deg}
.vbtn:nth-child(2){rotate:.8deg}
.vbtn:nth-child(3){rotate:-.6deg}
"""
    BOARDS.append(dict(file="Beat2OwnVote.dc.html", var="b2", num="4·2", he="Beat 2 · Your Vote", en="Beat 2 · Your Vote",
        note="",
        fh=700, body=comp_page(inner), css=css))

# ---------------------------------------------------------------- beat 3
def board_beat3():
    inner = """
    <div class="stack" style="height:330px">
      %PILE%
      <article class="scard ccard bill-card">
        <span class="vc-label">%BLABEL%</span>
        <h3 class="b3-title">%BTITLE%</h3>
        <span class="b3-date">%BDATE%</span>
      </article>
    </div>"""
    inner = (inner.replace("%PILE%", pile())
             .replace("%BLABEL%", esc(S["bill_label"]))
             .replace("%BTITLE%", esc(R1["bill_title"]))
             .replace("%BDATE%", esc(R1["bill_date"])))
    css = COMP_CSS + """
/* NEUTRAL by construction: bill_title + bill_date and nothing else. No
   outcome, no tally, no MK named — bill_summary stays off this card because
   the flow doc flags that it mixes context and outcome today. */
.bill-card{min-height:330px;justify-content:center;gap:14px;text-align:center;align-items:center}
.b3-title{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:30px;
  line-height:1.2;text-wrap:balance}
.b3-date{font-size:16px;font-weight:700;color:#3E3B33;background:#fff;border:2.5px solid #131310;
  border-radius:20px;padding:5px 16px;rotate:-1.6deg;box-shadow:0 2.5px 0 rgba(0,0,0,.3)}
"""
    BOARDS.append(dict(file="Beat3Bill.dc.html", var="b3", num="4·3", he="Beat 3 · The Bill", en="Beat 3 · The Bill",
        note="",
        fh=560, body=comp_page(inner), css=css))

# ---------------------------------------------------------------- beat 4
def _beat4_inner():
    inner = """
    <div class="stack" style="height:560px">
      %PILE%
      <article class="scard ccard mk-card">
        <div class="portrait">
          <img class="portrait-ghost" src="mk-portrait.webp" alt="" aria-hidden="true">
          <img class="portrait-img" src="mk-portrait.webp" alt="">
        </div>
        <div class="ident">
          <h2 class="mk-name">%NAME%</h2>
          <p class="mk-party">%PARTY%</p>
        </div>
        <div class="tally">
          <div class="tally-cell"><span class="tally-label">%GL%</span><span class="tally-val">%GV%</span></div>
          <span class="tally-sep" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 12H4"></path><path d="M10 6l-6 6 6 6"></path></svg></span>
          <div class="tally-cell"><span class="tally-label">%VL%</span><span class="tally-val">%VV%</span></div>
        </div>
        <p class="mk-note">%NPRE%<mark class="hl">%NHL%</mark>%NPOST%</p>
        <p class="basis">%BASIS%</p>
        %VERDICT%
      </article>
    </div>"""
    inner = (inner.replace("%PILE%", pile())
        .replace("%NAME%", esc(GANTZ["name"])).replace("%PARTY%", esc(GANTZ["party"]))
        .replace("%GL%", esc(S["guess_label"])).replace("%GV%", esc(S["v_for"]))
        .replace("%VL%", esc(S["voted_label"])).replace("%VV%", esc(S["v_against"]))
        .replace("%NPRE%", esc(NOTE_PRE)).replace("%NHL%", esc(NOTE_HL))
        .replace("%NPOST%", esc(NOTE_POST)).replace("%BASIS%", esc("📌 " + S["basis_doc"]))
        # the verdict is VD-A shown provisionally, in the surprise state, until
        # the pick comes back. The court stamp used to carry this and no longer
        # does: it was the v8 verdict treatment and these four options replace
        # it. It can come back as the container for VD-D if that is the pick.
        .replace("%VERDICT%", vd_stamp(VD_PICK, VD_S1, "surp", uid="b4")))
    return inner

def board_beat4():
    inner = _beat4_inner()
    css = COMP_CSS + BEAT4_CARD_CSS + VD_STAMP_CSS
    inner = ('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>%s'
             % (vd_defs(VD_PICK), inner))
    BOARDS.append(dict(file="Beat4MkCard.dc.html", var="b4", num="4·4", he="Beat 4 · MK Card", en="Beat 4 · MK Card",
        note="",
        fh=880, body=comp_page(inner), css=css))

# ---------------------------------------------------------------- beat 5a/5b
def _sources_html(issue):
    parts = ['<span class="src-chip">%s%s</span>'
             % (esc(S["src_prefix"]), esc(issue["source"]["name"]))]
    if issue.get("knesset_url"):
        parts.append('<span class="src-chip">%s</span>' % esc(S["knesset_link"]))
    return '<div class="sources">%s</div>' % "".join(parts)

def board_beat5(issue, fname, num, en, note, mid_count=None):
    verdict_txt = S["ans_t"] if issue["tf_answer"] == "true" else S["ans_f"]
    # the pinned beat-1 answer on this chrome is אמת, so the personal verdict
    # follows the issue: correct on r1 (true), wrong on e2 (false)
    # the claim's own resolution (אמת / שקר) stays — it is the ANSWER, the same
    # word the beat-1 buttons carry, and it means exactly that here. What was a
    # correctness verdict is now the token, on the same VD-A pill as beat 4.
    vd_token = VD_RIGHT if issue["tf_answer"] == "true" else VD_S1
    vd_kind = "right" if issue["tf_answer"] == "true" else "surp"
    tally_html = ""
    if mid_count:
        # the count-up caught mid-count: 41–36 on its way to 63–57. Fixed-width
        # Bibush cells (correction 4), so the jump to the final numbers cannot
        # move anything else on the card.
        tally_html = ('<div class="t5">'
                      '<span class="t5-cell"><b>%s</b>%s</span>'
                      '<span class="t5-dash">–</span>'
                      '<span class="t5-cell"><b>%s</b>%s</span>'
                      '<span class="t5-goal">%s</span></div>'
                      % (esc(S["v_for"]), numeral(mid_count[0], "t5-num", 40),
                         esc(S["v_against"]), numeral(mid_count[1], "t5-num", 40),
                         esc("%s %s את ההצעה " % (S["knesset"], S["passed"]))
                         + '<span dir="ltr">(%d-%d)</span>'
                           % (issue["_tally"]["for"], issue["_tally"]["against"])))
        assert S["knesset"] + " " + S["passed"] in "הכנסת: העבירה"  # both from app.js
    else:
        # no shipped string exists for the no-tally state, and inventing a
        # plausible one is exactly what the brief forbids — the slot renders
        # the loud placeholder itself.
        tally_html = ('<div class="t5 t5-none">%s</div>'
                      % ph("מה כתוב כשאין ספירה", "Beat 5 no-tally: the line that replaces the vote count"))
    inner = """
    <div class="stack" style="height:%HH%px">
      %PILE%
      <article class="scard ccard r5-card">
        %STAMP%
        <div class="r5-verdict"><span class="r5-word">%VERDICT%</span></div>
        %TALLY%
        <p class="r5-explain">%EXPLAIN%</p>
        %SOURCES%
      </article>
    </div>"""
    var = "b5a" if mid_count else "b5b"
    inner = (inner.replace("%HH%", "540" if mid_count else "470")
             .replace("%PILE%", pile())
             .replace("%STAMP%", vd_stamp(VD_PICK, vd_token, vd_kind,
                                          "vs-top", uid="b5" + var))
             .replace("%VERDICT%", esc(verdict_txt))
             .replace("%TALLY%", tally_html)
             .replace("%EXPLAIN%", esc(issue["tf_explain"]))
             .replace("%SOURCES%", _sources_html(issue)))
    css = COMP_CSS + """
/* BEAT 5 — the claim finally resolves. Sources live here and only here. */
.r5-card{justify-content:flex-start;gap:0}
/* The stamp used to sit behind the black verdict box, which swallowed it
   whole. The verdict word moves to the leading edge and the stamp takes the
   space that opens beside it, overlapping only the card, never the box. */
.r5-verdict{position:relative;height:112px;display:flex;align-items:center;
  justify-content:flex-start;padding-top:6px}
/* beat 5 keeps its sources at the foot of the card, so the stamp goes on the
   TOP-left corner instead of the bottom-left. Same component, same size, same
   ink; only the corner changes — and the card has no portrait on it at all. */
.vs-top{top:-46px;bottom:auto}
.r5-word{position:relative;z-index:2;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:52px;
  background:#000;color:#fff;border:5px solid #fff;padding:2px 18px 7px;rotate:-1.6deg;
  box-shadow:0 4px 0 rgba(0,0,0,.45)}
.t5{display:flex;align-items:baseline;justify-content:center;gap:10px;flex-wrap:wrap;
  margin-top:16px;padding:12px 10px;background:#fff;border:3px solid #131310;border-radius:12px;
  box-shadow:0 3px 0 rgba(0,0,0,.3)}
.t5-cell{display:flex;align-items:baseline;gap:8px;font-weight:700;font-size:15px}
.t5-num{font-size:40px}
.t5-dash{font-weight:900;font-size:26px}
.t5-goal{flex-basis:100%;text-align:center;font-size:13px;font-weight:700;color:#3E3B33}
.t5-none{background:none;border:1.5px dashed #6E6C63;box-shadow:none}
.t5-quiet{font-size:13.5px;font-weight:700;color:#3E3B33;padding:2px 6px}
.r5-explain{margin-top:14px;font-size:16px;font-weight:700;line-height:1.5;text-wrap:pretty}
.sources{margin-top:auto;padding-top:14px;display:flex;flex-wrap:wrap;gap:8px}
.src-chip{font-size:12.5px;font-weight:700;background:#fff;border:2.5px solid #131310;
  border-radius:20px;padding:5px 13px;box-shadow:0 2.5px 0 rgba(0,0,0,.3);rotate:-.8deg}
.src-chip:nth-child(2){rotate:1deg}
"""
    css += VD_STAMP_CSS
    inner = ('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>%s'
             % (vd_defs(VD_PICK), inner))
    BOARDS.append(dict(file=fname, var=var, num=num, he=en, en=en, note=note,
        fh=780 if mid_count else 700, body=comp_page(inner), css=css))

def board_beat5a():
    board_beat5(R1, "Beat5Tally.dc.html", "4·5a", "Beat 5 · With Tally",
        """BEAT 5, WITH TALLY — the claim finally resolves.

The count-up is caught mid-count at 41-36 on its way to 63-57. Digits are SimplerPro with tabular figures: measured in the browser, every digit advances exactly 20.000px at a 40px size, so the number's width depends only on how many digits it has and the count cannot jitter.

tf_explain in full. Sources live here and only here.

The verdict stamp sits clear of the black verdict box. In v7 it was hidden behind it, and a verdict nobody can read is not a verdict.

The beat-1 answer stays pinned. Body text is a stand-in font.""",
        mid_count=("41", "36"))

def board_beat5b():
    board_beat5(E2, "Beat5NoTally.dc.html", "4·5b", "Beat 5 · No Tally",
        """BEAT 5, WITHOUT TALLY — the same reveal for an issue that has no vote count. This state is half the game: 8 of 16 issues in data.js carry no _tally, and this one is e2, the war budget.

The claim resolves false, so the pinned "true" answer earns the wrong-guess stamp.

There is no tally block. In its place is a quiet outline holding a marked placeholder: no shipped string exists for this state, and inventing a plausible-looking Hebrew line is exactly what the brief rules out.

The beat-1 answer stays pinned. Body text is a stand-in font.""",
        mid_count=None)

# =============================================================== 5 · end-game
def board_endgame():
    slots = []
    filled = {"religion": 3, "economy": 2, "branches": 1}      # a mid-allocation state
    for t in TOPICS:
        n = filled.get(t["id"], 0)
        coins = "".join('<i class="medal"></i>' for _ in range(n))
        slots.append('<div class="alloc-slot"><span class="alloc-em">%s</span>'
                     '<span class="alloc-name">%s</span>'
                     '<span class="alloc-well">%s</span></div>'
                     % (esc(t["icon"]), esc(t["label"]), coins))
    confetti = "".join('<i class="cf cf-%d"></i>' % i for i in range(14))
    body = """
  <div class="fz end-wrap">
    <div class="confetti" aria-hidden="true">%CF%</div>
    <h2 class="end-title">%T%</h2>
    <p class="end-sub">%SUB%</p>
    <div class="end-budget"><span class="coin-glyph" aria-hidden="true"></span>%TOTAL%<span class="end-unit">%UNIT%</span></div>
    <p class="end-alloc">%ALLOC%</p>
    <div class="alloc-grid">%SLOTS%</div>
    <div class="alloc-tray"><i class="medal"></i><i class="medal"></i><i class="medal"></i><i class="medal"></i></div>
  </div>"""
    body = (body.replace("%CF%", confetti)
            .replace("%T%", esc(S["end_title"])).replace("%SUB%", esc(S["end_sub"]))
            .replace("%TOTAL%", numeral("240", "end-num", 34))
            .replace("%UNIT%", esc(S["coins_plus"]))
            .replace("%ALLOC%", esc(S["end_alloc"]))
            .replace("%SLOTS%", "".join(slots)))
    css = """
/* 8/8 ONLY. Coins go to TOPICS — never parties, never positions. GUARDRAIL
   (flow doc, verbatim): "allocate the earned coins across topics, never
   parties". Confetti is allowed here and only here. */
.end-wrap{position:relative;display:flex;flex-direction:column;align-items:center;padding-top:26px}
.confetti{position:absolute;inset:-12px 0 auto 0;height:120px;pointer-events:none}
.cf{position:absolute;width:9px;height:14px;border:1.5px solid rgba(0,0,0,.35)}
.cf-0{left:4%;top:8px;background:#FF3B6B;rotate:14deg}.cf-1{left:12%;top:44px;background:#3D5BFF;rotate:-22deg}
.cf-2{left:20%;top:16px;background:#FFD60A;rotate:32deg}.cf-3{left:28%;top:58px;background:#FF8A00;rotate:-9deg}
.cf-4{left:36%;top:6px;background:#2EC4B6;rotate:24deg}.cf-5{left:44%;top:38px;background:#FF3B6B;rotate:-28deg}
.cf-6{left:52%;top:12px;background:#3D5BFF;rotate:9deg}.cf-7{left:60%;top:52px;background:#FFD60A;rotate:-16deg}
.cf-8{left:68%;top:20px;background:#FF8A00;rotate:28deg}.cf-9{left:76%;top:46px;background:#2EC4B6;rotate:-24deg}
.cf-10{left:84%;top:10px;background:#FF3B6B;rotate:18deg}.cf-11{left:92%;top:40px;background:#3D5BFF;rotate:-12deg}
.cf-12{left:47%;top:74px;background:#FF8A00;rotate:40deg}.cf-13{left:8%;top:78px;background:#FFD60A;rotate:-36deg}
.end-title{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:30px;
  margin-top:26px;text-align:center}
.end-sub{margin-top:8px;max-width:32ch;text-align:center;font-size:16px;font-weight:700;line-height:1.5}
.end-budget{margin-top:16px;display:flex;align-items:center;gap:9px;background:#fff;
  border:3px solid #131310;border-radius:20px;padding:8px 20px;rotate:-1.4deg;
  box-shadow:0 4px 0 rgba(0,0,0,.4)}
.end-num{font-size:34px}
.end-unit{font-size:15px;font-weight:700}
.end-alloc{margin-top:18px;font-weight:700;font-size:17px}
/* sticker grammar: printed-outline slots that fill with round medal stickers */
.alloc-grid{margin-top:12px;width:352px;display:grid;grid-template-columns:repeat(2, minmax(0,1fr));
  gap:11px}
.alloc-slot{display:flex;align-items:center;gap:8px;background:#FBF7EE;
  border-radius:14px;padding:10px 12px;box-shadow:0 5px 12px rgba(0,0,0,.3);min-height:58px}
.alloc-em{font-size:24px;flex:none}
.alloc-name{font-size:12.5px;font-weight:700;line-height:1.2;flex:1;min-width:0}
.alloc-well{display:flex;gap:4px;flex:none;min-width:30px;min-height:26px;align-items:center;
  justify-content:flex-end;border-bottom:1.5px dashed #6E6C63;padding-bottom:2px}
.medal{width:22px;height:22px;border-radius:50%;background:#FFD60A;flex:none;
  border:2.5px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,.4),0 2px 0 rgba(0,0,0,.35);rotate:-6deg}
.medal:nth-child(2n){rotate:8deg}
.alloc-tray{margin-top:18px;display:flex;gap:10px;background:#E9ECEA;border:5px solid #fff;
  padding:12px 22px;box-shadow:0 4px 0 rgba(0,0,0,.35);rotate:-1deg}
.alloc-tray .medal{width:30px;height:30px}
"""
    BOARDS.append(dict(file="EndGame.dc.html", var="end", num="5", he="End-Game · 8/8", en="End-Game · 8/8",
        note="",
        fh=760, body=body, css=css))

# =============================================================== 6 · share
def board_share():
    body = """
  <div class="fz share-wrap">
    <div class="share-card">
      <div class="sh-head">%HEADPH%</div>
      <div class="sh-collage">
        <span class="sh-av">%AV%</span>
        <span class="sh-photo"><img src="mk-portrait.webp" alt=""></span>
        <span class="sh-st sh-st1">%W1%</span>
        <span class="sh-st sh-st2">%W2%</span>
        <span class="sh-em sh-em1">%E1%</span>
        <span class="sh-em sh-em2">%E2%</span>
        <span class="sh-coins">%COINS%<i>%UNIT%</i></span>
      </div>
      <div class="sh-title">%T1%</div>
      <div class="sh-tag">%TAG%</div>
    </div>
    <button type="button" class="sbtn share-cta">%BTN%</button>
  </div>"""
    body = (body
        .replace("%HEADPH%", ph("כותרת = מספר ההפתעות, לא כמה צדקת", "Share card: the headline, which should be the surprise count, not the prediction record"))
        .replace("%AV%", avatar_sticker(PLAYER_AV, "avs-cut sh-avs"))
        .replace("%W1%", esc(S["ans_t"])).replace("%W2%", esc(S["ans_f"]))
        .replace("%E1%", esc(TOPIC_R1["icon"])).replace("%E2%", esc("💸"))
        .replace("%COINS%", numeral("240", "sh-num", 24)).replace("%UNIT%", esc(S["coins_plus"]))
        .replace("%T1%", letter_stickers("הח״כ ה-121", 30, "ls-drop"))
        .replace("%TAG%", esc("#המגדלור"))
        .replace("%BTN%", esc(S["share_btn"])))
    css = """
/* the share card: a sticker collage. The safe zone is the middle square —
   WhatsApp's link preview crops to roughly 1:1, so identity (title, avatar,
   headline) lives in the centre band and only decor bleeds. */
.share-wrap{display:flex;flex-direction:column;align-items:center;padding-top:30px}
.share-card{position:relative;width:340px;background:#FFD60A;border:7px solid #fff;
  box-shadow:0 7px 0 rgba(0,0,0,.42),0 16px 26px rgba(0,0,0,.28);rotate:-1.2deg;
  display:flex;flex-direction:column;align-items:center;padding:22px 18px 18px;overflow:hidden}
.sh-head{margin-bottom:12px}
.sh-collage{position:relative;width:100%;height:190px}
.sh-avs{position:absolute;width:104px;height:104px;top:14px;right:30px;rotate:-7deg}
.sh-photo{position:absolute;top:8px;left:34px;width:96px;rotate:5deg}
.sh-photo img{display:block;width:100%;filter:url(#dcw-%VAR%) drop-shadow(0 3px 0 rgba(0,0,0,.3))}
.sh-st{position:absolute;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:20px;background:#fff;border:3px solid #131310;border-radius:9px;padding:4px 12px 6px;
  box-shadow:0 3px 0 rgba(0,0,0,.35)}
.sh-st1{bottom:14px;right:16px;rotate:6deg}
.sh-st2{bottom:8px;left:52px;rotate:-8deg;background:#FBF7EE}
.sh-em1{position:absolute;top:12px;right:-2px;font-size:34px;rotate:12deg;
  filter:drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff)}
.sh-em2{position:absolute;bottom:44px;left:2px;font-size:30px;rotate:-14deg;
  filter:drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff)}
.sh-coins{position:absolute;top:126px;left:118px;display:flex;align-items:baseline;gap:5px;
  background:#FBF7EE;border:3px solid #fff;border-radius:20px;padding:6px 14px;rotate:-3deg;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.35),0 3px 0 rgba(0,0,0,.4)}
.sh-num{font-size:24px}
.sh-coins i{font-style:normal;font-size:12px;font-weight:700}
.sh-title{margin-top:4px}
.sh-tag{margin-top:8px;font-weight:700;font-size:14px;color:#131310}
.share-cta{margin-top:24px;width:280px;background:#FFD60A;rotate:-1deg}
"""
    BOARDS.append(dict(file="Share.dc.html", var="share", num="6", he="Share Card", en="Share Card",
        note="",
        fh=700, body=body, css=css))

BEAT4_CARD_CSS = """
/* v6 winner per Lion: variation A (album page) — CARRIED INTO THE ORIGINAL
   WORLD per the v7 correction: the ground is pole grey and the pile is the
   multicolour family (shared shell); only the CARD is the kraft album page,
   with its printed placement mark and the sticker stuck off-register. */
/* MK FRAME = MF-B: 5px white die-cut edge plus a hard dark outline. The
   outline is what carries the shape when the white edge has no contrast —
   see the v9 Backgrounds board, where that is the whole question. */
.mk-card{border-width:5px;box-shadow:0 0 0 2px rgba(0,0,0,.55),0 6px 0 rgba(0,0,0,.42),0 16px 26px rgba(0,0,0,.26);min-height:560px;background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.05) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.05) 0 1px,transparent 1px 27px),#D8C9A8;
  border-color:#fff}
.portrait{position:relative;flex:none;height:238px;display:flex;align-items:flex-end;
  justify-content:center;z-index:4;translate:40px 0}
.portrait-img{display:block;width:176px;height:238px;object-fit:contain;object-position:50% 100%;
  border-radius:0 0 30px 30px;
  filter:url(#dc-%VAR%) drop-shadow(0 3px 0 rgba(0,0,0,.26)) drop-shadow(-7px 13px 12px rgba(0,0,0,.30))}
.portrait-ghost{position:absolute;bottom:0;left:50%;margin-left:-88px;display:block;
  width:176px;height:238px;object-fit:contain;object-position:50% 100%;
  border-radius:0 0 30px 30px;filter:url(#gh-%VAR%);transform:translate(-19px,-13px)}
.portrait{rotate:-4deg}
.ident{margin-top:13px}
.mk-name{width:fit-content;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:32px;line-height:1.05}
.mk-party{width:fit-content;margin-top:3px;font-size:16px;font-weight:700;color:#4A4436}
.tally{margin-top:12px;display:flex;align-items:stretch;gap:10px}
.tally-cell{flex:1;display:flex;flex-direction:column;gap:3px;border-top:2px solid rgba(34,31,23,.18);
  padding-top:6px}
.tally-label{font-size:12px;font-weight:700;color:#4A4436}
.tally-val{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:25px}
.tally-sep{flex:none;align-self:center;width:22px;height:22px}
.tally-sep svg{display:block;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2.4;
  stroke-linecap:round;stroke-linejoin:round;opacity:.5}
.mk-note{margin-top:12px;font-size:16px;font-weight:700;line-height:1.5;text-wrap:pretty}
.hl{background:linear-gradient(104deg,rgba(0,0,0,0) 0,#F3D26A 1.5%,#F3D26A 98%,rgba(0,0,0,0) 100%);
  color:inherit;opacity:.999;box-decoration-break:clone;-webkit-box-decoration-break:clone;
  padding:1px 3px;mix-blend-mode:multiply}
/* the verdict pill hangs off this card's bottom edge, so the last line of the
   card has to end above it — otherwise the pill is not straddling an edge, it
   is covering a sentence. */
.mk-card{padding-bottom:40px}
.basis{margin-top:auto;padding-top:10px;font-size:12.5px;font-weight:700;color:#4A4436}
.stamp-main{top:132px;left:-24px}
/* the two stamp states, as labeled specimens beside the card */
.stamp-states{display:flex;align-items:center;gap:18px;margin-top:26px}
.ss-label{font-size:12px;font-weight:700;color:#BEB9AC;writing-mode:vertical-rl;rotate:180deg}
.ss-one{position:relative;width:104px;height:104px;display:grid;place-items:end center}
.ss-one .stamp{position:absolute;inset:0;width:104px;height:104px;rotate:-9deg}
.ss-one .st-word{font-size:46px}
.ss-one i{font-style:normal;font-size:11px;font-weight:700;color:#BEB9AC;translate:0 18px}
"""




# ============= 13 · MK-choice mechanics — research board (v8 Mechanics) ======
# Beat 4 asks the player to predict how 3–9 named MKs voted. The question this
# board explores is what the ASKING should feel like. Every option is measured
# against the same four constraints, which come from the data and the screen,
# not from taste:
#   · 3 to 9 MKs per round, mean 6.1 — a mechanic that is charming at 3 has to
#     survive 9;
#   · abstain is 7 of 98 votes and appears in only 4 of 16 rounds, so its
#     target is empty most of the time and must still look deliberate;
#   · 390px, RTL, thumb reach;
#   · the reveal stays a one-at-a-time cascade with variable tempo — whatever
#     the input, the payoff does not change.
MECH_CSS = """
.mx{flex:1;display:flex;flex-direction:column;gap:12px;padding-top:52px;width:344px;margin:0 auto}
.mx-h{display:flex;align-items:center;gap:8px}
.mx-id{direction:ltr;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:11px;
  letter-spacing:.08em;color:#131310;background:#FFD60A;border-radius:6px;padding:3px 9px 4px}
.mx-chip{display:flex;align-items:center;gap:8px;background:#FBF7EE;border-radius:14px;
  padding:8px 11px;box-shadow:0 5px 12px rgba(0,0,0,.32);color:#131310}
.mx-thumb{width:32px;height:32px;flex:none;border-radius:50%;overflow:hidden;background:#D8D5CB;
  display:grid;place-items:center;box-shadow:inset 0 0 0 2px #fff}
.mx-thumb svg{width:100%;height:100%;fill:#6E6B62}
.mx-nm{font-size:14px;font-weight:700;line-height:1.15}
.mx-pt{font-size:11px;font-weight:700;color:#5A564C}
/* pots — one element used three times, no colour or size difference */
.mx-pot{min-height:64px;background:#FBF7EE;border-radius:14px;padding:8px 11px;
  box-shadow:0 5px 12px rgba(0,0,0,.32);display:flex;align-items:center;gap:8px;color:#131310}
.mx-pot b{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:17px;flex:none}
.mx-slot{flex:1;min-height:40px;border:2px dashed #A9A69C;border-radius:10px}
.mx-mini{display:inline-flex;align-items:center;gap:5px;background:#fff;border-radius:20px;
  padding:3px 9px 3px 3px;box-shadow:0 2px 0 rgba(0,0,0,.28);font-size:11.5px;font-weight:700}
.mx-mini .mx-thumb{width:20px;height:20px}
.mx-note{font-size:11px;font-weight:700;color:#BEB9AC;direction:ltr;text-align:left;line-height:1.45}
"""

def _mchip(name, party, cls=""):
    return ('<div class="mx-chip %s">%s<span><span class="mx-nm">%s</span><br>'
            '<span class="mx-pt">%s</span></span></div>' % (cls, chip_thumb(), esc(name), esc(party)))

def _mmini(name):
    return '<span class="mx-mini">%s%s</span>' % (chip_thumb(), esc(name))

def _mpots(fill=None):
    fill = fill or {}
    return "".join(
        '<div class="mx-pot"><b>%s</b><span class="mx-slot">%s</span></div>'
        % (esc(v), "".join(_mmini(n) for n in fill.get(v, [])))
        for v in (S["v_for"], S["v_against"], S["v_abstain"]))

def board_mechanics():
    M = R1_MKS
    frames = [
      ("MECH-A", "Drag to pots",
       '<div class="mx-h"><span class="mx-id">MECH-A</span></div>%s'
       '<div class="mx-drag">%s<span class="mx-ghost"></span></div>'
       % (_mpots({S["v_for"]: [M[2][1]], S["v_against"]: [M[0][1], M[1][1]]}),
          _mchip(M[3][1], M[3][2], "is-lifted")),
       """
.mx-drag{position:relative;margin-top:6px}
.is-lifted{rotate:-3deg;translate:-14px -6px;box-shadow:0 14px 22px rgba(0,0,0,.5)}
.mx-ghost{position:absolute;left:16px;top:4px;right:16px;height:48px;border-radius:14px;
  border:2px dashed rgba(255,255,255,.28)}
""",
       "Drag a chip into a pot. Most physical, and the one everyone pictures.\n"
       "COST: mobile drag with RTL, plus an accessible fallback that ends up being MECH-B "
       "anyway — so it is B plus a drag layer, not instead of it.\n"
       "AT 9 MKs: the list scrolls under the pots; drag-to-scroll and drag-to-sort fight."),

      ("MECH-B", "Tap to assign",
       '<div class="mx-h"><span class="mx-id">MECH-B</span></div>'
       '<div class="mx-tapwrap">%s<div class="seg3row">%s</div></div>'
       '<div class="mx-tapwrap">%s<div class="seg3row">%s</div></div>'
       % (_mchip(M[3][1], M[3][2]),
          "".join('<button class="seg3%s">%s</button>' % (" on" if i == 1 else "", esc(v))
                  for i, v in enumerate((S["v_for"], S["v_against"], S["v_abstain"]))),
          _mchip(M[4][1], M[4][2]),
          "".join('<button class="seg3">%s</button>' % esc(v)
                  for v in (S["v_for"], S["v_against"], S["v_abstain"]))),
       """
.mx-tapwrap{background:#FBF7EE;border-radius:16px;padding:10px 11px 11px;
  box-shadow:0 6px 14px rgba(0,0,0,.34);display:flex;flex-direction:column;gap:9px}
.mx-tapwrap .mx-chip{box-shadow:none;padding:0;background:none}
.seg3row{display:flex;gap:7px}
.seg3{flex:1;min-height:44px;appearance:none;cursor:pointer;background:#EDE9DE;border:2.5px solid #131310;
  border-radius:10px;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:16px;
  color:#131310}
.seg3.on{translate:0 -3px;background:#fff;
  box-shadow:0 0 0 3px #FBF7EE,0 0 0 5.5px #131310,0 4px 0 rgba(0,0,0,.4)}
""",
       "Tap a segment. Cheapest to build and the only one that is accessible by default.\n"
       "The three surfaces are one construction — no colour, no size difference.\n"
       "AT 9 MKs: nine rows, scrolls fine. RECOMMENDED unless the drag is worth the cost."),

      ("MECH-C", "Connect with lines",
       '<div class="mx-h"><span class="mx-id">MECH-C</span></div>'
       '<div class="mx-wire"><svg class="mx-wsvg" viewBox="0 0 344 250" aria-hidden="true">'
       '<path d="M96 34 C 200 40, 210 60, 268 66"></path>'
       '<path d="M96 96 C 200 100, 210 150, 268 156"></path>'
       '<path class="mx-live" d="M96 158 C 190 164, 200 80, 262 72"></path></svg>'
       '<div class="mx-left">%s</div><div class="mx-right">%s</div></div>'
       % ("".join(_mchip(n, p2) for _, n, p2, _v, _k in M[:3]), _mpots()),
       """
.mx-wire{position:relative;height:250px;margin-top:4px}
.mx-wsvg{position:absolute;inset:0;width:100%;height:100%;fill:none;
  stroke:rgba(255,255,255,.3);stroke-width:4;stroke-linecap:round}
.mx-live{stroke:#FFD60A;stroke-width:5}
.mx-left{position:absolute;left:0;top:0;width:150px;display:flex;flex-direction:column;gap:12px}
.mx-right{position:absolute;right:0;top:0;width:150px;display:flex;flex-direction:column;gap:10px}
.mx-right .mx-pot{min-height:52px;padding:6px 9px}
.mx-right .mx-slot{min-height:30px}
.mx-wire .mx-chip{padding:6px 8px}
.mx-wire .mx-nm{font-size:12.5px}
.mx-wire .mx-pt{font-size:10px}
""",
       "Draw a line from each MK to a pot. Reads as wiring up a parliament and makes "
       "the whole set visible at once.\n"
       "COST: highest. Hit-testing a drawn path on a phone is fiddly and the accessible "
       "fallback is again MECH-B.\n"
       "AT 9 MKs: nine lines across 390px cross each other; this is the option most "
       "likely to break at the top of the range."),

      ("MECH-D", "Swipe deck",
       '<div class="mx-h"><span class="mx-id">MECH-D</span></div>'
       '<div class="mx-deck">%s<div class="mx-card">%s'
       '<div class="mx-swipe"><span>%s</span><span>%s</span></div></div>'
       '<span class="mx-abst">%s</span></div>'
       % (pile(), _mchip(M[1][1], M[1][2], "mx-big"),
          esc(S["v_against"]), esc(S["v_for"]), esc(S["v_abstain"])),
       """
.mx-deck{position:relative;height:250px;margin-top:8px}
.mx-deck .pile{inset:auto 40px 40px 40px;height:190px}
.mx-deck .pile-card{border-width:4px}
.mx-card{position:absolute;left:40px;right:40px;bottom:40px;height:190px;background:#FBF7EE;
  border:6px solid #fff;border-radius:14px;box-shadow:0 8px 0 rgba(0,0,0,.4);rotate:-2deg;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.mx-big{box-shadow:none;background:none;flex-direction:column;text-align:center}
.mx-big .mx-thumb{width:54px;height:54px}
.mx-swipe{display:flex;gap:28px;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:15px;color:#5A564C}
.mx-abst{position:absolute;left:50%;bottom:8px;translate:-50% 0;font-size:12px;font-weight:700;
  color:#BEB9AC}
""",
       "One MK at a time; swipe for or against, flick up to abstain.\n"
       "Fastest at 9 and the most game-like. But it shows one MK at a time, which removes "
       "the comparative reasoning that sorting the whole set gives you.\n"
       "ABSTAIN: a third gesture nobody discovers — the weakest fit for the 4-of-16 finding."),

      ("MECH-E", "Spectrum",
       '<div class="mx-h"><span class="mx-id">MECH-E</span></div>'
       '<div class="mx-spec"><div class="mx-axis"><span>%s</span><span>%s</span><span>%s</span></div>'
       '<div class="mx-track"></div>%s</div>'
       % (esc(S["v_for"]), esc(S["v_abstain"]), esc(S["v_against"]),
          "".join('<span class="mx-pin" style="left:%d%%"><span class="mx-thumb">%s</span></span>'
                  % (x, chip_thumb().split(">", 1)[1].rsplit("</span>", 1)[0])
                  for x in (12, 34, 52, 78))),
       """
.mx-spec{position:relative;margin-top:14px;height:150px}
.mx-axis{display:flex;justify-content:space-between;font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;font-size:14px;color:#EFECE4}
.mx-track{position:absolute;left:0;right:0;top:56px;height:10px;border-radius:20px;
  background:#FBF7EE;box-shadow:0 3px 0 rgba(0,0,0,.34)}
.mx-pin{position:absolute;top:38px;translate:-50% 0;width:44px;height:44px;border-radius:50%;
  background:#FBF7EE;display:grid;place-items:center;
  box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.45),0 4px 0 rgba(0,0,0,.34)}
.mx-pin .cthumb{width:34px;height:34px;box-shadow:none;background:none}
""",
       "Place every MK on one axis, abstain in the middle. The whole round is one screen "
       "and the shape of the answer is the answer.\n"
       "RISK: an axis implies a spectrum between the two vote directions, and the game's whole "
       "position is that these are two choices, not two ends. This is the option most "
       "likely to editorialise by construction — a tone call, not a build call."),
    ]
    for i, (oid, name, body_html, css, note) in enumerate(frames):
        BOARDS.append(dict(file="Mech%s.dc.html" % oid[-1], var="mx" + oid[-1].lower(),
            num=oid, he=name, en="%s · %s" % (oid, name), note="",
            fh=430 if oid in ("MECH-A", "MECH-B", "MECH-E") else 500,
            body='  <div class="fz mx">%s</div>' % body_html,
            css=MECH_CSS + css))
        FRAME_NOTES["Mech%s.dc.html" % oid[-1]] = (note, None)

# ================================== 10 · share cards (4 variants) ============
# All four share one construction: a die-cut sticker card at a 9:16-friendly
# crop, identity in the middle band because WhatsApp's preview crops to roughly
# a square, and a source line. Topics are referenced by their data.js icon and
# label only — never by free text, so a shared card can never editorialise.
SHARE_W, SHARE_H = 330, 500

def topic_sticker(t, cls=""):
    return ('<span class="tsticker %s"><span class="ts-em">%s</span>'
            '<span class="ts-nm">%s</span></span>' % (cls, esc(t["icon"]), esc(t["label"])))

SHARE_CSS = """
.shwrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:16px;padding-top:8px}
.shcard{position:relative;width:%dpx;height:%dpx;border:7px solid #fff;border-radius:4px;
  box-shadow:0 8px 0 rgba(0,0,0,.44),0 18px 30px rgba(0,0,0,.34);rotate:-1.2deg;
  display:flex;flex-direction:column;align-items:center;padding:20px 18px 14px;overflow:hidden}
.sh-title{margin-top:2px}
.sh-src{position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:11px;
  font-weight:700;letter-spacing:.02em}
.tsticker{display:inline-flex;align-items:center;gap:6px;background:#FBF7EE;
  border:3px solid #fff;border-radius:20px;padding:4px 12px 5px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.4),0 3px 0 rgba(0,0,0,.34);color:#131310}
.ts-em{font-size:17px;line-height:1}
.ts-nm{font-size:12.5px;font-weight:700;white-space:nowrap}
.sh-cta{width:280px;background:#FFD60A;rotate:-1deg}
""" % (SHARE_W, SHARE_H)

def _share_frame(key, num, en, inner, css):
    body = ('  <div class="fz shwrap"><div class="shcard">%s'
            '<span class="sh-src">%s</span></div>'
            '<button type="button" class="sbtn sh-cta">%s</button></div>'
            % (inner, esc(S["intro_tag"]), esc(S["share_btn"])))
    BOARDS.append(dict(file="Share%s.dc.html" % key, var="sh" + key.lower(), num=num,
        he=en, en=en, note="", fh=680, body=body, css=SHARE_CSS + css))

def board_share_variants():
    surprises = [t for t in TOPICS if t["id"] in ("religion", "economy", "branches")]
    _share_frame("A", "6a", "Share A · Surprise-led", """
      <div class="a-num">%s</div>
      <div class="a-ph">%s</div>
      <div class="a-topics">%s</div>
      <div class="a-av">%s</div>""" % (
        numeral("7", "a-n", 108),
        ph("כותרת: כמה פעמים הכנסת הפתיעה אותך", "Share A: the surprise-count headline"),
        "".join(topic_sticker(t) for t in surprises),
        avatar_sticker(PLAYER_AV, "avs-cut a-avs")),
"""
.shcard{background:#3A3730}
.sh-src{color:#BEB9AC}
.a-num{margin-top:26px}
.a-n{font-size:108px;color:#FFD60A;line-height:.9}
.a-ph{margin-top:8px;max-width:250px;text-align:center}
.a-topics{margin-top:auto;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.a-topics .tsticker:nth-child(1){rotate:-3deg}
.a-topics .tsticker:nth-child(2){rotate:2deg}
.a-topics .tsticker:nth-child(3){rotate:-1.5deg}
.a-av{margin-top:14px;margin-bottom:16px}
.a-avs{width:56px;height:56px;rotate:-4deg}
""")
    mini = []
    for i, t in enumerate(TOPICS):
        st = "done" if t["id"] in ("religion", "economy", "branches") else (
             "cur" if t["id"] == "gender" else "todo")
        mini.append('<span class="mini-n mini-%s" style="left:%d%%;bottom:%d%%">%s</span>'
                    % (st, [22, 50, 74, 52, 26, 48, 72, 50][i], 6 + i * 12,
                       ('<span class="mini-av">%s</span>'
                        % avatar_sticker(PLAYER_AV, "avs-cut mini-avs")) if st == "cur" else ""))
    _share_frame("B", "6b", "Share B · Trail card", """
      <div class="b-title">%s</div>
      <div class="b-map"><svg class="b-line" viewBox="0 0 260 300" preserveAspectRatio="none" aria-hidden="true"><path d="M57 288 C 130 268, 130 250, 192 232 S 135 196, 135 176 S 68 140, 68 122 S 125 86, 125 68 S 187 34, 187 14"></path></svg>%s</div>
      <div class="b-foot"><span class="chip b-coin"><span class="coin-glyph"></span>%s</span>
        <span class="chip b-prog">%s</span></div>""" % (
        letter_stickers("הח״כ ה-121", 26, "ls-drop"),
        "".join(mini), numeral("240", "b-n", 22), numeral("3/8", "b-n", 22)),
"""
.shcard{background:#42403A}
.sh-src{color:#BEB9AC}
.b-title{margin-top:2px}
.b-title .lsplain,.b-title .ls-t{color:#EFECE4;fill:#EFECE4}
.b-map{position:relative;flex:1;width:100%;margin-top:10px}
.b-line{position:absolute;inset:0;width:100%;height:100%;fill:none;
  stroke:rgba(255,255,255,.22);stroke-width:9;stroke-linecap:round}
.mini-n{position:absolute;width:26px;height:26px;border-radius:50%;translate:-50% 0;
  box-shadow:0 3px 0 0 rgba(0,0,0,.4)}
.mini-done{background:#FFD3DF;box-shadow:0 3px 0 0 #C7A5AE}
.mini-todo{background:#C9C5B9;box-shadow:0 3px 0 0 #9D9A90}
.mini-cur{background:#FFD3DF;box-shadow:0 3px 0 0 #C7A5AE,0 0 0 3px #FFD60A}
.mini-av{position:absolute;left:26px;bottom:-4px}
.mini-avs{width:38px;height:38px;rotate:-6deg}
.b-foot{display:flex;gap:9px;margin-bottom:16px}
.b-coin{display:inline-flex;align-items:center;gap:6px;padding:5px 13px 6px;rotate:-1.6deg}
.b-prog{padding:5px 13px 6px;rotate:1.4deg}
.b-n{font-size:22px;color:#131310}
""")
    _share_frame("C", "6c", "Share C · Fact-forward", """
      <span class="chip c-label">%s</span>
      <h3 class="c-bill">%s</h3>
      <div class="c-vs">
        <span class="c-cell"><i>%s</i><b>%s</b></span>
        <span class="c-cell"><i>%s</i><b>%s</b></span>
      </div>
      <div class="c-topic">%s</div>""" % (
        esc(S["bill_label"]), esc(R1["bill_title"]),
        esc(S["guess_label"]), esc(S["v_for"]),
        esc(S["voted_label"]), esc(S["v_against"]),
        topic_sticker(TOPIC_R1)),
"""
.shcard{background:#FBF7EE}
.sh-src{color:#4A4740}
.c-label{font-size:12px;font-weight:700;padding:4px 12px 5px;rotate:-1.4deg;margin-top:4px}
.c-bill{margin-top:16px;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:25px;line-height:1.22;text-align:center;color:#131310;text-wrap:balance}
.c-vs{margin-top:auto;display:flex;gap:12px;width:100%;justify-content:center}
.c-cell{flex:1;max-width:130px;display:flex;flex-direction:column;align-items:center;gap:3px;
  border-top:3px solid rgba(19,19,16,.22);padding-top:8px}
.c-cell i{font-style:normal;font-size:11.5px;font-weight:700;color:#4A4740}
.c-cell b{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;
  color:#131310}
.c-topic{margin-top:16px;margin-bottom:16px}
""")
    top3 = [t for t in TOPICS if t["id"] in ("religion", "economy", "branches")]
    _share_frame("D", "6d", "Share D · Values card", """
      <div class="d-av">%s</div>
      <div class="d-ph">%s</div>
      <div class="d-topics">%s</div>
      <span class="chip d-coin"><span class="coin-glyph"></span>%s</span>""" % (
        avatar_sticker(PLAYER_AV, "avs-cut d-avs"),
        ph("כותרת: לאן הקצית את המטבעות", "Share D: the allocation headline"),
        "".join('<span class="d-row">%s%s</span>'
                % (topic_sticker(t), '<span class="d-medals">%s</span>'
                   % "".join('<i></i>' for _ in range(3 - i))) for i, t in enumerate(top3)),
        numeral("240", "b-n", 22)),
"""
.shcard{background:#3A3730}
.sh-src{color:#BEB9AC}
.d-av{margin-top:14px}
.d-avs{width:104px;height:104px;rotate:-4deg}
.d-ph{margin-top:12px;max-width:250px;text-align:center}
.d-topics{margin-top:auto;display:flex;flex-direction:column;gap:9px;align-items:center}
.d-row{display:flex;align-items:center;gap:9px}
.d-medals{display:flex;gap:4px}
.d-medals i{width:14px;height:14px;border-radius:50%;background:#FFD60A;
  box-shadow:0 2px 0 0 #C7A408}
.d-coin{display:inline-flex;align-items:center;gap:6px;padding:5px 13px 6px;rotate:-1.4deg;
  margin-top:14px;margin-bottom:16px}
.b-n{font-size:22px;color:#131310}
""")

# ============================== 11 · component option sheets (v8 Components)
# One frame per component, options side by side, A/B/C/D. Every option is real
# markup on the board's own ground, not a picture of a button.
COMP_SHEET_CSS = """
.cs{flex:1;display:flex;flex-direction:column;gap:18px;padding:14px 0 10px;
  width:344px;margin:0 auto}
.cs-row{display:flex;flex-direction:column;gap:9px}
.cs-tag{align-self:flex-start;direction:ltr;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:12px;letter-spacing:.1em;color:#131310;background:#FFD60A;border-radius:20px;
  padding:3px 11px 4px}
.cs-body{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}
.cs-opt{display:flex;flex-direction:column;align-items:center;gap:5px}
/* the picked option, marked on the sheet it was picked from */
.cs-opt-on{padding:6px;border-radius:14px;background:rgba(255,214,10,.10);
  box-shadow:inset 0 0 0 2px #FFD60A}
.cs-id-on{background:#FFD60A;box-shadow:0 0 0 1.5px rgba(0,0,0,.55)}
.cs-optbody{display:flex;align-items:center;justify-content:center}
/* .cs-id / .cs-spec now live in SHARED — four boards print them */
/* ---- primary button, four extrusion depths ---- */
.pb{appearance:none;border:0;cursor:pointer;font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;font-size:16px;color:#131310;background:#FFD60A;border-radius:16px;
  padding:12px 14px;max-width:150px;transition:transform 80ms linear,box-shadow 80ms linear}
.pb-a{box-shadow:0 4px 0 0 #C7A408}
.pb-b{box-shadow:0 7px 0 0 #C7A408}
.pb-c{box-shadow:0 7px 0 0 #C7A408,0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.45)}
.pb-d{border-radius:20px;box-shadow:0 7px 0 0 #C7A408,0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.45)}
.pb-a:active{transform:translateY(4px);box-shadow:0 0 0 0 #C7A408}
.pb-b:active,.pb-c:active,.pb-d:active{transform:translateY(7px)}
.pb-pressed{transform:translateY(7px);box-shadow:0 0 0 0 #C7A408}
/* ---- the rank set: primary, secondary, tertiary together ---- */
.rank{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sec{appearance:none;cursor:pointer;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:15px;color:#131310;background:#FBF7EE;border:0;border-radius:14px;padding:10px 15px}
.sec-a{box-shadow:0 4px 0 0 #C6C0AE}
.sec-b{background:none;color:#EFECE4;box-shadow:inset 0 0 0 2.5px #EFECE4}
.sec-c{background:none;color:#EFECE4;box-shadow:inset 0 0 0 2px rgba(239,236,228,.5)}
/* ---- icon buttons ---- */
.ib{width:44px;height:44px;display:grid;place-items:center;cursor:pointer;border:0;padding:0}
.ib-a{background:#FBF7EE;border-radius:50%;box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.42),0 3px 0 rgba(0,0,0,.34)}
.ib-b{background:#FBF7EE;border-radius:14px;box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.42),0 3px 0 rgba(0,0,0,.34)}
.ib-c{background:none;color:#EFECE4;box-shadow:inset 0 0 0 2.5px #EFECE4;border-radius:50%}
.ib svg{width:21px;height:21px}
/* ---- HUD chips ---- */
.chipset{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.chipset .chip{padding:5px 13px 6px;display:inline-flex;align-items:center;gap:6px;color:#131310}
.chip-b{border-radius:12px !important}
.chip-c{border-width:2px !important;box-shadow:0 0 0 1.5px rgba(0,0,0,.42) !important}
/* ---- the three vote surfaces ---- */
.vset{display:flex;gap:7px;width:100%}
.vb{flex:1;min-height:52px;appearance:none;cursor:pointer;border:0;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:18px;color:#131310;
  background:#FBF7EE;border-radius:14px;display:flex;align-items:center;justify-content:center}
.vb-a{box-shadow:0 4px 0 0 #C6C0AE}
.vb-b{box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.42),0 4px 0 rgba(0,0,0,.34)}
.vb-c{background:none;color:#EFECE4;box-shadow:inset 0 0 0 2.5px #EFECE4}
/* ---- MK card frames ---- */
.mkf{width:88px;height:118px;border-radius:6px;background:#D8C9A8;display:grid;place-items:center;
  font-size:11px;font-weight:700;color:#4A4436;text-align:center;padding:6px}
.mkf-a{border:7px solid #fff;box-shadow:0 6px 0 rgba(0,0,0,.42)}
.mkf-b{border:5px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.5),0 6px 0 rgba(0,0,0,.42)}
.mkf-c{border:7px solid #fff;border-radius:16px;box-shadow:0 6px 0 rgba(0,0,0,.42)}
"""

# THE PICKS, and where each one now lives. The sheet marks them so it stays a
# record of the decision rather than a menu that has already been ordered from.
PICKED = {
    "P-A":  ".sbtn",
    "R-B":  ".sbtn2 (matches .sbtn's box exactly — fill, border and ink only)",
    "IB-B": ".map-btn + .chip",
    "H-B":  ".chip",
    "V-A":  ".vbtn",
    "MF-B": ".mk-card",
}

def opt(oid, markup):
    """One option with its pickable ID printed under it. The ID is the point:
    a choice comes back as 'P-B, R-A, IB-C' instead of a paragraph."""
    on = oid in PICKED
    return ('<span class="cs-opt%s"><span class="cs-optbody">%s</span>'
            '<span class="cs-id%s">%s%s</span></span>'
            % (" cs-opt-on" if on else "", markup,
               " cs-id-on" if on else "", "\u2713 " if on else "", oid))

def comp_row(tag, body, spec):
    return ('<div class="cs-row"><span class="cs-tag">%s</span>'
            '<div class="cs-body">%s</div><p class="cs-spec">%s</p></div>'
            % (tag, body, spec))

def board_components():
    rows = []
    rows.append(comp_row("PRIMARY", "".join(
        opt("P-%s" % k.upper(),
            '<button type="button" class="pb pb-%s">%s</button>' % (k, esc(S["av_cta"])))
        for k in "abcd"),
        "A 4px extrusion · B 7px · C 7px + die-cut edge · D same, pill. "
        "All press: translateY(depth), shadow to 0, 80ms linear. "
        "PICKED: P-A, now the shared .sbtn on every frame."))
    rows.append(comp_row("RANK SET", 
        opt("R-A", '<div class="rank"><button class="pb pb-b">%s</button>'
                   '<button class="sec sec-a">%s</button>'
                   '<button class="tertiary">%s</button></div>'
                   % (esc(S["av_cta"]), esc(S["go"]), esc(TWEAK_CTA)))
        + opt("R-B", '<div class="rank"><button class="pb pb-b">%s</button>'
                     '<button class="sec sec-b">%s</button>'
                     '<button class="tertiary">%s</button></div>'
                     % (esc(S["av_cta"]), esc(S["go"]), esc(TWEAK_CTA))),
        "A filled secondary · B outline secondary. "
        "PICKED: R-B, built as .sbtn2 — the SAME min-height, padding, font-size and "
        "radius as .sbtn, so the two stack as a set; it reads as secondary through "
        "fill, border and ink alone, and has no extrusion, so it also does not press. "
        "The tertiary (text + icon, no plate, no border, no extrusion) is still the third "
        "level, but no v9 screen uses one: both buttons that were tertiary — the door to "
        "the builder on the sticker sheet and on the character detail — are now R-B, "
        "because a route out of a screen is a second action, not a caption."))
    rows.append(comp_row("ICON BUTTON", "".join(
        opt("IB-%s" % k.upper(),
            '<button type="button" class="ib ib-%s">%s</button>' % (k, ICONS[i]))
        for k, i in zip("abc", ("map", "close", "share"))),
        "A circular die-cut · B rounded square · C outline only. "
        "PICKED: IB-B. The avatar button takes the same 14px radius so the HUD pair "
        "still reads as a pair."))
    rows.append(comp_row("HUD CHIPS",
        opt("H-A", '<span class="chip"><span class="coin-glyph"></span>%s</span>'
                   % numeral("240", "", 20))
        + opt("H-B", '<span class="chip chip-b">%s</span>' % numeral("3/8", "", 20))
        + opt("H-C", '<span class="chip chip-c">%s</span>'
                     % avatar_sticker(PLAYER_AV, "avs-hud")),
        "A pill, 3px white + 1.5px keyline · B rounded rect · C thinner edge. "
        "PICKED: H-B — the shared .chip corner goes from 999px to 12px and nothing "
        "else about the chip changes. SCOPE, and a question back: this was applied to "
        "the HUD chips the row is about (coin, progress, avatar, map) and to the grammar "
        "chips, which are the same family. The decorative pills INSIDE cards — the intro "
        "tag, the bill date, the beat-5 source chips, the end-game coin pill — are still "
        "999px, because rounding every pill on the board is a bigger change than the pick "
        "asked for. Say the word and they follow."))
    rows.append(comp_row("VOTE", "".join(
        opt("V-%s" % k.upper(), '<div class="vset">%s</div>' % "".join(
            '<button type="button" class="vb vb-%s">%s</button>' % (k, esc(v))
            for v in (S["v_for"], S["v_against"], S["v_abstain"])))
        for k in "abc"),
        "CONSTRAINT MET: within each option the three are one construction — same box, "
        "same face, same size, same ink. No green, no red, no size difference. "
        "PICKED: V-A, now the shared .vbtn — used by beat 2's three votes AND by "
        "beat 1's two answers, because they are the same kind of thing."))
    rows.append(comp_row("MK FRAME", "".join(
        opt("MF-%s" % k.upper(),
            '<div class="mkf mkf-%s">%s</div>' % (k, esc(GANTZ["name"]))) for k in "abc"),
        "A 7px white die-cut · B 5px white + hard outline · C 7px, softer corner. "
        "PICKED: MF-B. The hard outline is what carries the card's shape when the "
        "white edge has no contrast — see the v9 Backgrounds board."))
    # THE VERDICT LEFT THIS SHEET. VD-1/2/3 were one shape in three colours,
    # which is not three options; it now has a board of its own where the four
    # candidates differ in shape and placement. Pick from VD-A…VD-D there.
    BOARDS.append(dict(file="Components.dc.html", var="cmp", num="C",
        he="Components", en="Components · option sheet", note="",
        fh=1800, body='  <div class="fz cs">%s</div>' % "".join(rows),
        css=COMP_SHEET_CSS))

# ================================ 11b · verdict options (v9 Verdict board) ==
# v8 offered VD-1/2/3, which differed only in fill colour — three paints, not
# three designs. These four differ in SHAPE and PLACEMENT; the colour rule is
# identical in all four and is set once, in SHARED.
VD_OPTS = (
    ("A", "pill on the bottom edge"),
    ("B", "corner badge, top corner"),
    ("C", "banner across the lower third"),
    ("D", "stamp over the portrait corner"),
)

def _vd_card(letter, token, kind):
    """One MK card, one verdict on it. The card is deliberately the smallest
    honest version of the beat-4 card — portrait, name, party — because the
    question here is the verdict, and three of them have to fit in one frame
    side by side with the other options."""
    return ('<div class="vdcard">'
            '<div class="vdc-portrait"><img src="mk-portrait.webp" alt=""></div>'
            '<div class="vdc-ident"><span class="vdc-name">%s</span>'
            '<span class="vdc-party">%s</span></div>'
            '<span class="vd vd-%s vd-%s">%s</span>'
            '</div>' % (esc(GANTZ["name"]), esc(GANTZ["party"]),
                        letter.lower(), kind, esc(token)))

def board_verdict_options():
    for letter, what in VD_OPTS:
        cells = "".join('<div class="vd-slot">%s</div>' % _vd_card(letter, tok, kind)
                        for tok, kind in VERDICT_TOKENS)
        body = ('  <div class="fz vdb"><span class="cs-id">VD-%s</span>'
                '<span class="vdb-what">%s</span>%s</div>'
                % (letter, esc(what), cells))
        BOARDS.append(dict(file="Verdict%s.dc.html" % letter, var="vd" + letter.lower(),
            num="V" + letter, he="Verdict " + letter, en="Verdict " + letter,
            note="", fh=1040, body=body, css=VERDICT_BOARD_CSS))

VERDICT_BOARD_CSS = """
.vdb{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;padding-top:6px}
.vdb-what{direction:ltr;font-size:12px;font-weight:700;color:#BEB9AC;margin-bottom:16px}
/* every option gets exactly the same slot, so a shape cannot win on space */
.vd-slot{width:100%;height:296px;display:grid;place-items:center}
/* the identity sits at the TOP of the card on purpose: VD-A hangs off the
   bottom edge and VD-C crosses the lower third, so anything down there would
   be covered by two of the four options and the comparison would be about
   what each one hides rather than about the shape. */
.vdcard{position:relative;width:300px;height:210px;padding:14px 16px;
  background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.05) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.05) 0 1px,transparent 1px 27px),#D8C9A8;
  border:5px solid #fff;
  box-shadow:0 0 0 2px rgba(0,0,0,.55),0 6px 0 rgba(0,0,0,.42),0 16px 26px rgba(0,0,0,.26)}
.vdc-portrait{position:absolute;bottom:12px;right:16px;width:104px}
/* the SAME portrait treatment beat 4 uses — rounded lower corners and the
   die-cut edge — because a bare rectangle would be a different component and
   the verdict is the only thing this board is supposed to be testing. */
.vdc-portrait img{display:block;width:104px;height:141px;object-fit:contain;object-position:50% 100%;
  border-radius:0 0 18px 18px;
  filter:url(#dc-%VAR%) drop-shadow(0 2px 0 rgba(0,0,0,.24))}
.vdc-ident{position:absolute;top:16px;right:134px;left:16px;
  display:flex;flex-direction:column;gap:3px}
.vdc-name{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;line-height:1}
.vdc-party{font-size:13px;font-weight:700;color:#4A4436}
"""

# ============================ 11c · background directions (v9 Backgrounds) ==
# ONE screen — the MK cascade beat, with its chrome — on five grounds. The
# markup is byte-identical across all five and so is every component rule:
# the card keeps its 5px WHITE die-cut edge on the cream ground too, where it
# has almost no contrast left. That is the finding, and tuning the border per
# ground to hide it would have thrown the finding away.
#
# The ONE thing that moves is ground-level TEXT ink, on the light grounds
# only, because near-black type is the readable choice on cream and light
# type is the readable choice on charcoal. Text sitting on the ground is not
# a component; every note on the board says which grounds it moved on.
def _wcag(fg, bg):
    def lin(h):
        c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
        c = [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c]
        return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
    a, b = lin(fg), lin(bg)
    if a < b: a, b = b, a
    return (a + .05) / (b + .05)

# (id, ground, dot ink, light?, what the direction is, what its accent is)
BG_DIRS = [
    ("BG-1", "#403E3A", "rgba(255,255,255,.07)", False,
     "charcoal + dot grid — the control, unchanged from v8",
     "none: the ground is neutral and every accent on the screen is a component's own"),
    ("BG-2", "#131C33", "rgba(85,175,255,.16)", False,
     "deep navy, two-colour discipline",
     "#55AFFF, and it is the ONLY hue the ground introduces — the dot grid is that accent"),
    ("BG-3", "#EFE6D2", "rgba(0,0,0,.07)", True,
     "cream / warm paper, light ground",
     "none: the paper is the accent, which is exactly why the white die-cut edge has nothing left to sit on"),
    ("BG-4", "#12301F", "rgba(255,160,60,.15)", False,
     "deep green, one warm accent",
     "#FFA03C, carried only by the dot grid"),
    ("BG-5", TOPIC_R1["color"], "rgba(0,0,0,.08)", True,
     "the topic's own hue as the full-screen ground (topic id \"%s\" = %s, from data.js)"
     % (TOPIC_R1["id"], TOPIC_R1["color"]),
     "the topic hue IS the ground, so the screen re-colours every round"),
]

def board_bg_dirs():
    for bid, ground, dot, light, what, accent in BG_DIRS:
        var = "bg" + bid[-1]
        inner = ('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>%s'
                 % (vd_defs(VD_PICK), _beat4_inner()))
        body = ('  %s<div class="fz comp bgs">%s</div>'
                % (hud(TOPIC_R1["label"], "240"), inner))
        css = COMP_CSS + BEAT4_CARD_CSS + VD_STAMP_CSS + """
.bgs{padding-top:74px}
.frame{background:%s}
.frame::before{background-image:radial-gradient(%s .5px,transparent .6px),
  radial-gradient(rgba(0,0,0,.20) .5px,transparent .6px);
  background-size:4px 4px,7px 7px;background-position:0 0,2px 3px}
""" % (ground, dot)
        if light:
            # ground-level text only. No component is touched.
            css += """
.coin-num,.hud-mid,.hud-mid .lsplain{color:#131310}
"""
        cr = _wcag("#ffffff", ground)
        BOARDS.append(dict(file="%s.dc.html" % bid.replace("-", ""), var=var,
            num=bid, he=bid, en=bid + " · " + what, note="",
            fh=940, body=body, css=css))
        BG_CONTRAST[bid] = cr

BG_CONTRAST = {}

# ================= 16 · CHARACTER CREATION — one bottom sheet per step ======
# CR-C is the base: the avatar owns the screen and the controls live in a tray
# the thumb can reach. What changes in v10 is that the tray is now ONE SHEET PER
# STEP, sliding in and out, and the preview above it never leaves.
#
# THREE THINGS THE BRIEF MAKES NON-NEGOTIABLE, and where each one is:
#   the preview stays visible at every step  -> .crs-hero is outside the sheet
#       and is never covered; both splits are sized from it, not from the sheet.
#   a save/done on EVERY step               -> .crs-go, the primary, is inside
#       the sheet's action row, so it is present on step 1 as much as step 5.
#       Its label is the SHIPPED av_cta — "on to the map" — which is exactly the
#       semantics asked for: leave now, keep what you have.
#   back and forward                        -> .crs-nav, one icon button each
#       side of the primary, chevrons pointing outward as RTL reads.
_C_BACK = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg>')
_C_FWD  = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>')

def _cr_opts(step, named=False):
    """PK-A: every option visible at once, no gesture to learn. `named` is the
    difference between the two splits — SP-B spends its extra sheet height on
    the option NAMES, which are shipped strings and the only thing that tells a
    player what כיפה or חיג'אב actually is before they tap it."""
    label, opts, sel, kind = BUILDER_CATS[step]
    cells = []
    for i, (oid, colour, lbl) in enumerate(opts):
        on = " on" if i == sel else ""
        if kind == "swatch":
            art = '<span class="crs-o crs-sw%s" style="background:%s"></span>' % (on, colour)
        else:
            key = {0: "skin", 1: "hair", 2: "hairc", 3: "eyes", 4: "clothes"}[step]
            art = ('<span class="crs-o crs-f%s">%s</span>'
                   % (on, av("%s_%s" % (key, oid), "crs-av")))
        cells.append('<span class="crs-cell">%s<i>%s</i></span>' % (art, esc(lbl))
                     if named else art)
    return label, '<div class="crs-opts%s">%s</div>' % (" named" if named else "",
                                                        "".join(cells))

# ---- the three progress indicators, all sticker-built -----------------------
def prog(kind, step, n=5):
    if kind == "A":       # chunky die-cut segments
        return ('<div class="pi pi-a">%s</div>'
                % "".join('<i class="%s"></i>' % ("on" if k <= step else "")
                          for k in range(n)))
    if kind == "B":       # numbered die-cut discs, current one raised
        return ('<div class="pi pi-b">%s</div>'
                % "".join('<i class="%s">%s</i>'
                          % ("on" if k == step else ("done" if k < step else ""),
                             numeral(str(k + 1), "", 13))
                          for k in range(n)))
    # C — the shipped X-of-Y numeral over a slim track
    return ('<div class="pi pi-c"><span class="pi-n">%s</span>'
            '<span class="pi-t"><b style="width:%d%%"></b></span></div>'
            % (numeral("%d%s%d" % (step + 1, OF_N, n), "", 15),
               round(100 * (step + 1) / n)))

CRS_CSS = """
/* the ID badge floats at top-left of the frame, so the screen's own top row
   starts below it — otherwise the badge sits on the title. */
.crs{flex:1;display:flex;flex-direction:column;position:relative;padding-top:26px}
.crs-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.crs-title{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:20px;
  color:#EFECE4}
/* THE PREVIEW. Outside the sheet, never covered, AS-D: the die-cut follows the
   figure. It is the only reason to build the flow this way, so it is the thing
   the split is sized from. */
.crs-hero{flex:1;display:grid;place-items:center;width:100%;min-height:0}
.crs-hero .cav{display:block}
.crs-hero svg{display:block;width:100%;height:100%;overflow:visible}
.crs-av-lg{filter:url(#dcw-%VAR%) drop-shadow(0 4px 0 rgba(0,0,0,.3))}
/* THE SHEET. A card that arrives from the bottom edge, full-bleed to the frame,
   with its own white die-cut top edge so it reads as a thing laid over the
   screen rather than a region of it. */
.crs-sheet{position:relative;width:calc(100% + 32px);margin:0 -16px -20px;
  background:#2C2A27;border-top:4px solid #fff;
  box-shadow:0 -3px 0 rgba(0,0,0,.5),0 -14px 26px rgba(0,0,0,.34);
  padding:9px 16px 16px;display:flex;flex-direction:column;gap:10px;align-items:center}
.crs-grip{width:44px;height:5px;border-radius:3px;background:#6E6C63;flex:none}
.crs-cat{align-self:flex-start;font-size:13px;font-weight:700;color:#BEB9AC}
.crs-opts{width:100%;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start}
.crs-o{flex:none;display:grid;place-items:center;background:#FBF7EE;border-radius:12px;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
.crs-sw{width:46px;height:46px}
.crs-f{width:62px;height:62px;overflow:hidden}
.crs-av{display:block;width:100%;height:100%}
.crs-o.on{box-shadow:0 0 0 3px #fff,0 0 0 5.5px #131310,0 4px 0 rgba(0,0,0,.35)}
.crs-cell{display:flex;flex-direction:column;align-items:center;gap:5px}
.crs-cell i{font-style:normal;font-size:11.5px;font-weight:700;color:#BEB9AC;text-align:center}
/* the action row: back, the always-present primary, forward */
.crs-nav{width:100%;display:flex;align-items:center;gap:10px;margin-top:2px}
.crs-go{flex:1;font-size:19px;min-height:52px}
.crs-ico{width:52px;height:52px;flex:none;display:grid;place-items:center;cursor:pointer;
  border:0;padding:0;background:#FBF7EE;border-radius:14px;color:#131310;
  box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.42),0 3px 0 rgba(0,0,0,.34)}
.crs-ico svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.6;
  stroke-linecap:round;stroke-linejoin:round}
.crs-ico[disabled]{opacity:.4}
/* ---- the three progress indicators ---- */
.pi{display:flex;align-items:center;gap:6px}
.pi-a i{width:34px;height:12px;background:#6E6C63;border:2.5px solid #fff;border-radius:6px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5)}
.pi-a i.on{background:#FFD60A}
.pi-b i{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;
  background:#B8B2A2;color:#131310;border:2.5px solid #fff;font-style:normal;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5);font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;font-size:13px}
.pi-b i.done{background:#C6C0AE}
.pi-b i.on{background:#FFD60A;width:32px;height:32px;font-size:15px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5),0 3px 0 rgba(0,0,0,.34)}
.pi-c{gap:9px;width:100%}
.pi-c .pi-n{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:15px;
  color:#EFECE4;flex:none}
.pi-t{flex:1;height:10px;background:#55524B;border:2.5px solid #fff;border-radius:5px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5);overflow:hidden;display:block}
.pi-t b{display:block;height:100%;background:#FFD60A}
/* thumb reach, drawn: a right thumb on a 390x844 screen, one-handed */
.thumbarc{position:absolute;z-index:30;right:-70px;bottom:-70px;width:600px;height:600px;
  border-radius:50%;pointer-events:none;border:2px dashed rgba(255,255,255,.42)}
"""

def _cr_screen(step, hero_px, pi, extra_sheet_cls="", sheet_shift=None, tag="", named=False):
    label, opts = _cr_opts(step, named)
    shift = "" if sheet_shift is None else ";transform:translateY(%dpx)" % sheet_shift
    return ('<div class="fz crs">'
            '<div class="crs-top">'
            '<button type="button" class="map-btn chip" aria-label="%s">%s</button>'
            '<span class="crs-title">%s</span></div>'
            '<div class="crs-hero"><span class="cav crs-av-lg" style="width:%dpx;height:%dpx">%s</span></div>'
            '<div class="crs-sheet %s" style="%s">'
            '<span class="crs-grip" aria-hidden="true"></span>'
            '%s'
            '<span class="crs-cat">%s</span>'
            '%s'
            '<div class="crs-nav">'
            '<button type="button" class="crs-ico" aria-label="%s">%s</button>'
            '<button type="button" class="sbtn crs-go">%s</button>'
            '<button type="button" class="crs-ico" aria-label="%s">%s</button>'
            '</div></div></div>'
            '<span class="thumbarc" aria-hidden="true"></span>%s'
            % (esc(S["guest_title"]), ICONS["close"], esc(S["av_title"]),
               # the HERO is the player as a finished character, so it takes the
               # picked treatment. The option chips below it do NOT: each one is
               # app.js's own buildAvatarSvg() branch for that option, and an
               # AV-3 version of all 22 is a code change for Roman, not a
               # substitution this board can make.
               hero_px, hero_px, av3(PLAYER_AV),
               extra_sheet_cls, shift.lstrip(";"),
               pi, esc(label), opts,
               esc(S["go"]), _C_BACK, esc(S["av_cta"]), esc(S["go"]), _C_FWD, tag))

def AV_SVG_NOBG(key):
    svg = AV_SVG[key]
    i, j = svg.index("<rect"), svg.index("/>") + 2
    assert 'opacity="0.15"' in svg[i:j], key
    return svg[:i] + svg[j:]

def board_char_sheets():
    # --- the two splits, at the biggest category (hair, 6 options) ----------
    for sid, hero, cls, en in (
            ("A", 208, "", "SP-A · ARCHIVED"),
            ("B", 340, "sheet-tall", "SP-B · named options, preview as large as 390 allows")):
        BOARDS.append(dict(file="CrSplit%s.dc.html" % sid, var="crs" + sid.lower(),
            num="H" + sid, he="Sheet split " + sid, en=en, note="", fh=880,
            body=('<span class="cs-id bgv-tag">SP-%s</span>%s'
                  % (sid, _cr_screen(1, hero, prog("C", 1), cls, named=(sid == "B")))),
            css=CHAR_CSS + CRS_CSS + """
.sheet-tall .crs-opts{gap:10px 9px}
.sheet-tall .crs-f{width:74px;height:74px}
"""))
    # --- SP-B, REBUILT IN THE HOUSE LANGUAGE --------------------------------
    # The layout is unchanged: SP-B is the picked split and the pick is not
    # being reopened. What changes is the CONSTRUCTION, which is the reason the
    # character flow read as a different product from the rest of the board —
    # flat dark panels and thin-bordered white boxes against kraft cards with
    # die-cut edges and hard offset shadows everywhere else.
    #
    # Four substitutions, all of them to tokens that already exist:
    #   the sheet   #2C2A27 flat  ->  kraft #D8C9A8 with the 27px grid, the
    #               5px white edge and the 0 5px 0 hard shadow — the MK card
    #   the preview floating on the ground  ->  standing on the same card
    #   the chips   12px radius, 2px keyline  ->  H-A's 14px and the vote chip's
    #               own 3px white + 4.6px keyline + 4px hard shadow
    #   the primary already P-C, left alone
    BOARDS.append(dict(file="V15CHAR.dc.html", var="v15char", num="CHAR",
        he="Character · house language", en="Character creation, reconnected",
        note="", fh=880,
        body=('<span class="cs-id bgv-tag">CHAR</span>%s'
              % _cr_screen(1, 340, prog("C", 1), "sheet-tall hs", named=True)),
        css=CHAR_CSS + CRS_CSS + """
.sheet-tall .crs-opts{gap:10px 9px}
.sheet-tall .crs-f{width:74px;height:74px}
/* ---------- the same materials as every other card on this board ---------- */
.hs.crs-sheet{
  background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.05) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.05) 0 1px,transparent 1px 27px),#D8C9A8;
  border-top:5px solid #fff;
  box-shadow:0 0 0 2px rgba(0,0,0,.55),0 -6px 0 rgba(0,0,0,.42)}
.hs .crs-grip{background:#9A8C6C}
.hs .crs-cat{color:#4A4436}
.hs .crs-cell i{color:#4A4436}
/* chips built the way the vote chips are built — one construction, not two */
.hs .crs-o{border-radius:14px;background:#FBF7EE;
  box-shadow:0 0 0 3px #fff,0 0 0 4.6px rgba(0,0,0,.62),0 4px 0 rgba(0,0,0,.45)}
.hs .crs-o.on{box-shadow:0 0 0 3px #fff,0 0 0 5.5px #131310,0 4px 0 rgba(0,0,0,.5)}
/* the preview stands ON a card rather than floating on the ground, so the
   figure is separated from the background by a shape the artwork need not
   supply — the same move the MK halo makes */
.crs-hero{position:relative}
/* bracketed to the hero rather than a fixed height, so the figure never hangs
   off the bottom of the card it is standing on */
.crs-hero::before{content:"";position:absolute;left:50%;translate:-50% 0;
  top:6px;bottom:2px;width:302px;
  background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.05) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.05) 0 1px,transparent 1px 27px),#D8C9A8;
  border:5px solid #fff;
  box-shadow:0 0 0 2px rgba(0,0,0,.55),0 6px 0 rgba(0,0,0,.42)}
.crs-hero .cav{position:relative;z-index:1}
"""))
    FRAME_NOTES["V15CHAR.dc.html"] = (
        "THE CHARACTER FLOW, RECONNECTED. Same screen, same picked split — SP-B "
        "is not being reopened — and the same shipped strings. Only the "
        "construction changes.\n"
        "WHAT WAS WRONG: this flow was the one part of the board built out of "
        "flat dark panels and thin-keyline white boxes. Everything else is kraft "
        "with a 27px grid, a 5px white die-cut edge and a hard offset shadow. "
        "Two products, one app.\n"
        "WHAT CHANGED, and every substitution is to a token that already exists: "
        "the sheet is now the MK card's own material; the option chips are built "
        "the way the vote chips are built, at H-A's 14px radius, rather than a "
        "second chip construction at 12px; and the preview stands on a card "
        "instead of floating on the ground — the same move the MK halo makes, "
        "and for the same reason, so the figure is separated from the background "
        "by a shape the artwork does not have to supply.\n"
        "The primary was already P-C and is untouched.\n"
        "THE FIGURE IS THE OLD ONE HERE ON PURPOSE. Re-skinning the furniture "
        "and re-drawing the avatar are separate decisions; AV-1/2/3 are the "
        "second one and are on the Character page.", None)

    # --- enter / settled / exit --------------------------------------------
    # step 0 throughout: 5 swatches on one row keeps the sheet short enough for
    # the whole thing to fit the motion window. The transition is the subject.
    states = (("ENTER", 150, 0), ("SETTLED", 0, 0), ("EXIT", 132, 0))
    cells = "".join(
        '<div class="mo-cell"><span class="cs-id">%s</span>'
        '<div class="mo-view">%s</div></div>'
        % (lbl, _cr_screen(step, 96, prog("C", step), "", shift))
        for lbl, shift, step in states)
    BOARDS.append(dict(file="CrMotion.dc.html", var="crmo", num="Hm",
        he="Sheet motion", en="Sheet · enter, settled, exit", note="", fh=1330,
        body='  <div class="fz mow">%s</div>' % cells,
        css=CHAR_CSS + CRS_CSS + """
.mow{flex:1;display:flex;flex-direction:column;gap:48px;padding-top:4px}
.mo-cell{display:flex;flex-direction:column;gap:6px}
/* each cell is a window onto the same screen, cropped to the part the sheet
   moves through — the preview above it is what has to stay visible */
.mo-view{position:relative;height:360px;overflow:hidden;width:calc(100% + 32px);margin:0 -16px;
  padding:0 16px;display:flex;flex-direction:column;
  background:rgba(0,0,0,.16);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.10)}
.mo-view .crs{padding-top:8px}
/* the state badge is above the window, not inside it — it was landing on the
   sheet's category label */
.mo-cell > .cs-id{margin-bottom:2px}
.mo-view .crs-cat{padding-top:2px}
.mo-view .crs-sheet{transition:transform 260ms cubic-bezier(.22,.9,.3,1)}
.mo-view .thumbarc{display:none}
"""))
    # --- the three progress indicators, true size --------------------------
    rows = "".join(
        '<div class="pirow"><span class="cs-id">PI-%s</span>'
        '<span class="shp-what">%s</span><div class="pibox">%s</div>'
        '<p class="cs-spec">%s</p></div>'
        % (k, esc(what), prog(k, 2), esc(spec))
        for k, what, spec in (
            ("A", "chunky die-cut segments",
             "Reads as progress at a glance and at any width. Says how far, never which "
             "step you are on or what it was called."),
            ("B", "numbered die-cut discs, current one raised",
             "The only one that lets a player jump — a numbered disc is a target. Costs the "
             "most width: five discs plus the raised current one is 170px of the 358 available."),
            ("C", "the shipped X-of-Y numeral over a track",
             "Uses app.js's own «X מתוך Y» construction, so nothing here is written. Quietest "
             "of the three and the only one that survives being put in the top chrome.")))
    BOARDS.append(dict(file="CrProgress.dc.html", var="crpi", num="Hp",
        he="Progress", en="Step progress · 3 options", note="", fh=560,
        body='  <div class="fz piw">%s</div>' % rows,
        css=CHAR_CSS + CRS_CSS + """
.piw{flex:1;display:flex;flex-direction:column;gap:26px;padding-top:8px}
.pirow{display:flex;flex-direction:column;align-items:flex-start;gap:8px;width:100%}
.pibox{width:100%;padding:14px 0 4px}
"""))

# ============================== 15 · THE VERDICT STAMP (VD-D, rebuilt) ======
# v9's VD-D was a coloured disc with a word in it — a badge. This is stamp
# construction: two rings with a gap, text running round inside the inner ring,
# the verdict centred, and an ink-bleed edge so it reads as pressed rather than
# placed. Semi-transparent with a backdrop blur, as before, so the card and the
# ground read through it.
#
# THE PLACEMENT BUG, FIXED. In v9 the stamp was anchored at `top:26%; right:-36px`
# — measured against the CARD, which put it straight over the MK's face. The
# reveal must never obscure the person it is about. It is now anchored to the
# card's BOTTOM-LEFT CORNER and centred on it, so roughly half hangs off the
# card onto the ground and the portrait — which occupies the top ~240px of a
# 560px card — is never touched. Every frame below shows it with a portrait
# present, which is the only way that claim can be checked.
VD_RING = "[RING-TEXT]"
TAMAR_TODO.append("Verdict ring text — the line that runs round the inside of the "
                  "stamp. Renders as [RING-TEXT]; nothing guesses at it.")

# (id, outer stroke, inner stroke, ring-text size, displacement, grit)
VD_TREATS = (
    ("D1", 4.0, 1.6, 8.0, 1.1, 0.42),
    ("D2", 6.0, 2.2, 9.5, 2.2, 0.62),
    ("D3", 3.0, 1.2, 6.5, 0.6, 0.24),
)

# D2 is the pick: the heaviest ring, the most distress. Every live verdict on
# the board uses it; D1 and D3 survive only on the archived options page.
VD_PICK = ("D2", 6.0, 2.2, 9.5, 2.2, 0.62)

def vd_defs(treat):
    """One distress filter per treatment. feTurbulence + feDisplacementMap wobbles
    the strokes off true; a second, much finer turbulence is thresholded into
    holes and punched out, which is the ink not taking. Both work in SVG user
    units, so they scale with the stamp instead of coarsening at small sizes."""
    tid, _o, _i, _t, disp, grit = treat
    return ('<filter id="ink-%s" x="-20%%" y="-20%%" width="140%%" height="140%%" '
            'color-interpolation-filters="sRGB">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" result="w"></feTurbulence>'
            '<feDisplacementMap in="SourceGraphic" in2="w" scale="%.1f" xChannelSelector="R" yChannelSelector="G" result="p"></feDisplacementMap>'
            '<feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="2" seed="4" result="g"></feTurbulence>'
            '<feColorMatrix in="g" type="saturate" values="0" result="gg"></feColorMatrix>'
            '<feComponentTransfer in="gg" result="holes"><feFuncA type="linear" slope="1" intercept="%.2f"></feFuncA></feComponentTransfer>'
            '<feComposite in="p" in2="holes" operator="out"></feComposite>'
            '</filter>' % (tid, disp, -1.0 + grit))

def vd_stamp(treat, token, kind, pal="", uid=""):
    """The stamp. The RINGS and the ring text are SVG so they can be distressed
    as one pressed mark; the verdict label is HTML so it takes the real face and
    can wrap — [SURPRISE-1] does not fit a single line inside the rings."""
    tid, ow, iw, ts, _d, _g = treat
    pid = "vp-%s-%s" % (tid.lower(), uid or kind)
    ring = esc(VD_RING)          # one pass along the top arc, not a full ring
    return ('<span class="vs vs-%s vs-%s %s">'
            '<svg class="vs-art" viewBox="0 0 100 100" aria-hidden="true">'
            '<defs><path id="%s" d="M50 82 a32 32 0 1 1 0 -64 a32 32 0 1 1 0 64"></path></defs>'
            '<g filter="url(#ink-%s)">'
            '<circle class="vs-r1" cx="50" cy="50" r="45.5" stroke-width="%.1f"></circle>'
            '<circle class="vs-r2" cx="50" cy="50" r="38" stroke-width="%.1f"></circle>'
            '<text class="vs-rt" font-size="%.1f" text-anchor="middle"><textPath href="#%s" startOffset="50%%">%s</textPath></text>'
            '</g></svg>'
            '<span class="vs-lab">%s</span></span>'
            % (tid.lower(), kind, pal, pid, tid, ow, iw, ts, pid, ring, esc(token)))

VD_STAMP_CSS = """
/* THE STAMP. Anchored to the card's bottom-left CORNER and centred on it: about
   half of it hangs off the card onto the ground, which is the edge-straddling
   the brief asks for, and the portrait — the top ~240px of a 560px card — is
   nowhere near it. */
/* the overhang is 22px left and 46px below, not a full half-diameter: the card
   sits in a 340px stack inside a 390px frame, so 25px is ALL the margin there
   is and centring a 124px stamp on the corner clipped it against the frame.
   Caught in the render, not in the numbers. */
.vs{position:absolute;z-index:9;left:-22px;bottom:-34px;width:120px;height:120px;
  display:grid;place-items:center;border-radius:50%;
  -webkit-backdrop-filter:blur(7px) saturate(1.3);backdrop-filter:blur(7px) saturate(1.3);
  box-shadow:0 0 0 1px rgba(0,0,0,.35)}
.vs-art{position:absolute;inset:0;width:100%;height:100%;overflow:visible;fill:none}
.vs-r1,.vs-r2{fill:none;stroke:currentColor}
.vs-rt{fill:currentColor;stroke:none;font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;letter-spacing:.14em;direction:ltr}
.vs-lab{position:relative;z-index:2;direction:ltr;width:74px;text-align:center;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:19px;
  line-height:1.02;color:currentColor;overflow-wrap:break-word;
  /* the label sits low enough to clear the ring text over the top arc */
  transform:translateY(5px)}
/* COLOUR CODES CORRECTNESS AND NOTHING ELSE — two inks, never three, and never a
   vote direction. The ink is `color`, so the rings, the ring text and the label
   are the same ink by construction and cannot drift apart. */
/* VP-2 IS THE PALETTE. The teal+yellow control is retired: it measured 26 and
   30 degrees from style B's own hue bands and lost. Lime clears by 54, magenta
   by 51. Two inks, correctness only, never a vote direction. */
.vs-right{background:rgba(182,229,33,.62);color:#22300A}
.vs-surp{background:rgba(255,59,192,.62);color:#33061F}
/* archived, kept so the comparison stays readable on the Archive page */
.vp0.vs-right{background:rgba(46,196,182,.62);color:#06302C}
.vp0.vs-surp{background:rgba(255,214,10,.62);color:#2A2100}
.vp1.vs-right{background:rgba(47,212,107,.62);color:#04301A}
.vp1.vs-surp{background:rgba(155,92,255,.62);color:#1B0B33}
.vp2.vs-right{background:rgba(182,229,33,.62);color:#22300A}
.vp2.vs-surp{background:rgba(255,59,192,.62);color:#33061F}
/* the small-size strip: the stamp taken out of the card and shrunk */
.ssrow{display:flex;align-items:flex-end;gap:16px;direction:ltr;margin:14px auto 0;
  padding:12px 14px;background:#D8C9A8;border:4px solid #fff;
  box-shadow:0 0 0 2px rgba(0,0,0,.5),0 5px 0 rgba(0,0,0,.4)}
.ss{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;
  width:var(--s)}
.ss .vs{position:relative;left:auto;bottom:auto;width:var(--s);height:var(--s)}
.ss .vs-lab{font-size:calc(var(--s) * .108);width:calc(var(--s) * .53)}
.ss i{font-style:normal;direction:ltr;font-size:9.5px;font-weight:700;color:#4A4436}
.vs-d2{box-shadow:0 0 0 1px rgba(0,0,0,.45)}
.vs-d3{box-shadow:0 0 0 1px rgba(0,0,0,.25)}
"""

def _hue(hex_):
    import colorsys
    r, g, b = [int(hex_[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return colorsys.rgb_to_hsv(r, g, b)[0] * 360

def _clear(h, bands=(10, 20, 200)):
    return min(min(abs(h - b), 360 - abs(h - b)) for b in bands)

VD_PALETTES = (
    ("vp0", "RETIRED · teal + yellow",   "#2EC4B6", "#FFD60A"),
    ("vp1", "VP-1 · spring green + violet", "#2FD46B", "#9B5CFF"),
    ("vp2", "VP-2 · lime + magenta",     "#B6E521", "#FF3BC0"),
)

def board_vd_stamps():
    """Three stamp treatments, three states each, on the real MK card."""
    for treat in VD_TREATS:
        tid = treat[0]
        cards = "".join(
            '<div style="margin-bottom:76px">%s</div>'
            % _bgv_card("B", None, extra=vd_stamp(treat, tok, kind, uid="%s%d" % (tid, i)))
            for i, (tok, kind) in enumerate(VERDICT_TOKENS))
        # "must survive at small sizes" is a claim, so it is rendered: the same
        # stamp at 120 / 84 / 56 / 40px. Everything in it is SVG user units, so
        # the rings, the ring text and the distress all scale together.
        small = "".join(
            '<span class="ss" style="--s:%dpx">%s<i>%d</i></span>'
            % (px, vd_stamp(treat, VD_RIGHT, "right", uid="%ss%d" % (tid, px)), px)
            for px in (120, 84, 56, 40))
        BOARDS.append(dict(file="VdStamp%s.dc.html" % tid, var="vs" + tid.lower(),
            num="S" + tid[-1], he="Stamp " + tid, en="VD-%s · stamp treatment" % tid,
            note="", fh=2220,
            body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
                  '%s<span class="cs-id bgv-tag">VD-%s</span>'
                  '<div class="fz comp" style="padding-top:44px">%s'
                  '<div class="ssrow">%s</div></div>'
                  % (vd_defs(treat), BGV_DEFS, tid, cards, small)),
            css=COMP_CSS + BEAT4_CARD_CSS + BGV_CSS + VD_STAMP_CSS))
    # the palettes, all three against the same style B portrait
    treat = VD_TREATS[0]
    cells = []
    for pal, label, right, surp in VD_PALETTES:
        # each palette gets its OWN style B portrait with the surprise stamp on
        # its corner — the brief asks for these to be judged against the
        # artwork, and a row of discs on the bare ground does not do that.
        row = ('<span class="pal-port">%s<span class="pal-on">%s</span></span>'
               % (_bgv_img("B", 128, "portrait-img bgv-port"),
                  vd_stamp(treat, VD_S1, "surp", pal, uid="P%son" % (pal or "c")))
               + "".join(
                   '<span class="pal-cell">%s</span>'
                   % vd_stamp(treat, tok, kind, pal, uid="P%s%d" % (pal or "c", i))
                   for i, (tok, kind) in enumerate(VERDICT_TOKENS) if kind != "surp"
                   or tok == VD_S2))
        cells.append('<div class="pal-row"><span class="cs-id">%s</span>'
                     '<span class="pal-nums">right %s · %.0f°&nbsp;&nbsp;surprise %s · %.0f°</span>'
                     '<div class="pal-set">%s</div></div>'
                     % (esc(label), right, _clear(_hue(right)), surp, _clear(_hue(surp)), row))
    BOARDS.append(dict(file="VdPalettes.dc.html", var="vpal", num="Sp",
        he="Verdict palettes", en="Verdict palettes · clearance from style B",
        note="", fh=1020,
        body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
              '%s<div class="fz palw">%s</div>'
              % (vd_defs(treat), BGV_DEFS, "".join(cells))),
        css=COMP_CSS + BEAT4_CARD_CSS + BGV_CSS + VD_STAMP_CSS + """
.palw{flex:1;display:flex;flex-direction:column;align-items:center;gap:20px;padding-top:8px}
.pal-row{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.pal-nums{direction:ltr;font-size:10.5px;font-weight:700;color:#BEB9AC}
.pal-set{width:100%;display:flex;gap:12px;align-items:flex-end;justify-content:flex-start;
  direction:ltr}
/* every palette carries its own style B portrait with the surprise stamp on its
   corner: the collision this is trying to clear is between the ink and the
   ARTWORK, so the artwork has to be under it. */
.pal-port{position:relative;display:block;width:128px;flex:none;background:#D8C9A8;
  border:4px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.5),0 4px 0 rgba(0,0,0,.4);
  padding-bottom:62px}
.pal-port .bgv-port{width:128px;height:150px}
/* on the CARD's corner, below the portrait — never on the portrait itself */
.pal-on .vs{left:-12px;bottom:-26px;width:80px;height:80px}
.pal-on .vs-lab{font-size:12px;width:56px}
/* the loose stamps sit on their own kraft chip, because that is the backdrop
   they actually get — measuring their ink against the bare ground measured a
   situation the component is never in */
.pal-cell{display:block;background:#D8C9A8;border:3px solid #fff;padding:8px 10px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5),0 3px 0 rgba(0,0,0,.35)}
.pal-cell .vs{position:relative;left:auto;bottom:auto;width:80px;height:80px}
.pal-cell .vs-lab{font-size:12px;width:56px}
"""))


# ========================= 17 · ROUND BEATS — five options per beat ========
# Read out of data.js before anything was drawn, and every number below is
# measured, not quoted:
#   _tally      8 of 16 issues. The other 8 are NOT one state: b2, a2 and s2
#               carry a vote count in bill_summary PROSE («59 מול 52») that no
#               field exposes, and e2, g1, g2, v2, m1 carry no vote numbers at
#               all. Three states, not two.
#   glossary    22 terms; 14 of them occur somewhere; 8 occur nowhere in any
#               issue text. They reach 14 of 16 issues — v2 and m2 get none.
#   basis       doc 61 cards, bloc 37. Bloc is 38% of every card in the game,
#               not an edge case, and it has no label anywhere in the data.
#   mode        g2 and v2 are «stance» — stated positions, not a vote at all.
B_ISS_T, B_ISS_N = R1, E2          # with tally / without
B_TOPIC = TOPIC_R1

def b_pin():
    return pinned_word(S["ans_t"])

def votes3(cls=""):
    """THREE, ALWAYS. Same box, same face, same size, same ink — and the third
    is never conditionally hidden: in a round where nobody abstained, dropping
    נמנע would tell the player the answer before they guessed."""
    return ('<div class="b3v %s">%s</div>'
            % (cls, "".join('<button type="button" class="vbtn">%s</button>' % esc(v)
                            for v in (S["v_for"], S["v_against"], S["v_abstain"]))))

def gap_axis(guess_i, actual_i, av=True):
    """THE PAYLOAD, DRAWN. Three stops, two markers, and the distance between
    them shown as a span rather than stated as a row of two cells. All three
    positions stay on screen, so the axis also carries the three-option rule."""
    stops = (S["v_for"], S["v_against"], S["v_abstain"])
    lo, hi = sorted((guess_i, actual_i))
    span = "" if lo == hi else (
        '<span class="gx-span" style="right:%.2f%%;width:%.2f%%"></span>'
        % (16.6 + lo * 33.3, (hi - lo) * 33.3))
    # WHEN THE TWO AGREE THEY STILL HAVE TO BE TWO. Landing both markers on the
    # same stop hid the player's sticker completely behind the MK's portrait, so
    # a correct guess read as a single marker — which is the one case where the
    # axis has the most to say. They are nudged apart onto the same square
    # instead, the way two stickers land on one space.
    same = "" if guess_i != actual_i else " gx-pair"
    marks = ('<span class="gx-m gx-you%s" style="right:%.2f%%">%s</span>'
             '<span class="gx-m gx-mk%s" style="right:%.2f%%">%s</span>'
             % (same, 16.6 + guess_i * 33.3,
                avatar_sticker(PLAYER_AV, "gx-av") if av else '<i></i>',
                same, 16.6 + actual_i * 33.3, _bgv_img("B", 34, "gx-port")))
    return ('<div class="gx"><div class="gx-track">%s%s</div>'
            '<div class="gx-stops">%s</div>'
            '<p class="gx-cap"><span>%s</span><span>%s</span></p></div>'
            % (span, marks,
               "".join('<i>%s</i>' % esc(t) for t in stops),
               esc(S["guess_label"]), esc(S["voted_label"])))

def b_halo(px=176):
    """The halo: one flat shape behind every portrait. It is the reason this
    composition survives 21 different illustrations — the subject is separated
    from the ground by a shape the artwork does not have to supply."""
    return ('<span class="halo" aria-hidden="true"></span>%s'
            % _bgv_img("B", px, "portrait-img bgv-port b-port"))

def basis_pair():
    """SHOW BOTH STATES OR NEITHER. «doc» surfaces today as a מתועד chip; its
    counterpart «bloc» is 37 of the 98 cards and has no label anywhere in the
    data. Both are drawn, and the bloc label is an unwritten slot."""
    return ('<span class="bchip">%s</span><span class="bchip bchip-b">%s</span>'
            % (esc("📌 " + S["basis_doc"]),
               ph("תווית ל-bloc", "basis=bloc has no label anywhere in data.js")))

BEATS_CSS = """
.bw{flex:1;display:flex;flex-direction:column;position:relative;padding-top:8px}
.b-tag{position:absolute;z-index:60;top:10px;left:16px;width:fit-content}
.b-claim{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;line-height:1.12;
  text-wrap:balance;color:#EFECE4}
.b3t,.b2t,.b2q,.b2lab{color:#EFECE4}
.b2foot{color:#C8C2B4}
.b3v{display:flex;gap:9px;width:100%;flex:none}
.b3v .vbtn{flex:1;font-size:19px;min-height:54px;padding:10px 4px}
.b3v-col{flex-direction:column}
.b3v-col .vbtn{width:100%}
/* ---- the guess-vs-reality axis ---- */
.gx{width:100%;padding:6px 0 2px}
.gx-track{position:relative;height:38px;margin:0 4px;
  background:rgba(34,31,23,.13);border-radius:19px;
  box-shadow:inset 0 0 0 1.5px rgba(34,31,23,.22)}
.gx-span{position:absolute;top:0;bottom:0;background:rgba(255,59,192,.34);
  border-radius:19px;box-shadow:inset 0 0 0 2px rgba(255,59,192,.7)}
.gx-m{position:absolute;top:50%;translate:50% -50%;width:38px;height:38px;display:block}
.gx-you .avs{display:block;width:38px;height:38px;filter:url(#av-sm-%VAR%)}
.gx-port{display:block;width:34px;height:46px;object-fit:contain;object-position:50% 0;
  filter:url(#bcut-sm)}
.gx-stops{display:flex;margin-top:5px}
.gx-stops i{flex:1;text-align:center;font-style:normal;font-size:13px;font-weight:700;
  color:#4A4436}
.gx-cap{display:flex;justify-content:space-between;margin-top:3px;font-size:11px;
  font-weight:700;color:#413B2E}
/* ---- beat 4: halo + portrait at the bottom ---- */
.b4card{position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;
  background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.05) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.05) 0 1px,transparent 1px 27px),#D8C9A8;
  border:5px solid #fff;
  box-shadow:0 0 0 2px rgba(0,0,0,.55),0 6px 0 rgba(0,0,0,.42)}
.b4top{position:relative;z-index:3;padding:12px 14px 0;display:flex;flex-direction:column;gap:9px}
.b4port{position:relative;margin-top:auto;display:flex;justify-content:center;align-items:flex-end}
.halo{position:absolute;bottom:-54px;left:50%;translate:-50% 0;width:270px;height:270px;
  border-radius:50%;background:#C0B190;box-shadow:inset 0 0 0 3px rgba(0,0,0,.13)}
.b-port{position:relative;z-index:2;object-fit:contain;object-position:50% 100%;
  filter:url(#bcut-lg) drop-shadow(0 3px 0 rgba(0,0,0,.22))}
.b4name,.b4party{width:fit-content;margin-inline-end:auto}
.b4name{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;
  line-height:1;color:#131310;white-space:nowrap}
.b4party{font-size:13px;font-weight:700;color:#4A4436}
.bchip{display:inline-block;font-size:11.5px;font-weight:700;color:#4A4436;
  background:rgba(255,255,255,.6);border-radius:20px;padding:3px 9px;margin-inline-end:5px}
.bchip-b{background:none;padding:0}
.b4note{font-size:14px;font-weight:700;line-height:1.45;color:#131310}
/* ---- beat 5 ---- */
.b5{display:flex;flex-direction:column;gap:12px;width:100%}
.b5word{align-self:flex-start;background:#000;color:#fff;border:5px solid #fff;
  padding:2px 16px 6px;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:44px;line-height:1.1}
.b5tally{display:flex;align-items:baseline;justify-content:center;gap:12px;padding:12px 10px;
  background:#fff;border:3px solid #131310;border-radius:14px}
.b5num{font-size:40px}
.b5lab{font-size:14px;font-weight:700}
.b5exp{font-size:15px;font-weight:700;line-height:1.5;color:#EFECE4}
.b5src{display:flex;flex-wrap:wrap;gap:7px}
.b5src span{font-size:12px;font-weight:700;background:#fff;color:#131310;
  border:2.5px solid #131310;border-radius:20px;padding:4px 11px}
/* a glossary term, surfaced only AFTER the guess */
.gterm{background:#37c4ff;color:#0B2430;border-radius:5px;padding:1px 5px;
  border-bottom:2.5px dotted #0B2430;font-weight:900}
.gdef{margin-top:7px;background:#FBF7EE;color:#131310;border-radius:12px;padding:10px 12px;
  font-size:13px;font-weight:700;line-height:1.45;box-shadow:0 0 0 2px rgba(0,0,0,.4)}
.b5state{font-size:10.5px;font-weight:800;letter-spacing:.09em;color:#131310;
  background:#FFD60A;border-radius:20px;padding:2px 9px 3px;align-self:flex-start;
  direction:ltr}
.b-sub{font-size:12px;font-weight:700;color:#BEB9AC;direction:ltr}
"""

def b_frame(bid, en, body, css="", fh=860, note="", flag=None):
    BOARDS.append(dict(file="RB%s.dc.html" % bid.replace("-", ""), var="rb" + bid.replace("-", "").lower(),
        num=bid, he=bid, en="%s · %s" % (bid, en), note="", fh=fh,
        body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>%s'
              '<span class="cs-id b-tag">%s</span>%s' % (vd_defs(VD_PICK), BGV_DEFS, bid, body)),
        css=COMP_CSS + BEATS_CSS + VD_STAMP_CSS + BGV_CSS + css))
    FRAME_NOTES["RB%s.dc.html" % bid.replace("-", "")] = (note, flag)

def board_beats():
    CL = esc(B_ISS_T["tf"])
    T, F = esc(S["ans_t"]), esc(S["ans_f"])
    ans = ('<div class="b1ans"><button type="button" class="vbtn">%s</button>'
           '<button type="button" class="vbtn">%s</button></div>' % (T, F))

    # ---------------------------------------------------------------- BEAT 1
    # No source attribution on any of these: naming the outlet before the guess
    # hands the player a partisan cue to answer from instead of the claim.
    b_frame("B1-A", "type-led, full bleed",
        '<div class="fz bw b1a"><p class="b-claim">%s</p>%s</div>' % (CL, ans),
        ".b1a{justify-content:center;gap:34px;padding:0 4px}\n"
        ".b1a .b-claim{font-size:38px}\n.b1ans{display:flex;gap:9px}\n"
        ".b1ans .vbtn{flex:1;font-size:24px;min-height:62px}",
        note="The claim IS the screen. No card, no frame, no chrome — type at 38px filling "
             "the bleed, the two answers at the foot.\nStages the claim as a STATEMENT with "
             "no speaker: nothing on screen says who said it, which is the most neutral of "
             "the five and also the least memorable.")
    b_frame("B1-B", "sticker poster",
        '<div class="fz bw b1b"><div class="b1wrap">%s<div class="b1p">%s'
        '<p class="b-claim">%s</p></div></div>%s</div>'
        % (pile("b1pile"), '<span class="b1em">%s</span>' % esc(B_ISS_T["emoji"]), CL, ans),
        ".b1b{justify-content:center;gap:26px}\n"
        ".b1p{flex:none;position:relative;background:#FFF3CE;border:7px solid #fff;padding:44px 18px 22px;"
        "box-shadow:0 7px 0 rgba(0,0,0,.42),0 16px 26px rgba(0,0,0,.28)}\n"
        ".b1p .b-claim{font-size:27px;color:#131310;text-align:center}\n"
        ".b1em{position:absolute;top:-52px;left:50%;translate:-50% 0;font-size:96px;line-height:1;"
        "filter:url(#dc-%VAR%) drop-shadow(0 5px 7px rgba(0,0,0,.3))}\n"
        ".b1wrap{position:relative;margin-top:56px}\n.b1pile{inset:0}\n"
        ".b1ans{display:flex;gap:9px}\n"
        ".b1ans .vbtn{flex:1;font-size:24px;min-height:62px}",
        note="The claim as a stuck-up poster: the pile behind it, the topic emoji die-cut over "
             "the top edge.\nStages the claim as a DECLARATION — a poster is somebody's "
             "assertion, put up on purpose. That is a reading of the material, not a neutral "
             "container.")
    b_frame("B1-C", "chyron / lower third",
        '<div class="fz bw b1c"><span class="b1topic">%s %s</span>'
        '<div class="b1ch"><span class="b1kick">%s</span><p class="b-claim">%s</p></div>%s</div>'
        % (esc(B_ISS_T["emoji"]), esc(B_TOPIC["label"]),
           ph("קיקר לכתובית", "chyron kicker line"), CL, ans),
        ".b1c{justify-content:flex-end;gap:18px;padding-bottom:8px}\n"
        ".b1topic{align-self:center;margin-bottom:auto;margin-top:60px;font-size:17px;"
        "font-weight:700;color:#BEB9AC}\n"
        ".b1ch{width:calc(100% + 32px);margin:0 -16px;background:#131310;border-top:5px solid #fff;"
        "border-bottom:5px solid #fff;padding:12px 16px 15px}\n"
        ".b1ch .b-claim{font-size:25px;color:#fff}\n"
        ".b1kick{display:inline-block;margin-bottom:6px}\n.b1ans{display:flex;gap:9px}\n"
        ".b1ans .vbtn{flex:1;font-size:24px;min-height:62px}",
        note="A broadcast lower-third: the claim in a full-bleed bar with a kicker above it.\n"
             "Stages the claim as a REPORT — a chyron carries the authority of a newsroom, and "
             "that is exactly the cue the beat is supposed to withhold. The kicker line has no "
             "shipped string.",
        flag="THE STAGING IS A POLITICAL CHOICE, NOT A STYLE ONE. A chyron reports, a poster "
             "declares, bare type states. Each frames who is speaking before the player answers. "
             "Tamar's call, not a design one.")
    b_frame("B1-D", "card in hand",
        '<div class="fz bw b1d"><div class="b1card"><p class="b-claim">%s</p></div>%s</div>'
        % (CL, ans),
        ".b1d{justify-content:flex-end;gap:30px;padding-bottom:10px}\n"
        ".b1card{flex:none;width:300px;margin:0 auto auto;margin-top:70px;background:#FBF7EE;"
        "border:6px solid #fff;padding:26px 20px;"
        "box-shadow:0 10px 0 rgba(0,0,0,.42),0 26px 34px rgba(0,0,0,.42)}\n"
        ".b1card .b-claim{font-size:26px;color:#131310}\n.b1ans{display:flex;gap:9px}\n"
        ".b1ans .vbtn{flex:1;font-size:24px;min-height:62px}",
        note="A single card held at thumb height: narrower than the frame, with a deep drop so "
             "it reads as lifted off the ground rather than printed on it.\nThe held-card idea "
             "usually comes with a tilt. Rotation is out board-wide, so the holding is carried "
             "by the shadow depth alone — which is weaker, and worth knowing before picking it.")
    b_frame("B1-E", "split decision",
        '<div class="fz bw b1e"><div class="b1half"><p class="b-claim">%s</p></div>'
        '<div class="b1split"><button type="button" class="vbtn">%s</button>'
        '<button type="button" class="vbtn">%s</button></div></div>' % (CL, T, F),
        ".b1e{gap:0;padding:0;margin:0 -16px;width:calc(100% + 32px)}\n"
        ".b1half{flex:1;display:grid;place-items:center;padding:26px 20px;background:TOPICHUE}\n"
        ".b1half .b-claim{font-size:29px;color:#131310;text-align:center}\n"
        ".b1split{display:flex;height:210px}\n"
        ".b1split .vbtn{flex:1;height:100%;border-radius:0;font-size:32px;box-shadow:none;"
        "border-top:5px solid #fff}\n"
        ".b1split .vbtn:first-child{border-inline-start:3px solid #fff}"
        .replace("TOPICHUE", B_TOPIC["color"]),
        note="The screen IS the decision: the claim owns the top on the topic's own hue, the two "
             "answers own the bottom as equal halves.\nMy own. It is the only one of the five "
             "with no container at all — nothing is staging the claim, so nothing is editorialising "
             "it. Costs the whole screen, so it cannot carry chrome later.")

    # ---------------------------------------------------------------- BEAT 2
    # bill_summary is GONE from this beat in all five. It is at beat 5.
    BT = esc(B_ISS_T["bill_title"])
    q = esc(S["vote_q"])
    for oid, en, body, css, note in (
      ("B2-A", "the ballot: three stacked bars",
       '<div class="fz bw b2a"><span class="b2lab">%s</span><p class="b2t">%s</p>'
       '<p class="b2q">%s</p>%s</div>' % (esc(S["bill_label"]), BT, q, votes3("b3v-col")),
       ".b2a{justify-content:center;gap:14px}\n.b2lab{font-size:12.5px;font-weight:700;color:#BEB9AC}\n"
       ".b2t{font-size:20px;font-weight:700;line-height:1.45;color:#EFECE4}\n"
       ".b2q{margin-top:14px;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;"
       "font-size:28px;color:#EFECE4}\n.b2a .b3v{margin-top:4px}",
       "The plainest reading: the bill named, the question, three equal bars.\nNo bill_summary — "
       "see the row note."),
      ("B2-B", "voting slip: three columns",
       '<div class="fz bw b2b"><span class="b2lab">%s</span><p class="b2t">%s</p>'
       '<p class="b2q">%s</p>%s</div>' % (esc(S["bill_label"]), BT, q, votes3()),
       ".b2b{justify-content:center;gap:14px}\n.b2lab{font-size:12.5px;font-weight:700;color:#BEB9AC}\n"
       ".b2t{font-size:20px;font-weight:700;line-height:1.45;color:#EFECE4}\n"
       ".b2q{margin-top:14px;font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;"
       "font-size:28px;color:#EFECE4}\n.b2b .b3v .vbtn{min-height:104px;font-size:21px}",
       "Three columns rather than three rows — a paper slip, all three in one glance.\nAt 390px "
       "each column is 111px, which נמנע fits and a longer word would not."),
      ("B2-C", "your sticker, three slots",
       '<div class="fz bw b2c"><div class="b2me">%s</div><p class="b2q">%s</p>'
       '<p class="b2t">%s</p>%s</div>'
       % (avatar_sticker(PLAYER_AV, "avs-cut b2av"), q, BT, votes3("b3v-col")),
       ".b2c{justify-content:center;gap:12px;align-items:center}\n"
       ".b2av{width:118px;height:118px}\n"
       ".b2q{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:29px;"
       "color:#EFECE4;text-align:center}\n"
       ".b2t{font-size:16px;font-weight:700;line-height:1.45;color:#BEB9AC;text-align:center;"
       "max-width:32ch}",
       "The player's own sticker on the screen, above the question — this is the beat where the "
       "answer is THEIRS, and putting their face on it is what makes beat 2 unlike beat 4, where "
       "the face belongs to somebody else."),
      ("B2-D", "question first, bill as a footnote",
       '<div class="fz bw b2d"><p class="b2q">%s</p>%s<p class="b2foot">%s · %s</p></div>'
       % (q, votes3("b3v-col"), esc(S["bill_label"]), BT),
       ".b2d{justify-content:center;gap:22px}\n"
       ".b2q{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:36px;"
       "color:#EFECE4;text-align:center}\n"
       ".b2foot{font-size:13px;font-weight:700;line-height:1.5;color:#C8C2B4;text-align:center}",
       "The question dominates and the bill drops to a footnote.\nHonest cost: the player votes "
       "on a title they have barely read. Whether that is a bug or the point is a content call."),
      ("B2-E", "the slip you fill in",
       '<div class="fz bw b2e"><div class="b2slip"><span class="b2lab">%s</span>'
       '<p class="b2t">%s</p><span class="b2rule"></span><p class="b2q">%s</p>%s</div></div>'
       % (esc(S["bill_label"]), BT, q, votes3()),
       ".b2e{justify-content:center}\n"
       ".b2slip{flex:none;background:#D8C9A8;border:6px solid #fff;padding:18px 16px 16px;"
       "box-shadow:0 7px 0 rgba(0,0,0,.42);display:flex;flex-direction:column;gap:10px}\n"
       ".b2slip .b2lab{color:#4A4436}\n.b2slip .b2t{font-size:18px;color:#131310}\n"
       ".b2q{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:24px;"
       "color:#131310}\n.b2rule{height:2px;background:rgba(0,0,0,.18)}\n"
       ".b2e .b3v .vbtn{min-height:80px;font-size:19px}",
       "Everything on one card, like a form to complete. The most contained of the five and the "
       "easiest to carry the pinned answer alongside."),
    ):
        b_frame(oid, en, body.replace("</div>", "%s</div>" % b_pin(), 1) if False else
                ('%s%s' % (b_pin(), body)), css, note=note)

    # ---------------------------------------------------------------- BEAT 3
    BD = esc(B_ISS_T["bill_date"])
    for oid, en, body, css, note in (
      ("B3-A", "centred, title and date, nothing else",
       '<div class="fz bw b3a"><p class="b3t">%s</p><span class="b3d">%s</span></div>' % (BT, BD),
       ".b3a{justify-content:center;align-items:center;gap:18px}\n"
       ".b3t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:31px;"
       "line-height:1.2;text-align:center;color:#EFECE4;text-wrap:balance}\n"
       ".b3d{font-size:15px;font-weight:700;color:#131310;background:#FBF7EE;border-radius:20px;"
       "padding:5px 15px}",
       "Title and date, centred, and nothing else. The baseline the other four are measured "
       "against."),
      ("B3-B", "title as die-cut stickers",
       '<div class="fz bw b3b">%s<span class="b3d">%s</span></div>'
       % (letter_stickers(B_ISS_T["bill_title"][:9], 44, "ls-drop"), BD),
       ".b3b{justify-content:center;align-items:center;gap:26px}\n"
       ".b3d{font-size:15px;font-weight:700;color:#131310;background:#FBF7EE;border-radius:20px;"
       "padding:5px 15px}",
       "The title set as die-cut letter stickers. Only the first words fit at a size where the "
       "stroke does its work — a 9-character slice is shown, and bill_title runs far longer than "
       "that on most issues, so this option needs a short-title field that does not exist."),
      ("B3-C", "the record card",
       '<div class="fz bw b3c"><div class="b3card"><span class="b3f"></span>'
       '<p class="b3t">%s</p><span class="b3rule"></span><span class="b3d">%s</span></div></div>'
       % (BT, BD),
       ".b3c{justify-content:center}\n"
       ".b3card{flex:none;position:relative;background:#FBF7EE;border:6px solid #fff;padding:34px 20px 22px;"
       "box-shadow:0 7px 0 rgba(0,0,0,.42);display:flex;flex-direction:column;gap:14px}\n"
       ".b3f{position:absolute;top:0;left:0;right:0;height:16px;background:#C6BB9C}\n"
       ".b3t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;"
       "line-height:1.25;color:#131310}\n.b3rule{height:2px;background:rgba(0,0,0,.16)}\n"
       ".b3d{font-size:14px;font-weight:700;color:#4A4436}",
       "A filing card with a printed header strip. The only one of the five that looks like a "
       "record rather than a slide, which is what this beat actually is."),
      ("B3-D", "editorial, left-aligned, big",
       '<div class="fz bw b3d2"><p class="b3t">%s</p><span class="b3rule"></span>'
       '<span class="b3d">%s</span></div>' % (BT, BD),
       ".b3d2{justify-content:flex-end;gap:16px;padding-bottom:60px}\n"
       ".b3t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:37px;"
       "line-height:1.15;color:#EFECE4}\n"
       ".b3rule{height:3px;background:rgba(255,255,255,.28)}\n"
       ".b3d{font-size:15px;font-weight:700;color:#C8C2B4}",
       "Title set large and ranged to the reading edge with the date under a rule. Carries a long "
       "bill_title better than any of the others."),
      ("B3-E", "the most austere it can get",
       '<div class="fz bw b3e"><p class="b3t">%s<sup class="b3d">%s</sup></p></div>' % (BT, BD),
       ".b3e{justify-content:center}\n"
       ".b3t{font-size:19px;font-weight:700;line-height:1.6;color:#EFECE4}\n"
       ".b3d{font-size:11px;font-weight:700;color:#C8C2B4;margin-inline-start:6px}",
       "The honest floor: one line of type and a superscript date on an otherwise empty screen.\n"
       "THIS IS TOO LITTLE TO JUSTIFY A SCREEN. It is shown so the boundary is visible — at this "
       "weight the beat reads as a loading state, and the flow would be better served by folding "
       "the title into beat 2 or beat 4 than by spending a tap on it."),
    ):
        b_frame(oid, en, '%s%s' % (b_pin(), body), css, note=note)

    # ---------------------------------------------------------------- BEAT 4
    NM, PT = esc(BGV["name"]), esc(BGV["party"])
    note_line = '<p class="b4note">%s</p>' % esc(BGV_S1["note"])
    def b4(top, port_px, extra_cls="", stamp_cls="", axis=False, show_note=False, stamp=True):
        head = ('<div class="b4top"><div><h2 class="b4name">%s</h2>'
                '<p class="b4party">%s</p></div>%s%s%s</div>'
                % (NM, PT, '<div class="b4basis">%s</div>' % basis_pair(),
                   note_line if show_note else "", top))
        # THE STAMP IS THE VERDICT, so it does not exist while the player is
        # still predicting. It is drawn on the reveal panel only, in all five.
        return ('<div class="b4card %s">%s<div class="b4port">%s</div>%s</div>'
                % (extra_cls, head, b_halo(port_px),
                   vd_stamp(VD_PICK, VD_S1, "surp", stamp_cls, uid=extra_cls or "x")
                   if stamp else ""))
    P_ = votes3()
    A_ = gap_axis(0, 1)
    for oid, en, predict, reveal, css, note in (
      ("B4-A", "options above the portrait, stamp off the top corner",
       b4('<div class="b4slot">%s</div>' % P_, 196, "b4a", "vs-tl", stamp=False),
       b4('<div class="b4slot">%s</div>' % A_, 196, "b4a", "vs-tl"),
       ".b4a .b4top{padding-inline-end:92px}\n.vs-tl{top:-30px;left:-22px;bottom:auto}",
       "Options in the upper area, portrait bottom, stamp hanging off the TOP-LEFT corner.\n"
       "STAMP CONFLICT, resolved by inset: the top corners are the only free ones on a "
       "portrait-dominant card, and the options want the same band — so the whole top block is "
       "inset 64px from the leading edge and the stamp owns the corner it leaves.\n"
       "Note moved to beat 5; party stays, because a name without a party is not an identification."),
      ("B4-B", "options as a tray across the chest",
       b4('', 214, "b4b", "vs-tl", stamp=False).replace('<div class="b4port">',
          '<div class="b4port"><div class="b4tray">%s</div>' % P_),
       b4('', 214, "b4b", "vs-tl").replace('<div class="b4port">',
          '<div class="b4port"><div class="b4tray">%s</div>' % A_),
       ".b4b .b4top{padding-inline-end:92px}\n"
       ".b4b .b4tray{position:absolute;z-index:5;left:8px;right:8px;bottom:10px}\n"
       ".b4b .b4port{padding-bottom:132px}\n.vs-tl{top:-30px;left:-22px;bottom:auto}",
       "Options ON the portrait, but only across the chest — the tray is pinned to the card's "
       "bottom and the portrait is raised 118px so nothing ever crosses the chin line.\n"
       "STAMP CONFLICT: the top band carries only the name, so the top-left corner is free and "
       "the stamp takes it outright. Nothing is inset.\n"
       "Note to beat 5; party stays."),
      ("B4-C", "portrait offset, options in a column beside it",
       b4('<div class="b4col">%s</div>' % votes3("b3v-col"), 176, "b4c", "vs-bl", stamp=False),
       b4('<div class="b4slot">%s</div>' % A_, 176, "b4c", "vs-bl"),
       # .b4top is position:relative, so an absolute child anchored inside it
       # lands at the TOP of the card instead of where it was asked to go.
       ".b4c .b4top{position:static}\n"
       ".b4c .b4port{justify-content:flex-start;padding-inline-start:14px}\n"
       ".b4c .halo{left:auto;right:18px;translate:0 0;width:232px;height:232px}\n"
       ".b4c .b4col{position:absolute;z-index:5;left:12px;bottom:96px;width:148px}\n"
       ".b4c .b4col .vbtn{min-height:46px;font-size:17px}\n"
       # the axis needs the full width, and at the foot of the card it sits under
       # the portrait. In the reveal state it takes the top band instead — the
       # column is a predict-time device.
       ".b4c .b4slot{width:100%}\n"
       ".vs-bl{left:-22px;bottom:-30px;top:auto}",
       "The portrait moves off centre and the options take the column it vacates. Nothing "
       "overlaps anything.\nSTAMP CONFLICT: with both top corners free the stamp could go there, "
       "but it sits BOTTOM-LEFT under the options instead — the reveal reads better arriving from "
       "the same side the player was just looking at.\nNote to beat 5; party stays.\n"
       "Cost: the portrait is the smallest of the five at 176px."),
      ("B4-D", "stamp refuses the card entirely",
       b4('<div class="b4slot">%s</div>' % P_, 206, "b4d", "vs-out", stamp=False),
       b4('<div class="b4slot">%s</div>' % A_, 206, "b4d", "vs-out"),
       ".vs-out{left:-54px;bottom:auto;top:34%}\n.b4d .b4top{padding-inline-start:10px}",
       "STAMP CONFLICT, resolved by refusing the premise: the stamp does not take a corner at "
       "all. It hangs off the card's outer edge onto the ground, level with the shoulder, so it "
       "competes with neither the options above nor the face below.\n"
       "The largest portrait of the five, and the only one where the options keep the full width.\n"
       "Note to beat 5; party stays."),
      ("B4-E", "two-stage: the options become the axis",
       b4('<div class="b4slot">%s</div>' % P_, 200, "b4e", "", stamp=False),
       b4('<div class="b4slot">%s</div>' % A_, 200, "b4e", "vs-tl", show_note=True),
       ".b4e .b4top{padding-inline-end:92px}\n"
       ".vs-tl{top:-30px;left:-22px;bottom:auto}",
       "No corner is RESERVED while predicting. The other four inset their top block, raise "
       "the portrait or move the stamp off the card so its corner is kept clear even when it is "
       "empty; this one lets the options take the whole band and only makes room when the reveal "
       "lands and they collapse into the axis.\n"
       "STAMP CONFLICT: solved in time rather than in space, which is the only solution here that "
       "costs no layout.\nThis is the one option that KEEPS the note at beat 4 — it arrives with "
       "the stamp, after the guess, which is where an explanation belongs."),
    ):
        b_frame(oid, en,
                '%s<div class="b4pair"><span class="b5state">PREDICT</span>%s'
                '<span class="b5state">REVEAL</span>%s</div>' % (b_pin(), predict, reveal),
                css + "\n.b4pair{flex:1;display:flex;flex-direction:column;gap:10px}\n"
                ".b4pair .b4card{min-height:600px;flex:none}\n"
                ".b4basis{display:flex;align-items:center;gap:4px;flex-wrap:wrap;"
                "position:relative;z-index:6}\n"
                ".b4basis .ph{font-size:11px;padding:1px 6px 2px}",
                fh=1400, note=note,
                flag="basis — OPEN QUESTION FOR ROMAN AND TAMAR. «doc» is 61 of the 98 MK cards "
                     "and surfaces as the מתועד chip. «bloc» is the other 37 — 38% of every card "
                     "in the game — and has no label anywhere in data.js and no agreed UI. Two "
                     "whole issues (b2, m1) are bloc on every card. A chip that only ever appears "
                     "in one state tells the player nothing and quietly marks the other 37 as "
                     "ordinary. Both states are drawn here; the bloc label is an unwritten slot.")

    # ---------------------------------------------------------------- BEAT 5
    # EVERY option is drawn twice: r1, which has _tally, and e2, which has no
    # vote numbers at all. The no-tally state is not an edge case — it is 8 of
    # 16 issues, and three of those (b2, a2, s2) hide a count inside
    # bill_summary prose that no field exposes.
    TAL = B_ISS_T["_tally"]
    EXP_T, EXP_N = esc(B_ISS_T["tf_explain"]), esc(B_ISS_N["tf_explain"])
    SRC = ('<div class="b5src"><span>%s%s</span><span>%s</span></div>'
           % (esc(S["src_prefix"]), esc(B_ISS_T["source"]["name"]), esc(S["knesset_link"])))
    def tally_block():
        return ('<div class="b5tally"><span class="b5lab">%s</span>%s'
                '<span class="b5dash">–</span><span class="b5lab">%s</span>%s</div>'
                % (esc(S["v_for"]), numeral(str(TAL["for"]), "b5num", 40),
                   esc(S["v_against"]), numeral(str(TAL["against"]), "b5num", 40)))
    # the glossary, surfaced only here — after the guess. «דין רציפות» is in
    # r1's bill_title and its definition is in data.js; nothing is written.
    GT = "דין רציפות"
    assert GT in DATA["glossary"] and GT in B_ISS_T["bill_title"], GT
    def gloss_inline():
        return ('<p class="b5exp">%s<span class="gterm">%s</span>%s</p>'
                '<div class="gdef"><b>%s</b> — %s</div>'
                % (esc(B_ISS_T["bill_title"].split(GT)[0]), esc(GT),
                   esc(B_ISS_T["bill_title"].split(GT)[1]), esc(GT), esc(DATA["glossary"][GT])))
    W = '<span class="b5word">%s</span>' % esc(S["ans_t"])
    for oid, en, with_t, without_t, css, note, flag in (
      ("B5-A", "resolution, count-up, explanation, sources",
       '%s%s%s<p class="b5exp">%s</p>%s' % (W, tally_block(), "", EXP_T, SRC),
       '%s<div class="b5none">%s</div><p class="b5exp">%s</p>%s'
       % (W, ph("מה נכתב כשאין ספירה", "beat 5, no-tally: the line that replaces the count"),
          EXP_N, SRC),
       ".b5none{padding:14px 10px;border:2px dashed #6E6C63;border-radius:14px;text-align:center}",
       "The count-up sits between the resolution and the explanation.\nNO-TALLY STATE: the count "
       "block is replaced in place by a line of the same weight, so the layout does not collapse — "
       "but that line has no shipped string and nothing here invents one.", None),
      ("B5-B", "the tally as a proportion bar",
       '%s<div class="b5bar"><b style="width:%.0f%%"></b><i style="width:%.0f%%"></i></div>'
       '<p class="b5exp">%s</p>%s'
       % (W, 100*TAL["for"]/(TAL["for"]+TAL["against"]), 100*TAL["against"]/(TAL["for"]+TAL["against"]),
          EXP_T, SRC),
       '%s<p class="b5exp">%s</p>%s' % (W, EXP_N, SRC),
       ".b5bar{display:flex;height:38px;border:3px solid #131310;border-radius:12px;overflow:hidden}\n"
       ".b5bar b{background:#B6E521}.b5bar i{background:#FF3BC0}",
       "The count as a filled proportion rather than numerals.\nNO-TALLY STATE: the bar is simply "
       "absent and the explanation moves up — nothing gapes.",
       "COLOUR WARNING. This bar splits the vote into two coloured halves, which is colour coding "
       "VOTE DIRECTION — the one thing the board forbids. It is drawn so the trap is visible. "
       "Picking it means either finding a non-colour split or dropping the option."),
      ("B5-C", "explanation-led, tally as a chip",
       '%s<p class="b5exp">%s</p><span class="b5chip">%s %s%s%s</span>%s'
       % (W, EXP_T, esc(S["knesset"]), esc(S["passed"]), " ",
          numeral("%d-%d" % (TAL["for"], TAL["against"]), "", 15), SRC),
       '%s<p class="b5exp">%s</p>%s' % (W, EXP_N, SRC),
       ".b5chip{align-self:flex-start;font-size:14px;font-weight:700;color:#131310;"
       "background:#FBF7EE;border-radius:20px;padding:5px 14px}",
       "tf_explain carries the beat and the count is a chip beside it.\nNO-TALLY STATE: the chip "
       "is gone and NOTHING ELSE MOVES. The most robust of the five across both states, and the "
       "only one where the missing count is not visible as an absence.", None),
      ("B5-D", "the number is the screen",
       '%s<div class="b5huge">%s<span class="b5dash">–</span>%s</div><p class="b5exp">%s</p>%s'
       % (W, numeral(str(TAL["for"]), "b5big", 84), numeral(str(TAL["against"]), "b5big", 84),
          EXP_T, SRC),
       '%s<div class="b5huge b5dead">%s</div><p class="b5exp">%s</p>%s'
       % (W, ph("אין ספירה", "no count exists"), EXP_N, SRC),
       ".b5huge{display:flex;align-items:baseline;justify-content:center;gap:14px}\n"
       ".b5big{font-size:84px;color:#EFECE4}\n.b5dead{opacity:.5}",
       "The count at 84px, owning the screen.\nUNUSABLE. It works beautifully on the 8 issues "
       "that have _tally and has nothing to show on the other 8 — half the game. The no-tally "
       "panel below is what that actually looks like: a hole where the design was.",
       "MARKED UNUSABLE. This option only works with numbers, and 8 of 16 issues have none."),
      ("B5-E", "glossary-led: the term opens after the guess",
       '%s%s%s<p class="b5exp">%s</p>%s' % (W, gloss_inline(), tally_block(), EXP_T, SRC),
       '%s%s<p class="b5exp">%s</p>%s' % (W, gloss_inline(), EXP_N, SRC),
       "",
       "The bill title is re-shown with its glossary term live, and the definition opens under "
       "it — AFTER the guess, which is the only place a definition can go without helping the "
       "player answer.\nBoth states carry it, because the glossary has nothing to do with whether "
       "a vote was counted.",
       "22 glossary terms exist in data.js and the UI surfaces NONE of them. Measured: 14 terms "
       "occur somewhere in tf_explain / bill_summary / bill_title, reaching 14 of 16 issues — v2 "
       "and m2 get none. The other 8 terms (חוק ההסדרים, ועדת בדיקה, משמעת קואליציונית, אי-אמון, "
       "סטטוס-קוו, לימודי ליבה, רפורמה משפטית, הצהרת כנסת) occur in no issue text at all and "
       "would need to be triggered some other way or written out."),
    ):
        b_frame(oid, en,
                '%s<div class="b5pair"><span class="b5state">WITH TALLY · r1</span>'
                '<div class="b5panel"><div class="b5">%s</div></div>'
                '<span class="b5state">NO TALLY · e2</span>'
                '<div class="b5panel"><div class="b5">%s</div></div></div>'
                % (b_pin(), with_t, without_t),
                css + "\n.b5pair{flex:1;display:flex;flex-direction:column;gap:9px;"
                "padding-top:26px}\n"
                ".b5panel{background:rgba(0,0,0,.16);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.10);"
                "padding:14px 12px;width:calc(100% + 32px);margin:0 -16px}\n"
                ".b5dash{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;"
                "color:#EFECE4}",
                fh=1010, note=note, flag=flag)

# ====================== 18 · INTRO OPTIONS — building + chair ==============
# Two supplied assets. The building's sky was removed here (tools/sky_cut.py);
# what survived the cutout, and how, is in that file and on the canvas.
#
# CHECKED, and said on canvas: this is the BUILDING, photographed from the
# plaza in three-quarter view with its flagpoles, plaza paving and trees — not
# the institutional mark. The Knesset's own identity is the menorah-and-olive-
# branches emblem, and the building is also widely flattened into a symmetrical
# straight-on colonnade silhouette. Neither is what this is: it has a viewpoint,
# a foreground and a horizon, and it is asymmetric.
#
# SIZE RULE, as everywhere on this board: nothing under 150px is served by a
# source over 150px. The chair has a 128 and a 300; the building renders at the
# full frame width (390, and 360 on the narrow pass) and has one 390 export.
# THE את/ה LINE. Checked in the code before writing it, not assumed:
#   index.html:56   <section class="screen active" id="intro">  — the intro is
#                   the FIRST screen and is active on load.
#   app.js:97       player = { ..., gender:"" }  — gender starts EMPTY.
#   app.js:151      g(m,f){ return player.gender==='f' ? f : m; }
#   app.js:237      gender is only set by the chips on the AVATAR screen, which
#                   comes AFTER the intro (or defaulted to 'm' at 179/182).
# So the intro renders BEFORE gender is known, and g() there would return the
# masculine form for every player, silently, including women. THE SLASH FORM IS
# THE CORRECT ONE ON THIS SCREEN — not a shortcut, a consequence of the flow.
# The words themselves are new copy and are marked as such.
INTRO_LINE = ph("את/ה הח״כ ה-121", "Intro line — the player as the 121st MK")

INTRO_ART = {"b390": "knesset_building_390.webp",
             "c128": "knesset_chair_128.webp",
             "c300": "knesset_chair_300.webp"}

# THE ARTWORK'S OWN PROPORTION, not a resize handle. The chair is a real object
# and keeps the shape it was drawn at. Read off the trimmed asset rather than
# typed in, so it cannot drift: knesset_chair_300.webp is 300x350 and its alpha
# bounding box fills the file, giving 300/350 = 0.8571. One constant, every
# chair on the board.
CHAIR_AR = 300 / 350

def chair_box(px):
    """The one place a chair's height is decided. Height is never passed in."""
    return px, round(px / CHAIR_AR), ("knesset_chair_128.webp" if px < 150
                                      else "knesset_chair_300.webp")

def i_chair(px, cls=""):
    w, h, src = chair_box(px)
    size = "width:%dpx;height:%dpx" % (w, h)
    return ('<img class="ichair %s" src="%s" alt="" style="%s" '
            'data-px="%d" data-file="%s">'
            % (cls, src, size, px, "128" if px < 150 else "300"))

def b2_chair(px):
    w, h, src = chair_box(px)
    return ('<img class="b2chair" src="%s" alt="" style="width:%dpx;height:%dpx" '
            'data-px="%d" data-file="%s">'
            % (src, w, h, w, "128" if px < 150 else "300"))

def i_building(cls=""):
    return ('<img class="ibuild %s" src="%s" alt="" data-px="390" data-file="390">'
            % (cls, INTRO_ART["b390"]))

INTRO_CSS = """
.iw{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;
  position:relative;padding-top:22px}
.iw .intro-tag{flex:none}
.intro-line{flex:none;position:relative;z-index:5}
.ititle{display:flex;flex-direction:column;align-items:center;gap:2px;position:relative;z-index:4}
/* 26px is Lion's, stated in the brief. No saved canvas edit exists on either
   published board to read it off, so it is taken from what he said. */
.isub{margin-top:16px;font-size:26px;font-weight:700;color:#EFECE4;position:relative;z-index:4}
.ipara{margin-top:10px;max-width:30ch;font-size:16px;font-weight:700;line-height:1.55;
  color:#EFECE4;position:relative;z-index:4}
.icta{margin-top:auto;margin-bottom:34px;width:280px;font-size:26px;
  position:relative;z-index:6}
.inote{margin-top:12px;margin-bottom:6px;font-size:13px;font-weight:700;color:#2A2418;
  position:relative;z-index:6}
/* on the one option with no building under it, the caption is back on the dark
   ground and takes the ground ink again */
.iw.i-dark .inote{color:#BEB9AC}
/* THE BUILDING IS SCENERY, NOT A STICKER — no white die-cut, no shadow, and it
   bleeds off the bottom edge of the frame rather than sitting on it. */
.ibuild{position:absolute;left:0;right:0;bottom:0;width:100%;display:block;z-index:1;
  pointer-events:none}
.istage{position:absolute;left:-16px;right:-16px;bottom:-20px;top:0;z-index:1;
  pointer-events:none;overflow:hidden}
.istage .ibuild{left:0;right:0;width:100%}
/* the chair keeps the die-cut */
.ichair{display:block;position:relative;z-index:3;
  filter:url(#dcw-%VAR%) drop-shadow(0 4px 0 rgba(0,0,0,.3))}
/* --- what fills the band between the title and the building --------------- */
/* 1. the board's own dot grid, inherited — INT-A and INT-D use it unchanged  */
/* 2. a flat field: one tone, no texture at all                              */
.ifield::before{content:"";position:absolute;left:-16px;right:-16px;top:58px;bottom:-20px;
  z-index:0;background:#38352F}
/* 3. a plaza continuation: the stone tone of the paving, fading up into the
      ground so the building's own foreground carries on past its cutout edge */
/* INT-E's ground, now INT-D's: the paving tone carried up out of the artwork so
   the building's foreground does not stop dead at the cutout edge. Same
   treatment, same tone — nothing was re-picked. */
.iplaza::before{content:"";position:absolute;left:-16px;right:-16px;bottom:0;height:62%;
  z-index:0;background:linear-gradient(to top,#6E6242 0%,#514A38 38%,rgba(64,62,58,0) 100%)}
.ihold{position:relative;width:100%;display:flex;justify-content:center;align-items:flex-end}
/* anchored to the frame's bottom edge, like the building, so the chair stands
   ON the plaza instead of hovering over it */
.iground{position:absolute;z-index:3;bottom:0;left:0;right:0;display:flex;
  justify-content:center;align-items:flex-end;pointer-events:none}
"""

def board_press_state():
    """P-C at rest and pressed, side by side, so the press is checkable rather
    than described. The pressed one carries .is-pressed, which is the same
    declaration :active uses — one rule, two ways to trigger it."""
    def one(lbl, cls):
        return ('<div class="ps-cell"><span class="cs-id">%s</span>'
                '<button type="button" class="sbtn %s">%s</button></div>'
                % (lbl, cls, esc(S["intro_cta"])))
    BOARDS.append(dict(file="PressState.dc.html", var="ps", num="P-C",
        he="P-C states", en="P-C · rest and pressed", note="", fh=560,
        body=('  <div class="fz psw">%s%s'
              '<p class="cs-spec">%s</p></div>'
              % (one("REST", ""), one("PRESSED", "is-pressed"),
                 esc("Face translates down 6px; the offset copy of the edge goes to 0. "
                     "80ms linear, both properties. No mustard anywhere — the white "
                     "stroke and its keyline are the whole treatment."))),
        css="""
.psw{flex:1;display:flex;flex-direction:column;justify-content:center;gap:34px;padding:0 6px}
.ps-cell{display:flex;flex-direction:column;align-items:center;gap:10px}
.ps-cell .sbtn{width:260px;font-size:24px}
.psw .cs-spec{text-align:center;direction:ltr}
"""))
    FRAME_NOTES["PressState.dc.html"] = (
        "P-C, the primary, in both states at true size.\n"
        "REST: yellow face, 3px white stroke, a 4.6px dark keyline outside it, and the same "
        "edge repeated 6px below as the extrusion.\n"
        "PRESSED: the face moves down by exactly that 6px and the offset copy collapses to "
        "0, so the button ends up flush with the surface rather than merely darker. 80ms "
        "linear on transform and box-shadow together.\n"
        "The mustard #C7A408 extrusion is gone from the board entirely — the white stroke "
        "replaced it rather than joining it.", None)

def board_intro_options():
    T1 = letter_stickers("הח״כ", 84, "ls-drop ls-messy", messy=True)
    T2 = letter_stickers("ה-121", 84, "ls-drop ls-messy", messy=True)
    TAG, SUB = esc(S["intro_tag"]), esc(S["intro_sub"])
    PARA, CTA, NOTE = esc(S["intro_para"]), esc(S["intro_cta"]), esc(S["intro_note"])
    def shell(oid, extra_cls, inner, css, note, fh=880, chosen=False):
        # THE CHOSEN INTRO drops the caption line under the button entirely and
        # swaps the HaMigdalor tag for the את/ה line. The archived four keep the
        # shipped tag and caption so they stay a record of what was compared.
        head = ('<p class="intro-line">%s</p>' % INTRO_LINE) if chosen \
               else ('<p class="intro-tag">%s</p>' % TAG)
        tail = "" if chosen else ('<p class="inote">%s</p>' % NOTE)
        body = ('  <div class="fz iw %s">%s%s'
                '<button type="button" class="sbtn icta">%s</button>%s</div>'
                % (extra_cls, head, inner, CTA, tail))
        BOARDS.append(dict(file="INT%s.dc.html" % oid[-1], var="int" + oid[-1].lower(),
            num=oid, he=oid, en=oid, note="", fh=fh,
            body='<span class="cs-id b-tag">%s</span>%s' % (oid, body),
            css=INTRO_CSS + css))
        FRAME_NOTES["INT%s.dc.html" % oid[-1]] = (note,
            "Supplied illustrations. Provenance and licence NOT verified — nothing came "
            "with either file. Same flag as the MK illustrations.")

    title = '<div class="ititle">%s%s</div>' % (T1, T2)
    copy_ = '<p class="isub">%s</p><p class="ipara">%s</p>' % (SUB, PARA)

    # ---- INT-A: chair small, building dominant ---------------------------
    shell("INT-A", "iplaza",
          '%s%s<div class="istage">%s</div><div class="iground ia-g">%s</div>'
          % (title, copy_, i_building(), i_chair(96, "ia-chair")),
          ".ia-g{padding-bottom:96px;padding-inline-start:168px}\n.iw.iplaza .ibuild{bottom:0}",
          note="Chair small, building dominant — the chair is a detail IN the scene "
               "rather than the subject. The building reads as a place.\n"
               "GROUND: plaza continuation. A stone-toned gradient rising out of the "
               "building's own paving so the foreground does not stop dead at the cutout "
               "edge. This is the alternative to the dot grid that costs nothing.\n"
               "The chair is 96px and is served by the 128px export.")
    # ---- INT-B: chair large and central, building a strip ----------------
    shell("INT-B", "ifield",
          '%s%s<div class="ihold ib-hold">%s</div><div class="istage ib-stage">%s</div>'
          % (title, copy_, i_chair(228, "ib-chair"), i_building()),
          ".ib-hold{margin-top:18px;height:262px}\n.ib-chair{margin-bottom:6px}\n"
          ".ib-stage{top:auto;height:104px;bottom:-20px}\n"
          ".ib-stage .ibuild{bottom:-168px;width:132%;left:-16%}",
          note="Chair large and central, building cropped to a 104px strip along the "
               "bottom — the chair becomes the game's emblem and the building is only "
               "there to place it.\nThe strip is the SAME asset, scaled up 132% and "
               "anchored to its bottom, so the plaza fills the band and the roofline is "
               "out of frame. Nothing is cropped away from the artwork itself.\n"
               "GROUND: flat field, one tone, no texture — with a large object in the "
               "middle the dot grid was competing with it.")
    # ---- INT-C: chair only ------------------------------------------------
    shell("INT-C", "i-dark",
          '%s%s<div class="ihold ic-hold">%s</div>' % (title, copy_, i_chair(252, "ic-chair")),
          ".ic-hold{margin-top:22px;height:300px}\n.ic-chair{margin-bottom:10px}",
          note="Chair only, no building — the emptiest option, and the only one where the "
               "intro makes no claim about a place at all.\nGROUND: the board's own dot "
               "grid, unchanged. With one object and nothing behind it, the grid is what "
               "stops the screen reading as a blank.\nAlso the cheapest: one asset, no "
               "cutout, no provenance question about the building.")
    # ---- INT-D: chair overlapping the title -------------------------------
    shell("INT-D", "iplaza",
          '<div class="id-comp">%s%s</div>%s<div class="istage">%s</div>'
          % (title, i_chair(278, "id-chair"), copy_, i_building()),
          ".id-comp{position:relative;z-index:5;display:flex;flex-direction:column;"
          "align-items:center;margin-top:6px}\n"
          ".id-chair{margin-top:-64px}\n"
          ".iw .isub{margin-top:20px}\n.iw .ibuild{bottom:0}",
          chosen=True,
          note="The chair sits ON the title so the two read as one composite sticker — "
               "the chair's die-cut edge overlapping the letters' die-cut edge is the "
               "whole idea, and it only works because both carry the same white cut.\n"
               "GROUND: dot grid. The composite is busy enough that a second treatment "
               "underneath would fight it.\nCosts the most vertical space of the five.")
    # ---- INT-E: my own -----------------------------------------------------
    shell("INT-E", "iplaza",
          '%s%s<div class="istage">%s</div><div class="iground ie-g">%s</div>'
          % (title, copy_, i_building("ie-build"), i_chair(150, "ie-chair")),
          ".ie-g{padding-bottom:104px;padding-inline-end:126px}\n"
          ".ie-build{width:150%;left:-28%;bottom:-8px}",
          note="MY OWN. The building is pushed in close and off-centre so the colonnade "
               "runs out of frame on both sides, and the chair stands ON the plaza rather "
               "than floating over it — one object standing in a place, at the scale a "
               "person would be.\nIt is also the option that most clearly cannot be "
               "mistaken for an emblem: the frame cuts the building, so there is no "
               "symmetrical silhouette to read as a mark.\nGROUND: plaza continuation.")

# ========================= 19 · v12 ROUND BEATS, developed =================
V12_CSS = """
.vw{flex:1;display:flex;flex-direction:column;position:relative;padding-top:8px}
.v-tag{position:absolute;z-index:70;top:10px;left:16px;width:fit-content}
/* ---------- BEAT 1: the card, its stack, and the swipe ---------- */
.b1deck{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;padding-top:26px}
.b1stack{position:relative;width:326px;height:520px}
/* a loose, slightly chaotic stack behind the front card. Rotation lives here and
   nowhere else on the board: these are physical cards in a pile, which is the one
   thing the no-rotation rule was never about. */
.b1back{position:absolute;inset:0;background:#F3EAD0;border:6px solid #fff;
  box-shadow:0 6px 0 rgba(0,0,0,.34)}
.b1back:nth-child(1){transform:translate(-9px,-14px) rotate(-3.4deg)}
.b1back:nth-child(2){transform:translate(11px,-9px) rotate(2.6deg)}
.b1back:nth-child(3){transform:translate(-4px,-4px) rotate(-1.2deg)}
.b1front{position:absolute;inset:0;background:#FFF3CE;border:7px solid #fff;
  box-shadow:0 9px 0 rgba(0,0,0,.42),0 20px 30px rgba(0,0,0,.3);
  display:flex;flex-direction:column;overflow:hidden}
/* THE TOPIC GRAPHIC IS PART OF THE CARD — a band at its top, not a sticker over
   its edge. The artwork itself is not drawn yet. */
.b1art{flex:none;height:186px;background:#E2D8B8;border-bottom:4px solid #131310;
  display:grid;place-items:center;position:relative}
.b1slot{direction:ltr;font-size:11px;font-weight:800;letter-spacing:.06em;color:#5A5238;
  text-align:center;line-height:1.5;padding:0 18px}
.b1claim{flex:1;display:grid;place-items:center;padding:16px 18px;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:27px;
  line-height:1.18;color:#131310;text-align:center;text-wrap:balance}
/* the card mid-swipe, sliding off to one side */
.b1swipe{position:absolute;top:0;bottom:0;width:326px;background:#FFF3CE;
  border:7px solid #fff;box-shadow:0 9px 0 rgba(0,0,0,.3);opacity:.62;
  display:grid;place-items:center}
.b1swipe span{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;
  color:#131310}
/* THE PREVIEW, Reigns-style, in a top corner. NO COLOUR CODING: both answers get
   the same ink, the same plate, the same size. It says which WORD the drag is
   heading to, never which one is good. */
.b1prev{position:absolute;z-index:8;top:14px;display:flex;align-items:center;gap:8px;
  background:#FBF7EE;border:3px solid #fff;border-radius:20px;padding:6px 14px 8px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5),0 4px 0 rgba(0,0,0,.34)}
.b1prev b{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:22px;
  color:#131310}
.b1prev i{font-style:normal;font-size:11px;font-weight:700;color:#5A5238;direction:ltr}
.b1ans{display:flex;gap:10px;width:326px;margin-top:16px}
.b1ans .vbtn{flex:1;font-size:24px;min-height:60px;background:#fff;color:#131310;
  box-shadow:0 0 0 2.5px rgba(0,0,0,.55),0 5px 0 rgba(0,0,0,.4)}
.b1hint{margin-top:9px;font-size:12px;font-weight:700;color:#BEB9AC;direction:rtl}
/* ---------- BEAT 2: a blurred overlay over the live round ---------- */
.b2under{position:absolute;inset:0;z-index:0;display:flex;flex-direction:column;
  align-items:center;padding:22px 16px 0;gap:12px;overflow:hidden}
.b2ov{position:absolute;z-index:5;left:0;right:0;
  -webkit-backdrop-filter:blur(16px) saturate(.9);backdrop-filter:blur(16px) saturate(.9);
  background:rgba(30,28,25,.58);display:flex;flex-direction:column;align-items:center;
  padding:22px 16px 20px;gap:14px}
.b2-full{top:0;bottom:0;justify-content:center}
.b2-sheet{bottom:0;border-top:5px solid #fff;box-shadow:0 -6px 0 rgba(0,0,0,.4)}
.b2q{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:29px;
  color:#EFECE4;text-align:center}
.b2t{font-size:15px;font-weight:700;line-height:1.45;color:#D8D2C4;text-align:center;
  max-width:30ch}
.b2me{display:block}
.b2chair{display:block;filter:url(#dcw-%VAR%) drop-shadow(0 4px 0 rgba(0,0,0,.3))}
.b2av{width:96px;height:96px}
/* ---------- BEAT 4: portrait to the card edges, chips over the head ------- */
.v4card{--mk-port-top:96px;
  /* derived, not typed: a chip paints --ring-chip outside its own box, so
     the gap has to pay for two of those before any daylight shows. Same
     three tokens as prototype/hachach.css, same arithmetic. */
  --gap-visible:9px;--ring-chip:4.6px;
  --gap-chip:calc(var(--gap-visible) + 2 * var(--ring-chip));
  position:relative;width:340px;min-height:620px;flex:none;overflow:hidden;
  background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.05) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.05) 0 1px,transparent 1px 27px),#D8C9A8;
  border:5px solid #fff;
  box-shadow:0 0 0 2px rgba(0,0,0,.55),0 6px 0 rgba(0,0,0,.42)}
/* TOP-ANCHORED, and this is the rule for the whole set rather than a fix for
   one card. Every export now puts the crown 13px into a 533px file (2.4%, and
   the spread across the six is 4px), so anchoring the slot's TOP puts every
   crown at the same y on every card — 96px below the card's top edge, which is
   6px of headroom under the party line.
   THE BOTTOM IS THE VARIABLE EDGE. A figure that runs long loses its jacket,
   never its head. Deri is the case that forced it: his crop was positioned off
   a mis-detected eyeline and the top of his head was cut off in the exported
   FILE, before the card ever saw it. */
.v4port{position:absolute;left:50%;translate:-50% 0;top:var(--mk-port-top);bottom:auto;
  width:118%;display:block;filter:drop-shadow(0 2px 0 rgba(0,0,0,.18))}
.v4halo{position:absolute;bottom:-40px;left:50%;translate:-50% 0;width:330px;height:330px;
  border-radius:50%;background:#C0B190}
/* TREATMENT (a), NOW THE CARD ITSELF. The name used to start 76px down, with
   an empty band of kraft above it that did nothing. It starts at 18px now —
   13px inside the card's 5px border, which is breathing room rather than a
   band. Nothing below moves: every other element on this card is anchored to
   its bottom edge. (b), cutting the card shorter, is archived — it truncated
   the kippah and would have cost 9% of portrait scale to undo. */
.v4id{position:absolute;z-index:6;top:18px;right:14px;left:14px;text-align:right}
.v4name{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:38px;
  line-height:1;color:#131310;
  /* the stamp crosses the card, so the name is given its own plate rather than
     relying on the kraft showing through */
  background:rgba(216,201,168,.86);display:inline-block;padding:2px 10px 4px;
  box-shadow:0 0 0 2px rgba(216,201,168,.86)}
.v4party{font-size:15px;font-weight:700;color:#3E3627;display:inline-block;
  background:rgba(216,201,168,.86);padding:1px 8px 2px;margin-top:3px}
/* the prediction chips sit OVER the head. They stay legible on their own fill
   and border — the portrait is never faded. */
/* THE CHIPS MOVE TO THE FOOT. At 390px that is inside the thumb's arc; over the
   head it was not. Name and party stay at the top.
   COLLISION CHECK, and the answer is that there is none: the chips exist only
   while predicting and the stamp only after the reveal, so they are never on
   screen together. In the landed state the same band carries the axis, whose
   top edge sits at 520px against the stamp's bottom at 508 — 12px clear. */
/* THE GAP IS 18px, and the number that matters is not 18. Each chip carries a
   3px white ring and a 4.6px keyline, so 9.2px of the gap is spent on the two
   chips' own edges: at the old 8px the keylines were 1.2px from touching and
   the row read as one segmented control. 18px leaves 8.8px of kraft actually
   visible between two chips, which is what makes them three targets.
   The chips are flex:1, so the gap comes out of chip width, not out of the row:
   93px wide and 52px tall at 390, 86x52 in a 310px card. Both well past 44. */
.v4pred{position:absolute;z-index:7;bottom:12px;left:12px;right:12px;display:flex;
  gap:var(--gap-chip)}
/* THE GAP HAS TO GO ON .b3v, AND THIS IS WHY IT DID NOT WORK BEFORE.
   votes3() emits <div class="b3v"><button class="vbtn">x3</div>, so .v4pred has
   exactly ONE child. Setting the gap on .v4pred spaced a one-child row and moved
   nothing; the chips kept .b3v's own 9px. (Beat 1's two answers ARE direct
   children of .v4pred, which is why those really were gapped and hid it.)
   18px, not 9px, because of what a chip paints OUTSIDE its own box: 3px of white
   ring and 4.6px of keyline on every side. Two neighbours spend 9.2px of any gap
   on their own edges, so at 9px the visible gap is MINUS 0.2px and the keylines
   overlap — which is exactly how it rendered. 18 - 9.2 = 8.8px of daylight, the
   same as beat 2's, where the button has no outward ring at all and its 9px
   shows as a full 9px.
   Scoped to .v4pred so no other .b3v row moves: every one of those uses the base
   .vbtn, which has no ring, and is already correct at 9px. */
.v4pred .b3v{gap:var(--gap-chip)}
/* ---------- THE PILE: the rest of the round, sitting under the front card ---
   Every card behind is a BACK — kraft, grid, keyline, nothing else. No portrait,
   no name, nothing readable, because the whole point of the beat is that the
   next MK is unknown until they arrive.
   THE GEOMETRY IS NOT DECORATIVE. Each back pivots about the front card's BOTTOM
   CENTRE, so the fan opens upward and the bottom of the stack stays tight. That
   is deliberate: the bottom half of the card is where the stamp hangs (250px at
   bottom:-58, 190px at bottom:112) and where the axis sits (bottom:10). Pivoting
   from the foot keeps every back out of both. No back drops below the front
   card's bottom edge, and the largest sideways excursion is 21px against the
   25px of frame margin either side.
   The angles and offsets are irregular on purpose — a hand-worked deck, not a
   symmetrical fan. */
.v4pile{position:absolute;z-index:0;inset:0;pointer-events:none}
.v4pile i{position:absolute;left:0;top:0;right:0;bottom:0;display:block;
  transform-origin:50% 100%;
  background:
    repeating-linear-gradient(90deg,rgba(34,31,23,.06) 0 1px,transparent 1px 27px),
    repeating-linear-gradient(rgba(34,31,23,.06) 0 1px,transparent 1px 27px),#C4B48F;
  border:5px solid #F4EFE1;
  box-shadow:0 0 0 2px rgba(0,0,0,.55),0 5px 0 rgba(0,0,0,.30)}
/* Indexed from the BACK of the list so the count can change without the fan
   changing shape: the last back is always the one nearest the front card, and
   with one card left it is that quiet 0.9deg and nothing else. DOM order is
   deepest-first so the paint order matches the physical order. */
/* EVERY BACK LEANS THE SAME WAY, and that is the fix for a real collision the
   render caught: with the fan opening both ways, one back's left edge came out
   under the stamp's overhang — 71px of it, in a strip at x 17..27. Rotating all
   of them clockwise about the bottom centre pins the bottom-left corner (it
   moves right by 170(1-cos2deg) = 0.1px) and throws every sliver to the RIGHT and
   the TOP, which is where nothing else is. The stamp's corner is left alone by
   construction rather than by luck.
   The deepest back is held 3px inside the frame's clip edge: at 2deg its corner
   landed exactly on 390px and read as a cut rather than as a card.
   The looseness is in the amounts, not the direction: the third back leans LESS
   than the second and sits higher, so the stack is hand-made rather than
   stepped. Largest excursion 620*sin(2deg) + 3 = 25px, against 25px of frame. */
.v4pile i:nth-last-child(1){transform:translate(2px,-7px) rotate(.9deg);filter:brightness(.99)}
.v4pile i:nth-last-child(2){transform:translate(3px,-17px) rotate(1.7deg);filter:brightness(.95)}
.v4pile i:nth-last-child(3){transform:translate(2px,-22px) rotate(1.4deg);filter:brightness(.9)}
.v4pile i:nth-last-child(4){transform:translate(2px,-32px) rotate(1.85deg);filter:brightness(.85)}
.v4card{z-index:1}
/* ---------- THE TOP BAND, two treatments -------------------------------- */

/* (b) the card's top is cut away. The portrait, the chips, the axis and the
       stamp are all anchored to the card's BOTTOM, so none of them move — the
       card simply stops 58px lower down. */
.v4top-b .v4card{min-height:562px}
.v4top-b .v4id{top:18px}
.v4pred .vbtn{flex:1;min-height:52px;font-size:19px;background:#FBF7EE;
  box-shadow:0 0 0 3px #fff,0 0 0 var(--ring-chip) rgba(0,0,0,.62),
             0 4px 0 rgba(0,0,0,.45)}
"""

OPEN_ITEMS = (
    ("LIVE APP", "Vote buttons are colour-coded at currentStep===2 — green for בעד, red "
     "for נגד, white for נמנע, with emoji. That is vote-direction colour coding in the "
     "shipped product, and it is the one thing this whole board forbids.", "Roman"),
    ("LIVE DATA", "mode:'stance' on g2 and v2. Those two issues are not votes at all — "
     "they are stated positions — so «how did they vote» is the wrong question on them.",
     "Tamar"),
    ("basis", "«bloc» is 37 of the 98 MK cards — 38% — and has no definition anywhere in "
     "data.js and no agreed UI. Two issues (b2, m1) are bloc on every card. The מתועד chip "
     "only ever appears in the other state, so it silently marks 37 cards as ordinary.",
     "Roman + Tamar"),
    ("v1", "tf_answer is «partial» on v1, but the claim UI has two buttons. Either the "
     "third state gets a design or the field needs a different value.", "Roman"),
    ("_tally", "Structured on 8 of 16 issues. Three more (b2, a2, s2) carry a count inside "
     "bill_summary PROSE — «59 מול 52» — that no field exposes. Five (e2, g1, g2, v2, m1) "
     "have no vote numbers at all. That is three states, not two.", "Roman"),
    ("AVATARS", "data.js carries 8 finished preset avatars; app.js sets player.avatarId to "
     "the first at startup and never reads it again — dead code, and the self-test still "
     "asserts there are 8. The live builder's options are hardcoded SVG branches inside "
     "buildAvatarSvg, so adding one is code, not data.", "Roman"),
    ("VERDICT COPY", "Three strings, unwritten. «טעית» is out — the Knesset surprised the "
     "player, they did not fail — and «אמת» cannot double as a verdict when it is already "
     "a claim answer. Plus the stamp's ring text.", "Tamar"),
    ("BEAT 1 STAGING", "A chyron reports, a poster declares, bare type states, a held card "
     "confides. Each frames who is speaking before the player answers.", "Tamar"),
    ("INTRO LINE", "The את/ה line is placeholder. It must stay a slash form: the intro is "
     "the first screen and renders BEFORE gender is set, so g() would return masculine for "
     "every player.", "Tamar"),
    ("LICENCE", "No provenance came with the Ben Gvir illustrations, the chair, or the "
     "building. Nothing on this board can ship until that is settled.", "Lion, then Tamar"),
    ("RTL SWIPE", "Whether swipe-toward-right means אמת in Hebrew, or inverts. Both "
     "mappings are built as one variable and both are rendered.", "playtest"),
    ("GLOSSARY", "22 terms in data.js, surfaced nowhere in the UI. 14 of them occur in "
     "issue text, reaching 14 of 16 issues; the other 8 appear in no issue text at all.",
     "Tamar"),
)

def board_open():
    rows = "".join(
        '<div class="op-row"><div class="op-h"><span class="op-k">%s</span>'
        '<span class="op-w">%s</span></div><p class="op-b">%s</p></div>'
        % (esc(k), esc(who), esc(body)) for k, body, who in OPEN_ITEMS)
    BOARDS.append(dict(file="OpenItems.dc.html", var="open", num="OPEN",
        he="Open items", en="OPEN — everything still undecided", note="", fh=1760,
        body='  <div class="fz opw"><h2 class="op-t">OPEN</h2>%s</div>' % rows,
        css="""
.opw{flex:1;display:flex;flex-direction:column;gap:11px;padding:8px 0 10px;direction:ltr}
.op-t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:30px;
  color:#EFECE4;letter-spacing:.06em}
.op-row{border-top:1.5px solid rgba(255,255,255,.16);padding-top:8px}
.op-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.op-k{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:12px;
  letter-spacing:.1em;color:#131310;background:#FFD60A;border-radius:20px;padding:2px 9px 3px}
.op-w{font-size:11px;font-weight:800;letter-spacing:.06em;color:#FF3BC0}
.op-b{margin-top:5px;font-size:12px;font-weight:700;line-height:1.5;color:#D8D2C4}
"""))
    FRAME_NOTES["OpenItems.dc.html"] = (
        "Every outstanding question on one frame, with who owns it, so it can go to Roman "
        "and Tamar without hunting the board.\n"
        "The first six are findings in the SHIPPED app and its data, not design questions — "
        "they were turned up by reading app.js and data.js while building these screens, and "
        "each one changes what a screen can honestly show.", None)

def board_v16():
    # ------------------------------------------------------------ BEAT 1
    CL = esc(B_ISS_T["tf"])
    T, F = esc(S["ans_t"]), esc(S["ans_f"])
    stack = "".join('<div class="b1back"></div>' for _ in range(3))
    slot = ph("איור חוק הגיוס — ייכנס בנפרד",
              "Topic graphic slot — a conscription-law illustration is in production")
    def b1(toward, side, label):
        """`toward` is the word the current drag is heading to. `side` is which
        edge the card is being dragged toward. The MAPPING between them is the
        thing the playtest has to settle, so it is one variable and the frame is
        rendered both ways."""
        prev_side = "right:14px" if side == "right" else "left:14px"
        sw = ("left:-250px" if side == "left" else "right:-250px")
        return ('<div class="fz vw"><div class="b1deck">'
                '<div class="b1stack">%s'
                '<div class="b1swipe" style="%s"><span>%s</span></div>'
                '<div class="b1front"><div class="b1art"><p class="b1slot">%s</p></div>'
                '<p class="b1claim">%s</p></div>'
                '<div class="b1prev" style="%s"><i>%s</i><b>%s</b></div>'
                '</div>'
                '<div class="b1ans"><button type="button" class="vbtn">%s</button>'
                '<button type="button" class="vbtn">%s</button></div>'
                '<p class="b1hint">%s</p>'
                '</div></div>'
                % (stack, sw, toward, slot, CL, prev_side, esc(label), toward, T, F,
                   ph("הסבר קצר: החלקה או הקשה",
                      "Beat 1: the line that says both swipe and tap work")))
    for oid, toward, side, label, note in (
      ("B1-SWIPE-R", T, "right", "DRAG →",
       "MAPPING A: dragging toward the RIGHT edge is heading to אמת.\\n"
       "This is the mapping most swipe games ship, and it is exactly what an RTL "
       "playtest has to confirm or invert — in a right-to-left reading order the "
       "«forward» edge is the left one, so the habit may not transfer."),
      ("B1-SWIPE-L", T, "left", "← DRAG",
       "MAPPING B: dragging toward the LEFT edge is heading to אמת — the same card, "
       "the same preview, the inverse mapping.\\n"
       "Rendered so the pair can go into the test together. In the build this is ONE "
       "variable, not two layouts."),
    ):
        BOARDS.append(dict(file="V12%s.dc.html" % oid.replace("-", ""),
            var="v12" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 1 · " + oid, note="", fh=980,
            body='%s<span class="cs-id v-tag">%s</span>%s' % (BGV_DEFS, oid, b1(toward, side, label)),
            css=COMP_CSS + BEATS_CSS + V12_CSS))
        FRAME_NOTES["V12%s.dc.html" % oid.replace("-", "")] = (
            "B1-B developed: the card is much larger, the topic graphic is a band inside "
            "the card rather than a sticker over its edge, and a loose stack of further "
            "cards sits behind it.\\n" + note +
            "\\nTHE PREVIEW DOES NOT COLOUR-CODE. Both answers get the same plate, the same "
            "ink and the same size — it names the word the drag is heading to, never which "
            "one is the good one.\\n"
            "The two buttons stay below and stay visually identical: white face, black ink, "
            "same box. Swipe is additive; tapping is never removed.\\n"
            "The topic graphic is a labelled slot — the conscription-law illustration is "
            "being produced separately.", None)

    # ------------------------------------------------------------ BEAT 2
    # WHAT IS BEHIND THE OVERLAY, and what is deliberately not: the player's own
    # pinned answer and the MK cards they are about to meet. NO bill_summary and
    # NO tally — that is the guardrail this beat lost in the shipped app.
    def under():
        return ('<div class="b2under">%s'
                '<div class="b1prev" style="position:relative;top:0">'
                '<i>%s</i><b>%s</b></div>'
                '<div style="display:flex;gap:8px;margin-top:6px">%s</div></div>'
                % (b_pin(), esc("BEAT 1"), esc(S["ans_t"]),
                   "".join(_bgv_img("B", 74, "portrait-img bgv-port") for _ in range(3))))
    for oid, who, ov_cls, note in (
      ("B2-CHAIR-SHEET", b2_chair(112),
       "b2-sheet",
       "The chair, and a bottom-anchored sheet: about half the round stays visible above "
       "it, so the interruption reads as something laid over the game rather than a new "
       "screen.\\nThe chair rather than the avatar makes the question institutional — you "
       "are being asked as the 121st seat, not as yourself."),
      ("B2-AVATAR-FULL", None, "b2-full",
       "The player's own sticker, and a full-height overlay: the round is still legible "
       "through the blur but nothing of it is usable.\\nThe avatar makes the question "
       "personal — it is YOUR opinion being asked for, which is the one thing that "
       "separates this beat from beat 4."),
      ("B2-CHAIR-FULL", b2_chair(168),
       "b2-full",
       "The chair at full size on a full-height overlay — the most emphatic of the three, "
       "and the one where least of the round reads through.\\nWorth testing against the "
       "sheet: this is a 60-second round and a full-screen interruption is expensive."),
    ):
        body = ('%s%s<div class="fz vw">%s'
                '<div class="b2ov %s">%s<p class="b2q">%s</p>'
                '<p class="b2t">%s</p>%s</div></div>'
                % (BGV_DEFS, '<span class="cs-id v-tag">%s</span>' % oid, under(), ov_cls,
                   who or avatar_sticker(PLAYER_AV, "avs-cut b2av"),
                   esc(S["vote_q"]), esc(B_ISS_T["bill_title"]), votes3()))
        BOARDS.append(dict(file="V12%s.dc.html" % oid.replace("-", ""),
            var="v12" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 2 · " + oid, note="", fh=880, body=body,
            css=COMP_CSS + BEATS_CSS + V12_CSS))
        FRAME_NOTES["V12%s.dc.html" % oid.replace("-", "")] = (
            "Beat 2 as a translucent, backdrop-blurred overlay rather than a card — this is "
            "a meta question, an interruption, not a step in the same plane.\\n" + note +
            "\\nWHAT IS ACTUALLY BEHIND THE BLUR, checked on the frame: the player's pinned "
            "beat-1 answer, and the MK cards they are about to meet. NOTHING ELSE. No "
            "bill_summary and no tally — 10 of 16 bill_summary strings end in the Knesset's "
            "own vote count, and putting that behind this screen would be the same guardrail "
            "violation removed from beat 2 in v11, just blurred.\\n"
            "Three vote options, one construction, never colour- or size-coded, never hidden.",
            None)

    # ------------------------------------------------------------ BEAT 3
    BT, BD = esc(B_ISS_T["bill_title"]), esc(B_ISS_T["bill_date"])
    BOARDS.append(dict(file="V12B3A.dc.html", var="v12b3a", num="B3-A",
        he="B3-A", en="Beat 3 · B3-A, its own screen", note="", fh=880,
        body=(BGV_DEFS + '<span class="cs-id v-tag">B3-A</span>%s'
              '<div class="fz bw b3a"><p class="b3t">%s</p><span class="b3d">%s</span></div>'
              % (b_pin(), BT, BD)),
        css=COMP_CSS + BEATS_CSS + V12_CSS + """
.b3a{justify-content:center;align-items:center;gap:18px}
.b3t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:31px;
  line-height:1.2;text-align:center;color:#EFECE4;text-wrap:balance}
.b3d{font-size:15px;font-weight:700;color:#131310;background:#FBF7EE;border-radius:20px;
  padding:5px 15px}"""))
    BOARDS.append(dict(file="V12B3M.dc.html", var="v12b3m", num="B3-MERGED",
        he="B3-MERGED", en="Beat 3 · dissolved into beat 4's header", note="", fh=880,
        body=(BGV_DEFS + '<span class="cs-id v-tag">B3-MERGED</span>%s'
              '<div class="fz comp"><div class="v4card">'
              '<div class="v4head"><p class="v4bt">%s</p><span class="v4bd">%s</span></div>'
              '<span class="v4halo"></span>%s'
              '<div class="v4id"><h2 class="v4name">%s</h2></div>'
              '</div></div>'
              % (b_pin(), BT, BD, _bgv_img("B", 400, "v4port"), esc(BGV["name"]))),
        css=COMP_CSS + BEATS_CSS + V12_CSS + """
.v4head{position:relative;z-index:6;padding:12px 14px 10px;background:rgba(216,201,168,.92);
  border-bottom:3px solid rgba(0,0,0,.35)}
.v4bt{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:21px;
  line-height:1.2;color:#131310}
.v4bd{font-size:12.5px;font-weight:700;color:#4A4436}"""))
    FRAME_NOTES["V12B3A.dc.html"] = (
        "B3-A as picked: bill_title and bill_date, centred, nothing else.\\n"
        "THE TRADE, stated plainly: a beat of its own gives the bill a moment. The player "
        "reads what they are about to be asked about, with nothing competing for attention, "
        "and the round has a beat of quiet in it.\\nCosts one tap and one screen in a "
        "60-second round.", None)
    FRAME_NOTES["V12B3M.dc.html"] = (
        "The same two strings, dissolved into beat 4's card header. No third screen.\\n"
        "THE TRADE, the other way: saves a tap and a screen, and the bill stays on screen "
        "while the player predicts, which the separate beat cannot do.\\nCosts the bill its "
        "moment — it arrives as a caption above a face, and the face is what the eye goes "
        "to. In a round where the MK card is the payload, a header is a place things go to "
        "be skipped.\\nLion's call. Both are drawn at the same size so they can be read "
        "side by side.", None)

    V4_CSS = COMP_CSS + BEATS_CSS + VD_STAMP_CSS + BGV_CSS + V12_CSS + """
.v4wrap{position:relative;width:340px;flex:none}
/* THE STAMP: 250px on a 340px card, so it covers a large part of it, and it
   hangs 96px past the card's left edge onto the ground. Placed LOW: its top
   edge lands below the eye line, so the ring text crosses the tie and shoulder
   and never the eyes. The name is right-aligned and the stamp is left, so the
   two do not meet. */
.v4stamp{width:250px;height:250px;left:-22px;bottom:-58px;top:auto;z-index:12}
.v4stamp .vs-lab{font-size:34px;width:150px}
.v4stamp .vs-rt{letter-spacing:.18em}
/* the size at which the axis survives: 190px, on the TOP-left corner — the name
   is right-aligned and the axis is at the foot, so this corner is the one free
   of both. It still hangs 30px past the card's edge. */
.v4stamp-sm{width:190px;height:190px;left:-30px;bottom:112px;top:auto}
.v4stamp-sm .vs-lab{font-size:25px;width:112px}
/* STACKED, NOT STRADDLED. Side by side, the pair is twice as wide as a single
   marker and covers the stop's own label — which is the one label that matters
   in this state. Stacking the player's sticker above the MK's keeps the pair
   the width of one marker, so the label below stays as clear as it is when the
   two disagree. */
.gx-you.gx-pair{translate:0 -30px;scale:.66}
.v4gx{position:absolute;z-index:8;left:10px;right:10px;bottom:10px;
  background:rgba(216,201,168,.92);border-radius:12px;padding:6px 8px 4px;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
"""

    # ------------------------------------------------------------ BEAT 4
    # THE DEPTH COMES FROM THE RENDERED SAMPLE, NOT THE DATA ARRAY.
    # app.js:373-374 builds the round's cards as
    #     target = Math.min(5, issue.politicians.length)
    #     sampledPolitded = keyPols.concat(rest).slice(0, max(target, keyPols.length))
    # No issue in data.js carries more than 5 key:true MKs, so that collapses to
    # min(5, n) on every one of the sixteen. r1 — the issue drawn on this board —
    # has 9 MKs in data and deals 5. Drawing the data length would promise
    # cards that never arrive.
    # This card is Ben Gvir on s1, his own police law: SIX in data, FIVE dealt.
    DEALT = max(min(5, len(S1["politicians"])),
                sum(1 for p in S1["politicians"] if p.get("key")))
    assert len(S1["politicians"]) == 6 and DEALT == 5

    def v4(landed, behind=None, top="", verdict="surp", pred_cls=""):
        # landed is False (predicting), True (the 250px stamp, no axis) or
        # "axis" (the 190px stamp with the axis kept).
        # behind is how many cards are still under this one: DEALT - 1 on the
        # first card of the round, 0 on the last.
        if behind is None:
            behind = DEALT - 1
        cls = "v4stamp" + (" v4stamp-sm" if landed == "axis" else "")
        tok = VD_RIGHT if verdict == "right" else VD_S1
        stamp = (vd_stamp(VD_PICK, tok, verdict, cls, uid="v4" + verdict)
                 if landed else "")
        pred = "" if landed else ('<div class="v4pred %s">%s</div>'
                                  % (pred_cls, votes3()))
        # THE AXIS HAS TO AGREE WITH THE STAMP. On the correct verdict the
        # guess and the vote are the same stop, so there is no span to draw —
        # showing the magenta gap band under a [RIGHT] stamp said two opposite
        # things at once on the first render of this frame.
        axis = ('<div class="v4gx">%s</div>'
                % gap_axis(1, 1) if verdict == "right" else
                '<div class="v4gx">%s</div>' % gap_axis(0, 1)) \
               if landed == "axis" else ""
        pile = ('<span class="v4pile">%s</span>' % ("<i></i>" * behind)) if behind else ""
        # THE GUESS-VS-REALITY AXIS DOES NOT FIT ALONGSIDE A STAMP THIS SIZE.
        # It is on the predict panel's own reveal in v11; here the stamp owns the
        # card and the axis would be under it. Flagged in the note rather than
        # shrunk into somewhere it cannot be read.
        return ('<div class="fz comp"><div class="v4wrap %s">%s<div class="v4card">'
                '%s<span class="v4halo"></span>%s'
                '<div class="v4id"><h2 class="v4name">%s</h2><br>'
                '<span class="v4party">%s</span></div>%s</div>%s</div></div>'
                % (top, pile, pred, _bgv_img("B", 400, "v4port"), esc(BGV["name"]),
                   esc(BGV["party"]), axis, stamp))
    for oid, landed, note in (
      ("B4-AXIS", "axis",
       "THE AXIS STAYS AND THE STAMP GIVES WAY. The guess-vs-reality axis is the payload "
       "of the round; the stamp is commentary on it, so the stamp is the thing that comes "
       "down.\n190px is the largest it can be and still leave the axis fully legible — it "
       "moves to the card's TOP-left corner, where the name is not (the name is right-"
       "aligned) and the axis is not (it sits at the foot of the card).\n"
       "It still hangs past the card's edge onto the ground, and the landing motion is "
       "unchanged: 340ms total, scale 1.8 -> 1.0 over 190ms on cubic-bezier(.2,.9,.25,1), "
       "the ink-bleed displacement running 0 -> full over 60ms at contact, overshoot to "
       "1.06 and settle by 340ms, and a 3px card jolt over 120ms from contact.\n"
       "Beside it is the 250px version with no axis, so the trade is visible rather than "
       "argued."),
      ("B4-PREDICT", False,
       "PREDICTING. No stamp — the verdict does not exist yet, and that rule is not relaxed "
       "for this option.\\nThe portrait runs to the card's edges at 460px: the shoulders are "
       "not cut mid-way, the figure fills the card.\\nThe three prediction chips sit OVER "
       "the head rather than in a reserved band above it. They stay legible on their own "
       "fill and a heavier keyline — the portrait is never faded to make room."),
      ("B4-LANDED", True,
       "THE STAMP HAS LANDED. It is much larger than v11's, it sits ON TOP of the card and "
       "hangs past its edge onto the ground.\\nTHE FACE RULE IS RELAXED HERE, as briefed: "
       "the stamp crosses the portrait. Two things it still may not do, both checkable in "
       "this render — the MK's NAME stays readable (it has its own kraft plate under it, "
       "rather than relying on the card showing through), and the ring text does not sit on "
       "the eyes.\\nTHE MOTION, specified: 340ms total. 0-190ms the stamp scales 1.8 -> 1.0 "
       "on cubic-bezier(.2,.9,.25,1) while dropping in; 190ms CONTACT — the ink-bleed "
       "displacement runs from 0 to full over 60ms, so the edge ruptures as it lands rather "
       "than arriving already distressed; 190-250ms overshoot to 1.06 and settle back to "
       "1.0 by 340ms; and the CARD takes a 3px jolt down and back over 120ms from contact. "
       "It lands, it does not glide.\n"
       "WHAT THE BIGGER STAMP COSTS: the guess-vs-reality axis does not fit under it. In "
       "v11 the reveal carried a three-stop axis with the player's guess and the MK's vote "
       "on it, and that was the beat's payload. At this scale there is nowhere to put it "
       "that can be read. Either the axis moves to a following screen, or the stamp comes "
       "down in size. Flagged rather than shrunk into illegibility — Lion's call."),
    ):
        BOARDS.append(dict(file="V12%s.dc.html" % oid.replace("-", ""),
            var="v12" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 4 · " + oid, note="", fh=900,
            body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
                  '%s<span class="cs-id v-tag">%s</span>%s%s'
                  % (vd_defs(VD_PICK), BGV_DEFS, oid, b_pin(), v4(landed))),
            css=COMP_CSS + BEATS_CSS + VD_STAMP_CSS + BGV_CSS + V12_CSS + """
.v4wrap{position:relative;width:340px;flex:none}
/* THE STAMP: 250px on a 340px card, so it covers a large part of it, and it
   hangs 96px past the card's left edge onto the ground. Placed LOW: its top
   edge lands below the eye line, so the ring text crosses the tie and shoulder
   and never the eyes. The name is right-aligned and the stamp is left, so the
   two do not meet. */
.v4stamp{width:250px;height:250px;left:-22px;bottom:-58px;top:auto;z-index:12}
.v4stamp .vs-lab{font-size:34px;width:150px}
.v4stamp .vs-rt{letter-spacing:.18em}
/* the size at which the axis survives: 190px, on the TOP-left corner — the name
   is right-aligned and the axis is at the foot, so this corner is the one free
   of both. It still hangs 30px past the card's edge. */
.v4stamp-sm{width:190px;height:190px;left:-30px;bottom:112px;top:auto}
.v4stamp-sm .vs-lab{font-size:25px;width:112px}
.v4gx{position:absolute;z-index:8;left:10px;right:10px;bottom:10px;
  background:rgba(216,201,168,.92);border-radius:12px;padding:6px 8px 4px;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
"""))
        FRAME_NOTES["V12%s.dc.html" % oid.replace("-", "")] = (note,
            "Supplied illustration. Provenance and licence NOT verified.")

    # ------------------------------------ v15 · avatar proposals, AV-1/2/3
    for kind, title, sub, note in (
      ("AV-1", "\u05e7\u05d5 \u05d5\u05de\u05e0\u05d9\u05dc\u05d5\u05d9",
       "the MK line language on a constructed figure",
       "AV-1 — THE MK TREATMENT, APPLIED TO A FIGURE THAT IS NOT A PORTRAIT.\n"
       "Same 3.4px black keyline, same flat unmodelled fills, same construction "
       "as the illustrations: heavy outline, one colour per plane, no gradient "
       "anywhere. Beside an MK card it reads as the same HAND.\n"
       "HOW IT STAYS NOT-MK: round, never the 3:4 box every politician on this "
       "board lives in; built from primitives rather than drawn from a face, so "
       "there is no likeness to mistake; and no name plate under it. Its own "
       "fourth device is the FACE — two dots and a stroke against the MKs' "
       "modelled features. A schematic face next to a drawn one is not a lesser "
       "portrait, it is a different kind of object.\n"
       "The risk is that it is the closest of the three to the politicians, "
       "which is also why it sits best beside them."),
      ("AV-2", "\u05e8\u05d9\u05e4\u05d5\u05d3 \u05d4\u05db\u05d9\u05e1\u05d0",
       "the chair's surface — hatched fill, rough edge",
       "AV-2 — THE CHAIR'S SURFACE. Hatched fill at 38 degrees, the chair's own "
       "tan and umber, and an edge roughened by a turbulence displacement so the "
       "outline wobbles the way a drawn line does. Old-cartoon, printed rather "
       "than vector.\n"
       "HOW IT STAYS NOT-MK: the same three devices, plus its own fourth and it "
       "is the strongest of the three — it reads as an OBJECT in the same family "
       "as the chair and the police cap, not as a person. The MK portraits carry "
       "no hatching at all.\n"
       "WHAT IT COSTS, and this is visible in the strip rather than argued: the "
       "hatch is a 6px pattern. At 200px it is the whole character of the thing. "
       "At 64px it is a texture. At 40px it is grey. If the avatar has to work "
       "at 40px — and it does, that is the axis marker — this treatment is "
       "carrying its idea only at the top two sizes."),
      ("AV-3", "\u05d2\u05d6\u05d9\u05e8\u05ea \u05e0\u05d9\u05d9\u05e8",
       "paper cut-out, no face at all",
       "AV-3 — MY OWN, AND THE ONE I WOULD PICK. The figure as layered paper: "
       "flat cut shapes, a white die-cut edge on the hair the way every sticker "
       "on this board has one, and NO FACIAL FEATURES AT ALL.\n"
       "HOW IT STAYS NOT-MK, and it is not subtle: the 120 have faces and the "
       "121st does not. That is the premise stated in the artwork rather than "
       "argued in a caption — you are the seat, not the person in it. It cannot "
       "be mistaken for a politician portrait at any size, which is more than "
       "the other two can claim.\n"
       "It is also the only one that survives 40px intact, because a silhouette "
       "and two flat shapes are all it ever was. And it sits in the house "
       "language already: it is the same construction as the die-cut stickers "
       "the board uses everywhere else.\n"
       "WHAT IT COSTS: expression. A faceless avatar cannot smile when you get "
       "one right, and the character screen has less to sell."),
    ):
        cells = "".join(
            '<figure>%s<figcaption>%dpx</figcaption></figure>'
            % (av_prop(kind, px, "%s%d" % (kind.replace("-", ""), px)), px)
            for px in (200, 64, 40))
        BOARDS.append(dict(file="V15%s.dc.html" % kind.replace("-", ""),
            var="v15" + kind.replace("-", "").lower(), num=kind, he=kind,
            en="Avatar direction · " + kind, note="", fh=420,
            body=('<span class="cs-id v-tag">%s</span>'
                  '<div class="fz avrow"><div class="avhead"><b>%s</b><i>%s</i></div>'
                  '<div class="avcell">%s</div></div>'
                  % (kind, esc(title), esc(sub), cells)),
            css=COMP_CSS + AV_CSS))
        FRAME_NOTES["V15%s.dc.html" % kind.replace("-", "")] = (note, None)

    # ---------------------------------------- v15 · beat 1, the same card
    # THE CLAIM CARD IS THE MK CARD. 340x620, kraft and grid, 5px white edge,
    # the same hard shadow — same object, different contents, so the round reads
    # as one deck rather than as two unrelated screens.
    #
    # It is built on s1 rather than r1, because s1 is the issue the artwork
    # exists for: the topic graphic is the police cap, s1 is the police law, and
    # the beat-4 card and the whole cascade on this board are s1 as well. r1's
    # own topic art does not exist yet and is still listed for Tamar.
    TT, FF = esc(S["ans_t"]), esc(S["ans_f"])

    def b1card(side, label, toward, behind=4, iid="s1"):
        prev_side = "right:14px" if side == "right" else "left:14px"
        sw = "left:-250px" if side == "left" else "right:-250px"
        return ('<div class="fz comp"><div class="v4wrap">'
                '<span class="v4pile">%s</span>'
                '<div class="b1swipe" style="%s"><span>%s</span></div>'
                '<div class="v4card b1c">'
                '<div class="b1topic">%s</div>'
                '<p class="b1big">%s</p>'
                '<div class="v4pred b1ans2">'
                '<button type="button" class="vbtn">%s</button>'
                '<button type="button" class="vbtn">%s</button></div>'
                '</div>'
                '<div class="b1prev" style="%s"><i>%s</i><b>%s</b></div>'
                '</div></div>'
                % ("<i></i>" * behind, sw, toward,
                   issue_art(iid, "b1hat"), esc(ISSUES[iid]["tf"]), TT, FF,
                   prev_side, esc(label), toward))

    for oid, toward, side, label, note in (
      ("B1-CARD-R", TT, "right", "DRAG \u2192",
       "MAPPING A: dragging toward the RIGHT edge is heading to \u05d0\u05de\u05ea.\n"
       "THE CARD IS NOW THE MK CARD — 340x620, the same kraft and grid, the same "
       "5px white edge and the same hard shadow, measured against beat 4 rather "
       "than eyeballed. Same object, different contents.\n"
       "The yellow placeholder band and the rule under it are gone. In their "
       "place the topic graphic occupies the card's upper area the way the "
       "portrait occupies beat 4's, at 300px on a 340px card.\n"
       "THE ARTWORK NEEDS NO REWORK TO MATCH. policehat.webp is already cut the "
       "way the rest of the set is: hard black keyline, flat fills, hatched "
       "shading, no cast shadow baked in and no soft halo outside the ink — 25% "
       "of the file is fully opaque and 75% fully transparent, with a clean "
       "edge between. It takes the same die-cut sticker edge as the chair.\n"
       "Built on s1, not r1: s1 is the police law, the cap is police, and the "
       "beat-4 card and the cascade on this board are s1 too. r1's own topic "
       "art does not exist and is still on the list."),
      ("B1-CARD-L", TT, "left", "\u2190 DRAG",
       "MAPPING B: dragging toward the LEFT edge is heading to \u05d0\u05de\u05ea "
       "\u2014 the same card, the same preview, the inverse mapping.\n"
       "One variable in the build, not two layouts. The pair goes into the "
       "playtest together: in a right-to-left reading order the «forward» edge "
       "is the left one, so the habit most swipe games ship may not transfer."),
    ):
        BOARDS.append(dict(file="V15%s.dc.html" % oid.replace("-", ""),
            var="v15" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 1 · " + oid, note="", fh=900,
            body=('%s<span class="cs-id v-tag">%s</span>%s'
                  % (BGV_DEFS, oid, b1card(side, label, toward))),
            css=V4_CSS + MK_CSS + B1_CSS))
        FRAME_NOTES["V15%s.dc.html" % oid.replace("-", "")] = (note,
            "Supplied illustration. Provenance and licence NOT verified.")

    # ------------------------------------- v16 · the chip gap, both repairs
    # Same card, same MK, same everything but the chips. The row that lays them
    # out is .b3v either way; what differs is whether a chip paints a ring
    # outside its own box, and therefore how much gap it takes to see daylight.
    for oid, cls, note in (
      ("CHIPS-RING", "",
       "RING KEPT, GAP WIDENED \u2014 and this is what is applied to every beat-4 "
       "frame on the board.\n"
       "The chips carry 3px of white ring and 4.6px of keyline outside their own "
       "boxes, so two neighbours spend 9.2px of any gap on their own edges. At "
       "the old 9px that left MINUS 0.2px: the keylines overlapped and the three "
       "read as one segmented control. At 18px there is 8.8px of daylight, which "
       "is beat 2's 9px to within a rounding.\n"
       "Chips 93x52. The ring is the reason to prefer this one: these chips sit "
       "ON a portrait \u2014 a suit, a collar, a face \u2014 where beat 2's sit on flat "
       "dark ground, and the keyline is what holds a chip against that."),
      ("CHIPS-FLAT", "is-flat",
       "BEAT 2'S CONSTRUCTION, VERBATIM. The ring is gone; the chip has beat 2's "
       "plain downward extrusion and beat 2's 9px gap, which shows as a full "
       "9px because nothing is painted outside the box.\n"
       "Chips 99x52 \u2014 wider, because the gap is not paying for two rings.\n"
       "WHAT IT COSTS, and it is the only difference that matters: there is no "
       "longer a keyline between the chip and the portrait behind it. On the "
       "white shirt and the pale collar the chip's own cream fill is very close "
       "to the ground it sits on. Beat 2 never has this problem because its "
       "buttons sit on a flat dark overlay.\n"
       "Worth looking at the two against the shirt specifically."),
    ):
        BOARDS.append(dict(file="V16%s.dc.html" % oid.replace("-", ""),
            var="v16" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 4 \u00b7 chip gap \u00b7 " + oid, note="", fh=900,
            body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
                  '%s<span class="cs-id v-tag">%s</span>%s%s'
                  % (vd_defs(VD_PICK), BGV_DEFS, oid, b_pin(),
                     v4(False, pred_cls=cls))),
            css=V4_CSS + """
/* beat 2's button, exactly: no ring, and 9px is 9px because of it */
.v4pred.is-flat .b3v{gap:9px}
.v4pred.is-flat .vbtn{box-shadow:0 4px 0 0 #C6C0AE}
"""))
        FRAME_NOTES["V16%s.dc.html" % oid.replace("-", "")] = (note,
            "Supplied illustration. Provenance and licence NOT verified.")

    # ------------------------------------ v16 · the handoff, on the board
    # The bundle in explorations/v16/prototype/ is the deliverable; these
    # frames are it, rendered, so the board carries what the prototype gets
    # rather than describing it.
    PROTO = pathlib.Path(__file__).resolve().parent / "prototype"
    _css = (PROTO / "hachach.css").read_text(encoding="utf-8")
    _man = json.loads((PROTO / "manifest.json").read_text(encoding="utf-8"))
    _tok = re.findall(r"^\s*(--[\w-]+)\s*:", _css, re.M)

    def _snip(t):
        return '<pre class="snip">%s</pre>' % esc(t)

    rows = [
      ("P-C", '<button class="p-c">%s</button>' % esc(S["intro_cta"]),
       '<button class="p-c">…</button>'),
      ("R-B", '<button class="r-b">%s</button>' % esc(TWEAK_CTA),
       '<button class="r-b">…</button>'),
      ("V-A", '<div class="v-a-row"><button class="v-a">%s</button>'
              '<button class="v-a">%s</button><button class="v-a">%s</button></div>'
              % (esc(S["v_for"]), esc(S["v_against"]), esc(S["v_abstain"])),
       '<div class="v-a-row">\n  <button class="v-a">בעד</button>\n'
       '  <button class="v-a">נגד</button>\n  <button class="v-a">נמנע</button>\n</div>'),
      ("H-A + IB-B",
       '<div class="hrow"><span class="h-a">240 \u25cf</span>'
       '<button class="ib-b" aria-label="back">\u2039</button></div>',
       '<span class="h-a">…</span>   <button class="ib-b">…</button>'),
      ("AS-D", '<span class="as-d">%s</span>'
               % av3(PLAYER_AV).split(">", 1)[1].rsplit("</span>", 1)[0],
       '<span class="as-d"><svg viewBox="0 0 100 100">…</svg></span>'),
      ("D2", '<div class="d2row"><span class="d2 d2--correct"><span class="d2__lab">%s</span></span>'
             '<span class="d2 d2--surprise"><span class="d2__lab">%s</span></span></div>'
             % (esc(VD_RIGHT), esc(VD_S1)),
       '<span class="d2 d2--correct"><span class="d2__lab">…</span></span>'),
      ("pile", '<div class="pilebox"><span class="pile"><i></i><i></i><i></i><i></i></span></div>',
       '<span class="pile"><i></i><i></i><i></i><i></i></span>'),
      ("pinned", '<div class="pinbox"><span class="pinned">%s</span></div>' % esc(S["ans_t"]),
       '<span class="pinned">אמת</span>'),
    ]
    cells = "".join(
        '<section class="hs-row"><h3>%s</h3><div class="hs-demo">%s</div>%s</section>'
        % (esc(name), demo, _snip(snip)) for name, demo, snip in rows)
    BOARDS.append(dict(file="V16KIT.dc.html", var="v16kit", num="KIT",
        he="KIT", en="Handoff \u00b7 the components, from hachach.css", note="", fh=1250,
        body='<span class="cs-id v-tag">KIT</span><div class="fz hsw">%s</div>' % cells,
        css=COMP_CSS + _css + """
.hsw{flex:1;display:flex;flex-direction:column;gap:18px;padding:8px 4px 16px}
.hs-row{display:flex;flex-direction:column;gap:7px}
.hs-row h3{margin:0;direction:ltr;font-size:10px;letter-spacing:.1em;font-weight:800;
  color:#BEB9AC;text-transform:uppercase}
.hs-demo{position:relative}
.snip{direction:ltr;margin:0;font-family:ui-monospace,Menlo,monospace;font-size:9.5px;
  line-height:1.5;color:#9AA093;background:rgba(0,0,0,.28);padding:7px 9px;
  border-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere}
.hrow{display:flex;gap:10px;align-items:center}
.d2row{display:flex;gap:14px}
.d2row .d2{position:relative;width:110px;height:110px;animation:none}
.d2row .d2__lab{font-size:15px;width:70px}
.pilebox{position:relative;height:120px;width:180px;margin-inline-start:14px}
.pilebox .pile i{border-width:4px}
.pinbox{position:relative;height:56px}
.pinbox .pinned{top:8px}
"""))
    FRAME_NOTES["V16KIT.dc.html"] = (
        "THE HANDOFF, RENDERED. Every component on this frame is drawn by "
        "explorations/v16/prototype/hachach.css and by nothing else — the "
        "artboard pastes that file in verbatim, so if a class here is wrong the "
        "file the prototype gets is wrong too.\n"
        "%d tokens in :root. Colours are named by ROLE — --verdict-correct and "
        "--verdict-surprise, never by vote direction, because there is no token "
        "for בעד and there must not be one. Motion is named for what it times: "
        "--t-press, --t-stamp, --t-flip, --t-swipe, --t-finale, so a duration can "
        "be retuned in one place.\n"
        "check_tokens_v16.py renders this stylesheet in a browser and compares "
        "each component's COMPUTED value against the token the same file "
        "declares — a component that hardcoded a colour instead of reading a "
        "token fails there, rather than passing a search for the word ':root'.\n"
        "manifest.json carries %d politicians with art, %d without, %d topic icon "
        "and %d issue graphics, generated from data.js and asserted against what "
        "is actually on disk. Paths, never base64.\n"
        "README.md says how to consume it, and names the three things that are "
        "easy to get wrong: portraits are top-anchored, most MKs have no art and "
        "must never borrow a face, and the pile counts the DEALT sample."
        % (len(set(_tok)), len(_man["politicians"]),
           len(_man["politicians_without_art"]),
           sum(1 for v in _man["topics"].values() if "glyph" not in v),
           len(_man["issues"])), None)

    # -------------------------------- v16 · the second claim card, s2
    BOARDS.append(dict(file="V16B1S2.dc.html", var="v16b1s2", num="B1-S2",
        he="B1-S2", en="Beat 1 · s2 · its own graphic", note="", fh=900,
        body=('%s<span class="cs-id v-tag">B1-S2</span>%s'
              % (BGV_DEFS, b1card("right", "DRAG \u2192", TT, iid="s2"))),
        css=V4_CSS + MK_CSS + B1_CSS))
    FRAME_NOTES["V16B1S2.dc.html"] = (
        "THE SECOND ISSUE IN THE SAME TOPIC, with its own graphic. Same card, "
        "same construction, same two answers — only the object and the claim "
        "change, which is the whole point of keying the art to the issue id.\n"
        "The stamp is PORTRAIT where the cap is landscape (116x210 against "
        "300x180), so the slot is sized by height rather than width and each "
        "object fills it on its own axis. Both are written at the exact pixel "
        "size they render at; neither is resampled by the browser.\n"
        "THE COLLISION, and it is real: this issue's object is a RUBBER STAMP, "
        "and the verdict mark that lands at beat 4 of the same round is also a "
        "stamp. Two stamps in one round, 40 seconds apart. They are not confusable "
        "at a glance — the claim object is a wooden desk stamp in the topic's own "
        "palette, standing still and upright at the top of a card; the verdict is "
        "a flat magenta or lime ink ROUNDEL that lands at an angle across a face "
        "— but they are the same METAPHOR, and the verdict stamp's whole job is "
        "to feel like the round's one authoritative mark. On s2 it is the second "
        "stamp the player has seen. Worth a look before it ships; it is not a "
        "layout problem and I have not silently changed either one.", 
        "Supplied illustration. Provenance and licence NOT verified.")

    # -------------------------------- v16 · the topic mark on the map node
    T_IS = [t for t in TOPICS if t["id"] == "internal_sec"][0]
    states = (("UNTOUCHED", 0, False), ("HALF", 1, False), ("DONE", 2, False))
    cells = "".join(
        '<div class="ndcell"><span class="cs-id">%s</span>'
        '<div class="ndbox">%s</div></div>'
        % (lbl, ring_node(T_IS, played, 2, False, cur, "A"))
        for lbl, played, cur in states)
    reads = "".join(
        '<figure>%s<figcaption>%dpx</figcaption></figure>' % (topic_icon(T_IS, h), h)
        for h in (128, 64, 40))
    BOARDS.append(dict(file="V16NODE.dc.html", var="v16node", num="NODE",
        he="NODE", en="Map node \u00b7 internal_sec \u00b7 three states", note="", fh=620,
        body=('<span class="cs-id v-tag">NODE</span>'
              '<div class="fz ndw"><div class="ndrow">%s</div>'
              '<div class="ndread">%s</div></div>' % (cells, reads)),
        css=COMP_CSS + node_css("A") + """
.ndw{flex:1;display:flex;flex-direction:column;gap:22px;justify-content:center;padding:0 6px}
.ndrow{display:flex;gap:6px;justify-content:center;align-items:flex-start}
.ndcell{display:flex;flex-direction:column;align-items:center;gap:6px;width:116px}
.ndbox{position:relative;width:116px;height:104px}
.ndread{display:flex;gap:16px;align-items:flex-end;justify-content:center;
  background:#D8C9A8;border:4px solid #fff;padding:14px 12px 10px;
  box-shadow:0 0 0 2px rgba(0,0,0,.5),0 5px 0 rgba(0,0,0,.4)}
.ndread figure{display:flex;flex-direction:column;align-items:center;gap:6px;margin:0}
.ndread figcaption{direction:ltr;font-size:9.5px;font-weight:700;color:#4A4436}
"""))
    FRAME_NOTES["V16NODE.dc.html"] = (
        "THE PADLOCK ON THE MAP NODE, in all three states the map can show it in.\n"
        "NO data.js CHANGE IS NEEDED, and that was the thing to check first. "
        "app.js:271 writes '<div class=\"em\">'+t.icon+'</div>' — the glyph is a "
        "STRING inside .em, and CSS cannot select on text. But the card beside it "
        "carries the topic's colour inline: app.js:267 does "
        "card.style.setProperty('--tc', t.color), and all eight topic colours in "
        "data.js are distinct. So the hook already exists:\n"
        "  .topic-card[style*=\"#37c4ff\"] .em{font-size:0;width:64px;height:102px;\n"
        "    background:url(assets/mk/internal_sec_main_64.webp) center/contain no-repeat}\n"
        "font-size:0 drops the glyph, the background paints the object, and "
        "styles/overrides.css already loads last and already filters .em on "
        "topic-card.done — so the done state's glow carries over for free.\n"
        "THE TRADE, stated: that selector keys on a COLOUR VALUE from data.js. It "
        "works today and needs nobody's permission, but it breaks silently if a "
        "topic is recoloured. A data-topic attribute on the card is one line in "
        "app.js and would make it robust. Roman's call — the CSS route is not "
        "blocked on it.\n"
        "READS AT 64px, NOT AT 40px. At 128 and 64 the shackle, the body and the "
        "hatching are all there. At 40 the shackle closes up into the body and it "
        "reads as a rounded block; the object survives, the fact that it is a "
        "PADLOCK does not. The node face is 76px and the mark inside it is 52px, "
        "so the map is comfortably above that line — 40px is only reached if the "
        "icon is reused somewhere smaller, and it should not be.", None)

    # ------------------------------------------ v15 · the whole s1 cascade
    # The round, dealt. Every card is the same construction as Ben Gvir's — the
    # only variable is who is on it, and the name and party under it come out of
    # data.js by id. app.js deals five of s1's six, always including the one
    # key:true MK, so the pile behind each card counts down from four.
    S1_POLS = [p["id"] for p in S1["politicians"]]
    NO_ART = "liberman"          # 8 card appearances, no illustration

    def mk_face(pid, behind, px=400):
        pol = DATA["politicians"][pid]
        pile = ('<span class="v4pile">%s</span>' % ("<i></i>" * behind)) if behind else ""
        return ('<div class="fz comp"><div class="v4wrap">%s<div class="v4card">'
                '<div class="v4pred">%s</div><span class="v4halo"></span>%s'
                '<div class="v4id"><h2 class="v4name">%s</h2><br>'
                '<span class="v4party">%s</span></div></div></div></div>'
                % (pile, votes3(), mk_img(pid, px, "v4port"),
                   esc(pol["name"]), esc(pol.get("party", ""))))

    # THE ROUND DEALS FIVE OF THESE SIX. Which five is shuffled every time
    # (app.js:372-376), so no card is inherently the one left out — the first
    # five carry the pile counting down 4 to 0, and the sixth is drawn with a
    # full pile because in another round it is the card that comes first.
    PILE = [4, 3, 2, 1, 0, 4]
    for n, pid in enumerate(S1_POLS + [NO_ART]):
        pol = DATA["politicians"][pid]
        art = pid in MK_ART
        oid = "CASC-%d" % (n + 1) if art else "CASC-NOART"
        behind = PILE[n] if art else 2
        BOARDS.append(dict(file="V15%s.dc.html" % oid.replace("-", ""),
            var="v15" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 4 · s1 cascade · " + pol["name"], note="", fh=900,
            body=('%s<span class="cs-id v-tag">%s</span>%s%s'
                  % (BGV_DEFS, oid, b_pin(), mk_face(pid, behind))),
            css=V4_CSS + MK_CSS))
        FRAME_NOTES["V15%s.dc.html" % oid.replace("-", "")] = (
            ("%s, %s. Card %d, %d still under it.\n"
             "s1 deals FIVE of its six and shuffles which five, so the sixth card "
             "here carries a full pile rather than an empty one: in another round "
             "it is the one that comes first.\n"
             "Nothing on this card is authored: the name and the party are read "
             "out of data.js by id, and the portrait is the framed export.\n"
             "The point of the row is the SET, not the card — the same crop rule "
             "on six different faces, at the size the player sees them."
             % (pol["name"], pol.get("party", ""), n + 1, behind)) if art else
            ("THE FALLBACK, on an MK who has no illustration. %s appears on eight "
             "MK cards across data.js and there is no art for him, which is the "
             "normal case: six of twenty-one are drawn.\n"
             "The initials are the shipped name sliced at its spaces, so they "
             "cannot drift from it, and they sit on the SET'S OWN EYELINE — 37.7%% "
             "down the box — so the badge occupies the card exactly as a portrait "
             "does.\n"
             "WHAT IT MUST NEVER DO is borrow a face. Substituting another MK's "
             "portrait would attach a real person's likeness to a vote that is not "
             "theirs." % pol["name"]),
            "Supplied illustration. Provenance and licence NOT verified." if art else None)

    # ------------------------------------------- v15 · the set at card-chip size
    # 48px is where a portrait set either holds together or falls apart: the
    # framing has to carry it, because at 48px there is no face left to read.
    strip = "".join(
        '<span class="s48"><span class="s48i">%s</span><i>%s</i></span>'
        % (mk_img(pid, 48, "s48p"), esc(DATA["politicians"][pid]["name"]))
        for pid in list(MK_ART) + [NO_ART])
    BOARDS.append(dict(file="V15SET48.dc.html", var="v15set48", num="SET-48",
        he="SET-48", en="The set at 48px", note="", fh=420,
        body=('%s<span class="cs-id v-tag">SET-48</span>'
              '<div class="fz s48w"><div class="s48row">%s</div></div>'
              % (BGV_DEFS, strip)),
        css=V4_CSS + MK_CSS + """
.s48w{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 6px}
.s48row{display:flex;flex-wrap:wrap;gap:10px 6px;justify-content:center;
  background:#D8C9A8;border:4px solid #fff;padding:14px 8px 10px;
  box-shadow:0 0 0 2px rgba(0,0,0,.5),0 5px 0 rgba(0,0,0,.4)}
.s48{display:flex;flex-direction:column;align-items:center;gap:5px;width:60px}
.s48i{display:block;box-shadow:0 0 0 2px #fff,0 0 0 3.4px rgba(0,0,0,.55)}
.s48p{display:block}
.s48 i{font-style:normal;font-size:8.5px;font-weight:700;color:#4A4436;
  text-align:center;line-height:1.15}
"""))
    FRAME_NOTES["V15SET48.dc.html"] = (
        "THE WHOLE SET AT 48px, which is the size the axis marker and the sort "
        "chips use, and the size at which a portrait set is actually tested.\n"
        "Served from the 128px export, not by shrinking the 400px one — under "
        "150px that is the rule on this board, and at 48px a browser resampling "
        "a 400px halftone is a test of the resampler.\n"
        "WHAT TO LOOK FOR: every head the same size and every pair of eyes on the "
        "same line. That is the whole return on framing them to one rule, and it "
        "is only visible at this size.\n"
        "The last chip is the initials fallback at the same size.",
        "Supplied illustrations. Provenance and licence NOT verified.")

    # ------------------------------- v15 · the same landing, the other verdict
    # A verdict has exactly two states and the board has only ever drawn one of
    # them. Colour codes CORRECTNESS, so the correct state is the other half of
    # that rule and has to be looked at beside the surprise, not imagined.
    for oid, landed, note in (
      ("B4-RIGHT-AXIS", "axis",
       "THE CORRECT VERDICT, at the chosen 190px with the axis kept. Beside it is "
       "the surprise state on B4-AXIS, same size, same landing, same motion.\n"
       "THE INK IS LIME, NOT GREEN — #B6E521, hue 74 degrees. That matters: 74 is "
       "a yellow-green, and it was picked in VP-2 because it clears style B's own "
       "hue bands by 54 degrees where a true green did not. Reading it as «green "
       "means right» is the habit this palette is trying not to lean on; what it "
       "actually says is «this ink is not that ink».\n"
       "Still correctness only. Neither ink appears anywhere near בעד, נגד or "
       "נמנע, and neither changes with which way the MK voted."),
      ("B4-RIGHT", True,
       "THE CORRECT VERDICT at 250px, beside B4-LANDED's surprise at the same "
       "size. The trade is the same one and it does not depend on which verdict "
       "landed: at 250px there is nowhere the axis can go.\n"
       "Worth looking at the two side by side for one reason in particular — the "
       "lime is a much lighter ink than the magenta (value 90%% against 100%%, but "
       "saturation 86%% against 77%%), so the correct stamp sits lighter on the "
       "portrait and reads as less of an interruption. If that asymmetry is "
       "wrong — if being right should land as hard as being surprised — it is a "
       "palette question, not a layout one."),
    ):
        BOARDS.append(dict(file="V15%s.dc.html" % oid.replace("-", ""),
            var="v15" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 4 · correct verdict · " + oid, note="", fh=900,
            body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
                  '%s<span class="cs-id v-tag">%s</span>%s%s'
                  % (vd_defs(VD_PICK), BGV_DEFS, oid, b_pin(),
                     v4(landed, verdict="right"))),
            css=V4_CSS))
        FRAME_NOTES["V15%s.dc.html" % oid.replace("-", "")] = (note,
            "Supplied illustration. Provenance and licence NOT verified.")

    # ------------------------------------------------- v14 · the pile depleting
    # Same card, same round, three points in the cascade. app.js advances
    # scrollIdx one MK at a time (app.js:629-637), so what is under the front
    # card is DEALT - scrollIdx - 1: four on the first, one on the fourth, none
    # on the last. The last card genuinely has no pile, and that is the end of
    # the depletion rather than a missing state.
    for oid, behind, note in (
      ("PILE-5", 4,
       "THE DECK AT ITS DEEPEST — card 1 of 5, four backs under it.\n"
       "FIVE, NOT SIX. s1 lists six MKs in data.js. app.js:373 takes "
       "Math.min(5, issue.politicians.length) and deals five, so a sixth back "
       "would promise a card that never arrives. The depth is read off the "
       "sample, and it is asserted in the build rather than typed in.\n"
       "The backs carry nothing — kraft, grid, keyline. No portrait, no name, no "
       "party, because who is next is the thing the beat withholds.\n"
       "They pivot about the front card's bottom centre so the fan opens upward: "
       "the whole lower half of the card, where the stamp hangs and the axis "
       "sits, stays clear. Largest sideways excursion 21px against 25px of frame "
       "margin."),
      ("PILE-2", 1,
       "NEAR THE END — card 4 of 5, one back left.\n"
       "Nothing about the treatment changes as the deck empties; there is simply "
       "less of it. The front card is identical in both states, which is the "
       "point: the pile is a progress reading the player gets for free, without "
       "a counter, a bar or a number."),
      ("PILE-1", 0,
       "THE LAST CARD — card 5 of 5, no pile at all.\n"
       "This is the end of the depletion, not a state with something missing. "
       "When the deck is spent the card stands alone, which is exactly how beat "
       "4 has looked on this board until now.\n"
       "It is also the one card where the treatment costs nothing: no back to "
       "clear, so the stamp and the axis have the same room they always had."),
    ):
        BOARDS.append(dict(file="V14%s.dc.html" % oid.replace("-", ""),
            var="v14" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 4 · the pile · " + oid, note="", fh=900,
            body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
                  '%s<span class="cs-id v-tag">%s</span>%s%s'
                  % (vd_defs(VD_PICK), BGV_DEFS, oid, b_pin(), v4(False, behind=behind))),
            css=COMP_CSS + BEATS_CSS + VD_STAMP_CSS + BGV_CSS + V12_CSS + """
.v4wrap{position:relative;width:340px;flex:none}
.v4stamp{width:250px;height:250px;left:-22px;bottom:-58px;top:auto;z-index:12}
.v4stamp .vs-lab{font-size:34px;width:150px}
.v4stamp .vs-rt{letter-spacing:.18em}
.v4stamp-sm{width:190px;height:190px;left:-30px;bottom:112px;top:auto}
.v4stamp-sm .vs-lab{font-size:25px;width:112px}
.v4gx{position:absolute;z-index:8;left:10px;right:10px;bottom:10px;
  background:rgba(216,201,168,.92);border-radius:12px;padding:6px 8px 4px;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
"""))
        FRAME_NOTES["V14%s.dc.html" % oid.replace("-", "")] = (note,
            "Supplied illustration. Provenance and licence NOT verified.")

    # -------------------------------------------- v14 · the dead band up top
    for oid, top, note in (
      ("TOP-B", "v4top-b",
       "REJECTED, kept as the record of why. (b) cut the card shorter. The same 58px is removed from the card "
       "itself: 620px becomes 562px and the name sits 18px from the new top "
       "edge.\n"
       "WHAT IT DOES TO EVERYTHING BELOW — measured, not assumed. The answer is "
       "that the card's own furniture does not move at all, because every piece "
       "of it is bottom-anchored: the chips stay at bottom:12, the axis at "
       "bottom:10, the 250px stamp at bottom:-58 and the 190px stamp at "
       "bottom:112. Their distance from the card's bottom edge is identical in "
       "both treatments.\n"
       "What DOES change is their distance from the top: the 190px stamp's top "
       "edge sits 318px below the card top in (a) and 260px below it in (b), so "
       "the gap between the name plate and the stamp's landing zone closes by "
       "58px. It still clears — the plate ends around 64px — but (b) is the "
       "treatment with less air in it.\n"
       "The pile is unchanged: it is sized from the card, so the backs shorten "
       "with it and stay bottom-pivoted.\n"
       "THE ONE REAL COST, and it is not in the furniture — it is the PORTRAIT. "
       "The figure is anchored to the card's bottom and the card clips, so cutting "
       "58px off the top cuts 58px off the top of the head: the kippah is "
       "truncated by the card edge in (b) and clear of it in (a). Visible in the "
       "two renders side by side. If (b) is the pick, the portrait wants scaling "
       "down about 9% to bring the head back inside — a one-line change, but a "
       "change, and it makes the figure smaller in the card."),
    ):
        BOARDS.append(dict(file="V14%s.dc.html" % oid.replace("-", ""),
            var="v14" + oid.replace("-", "").lower(), num=oid, he=oid,
            en="Beat 4 · top band · " + oid, note="", fh=900,
            body=('<svg class="defs" width="0" height="0" aria-hidden="true"><defs>%s</defs></svg>'
                  '%s<span class="cs-id v-tag">%s</span>%s%s'
                  % (vd_defs(VD_PICK), BGV_DEFS, oid, b_pin(),
                     v4("axis", top=top))),
            css=COMP_CSS + BEATS_CSS + VD_STAMP_CSS + BGV_CSS + V12_CSS + """
.v4wrap{position:relative;width:340px;flex:none}
.v4stamp{width:250px;height:250px;left:-22px;bottom:-58px;top:auto;z-index:12}
.v4stamp .vs-lab{font-size:34px;width:150px}
.v4stamp .vs-rt{letter-spacing:.18em}
.v4stamp-sm{width:190px;height:190px;left:-30px;bottom:112px;top:auto}
.v4stamp-sm .vs-lab{font-size:25px;width:112px}
.v4gx{position:absolute;z-index:8;left:10px;right:10px;bottom:10px;
  background:rgba(216,201,168,.92);border-radius:12px;padding:6px 8px 4px;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
"""))
        FRAME_NOTES["V14%s.dc.html" % oid.replace("-", "")] = (note,
            "Supplied illustration. Provenance and licence NOT verified.")

# ======================= 20 · v13 · beat 3 overlay, beat 5 rebuilt =========
V13_CSS = """
/* ---- BEAT 3, now an overlay over the beat-4 card ---- */
.b3ov{position:absolute;z-index:9;left:0;right:0;top:0;bottom:0;
  -webkit-backdrop-filter:blur(15px) saturate(.92);backdrop-filter:blur(15px) saturate(.92);
  background:rgba(28,26,23,.56);display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:16px;padding:26px 22px}
.b3ov-t{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:30px;
  line-height:1.2;color:#F6F1E2;text-align:center;text-wrap:balance}
.b3ov-d{font-size:15px;font-weight:700;color:#131310;background:#FBF7EE;border-radius:20px;
  padding:5px 15px}
.b3ov-go{margin-top:8px;font-size:12px;font-weight:700;color:#BEB9AC;direction:rtl}
/* ---- BEAT 5, rebuilt: one thing dominant ---- */
.b5w{flex:1;display:flex;flex-direction:column;gap:10px;padding-top:30px}
.b5p{background:rgba(0,0,0,.16);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.10);
  width:calc(100% + 32px);margin:0 -16px;padding:18px 16px 16px;
  display:flex;flex-direction:column;gap:12px}
.b5st{font-size:10.5px;font-weight:800;letter-spacing:.09em;color:#131310;background:#FFD60A;
  border-radius:20px;padding:2px 9px 3px;align-self:flex-start;direction:ltr}
/* PRIMARY — the payload, and the only loud thing on the screen */
.b5lead{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.b5big{font-size:66px;color:#EFECE4;line-height:.95}
.b5res{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:44px;
  line-height:1;background:#000;color:#fff;border:5px solid #fff;padding:2px 16px 6px}
.b5res-lg{font-size:56px}
.b5quiet{font-size:22px;color:#BEB9AC}
.b5sub{font-size:12.5px;font-weight:700;color:#8E897C}
/* SECONDARY — the explanation, plainly beneath it */
.b5exp2{font-size:15px;font-weight:700;line-height:1.55;color:#D8D2C4}
/* TERTIARY — sources as ONE line. Not a block, not a card, not chips. */
.b5src1{font-size:11.5px;font-weight:700;color:#8E897C;direction:rtl}
.b5src1 a{color:#8E897C}
/* the glossary term, marked inline where it already occurs. No panel. */
.gt{background:rgba(55,196,255,.22);border-bottom:2px dotted #9FD9F2;color:#EFECE4;
  padding:0 3px;font-weight:900}
.gdef2{margin-top:6px;background:#FBF7EE;color:#131310;border-radius:12px;padding:9px 12px;
  font-size:12.5px;font-weight:700;line-height:1.45;box-shadow:0 0 0 2px rgba(0,0,0,.4)}
"""

def _mark_term(text, term, defn, open_=False):
    """The term is marked INSIDE the sentence it already appears in. If it does
    not occur there, nothing is marked and nothing is invented to hold it."""
    if term is None or term not in text:
        return esc(text), ""
    i = text.index(term)
    body = (esc(text[:i]) + '<span class="gt">%s</span>' % esc(term)
            + esc(text[i + len(term):]))
    return body, ('<div class="gdef2"><b>%s</b> — %s</div>' % (esc(term), esc(defn))
                  if open_ else "")

def _first_term(text):
    for t in sorted(DATA["glossary"], key=len, reverse=True):
        if t in text:
            return t, DATA["glossary"][t]
    return None, None

import re as _re
_COUNT_RE = _re.compile(r"[^.]*\d+\s*מול\s*\d+[^.]*\.")

def b5_panel(issue, big, state, open_gloss=False):
    """One beat-5 panel. `big` picks the variant: a large numeral, or a quieter
    figure beside the resolution."""
    res = S["ans_t"] if issue["tf_answer"] == "true" else S["ans_f"]
    term, defn = _first_term(issue["tf_explain"])
    exp, gdef = _mark_term(issue["tf_explain"], term, defn, open_gloss)
    tal = issue.get("_tally")
    prose = _COUNT_RE.search(issue.get("bill_summary", ""))
    if tal:
        # PRIMARY: the count leads and counts up.
        num = numeral("%d-%d" % (tal["for"], tal["against"]),
                      "b5big" if big else "b5quiet", 66 if big else 22)
        lead = ('<div class="b5lead">%s<span class="b5res%s">%s</span></div>'
                '<p class="b5sub">%s %s</p>'
                % (num, "" if big else " b5res-lg", esc(res),
                   esc(S["knesset"]), esc(S["passed"])))
    elif prose:
        # THE THIRD CASE, and it was undesigned. A count exists but only inside
        # bill_summary prose, with no field to read it from — so it cannot be a
        # numeral and it cannot count up. The resolution leads, and the ONE
        # shipped sentence that carries the number is quoted under it as words.
        lead = ('<div class="b5lead"><span class="b5res b5res-lg">%s</span></div>'
                '<p class="b5sub">%s</p>' % (esc(res), esc(prose.group(0).strip())))
    else:
        # NO NUMBERS ANYWHERE. The resolution simply becomes the primary. Nothing
        # is missing from this layout because nothing was reserved for a count.
        lead = '<div class="b5lead"><span class="b5res b5res-lg">%s</span></div>' % esc(res)
    src = ('<p class="b5src1">%s%s%s</p>'
           % (esc(S["src_prefix"]), esc(issue["source"]["name"]),
              (" · " + esc(S["knesset_link"])) if issue.get("knesset_url") else ""))
    return ('<span class="b5st">%s</span><div class="b5p">%s'
            '<p class="b5exp2">%s</p>%s%s</div>' % (esc(state), lead, exp, gdef, src))

def board_beats13():
    # ---------------------------------------------------------- BEAT 3 overlay
    card = ('<div class="v4wrap"><div class="v4card">'
            '<span class="v4halo"></span>%s'
            '<div class="v4id"><h2 class="v4name">%s</h2><br>'
            '<span class="v4party">%s</span></div>'
            '<div class="b3ov"><p class="b3ov-t">%s</p><span class="b3ov-d">%s</span>'
            '<p class="b3ov-go">%s</p></div></div></div>'
            % (_bgv_img("B", 400, "v4port"), esc(BGV["name"]), esc(BGV["party"]),
               esc(B_ISS_T["bill_title"]), esc(B_ISS_T["bill_date"]),
               ph("רמז: הקישו כדי להמשיך", "Beat 3 overlay: the dismiss hint")))
    BOARDS.append(dict(file="V13B3OV.dc.html", var="v13b3", num="B3-OVERLAY",
        he="B3 overlay", en="Beat 3 · overlay over the MK card", note="", fh=900,
        body=('%s<span class="cs-id v-tag">B3-OVERLAY</span>%s'
              '<div class="fz comp">%s</div>' % (BGV_DEFS, b_pin(), card)),
        css=COMP_CSS + BEATS_CSS + BGV_CSS + V12_CSS + V13_CSS))
    FRAME_NOTES["V13B3OV.dc.html"] = (
        "Beat 3 is no longer a screen. B3-A's content — bill_title and bill_date, nothing "
        "else — sits on a translucent, backdrop-blurred overlay over the beat-4 card, and "
        "the player dismisses it into the prediction. The bill is read while looking at the "
        "person it is about.\\n"
        "WHAT SHOWS THROUGH, and it is the whole card and only the card: the portrait, the "
        "name and the party. No bill_summary, no tally, no sources — the same guardrail as "
        "the beat-2 overlay, for the same reason.\\n"
        "The merged-into-the-header alternative is retired.",
        "Supplied illustration. Provenance and licence NOT verified.")

    # ---------------------------------------------------------- BEAT 5 rebuilt
    ISS_PROSE = ISSUES["b2"]
    for vid, big, what in (("B5-A1", True, "the count as a large numeral"),
                           ("B5-A2", False, "the count as a quiet figure beside the resolution")):
        panels = (b5_panel(B_ISS_T, big, "WITH TALLY · r1", open_gloss=True)
                  + b5_panel(B_ISS_N, big, "NO NUMBERS · e2")
                  + b5_panel(ISS_PROSE, big, "COUNT IN PROSE ONLY · b2"))
        BOARDS.append(dict(file="V13%s.dc.html" % vid.replace("-", ""),
            var="v13" + vid.replace("-", "").lower(), num=vid, he=vid,
            en="Beat 5 · %s · %s" % (vid, what), note="", fh=1060,
            body=(BGV_DEFS + '<span class="cs-id v-tag">%s</span>%s'
                  '<div class="fz b5w">%s</div>' % (vid, b_pin(), panels)),
            css=COMP_CSS + BEATS_CSS + V12_CSS + V13_CSS))
        FRAME_NOTES["V13%s.dc.html" % vid.replace("-", "")] = (
            "B5-A rebuilt. The density was not a styling problem — the beat was carrying "
            "four things at once, so the fix is that there is LESS on screen, in a strict "
            "order.\\n"
            "PRIMARY %s. SECONDARY tf_explain, plainly beneath it. TERTIARY sources as ONE "
            "line — not a block, not a card, not chips. Present and checkable, not "
            "competing.\\n"
            "GLOSSARY: no panel. The term is marked inline in the sentence it already "
            "occurs in, and tapping it opens the definition — shown open on the first "
            "panel. Where a term does not occur in an issue's text, nothing is marked and "
            "nothing is manufactured to hold it. Measured: 14 of 16 issues carry at least "
            "one term in tf_explain, bill_summary or bill_title.\\n"
            "THREE STATES, because there are three and not two:\\n"
            "  r1 — _tally exists, the count leads and counts up.\\n"
            "  e2 — no vote numbers anywhere. The RESOLUTION leads instead. Nothing "
            "collapses and nothing looks missing, because no space was reserved for a "
            "count.\\n"
            "  b2 — the undesigned case: a count exists but only inside bill_summary "
            "PROSE, with no field exposing it. It cannot be a numeral and it cannot count "
            "up, so the resolution leads and the one shipped sentence carrying the number "
            "is quoted underneath as words. b2, a2 and s2 are all in this state."
            % ("the count, large, with the resolution beside it"
               if big else "the resolution, with the count quiet beside it"), None)

# ======================= 14 · Ben Gvir illustration spike (A vs B) ==========
# Two supplied illustrations, one card, one frame, one verdict. The ONLY
# variable is the artwork: both styles come from a single crop box applied to
# two source images that are aligned to within 1px on the eyeline, and both are
# framed in MF-B, the picked MK frame.
#
# SIZE RULE, enforced by _bgv_img() and checked by the audit: anything rendered
# under 150px is served by the 128px export. Style A is a halftone; letting the
# browser resample the 400px file down to 48px would be a test of the browser's
# resampler, not of the style.
BGV_ART = {"A": ("bengvir_styleA_400.webp", "bengvir_styleA_128.webp"),
           "B": ("bengvir_styleB_400.webp", "bengvir_styleB_128.webp")}

def _bgv_img(style, px, cls="", extra=""):
    big, small = BGV_ART[style]
    src = big if px >= 150 else small
    return ('<img class="%s" src="%s" alt="" style="width:%dpx;height:%dpx%s" '
            'data-px="%d" data-file="%s">'
            % (cls, src, px, round(px * 838 / 628), extra, px, "400" if px >= 150 else "128"))

# ---------------------------------------------------------------- THE SET
# Six of the twenty-one politicians in data.js now have an illustration, all six
# of them framed by tools/frame_mk.py off the rule recovered from Ben Gvir's own
# shipped crop: 3:4, face 68.3% of the frame width, eyeline at 37.7%.
MK_ART = {pid: ("mk_%s_400.webp" % pid, "mk_%s_128.webp" % pid)
          for pid in ("ben_gvir", "netanyahu", "deri", "lapid", "gantz", "michaeli")}
MK_H = 533 / 400          # the framed aspect, one number for the whole set

def mk_initials(pid):
    """The badge's letters are the shipped name, sliced — the first letter of
    each of its parts. Nothing is written here; if data.js renames someone the
    badge renames with them."""
    parts = [p for p in DATA["politicians"][pid]["name"].replace("-", " ").split() if p]
    return "\u05f4".join(p[0] for p in parts[:2])

def mk_img(pid, px, cls="", extra=""):
    """A portrait at a given size, or the badge for an MK with no illustration.

    NEVER a substitute face. Fifteen of the twenty-one have no art, and the one
    thing the card cannot do is put somebody else's face on their vote."""
    h = round(px * MK_H)
    if pid not in MK_ART:
        return ('<span class="mkbadge %s" style="width:%dpx;height:%dpx;'
                '--bw:%dpx%s" data-px="%d" data-file="badge"><i>%s</i></span>'
                % (cls, px, h, px, extra, px, esc(mk_initials(pid))))
    big, small = MK_ART[pid]
    return ('<img class="%s" src="%s" alt="" style="width:%dpx;height:%dpx%s" '
            'data-px="%d" data-file="%s">'
            % (cls, big if px >= 150 else small, px, h, extra, px,
               "400" if px >= 150 else "128"))

# ======================= v15 · avatar art direction, three proposals ========
# The current figures are flat vector cartoons and share nothing with the MK
# illustrations or the chair. Three treatments, one geometry, so the only
# variable is the treatment.
#
# THE LINE THAT MUST NOT BE CROSSED: the player is the 121st MK, not one of the
# 120. If the avatar reads as the same class of object as a politician portrait
# the whole premise collapses. Three devices hold it, and every proposal uses
# all three:
#   1  ROUND, never the 3:4 card. Every MK on this board lives in a 3:4 box.
#   2  NO MODELLING. The MK illustrations are drawn from a real face with
#      shading and likeness; these are constructed from primitives.
#   3  NO NAME PLATE. An MK card always carries a name and a party under it.
# Each proposal then adds a fourth of its own, named in its note.
AV_GEO = dict(head=(50, 40, 21), skin="#E8B48C")

def _av_body(stroke, skinfill, hairfill, shirt, face=True, sw=3.4, extra=""):
    hx, hy, hr = AV_GEO["head"]
    eyes = ('<circle cx="43" cy="39" r="2.1" fill="%s"/>'
            '<circle cx="57" cy="39" r="2.1" fill="%s"/>'
            '<path d="M45 48 q5 3.4 10 0" fill="none" stroke="%s" '
            'stroke-width="2.4" stroke-linecap="round"/>' % (stroke, stroke, stroke)) if face else ""
    return (
      '<path d="M22 100 v-9 a28 28 0 0 1 56 0 v9 z" fill="%s" stroke="%s" '
      'stroke-width="%.1f" stroke-linejoin="round"/>'
      '<rect x="44" y="55" width="12" height="10" fill="%s" stroke="%s" stroke-width="%.1f"/>'
      '<circle cx="%d" cy="%d" r="%d" fill="%s" stroke="%s" stroke-width="%.1f"/>'
      '<path d="M29 36 a21 21 0 0 1 42 0 q-10 -7 -21 -7 t-21 7 z" fill="%s" '
      'stroke="%s" stroke-width="%.1f" stroke-linejoin="round"/>%s%s'
      % (shirt, stroke, sw, skinfill, stroke, sw, hx, hy, hr, skinfill, stroke, sw,
         hairfill, stroke, sw, eyes, extra))

def av_prop(kind, px, uid):
    """One avatar at one size. Served as its own SVG so nothing is resampled."""
    ring = 5 if px >= 150 else (2.4 if px >= 56 else 1.8)
    if kind == "AV-1":
        inner = _av_body("#131310", "#E8B48C", "#3B3025", "#2F5FBF")
        deco = ""
    elif kind == "AV-2":
        # the hatch belongs to the FIGURE, not to the ground behind it. Clipped
        # to the silhouette it reads as a drawn surface; clipped to the sticker
        # it just looks like hatched wallpaper, which is what the first render
        # of this frame showed.
        inner = ('<g filter="url(#avr-%s)">%s</g>'
                 '<g clip-path="url(#avf-%s)" opacity=".55">'
                 '<rect x="0" y="0" width="100" height="100" fill="url(#avh-%s)"/></g>'
                 % (uid, _av_body("#2A211A", "#D8A579", "#6B4E33", "#B4813F", sw=3.8),
                    uid, uid))
        deco = ""
    else:   # AV-3
        inner = ('%s'
                 '<path d="M29 36 a21 21 0 0 1 42 0 q-10 -7 -21 -7 t-21 7 z" fill="none" '
                 'stroke="#FBF7EE" stroke-width="2.2" stroke-linejoin="round" opacity=".9"/>'
                 % _av_body("#131310", "#E2C6A8", "#4A3B2C", "#6E7F5C", face=False, sw=3.4))
        deco = ""
    return ('<svg class="avp%d" viewBox="0 0 100 100" width="%d" height="%d" '
            'aria-hidden="true" data-px="%d" data-file="svg">'
            '<defs>'
            '<clipPath id="avc-%s"><circle cx="50" cy="50" r="48"/></clipPath>'
            '<clipPath id="avf-%s"><circle cx="50" cy="40" r="21"/>'
            '<path d="M22 100 v-9 a28 28 0 0 1 56 0 v9 z"/></clipPath>'
            '<pattern id="avh-%s" width="6" height="6" patternUnits="userSpaceOnUse" '
            'patternTransform="rotate(38)">'
            '<line x1="0" y1="0" x2="0" y2="6" stroke="#5A4327" stroke-width="1.3"/></pattern>'
            '<filter id="avr-%s"><feTurbulence type="fractalNoise" baseFrequency="0.07" '
            'numOctaves="2" seed="7" result="n"/>'
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.9" '
            'xChannelSelector="R" yChannelSelector="G"/></filter>'
            '</defs>'
            '<circle cx="50" cy="50" r="48" fill="%s" stroke="#FBF7EE" stroke-width="%.1f"/>'
            '<g clip-path="url(#avc-%s)">%s</g>'
            '<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,.55)" '
            'stroke-width="1.6"/>%s</svg>'
            % (px, px, px, px, uid, uid, uid, uid,
               "#C9BFA6" if kind != "AV-2" else "#E3D6B4", ring, uid, inner, deco))

AV_CSS = """
/* the sticker box: AV-3 is a square SVG, where the old figure was a 100x100
   viewBox with its own padding. Same outer .avs hook, so every filter, die-cut
   and size rule already written against .avs keeps working. */
.avs3{display:inline-block;line-height:0}
.avs3 svg{display:block;width:100%;height:100%}

.avrow{display:flex;flex-direction:column;gap:12px;padding:12px 8px 14px}
/* 200 + 64 + 40 plus two 12px gaps and 10px of padding either side is 348px,
   inside the 358px the frame gives. At 18px gaps the 40px cell ran off the
   left edge and the frame clipped it. */
.avcell{display:flex;align-items:flex-end;justify-content:center;gap:12px;
  background:#D8C9A8;border:4px solid #fff;padding:12px 10px 10px;
  box-shadow:0 0 0 2px rgba(0,0,0,.5),0 5px 0 rgba(0,0,0,.4)}
.avcell figure{display:flex;flex-direction:column;align-items:center;gap:6px;margin:0}
.avcell figcaption{direction:ltr;font-size:9.5px;font-weight:700;color:#4A4436}
.avhead{display:flex;flex-direction:column;gap:2px;padding:0 6px}
.avhead b{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:20px;
  color:#F2ECDD;line-height:1.1}
.avhead i{font-style:normal;font-size:10.5px;font-weight:700;color:#BEB9AC;
  direction:ltr;text-align:right}
.avp200,.avp64,.avp40{display:block}
"""

# ------------------------------------------------- topic and issue graphics
# Keyed by the ids data.js already uses, so nothing here is a second naming
# scheme to keep in sync. Every entry is written at the exact pixel size it
# renders at (tools/prep_topic.py) — no browser downscale anywhere.
TOPIC_ICON = {                       # topic id -> {rendered height: file}
  "internal_sec": {40: "internal_sec_main_40.webp", 52: "internal_sec_main_52.webp",
                   64: "internal_sec_main_64.webp", 128: "internal_sec_main_128.webp"},
}
TOPIC_ICON_AR = {"internal_sec": 812 / 1294}      # the padlock is portrait

ISSUE_ART = {                        # issue id -> (file, w, h)
  "s1": ("internal_sec_s1_300.webp", 300, 180),
  "s2": ("internal_sec_s2_210.webp", 116, 210),
}

def topic_icon(t, h=52):
    """The topic's mark. An image where one exists, the shipped glyph where it
    does not — so seven topics keep working untouched while one gets art."""
    tid = t["id"] if isinstance(t, dict) else t
    tab = TOPIC_ICON.get(tid)
    if not tab:
        return '<span class="node-em">%s</span>' % esc(
            (t["icon"] if isinstance(t, dict) else ""))
    px = min(tab, key=lambda k: abs(k - h))
    w = round(px * TOPIC_ICON_AR[tid])
    return ('<img class="node-ico" src="%s" alt="" style="width:%dpx;height:%dpx" '
            'data-px="%d" data-file="%d">' % (tab[px], w, px, px, px))

def issue_art(iid, cls=""):
    f, w, h = ISSUE_ART[iid]
    return ('<img class="%s" src="%s" alt="" style="width:%dpx;height:%dpx" '
            'data-px="%d" data-file="exact">' % (cls, f, w, h, max(w, h)))

TOPIC_ART = {"police": ("topic_police_300.webp", "topic_police_128.webp")}
TOPIC_AR = 196 / 300      # the cap's ink box, 1530x1001 trimmed

def topic_img(px, cls=""):
    big, small = TOPIC_ART["police"]
    return ('<img class="%s" src="%s" alt="" style="width:%dpx;height:%dpx" '
            'data-px="%d" data-file="%s">'
            % (cls, big if px >= 150 else small, px, round(px * TOPIC_AR), px,
               "300" if px >= 150 else "128"))

B1_CSS = """
/* BEAT 1 IS BEAT 4'S CARD. Everything structural comes from .v4card — the
   340x620 box, the kraft and grid, the 5px edge, the shadow — and only the
   contents differ. The one addition is a column layout, because a claim card
   stacks its parts where an MK card layers them over a portrait. */
/* the preview chip sits at top:14px, so the graphic starts below it rather
   than under it */
.b1c{display:flex;flex-direction:column;align-items:center;padding:44px 16px 84px}
/* the graphic occupies the upper area the way the portrait occupies beat 4's,
   and takes the same die-cut sticker edge as the chair — it is a cut-out
   object on kraft, not a bled photograph. */
.b1topic{flex:none;display:grid;place-items:center;min-height:210px}
.b1hat{display:block;filter:url(#dcw-%VAR%) drop-shadow(0 5px 0 rgba(0,0,0,.30))}
.b1big{flex:1;display:grid;place-items:center;margin-top:6px;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:29px;
  line-height:1.16;color:#131310;text-align:center;text-wrap:balance}
/* the two answers use the SAME construction as the three vote chips — same
   white fill, same keyline, same shadow, same height. They are not styled
   apart, and neither of them is styled apart from the other. */
.b1ans2 .vbtn{font-size:25px;min-height:60px;background:#fff}
/* the card mid-swipe, sliding off one edge */
.b1swipe{position:absolute;z-index:0;top:0;bottom:0;width:326px;background:#D8C9A8;
  border:5px solid #fff;box-shadow:0 9px 0 rgba(0,0,0,.3);opacity:.62;
  display:grid;place-items:center}
.b1swipe span{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:26px;color:#131310}
/* THE PREVIEW, in a top corner. NO COLOUR CODING: both answers get the same
   ink, the same plate, the same size. It says which WORD the drag is heading
   to, never which one is right. */
.b1prev{position:absolute;z-index:9;top:14px;display:flex;align-items:center;gap:8px;
  background:#FBF7EE;border:3px solid #fff;border-radius:20px;padding:6px 14px 8px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.5),0 4px 0 rgba(0,0,0,.34)}
.b1prev b{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:22px;
  color:#131310}
.b1prev i{font-style:normal;font-size:11px;font-weight:700;color:#5A5238;direction:ltr}
"""

MK_CSS = """
/* THE FALLBACK, and it is a fallback rather than a placeholder: fifteen of the
   twenty-one MKs have no illustration and may never have one. Same box, same
   3:4, same ground — the initials stand where the face would and are set on the
   SET'S OWN EYELINE, 37.7% down, so a card without art is plainly the same
   object as a card with one rather than a broken version of it.
   What it must never do is borrow a face: putting somebody else's portrait on
   an MK's vote is the one substitution this board cannot make. */
.mkbadge{position:relative;display:block;background:#C0B190;overflow:hidden}
/* the badge stands IN for the portrait, so where the portrait is absolutely
   placed the badge has to be too — .mkbadge's own position:relative was
   winning on order alone and the badge fell into the card's flow, 30px off
   centre with its letters running off the edge. */
.v4port.mkbadge{position:absolute;left:50%;translate:-50% 0;bottom:0}
.mkbadge i{position:absolute;left:0;right:0;top:37.7%;translate:0 -50%;
  font-style:normal;text-align:center;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;
  font-size:calc(var(--bw,100px) * .2);line-height:1;color:#7A6D51;
  letter-spacing:.02em}
"""

# the three die-cut radii. primitiveUnits are user space, so the radius is in
# CSS px of the rendered element and does NOT scale with it — an 5px edge on a
# 176px card is a 5px edge on an 18px chip too, which would swallow it.
BGV_DEFS = """<svg class="defs" width="0" height="0" aria-hidden="true"><defs>
  <filter id="bcut-lg" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
    <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"></feMorphology>
    <feFlood flood-color="#fff" result="f"></feFlood>
    <feComposite in="f" in2="d" operator="in" result="cut"></feComposite>
    <feMerge><feMergeNode in="cut"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
  </filter>
  <filter id="bcut-sm" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
    <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"></feMorphology>
    <feFlood flood-color="#fff" result="f"></feFlood>
    <feComposite in="f" in2="d" operator="in" result="cut"></feComposite>
    <feMerge><feMergeNode in="cut"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
  </filter>
  <filter id="bcut-xs" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
    <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="d"></feMorphology>
    <feFlood flood-color="#fff" result="f"></feFlood>
    <feComposite in="f" in2="d" operator="in" result="cut"></feComposite>
    <feMerge><feMergeNode in="cut"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
  </filter>
</defs></svg>"""

def _bgv_pin():
    # s1's claim is FALSE, so the pinned beat-1 answer on its chrome is שקר.
    assert S1["tf_answer"] == "false", S1["tf_answer"]
    return pinned_word(S["ans_f"])

def _bgv_card(style, verdict=None, extra=""):
    """His beat-4 card, MF-B, issue s1. Same construction as the shipped beat 4;
    only the portrait source and the MK differ."""
    vd = ('<span class="vd vd-a vd-%s">%s</span>'
          % ("right" if verdict == VD_RIGHT else "surp", esc(verdict))) if verdict else ""
    return ('<div class="stack" style="height:560px">%s'
            '<article class="scard ccard mk-card">'
            '<div class="portrait">%s</div>'
            '<div class="ident"><h2 class="mk-name">%s</h2>'
            '<p class="mk-party">%s</p></div>'
            '<div class="tally">'
            '<div class="tally-cell"><span class="tally-label">%s</span>'
            '<span class="tally-val">%s</span></div>'
            '<span class="tally-sep" aria-hidden="true"><svg viewBox="0 0 24 24">'
            '<path d="M20 12H4"></path><path d="M10 6l-6 6 6 6"></path></svg></span>'
            '<div class="tally-cell"><span class="tally-label">%s</span>'
            '<span class="tally-val">%s</span></div></div>'
            '<p class="mk-note">%s</p>'
            '<p class="basis">%s</p>%s%s</article></div>'
            % (pile(), _bgv_img(style, 176, "portrait-img bgv-port"),
               esc(BGV["name"]), esc(BGV["party"]),
               esc(S["guess_label"]), esc(S["v_against"]),
               esc(S["voted_label"]), esc(S["v_for"]),
               esc(BGV_S1["note"]), esc("📌 " + S["basis_doc"]), vd, extra))

BGV_CSS = """
/* the supplied artwork is a cut-out with its own transparency, so it takes the
   plain white die-cut and NOT the multicolour dc- filter the photo uses: that
   filter's blue offset was drawn for a rectangular photo crop. */
.bgv-port{width:176px;height:235px;object-fit:contain;object-position:50% 100%;
  border-radius:0;filter:url(#bcut-lg) drop-shadow(0 3px 0 rgba(0,0,0,.26))}
.portrait{translate:0 0;height:235px}
.sizes{display:flex;align-items:flex-end;gap:11px;margin:0 0 4px;direction:ltr}
.sz{display:flex;flex-direction:column;align-items:center;gap:5px}
.sz i{font-style:normal;direction:ltr;font-size:9.5px;font-weight:700;color:#BEB9AC}
.sil{display:block}
.sil-xs{filter:url(#bcut-xs)}
.sil-sm{filter:url(#bcut-sm) drop-shadow(0 1px 0 rgba(0,0,0,.3))}
.sil-lg{filter:url(#bcut-lg) drop-shadow(0 2px 0 rgba(0,0,0,.28))}
/* the square avatar slot: a crop in a die-cut box, the other way a small
   portrait can appear in this system */
.slot{display:block;background:#D8C9A8;object-fit:cover;object-position:50% 14%;
  border:2px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,.55),0 2px 0 rgba(0,0,0,.34)}
.crow{display:flex;gap:14px;align-items:flex-end;direction:ltr;flex-wrap:wrap}
.cc{display:flex;flex-direction:column;align-items:center;gap:6px}
.cc i{font-style:normal;direction:ltr;font-size:9.5px;font-weight:700;color:#BEB9AC}
.onlight{background:#EFE6D2;padding:10px;display:inline-flex;gap:14px;border-radius:4px;
  direction:ltr;margin-top:10px}
.onlight .cc i{color:#4A4436}
.bgv-h{direction:ltr;font-size:11px;font-weight:800;letter-spacing:.1em;color:#131310;
  background:#FFD60A;border-radius:20px;padding:3px 11px 4px;display:inline-block;margin:0 0 10px}
.bgv-wrap{flex:1;display:flex;flex-direction:column;padding-top:6px}
"""

def board_bengvir():
    # (a) the cascade card, full size, one frame per style
    for style in ("A", "B"):
        BOARDS.append(dict(
            file="BgvCard%s.dc.html" % style, var="bgc" + style.lower(),
            num="I" + style, he="Ben Gvir " + style,
            en="Ben Gvir · style %s · cascade card" % style, note="", fh=880,
            body=('%s<span class="cs-id bgv-tag">STYLE %s</span>'
                  '<div class="fz comp">%s%s</div>'
                  % (BGV_DEFS, style, _bgv_pin(), _bgv_card(style))),
            css=COMP_CSS + BEAT4_CARD_CSS + BGV_CSS))
    # (b) the three verdict states, one frame per style
    for style in ("A", "B"):
        cards = "".join('<div style="margin-bottom:34px">%s</div>' % _bgv_card(style, tok)
                        for tok, _kind in VERDICT_TOKENS)
        BOARDS.append(dict(
            file="BgvVerdict%s.dc.html" % style, var="bgv" + style.lower(),
            num="I" + style + "v", he="Ben Gvir verdicts " + style,
            en="Ben Gvir · style %s · three verdict states" % style, note="", fh=2020,
            body=('%s<span class="cs-id bgv-tag">STYLE %s</span>'
                  '<div class="fz comp" style="padding-top:44px">%s%s</div>'
                  % (BGV_DEFS, style, _bgv_pin(), cards)),
            css=COMP_CSS + BEAT4_CARD_CSS + BGV_CSS))
    # (c)+(d) every small appearance at its true rendered size, and 48px on both grounds
    def row(style):
        cells = []
        for px in (18, 40, 48, 64, 128):
            cls = "sil sil-xs" if px < 30 else ("sil sil-sm" if px < 90 else "sil sil-lg")
            cells.append('<div class="sz">%s<i>%d</i></div>'
                         % (_bgv_img(style, px, cls), px))
        return '<div class="sizes">%s</div>' % "".join(cells)
    def crop48(style, lbl):
        return ('<div class="cc">%s<i>%s slot</i></div>'
                '<div class="cc">%s<i>%s cut</i></div>'
                % (_bgv_img(style, 48, "slot", ";height:48px"), lbl,
                   _bgv_img(style, 48, "sil sil-sm"), lbl))
    body = ('%s<div class="fz bgv-wrap">'
            '<span class="bgv-h">C · TRUE RENDERED SIZE</span>'
            '<span class="cs-id" style="align-self:flex-start;margin-bottom:6px">STYLE A</span>%s'
            '<span class="cs-id" style="align-self:flex-start;margin:10px 0 6px">STYLE B</span>%s'
            '<span class="bgv-h" style="margin-top:26px">D · 48px, BOTH GROUNDS</span>'
            '<div class="crow">%s%s</div>'
            '<div class="onlight">%s%s</div>'
            '</div>' % (BGV_DEFS, row("A"), row("B"),
                        crop48("A", "A"), crop48("B", "B"),
                        crop48("A", "A"), crop48("B", "B")))
    BOARDS.append(dict(file="BgvSizes.dc.html", var="bgs", num="Is",
        he="Ben Gvir small", en="Ben Gvir · small appearances + 48px",
        note="", fh=820, body=body, css=BGV_CSS))

# ============================ 12 · MK sticker treatment test ================
# The first pass used CSS filter hacks — sepia + hue-rotate for "duotone", a
# contrast bump for "posterize". Neither was what it claimed: the duotone came
# out neon pink and the posterize was indistinguishable from the original.
# These are real SVG filters. feComponentTransfer with discrete tableValues IS
# posterisation; a duotone is a luminance ramp mapped onto two ink values. Each
# is a fixed filter with no per-photo parameters, so it applies mechanically to
# all 21 MKs.
MK_FILTERS = """<svg class="defs" width="0" height="0" aria-hidden="true"><defs>
  <filter id="mk-mono" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values=".34 .5 .16 0 0 .34 .5 .16 0 0 .34 .5 .16 0 0 0 0 0 1 0"></feColorMatrix>
    <feComponentTransfer>
      <feFuncR type="linear" slope="1.5" intercept="-.24"></feFuncR>
      <feFuncG type="linear" slope="1.5" intercept="-.24"></feFuncG>
      <feFuncB type="linear" slope="1.5" intercept="-.24"></feFuncB>
    </feComponentTransfer>
  </filter>
  <filter id="mk-duo" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values=".34 .5 .16 0 0 .34 .5 .16 0 0 .34 .5 .16 0 0 0 0 0 1 0"></feColorMatrix>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.11 0.99"></feFuncR>
      <feFuncG type="table" tableValues="0.09 0.94"></feFuncG>
      <feFuncB type="table" tableValues="0.17 0.78"></feFuncB>
    </feComponentTransfer>
  </filter>
  <filter id="mk-post" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values=".34 .5 .16 0 0 .34 .5 .16 0 0 .34 .5 .16 0 0 0 0 0 1 0"></feColorMatrix>
    <feComponentTransfer>
      <feFuncR type="discrete" tableValues="0 .34 .64 1"></feFuncR>
      <feFuncG type="discrete" tableValues="0 .34 .64 1"></feFuncG>
      <feFuncB type="discrete" tableValues="0 .34 .64 1"></feFuncB>
    </feComponentTransfer>
  </filter>
</defs></svg>"""

def board_mk_treatment():
    """One MK, one die-cut frame, four uniform filters. Frame and outline are
    identical across all four — the test is the filter only. Nothing here
    redraws a face: no illustration, no caricature."""
    opts = (("untouched", "none", "MK-1"),
            ("mono, high contrast", "url(#mk-mono)", "MK-2"),
            ("duotone", "url(#mk-duo)", "MK-3"),
            ("posterize, 4 levels", "url(#mk-post)", "MK-4"))
    cells = "".join(
        '<div class="mkt-cell"><div class="mkt-frame">'
        '<img class="mkt-img" style="filter:%s" src="mk-portrait.webp" alt="">'
        '</div><span class="mkt-lbl">%s</span><span class="cs-id">%s</span></div>'
        % (f, esc(lbl), oid) for lbl, f, oid in opts)
    body = ('  <div class="fz mkt">%s<div class="mkt-row">%s</div>'
            '<p class="mkt-name">%s · %s</p></div>'
            % (MK_FILTERS, cells, esc(GANTZ["name"]), esc(GANTZ["party"])))
    css = """
.mkt{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
.mkt-row{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;justify-content:center;
  width:344px}
.mkt-cell{display:flex;flex-direction:column;align-items:center;gap:6px;width:160px}
/* identical on all four: this test is the filter only */
.mkt-frame{width:154px;height:196px;overflow:hidden;background:#2B2926;
  border:7px solid #fff;box-shadow:0 0 0 2.5px rgba(0,0,0,.7),0 6px 0 rgba(0,0,0,.42)}
.mkt-cell:nth-child(1) .mkt-frame{rotate:-1.6deg}
.mkt-cell:nth-child(2) .mkt-frame{rotate:1.4deg}
.mkt-cell:nth-child(3) .mkt-frame{rotate:-1deg}
.mkt-cell:nth-child(4) .mkt-frame{rotate:1.8deg}
.mkt-img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 16%}
.mkt-lbl{direction:ltr;font-size:11.5px;font-weight:700;color:#BEB9AC;text-align:center}
.mkt-name{font-size:14px;font-weight:700;color:#EFECE4}
/* .cs-id is in SHARED — this board had its own stale copy of it */
"""
    BOARDS.append(dict(file="MkTreatment.dc.html", var="mkt", num="M",
        he="MK treatment", en="MK sticker treatment · 4 filters", note="",
        fh=700, body=body, css=css))

# =================================== 8 · sort-to-commit (3 concept frames)
# The current beat 4 predicts one MK at a time and resolves each card
# immediately, which leaks: every prediction after the first is made with
# information the game just handed over. Sorting all MKs first and only then
# running the cascade removes the leak and lets the player reason
# comparatively — the pick'em shape, fill the slip then watch results.
#
# WHAT MUST SURVIVE: the reveal is still one card at a time with variable
# tempo, fast on expected votes and held on the surprising ones, driven by
# data.js's key flag. A batch reveal would flatten the best moment in the game
# into a score. Sort to commit; cascade to reveal.
#
# Two measurements shape the screen and are not guesses:
#   · abstain is 7 of 98 votes across the corpus and appears in only 4 of 16
#     rounds, so a נמנע pot is empty in 12 of 16. It is therefore PERMANENT —
#     showing it only when needed would announce that somebody abstained —
#     and it has to look deliberate when empty rather than broken.
#   · 9 MKs on 390px is ~80px each, and the die-cut portrait does not survive
#     at 80px. So: CHIPS to sort, CARDS to reveal. The card is not shrunk.
R1_MKS = [(p["id"], DATA["politicians"][p["id"]]["name"],
           DATA["politicians"][p["id"]]["party"], p["vote"], p.get("key", False))
          for p in R1["politicians"]]
assert len(R1_MKS) == 9 and not any(v == "abstain" for _, _, _, v, _ in R1_MKS)

REVEAL_BTN = from_app("גילוי — איך הם ", "the commit/reveal action") + "הצביעו באמת?"
OF_N = from_app(" מתוך ", "the X-of-Y construction app.js already uses")

def chip_thumb():
    """The sort chip's thumbnail. A neutral placeholder head for EVERY MK,
    including the one whose photograph we hold: on a screen that asks the
    player to sort real people into bins, giving one of them a real face and
    the other eight a silhouette would weight the row. The real portrait
    returns in the cascade card, where every MK gets it."""
    return ('<span class="cthumb"><svg viewBox="0 0 200 240" aria-hidden="true">'
            '<path d="M100 20c-27 0-46 20-46 49 0 15 2 28 7 40 6 16 21 28 39 28s33-12 39-28'
            'c5-12 7-25 7-40 0-29-19-49-46-49Z"></path>'
            '<path d="M86 126h28v34H86z"></path>'
            '<path d="M100 150c-46 0-84 24-95 52-4 11-6 24-6 38h202c0-14-2-27-6-38-11-28-49-52-95-52Z"></path>'
            '</svg></span>')

def placed_chip(name):
    return '<span class="pchip">%s<span class="pchip-n">%s</span></span>' % (chip_thumb(), esc(name))

def sort_chip(name, party, sel=None):
    """An unsorted chip with its three-way control.

    THE CHEAP INTERACTION, and the one recommended for build: tap a segment to
    assign. The three segments are one construction used three times — same
    box, same ink, same weight — because any size or colour difference between
    בעד, נגד and נמנע would code vote direction. The selected state is carried
    on the same three neutral channels the builder uses (border weight, lift,
    ring), never on hue.
    """
    segs = "".join(
        '<button type="button" class="seg3%s">%s</button>'
        % (" on" if k == sel else "", esc(v))
        for k, v in enumerate((S["v_for"], S["v_against"], S["v_abstain"])))
    return ('<div class="schip"><div class="schip-id">%s'
            '<span class="schip-t"><b>%s</b><i>%s</i></span></div>'
            '<div class="seg3row">%s</div></div>'
            % (chip_thumb(), esc(name), esc(party), segs))

def pot(label, names, cls=""):
    """One pot. All three are the SAME element with the same styling; only the
    label and the contents differ. Nothing about a pot encodes which way it
    points."""
    inner = ("".join(placed_chip(n) for n in names) if names
             else '<span class="pot-empty" aria-hidden="true"></span>')
    return ('<section class="pot %s"><span class="pot-label">%s</span>'
            '<span class="pot-count">%s</span><div class="pot-body">%s</div></section>'
            % (cls, esc(label), numeral(str(len(names)), "pot-n", 15), inner))

SORT_CSS = """
.sort{flex:1;display:flex;flex-direction:column;gap:12px;padding-top:40px}
.sort-prompt{padding:0 2px;max-width:250px}
.pots{display:flex;flex-direction:column;gap:9px}
/* THE THREE POTS ARE ONE ELEMENT USED THREE TIMES. No colour, size, order
   weight or border difference between them: a pot that looked different would
   code vote direction, which this game never does. */
.pot{position:relative;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;
  gap:2px 10px;align-items:center;min-height:92px;padding:11px 13px 12px;
  background:#FBF7EE;border-radius:16px;
  box-shadow:0 6px 14px rgba(0,0,0,.34),0 2px 0 rgba(0,0,0,.18)}
.pot-label{grid-column:1;grid-row:1;font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;font-size:21px;line-height:1}
.pot-count{grid-column:1;grid-row:2;font-size:15px;color:#3E3B33}
.pot-body{grid-column:2;grid-row:1 / span 2;display:flex;flex-wrap:wrap;gap:6px;
  align-content:center;min-height:62px}
/* the empty pot has to look deliberate, not broken: a printed slot outline,
   the same one a played sticker would cover */
.pot-empty{display:block;width:100%;min-height:52px;border:2px dashed #A9A69C;border-radius:10px}
.pchip{display:inline-flex;align-items:center;gap:6px;background:#fff;border:2.5px solid #131310;
  border-radius:20px;padding:3px 11px 3px 4px;box-shadow:0 2px 0 rgba(0,0,0,.3)}
.pchip-n{font-size:12.5px;font-weight:700;line-height:1.1;white-space:nowrap}
.cthumb{width:26px;height:26px;flex:none;border-radius:50%;overflow:hidden;background:#D8D5CB;
  display:grid;place-items:center;box-shadow:inset 0 0 0 2px #fff}
.cthumb svg{width:100%;height:100%;display:block;fill:#6E6B62}
/* ---- the holding area ---- */
.hold{display:flex;flex-direction:column;gap:8px}
.hold-h{display:flex;align-items:baseline;gap:8px;padding:0 2px}
.hold-n{font-size:15px;color:#BEB9AC}
.schip{background:#FBF7EE;border-radius:16px;padding:11px 13px 12px;
  box-shadow:0 6px 14px rgba(0,0,0,.34),0 2px 0 rgba(0,0,0,.18);
  display:flex;flex-direction:column;gap:9px}
.schip-id{display:flex;align-items:center;gap:9px}
.schip-id .cthumb{width:38px;height:38px}
.schip-t{display:flex;flex-direction:column;gap:1px;min-width:0}
.schip-t b{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:18px;line-height:1.1}
.schip-t i{font-style:normal;font-size:13px;font-weight:700;color:#3E3B33;line-height:1.2}
.seg3row{display:flex;gap:7px}
.seg3{flex:1;min-height:44px;appearance:none;cursor:pointer;background:#F2EFE6;
  border:2.5px solid #131310;border-radius:10px;
  font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:17px;color:#131310;
  display:flex;align-items:center;justify-content:center}
.seg3.on{translate:0 -3px;background:#fff;
  box-shadow:0 0 0 3px #fff,0 0 0 5.5px #131310,0 4px 0 rgba(0,0,0,.4)}
.seg3:focus-visible{outline:3px solid #131310;outline-offset:4px}
.commit{width:100%;margin-top:2px;background:#FFD60A;rotate:-.6deg;font-size:20px}
.commit[disabled]{background:#D8D5CB;color:#6E6B62;border-color:#6E6B62;cursor:default;
  box-shadow:0 4px 0 rgba(0,0,0,.2)}
"""

def board_sortA():
    placed_for = ["בנימין נתניהו", "משה גפני", "יולי אדלשטיין"]
    placed_ag  = ["יואב גלנט", "בני גנץ", "יאיר לפיד"]
    unsorted = [("טלי גוטליב", "הליכוד", None), ("אביגדור ליברמן", "ישראל ביתנו", 1),
                ("אריה דרעי", 'ש"ס', None)]
    body = """
  %HUD%
  <div class="fz sort">
    %PINNED%
    <div class="sort-prompt">%PROMPT%</div>
    <div class="pots">%POTS%</div>
    <div class="hold">
      <div class="hold-h"><span class="hold-n">%N%</span></div>
      %CHIPS%
    </div>
    <button type="button" class="sbtn commit" disabled>%COMMITPH%</button>
  </div>"""
    body = (body.replace("%HUD%", hud(TOPIC_R1["label"], "240"))
            .replace("%PINNED%", pinned())
            .replace("%PROMPT%", ph("הנחיה למיון בהקשה",
                                    "Sort screen: the tap-to-assign instruction"))
            .replace("%POTS%", pot(S["v_for"], placed_for) + pot(S["v_against"], placed_ag)
                             + pot(S["v_abstain"], []))
            .replace("%N%", numeral("3" + OF_N + "9", "", 15))
            .replace("%CHIPS%", "".join(sort_chip(n, p2, sel) for n, p2, sel in unsorted))
            .replace("%COMMITPH%", esc(REVEAL_BTN)))
    BOARDS.append(dict(file="SortA.dc.html", var="sa", num="8a",
        he="Sort · mid-sort", en="Sort to Commit · mid-sort", note="",
        fh=1140, body=body, css=SORT_CSS))

def board_sortB():
    body = """
  %HUD%
  <div class="fz sort">
    %PINNED%
    <div class="sort-prompt">%PROMPT%</div>
    <div class="pots">%POTS%</div>
    <div class="hold">
      <div class="hold-h"><span class="hold-n">%N%</span></div>
      <div class="hold-done"><span class="pot-empty"></span></div>
    </div>
    <button type="button" class="sbtn commit">%COMMIT%</button>
  </div>"""
    body = (body.replace("%HUD%", hud(TOPIC_R1["label"], "240"))
            .replace("%PINNED%", pinned())
            .replace("%PROMPT%", ph("הנחיה למיון בהקשה",
                                    "Sort screen: the tap-to-assign instruction"))
            .replace("%POTS%", pot(S["v_for"], ["בנימין נתניהו", "משה גפני", "יולי אדלשטיין",
                                                "טלי גוטליב", "אריה דרעי"])
                             + pot(S["v_against"], ["יואב גלנט", "בני גנץ", "יאיר לפיד",
                                                    "אביגדור ליברמן"])
                             + pot(S["v_abstain"], []))
            .replace("%N%", numeral("0" + OF_N + "9", "", 15))
            .replace("%COMMIT%", esc(REVEAL_BTN)))
    BOARDS.append(dict(file="SortB.dc.html", var="sb", num="8b",
        he="Sort · locked", en="Sort to Commit · locked", note="",
        fh=1140, body=body, css=SORT_CSS + """
.hold-done{opacity:.75}
.hold-done .pot-empty{min-height:46px;border-style:dashed;border-color:#8E8C82}
"""))

def board_sortC():
    inner = """
    <div class="cascade">
      <div class="cas-pots">%POTS%</div>
      <div class="cas-count">%COUNT%</div>
      <div class="stack" style="height:560px">
        %PILE%
        <article class="scard ccard mk-card">
          <div class="portrait">
            <img class="portrait-ghost" src="mk-portrait.webp" alt="" aria-hidden="true">
            <img class="portrait-img" src="mk-portrait.webp" alt="">
          </div>
          <div class="ident">
            <h2 class="mk-name">%NAME%</h2>
            <p class="mk-party">%PARTY%</p>
          </div>
          <div class="tally">
            <div class="tally-cell"><span class="tally-label">%GL%</span><span class="tally-val">%GV%</span></div>
            <span class="tally-sep" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 12H4"></path><path d="M10 6l-6 6 6 6"></path></svg></span>
            <div class="tally-cell"><span class="tally-label">%VL%</span><span class="tally-val">%VV%</span></div>
          </div>
          <p class="mk-note">%NPRE%<mark class="hl">%NHL%</mark>%NPOST%</p>
          <p class="basis">%BASIS%</p>
          %STAMP%
        </article>
      </div>
    </div>"""
    inner = (inner
        .replace("%POTS%", pot(S["v_for"], ["בנימין נתניהו", "משה גפני", "יולי אדלשטיין",
                                            "טלי גוטליב", "אריה דרעי"], "pot-mini")
                         + pot(S["v_against"], ["יואב גלנט", "יאיר לפיד",
                                                "אביגדור ליברמן"], "pot-mini")
                         + pot(S["v_abstain"], [], "pot-mini"))
        .replace("%COUNT%", numeral("1" + OF_N + "9", "cas-n", 20))
        .replace("%PILE%", pile())
        .replace("%NAME%", esc(GANTZ["name"])).replace("%PARTY%", esc(GANTZ["party"]))
        .replace("%GL%", esc(S["guess_label"])).replace("%GV%", esc(S["v_against"]))
        .replace("%VL%", esc(S["voted_label"])).replace("%VV%", esc(S["v_against"]))
        .replace("%NPRE%", esc(NOTE_PRE)).replace("%NHL%", esc(NOTE_HL))
        .replace("%NPOST%", esc(NOTE_POST)).replace("%BASIS%", esc("📌 " + S["basis_doc"]))
        .replace("%STAMP%", stamp(S["verdict_right"], "sc", "stamp-main")))
    BOARDS.append(dict(file="SortC.dc.html", var="sc", num="8c",
        he="Sort · cascade", en="Sort to Commit · cascade", note="",
        fh=1140, body=comp_page(inner), css=SORT_CSS + COMP_CSS + BEAT4_CARD_CSS + """
.cascade{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
/* the pots stay on screen behind the cascade, so the player can see their own
   commitment being tested rather than a score arriving from nowhere */
.cas-pots{width:100%;display:flex;flex-direction:column;gap:6px;opacity:.55}
.pot-mini{min-height:0;padding:5px 9px 6px;border-width:2.5px;border-radius:10px;
  box-shadow:0 2px 0 rgba(0,0,0,.25);gap:0 8px}
.pot-mini .pot-label{font-size:15px}
.pot-mini .pot-count{font-size:12px}
.pot-mini .pot-body{min-height:24px;gap:4px}
.pot-mini .pchip{padding:2px 8px 2px 3px;border-width:2px}
.pot-mini .pchip-n{font-size:10.5px}
.pot-mini .cthumb{width:18px;height:18px}
.pot-mini .pot-empty{min-height:24px}
/* the counter has to clear the pile, which stands 29px proud of the card */
.cas-count{position:relative;z-index:6;margin-bottom:30px;
  font-size:14px;font-weight:700;color:#131310;background:#fff;border:2.5px solid #131310;
  border-radius:20px;padding:4px 14px;rotate:-1.5deg;box-shadow:0 2.5px 0 rgba(0,0,0,.3)}
.cas-n{font-size:20px}
/* the card lifting out of its pot: the same beat 4 card, not a smaller one */
.cascade .stack{rotate:-1deg}
"""))

# ================================== 9 · numerals specimen (Bibush vs SimplerPro)
def board_numerals():
    """Both faces, at the sizes the board actually uses, on the board's own
    ground and card. Nothing here is styled to flatter either one: same size,
    same weight, same colour, same cell width, stacked so the same digit in
    both faces sits directly above and below itself."""
    def strip(face, size, text):
        cells = "".join(
            '<span class="nb-c">%s</span>' % esc(ch) if ch.isdigit()
            else '<span class="nb-c nb-p">%s</span>' % esc(ch) for ch in text)
        return ('<div class="nb-row %s" style="font-size:%dpx">%s</div>' % (face, size, cells))
    rows = []
    for size in (23, 30, 34, 40):
        rows.append(
            '<div class="nb-block"><span class="nb-size">%dpx</span>'
            '<div class="nb-pair">%s%s</div></div>'
            % (size, strip("nb-bib", size, "0123456789"),
               strip("nb-sp", size, "0123456789")))
    reals = "".join(
        '<div class="nb-block"><span class="nb-size">%s</span>'
        '<div class="nb-pair">%s%s</div></div>'
        % (lbl, strip("nb-bib", sz, t), strip("nb-sp", sz, t))
        for lbl, sz, t in (("240", 34, "240"), ("3/8", 34, "3/8"),
                           ("41 36", 40, "41 36"), ("63 57", 40, "63 57")))
    body = """
  <div class="fz nb">
    <div class="nb-key"><span class="nb-k nb-bib">%KB%</span><span class="nb-k nb-sp">%KS%</span></div>
    <div class="nb-card">%ROWS%</div>
    <div class="nb-card">%REALS%</div>
  </div>"""
    body = (body.replace("%KB%", "Bibush Chunky").replace("%KS%", "SimplerPro Black")
                .replace("%ROWS%", "".join(rows)).replace("%REALS%", reals))
    css = """
@font-face{font-family:'BibushChunky';src:url(data:font/ttf;base64,%BIBUSHFONT%) format('truetype');
  font-weight:400;font-style:normal;font-display:block}
.nb{display:flex;flex-direction:column;gap:12px;padding-top:10px}
.nb-key{display:flex;gap:10px;justify-content:center}
.nb-k{font-size:12px;font-weight:700;color:#EFECE4;background:rgba(255,255,255,.10);
  border-radius:20px;padding:5px 13px}
.nb-k.nb-bib{background:#FFD60A;color:#131310}
.nb-card{background:#FBF7EE;border-radius:16px;padding:14px 12px;
  box-shadow:0 6px 14px rgba(0,0,0,.34);display:flex;flex-direction:column;gap:12px}
.nb-block{display:flex;align-items:center;gap:10px}
.nb-size{flex:none;width:46px;font-size:11px;font-weight:700;color:#5A564C;text-align:left;
  direction:ltr}
.nb-pair{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
/* the two faces share the cell width, so the same digit sits directly above
   and below itself and the comparison is of the glyphs, not of the spacing */
.nb-row{direction:ltr;display:flex;line-height:1.05;color:#131310}
.nb-c{display:inline-block;width:.70em;text-align:center;flex:none}
.nb-p{width:.52em}
.nb-bib .nb-c{font-family:'BibushChunky',system-ui,sans-serif;font-weight:400}
.nb-sp .nb-c{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900}
.nb-row.nb-bib{background:rgba(255,214,10,.30);border-radius:6px}
"""
    BOARDS.append(dict(file="Numerals.dc.html", var="nb", num="9",
        he="Numerals", en="Numerals · Bibush vs SimplerPro", note="",
        fh=930, body=body, css=css.replace("%BIBUSHFONT%", BIBUSH)))

# ==================================== 7 · background exploration (6 frames)
# ONE screen — the beat 1 claim card — on six grounds, everything else held
# identical, so the choice can be made by looking rather than by argument.
# (f) is the current pole grey with the dots removed, which is the control:
# it isolates whether the problem is the tone or the texture.
BACKGROUNDS = [
    ("a", "Near-black, no texture", "#131310", ""),
    ("b", "Dark charcoal, faint grain", "#22211E",
     "background-image:radial-gradient(rgba(255,255,255,.055) .5px,transparent .6px),"
     "radial-gradient(rgba(0,0,0,.35) .5px,transparent .6px);"
     "background-size:4px 4px,7px 7px;background-position:0 0,2px 3px"),
    ("c", "Mid grey, flat", "#8E8C87", ""),
    ("d", "Light grey, flat", "#E8E6E1", ""),
    ("e", "Warm paper, flat", "#F4F1E8", ""),
    ("f", "Pole grey, dots removed", "#B3B1A9", ""),
]

def board_backgrounds():
    for key, label, colour, texture in BACKGROUNDS:
        body = (ROUND_BODY.replace("%HUD%", hud(TOPIC_R1["label"], "240"))
                .replace("%PILE%", pile())
                .replace("%EMOJI%", esc(R1["emoji"]))
                .replace("%TITLE%", esc(R1["title"]))
                .replace("%C1%", esc(CLAIM_1)).replace("%C2%", esc(CLAIM_2))
                .replace("%C3%", esc(CLAIM_3)).replace("%C4%", esc(CLAIM_4))
                .replace("%ANS_T%", esc(S["ans_t"])).replace("%ANS_F%", esc(S["ans_f"])))
        light = key in ("c", "d", "e", "f")
        css = ROUND_CSS + """
/* background option %s — everything else on this frame is identical to the
   others by construction: same markup, same card, same type, same pile. */
.frame{background:%s !important}
.frame::before{%s}
""" % (key, colour, texture if texture else "display:none")
        if light:
            # the board's ground is dark, so ground-level type is light. On the
            # four light options that type has to come back to ink. Nothing
            # else moves, and it moves identically on all four.
            css += """
.coin-num,.hud-mid,.hud-mid .lsplain{color:#131310 !important}
"""
        BOARDS.append(dict(file="Bg%s.dc.html" % key.upper(), var="bg" + key,
            num="7" + key, he="Background " + key, en="Background " + key,
            note=("BACKGROUND OPTION %s — %s.\n\n"
                  "The beat 1 claim card, unchanged, on six candidate grounds. "
                  "Everything except the background is identical across all six by "
                  "construction: same markup, same card, same type, same pile, same "
                  "stamp-free chrome.\n\n"
                  "%s"
                  "Option f is the control: the current pole grey with the dot pattern "
                  "removed and nothing else changed, so it isolates whether the problem "
                  "is the tone or the texture.\n\n"
                  "No winner is chosen here and none of these is applied to any other "
                  "frame on the board.\n\n"
                  "Icons are placeholders — pack license not verified.") % (
                  key, label,
                  "" if light else ""),
            fh=880, body=body, css=css))

# ============================== 13 · the character set (v9 Character board) ==
# WHAT IS ACTUALLY THERE, read out of the running prototype rather than
# described. Two sources, both read at build time:
#   app.js      SKINS / HAIRS / HAIR_COLORS / CLOTHES / EYES_OPTS — parsed
#               above by _opts(), so the counts on this board cannot drift
#               from the arrays;
#   build/avatars.json — the OUTPUT of the shipped buildAvatarSvg(), lifted
#               out of app.js and run by tools/avatars.mjs. Every face on this
#               board is the prototype's own drawing, not a redrawing of it.
#
# THREE THINGS THE READ TURNED UP, all flagged on canvas:
#   1  data.js carries 8 finished preset AVATARS with names. app.js assigns
#      AVATARS[0].id to player.avatarId at startup and then never reads it
#      again: nothing renders a preset, and the self-test still asserts there
#      are 8 of them. The presets are dead code in the shipped build.
#   2  צבע שיער is CONDITIONAL: updateHairColorVisibility() hides the whole
#      section when hair is bald or hijab, so the category is 5 options on 4
#      of the 6 hair choices and 0 on the other two.
#   3  the gender chips are labelled as GRAMMAR (לשון נקבה / לשון זכר) and
#      the whole app's copy switches on them through g() — but the same flag
#      also silently redraws the avatar's clothing in buildAvatarSvg. One
#      control, two jobs, and only one of them is named on screen.
_AV_JSON = OUT / "build" / "avatars.json"
assert _AV_JSON.exists(), ("run: node explorations/v13/tools/avatars.mjs")
AV_SVG = json.loads(_AV_JSON.read_text(encoding="utf-8"))

# the counts are asserted against the arrays, not typed in
CHAR_CATS = [
    ("skin",    S["b_skin"],    SKINS,       "swatch"),
    ("hair",    S["b_hair"],    HAIRS,       "face"),
    ("hairc",   S["b_hairc"],   HAIR_COLORS, "swatch"),
    ("eyes",    S["b_eyes"],    EYES,        "face"),
    ("clothes", S["b_clothes"], CLOTHES,     "swatch"),
]
assert [len(o) for _, _, o, _ in CHAR_CATS] == [5, 6, 5, 3, 5], \
    [len(o) for _, _, o, _ in CHAR_CATS]
for key, _, opts, _ in CHAR_CATS:
    for oid, _c, _l in opts:
        assert "%s_%s" % (key, oid) in AV_SVG or key in ("skin", "clothes", "hairc"), (key, oid)

def av(key, cls=""):
    """One avatar, the shipped drawing, wrapped so a container shape can be
    put around it without touching the artwork."""
    return '<span class="cav %s">%s</span>' % (cls, AV_SVG[key])

def av_nobg(key, cls=""):
    """The same drawing with its background plate removed, so a die-cut edge
    can follow the FIGURE. The plate is the first rect and carries
    opacity="0.15" — nothing else in the drawing does, so the strip is exact
    and asserted."""
    svg = AV_SVG[key]
    i, j = svg.index('<rect'), svg.index('/>') + 2
    assert 'opacity="0.15"' in svg[i:j], key
    return '<span class="cav %s">%s</span>' % (cls, svg[:i] + svg[j:])

# ---------------------------------------------------------------- 4a shapes
AV_SHAPES = [
    ("AS-A", "circle die-cut", "shp-circle"),
    ("AS-B", "rounded square — the current one", "shp-round"),
    ("AS-C", "badge / shield", "shp-shield"),
    ("AS-D", "irregular die-cut, following the silhouette", "shp-cut"),
]
AV_SIZES = [(40, "HUD"), (64, "map marker"), (200, "creation screen")]

def board_av_shapes():
    rows = []
    for oid, what, cls in AV_SHAPES:
        cells = "".join(
            '<span class="shp-cell" style="--s:%dpx">%s<i>%dpx</i></span>'
            % (px, (av_nobg("base", "shp " + cls) if cls == "shp-cut"
                    else av("base", "shp " + cls)), px)
            for px, _ in AV_SIZES)
        rows.append('<div class="shp-row"><span class="cs-id">%s</span>'
                    '<span class="shp-what">%s</span>'
                    '<div class="shp-cells">%s</div></div>' % (oid, esc(what), cells))
    BOARDS.append(dict(file="AvatarShapes.dc.html", var="ashp", num="C1",
        he="Avatar container", en="Avatar container · 4 shapes x 3 sizes",
        note="", fh=1180, body='  <div class="fz shps">%s</div>' % "".join(rows),
        css=CHAR_CSS + AV_SHAPE_CSS))

AV_SHAPE_CSS = """
.shps{flex:1;display:flex;flex-direction:column;gap:24px;padding:6px 0 10px}
.shp-row{display:flex;flex-direction:column;align-items:flex-start;gap:7px}
/* every shape gets the same three boxes, so none of them wins on size */
.shp-cells{width:100%;display:flex;align-items:flex-end;justify-content:flex-start;gap:14px}
.shp-cell{display:flex;flex-direction:column;align-items:center;gap:6px}
.shp-cell i{font-style:normal;direction:ltr;font-size:10px;font-weight:700;color:#BEB9AC}
.shp{width:var(--s);height:var(--s);display:block}
.shp-circle{border-radius:50%;overflow:hidden;background:#FBF7EE;
  box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.45),0 3px 0 rgba(0,0,0,.3)}
.shp-round{border-radius:14px;overflow:hidden;background:#FBF7EE;
  box-shadow:0 0 0 3px #fff,0 0 0 4.5px rgba(0,0,0,.45),0 3px 0 rgba(0,0,0,.3)}
/* the shield is a clip-path, so it cannot take a border: the white edge is a
   second clipped box behind it, 3px larger on every side. */
.shp-shield{position:relative;background:#FBF7EE;
  clip-path:polygon(50% 0,100% 16%,100% 62%,50% 100%,0 62%,0 16%);overflow:hidden}
.shp-shield::before{content:"";position:absolute;inset:-3px;z-index:-1;background:#fff;
  clip-path:polygon(50% 0,100% 16%,100% 62%,50% 100%,0 62%,0 16%)}
.shp-cell:has(.shp-shield){padding:3px}
/* the silhouette cut: the same alpha-dilate the sticker frames use, on the
   figure with its background plate stripped off */
.shp-cut{filter:url(#dcw-%VAR%) drop-shadow(0 3px 0 rgba(0,0,0,.28))}
.shp-cut svg{overflow:visible}
"""

# ---------------------------------------------------------------- 4b layouts
def _cat_chips(sel=0):
    return "".join('<span class="ctab%s">%s</span>' % (" on" if i == sel else "", esc(lbl))
                   for i, (_k, lbl, _o, _kind) in enumerate(CHAR_CATS))

def _strip(key, opts, kind, sel=0, n=None):
    cells = []
    for i, (oid, colour, label) in enumerate(opts[:n] if n else opts):
        on = " on" if i == sel else ""
        if kind == "swatch":
            cells.append('<span class="copt copt-sw%s" style="background:%s"></span>' % (on, colour))
        else:
            cells.append('<span class="copt copt-f%s">%s</span>'
                         % (on, av("%s_%s" % (key, oid), "copt-av")))
    return "".join(cells)

def board_create_layouts():
    thumb = ('<span class="thumb" aria-hidden="true"></span>')
    # the shipped character screen has a back control and no game chrome — no
    # coins, no map button, because the map does not exist yet at this point in
    # the flow. IB-B, the picked icon button.
    hud = lambda *_a, **_k: ('<div class="cback"><button type="button" '
                             'class="map-btn chip" aria-label="%s">%s</button></div>'
                             % (esc(S["guest_title"]), ICONS["close"]))
    # All three carry the SAME content — title, name field, the לשון chips, the
    # preview, all five categories, the CTA — because a layout comparison in
    # which one option is carrying less is not a comparison. The לשון row is
    # drawn where the shipped screen puts it: among the appearance controls.
    name = ('<div class="cname"><span class="cnlbl">%s</span>'
            '<span class="cnfield">%s</span></div>'
            % (esc(S["name_label"]), esc(S["name_ph"])))
    lang = ('<div class="clang"><span class="gchip">%s</span>'
            '<span class="gchip on">%s</span></div>'
            % (esc(S["g_f"]), esc(S["g_m"])))
    # --- CR-A: one scrolling list, the shipped shape
    secs = "".join(
        '<div class="csec"><span class="clbl">%s</span><div class="crow">%s</div></div>'
        % (esc(lbl), _strip(k, o, kind)) for k, lbl, o, kind in CHAR_CATS)
    a = ('  <div class="fz cls">%s<h2 class="ctitle">%s</h2>%s%s'
         '<div class="cprev cprev-s">%s</div>%s'
         '<button type="button" class="sbtn cgo">%s</button></div>%s'
         % (hud(None, "240"), esc(S["av_title"]), name, lang,
            av("base", "cprev-av"), secs, esc(S["av_cta"]), thumb))
    # --- CR-B: category tabs + one swipeable strip
    b = ('  <div class="fz cls">%s<h2 class="ctitle">%s</h2>%s%s'
         '<div class="cprev cprev-l">%s</div>'
         '<div class="ctabs">%s</div>'
         '<div class="cswipe"><div class="crow crow-swipe">%s</div>'
         '<span class="cpeek" aria-hidden="true"></span></div>'
         '<button type="button" class="sbtn cgo">%s</button></div>%s'
         % (hud(None, "240"), esc(S["av_title"]), name, lang,
            av("hair_curly", "cprev-av"), _cat_chips(1),
            _strip("hair", HAIRS, "face", 2), esc(S["av_cta"]), thumb))
    # --- CR-C: hero preview, options in a tray at the bottom
    c = ('  <div class="fz cls cls-c">%s<h2 class="ctitle">%s</h2>%s'
         '<div class="chero">%s</div>'
         '<div class="ctray"><span class="cgrip" aria-hidden="true"></span>'
         '<div class="ctabs ctabs-tray">%s</div>'
         '<div class="cgrid">%s</div>%s'
         '<button type="button" class="sbtn cgo cgo-tray">%s</button></div></div>%s'
         % (hud(None, "240"), esc(S["av_title"]), name,
            av("hair_curly", "chero-av"), _cat_chips(1),
            _strip("hair", HAIRS, "face", 2), lang, esc(S["av_cta"]), thumb))
    # CR-A is taller than the other two, and that IS the finding: the same
    # content laid out as one list does not fit a phone screen, so the preview
    # scrolls away from the thing it is previewing.
    for fid, oid, en, body, fh in (("CreateA", "CR-A", "single scrolling list", a, 950),
                                   ("CreateB", "CR-B", "tabs + swipeable strip", b, 880),
                                   ("CreateC", "CR-C", "hero preview + bottom tray", c, 880)):
        BOARDS.append(dict(file=fid + ".dc.html", var=fid.lower(), num=oid,
            he=en, en=oid + " · " + en, note="", fh=fh,
            body='<span class="cs-id cs-id-float">%s</span>' % oid + body,
            css=CHAR_CSS + CREATE_CSS))

CREATE_CSS = """
 .cback{position:absolute;top:12px;right:16px;z-index:40}
.cls{flex:1;display:flex;flex-direction:column;align-items:center;padding-top:52px;gap:12px}
.ctitle{font-family:'SimplerPro',system-ui,sans-serif;font-weight:900;font-size:26px;color:#EFECE4}
.cprev{background:#FBF7EE;border:4px solid #fff;border-radius:18px;
  box-shadow:0 0 0 1.5px rgba(0,0,0,.45),0 5px 0 rgba(0,0,0,.32);overflow:hidden}
.cprev-s{width:112px;height:112px}
.cprev-l{width:186px;height:186px}
.cprev-av{display:block;width:100%;height:100%}
.csec{width:100%;display:flex;flex-direction:column;gap:6px}
.clbl{font-size:13px;font-weight:700;color:#BEB9AC}
.crow{display:flex;flex-wrap:wrap;gap:8px}
.crow-swipe{flex-wrap:nowrap;overflow:hidden}
.cswipe{position:relative;width:100%}
.cpeek{position:absolute;top:0;bottom:0;left:0;width:44px;pointer-events:none;
  background:linear-gradient(270deg,rgba(64,62,58,.92),rgba(64,62,58,0))}
.copt{flex:none;display:grid;place-items:center;background:#FBF7EE;border-radius:12px;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
.copt-sw{width:44px;height:44px}
.copt-f{width:62px;height:62px;overflow:hidden}
.copt-av{display:block;width:100%;height:100%}
.copt.on{box-shadow:0 0 0 3px #fff,0 0 0 5.5px #131310,0 4px 0 rgba(0,0,0,.35)}
.ctabs{width:100%;display:flex;gap:6px;overflow:hidden}
.ctab{flex:none;font-size:12.5px;font-weight:700;color:#BEB9AC;background:rgba(255,255,255,.07);
  border-radius:10px;padding:7px 10px}
.ctab.on{color:#131310;background:#FBF7EE;box-shadow:0 3px 0 rgba(0,0,0,.3)}
.cname{width:100%;display:flex;flex-direction:column;gap:5px}
.cnlbl{font-size:12.5px;font-weight:700;color:#BEB9AC}
.cnfield{background:#FBF7EE;border-radius:12px;padding:11px 14px;font-size:15px;font-weight:700;
  color:#6B6759}
.clang{width:100%;display:flex;gap:8px}
.cgo{width:280px;margin-top:auto;margin-bottom:6px}
/* CR-C: the preview owns the screen, the options live in a tray the thumb can
   reach without the preview ever leaving the viewport */
.cls-c{gap:0;padding-top:52px;justify-content:flex-start}
.chero{flex:1;display:grid;place-items:center;width:100%}
.chero-av{display:block;width:232px;height:232px;background:#FBF7EE;border-radius:26px;
  overflow:hidden;box-shadow:0 0 0 4px #fff,0 0 0 6px rgba(0,0,0,.45),0 6px 0 rgba(0,0,0,.3)}
.ctray{width:calc(100% + 32px);margin:0 -16px -20px;background:#2C2A27;
  border-top:4px solid #fff;box-shadow:0 -6px 0 rgba(0,0,0,.3);
  padding:10px 16px 18px;display:flex;flex-direction:column;gap:10px;align-items:center}
.cgrip{width:44px;height:5px;border-radius:3px;background:#6E6C63}
.ctabs-tray{justify-content:flex-start}
.cgrid{width:100%;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start}
.cgo-tray{margin-top:4px}
/* THUMB REACH, drawn not described: the arc is what a right thumb covers on a
   390x844 screen held one-handed. Anything above it needs a second hand. */
.thumb{position:absolute;z-index:30;right:-70px;bottom:-70px;width:600px;height:600px;
  border-radius:50%;pointer-events:none;border:2px dashed rgba(255,255,255,.42)}
"""

# ---------------------------------------------------------------- 4c pickers
def board_pickers():
    grid = '<div class="crow">%s</div>' % _strip("hair", HAIRS, "face", 2)
    carousel = ('<div class="cswipe"><div class="crow crow-swipe">%s</div>'
                '<span class="cpeek" aria-hidden="true"></span></div>'
                % _strip("hair", HAIRS, "face", 2))
    stepper = ('<div class="stp"><button class="stp-b" type="button">%s</button>'
               '<span class="stp-mid">%s<b>%s</b><i>%s</i></span>'
               '<button class="stp-b" type="button">%s</button></div>'
               # RTL: the chevrons point outward — right for the option before,
               # left for the option after, which is the direction the page reads.
               % (_ARROW_R, av("hair_curly", "stp-av"), esc(HAIRS[2][2]),
                  esc("3" + OF_N + "6"), _ARROW_L))
    rows = "".join(
        '<div class="pk-row"><span class="cs-id">%s</span>'
        '<span class="shp-what">%s</span>%s<p class="cs-spec">%s</p></div>'
        % (oid, esc(what), markup, esc(spec))
        for oid, what, markup, spec in (
            ("PK-A", "swatch grid — the current one", grid,
             "Whole set visible at once, no hidden options, no gesture to learn. "
             "Costs the most vertical space: 6 options is two rows before the preview."),
            ("PK-B", "horizontal carousel", carousel,
             "One row whatever the count, so every category is the same height. "
             "Options past the fold are discoverable only by swiping — and the "
             "swipe runs the same axis as the RTL page."),
            ("PK-C", "stepper", stepper,
             "Smallest and the only one that names the option in words. One tap "
             "per step, so reaching option 6 of 6 costs five taps and the set is "
             "never seen as a set.")))
    BOARDS.append(dict(file="Pickers.dc.html", var="pk", num="C2",
        he="Option picker", en="Option picker · 3 options", note="", fh=740,
        body='  <div class="fz pks">%s</div>' % rows, css=CHAR_CSS + CREATE_CSS + """
.pks{flex:1;display:flex;flex-direction:column;gap:26px;padding:6px 0 10px}
.pk-row{display:flex;flex-direction:column;align-items:flex-start;gap:8px;width:100%}
.stp{display:flex;align-items:center;gap:14px}
.stp-b{appearance:none;width:44px;height:44px;flex:none;display:grid;place-items:center;
  border:0;padding:0;cursor:pointer;background:#FBF7EE;border-radius:12px;color:#131310;
  box-shadow:0 0 0 2px rgba(0,0,0,.4),0 3px 0 rgba(0,0,0,.3)}
.stp-b svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.6;
  stroke-linecap:round;stroke-linejoin:round}
.stp-mid{display:flex;flex-direction:column;align-items:center;gap:3px}
.stp-av{display:block;width:74px;height:74px;background:#FBF7EE;border-radius:14px;
  overflow:hidden;box-shadow:0 0 0 3px #fff,0 0 0 5px rgba(0,0,0,.42)}
.stp-mid b{font-size:15px;color:#EFECE4}
.stp-mid i{font-style:normal;font-size:11.5px;font-weight:700;color:#BEB9AC}
"""))

_ARROW_L = ('<svg viewBox="0 0 24 24" aria-hidden="true">'
            '<path d="M15 5l-7 7 7 7"></path></svg>')
_ARROW_R = ('<svg viewBox="0 0 24 24" aria-hidden="true">'
            '<path d="M9 5l7 7-7 7"></path></svg>')

# ---------------------------------------------------------------- 4d the set
def board_option_sheet():
    secs = []
    for k, lbl, opts, kind in CHAR_CATS:
        cells = []
        for oid, colour, label in opts:
            art = ('<span class="os-sw" style="background:%s"></span>' % colour
                   if kind == "swatch" else av("%s_%s" % (k, oid), "os-av"))
            cells.append('<span class="os-cell">%s<i>%s</i></span>' % (art, esc(label)))
        secs.append('<div class="os-sec"><span class="os-head">%s<b>%s</b></span>'
                    '<div class="os-cells">%s</div></div>'
                    % (esc(lbl), numeral(str(len(opts)), "os-n", 15), "".join(cells)))
    # the two the categories do not admit to
    secs.append('<div class="os-sec os-flag"><span class="os-head">%s<b>%s</b></span>'
                '<div class="os-cells">%s%s</div></div>'
                % (esc(S["g_f"] + " / " + S["g_m"]), numeral("2", "os-n", 15),
                   '<span class="os-cell">%s<i>%s</i></span>'
                   % (av("base_f", "os-av"), esc(S["g_f"])),
                   '<span class="os-cell">%s<i>%s</i></span>'
                   % (av("base", "os-av"), esc(S["g_m"]))))
    BOARDS.append(dict(file="OptionSheet.dc.html", var="os", num="C3",
        he="The whole set", en="Every category, every option", note="", fh=960,
        body='  <div class="fz oss">%s</div>' % "".join(secs), css=CHAR_CSS + """
.oss{flex:1;display:flex;flex-direction:column;gap:20px;padding:6px 0 10px}
.os-sec{display:flex;flex-direction:column;gap:9px}
.os-head{display:flex;align-items:center;gap:8px;font-family:'SimplerPro',system-ui,sans-serif;
  font-weight:900;font-size:19px;color:#EFECE4}
.os-n{font-size:15px;color:#131310;background:#FFD60A;border-radius:7px;padding:2px 8px 3px}
.os-cells{display:flex;flex-wrap:wrap;gap:8px}
/* 62px cells with an 8px gap put a five-option category on ONE line at
   390px, which is the whole point of a contact sheet: a category you have to
   read across two rows is not being judged as a set. שיער has six and wraps —
   that is a fact about the category, not about the sheet. */
.os-cell{width:62px;display:flex;flex-direction:column;align-items:center;gap:5px}
.os-cell i{font-style:normal;font-size:11.5px;font-weight:700;color:#BEB9AC;text-align:center;
  line-height:1.25}
.os-av{display:block;width:58px;height:58px;background:#FBF7EE;border-radius:12px;overflow:hidden;
  box-shadow:0 0 0 2px rgba(0,0,0,.4)}
.os-sw{display:block;width:58px;height:58px;border-radius:12px;box-shadow:0 0 0 2px rgba(0,0,0,.4)}
/* the row the shipped screen does not label as an appearance control, drawn
   here as one — because that is what it also is. Bigger than the rest, because
   the difference it makes to the drawing is a tie versus a collar and that is
   invisible at 58px. */
.os-flag .os-head{color:#FFD60A}
.os-flag .os-cell{width:120px}
.os-flag .os-av{width:112px;height:112px;border-radius:16px}
"""))

CHAR_CSS = """
.cav svg{display:block;width:100%;height:100%}
/* SHARED between the shapes board and the pickers board. It was declared in
   the shapes board's sheet only, and on the pickers board it silently resolved
   to 16px/400 body text — caught by the contrast check, not by reading. */
.shp-what{direction:ltr;font-size:11.5px;font-weight:700;color:#BEB9AC}
.cs-id-float{position:absolute;z-index:50;top:10px;left:16px}
"""

# ================================================================= build
# ---------------------------------------------------------------- the notes
# ONE table for every annotation on the board, so the whole set can be read as
# a set. Each entry is (body, flag) — the body is 2-4 short lines at small
# size, the flag is a one-line callout at a louder size and a colour, and is
# None for most frames. Nothing here is long: the frames are the argument, the
# notes are the caption.
FRAME_NOTES = {
"Main.dc.html": ("Title set as die-cut letter stickers, oversized and overlapping. v10: the per-letter jitter is GONE — every letter sits straight on one baseline. What survives of «stuck by hand» is the horizontal overlap, which is what makes the die-cut stroke do real work.\nThe framed collage is gone: the MK photograph and both player-character stickers with it. A drawing of the Knesset takes the space.\nCHECKED — this is the BUILDING, not the institutional mark: three-quarter view with a receding side rather than a straight-on symmetrical silhouette, asymmetric composition, and the construction a mark would drop (podium, recessed wall behind the colonnade, the thickness of the slab). Recognisably the Knesset and not a generic parliament: flat cantilevered roof, no dome, no pediment, slender full-height rectangular columns, broad low podium, cypresses.\nAll other intro elements are unchanged.",
  None),
"PeelSheet.dc.html": ("The shipped mechanic, restyled. The 8 preset avatars are data.js AVATARS exactly as they are — only the die-cut treatment is new.\nOne sticker shown mid-peel. Skip stays available.\nThe second button is the door to the builder: the preset sheet is the route that ships, and most players should finish here without opening it.",
  "The \u201ccustomise your character\u201d button is the one label on this board we wrote rather than found."),
"PathMap.dc.html": ("One ring segment per issue: filled = played, pale = not. Casing and fill differ so the two states read at 390px.\nCurrent node gets the heavier ring and halo. Coins and X/8 live here only.",
  "A bonus issue hangs off the ring as a satellite — never a third segment."),
"Round.dc.html": ("Beat 1, the settled claim card. Claim is data.js r1.tf in full, asserted to reassemble byte for byte.\nThe blue tag shows the tappable-glossary treatment.",
  "No glossary term occurs in the r1 claim string, so the treatment is shown on the highlighted phrase."),
"Beat2OwnVote.dc.html": ("The 121st MK: the player's sticker sits on the ballot card.\nThree buttons, one construction used three times. Direction is never colour-coded.",
  "Guardrail, verbatim: never scored, never rewarded, never compared to a correct answer."),
"Beat3Bill.dc.html": ("bill_title and bill_date only. No outcome, no tally, no MK named.\nThe quietest frame on the board on purpose — tilting a bill title starts to editorialise it.",
  "bill_summary is held back: it mixes context and outcome, and the outcome belongs at beat 5."),
"Beat4MkCard.dc.html": ("The v6 album-page card in the original world: shared ground and pile, kraft card.\nPortrait cut out and cropped by rule — the same crop, filter and scale all 98 MKs get.\nMK FRAME = MF-B, your pick: 5px white die-cut edge plus a hard dark outline.\nThe verdict is VD-A shown provisionally, in a surprise state, until the verdict pick comes back. The court stamp used to carry this and no longer does — it was the v8 verdict treatment and the four VD options replace it.",
  "Photo: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0"),
"Beat5Tally.dc.html": ("The claim resolves. Count-up caught mid-count at 41–36 on its way to 63–57.\ntf_explain in full. Sources live here and only here.", None),
"Beat5NoTally.dc.html": ("The same reveal for an issue with no vote count — 8 of 16 issues have none, so this state is half the game.\nNo tally block; a quiet outline holds the unwritten line.", None),
"EndGame.dc.html": ("Coins allocated across the 8 topics. Medals stick onto printed slots.\nConfetti is reserved for 8/8 and this is that screen.",
  "Guardrail, verbatim: across topics, never parties."),
"Share.dc.html": ("A sticker collage: the player's avatar plus the stickers they collected.\nYellow, not blue — blue is the most party-adjacent colour available and this artifact leaves the app.\nHeadline should be the surprise count; no such string exists in app.js yet.",
  "Photo: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0"),
"SortA.dc.html": ("Six of nine assigned, three waiting, abstain pot empty — the common case.\nTap a segment to assign. The three pots are one element used three times.", None),
"SortB.dc.html": ("All nine committed, nothing revealed. No verdicts, no colour, no score.\nCommit uses the string the prototype already has for this action.", None),
"SortC.dc.html": ("Card 1 of 9 at full size — beat 4's card sharing its stylesheet, not a copy.\nThe pots stay behind it, so the player watches their own commitment being tested.",
  "Photo: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0"),
"Numerals.dc.html": ("Bibush against SimplerPro at the sizes the board actually uses, so the call is yours.\nBibush is currently OFF everywhere; this frame is the only place it appears.",
  "Bibush cannot set either title: no hyphen and no gershayim in its cmap."),
}
FRAME_NOTES["Profile.dc.html"] = (
    "Tapping the character in the HUD opens this. The gesture already exists — "
    "index.html wires the app-bar button and the map's user chip to goAvatar() — "
    "but the shipped build drops you into the whole selector with no screen in "
    "between.\nName field, voice chips and the swap action are all shipped copy. "
    "Two doors out: change the preset, or open the builder.",
    "The \u201ccustomise your character\u201d button is written, not shipped.")
for _i in range(1, 6):
    FRAME_NOTES["Builder%d.dc.html" % _i] = (
        "Step %d of 6. Preview is the hero, one category per step, tap only.\n"
        "Every category and label is shipped copy from app.js — including the "
        "head-covering and eyewear options.\n"
        "Selected state: fill, lift and ring. Never size." % _i,
        None if _i != 1 else "Entry point is the map-corner avatar, so nobody is blocked by it.")
FRAME_NOTES["BuilderMotion.dc.html"] = (
    "The step change, frozen. The preview holds still; only the category travels — "
    "the answered one leaves by the trailing edge, the next enters from the leading one.\n"
    "The step frames animate this for real when the canvas opens.", None)
FRAME_NOTES["Builder6.dc.html"] = (
    "The finished sticker peels off its backing and drops into the HUD slot, where it "
    "lives for the rest of the game.", None)
FRAME_NOTES["ShareA.dc.html"] = ("SH-1 — PRIMARY. OPTIMISES FOR INTRIGUE. The numeral is the hook — how many times the Knesset did something the player did not expect — and it means nothing to a reader until they play. The topics around it are the data.js icon and label only, never free text, so the card cannot editorialise.\nTHE METRIC LEADS AND IT IS HIGH WHEN THE PLAYER DID BADLY — the count of times the Knesset did something they did not expect. That is the sheet's rule (5.3) and it is the whole reason this card is the primary: a score that goes UP when you were wrong is shareable without being a boast, and it is an invitation rather than a result.\nHeadline copy is unwritten.", None)
FRAME_NOTES["ShareB.dc.html"] = ("SH-2 — THE SECOND VARIANT, AND THE ONE THAT OMITS TOPICS. OPTIMISES FOR PROGRESSION. The player's own trail: completed nodes, the avatar where they stopped, coins and X/8. Reads as a scoreboard a friend can place themselves against.\nIt names NO TOPICS, which is why it is the second card rather than a third version of the first (5.4): a player who does not want their reading list on somebody's timeline still has something to send. The end-game offers both and the player picks — the choice is the feature, not a fallback.\nEvery string is shipped; nothing here needs writing.", None)
FRAME_NOTES["ShareC.dc.html"] = ("SH-3 — ARCHIVED, BLOCKED ON TAMAR. OPTIMISES FOR SUBSTANCE. One real bill and the player's guess against what happened. No MK is named. The two cells are one construction used twice — no colour, no size difference, nothing saying which is the good one.\nAll copy is data.js bill_title plus app.js labels.", "CONTENT POLICY — Tamar: a real bill on a card that leaves the app.")
FRAME_NOTES["ShareD.dc.html"] = ("SH-4 — ARCHIVED, BLOCKED ON THE OPT-IN RULE. Putting a player's own topic choices on a card that leaves the app is a disclosure, and there is no agreed opt-in for it. OPTIMISES FOR IDENTITY. The player's avatar and the three topics they put coins into. Topics by icon and label only.\nHeadline copy is unwritten.", None)
FRAME_NOTES["Components.dc.html"] = ("Seven components, options side by side. Every option is real markup on the board's own ground — a press state that is specified is a press state you can try.\nThe vote set is the constraint made visible: within each option the three surfaces are one construction, so no option can smuggle in a colour or a size difference.", None)
FRAME_NOTES["MkTreatment.dc.html"] = ("One MK, one die-cut frame, three uniform filters: untouched, duotone, slight posterize. Frame and outline are identical across all three — this tests the filter only.\nEach filter is a CSS chain with no per-photo parameters, so it applies mechanically to all 21 MKs. No illustration, no caricature.", "Photo: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0")
FRAME_NOTES["NodeA.dc.html"] = ("v7.9: the node is a solid token — a flat face on a base that is the same circle offset straight down by 7px, zero blur, in a darker shade of the face's own colour. No gradients, no highlights, nothing floats.\nThe ring wraps the token's whole volume (face plus depth), 6px clear above the face and below the base, stroke thinner than the depth so it reads as track.\nThe fifth cell shows the press: the face drops by the full depth and the base collapses — that is what sells the thickness. Live, it runs 80ms linear on :active.",
  "CHOSEN — this is the node on the map in row 1.")
FRAME_NOTES["NodeB.dc.html"] = ("Same ring, much deeper wall (24px). Chunkier and more toy-like; the node reads as a physical button you could press. Costs vertical space on a long map.", None)
FRAME_NOTES["NodeC.dc.html"] = ("The ring becomes a continuous hairline track with the progress arcs sitting on it, so an empty ring still reads as a dial rather than as something missing.", None)
FRAME_NOTES["NodeD.dc.html"] = ("No ring at all. Progress moves to pips under the node, which is the most legible option at 390px and the cheapest to animate — but it loses the Duolingo silhouette.", None)
FRAME_NOTES["PathDots.dc.html"] = ("The current treatment: a dotted line, dark under-dot beneath a light one so the trail has its own thickness. Quietest of the four; reads as a route without competing with the nodes.", None)
FRAME_NOTES["PathRoad.dc.html"] = ("A ribbon with a lit top and a shadowed under-edge, so the path carries the same thickness the nodes do. Strongest sense of a physical board game.",
  "CHOSEN — this is the path on the map in row 1.")
FRAME_NOTES["PathStones.dc.html"] = ("Discs ON the path rather than a stroke along it, each extruded like the nodes so the whole map shares one light source. Playful; more objects to render.", None)
FRAME_NOTES["PathGlow.dc.html"] = ("No hard edge at all — the route is a glow the nodes sit in. Keeps the eye on the nodes and lets the background gradient do the wayfinding. Softest, and the least literal.", None)
for _k, _lbl in (("A", "near-black, no texture"), ("B", "dark charcoal, faint grain"),
                 ("C", "mid grey, flat"), ("D", "light grey, flat"),
                 ("E", "warm paper, flat"), ("F", "pole grey, dots removed")):
    FRAME_NOTES["Bg%s.dc.html" % _k] = ("Option %s — %s." % (_k.lower(), _lbl), None)

ROW_HEADS = [
    ("Entering the game", "gray",
     "Intro, the shipped character mechanic restyled, and the map."),
    ("Character builder — CONCEPT", "purple",
     "New engineering. The NGO chooses between this and the preset restyle in row 1."),
    ("The round — five beats", "gray",
     "Beat 1 as a full screen, then one component per beat. Each carries the pinned beat-1 answer."),
    ("Leaving the game", "gray", "End-game allocation at 8/8, and the share card."),
    ("Sort to commit — CONCEPT", "purple",
     "Commit to all nine MKs first, then run the cascade. Removes the information leak; "
     "the one-at-a-time reveal and its tempo survive unchanged."),
    ("Path — RESOLVED", "teal",
     "The raised ribbon (3b) was chosen and is applied to the map above; the four "
     "frames are kept as the record."),
    ("Share cards — 4 variants", "purple",
     "One construction, four things to optimise for. All die-cut, 9:16-friendly, "
     "source line present, topics by icon and label only."),
    ("Node — RESOLVED · numerals — your call", "teal",
     "Style 3e (Faithful) was chosen and is what the map uses. The four frames are "
     "kept as the record. The numerals question is still open."),
    ("Background — RESOLVED", "teal",
     "Option b was chosen and lightened toward c. That ground is already applied to every "
     "frame above; these six are kept as the record."),
]

BOARD_TITLE = "THE 121st MK — FULL SCREEN SET"
BOARD_SUB = ("Every screen of the revised flow in one style. Hebrew appears only inside the "
             "screens; every annotation on this canvas is English.\n"
             "Copy comes from data.js, app.js and index.html, read and asserted at build "
             "time. Striped yellow slots are the only unwritten copy.\n"
             "Icons are placeholders — the pack's license is not verified.")

OPEN_NOTE = """OPEN
- Preset restyle (row 1) or builder (row 2)? Both are on the board.
- Builder entry: map corner is drawn; early placement is the alternative.
- Sorting named politicians into bins, with party lines visible — does it read as
  sorting people by tribe? Tamar's call, not a design decision.
- Share headline needs a surprise-count string; app.js counts coins.
- Icon pack license is unverified.
- 21 of 21 MKs have a licensed Commons portrait (photo-manifest.json). Tali
  Gottlieb's is 428x480, tight for the framing rule."""

# ---- BOARDS (pages) and the rows inside each -------------------------------
# The editor's pages are boards: the toolbar flips between them. v7 is archived
# onto its own page rather than deleted, so the history stays reachable.
PAGES = [
    ("screens",   "v16 Screens — the flow"),
    ("handoff",   "v16 Handoff — what the prototype gets"),
    ("character", "v12 Character"),
    ("bengvir",   "v12 MK Illustration"),
    ("vdstamp",   "v12 Verdict Stamp"),
    ("charsheet", "v12 Character Sheets"),
    ("components","v12 Components"),
    ("sharecards","v12 Share Cards"),
    ("mk",        "v12 MK Treatment"),
    ("mechanics", "v12 MK-Choice Mechanics"),
    ("v7",        "Archive"),
]

# (file, page, row) — rows are numbered within a page and read RTL.
LAYOUT = [
    # ---- THE SCREENS PAGE reads top to bottom as the game flow, and carries
    #      only chosen work. Anything still open is on it but MARKED.
    ("INTD.dc.html", "screens", 0),
    ("PeelSheet.dc.html", "screens", 1), ("Profile.dc.html", "screens", 1),
    ("V15CHAR.dc.html", "screens", 1), ("CrSplitB.dc.html", "v7", 12),
    ("PathMap.dc.html", "screens", 2),
    ("V15B1CARDR.dc.html", "screens", 3), ("V15B1CARDL.dc.html", "screens", 3),
    ("V16B1S2.dc.html", "screens", 3),
    ("V16NODE.dc.html", "screens", 2),
    ("V16KIT.dc.html", "handoff", 0),
    ("V12B1SWIPER.dc.html", "v7", 12), ("V12B1SWIPEL.dc.html", "v7", 12),
    ("V12B2CHAIRFULL.dc.html", "screens", 4),
    ("V12B2CHAIRSHEET.dc.html", "v7", 12), ("V12B2AVATARFULL.dc.html", "v7", 12),
    ("V13B3OV.dc.html", "screens", 5),
    ("V12B3A.dc.html", "v7", 12), ("V12B3M.dc.html", "v7", 12),
    ("V12B4PREDICT.dc.html", "screens", 6), ("V12B4AXIS.dc.html", "screens", 6),
    ("V15B4RIGHTAXIS.dc.html", "screens", 6),
    ("V16CHIPSRING.dc.html", "screens", 6), ("V16CHIPSFLAT.dc.html", "screens", 6),
    ("V12B4LANDED.dc.html", "screens", 6), ("V15B4RIGHT.dc.html", "screens", 6),
    ("V14PILE5.dc.html", "screens", 7), ("V14PILE2.dc.html", "screens", 7),
    ("V14PILE1.dc.html", "screens", 7),
    ("V14TOPB.dc.html", "v7", 12),
    ("V15CASC1.dc.html", "screens", 7), ("V15CASC2.dc.html", "screens", 7),
    ("V15CASC3.dc.html", "screens", 7), ("V15CASC4.dc.html", "screens", 7),
    ("V15CASC5.dc.html", "screens", 7), ("V15CASC6.dc.html", "screens", 7),
    ("V15CASCNOART.dc.html", "screens", 7), ("V15SET48.dc.html", "screens", 7),
    ("V13B5A1.dc.html", "screens", 9), ("V13B5A2.dc.html", "screens", 9),
    ("RBB5A.dc.html", "v7", 12), ("RBB5B.dc.html", "v7", 12),
    ("RBB5C.dc.html", "v7", 12), ("RBB5D.dc.html", "v7", 12),
    ("RBB5E.dc.html", "v7", 12),
    ("EndGame.dc.html", "screens", 10), ("Share.dc.html", "screens", 10),
    ("OpenItems.dc.html", "screens", 11), ("PressState.dc.html", "screens", 11),
    # ---- superseded, archived, not deleted -------------------------------
    ("INTA.dc.html", "v7", 8), ("INTB.dc.html", "v7", 8),
    ("INTC.dc.html", "v7", 8), ("INTE.dc.html", "v7", 8),
    ("Main.dc.html", "v7", 8),
    ("Round.dc.html", "v7", 9), ("Beat2OwnVote.dc.html", "v7", 9),
    ("Beat3Bill.dc.html", "v7", 9), ("Beat4MkCard.dc.html", "v7", 9),
    ("Beat5Tally.dc.html", "v7", 9), ("Beat5NoTally.dc.html", "v7", 9),
    ("Builder1.dc.html", "v7", 10), ("Builder2.dc.html", "v7", 10),
    ("Builder3.dc.html", "v7", 10), ("Builder4.dc.html", "v7", 10),
    ("Builder5.dc.html", "v7", 10), ("BuilderMotion.dc.html", "v7", 10),
    ("Builder6.dc.html", "v7", 10),
    # ---- settled, archived -----------------------------------------------
    ("VerdictA.dc.html", "v7", 6), ("VerdictB.dc.html", "v7", 6),
    ("VerdictC.dc.html", "v7", 6), ("VerdictD.dc.html", "v7", 6),
    ("BG1.dc.html", "v7", 7), ("BG2.dc.html", "v7", 7),
    ("BG3.dc.html", "v7", 7), ("BG4.dc.html", "v7", 7),
    ("BG5.dc.html", "v7", 7),
    # ---- v9 Character ----------------------------------------------------
    ("OptionSheet.dc.html", "character", 0),
    ("V15AV1.dc.html", "character", 0), ("V15AV2.dc.html", "character", 0),
    ("V15AV3.dc.html", "character", 0),
    ("AvatarShapes.dc.html", "character", 1),
    ("CreateA.dc.html", "character", 2), ("CreateB.dc.html", "character", 2),
    ("CreateC.dc.html", "character", 2),
    ("Pickers.dc.html", "character", 3),
    # ---- v10 Character Sheets --------------------------------------------
    # CrSplitB is the chosen split and lives on Screens; it cannot also live
    # here, so its alternative goes to Archive with every other loser.
    ("CrSplitA.dc.html", "v7", 12),
    ("CrMotion.dc.html", "charsheet", 1),
    ("CrProgress.dc.html", "charsheet", 2),
    # ---- v11 Round Beats ---------------------------------------------------
    ("RBB1A.dc.html", "v7", 11),
    ("RBB1B.dc.html", "v7", 11),
    ("RBB1C.dc.html", "v7", 11),
    ("RBB1D.dc.html", "v7", 11),
    ("RBB1E.dc.html", "v7", 11),
    ("RBB2A.dc.html", "v7", 11),
    ("RBB2B.dc.html", "v7", 11),
    ("RBB2C.dc.html", "v7", 11),
    ("RBB2D.dc.html", "v7", 11),
    ("RBB2E.dc.html", "v7", 11),
    ("RBB3A.dc.html", "v7", 11),
    ("RBB3B.dc.html", "v7", 11),
    ("RBB3C.dc.html", "v7", 11),
    ("RBB3D.dc.html", "v7", 11),
    ("RBB3E.dc.html", "v7", 11),
    ("RBB4A.dc.html", "v7", 11),
    ("RBB4B.dc.html", "v7", 11),
    ("RBB4C.dc.html", "v7", 11),
    ("RBB4D.dc.html", "v7", 11),
    ("RBB4E.dc.html", "v7", 11),
    
    
    
    
    
    # ---- v10 Verdict Stamp -----------------------------------------------
    ("VdStampD1.dc.html", "vdstamp", 0), ("VdStampD2.dc.html", "vdstamp", 0),
    ("VdStampD3.dc.html", "vdstamp", 0),
    ("VdPalettes.dc.html", "vdstamp", 1),
    # ---- v10 MK Illustration ---------------------------------------------
    ("BgvCardA.dc.html", "bengvir", 0), ("BgvCardB.dc.html", "bengvir", 0),
    ("BgvVerdictA.dc.html", "bengvir", 1), ("BgvVerdictB.dc.html", "bengvir", 1),
    ("BgvSizes.dc.html", "bengvir", 2),
    # ---- v9 Components ---------------------------------------------------
    ("Components.dc.html", "components", 0),
    # ---- v8 Share Cards --------------------------------------------------
    # SH-1 IS PRIMARY, SH-2 IS THE SECOND VARIANT, and the other two are
    # archived because each is blocked on somebody else's decision.
    ("ShareA.dc.html", "sharecards", 0), ("ShareB.dc.html", "sharecards", 0),
    ("ShareC.dc.html", "v7", 12), ("ShareD.dc.html", "v7", 12),
    # ---- v8 MK Treatment -------------------------------------------------
    ("MkTreatment.dc.html", "mk", 0),
    ("MechA.dc.html", "mechanics", 0), ("MechB.dc.html", "mechanics", 0),
    ("MechC.dc.html", "mechanics", 0), ("MechD.dc.html", "mechanics", 0),
    ("MechE.dc.html", "mechanics", 0),
    # ---- v7 Archive ------------------------------------------------------
    ("SortA.dc.html", "v7", 1), ("SortB.dc.html", "v7", 1), ("SortC.dc.html", "v7", 1),
    ("PathDots.dc.html", "v7", 2), ("PathRoad.dc.html", "v7", 2),
    ("PathStones.dc.html", "v7", 2), ("PathGlow.dc.html", "v7", 2),
    ("NodeA.dc.html", "v7", 3), ("NodeB.dc.html", "v7", 3),
    ("NodeC.dc.html", "v7", 3), ("NodeD.dc.html", "v7", 3),
    ("Numerals.dc.html", "v7", 4),
    ("BgA.dc.html", "v7", 5), ("BgB.dc.html", "v7", 5), ("BgC.dc.html", "v7", 5),
    ("BgD.dc.html", "v7", 5), ("BgE.dc.html", "v7", 5), ("BgF.dc.html", "v7", 5),
]


# ---- v9 additions ----------------------------------------------------------
_A_ARCHIVE = ("\nARCHIVED — style B is the direction. Style A is kept, not deleted. Two "
              "measured reasons: its crossover is about 64px, below which the riso "
              "separation stops modelling the face and flattens into hue blocks; and its "
              "dominant hue bands (190 teal, 50 and 40 yellow) share a band with the "
              "surprise verdict. That second one is CONTINGENT on the verdict palette — "
              "move the verdict off yellow and teal, as VP-1 and VP-2 do, and the "
              "collision disappears. The size finding does not go away.")
for _st, _what in (("A", "halftone / riso — yellow, coral, teal"),
                   ("B", "line + flat fill — navy suit, neutral flesh")):
    FRAME_NOTES["BgvCard%s.dc.html" % _st] = (
        "STYLE %s — %s.\nBeat 4, issue s1 (his own police law). He is in data.js in six "
        "issues and votes «for» in all six; s1 is the only one where he is key:true AND "
        "the vote is basis «doc».\nMF-B, unchanged. The artwork is a cut-out with its own "
        "alpha, so it takes the plain white die-cut rather than the multicolour filter the "
        "photograph uses — that filter's blue offset was drawn for a rectangular crop.\n"
        "176px, served by the 400px export." % (_st, _what)
        + (_A_ARCHIVE if _st == "A" else "\nCHOSEN — this is the MK illustration direction."),
        "Supplied illustration. Provenance and licence NOT verified — no source, author or "
        "terms came with the files.")
    FRAME_NOTES["BgvVerdict%s.dc.html" % _st] = (
        "STYLE %s in all three verdict states, top to bottom: correct, surprise 1, "
        "surprise 2.\nThe pill is identical in both styles — same two inks, same "
        "placement, same size. Only the artwork under it changes." % _st,
        "Supplied illustration. Provenance and licence NOT verified.")
FRAME_NOTES["BgvSizes.dc.html"] = (
    "Every size the system renders an MK at, from the 128px export: 18px sort-pot chip, "
    "40px HUD, 48px, 64px map marker, 128px list row.\n"
    "Two readings of a small portrait, both shown: the die-cut silhouette (sticker) and "
    "the square avatar slot (crop in a box).\n"
    "The bottom block is the same 48px pair on the cream ground, where the white die-cut "
    "edge has almost no contrast left.",
    "Supplied illustration. Provenance and licence NOT verified.")

for _l, _what in VD_OPTS:
    FRAME_NOTES["Verdict%s.dc.html" % _l] = (
        "VD-%s — %s.\n"
        "Three states, one under the other, so the shape can be judged in all three at "
        "once. Same card, same portrait, same crop in every option.\n"
        "Shared and fixed across all four: copy at 26px (v8 was 18px), a semi-transparent "
        "interior with a 7px backdrop blur, and a position that hangs past the card's "
        "edge on purpose.\n"
        "COLOUR CODES CORRECTNESS ONLY. Two inks, not three: one for «you called it», one "
        "for «the Knesset surprised you». SURPRISE-1 and SURPRISE-2 are two different "
        "sentences for the same state, so they share an ink — what separates them is copy.\n"
        "VERDICT COPY PENDING TAMAR — the three labels render as [RIGHT] / [SURPRISE-1] / "
        "[SURPRISE-2] and nothing on this board guesses at the Hebrew."
        % (_l, _what),
        "Photo: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0")

for _bid, _ground, _dot, _light, _what, _accent in BG_DIRS:
    _cr = _wcag("#ffffff", _ground)
    FRAME_NOTES["%s.dc.html" % _bid.replace("-", "")] = (
        "%s — %s.\n"
        "WHITE DIE-CUT EDGE vs this ground: contrast ratio %.1f:1. %s\n"
        "HUD CHIPS over the busiest area (the pile and the card's top edge): %s\n"
        "VERDICT: %s\n"
        "Accent this direction proposes: %s.\n"
        "Identical to the other four in every respect but the ground and, on the light "
        "grounds, the ink of text sitting directly ON the ground. No component is tuned."
        % (_bid, _what, _cr,
           ("The edge is doing real work — it separates card from ground on its own."
            if _cr >= 3 else
            "The white edge is effectively GONE. What holds the card's shape here is the "
            "hard dark outline underneath it (MF-B), which is exactly why MF-B and not "
            "MF-A is the frame that survives a light ground."),
           ("pale chip on a dark ground, so the chip reads as an object and its dark "
            "numerals read on the chip." if not _light else
            "the chip fill and the ground are now the same value range, so the chip "
            "stops reading as an object; only its keyline separates them."),
           ("both inks sit on a dark ground and keep their separation."
            if not _light else
            "the yellow surprise ink is close to this ground and loses its edge; the teal "
            "still reads. On a light ground the verdict needs a darker fill or a heavier "
            "keyline — which would be a change to the component, so it is not made here."),
           _accent),
        "Photo: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0")

FRAME_NOTES["BG5.dc.html"] = (
    FRAME_NOTES["BG5.dc.html"][0]
    + "\nPhoto: Reda Raouchaia · Wikimedia Commons · CC BY-SA 4.0",
    "PARTY PALETTES: with a per-topic ground the hue is on screen for a whole round, so it "
    "has to be checked against party colours, not just against the components. Two of the "
    "eight topic hues in data.js are already close: topic \"branches\" is #2b4cff, a "
    "saturated blue, and topic \"economy\" is #ff5240, a saturated red. Those two need "
    "moving before this direction can ship.")

for _t, _o, _i, _ts, _d, _g in VD_TREATS:
    FRAME_NOTES["VdStamp%s.dc.html" % _t] = (
        "VD-%s — outer stroke %.1f, inner %.1f, ring text %.1f, displacement %.1f.\n"
        "Stamp construction: two rings with a gap, the ring text running round INSIDE the "
        "inner one over the top arc, the verdict centred, and an ink-bleed edge — the "
        "strokes are pushed off true by a turbulence displacement and then punched through "
        "with a second, much finer noise, which is the ink not taking.\n"
        "PLACEMENT FIXED. v9 anchored this at top:26%%/right:-36px and it landed on the "
        "MK's face. It is now anchored to the card's BOTTOM-LEFT CORNER: 22px hangs off "
        "the side, 46px below the bottom, and the portrait — the top ~240px of a 560px "
        "card — is nowhere near it. Every state below is shown WITH the portrait, which is "
        "the only way that can be checked.\n"
        "The strip at the foot is the same stamp at 120 / 84 / 56 / 40px. Everything in it "
        "is SVG user units, so rings, ring text and distress scale together.\n"
        "Semi-transparent at .46 with a 7px backdrop blur throughout: the card edge and "
        "the ground both read through it.\n"
        "VERDICT COPY PENDING TAMAR — [RIGHT] / [SURPRISE-1] / [SURPRISE-2] plus "
        "[RING-TEXT] for the ring. Nothing here guesses at the Hebrew."
        % (_t, _o, _i, _ts, _d),
        "Supplied illustration. Provenance and licence NOT verified.")

FRAME_NOTES["VdPalettes.dc.html"] = (
    "Three palettes against the style B portrait they have to live with. Every one codes "
    "CORRECTNESS ONLY — one ink for «you called it», one for «the Knesset surprised you» "
    "— and never a vote direction.\n"
    "The degree figure beside each pair is the smallest hue distance from style B's own "
    "dominant bands, measured off the rendered frames: flesh at 10-20 and navy at 200. "
    "The current teal+yellow measures 20 degrees on the composited render, which is the "
    "collision this is trying to clear.\n"
    "VP-1 and VP-2 both put one ink in the 60-160 window and one in 240-330, the two arcs "
    "style B does not occupy.",
    "Supplied illustration. Provenance and licence NOT verified.")

FRAME_NOTES["CrSplitA.dc.html"] = (
    "SP-A — the preview keeps the screen, the sheet takes about 44%.\n"
    "The avatar is 208px and never moves. Six hair options fit in two rows without "
    "scrolling; a category with more would scroll inside the sheet, which is the cost.\n"
    "The primary in the action row is the SHIPPED «on to the map» string, and it is on "
    "THIS step as much as the last: the player leaves whenever they want and keeps what "
    "they have. Back and forward flank it, chevrons pointing outward as RTL reads.\n"
    "Every control sits inside the thumb arc.", None)
FRAME_NOTES["CrSplitB.dc.html"] = (
    "SP-B — the sheet takes about 58% and spends it on the option NAMES.\n"
    "The preview drops to 132px but is still there, which is the constraint. The names are "
    "shipped strings and they matter: the kippah and the headscarf options are the two a "
    "74px thumbnail does not explain on its own.\n"
    "Same action row, same persistent save, same thumb arc.\n"
    "THE PREVIEW IS NOT 3x. SP-B's preview was 132px; three times that is 396px, wider "
    "than the 390px frame and 38px wider than the 358px of usable width inside its "
    "padding. It cannot be done without cropping the figure or bleeding off both sides. "
    "What is here is 340px — 2.6x — the largest square that fits the width with the sheet "
    "still at a usable height. Shown rather than silently shrunk.", None)
FRAME_NOTES["CrMotion.dc.html"] = (
    "The sheet arriving and leaving, on the shortest category so the whole thing fits the "
    "window.\nWhat to look at is the band ABOVE the sheet: the preview is outside the "
    "sheet, so it is present in all three states, including while the sheet is moving. "
    "That is the whole reason for the pattern.\n"
    "260ms on a cubic-bezier(.22,.9,.3,1) — quick in, settles rather than bounces.", None)
FRAME_NOTES["CrProgress.dc.html"] = (
    "Three step indicators at true rendered size, all three in the sticker construction: "
    "white die-cut edge, hard keyline, flat fill.\n"
    "All are shown at step 3 of 5 and all read at 390px. PI-B is the only one that could "
    "carry a tap target; PI-C is the only one that uses a shipped string.", None)

FRAME_NOTES["OptionSheet.dc.html"] = (
    "Every category and every option in the running prototype, drawn by the prototype's "
    "own buildAvatarSvg() — lifted out of app.js and run, not redrawn.\n"
    "REAL COUNTS, from the arrays: skin tone 5 (SKINS), hair 6 (HAIRS), hair colour 5 "
    "(HAIR_COLORS), eyes 3 (EYES_OPTS), clothing 5 (CLOTHES). 5x6x5x3x5 = 2,250 "
    "combinations on paper; 1,650 once the hair-colour category is counted properly, "
    "since it is dropped entirely for the shaved and the headscarf options — 22 real "
    "hair/hair-colour pairs rather than 30.\n"
    "NOT DATA: every one of those options is a hardcoded SVG branch inside "
    "buildAvatarSvg(), so adding a fourth eye style is code, not a row.\n"
    "DEAD CODE: data.js also carries 8 finished preset avatars with names. app.js sets "
    "player.avatarId to the first of them at startup and never reads it again — nothing "
    "renders a preset — and the self-test still asserts there are 8.\n"
    "The skin row's own labels are bare Unicode skin-tone modifiers, which is why the "
    "line under those five swatches looks like five more swatches: there is no word for "
    "any of them.\n"
    "The last row is the one the screen does not present as an appearance control — see "
    "the flag.",
    "THE GRAMMAR TOGGLE IS AN APPEARANCE CONTROL TOO, and it does not say so. The two "
    "chips are labelled as feminine/masculine GRAMMAR and the whole app's copy switches "
    "on them through g(). The same flag also picks the avatar's clothing inside "
    "buildAvatarSvg — a tie, or a collar. One control, two jobs, one label. It sits among "
    "the appearance sections on the character screen today.")

FRAME_NOTES["AvatarShapes.dc.html"] = (
    "One face, four containers, at the three sizes the app uses: 40px HUD, 64px map "
    "marker, 200px creation screen. Same drawing in every cell.\n"
    "AS-B is what ships today.\n"
    "AS-D is the only one whose edge follows the figure rather than a box: the background "
    "plate is stripped and the alpha-dilate filter the sticker frames already use rides "
    "on the silhouette.",
    None)
FRAME_NOTES["CreateA.dc.html"] = (
    "CR-A — one scrolling list. What ships today, restyled.\n"
    "Whole set visible; nothing to learn. The preview scrolls away as soon as the player "
    "reaches the third category, so they stop seeing what they are changing.\n"
    "Five categories at this size do not fit above the thumb arc.", None)
FRAME_NOTES["CreateB.dc.html"] = (
    "CR-B — category tabs, one swipeable strip.\n"
    "The preview never leaves the screen and every category is the same height whatever "
    "its option count. Costs a horizontal swipe that runs the same axis as the RTL page, "
    "and options past the fold are discoverable only by trying.", None)
FRAME_NOTES["CreateC.dc.html"] = (
    "CR-C — hero preview, options in a bottom tray.\n"
    "The avatar is the biggest thing on the screen, which is right for a screen whose "
    "whole job is «this is you». Every control sits inside the thumb arc.\n"
    "The tray is the most work to build: it is a sheet with its own scroll.", None)
FRAME_NOTES["Pickers.dc.html"] = (
    "How ONE choice is presented, shown on the hair category — 6 options, the largest "
    "one, which is where the three actually differ.\n"
    "PK-A shows the set as a set. PK-B is the only one that is a fixed height whatever "
    "the count. PK-C names the option in words and is the only one that does.", None)

ROW_HEADS = {
  ("screens", 0): ("1 — Intro", "purple",
    "INT-D, the chosen intro, with the saved chair size and the re-cut building."),
  ("screens", 1): ("2 — Character", "purple",
    "The preset sticker sheet, the character detail the HUD opens, and SP-B — the picked "
    "creation layout, one bottom sheet per step with PI-C progress."),
  ("screens", 2): ("3 — The map", "purple",
    "The path climbs; the window parks on the first incomplete node. H-A chips, AS-D "
    "avatar, IB-B icon buttons, and the progress count as bare type."),
  ("screens", 3): ("4 — Beat 1 · the claim  ·  CHOSEN", "purple",
    "B1-B as developed: bigger card, topic graphic as a band inside it, loose stack behind, "
    "identical white answer buttons, swipe with a Reigns-style preview.\n"
    "The two frames are the SAME option with the RTL swipe mapping inverted — that is one "
    "variable and the playtest settles it."),
  ("screens", 4): ("5 — Beat 2 · your own vote  ·  CHOSEN", "purple",
    "B2-CHAIR-FULL: the chair, full-height overlay. The other two are archived.\n"
    "Behind the blur: the pinned beat-1 answer and the MK cards ahead. No bill_summary, no "
    "tally.\n"
    "CHAIR ASPECT STANDARDISED. Lion set the intro chair to 278x309 — 0.900 against the "
    "source's 0.856 — and beat 2 was drawing the same object at the source ratio, so the "
    "chair was 5% wider in one place than the other. Everything is on Lion's 0.900 now. It "
    "does stretch the artwork 5%; restoring 0.856 on the intro is the alternative."),
  ("screens", 5): ("6 — Beat 3 · the bill  ·  CHOSEN, now an overlay", "purple",
    "No longer a screen. B3-A's content — bill_title and bill_date, nothing else — on a "
    "blurred overlay over the beat-4 card, dismissed into the prediction. The bill is read "
    "while looking at the person it is about.\n"
    "Through the blur: the MK card and nothing else. The merged-header alternative is "
    "retired."),
  ("screens", 6): ("7 — Beat 4 · the MK cascade  ·  both verdicts  ·  CHIP GAP: PICK ONE", "purple",
    "B4-D as developed: portrait to the card's edges, name at 38px, prediction chips over "
    "the head on their own fill, no stamp while predicting.\n"
    "THE AXIS STAYS. Two landed frames side by side: the 190px stamp with the "
    "guess-vs-reality axis fully legible, and the 250px stamp without it. The trade is "
    "shown rather than argued.\n"
    "THE CHIP GAP, REOPENED because it was reported fixed and was not. The three "
    "chips are laid out by .b3v, which votes3() wraps them in — the gap v16 set "
    "was on .v4pred, a row with one child, so nothing moved. The chips kept 9px, "
    "and because each one paints 4.6px of keyline OUTSIDE its box, 9px of gap is "
    "minus 0.2px of daylight: the keylines overlap. Beat 2 is fine at the same "
    "9px only because its button paints nothing outside its box.\n"
    "CHIPS-RING is applied to every beat-4 frame here: same ring, 18px gap, 8.8px "
    "of daylight. CHIPS-FLAT is beat 2's button verbatim at 9px. Pick one."),
  ("screens", 7): ("8 — Beat 4 · the pile depleting  ·  NEW", "purple",
    "The round is a deck and the beat is working through it. Five cards on s1 — six MKs "
    "in data.js, five dealt by app.js:373 — so four backs on the first card, one on the "
    "fourth, none on the fifth. The backs are edges only.\n"
    "They fan from the front card's bottom centre, which keeps the whole lower half of "
    "the card free for the stamp's overhang and the axis."),
  ("screens", 7): ("8 — The set  ·  every MK on s1, one crop rule", "purple",
    "Six of the twenty-one politicians in data.js now have an illustration, and all six "
    "are framed by one recovered rule rather than by eye: 3:4, face at 68.3% of the frame "
    "width, eyeline at 37.7% — the numbers read off Ben Gvir's own shipped crop, so «the "
    "same prep» means the same numbers.\n"
    "Detection is measured, not asserted: eyes are found as dark ink with skin both above "
    "and below it, which is what separates them from hair and from a beard. Two faces "
    "broke the first two detectors and are the reason for that rule.\n"
    "The seventh card is the initials fallback for an MK with no art. The eighth frame is "
    "the whole set at 48px, which is where a portrait set holds together or does not."),
  ("screens", 9): ("10 — Beat 5 · the reveal  ·  CHOSEN, two variants open", "purple",
    "B5-A rebuilt with less on screen, not restyled. One thing dominant: the count and the "
    "resolution lead, tf_explain is the explanation beneath, sources are ONE line, and the "
    "glossary term is marked inline where it already occurs — no definition panel.\n"
    "TWO variants, differing only in whether the count is a large numeral or a quiet figure "
    "beside the resolution. Three states on each, because there are three: _tally present, "
    "no numbers at all, and the undesigned case where a count exists only inside "
    "bill_summary prose with no field to read it from."),
  ("screens", 10): ("11 — Leaving the game", "purple",
    "End-game allocation at 8/8, and the share card."),
  ("screens", 11): ("12 — Open items, and the primary's states", "purple",
    "Everything still undecided on one frame, with owners. Beside it, P-C at rest and "
    "pressed."),
  ("v7", 9): ("v9-v10 · the old round", "gray",
    "Archived. Superseded by the chosen beats on the Screens page."),
  ("v7", 10): ("v8 · character builder concept", "gray",
    "Archived. Superseded by SP-B on the Screens page."),
  ("v7", 12): ("v12-v13 · the options that lost", "gray",
    "Archived. The two unchosen beat-2 overlays, both beat-3 alternatives, and the five "
    "v11 beat-5 options."),
  ("v7", 11): ("v11 · beat options 1-4", "gray",
    "Archived. Beat 1 and beat 4 are settled; beats 2 and 3 moved forward as v12 options."),
  ("v7", 6): ("v9 · verdict shapes — VD-D chosen", "gray",
    "Archived. VD-D won and is rebuilt as a pressed stamp on the v10 Verdict Stamp board; "
    "its placement here, over the portrait, is the bug that pass fixed."),
  ("v7", 8): ("v11 · intro compositions — INT-D chosen", "gray",
    "Archived, not deleted. INT-D won; the other four and the v10 intro they replaced are "
    "kept here for the record."),
  ("v7", 7): ("v9 · background directions — BG-1 chosen", "gray",
    "Archived. BG-1, charcoal plus the dot grid, is the ground on every frame."),
  ("_dead_verdict", 0): ("The verdict — four shapes, three states each", "purple",
    "Every option straddles the MK card's edge, has a semi-transparent interior with a "
    "backdrop blur, and sets its copy larger than the v8 verdict. What differs between "
    "them is SHAPE and PLACEMENT — never colour. Pick one: VD-A, VD-B, VD-C or VD-D."),
  ("_dead_bg", 0): ("Five grounds, one screen", "purple",
    "The MK cascade beat, byte-identical on all five, so the only variable is the "
    "ground. Nothing is tuned per background: the card keeps its white die-cut edge on "
    "the cream and topic-hue grounds too, where it has almost nothing left to sit on."),
  ("character", 0): ("The set as it ships", "purple",
    "Every category and every option in the running prototype, drawn by the prototype's "
    "own buildAvatarSvg(). Nothing here is invented and nothing is redrawn."),
  ("character", 1): ("Avatar container — four shapes", "purple",
    "One face, four containers, each at the three sizes the app actually uses: 40px in "
    "the HUD, 64px as a map marker, 200px on the creation screen."),
  ("character", 2): ("Creation screen — three layouts, CR-C chosen", "gray",
    "Settled. CR-C is the base and is rebuilt on the v10 Character Sheets board, where the "
    "tray becomes one sheet per step. CR-A and CR-B are kept for the record."),
  ("character", 3): ("Option picker — three ways to present one choice", "purple",
    "Shown on the hair category, the largest at 6 options, because that is where the "
    "difference between the three actually bites."),
  ("_dead_charsheet", 0): ("Character creation — one bottom sheet per step", "purple",
    "CR-C is the base and the flow is the change: each category is its own sheet, and the "
    "avatar preview above it never leaves. RTL, 390px. The dashed arc is a one-handed "
    "right thumb on a 390x844 screen — every control in both splits sits inside it. "
    "The primary in the sheet is the SHIPPED «on to the map» string, present on every "
    "step, so no step is mandatory. Pick a split: SP-A or SP-B."),
  ("charsheet", 1): ("The sheet arriving and leaving", "purple",
    "The same screen at three points in the transition. What matters is the band above "
    "the sheet: the preview is outside the sheet, so it is still there in all three."),
  ("charsheet", 2): ("Step progress — three options", "purple",
    "All three at true rendered size, all three in the sticker construction — white "
    "die-cut edge, hard keyline. Pick one: PI-A, PI-B, PI-C."),
  ("v12", 0): ("Beat 1 — B1-B developed, with the swipe", "purple",
    "Bigger card, the topic graphic inside it as a band, a loose stack behind, the claim "
    "type kept large, and the two answers below — white, black ink, visually identical.\n"
    "RTL SWIPE DIRECTION IS UNRESOLVED and is not assumed here. The mapping between the "
    "edge you drag toward and the word you are heading to is ONE VARIABLE, and both "
    "settings are rendered so the pair can go into the playtest together. The preview "
    "never colour-codes: same ink for both words."),
  ("v12", 1): ("Beat 2 — the meta question, as an overlay", "purple",
    "Translucent and backdrop-blurred over the live round, so this reads as an "
    "interruption rather than a step in the same plane. Three options vary the player's "
    "presence (chair or avatar), the overlay height, and how much reads through.\n"
    "Behind the blur: the pinned beat-1 answer and the MK cards ahead. NOT bill_summary "
    "and NOT any tally."),
  ("v12", 2): ("Beat 3 — its own screen, or beat 4's header", "purple",
    "The same two strings, both ways, at the same size. A beat of its own gives the bill a "
    "moment; a merged header saves a screen in a 60-second round. Lion's call."),
  ("v12", 3): ("Beat 4 — B4-D developed, and the stamp landing", "purple",
    "Portrait to the card's edges, name much larger, prediction chips over the head. The "
    "stamp is far bigger, sits on top of the card and hangs past its edge. No stamp in the "
    "predict state — that rule holds."),
  ("beats", 0): ("Beat 1 — the claim", "purple",
    "Five ways to stage the same claim, answered אמת / שקר. NO SOURCE ATTRIBUTION on any of "
    "them: naming the outlet before the guess hands the player a partisan cue to answer from "
    "instead of the claim itself.\n"
    "THE STAGING IS A POLITICAL CHOICE. A chyron reports, a poster declares, bare type states, "
    "a held card confides. Each one frames who is speaking before the player answers, and that "
    "is Tamar's call rather than a design preference."),
  ("beats", 1): ("Beat 2 — the player's own vote", "purple",
    "bill_summary IS GONE FROM THIS BEAT in all five. It ends with the Knesset's own vote count "
    "in 10 of the 16 issues — «עבר 63 מול 57» — so rendering it here put the answer on screen "
    "before the player formed one. It now lives at beat 5, with the rest of the outcome.\n"
    "This beat is the player's OPINION, not a prediction, and the five vary in how much they "
    "make that felt. Three vote options throughout, never colour- or size-coded."),
  ("beats", 2): ("Beat 3 — neutral context", "purple",
    "bill_title and bill_date, nothing else. The five test how austere this can be and still be "
    "a beat. B3-E is included to show the floor — it is too little, and the note says so."),
  ("beats", 3): ("Beat 4 — the MK cascade card", "purple",
    "Portrait dominant at the bottom on a uniform halo, content above. The halo is the reason "
    "this survives 21 different illustrations: it separates the subject from the ground without "
    "the artwork having to do it.\n"
    "Every option is drawn TWICE — predicting, then revealed — because the stamp conflict and "
    "the guess-vs-reality pair only exist in the second state. The three prediction options are "
    "always present and always equal; where they sit relative to the portrait, and how the stamp "
    "avoids both them and the face, is resolved differently in each and stated in each note."),
  ("beats", 4): ("Beat 5 — the reveal", "purple",
    "Every option in BOTH states: r1, which has _tally, and e2, which has no vote numbers at all.\n"
    "_tally is on 8 of 16 issues. The other 8 are not one state but two: b2, a2 and s2 carry a "
    "count inside bill_summary PROSE that no field exposes, and e2, g1, g2, v2, m1 carry no vote "
    "numbers anywhere. A design that only works with numbers fails on half the game — B5-D is "
    "marked unusable for exactly that reason."),
  ("vdstamp", 0): ("VD-D as a pressed stamp — three treatments", "purple",
    "Two rings with a gap, text running round inside the inner one, the verdict centred, "
    "and an ink-bleed edge so it reads as pressed rather than placed. Semi-transparent "
    "with a backdrop blur throughout. All three states on every treatment, on the real MK "
    "card, at true rendered size. Pick one: VD-D1, VD-D2, VD-D3."),
  ("vdstamp", 1): ("Verdict palettes — clearance from the illustration", "purple",
    "Colour codes CORRECTNESS ONLY here, never a vote direction, and the two inks are the "
    "same two on every option. The number beside each is the smallest hue distance from "
    "style B's own bands (flesh 10-20, navy 200) — the current pair measures 20 degrees "
    "on the composited render, and both alternatives clear it by a wide margin."),
  ("bengvir", 0): ("Ben Gvir — the cascade card, style B chosen", "purple",
    "Issue s1, his own police law: the one issue of his six where he is flagged key and "
    "the vote is documented rather than inferred from his bloc. Name, party, both votes "
    "and the note are data.js verbatim."),
  ("bengvir", 1): ("The three verdict states, over each style", "purple",
    "Same card, same pill, same two inks. The question is whether the artwork competes "
    "with the only colour on this screen that carries meaning."),
  ("bengvir", 2): ("Small appearances, and 48px on both grounds", "purple",
    "Every size the system uses, served by the 128px export. Two readings of a small "
    "portrait: the die-cut silhouette and the square avatar slot."),
  ("components", 0): ("Component options", "purple",
    "One frame, seven components, options side by side. Every option is real markup, "
    "not a picture of a control."),
  ("handoff", 0): ("The component kit, drawn by the shipped stylesheet", "purple",
    "explorations/v16/prototype/ is the deliverable: hachach.css (one stylesheet, tokens "
    "in :root then the components), manifest.json (id to asset path, generated from "
    "data.js and asserted against disk) and components.html (every class rendered from "
    "the stylesheet alone). README.md in explorations/v16/ says how to consume it.\n"
    "This frame pastes hachach.css in verbatim, so it is the same file the prototype "
    "gets — not a picture of it."),
  ("sharecards", 0): ("Share cards — TWO PICKED, the end-game offers both", "purple",
    "SH-1 leads with the surprise count — the metric that is HIGH when the player did "
    "badly, which is what makes it sendable rather than a boast — and SH-2 is the trail, "
    "the variant that names no topics. The player picks at the end of the run; the choice "
    "is the feature.\n"
    "SH-3 and SH-4 are archived, each blocked on somebody else's decision rather than on "
    "a design one: SH-3 puts a real bill on a card that leaves the app (Tamar), SH-4 "
    "discloses the player's own topic choices and there is no agreed opt-in for it."),
  ("mechanics", 0): ("How the MK choice is made — five mechanics", "purple",
    "Beat 4 asks the player to predict how 3–9 named MKs voted; this board is about what "
    "the asking should feel like. Every option is measured against the same constraints: "
    "9 MKs at 390px, abstain empty in 12 of 16 rounds, RTL and thumb reach, and a reveal "
    "cascade that does not change whatever the input is."),
  ("mk", 0): ("MK sticker treatment", "purple",
    "One MK, one frame, three uniform filters. Frame and filter only."),
  ("v7", 1): ("v7 · sort to commit", "gray", "Archived."),
  ("v7", 2): ("v7 · path styles — ribbon chosen", "gray", "Archived."),
  ("v7", 3): ("v7 · node styles — A chosen", "gray", "Archived."),
  ("v7", 4): ("v7 · numerals", "gray", "Archived."),
  ("v7", 5): ("v7 · background options — b chosen", "gray", "Archived."),
}

COL_W, NOTE_W = 470, 390
NOTE_SIZE_PX = {"s": 13, "m": 15, "l": 18, "xl": 22, "xxl": 30}

NOTE_SAFETY = 2.4        # measured against the published board, not guessed

def note_height(text, w=NOTE_W, size=13):
    """Estimate a sticky note's rendered height so nothing stacks.

    The first version modelled a note as text plus 26px of padding and was
    about 2.4x under — the canvas leads and pads far more than that, which is
    why page headers piled on top of each other. The factor is calibrated from
    the real render and applied with headroom: too much space costs empty
    canvas, too little costs the pile-up."""
    per_line = max(10, int(w / (size * 0.62)))
    lines = 0
    for para in text.split("\n"):
        lines += max(1, -(-len(para) // per_line))
    return int(lines * size * 1.6 * NOTE_SAFETY) + 44

def build():
    for f in (board_intro, board_peel, board_builder_steps, board_map, board_round,
              board_beat2, board_beat3, board_beat4, board_beat5a, board_beat5b,
              board_profile, board_path_options, board_node_options, board_endgame,
              board_share_variants, board_components, board_mk_treatment,
              board_mechanics,
              board_verdict_options, board_bg_dirs, board_bengvir, board_vd_stamps,
              board_char_sheets, board_beats, board_intro_options, board_press_state,
              board_v16, board_beats13, board_open,
              board_av_shapes, board_create_layouts, board_pickers,
              board_option_sheet,
              board_share, board_sortA, board_sortB, board_sortC,
              board_numerals, board_backgrounds):
        f()
    # every character the board sets, gathered before a single page is written
    seen = set()
    for b in BOARDS:
        seen.update(re.sub(r"<[^>]*>", " ", b["body"]))
    seen.update("0123456789%-–—·:,.()[]/ ")
    FONT = subset_font("".join(sorted(seen)))
    print("   headline face subset to %d characters: %d KB of base64 (was %d KB)"
          % (len(seen), len(FONT) / 1024,
             len(base64.b64encode(FONT_SRC.read_bytes())) / 1024))
    shared = SHARED.replace("%FONT%", FONT)
    shared_straight = lean(derotate(shared))
    tilted = {f for f, pg, _ in LAYOUT if pg == "sharecards"}
    files = {}
    for b in BOARDS:
        var = b["var"]
        keep_tilt = b["file"] in tilted
        sh = shared if keep_tilt else shared_straight
        bcss = lean(b["css"] if keep_tilt else derotate(b["css"]))
        # SHAKE AGAINST THE WHOLE ASSEMBLED PAGE, not against b["body"].
        # The wrapper classes — .frame, .fz, the page chrome — live in the PAGE
        # template, so shaking against the body alone drops the rules that build
        # the phone frame itself and every artboard renders as loose content on
        # a white ground. Assemble first with the stylesheet still a hole, prune
        # against that, then fill the hole.
        page = (PAGE
            .replace("%SHARED%", "")
            .replace("%CSS%", "%CSS%").replace("%VAR%", var)
            .replace("%FH%", str(b["fh"])).replace("%PH%", str(b["fh"]))
            .replace("%DEFS%", DEFS(var)).replace("%BODY%", b["body"]))
        css_all = shake(sh.replace("%VAR%", var) + "\n" + bcss.replace("%VAR%", var),
                        page)
        # and drop the face itself from any artboard whose surviving rules never
        # name it — about a third of them set no headline type at all.
        if "'SimplerPro'" not in css_all.split("@font-face", 1)[-1].split("}", 1)[-1]:
            css_all = re.sub(r"@font-face\{[^}]*\}", "", css_all, count=1)
        page = page.replace("%CSS%", css_all)
        note = " ".join(FRAME_NOTES.get(b["file"], ("", None))[0:1]) + " " + \
               (FRAME_NOTES.get(b["file"], ("", None))[1] or "")
        if "mk-portrait.webp" in b["body"]:
            assert "CC BY-SA 4.0" in note, ("photo credit missing", b["file"])
        # every filter a page references must be defined ON that page. The
        # defs are per-artboard and suffixed with its var, so a rule that names
        # another board's suffix resolves to nothing and renders unfiltered.
        for ref in set(re.findall(r"url\(#([a-zA-Z0-9_-]+)\)", page)):
            assert ('id="%s"' % ref) in page, ("dangling filter", b["file"], ref)
        (OUT / b["file"]).write_text(page, encoding="utf-8")
        files[b["file"]] = b

    rows = {}
    for fname, pg, row in LAYOUT:
        rows.setdefault((pg, row), []).append(fname)
    arts, notes = [], []
    GAP_FRAME_NOTE, GAP_ROW = 44, 180
    for pg, pg_name in PAGES:
        y = 0
        _sub = PAGE_SUB.get(pg, ARCHIVE_SUB if pg == "v7" else BOARD_SUB)
        # measured on the MERGED text at the width it is actually drawn at —
        # measuring the title alone is what put the header on top of row 1
        _hdr_txt = pg_name + "\n" + _sub
        _hdr_h = note_height(_hdr_txt, 1120, NOTE_SIZE_PX["xxl"])
        _hdr_y = -(_hdr_h + 100)
        # THE 200-ANNOTATION CAP. Anything past 200 is dropped by the editor
        # without a warning, and this round crossed it at 211. Nothing is cut:
        # the page title and its blurb become one note, and so do every row
        # heading and its sub below — 21 notes recovered, no words lost.
        notes.append({"id": "t-%s" % pg, "x": 2, "y": _hdr_y, "w": 1120,
                      "page": pg, "text": _hdr_txt,
                      "size": "xxl", "bold": True})
        for (p2, row) in sorted(k for k in rows if k[0] == pg):
            names = rows[(p2, row)]
            head, colour, sub = ROW_HEADS[(p2, row)]
            right_x = (len(names) - 1) * COL_W + 2
            hw = min(1240, right_x + NOTE_W)
            htxt = "%d — %s" % (row + 1, head)
            if pg not in ("screens", "v12"):
                htxt = htxt + "\n" + sub
                notes.append({"id": "h-%s%d" % (pg, row), "x": 2, "y": y, "w": hw,
                              "page": pg, "text": htxt, "size": "l", "bold": True,
                              "color": colour})
                y = y + note_height(htxt, hw, NOTE_SIZE_PX["l"]) + 56
            else:
                htxt2 = htxt + "\n" + sub
                notes.append({"id": "h-%s%d" % (pg, row), "x": 2, "y": y, "w": hw, "page": pg,
                              "text": htxt2, "size": "xl", "bold": True, "color": colour})
                y = y + note_height(htxt2, hw, NOTE_SIZE_PX["xl"]) + 56
            tall = max(files[f]["fh"] for f in names) + 16
            nb = 0
            for order, fname in enumerate(names):
                b = files[fname]
                x = (len(names) - 1 - order) * COL_W + 2
                arts.append({"file": fname, "x": x, "y": y, "w": 390, "h": b["fh"] + 16,
                             "page": pg, "title": "%s · %s" % (b["num"], b["en"])})
                body, flag = FRAME_NOTES.get(fname, ("", None))
                if flag:
                    body = (body + "\n\n" + flag) if body else flag
                ny = y + b["fh"] + 16 + GAP_FRAME_NOTE
                notes.append({"id": "n-" + fname.replace(".dc.html", "").lower(),
                              "x": x, "y": ny, "w": NOTE_W, "page": pg,
                              "text": body, "size": "s",
                              **({"color": "teal" if "CC BY-SA" in flag else "orange"}
                                 if flag else {})})
                ny += note_height(body) + 10
                nb = max(nb, ny)
            y = max(y + tall, nb) + GAP_ROW
        if pg == "screens":
            notes.append({"id": "z-open", "x": 2, "y": y, "w": 1160, "page": pg,
                          "text": OPEN_NOTE + "\n\nUNWRITTEN COPY — Tamar\n"
                                  + "\n".join("- " + t for t in dict.fromkeys(TAMAR_TODO)),
                          "size": "m", "bold": True, "color": "red"})
    (OUT / "canvas.json").write_text(
        json.dumps({"artboards": arts, "annotations": notes,
                    "pages": [{"id": i, "name": n} for i, n in PAGES],
                    "launch": {"view": "canvas", "page": "screens"}},
                   ensure_ascii=False, indent=2), encoding="utf-8")
    n_chairs = assert_one_chair_aspect(
        [(p.name, p.read_text(encoding="utf-8")) for p in sorted(OUT.glob("*.dc.html"))])
    print("%d artboards, %d notes, %d pages, %d chairs at one aspect"
          % (len(arts), len(notes), len(PAGES), n_chairs))

PAGE_SUB = {
  "handoff": ("Tokens, components and an asset manifest, as files rather than as a "
              "description of files. Nothing here has to be reverse-engineered off an "
              "artboard."),
  "_dead_verdict": ("Four verdict treatments. They share everything the brief fixed — larger copy, a "
              "semi-transparent interior with a backdrop blur, a position straddling the MK "
              "card's edge — and differ only in shape and placement.\n"
              "VERDICT COPY PENDING TAMAR. The labels are neutral tokens on purpose. The shipped "
              "wrong-verdict word is out — the Knesset surprised the player, they did not fail — "
              "and the claim's TRUE answer word cannot double as a verdict when it is already "
              "one of the two answer buttons on beat 1.\n"
              "Pick one: VD-A, VD-B, VD-C, VD-D."),
  "_dead_bg": ("One screen — the MK cascade beat — on five grounds, at 390px, side by side.\n"
              "Nothing is tuned per ground. The card keeps its white die-cut edge on the light "
              "grounds too, where it has nothing left to sit on; each note carries the measured "
              "white-on-ground contrast ratio.\n"
              "Pick one: BG-1, BG-2, BG-3, BG-4, BG-5."),
  "vdstamp": ("VD-D, the pick, rebuilt as a pressed stamp — and the placement bug fixed.\n"
              "In v9 the stamp landed on the MK's face. It is now anchored to the card's "
              "bottom-left corner, straddling the card edge and the ground, with the "
              "portrait clear. Every frame shows it with a portrait present.\n"
              "VERDICT COPY PENDING TAMAR. Pick a treatment: VD-D1, VD-D2, VD-D3 — and a "
              "palette: control, VP-1 or VP-2."),
  "beats": ("Five options for each of the five beats, one beat per row, at 390px.\n"
            "Constant across all 25: the beat-1 answer stays pinned from beat 2 to beat 5; the "
            "three vote options are always three, always equal, never hidden — dropping נמנע in "
            "a round where nobody abstained would leak the answer; colour codes correctness only; "
            "and nothing between beats 2 and 4 carries a source, a tally or an explanation.\n"
            "Everything quoted is data.js. Where a slot has no shipped string it renders the loud "
            "placeholder and is listed for Tamar."),
  "charsheet": ("CR-C rebuilt as one bottom sheet per step. The preview above the sheet "
                "never leaves — that is the point of the pattern — and the save/done is on "
                "every step, so no step is mandatory.\n"
                "RTL at 390px; the dashed arc is a one-handed right thumb on 390x844.\n"
                "BOTH PICKS ARE SETTLED. The split is SP-B, which now lives on Screens with "
                "SP-A in Archive; the progress indicator is the pile. What is left on this "
                "page is the motion and the indicator study behind those two decisions."),
  "character": ("The character set, read out of the running prototype: app.js's own five arrays "
              "for the counts, and app.js's own buildAvatarSvg() — lifted out and run — for every "
              "face on this board.\n"
              "WHAT THE READ TURNED UP: (1) data.js has 8 finished preset avatars with names; "
              "app.js assigns AVATARS[0].id to player.avatarId at startup and never reads it "
              "again, so nothing renders them — dead code. (2) hair colour is conditional: the "
              "whole category is hidden when hair is the shaved or the headscarf option. (3) the "
              "grammar chips are labelled as a language setting but also pick the avatar's "
              "clothing.\n"
              "Pick: a container shape (AS-A…AS-D), a layout (CR-A…CR-C), a picker (PK-A…PK-C)."),
}

ARCHIVE_SUB = ("Archived from v7. Kept for the record — the decisions these frames "
               "settled (ribbon path, node style A, background b) are already applied "
               "on the v8 Screens board.\n"
               "Icons are placeholders — the pack's license is not verified.")


if __name__ == "__main__":
    build()
