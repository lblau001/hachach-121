# Part C · steps 1–2 — CSV ↔ `data.js` diff

Generated before any write to `data.js`. **Nothing has been written yet.**

Sources
- `explorations/v17/data/issues_2026-09.csv` — UTF-8, CRLF, 18,617 bytes. Row 1 empty, row 2 header (17 columns, the 17th is an unnamed empty trailing column), 11 data rows.
- `explorations/v17/data/issues_2026-09.html` — present, 26 `<a href>`, **zero `google.com/url?q=` redirects**, so no unwrapping is needed. Hosts: knesset.gov.il, youtube.com, idi.org.il, acri.org.il, kan.org.il, mako.co.il, haaretz.co.il, facebook.com, instagram.com.
- `data.js` at `937f086` — 8 topics, 16 issues.

---

## 0. Headline: this is a new issue set, not an edit of the old one

Of 11 CSV rows, **6 correspond to an existing `data.js` issue and 5 are new**. Of 16 `data.js` issues, **10 have no CSV row** — four more than the six the brief expected from cutting two topics.

Two structural surprises that change the shape of the Part A work:

1. **`חוק המשטרה של בן-גביר` does not disappear with ביטחון פנים — it moves.** It is `s1` under `internal_sec` in `data.js`; the CSV files it under `מי מחליט פה? הפרדת רשויות`. Its bill title, date, voteId and claim are byte-identical to `data.js`. So "remove the internal_sec topic" cannot be done by deleting the topic and its issues — `s1` has to be re-parented to `branches` first, or its content re-created there.
2. **Four surviving topics lose one or both of their existing issues to unrelated replacements.** `branches` loses both (`ביטול עילת הסבירות`, `חוק המדליפים`) and gains `חוק המשטרה` + `יעוץ משפטי`. `economy` loses `תקציב המדינה` outright. `gender` loses `נישואים אזרחיים`. `military` loses `מדינה פלסטינית: הכרה חד-צדדית`.

---

## 1. Matched pairs

Confidence is evidenced, not guessed: `bill_title` / `bill_date` / `voteId` / `_tally` are compared, not just the title string.

| # | CSV `כותרת` | CSV topic | `data.js` | Confidence | Evidence and what changes |
|---|---|---|---|---|---|
| 4 | חוק המשטרה של בן-גביר | מי מחליט פה? | **`s1`** (internal_sec) | **CERTAIN** | `bill_title`, `bill_date` (28 בדצמבר 2022), `voteId` 37885 and the claim text are all identical. **TOPIC MOVES** internal_sec → branches. |
| 1 | חוק הגיוס | דת ומדינה | **`r1`** (religion) | **HIGH** | `bill_title` identical, `voteId` 41074 identical, `_tally` 63–57 matches `תוצאות ההצבעה`. Date corrected 11 → **10** ביוני 2024. **Claim replaced** (was "מבוססת על מתווה שכתב בני גנץ", now "צעירים חרדים … רבע ממחזור הגיוס"); answer stays אמת. |
| 6 | הפרדה מגדרית באקדמיה | מגדר ושוויון | **`g1`** | **HIGH** | Title, `bill_title`, `bill_date` (`קריאה טרומית: דצמבר 2024`) and claim all identical; answer stays אמת. No `_tally` in either — the CSV confirms why: committee approval, not a plenum vote. |
| 8 | ועדת חקירה ל-7/10 | אחריות ציבורית | **`a1`** | **HIGH** | `voteId` 44946 and `bill_date` identical, `_tally` 53–48 matches the result prose. `bill_title` gains one word (`ועדת חקירה` → `ועדת חקירה ממשלתית`). **Claim replaced**; answer stays שקר. |
| 9 | חסינות חברי כנסת | אחריות ציבורית | **`a2`** | **HIGH** | Title and `bill_date` identical, `bill_title` differs only in punctuation. **Claim expanded** ("אי אפשר להעמיד לדין…" → "לחברי כנסת יש חסינות ולכן…"); answer stays שקר. |
| 10 | שיתוף פעולה בין הרשות הפלסטינית למדנית ישראל | מדיני-ביטחוני | **`m2`** | **HIGH** | Matched on content, not title: `bill_title` `הצהרה נגד הקמת מדינה פלסטינית` and `bill_date` 18 ביולי 2024 are identical, and `_tally` 68–9 matches `עברה 68 מול 9`. **Title and claim both replaced** — the row is now about co-operation with the PA, on the same vote. Answer flips false → אמת (different claim, so not a contradiction). |
| 2 | עלויות המלחמה | כלכלה וחברה | `e2` תקציב המלחמה | **MEDIUM** | The **claim is the same one, rewritten** ("הממשלה ביטלה את כל הכספים הקואליציוניים") and the answer stays שקר. But the **bill is replaced**: `חוק תקציב נוסף לשנת 2023` → `חוק ההתייעלות הכלכלית … 2026`, date 14 בדצמבר 2023 → 30 במרץ 2026. Treat as a rewrite of `e2` or as a new issue — **Lion's call** (see Needs Lion #2). |

Note on `כותרת`: `data.js` already has a short `title` field per issue, distinct from `bill_title`. Six of the seven matches above line up on `title`; the CSV `כותרת` maps to `issue_title` / the existing `title`, not to `bill_name`.

---

## 2. Unmatched CSV rows — new issues with no `data.js` counterpart

| # | `כותרת` | Topic | Note |
|---|---|---|---|
| 3 | יוקר המחייה | כלכלה וחברה | New. `voteId` cell holds a **bill number** `פ/5229/25`, not a vote id. |
| 5 | יעוץ משפטי | מי מחליט פה? | New. Bill dated 15 ביולי 2026. |
| 7 | איזוק אלקטרוני | מגדר ושוויון | New. **No `קישור לכנסת`, no `סטטוס`, no `voteId`.** |
| 11 | פשיעה לאומנית | מדיני-בטחוני | New. Note the topic misspelling on this row. |
| 2 | עלויות המלחמה | כלכלה וחברה | Listed above as a MEDIUM match to `e2`; counts as new if Lion rejects that pairing. |

Every one of these needs an **MK cascade** built. The CSV carries no MK vote data, and `data.js` has no politician array to inherit for them. **This is the largest single gap in Part C and it blocks those four (or five) issues from being playable.**

---

## 3. `data.js` issues with no CSV row

### 3a. Expected — the two cut topics (4 issues)

| id | topic | title |
|---|---|---|
| `v1` | environment · סביבה ואקלים | חוק האקלים |
| `v2` | environment | המס על כלים חד-פעמיים |
| `s2` | internal_sec · ביטחון פנים | סנקציות על תומכי טרור |
| `s1` | internal_sec | חוק המשטרה של בן-גביר — **NOT cut; moves to `branches`** (see §0) |

So cutting the two topics removes **three** issues, not four.

### 3b. Unexpected — surviving topics that lose issues (6 issues)

| id | topic | title | `_tally` | Replaced by |
|---|---|---|---|---|
| `r2` | religion | חוק החמץ | 60–52 | nothing — דת ומדינה drops to **1 issue** |
| `e1` | economy | תקציב המדינה | 64–55 | יוקר המחייה |
| `b1` | branches | ביטול עילת הסבירות | 64–56 | חוק המשטרה (moved in) |
| `b2` | branches | חוק המדליפים | — | יעוץ משפטי |
| `g2` | gender | נישואים אזרחיים | — | איזוק אלקטרוני |
| `m1` | military | מדינה פלסטינית: הכרה חד-צדדית | — | פשיעה לאומנית |

These six carry **complete, working MK cascades** and four of them carry a real `_tally`. Deleting them throws that away in exchange for five issues that have no cascade at all. **Not doing this without Lion's word** — see Needs Lion #1.

### 3c. Bonus issues — reported separately, as instructed

**There are none, and there is no field that could mark one.** `data.js` has exactly 2 issues per topic and one boolean, `core` — true on the first issue of every topic, false on the second. `app.js:546` presents the `core:false` issue as `🎁 סוגיית בונוס`, i.e. the shipped app treats the second issue as the bonus; the Steal/Never sheet §0.2 treats both as סוגיות with bonus as a third, unwritten thing. Nothing in the CSV resolves this.

Consequence for A3/A9: with the CSV set, **דת ומדינה has one issue**, so it has no `core:false` row at all. Whatever "next issue" and the 2-segment ring do, they must handle a topic of size 1.

---

## 4. Data hygiene (step 2)

### 4a. Topic spelling — confirmed
`מדיני-ביטחוני` (row 10) and `מדיני-בטחוני` (row 11) are the same topic. Normalising to **`מדיני-ביטחוני`** (the spelling with the yud, matching `data.js`'s existing label).

### 4b. `סטטוס` has the same problem, and the brief did not flag it
`מאושר` ×7, `אושר` ×3, empty ×1 (איזוק אלקטרוני). Two spellings of one value. Storing verbatim and reporting; **not normalising without Lion's word**, because `אושר`/`מאושר` may be a real distinction rather than a typo.

### 4c. `תאריך` is free text — stored as a string, never parsed
Ten rows are of the form `10 ביוני 2024`; row 6 is `קריאה טרומית: דצמבר 2024`. `data.js` already stores `bill_date` as free text and already contains that exact string on `g1`, so the existing field takes these unchanged.

### 4d. Whitespace — 23 cells need cleaning on import

| Problem | Cells | Where |
|---|---|---|
| leading/trailing whitespace | 16 | `תיאור ההצבעה` on **all 11 rows**; plus `תוצאות ההצבעה` ×4, `הרחבה` ×3, `ההסבר` ×1, `שאלת אמת/שקר` ×1, `קישור לכנסת` ×1 |
| embedded newline inside a quoted cell | 3 | row 1 `הרחבה`, row 6 `תיאור`, row 7 `ההסבר` |
| double space | 3 | row 1 `שם החוק`, row 3 `תוצאות`, row 9 `שאלת אמת/שקר` |

No non-breaking spaces and no stray bidi marks. The embedded newline in row 1's `הרחבה` is a genuine **two-link list**, not dirt — see 4e.

### 4e. `הרחבה- בסוף הסבב` is multi-valued, and its delimiter is inconsistent
- row 1: newline-separated — `סרטון- ההיסטוריה של חוק הגיוס` / `חומרים נוספים`
- row 3: pipe-separated with no spaces — `סרטון - מה הוא פיקוח על מחירים? |פורום אורלוזורוב`
- rows 4,5,6,7,9,11: single value
- rows 2,10: empty

Confirms the brief's instruction that `further_links` is always an array. Splitting on newline **and** `|`.

### 4f. `מילות הרחבה` — three cells are not glossary terms
The brief's reading (chips, not body text) is right for 8 of 11 rows. Three carry an instruction to Tamar inside the cell:
- row 1 — `בני ישיבות (להדגיש שהם מקבלים תקצוב על שהותם בישיבה)`
- row 11 — `מעצר מנהלי- להסביר את החריגות שלו והפגיעה בזכויות אדם, להסביר שזו בסמכות שר הביטחון לאשר זאת` — and this one **contains a comma**, so a naive comma split produces two junk chips.
- row 7 — `V`, which the brief already says to treat as empty. Confirmed: it is the only cell in the column with no Hebrew.

**Glossary coverage against the 22 definitions already in `data.js`:** of the distinct terms in the CSV, only `דין רציפות`, `קריאה טרומית`, `חסינות`, `בג"ץ` and `כספים קואליציוניים` (spelled `כספים קואליציונים` in the CSV — one yud short) resolve. Roughly **20 terms have no definition** and will render as chips that do nothing. Full list comes with step 3.

### 4g. `voteId` — the gap is wider than "4 issues"
- **Genuinely empty ×5**: עלויות המלחמה, יעוץ משפטי, איזוק אלקטרוני, חסינות חברי כנסת, פשיעה לאומנית.
- **Not a vote id ×2**: יוקר המחייה holds `פ/5229/25` (a bill number); שיתוף פעולה holds `ההצבעה במליאה` (display text).
- Numeric and usable ×4: 41074, 37885, 44946, and חוק הגיוס's.

So **7 of 11 rows cannot address a Knesset vote by id**, not 4. The `קישור לכנסת` HTML anchors cover some of these independently — row 2's `לצפייה` resolves to a `voteid=45675` URL that has no matching CSV `voteId` cell, and row 3's resolves to a `/bills/2225121` page rather than a vote.

---

## 5. Needs Lion — stopping points

1. **The six issues in §3b are not in the sheet but are fully built.** Deleting them costs 6 working MK cascades and 4 real tallies, and the five CSV replacements have no cascade data at all. Confirm: delete them, or keep them alongside the sheet's rows?
2. **`עלויות המלחמה` ↔ `e2`** — same claim, different bill. Update `e2` in place (keeping its 7-MK cascade), or treat as a new issue and drop `e2`?
3. **`חוק המשטרה` re-parenting** — confirm `s1` moves to `branches` rather than being deleted with its topic. This is inference from the CSV's topic cell; the brief assumed both internal_sec issues were cut.
4. **MK cascades for the 5 new issues** — where does that data come from? Nothing in the CSV or the HTML carries it.
5. **`סטטוס`: `אושר` vs `מאושר`** — typo to normalise, or a real distinction?
6. **Glossary** — ~20 CSV terms have no definition in `data.js`. Chips that resolve to nothing, or suppress unresolved chips? (The brief says render and log; confirming that is still right at this volume.)
7. **`מילות הרחבה` rows 1 and 11 contain editorial instructions**, and row 11's contains a comma. Confirming the reading that these are notes to Tamar, and that I should keep only the leading term (`בני ישיבות`, `מעצר מנהלי`) as the chip.
8. **דת ומדינה is a 1-issue topic.** Confirm that is intended and not a row missing from the export.

---

## 6. Status

Steps 1 and 2 are complete. **`data.js` is untouched.** Step 3 (the write) is held pending the answers above — items 1, 2 and 3 change which rows get written.
