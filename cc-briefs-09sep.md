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
