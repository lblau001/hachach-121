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

/* the issue the round opens on when nothing chose one — a ?screen=round
   deep link with no map behind it. Every OTHER entry into the round comes
   from a map node and names its own issue. */
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
  claimHold: ms('--t-claim-hold'),
  claimBeat: ms('--t-claim-beat'),
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
/* ===== §0 · THE AWARD TABLE ==========================================
   WHY IT CHANGED. The old table paid nothing for finishing and nothing
   for taking a position, so a round's whole value was its cascade: r1
   (9 MK cards) paid 250 and the five rounds with no MK data at all paid
   25. A 10:1 spread between rounds that look identical from the player's
   side — and the short ones are short because of a DATA GAP, not because
   they are worth less. The table was teaching that long rounds matter
   more, which is false.

   THE TACHLES AWARD IS FLAT AND UNCONDITIONAL. Identical for בעד, נגד
   and נמנע, paid the moment a position is taken, never scored and never
   compared against anything. It is what makes the 121st-MK conceit true
   mechanically — the player's position counts — and the instant it is
   conditional on being "right" it becomes an opinion poll with a grade
   on it. Nothing near it may carry a correctness colour, a tick, or
   verdict language. See pinVote() and the note at the beat-2 award.

   NOTHING IS ADVERTISED BEFORE A CHOICE. There is no "+25" beside the
   vote chips or on the claim card anywhere in this file. A price tag
   before a decision moves attention from the content to the points, and
   on the tachles beat it would turn taking a position into a
   transaction. Feedback lands AFTER: the coin flies, the counter ticks.

   `brief` IS THE RECORD OF WHAT THE BRIEF SAID, not a live mode. It is
   kept so the disagreement stays visible; only `sheet` is reachable
   without a query string. */
const COIN_TABLES = {
  sheet: { claim:25, claimNeedsCorrect:true,  position:25, perCorrect:25,
           topic:100, round:50 },
  brief: { claim:25, claimNeedsCorrect:false, position:25, perCorrect:25,
           topic:0,   round:0  }
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
  /* B1-2 · null means "ask localStorage". on/off force the overlay in
     either direction WITHOUT writing the flag, which is the only way to
     look twice at something that by definition happens once. */
  intro:  qPick('intro',  { on:true, off:false }, null),
  /* §5.2 · ?title=multi puts a topic hue on each glyph's sticker stroke;
     solid is the shipped white. Both live so they can be compared. */
  title:  qPick('title',  { multi:'multi', solid:'solid' }, 'solid')
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
/* the map's connector is drawn in device pixels, so it has to be redrawn
   when the window changes size. Cheap, and a no-op on the other screens. */
addEventListener('resize', () => { if ($('#mapline')) redrawPath(); });
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
function newRound(issueId) {
  issue = DATA.issues.find(i => i.id === (issueId || ISSUE_ID));
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
/* A7 · WHAT THE BAND CARRIES IS THE PLAYER'S OWN VOTE, and the avatar
   comes with it. This is the "121st MK" object: the player and the way
   they voted, on screen together for the whole cascade and the reveal.
   The avatar leads at the RIGHT edge — the leading edge in RTL — because
   the sentence is about them.
   IT IS NEVER SCORED. No colour by direction, no comparison to a correct
   answer, no change when the cascade disagrees with it. It is a statement
   of what the player said, and nothing in the round is allowed to grade
   it. Before beat 2 there is no vote and so no band; the slot still holds
   its box, so the card does not resize when it fills.
   COPY IS OURS, NOT TAMAR'S — marked, including the gendered נמנע/ת which
   needs checking against the player's gender setting. */
const VOTE_PIN = { for: 'בעד', against: 'נגד', abstain: 'נמנע/ת' };  /* TAMAR */
function pinVote(vote) {
  const c = $('#chyron');
  c.classList.remove('is-empty');
  c.removeAttribute('aria-hidden');
  c.innerHTML =
    '<span class="chyron-av as-d" aria-hidden="true">' + AV3 + '</span>' +
    /* esc(), not ph(): written Hebrew pending Tamar, not a description of
       copy that does not exist. On the §2 light band the yellow hazard
       stripe was the loudest thing in the row. */
    '<span class="chyron-line">' + esc('הצבעת:') +   /* TAMAR */
      '<b>' + esc(VOTE_PIN[vote] || '') + '</b></span>';
  return c;
}
/* the round re-renders on every beat; the chyron is outside #round and
   survives that, but the call is kept so a beat can never render without
   it having been asserted */
/* A6 · THE `אמרת:` BANNER IS GONE. It existed to carry the player's
   unresolved answer through four beats; the claim now resolves at beat 1,
   so there is nothing left to pin. The slot is not deleted — A7 fills it
   with the player's own VOTE from beat 2 onward, which is the thing that
   does stay unresolved for the rest of the round. */
function repin() { if (S.ownVote) pinVote(S.ownVote); }

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
    /* `hi` IS THE NATIVE CROP, `400` the fallback. .mf-b__port draws at 401
       CSS px, so under the DPR-3 rule this wants a 1203px file; the masters
       top out at the crop box (474-723px), which is what `hi` is. It is
       still 1.18-1.80x rather than 3x — see manifest.json's `dpr` per
       portrait and the ceiling note in frame_mk.py. */
    (art
      ? '<img class="mf-b__port" src="' + ROOT + (art.hi || art['400']) + '" alt="">'
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

/* ===== B1-2 · THE FIRST-RUN INSTRUCTION OVERLAY =====================
   Full screen, on the player's FIRST EVER issue, never again. It is the
   only option on the v17 board that adds persisted state, and the board
   said so: "a seen-it flag that has to survive a reload, which the
   prototype currently has nowhere to put." It has somewhere now.

   localStorage, ONE KEY, AND IT FAILS OPEN. Private mode, a cleared
   store and a browser that throws on access all land in the same place:
   the overlay shows. Showing an instruction to somebody who has already
   seen it is a small cost; swallowing it for somebody who has not is the
   whole feature. So every read and write is wrapped and every failure
   resolves toward showing it.

   ?intro=on / ?intro=off OVERRIDES THE FLAG without touching it, which is
   how this gets demoed and tested at all — a feature that by definition
   happens once cannot otherwise be looked at twice.

   IT IS SKIPPABLE BY TAP, anywhere, including the CTA. There is no way to
   be stuck behind it and no way to dismiss it by accident before it has
   arrived: the ground does not take a tap until it has faded in. */
const SEEN_KEY = 'h121.proto.b1intro.seen';
function seenIntro() {
  if (DEV.intro !== null) return !DEV.intro;
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
}
function markIntroSeen() {
  /* an ?intro= override never writes: forcing the overlay on to look at it
     must not silently spend the player's one first run */
  if (DEV.intro !== null) return;
  try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* fails open */ }
}

/* COPY IS PLACEHOLDER except the heading, which is the same string the
   claim sticker carries — one question, asked once big and then kept
   small on the card. */
/* §1.4 · THE TITLE ALONE EXPLAINS NOTHING. "אמת או שקר?" names the format
   and not the task; a player who has never seen this screen still does not
   know what is about to happen or what happens after they answer. The line
   below says all three: a claim comes, you decide, then you are told what
   actually happened.
   IT MUST NOT READ AS A TEST. "נגלה מה באמת קרה" puts the reveal on the
   game rather than on the player — nobody is being marked, something is
   being shown. No "correct", no "score", no second person singular
   imperative that sounds like an exam instruction.
   Two lines at 393px, three at 360px. */
/* §1 · THE OLD FRAMING WAS FACTUALLY WRONG and Tamar caught it. It said
   "נציג לכם טענה על הכנסת" — a claim ABOUT THE KNESSET — and the claims
   are not that. r1's is a demographic statistic about haredi conscription
   rates; e4's compares Israeli prices to the OECD. They are claims about
   Israeli society and politics, and the Knesset is where the response to
   them gets voted on. The replacement drops the false object entirely
   rather than swapping one noun for another. */
const INTRO_B1 = {
  title: 'טענה — אמת או שקר?',                                   /* TAMAR */
  body:  'נחשו אם הטענה נכונה. אחר כך נגלה מה באמת קרה.',        /* TAMAR */
  cta:   'הבנתי',                                                 /* TAMAR */
};

function firstRunIntro(done) {
  if (seenIntro()) return done();
  markIntroSeen();

  const o = el('div', 'b1intro');
  o.innerHTML =
    '<div class="b1intro__box" role="dialog" aria-modal="true">' +
      '<h2 class="b1intro__t">' + esc(INTRO_B1.title) + '</h2>' +
      /* esc(), not ph(): this is a written sentence pending Tamar's
         approval, not a description of one that has not been written. */
      '<p class="b1intro__b">' + esc(INTRO_B1.body) + '</p>' +
      '<button type="button" class="p-c b1intro__go">' + esc(INTRO_B1.cta) + '</button>' +
    '</div>';
  $('#stage').appendChild(o);
  requestAnimationFrame(() => o.classList.add('is-in'));

  let gone = false;
  const close = () => {
    if (gone) return; gone = true;
    o.classList.remove('is-in'); o.classList.add('is-out');
    setTimeout(() => { o.remove(); done(); }, T.ovCollapse);
  };
  /* the whole surface is the dismiss, the CTA included — pressable() only
     to give the button the same 10ms tick every other control has */
  pressable($('.b1intro__go', o));
  o.addEventListener('click', close);
  return o;
}

/* ===== B2-4 · THE ASK STICKER =======================================
   ONE COMPONENT, TWO COPY STRINGS, and never two components. B2-4 was
   picked for the MK question and the brief extends it to the claim card,
   because B1-2 only ever fires once and the cascade sticker is a cascade
   element — without this, a returning player opens their second issue and
   the claim card carries no instruction at all.

   IT COSTS THE CARD NOTHING. The sticker is parented to .cardwrap, not to
   the card: .mf-b carries overflow:hidden and would clip it, and anything
   inside the card face would push the name/party block toward the stamp's
   430px band. It overhangs the card's top-right corner, which is the
   corner diagonally opposite the stamp (top:430 left:-22) — the two can
   never meet on any card.

   IT IS CHROME-SCALE, NOT CARD-SCALE. .stack is scaled by sizeStage() so
   a 620px card fits a short phone; left alone the sticker would shrink
   with it and the instruction would be smallest exactly where the screen
   is smallest. .ask-st counter-scales by 1/--card-scale so the settled
   size is the same number of CSS pixels on every phone. See .ask-st. */
/* ASK.claim is UNCHANGED — it was already accurate and Tamar kept it.
   ASK.mk gains the instruction verb: the old line was a bare question and
   read as a caption on the card rather than as something to do. */
const ASK = {
  claim: 'אמת או שקר?',                    /* TAMAR */
  mk:    'נחשו מה הוא/היא הצביע/ה',        /* TAMAR */
};

/* THE SLAP IS ITS OWN BEAT, which is the whole reason to build a sticker
   rather than a label. It enters AFTER the card has settled, never with
   it: two things arriving on the same frame read as one thing arriving.
   --t-ask-delay is measured from the moment the card is in place. */
function slapAsk(text) {
  const wrap = $('.cardwrap'); if (!wrap) return null;
  const old = $('.ask-st', wrap); if (old) old.remove();
  const s = el('div', 'ask-st');
  s.innerHTML = '<span class="ask-st__i">' + esc(text) + '</span>';
  wrap.appendChild(s);
  s._t = setTimeout(() => s.classList.add('is-slapped'), T.askDelay);
  return s;
}
/* the claim's sticker retires the moment the claim is answered — it is
   the claim card's instruction and the claim card is leaving. The MK
   sticker is NOT retired between cards: it slaps once on the first card
   of the cascade and stays for the rest of it, which is the difference
   the brief draws between "animates in with each card" and "stays". */
function retireAsk() {
  const s = $('.ask-st'); if (!s) return;
  clearTimeout(s._t);
  s.classList.add('is-retired');
  setTimeout(() => s.remove(), 200);
}

/* ===================== BEAT 1 · THE CLAIM =========================== */
/* B1-B developed: the claim card IS the MK card — same .mf-b, same
   340x620, with the issue's own graphic where the portrait goes.      */
/* THE CLAIM CARD'S GRAPHIC, and what stands in when there is not one.
   manifest.json carries issue art for s1 and s2 only — the other fourteen
   have no drawn source, and inventing one is not this file's job. The
   fallback is the TOPIC'S own object, the same illustration the map node
   carries, set smaller and centred in the same slot with the same die-cut.
   It says which topic the claim belongs to and claims nothing about the
   issue, which is the honest thing a stand-in can do. It is marked with a
   class so it is greppable and so it cannot be mistaken for issue art. */
function claimArt() {
  const a = M.issues[issue.id];
  if (a) return '<div class="b1art"><img src="' + ROOT + a.file + '" alt="" width="' +
    a.w + '" height="' + a.h + '"></div>';
  const T_ = M.topics && M.topics[issue.topic];
  if (T_ && T_['128']) {
    /* §1.3 · 128 -> 190. The card is 308px wide inside its padding and the
       fallback was using 42% of it, which is what made the claim card read
       as empty. 190 is 62%; past that it starts competing with the claim
       text for the eye. Source moves 384 -> 576 to hold DPR 3. */
    const ar = T_.aspect || 1, S_ = 190;
    const w = ar >= 1 ? S_ : S_ * ar, h = ar >= 1 ? S_ / ar : S_;
    /* THE LAYOUT BOX STAYS 128, THE SOURCE BECOMES 384. This is the single
       worst-served surface the asset audit found: the 128px file was being
       drawn at 128 CSS px, which is 1:1 and therefore a 3x UPSCALE on a 3x
       phone — and it is the fallback for 14 of the 16 issues, so it is what
       most claim cards actually show. width/height stay the CSS size. */
    return '<div class="b1art b1art--topic"><img src="' + ROOT + (T_['576'] || T_['384'] || T_['128']) +
      '" alt="" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '"></div>';
  }
  /* no object either: the slot still holds its box, so the card cannot
     change size between one issue and the next */
  return '<div class="b1art b1art--none"></div>';
}

function beat1() {
  S.beat = 1; S.t0 = performance.now();
  const r = $('#round');
  r.innerHTML = '';
  const b = el('div', 'beat b1');

  const stack = el('div', 'stack');
  const wrap = el('div', 'cardwrap');
  const pile = el('span', 'pile');
  /* THE FIRST MK CARD IS ALREADY HERE, face down, under the claim. When
     the claim leaves it is not replaced — it is uncovered.
     UNLESS THERE IS NO CASCADE. A round with no MK data has nothing to
     uncover, so the claim card stands alone over the ground and beat 3
     ends the round. deckCard(0) read S.dealt[0].id and threw on an empty
     deal, which blanked the whole round screen. */
  const next = S.dealt.length ? deckCard(0) : null;
  /* §1.3 the claim sets its own size — three steps by length, see
     .b1card--mid / --long. 49 to 190 characters across the active set is
     too wide a range for one size. */
  const tfLen = (issue.tf || '').length;
  const card = el('article', 'mf-b b1card' +
    (tfLen > 120 ? ' b1card--long' : tfLen > 70 ? ' b1card--mid' : ''));
  card.innerHTML =
    claimArt() +
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

  if (next) wrap.append(pile, next, card); else wrap.append(card);
  stack.appendChild(wrap);
  b.appendChild(stack);

  /* the swipe hint is unwritten copy — the line that says both work.
     data-ph marks the HOST, so hiding it leaves no empty line behind. */
  const hint = el('p', 'b1hint', ph('[טקסט — תמר: החלקה או הקשה, שתיהן עובדות]'));
  hint.setAttribute('data-ph', '');
  b.appendChild(hint);

  r.appendChild(b);
  setPile(0);
  /* NO CHROME INSTRUCTION LINE. The helper slot is empty on every beat
     now — B2-4 moved both questions onto the card as stickers, so the
     line under the chyron has nothing left to say. Its box is still
     reserved, because reserving it is what keeps the card the same size
     from the claim through the cascade. */
  helper('');
  sizeStage();

  wireSwipe(card, $('.b1target', card), $('.b1prev', card));

  /* B1-2 THEN B2-4, IN THAT ORDER. On a player's first ever issue the
     full-screen overlay comes up over the dealt card and the sticker
     waits behind it; the slap is the first thing that happens after the
     overlay is dismissed, so the two instructions are never on screen
     together. On every round after the first there is no overlay and the
     sticker slaps on its own. */
  firstRunIntro(() => slapAsk(ASK.claim));

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

/* §1.1 · THE CARD NO LONGER LEAVES ON ANSWER.
   The old order was: commit -> card flies off -> verdict arrives on an
   empty screen. That is exactly why the reveal had nothing to land on,
   and no amount of styling the reveal could fix it, because by the time
   the reveal existed the thing it was about was gone.

   The order is now:
     1  commit (swipe or tap) — THE CARD STAYS
     2  a beat, ~400ms: the answer is registered and nothing else moves
     3  the stamp lands ON the card
     4  the explanation panel rises over the card's lower portion
     5  הלאה sends the card away and beat 2 begins

   THE SWIPE IS PRESERVED, RELOCATED. Dragging still commits the answer;
   what it no longer does is throw the card. The throw now happens at
   step 5, on הלאה, where it means "dismiss something resolved" — which
   is the gesture's honest meaning once the card has been marked. */
async function commitClaim(ans, card, dir) {
  if (S.claim) return;
  S.claim = ans;
  card.querySelectorAll('.v-a').forEach(b => b.disabled = true);

  const table = COIN_TABLES[DEV.coins];
  /* under 'sheet' this is deferred to the stamp: paying out on
     correctness here would resolve the claim before the stamp does. */
  if (!table.claimNeedsCorrect) {
    award(table.claim, card.querySelector('[data-ans="' + ans + '"]') || card);
  }

  retireAsk();

  /* THE CARD SETTLES BACK SQUARE FIRST. A drag leaves an inline
     transform on it, and a stamp landing on a card still tilted 4deg
     from the finger reads as landing on a card that is falling over.
     The snap is the same class the below-threshold snap-back uses, so
     there is one way a card returns to square in this file. */
  /* THE DRAG READOUT IS CLEARED EITHER WAY. A TAP calls show(dir*999) to
     run the same preview the gesture does, and nothing used to clear it
     because the card left the screen a moment later. Now that the card
     stays, the leading-edge wash and the preview pill would sit on it for
     the whole reveal — which is what put a black אמת box on the card's
     corner the first time this was built. */
  card._swipe.clear();
  if (card.style.transform) {
    card.classList.add('is-snapping');
    card.style.transform = '';
    await wait(T.snapback);
    card.classList.remove('is-snapping');
  }
  /* the card gives up room for the panel: the art yields, the claim does
     not. See .b1card.is-revealing. */
  card.classList.add('is-revealing');

  /* §1.1 step 2 · the beat. The answer is registered and NOTHING moves:
     no stamp yet, no panel, no exit. --t-claim-beat is ~400ms. */
  await wait(T.claimBeat);
  await claimReveal(ans, card);
  beat2();
}

/* ===== A6 · THE CLAIM RESOLVES IMMEDIATELY =========================
   The old arc answered the claim at beat 1 and held the truth back until
   beat 5, four beats later. It now resolves on the spot: answer -> stamp
   -> explanation -> הלאה, and the round moves on knowing the answer.

   THE STAMP CARRIES THE TRUE ANSWER, NOT THE PLAYER'S. It reads אמת or
   שקר because that is what was true; whether the player agreed is coded
   ONLY by the VP-2 colour pair, never by which word is shown and never by
   direction. That is the locked rule and this is the beat where it is
   easiest to break.
   `partial` resolves as correct and prints חלקית — the player cannot be
   wrong about a claim the data calls partly true. */
/* §1.2 · V18-1, BUILT.
   The stamp lands ON the card; the card stays readable behind it; the
   correctness mark is a SEPARATE chip in the chyron slot; the coins and
   the issue title never leave, because nothing covers the HUD any more.

   THE STAMP IS ACHROMATIC, and this is the finding the board was built
   to surface. One mark cannot both letter the true answer and colour by
   correctness — that dual role IS the defect, because it makes the
   claim's truth and the player's rightness the same object. So .d2
   letters אמת / שקר in neutral ink here (.d2--neutral) and the chip
   beside the card carries correctness by colour and by nothing else.
   The cascade's stamp is untouched: there the word IS the verdict, so
   colouring it is correct.

   `partial` resolves as correct and prints חלקית — the player cannot be
   wrong about a claim the data calls partly true. Unreachable across all
   11 active issues; kept because tf_answer is Tamar's field, not ours. */
const CLAIM_MARK = {                      /* TAMAR */
  ok:  'צדקתם',
  bad: 'הופתעתם',
};

async function claimReveal(ans, card) {
  const truth = issue.tf_answer === 'true' ? 'אמת'
              : issue.tf_answer === 'false' ? 'שקר' : 'חלקית';
  const ok = issue.tf_answer === 'partial' || ans === issue.tf_answer;
  S.claimCorrect = ok;

  const wrap = $('.cardwrap');

  /* ---- 3 · THE STAMP LANDS ON THE CARD ---------------------------
     Parented to .cardwrap rather than to the card, for the same two
     reasons the cascade's stamp is: .mf-b carries overflow:hidden and
     would cut the disc at the card's edge, and the card is a 3D flipper
     whose rotation would mirror anything inside it. It OVERLAPS the
     card's edge on purpose — that overlap is what makes it read as
     applied to the card rather than composited into it. */
  const mark = stamp(ok, truth);
  mark.classList.add('d2--neutral', 'd2--claim');
  wrap.appendChild(mark);
  card.classList.add('is-stamped');
  inkBleed();
  setTimeout(() => buzz(25), T.stampDrop);

  /* the correctness chip, in the chyron slot — a different plane from
     the card, so it cannot be read as part of the stamp */
  const chip = el('div', 'cmark ' + (ok ? 'cmark--ok' : 'cmark--sur'),
    '<i class="cmark__dot" aria-hidden="true"></i><span>' +
    esc(ok ? CLAIM_MARK.ok : CLAIM_MARK.bad) + '</span>');
  const chy = $('#chyron');
  chy.classList.remove('is-empty'); chy.removeAttribute('aria-hidden');
  chy.innerHTML = ''; chy.appendChild(chip);
  requestAnimationFrame(() => chip.classList.add('is-in'));

  const table = COIN_TABLES[DEV.coins];
  if (table.claimNeedsCorrect && ok) setTimeout(() => award(table.claim, mark), T.stamp);

  /* the stamp holds alone before the panel rises under it */
  await wait(T.claimHold);

  /* ---- 4 · THE EXPLANATION PANEL RISES OVER THE CARD'S LOWER PORTION
     IT SCROLLS, and that is a requirement rather than a nicety: e3's
     tf_explain is 280 characters, the longest of the eleven, and it does
     not fit the panel at 360x640 at a legible size. The panel caps its
     height against the card and scrolls inside itself; the CTA is
     pinned below the scroller so it is never scrolled out of reach. */
  const panel = el('div', 'creveal__exp');
  panel.innerHTML =
    '<div class="creveal__scroll"><p class="creveal__text">' +
      markGlossary(issue.tf_explain || '') + '</p></div>' +
    '<button type="button" class="p-c creveal__go">' +
      esc('הלאה') + ' <i aria-hidden="true">›</i></button>';
  wrap.appendChild(panel);

  /* THE PANEL IS CAPPED SO IT CANNOT COVER THE CLAIM. This is V18-1's own
     recorded risk — "the explanation sheet covers the claim it is
     explaining" — and it is answered by measurement rather than by a
     percentage. The cap is the room left under the claim; the floor is
     170px, below which the panel would be a slot rather than a panel and
     the right answer would be to shorten the claim, not the panel.
     Everything past the cap scrolls inside .creveal__scroll. */
  const claimEl = $('.b1claim', card);
  if (claimEl) {
    const gap = 10;
    const room = wrap.getBoundingClientRect().bottom
               - claimEl.getBoundingClientRect().bottom - gap;
    const scale = parseFloat(CS.getPropertyValue('--card-scale')) || 1;
    panel.style.maxHeight = Math.max(170, room / scale) + 'px';
  }
  requestAnimationFrame(() => panel.classList.add('is-in'));

  panel.addEventListener('click', e => {
    const t = e.target.closest('.gt'); if (!t) return;
    glossModal(t.dataset.gt);
  });

  /* ---- 5 · הלאה SENDS THE CARD AWAY -------------------------------
     The throw the answer used to trigger happens here instead, and it
     carries the stamp and the panel with it — they are the card's, not
     the screen's. Direction is the drag's own: dirFor() so a player who
     swiped right sees it leave right. */
  await new Promise(res => {
    pressable($('.creveal__go', panel)).addEventListener('click', async () => {
      const dir = card._swipe ? card._swipe.dirFor(S.claim) : 1;
      panel.classList.remove('is-in');
      /* .mf-b.is-stamped runs d2-jolt with fill:both, which HOLDS
         transform:translateY(0) forever — and a held animation beats an
         inline style, so the card would not move. Clear it first. */
      card.classList.remove('is-stamped');
      card.style.animation = 'none';
      card.classList.add('is-leaving');
      card.style.transform = 'translateX(' + (dir * 620) + 'px) rotate(' + (dir * 25) + 'deg)';
      card.style.opacity = 0;
      mark.style.animation = 'none';
      mark.classList.add('is-leaving');
      mark.style.transform = 'translateX(' + (dir * 620) + 'px) rotate(' + (dir * 25) + 'deg)';
      mark.style.opacity = 0;
      await wait(T.swipe);
      card.remove(); mark.remove(); panel.remove();
      /* the chip hands the chyron back — beat 2 pins the player's own
         vote into the same slot and the two must never share it */
      chip.remove();
      chy.classList.add('is-empty'); chy.setAttribute('aria-hidden', 'true');
      res();
    }, { once:true });
  });
}

/* ===== B3-3 · THE DIE-CUT STICKER MODAL ==============================
   ONE COMPONENT, TWO CONTENTS, and that is the whole point of building it
   this way. B3-3 was picked for the law modal and §3.1 moves the glossary
   term onto the same treatment; a second modal would be a second set of
   paddings, a second dismiss and a second way for the two to drift apart.
   Everything that differs between the two is an ARGUMENT — title, meta,
   body, optional graphic — and everything that is shared is the sticker.

   IT IS CENTRED, WHICH COSTS SOMETHING AND IS STILL RIGHT. The v17 board
   recorded the objection: centring covers the tachles question while the
   law is open, so the player loses the thing they were about to answer.
   That is true of the glossary term too. The trade is deliberate — the
   modal is a detour the player asked for, it dismisses three ways, and
   the question is intact underneath it the instant it closes.

   THREE WAYS OUT, none of them hidden: the ✕, the ground, and Escape.

   SPOILER RISK carries over unchanged: on s1 and m2 the bill text names
   an MK who is in that round's own cascade. Tamar's copy is not edited
   and no MK is dropped; both issues carry `spoiler_risk:true` in data.js
   and stay on her list. The treatment cannot fix that; only her copy can.  */
function stickerModal(o) {
  const m = el('div', 'stmodal');
  m.innerHTML =
    '<div class="stmodal__box" role="dialog" aria-modal="true">' +
      '<button type="button" class="stmodal__x" aria-label="סגירה">✕</button>' +
      (o.art ? '<img class="stmodal__art" src="' + o.art + '" alt="">' : '') +
      '<h2 class="stmodal__title">' + esc(o.title || '') + '</h2>' +
      (o.meta ? '<p class="stmodal__meta">' + esc(o.meta) + '</p>' : '') +
      '<p class="stmodal__body">' + esc(o.body || '') + '</p>' +
    '</div>';
  let gone = false;
  const close = () => {
    if (gone) return; gone = true;
    removeEventListener('keydown', onKey);
    m.classList.remove('is-in'); m.classList.add('is-out');
    setTimeout(() => m.remove(), T.ovCollapse);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  pressable($('.stmodal__x', m)).addEventListener('click', close);
  m.addEventListener('click', e => { if (e.target === m) close(); });
  $('#stage').appendChild(m);
  requestAnimationFrame(() => m.classList.add('is-in'));
  return m;
}

/* the law. Title is bill_title, body is bill_summary, graphic is the
   police hat from the MANIFEST rather than a literal path — it moved to
   assets/topics/ when the topic icons were framed and the hard-coded
   assets/mk/ path 404'd. internal_sec's entry is the hat. */
function lawModal() {
  /* 65 CSS px x DPR 3 = 195, so 256 is the right entry and 384 would be
     paying for detail no screen can show — over-target is a defect in bytes
     the same way under-target is one in pixels. It was on the 128. */
  const T_ = M.topics && M.topics.internal_sec;
  const h = T_ && (T_['256'] || T_['128']);
  return stickerModal({
    title: issue.bill_title || '',
    meta:  issue.bill_date || '',
    body:  issue.bill_summary || '',
    art:   h ? ROOT + h : '',
  });
}

/* §3.1 the glossary term, on the SAME sticker. It replaces the plain
   white .gdef panel that used to open inline under the term — a second
   light surface with its own radius and its own padding, sitting inside
   a paragraph and pushing the explanation around as it opened and shut.
   The definition is data.js's own; nothing is written here. */
function glossModal(term) {
  return stickerModal({ title: term, body: (DATA.glossary || {})[term] || '' });
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
  /* nothing is pinned yet — the band fills when the player votes, below */

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
          '<img class="b2chair" src="' + ROOT + (M.props.chair['900'] || M.props.chair['300']) + '" alt="">' +
          '<p class="b2taken" aria-live="polite"></p>' +
        '</div>' +
        /* §2 · THE FRAMING LINE, and it is the first and only place the
           121st-MK conceit is stated in words. Until now the bill arrived
           with no introduction at all: the player was asked בעד או נגד on
           legislation they had never been shown. This is the Zeigarnik
           consent line the research asked for and that was never built —
           it says what the thing is (a real bill), who the player is in
           the room (the 121st member), and what they get for answering
           (they find out how the others voted).
           IT IS CHROME, NOT CARD CONTENT. It sits above the prompt inside
           the beat's own pane, at the chyron's weight rather than a
           footnote's — see .b2frame. The law modal is untouched and still
           carries bill_summary on a tap; this is the default-visible
           framing, that is the detail on request. */
        '<p class="b2frame">' +
          esc('זו הצעת חוק אמיתית. כח״כ ה-121, אתם מצביעים במליאה — ואז נראה איך הצביעו האחרים.') +
        '</p>' +                                          /* TAMAR */
        /* A7 · THE PROMPT IS TAMAR'S, from the sheet's תכלס- בגדול column.
           It replaces our generic "איך הייתם מצביעים?" with the issue's
           own framing — "פטור משירות עבור החרדים - בעד או נגד?" — so the
           question names the thing being voted on. Falls back to the old
           line only if the field is empty, which it is on none of the
           eleven active issues. */
        '<p class="b2q">' + esc(issue.tachles_prompt || 'איך הייתם מצביעים?') + '</p>' +
        /* A7 · the law's name, small and tappable, opening the modal. It is
           a SEPARATE field from the prompt — the prompt is the plain-language
           question, this is the bill's formal name — so it is never dug out
           of the prompt text. */
        '<button type="button" class="b2bill b2bill--link" data-law>' +
          esc(issue.bill_title || '') + '</button>' +
        '<div class="v-a-row b2votes">' +
          VOTES.map(v => '<button class="v-a" data-vote="' + v + '">' + VLABEL[v] + '</button>').join('') +
        '</div>' +
        /* §3.2 "את התוצאה נגלה בסוף ›" IS GONE. It was a promise about a
           beat five screens away, printed under the question the player
           is being asked right now, and beat 5 keeps that promise
           whether or not the line was there. */
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

  const law = $('[data-law]', ov);
  if (law) pressable(law).addEventListener('click', e => { e.stopPropagation(); lawModal(); });

  const table = COIN_TABLES[DEV.coins];
  ov.querySelectorAll('[data-vote]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (S.position) return;
      S.position = btn.dataset.vote;
      /* A7 · the choice pins into the band and stays there for the rest of
         the round — through the cascade and into the reveal */
      S.ownVote = btn.dataset.vote;
      pinVote(S.ownVote);
      ov.querySelectorAll('.v-a').forEach(x => x.disabled = true);
      /* §0 · BEAT 2 NOW PAYS, FLAT AND UNCONDITIONALLY. This reverses the
         earlier categorical "beat 2 earns nothing": the reason that rule
         existed was that paying for an opinion looked like grading one,
         and the answer to that is that the award must not DEPEND on the
         opinion — not that there must be no award.
         It is the same 25 for בעד, נגד and נמנע. `btn.dataset.vote` is
         not read here and must never be: the moment this branches on the
         position it becomes a score. There is no correctness argument to
         award(), no verdict colour on the chip, and the coin flies from
         the chosen chip to the counter exactly as it does everywhere
         else — the feedback is "counted", not "correct". */
      award(table.position, btn);

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
    /* BEAT 4 IS OPTIONAL. Five of the eleven active issues arrived from
       Tamar's sheet with no MK vote data at all, and an issue whose bill
       changed does not inherit the old bill's votes. Those rounds run
       claim -> stamp -> tachles -> reveal and the cascade simply does not
       happen: no empty state, no placeholder MKs, no error. */
    if (!S.dealt.length) return beat5();
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

  /* B2-4 · THE MK QUESTION IS A STICKER NOW, not a 17px line under the
     chyron. It slaps on the FIRST card of the cascade and then STAYS —
     it is parented to .cardwrap, so resolved cards swipe out from under
     it and the next one turns over beneath it without the sticker ever
     re-entering. Re-slapping on every card was the v17 board's own
     stated risk for this option ("it repeats on every card, which is
     where it may wear out"); one slap is the version that answers it. */
  if (first) slapAsk(ASK.mk);
  helper('');

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
      /* A8 · THE AVATAR IS NOT ALLOWED IN THIS BAR. It used to be the
         player's own sticker, which put the same object in two places
         meaning two different things: pinned in the chyron it is the
         player's VOTE on the bill, and down here it was their GUESS about
         someone else. One of them had to stop being the avatar, and it is
         this one — the vote is the "121st MK" object and the guess is not.
         Neutral by construction: a punch-hole in paper, no hue at all, so
         it can never be read as a correctness verdict the way a coloured
         mark would. PLACEHOLDER — B4 picks between four treatments. */
      '<span class="gx-m gx-you is-landing" style="right:' + stopPct(guess) + '%" ' +
        'role="img" aria-label="הניחוש שלך">' +
        '<span class="gx-punch" aria-hidden="true"></span>' +
        '<span class="gx-punch__lab">' + ph('הניחוש שלך') + '</span></span>' +
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
  /* §3.1 · THE GAP IS COLOURED BY DISTANCE, and `dist` is already
     Math.abs() — which is what makes it symmetric BY CONSTRUCTION rather
     than by two branches that have to be kept in step. Guessed בעד /
     voted נגד and guessed נגד / voted בעד both give 2 and therefore the
     same class; there is no code path where the direction is read.
     It codes HOW FAR OFF, never WHICH WAY, so the locked rule holds. */
  const dist = Math.abs(VOTES.indexOf(vote) - VOTES.indexOf(guess));
  g.classList.add('gx--d' + dist);
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

/* `override` is the A6 claim reveal passing the TRUE answer — אמת / שקר /
   חלקית — because that stamp reports what was true rather than how the
   player did. Correctness is still carried by `ok`, i.e. by colour alone,
   which is the locked rule. Everywhere else the placeholder copy stands. */
function stamp(ok, override) {
  const word = override || (ok ? D2_COPY_PLACEHOLDER.correct : D2_COPY_PLACEHOLDER.surprise);
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

/* ===== THE SEAT GRID · v20 option 4 ==================================
   THE TITLE, AS A PICTURE. 120 blocks and one more that is the player.
   The civic point of the whole product — you are one seat among 120 —
   delivered as an image instead of a sentence, which is why nothing else
   on this screen may out-weigh it.

   NOT A SEATING CHART, and that is a factual constraint rather than a
   stylistic one. The real chamber is seated by faction, we cannot source
   a true layout, and anything that implied one would be a claim we cannot
   stand behind. So: abstract blocks, an arbitrary 15x8 rectangle, no
   grouping by party, no hemicycle. The order carries no meaning beyond
   "how many".

   THE PLAYER'S SEAT IS THE 121st AND SITS APART, on its own row under the
   120. That is the literal reading of the title and it is also what keeps
   it visible in the empty state, where every other block is dark.

   WHY IT IS CODED BY SHAPE AND NOT BY HUE. It must never be coloured as
   either side. Both side hues are taken, the two correctness hues are
   forbidden, the chyron's cyan is on screen at this beat, and the only
   remaining candidate — --primary yellow — sits dE 21.6 from the נגד
   ecru, which is too close for two squares in one grid. So it is the only
   ROUND block, the only one with a keyline, and the only one set apart.
   Form does the work that hue cannot, and the yellow is then free to say
   "you" the way it does everywhere else in the system.

   THE REMAINDER IS HONEST. for + against does not reach 120 on three of
   the four issues that have a tally — a1 is 53+48 = 101 — and the other
   19 are simply not in the record. They stay dark. Nothing here invents an
   abstention or an absence it was not given. */
const SEATS = 120, SEAT_COLS = 15;

function seatBoard(tally) {
  const cells = [];
  for (let i = 0; i < SEATS; i++) cells.push('<i class="seat" data-i="' + i + '"></i>');
  return '<div class="b5board' + (tally ? '' : ' b5board--empty') + '">' +
      '<div class="b5seats" aria-hidden="true">' + cells.join('') + '</div>' +
      '<div class="b5me">' +
        '<i class="seat seat--me" aria-hidden="true"></i>' +
        '<span class="b5me__lab">' + esc('המושב שלכם') + '</span>' +   /* TAMAR */
      '</div>' +
      (tally
        ? '<div class="b5tal" aria-hidden="true">' +
            '<span class="b5tal__s b5tal__s--for"><b class="num" id="b5for">0</b>' +
              esc(VLABEL.for) + '</span>' +
            '<span class="b5tal__s b5tal__s--ag"><b class="num" id="b5ag">0</b>' +
              esc(VLABEL.against) + '</span>' +
          '</div>'
        : '') +
    '</div>';
}

/* ONE CLOCK DRIVES BOTH, so the numerals and the seats can never disagree
   — the numeral is a readout of the grid, not a second animation that
   happens to finish at the same time. Same --t-finale (850ms) and the
   same cubic ease-out countUp() used, because this IS the round's one held
   beat and the brief asks for that weight rather than a 125ms flick.
   REDUCED MOTION renders the final state and returns; there is no
   shortened animation, because a 1ms fill of 120 blocks is a flash. */
function runTally(panel, tally) {
  const seats = $$('.b5seats .seat', panel);
  const nf = $('#b5for', panel), na = $('#b5ag', panel);
  const paint = (f, a) => {
    for (let i = 0; i < seats.length; i++) {
      const c = i < f ? 'seat is-for' : i < f + a ? 'seat is-ag' : 'seat';
      if (seats[i].className !== c) seats[i].className = c;
    }
    if (nf) nf.textContent = f;
    if (na) na.textContent = a;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paint(tally.for, tally.against);
    return Promise.resolve();
  }
  return new Promise(res => {
    const t0 = performance.now();
    (function tick(now) {
      const k = Math.min(1, (now - t0) / T.finale);
      const e = 1 - Math.pow(1 - k, 3);
      paint(Math.round(tally.for * e), Math.round(tally.against * e));
      if (k < 1) requestAnimationFrame(tick);
      else { paint(tally.for, tally.against); res(); }
    })(t0);
  });
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

  /* ---- 1. the chyron HOLDS — it carries the player's own vote now, and
             that is the one thing the reveal must not contradict. ---- */
  repin();
  await wait(T.resolve);

  /* ---- 2. THE RESULT, IN TAMAR'S OWN WORDS. §A9: the result line is the
             sheet's תוצאות ההצבעה, verbatim prose — "עבר 63 מול 57." or
             three lines about a committee — so it is a paragraph that
             wraps, never a truncated string and never a number we derived.
             THE CLAIM'S TRUTH WORD IS GONE FROM HERE. It used to headline
             this panel; A6 resolves the claim four beats earlier, so
             printing אמת/שקר again would be answering a question the
             player has already been told the answer to.
             The count-up stays where it is when the round has a _tally —
             it is the animated peak — with the prose underneath it. */
  const tally = issue._tally || null;
  const panel = el('div', 'b5panel b5stage' + (tally ? '' : ' b5-nocount'));
  panel.innerHTML =
    seatBoard(tally) +
    (issue.vote_result
      ? '<p class="b5result">' + esc(issue.vote_result) + '</p>'
      : '<p class="b5result">' + ph('[טקסט — תמר: תוצאות ההצבעה]') + '</p>');
  b.appendChild(panel);
  requestAnimationFrame(() => { panel.classList.add('is-in'); fitBeat(); });

  if (tally) { await runTally(panel, tally); await wait(T.hold); }
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
             Describes the pattern; never characterises the guesser.
     SKIPPED ENTIRELY WITHOUT A CASCADE. There is no shape to narrate and
     no anchor MK to complete the sentence on, so both blocks are omitted
     rather than rendered empty — a cascade-less round ends on the result
     and the explanation. */
  if (S.dealt.length) {
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
  }

  /* ---- 6. GLOSSARY CHIPS. §A9: "מילות הרחבה" is a LIST OF TERMS, not
             body text, so it renders as tappable chips under the result
             rather than as a paragraph. Only terms that resolve against
             data.js's own definitions are in `glossary_terms` — the import
             filters the rest — so a chip can never open an empty sheet.
             Six of the eleven active issues have at least one. */
  const terms = issue.glossary_terms || [];
  if (terms.length) {
    const gl = el('div', 'b5gloss b5stage');
    gl.innerHTML = terms.map(t =>
      '<button type="button" class="b5chip" data-term="' + esc(t) + '">' +
        esc(t) + '</button>').join('');
    b.appendChild(gl);
    requestAnimationFrame(() => { gl.classList.add('is-in'); fitBeat(); });
  }

  /* ---- 7. LINKS. further_links is always an array of {label,url}; a link
             whose URL the HTML export did not carry renders DISABLED and
             marked, rather than as a dead anchor that looks live. Video
             labels get a play glyph, everything else a link glyph — the
             label is Tamar's and is never rewritten to fit the glyph.
             The Knesset link joins the same row when there is one. */
  const links = (issue.further_links || []).slice();
  if (issue.knesset_url) links.push({ label: 'ההצבעה באתר הכנסת', url: issue.knesset_url }); /* TAMAR */
  if (links.length) {
    const lk = el('div', 'b5links b5stage');
    lk.innerHTML = links.map(l => {
      const vid  = /^\s*סרטון/.test(l.label || '');
      const icon = vid ? '▶' : '🔗';
      if (!l.url) {
        return '<span class="b5link is-missing" data-missing-url>' +
          '<i aria-hidden="true">' + icon + '</i>' + esc(l.label) + '</span>';
      }
      return '<a class="b5link" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
        '<i aria-hidden="true">' + icon + '</i>' + esc(l.label) + '</a>';
    }).join('');
    b.appendChild(lk);
    requestAnimationFrame(() => { lk.classList.add('is-in'); fitBeat(); });
  }

  /* a chip opens its definition inline, under the row, one at a time */
  b.addEventListener('click', e => {
    const c = e.target.closest('.b5chip'); if (!c) return;
    const open = $('.b5def', b);
    const same = open && open.dataset.term === c.dataset.term;
    if (open) open.remove();
    if (same) { fitBeat(); return; }
    const d = el('p', 'b5def b5stage is-in',
      '<b>' + esc(c.dataset.term) + '</b> — ' + esc(DATA.glossary[c.dataset.term] || ''));
    d.dataset.term = c.dataset.term;
    c.parentElement.after(d);
    fitBeat();
  });

  /* THE ISSUE IS RECORDED, and it is one issue and not a topic. This fills
     ONE segment of the topic's ring; the topic completes only when every
     active issue in it is done, so a two-issue topic still reads 1/2 here
     and דת ומדינה — which has one — completes outright.
     It must run BEFORE the buttons below, because they ask which issues
     are still unplayed. */
  const segsWas   = segsDone(issue.topic);
  const topicsWas = topicsDone();
  PROGRESS[issue.id] = true;
  assertProgress(issue, segsWas, topicsWas);

  /* §0 · THE TWO AWARDS THAT ARE ABOUT FINISHING, NOT ABOUT BEING RIGHT.
     Both are paid HERE, after the issue is recorded, because both are
     consequences of the record rather than of anything the player just
     did on screen.

     ROUND COMPLETION (+50) IS WHY THIS TABLE CHANGED. It pays on reaching
     beat 5, cascade or no cascade, which is what closes the 10:1 gap
     between r1 and the five rounds that have no MK data. A player cannot
     tell from inside a round that its issue arrived from the sheet
     without vote records, and the award must not tell them either.

     TOPIC COMPLETION (+100) WAS IN THE TABLE AND WAS NEVER PAID. Nothing
     read `table.topic` anywhere in this file before now — the row was
     declared with the rest and no call site was ever written for it, so
     completing a topic has been silently worth nothing. Found while
     wiring the round award; it is a real defect, not a decision.

     They are staggered so two flights do not overlap into one blur, and
     both come from the panel — the round is what earned them, and there
     is no single control on screen that either can be said to leave. */
  const finish = COIN_TABLES[DEV.coins];
  setTimeout(() => award(finish.round, panel), T.resolve);
  if (topicsDone() > topicsWas) {
    setTimeout(() => award(finish.topic, panel), T.resolve + T.coinFly + 2 * T.coinStagger);
  }

  fitBeat();
  /* ---- 8. THE WAY OUT. §A9: if the topic has another unplayed issue the
             PRIMARY action opens it directly — the player is already in
             this topic and going back to the map to come straight back is
             a step that buys nothing. When the topic is finished the only
             action is the map, and it becomes primary.
             A one-issue topic (דת ומדינה) has no next issue and therefore
             takes the second branch, which is the same code path as a
             finished two-issue topic. */
  const rest = topicIssues(issue.topic).filter(x => !issueDone(x.id));
  const next = rest[0];
  if (next) {
    const go = el('button', 'p-c b5go b5stage', 'לסוגיה הבאה ›');   /* TAMAR */
    pressable(go).addEventListener('click', () => startRound(next.id));
    b.appendChild(go);
    requestAnimationFrame(() => { go.classList.add('is-in'); fitBeat(); });
    const back = el('button', 'r-b b5back b5stage', 'חזרה למפה');   /* TAMAR */
    pressable(back).addEventListener('click', () => goMap());
    b.appendChild(back);
    requestAnimationFrame(() => { back.classList.add('is-in'); fitBeat(); });
  } else {
    const go = el('button', 'p-c b5go b5stage', 'חזרה למפה ›');
    pressable(go).addEventListener('click', () => goMap());
    b.appendChild(go);
    requestAnimationFrame(() => { go.classList.add('is-in'); fitBeat(); });
  }

  /* the 60s budget, still measured — it just has nowhere on screen to go
     now that the spike bar is off the stage */
  S.machineS = +(machineMs / 1000).toFixed(1);
  S.wallS    = +((performance.now() - S.t0) / 1000).toFixed(1);
}

/* ===== SELF-TEST · the round actually counted =======================
   A rewrite of beat 5 once deleted `PROGRESS[issue.id] = true` and nothing
   said so: the reveal still rendered, the buttons still worked, and the
   only symptom was a map that never filled and a "next issue" that handed
   back the issue just played. This asserts the two things that regression
   broke, at the moment they are supposed to become true, and says so
   loudly rather than leaving it to be noticed on the map.

   It checks CONSEQUENCES, not the assignment: that the issue reads as done
   through the same accessor the map uses, that the topic's filled-segment
   count went up by exactly one, and that the x/N headline moved if and
   only if that was the topic's last unplayed issue. Asserting
   `PROGRESS[id] === true` would have passed on a build where segsDone()
   was reading the wrong list. */
function assertProgress(iss, segsWas, topicsWas) {
  const fail = [];
  if (!issueDone(iss.id))
    fail.push('issueDone(' + iss.id + ') is false right after recording it');
  const segsNow = segsDone(iss.topic);
  if (segsNow !== segsWas + 1)
    fail.push('segsDone(' + iss.topic + ') went ' + segsWas + ' -> ' + segsNow + ', expected +1');
  const wasLast = topicIssues(iss.topic).every(x => issueDone(x.id));
  const topicsNow = topicsDone();
  if (topicsNow !== topicsWas + (wasLast ? 1 : 0))
    fail.push('topicsDone() went ' + topicsWas + ' -> ' + topicsNow +
              ', expected ' + (topicsWas + (wasLast ? 1 : 0)));
  if (fail.length) {
    console.error('%c PROGRESS SELF-TEST FAILED ',
      'background:#FF3BC0;color:#fff;font-weight:bold;padding:2px 8px', fail);
  } else {
    console.log('%c progress ok ',
      'background:#B6E521;color:#22300A;font-weight:bold;padding:2px 6px',
      iss.id + ' done · ' + iss.topic + ' ' + segsNow + '/' + SEGS(iss.topic) +
      ' · map ' + topicsNow + '/' + TOPICS().length);
  }
  return fail;
}
/* assertProgress is a top-level function declaration, so it is already on
   window for the harness to call. Wrapping it in defineProperty — the way
   S and DEV are exposed, because those are `let` and are not — throws
   "Cannot redefine property" and took the whole boot down with it. */

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

   RESOLVED BY THE SHEET. Tamar's set has eleven issues over six topics and
   no bonus among them, so the concept is gone rather than stubbed: no
   marker, no seam, no demo flag. `core` no longer decides anything here —
   it has been reassigned to "first ACTIVE issue in the topic" purely so
   app.js's derived progress maths keeps working, and this file orders by
   array position instead.
   ===================================================================== */

/* issueId -> true. In memory for the session only: the map is a demo
   surface and a client meeting should open on a clean map, not on whatever
   the last person did. Nothing here writes to localStorage. */
const PROGRESS = {};

/* ACTIVE ISSUES ONLY, in data.js's own array order.
   `active:false` retires an issue without deleting it — the row, its MK
   cascade and its tally all stay in data.js, they just stop being playable.
   Ten issues are retired that way: the three in the two cut topics, and
   seven in surviving topics that Tamar's sheet replaced.
   ORDER IS ARRAY ORDER, NOT `core`. It used to sort core-first, but `core`
   is deliberately untouched by the sheet import, so a topic can now have no
   active core issue at all (economy) or an active core:false one (military).
   Array order is the only ordering that still means "first issue". */
const topicIssues = id => DATA.issues
  .filter(i => i.topic === id && i.active !== false);

/* A TOPIC IS ON THE MAP IF IT HAS AN ACTIVE ISSUE. Derived rather than
   flagged, so there is one source of truth: retiring a topic's last issue
   retires the topic, and nothing can disagree about which six are live.
   סביבה ואקלים and ביטחון פנים drop out this way — internal_sec because
   its only remaining issue, חוק המשטרה, was re-parented to branches. */
const TOPICS = () => DATA.topics.filter(t => topicIssues(t.id).length > 0);

/* NO BONUS ISSUES, AND NO SLOT FOR ONE. The satellite marker, hasBonus()
   and ?bonus=demo are all gone. Tamar's sheet defines eleven issues across
   six topics and not one of them is a bonus; the marker was a structural
   placeholder for a concept the content does not have, and a placeholder
   nobody can ever populate is just a thing to explain.
   FOR ROMAN: the shipped app still has the presentation — app.js:546
   offers the topic's `core:false` issue as '🎁 סוגיית בונוס בנושא הזה',
   and app.js:258 says 'יש עוד סוגיות בונוס' at 6/6. Both are now wrong:
   `core` has been reassigned so that the second active issue of each topic
   is ordinary content, not a bonus. */

const issueDone  = id => PROGRESS[id] === true;
/* HOW MANY SEGMENTS THIS TOPIC'S RING HAS. Two for most, ONE for
   דת ומדינה, which the sheet leaves with a single issue — the ring, the
   status line and the next-issue button all read this rather than 2, so a
   one-issue topic can never render "1/2". */
const SEGS       = id => Math.max(1, topicIssues(id).length);
const segsDone   = id => topicIssues(id).filter(i => issueDone(i.id)).length;
const topicDone  = id => { const l = topicIssues(id); return l.length > 0 && l.every(i => issueDone(i.id)); };
/* THE HEADLINE IS TOPICS, never sub-issues. §3.2: 0/16 is a longer and
   more intimidating number for a one-minute game, and the topic is the
   unit the player actually chooses. */
const topicsDone = () => TOPICS().filter(t => topicDone(t.id)).length;
/* the soft nudge, and the only ordering the map has. No lock follows it. */
const currentIdx = () => {
  const T = TOPICS();
  const i = T.findIndex(t => !topicDone(t.id));
  return i < 0 ? T.length - 1 : i;
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
  /* the HUD's centre slot and its RIGHT slot are what differ between the
     two screens. Centre: the issue title in a round, the x/N count on the
     map. Right: the ✕ in a round, the avatar on the map — A4. */
  const t = $('#hudTopic'), pr = $('#hudProgress');
  if (t)  t.hidden  = (name !== 'round');
  if (pr) pr.hidden = (name !== 'map');
  const av = $('#hudAvatar'), x = $('#hudX');
  if (av) av.hidden = (name === 'round');
  if (x)  x.hidden  = (name !== 'round');
}

/* ===== A4 · THE WAY OUT OF A ROUND ==================================
   On beat 1 nothing has been answered and on the final reveal everything
   has, so both leave immediately — a confirm there would be asking the
   player to approve throwing away nothing. In between there is real
   progress that is not saved, so it asks.

   B5-1, BUILT, AND CENTRED IN BOTH AXES. The board drew it as a sheet at
   the foot; §3.3 centres it horizontally AND vertically instead, which is
   what a destructive confirm should do — a bottom sheet is the shape of
   an options menu, and this is not one. It is the same die-cut sticker
   the law modal is, on the same dimmed ground, so the round has exactly
   one modal shape rather than one for content and another for confirms.

   THE QUESTION AND THE CONSEQUENCE ARE TWO LINES NOW. They used to be one
   string doing both jobs — "לצאת מהסוגיה? ההתקדמות בה לא תישמר" — which
   made the consequence read as part of the question rather than as the
   thing the player is agreeing to. §3.3 splits them: the question in
   black at body size, the consequence under it, quieter.

   THREE WAYS TO STAY and one to leave. The ✕, the ground and להישאר all
   dismiss; only לצאת goes. That asymmetry is deliberate — every ambiguous
   gesture resolves toward not losing the round.

   COPY IS OURS AND MARKED. */
const EXIT_COPY = {
  q:    'בטוח/ה שאת/ה רוצה לצאת?',   /* TAMAR */
  note: 'ההתקדמות בסוגיה לא תישמר',   /* TAMAR */
  go:   'לצאת',                       /* TAMAR */
  stay: 'להישאר',                     /* TAMAR */
};

function exitRound() {
  const midRound = S && S.beat > 1 && S.beat < 5;
  if (!midRound) return goMap();

  const sh = el('div', 'exitsheet');
  sh.innerHTML =
    '<div class="exitsheet__box" role="dialog" aria-modal="true">' +
      '<button type="button" class="exitsheet__x" aria-label="סגירה">✕</button>' +
      /* esc(), NOT ph(). The .ph marker is for copy that has not been
         WRITTEN — a bracketed description of what should go there. These
         two are real Hebrew sentences that we wrote and Tamar has to
         approve, which is what the /* TAMAR *\/ markers above are for.
         Struck through ph() they rendered at --fs-meta on a yellow
         hazard stripe, which is neither the 19px black question §3.3
         asked for nor legible on a cream sticker. */
      '<p class="exitsheet__q">' + esc(EXIT_COPY.q) + '</p>' +
      '<p class="exitsheet__note">' + esc(EXIT_COPY.note) + '</p>' +
      '<div class="exitsheet__row">' +
        '<button type="button" class="p-c" data-go>' + esc(EXIT_COPY.go) + '</button>' +
        '<button type="button" class="r-b" data-stay>' + esc(EXIT_COPY.stay) + '</button>' +
      '</div>' +
    '</div>';
  let gone = false;
  const close = () => {
    if (gone) return; gone = true;
    removeEventListener('keydown', onKey);
    sh.classList.remove('is-in'); sh.classList.add('is-out');
    setTimeout(() => sh.remove(), T.ovCollapse);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  pressable($('[data-go]', sh)).addEventListener('click', () => {
    removeEventListener('keydown', onKey); sh.remove(); goMap();
  });
  pressable($('[data-stay]', sh)).addEventListener('click', close);
  pressable($('.exitsheet__x', sh)).addEventListener('click', close);
  sh.addEventListener('click', e => { if (e.target === sh) close(); });
  $('#stage').appendChild(sh);
  requestAnimationFrame(() => sh.classList.add('is-in'));
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
/* §5.2 · PER-GLYPH STROKE COLOURS, BEHIND A FLAG (?title=multi).
   The die-cut stroke is what makes each letter a sticker; giving each one
   its own colour is the difference between one object and a sheet of
   nine. Solid white is still the default and both are live so they can be
   compared on a device.

   THE COLOURS ARE THE SIX LIVE TOPIC HUES, from data.js, in a
   deliberately NON-SPECTRAL order. Cycling them in hue order would draw a
   rainbow across the title, which is the thing that was rejected on the
   chyron for the same reason: in Israel a rainbow reads as a pride
   symbol, one of the six topics is מגדר ושוויון, and the app's own
   wordmark is the last place to put an unintended political statement.
   So adjacent glyphs are far apart in hue and the run never sweeps.
   environment and internal_sec are excluded — they are the two topics
   with no active issue, so their hues appear nowhere else in the build. */
const TITLE_HUES = [
  '#ff5240',  /* economy        */
  '#2b4cff',  /* branches       */
  '#ffd23f',  /* religion       */
  '#b06bff',  /* accountability */
  '#8a9663',  /* military       */
  '#ff6b9d',  /* gender         */
];
const lsGlyph = (ch, i) =>
  '<svg class="g" viewBox="0 0 100 116" aria-hidden="true"' +
    (DEV.title === 'multi'
      ? ' style="--gs:' + TITLE_HUES[i % TITLE_HUES.length] + '"' : '') + '>' +
    '<text x="50" y="92">' + esc(ch) + '</text></svg>';

/* THE INDEX RUNS ACROSS BOTH ROWS. lsRow is called twice — הח״כ then
   ה-121 — and a per-row counter would restart the palette on the second
   line, putting the same colour under the two ה glyphs that sit directly
   above each other. `from` threads one sequence through all nine. */
const lsRow = (str, from) => {
  let i = from || 0;
  const glyphs = t => [...t].map(ch => lsGlyph(ch, i++)).join('');
  return '<span class="i-ls" aria-label="' + esc(str) + '">' +
    str.split(/(\d+)/).filter(Boolean).map(part =>
      /^\d+$/.test(part) ? '<span class="i-run">' + glyphs(part) + '</span>'
                          : glyphs(part)
    ).join('') + '</span>';
};

function renderIntro() {
  const r = $('#scIntro');
  /* A1 · THE STRIPED LEDE PILL IS GONE, and so is the note under the CTA.
     The pill held Tamar's unwritten headline; on a phone it sat above the
     composite as a loud yellow bar that read as a system message rather
     than as part of the screen, and it pushed the whole group down. The
     note under the CTA ("סוגיה אחת = דקה · אפשר לשחק כמה שרוצים") is
     shipped copy but it is the third line of small print under the one
     action, and removing it is what lets title + chair + tagline + CTA
     close up into a single composed group.
     BOTH STRINGS SURVIVE IN INTRO_COPY — they are not deleted from the
     file, only from the screen, so putting either back is one line. */
  r.innerHTML =
    '<div class="i-comp">' +
      '<div class="i-title">' + lsRow(INTRO_COPY.t1, 0) +
        lsRow(INTRO_COPY.t2, [...INTRO_COPY.t1].length) + '</div>' +
      /* SIZED IN CSS, NOT HERE. An inline width/height beats the
         stylesheet, so the vh clamp that keeps the composite inside a
         667px phone was being overridden by the board's own 278x324 and
         the intro overflowed the stage by 86px. */
      '<img class="i-chair" src="' + ROOT + (M.props.chair['900'] || M.props.chair['300']) + '" alt="">' +
    '</div>' +
    '<p class="i-sub">' + esc(INTRO_COPY.sub) + '</p>' +
    '<p class="i-para">' + esc(INTRO_COPY.para) + '</p>' +
    '<div class="i-stage" aria-hidden="true">' +
      '<img class="i-build" src="' + ROOT + (M.props.building['1170'] || M.props.building['390']) + '" alt=""></div>' +
    '<button type="button" class="p-c i-cta">' + esc(INTRO_COPY.cta) + '</button>';

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
const NODE_SERPENTINE = [.7682, .6341, .3659, .2318, .3659, .6341, .7682, .6341];
/* the board drew eight; the sheet leaves six. Taking the first N keeps the
   board's own x positions and its single S-curve rather than inventing a
   new serpentine for every count. */
const NODE_X = i => NODE_SERPENTINE[i % NODE_SERPENTINE.length];

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
  const h = pathHeight();
  const cur = currentIdx();

  /* NO viewBox HERE. It is set by drawPath() from the window's MEASURED
     width, because the ribbon is a 23px stroke and the old
     preserveAspectRatio="none" fit stretched x independently of y — which
     turned a round cap into an ellipse and made the path 9% wider than it
     is at 393px. A bead trail hid that; a ribbon cannot. */
  r.innerHTML =
    '<div class="mapwin scrolls" id="mapwin">' +
      '<div class="path" id="mappath" style="height:' + h + 'px">' +
        /* §1.1 NO MASK. The ribbon is ONE uncut path from the bottom edge
           of the scroll area to the top; the discs paint over it. See
           drawPath(). */
        '<svg class="path-line" id="mapline" aria-hidden="true">' +
          '<path class="pl-under" d=""></path><path class="pl-dots" d=""></path>' +
        '</svg>' +
        TOPICS().map((t, i) => nodeHTML(t, i, h, cur)).join('') +
      '</div>' +
    '</div>' +
    '<button type="button" class="map-jump" id="mapjump">' +
      '<i aria-hidden="true">↓</i>חזרה לנושא הנוכחי</button>';

  paintHud();
  /* SHOW IT BEFORE MEASURING IT. A hidden element has no clientHeight and
     will not take a scrollTop, so parking the window on the current node
     silently did nothing and the map opened at the top of the path — and
     for the same reason drawPath() would have read a width of 0 and fallen
     back to the board's 358 on every viewport. */
  showScreen('map');
  drawPath(h);
  wireMap(cur, h);
}

/* the path height is a pure function of the topic count and the two pads,
   so a redraw does not need anything the first draw was given */
function pathHeight() {
  return parseFloat(CSVAR('--node-pad-top')) + PADB() + (TOPICS().length - 1) * GAP();
}
function redrawPath() { drawPath(pathHeight()); }

/* THE RING, in the node box's own units. Everything here is derived from
   --ring-r so the SVG cannot fall out of step with the CSS that sizes the
   box around it, and each arc carries the board's own 27.2-degree gap —
   the proportion is the board's even though the radius is not. */
function ringGeom(n) {
  const box = parseFloat(CSVAR('--node-box'));
  const r   = parseFloat(CSVAR('--ring-r'));
  const c   = box / 2;
  const circ = 2 * Math.PI * r;
  /* N SEGMENTS, NOT ALWAYS TWO. The circle is divided n ways and each arc
     keeps the board's 27.2-degree gap, so a one-issue topic draws ONE arc
     with a single break in it rather than a full circle that would read as
     already complete. */
  const seg  = circ / Math.max(1, n);
  const gap  = circ * (27.2 / 360);
  return { box, r, c, seg, dash: Math.max(1, seg - gap), rest: circ - Math.max(1, seg - gap) };
}

function nodeHTML(t, i, h, cur) {
  const done = topicDone(t.id), segs = segsDone(t.id);
  const cls = 'node' + (i === cur ? ' is-current' : '') + (segs === 0 ? ' is-untouched' : '');
  const cy  = nodeY(i, h);
  const n   = SEGS(t.id);
  const G   = ringGeom(n);
  /* one circle per segment, so a segment is a real element with its own
     state rather than a fraction of one stroke */
  const seg = k =>
    '<circle class="seg ' + (k < segs ? 'seg-on' : 'seg-off') + '" cx="' + G.c +
      '" cy="' + G.c + '" r="' + G.r + '" fill="none" stroke-dasharray="' +
      G.dash.toFixed(2) + ' ' + G.rest.toFixed(2) + '" stroke-dashoffset="' +
      (-k * G.seg).toFixed(2) + '" stroke-linecap="round"></circle>';

  /* §2 THE ICON IS SIZED BY AREA, not by its larger dimension. node_scale
     is measured per icon in tools/make_manifest.py and averages 1.0, so the
     rendered size is --node-ico-avg times that and nothing else — the eight
     then carry roughly the same visual mass instead of the same longest
     edge, which is what made the seal read huge next to the receipt.
     §3 THE SOURCE IS THE 256px FILE. These render at 36-49 CSS px, so a
     3x phone asks for 107-147 DEVICE pixels; the 64px file it used to load
     was being upscaled about 2.5x, and that was the softness on device.
     256 downscales 1.7-2.4x instead, which is the right direction. */
  const T_ = M.topics && M.topics[t.id];
  const art = T_ && (T_['256'] || T_['128'] || T_['64']);
  let face;
  if (art) {
    const S = parseFloat(CSVAR('--node-ico-avg')) * (T_.node_scale || 1);
    const a = T_.aspect || 1;
    const w = a >= 1 ? S : S * a, hh = a >= 1 ? S / a : S;
    /* §1.4 NO TILE. The cream stadium and the overhang are gone; the icon
       is laid straight on the disc and centred by .node-ico. Its size is
       still area-normalised, which is the part of the old treatment that
       was solving a real problem. */
    face =
      '<img class="node-ico" src="' + ROOT + art + '" alt="" style="width:' +
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
      'style="left:calc(' + (NODE_X(i) * 100).toFixed(2) + '% - ' + G.c + 'px);top:' +
      (cy - fcy) + 'px;--tc:' + t.color +
      ';--tc-face:' + t.color +
      ';--tc-shade:color-mix(in srgb,' + t.color + ' 78%,#000)">' +
    '<span class="ringnode">' +
      '<svg class="ring" viewBox="0 0 ' + G.box + ' ' + G.box + '" aria-hidden="true">' +
        '<g transform="rotate(-90 ' + G.c + ' ' + G.c + ')">' +
          Array.from({ length: n }, (_, k) => seg(k)).join('') + '</g></svg>' +
      '<button type="button" class="node-face" ' +
        'aria-label="' + esc(t.label + ' — ' + segs + ' מתוך ' + n) + '">' +
        face +
        '<span class="node-num" aria-hidden="true">' + (i + 1) + '</span>' +
        (done ? '<span class="node-check" aria-hidden="true">✓</span>' : '') +
      '</button>' +
    '</span>' +
    '<span class="node-name">' + esc(t.label) + '</span>' +
    '<span class="node-status">' + statusLine(t.id) + '</span>' +
  '</div>';
}

/* THE STATUS READS WITHOUT COLOUR — it is the same information the ring
   carries, in words, which is what makes the node legible at 360px to
   somebody who cannot separate the two hues. No lock, ever. */
function statusLine(id) {
  const s = segsDone(id), n = SEGS(id);
  if (topicDone(id)) return '✓ הושלם';
  /* the shipped app's own string, app.js:274 — and the fraction goes
     through .num like every other numeral in the prototype (§7), so it
     stays an LTR run inside the RTL line instead of relying on the bidi
     algorithm to guess what a slash between two digits is. */
  return N(s + '/' + n) + ' סוגיות';
}

/* one smooth serpentine through the node centres, vertical tangents at
   every node so the ribbon arrives square to the face.
   IT IS DRAWN IN REAL PIXELS. The node positions are percentages, so the
   only way the stroke stays circular and the ribbon stays centred on the
   discs at 375, 393 and 430 is to measure the window and give the SVG a
   1:1 viewBox. Called again on resize for the same reason. */
function drawPath(h) {
  const path = $('#mappath'); if (!path) return;
  const w = path.clientWidth || 358;
  $('#mapline').setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  const pts = TOPICS().map((t, i) => [
    NODE_X(i) * w, nodeY(i, h)
  ]);

  /* §5.3b · THE RIBBON EXISTS BETWEEN NODES ONLY. It used to be drawn
     from h+24 to -24 so it ran off both ends of the scroll area — that
     was §1.5 of the previous brief, written to answer "the map doesn't
     reach the edges". It answered the wrong question: the SURFACE was
     what stopped short of the viewport (see §5.3 in proto.css), not the
     road. The surface reaches the edges now, and the stubs past the first
     and last nodes are gone with this — the path starts at node 1 and
     ends at node N. */
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], t = (y1 - y0) / 3;
    d += ' C' + x0.toFixed(1) + ' ' + (y0 + t).toFixed(1) +
         ',' + x1.toFixed(1) + ' ' + (y1 - t).toFixed(1) +
         ',' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }
  $('#mapline').querySelectorAll('path').forEach(p => p.setAttribute('d', d));
}

/* §1.1 WHY THERE IS NO LONGER A MASK, and why that is the structural fix
   rather than the cosmetic one.

   The mask punched a hole of r = --ring-r at every node centre, so the
   ribbon ended on the ring's CENTRELINE and the ring stroke was supposed
   to cover the cut. Two things made that fail, and neither is tunable:
     · the segments have the board's 27.2-degree gaps in them, and for a
       two-issue topic those gaps land at the TOP and the BOTTOM of the
       ring — exactly where the ribbon arrives. There is no stroke there
       to cover anything, at any weight.
     · inside the ring's inner edge the ground is charcoal, and the mask
       had removed the ribbon from all of it. So even where the stroke did
       cover the cut, the annulus between the disc and the ring showed
       charcoal where the road should have been.
   Thickening the stroke (the third option in the brief) fixes neither: it
   narrows the annulus without closing it and does nothing about the gaps.
   Shrinking the hole to the disc's radius (the first) fixes both, but it
   leaves a mask whose radius has to be kept in step with --node-face and
   --node-depth by hand, and a hole that is a few px too large puts the
   charcoal ring straight back.

   So the mask is gone. The ribbon is one uncut path and the DISC covers
   it — .node is z-index 2 over .path-line's 1, which was already true and
   is now the only thing doing the work. The path cannot read as severed
   because it is not cut, and there is no second radius to drift.

   WHAT IS NOW VISIBLE INSIDE THE RING is the ribbon itself, crossing the
   7px of open ground between the disc and the ring at the top and bottom
   of every node. That is the road passing behind the node, which is what
   it should look like, and it is only legible at all because 1.4 pulled
   the ring back in — at the 18.5px stand-off the old overhang forced, the
   same ribbon read as a bar across the gap. */

function wireMap(cur, h) {
  const win = $('#mapwin'), jump = $('#mapjump');
  const curY = nodeY(cur, h);

  /* PARK THE FIRST INCOMPLETE NODE IN THE LOWER THIRD. Two thirds down the
     window, so what is above it — everything still to play — is what fills
     the screen, and the climb reads as the point of the map. */
  const park = () => { win.scrollTop = Math.max(0, curY - win.clientHeight * 0.667); };
  park();

  const onScroll = () => {
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
    pressable(btn).addEventListener('click', () => openTopic(node.dataset.topic));
  });
}

/* the map's own HUD: the topics-complete count and the coin total */
function paintHud() {
  const pr = $('#hudProgress');
  if (pr) pr.innerHTML = '<span class="num">' + topicsDone() + '/' + TOPICS().length + '</span>';
  const cn = $('#coinNum'); if (cn) cn.textContent = wallet;
}

function goMap() {
  renderMap();
  const m = $('#scMap');
  m.classList.remove('is-arriving'); void m.offsetWidth; m.classList.add('is-arriving');
}

/* MAP -> ROUND. One transition, cheap, under the 350ms cap: the map drops
   back and fades while the round comes up over it.

   ALL SIXTEEN ISSUES OPEN NOW. The round builder never knew anything about
   s1 — it reads data.js by id and always did — so the only thing that made
   s1 special was this function refusing to hand it anything else. Every
   node opens its topic's first UNPLAYED issue, which is the core one until
   it is done and the second one after that.

   THREE THINGS DEGRADE rather than block, and every one of them is a
   CONTENT gap in data.js, not a broken beat:
     · no _tally (e2 b2 g1 g2 a2 v2 s2 m1) — beat 5 already drops the
       count and the "with your vote" line and marks the missing figure;
       see the tally guard there.
     · tf_answer "partial" (v1) — already treated as correct, so the claim
       cannot be scored against the player.
     · no issue artwork (14 of 16) — beat 1 falls back to the topic's own
       object; see the art fallback there.
   Nothing is fabricated for any of them. */
function openTopic(topicId) {
  const first = topicIssues(topicId).find(i => !issueDone(i.id)) || topicIssues(topicId)[0];
  if (!first) return;
  const m = $('#scMap');
  m.classList.add('is-leaving');
  setTimeout(() => {
    m.classList.remove('is-leaving');
    startRound(first.id);
    const rd = $('#scRound');
    rd.classList.remove('is-entering'); void rd.offsetWidth; rd.classList.add('is-entering');
  }, T.screen);
}

/* ===================== boot ========================================= */
/* THE ROUND, which is now one screen of three rather than the whole app.
   It no longer resets the coin count: the wallet belongs to the session
   and the map is the thing you come back to with it. */
function startRound(issueId) {
  applyDev();
  helper('');
  /* the chyron is emptied, never removed: it holds its box on beat 1 so
     the card is the same size before and after the answer is given */
  const c = $('#chyron');
  c.innerHTML = ''; c.classList.add('is-empty'); c.setAttribute('aria-hidden', 'true');
  newRound(issueId);
  /* §B the topic the issue belongs to, from data.js, centred in the HUD
     and present on every beat — the round is one issue inside one topic
     and the HUD is the only thing on screen that can say which.
     Read AFTER newRound(), which is what resolves `issue`. */
  /* A5 · THE CENTRE OF THE HUD IS THE ISSUE, NOT THE TOPIC. The player
     chose the topic on the map a second ago; what they cannot see from
     inside the round is which of its issues they are in. data.js carries
     both a short `title` (חוק הגיוס) and a long `bill_title` (החלת דין
     רציפות על חוק הגיוס) — the short one is the header, per A5. */
  const t = $('#hudTopic');
  if (t) t.textContent = issue.title || issue.bill_title || '';
  showScreen('round');
  beat1();
  sizeStage();
}

/* §4.1 THE DEFAULT AVATAR IS ASSIGNED INSTANTLY, guest included. There is
   no step where the player is asked to make one, and nothing gates on it. */
function boot() {
  applyDev();
  $('#hudAvatar').innerHTML = AV3;
  pressable($('#hudX')).addEventListener('click', exitRound);
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
