# v20 session report

Branch `flow-proto`. Nothing staged, nothing committed. **`app.js`, `data.js` and the shipped
`index.html` are untouched** — Part 0 is specified for Roman below, not implemented in his file.

Verified in Chromium 131 and WebKit 18.2 at 360×640, 393×852 and 430×932: **zero console errors**
on the intro, the map and a full round including the law modal and a cascade card.

**One note on order.** The header says "Part 4 (board, then stop)" but Part 5 follows it and the
Report section asks for 5.1 and 5.3 deliverables. I read "stop" as "do not build the finale
options" and did all of Parts 0–5, with Part 4 left as a board. Say if that was wrong.

---

## Part 0 · Coin awards

Implemented in `proto.js` — `COIN_TABLES.sheet` and three call sites.

| event | old | new | where it fires |
|---|---|---|---|
| finishing a round | — | **+50** | `beat5()`, right after `PROGRESS[issue.id] = true` |
| claim correct | +25 | +25 | `claimReveal()`, on the stamp |
| own vote (tachles) | 0 | **+25** | `beat2()`, on the chosen chip |
| each MK correct | +25 | +25 | `verdict()`, on the stamp |
| topic complete | +100 | +100 | `beat5()` — **see the defect below** |

**The tachles award is flat and unconditional.** `award(table.position, btn)` — `btn.dataset.vote`
is not read, so there is no branch on which position was taken and no way for one to grow. No
verdict colour, no tick, no comparison anywhere near it. Nothing advertises a value before a
choice: there is no `+25` on the vote chips or the claim card anywhere in the file.

**A defect found while wiring this: `topic: 100` was in the table and had never been paid.**
Nothing read `table.topic` anywhere in `proto.js` — the row was declared and no call site was
ever written, so completing a topic has been silently worth nothing. Now paid, staggered
`T.coinFly + 2·T.coinStagger` after the round award so the two flights don't blur into one.

### Ceilings and the ratio

Per-round maximum = 50 + 25 + 25 + 25 × (cards dealt).

| | per-round range | **ratio** | full game (11 issues + 6 topics) |
|---|---|---|---|
| old, `?cards=5` default | 25 – 150 | **6.00 : 1** | 1,025 (+600 topic that never paid = 1,625 nominal) |
| **new, `?cards=5`** | **100 – 225** | **2.25 : 1** | **2,450** |
| old, uncapped | 25 – 250 | **10.00 : 1** | 1,250 real / 1,850 nominal |
| **new, uncapped** | **100 – 325** | **3.25 : 1** | **2,675** |

Your 10:1 is the uncapped figure and it is right; the shipped default `?cards=5` already caps
r1 at 5 of its 9 MKs, which is why the observed spread is 6:1. Either way the new table more than
halves it.

Verified live: `r1` (religion, a one-issue topic) pays `[25 vote, 25×3 correct MKs, 50 round,
100 topic] = 200`. `e3` (no cascade at all) pays `[25 claim, 25 vote, 50 round] = 100` — the
round award reaches the cascade-less rounds, which is the whole point.

### Spec for Roman — `app.js`

`app.js` does not have this table. It has **one constant used for everything**:

- **`app.js:94`** — `const COINS_PER_STEP = 25;` with the comment
  `// TF + bill + drag = 3 steps => 75 coins/issue; 16 issues => 1200 total`
- **`app.js:495`** — `function awardCoins(){ issueCoinsEarned += COINS_PER_STEP; totalCoins += COINS_PER_STEP; … }`
- called at **`:480`** (TF step, `stepsAwarded.has(0)`), **`:494`** (`pickBill`, step 2),
  **`:845`** (the drag step)
- **`:690`** — `const gained = correct * COINS_PER_STEP;` the per-MK award
- **`:448`** and **`:848`** render the literal `'🪙 +'+COINS_PER_STEP+' מטבעות'` **before/at the
  moment of the choice** — these are the "price tag before a decision" the brief forbids and both
  need removing or moving after the fact
- there is **no topic-completion award in `app.js` at all** — `grep` for a 100 award finds nothing

Suggested change: replace the single constant with the five-row table, split `awardCoins()` into
`awardCoins(n)`, and add the round and topic awards. The behavioural deltas from today are:
**+50 on reaching the reveal**, **+25 for the bill vote made unconditional and never scored**,
**+100 on topic completion (new)**, and **the two `+25` labels at `:448`/`:848` removed**.

---

## Part 1 · Claim reveal

### 1.1 The sequence, and what the swipe handler had to become

The order is now commit → 400ms beat (`--t-claim-beat`) → stamp lands on the card → panel rises →
`הלאה ›` throws the card and starts beat 2.

**What changed in `wireSwipe`/`commitClaim`:**

1. **The throw moved out of `commitClaim` and into the `הלאה` handler.** The exit is the same
   class, the same distance, the same easing; it just fires four steps later. Direction is still
   the drag's own — `card._swipe.dirFor(S.claim)` — so a player who swiped right sees it leave
   right.
2. **The drag readout has to be cleared explicitly now, and this was a real bug.** A *tap* calls
   `show(dir * 999)` to run the same preview the gesture does, and nothing ever cleared it because
   the card left a moment later. With the card staying, the leading-edge wash and the preview pill
   sat on it through the whole reveal — the first build put a solid black `אמת` box on the card's
   corner. `card._swipe.clear()` now runs on every commit path.
3. **The card is snapped back to square before the stamp lands.** A drag leaves an inline
   transform, and a stamp landing on a card still tilted 4° reads as landing on a card that is
   falling over. Reuses `is-snapping`, the same class the below-threshold snap-back uses.
4. **`.mf-b.is-stamped` had to be cleared before the exit.** `hachach.css` runs `d2-jolt` with
   `fill:both`, which *holds* `transform:translateY(0)` forever — and a filled animation beats an
   inline style, so the card would not move on `הלאה`.

**Does the drag-direction feedback still make sense?** Yes, and it is unchanged: the wash and the
preview pill say *which answer this direction chooses*, not *the card is about to leave*. That
reading was always the honest one — the wash is on the card's leading edge and names an answer.
What changed is only that committing no longer looks like discarding. If anything it is now more
coherent: the throw gesture appears exactly once per card, at dismissal.

### 1.2 V18-1, built

Stamp on the card overlapping its leading edge by 22px (`.cardwrap` does not clip); card stays
readable; HUD, coins and issue title never leave because nothing covers them any more; the
correctness chip is a **separate object in the chyron slot**, a different plane from the stamp.

**The stamp is achromatic** — `.d2--neutral` mixes `--paper` instead of a verdict hue and letters
in `--ink`. The first attempt used a 26% black wash with black lettering and `שקר` disappeared
against the dark artwork; paper-at-88% with ink type is now the highest-contrast thing on the
card while carrying no hue. The cascade's stamp is untouched: there the word *is* the verdict, so
colouring it is correct.

**The panel scrolls, and it had to.** `e3` is 280 characters. The panel's max-height is
**measured, not a percentage**: `wrap.bottom − claim.bottom − 10px`, floored at 170px, so it can
never cover the claim it is explaining — which was V18-1's own recorded risk. Verified:

| | claim ends | panel starts | clearance | scrolls |
|---|---|---|---|---|
| s1 @393 | 461 | 562 | **+101** | no |
| e3 @393 | 523 | 533 | **+10** | **yes** |
| s1 @360 | 362 | 435 | +74 | no |
| e3 @360 | 407 | 417 | +10 | yes |

### 1.3 The claim graphic

Two bugs fixed on the way: the art `<img>` was rendering at its natural 900×539 (my `height:auto`
threw away the HTML width/height attributes), and `flex:1` on the art box pushed the claim back
under the panel.

**What actually grew, and what could not:**

- **The topic fallback — 128 → 190 CSS px.** This is the graphic on **14 of 16 issues**. The card
  is 308px wide inside its padding and 128 was using 42% of it. Source moves 384 → **576** to hold
  DPR 3.03 (+30KB on the one icon a claim card loads).
- **`s1`/`s2` real issue art could not grow.** It is declared 300×180 in a 308px-wide card — it is
  already at 97% of the available width. The room on that card is *vertical* and the artwork is
  landscape; growing it needs a taller crop, and the master's ink box is 1747×1047, the same
  aspect. Not a build problem.
- **The claim text sets its own size** — 29px / 24px / 20px by string length, because the active
  set runs 49 characters (`s1`) to 190 (`e3`). At one size e3 is eight lines and overflows the
  card. The graphic yields to the text, as briefed.

### 1.4 The overlay copy

Added under `אמת או שקר?`, `esc()` not `ph()` because it is a written sentence rather than a
description of one:

> נציג לכם טענה על הכנסת. תחליטו אם היא נכונה או לא — ואז נגלה מה באמת קרה. `/* TAMAR */`

Two lines at 393px, three at 360. It does not read as a test: "נגלה מה באמת קרה" puts the reveal
on the game rather than on the player — nothing is marked, something is shown.

---

## Part 2 · Chyron

Light fill `rgba(251,247,238,.72)` with the blur kept, type and avatar re-inked to `--ink`, and a
neon stroke.

### Contrast

| ground | composited band | **ink text** | neon stroke vs ground |
|---|---|---|---|
| round chrome `#403E3A` | `#C7C3BC` | **10.60 : 1** | 5.34 : 1 |
| stage ground `#2B2926` | `#C1BDB6` | **9.95 : 1** | 7.25 : 1 |
| map gradient, warm mid | `#ECCAB7` | **12.14 : 1** | 2.23 : 1 |
| map gradient, light end | `#F6DFBC` | **14.36 : 1** | 1.08 : 1 |

Everything is past AAA (7:1). For reference the old dark band was 11.15:1 — so contrast is
maintained, not traded.

**The re-ink goes light-fill/dark-type rather than the reverse** precisely because of the last two
rows: light type on a low-alpha film only works while the ground stays dark, and §3.2 puts a warm
gradient behind the map.

**The chyron is never visible on the map** — I checked rather than assumed: `#chyron` is inside
`<section class="screen sc-round">`, which `showScreen()` sets `hidden` on the map;
`getClientRects().length === 0` there. So the 1.08–2.23:1 rows are moot today. If it ever becomes
visible on the map the hue has to change — that is the one thing to watch.

### The hue, and why every other candidate is spoken for

`#37C4FF`. Not a new brand colour — it is already in the system twice, as the glossary accent
(`.gt`'s dotted underline) and as `internal_sec`'s topic hue.

- **lime `#B6E521` / magenta `#FF3BC0`** are the verdict pair. A verdict hue on the player's own
  vote banner says their vote was graded — the exact thing Part 0 forbids near the tachles award.
- **yellow `#FFD60A`** is P-C, "the only yellow in the system", and §3.2 turns the map ground warm
  yellow/red: it would compete with the primary button and vanish on the map.
- **the six live topic hues** name a topic, and this band is the player's.

**Residual risk, stated plainly:** `#37C4FF` *is* `internal_sec`'s hue in `data.js`. That topic has
no active issue so its node never draws, and §3.2 takes topic hues off the nodes anyway — the
association is theoretical rather than visible. But it is the one objection to the choice.

The glow is one 2px stroke plus spreads at 55% and 22% — lit, not bloomed. No animation, so it
never competes with §3.3's pulse, which is the one thing on screen allowed to move.

---

## Part 3 · Cascade gap and map

### 3.1 The gap palette, and the symmetry check

One hue at three strengths — `--verdict-surprise`, already the system's "you were surprised"
colour, so a wide gap says the same word the stamp does rather than adding a fourth verdict hue.

| distance | class | fill |
|---|---|---|
| exact match | `gx--d0` | no fill is ever drawn (nowhere to travel); the **track** takes a lime tint, `color-mix(--verdict-correct 22%)` — neutral/positive, no alarm |
| one step | `gx--d1` | `--verdict-surprise` at **30%** |
| two steps | `gx--d2` | `--verdict-surprise` at **62%** |

**Symmetry is structural, not maintained.** `runAxis` already computed
`dist = Math.abs(VOTES.indexOf(vote) − VOTES.indexOf(guess))` and the class is `'gx--d' + dist`.
There is no code path that reads direction. All nine pairs:

| | actual בעד | actual נמנע | actual נגד |
|---|---|---|---|
| **guessed בעד** | d0 | d1 | **d2** |
| **guessed נמנע** | d1 | d0 | d1 |
| **guessed נגד** | **d2** | d1 | d0 |

Confirmed in the browser: guessed בעד / MK voted נגד → `gx--d2`, fill `rgba(255,59,192,.62)`;
guessed נגד / MK voted בעד → the same class and the same fill. Screenshots `gap-*.png`.

### 3.2 Map restyle — and yes, the node states survive

Gradient `radial-gradient(120% 80% at 50% 108%, #F2B33C → #E4732B → #C4402E → #8E2A2E)` on
`.stage[data-screen="map"]`, so it covers the whole viewport rather than just the scroll box. The
dot grid is `.stage::before` at `inset:0` above it and is untouched — the same 4px/7px two-layer
grid the round stands on now runs across the gradient.

**All six nodes take one ink `#2E2A26` with base `#171412`.** The states had to move from hue to
value, and that is the substantive change:

| state | before | now |
|---|---|---|
| untouched | topic hue disc, grey ring | dark disc, **both arcs dark** `rgba(24,20,16,.42)`, `0/2 סוגיות` |
| in progress | topic hue disc, hue arc | **one cream arc, one dark**, `1/2 סוגיות` |
| complete | topic hue disc, two hue arcs | **all arcs cream**, ✓ badge, `✓ הושלם` |
| next-up | yellow ring halo | white keyline + **pulse** (§3.3) |

**They read.** The ring is now a *value* contrast — cream against dark — which survives a ground
that runs from `#F2B33C` to `#8E2A2E`; a hue-coded ring would have had to fight a different
background colour at every node. Each state also still carries a non-colour signal: the number of
filled arcs, the ✓ badge, and the status line in words. See `map-states.png`, which forces one node
of each state into a single frame.

The ribbon was re-toned (`#3A2119` / `#7A5B49`) — the old charcoal-mixed greys read as a dead grey
road on the warm ground.

Per-topic hues stay in `data.js` untouched and are still written onto each node as `--tc`; nothing
reads them. Presentation only, as briefed.

### 3.3 Next-up pulse

A soft radial disc *behind* the node — `.node.is-current .ringnode::before` — breathing between
scale 0.94 and 1.16 over **3400ms**. It never touches the node's own geometry, so a pulsing node
and a still one are the same size and shape; nothing about it says "you must play this one".

`prefers-reduced-motion` sets `animation:none` and holds it at scale 1.05 / opacity 0.8 —
explicitly, not via the file's global 1ms cap, which on an infinite alternate loop would strobe.
Verified in both states.

### 3.4 The religion ring — not a bug, and not what it looked like

**It is not the completed state drawing a full ring.** `ringGeom(n)` divides the circle `n` ways
and gives every arc the board's 27.2° gap. So:

| topic | arcs | each | total gap |
|---|---|---|---|
| religion (1 active issue) | **1** | 332.8° | 27.2° |
| every other topic (2) | **2** | 152.8° | 54.4° |

A one-issue topic therefore draws a ring with **a single 27.2° break**, which at node size reads as
continuous. The completed state is identical in both cases — same stroke, same cream, same ✓.

**So your instinct is half right:** the segmentation is working exactly as designed, but the
consequence is that "complete" has no single visual signature — a 1-issue topic completes to a
near-solid ring and a 2-issue topic to two arcs. The ✓ badge and `✓ הושלם` are what actually say
"complete", and those *are* identical. If you want one signature, the fix is to widen the single
gap on a 1-segment ring (say 60°) so it reads as a track rather than a circle. **One line, not
done — it's a design call, not a defect.**

---

## Part 4 · v20 board — the finale

`explorations/v20/index.html`. **Four options, nine frames**, because every option is drawn twice:
with a tally and without.

**Degradation is drawn.** 7 of 11 active issues have no `_tally` (e3, e4, b3, g1, g3, a2, m3) and
5 have no cascade (e3, e4, b3, g3, m3). What all 11 do have is `vote_result` — Tamar's prose,
which on those 7 is the only account of the outcome that exists.

| | board | explanation | count-up | buttons |
|---|---|---|---|---|
| **V20-1** | the upper half, 62px numerals | below, compressed | full size, always on screen | side by side |
| **V20-2** | a 76px strip | equal weight, most room | 34px — a readout | stacked, secondary demoted to a link |
| **V20-3** | full screen, then shrinks to 62px | full room in state B | owns the screen for ~1.8s | as V20-2 |
| **V20-4** | a **121-seat grid**, the player's seat lit last | below | the grid climbs, numerals follow | as V20-2 |

**The buttons.** Three of the four use one pair — full-width primary, secondary demoted to a
centred underlined link. That is the fix: the shipped pair is a primary and an outlined `.r-b` of
equal width, which reads as two choices of equal weight when one of them is just the way out.
V20-1 draws the side-by-side alternative so the pair can be judged. The single-button case (topic
with no second issue) is drawn on V20-2's e4 frame.

**Nothing reproduces the Knesset's board** — no emblem, menorah, colonnade or seat plan. What is
drawn is the generic idea of a plenum display: two counters, a bar, an outcome line.

**The real decision is the missing tallies**, and it is a content decision. If those 7 issues can
gain a `_tally` in `data.js`, all four options get much stronger. If they cannot, V20-2 is the only
one whose degraded state is not a compromise. V20-2's e4 frame shows a bar drawn from the digits in
Tamar's prose — flagged as fragile in the frame's own risk note; the honest route is a `_tally`.

---

## Part 5

### 5.1 The sky cut — clean, and here is why

The sky is flat near-white: `#FEFEFE`, per-channel std under 1 across the top 120 rows. But **a
global colour key destroys the flags** — they are cream with blue stripes and a blue star, and
keying every white pixel takes the flag bodies with the sky.

So it is a **border flood fill**: white connected to the canvas edge is sky, white enclosed by
artwork is not. Each flag has a closed dark outline, so the bodies survive.

**That alone was not enough, and this is the part worth knowing.** Between the flags there are
pockets of sky fully enclosed by flag + pole + flag, which connectivity cannot tell from intended
white; left in they render as cream blobs in the gaps. They *are* separable, by colour:

| | mean distance-from-white | mean RGB |
|---|---|---|
| enclosed **sky** pockets | **4.0 – 10.6** | `#FCFDFB`, neutral |
| flag **cream** | **23.0 – 29.3** | `#FDF6E7`, warm |

A factor of two with nothing in between. **63 enclosed sky pockets closed** on that rule.

**No fringe.** A binary mask leaves every anti-aliased pixel as a half-white blend, which on
charcoal is exactly the white edge you said to stop for. Instead alpha ramps over a 6–34 band and
the colour is un-premultiplied — `(observed − (1−a)·white) / a`, the correct inverse of compositing
over a white matte. 41,759 soft-edge pixels, 39.5% of the image removed.

**Crops, 1:1 device pixels, no resampling:**
`sky-before-flags.png` / `sky-after-flags.png` — the flag row at the size the intro actually draws
it (469×158 device px at 393×852 DPR 3), and `sky-*-flags-1to1.png` at source resolution.

**Verdict: the cut is clean.** Poles intact, flag bodies intact, stars and stripes intact, no
fringe on the charcoal, no cream blobs. I would ship it. If you disagree with any edge in those
crops, Scenario is still the fallback and nothing is lost — `knessetbuilding.webp` is untouched and
the cut is a derived master, `knessetbuilding_cut.webp`.

The building was **not** upscaled or re-encoded an extra generation: the cut comes off the original
2496×1664 master and the 1170/390 exports come off the cut, the same one generation as before.
Aspect is preserved — cutting trimmed 26 transparent rows, so the exports are now 1170×768 rather
than a squashed 1170×780.

**The grey band behind the tagline is `.i-stage::after` and it is load-bearing.** It is a
legibility scrim: `linear-gradient(to top, rgba(43,41,38,.82), … , transparent)` over the bottom
46%, added because on a 667px phone the paragraph and the CTA come down onto the flags and the road
stripes and light type on that is unreadable. With the sky gone it does less work than it did —
most of that type now sits on the app ground — but the building's lower half (road stripes,
coloured columns) is still behind the CTA, so it is still doing something. Removable if you want,
but check a 667px viewport first.

### 5.2 Multi-colour title, behind `?title=multi`

Nine glyphs, six live topic hues, deliberately non-spectral order —
`economy → branches → religion → accountability → military → gender`, so adjacent glyphs are far
apart in hue and the run never sweeps. `environment` and `internal_sec` are excluded: they are the
two topics with no active issue, so their hues appear nowhere else.

The index runs across **both rows** — `lsRow(t1, 0)` then `lsRow(t2, 4)` — because a per-row
counter would restart the palette and put the same colour under the two ה glyphs that sit directly
above each other.

**Judgement, since you asked for one: it reads as a sticker sheet, not as jumble, at 360px.** What
holds it together is that only the *stroke* is coloured — every glyph keeps the same `--ink` fill,
so the wordmark still reads as one word. `title-multi-360.png` vs `title-solid-360.png`.

One weakness: the military olive `#8a9663` on the ה of ה-121 is the muddiest of the nine against
charcoal and reads as the weak one. Swapping that glyph to a stronger hue is one array entry.

### 5.3 The map's viewport inset — the actual cause

**It is not the `styles/base.css` `--vh` bug.** That bug is real — `base.css:25` sets `.app`'s
height three times and the last declaration is the `--vh` one, so `100dvh` never applies — but it
is the shipped app's file and a different screen. `proto.css` has the opposite order: the `--vh`
declaration first, then `@supports (height:100dvh){ .stage{ height:100dvh } }`, so dvh wins. The
stage measures 0→852 at 393×852. Full height, no gap.

**The actual cause is two separate insets, both in `proto.css`:**

1. **`.stage` carries `padding: 10px+safe-top / 16px / 12px+safe-bottom / 16px`, and `.mapwin`
   cancelled only the horizontal half** — `margin:0 -16px`, nothing vertically. So the map's scroll
   surface has always stopped **10px below the viewport top and 12px above the bottom**.
   *It was invisible because the two grounds matched*: the map had no ground of its own and what
   showed in those strips was `.stage`'s charcoal, the same charcoal the map was drawn on. What
   made it visible was the ribbon — the road ran to `.mapwin`'s edge and stopped short of the
   screen, which is what reads as "the map is sitting in a box". Part 3.2's gradient would have
   made it obvious a second way.
2. **`.stage{ max-width:390px }`** — a desktop preview frame that also applied on real phones, so a
   430px device ran the app at 390 with 20px of body grey down each side. Same symptom, other axis,
   and it affected every screen.

**Fixes:** `.mapwin` now bleeds vertically by the same amounts it already bled horizontally, and
the max-width cap is lifted under `@media (max-width:480px)` and kept above it. Measured after:

| | gap above | below | left | right |
|---|---|---|---|---|
| 360×640 | 0 | 0 | 0 | 0 |
| 393×852 | 0 | 0 | 0 | 0 |
| 430×932 | 0 | 0 | 0 | 0 |

The HUD and the jump button keep their own inset — only the surface bleeds.

**Not verified in the WhatsApp in-app browser.** That needs a device and is still the one
outstanding check, as it was last pass.

### 5.3b Ribbon stubs removed

`drawPath()` draws from node 1 to node N and no further. The `BLEED = 24` lead-in and lead-out are
gone. This reverses §1.5 of the previous brief, which is correct: the surface reaches the edges,
the ribbon does not.

### 5.4 Hint stickers inverted

`#2E2A26` fill with `#F4F1E8` type — the same neutral ink the map nodes use, no hue that could
code correctness. Contrast **12.60:1**. It no longer resembles the `.v-a` vote buttons below it
(cream with ink, 17.41:1), which was the problem. The white die-cut border, the keyline, the
extrusion and the slap angle are unchanged, so it still reads as applied to the card. Type went
16 → 16.5px to hold at 360px against the darker fill.

---

## Decisions I made without you

1. **Part 5 built rather than stopped at Part 4** — the header and the Report section disagree; I
   followed the Report section.
2. **`#37C4FF` for the neon** despite it being `internal_sec`'s topic hue — every other palette
   candidate is a verdict, the CTA, or a live topic. Reasoning in Part 2.
3. **Magenta at two strengths for the gap**, rather than introducing an amber mid-tone, so the
   scale cannot read as three different kinds of thing.
4. **`#2E2A26` for the shared node colour** — dark rather than cream, so the coloured stickers pop
   and the ring's cream/dark value contrast survives the whole gradient.
5. **The religion ring left as it is** — explained rather than changed, since it is a design call.
6. **`s1`'s claim art not enlarged** — it is already at 97% of the card's width.
7. **`הצבעת:` in the chyron switched from `ph()` to `esc()`** — on the new light band the yellow
   hazard stripe was the loudest thing in the row, and it is written Hebrew, not a description of
   unwritten copy. Same call I made on the exit modal last pass.

---
---

# Addendum — the finale built, v20 option 4 (seat grid)

Branch `flow-proto`. Nothing staged, nothing committed. `app.js`, `data.js` and `styles.css`
untouched. Verified in Chromium 131 and WebKit 18.2 at 360×640, 393×852 and 430×932 — **zero
console errors**, including all five cascade-less issues in both engines.

---

## 0 · The green/red problem, and the two replacements

You are right that this is not a styling nit. Every one of my four v20 frames used lime for בעד
and coral for נגד, which codes vote direction with the culturally loaded approval pair — the
finale was quietly saying that voting *for* a bill is the right answer.

### What ships

| | hue | |
|---|---|---|
| **בעד** | **`#4E6BFF`** | `branches` `#2b4cff` from `data.js`, lightened |
| **נגד** | **`#E8DCC0`** | the warm neutral of the `--paper` / `--kraft` family |
| not in the record | `#34302A` | |
| the player's seat | `--primary` `#FFD60A` | **and it is coded by shape, not hue — see below** |

### Why every other candidate is ruled out

The correctness palette is exactly two hues — `--verdict-correct` lime `#B6E521` and
`--verdict-surprise` magenta `#FF3BC0` — carrying the claim chip, the cascade stamp and the
cascade gap. I measured every palette hue against both (ΔE2000; under ~25 is confusable):

| hue | vs lime | vs magenta | verdict |
|---|---|---|---|
| religion `#ffd23f` | **20.2** | 69.9 | too close to lime |
| `--primary` `#FFD60A` | **18.9** | 74.2 | too close to lime |
| gender `#ff6b9d` | 74.4 | **11.9** | too close to magenta |
| accountability `#b06bff` | 88.0 | **18.4** | too close to magenta |
| environment `#22c98e` | **24.8** | 87.0 | too close to lime — and it is green |
| military `#8a9663` | **24.9** | 60.8 | too close to lime |
| economy `#ff5240` | 65.1 | 30.8 | clear — but it is **red**, the valence being removed |
| internal_sec `#37c4ff` | 58.8 | 62.2 | clear, no valence — but it is **the chyron's neon**, and I checked: the chyron *is* on screen at beat 5 |
| **branches `#2b4cff`** | **94.1** | **32.9** | **clear on every count** |
| **paper/kraft warm** | 24–28 vs lime, 43–48 vs magenta | | see the note below |

Lightening branches to `#4E6BFF` raises its contrast on the board from 3.16 to **4.30:1**, past
WCAG 1.4.11's 3:1 for graphical objects at a 17px block.

**On the warm neutral being ΔE 24–28 from lime, which is under my own bar:** ΔE is the wrong test
for that pair. Lime is a saturated yellow-green; `#E8DCC0` is a desaturated near-white that is the
system's own paper tone, used for chips, sheets, vote buttons and the map's filled ring segments —
**it signals correctness nowhere in the app**, so it cannot be mistaken for a verdict by usage.
The >30 bar was written for two saturated hues sitting adjacent in a grid, which is the בעד/נגד
relationship, not this one.

**One useful finding while checking adjacency:** at beat 5 there is **no lime and no magenta on
screen at all** — the claim chip is removed when the claim card leaves, the cascade stamp and the
axis strip ride off with their cards. I verified this by scanning every computed style on the beat.
Cyan is the only one of the three that survives to this beat, which is exactly why it is excluded.

### The colourblind check

The pair is separated on **relative luminance — 0.194 against 0.721** — which is the one channel no
form of colour blindness touches. So the check does not depend on hue discrimination at all:

| | normal | deuteranopia | protanopia | tritanopia |
|---|---|---|---|---|
| **בעד vs נגד**, ΔE2000 | **53.0** | **58.3** | **56.3** | **43.2** |
| בעד vs not-in-record | 44.9 | 46.1 | 46.4 | 38.6 |
| נגד vs not-in-record | 71.4 | 71.6 | 71.4 | 71.2 |

Simulated with Viénot–Brettel–Mollon (1999) in LMS. Under deuteranopia the two read `#6262FF` and
`#E0E0BF`; under protanopia `#6666FF` and `#DEDEBF` — a saturated blue against a pale warm grey in
both cases. All figures are far above the ~25 needed for two squares sitting adjacent in a grid.

### Why the player's seat is coded by shape

`--primary` yellow is ΔE **21.6** from the נגד ecru (10.3 under tritanopia) — too close for two
squares in one grid. Every other candidate is a verdict hue, a side hue, or the chyron's cyan.
So the player's seat carries **three non-colour signals** instead: it is the only **round** block,
the only one with a **keyline**, and it is **set apart on its own row** below the 120. Form does
the work hue cannot, and the yellow is then free to mean "you", as it does everywhere else.

**Neither side hue carries valence, and the assignment is arbitrary** — swapping `--seat-for` and
`--seat-ag` is one line and nothing else changes.

---

## 1 · The build

**Not a seating chart.** 15 × 8 abstract blocks, an arbitrary rectangle, no grouping by party, no
hemicycle. The order carries no meaning beyond "how many" — we cannot source a true layout and
anything implying one would be a claim we can't stand behind.

**The remainder is honest.** `for + against` does not reach 120 on three of the four issues that
have a tally — `a1` is 53 + 48 = 101 — so 19 blocks stay dark. Verified rendering 53/48/19.
`m2` renders 68/9/43. Nothing invents an abstention or an absence it wasn't given.

**Count-up:** one clock drives the seats and the numerals, so they cannot disagree — the numeral
is a readout of the grid rather than a second animation. `--t-finale` **850ms** with the same cubic
ease-out `countUp()` used, which is the round's existing held-beat weight. Measured: **36 distinct
fill steps over 691ms**. Under `prefers-reduced-motion` it paints the final state and returns —
**1 step, 0ms** — rather than running a shortened animation, because a 1ms fill of 120 blocks is a
flash.

**The numerals are secondary:** 26px under the grid, where the old count-up was 66px and was the
headline.

**Buttons verified.** `r1` (religion — the one-issue topic) renders the single primary
`חזרה למפה ›`. `e3`, `e4`, `b3`, `g3`, `m3`, `a1` all render
`לסוגיה הבאה ›` + secondary `חזרה למפה`.

### Block size

| viewport | block, rendered | unscaled | `fitBeat` scale |
|---|---|---|---|
| 430×932 | **22.14px** | 22.14 | 1.00 |
| 393×852 | **17.99px** | 19.67 | 0.914 |
| 360×640, degraded state | **14.92px** | 17.47 | 0.854 |
| **360×640, worst case (`r1`)** | **11.33px** | 17.47 | 0.649 |

The grid's intrinsic size is fine everywhere — 17.5px at 360. What costs it is `fitBeat()`, which
scales the **whole beat** when the content exceeds the viewport, and `r1` at 640px of height is the
worst case in the set: tally + 121st line + shape line + 3 links + two buttons. I recovered ~12px
by making `.b5{padding-top}` fluid, which is why the r1 figure moved 10.76 → 11.33.

**Is 11.33px muddy? No — it is small but crisp.** At DPR 3 that is a 34-device-pixel solid block
with a 9px gap; `seat-r1-360.png` shows all 120 individually countable and the 63/57 split
immediately readable. I would not call it muddy, and I have not "shipped something muddy" — but it
is the one figure worth your eye, so here are the fallbacks rather than a silent choice:

1. **Let beat 5 scroll at short viewports instead of scaling.** Keeps the block at its natural
   17.5px. The app's "only the map scrolls" rule exists so the round never pans mid-gesture, and
   beat 5 is terminal — there is no gesture left. **This is the one I'd pick.**
2. **Change the grid shape at short viewports.** I computed every factor of 120: 12×10 gives
   12.31px, 10×12 gives 13.22, 8×15 gives 13.75. All are worse *pictures* (a tall narrow column
   stops reading as a chamber) for 1–2.5px, and going wider is actively worse — 20×6 gives 8.46px,
   because the block shrinks faster than the reduced height buys back.
3. **Drop the links row to one line at ≤640px height.** Cuts content, so I did not do it.

---

## 2 · The degraded state

**7 of 11 active issues have no `_tally`** — `e3 e4 b3 g1 g3 a2 m3`. Drawn, not described:
`seat-BOTH-STATES.png` (side by side at 393×852), plus `seat-state-empty-board.png` for the board
alone.

All 120 blocks at `#34302A` with a hairline so each is countable, the player's seat still lit and
labelled, and the resolution text from `vote_result`. **No spinner, no placeholder zeros, no
greyed-out numerals — the numeral row is simply not rendered.**

**One thing I got wrong first and fixed:** I had `.b5board--empty .b5seats{ opacity:.85 }`, which
is backwards. In this state the grid is the *entire* picture, so it must be more present than when
two thirds of it are coloured, not less. Removed, and `--seat-off` lifted `#2A2822` → `#34302A`
(1.26:1 → 1.42:1 against the board) so the 120 read as seats rather than as an empty box.

**Does it look like a bug? No.** It reads as "no numbers were recorded, but you were there", which
is the intended sentence — because the grid is still fully formed, still 120, and the one lit seat
is yours. That is the reason this option was picked and it holds up.

**All five cascade-less issues verified** in both engines: `e3 e4 b3 g3 m3` all reach beat 5 with
the grid present, 0 lit, the player's seat present, no numerals, **no shape-of-the-guess line**,
no 121st-vote line, correct two-button form, and negative overflow (84–138px of room to spare) —
so they compose comfortably rather than merely fitting.

Note on the 121st line: for a no-tally issue there is no `63—57` to state, so `.b5you` does not
render. The player's lit seat in the grid *is* the 121st statement in that state, which is
consistent rather than a gap.

---

## 3 · Decisions I made without you

1. **The player's seat is shape-coded, not hue-coded.** Forced: every remaining palette hue is a
   verdict, a side, or the chyron's. Yellow is ΔE 21.6 from the נגד ecru, which is too close for
   two squares in a grid — so it is the only round, keylined, set-apart block instead.
2. **`#E8DCC0` accepted at ΔE 24 from lime**, on the argument that it is the system's neutral paper
   tone and signals correctness nowhere. If you disagree, the only untainted alternative in the
   palette is `#37c4ff`, which means moving the chyron's neon to something else first.
3. **branches lightened `#2b4cff` → `#4E6BFF`.** The raw token is 3.16:1 on the board, under the
   3:1 line once antialiasing is counted at 17px. It is a tint of a palette hue, not a new colour.
4. **15 × 8, and the player on a ninth row of its own** — the arrangement that best says "120, and
   you" while staying obviously abstract.
5. **11.33px shipped at 360×640 rather than restructuring**, with the scroll fallback proposed
   above rather than taken unilaterally — it changes a standing rule about what may scroll.
6. **`.b5{padding-top}` made fluid** (`clamp(14px, 5vh, 44px)`) to buy the grid back ~12px on short
   phones. Affects beat 5 only.

## Still open

- The WhatsApp in-app browser check, unchanged from the previous two passes — still needs a device.
- `e3`'s own `vote_result` reads "62 חברי כנסת הצביעו בעד, מול 55" — **the numbers exist in
  Tamar's prose for several of the 7 issues that have no `_tally`.** Adding `_tally` for those is a
  `data.js` content task, not a build one, and it would light up the grid on most of the set.
