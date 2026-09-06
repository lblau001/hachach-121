# הח"כ ה-121 — The 121st MK

A browser game about the Knesset for first-time voters. Players predict how
real MKs actually voted, then see the record.

Live old: https://romangash-star.github.io/hachach-121/
Live new: https://romangash-star.github.io/hachach-121/explorations/v16/proto/

Static site — no build step, no framework, no dependencies. Hebrew, RTL, mobile-first.

---

## Running locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

To test on a phone on the same Wi-Fi:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
ipconfig getifaddr en0        # macOS — gives you the IP
```

Then `http://<that-ip>:8000` on the phone. Use `http`, not `https`.

Opening `index.html` directly with `file://` will not work — the stylesheets
and scripts won't load.

---

## Structure

```
index.html                 markup only — 5 screen sections
styles/
  base.css                 @font-face, :root tokens, reset, shared components
  intro.css                #intro
  avatar.css               #avatar + profile
  home.css                 #home (topic map)
  issue.css                #issue
  celebrate.css            #celebrate
  overrides.css            cross-cutting overrides — MUST LOAD LAST
app.js                     game logic, screen routing, state
data.js                    DATA (topics, politicians, issues, glossary) + AVATARS
fonts/
  SimplerPro_HLAR-Black.woff2
```

The five screens are `#intro`, `#avatar`, `#home`, `#issue`, `#celebrate`.

---

## ⚠️ overrides.css must load last

`styles/overrides.css` holds three cross-cutting blocks — the Gen-Z flow polish,
the mobile safe-area handling, and the Civic Pulse dark theme. They restyle
intro, avatar, home, issue and celebrate together.

**65 selectors in this file also appear in the per-screen files at identical
specificity.** The override layer wins only because it loads last.

Move its `<link>` earlier in `index.html` and the dark theme and the safe-area
padding silently revert. No error, no console warning — it just looks wrong.

If you add a new stylesheet, add it *above* `overrides.css`.

---

## Who owns what

| Area | Owner |
|---|---|
| `app.js`, `data.js` — logic, state, content | Roman |
| `styles/`, markup in `index.html` — presentation | Lion |

Work on a branch per screen or flow, open a PR, don't push to `master`.
`master` auto-deploys to GitHub Pages, so a merge is a live deploy.

---

## Gotchas

**The font only ships weight 900.** `SimplerPro_HLAR-Black` is a single Black
weight. The CSS references 300, 400, 500, 600 and 700 in places — those are
either synthesised by the browser or falling back. In Hebrew this is subtle
enough to miss.

**CSS `url()` resolves relative to the stylesheet, not the document.** The
`@font-face` in `styles/base.css` uses `../fonts/…` for this reason. Same
applies to any image or asset path added to a file under `styles/`.

**Two design layers are stacked.** The per-screen files carry the original
design; `overrides.css` restyles them on top. When changing a screen's
appearance, check both — a value edited in the screen file may be overridden
further down.
