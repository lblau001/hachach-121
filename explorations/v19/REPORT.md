# Asset quality pass — report

Branch `flow-proto`. Nothing staged, nothing committed. `app.js`, `data.js`, the shipped
`index.html` and `styles/` are untouched. Changed: the three tools, `manifest.json`,
`proto.js`, and the asset files themselves.

Full measured table: **`explorations/v19/AUDIT.md`**. Screenshots: `explorations/v19/shots/`.

---

## 8 · Which sources — answered first, because it decides the job size

**The masters are local, and framing does not have to be redone.**

`frame_mk.py` reads `assets/mk/<id>.webp` — the 832×1248 (848×1264 for netanyahu and odeh)
RGBA sources, which are all in the repo. `mk_<id>_400.webp` / `_128.webp` are its *outputs*.
The framing is derived, not hand-made: the tool measures crown, eyeline and face width on
every source and computes the crop from Ben Gvir's calibration constants. Re-exporting at a
new size is one command.

**Proof rather than assertion:** I re-ran `--write` over all 21 portraits and
`git diff --stat` on the `_400` and `_128` files is **empty**. Every one came back
byte-identical. The pipeline is deterministic and the framing carried over untouched.

**But the local sources cap the portrait well below DPR 3, and that is the finding of this
pass.** The frame is a *sub-rectangle* of the source — `cw = face_w / 0.683` — so the
largest honest export is the crop box itself:

| | width | DPR at the card's 401px |
|---|---|---|
| narrowest (lahav) | 474 | **1.18** |
| median | ~621 | ~1.55 |
| widest (netanyahu) | 723 | **1.80** |

DPR 3 needs a 1203px crop, which needs a source roughly **1.9× larger than the 832×1248 we
have**. So:

> **If larger raw portrait sources exist on the remote, I need them — and that is the only
> way the cards reach DPR 3.** With what is in the repo, 1.18–1.80 is the ceiling, and I
> have taken it to that ceiling rather than upscaling to hit a number.

I did not upscale. Upscaling to 1203 would add ~2.5× the bytes and no detail, and LANCZOS
upscaling of flat illustration softens exactly the alpha edge `#dcw` depends on — it would
make the cards worse while tripling the weight. The shortfall is recorded per portrait as
`dpr` in `manifest.json` instead of being hidden.

---

## 1 · The rule, rewritten

Old, in `manifest.json`: *"never let the browser downscale a file more than 1.2×."* Written
in CSS pixels, silently assuming DPR 1. That was not a small error — it was the wrong unit.

New, now stated in `manifest.json` under `sizing_rule` and restated in `prep_topic.py`:

> **DPR 3. A file is written at about three times the largest CSS size the asset is ever
> displayed at, anywhere in the app.** The target is the **largest** display site, not the
> nearest one — an asset drawn at 52px on the map and 128px on a card is a 384px asset, and
> picking a size per call site means every new call site is a silent regression.
> **Over-target is also a defect**, in bytes rather than pixels: past ~1.3× the target a file
> is paying for detail no screen can show. **Where the master cannot reach 3×, the shortfall
> is recorded per asset as `dpr` rather than hidden by upscaling.**

---

## 2 · The audit — measured, not listed

Every render size in `AUDIT.md` came from driving the prototype through every screen and
every beat at 393×852 and 430×932 and reading `getBoundingClientRect()` against
`naturalWidth`. Two things that only fell out of doing it that way:

- **The shipped app requests no repo raster at all.** `mkAvatar()` returns an initials badge
  because `window.MK_PHOTO_BASE` is unset, and `index.html`/`styles/` reference no image.
  Every asset in this repo is consumed by the prototype only. "Used nowhere" is measured
  against that.
- **The portrait's display size is fixed by one CSS rule**, `.mf-b__port { width:118% }` of a
  `--card-w:340px` card = **401.2 CSS px**, and `--card-scale` can only shrink it. It is
  therefore identical for all 21 and independent of viewport. I measured five and the rest
  follow by construction; nothing per-MK enters it.

**Assets nothing requests — 110 files, 26.39 MB:**

| category | files | MB | |
|---|---|---|---|
| masters | 35 | 19.91 | correct — the tools read them |
| orphan masters (`lazimi`, `may_golan`, `ohanah`, `troper`) | 4 | 1.33 | portraits for people not in `data.js` |
| `assets/mk-test/` | 8 | 2.36 | byte-for-byte duplicate of files already in `assets/mk/` |
| `bengvir_styleA/B*` | 8 | 2.36 | the style decision is long made |
| dead / superseded exports | 55 | 0.43 | padlock, `s2` (retired), `environment` (no active issue), `topic_police_*`, the 40/52/64 icon sizes |

I deleted none of it — deleting an asset is a separate decision from re-sizing one. But
**`mk-test/` and the styleA/B set are 4.7 MB of pure duplication** and are the obvious first
cut if you want the repo smaller.

**You said 25 portraits; there are 21 with framed exports.** The other four are the orphan
masters above — sources for people who have no `data.js` `politicians` entry, so nothing can
render them. Say the word and I frame them, but they would be dead files until data.js gains
the ids.

---

## 3 · Topic icons re-targeted against the *new* sizes

The 256 was sized against the map alone and against the old 76px disc. Recomputed against
Part 1's 15% larger node **and** every other call site:

| call site | CSS size | DPR-3 target | verdict |
|---|---|---|---|
| map node, largest icon (gender, `node_scale` 1.1105 × `--node-ico-avg` 51) | **56.6** | 170 | 256 already covers it |
| law modal `.stmodal__art` | **65.0** | 195 | 256 covers it — **it was on the 128** |
| claim card `claimArt()` topic fallback | **128.0** | **384** | **nothing covered it** |

So the node growing 15% changed nothing: the map's largest icon went from ~49 to 56.6 CSS px,
wanting 170 against a 256 file. **The map's before/after crops are byte-identical, and that is
the correct result.**

The real defect was elsewhere. The claim card was drawing the **128px file at 128 CSS px** —
1:1, a 3× upscale on a 3× phone — and that is the fallback for **14 of the 16 issues**, so it
is what most claim cards actually show. It is the worst-served surface in the app and the
biggest visible win in this pass (see `before/after-claimcard-topicfallback-CROP.png`).

The police hat is *not* used much larger in the law modal — it is 65 CSS px there against
56.6 on the map — but it was being served from the **128** while the map got the 256. Now on
the 256 (DPR 3.94; 384 would be over-target).

---

## 4 · What was re-exported

| asset | before | after | DPR after |
|---|---|---|---|
| 21 MK portraits, card | `_400` (400×533) | **`_<native>`, 474–723px wide** | 1.18–1.80 (ceiling) |
| 8 topic icons, claim card | `_128` | **`_384`** | 3.00 |
| 8 topic icons, map | `_256` | `_256` unchanged | 4.5 (governing site is the modal's 195 → 1.31× over, inside tolerance) |
| police hat, law modal | `_128` | `_256` (no new file) | 3.94 |
| chair | `_300` (300×350) | **`_900` (900×1050)** | 3.12 |
| Knesset building | `_390` (390×260) | **`_1170` (1170×780)** | 3.00 |
| `s1` claim-card art | `_300` (300×180) | **`_900` (900×539)** | 3.00 |
| MK portraits, strip | `_128` | unchanged | 3.41, already above |
| `card_background.webp` | 1536×2752, 1322 KB | **1038×1860, 324 KB** | 3.00 |

**The chair and the building had no tool at all.** Their sizes were whatever somebody
exported once, which is exactly why they were the two worst-served props — a 300px chair
drawn at 288.5 CSS px is DPR 1.04. Both are now `prep_topic.py` jobs, sized at 3× their
measured display size and inside their masters' own ink boxes, so nothing is upscaled. Their
`_300`/`_390` fallbacks are regenerated at q88 to match the rest of the pipeline, which is
why those three files show as modified rather than new.

**Quality on the native portraits is 78, not 88**, and that is what the extra pixels are for:
the file is downscaled 1.2–1.8× on the way to the card and a downscale averages quantisation
noise away. Measured at the card's rendered 401px, against the **uncompressed crop off the
master** as reference (5 portraits spanning the DPR range):

| | bytes/portrait | PSNR at 401px |
|---|---|---|
| today's `_400` q88 | 64 KB | **30.3 dB** |
| native q70 | 91 KB | 37.0 dB |
| native q76 | 99 KB | 37.8 dB |
| **native q78 — shipped** | **106 KB** | **38.4 dB** |
| native q82 | 121 KB | 39.7 dB |
| native q88 | 149 KB | 41.7 dB |

The step that matters is the first one: +42 KB buys **+8.1 dB**. Everything above q78 buys
3.3 dB more for another 43 KB. `_400` and `_128` stay at q88 so they remain byte-identical to
what is committed.

---

## 5 · Bundle size — and the answer was not the MK set

**Repo assets: 29.07 MB → 30.91 MB (+1.84 MB net, +32 files)** — the portrait and prop
upgrades added 2.82 MB and the card back gave 0.98 MB of it back.

But total repo size is the wrong number, because **nothing loads the set**. The deck creates
one `<img>` per dealt card and preloads exactly one ahead, so a portrait is fetched when its
card is next. Measured transfer per screen at 393×852:

| screen | at session start | after the re-exports | **final, card back fixed** |
|---|---|---|---|
| intro, first paint | 64 KB | 282 KB | **282 KB** |
| map, first paint | 95 KB | 95 KB | **95 KB** |
| **round → first MK card** | 1491 KB | 1795 KB | **765 KB — 49% below where we started** |
| full 9-card cascade | 1726 KB | 2139 KB | **1140 KB — 34% below** |

Per additional cascade card: **+43 KB** (63 → 106 KB).

**You asked to be told before committing if the MK set could hurt 3G. It was not the MK set** —
it was `card_background.webp` at 1322 KB, 89% of the round's first-load payload, and it is now
fixed. On 3G at ~50 KB/s the round's first load goes from **30 s to 15 s** while every asset in
it got sharper. A cascade card's portrait goes 1.3 s → 2.1 s; the per-card tempo is ~850 ms, so
portraits were already arriving late on that link and the one-ahead preload was already doing
the work.

The map's 6 topic icons are the one remaining over-target case: 95 KB at 256 where the
governing call site wants 195px. Inside my own 1.3× tolerance, so I left them.

---

## 5b · The card back, re-exported

**No larger original exists.** Checked `tools/`, `explorations/v16/build/`, every master, and
the git object store: **one blob, one commit** (`ffc488c`, sha `f345e369`), byte-identical to
what was on disk, and nothing larger anywhere — including the dangling commit. It is also *not*
a crop of `knessetbuilding.webp`: different palette, different composition, portrait against
that one's landscape. So this is the lossy→lossy recompress, as you allowed.

**The target is 1038×1860, and the 1164 I quoted last time was wrong.** `.cardback` paints with
`background-size:cover` into the card's own **340×620** box, and cover is driven by whichever
axis needs the larger scale: `620/2752 = 0.2253` beats `340/1536 = 0.2214`, so **height drives**
and the image paints at **346×620 CSS px**. I had taken the size from
`getBoundingClientRect()`, which for the deck is the *rotated* axis-aligned box — the cards
carry `rotate(.9deg)`, the pile more, a leaving card `-13deg` — and reads 359–387px. That would
have over-sized the file by 12%. `offsetWidth`/`offsetHeight` is the box the background actually
paints into.

| | size | bytes | DPR |
|---|---|---|---|
| before | 1536×2752 | 1322 KB | 4.44 |
| **after** | **1038×1860 q88** | **324 KB** | **3.00** |

**−998 KB, 75% off.**

**The recompress itself costs 1.7%.** Measured as RMS edge energy with everything compared at
the same on-screen size — 1038×1860 device px, what a 393-wide phone at DPR 3 actually paints,
and what the browser was *already* downscaling the 1536 file to at render time:

| | RMS gradient | vs a lossless 1038 |
|---|---|---|
| the 1536 original, downscaled to 1038 | 26.93 | 0.0% |
| a lossless 1038 (resize only) | 26.93 | 0.0% |
| **the shipped 1038 q88** | **26.49** | **−1.7%** |
| 1038 q84 | 26.45 | −1.8% |

The encode costs 1.7%; the resize costs nothing, because the resize was happening anyway.

**What is actually visible is a resampler change, not a quality loss** — and I had this wrong
before I isolated it. Comparing the two *rendered* crops, edge energy reads −13% on the
building, which looks like softening. It is not the encode. The browser was downscaling
1536→1038 at paint time with a cheaper filter that left the artwork's halftone screen aliasing;
the file now arrives pre-downscaled through a properly antialiased LANCZOS, so the stipple in
the sky reads smoother. Whether that is "cleaner" or "softer" is a taste call on the texture,
which is what the crops are for. The linework is untouched: flagpoles, flag detail and the roof
line are equally crisp in both.

q88 rather than q84 or q80 is the conservative pick on a chain that cannot be undone — q80 would
have saved another 121 KB for 2.2 dB on the only copy that exists. No quality from 76 to 92
introduced banding beyond what the source gradient already carries (the sky's own step count is
311 in a lossless reference; every candidate came in below it).

**The job is in `prep_topic.py` and is idempotent.** It is the one job whose source and
destination are the same file, so it refuses to run on anything but the 1536×2752 original —
without that guard, every future regeneration of the bundle would silently cost another
generation. To redo it: `git checkout -- assets/card_background.webp`, then re-run.

### 1:1 crops, 393×852 at DPR 3

`cb-before-*` / `cb-after-*` in `explorations/v19/shots/`. True device pixels, no resampling
anywhere: the page is captured at `deviceScaleFactor:3` and the clip is given in CSS
coordinates, so each PNG is 3× its clip. The claim card is hidden **by the test harness only**
so the card back is fully visible at exactly the size the app paints it.

| crop | device px | PSNR | what it shows |
|---|---|---|---|
| `cb-*-building.png` | 600×450 | 33.4 dB | linework and halftone. Flags, poles, roof identical; the stipple differs. |
| `cb-*-sky.png` | 450×330 | 46.0 dB | the flat gradient. 0.1% of pixels differ by more than 8 levels. |
| `cb-*-card.png` | 1050×1875 | 38.4 dB | the whole card back in situ. |

---

## 6 · Before/after — `explorations/v19/shots/`, 393×852 at DPR 3

`before-*` and `after-*` are the **same DOM, same seeded deal, same MK**. The "before" side
is served the old files by rewriting the requests, so the only variable between the two
images is the asset bytes. (My first attempt drew different faces — `newRound()` shuffles
with `Math.random` — so both sides now run a seeded PRNG.)

| pair | what changed |
|---|---|
| `*-mkcard-CROP` | Deri, DPR 1.36 — one of the *worst* cases. Beard and moustache strokes go from smeared to individually resolved. |
| `*-claimcard-topicfallback-CROP` | The scales at 128 CSS px. The largest difference in the set: hanger strings and hatching go from a soft blob to clean line, and the die-cut edge from furry to hard. |
| `*-intro-CROP` | The chair, DPR 1.04 → 3.12. Leather hatching goes from smeared to distinct strokes. |
| `*-lawmodal-CROP` | The police hat, 128 → 256. Cap badge and peak edge sharpen; the white die-cut reads as a line rather than a fringe. |
| `*-map-CROP` | **Byte-identical** — 256 was already above target for the map even after the 15% node growth. Included because "no change" is the result. |

Also `*-intro`, `*-map`, `*-claimcard`, `*-lawmodal`, `*-mkcard` full frames.

---

## 7 · The die-cut edge — confirmed, numerically and visually

`#dcw-sm` is `feMorphology dilate` on `SourceAlpha`, so it inherits whatever the alpha edge
is: a soft or haloed edge dilates into a fringe on a saturated disc. Measured on all 8 new
384px icons, against the 128 and 256 as controls —

| size | mean edge band | max | halo (soft alpha standing off the body) |
|---|---|---|---|
| 128 | 1.20 px | 1.31 | **0 px, all 8** |
| 256 | 1.20 px | 1.25 | **0 px, all 8** |
| **384** | **1.29 px** | 1.34 | **0 px, all 8** |

"Edge band" is soft-alpha pixels per perimeter pixel — 1.0 is a single anti-aliasing ring.
"Halo" counts soft pixels more than 2px from any solid pixel, which is what a bad master or a
baked shadow produces; there are **none anywhere in the set**.

The 384's band is fractionally wider in *file* pixels because the same physical edge is
sampled at more of them. In *display* terms it is nearly 3× crisper: 1.29 file px on a file
drawn at 128 CSS px is **0.43 CSS px** of transition, against 1.20 CSS px before. Visible in
`after-claimcard-topicfallback-CROP.png` — the white die-cut is a hard line.

---

## Verification

Full round and map, Chromium 131 and WebKit 18.2, 360×640 / 393×852 / 430×932: **zero console
errors**. Part 1's map checks re-run clean after the asset change — both ribbon paths still
one unbroken subpath, 70 gap probes, 0 gaps.

## Decisions I made without you

1. **No upscaling to hit DPR 3 on portraits.** Native crop is the ceiling; the shortfall is
   recorded per portrait rather than hidden. Needs larger sources to close — item 8.
2. **q78 on the native portraits only**, on the measured PSNR-per-byte above.
3. **`card_background.webp` recompressed at q88**, on your go-ahead, after confirming no
   larger original exists. q88 rather than q80 because the chain cannot be undone.
4. **Nothing deleted**, including 4.7 MB of exact duplicates in `mk-test/` and the styleA/B set.
5. **The four orphan portrait masters not framed** — they would be dead files until `data.js`
   has ids for them.
6. **The chair/building `_300`/`_390` fallbacks regenerated at q88.** They had no tool and no
   recorded settings; this puts them on the same pipeline as everything else. It is why those
   three files read as modified.
