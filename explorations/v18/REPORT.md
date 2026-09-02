# v18 session report

Branch `flow-proto`. Nothing staged, nothing committed. `app.js`, `data.js`,
`index.html` (the shipped app's) and `styles.css` were not touched. All code
changes are in `explorations/v16/proto/{proto.js,proto.css}`; everything new is
under `explorations/v18/`.

Verified in Chromium 131 and WebKit 18.2 at 360×640, 393×852 and 430×932, with
the console watched throughout. Zero errors in every run.

---

## 1 · The path map

### 1.1 The ribbon reads as one line — **the mask is gone**

Of the three routes in the brief I took **none of them straight**: I dropped the
mask entirely and let the ribbon run uncut under the discs, which is the second
option taken to its end rather than the compromise version of it.

**Why the mask failed, and why it is not tunable.** It punched a hole of
`r = --ring-r` at every node so the ribbon ended on the ring's centreline, and
the ring stroke was supposed to cover the cut. Two things defeat that:

* the segments carry the board's 27.2° gaps, and for a **two-issue topic those
  gaps land at the top and the bottom of the ring** — exactly where the ribbon
  arrives. There is no stroke there to cover anything, at any weight. Five of
  the six live topics have two issues.
* inside the ring's inner edge the ground is charcoal, and the mask had removed
  the ribbon from all of it. Even where the stroke *did* cover the cut, the
  annulus between disc and ring showed charcoal where the road should be.

So **thickening the stroke (option 3) fixes neither** — it narrows the annulus
without closing it and does nothing about the gaps. **Shrinking the hole to the
disc's radius (option 1) fixes both**, but leaves a second radius that has to be
kept in step with `--node-face` and `--node-depth` by hand; a few px too large
and the charcoal ring is straight back.

**What ships:** no mask, no `<g mask>`, no `#pathmask`. The ribbon is one path
and `.node`'s `z-index:2` over `.path-line`'s `1` covers it — which was already
true and is now the only thing doing the work. The path cannot read as severed
because it is not cut, and there is no second radius to drift.

What is now visible inside the ring is the ribbon crossing the 7px of open
ground between disc and ring. That is the road passing behind the node, and it
only works because 1.4 pulled the ring back in — at the 18.5px stand-off the old
overhang forced, the same ribbon read as a bar across a gap.

**Verified two ways:**

* structurally — both `<path>` elements carry **one subpath, unclosed**
  (`M` count 1, no `Z`), length 1357–1369px depending on width.
* by pixel — 70 probes: every node, above and below the disc, at scroll top /
  middle / bottom, at all three widths. Each probe scans the 84px-wide row just
  outside the disc for ribbon-luminance pixels. **0 gaps.**

### 1.2 Nodes are 15% larger — the rendered parts, not the box

The last attempt grew `--node-box` 116 → 132 and left the disc at 76 and the
depth at 7, so the bounding box moved and the node did not. Everything that
actually draws moved together:

| part | before | after | ratio |
|---|---|---|---|
| disc `--node-face` | 76px | **87px** | 1.145 |
| extrusion `--node-depth` | 7px | **8px** | 1.14 |
| icon average `--node-ico-avg` | 44px | **51px** | 1.159 |
| number / check badge | 21px | **24px** | 1.14 |
| badge inset | 5px | **6px** | 1.2 |
| badge type | 12px | **14px** | 1.17 |
| label `.node-name` | 14px | **16px** | 1.14 |
| status `.node-status` | 11px | **13px** | 1.18 |
| gap disc-base → label | 26.5px | **30.5px** | 1.15 |
| ring stroke `--ring-w` | 6px | **10px** | 1.67 — see 1.3 |
| ring radius `--ring-r` | 63px | **59.5px** | 0.94 — see below |
| node box `--node-box` | 132px | **130px** | — |

**The ring radius went down while everything else went up**, and that is 1.4
rather than a contradiction: the cream tile and the 14px overhang are gone, so
the clearance that forced r=63 is gone with them. The ring is back to hugging
the face+base composite by the board's own margin, scaled 15%: composite
half-height `(87+8)/2 = 47.5`, plus the board's 6px clearance scaled to 7 =
54.5px inner edge, plus half the 10px stroke = **r = 59.5**.

The node box shrinks 132 → 130 for the same reason, so the 199px node spacing
absorbs the change untouched and the connector geometry needed no new numbers —
`nodeY()`, `ringGeom()` and `drawPath()` all read the tokens.

Badge clearance re-derived: 24px inset 6px on an 87px face puts a badge's far
corner **50.3px from the ring centre — 51.8 with its 1.5px casing — against a
54.5px inner edge.** That is 2.7px of clearance where the board's 21/5 against
r=50.5 had 1.7px, so "nothing may overlap the ring, shadows included" holds by a
wider margin than before.

Icon clearance: the widest icon in the set is the scales (gender, `node_scale`
1.1105) at 56.6 × 49.6, half-diagonal 37.6px from the face centre and 46.0 from
the ring centre — 8.5px inside the ring. The tallest, the receipt at 29.2 × 54.9,
clears by more. Nothing in the set touches the ring at any of the three widths.

### 1.3 Ring stroke — **6px → 10px**

15% of 6 is 6.9, which would read exactly as thin as before against a node 15%
larger. 10px is **11.5% of the 87px disc** where the board's 6px was 7.9% of 76.
It is what makes the ring read as a track with part of it filled rather than as
two arcs sitting near a disc.

### 1.4 Icons sit directly on the disc

The cream stadium tile and the 14px overhang are both removed — CSS rule, JS
emitter and the `--node-ico-over` / `--node-tile-pad` tokens. The icon is
optically centred in the face, lifted 1.5px off geometric centre so it does not
read low against the 8px base. It stays a child of `.node-face`, so it still
inherits the 80ms press translate rather than duplicating it.

**What still separates a coral icon from a coral disc** is the die-cut,
`url(#dcw-sm)` — the 2px white dilate the avatars carry. The earlier instruction
was "pick one, do not do both": the tile and the die-cut were the two
candidates, the tile won that round, and removing the tile promotes the die-cut
rather than leaving the icon unseparated. It follows the object's silhouette
instead of boxing it, so the disc's hue still shows through the gaps in the
scales and the hole in the magnifier.

### 1.5 The road runs off both edges

The two pads were always there and always empty. `drawPath()` now draws from
`h + 24` to `-24` — below the bottom of the scroll area and above the top of it —
with a straight lead-in and lead-out on the vertical tangents the first and last
beziers already arrive on, so the bleed cannot kink. `--node-pad-top` went 84 →
**110** so 45px of ribbon shows clear of the top node's ring before the edge; the
bottom already had 132.

The 24px of over-draw is past the path's own box on purpose — the scroll
container clips it, and a cap that is clipped cannot read as an end.

**Verified:** at full scroll-up the map window's top row carries 23–63px of
ribbon; at full scroll-down its bottom row carries 19–59px. No terminus at
either end at any scroll position, at any of the three widths.

### Screenshots

`explorations/v18/shots/map-{360x640,393x852,430x932}-{top,parked,bottom}.png`
— nine frames. No horizontal scroll and no label wrap at any width (checked
programmatically: every `.node-name` is one line).

---

## 2 · The chosen v17 options, built

| option | state |
|---|---|
| **B1-2** first-run overlay | built, new |
| **B2-4** MK question as a sticker | built, new — replaces A8's 17px helper line |
| **B2-4 on the claim card** | built, same component, second copy string |
| **B3-3** die-cut sticker modal | built, new — the law modal was unstyled |
| **B4-1** punch-hole guess mark | already shipped as A8's `.gx-punch`; unchanged |
| **B4b-1** avatar die-cut in the chyron | already shipped as A7's `.chyron-av`; unchanged |
| **B5-1** exit sheet | built and **centred H and V** — see 3.3 |

### B2-4 · the ask sticker

**One component, two copy strings.** `slapAsk(text)` with
`ASK.claim = 'אמת או שקר?'` and `ASK.mk = 'מה הוא/היא הצביע/ה?'`, both marked
`/* TAMAR */`. There is no second component and no second stylesheet block.

**Settled size: 127 × 40 CSS px** for the claim copy, **190 × 40** for the MK
copy (font 16px, SimplerPro 900, 8/13/9 padding, 3px die-cut). Measured
identically at 360×640, 393×852 and 430×932 in **both engines** — the whole point
of the counter-scale below. It is not decoration: at 360 the sticker is 47% of
the card's rendered width.

**It is chrome-scale, not card-scale.** `sizeStage()` scales `.stack` so a 620px
card fits a short phone (0.7306 at 360×640, 1.0 at 393 and 430). Left alone the
sticker would inherit that and settle *smallest on the smallest screen*, which is
backwards for an instruction. `.ask-st` counter-scales by `1/--card-scale` about
the corner it is pinned to. The two transforms are on two elements on purpose:
`.ask-st` carries the static counter-scale, `.ask-st__i` carries the keyframe
slap, so an animation never has a base value that changes on resize.

**It costs the card nothing** — parented to `.cardwrap`, which does not clip,
overhanging the card's top edge. `.mf-b` carries `overflow:hidden` and would clip
it, and anything inside the card face would push the name/party block toward the
stamp's 430px band.

**One collision found and fixed.** Drawn in the top-right *corner* as the board
has it, the sticker covered the MK's name outright — `.mf-b__id` is at
`top:18px inset-inline:14px` with `text-align:right`, which in RTL is that exact
corner. It now straddles the card's **top edge** (`bottom: calc(100% - 10px)`),
foot 10px inside the card, body above it. The name block starts 8px below where
the sticker ends **at any name length**, because the sticker is no longer in the
name's band at all. It remains diagonally opposite the stamp (`top:430 left:-22`),
so the two cannot meet on any card at any scale.

**Timing: `--t-ask-delay: 480ms`, `--t-ask-in: 300ms`.** The card turn is
`--t-card-flip: 450ms` on `--e-settle`, which is asymptotic — the card is
visually stopped around 390ms and the last 60ms is sub-pixel. 480ms puts the slap
about 90ms after the eye reads the card as arrived: clearly a second event, still
inside the window where the eye is on that corner. Low end of the 400–600 band on
purpose — at 600 the pause reads as hesitation, and the cascade's per-card tempo
is ~850ms end to end. (5ms is a third of a frame at 60Hz; the slap and the card
would arrive on the same paint.)

**It slaps once and stays.** `armPredict(first)` only calls it on the first card
of the cascade; resolved cards swipe out from under it and the next turns over
beneath it. The v17 board's own stated risk for B2-4 was "it repeats on every
card, which is where it may wear out" — one slap is the version that answers
that, and it matches the brief's "and **stays** for the rest of the cascade".
On the claim card it retires the moment the answer commits, before the card
flings: a sticker still asking a question on a card flying off screen reads as a
question that was never answered.

### B1-2 · the first-run overlay

`localStorage`, one key `h121.proto.b1intro.seen`, and **it fails open** — private
mode, cleared storage and a browser that throws on access all land in the same
place: the overlay shows. Showing an instruction twice is a small cost;
swallowing it once is the whole feature.

`?intro=on` / `?intro=off` overrides the flag **without writing it**, which is the
only way to look twice at something that by definition happens once.

Order is B1-2 **then** B2-4: on a first run the overlay comes up over the dealt
card and the sticker's timer does not start until it is dismissed, so the two
instructions are never on screen together. On every later round the sticker slaps
on its own — verified with `?intro=off` at all three widths in both engines.

Copy: heading `אמת או שקר?` — deliberately the same string the claim sticker
carries, one question asked once big and then kept small on the card. Body is
`[שלוש שורות — תמר]`, a striped placeholder that hides under the default
`no-ph`; the layout holds without it.

### B3-3 · one modal, two contents

`stickerModal({title, meta, body, art})`. `lawModal()` and `glossModal(term)` are
both three-line callers. Three ways out — the ✕, the ground, Escape.

The ✕ is **physically top-right**, not `inset-inline-end`: under `dir=rtl` that
resolves to the left, which would put the modal's close on the opposite side of
the screen from the ✕ the player just pressed to get here.

Centring costs what the v17 board said it costs: the tachles question is covered
while the modal is open. That is a detour the player asked for, it dismisses
three ways, and the question is intact underneath the instant it closes.

---

## 3 · Fixes

### 3.1 Glossary → B3-3
`.gdef` is gone. Tapping an underlined term opened a plain white panel *under the
term, inside the paragraph*, so the sentence being read reflowed around it as it
opened and again as it shut. It now calls `glossModal()` — the same component, no
second modal.

Note: the **beat-5 glossary chips** (`.b5chip` / `.b5def`) are a different
surface — chips in the finale, not underlined terms in running text — and I left
them alone. Say if you want them on the sticker too.

### 3.2 Tachles

* **Line-height: `normal` (1.32) → `1.08`.** It had no `line-height` at all, so
  it ran at the UA default, which for SimplerPro 900 resolves to 1.32 — at
  22–29px that is 8px of air between two lines of one question. Measured after:
  31.29px on 28.97px = **1.080**. Added `text-wrap:balance` so the tighter
  leading does not leave a one-word last line.
* **Law-name line was grey by accident, not by choice.** `.b2bill` sets
  `#D8D2C4`; `.b2bill--link` — later in the file, same specificity — then
  overwrote it with `color:inherit`, which resolved to the pane's muted body
  colour. It now sets **`rgba(255,255,255,.78)`** outright. Underline and tap
  target unchanged; tap padding went 0 → 2px vertical.
* **`את התוצאה נגלה בסוף ›` removed** from the markup. Class rule kept as a
  tombstone so the next person searching for `.b2consent` finds where it went.

### 3.3 Exit modal

* Confirmation line in black above the buttons: `בטוח/ה שאת/ה רוצה לצאת?`
  `/* TAMAR */`, 19px display weight.
* Consequence beneath it, quieter: `ההתקדמות בסוגיה לא תישמר` `/* TAMAR */`.
  These were one string doing both jobs, which made the thing being agreed to
  read as part of the thing being asked.
* ✕ top-right of the modal, dismisses and stays in the round. Physically right,
  same reasoning as B3-3.
* Tap-outside still dismisses. Escape too. **Three ways to stay, one to leave** —
  every ambiguous gesture resolves toward not losing the round.
* Centred H and V per B5-1, in the same die-cut sticker `.stmodal` uses, tilted
  1.2° the other way so the two are not the same object twice.

---

## Decisions I had to make without you

1. **1.1 — I took none of the three options as written.** Dropping the mask is
   the structural end of option 2; options 1 and 3 are argued against above with
   the reason each fails. Say if you want the masked version back.
2. **`.r-b` is invisible on paper.** `hachach.css` draws the ghost button as
   cream type in a cream outline — correct on the charcoal stage, invisible on a
   cream sticker, so `להישאר` disappeared entirely and the modal read as having
   one action. Re-inked **scoped to `.exitsheet`** in `proto.css`; `hachach.css`
   is the locked handoff sheet and I did not touch it. **The same trap is waiting
   for any future `.r-b` on a light surface — worth telling Roman.**
3. **The exit copy renders as plain Hebrew, not as a striped placeholder.**
   `ph()` is for copy that has not been *written* — a bracketed description of
   what should go there. These are real sentences we wrote and Tamar has to
   approve, which is what the `/* TAMAR */` code markers are for. Struck through
   `ph()` they rendered at `--fs-meta` on a yellow hazard stripe, which is
   neither the 19px black question 3.3 asked for nor legible on cream.
4. **`לצאת` is still the yellow primary in the exit modal**, as the B5-1 frame
   drew it. A filled `--primary` on the destructive action of a destructive
   confirm is arguably the wrong emphasis, but it is what you picked and you did
   not ask for it to change. One word from you and I swap the weights.
5. **Beat-5 glossary chips left on their own treatment** — see 3.1.

## Still open from earlier passes

* Part B of the v17 brief beyond the seven options above — nothing else was
  picked.
* The `app.js` items for Roman, unchanged: bonus lines `:546` `:258`; the four
  self-tests that now fail against the new issue set `:942 :944 :946 :947`;
  `emoji` rendering the literal `undefined` at `:403` `:410` for the five new
  issues.
* A2's WhatsApp in-app browser verification — still needs a device.

---

## 4 · v18 board — the claim reveal

`explorations/v18/index.html`, same conventions as v17: 360×640 RTL frames on the
prototype's ground, components from the locked `hachach.css`, annotations forced
LTR, striped yellow for unwritten copy. **Five numbered options, nothing
implemented.**

Every frame carries the true answer, a **separate** correctness mark, the coin
chip, the issue title, the explanation with a live glossary term, and a CTA with
a chevron. Every frame draws the **hard state** — the claim is false and the
player answered true — because that is the case where the two marks disagree and
can be misread for each other.

| | card behind | stamp | correctness lives | coin | CTA |
|---|---|---|---|---|---|
| **V18-1** | full size, undimmed | on the card | chyron slot, above | no flight | small, bottom, on the sheet |
| **V18-2** | 30%, faded | over the whole screen | ribbon under the stamp | flies from the ribbon | medium, bottom |
| **V18-3** | gone, claim restated | token in the top strip | its own band at the foot | flies from that band | full width, bottom |
| **V18-4** | *is* the reveal — it turns over | on the card face | corner sticker, breaking the edge | flies from the sticker | under the card |
| **V18-5** | fully lit, uncovered | 46px token in the strip | in the strip, twice | no flight | type + chevron only |

Two notes that apply whichever you pick, both in the board:

* the correctness word is unwritten in all five and every frame stripes it —
  צדקת / הופתעת are placeholders and the pair has to come from Tamar **together**,
  because they are read as a pair.
* **the stamp goes achromatic in all five.** Today `stamp(ok, override)` colours
  the disc by correctness *and* letters it with the true answer, so one mark does
  both jobs — which is the defect. Splitting them is the fix in every option, so
  it is not a tie-breaker between them.

Frame screenshots: `explorations/v18/shots/board-v18-{1..5}.png`.
Round screenshots for Parts 2–3: `explorations/v18/shots/r-*.png`.
