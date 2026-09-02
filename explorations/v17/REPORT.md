# v17 — post-meeting rework · report

Session state: **Part C complete. Part A partially started (data-consistency slice only). Part B not started.** Nothing staged, nothing committed. See §6 for exactly what changed on disk and §7 for what was not reached.

---

## 1. Spoiler tables

### 1a. A6 blocking check — MK names inside `tf_explain`

Run over all 11 active issues, matching full names, surnames and distinctive given names against each issue's own cascade.

| issue | MK names appearing in the explanation |
|---|---|
| `r1` חוק הגיוס | — |
| `e3` עלויות המלחמה | — |
| `e4` יוקר המחייה | — |
| **`s1` חוק המשטרה של בן-גביר** | **איתמר בן-גביר** |
| `b3` יעוץ משפטי | — |
| `g1` הפרדה מגדרית באקדמיה | — |
| `g3` איזוק אלקטרוני | — |
| `a1` ועדת חקירה ל-7/10 | — |
| `a2` חסינות חברי כנסת | — |
| `m2` שיתוף פעולה … הרשות הפלסטינית | — |
| `m3` פשיעה לאומנית | — |

**One row is non-empty.** `s1`'s explanation names בן-גביר, and בן-גביר is in that round's cascade — so the reveal at beat 1 tells the player how he voted before they are asked to guess it. Tamar's new texts are otherwise clean: 10 of 11 rows have no MK named at all.

### 1b. A7 — MK names inside `bill_description` (the law modal)

| issue | MK named in the modal | in that round's cascade? |
|---|---|---|
| **`s1` חוק המשטרה** | איתמר בן-גביר | **YES — spoils his card** |
| **`m2` שיתוף פעולה** | בנימין נתניהו | **YES — spoils his card** |
| `g3` איזוק אלקטרוני | איתמר בן-גביר | no — `g3` has no cascade at all |

Your brief predicted איזוק and חוק המשטרה; the scan adds **`m2`**, and clears `g3` (it has no cascade to spoil). So the live problem is **two rounds: `s1` and `m2`**.

---

## 2. A2 — viewport / grey band

**Not diagnosed.** Part A was not reached. No change made, no guess recorded.

---

## 3. Hardcoded `8` for Roman

The scan found **no literal `8` in the progress maths** — it is derived, and that is the actual problem:

| file:line | code | why it breaks now |
|---|---|---|
| `app.js:248-252` | `const coreIssues = ISSUES.filter(i=>i.core); const totalCore = coreIssues.length; … meterCount = doneCore+'/'+totalCore` | `core` is deliberately untouched by the import, so this still counts **8** issues — including six that are now `active:false`. Needs `.filter(i => i.active !== false)` and to stop keying on `core`. |
| `app.js:256, 258, 280` | `left = totalCore-doneCore`, celebration gate `doneCore===totalCore` | same source, same fix |
| `app.js:528-531, 556-557` | end screen recomputes `coreIssues` / `totalCore` / `allCoreDone` | same source, same fix |
| `app.js:942` | self-test `['8 topics', TOPICS.length===8]` | still passes — all 8 topic rows are kept in `data.js` — but the live map is 6. Test should assert active topics, not rows. |
| `index.html:130` | `<span id="meterCount">0/8</span>` | initial text only, overwritten at runtime; cosmetic |
| `app.js:546` | `'🎁 סוגיית בונוס'` on the `core:false` issue | untouched per your instruction; flagged because `core:false` no longer means "second issue" |

**No `app.js` line was changed this session.** All of the above is for Roman.

---

## 4. Field mapping used, and what is missing

### 4a. Keys reused vs. created

| sheet column | key written | reused or new |
|---|---|---|
| כותרת | `title` | **reused** (not `issue_title` — `title` already existed and held exactly this) |
| שאלת אמת/שקר | `tf` | **reused** (not `tf_claim`) |
| התשובה | `tf_answer` | reused; `אמת`→`"true"`, `שקר`→`"false"` |
| ההסבר- חשיפת התוצאה | `tf_explain` | reused |
| שם החוק- בקטן | `bill_title` | **reused** (not `bill_name`) |
| תאריך | `bill_date` | reused, stored verbatim as a string |
| תיאור ההצבעה | `bill_summary` | **reused** (not `bill_description`) |
| voteId | `voteId` | reused |
| קישור לכנסת | `knesset_url` | reused, **URL from the HTML export** |
| תכלס- בגדול | `tachles_prompt` | **new** |
| תוצאות ההצבעה | `vote_result` | **new** |
| הרחבה- בסוף הסבב | `further_links` | **new** — always an array of `{label, url}` |
| מילות הרחבה | `glossary_terms` | **new** — resolved terms only |
| סטטוס | — | **not imported**, per your decision 5 |
| — | `active` | **new** boolean |

### 4b. Completeness per active issue

`·` present · `—` empty

| issue | topic | tachles | vote_result | voteId | knesset_url | further | glossary | cascade | _tally |
|---|---|---|---|---|---|---|---|---|---|
| `r1` | religion | · | · | · | · | · | **—** | 9 | · |
| `e3` | economy | · | · | **—** | · | **—** | **—** | **—** | **—** |
| `e4` | economy | · | · | · | · | · | **—** | **—** | **—** |
| `s1` | branches | · | · | · | · | · | · | 6 | · |
| `b3` | branches | · | · | **—** | · | · | **—** | **—** | **—** |
| `g1` | gender | · | · | **—** | · | · | · | 6 | **—** |
| `g3` | gender | · | · | **—** | **—** | · | **—** | **—** | **—** |
| `a1` | accountability | · | · | · | · | · | · | 6 | · |
| `a2` | accountability | · | · | **—** | · | · | · | 6 | **—** |
| `m2` | military | · | · | · | · | **—** | **—** | 6 | · |
| `m3` | military | · | · | **—** | · | · | **—** | **—** | **—** |

Every active issue has all of `title`, `tf`, `tf_answer`, `tf_explain`, `bill_title`, `tachles_prompt`, `bill_date`, `bill_summary`, `vote_result`. Nothing falls back to anything.

**Cascade-less (beat 4 skipped entirely): `e3`, `e4`, `b3`, `g3`, `m3` — 5 of 11.**
**No `_tally` (finale count-up skipped): those 5, plus `g1` and `a2` — 7 of 11.**

`voteId` recovered for `m2` as **41304** from an anchor inside the `voteId` cell itself (`…vote.aspx?voteid=41304`), which also independently confirms the `m2` match.

### 4c. Glossary — the content ask

Chips render only for terms that resolve, per your decision 6. **Only 4 terms across the whole set resolve**: `בג"ץ` (`s1`), `קריאה טרומית` (`g1`), `ועדת חקירה ממלכתית` (`a1`), `חסינות` (`a2`). Seven issues get no chips at all.

**Unresolved terms needing a definition from Tamar (17):**
`כספים קואליציונים` · `מגזריות` · `מדינות ה-OECD` · `ביטחון פנים` · `יועמ"ש` · `יצוג בבג"ץ` · `טעמי דת` · `ועדת החינוך` · `בית משפט העליון` · `ועדת חקירה ממשלתית` · `מינוי פוליטי` · `הרשות הפלסטינית`

**Near-miss worth fixing in the sheet:** `כספים קואליציונים` (CSV) vs `כספים קואליציוניים` (`data.js`) — one yud apart. It is the same term and would resolve on a spelling fix.

**Cells skipped whole, per your decision 7 — for Tamar:**
- `r1` — `דין רציפות, פטור משירות, בני ישיבות (להדגיש שהם מקבלים תקצוב על שהותם בישיבה)`. **Cost: `דין רציפות` is in the glossary and would have resolved.** Splitting the note off recovers one working chip.
- `m3` — `מעצר מנהלי- להסביר את החריגות שלו והפגיעה בזכויות אדם, להסביר שזו בסמכות שר הביטחון לאשר זאת`. Contains a comma, so a naive split makes two junk chips.
- `g3` — `V`, treated as empty as instructed.

### 4d. Hyperlink recovery (C5)

**24 of 26 anchors captured**, all rows matched by `כותרת`. **Zero `google.com/url?q=` redirects** — no unwrapping needed.

| finding | detail |
|---|---|
| **1 missing URL** | `e4` יוקר המחייה → `פורום אורלוזורוב` has no anchor. Written as `{label, url:""}`; renderer must mark it `data-missing-url`. |
| **1 orphan link** | the same row has `עוד על יוקר המחייה בישראל` → `mako.co.il/...` sitting in an **unnamed 18th column**, outside the three columns you named. Not imported. Likely the intended `פורום אורלוזורוב` link in the wrong cell — **Tamar to confirm**. |
| **1 mislabelled** | `a2`'s `קישור לכנסת` points at **haaretz.co.il**, not knesset.gov.il. Imported as-is. |
| **2 bill pages, not votes** | `e4` and `b3`'s knesset links are `/apps/legislation/main/bills/…`, consistent with them having no `voteId`. |
| **1 absent** | `g3` איזוק has no `קישור לכנסת` at all, as your brief predicted. |

---

## 5. Needs Lion

1. **`s1` and `m2` spoil their own cascade through the law modal** (§1b), and `s1` also through the beat-1 explanation (§1a). Tamar decision.
2. **Five active issues have no MK cascade.** They now run claim → stamp → tachles → reveal. Where does cascade data come from, or do they stay 3-beat rounds?
3. **`r1`'s glossary cell** — splitting the parenthetical note off recovers `דין רציפות`. Worth asking Tamar to move notes to `הערות`.
4. **17 glossary terms have no definition.** Content ask.
5. **`e4`'s orphan link in column 18** — is `mako.co.il` the missing `פורום אורלוזורוב`?
6. **`a2`'s knesset link points at Haaretz.**
7. **Bonus presentation** — untouched as instructed, but `core` no longer tracks "first active issue": `economy` has **no active `core:true` issue** and `military`'s only active one is `core:false`. Anything reading `core` for ordering is now wrong; the prototype reads array order instead.

---

## 6. Files touched

| file | change |
|---|---|
| `data.js` | **content fields only.** 10 issues gained `active:false`; 6 matched issues updated from the sheet; 5 new issues added; `s1` re-parented to `branches`; `e3`/`s1` reordered to the sheet's row order. **Verified by diff: MK vote arrays, `_tally`, `core`, the topics array, the politicians dict, the glossary and the whole `AVATARS` half of the file are byte-identical to `937f086`.** |
| `explorations/v17/data/diff_report.md` | new — Part C steps 1–2 |
| `explorations/v17/REPORT.md` | new — this file |
| `explorations/v16/proto/proto.js` | data-consistency slice only, see §7 |

`app.js`, `index.html`, `styles/` — **untouched.**

---

## 7. What was NOT reached

**Part A is not built.** I stopped after the data-consistency slice because the `data.js` change would otherwise have left the prototype silently playing retired issues on an 8-node map — a trap rather than a known gap. What I did change in `proto.js`, and nothing else:

- `topicIssues()` filters to `active !== false` and orders by **array position, not `core`** (decision 1)
- topics are **derived** from having ≥1 active issue, so the map is 6 nodes and the chip reads `x/6` (decision 1)
- the ring draws **n segments for n issues** — דת ומדינה renders one arc and reads `0/1 סוגיות`, never `1/2` (decision 8)
- **beat 4 is skipped** when an issue has no MKs; beat 5's shape line, anchor sentence and source line all degrade rather than throw (decision 4)
- the serpentine and path geometry take any topic count

Three real bugs surfaced and were fixed doing that: `deckCard(0)` threw on an empty deal and blanked the round screen; beat 5's "הכנסת הפתיעה" line referenced a variable scoped to the cascade block; the source line assumed `issue.source`, which the sheet's issues do not have.

**Verified:** all 11 active issues play end to end, both issues of every 2-issue topic, **zero console errors**. Map at 393×852 shows 6 nodes, correct per-topic segment counts, `0/6`.

**Not started:** A1 intro spacing · A2 viewport bug · A4 HUD/exit/avatar · A5 round header · A6 immediate claim reveal · A7 tachles rework and law modal · A8 cascade prompt and guess mark · A9 rebuilt finale · A10 screenshots · **all of Part B.**

The A9 finale in particular still renders the old `tf_explain`/`bill_summary` prose and does not yet use `vote_result`, `glossary_terms` or `further_links` — the fields now exist in `data.js` but nothing reads them.

---

## 8. Post-review fixes (pre-commit)

### 8a. `m2` voteId / vote-record URL — restored

**The rule applied, not the instance.** I checked all 11 active issues for the pattern "`data.js` held a valid numeric `voteId` or a `vote.aspx` URL, and the sheet supplied display text or a non-vote page". **`m2` is the only one.**

| issue | voteId was → became | knesset_url was → became |
|---|---|---|
| **`m2`** | `41304` → `ההצבעה במליאה` → **restored `41304`** | `vote.aspx?voteId=41304` → press release → **restored** |
| `r1` `s1` `a1` | preserved throughout | `vote.aspx` preserved |
| `e3` `g1` `m3` | — | **gained** a `vote.aspx` URL (improvement) |
| `e4` `b3` | — | gained a `/bills/` page (not a vote page, but nothing lost) |
| `a2` | — | gained the Haaretz link (mislabelled, flagged, nothing lost) |
| `g3` | — | none before, none now |

**Why the importer let it through:** the voteId recovery only ran when the CSV cell was *empty* (`if not vid and voteid_link`). `m2`'s cell was non-empty — it held display text — so the recovery was skipped and the display text was written as the id. The knesset_url took the `קישור לכנסת` column, which on that row is a press release, while the real vote link sat as an anchor inside the `voteId` cell.

**Rule for any future import:** a sheet value replaces a `data.js` value only if the sheet value is *better formed* — a numeric id beats display text, a `vote.aspx` URL beats a press release. Never overwrite a valid id or vote-record URL with prose.

### 8b. `emoji`, `verification`, `source` on the five new issues

| field | read by | what the 5 new issues render |
|---|---|---|
| `emoji` | **`app.js:403`** (`issue-title`) and **`app.js:410`** (`tf-icon`). Not read by `proto.js` at all. | In the prototype: nothing, no effect. **In the shipped app: the literal string `undefined`** — `currentIssue.emoji+' '+currentIssue.title` concatenates it. A real defect, shipped-app only. |
| `verification` | **NOTHING. Zero readers** in `app.js`, `index.html`, `proto.js` or any stylesheet. | Nothing. It is a dead field on all 16 issues, not just the new ones. |
| `source` | `app.js:307-308`, `:437-438`, `:571-572` (all guarded by `if (currentIssue.source && …)`, so they degrade silently) and **`app.js:947`, a self-test that now FAILS**. `proto.js` no longer reads it — A9 made the source line optional. | Prototype: the source line is assembled from `further_links` + `knesset_url` instead. Shipped app: the `🔗 מקור` link is simply absent. |

**The `הצעה אמיתית בכנסת` badge is NOT driven by `verification`.** `app.js:454` sets `isStance = currentIssue.mode === 'stance'` and `:457` picks the badge from that. No active issue has `mode` — the only two that did (`g2`, `v2`) are retired — so **every active issue shows `🏛️ הצעה אמיתית בכנסת`, including the five new ones.** Nothing is silently missing it.

### 8c. `app.js` self-tests that now fail — for Roman

| line | test | why |
|---|---|---|
| `app.js:942` | `16 issues` | 21 rows now (11 active + 10 retired) |
| `app.js:944` | `every topic has 2 issues` | religion has 1 active; retired rows change the per-topic counts |
| `app.js:946` | `every issue has key pol` | the 5 new issues have an empty `politicians` array |
| `app.js:947` | `every issue has source` | the 5 new issues have no `source` |

`8 topics`, `every pol ref exists` and `glossary >15` still pass. These want rewriting against **active** issues.

### 8d. Beat-2 tally leak — CLOSED

Checked `bill_summary` on all 11 active issues against four tally patterns (`N מול N`, `N…בעד…N`, `עבר ב-N`, `N–N`). **No hits.** Two issues contain a 2–3 digit number and both are content, not counts:

- `e3` — `18`, the VAT rate (`עליית המע"מ ל-18%`)
- `a2` — `90`, the bill's own threshold (`90 ח"כים אישרו`)

Every vote count now lives in `vote_result`, which renders only at beat 5. **The law modal at beat 2 cannot leak a tally.**
