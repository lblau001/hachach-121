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
  loadFade:  ms('--t-load-fade'),
  loadRise:  ms('--t-load-rise'),
  loadBarIn: ms('--t-load-barin'),
  loadFill:  ms('--t-load-fill'),
  loadHold:  ms('--t-load-hold'),
  lxBar:     ms('--t-lx-bar'),
  lxHold:    ms('--t-lx-hold'),
  lxZoom:    ms('--t-lx-zoom'),
  lxDest:    ms('--t-lx-dest'),
  tcLetters:  ms('--t-tc-letters'),
  tcAvAt:     ms('--t-tc-av-at'),
  tcResolveAt:ms('--t-tc-resolve-at'),
  tcTravelAt: ms('--t-tc-travel-at'),
  tcTravel:   ms('--t-tc-travel'),
  tcNextAt:   ms('--t-tc-next-at'),
  tcTapAt:    ms('--t-tc-tap-at'),
  f5Count:   ms('--t-f5-count'),
  f5Flare:   ms('--t-f5-flare'),
  f5Prose:   ms('--t-f5-prose'),
  f5Gap:     ms('--t-f5-gap'),
  f5Flight:  ms('--t-f5-flight'),
  f5CoinHold:ms('--t-f5-coin-hold'),
  f5CoinOut: ms('--t-f5-coin-out'),
  f5In:      ms('--t-f5-in'),
  f5Recentre:ms('--t-f5-recentre'),
  f5BnrOut:  ms('--t-f5-bnr-out'),
  claimHold: ms('--t-claim-hold'),
  claimBeat: ms('--t-claim-beat'),
  seatFill:  ms('--t-seat-fill'),
  seatCross: ms('--t-seat-cross'),
  markGap:   ms('--t-mark-gap'),
  panelGap:  ms('--t-panel-gap'),
  peel:      ms('--t-peel'),
  peelOut:   ms('--t-peel-out'),
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
  /* §3 · the title's sticker edge. `solid` is the shipped white and the
     default; `keyline-multi` adds a coloured outer stroke per glyph from
     the topic palette; `keyline-one` adds the same in a single accent.
     The old filled `multi` is removed — see lsGlyph(). */
  title:  qPick('title', { solid:'solid', 'keyline-multi':'keyline-multi',
                           'keyline-one':'keyline-one' }, 'solid'),
  /* the banner's accent halo. on ships; off is for the side-by-side. */
  neon:   qPick('neon', { on:'on', off:'off' }, 'on'),
  /* §S-1 the finale bar's two fills. `spec` is the approved pair and
     ships; `neutral` is the valence-free pair, for the comparison. */
  f5bar:  qPick('f5bar', { spec:'spec', neutral:'neutral' }, 'spec')
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
addEventListener('resize', placeChyron);
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
/* ===================== §V21-1 · THE INVERTED ROUND ==================
   The cascade run backwards: instead of a named MK whose vote is guessed,
   ONE MK whose face is withheld and whose vote is stated. The player
   names them. It is a different question about the same fact.

   ONE ISSUE, AND a2 IS NOT AN ARBITRARY PICK. Only 6 of the 11 active
   issues carry MK vote data at all, and accountability is the ONLY topic
   holding two of them (a1 and a2). So a2 is the single place in the game
   where the player is guaranteed to have just played a normal cascade in
   the SAME TOPIC, arriving here by לסוגיה הבאה — pattern first, break
   second. Converting any other issue would delete its topic's only
   cascade and the break would have nothing to break from.
   DO NOT SPREAD IT. The normal cascade is already only in 6 of 11. */
const INVERTED_ISSUE = 'a2';

/* the four held steps. Each is held INV_STEP_MS, so step i occupies
   [i*1400, (i+1)*1400) and the last lands its full hold at 5600ms — four
   steps, 1.4s apart, settled at 5.6s.
   IT NEVER REACHES ZERO while the question is open. 1px is a softened
   photograph of a real politician, which is fine; the sequence has no
   step that deforms a face, because every step is a Gaussian blur and a
   Gaussian blur cannot deform — it only removes. That is the whole
   reason the mechanic is blur and not pixelation, mosaic or warp. */
/* 13 -> 9 -> 5.5 -> 3, not 13 -> 7 -> 3 -> 1. On the first ramp nearly
   all the information arrived between 13 and 7 and the last step was
   almost free — 3px and 1px are both plainly readable, so the final
   1.4s cost 5 coins for a face the player already had. This spaces the
   steps by how much they REVEAL rather than by how much blur they
   remove, and it ends at 3px rather than 1px, which keeps the last step
   a real decision and keeps the settled state short of a clean photo. */
const INV_BLUR    = [13, 9, 5.5, 3];
const INV_STEP_MS = 1400;
const INV_SETTLE  = INV_BLUR.length * INV_STEP_MS;          /* 5600 */

/* the decaying bonus over the existing floor. NEVER RENDERED BEFORE THE
   ANSWER — see the note on the reward sticker in armInverted(). The
   trade-off is legible from the blur itself: sharper face, easier
   question, less coin. Index is the step the player answered on. */
const INV_BONUS = [25, 15, 10, 5, 0];

/* THE DEALING RULE, and it had to be written rather than assumed. It is
   TWO constraints, and the second one only became visible once the first
   was built and the deal was read back off the running page.

   1 · THE STATED VOTE MUST NOT IDENTIFY THE ANSWER.
   a2 is 3 for / 3 against, so an unconstrained trio hands the player
   one, two or three names all holding the stated vote at random. The
   question is "who is this" and its answer is the FACE — there is never
   more than one correct name — but how far the stated vote narrows the
   field is a design decision, not an accident:
     one of three holds it  -> the clue is SUFFICIENT. a2's split IS the
       coalition/opposition line, so anyone who can read that answers
       without ever looking at the face and the blur is decoration again
       — which is the flaw that got the earlier options rejected.
     two of three hold it   -> the clue narrows three to two and the FACE
       decides. Knowledge helps; recognition finishes.
   Shipping two.

   2 · THE FREE PARTY HINT MUST NOT IDENTIFY THE ANSWER EITHER, and this
   is the one that nearly shipped broken. In a2 all three `for` MKs are
   הליכוד and each of the three `against` MKs is a party of one. So if
   the pictured MK is drawn from the opposition side, "the party is יש
   עתיד" IS the answer, spelled out, for free, in one tap. A hint that
   resolves the question is a solve button, and a free solve button is
   the round not existing.
   So the pictured MK is drawn only from those who have same-party
   company in the pool, and EXACTLY ONE distractor shares their party.
   The hint then always narrows three to two and never to one.

   WHAT FALLS OUT OF THIS IN a2, and it is a fact about the data rather
   than about the rule: party and vote are perfectly correlated on the
   coalition side, so the pair the vote clue leaves and the pair the
   party hint leaves are THE SAME PAIR. The hint is redundant with the
   stated vote for a player who reasons from the vote, and still useful
   to one who does not. It is never misleading and never sufficient,
   which is the bar. On an issue whose parties cross the vote line the
   two clues would narrow to different pairs and intersect on the
   answer — the rule is written for that case too. */
const INV_SAME_VOTE_DISTRACTORS = 1;

/* seeded so a screenshot is reproducible and a playtest is repeatable */
const INV_SEED = (n => n > 0 ? n : 7)(parseInt(Q.get('invseed'), 10));

function invPlan(iss) {
  /* §V21 CONSTRAINT · THE ROUND MAY ONLY DEAL MKs THAT HAVE AN
     ILLUSTRATION. A card whose whole content is a face cannot fall back
     to an initials badge — the badge would BE the answer, spelled out.
     So the pool is filtered by the manifest, not by data.js, and the
     shortfall is reported rather than papered over. This binds on every
     cascade still to be written. */
  const pool  = iss.politicians.filter(p => M.politicians && M.politicians[p.id]);
  const noArt = iss.politicians.filter(p => !(M.politicians && M.politicians[p.id]));
  const party = p => DATA.politicians[p.id].party;
  if (pool.length < 3) return { fail:'pool', pool, noArt };

  /* constraint 2: the pictured MK needs same-party company to hide
     behind, and someone outside the party to be told apart from */
  const cands = pool.filter(p =>
    pool.some(q => q.id !== p.id && party(q) === party(p)) &&
    pool.some(q => party(q) !== party(p)));
  if (!cands.length) return { fail:'party', pool, noArt };

  /* THE SEED IS SCRAMBLED AND THE FIRST DRAWS ARE BURNED. lcg()'s first
     output is x*1664525 + 1013904223, and for any small seed the
     increment dominates the product — seeds 1, 7, 13, 42 and 99 all
     returned ~0.236 on the first call and therefore all picked the same
     pictured MK. Multiplying the seed into the high bits first and
     discarding two draws puts the generator past that. */
  const r = lcg((INV_SEED * 2654435761) >>> 0);
  r(); r();
  const take = a => a.splice((r() * a.length) | 0, 1)[0];
  const shown = cands[(r() * cands.length) | 0];

  const sameParty = pool.filter(p => p.id !== shown.id && party(p) === party(shown));
  const offParty  = pool.filter(p => party(p) !== party(shown));

  /* exactly one same-party distractor, then one from outside it,
     preferring one who also voted differently so the stated vote
     narrows the field as well */
  const opts = [shown, take(sameParty)];
  const offDiffVote = offParty.filter(p => p.vote !== shown.vote);
  opts.push(offDiffVote.length ? take(offDiffVote) : take(offParty));

  /* display order is shuffled, or the answer is always in one slot */
  for (let i = opts.length - 1; i > 0; i--) {
    const j = (r() * (i + 1)) | 0; [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return {
    shown, options: opts, noArt,
    sameVote:  opts.filter(o => o.vote === shown.vote).length,
    sameParty: opts.filter(o => party(o) === party(shown)).length
  };
}

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

  /* the inverted round deals ONE card, and it is the pictured MK's. The
     deck, the pile count and the flip are all unchanged — the card still
     turns over out of the same deck, because the break is in the QUESTION
     and pretending it is a different object would hide that. */
  const inv = (issue.id === INVERTED_ISSUE && issue.politicians.length) ? invPlan(issue) : null;

  S = {
    beat: 1, claim: null, position: null,
    dealt: (inv && !inv.fail) ? [inv.shown] : dealt,
    ci: 0, guesses: {}, phase: 'predict',
    inv: (inv && !inv.fail) ? inv : null, invStep: 0, invTimers: [],
    coins: 0, t0: 0, awarded: {}
  };
  /* a pool too small to ask the question falls back to the normal
     cascade rather than to a broken screen */
  if (inv && inv.fail) console.warn('[inv] pool too small, falling back to cascade', inv);
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
/* the banner is absolute at stage level now, so its box comes from the
   slot that stayed behind in the round's flow. Cheap, and it has to run
   whenever the slot could have moved: on every pin, on the beat-1 chip,
   and on resize. */
function placeChyron() {
  const c = $('#chyron'), slot = $('#chyronSlot'), st = $('#stage');
  if (!c || !slot || !st) return;
  const r = slot.getBoundingClientRect(), s = st.getBoundingClientRect();
  if (!r.width) return;
  c.style.left  = (r.left - s.left) + 'px';
  c.style.top   = (r.top  - s.top)  + 'px';
  c.style.width = r.width + 'px';
  c.style.minHeight = r.height + 'px';
}

function pinVote(vote) {
  const c = $('#chyron');
  placeChyron();
  c.classList.remove('is-empty');
  c.removeAttribute('aria-hidden');
  /* B-5 · THE BANNER IS A STICKER, SIZED TO ITS CONTENTS. It is no longer
     the chyron box itself — .chyron is now only the reserved 44px slot
     that positions it, and .bnr is the object inside. That is what takes
     the band from 361px holding 119px of content to a pill that cannot be
     empty by construction. */
  c.innerHTML =
    '<span class="bnr bnr--vote">' +
      '<span class="chyron-av as-d" aria-hidden="true">' + AV3 + '</span>' +
      /* esc(), not ph(): written Hebrew pending Tamar, not a description
         of copy that does not exist. */
      '<span class="chyron-line">' + esc('הצבעת:') +   /* TAMAR */
        '<b>' + esc(VOTE_PIN[vote] || '') + '</b></span>' +
    '</span>';
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
  const front = el('article', 'mf-b mkcard' + (S.inv ? ' mf-b--inv' : ''));
  /* §V21-1 THE INVERTED FACE. The portrait fills the card exactly as it
     does in the cascade — same element, same 118% crop, same top — and
     the ONLY differences are the blur and the fact that NOTHING NAMES
     THE PERSON. No name, no party, no basis, no peel cover: the whole
     round rests on the card carrying no identity, so .mf-b__id is not
     hidden here, it is never built. There is nothing in the DOM for a
     screen reader or a devtools inspector to give away. */
  if (S.inv) {
    front.style.setProperty('--inv-blur', INV_BLUR[0] + 'px');
    front.innerHTML =
      '<span class="mf-b__halo"></span>' +
      (art
        ? '<img class="mf-b__port" src="' + ROOT + (art.hi || art['400']) + '" alt="">'
        : '<span class="mf-b__badge">?</span>');
    d.append(back, front);
    return d;
  }
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
    /* §1.4b THE PARTY LABEL STILL STAYS — it is COVERED, not hidden, and
       that distinction is the whole of A-1. Hiding the field outright was
       rejected for dumping complexity on a 17-year-old as noise; a cover
       that peels off in one tap keeps the information one gesture away
       and makes the player choose when to have it. Nothing is removed
       from the DOM, so a screen reader gets the party either way — the
       concealment is a visual game move, not a data one.
       FREE. There is no coin cost and no price anywhere near it: coins
       are earned and never spent until the end-game allocation, and
       charging for the one thing the game promises not to withhold would
       be the wrong signal. A-3 was rejected on exactly that.
       THE IDENTITY BLOCK DOES NOT MOVE. Name and party stay at the top of
       the card where they have always been — .mf-b__id is top:18px —
       because RTL reading order is who -> face -> choice, and a tappable
       covered slot directly above three vote chips invites misfires. */
    '<div class="mf-b__id"><h2>' + esc(pol.name) + '</h2>' +
      '<p class="pty"><span class="pty__val">' + esc(pol.party) + '</span>' +
        '<button type="button" class="pcov" aria-label="' +
          esc('גילוי המפלגה') + '">' +                       /* TAMAR */
          '<i class="pcov__face" aria-hidden="true">' +
            '<b class="pcov__lab">' + esc('מפלגה') + '</b>' + /* TAMAR */
          '</i>' +
          '<i class="pcov__curl" aria-hidden="true"></i>' +
        '</button>' +
      '</p></div>';
  d.append(back, front);
  wirePeel(front);
  return d;
}

/* ===== A-1 · THE PEELING COVER ======================================
   CSS-DRIVEN, JS ONLY SEQUENCES IT. Every phase is a keyframe animation
   on a compositor-friendly property, so the peel cannot drop frames the
   way a rAF loop writing clip-path would, and prefers-reduced-motion is
   answered by a media query rather than by a branch in here. This
   function does three things: it takes the tap, it advances the class
   at the end of each phase, and it removes the node. See .pcov.

   ONE WAY ONLY. There is no re-cover: the button is removed from the DOM
   the moment the cover has fallen, so a card that has been peeled cannot
   be un-peeled, and the state cannot desync from the animation. */
function wirePeel(card) {
  const cov = $('.pcov', card); if (!cov) return;
  const chip = cov.parentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  pressable(cov).addEventListener('click', async e => {
    e.stopPropagation();                 /* never counts as a vote */
    if (cov.dataset.done) return;
    cov.dataset.done = '1';
    cov.disabled = true;
    if (reduced) { cov.remove(); chip.classList.add('is-open'); return; }
    /* 1 · the sheet lifts from the leading edge and curls as it goes,
           uncovering the party line behind it */
    cov.classList.add('is-peeling');
    await wait(T.peel);
    /* 2 · and is discarded — it leaves the card on an arc rather than
           sliding or fading. The party line settles on the same tick, so
           the landing belongs to the reveal and not to the exit. */
    cov.classList.add('is-gone');
    chip.classList.add('is-open');
    await wait(T.peelOut);
    cov.remove();
  });
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
  /* §V21-1 · the inverted question. The VOTE IS STATED and the identity
     is the unknown — the exact inverse of ASK.mk, which is why it reads
     off the same sticker in the same place. The vote word comes from
     VLABEL so it can never disagree with the card. */
  inv:   v => 'הח״כ הזה הצביע ' + VLABEL[v] + ' — מי זה?',   /* TAMAR */
  invHint: 'רמז: המפלגה',                  /* TAMAR */
  invSharp:'חדות התמונה',                  /* TAMAR */
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
  /* §4d · THE MARK IS THE PLAYER'S, and it has to look it. As a bare
     coloured chip in the chyron it was tied to nothing: on a שקר round it
     read as a lime chip sitting beside a false claim, i.e. as a verdict on
     the CLAIM rather than on the person who answered. It now carries the
     avatar — the same AV3 that is the player everywhere else in the app,
     in the HUD and pinned in this very slot two beats later — so the
     colour attaches to a face and the sentence reads "you were right",
     not "this is right".
     §4c · AND IT LEAVES THE BAND BEHIND. .is-mark strips the chyron's
     band — the fill, the neon and the full width — so what is on screen
     is the chip alone rather than a chip in 250px of empty grey. The 44px
     box is still RESERVED, because that is what keeps the card the same
     size before and after the answer. */
  const chip = el('div', 'bnr cmark ' + (ok ? 'cmark--ok' : 'cmark--sur'),
    '<span class="cmark__av as-d" aria-hidden="true">' + AV3 + '</span>' +
    '<span>' + esc(ok ? CLAIM_MARK.ok : CLAIM_MARK.bad) + '</span>');
  const chy = $('#chyron');
  placeChyron();
  chy.classList.remove('is-empty'); chy.classList.add('is-mark');
  chy.removeAttribute('aria-hidden');
  chy.innerHTML = ''; chy.appendChild(chip);

  const table = COIN_TABLES[DEV.coins];
  if (table.claimNeedsCorrect && ok) setTimeout(() => award(table.claim, mark), T.stamp);

  /* §0 · THREE MOVEMENTS, IN ORDER, AND NOTHING ELSE MOVES.
       1  the stamp falls and lands            0 -> 340ms  (--t-stamp)
       2  the correctness mark appears       +120ms gap, 260ms (--t-flip)
       3  the explanation sheet rises        +160ms gap, 260ms
     The two gaps are what make it read as three events rather than one
     compound arrival; they are deliberately unequal so the sequence has a
     shape. The mark is held back until the stamp has settled because a
     coloured chip moving during the fall competes with it — that is what
     made this beat read as five things happening at once. */
  await wait(T.stamp);
  await wait(T.markGap);
  requestAnimationFrame(() => chip.classList.add('is-in'));
  await wait(T.flip + T.panelGap);

  /* ---- 4 · THE EXPLANATION PANEL RISES OVER THE CARD'S LOWER PORTION
     IT SCROLLS, and that is a requirement rather than a nicety: e3's
     tf_explain is 280 characters, the longest of the eleven, and it does
     not fit the panel at 360x640 at a legible size. The panel caps its
     height against the card and scrolls inside itself; the CTA is
     pinned below the scroller so it is never scrolled out of reach. */
  /* §4b · THE CARD LIFTS. Of the three options the brief offered — panel
     below the card, shorter panel, card lifts — this is the only one that
     guarantees the card is never obscured at all rather than merely
     obscured somewhere harmless. .cardwrap becomes a flex column, the
     card drops its 620px min-height and becomes exactly its own content
     (the graphic and the claim), and the panel takes the room underneath.
     Nothing overlaps: the art and the claim are fully visible for the
     whole reveal, which is the premise V18-1 was picked on.
     §4e · AND הלאה LEAVES THE PLATE. It was 97px wide in the bottom-right
     corner of a dark panel, which is where a footnote goes, not the
     control that advances the round. It is now a sibling of the panel
     rather than a child — full width, on the ground, under the
     explanation instead of inside it. */
  const panel = el('div', 'creveal__exp');
  panel.innerHTML =
    '<div class="creveal__scroll"><p class="creveal__text">' +
      markGlossary(issue.tf_explain || '') + '</p></div>' +
    '<button type="button" class="p-c creveal__go">' +
      esc('הלאה') + ' <i aria-hidden="true">›</i></button>';
  wrap.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('is-in'));
  const go = $('.creveal__go', panel);

  /* THE PANEL IS CAPPED SO IT CANNOT COVER THE CLAIM — back with the
     structure. The cap is the room left under the claim, measured rather
     than a percentage; the floor is 170px, below which the panel would be
     a slot and the right fix would be a shorter claim. */
  const claimEl = $('.b1claim', card);
  if (claimEl) {
    const room = wrap.getBoundingClientRect().bottom
               - claimEl.getBoundingClientRect().bottom - 10;
    const sc = parseFloat(CS.getPropertyValue('--card-scale')) || 1;
    panel.style.maxHeight = Math.max(170, room / sc) + 'px';
  }

  /* NO MEASURED CAP ANY MORE. The panel used to be absolutely positioned
     over the card's foot and JS computed a max-height so it could not
     cover the claim. With the card lifted the panel simply takes the
     space the card left, so the geometry that needed guarding is gone. */
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
    pressable(go).addEventListener('click', async () => {
      const dir = card._swipe ? card._swipe.dirFor(S.claim) : 1;
      panel.classList.remove('is-in');
      /* .mf-b.is-stamped runs d2-jolt with fill:both, which HOLDS
         transform:translateY(0) forever — and a held animation beats an
         inline style, so the card would not move. Clear it first. */
      card.classList.remove('is-stamped');
      card.style.animation = 'none';
      card.classList.add('is-leaving');
      card.style.transform = 'translateX(' + (dir * 620) + 'px) rotate(' + (dir * 25) + 'deg)';
      card.style.opacity = .2;              /* the deck's own exit value */
      mark.style.animation = 'none';
      mark.classList.add('is-leaving');
      mark.style.transform = 'translateX(' + (dir * 620) + 'px) rotate(' + (dir * 25) + 'deg)';
      mark.style.opacity = .2;
      await wait(T.cardExit);
      card.remove(); mark.remove(); panel.remove();
      /* the chip hands the chyron back — beat 2 pins the player's own
         vote into the same slot and the two must never share it */
      chip.remove();
      chy.classList.remove('is-mark');
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
      (o.body ? '<p class="stmodal__body">' + esc(o.body) + '</p>' : '') +
      /* the ONE field this component grew, so beat 5's disclosure could
         reuse it instead of getting a second modal shape of its own. It
         is markup rather than text — chips and links, escaped by their
         own builder. Callers that pass nothing are unaffected. */
      (o.extra || '') +
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
          /* .b2taken is gone: the confirmation is no longer a chip that
             APPEARS on the chair, it is the callout that ARRIVES there
             and then leaves for the pin. .b2seat is still the anchor the
             callout is positioned from — see tachlesTransition(). */
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
          /* the label is its own span so the transition can hide THIS
             copy of the word the instant the flying one leaves — two of
             it on screen would break the illusion that it travelled. */
          VOTES.map(v => '<button class="v-a" data-vote="' + v + '">' +
            '<span class="v-a__lab">' + VLABEL[v] + '</span></button>').join('') +
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
      /* NOT pinned here any more. The banner is not placed into the slot,
         it TRAVELS there — tachlesTransition() calls pinVote() on the
         frame the flight lands, and pinning it now would put a second
         copy in the slot for the whole 1.1s the first one is in the air. */
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

      /* §4 THE PLAYER TAKES THE SEAT — and the vote does not appear on
         the chair, it TRAVELS there and then keeps going. See
         tachlesTransition(). The other two chips recede but stay on
         screen, because the round never hides the options it offered. */
      btn.classList.add('is-chosen');
      $('.ovpane--vote', ov).classList.add('is-taken');
      tachlesTransition(btn, ov);
    }));
}

/* ===================== §T · TACHLES -> CASCADE ======================
   The move that was designed in the banners pass and could not be built,
   because the banner could not survive the layer it had to cross. It can
   now — see the note in index.html.

   ONE OBJECT, FOUR PHASES, NOTHING SWAPPED. The word leaves the button,
   the avatar joins it in flight, the pair resolves into the sticker, and
   the sticker flies to the pin. It is the same element throughout: at no
   point is one thing removed and another faded in where it was, which is
   what would make this read as six animations instead of one move.

   THE SCHEDULE IS ABSOLUTE, NOT CHAINED. Every phase is a setTimeout off
   a single t0 rather than a chain of awaits, so a slow frame in one step
   cannot push the five behind it — the steps OVERLAP by design and a
   chain cannot express that at all.

   prefers-reduced-motion: the banner is simply pinned, the bill enters,
   the affordance appears. No flight, no callout, no assembly. */
function tachlesTransition(btn, ov) {
  const vote = btn.dataset.vote;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const armNext = () => {
    beat3(ov);
    setTimeout(() => tapAffordance(ov), Math.max(0, T.tcTapAt - T.tcNextAt));
  };

  if (reduced) { pinVote(vote); armNext(); return; }

  const stage = $('#stage'), seat = $('.b2seat', ov), lab = $('.v-a__lab', btn);
  const slot = $('#chyronSlot');
  if (!stage || !seat || !lab || !slot) { pinVote(vote); armNext(); return; }

  const sr = stage.getBoundingClientRect();
  /* the callout sits over the LOWER PART OF THE CHAIR — the same 62%
     anchor .b2taken used, so the object lands where the confirmation has
     always landed. */
  const seatR = seat.getBoundingClientRect();
  const cx = seatR.left + seatR.width / 2 - sr.left;
  const cy = seatR.top  + seatR.height * 0.62 - sr.top;

  const cal = el('div', 'tcal',
    '<span class="tcal__av as-d" aria-hidden="true">' + AV3 + '</span>' +
    '<span class="tcal__w">' + esc(VOTE_PIN[vote] || VLABEL[vote] || '') + '</span>');
  cal.style.left = cx + 'px';
  cal.style.top  = cy + 'px';
  cal.style.transform = 'translate(-50%,-50%)';
  stage.appendChild(cal);

  /* FLIP 1 · measure the callout where it will rest, then throw it back
     onto the button and let it come home. The scale is taken off the type
     rather than the box, because the box is about to grow by an avatar
     and a border and the letters must not appear to shrink. */
  const rest = cal.getBoundingClientRect();
  const lr = lab.getBoundingClientRect();
  const k0 = Math.max(.35, lr.height / Math.max(1, rest.height));
  const dx0 = (lr.left + lr.width / 2) - (rest.left + rest.width / 2);
  const dy0 = (lr.top + lr.height / 2) - (rest.top + rest.height / 2);
  cal.style.transition = 'none';
  cal.style.transform =
    'translate(-50%,-50%) translate(' + dx0.toFixed(1) + 'px,' + dy0.toFixed(1) + 'px)' +
    ' scale(' + k0.toFixed(3) + ')';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    cal.style.transition = '';                       /* back to the sheet's */
    lab.style.opacity = '0';                         /* the button's copy goes */
    /* 0 -> 340 · the letters fly home, settling at the callout's angle */
    cal.style.transform = 'translate(-50%,-50%) rotate(-2.4deg)';
  }));

  /* 180 -> 480 · the avatar joins them */
  setTimeout(() => cal.classList.add('is-paired'), T.tcAvAt);
  /* 480 -> 740 · the construction resolves */
  setTimeout(() => cal.classList.add('is-sticker'), T.tcResolveAt);

  /* 740 -> 1120 · FLIP 2, the travel. Re-measured HERE and not earlier:
     the box has gained the avatar and the border since phase 1, and a
     target computed before that growth lands the banner off its pin. */
  setTimeout(() => {
    placeChyron();
    const now = cal.getBoundingClientRect();
    const sl  = slot.getBoundingClientRect();
    /* the banner's own resting place inside the slot: leading edge under
       RTL is the RIGHT, which is where .chyron puts it. */
    const tx = (sl.right - now.width / 2) - (now.left + now.width / 2);
    const ty = (sl.top + sl.height / 2)   - (now.top + now.height / 2);
    cal.classList.add('is-pinning');
    cal.style.transform = 'translate(-50%,-50%) translate(' +
      tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotate(1.2deg)';
  }, T.tcTravelAt);

  /* 900 -> 1300 · the next screen enters BEHIND the still-moving banner */
  setTimeout(armNext, T.tcNextAt);

  /* the hand-off. The real banner appears in the same place on the same
     frame the flying one is removed, so there is no gap and no fade. */
  setTimeout(() => {
    pinVote(vote);
    cal.remove();
    buzz(18);
  }, T.tcTravelAt + T.tcTravel);
}

/* THE AFFORDANCE, AND IT IS NOT SMALL PRINT. The whole surface is the
   target, so the cue is a sticker-family pill with a chevron that
   breathes — at this beat the screen has stopped moving and must not
   read as finished. The blur behind it holds at 3px for the same
   reason. */
function tapAffordance(ov) {
  if (!ov.isConnected || $('.tctap', ov)) return;
  ov.classList.add('is-held');
  const t = el('div', 'tctap',
    '<span>' + esc('הקישו להמשך') + '</span>' +                      /* TAMAR */
    '<span class="tctap__c" aria-hidden="true">›</span>');
  ov.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-in')));
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
    if (S.inv) return armInverted();
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

  /* THE BASIS LINE IS GONE. It rendered 'הצבעה מתועדת' on basis:doc cards
     and a placeholder on basis:bloc ones, which meant the label's ABSENCE
     was doing the talking on every bloc card — a gap that reads as an
     omission rather than as a different kind of evidence. Removed
     everywhere rather than twinned, because a twin would have to assert
     something about bloc-inferred votes that nobody has written yet.
     THIS DEFERS THE QUESTION, IT DOES NOT CLOSE IT: doc vs bloc is still
     an open credibility problem for Roman, and data.js still carries the
     distinction on every politician entry. Nothing was deleted but the
     label. See the report. */

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

/* ===================== BEAT 4 · THE INVERTED ROUND ==================
   Same beat, same card, inverted question. Everything the cascade does
   physically — the card turns over, the sticker slaps on top of it, the
   answers sit in the card's foot, the stamp lands on .cardwrap, the card
   swipes off — happens here identically. Only the question changed, and
   the round is worth building precisely because the player has just
   played the other one in this same topic.

   THERE IS NO REWARD STICKER, and its absence is a decision. A value
   shown before the choice is the price-tag-before-decision pattern this
   game refuses everywhere else — it is the same reason the peel cover is
   free and the same reason the two +25 labels in app.js are flagged. The
   trade-off is already legible without a number: the face gets sharper,
   the question gets easier, and the player can feel that costs
   something. The bonus is real and it decays; it is simply never
   announced until it is paid. */
function armInverted() {
  S.phase = 'inv';
  const card = currentCard(); if (!card) return;
  const plan = S.inv;

  /* the question sticker sits on the card's TOP EDGE, the same .ask-st
     the cascade uses, at the same slap angle and on the same delay */
  /* the inverted question is roughly twice the cascade's — the sticker
     has to be told it may wrap, or white-space:nowrap runs it past both
     edges of the card. See .ask-st--inv. */
  const ask = slapAsk(ASK.inv(plan.shown.vote));
  if (ask) ask.classList.add('ask-st--inv');
  helper('');

  const foot = el('div', 'mf-b__foot inv-tray');
  foot.innerHTML =
    plan.options.map(o =>
      '<button type="button" class="v-a inv-name" data-pid="' + esc(o.id) + '">' +
        esc(DATA.politicians[o.id].name) + '</button>').join('') +
    /* SUBORDINATE, and deliberately so: the step track is a readout, not
       a control, and it sits on one line with the hint under the names
       at a fraction of their weight. It is kept rather than dropped
       because stepped blur has a discrete thing to report, and because
       it is what tells the player that waiting is a CHOICE and not a
       delay the game is imposing on them. */
    '<div class="inv-bar">' +
      '<span class="inv-steps" role="img" aria-label="' + esc(ASK.invSharp) + '">' +
        INV_BLUR.map((_, i) => '<i data-s="' + i + '"></i>').join('') +
      '</span>' +
      '<button type="button" class="inv-hint">' + esc(ASK.invHint) + '</button>' +
    '</div>';
  card.appendChild(foot);

  invBlurRun(card, foot);

  $('.inv-hint', foot).addEventListener('click', e => {
    e.stopPropagation(); invHint(card, e.currentTarget);
  });
  foot.querySelectorAll('.inv-name').forEach(b =>
    pressable(b).addEventListener('click', () => invResolve(b.dataset.pid, foot, card, b)));
}

/* the four held steps. A step CHANGES on a short ramp rather than
   snapping, but 200ms inside a 1400ms hold still reads as a step and not
   as a crossfade — which is the point, because a continuous sharpen has
   nothing to report and no moment to decide on. */
function invBlurRun(card, foot) {
  const dots = foot.querySelectorAll('.inv-steps i');
  const mark = i => dots.forEach((d, k) => d.classList.toggle('is-on', k <= i));
  S.invStep = 0; mark(0);
  S.invTimers = [];
  INV_BLUR.forEach((b, i) => {
    if (!i) return;
    S.invTimers.push(setTimeout(() => {
      if (S.phase !== 'inv') return;
      S.invStep = i;
      card.style.setProperty('--inv-blur', b + 'px');
      mark(i);
    }, i * INV_STEP_MS));
  });
  /* settled: the last step has had its full hold. The blur STAYS AT 1px
     from here — it never reaches zero while the question is open. */
  S.invTimers.push(setTimeout(() => {
    if (S.phase !== 'inv') return;
    S.invStep = INV_BLUR.length;
    foot.classList.add('is-settled');
  }, INV_SETTLE));
}

/* ONE CONTROL, AND IT REVEALS THE PICTURED MK'S PARTY — never the
   options'. Naming an option's party would be a process of elimination
   dressed as a hint; naming the pictured MK's is a fact about the person
   in the photograph, which is the same thing the peel cover gives in the
   normal cascade. It lands as a sticker on the card, same family.
   FREE. No coin cost and no price shown, for the same reason A-3 was
   rejected: coins are earned and never spent until the end-game. */
function invHint(card, btn) {
  if (btn.dataset.done) return;
  btn.dataset.done = '1'; btn.disabled = true;
  S.invHintTaken = true;
  const s = el('div', 'inv-hint-st');
  s.innerHTML = '<span class="inv-hint-st__i">' +
    esc(DATA.politicians[S.inv.shown.id].party) + '</span>';
  /* PARENTED TO .cardwrap, NOT TO THE CARD — .mf-b carries overflow:hidden
     and cut the sticker's white die-cut flat against the card's trailing
     edge, which is the same trap .ask-st and .d2 are both parented out of.
     A sticker that is clipped by the thing it was slapped onto stops
     reading as applied. It still sits ON the card; it just is not IN it. */
  ($('.cardwrap') || card).appendChild(s);
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('is-slapped')));
}

async function invResolve(pid, foot, card, btn) {
  if (S.phase !== 'inv') return;
  S.phase = 'verdict';
  (S.invTimers || []).forEach(clearTimeout);
  const step = Math.min(S.invStep, INV_BONUS.length - 1);
  const shown = S.inv.shown, ok = pid === shown.id;
  S.guesses[shown.id] = pid;

  foot.querySelectorAll('button').forEach(b => b.disabled = true);
  btn.classList.add('is-picked');

  /* §1.2 the player's choice sits alone before the truth arrives */
  await wait(T.hold);
  foot.remove();
  retireAsk();
  /* the party hint goes with it. It was standing IN FOR the identity
     block, and the identity block is about to arrive carrying the same
     party — leaving it up would put the same fact on the card twice, on
     the chin of the face it was covering for. */
  const hs = $('.inv-hint-st');
  if (hs) { hs.classList.add('is-retired'); setTimeout(() => hs.remove(), 200); }

  /* THE REVEAL IS THE FACE, and only now does it go to zero. The name
     arrives with it, in the slot the cascade has always kept for it. */
  card.style.setProperty('--inv-blur', '0px');
  card.classList.add('is-unblurred');
  const pol = DATA.politicians[shown.id];
  const id = el('div', 'mf-b__id inv-id');
  id.innerHTML = '<h2>' + esc(pol.name) + '</h2>' +
    '<p><span class="pty__val">' + esc(pol.party) + '</span></p>';
  card.appendChild(id);
  requestAnimationFrame(() => requestAnimationFrame(() => id.classList.add('is-in')));
  await wait(T.flip);

  const mark = stamp(ok);
  $('.cardwrap').appendChild(mark);
  card.classList.add('is-stamped');
  inkBleed();
  setTimeout(() => buzz(25), T.stampDrop);

  /* the floor plus the decaying bonus, paid from the stamp like every
     other cascade award — and shown for the first time here */
  const table = COIN_TABLES[DEV.coins];
  if (ok) setTimeout(() => award(table.perCorrect + INV_BONUS[step], mark), T.stamp);

  await wait(T.stamp + T.flip);
  S.ci++;
  leaveCard();
  await wait(T.cardExit);
  return beat5();
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
/* ===================== §S-1 · THE FINALE ============================
   THE 11x11 SEAT GRID IS REJECTED AND GONE — seatPlan(), seatBoard() and
   runTally() with it. On the record: the interleaved fill was a
   constraint set to avoid implying factional seating, and it worked, but
   it produced a checkerboard nobody can read a majority off. Honest and
   illegible. What replaces it is V20-2's family — two numbers, left and
   right, a bar between, counting up — plus the move the grid could never
   make: the player's own token flying to the side they voted for. The
   121st-MK conceit is delivered by an ACTION rather than by a dot in a
   grid.

   THE BEAT IS A SEQUENCE, NOT A SCREEN, and that is the whole design.
   It had been drawn three times as a static layout and each read as
   chaotic, because everything arrived at once with no order of
   importance. Four rules govern the order:
     - the TALLY is the peak, and NOTHING else may land while it counts
     - the FLIGHT is a second beat, watchable, never simultaneous
     - the COINS get a moment of their own
     - the BUTTONS arrive last and nothing lands after them
   ==================================================================== */

/* the majority line. 61 of 120 seats, drawn at 61/121 of the bar so it
   sits where the 61st vote actually falls. */
const MAJORITY = 61, PLENUM = 120;

/* THE EXPLANATION'S FIRST SENTENCE, AND THE VERDICT CLAUSE IT HAS TO
   SKIP. tf_explain opens with 'זה נכון' / 'זה לא נכון' on every issue,
   because it is the CLAIM's explanation and beat 1 is where it belongs.
   Splitting naively on the first full stop therefore puts 'זה נכון!' on
   screen at beat 5 — two words that say nothing, and that re-answer a
   question resolved four beats earlier. Measured across the eleven
   active issues, six of them open with exactly that.
   So the verdict clause is stripped first and the sentence is taken from
   what is left; a remainder under 40 characters is joined to the next
   one rather than shown alone, which is what rescues g1's dangling
   'וזה מפתיע הרבה אנשים.' */
const VERDICT_OPENER = /^\s*זה\s+(?:לא\s+)?נכון\s*[!.,–—-]*\s*/;   /* TAMAR */
function explainSplit(text) {
  const t = (text || '').trim();
  if (!t) return { first:'', rest:'' };
  const body = t.replace(VERDICT_OPENER, '') || t;
  const parts = body.split(/(?<=[.!?])\s+/).filter(p => p.trim());
  if (!parts.length) return { first:'', rest:'' };
  let first = parts[0], rest;
  if (first.length < 40 && parts.length > 1) { first += ' ' + parts[1]; rest = parts.slice(2).join(' '); }
  else rest = parts.slice(1).join(' ');
  return { first: first.trim(), rest: rest.trim() };
}

/* ===================== BEAT 5 · THE REVEAL ========================== */
/* B5-A. LESS on screen, in a strict order. §8 forbids >1 number at the
   emotional peak, so the tally counts up ALONE and the score and the
   coins arrive only after it has settled.                             */
async function beat5() {
  S.beat = 5;
  const r = $('#round'); r.innerHTML = '';
  /* PART 3 · THE FINALE TAKES THE SPACE THE ROUND'S CHROME WAS HOLDING.
     The banner's slot, the helper line and .round's own top padding are
     all reserved for a card that no longer exists on this beat — 88px of
     it — and they are what was pushing the board 65-70px below the
     centre of the screen.
     THEY COLLAPSE AT BEAT-5 START, NOT AT THE BANNER'S EXIT. The banner
     is absolutely positioned at stage level and its box is frozen here
     before the slot goes, so it does not move when the slot collapses
     and the board is centred against the POST-EXIT layout from the first
     frame. That is what stops the board jumping twice: it is placed once,
     and the banner leaves out of a layer that owes it nothing. */
  placeChyron();
  $('#scRound').classList.add('is-finale');

  const outer = el('div', 'beat b5 f5');
  const b = el('div', 'b5fit');
  outer.appendChild(b);
  r.appendChild(outer);
  repin();

  const tally  = issue._tally || null;
  let outcome  = null;                 /* the shared outcome surface */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = ms => wait(reduced ? 0 : ms);

  /* =================================================================
     BEAT 1 · THE PEAK.
     With a tally it is the count. Without one it is the outcome prose,
     because that is then the only account of the outcome that exists —
     the beat does not get quieter for the seven issues that have no
     numbers, it just changes what its loudest object is.
     NOTHING ELSE IS ON SCREEN. The board is built and appended alone;
     every other block below is appended only after the count has
     settled. That ordering IS the rule, not a comment about it.
     ================================================================= */
  const board = el('div', 'f5board b5stage' + (tally ? ' f5board--num' : ' f5board--prose'));
  board.innerHTML = tally
    ? '<div class="f5row">' +
        '<div class="f5cell">' +
          '<p class="f5lab">' + esc(VLABEL.for) + '</p>' +
          '<div class="f5n f5n--for"><b id="f5for">0</b>' +
            '<span class="f5slot" id="f5slot"></span></div>' +
        '</div>' +
        '<div class="f5dash" aria-hidden="true">—</div>' +
        '<div class="f5cell">' +
          '<p class="f5lab">' + esc(VLABEL.against) + '</p>' +
          '<div class="f5n f5n--ag"><b id="f5ag">0</b></div>' +
        '</div>' +
      '</div>' +
      /* THE THIRD SEGMENT IS THE UNFILLED REMAINDER, and it is what makes
         the bar readable: without it 63 and 57 fill a bar that merely
         happens to end, and with it they are visibly filling a fixed
         120. The 61 line sits at 61/121 of the width — where the 61st
         vote actually falls, not at the halfway mark. */
      '<div class="f5bar"><i class="f5bar__f"></i><i class="f5bar__a"></i>' +
        '<i class="f5bar__r"></i>' +
        '<span class="f5maj"></span>' +
        '<span class="f5majlab">' + N(MAJORITY) + '</span></div>'
    : '<p class="f5prose">' +
        (issue.vote_result ? esc(issue.vote_result)
                           : ph('[טקסט — תמר: תוצאות ההצבעה]')) + '</p>';
  b.appendChild(board);
  requestAnimationFrame(() => { board.classList.add('is-in'); f5Place(b, board); fitBeat(); });

  if (tally) await runCount(board, tally);
  else await step(T.f5Prose);

  /* =================================================================
     BEAT 2 · THE FLIGHT, and it happens in BOTH versions.
     THE DEGRADED TWIN KEEPS IT. With no tally there is no side to land
     beside, so the token lands on a plate of its own — it moves, and it
     does not claim a number that is not there. Dropping the flight as
     "no tally, nothing to show" is the failure this twin exists to
     prevent: it is the beat most likely to be cut and it is the one
     that carries the 121st-MK idea.
     ================================================================= */
  let plate = null;
  if (!tally) {
    plate = el('div', 'f5plate b5stage');
    plate.innerHTML =
      '<span class="f5plate__slot" id="f5slot"></span>' +
      '<span class="f5plate__t">' + esc('הקול שלכם נרשם:') +        /* TAMAR */
        '<b>' + esc(VOTE_PIN[S.position] || ph('[—]')) + '</b></span>';
    b.appendChild(plate);
    requestAnimationFrame(() => { plate.classList.add('is-in'); f5Place(b, board); fitBeat(); });
  }
  await step(T.f5Gap);
  await flyToken($('#f5slot', b));

  /* the resolution line writes beneath the landing. Only the version
     with numbers can state a with-you total; the twin has already said
     what it can say, on the plate. */
  if (tally) {
    const mine = { for: tally.for, against: tally.against };
    if (S.position === 'for') mine.for++;
    if (S.position === 'against') mine.against++;
    /* PART 4 · the outcome gets a BOARD, like everything else on this
       beat. The resolution and the guess line share ONE surface rather
       than taking one each: they are both the outcome — what happened,
       and what the player made of it — and a hairline between a sentence
       and its own footnote is a division that means nothing. */
    outcome = el('div', 'f5outcome f5surf b5stage');
    const res = el('p', 'f5res');
    res.innerHTML =
      esc('ההצעה עברה ') + N(tally.for + '—' + tally.against) + '.' +   /* TAMAR */
      '<span class="f5res__you">' + esc('עם הקול שלכם: ') +             /* TAMAR */
        '<b>' + N(mine.for + '—' + mine.against) + '</b></span>';
    outcome.appendChild(res);
    b.appendChild(outcome);
    requestAnimationFrame(() => { outcome.classList.add('is-in'); f5Place(b, board); fitBeat(); });
  }

  /* the record is written before the coins, because both finishing
     awards are consequences of the record rather than of anything the
     player just did on screen. */
  const segsWas   = segsDone(issue.topic);
  const topicsWas = topicsDone();
  PROGRESS[issue.id] = true;
  assertProgress(issue, segsWas, topicsWas);

  /* =================================================================
     BEAT 3 · THE COINS GET A MOMENT.
     Until now they flew to the counter with nothing on screen saying
     what the round was worth. See coinMoment() for why there are two
     numbers here rather than the mock's one.
     ================================================================= */
  await step(T.f5Gap);
  await coinMoment(b, topicsWas);

  /* =================================================================
     BEAT 4 · THE READING AND THE BUTTONS. The board shrinks to a strip
     and everything that is left arrives together. Nothing lands after
     the buttons.
     ================================================================= */
  /* THE STRIP LEAVES THE PADDING ALONE. Recomputing an offset here moved
     the board 40px (the board halves, 153 to 73), and PINNING its centre
     across the change cost more than it bought: holding the centre needs
     40px more padding than the content can afford at 360, and fitBeat()
     answered that by scaling the whole beat to 85% — a 15% shrink of the
     type sizes the spec raised on purpose.
     Untouched, the board's top holds and its centre rises 40px. That
     happens inside the same ~30ms as the guess line, the reading and the
     buttons, and the one eased re-centre starts immediately after it, so
     it is absorbed into the move rather than read as one. */
  board.classList.add('is-strip');
  fitBeat();

  /* §1.8 the SHAPE of the guess. Skipped without a cascade — there is
     nothing to have guessed, which is why the twin has no such line. */
  if (S.dealt.length && !S.inv) {
    const n = S.dealt.length;
    const hits = S.dealt.filter(d => S.guesses[d.id] === d.vote).length;
    const shape = el('p', 'f5shape');
    shape.innerHTML = esc('ניחשתם נכון ב-') + '<b>' + N(hits) + '</b>' +
      esc(' מתוך ') + '<b>' + N(n) + '</b>';                          /* TAMAR */
    /* it joins the outcome surface if there is one — a round with a
       tally — and takes a surface of its own if there is not, so it can
       never end up the one block sitting on the bare ground. */
    /* no f5Place from here on: the board HOLDS and the single re-centre
       after the buttons owns all the movement. A holding call here put a
       39px instant step in front of the eased move, which is two moves. */
    if (outcome) { outcome.appendChild(shape); fitBeat(); }
    else {
      const w = el('div', 'f5outcome f5surf b5stage');
      w.appendChild(shape); b.appendChild(w);
      requestAnimationFrame(() => { w.classList.add('is-in'); fitBeat(); });
    }
  }

  /* THE FIRST SENTENCE ONLY, and the rest goes behind one tap. That is
     what fixes the old lower section: seven items competed in the bottom
     third and the part players skip was the part taking the room. The
     beat still explains itself with no tap; the tap is for the rest. */
  const ex = explainSplit(issue.tf_explain);
  const terms = issue.glossary_terms || [];
  const links = (issue.further_links || []).slice();
  if (issue.knesset_url) links.push({ label:'ההצבעה באתר הכנסת', url:issue.knesset_url }); /* TAMAR */
  const hasMore = !!(ex.rest || terms.length || links.length);

  if (ex.first || hasMore) {
    const read = el('div', 'f5read f5surf b5stage');
    read.innerHTML =
      (ex.first ? '<p class="f5exp">' + markGlossary(ex.first) + '</p>' : '') +
      (hasMore ? '<button type="button" class="f5more">' +
                   esc('עוד על ההצבעה ›') + '</button>' : '');       /* TAMAR */
    b.appendChild(read);
    requestAnimationFrame(() => { read.classList.add('is-in'); fitBeat(); });
    const more = $('.f5more', read);
    if (more) pressable(more).addEventListener('click',
      () => moreModal(ex.rest, terms, links));
  }

  /* ---- the way out. Unchanged: if the topic has another unplayed
     issue the PRIMARY action opens it directly, because going back to
     the map to come straight back buys nothing. */
  const acts = el('div', 'f5acts b5stage');
  const restIss = topicIssues(issue.topic).filter(x => !issueDone(x.id));
  const next = restIss[0];
  if (next) {
    const go = el('button', 'p-c f5go', 'לסוגיה הבאה ›');            /* TAMAR */
    pressable(go).addEventListener('click', () => startRound(next.id));
    const back = el('button', 'f5back', 'חזרה למפה');                /* TAMAR */
    pressable(back).addEventListener('click', () => goMap());
    acts.append(go, back);
  } else {
    const go = el('button', 'p-c f5go', 'חזרה למפה ›');              /* TAMAR */
    pressable(go).addEventListener('click', () => goMap());
    acts.appendChild(go);
  }
  b.appendChild(acts);
  requestAnimationFrame(() => {
    acts.classList.add('is-in');
    /* PART 4 · the pulse has done its job. It ran while the board was the
       only thing on screen and while the flight landed on it; once there
       is somewhere else to go it settles to a static, quieter glow. */
    board.classList.add('is-glow-calm');
    fitBeat();

    /* THE LAST MOTION ON THE BEAT, and it waits a frame for the beat to
       stop moving first. The buttons are the final block — nothing is
       appended after them — so this is the only moment the whole thing
       can be centred without a second move following it. It is deferred
       one frame because the block that triggers it is still arriving
       when this handler runs and fitBeat() has yet to decide on a scale;
       measuring inside the same frame read a layout that then changed
       under it, which is what left 29px more space below the stack than
       above however many correction passes ran.
       .is-recentring also drops .f5acts's auto margin, or the buttons
       stay pinned to the floor and only the top of the stack moves —
       a stretch rather than a re-centre. */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      b.classList.add('is-recentring');
      void b.offsetHeight;
      f5Place(b, board, true);
      fitBeat();
      /* AND AGAIN WHEN THE MOVE HAS LANDED. fitBeat() measures
         scrollHeight, which includes padding-top — and padding-top is
         mid-transition at this point, still holding the pre-centre value.
         It therefore measured an overflow that only existed for the first
         frame of the move, applied scale(0.90) at 360, and nothing ever
         re-evaluated it: the beat settled 10% small for the rest of its
         life. One more call after the transition, and the scale reflects
         the layout that actually ended up on screen. */
      setTimeout(fitBeat, T.f5Recentre + 40);
    }));
  });
}

/* PART 3 · WHERE THE BOARD SITS, and it is one number recomputed rather
   than a layout rule that keeps changing its mind.
     alone  -> the centring offset, so the board sits in the middle of the
               space between the HUD and the bottom edge
     after  -> min(that offset, the room the content actually leaves)
   So the board HOLDS its centred position while there is room for
   everything under it, and rises only by the amount the content is short
   — never further, and never twice. When even a zero offset is not
   enough the beat is genuinely taller than the phone, and fitBeat()'s
   scale is what catches it; f5Place() returns the numbers so that case
   can be measured rather than guessed at. */
/* `final` is the ONE move at the end. Until then the board holds its
   centred position and pad is min(centred, room); once the buttons have
   landed — and nothing lands after them — the whole stack centres in the
   content box instead, in a single eased step. The per-block climbing
   this replaced (442 -> 320 -> 211) stays dead: every call before the
   last still returns the same held value it always did. */
function f5Place(b, board, final) {
  const par = b.parentElement; if (!par || !board) return null;
  const pcs = getComputedStyle(par);
  const avail = par.clientHeight
    - (parseFloat(pcs.paddingTop) || 0) - (parseFloat(pcs.paddingBottom) || 0);
  /* MEASURED THE WAY fitBeat() MEASURES, WITH THE TRANSITION SUSPENDED.
     Two traps here and both were live:
     1  .b5fit is flex:1, so its scrollHeight is the container height
        whatever is in it. flex:none for one read gives the content's own
        height on the metric fitBeat() will use a frame later.
     2  scrollHeight INCLUDES padding, and padding-top is transitioned —
        so zeroing it and reading immediately measures the padding still
        easing out of the way. It read 549px for 227px of content, which
        made `room` too small and moved the board on every single block.
     The transition is suspended for the read and the old value put back
     before it is restored, so the one move that does happen still eases
     from where the board actually was. */
  const pad0 = parseFloat(b.style.paddingTop) || 0;
  b.style.transition = 'none';
  b.style.paddingTop = '0px';
  b.style.flex = 'none';
  const content = b.scrollHeight;
  b.style.flex = '';
  /* stay at zero padding while `final` measures the stack below, then
     restore; the holding path needs the old value back immediately. */
  if (!final) {
    b.style.paddingTop = pad0 + 'px';
    void b.offsetHeight;               /* commit the restore before easing */
    b.style.transition = '';
  }

  const boardH  = board.offsetHeight;
  const centred = Math.max(0, Math.round((avail - boardH) / 2));
  const room    = Math.max(0, avail - content);
  /* holding: centre the BOARD, but never past what the content leaves.
     final: centre the STACK. It is measured off the children's own boxes
     rather than off scrollHeight — scrollHeight ran 29px longer than the
     ink does (trailing gap and the button block's inner padding), which
     put 165px above the stack and 194px below it and read as bottom-
     heavy rather than centred. First visible pixel to last, halved. */
  /* MEASURED, THEN CORRECTED, rather than derived. Every figure that
     ought to predict the stack's height — scrollHeight, the children's
     summed boxes, their outer bounds — was off by 15-29px in one
     direction or the other depending on the width, because the gap, the
     button block's inner padding and fitBeat()'s scale all land in
     different places. So the final pass sets a padding, reads the gap it
     actually produced above and below the ink, and moves by half the
     difference. Two synchronous reads, no transition running, one value
     ever animated to. */
  let pad;
  if (final) {
    /* fitBeat()'s scale has to come OFF for this. getBoundingClientRect()
       returns scaled coordinates while `avail` is unscaled, so measuring
       the stack against the box with a 0.99 scale live compared two
       different coordinate systems — that is what pinned 360 at 126px
       above and 29px below however many correction passes ran. fitBeat()
       is called again straight after and re-applies it if it is still
       needed. */
    b.style.transform = '';
    void b.offsetHeight;
    const par2 = b.parentElement.getBoundingClientRect();
    const boxTop = par2.top + (parseFloat(pcs.paddingTop) || 0);
    const boxBot = par2.bottom - (parseFloat(pcs.paddingBottom) || 0);
    const ink = () => {
      const k = [...b.children];
      return { t: Math.min(...k.map(n => n.getBoundingClientRect().top)),
               b: Math.max(...k.map(n => n.getBoundingClientRect().bottom)) };
    };
    let guess = Math.max(0, Math.round((avail - (ink().b - boxTop)) / 2));
    /* ITERATED, because one correction was not enough at 360: the blocks
       are still settling between the two reads and a single pass landed
       123px above / 32px below. Each pass moves by half the error and it
       converges in two or three; the loop is capped so a layout that
       cannot settle cannot hang the beat. */
    for (let i = 0; i < 5; i++) {
      b.style.paddingTop = guess + 'px';
      void b.offsetHeight;
      const r = ink();
      const err = Math.round(((boxBot - r.b) - (r.t - boxTop)) / 2);
      if (Math.abs(err) <= 1) break;
      guess = Math.max(0, guess + err);
    }
    /* CLAMPED SO THE RE-CENTRE CANNOT COST A SCALE. Centring is a
       nicety; the type sizes are not. If the stack plus the offset would
       overflow the box, fitBeat() answers by shrinking the whole beat —
       at 360 that was 0.84, a 16% cut to sizes the spec raised on
       purpose. The offset gives way first: the stack sits as high as it
       must and stays at full size. */
    const kk = [...b.children];
    const stackH = Math.round(Math.max(...kk.map(n => n.getBoundingClientRect().bottom))
                            - Math.min(...kk.map(n => n.getBoundingClientRect().top)));
    pad = Math.max(0, Math.min(guess, avail - stackH));
  } else {
    pad = Math.min(centred, room);
  }
  /* THE FIRST PLACEMENT IS NOT A MOVE. Easing from 0 made the board
     drift 425 -> 440 over the first 90ms of the beat, which is a fourth
     animation on a screen whose whole rule is one move. It is simply
     where the board starts. */
  if (final) {
    b.style.paddingTop = pad0 + 'px';
    void b.offsetHeight;
    b.style.transition = '';
    b.style.paddingTop = pad + 'px';
  } else if (b.dataset.placed !== '1') {
    b.dataset.placed = '1';
    b.style.transition = 'none';
    b.style.paddingTop = pad + 'px';
    void b.offsetHeight;
    b.style.transition = '';
  } else {
    b.style.paddingTop = pad + 'px';
  }
  return { avail, content, boardH, centred, room, pad, over: Math.max(0, content - avail) };
}

/* ---- the count. Near-linear to ~2.4s, with EVERYTHING STOPPING for
   400ms on the frame 61 is crossed. That hold is the point of the beat:
   a bill passing is the single most meaningful instant on this screen,
   and the seat grid marked it with one square changing colour.
   The numerals and the bar are driven off ONE clock, so they can never
   disagree about how far the count has got. */
function runCount(board, tally) {
  const nf = $('#f5for', board), na = $('#f5ag', board);
  const bf = $('.f5bar__f', board), ba = $('.f5bar__a', board), br = $('.f5bar__r', board);
  const maj = $('.f5maj', board);
  const total = tally.for + tally.against;
  /* PLAIN textContent, NOT N(). N() returns markup — an LTR-isolating
     span — and assigning markup to textContent paints the tags on
     screen as literal text. The numerals do not need it here: .f5n is
     already direction:ltr with tabular figures, which is the whole job
     N() would have done, and this runs on every frame of the count. */
  const paint = (f, a) => {
    nf.textContent = f; na.textContent = a;
    bf.style.flexGrow = f; ba.style.flexGrow = a;
    br.style.flexGrow = Math.max(0, PLENUM - f - a);
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paint(tally.for, tally.against); return Promise.resolve();
  }
  /* the crossing is expressed in the count's own units — the step at
     which the FOR side reaches 61 — so a tally that never gets there
     simply never flares, with no branch anywhere else. */
  const crossAt = tally.for >= MAJORITY ? MAJORITY / tally.for : -1;
  const curve = p => 1 - Math.pow(1 - p, 1.22);      /* near-linear */
  return new Promise(res => {
    const RUN = T.f5Count - T.f5Flare, t0 = performance.now();
    let held = false, holdUntil = 0;
    (function tick(now) {
      if (held && now < holdUntil) return requestAnimationFrame(tick);
      const k = Math.min(1, (now - t0 - (held ? T.f5Flare : 0)) / RUN);
      let p = curve(k);
      if (!held && crossAt > 0 && p > crossAt) {
        p = crossAt;
        held = true; holdUntil = now + T.f5Flare;
        paint(Math.round(tally.for * p), Math.round(tally.against * p));
        maj.classList.add('is-flare');
        buzz(18);
        return requestAnimationFrame(tick);
      }
      paint(Math.round(tally.for * p), Math.round(tally.against * p));
      if (k < 1) requestAnimationFrame(tick);
      else { paint(tally.for, tally.against); maj.classList.remove('is-flare'); res(); }
    })(t0);
  });
}

/* ---- THE FLIGHT. A FLIP: the token is measured where it sits in the
   pinned banner, a clone is flown from there to the slot, and only then
   does the real one appear in the slot. Nothing is re-parented mid-
   animation, so the flight cannot be clipped by anything it passes over
   — it is fixed-position, above everything.
   The pinned banner dims and keeps an EMPTY SOCKET rather than closing
   up: the player's vote is still pinned there, the token has just left
   it, and a banner that reflowed would say the vote was withdrawn. */
function flyToken(slot) {
  const src = $('.chyron-av');
  if (!slot) return Promise.resolve();
  /* PART 1 · THE BANNER LEAVES WHEN THE AVATAR LANDS, not when it takes
     off. The order is the whole point: the banner HANDS ITS CONTENT to
     the board, and only then does the empty shell go. Exiting at flight
     start would make the token look like debris from a banner that was
     already leaving; exiting on landing makes the landing the cause.
     It used to stay behind as an empty grey pill for the rest of the
     beat, which is the bug this fixes. */
  const land = () => {
    slot.innerHTML = '<span class="f5av">' + AV3 + '</span>';
    const chy = $('#chyron');
    const bnr = $('.chyron .bnr');
    if (bnr) bnr.classList.add('is-spent');
    if (!chy) return;
    /* slide up and fade — no pop, no scale. The shell is not being
       dismissed, it is being vacated. */
    chy.classList.add('is-exiting');
    setTimeout(() => { chy.hidden = true; chy.classList.remove('is-exiting'); }, T.f5BnrOut);
  };
  if (!src || matchMedia('(prefers-reduced-motion: reduce)').matches) { land(); return Promise.resolve(); }
  const a = src.getBoundingClientRect(), z = slot.getBoundingClientRect();
  if (!z.width || !z.height) { land(); return Promise.resolve(); }
  const fly = el('span', 'f5fly', AV3);
  fly.style.cssText = 'left:' + a.left + 'px; top:' + a.top + 'px;' +
    'width:' + a.width + 'px; height:' + a.height + 'px;';
  document.body.appendChild(fly);
  const bnr = $('.chyron .bnr'); if (bnr) bnr.classList.add('is-spent');
  const dx = (z.left + z.width / 2) - (a.left + a.width / 2);
  const dy = (z.top + z.height / 2) - (a.top + a.height / 2);
  const k  = z.height / a.height;
  return new Promise(done => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fly.style.transition = 'transform ' + T.f5Flight + 'ms var(--e-land)';
      fly.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) +
                            'px) scale(' + k.toFixed(3) + ')';
      setTimeout(() => { land(); fly.remove(); buzz(18); done(); }, T.f5Flight);
    }));
  });
}

/* ---- THE COIN MOMENT, and there are TWO numbers on it rather than the
   mock's one, deliberately.
   The mock draws a single `+125` captioned '4 ח״כים + הסבב + הנושא'.
   Those components do not add to 125 under the coin table it cites —
   4x25 + 50 + 100 is 250 — and more importantly the MK and claim coins
   WERE ALREADY PAID during the round, each with its own flight from its
   own stamp. A single sticker showing the round's total and then flying
   into the counter would either double-pay or visibly disagree with the
   counter it lands in, and a player watching a +125 raise a wallet by 50
   has caught the game lying about arithmetic.
   So: the big number is WHAT IS BEING PAID NOW and it is the number that
   flies; the caption names its components; and a quieter line under it
   gives what the whole issue was worth, which is the thing the brief
   actually asked for and the first place in the game that says it.
   Every number on screen is true and the counter's arithmetic is
   visible. The values themselves come from COIN_TABLES, not from here —
   the spec calls them a proposal, so nothing is hardcoded. */
async function coinMoment(b, topicsWas) {
  const t = COIN_TABLES[DEV.coins];
  const gotTopic = topicsDone() > topicsWas;
  const now = t.round + (gotTopic ? t.topic : 0);
  const parts = [esc('הסבב')];                                       /* TAMAR */
  if (gotTopic) parts.push(esc('הנושא'));                            /* TAMAR */
  const total = (S.coins || 0) + now;

  const coin = el('div', 'f5coin');
  /* placed under the board rather than after it — it is out of flow now,
     so it needs to be told where the board's bottom is. */
  const bd = $('.f5board', b);
  if (bd) coin.style.top = (bd.offsetTop + bd.offsetHeight + 26) + 'px';
  coin.innerHTML =
    '<span class="f5coin__n">+' + N(now) + '</span>' +
    '<p class="f5coin__sub">' + parts.join(' + ') + '</p>' +
    '<p class="f5coin__tot">' + esc('הסוגיה הזו: ') + N(total) + ' ●</p>'; /* TAMAR */
  b.appendChild(coin);
  requestAnimationFrame(() => { coin.classList.add('is-in'); });
  await wait(T.f5CoinHold);
  award(now, coin);              /* the flight leaves FROM the sticker */
  coin.classList.add('is-out');
  await wait(T.f5CoinOut);
  coin.remove();
}

/* ---- PART 2 · everything the player skips, behind one tap, IN THE
   MODAL THE APP ALREADY HAS. This was a dark bottom sheet of its own
   making — a second modal shape, with its own scrim, its own radius and
   its own close button, for content the app already had a surface for.
   It is stickerModal() now: the white centred die-cut dialog that
   lawModal() opens for the bill and glossModal() opens for a glossary
   term. Same box, same ✕, same three ways out (the ✕, the ground and
   Escape), same in and out timing. Nothing here draws a surface.

   stickerModal() took only plain strings, so it grew ONE optional field
   — `extra`, appended inside the same box under the body — rather than a
   variant of itself. lawModal() and glossModal() pass no `extra` and
   render byte-identically to before. */
function moreModal(rest, terms, links) {
  const extra =
    (terms.length ? '<div class="f5chips">' + terms.map(x =>
      '<button type="button" class="f5chip" data-term="' + esc(x) + '">' +
        esc(x) + '</button>').join('') + '</div>' : '') +
    (links.length ? '<div class="f5links">' + links.map(l => {
      const icon = /^\s*סרטון/.test(l.label || '') ? '▶' : '🔗';
      return l.url
        ? '<a class="f5link" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
            '<i aria-hidden="true">' + icon + '</i>' + esc(l.label) + '</a>'
        : '<span class="f5link is-missing" data-missing-url>' +
            '<i aria-hidden="true">' + icon + '</i>' + esc(l.label) + '</span>';
    }).join('') + '</div>' : '');

  const m = stickerModal({
    title: issue.title || issue.bill_title || '',
    body:  rest || '',
    extra: extra
  });
  /* a chip opens its definition on the SAME component, which is exactly
     what glossModal() already is — one surface opened twice, rather than
     a definition panel nested inside a dialog. */
  m.addEventListener('click', e => {
    const c = e.target.closest('.f5chip'); if (!c) return;
    e.stopPropagation();
    glossModal(c.dataset.term);
  });
  return m;
}

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
  /* the banner is no longer inside #scRound, so hiding the round no
     longer hides it — that is the whole point of the promotion, and it
     is also the one thing the promotion has to pay for. */
  const chy = $('#chyron');
  if (chy) { chy.hidden = (name !== 'round'); if (name === 'round') placeChyron(); }
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
/* §3 · THE FILLED MULTI-COLOUR VERSION IS GONE. It failed for a structural
   reason rather than a tuning one: colouring the STROKE that forms the
   letter made the colour into the letterform, so each glyph read as a
   coloured blob with a black hole punched through it and the nine stopped
   being one object. `?title=multi` no longer exists; it falls back to
   solid like any unknown value.
   WHAT REPLACES IT IS A SECOND STROKE, OUTSIDE THE WHITE. Two <text>
   elements per glyph: the first paints a wider coloured stroke and
   nothing else, the second is the existing white-cut-over-black exactly
   as it ships. Painted in that order the colour survives only as the few
   pixels the white does not cover, so the white cut stays the dominant
   edge and the hue is an accent on it — which is the thing the filled
   version could not do. */
const TITLE_ACCENT = '#37C4FF';   /* the app's own accent — see the CSS note */
const lsGlyph = (ch, i) => {
  const ring = DEV.title === 'keyline-multi' ? TITLE_HUES[i % TITLE_HUES.length]
             : DEV.title === 'keyline-one'   ? TITLE_ACCENT
             : null;
  /* THE HUE GOES IN A CUSTOM PROPERTY, NOT IN A stroke= ATTRIBUTE. A
     presentation attribute loses to any CSS declaration, and `.i-ls text`
     sets `stroke:var(--edge)` — so the attribute version painted the ring
     white and the variants were indistinguishable from solid. */
  return '<svg class="g' + (ring ? ' g--ring' : '') + '" viewBox="0 0 100 116"' +
      (ring ? ' style="--ring:' + ring + '"' : '') + ' aria-hidden="true">' +
    (ring ? '<text class="g-ring" x="50" y="92">' + esc(ch) + '</text>' : '') +
    '<text x="50" y="92">' + esc(ch) + '</text></svg>';
};

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
  pressable($('.i-cta', r)).addEventListener('click', () => loadingBeat(goMap));
  showScreen('intro');
}

/* ===================== §1 · THE LOADING BEAT ========================
   The intro empties, the chair grows into the middle, a bar fills under
   it, and then the destination.

   THE DESTINATION IS AN ARGUMENT. Today the only caller passes goMap;
   when character creation lands between them it passes that instead, and
   nothing in here changes. The beat deliberately knows nothing about
   where it is going — it is a transition, not a router.

   THE BAR IS FAKE AND THE CODE SHOULD NOT PRETEND OTHERWISE. Nothing is
   being fetched, decoded or waited on: the fill runs on --t-load-fill and
   that is the entire mechanism. When there IS something to load, that
   clock is what gets replaced with the real signal; the shape of the
   beat, the copy and the geometry all survive it.

   NO LABEL UNDER THE BAR, and it was a real choice between 'טוען את
   הכנסת…' and nothing:
     - the bar is fake, and a label naming the work asserts something that
       is not happening. When it becomes true it will be true for a
       different reason, which is a bad thing for shipped copy to be
       waiting on.
     - the beat exists to go from four objects on screen to ONE. Adding a
       third element back — chair, bar, line — undoes the reduction that
       is the entire point of it.
     - it is on screen for 2.2 seconds. Nobody reads it, and a Hebrew line
       nobody reads is still a Hebrew line somebody has to write, review
       and translate.
   The chair and a cyan bar already say wait. What a label WOULD have
   carried is the accessible name, so that goes on the element itself as
   role=progressbar + aria-label: announced, never drawn.

   prefers-reduced-motion SKIPS THE WHOLE BEAT rather than shortening it.
   A 2.2s wait with no motion is just a delay, and a delay is the one
   thing this is not allowed to be. */
const LOAD_A11Y = 'טוען…';                                   /* TAMAR */

function loadingBeat(done) {
  const sc = $('#scIntro'), chair = $('.i-chair', sc), stage = $('#stage');
  if (!sc || !chair || sc.dataset.loading) return done();
  sc.dataset.loading = '1';                 /* a second tap cannot re-arm */

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();

  /* OUT OF FLOW BEFORE ANYTHING IS MEASURED. The exit needs the map to
     render underneath this screen, and .screen is flex:1 in a flex
     column — two visible screens would stack vertically rather than
     overlap. Lifting it here rather than at the exit means every
     coordinate computed below is already in the final coordinate
     system, so nothing shifts when the destination arrives. */
  sc.classList.add('is-lifted');
  void sc.offsetWidth;

  /* THE GROWTH IS A MEASURED TRANSFORM, NOT A CLASS WITH A HARD-CODED
     SIZE. The chair's resting height is a vh clamp, so its start size
     differs on every device; the target is expressed as a share of the
     stage, and the scale is whatever gets from one to the other. The
     chair therefore ends up occupying the same portion of every screen
     rather than the same number of pixels on none of them. */
  const sr = stage.getBoundingClientRect(), cr = chair.getBoundingClientRect();
  const h  = Math.min(sr.height * 0.52, 380);
  const k  = h / cr.height;
  const cy = sr.top + sr.height * 0.44;     /* a little above centre, so the
                                               bar below it is not crowding
                                               the bottom of the stage */
  const dx = (sr.left + sr.width / 2) - (cr.left + cr.width / 2);
  const dy = cy - (cr.top + cr.height / 2);

  const bar = el('div', 'i-load');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', LOAD_A11Y);
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', '0');
  bar.innerHTML = '<i class="i-load__fill"></i>';
  /* under the chair's FINAL position, measured from the stage's own top
     so it does not depend on where the chair started */
  bar.style.top = Math.round((cy - sr.top) + h / 2 + 30) + 'px';
  sc.appendChild(bar);

  (async () => {
    /* 1 · the screen empties and the chair grows, on the same tick.
           THE REFLOW BETWEEN THEM IS LOAD-BEARING. .i-chair carries no
           transition until .is-loading lands, so setting the class and
           the transform in one frame gave the browser a transform change
           on an element that had no transition when the frame started —
           it jumped. Measured: 331 of a 333px target at 150ms of a 520ms
           rise. Reading offsetWidth flushes the class first, so the
           transform then has something to animate. */
    sc.classList.add('is-loading');
    void chair.offsetWidth;
    chair.style.transform = 'translate(' + dx.toFixed(1) + 'px,' +
                            dy.toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
    await wait(T.loadFade);

    /* 2 · the bar arrives after the screen is clear, never with it */
    bar.classList.add('is-in');
    await wait(T.loadBarIn);

    /* 3 · and fills, decelerating. Same flush as the chair — .i-load__fill
           gets its transition from .is-filling, which is the class that
           also changes the width. */
    void bar.offsetWidth;
    bar.classList.add('is-filling');
    bar.setAttribute('aria-valuenow', '100');
    await wait(T.loadFill + T.loadHold);

    await loadingExit(sc, chair, bar, dx, dy, k, done);
  })();
}

/* ---- THE EXIT · the chair flies into the player ---------------------
   Zooming into the chair IS sitting down in it — the 121st seat is the
   game's title and this is the one beat that enacts it rather than
   saying it.
     0   -> 150   the bar fades out
     150 -> 350   the chair holds alone, one beat
     350 -> 770   the chair launches at the camera, 1x -> 10x, ease-in
     602 -> 770   ... the last 40%, over which it fades to nothing
     350 -> 710   the destination fades up underneath from scale 1.04
   770ms bar-full to settled, once per load.

   THE DESTINATION IS THE REAL SCREEN, rendered and animating, not an
   image of one. done() renders it and showScreen() hides this one on the
   way past; the intro is simply un-hidden again for the few hundred ms
   it is still in the air. */
async function loadingExit(sc, chair, bar, dx, dy, k, done) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish = () => {
    sc.hidden = true;
    sc.classList.remove('is-lifted', 'is-loading');
    chair.classList.remove('is-launching');
    chair.style.transition = ''; chair.style.transform = ''; chair.style.opacity = '';
    /* THE MAP'S ARRIVAL CLASS COMES OFF FIRST. Dropping .is-launch swaps
       the destination's animation from lx-dest back to .sc-map's own
       map-in, and a changed animation-name RESTARTS it — the map faded
       up a second time, 50ms after it had finished arriving. Clearing
       .is-arriving leaves it at its settled state with nothing left to
       re-trigger. */
    const mp = $('#scMap'); if (mp) mp.classList.remove('is-arriving');
    $('#stage').classList.remove('is-launch');
    if (bar.isConnected) bar.remove();
  };

  /* 1 · the bar leaves first, alone */
  bar.classList.add('is-out');
  await wait(T.lxBar);
  bar.remove();

  /* 2 · and the chair holds for a beat, the only thing on screen */
  await wait(T.lxHold);

  /* 3 · the destination is brought up UNDERNEATH before the chair moves,
         so there is never a frame of empty dot-grid between the two.
         done() -> goMap() -> showScreen('map'), which hides this screen;
         it is put straight back, still absolute and still on top. */
  $('#stage').classList.add('is-launch');
  done();
  sc.hidden = false;

  /* 4 · the launch. One frame later so the destination is painting
         before the chair starts, and so the class and the transform
         cannot land on the same tick — .i-chair has no launch transition
         until .is-launching is applied. */
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  chair.classList.add('is-launching');
  if (!reduced) {
    chair.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) +
                            'px) scale(' + (k * 10).toFixed(4) + ')';
  }
  /* +60ms of tail. finish() hides the screen, and the two frames spent
     waiting for the destination to paint before the launch mean the
     zoom's clock starts after this function's does — cleaning up on the
     nominal duration clipped the last ~36ms of the chair's fade, which
     is the hard cut at max scale the whole handoff exists to avoid. */
  await wait((reduced ? T.lxDest : T.lxZoom) + 60);
  finish();
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
  const sr = $('#scRound'); if (sr) sr.classList.remove('is-finale');
  const chy0 = $('#chyron');
  if (chy0) { chy0.hidden = false; chy0.classList.remove('is-exiting'); }
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
  /* ?issue=<id> lets the deep-link land on a specific round, which is the
     only way to reach the inverted a2 without playing a1 first */
  if (DEV.screen === 'round')      startRound(Q.get('issue') || undefined);
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
  /* ?neon=off strips the banner's glow and leaves the sticker otherwise
     identical, so the two can be compared on a device */
  document.documentElement.dataset.neon = DEV.neon;
  document.documentElement.dataset.f5bar = DEV.f5bar;
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
