# S-1 — the finale as a sequence · build spec

**Decided 2026-09-03.** Approved chronology for beat 5. Drawn in
`s1-finale.html` beside this file — that page is self-contained (one embedded
font, no images, no external requests) and does not depend on the design
canvas.

The beat is a **sequence, not a screen.** The finale had been designed three
times as a static layout and each read as chaotic, because everything arrived
at once with no order of importance. Design the chronology first; the layout
falls out of it.

---

## 0. The rules the sequence is built on

- The **tally is the peak**. Nothing else may land while it is counting.
- The **player's flight is the second beat**, watchable, not simultaneous.
- The **coins get a moment**. Today they fly to the counter with nothing that
  says *this is what you made*.
- **Buttons arrive last and stay.** Nothing lands after them.
- **Not everything belongs on screen.** The explanation's tail, the glossary
  chips and the links go behind one disclosure.

---

## 1. Beat order — `r1` (has a tally)

| t | What arrives | Motion |
|---|---|---|
| **0.0s** | Count begins. Tally alone: numerals 74px, bar filling against a dark remainder so the two are visibly filling a fixed 120. Pinned banner (`הצבעתם בעד`) stays. | near-linear |
| **~1.6s** | **61 is crossed.** The majority line flares; numerals hold. This is the moment of the beat. | 400ms hold |
| **2.4s** | Count settles at 63—57. | ease-out |
| **2.9s** | **The flight.** The player's token leaves the pinned banner and lands beside `בעד` as the 121st vote. The resolution line writes beneath it. | ~700ms, `--e-land` |
| **3.9s** | **The coins.** `+125` lands centre-screen as its own object, then flies to the HUD counter. | ~500ms hold, then coin-fly |
| **4.7s** | Board shrinks to a ~60px strip. Guess line, first sentence of the explanation, the `עוד ›` disclosure, and both buttons. | ~300ms |

**Total to interactive: ~4.7s.**

Two notes on the count:

- The bar's third segment is the **unfilled remainder** (`#2A2822`), so 63 and
  57 are visibly filling a fixed 120 rather than a bar that just happens to end.
- The 61 line is drawn at `50.4%` of the bar with a `61` label above it. It is
  the only element that flares.

---

## 2. Beat order — `e3` (no tally): the degraded twin

**7 of the 11 active issues have no `_tally`** — `e3 e4 b3 g1 g3 a2 m3`. There
is nothing to count and no side for the avatar to land beside. The beat keeps
its shape:

| t | What arrives |
|---|---|
| **0.0s** | No count exists, so the **peak is the outcome itself**: `vote_result` set at 19px in the board. It is the only account of the outcome that exists. |
| **1.2s** | **The flight still happens.** With no side to land beside, the token lands on a plate of its own — `הקול שלכם נרשם: בעד`. It moves, and it does not claim a number that is not there. |
| **2.2s** | Coins, same as the full sequence. `+100` on a round with no cascade. |
| **3.0s** | The reading and the buttons. **No guess line** — e3 has no cascade, so there is nothing to have guessed. |

**Total: ~3.0s.**

The plate is the important part of this twin: it preserves beat 2 without
inventing a tally. Do not fall back to hiding the avatar.

---

## 3. What is on screen vs. behind `עוד ›`

**On screen by default, and staying:**

- the tally (full size while counting, then a strip)
- the player's avatar on its side
- the resolution line — `ההצעה עברה 63—57. עם הקול שלכם: 64—57`
- the shape-of-the-guess line — `ניחשתם נכון ב-4 מתוך 5`
- **the first sentence of the explanation**
- the two buttons — `לסוגיה הבאה ›` primary / `חזרה למפה` secondary; primary
  `חזרה למפה` alone when the topic has no second issue

**Behind the `עוד ›` disclosure, in a sheet over a scrim:**

- the rest of the explanation
- the glossary chips
- the links row (video, further reading, Knesset record)

**Why those three.** They are the part players skip, and they are what made the
old lower section unreadable — seven items competing in the bottom third.
Keeping the first sentence visible means the beat still explains itself with no
tap; the tap is for people who want the rest. The tally strip and resolution
line stay visible above the sheet.

**The coin moment is not deferred and lands *before* the reading** — it belongs
to the peak, not to the prose.

---

## 4. Type sizes

**Contrast was never the problem, and this matters for how you fix it.** The old
lower section was measured before any redesign and **every element passed WCAG
AA**: explanation 8.25:1, guess line and links 7.08:1, glossary chips 6.70:1,
resolution 15.72:1, worst-in-set the `בעד/נגד` label at 5.32:1. Raising contrast
would have changed nothing. The unreadability was **size and density**. Do not
"fix" this by darkening backgrounds or brightening text.

| Element | Was | Now | Contrast now |
|---|---|---|---|
| Explanation | 12.5px | **15px** | 9.29:1 |
| Shape-of-guess line | 12px | **14px** | 8.25:1 |
| Links | 11.5px | **14px** | 13.94:1 |
| Glossary chips | 11.5px | **13px** | 15.39:1 |
| Resolution line | 15px | **16px** | 9.04:1 |
| Disclosure `עוד ›` | — | **14px** | 12.35:1 |
| Primary button | 18px | 18px | 13.18:1 |
| Secondary button | 15px | 15px | 7.08:1 |

All measured at 393px against the flattened background actually behind each
element. Every value passes AA at the 4.5:1 threshold.

---

## 5. The avatar token

```css
box-shadow: 0 0 0 3px #FFD60A,
            0 0 0 4.6px rgba(0,0,0,.5),
            0 0 18px 5px rgba(55,196,255,.72);
```

Yellow keyline, cyan glow. It is the **only** object on the beat carrying both,
so it can never be mistaken for a verdict mark.

**The colour rule is unchanged.** Lime `#B6E521` and magenta `#FF3BC0` code
*correctness only, never vote direction*. The tally bar's fills
(`#B6E521` for `בעד`, `#FF7A6B` for `נגד`) are the board's own and carry no
correctness meaning — they are a quantity, not a verdict. Do not introduce a
token for `בעד` / `נגד` / `נמנע`.

---

## 6. Coin values

Per the coin table:

| | |
|---|---|
| finishing a round | +50 |
| claim correct | +25 |
| own tachles vote | +25 (flat, unconditional) |
| each MK correct | +25 |
| topic complete | +100 |

The `+125` drawn on `r1` is `4 MKs correct + round + …`; the `+100` on `e3` is
`claim + own vote + round`. The caption under the coin sticker names the
components — it is the first place in the game that says what a round was worth.

**`topic: 100` was in the table and had never been paid** — the row existed and
no call site was ever written. If that is still true in `app.js`, this beat is
where it gets paid.

---

## 7. What this replaces

The 11×11 **seat grid is rejected**. The interleaved fill was a constraint set
to avoid implying factional seating, and it produced a checkerboard no one can
read a majority from — honest, and illegible.

What carries over is the **V20-2 family**: two numbers, left and right, a bar
between, counting up. The new move is the avatar flight, which delivers the
"121st MK" conceit through **action** rather than a dot in a grid.

---

## 8. Still open

- **The coin values are a proposal**, not a locked table for this beat. The
  `+125` / `+100` figures follow the table above; if the table moves, these move.
- **The 7 missing tallies are a content gap, not a build one.** If `e3 e4 b3 g1
  g3 a2 m3` gain a `_tally` in `data.js`, the degraded twin stops being the
  common case — today it is what most players see most of the time.
- `vote_result` prose length is unbounded. The twin's 19px peak was drawn
  against `e3`'s sentence; the longest of the eleven has not been measured
  against this layout.
