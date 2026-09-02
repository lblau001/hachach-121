# Raster asset audit

Measured, not listed. The *renders at* column comes from driving the prototype through
every screen and every beat at 393x852 and 430x932 and reading each element's
`getBoundingClientRect()` against its `naturalWidth`. Nothing is read off a stylesheet.

`DPR` is intrinsic / largest CSS size on the file's driving dimension. **Target is 3.00.**
Inline SVG (the AV-3 avatar, the verdict stamp, the HUD glyphs) is vector: no target, skipped.

The shipped app (`index.html` + `app.js`) requests **no repo raster at all** — `mkAvatar()`
falls back to an initials badge because `window.MK_PHOTO_BASE` is unset. Every asset below
is consumed by the prototype only, so "used nowhere" is measured against it.

## 1 - Assets the running app requests

| file | intrinsic | KB | largest render (CSS) | DPR before | DPR after | action |
|---|---|---|---|---|---|---|
| `mk/mk_<id>_<native>.webp` x21 | 474x632 .. 723x964 | 62-125 | **401.2x534** claim + cascade cards (`.mf-b__port` = `width:118%` of a 340px card; `--card-scale` only shrinks it) | 1.00 | **1.18 - 1.80** | **new, native crop** |
| `mk/mk_<id>_400.webp` x21 | 400x533 | 57-74 | was the above; now fallback only | 1.00 | - | kept, byte-identical |
| `mk/mk_<id>_128.webp` x21 | 128x171 | 7-11 | **37.5x48.5** guess-vs-reality strip (`.gx-port`) | 3.41 | 3.41 | above target already |
| `card_background.webp` | 1536x2752 | 1322 | **387.3x644.6** cascade-axis; **359.8x630.7** beat1-g1(topic-fallback), beat1-s1(art) | - | 4.27 | **over target** - see report |
| `mk/internal_sec_s1_900.webp` | 900x539 | 132 | **300x180** beat1-s1(art) | - | 3.00 | **new** - 3x the claim slot |
| `mk/knesset_building_1170.webp` | 1170x780 | 153 | **390x260** intro | - | 3.00 | **new** - 3x the intro art |
| `mk/knesset_chair_900.webp` | 900x1050 | 129 | **288.5x336.6** bill; **282.8x330** law-modal, tachles | - | 3.12 | **new** - 3x the seat |
| `topics/<topic>_256.webp` x8 | 246x256 | 17 | **42.8x44.5** map, map-top | - | 5.75 | unchanged |
| `topics/<topic>_384.webp` x8 | 205x384 | 32 | **68x128** beat1-e3(topic-fallback) | was on the 128 (DPR 1.00) | 3.01 | unchanged |

## 2 - Assets nothing requests

Masters *should* be unreferenced - they are what the tools read. The rest are not.
The 21 portraits' `_400` and `_128` are covered by the class rows above and not repeated.

| file | intrinsic | KB | role | why |
|---|---|---|---|---|
| `mk/ bengvir_styleA.webp` | 832x1248 | 221 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/ bengvir_styleB.webp` | 832x1248 | 156 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/abbas.webp` | 832x1248 | 261 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/ben_gvir.webp` | 832x1248 | 200 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/bengvir_styleA_128.webp` | 128x171 | 11 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/bengvir_styleA_400.webp` | 400x534 | 90 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/bengvir_styleA_master.png` | 628x838 | 1002 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/bengvir_styleB_128.webp` | 128x171 | 9 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/bengvir_styleB_400.webp` | 400x534 | 75 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/bengvir_styleB_master.png` | 628x838 | 854 | style comparison | the styleA/styleB decision is long made; `ben_gvir` ships from its own source |
| `mk/deri.webp` | 832x1248 | 168 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/edelstein.webp` | 832x1248 | 313 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/eisenkot.webp` | 832x1248 | 323 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/elkin.webp` | 832x1248 | 302 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/gafni.webp` | 832x1248 | 300 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/galant.webp` | 832x1248 | 298 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/gantz.webp` | 832x1248 | 208 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/gotliv.webp` | 832x1248 | 300 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/internal_sec_main.png` | 2048x2048 | 2110 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/internal_sec_main_102.webp` | 64x102 | 3 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_main_128.webp` | 80x128 | 4 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_main_204.webp` | 128x204 | 8 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_main_40.webp` | 25x40 | 1 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_main_52.webp` | 33x52 | 1 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_main_64.webp` | 40x64 | 2 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_main_70.webp` | 44x70 | 2 | export | the padlock, retired from the map in an earlier pass |
| `mk/internal_sec_s1.png` | 2048x2048 | 3216 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/internal_sec_s1_128.webp` | 128x77 | 4 | export | superseded by the 900; kept as `small` |
| `mk/internal_sec_s1_300.webp` | 300x180 | 14 | export | superseded by the 900; kept as `small` |
| `mk/internal_sec_s2.png` | 2048x2048 | 2312 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/internal_sec_s2_210.webp` | 116x210 | 9 | export | `s2` is `active:false`, so that round is unreachable |
| `mk/internal_sec_s2_84.webp` | 46x84 | 3 | export | `s2` is `active:false`, so that round is unreachable |
| `mk/knesset_building_390.webp` | 390x260 | 26 | export | superseded by the 3x export; kept as fallback |
| `mk/knesset_chair_128.webp` | 128x149 | 7 | export | manifest names it, no call site reads it |
| `mk/knesset_chair_300.webp` | 300x350 | 25 | export | superseded by the 3x export; kept as fallback |
| `mk/knessetbuilding.webp` | 2496x1664 | 358 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/knessetchair.webp` | 1536x2048 | 120 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/lahav.webp` | 832x1248 | 274 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/lapid.webp` | 832x1248 | 179 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/lazimi.webp` | 848x1264 | 361 | master, no data.js id | a portrait for somebody not in `data.js` `politicians` |
| `mk/levin.webp` | 832x1248 | 267 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/liberman.webp` | 832x1248 | 294 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/may_golan.webp` | 832x1248 | 407 | master, no data.js id | a portrait for somebody not in `data.js` `politicians` |
| `mk/michaeli.webp` | 832x1248 | 283 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/netanyahu.webp` | 848x1264 | 285 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/odeh.webp` | 848x1264 | 252 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/ohanah.webp` | 832x1248 | 305 | master, no data.js id | a portrait for somebody not in `data.js` `politicians` |
| `mk/policehat.webp` | 2048x2048 | 481 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/saar.webp` | 832x1248 | 294 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/silman.webp` | 832x1248 | 251 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/smotrich.webp` | 832x1248 | 296 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/son_harmelech.webp` | 832x1248 | 363 | master | read by frame_mk.py / prep_topic.py - correct |
| `mk/topic_police_128.webp` | 128x84 | 5 | export | superseded by `assets/topics/policehat_*` |
| `mk/topic_police_300.webp` | 300x196 | 18 | export | superseded by `assets/topics/policehat_*` |
| `mk/troper.webp` | 832x1248 | 294 | master, no data.js id | a portrait for somebody not in `data.js` `politicians` |
| `mk-test/ bengvir_styleA.webp` | 832x1248 | 221 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/ bengvir_styleB.webp` | 832x1248 | 156 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/bengvir_styleA_128.webp` | 128x171 | 11 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/bengvir_styleA_400.webp` | 400x534 | 90 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/bengvir_styleA_master.png` | 628x838 | 1002 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/bengvir_styleB_128.webp` | 128x171 | 9 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/bengvir_styleB_400.webp` | 400x534 | 75 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `mk-test/bengvir_styleB_master.png` | 628x838 | 854 | duplicate dir | `assets/mk-test/` is a byte-for-byte copy of six files already in `assets/mk/` |
| `topics/accountability_128.webp` | 123x128 | 6 | export | no call site found |
| `topics/accountability_384.webp` | 370x384 | 36 | export | no call site found |
| `topics/accountability_40.webp` | 39x40 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/accountability_52.webp` | 50x52 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/accountability_64.webp` | 62x64 | 3 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/accountability_main.webp` | 2048x2048 | 767 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/branches_128.webp` | 82x128 | 4 | export | no call site found |
| `topics/branches_384.webp` | 247x384 | 19 | export | no call site found |
| `topics/branches_40.webp` | 26x40 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/branches_52.webp` | 33x52 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/branches_64.webp` | 41x64 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/branches_main.webp` | 2048x2048 | 626 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/economy_128.webp` | 68x128 | 5 | export | no call site found |
| `topics/economy_40.webp` | 21x40 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/economy_52.webp` | 28x52 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/economy_64.webp` | 34x64 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/economy_main.webp` | 2048x2048 | 708 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/environment_128.webp` | 82x128 | 6 | export | `environment` has no active issue, so the node never draws |
| `topics/environment_256.webp` | 163x256 | 16 | export | `environment` has no active issue, so the node never draws |
| `topics/environment_384.webp` | 245x384 | 34 | export | `environment` has no active issue, so the node never draws |
| `topics/environment_40.webp` | 26x40 | 2 | export | `environment` has no active issue, so the node never draws |
| `topics/environment_52.webp` | 33x52 | 2 | export | `environment` has no active issue, so the node never draws |
| `topics/environment_64.webp` | 41x64 | 3 | export | `environment` has no active issue, so the node never draws |
| `topics/environment_main.webp` | 2048x2048 | 687 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/gender_128.webp` | 128x112 | 7 | export | no call site found |
| `topics/gender_40.webp` | 40x35 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/gender_52.webp` | 52x46 | 3 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/gender_64.webp` | 64x56 | 3 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/gender_main.webp` | 2048x2048 | 469 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/internal_sec_main.webp` | 2048x2048 | 999 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/military_128.webp` | 128x122 | 5 | export | no call site found |
| `topics/military_384.webp` | 384x366 | 47 | export | no call site found |
| `topics/military_40.webp` | 40x38 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/military_52.webp` | 52x50 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/military_64.webp` | 64x61 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/military_main.webp` | 2048x2048 | 1002 | master | read by frame_mk.py / prep_topic.py - correct |
| `topics/policehat_128.webp` | 128x84 | 5 | export | no call site found |
| `topics/policehat_384.webp` | 384x251 | 31 | export | no call site found |
| `topics/policehat_40.webp` | 40x26 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/policehat_52.webp` | 52x34 | 1 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/policehat_64.webp` | 64x42 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/religion_128.webp` | 94x128 | 6 | export | no call site found |
| `topics/religion_384.webp` | 282x384 | 38 | export | no call site found |
| `topics/religion_40.webp` | 29x40 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/religion_52.webp` | 38x52 | 2 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/religion_64.webp` | 47x64 | 3 | export | under DPR-3 a 40-64px file serves a 13-21px display; there is none |
| `topics/religion_main.webp` | 2048x2048 | 818 | master | read by frame_mk.py / prep_topic.py - correct |

### What the unreferenced bytes actually are

| category | files | MB | keep? |
|---|---|---|---|
| masters | 35 | 19.91 | **yes** - the tools read them |
| orphan masters | 4 | 1.33 | ask - four portraits for people not in `data.js` |
| mk-test duplicate dir | 8 | 2.36 | **no** - byte-for-byte duplicate of files in `assets/mk/` |
| style comparison | 8 | 2.36 | **no** - the decision is made |
| dead / superseded exports | 55 | 0.43 | ask - padlock, `s2`, `environment`, `topic_police_*`, the 40/52/64 icon sizes |
| **total unreferenced** | **110** | **26.39** | |

Nothing is deleted here: deleting an asset is a separate decision from re-sizing one.
