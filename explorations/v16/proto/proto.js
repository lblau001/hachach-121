/* =====================================================================
   הח״כ ה-121 — prototype round engine, s1.

   THE ARC (sheet §1.0, revised 29 Aug — verified against data.js):
     1 CLAIM     אמת/שקר   answered, NOT resolved
     2 POSITION  the player as the 121st MK, unscored
     3 CONTEXT   bill_title + bill_date ONLY
     4 CASCADE   one MK at a time, predict then instant verdict
     5 REVEAL    claim resolves · tally counts up · resolution · sources

   This file reads data.js and never writes to it. Copy is read out of
   data.js by id; anything Tamar has not written renders as a marked
   placeholder rather than as a guess.
   ===================================================================== */

const ISSUE_ID = 's1';
const ROOT     = '../../../';                 /* manifest paths are app-root relative */

/* §2 THE ORDER IS THE SPECTRUM, and this array is its single source.
   RTL renders index 0 rightmost, so this is  בעד · נמנע · נגד  on screen.
   Buttons, the strip's slots and stopPct() all read it, so the three can
   never disagree — and if they did, the player's token would land in the
   wrong slot. Putting נמנע in the middle makes travel distance MEAN
   something: 1 slot is partial disagreement (either side vs נמנע), 2
   slots is the opposite end (בעד vs נגד). */
const VOTES  = ['for', 'abstain', 'against'];
const VLABEL = { for: 'בעד', against: 'נגד', abstain: 'נמנע' };

/* ---------------------------------------------------------------------
   MOTION. Read from the stylesheet so there is exactly one source of
   truth for a duration: retuning a token retunes the JS with it.
   --------------------------------------------------------------------- */
const CS = getComputedStyle(document.documentElement);
/* A MISSING TOKEN USED TO RESOLVE TO ZERO IN SILENCE. --t-ov-swap was
   never actually added to :root last pass; ms() handed back 0, the JS
   wait became instant, and the CSS shorthand that also read it dropped
   to transition-duration:0s because a shorthand with no duration is
   invalid. Nothing threw and nothing looked wrong in the DOM — the
   classes toggled exactly as intended, on a 0ms transition. Now a token
   that is not there says so. */
const ms = n => {
  const v = CS.getPropertyValue(n).trim();
  if (!v) { console.warn('[proto] motion token ' + n + ' is not defined in :root'); return 0; }
  return parseFloat(v) || 0;
};
const T = {
  press:     ms('--t-press'),
  stamp:     ms('--t-stamp'),
  stampDrop: ms('--t-stamp-drop'),
  stampBleed:ms('--t-stamp-bleed'),
  flip:      ms('--t-flip'),
  swipe:     ms('--t-swipe'),
  finale:    ms('--t-finale'),
  get hold() { return ms('--t-hold'); },
  draw:      ms('--t-draw'),
  exit:      ms('--t-exit'),
  ovIn:      ms('--t-ov-in'),
  ovCollapse:ms('--t-ov-collapse'),
  ovSwap:    ms('--t-ov-swap'),
  b2Seat:    ms('--t-b2-seat'),
  cardFlip:  ms('--t-card-flip'),
  cardExit:  ms('--t-card-exit'),
  gxLock:    ms('--t-gx-lock'),
  gxHold:    ms('--t-gx-hold'),
  gxAppear:  ms('--t-gx-appear'),
  gxTravel1: ms('--t-gx-travel-1'),
  gxTravel2: ms('--t-gx-travel-2'),
  gxSettle:  ms('--t-gx-settle'),
  gxStampLag:ms('--t-gx-stamp-lag'),
  snapback:  ms('--t-snapback'),
  resolve:   ms('--t-resolve'),
  coin:      ms('--t-coin'),
  gateHint:  ms('--gate-hint'),
  gateGrow:  ms('--gate-grow')
};

/* ---------------------------------------------------------------------
   COIN TABLES — and the disagreement between them.

   'sheet'  §0.3 as audited, plus §1.4d. The claim pays only if correct;
            beat 2 pays NOTHING, because §1.4d is categorical: "beat 2 is
            never scored, never rewarded, never compared to a correct
            answer." Topic completion pays 100 — which the shipped code
            does not do at all.
   'brief'  the table confirmed in the brief: 25 for answering the claim,
            25 for taking a position, 25 per correct cascade guess. This
            is what app.js actually does today.

   CONSEQUENCE OF 'sheet', and it is a real one: a correct-only claim
   award cannot fire at beat 1, because paying out would resolve the
   claim four beats early. Under 'sheet' it is deferred to beat 5.
   --------------------------------------------------------------------- */
const COIN_TABLES = {
  sheet: { claim:25, claimNeedsCorrect:true,  position:0,  perCorrect:25, topic:100 },
  brief: { claim:25, claimNeedsCorrect:false, position:25, perCorrect:25, topic:0   }
};

/* ---------------------------------------------------------------------
   THE SPIKE'S OPEN DECISIONS. The switch bar is GONE from the screen —
   the game fills the viewport and nothing sits on top of it — so the
   switches live in the query string instead, defaulting to exactly what
   the bar defaulted to:

     ?hold=long|short        §1.2 the answer-first tempo. NOT SETTLED.
     ?swipe=true|false       true = dragging RIGHT means אמת; false flips
                             it. Goes to the teen playtest. UNRESOLVED.
     ?cards=N                #4d — the sheet says 3, the app deals 5
     ?placeholders=on|off    Tamar's unwritten copy, shown as markers

   b5 and coins were on the bar too and would otherwise become
   unreachable, so they read from the query string on the same terms.
   --------------------------------------------------------------------- */
const Q = new URLSearchParams(location.search);
/* an unknown or absent value falls back to the default rather than
   breaking the round — a mistyped switch must never blank the screen */
function qPick(key, map, dflt) {
  const v = (Q.get(key) || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(map, v) ? map[v] : dflt;
}
const DEV = {
  cards: (n => n > 0 ? n : 5)(parseInt(Q.get('cards'), 10)),
  swipe: qPick('swipe', { 'true':'R', 'false':'L' }, 'R'),
  b5:    qPick('b5',    { a1:'A1', a2:'A2' }, 'A1'),
  coins: qPick('coins', { sheet:'sheet', brief:'brief' }, 'sheet'),
  hold:  qPick('hold',  { long:'long', short:'short' }, 'long'),
  ph:    qPick('placeholders', { on:true, off:false }, false),
  /* §5 the pinned answer's presentation, for comparison in the hand:
     band = the full-width chyron, note = a small paper scrap at one side,
     off = nothing shown. The BOX is reserved in all three, so the card is
     the same size whichever is picked. */
  chyron: qPick('chyron', { band:'band', note:'note', off:'off' }, 'band')
};

let M = null;                       /* manifest.json                     */
let issue, topic, S;

/* ---------------------------------------------------------------------
   THE FIXED STAGE.
   --vh mirrors window.innerHeight for Safari builds without dvh, so the
   stage follows the chrome collapsing instead of assuming 844px.
   --card-scale shrinks the 620px card assembly to whatever height the
   round actually has, so a short phone never needs a scrollbar to see a
   whole card. Nothing in the app scrolls except .scrolls.
   --------------------------------------------------------------------- */
/* THE STACK IS THE CARD AND NOTHING ELSE. The axis strip is inside the
   card now and the stamp paints on top of it, so there is no box below
   the card to reserve — and the gate and the swipe hint are out of flow,
   so they cannot charge the card for their own height either. The card is
   the game: if reserving room for something else costs card size, the
   something else loses. */
const CARD_STACK_H = 620;

function sizeStage() {
  const d = document.documentElement;
  d.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
  const round = document.getElementById('round');
  const stack = document.querySelector('.stack');
  if (round && round.clientHeight && stack) {
    /* A TRANSFORM DOES NOT SHRINK LAYOUT. Scaling the stack made it LOOK
       like it fitted while the flex column still reserved the unscaled
       620px, so the stage overflowed the moment the viewport got shorter
       — which is what happens every time Safari's chrome comes back.
       Measure unscaled, then set the height to the SCALED height so the
       box the column reserves is the box the eye sees. */
    stack.style.transform = 'none';
    stack.style.height = '';
    const natural = stack.offsetHeight || CARD_STACK_H;
    const beat = stack.parentElement;
    /* WHAT THE CARD IS CHARGED FOR. Only siblings that are actually IN
       FLOW: an absolutely positioned one paints over the beat and takes
       none of its height, and a display:none one still reports a margin
       even though it occupies nothing — that margin alone was making the
       claim card 14px shorter than the cascade cards. The gate and the
       swipe hint are both out of flow now, so in practice this sums to
       zero and the card gets the whole round. */
    const others = [...beat.children]
      .filter(c => c !== stack)
      .reduce((a, c) => {
        const cs = getComputedStyle(c);
        if (cs.display === 'none' || cs.position === 'absolute') return a;
        return a + c.offsetHeight + (parseFloat(cs.marginTop) || 0);
      }, 0);
    /* clientHeight INCLUDES the round's own padding, but the stack lives
       inside .beat, which starts BELOW that padding — so scaling against
       it handed the card 26px it does not have and the card's foot hung
       past the stage on the shortest phone. Measure the content box.
       4px of slack absorbs sub-pixel rounding in the scale. */
    const rcs = getComputedStyle(round);
    const box = round.clientHeight
      - (parseFloat(rcs.paddingTop) || 0) - (parseFloat(rcs.paddingBottom) || 0);
    /* §3 the stack carries a bottom margin now, to sit the deck higher in
       the beat. It is the stack's OWN margin, so `others` never sees it —
       and uncounted it would push the card's foot past the stage on a
       short viewport. */
    const scs = getComputedStyle(stack);
    const stackM = (parseFloat(scs.marginTop) || 0) + (parseFloat(scs.marginBottom) || 0);
    const avail = Math.max(120, box - others - stackM - 4);
    const s = Math.min(1, avail / natural);
    stack.style.transform = 'scale(' + s.toFixed(4) + ')';
    stack.style.height = Math.round(natural * s) + 'px';
    d.style.setProperty('--card-scale', s.toFixed(4));
  }
  fitBeat();
}
/* beat 5 is the one screen whose content can outgrow the viewport. It is
   scaled to fit rather than made scrollable — only the map and character
   personalisation ever scroll. */
function fitBeat() {
  const fit = document.querySelector('.b5fit');
  if (!fit) return;
  fit.style.transform = '';
  const par = fit.parentElement, pcs = getComputedStyle(par);
  /* clientHeight INCLUDES padding; the child only gets the content box.
     Comparing against the padded figure let beat 5 hang 26px off the
     bottom of a short phone while believing it had fitted. */
  const avail = par.clientHeight
    - (parseFloat(pcs.paddingTop) || 0) - (parseFloat(pcs.paddingBottom) || 0);
  const need = fit.scrollHeight;
  if (need > avail && avail > 0) {
    fit.style.transform = 'scale(' + (avail / need).toFixed(4) + ')';
  }
}
addEventListener('resize', sizeStage);
addEventListener('orientationchange', () => setTimeout(sizeStage, 250));
if (window.visualViewport) visualViewport.addEventListener('resize', sizeStage);
/* belt and braces against rubber-band: the body never pans. The two
   surfaces that may (map, character) carry .scrolls and opt back in. */
addEventListener('touchmove', e => {
  if (!e.target.closest || !e.target.closest('.scrolls')) e.preventDefault();
}, { passive: false });

/* ===================== small helpers ================================ */
const $  = (s, r) => (r || document).querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t);
  if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
/* every forced pause in the round goes through here, so MACHINE TIME —
   the part of the 60s budget the game spends rather than the player — is
   measured rather than added up by hand. */
let machineMs = 0;
const wait = n => { machineMs += n; return new Promise(r => setTimeout(r, n)); };
const ph = t => '<span class="ph">' + esc(t) + '</span>';
const N  = n => '<span class="num">' + n + '</span>';

/* ---- glossary. Terms are marked INLINE where they already occur; no
        definition panel, and nothing is manufactured to hold one. ---- */
function markGlossary(text) {
  let out = esc(text);
  Object.keys(DATA.glossary || {})
    .sort((a, b) => b.length - a.length)
    .forEach(term => {
      const t = esc(term);
      if (out.indexOf(t) < 0 || out.indexOf('data-gt="' + t) >= 0) return;
      out = out.replace(t, '<span class="gt" data-gt="' + t + '">' + t + '</span>');
    });
  return out;
}

/* ---- AV-3, the player's avatar sticker. Round, faceless, no name
        plate: the three devices that keep the player readable as NOT
        one of the 120. ------------------------------------------------ */
const AV3 = `<svg viewBox="0 0 100 100" aria-hidden="true">
<defs><clipPath id="c-av3"><circle cx="50" cy="50" r="48"/></clipPath></defs>
<circle cx="50" cy="50" r="48" fill="#C9BFA6"/>
<g clip-path="url(#c-av3)">
<path d="M22 100 v-9 a28 28 0 0 1 56 0 v9 z" fill="#22c98e" stroke="#131310" stroke-width="3.4" stroke-linejoin="round"/>
<rect x="44" y="55" width="12" height="10" fill="#c68b5c" stroke="#131310" stroke-width="3.4"/>
<circle cx="50" cy="40" r="21" fill="#c68b5c" stroke="#131310" stroke-width="3.4"/>
<path d="M29 36 a21 21 0 0 1 42 0 q-10 -7 -21 -7 t-21 7 z" fill="#161310" stroke="#131310" stroke-width="3.4" stroke-linejoin="round"/>
<path d="M29 36 a21 21 0 0 1 42 0 q-10 -7 -21 -7 t-21 7 z" fill="none" stroke="#FBF7EE" stroke-width="2.2" stroke-linejoin="round" opacity=".9"/>
</g>
<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1.6"/></svg>`;

/* ---- the initials badge. First letter of each part of the SHIPPED
        name, so it cannot drift from it. NEVER another MK's face. ---- */
function initials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('״');
}

/* ===================== state ======================================== */
function newRound() {
  issue = DATA.issues.find(i => i.id === ISSUE_ID);
  topic = DATA.topics.find(t => t.id === issue.topic);

  /* the deal, mirroring app.js:370-376 — key MKs always in, then a
     shuffled fill. The pile is counted from THIS array, never from
     issue.politicians, or a back promises a card that never arrives. */
  const key  = issue.politicians.filter(p => p.key);
  const rest = issue.politicians.filter(p => !p.key);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0; [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const target = Math.min(DEV.cards, issue.politicians.length);
  const dealt  = key.concat(rest).slice(0, Math.max(target, key.length));
  for (let i = dealt.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0; [dealt[i], dealt[j]] = [dealt[j], dealt[i]];
  }

  S = {
    beat: 1, claim: null, position: null,
    dealt, ci: 0, guesses: {}, phase: 'predict',
    coins: 0, t0: 0, awarded: {}
  };
  machineMs = 0;
}

/* ---- coins. Every award is a visible increment at an award event.
        No variable ratio, no jackpot register, no flourish. -------- */
function award(n) {
  if (!n) return;
  const chip = $('.hud-coins'), out = $('#coinNum');
  const from = S.coins, to = S.coins + n, t0 = performance.now();
  S.coins = to;
  chip.classList.add('is-awarding');
  (function tick(now) {
    const k = Math.min(1, (now - t0) / T.coin);
    out.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
    else { out.textContent = to; chip.classList.remove('is-awarding'); }
  })(t0);
}

/* ===================== the commit gate · §1.6 ======================= */
/* Advance is disabled until committed. Unfilled reads YELLOW and the
   instruction escalates on idle. There is no error state, and the
   escalation never lands on one of the three options — colouring one
   would break "three, always identical" and leak an answer.          */
/* ONE HELPER LINE FOR THE WHOLE ROUND, and it is not a gate.
   There were three yellow pills: beat 1 telling the player to pick one of
   two buttons, beat 2 telling them to pick one of three, beat 4 telling
   them to guess. The first two named what the buttons already say — two
   answers and three votes are self-evident — and all three were the
   loudest thing on a screen whose point is the card. Gone.
   What survives is a single line on the FIRST MK card only, because the
   cascade is the one beat whose question is not written on its controls.
   Plain type on the ground, low contrast, between the HUD and the chyron:
   not a pill, not on the card, not over a button. Its box is reserved on
   every beat so switching it on cannot resize the card. */
function helper(text) {
  const h = $('#helper');
  if (!h) return;
  h.textContent = text || '';
  h.classList.toggle('is-empty', !text);
}

/* ===================== the pinned claim · the chyron ================= */
/* Enters the chrome at beat 2 WITH the consent line and persists to the
   end of the round. The one element continuously on screen for the whole
   round, so it is the round's load-bearing identity object.

   IT IS A BAND, NOT A CHIP. As a pill it was the same shape and weight as
   the coin chip opposite it, so it read as a status pip rather than as
   the player's held commitment — and being absolutely positioned over the
   play area it sat ON the card and clipped the first letter of the MK's
   name (איתמר בן-גביר rendering as יתמר בן-גביר). The chyron is in FLOW
   between the HUD and the round, so it cannot overlap the card at any
   viewport: the card's top edge starts below it, by construction.

   The element itself lives in index.html and is never created or removed,
   only filled and emptied — see .chyron.is-empty for why it keeps its box
   on beat 1.                                                           */
function pin(word) {
  const c = $('#chyron');
  c.classList.remove('is-empty');
  c.removeAttribute('aria-hidden');
  /* PLACEHOLDER COPY. "אמרת:" is ours, not Tamar's, so it carries the
     placeholder marker; the answer word beside it is the player's real
     answer out of S.claim and stays whatever the final copy turns out to
     be. The word is NEVER coloured by which way it points — אמת and שקר
     get exactly the same treatment, or the band starts scoring the claim
     four beats before the round resolves it. */
  /* §3d NO AVATAR. The HUD already carries the player's sticker; a second
     copy of it inside the band was saying who twice and crowding the one
     thing the band exists to hold. */
  c.innerHTML =
    '<span class="chyron-line">' + ph('אמרת:') +
      '<b>' + esc(word) + '</b></span>';
  return c;
}
/* the round re-renders on every beat; the chyron is outside #round and
   survives that, but the call is kept so a beat can never render without
   it having been asserted */
function repin() { if (S.claim) pin(S.claim === 'true' ? 'אמת' : 'שקר'); }

/* ===================== THE DECK ===================================== */
/* ONE ISSUE, ONE DECK, AND NOTHING IS EVER SUBSTITUTED. The next card is
   already lying in the deck, face down, under the card the player is
   looking at; it becomes the top card by being TURNED OVER. No card in
   the round appears from nowhere.

   A deck card is a flipper: one element carrying a back and a front,
   rotated in 3D. The front is in the DOM from the moment the card is
   dealt but is never visible — backface-visibility hides it — so the
   flip has nothing to load, and the overlay at beats 2 and 3 sits over a
   card BACK rather than over a blurred MK face, which is what used to
   leak a portrait a beat before the cascade revealed it. */
function deckCard(i) {
  const p = S.dealt[i], pol = DATA.politicians[p.id], art = M.politicians[p.id];
  const d = el('div', 'deckcard is-next');
  d.dataset.i = i;
  const back  = el('div', 'cardback');
  const front = el('article', 'mf-b mkcard');
  front.innerHTML =
    '<span class="mf-b__halo"></span>' +
    (art
      ? '<img class="mf-b__port" src="' + ROOT + art['400'] + '" alt="">'
      : '<span class="mf-b__badge">' + esc(initials(pol.name)) + '</span>') +
    /* §1.4b the party label STAYS. Hiding it dumps the complexity on a
       17-year-old as noise — Tesler's Law. The fix for a boring round
       is curation, not concealment. */
    '<div class="mf-b__id"><h2>' + esc(pol.name) + '</h2><p>' + esc(pol.party) + '</p></div>';
  d.append(back, front);
  return d;
}
/* the backs drawn BEHIND the face-down card: everything still in the deck
   after it, capped at what .pile draws. Counted from the dealt sample so
   a back never promises a card that does not arrive. */
function setPile(afterIndex) {
  const pile = $('.pile');
  if (pile) pile.innerHTML =
    '<i></i>'.repeat(Math.min(4, Math.max(0, S.dealt.length - afterIndex - 1)));
}
function currentCard() {
  const d = $('.deckcard.is-current');
  return d ? $('.mf-b', d) : null;
}
/* THE TURN. The face-down top card rotates to its front, and the card
   after it joins the deck face down underneath in the same motion, so
   there is always a next card visible under the active one. */
async function flipUp() {
  const wrap = $('.cardwrap');
  const d = $('.deckcard.is-next', wrap);
  if (!d) return null;
  const i = +d.dataset.i;
  d.classList.remove('is-next');
  d.classList.add('is-current');
  if (i + 1 < S.dealt.length) {
    const nxt = deckCard(i + 1);
    wrap.insertBefore(nxt, d);        /* earlier in the DOM = underneath */
  }
  setPile(i + 1);
  await wait(T.cardFlip);
  return $('.mf-b', d);
}
/* the resolved card is swiped off the stack. The stamp rides with it —
   it is parented to .cardwrap, not to the card, so it has to be told. */
function leaveCard() {
  const cur = $('.deckcard.is-current'), st = $('.d2');
  /* d2-land holds transform:scale(1) with fill:both, which would win
     against a transition; the animation has finished landing by now. */
  if (st) { st.style.animation = 'none'; st.classList.add('is-leaving'); }
  if (cur) cur.classList.add('is-leaving');
}

/* ===================== BEAT 1 · THE CLAIM =========================== */
/* B1-B developed: the claim card IS the MK card — same .mf-b, same
   340x620, with the issue's own graphic where the portrait goes.      */
function beat1() {
  S.beat = 1; S.t0 = performance.now();
  const art = M.issues[issue.id];
  const r = $('#round');
  r.innerHTML = '';
  const b = el('div', 'beat b1');

  const stack = el('div', 'stack');
  const wrap = el('div', 'cardwrap');
  const pile = el('span', 'pile');
  /* THE FIRST MK CARD IS ALREADY HERE, face down, under the claim. When
     the claim leaves it is not replaced — it is uncovered. */
  const next = deckCard(0);
  const card = el('article', 'mf-b b1card');
  card.innerHTML =
    '<div class="b1art"><img src="' + ROOT + art.file + '" alt="" width="' + art.w + '" height="' + art.h + '"></div>' +
    '<p class="b1claim">' + esc(issue.tf) + '</p>' +
    /* data-label is the fill layer's copy — see .b1ans .v-a::after. It is
       the SAME string as the button's own text and must stay that way. */
    '<div class="v-a-row b1ans">' +
      '<button class="v-a" data-ans="true"  data-label="אמת">אמת</button>' +
      '<button class="v-a" data-ans="false" data-label="שקר">שקר</button>' +
    '</div>' +
    /* §2.1 the preview pill lives INSIDE the card so it travels with it.
       It carries the WORD ALONE. It used to read "DRAG שקר": Latin caps
       in a Hebrew-first UI, and debug scaffolding that survived into the
       frames. With the card face and the button also naming the answer
       the same word was on screen three times during one drag. */
    '<div class="b1prev"><b></b></div>' +
    /* the reveal wash, on the card's leading edge. NO LABEL: the wash is
       the direction, the button is the word. */
    '<div class="b1target"></div>';

  wrap.append(pile, next, card);
  stack.appendChild(wrap);
  b.appendChild(stack);

  /* the swipe hint is unwritten copy — the line that says both work.
     data-ph marks the HOST, so hiding it leaves no empty line behind. */
  const hint = el('p', 'b1hint', ph('[טקסט — תמר: החלקה או הקשה, שתיהן עובדות]'));
  hint.setAttribute('data-ph', '');
  b.appendChild(hint);

  r.appendChild(b);
  setPile(0);
  /* NO INSTRUCTION LINE. Two buttons that say אמת and שקר do not need a
     third element telling the player to choose one of them. */
  helper('');
  sizeStage();

  wireSwipe(card, $('.b1target', card), $('.b1prev', card));

  /* §2.2 THE BUTTON IS THE GESTURE'S TWIN, so it looks like the gesture:
     the tap runs the same preview and the same fling, in the direction
     that answer sits in under the current mapping. One code path. */
  card.querySelectorAll('[data-ans]').forEach(btn =>
    btn.addEventListener('click', () => {
      const dir = card._swipe.dirFor(btn.dataset.ans);
      card._swipe.show(dir * 999);        /* preview at full, leading side */
      commitClaim(btn.dataset.ans, card, dir);
    }));
}

/* §2.2 dual input. Release below threshold snaps back with no penalty. */
function wireSwipe(card, tgt, prev) {
  const TH = 110;                      /* the commit threshold, in px    */
  const FADE = 0.40;                   /* §2.1 label reaches 100% at 40% */
  let sx = 0, dx = 0, on = false;
  /* dragging toward this edge is אמת. ONE variable, not two layouts —
     and it changes which ANSWER a direction means, never which side the
     reveal comes from. */
  const trueDir = DEV.swipe === 'R' ? 1 : -1;

  const ansFor = d => (d * trueDir > 0) ? 'true' : 'false';
  const dirFor = a => (a === 'true' ? trueDir : -trueDir);

  /* PHYSICAL left/right on purpose. The logical properties invert under
     dir=rtl, which is exactly how the reveal ended up on the wrong side:
     the card went one way and the panel appeared on the other. */
  /* the two answer buttons, which are also the drag's readout */
  const ansBtns = [...card.querySelectorAll('[data-ans]')];

  const show = d => {
    const a = ansFor(d), k = Math.min(1, Math.abs(d) / (TH * FADE));
    const right = d > 0;                       /* moving toward the right */
    $('b', prev).textContent   = a === 'true' ? 'אמת' : 'שקר';
    /* same ink both directions — the preview names the word, never which
       one is the "good" answer, because neither of them is */
    tgt.style.opacity = k;
    tgt.classList.toggle('b1target--right', right);
    tgt.classList.toggle('b1target--left', !right);
    prev.style.opacity = k;
    /* the pill sits on the TRAILING edge — the wash already carries the
       direction on the side you are going to. */
    prev.style.left  = right ? '14px' : 'auto';
    prev.style.right = right ? 'auto' : '14px';
    /* §2.2 THE BUTTON IS THE DRAG'S READOUT. The answer the gesture is
       currently choosing fills solid --ink on the SAME ramp as the pill's
       opacity, so it is fully solid by the time the commit threshold is
       reached. The other button is not touched: not dimmed, not shrunk,
       not faded. Only --fill moves, and --fill changes no geometry, so
       the two stay identical in size and weight for the whole drag. */
    ansBtns.forEach(b =>
      b.style.setProperty('--fill', b.dataset.ans === a ? k : 0));
  };
  const clear = () => { tgt.style.opacity = 0; prev.style.opacity = 0;
    ansBtns.forEach(b => b.style.setProperty('--fill', 0)); };
  card._swipe = { show, dirFor, clear };

  /* the card assembly is scaled to fit short phones, so a finger moving
     dx screen-px must move the card dx screen-px, not dx * scale */
  const scale = () => parseFloat(CS.getPropertyValue('--card-scale')) || 1;
  const px = e => e.touches ? e.touches[0].clientX : e.clientX;

  const down = e => { if (S.claim || e.target.closest('.v-a')) return;
    on = true; sx = px(e); card.classList.add('is-dragging'); };
  const move = e => { if (!on) return;
    dx = px(e) - sx;
    /* ONLY THE TOP CARD TRANSFORMS. The stage, the pile and the ground
       are never touched. */
    const k = dx / scale();
    card.style.transform = 'translateX(' + k + 'px) rotate(' + (k / 25) + 'deg)';
    show(dx); };
  const up = () => {
    if (!on) return; on = false; card.classList.remove('is-dragging');
    if (Math.abs(dx) > TH) { commitClaim(ansFor(dx), card, Math.sign(dx)); }
    else {                        /* below threshold: snap back, no penalty,
                                     no error state, nothing is scored */
      card.classList.add('is-snapping'); card.style.transform = '';
      clear();
      setTimeout(() => card.classList.remove('is-snapping'), T.snapback);
    }
    dx = 0;
  };
  card.addEventListener('pointerdown', down);
  card.addEventListener('pointermove', move);
  card.addEventListener('pointerup', up);
  card.addEventListener('pointercancel', up);
  card.addEventListener('pointerleave', up);
}

async function commitClaim(ans, card, dir) {
  if (S.claim) return;
  S.claim = ans;
  card.querySelectorAll('.v-a').forEach(b => b.disabled = true);

  const table = COIN_TABLES[DEV.coins];
  /* under 'sheet' this is deferred to beat 5: paying out on correctness
     here would resolve the claim four beats early */
  if (!table.claimNeedsCorrect) award(table.claim);

  /* §1.2 the answer sits alone before anything else happens */
  await wait(T.hold);

  /* ONE exit, whether the card was thrown or the button was tapped.
     Same class, same distance, same duration, same easing. */
  card.classList.add('is-leaving');
  card.style.transform = 'translateX(' + (dir * 620) + 'px) rotate(' + (dir * 25) + 'deg)';
  card.style.opacity = 0;
  await wait(T.swipe);
  /* the claim card is GONE, not hidden — what is under it was always
     under it, and is now simply the top of the deck */
  card.remove();
  beat2();
}

/* ============= BEATS 2 AND 3 · ONE OVERLAY, TWO CONTENTS ============ */
/* THE DECK IS ONE ISSUE. Every card in the round belongs to the same
   issue and they are ONE deck: the claim card on top, the MK cards
   stacked under it from the first frame. Beat 2 is not a card in that
   deck — it asks the player's OPINION, not their knowledge — so it
   floats outside it, on a blurred surface, with the deck legible
   underneath at full card size and in the deck's own position.

   THE SURFACE IS CREATED ONCE AND PERSISTS THROUGH BEAT 3. The backdrop
   never blinks, never re-renders and never moves; only the content
   changes. On commit the vote pane travels UP and out while the bill
   pane arrives from BELOW, both on the same blur, in the same geometry.
   Two overlays doing this were two blurs, and the seam between them
   read as a page load.                                                */
function beat2() {
  S.beat = 2;
  /* NOTHING IS RE-RENDERED HERE. The deck is already on screen and the
     claim card has left it; what shows through the blur is the deck's
     own top card, face down, at full card size in its own position. */
  /* the pinned answer enters HERE, with the consent line */
  pin(S.claim === 'true' ? 'אמת' : 'שקר');

  /* THE OVERLAY IS A CHILD OF .stage, NOT OF THE BEAT. Anchored to the
     beat it stopped at the round's padding and the dot-grid ground showed
     through at every border. At stage level the blur reaches the edges
     and the safe areas; the HUD and the chyron sit above it. */
  const ov = el('div', 'ov ov--stage');
  ov.innerHTML =
    '<div class="ovpane ovpane--vote">' +
      '<div class="ov-inner">' +
        /* the chair is height-capped against the viewport and never
           cropped: it is the game's emblem and a cut one reads as a bug */
        /* §4 THE CHAIR IS THE BEAT. It is the seat the player is being
           asked to take, so it is the largest thing on the surface, and
           the confirmation lands ON it rather than beside it — one
           object, not an illustration with a caption under it. */
        '<div class="b2seat">' +
          '<img class="b2chair" src="' + ROOT + M.props.chair['300'] + '" alt="">' +
          '<p class="b2taken" aria-live="polite"></p>' +
        '</div>' +
        '<p class="b2q">איך הייתם מצביעים?</p>' +
        '<p class="b2bill">' + esc(issue.bill_title) + '</p>' +
        '<div class="v-a-row b2votes">' +
          VOTES.map(v => '<button class="v-a" data-vote="' + v + '">' + VLABEL[v] + '</button>').join('') +
        '</div>' +
        '<p class="b2consent">את התוצאה נגלה בסוף ›</p>' +
      '</div>' +
    '</div>' +
    '<div class="ovpane ovpane--bill is-below">' +
      '<div class="ov-inner b3inner">' +
        '<p class="b3title">' + esc(issue.bill_title) + '</p>' +
        '<span class="b3date">' + esc(issue.bill_date) + '</span>' +
        '<p class="b3go" data-ph>' + ph('[טקסט — תמר: רמז לסגירה]') + '</p>' +
      '</div>' +
    '</div>';
  $('#stage').appendChild(ov);

  /* NO INSTRUCTION LINE. Three vote chips are the instruction. */

  ov.querySelectorAll('[data-vote]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (S.position) return;
      S.position = btn.dataset.vote;
      ov.querySelectorAll('.v-a').forEach(x => x.disabled = true);
      const table = COIN_TABLES[DEV.coins];
      award(table.position);                    /* 0 under 'sheet' §1.4d */

      /* §4 THE PLAYER TAKES THE SEAT. The chosen vote leaves the row and
         lands on the chair as one large object; the other two recede but
         stay on screen, because the round never hides the options it
         offered. PLACEHOLDER COPY — "בחרת:" is ours, pending the client's
         sign-off, so it carries the marker. */
      $('.b2taken', ov).innerHTML =
        ph('בחרת:') + '<b>' + esc(VLABEL[btn.dataset.vote]) + '</b>';
      btn.classList.add('is-chosen');
      $('.ovpane--vote', ov).classList.add('is-taken');
      await wait(T.b2Seat);

      /* §1.2 the choice sits alone before the surface moves */
      await wait(T.hold);
      beat3(ov);
    }));
}

/* ===================== BEAT 3 · THE BILL ============================ */
/* bill_title + bill_date ONLY, on the surface beat 2 already put up, over
   the MK card the bill is about. No new backdrop: the content swaps on
   the one that is already there. Dismiss COLLAPSES INTO the card. */
async function beat3(ov) {
  S.beat = 3;
  const vote = $('.ovpane--vote', ov), bill = $('.ovpane--bill', ov);
  /* the swap. Both panes move on the same tick and the same duration, so
     the eye reads one surface whose content travelled rather than two
     surfaces trading places. */
  vote.classList.add('is-above');
  bill.classList.remove('is-below');

  /* the dismiss is armed only AFTER the bill has arrived, or the tap that
     answered beat 2 would carry straight through and skip the bill */
  await wait(T.ovSwap);
  ov.classList.add('is-dismissable');
  ov.addEventListener('click', async () => {
    ov.classList.add('ov--collapse');
    await wait(T.ovCollapse);
    ov.remove();
    S.beat = 4;
    /* the card the overlay was sitting on turns over in front of the
       player. It is the same element, not a replacement. */
    await flipUp();
    armPredict(true);          /* first card of the round: helper line */
  }, { once:true });
}

/* ===================== BEAT 4 · THE CASCADE ========================= */
function armPredict(first) {
  S.phase = 'predict';
  const card = currentCard();
  if (!card) return;
  const foot = el('div', 'v-a-row mf-b__foot');
  /* §H VOTE ORDER IS FIXED: בעד first, so in RTL it is rightmost. The
     order is VOTES', and VOTES is not reordered anywhere. */
  foot.innerHTML = VOTES.map(v =>
    '<button class="v-a" data-pred="' + v + '">' + VLABEL[v] + '</button>').join('');
  card.appendChild(foot);

  /* the one surviving helper line, on the FIRST card of the round only.
     Cards 2..n never carry it: by then the player has done this. */
  helper(first ? 'מה הוא/היא הצביע/ה?' : '');

  foot.querySelectorAll('[data-pred]').forEach(btn =>
    btn.addEventListener('click', () => verdict(btn.dataset.pred, foot, card)));
}

async function verdict(guess, foot, card) {
  if (S.phase !== 'predict') return;
  S.phase = 'verdict';
  helper('');
  const p = S.dealt[S.ci];
  S.guesses[p.id] = guess;
  const ok = guess === p.vote;

  foot.querySelectorAll('.v-a').forEach(b => b.disabled = true);

  /* §1.2 the player's choice sits alone before the truth arrives */
  await wait(T.hold);
  foot.remove();

  /* the basis marker — provenance, not commentary. bloc has no label in
     data.js, so it renders as a placeholder rather than an invention. */
  const idBox = $('.mf-b__id', card);
  const basis = el('p', 'mf-b__basis');
  basis.style.cssText = 'margin:4px 0 0;font-size:11px;font-weight:700;color:#3E3627;' +
    'width:fit-content;background:rgba(216,201,168,.86);padding:1px 8px 2px';
  basis.innerHTML = p.basis === 'bloc' ? ph('[תווית — תמר: basis=bloc]') : 'הצבעה מתועדת';
  idBox.appendChild(basis);

  /* THE AXIS IS INSIDE THE CARD, at its foot. Absolutely positioned, so
     it adds nothing to the card's box and cannot re-scale it. */
  const g = axis(guess, p);
  card.appendChild(g);
  await runAxis(g, guess, p.vote);

  /* THE STAMP IS ONE PLANE, ON TOP. Parented to .cardwrap rather than the
     card because .mf-b carries overflow:hidden and would cut it at the
     edge, and because the card is a 3D flipper — a stamp inside it would
     be mirrored by the rotation. */
  $('.cardwrap').appendChild(stamp(ok));
  card.classList.add('is-stamped');
  inkBleed();

  const table = COIN_TABLES[DEV.coins];
  if (ok) setTimeout(() => award(table.perCorrect), T.stamp);

  await wait(T.stamp + T.flip);

  /* THE RESOLVED CARD IS SWIPED OFF, then the next one turns over. The
     player never sees a card replaced in place. */
  S.ci++;
  leaveCard();
  await wait(T.cardExit);
  if (S.ci >= S.dealt.length) return beat5();
  const spent = $('.deckcard.is-leaving'); if (spent) spent.remove();
  const spentStamp = $('.d2.is-leaving');  if (spentStamp) spentStamp.remove();
  await flipUp();
  armPredict(false);
}

/* ---- the guess-vs-reality axis. The payload of the beat. -------------
   It is BUILT EMPTY and then played: the strip is a small piece of
   narration, not a readout that arrives already true. See runAxis(). */
const stopPct = v => +(((VOTES.indexOf(v) * 2 + 1) / 6) * 100).toFixed(3);

function axis(guess, p) {
  const pol = DATA.politicians[p.id], art = M.politicians[p.id];
  const g = el('div', 'gx');
  g.innerHTML =
    '<div class="gx-track">' +
      '<span class="gx-fill"></span>' +
      '<span class="gx-m gx-you is-landing" style="right:' + stopPct(guess) + '%">' +
        '<span class="as-d">' + AV3 + '</span></span>' +
      /* THE MK TOKEN STARTS IN THE PLAYER'S SLOT, not in its own. The
         comparison begins where the player put it and travels from
         there; starting it at the answer would state the answer before
         the strip has said anything. */
      '<span class="gx-m gx-mk is-hidden" style="right:' + stopPct(guess) + '%">' +
        (art ? '<img class="gx-port" src="' + ROOT + art['128'] + '" alt="">'
             : '<span class="gx-badge">' + esc(initials(pol.name)) + '</span>') +
      '</span>' +
    '</div>' +
    '<div class="gx-stops">' + VOTES.map(v => '<i>' + VLABEL[v] + '</i>').join('') + '</div>';
  return g;
}

/* the strip, played out. Every duration is a token; see :root. */
async function runAxis(g, guess, vote) {
  const you  = $('.gx-you', g), mk = $('.gx-mk', g), fill = $('.gx-fill', g);
  /* 1 · the player's token locks into the slot the player chose.
         A FORCED REFLOW, NOT requestAnimationFrame. rAF does not fire in
         a backgrounded tab, so the class never came off and the token
         stayed at opacity:0 — and the awaited rAF further down never
         resolved at all, which left the round stuck in the verdict with
         no stamp, permanently. Reading a layout property flushes the
         pending style synchronously and gives the transition its "from". */
  void g.offsetWidth;
  you.classList.remove('is-landing');
  await wait(T.gxLock);
  /* 2 · and sits there. Nothing moves. This pause is the whole reason
         the strip reads as a comparison rather than as a result. */
  await wait(T.gxHold);
  /* 3 · the MK's token appears in the PLAYER'S slot */
  mk.classList.remove('is-hidden');
  await wait(T.gxAppear);
  /* 4 · the fill travels to where the MK actually voted and carries the
         token with it. DISTANCE-PROPORTIONAL on one easing, so two slots
         of disagreement feel like twice one slot rather than like the
         same event with a different endpoint. */
  const dist = Math.abs(VOTES.indexOf(vote) - VOTES.indexOf(guess));
  const from = stopPct(guess), to = stopPct(vote);
  if (!dist) {
    /* agreement: there is nowhere to travel. A zero-length fill reads as
       a bug, so the pair settles in place instead and the player's token
       takes the badge treatment that keeps both readable in one slot. */
    you.classList.add('is-paired');
    mk.classList.add('is-paired-mk');
    g.classList.add('is-agreed');
    await wait(T.gxSettle);
  } else {
    const dur = dist === 1 ? T.gxTravel1 : T.gxTravel2;
    /* RTL: the fill grows FROM the player's stop. Anchoring the edge the
       growth STARTS at is what makes it read right-to-left when it runs
       that way — anchored at the far end it slides in from the wrong
       side and reads as an arrival rather than as a journey. */
    if (to > from) { fill.style.right = from + '%';        fill.style.left  = 'auto'; }
    else           { fill.style.left  = (100 - from) + '%'; fill.style.right = 'auto'; }
    fill.style.transition = 'width ' + dur + 'ms var(--e-settle)';
    mk.style.transition   = 'right ' + dur + 'ms var(--e-settle)';
    void fill.offsetWidth;            /* flush, so 0 is the "from" width */
    fill.style.width = Math.abs(to - from) + '%';
    mk.style.right   = to + '%';
    await wait(dur);
  }
  /* 5 · the stamp lands after the token has settled, not with it */
  await wait(T.gxStampLag);
}

/* D2 · the verdict stamp. Correctness only — neither ink appears
   anywhere near בעד, נגד or נמנע, and neither changes with which way
   the MK voted.

   EVERY MARK IS PRINTED BY THE SAME STAMP. The ring, the two circles and
   the centre word all live inside ONE <g filter="url(#ink)">, so they
   take the same ink colour (currentColor), the same displacement, the
   same dry-brush holes and the same rupture at contact. The centre word
   used to be an HTML <span> sitting on top of an SVG graphic: clean UI
   type inside a distressed disc, which read as a label pasted onto a
   stamp rather than as something the stamp printed.

   PLACEHOLDER COPY, AWAITING THE CLIENT'S SIGN-OFF. These strings and no
   others; do not author alternatives.

   HARD RULE, from the locked guardrails: THE PLAYER NEVER FAILS. Never
   "טעית", never "לא נכון", never any string that puts the player in the
   subject position of an error. "הופתעת" is something that happened TO
   the player, which is the whole point.

   The ring string is unwritten copy as well and is the plainest possible
   marker for it — it is not a verdict and says nothing about the player. */
const D2_COPY_PLACEHOLDER = {
  correct:  'צדקת',
  surprise: 'הופתעת',
  ring:     'טקסט טבעת'
};

function stamp(ok) {
  const word = ok ? D2_COPY_PLACEHOLDER.correct : D2_COPY_PLACEHOLDER.surprise;
  const s = el('span', 'd2 ' + (ok ? 'd2--correct' : 'd2--surprise'));
  /* the disc is aria-hidden, so the word has to be announced by the host */
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', word);
  s.innerHTML =
    '<svg class="d2__art" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g filter="url(#ink)">' +
        '<circle cx="50" cy="50" r="45.5" stroke-width="6"></circle>' +
        '<circle cx="50" cy="50" r="38" stroke-width="2.2"></circle>' +
        '<text class="d2__ring">' +
          '<textPath href="#d2ring" startOffset="50%" text-anchor="middle">' +
            esc(D2_COPY_PLACEHOLDER.ring) + '</textPath></text>' +
        '<text class="d2__word" x="50" y="50" text-anchor="middle" ' +
          'dominant-baseline="central">' + esc(word) + '</text>' +
      '</g></svg>';
  return s;
}

/* the ink ruptures AT CONTACT — 0 to full across --t-stamp-bleed,
   starting at --t-stamp-drop — rather than arriving already distressed */
function inkBleed() {
  const d = $('#inkDisp');
  d.setAttribute('scale', 0);
  setTimeout(() => {
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / T.stampBleed);
      d.setAttribute('scale', (2.2 * k).toFixed(2));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }, T.stampDrop);
}

/* ===================== BEAT 5 · THE REVEAL ========================== */
/* B5-A. LESS on screen, in a strict order. §8 forbids >1 number at the
   emotional peak, so the tally counts up ALONE and the score and the
   coins arrive only after it has settled.                             */
async function beat5() {
  S.beat = 5;
  const r = $('#round'); r.innerHTML = '';
  const outer = el('div', 'beat b5 b5-' + DEV.b5.toLowerCase());
  const b = el('div', 'b5fit');
  outer.appendChild(b);
  r.appendChild(outer);
  repin();

  const correctClaim = issue.tf_answer === 'partial' || S.claim === issue.tf_answer;
  const truth = issue.tf_answer === 'true' ? 'אמת'
              : issue.tf_answer === 'false' ? 'שקר' : 'חלקית';

  /* ---- 1. the chyron HOLDS. It used to flip in place to the truth; how
             the band resolves is the next pass's decision, so for now it
             simply stays, unchanged, saying what the player said. The
             beat still spends the moment — the truth arrives in the panel
             below rather than in the band. --------------------------- */
  repin();
  await wait(T.resolve);

  /* ---- 2. the count and the resolution. The round's held peak. ---- */
  const tally = issue._tally || null;
  const panel = el('div', 'b5panel b5stage' + (tally ? '' : ' b5-nocount'));
  panel.innerHTML =
    '<div class="b5lead">' +
      (tally ? '<span class="b5count num" id="b5count">0–0</span>' : '') +
      '<span class="b5res">' + esc(truth) + '</span>' +
    '</div>' +
    (tally ? '<p class="b5outcome">הכנסת: ' +
        (tally.for > tally.against ? 'העבירה' : 'דחתה') + '</p>'
           : '<p class="b5outcome">' + ph('[טקסט — תמר: מה מחליף את הספירה]') + '</p>');
  b.appendChild(panel);
  requestAnimationFrame(() => { panel.classList.add('is-in'); fitBeat(); });

  if (tally) { await countUp($('#b5count', panel), tally); await wait(T.hold); }
  else await wait(T.flip);

  /* ---- 3. §1.4c THE 121st VOTE. Compared to the OUTCOME only. ----- */
  if (tally) {
    const mine = { for: tally.for, against: tally.against };
    if (S.position === 'for') mine.for++;
    if (S.position === 'against') mine.against++;
    const you = el('div', 'b5you b5stage');
    you.innerHTML =
      '<span class="as-d">' + AV3 + '</span>' +
      '<span>ההצעה עברה ' + N(tally.for + '–' + tally.against) +
      '. עם הקול שלכם: ' + N(mine.for + '–' + mine.against) + '.</span>';
    b.appendChild(you);
    requestAnimationFrame(() => { you.classList.add('is-in'); fitBeat(); });
    await wait(T.flip);
  }

  /* ---- 4. §1.8 the SHAPE of the guess, narrated before the score.
             Describes the pattern; never characterises the guesser. -- */
  const n = S.dealt.length;
  const hits = S.dealt.filter(d => S.guesses[d.id] === d.vote).length;
  const counts = {}; VOTES.forEach(v => counts[v] = 0);
  S.dealt.forEach(d => counts[S.guesses[d.id]]++);
  const spread = VOTES.filter(v => counts[v]).map(v => VLABEL[v] + ' ב-' + counts[v]);
  const shape = el('p', 'b5shape b5stage');
  shape.innerHTML =
    (spread.length === 1
      ? 'ניחשתם ' + spread[0] + ' — אותה הצבעה בכל ' + N(n) + ' הכרטיסים.'
      : 'ניחשתם ' + spread.join(', ') + '.') +
    ' ב-' + N(hits + ' מתוך ' + n) + ' זה היה נכון.';
  b.appendChild(shape);
  requestAnimationFrame(() => { shape.classList.add('is-in'); fitBeat(); });
  await wait(T.flip);

  /* ---- 5. §1.1 the unfinished sentence, completed. Verb + count.
             Never editorialise the completion. --------------------- */
  /* the sentence completes on the round's ANCHOR — the MK data.js flags
     key:true — not on whichever card the shuffle dealt first. On s1 that is
     Ben-Gvir, whose own law it is. Verb + count, and nothing added: §1.1
     forbids editorialising the completion. */
  const anchor = S.dealt.find(d => d.key) || S.dealt[0];
  const withMk = S.dealt.filter(d => d.vote === anchor.vote).length;
  const sent = el('p', 'b5sentence b5stage');
  sent.innerHTML = 'בהצבעה על ' + esc(issue.bill_title) + ', ' +
    esc(DATA.politicians[anchor.id].name) + ' הצביע/ה ' +
    VLABEL[anchor.vote] + ' — יחד עם ' + N(withMk - 1) + ' מתוך ' + N(n - 1) +
    ' האחרים שראיתם.';
  b.appendChild(sent);
  requestAnimationFrame(() => { sent.classList.add('is-in'); fitBeat(); });

  /* ---- 6. the explanation, then sources as ONE line. ------------- */
  const exp = el('p', 'b5exp b5stage', markGlossary(issue.tf_explain));
  b.appendChild(exp);
  requestAnimationFrame(() => { exp.classList.add('is-in'); fitBeat(); });

  const src = el('p', 'b5src b5stage');
  src.innerHTML = '🔗 מקור: <a href="' + esc(issue.source.url) + '" target="_blank" rel="noopener">' +
    esc(issue.source.name) + '</a>' +
    (issue.knesset_url ? ' · <a href="' + esc(issue.knesset_url) +
      '" target="_blank" rel="noopener">🏛️ הצבעה רשמית בכנסת</a>' : '');
  b.appendChild(src);
  requestAnimationFrame(() => { src.classList.add('is-in'); fitBeat(); });

  /* the glossary opens INLINE, where the term already occurs. */
  b.addEventListener('click', e => {
    const t = e.target.closest('.gt'); if (!t) return;
    if (t.nextElementSibling && t.nextElementSibling.classList.contains('gdef')) {
      return t.nextElementSibling.remove();
    }
    const d = el('p', 'gdef', '<b>' + esc(t.dataset.gt) + '</b> — ' + esc(DATA.glossary[t.dataset.gt]));
    t.after(d);
  });

  /* ---- 7. the deferred claim award, last, away from the peak. ---- */
  const table = COIN_TABLES[DEV.coins];
  if (table.claimNeedsCorrect && correctClaim) { await wait(T.flip); award(table.claim); }

  /* §1.3 wrongness has an author and it is not the player. */
  if (!correctClaim) {
    const line = el('p', 'b5shape b5stage');
    line.style.color = '#EFECE4';
    line.textContent = 'הכנסת הפתיעה אתכם.';
    b.insertBefore(line, shape);
    requestAnimationFrame(() => { line.classList.add('is-in'); fitBeat(); });
  }

  fitBeat();
  const go = el('button', 'p-c b5go b5stage', 'חזרה למפה ›');
  go.addEventListener('click', start);          /* the map arrives in step 2 */
  b.appendChild(go);
  requestAnimationFrame(() => { go.classList.add('is-in'); fitBeat(); });

  /* the 60s budget, still measured — it just has nowhere on screen to go
     now that the spike bar is off the stage */
  S.machineS = +(machineMs / 1000).toFixed(1);
  S.wallS    = +((performance.now() - S.t0) / 1000).toFixed(1);
}

/* the count-up. ~--t-finale regardless of magnitude, ease-out. */
function countUp(node, tally) {
  return new Promise(res => {
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / T.finale);
      const e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(tally.for * e) + '–' + Math.round(tally.against * e);
      if (k < 1) requestAnimationFrame(tick);
      else { node.textContent = tally.for + '–' + tally.against; res(); }
    })(t0);
  });
}

/* the harness reads these; nothing in the round does */
Object.defineProperty(window, 'S',   { get: () => S });
Object.defineProperty(window, 'DEV', { get: () => DEV });

/* ===================== boot ========================================= */
function start() {
  applyDev();
  helper('');
  /* §B the topic the issue belongs to, from data.js, centred in the HUD
     and present on every beat — the round is one issue inside one topic
     and the HUD is the only thing on screen that can say which. */
  /* the chyron is emptied, never removed: it holds its box on beat 1 so
     the card is the same size before and after the answer is given */
  const c = $('#chyron');
  c.innerHTML = ''; c.classList.add('is-empty'); c.setAttribute('aria-hidden', 'true');
  $('#coinNum').textContent = '0';
  $('#hudAvatar').innerHTML = AV3;
  newRound();
  /* after newRound(), which is what resolves `issue` */
  const t = $('#hudTopic');
  if (t) t.textContent = topicLabel();
  beat1();
  sizeStage();
}

/* the topic's own label out of data.js. topic is resolved in newRound(),
   so this is read after it, never before. */
function topicLabel() {
  const tp = DATA.topics.find(x => x.id === issue.topic);
  return tp ? tp.label : '';
}

function applyDev() {
  document.documentElement.dataset.hold = DEV.hold;
  document.documentElement.dataset.chyron = DEV.chyron;
  document.body.classList.toggle('no-ph', !DEV.ph);
}


fetch('../prototype/manifest.json')
  .then(r => r.json())
  .then(j => { M = j;
    /* THE CARD BACK'S ARTWORK, from the manifest like every other asset —
       props.card_back, added to make_manifest.py when the set was
       reframed. The literal is a fallback for a manifest generated before
       that entry existed; it is not the path in use. */
    const back = (M.props.card_back && (M.props.card_back.file || M.props.card_back['390']))
               || 'assets/card_background.webp';
    document.documentElement.style.setProperty('--cardback-art',
      'url("' + ROOT + back + '")');
    sizeStage(); start(); })
  .catch(() => {
    $('#round').innerHTML =
      '<p style="color:#EFECE4;font-weight:700;line-height:1.5">' +
      'manifest.json could not be read. Serve the repo over http — ' +
      '<code style="direction:ltr">python3 -m http.server 8000</code> — ' +
      'and open <code style="direction:ltr">/explorations/v16/proto/</code>.</p>';
  });
