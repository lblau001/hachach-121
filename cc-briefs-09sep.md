# Deferred briefs

Work that is scoped and understood but deliberately not built yet. Each entry is
a brief, not a note — enough to start from without re-deriving it.

---

## E-later · Enlarge the completion-screen medallions

**Status:** deferred out of `feat/share-finale-polish`. E-now (shrinking the CTA
on that screen) shipped on that branch; this is the other half.

**Goal:** make the six topic medallions and their labels larger on the
"סיימתם / כל הנושאים" screen.

### Why it is not a CSS change

The medallion grid is not decoration that happens to sit near the chair
transition — **it is that transition's subject.** `egPose(e)` (proto.js) takes
`.egov__map`, walks its `.egn` children and writes `transform: translate(…)
scale(…)` on each, animates `grid.style.height`, and fades `.egn__lab`. The
morph from grid to strip is entirely arithmetic over the node's size.

`EG_NODE` is **74 in two places** — `const EG_NODE = 74` in proto.js and
`.egn__disc{ width:74px; height:74px }` in proto.css. They are the same number
written twice, with nothing tying them together. Changing one silently desyncs
the measurement from the render.

Four further values are tuned to that 74 and are hardcoded:

| value | where | what it is |
|---|---|---|
| `EG_SNODE = 31` | proto.js | the strip's node size; the morph's end scale is `EG_SNODE / EG_NODE` (1 → .419) |
| `±42` | `egPose`, the `gx` term | the grid's column offset from centre |
| `max-width:88px` | `.egn__lab` | the label cap. Its own comment: *"88 on a 74px node… the morph's columns are 84px apart"* |
| `colW = 358 - 96 * ease` | `egPose` | the column width the chair is anchored to |

Only `EG_ROWS` and `EG_GRID_H` self-correct — `egMeasureRows()` measures them
live from `.egn__lab` heights. Row pitch and grid height are therefore safe;
nothing else is.

`EG_LAB_GAP = 4` is also duplicated (`.egn__lab{ margin-top:4px }`).

### Step one is not resizing anything

**Make `EG_NODE` single-source before touching its value.** Either the JS writes
the disc's size, or the CSS reads a custom property the JS also reads. Until
that holds, any resize is two edits that can drift.

Then, in order:

1. single-source `EG_NODE` (and `EG_LAB_GAP`), change nothing visually — verify
   the morph is pixel-identical before and after
2. re-derive `EG_SNODE` so the strip's end size is held, or accept that it moves
   and say so
3. re-derive `±42` and the 88px label cap against the new node
4. re-verify the morph mid-flight, not just at rest — the failure mode is a
   correct start and end with a wrong path between them

### Provenance — Roman should see this

`EG_NODE`, `EG_SNODE` and the row pitch are **ported verbatim from
`v30b/sequence.src.html`'s `mapMorph()`**. proto.js says so directly:

> *"NODE/SNODE and the 84px row are v30b/sequence.src.html's mapMorph()
> verbatim. The two things generalised out of it are the row count and the
> strip's spread."*

That file is upstream of code we would be editing. Anyone changing these numbers
is diverging from a design source that lives outside this repo — that is
probably fine, but it should be a decision rather than a side effect, and Roman
should know the link exists before it is broken.

### The CTA is not where the space comes from

`.p-c.eg-go.egov__go` **is the standard primary and stays standard.** Measured
against a bare `.p-c` in the running app: both render at **64.5px** (25px
`--fs-action` in 14px block padding; `min-height:56px` is a floor that never
binds at that type size). It was briefed as oversized; it is not.

It is also not local. T25c/T37 (`proto.css:8524-8535`) pinned 64.5 across all four
end-sequence screens so the ending's primary press does not change size on the
fourth, and the share button carries a 64.5 override **derived from** `.eg-go`.
Shrinking it means going deliberately sub-standard and dragging three other
screens with it.

So any room for the medallion grid and the title comes from the medallion work
below — not from the button. E-now was dropped for this reason rather than
deferred.

### Verification this will need

- the chair transition mid-flight and settled, before and after
- all three viewports, no scrolling at 375x667
- `egMeasureRows()` still producing sane `EG_ROWS` at the new label height

---

## A key:true flip can break art, and nothing catches it

**Found 15 Sep 2026, while cutting Gallant.**

Roman's `5996c60` moved `key` off `netanyahu` and onto `gallant` on issue `r1`,
and set `key:true` on `gila_gamliael` on `r2`. Both are content decisions and both
are correct. Neither is visible to anything that checks art.

`key:true` means the MK is dealt on **every** play of that issue —
`startRound()` splits `issue.politicians` into `key` and `rest`, shuffles only
`rest`, and concatenates. So a flip converts an MK who surfaced *sometimes* into
one who surfaces *always*.

**The normal cascade does not filter by the manifest.** Only `invPlan()` does, and
that runs solely for the `?inv=` demo link. So an MK with no resolvable art is
still dealt, and `deckCard()` falls through to the initials badge. That is the
designed fallback and it does not throw, log, or warn — the round looks fine. At
`r1` Gallant went from an occasional badge to a badge on every single play, and
the only reason it was caught is that somebody happened to be auditing the crop
rule the next day.

**What would catch it:** a check that every `key:true` id across `DATA.issues`
resolves in `M.politicians`. It is one pass over the data and it is the exact
invariant `invPlan()` already asserts for the inverted round — §V21's "a card
whose whole content is a face cannot fall back to an initials badge". The key
politician is that same case: the issue is built around them.

Not built here, because it wants a decision about where it lives — boot-time
console warning, a tools/ check, or a test — and this branch was an asset pass.

## e1's vote_result changed 62 -> 64, and what reads it

`5996c60` also rewrote `e1`'s `vote_result` from "62 קולות בעד" to "64". Audited
because a vote count changing is the kind of thing that silently desynchronises a
count-up.

**Nothing parses it.** `vote_result` is read at exactly three places, all in
`beat5()`: one truthiness test for whether to build a board at all
(`hasBoard = !!(tally || issue.vote_result)`) and two `esc()` renders of it as
prose. `TALLY_SENT`, the only regex in the file that matches vote counts, has a
single call site and it is the `bill_summary` outcome-sentence splitter — it is
never applied to `vote_result`. The finale count-up, the bar and the alignment
record all read `tally_for` / `tally_against`, which are separate numeric CMS
fields.

**But it was a real defect, and the edit fixed it.** `e1.tally_for` is **64**. The
prose said 62 while the bar beside it counted to 64 — two numbers disagreeing on
one board, in front of the player. Roman's change aligned the prose to the tally.

Checked all twelve issues for the same mismatch: `e1` was the only one. `a1` looks
like a mismatch and is not — `tally_against: 0` against "59 בעד, ללא התנגדות".
`g1` and `m2` carry no numerals in their prose at all, which is fine: the bar
carries them.

**The standing risk is unchanged.** These are two fields that must agree and
nothing makes them agree. Same shape as the key:true gap above.

## The manifest now carries two hand-added entries

`gallant` and `gila_gamliael` were both written into
`explorations/v16/prototype/manifest.json` **by hand**, which contradicts that
file's own header — "Generated, never hand-kept".

They are there because `make_manifest.py` cannot run, and it is deliberately being
left that way. Its three failures, in the order they fire:

1. line 19, `src.index("const AVATARS")` — a string `data.js` no longer contains,
   so the script dies before doing anything
2. the `TOPIC_ICONS` assert, against `environment` and `internal_sec`, two topic
   ids retired from `data.js`
3. `PORTRAITS` is derived from `data.js`, so a successful run drops the five
   art-only keys — `edelstein, gantz, lahav, michaeli, silman` — out of the
   manifest and therefore out of the credits screen, while their `.webp` files
   stay on disk and keep being served

**(3) is not a bug and must not be fixed as one.** `proto.js` already answers the
policy question the other way: the credits list is "THE ART INDEX, NOT THE
ROSTER", and it iterates `M.politicians` because a CC BY obligation attaches to
what is *distributed*. Fixing 1 and 2 alone arms 3 — the first successful
regeneration silently un-credits five distributed portraits. The script staying
broken is currently the only thing preventing that.

**The fix it needs:** make `PORTRAITS` the UNION of data.js keys that have art and
on-disk `mk_*_400/128` pairs that have no key, rather than the intersection —
then repair 1 and 2. Until then every hand-added entry is debt that the first
successful run destroys, and whoever repairs the script owns re-adding them.
Two entries as of 15 Sep 2026.

