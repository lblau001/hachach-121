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
  coinFly:     ms('--t-coin-fly'),
  coinStagger: ms('--t-coin-stagger'),
  nodePress:   ms('--t-node-press'),
  screen:      ms('--t-screen'),
  mapIn:       ms('--t-map-in'),
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
  chyron: qPick('chyron', { band:'band', note:'note', off:'off' }, 'band'),

  /* §7 THE DEMO DEEP-LINK. Jump straight to a screen in a meeting without
     playing up to it. Every other switch above keeps working from any of
     the three, because they are all read once, here, before any screen is
     built. Default is the intro — the app has a front door now. */
  screen: qPick('screen', { intro:'intro', map:'map', round:'round' }, 'intro'),

  /* THE BONUS MARKER HAS NO DATA TO BIND TO — see hasBonus(). This forces
     it on so the treatment can be looked at; it invents no issue and
     changes no count. */
  bonusDemo: (Q.get('bonus') || '') === 'demo'
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
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
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

/* ===================== HAPTICS · §5 ================================
   navigator.vibrate behind a capability check, and that check is the whole
   feature on half the devices this ships to: iOS SAFARI DOES NOT IMPLEMENT
   THE VIBRATION API AT ALL. On an iPhone every call here is a no-op — not
   a silent failure to fix, just absent. It is testable on Android only.

   Three events, and only three. A press is 10ms, the drag crossing its
   commit threshold is 10ms — the same event, felt at the moment the
   gesture becomes a decision — and the verdict stamp landing is 25ms,
   because it is the one moment the game asserts something.

   NOTHING ON BEAT 2, and not because it would be a small buzz: beat 2 is
   the player's own opinion, §1.4d says it is never scored and never
   rewarded, and a haptic is the most primitive reward the phone has.
   Buzzing there would say "good answer" to a question that has none. */
const CAN_BUZZ = typeof navigator !== 'undefined' &&
                 typeof navigator.vibrate === 'function';
function buzz(ms) {
  if (!CAN_BUZZ) return;
  if (S && S.beat === 2) return;            /* §5 categorical */
  try { navigator.vibrate(ms); } catch (e) {}
}
/* one call site for every pressable thing, so the rule cannot be applied
   to some buttons and forgotten on others */
function pressable(node) { node.addEventListener('pointerdown', () => buzz(10)); return node; }

/* ===================== COINS · §0.3 and §4 =========================
   THE WALLET OUTLIVES THE ROUND. S.coins is the round's own tally and is
   reset by newRound(); the number in the HUD is the player's total across
   the session, because the map is now the thing you come back to and a
   count that reset on every round would be a bug in front of a client.

   THE AWARD IS SPAWNED AT THE POINT IT WAS EARNED (§4): the stamp on an MK
   card, the verdict on the claim card — never from a fixed corner, because
   a coin that appears in the corner is a number changing, and a coin that
   leaves the stamp is a thing being paid for. Amounts are NOT invented
   here: they come from COIN_TABLES above, which is the ?coins= mode.       */
let wallet = 0;

/* 3 to 5 tokens. Enough to read as a handful, few enough to arrive before
   the beat moves on; scaled by the size of the award so +100 is visibly
   more than +25 without anyone having to read the number. */
const coinCount = n => Math.max(3, Math.min(5, Math.round(n / 25) + 2));

function award(n, from) {
  if (!n) return;
  const chip = $('.hud-coins'), out = $('#coinNum');
  const to = wallet + n;
  if (S) S.coins += n;             /* the round's own tally; null on the map */

  /* WITHOUT AN ORIGIN IT IS STILL A COUNT-UP, not a flight. Awards that
     have no point on screen to leave from — the deferred claim payout at
     beat 5 — must not fake one. */
  const pts = from ? coinFlight(from, chip, coinCount(n)) : null;
  if (!pts) { countCoins(out, wallet, to, T.coin); wallet = to; chip.classList.add('is-awarding');
              setTimeout(() => chip.classList.remove('is-awarding'), T.coin); return; }

  /* THE CHIP COUNTS UP AS THEY LAND, not before them and not after: each
     token carries its own share of the award and pays it in on arrival. */
  const share = n / pts.length;
  let paid = 0, landed = 0;
  pts.forEach((tok, i) => {
    tok.onLand = () => {
      landed++;
      paid = (landed === pts.length) ? n : Math.round(share * landed);
      out.textContent = wallet + paid;
      chip.classList.remove('is-landing'); void chip.offsetWidth;
      chip.classList.add('is-landing');    /* a small pop PER arrival */
      if (landed === pts.length) { wallet = to; out.textContent = to; }
    };
  });
}

/* the plain count-up, for an award with no origin */
function countCoins(out, from, to, dur) {
  const t0 = performance.now();
  (function tick(now) {
    const k = Math.min(1, (now - t0) / dur);
    out.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick); else out.textContent = to;
  })(t0);
}

/* ---- the flight ----------------------------------------------------
   ~450ms per token, ~40ms apart, ease-out, on an arc — and the SHAPE of
   that arc is the §4 rule "never fires over the payload" made geometric.

   THE STRAIGHT LINE IS THE PROBLEM. The stamp lands at the card's foot on
   the leading side and the coin chip sits at the top of the opposite side,
   so a straight flight — and a shallow bow either way — runs diagonally
   across the middle of the card, which is exactly where the portrait is.
   Measured on s1 at 393x852, the mid-point of that line lands at (184,350)
   and the portrait occupies (90..350, 240..415): straight through a face.

   SO IT GOES OUT, UP AND IN. Both control points sit in the GUTTER beside
   the card — the ~14px of ground between the card's edge and the stage —
   which turns the path into an S: the token leaves the stamp sideways,
   climbs the gutter clear of the artwork, and cuts in to the chip across
   the empty strip ABOVE the card. It touches the card only in its blank
   outer margin, never the portrait, the name plate or the stamp it just
   left. It is also fired AFTER the verdict has landed at every call site,
   so it follows the payload rather than racing it.                      */
const GUTTER = 14;

function coinFlight(from, chip, count) {
  const layer = $('#coinfly'); if (!layer || !from || !chip) return null;
  const box = layer.getBoundingClientRect();
  const a   = from.getBoundingClientRect();
  const b   = chip.getBoundingClientRect();
  if (!a.width || !b.width) return null;

  const x0 = a.left + a.width / 2 - box.left, y0 = a.top + a.height / 2 - box.top;
  const x1 = b.left + b.width / 2 - box.left, y1 = b.top + b.height / 2 - box.top;
  /* the gutter on the side the award happened, not the side the chip is on:
     leaving is the half of the trip that has a card in the way */
  const gx = (x0 < box.width / 2) ? GUTTER : box.width - GUTTER;

  const toks = [];
  for (let i = 0; i < count; i++) {
    const t = el('i', 'coin-t');
    /* a handful, not a stack: each token leaves from a slightly different
       point on the award and takes a slightly wider or tighter line */
    const jx = (Math.random() - 0.5) * 26, jy = (Math.random() - 0.5) * 26;
    const g  = gx + (Math.random() - 0.5) * 16;
    t.style.transform = 'translate(' + (x0 + jx - 9.5) + 'px,' + (y0 + jy - 9.5) + 'px)';
    layer.appendChild(t);
    toks.push(t);
    flyOne(t, x0 + jx, y0 + jy, x1, y1, g, i * T.coinStagger, toks, i);
  }
  return toks;
}

/* a cubic whose two control points are both in the gutter: c1 level with
   the award, c2 level with the chip. Out, up, in. */
function flyOne(node, x0, y0, x1, y1, gx, delay, toks, idx) {
  setTimeout(() => {
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / T.coinFly);
      const e = 1 - Math.pow(1 - k, 3);                  /* ease-out */
      const m = 1 - e, m2 = m * m, e2 = e * e;
      const x = m2 * m * x0 + 3 * m2 * e * gx + 3 * m * e2 * gx + e2 * e * x1;
      const y = m2 * m * y0 + 3 * m2 * e * y0 + 3 * m * e2 * y1 + e2 * e * y1;
      node.style.transform = 'translate(' + (x - 9.5) + 'px,' + (y - 9.5) + 'px) scale(' +
        (1 - 0.25 * e).toFixed(3) + ')';
      node.style.opacity = k > 0.9 ? String((1 - k) * 10) : '1';
      if (k < 1) requestAnimationFrame(tick);
      else { node.remove(); const t = toks[idx]; if (t && t.onLand) t.onLand(); }
    })(t0);
  }, delay);
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
    pressable(btn).addEventListener('click', () => {
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
  let crossed = false;
  const move = e => { if (!on) return;
    dx = px(e) - sx;
    /* §5 THE MOMENT THE GESTURE BECOMES A DECISION. Once per drag, on the
       crossing itself — not on every frame past it, which would be a
       rattle rather than a signal. It fires on the way in and re-arms on
       the way back out, so a drag that hesitates on the line says so. */
    const over = Math.abs(dx) > TH;
    if (over !== crossed) { crossed = over; if (over) buzz(10); }
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
     here would resolve the claim four beats early. Under 'brief' it pays
     now, and the point of the award is the answer that was just given —
     there is no verdict on screen at beat 1 to leave from. */
  if (!table.claimNeedsCorrect) {
    award(table.claim, card.querySelector('[data-ans="' + ans + '"]') || card);
  }

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
      /* BEAT 2 EARNS NOTHING, IN EVERY MODE. It used to pay
         COIN_TABLES[mode].position, which is 0 under 'sheet' but 25 under
         'brief' because that is what app.js does. The rule is now
         categorical — §1.4d, and restated in this pass's brief — so the
         award is gone rather than made conditional, and there is no path
         through the switch that pays for an opinion.
         `brief.position: 25` STAYS IN THE TABLE. The table is the record
         of what each source says, not a list of things that fire; leaving
         the row is how the disagreement stays visible. Nothing reads it. */

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
    pressable(btn).addEventListener('click', () => verdict(btn.dataset.pred, foot, card)));
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
  const mark = stamp(ok);
  $('.cardwrap').appendChild(mark);
  card.classList.add('is-stamped');
  inkBleed();
  /* §5 25ms AT CONTACT, not when the stamp is appended: --t-stamp-drop is
     the frame the disc actually hits the card, and the jolt is keyed to
     the same number. The buzz and the hit are one event or neither. */
  setTimeout(() => buzz(25), T.stampDrop);

  const table = COIN_TABLES[DEV.coins];
  /* §4 THE COINS LEAVE THE STAMP. Fired after the stamp has fully landed
     (T.stamp), so the flight follows the verdict rather than crossing it,
     and spawned AT the mark so the award has a place it came from. */
  if (ok) setTimeout(() => award(table.perCorrect, mark), T.stamp);

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

   THE CENTRE WORD IS HTML, NOT SVG <text>. WebKit lays Hebrew out
   left-to-right inside SVG text — confirmed on device and reproduced in a
   WebKit build here — and no bidi property changes it, so the one route
   that cannot fail is to stop asking SVG to shape Hebrew at all. The disc,
   the two circles and the ink stay SVG; the word is a <span dir="rtl">,
   where bidi is correct in every engine.
   IT IS STILL PRINTED BY THE SAME STAMP. It sits inside .d2, so it lands,
   scales and rotates with the disc as one object; it takes the disc's
   currentColor and the display face at 900; and it carries #ink-h, which
   is #ink rescaled to CSS px, driven off the same clock by inkBleed(). It
   is not type layered on a graphic — it is the same ink.

   THE RING TEXT IS GONE, keeping the ring as a graphic band. Curved text
   has no HTML equivalent that does not hand-place glyphs in visual order,
   which is the source-string reversal we are refusing; leaving it as SVG
   would leave it reversed on iOS. An illegible ring is worse than none.

   PLACEHOLDER COPY, AWAITING THE CLIENT'S SIGN-OFF. These strings and no
   others; do not author alternatives.

   HARD RULE, from the locked guardrails: THE PLAYER NEVER FAILS. Never
   "טעית", never "לא נכון", never any string that puts the player in the
   subject position of an error. "הופתעת" is something that happened TO
   the player, which is the whole point.

   `ring` is retired with the ring text and is not read anywhere. */
const D2_COPY_PLACEHOLDER = {
  correct:  'צדקת',
  surprise: 'הופתעת'
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
      '</g></svg>' +
    '<span class="d2__word" dir="rtl">' + esc(word) + '</span>';
  return s;
}

/* the ink ruptures AT CONTACT — 0 to full across --t-stamp-bleed,
   starting at --t-stamp-drop — rather than arriving already distressed */
/* BOTH displacement maps run off this one clock. #ink works in the art's
   viewBox units and #ink-h in CSS px, so the same rupture is 2.2 there and
   2.2 * 1.9 here — the disc and the word break up at one rate. */
const INK_PX = 190 / 100;              /* .d2 is 190px; the viewBox is 100 */
function inkBleed() {
  const d = $('#inkDisp'), h = $('#inkDispH');
  d.setAttribute('scale', 0);
  h.setAttribute('scale', 0);
  setTimeout(() => {
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / T.stampBleed);
      d.setAttribute('scale', (2.2 * k).toFixed(2));
      h.setAttribute('scale', (2.2 * INK_PX * k).toFixed(2));
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
  /* §4 it leaves THE VERDICT ON THE CLAIM — .b5res is where the round
     finally says what was true — rather than appearing in the corner. */
  if (table.claimNeedsCorrect && correctClaim) {
    await wait(T.flip); award(table.claim, $('.b5res') || null);
  }

  /* §1.3 wrongness has an author and it is not the player. */
  if (!correctClaim) {
    const line = el('p', 'b5shape b5stage');
    line.style.color = '#EFECE4';
    line.textContent = 'הכנסת הפתיעה אתכם.';
    b.insertBefore(line, shape);
    requestAnimationFrame(() => { line.classList.add('is-in'); fitBeat(); });
  }

  /* THE ISSUE IS RECORDED, and it is one issue and not a topic. s1 is
     `core:true` in internal_sec, so this fills SEGMENT 1 of that node's
     ring and nothing else: the headline stays 0/8 and no check appears,
     because the topic is not complete until s2 is played too. Awarding
     topic-complete here is exactly the "הושלם feels like a lie" failure
     §3.2 exists to prevent. */
  PROGRESS[issue.id] = true;

  fitBeat();
  const go = el('button', 'p-c b5go b5stage', 'חזרה למפה ›');
  go.addEventListener('click', () => goMap());
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

/* =====================================================================
   THE PROGRESS MODEL · §3.2, and the one place the data did not answer.

   WHAT IS ACTUALLY IN data.js: 16 issues, exactly 2 per topic, and ONE
   boolean — `core`. It is true on the first issue of every topic and false
   on the second. There is no third issue anywhere and no field that says
   "bonus". So the fields available to distinguish a bonus issue from a
   non-bonus one are: `core`, and nothing else.

   THE TWO READINGS OF `core:false`, and they are incompatible:
     app.js  treats it as THE BONUS. x/8 counts core issues only
             (app.js:248-251, doneCore/totalCore), and the topic-complete
             screen offers the other issue as "סוגיית בונוס" (app.js:546).
             Under that reading, finishing s1 alone would read 1/8.
     the sheet  §0.2 says "8 topics x 2 סוגיות = 16 rounds, PLUS bonus
             סוגיות per topic", and §3.2 puts one ring segment per סוגיה
             with bonus explicitly outside the ring. Under that reading
             BOTH issues are ring segments and the bonus is a third thing
             that has not been written yet.

   THE SHEET WINS — the brief says so where the sources disagree, and the
   state the brief asks to see confirms it: complete s1, and the node shows
   1 of 2 segments while the headline still reads 0/8. That is only true if
   s2 is a segment rather than the bonus.

   So: `core` orders the two segments, topic membership defines them, and
   THERE IS NO BONUS ISSUE IN THE DATA TO MARK. hasBonus() is the seam —
   one function, returning what the data says, which today is false for all
   eight. Nothing is invented to fill it.
   ===================================================================== */

/* issueId -> true. In memory for the session only: the map is a demo
   surface and a client meeting should open on a clean map, not on whatever
   the last person did. Nothing here writes to localStorage. */
const PROGRESS = {};

/* core first, so segment 1 is always the topic's first issue */
const topicIssues = id => DATA.issues
  .filter(i => i.topic === id)
  .sort((a, b) => (b.core === true) - (a.core === true));

/* THE SEAM. Returns the topic's bonus issues, and data.js has none: every
   issue belongs to the pair that makes up the two ring segments. When a
   third issue per topic appears — or a field that marks one — this is the
   only function that has to change. ?bonus=demo forces the marker on so
   the treatment can be looked at; it fabricates no issue and moves no
   count, because nothing else reads it. */
function hasBonus(topicId) {
  const extra = topicIssues(topicId).length - 2;
  return extra > 0 || DEV.bonusDemo;
}

const issueDone  = id => PROGRESS[id] === true;
/* 0, 1 or 2. Never more: the ring has two segments and bonus is not one. */
const segsDone   = id => topicIssues(id).filter(i => issueDone(i.id)).length;
const topicDone  = id => { const l = topicIssues(id); return l.length > 0 && l.every(i => issueDone(i.id)); };
/* THE HEADLINE IS TOPICS, never sub-issues. §3.2: 0/16 is a longer and
   more intimidating number for a one-minute game, and the topic is the
   unit the player actually chooses. */
const topicsDone = () => DATA.topics.filter(t => topicDone(t.id)).length;
/* the soft nudge, and the only ordering the map has. No lock follows it. */
const currentIdx = () => {
  const i = DATA.topics.findIndex(t => !topicDone(t.id));
  return i < 0 ? DATA.topics.length - 1 : i;
};

/* =====================================================================
   THE SCREEN ROUTER
   ===================================================================== */
function showScreen(name) {
  const st = $('#stage');
  st.dataset.screen = name;
  [['intro','#scIntro'], ['map','#scMap'], ['round','#scRound']].forEach(([n, sel]) => {
    const node = $(sel); if (node) node.hidden = (n !== name);
  });
  /* the HUD's centre slot is the only part of the row that differs */
  const t = $('#hudTopic'), pr = $('#hudProgress');
  if (t)  t.hidden  = (name !== 'round');
  if (pr) pr.hidden = (name !== 'map');
}

/* =====================================================================
   1 · INT-D · THE INTRO
   COPY IS LIFTED, NOT WRITTEN. Every string below is the shipped app's
   own, from index.html's #intro block, quoted here with a line number so
   the next person can check it rather than trust it. The one unwritten
   line is the board's own striped slot and it renders as a placeholder.
   ===================================================================== */
const INTRO_COPY = {
  tag:   'מבית המגדלור · פרוטוטייפ',                    /* index.html:  .intro-tag  */
  t1:    'הח״כ',                                        /* index.html:  h1.display  */
  t2:    'ה-121',
  sub:   'מה באמת קורה בכנסת?',                         /* index.html:  .sub        */
  para:  'לא בוחן ידע. לא אומר למי להצביע. משחק שמראה מה קרה — ומה אתם חושבים על זה.',
  cta:   'בואו נשחק 🎮',                                 /* index.html:  button.cta  */
  note:  'סוגיה אחת = דקה · אפשר לשחק כמה שרוצים',      /* index.html:  .intro-note */
  /* the board's INT-D carries a striped slot above the title. It is
     Tamar's, unwritten, and is NOT authored here. */
  lede:  'טקסט — תמר: את/ה הח״כ ה-121'
};

/* one <svg><text> per glyph — see the .i-ls note in proto.css for why, and
   why it is the one SVG text in the app that WebKit cannot reverse.

   DIGITS ARE GROUPED, and they have to be. Splitting a string into
   one-glyph flex items hands the ORDER to the RTL flex direction, which is
   right for Hebrew and wrong for a number: 121 survives it only because it
   reads the same backwards. Each run of digits becomes its own LTR flex
   item, so the run sits where RTL puts it and reads left-to-right inside
   itself — which is what §7's Western numerals in an RTL flow means. */
const lsGlyph = ch =>
  '<svg class="g" viewBox="0 0 100 116" aria-hidden="true">' +
    '<text x="50" y="92">' + esc(ch) + '</text></svg>';

const lsRow = str => '<span class="i-ls" aria-label="' + esc(str) + '">' +
  str.split(/(\d+)/).filter(Boolean).map(part =>
    /^\d+$/.test(part)
      ? '<span class="i-run">' + [...part].map(lsGlyph).join('') + '</span>'
      : [...part].map(lsGlyph).join('')
  ).join('') +
  '</span>';

function renderIntro() {
  const r = $('#scIntro');
  r.innerHTML =
    '<p class="i-tag">' + ph(INTRO_COPY.lede) + '</p>' +
    '<div class="i-comp">' +
      '<div class="i-title">' + lsRow(INTRO_COPY.t1) + lsRow(INTRO_COPY.t2) + '</div>' +
      /* SIZED IN CSS, NOT HERE. An inline width/height beats the
         stylesheet, so the vh clamp that keeps the composite inside a
         667px phone was being overridden by the board's own 278x324 and
         the intro overflowed the stage by 86px. */
      '<img class="i-chair" src="' + ROOT + M.props.chair['300'] + '" alt="">' +
    '</div>' +
    '<p class="i-sub">' + esc(INTRO_COPY.sub) + '</p>' +
    '<p class="i-para">' + esc(INTRO_COPY.para) + '</p>' +
    '<div class="i-stage" aria-hidden="true">' +
      '<img class="i-build" src="' + ROOT + M.props.building['390'] + '" alt=""></div>' +
    '<button type="button" class="p-c i-cta">' + esc(INTRO_COPY.cta) + '</button>' +
    '<p class="i-note">' + esc(INTRO_COPY.note) + '</p>';

  /* ONE PRIMARY ACTION AND IT GOES TO THE MAP. Not to a character step:
     §4.1 kills creation-as-first-step, the default avatar is already in
     the HUD, and customisation moves to the map corner. The project
     flowmap still shows Intro -> Character -> Map; it is superseded, and a
     stub in between would be a screen we know is wrong. */
  pressable($('.i-cta', r)).addEventListener('click', () => goMap());
  showScreen('intro');
}

/* =====================================================================
   2 · THE PATH MAP
   Bottom to top. Node 1 is at the FOOT and the path climbs, which is why
   the window opens parked low and why the first incomplete node lands in
   the lower third rather than in the middle.
   ===================================================================== */
/* the board's own serpentine, as fractions of the path's width so it
   holds its shape at 375 and at 430. PathMap puts the eight centres at
   275 · 227 · 131 · 83 · 131 · 227 · 275 · 227 across 358px. */
const NODE_X = [.7682, .6341, .3659, .2318, .3659, .6341, .7682, .6341];

/* the map's geometry lives in proto.css with everything else, so JS reads
   it back rather than carrying a second copy that can drift. */
const CSVAR = n => CS.getPropertyValue(n).trim() || '0';
const GAP  = () => parseFloat(CSVAR('--node-gap'));
const PADB = () => parseFloat(CSVAR('--node-pad-bot'));
/* node i's centre, measured DOWN from the top of the path. i=0 is the
   first topic and sits at the foot. */
const nodeY = (i, h) => h - PADB() - i * GAP();

function renderMap() {
  const r = $('#scMap');
  const n = DATA.topics.length;
  const h = parseFloat(CSVAR('--node-pad-top')) + PADB() + (n - 1) * GAP();
  const cur = currentIdx();

  r.innerHTML =
    '<div class="mapwin scrolls" id="mapwin">' +
      '<div class="path" id="mappath" style="height:' + h + 'px">' +
        '<div class="path-glow" aria-hidden="true"></div>' +
        '<svg class="path-line" id="mapline" viewBox="0 0 358 ' + h + '" ' +
          'preserveAspectRatio="none" aria-hidden="true">' +
          '<path class="pl-under" d=""></path><path class="pl-dots" d=""></path>' +
        '</svg>' +
        DATA.topics.map((t, i) => nodeHTML(t, i, h, cur)).join('') +
      '</div>' +
    '</div>' +
    '<p class="map-head" id="maphead"><b></b></p>' +
    '<button type="button" class="map-jump" id="mapjump">' +
      '<i aria-hidden="true">↓</i>חזרה לנושא הנוכחי</button>';

  drawPath(h);
  paintHud();
  /* SHOW IT BEFORE WIRING IT. A hidden element has no clientHeight and
     will not take a scrollTop, so parking the window on the current node
     silently did nothing and the map opened at the top of the path. */
  showScreen('map');
  wireMap(cur, h);
}

/* THE RING, in the node box's own units. Everything here is derived from
   --ring-r so the SVG cannot fall out of step with the CSS that sizes the
   box around it: the two segments split the circle in half, and each half
   carries the board's own 27.2-degree gap — the proportion is the board's
   even though the radius is not. */
function ringGeom() {
  const box = parseFloat(CSVAR('--node-box'));
  const r   = parseFloat(CSVAR('--ring-r'));
  const c   = box / 2;
  const circ = 2 * Math.PI * r;
  const gap  = circ * (27.2 / 360);          /* the board's gap angle     */
  return { box, r, c, half: circ / 2, dash: circ / 2 - gap, rest: circ / 2 + gap };
}

function nodeHTML(t, i, h, cur) {
  const done = topicDone(t.id), segs = segsDone(t.id);
  const cls = 'node' + (i === cur ? ' is-current' : '') + (segs === 0 ? ' is-untouched' : '');
  const cy  = nodeY(i, h);
  const G   = ringGeom();
  /* the ring's two segments. One circle each, so a segment is a real
     element with its own state rather than a fraction of one stroke. */
  const seg = k =>
    '<circle class="seg ' + (k < segs ? 'seg-on' : 'seg-off') + '" cx="' + G.c +
      '" cy="' + G.c + '" r="' + G.r + '" fill="none" stroke-dasharray="' +
      G.dash.toFixed(2) + ' ' + G.rest.toFixed(2) + '" stroke-dashoffset="' +
      (k === 0 ? '0' : (-G.half).toFixed(2)) + '" stroke-linecap="round"></circle>';

  /* THE ICON IS SIZED BY ITS LARGER DIMENSION, from the manifest's MEASURED
     aspect — these eight run from a 0.53 receipt to a 1.52 police hat, and
     a single width or a single height would blow one of them through the
     ring. Rendered at 60px off the 64px file: a 1.07x downscale, inside the
     manifest's own 1.2x rule. */
  const T_ = M.topics && M.topics[t.id];
  const art = T_ && T_['64'];
  let face;
  if (art) {
    const S = parseFloat(CSVAR('--node-ico')), a = T_.aspect || 1;
    const w = a >= 1 ? S : S * a, hh = a >= 1 ? S / a : S;
    face = '<img class="node-ico" src="' + ROOT + art + '" alt="" style="width:' +
      w.toFixed(1) + 'px;height:' + hh.toFixed(1) + 'px">';
  } else {
    /* no drawn object for this topic — data.js's glyph, and nothing
       substituted for it */
    face = '<span class="node-ico" aria-hidden="true">' + t.icon + '</span>';
  }

  /* the face's centre inside the box: the path threads the DISC, not the
     ring, so this is what the node is positioned by */
  const fcy = parseFloat(CSVAR('--node-face-y')) + parseFloat(CSVAR('--node-face')) / 2;

  return '<div class="' + cls + '" data-topic="' + esc(t.id) + '" data-i="' + i + '" ' +
      'style="left:calc(' + (NODE_X[i] * 100).toFixed(2) + '% - ' + G.c + 'px);top:' +
      (cy - fcy) + 'px;--tc:' + t.color + '">' +
    '<span class="ringnode">' +
      '<svg class="ring" viewBox="0 0 ' + G.box + ' ' + G.box + '" aria-hidden="true">' +
        '<g transform="rotate(-90 ' + G.c + ' ' + G.c + ')">' + seg(0) + seg(1) + '</g></svg>' +
      '<button type="button" class="node-face" ' +
        'aria-label="' + esc(t.label + ' — ' + segs + ' מתוך 2') + '">' +
        face +
        '<span class="node-num" aria-hidden="true">' + (i + 1) + '</span>' +
        (done ? '<span class="node-check" aria-hidden="true">✓</span>' : '') +
      '</button>' +
      (hasBonus(t.id) ? '<span class="node-bonus" aria-hidden="true">★</span>' : '') +
    '</span>' +
    '<span class="node-name">' + esc(t.label) + '</span>' +
    '<span class="node-status">' + statusLine(t.id) + '</span>' +
  '</div>';
}

/* THE STATUS READS WITHOUT COLOUR — it is the same information the ring
   carries, in words, which is what makes the node legible at 360px to
   somebody who cannot separate the two hues. No lock, ever. */
function statusLine(id) {
  const s = segsDone(id), n = topicIssues(id).length;
  if (topicDone(id)) return '✓ הושלם';
  /* the shipped app's own string, app.js:274 — and the fraction goes
     through .num like every other numeral in the prototype (§7), so it
     stays an LTR run inside the RTL line instead of relying on the bidi
     algorithm to guess what a slash between two digits is. */
  return N(s + '/' + n) + ' סוגיות';
}

/* one smooth serpentine through the node centres, vertical tangents at
   every node so the dashes arrive square to the face */
function drawPath(h) {
  const w = 358;
  const pts = DATA.topics.map((t, i) => [
    NODE_X[i] * w, nodeY(i, h)
  ]);
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], t = (y1 - y0) / 3;
    d += ' C' + x0.toFixed(1) + ' ' + (y0 + t).toFixed(1) +
         ',' + x1.toFixed(1) + ' ' + (y1 - t).toFixed(1) +
         ',' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }
  $('#mapline').querySelectorAll('path').forEach(p => p.setAttribute('d', d));
}

function wireMap(cur, h) {
  const win = $('#mapwin'), head = $('#maphead b'), jump = $('#mapjump');
  const curY = nodeY(cur, h);

  /* PARK THE FIRST INCOMPLETE NODE IN THE LOWER THIRD. Two thirds down the
     window, so what is above it — everything still to play — is what fills
     the screen, and the climb reads as the point of the map. */
  const park = () => { win.scrollTop = Math.max(0, curY - win.clientHeight * 0.667); };
  park();

  const onScroll = () => {
    /* THE PINNED HEADER NAMES THE NODE NEAREST THE MIDDLE of the window
       and swaps as you climb, which is the whole reason it is pinned. */
    const mid = win.scrollTop + win.clientHeight / 2;
    let best = 0, bd = Infinity;
    DATA.topics.forEach((t, i) => {
      const d = Math.abs(nodeY(i, h) - mid); if (d < bd) { bd = d; best = i; }
    });
    head.textContent = DATA.topics[best].label;
    /* THE JUMP BUTTON EXISTS ONLY WHILE THE CURRENT NODE IS OFF SCREEN.
       It is a way back, not a nag, and it awards nothing. */
    const vis = curY > win.scrollTop + 40 && curY < win.scrollTop + win.clientHeight - 40;
    jump.classList.toggle('is-on', !vis);
    jump.querySelector('i').textContent = curY > win.scrollTop ? '↓' : '↑';
  };
  win.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  pressable(jump).addEventListener('click', () => {
    win.scrollTo({ top: Math.max(0, curY - win.clientHeight * 0.667), behavior: 'smooth' });
  });

  /* FREE CHOICE, no locking and no prerequisites — a SET decision (§3.1).
     Only internal_sec has a round behind it in this build; the other seven
     are a visible state and say so rather than opening a faked round. */
  $$('.node-face', $('#scMap')).forEach(btn => {
    const node = btn.closest('.node');
    pressable(btn).addEventListener('click', () => openTopic(node.dataset.topic, btn));
  });
}

/* the map's own HUD: the x/8 count and the coin total */
function paintHud() {
  const pr = $('#hudProgress');
  if (pr) pr.innerHTML = '<span class="num">' + topicsDone() + '/' + DATA.topics.length + '</span>';
  const cn = $('#coinNum'); if (cn) cn.textContent = wallet;
}

function goMap() {
  renderMap();
  const m = $('#scMap');
  m.classList.remove('is-arriving'); void m.offsetWidth; m.classList.add('is-arriving');
}

/* MAP -> ROUND. One transition, cheap, under the 350ms cap: the map drops
   back and fades while the round comes up over it. Only s1 has a round. */
function openTopic(topicId, btn) {
  const first = topicIssues(topicId).find(i => !issueDone(i.id)) || topicIssues(topicId)[0];
  if (!first || first.id !== ISSUE_ID) {
    /* NOT A FAKED ROUND. The node is a real state and nothing more, and
       saying so beats opening an empty one. The words are MARKED AS A
       PLACEHOLDER rather than written: what an unbuilt topic says to a
       player is Tamar's line, not this file's, and a build-state label
       dressed as product copy is how unwritten strings get shipped. */
    const st = btn.closest('.node').querySelector('.node-status');
    const was = st.innerHTML;
    st.innerHTML = ph('טקסט — תמר: נושא שעוד לא נבנה');
    setTimeout(() => { st.innerHTML = was; }, 1600);
    return;
  }
  const m = $('#scMap');
  m.classList.add('is-leaving');
  setTimeout(() => {
    m.classList.remove('is-leaving');
    startRound();
    const rd = $('#scRound');
    rd.classList.remove('is-entering'); void rd.offsetWidth; rd.classList.add('is-entering');
  }, T.screen);
}

/* ===================== boot ========================================= */
/* THE ROUND, which is now one screen of three rather than the whole app.
   It no longer resets the coin count: the wallet belongs to the session
   and the map is the thing you come back to with it. */
function startRound() {
  applyDev();
  helper('');
  /* the chyron is emptied, never removed: it holds its box on beat 1 so
     the card is the same size before and after the answer is given */
  const c = $('#chyron');
  c.innerHTML = ''; c.classList.add('is-empty'); c.setAttribute('aria-hidden', 'true');
  newRound();
  /* §B the topic the issue belongs to, from data.js, centred in the HUD
     and present on every beat — the round is one issue inside one topic
     and the HUD is the only thing on screen that can say which.
     Read AFTER newRound(), which is what resolves `issue`. */
  const t = $('#hudTopic');
  if (t) t.textContent = topicLabel();
  showScreen('round');
  beat1();
  sizeStage();
}

/* §4.1 THE DEFAULT AVATAR IS ASSIGNED INSTANTLY, guest included. There is
   no step where the player is asked to make one, and nothing gates on it. */
function boot() {
  applyDev();
  $('#hudAvatar').innerHTML = AV3;
  $('#coinNum').textContent = wallet;
  /* §7 the deep-link. `round` drops straight in without a map behind it,
     which is what makes it useful in a meeting; `map` and `intro` build
     their screen and stop. */
  if (DEV.screen === 'round')      startRound();
  else if (DEV.screen === 'map')   goMap();
  else                             renderIntro();
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
    sizeStage(); boot(); })
  .catch(() => {
    /* THE FAILURE HAS TO BE VISIBLE. #round now lives inside a screen that
       starts `hidden`, so writing the message there and stopping would
       have left a blank stage with the reason for it in the DOM. */
    showScreen('round');
    $('#round').innerHTML =
      '<p style="color:#EFECE4;font-weight:700;line-height:1.5">' +
      'manifest.json could not be read. Serve the repo over http — ' +
      '<code style="direction:ltr">python3 -m http.server 8000</code> — ' +
      'and open <code style="direction:ltr">/explorations/v16/proto/</code>.</p>';
  });
