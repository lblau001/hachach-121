/* =====================================================================
   הח״כ ה-121 — prototype round engine, s1.

   THE ARC (sheet §1.0, revised 29 Aug — verified against data.js):
     1 CLAIM     אמת/שקר   answered, NOT resolved
     2 POSITION  the player as the 121st MK, unscored
     3 CONTEXT   one line, no fields read (T5; was bill_title + bill_date)
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
const ROOT     = '';                          /* manifest paths are app-root relative */

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
  stampDropMk: ms('--t-stamp-drop-mk'),  /* ITEM 7 · contact on an MK card */
  stampLand:   ms('--t-stamp-land'),     /* ITEM 47 · the shared landing, end to end */
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
  f5Board:   ms('--t-f5-board'),    /* ITEM 8 · the board's move up      */
  f5Panel:   ms('--t-f5-panel'),    /* ITEM 8 · one step of the stagger  */
  f5Hold:    ms('--t-f5-hold'),     /* ITEM 11a · the record, alone      */
  f5TickAt:  ms('--t-f5-tick-at'),  /* ITEM 11c · after the token lands  */
  f5Tick:    ms('--t-f5-tick'),     /* ITEM 11d · the +1                 */
  f5BnrOut:  ms('--t-f5-bnr-out'),
  claimHold: ms('--t-claim-hold'),
  claimBeat: ms('--t-claim-beat'),
  claimLift: ms('--t-claim-lift'),   /* ITEM 2 · the reveal's reflow, played */
  seatFill:  ms('--t-seat-fill'),
  seatCross: ms('--t-seat-cross'),
  markGap:   ms('--t-mark-gap'),
  panelGap:  ms('--t-panel-gap'),
  deckPeek:  ms('--t-deck-peek'),    /* T22 · the back of the next card, seen */
  cmarkLand: ms('--t-cmark-land'),   /* the pill's own landing, read not guessed */
  claimHold: ms('--t-claim-hold'),   /* T18 · verdict -> the card reacting */
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
  gxIn:      ms('--t-gx-in'),      /* T55 · the strip's own fade         */
  punchHold: ms('--t-punch-hold'), /* T55 · mark visible, nothing moving */
  snapback:  ms('--t-snapback'),
  resolve:   ms('--t-resolve'),
  coin:      ms('--t-coin'),
  coinFly:     ms('--t-coin-fly'),
  coinStagger: ms('--t-coin-stagger'),
  egFly:       ms('--t-eg-fly'),        /* ITEM 14 · one allocation token */
  egFlyStep:   ms('--t-eg-fly-step'),
  egFlyFade:   ms('--t-eg-fly-fade'),
  egPulse:     ms('--t-eg-pulse'),
  nodePress:   ms('--t-node-press'),
  screen:      ms('--t-screen'),
  mapIn:       ms('--t-map-in'),
  gateHint:  ms('--gate-hint'),
  gateGrow:  ms('--gate-grow'),
  qbarAt:    ms('--t-qbar-at'),    /* T27 · the demo, after the card  */
  qbarHold:  ms('--t-qbar-hold')   /* T27 · how long it stays open    */
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
  screen: qPick('screen', { intro:'intro', map:'map', round:'round',
                            end:'end' }, 'intro'),
  /* B1-2 · null means "ask localStorage". on/off force the overlay in
     either direction WITHOUT writing the flag, which is the only way to
     look twice at something that by definition happens once. */
  intro:  qPick('intro',  { on:true, off:false }, null),
  /* ITEM 43 · the same switch for the map's first-arrival sticker, and
     for the same reason spelled out above it. ?reset also clears the flag
     — it lives in the save — but resetting to look at one modal spends
     the whole run, which is not a thing to ask of anyone in a meeting.
     Like ?intro, an override never writes the flag. */
  mapIntro: qPick('mapintro', { on:true, off:false }, null),
  /* T13 · and the same switch again, for the same reason twice stated
     above it: the avatar's beacon is a once-ever thing and a once-ever
     thing cannot otherwise be looked at twice. on/off force the beacon
     WITHOUT writing the flag. */
  beacon: qPick('beacon', { on:true, off:false }, null),
  /* T11 · and again, for the pre-finale explainer. Same reason a third
     time: a screen that by definition happens once cannot otherwise be
     looked at twice, and resetting the save to see it spends the whole
     run. on/off force it WITHOUT writing the flag. */
  preHow: qPick('prehow', { on:true, off:false }, null),
  /* SOUND · and a fifth time, for the same reason as the four above: a
     preference that ships OFF cannot otherwise be looked at without
     spending the player's own setting. on/off force it WITHOUT writing
     the flag; null means "ask the save". */
  sound: qPick('sound', { on:true, off:false }, null),
  /* T27 · and again, for the question block's one-shot demonstration.
     on/off force it WITHOUT writing the flag. */
  qbar: qPick('qbar', { on:true, off:false }, null),
  /* BUILD-IB · and twice more, for the two schedules this pass adds. The
     reason is the same one stated four times above: a thing that by
     definition happens once cannot otherwise be looked at twice, and
     resetting the save to see it spends the whole run. Neither override
     writes its flag. */
  askMk: qPick('askmk', { on:true, off:false }, null),
  tctap: qPick('tctap', { on:true, off:false }, null),
  /* T20 · the claim's size on beat 2. 26 SHIPS as of 09 Sep — see .b2q in
     proto.css for why, and note it is a fit decision rather than a type
     one. 30 and 22 stay reachable so the three can be drawn beside each
     other without editing the file; 30 is the old value and 22 is the one
     that was ruled out. */
  qsize: qPick('qsize', { '30':30, '26':26, '22':22 }, 26),
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
  f5bar:  qPick('f5bar', { spec:'spec', neutral:'neutral' }, 'spec'),
  /* ?reset · WIPE THE SAVE AND START CLEAN, and it is the flag that now
     carries the guarantee PROGRESS's comment used to carry on its own.
     A demo surface has to be able to open empty in front of a client;
     that used to be free, because nothing was written down. Now that
     progress and the wallet survive a reload, the guarantee needs a
     switch, and this is it. Presence is enough — ?reset, not ?reset=1 —
     so it is one word to type in a meeting. See THE SAVE below. */
  reset:  Q.has('reset')
};

let M = null;                       /* manifest.json                     */
let issue, topic, S;

/* ---------------------------------------------------------------------
   THE FIXED STAGE.
   --vh mirrors window.innerHeight for Safari builds without dvh, so the
   stage follows the chrome collapsing instead of assuming 844px.
   --card-scale shrinks the 620px card assembly to whatever height the
   round actually has, so a short phone never needs a scrollbar to see a
   whole card. Nothing in the app scrolls except .scrolls — the map, the
   character grid, the end-game allocation list and the claim reveal.
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
  /* ITEM 8 · MEASURE THE PADDING IT IS GOING TO HAVE, NOT THE ONE IT IS
     PASSING THROUGH. scrollHeight includes padding-top, and on the finale
     that padding is the board's move — 315px easing to 128. Called on the
     frame the move starts, this measured 868px of stack against 786 of
     room, scaled the WHOLE beat to 0.905, and only the delayed call after
     the move had landed put it back: a 9.5% shrink and a snap back, on
     the one beat whose brief says the board must never jump. It was
     invisible before this item only because the board demoted to a strip
     first and the sums happened to land inside the room either way.
     The inline value is the target f5Place() set; the computed one is
     wherever the transition has got to. Swap one for the other and the
     measurement is of the layout that is arriving. NOT by suspending the
     transition — that would commit the end value and cancel the move. */
  const used   = parseFloat(getComputedStyle(fit).paddingTop) || 0;
  const target = fit.style.paddingTop ? (parseFloat(fit.style.paddingTop) || 0) : used;
  const need = fit.scrollHeight - used + target;
  if (need > avail && avail > 0) {
    fit.style.transform = 'scale(' + (avail / need).toFixed(4) + ')';
  }
}
addEventListener('resize', sizeStage);
addEventListener('resize', placeChyron);
/* the map's connector is drawn in device pixels, so it has to be redrawn
   when the window changes size. Cheap, and a no-op on the other screens. */
addEventListener('resize', () => { if ($('#mapline')) redrawPath(); });
/* v26f · the same shape as the line above it: line 1 is re-measured only
   when a .b2q__tab is on screen, so this is a no-op on every screen but
   beat 2. No ResizeObserver — the resize event is what the stage already
   listens to. */
addEventListener('resize', () => {
  if (!$('.b2q__tab')) return;
  fitClaimSize();      /* T22 · the step is a function of the width */
  fitBeat2();          /* the budget moves with the viewport */
  placeQTab();         /* and line 1 moved with the chair */
});
addEventListener('orientationchange', () => setTimeout(sizeStage, 250));
if (window.visualViewport) visualViewport.addEventListener('resize', sizeStage);

/* ===== §N · THE SOFT KEYBOARD ========================================
   THE STAGE DOES NOT MOVE. window.innerHeight is what --vh mirrors, and
   on iOS Safari it does NOT change when the keyboard opens — only
   visualViewport.height does — so the stage keeps its size and its place
   and nothing outside the modal shifts. What the keyboard takes is
   measured here and handed to the MODAL alone as --kb-h: .stmodal ends
   that many px above the stage's foot, so its box re-centres in what is
   still visible and its scrolling body absorbs the rest.
   WEBKIT SCROLLS THE LAYOUT VIEWPORT ANYWAY when a focused field would
   be under the keyboard, overflow:hidden or not. That is corrected on
   visualViewport's scroll event rather than fought at focus: put the
   layout viewport back at 0 and let --kb-h do the revealing.
   Under 80px is the URL bar breathing, not a keyboard, and is ignored.
   On blur --kb-h returns to 0, so the modal is exactly where it was. */
function kbSync() {
  const vv = window.visualViewport, d = document.documentElement;
  const a = document.activeElement;
  const typing = !!(a && a.matches && a.matches('input, textarea') && $('#stage').contains(a));
  let kb = 0;
  if (typing && vv) {
    kb = Math.round(window.innerHeight - vv.height);
    if (kb < 80) kb = 0;
  }
  d.style.setProperty('--kb-h', kb + 'px');
  /* the box's ceiling in px, not a percentage: a percentage max-height on
     a grid item does not track the container once `bottom` shortens it
     (measured in Chrome — 92% left a 501px box in a 340px area) */
  d.style.setProperty('--kb-vis', (window.innerHeight - kb) + 'px');
  d.classList.toggle('kb-open', kb > 0);
  /* NOT ONLY WHILE TYPING. The body never scrolls by design, so any
     layout-viewport offset is drift — Chrome on iOS was seen leaving one
     behind after the keyboard closed, and with it the top of the sheet
     (and the ✕) under its toolbar. Blur is the moment to put it back. */
  if (window.scrollY || (vv && vv.offsetTop)) window.scrollTo(0, 0);
  if (kb && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
}
if (window.visualViewport) {
  visualViewport.addEventListener('resize', kbSync);
  visualViewport.addEventListener('scroll', kbSync);
}
/* =====================================================================
   T9b(c) · THE WINDOW'S OWN SCROLL, WHICH WAS THE ONE GAP
   The reset itself already existed — the last two lines of kbSync() put
   the page back whenever an offset appears — but it was only ever reached
   from visualViewport's own events and from focus. A pan that moves the
   LAYOUT viewport fires `scroll` on the window and nothing else, so
   nothing was listening to it.
   DEBOUNCED, AND THROUGH kbSync() RATHER THAN A SECOND RESET. One frame
   is enough to coalesce a flick, and routing it through the existing
   function means there is still exactly one piece of code that decides
   what to do about an offset — including its handling of a focused field,
   which a parallel reset would have had to duplicate and keep in step.
   IT CANNOT UNDO A ZOOMED PAN, and that is not a defect in it: while
   visualViewport.scale > 1 the visual viewport's offset inside the layout
   viewport is the user's pinch, and window.scrollTo does not address it.
   See the report — that case is item (a)'s to prevent, not this one's. */
let vpKick = 0;
addEventListener('scroll', () => {
  if (vpKick) return;
  vpKick = setTimeout(() => { vpKick = 0; kbSync(); }, 120);
}, { passive: true });
addEventListener('focusin', () => setTimeout(kbSync, 50));
/* activeElement is body again only AFTER focusout has run */
addEventListener('focusout', () => setTimeout(kbSync, 0));
/* belt and braces against rubber-band: the body never pans. The four
   surfaces that may (map, character, the end-game allocation list, the
   claim card's explanation panel) carry .scrolls and opt back in.
   THE ALLOCATION LIST WAS THE THIRD AND WAS MISSING. It is worth stating
   why that was invisible for so long: this handler does not fail loudly.
   A surface that forgets the class keeps its overflow, keeps its
   scrollbar geometry, scrolls perfectly from script — and simply ignores
   the finger. There is nothing to see in the DOM and nothing in the
   console. Anything that grows a scroll container from here on has to be
   given this class in the same commit. */
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
/* ONE PASS OVER THE TEXT, AND THAT IS THE WHOLE POINT OF THE SHAPE.
   This was a loop: each term ran its own .replace() over the string the
   PREVIOUS term had already written markup into, guarded by
   `out.indexOf('data-gt="' + t) >= 0` — "have I marked this term yet".

   THE GUARD MISSES A SHORT TERM THAT IS A SUFFIX OF A LONGER ONE.
   Sorting longest-first wraps `ייצוג בבג"ץ` before `בג"ץ` is tried, and
   emits data-gt="ייצוג בבג&quot;ץ". The guard then asks whether
   `data-gt="בג&quot;ץ` appears — it does NOT, because after `data-gt="`
   comes ייצוג — so the guard passes, and .replace() takes the FIRST
   occurrence of בג&quot;ץ in the string, which is now the one INSIDE
   that attribute. Output:

     data-gt="ייצוג ב<span class="gt" data-gt="בג&quot;ץ">בג&quot;ץ</span>"

   — a span opened inside an attribute value. Both terms are in the CMS
   today and the pair has never co-occurred in a rendered field, so it
   has never fired; it fires the first time Tamar writes that phrase.

   THE GUARD IS NOT THE BUG AND A BETTER GUARD IS NOT THE FIX. The bug
   is that the function RE-SCANS ITS OWN OUTPUT, so every term is free to
   match inside markup an earlier term emitted. Any indexOf test only
   moves the hole. One alternation regex, one left-to-right pass:
   String.replace never re-examines what it has already emitted, so a
   term CANNOT land inside another term's markup. The class of failure is
   gone rather than patched. Do not "simplify" this back into a loop.

   THE TWO PROPERTIES THE OLD LOOP HAD ARE BOTH KEPT, deliberately:
     · LONGEST FIRST. The sort is now the alternation ORDER — a regex
       tries branches left to right at each position, so the long term
       wins wherever both could start. Same precedence, no sort at call
       time.
     · FIRST OCCURRENCE ONLY, ONCE PER TERM. `.replace(str, …)` replaced
       one occurrence and the guard blocked a second; `seen` is that,
       said once. A repeat match returns itself untouched.
   Byte-identical output to the old path on every string in data.js
   today — data-gt keeps the ESCAPED form, which the parser decodes back
   to the key, exactly as before. */
const RX_META = /[.*+?^${}()|[\]\\]/g;
let GT_RE = null;
function markGlossary(text) {
  const out = esc(text);
  if (GT_RE === null) {
    const terms = Object.keys(DATA.glossary || {})
      .sort((a, b) => b.length - a.length)
      .map(t => esc(t).replace(RX_META, '\\$&'));
    /* no terms is a real state — a data.js with no glossary marks
       nothing rather than building an empty alternation that matches
       at every position */
    GT_RE = terms.length ? new RegExp(terms.join('|'), 'g') : false;
  }
  if (!GT_RE) return out;
  const seen = new Set();
  GT_RE.lastIndex = 0;
  return out.replace(GT_RE, m => {
    if (seen.has(m)) return m;
    seen.add(m);
    return '<span class="gt" data-gt="' + m + '">' + m + '</span>';
  });
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

/* ===================== §B · THE PLAYER'S PROFILE ====================
   §4.1: no creation step. A default avatar is assigned instantly and the
   HUD sticker is the door to changing it. PROFILE is the whole of what
   the player has said about themselves, and it is ADDITIVE to the save —
   a save written before it simply has none and restores to these
   defaults, the same reasoning `cf` used. No SAVE_VER bump.
     avatarId · a preset's id. Defaults to the first preset at boot.
     name     · optional, cleaned by cleanName(), at most NAME_MAX. The
                field is in 2b; the keyboard it summons is handled by
                kbSync() (§N) and is the one thing here that can only be
                verified on a phone.
     gender   · null | 'm' | 'f'. null is the PLURAL copy, which is what
                the game speaks today. NEVER forced: the board draws
                לשון זכר selected and app.js writes 'm' on save, and both
                are the old build.
     invited  · Part C's once-only flag — the identity-moment invitation
                has been shown (or forfeited) and never comes back.
     cfg      · the built character (§D): {skin, hair, hairColor, eyes,
                clothes, bg}, option ids from BLD. null = the preset wins;
                set, it outranks the preset — see avatarSvg(). */
const PROFILE = { avatarId: null, name: '', gender: null, invited: false, cfg: null };
/* 24 characters: the longest Hebrew given name plus a hyphenated second
   one fits with room, and the record heading has to carry it on one line
   at title size on a 360. Whitespace runs collapse, ends are trimmed, and
   a name that was only whitespace is no name. */
const NAME_MAX = 24;
const cleanName = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

/* THE PRESETS, RESOLVED DEFENSIVELY. On flow-proto they are `AVATARS`,
   the second constant in data.js; master has since moved them to their
   own avatars.js, which this index.html does not load. So nothing here
   assumes the constant exists or which file declared it: whatever is
   there and well-formed is the sheet, and no sheet is a legal state —
   the HUD keeps AV3 and 2b hides its swap door. */
function presets() {
  let a = [];
  try {
    if (typeof AVATARS !== 'undefined' && Array.isArray(AVATARS)) a = AVATARS;
    else if (typeof DATA !== 'undefined' && DATA && Array.isArray(DATA.avatars)) a = DATA.avatars;
  } catch (e) { a = []; }
  return a.filter(x => x && typeof x.id === 'string' && typeof x.svg === 'string'
                         && x.svg.indexOf('<svg') === 0);
}
function preset(id) { return presets().find(x => x.id === id) || null; }
/* the one the player carries: their pick if it still exists, else the first */
function currentPreset() { return preset(PROFILE.avatarId) || presets()[0] || null; }

/* ---- THE ROUND SHELL. A preset is a SQUARE sticker — a rounded rect in
   the skin colour, a translucent band, the figure — and the game's token
   is a DISC. Round is one of the three devices that keep the player
   readable as not one of the 120 (AV3 above), and it is kept HERE, in
   the one function the six consumers read from, rather than by CSS in
   six places: the background rect is dropped, its fill becomes the disc,
   and the rest is clipped to the same r48 circle AV3 uses, under the
   same keyline. .f5av/.f5fly still circle-crop by CSS; with the disc
   built in there are no corners left for them to crop.
   A preset that does not open the way Roman's eight do is used whole,
   clipped: a round sticker with a square inside it, never a broken one. */
const SQ_BG = /^<svg[^>]*>\s*<rect x="4" y="4" width="92" height="92" fill="(#[0-9a-fA-F]{3,8})"[^>]*\/>/;
function roundShell(svg) {
  const m = svg.match(SQ_BG);
  let inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  if (m) inner = inner.replace(/^\s*<rect[^>]*\/>/, '');
  return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<defs><clipPath id="c-av3"><circle cx="50" cy="50" r="48"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="48" fill="' + (m ? m[1] : '#C9BFA6') + '"/>' +
    '<g clip-path="url(#c-av3)">' + inner + '</g>' +
    '<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1.6"/></svg>';
}
/* ===================== §D · THE BUILT CHARACTER ====================
   The eight presets are hand-drawn single SVGs; nothing can edit them.
   So the builder is not "adjust this one" — it is "build your own from
   nothing", and what it builds is drawn by THIS generator, ported from
   app.js:4-94 (the source of truth the Builder boards cite for "every
   category and label"). Two representations coexist in PROFILE — a
   chosen preset (avatarId) or a built character (cfg) — exactly one is
   active, and neither destroys the other; see avatarSvg() for which.

   THE SIX AXES: the CHAR board's five in its order, ids/colours/labels
   as shipped, then the BACKGROUND, which is ours. app.js painted the
   square behind the figure as the outfit at 15%, the presets paint it as
   the skin, and the disc shell reads that square's fill as the disc —
   so under the shell a build's face and ground were one colour and the
   head had no edge; at s4/s5 the figure vanished into itself. The ground
   is CHOSEN now: six flat neutrals and tints that sit apart from every
   skin tone (all five skins are hue 25–27; the nearest ground is kraft
   at hue 43 with a third of the saturation, and the four tints are 100+
   hues away), none of them lime or magenta, the default being the tone
   AV3's own disc wears. The grey is the one DARK ground, pushed cool
   (hue 213) and well below kraft in value: a pale grey sat at the same
   value as kraft and was a wasted option. Labels are ours, a TAMAR item.
   One set of shipped labels is not words: the skin tones are labelled
   with the emoji skin-tone modifiers 🏻…🏿, which are swatches, not
   names — Part B shows the colour and leaves the naming to Tamar. */
const BLD = {
  skin: [
    {id:'s1',color:'#f4c9a5',label:'🏻'},{id:'s2',color:'#e8b088',label:'🏼'},
    {id:'s3',color:'#c68b5c',label:'🏽'},{id:'s4',color:'#8b5e3c',label:'🏾'},{id:'s5',color:'#5c3a1e',label:'🏿'}
  ],
  hair: [
    {id:'short',label:'קצר'},{id:'long',label:'ארוך'},{id:'curly',label:'מתולתל'},
    {id:'kippah',label:'כיפה'},{id:'hijab',label:"חיג'אב"},{id:'bald',label:'קרח'}
  ],
  hairColor: [
    {id:'hc1',color:'#1a1a1a',label:'שחור'},{id:'hc2',color:'#3a2418',label:'חום'},
    {id:'hc3',color:'#c8a832',label:'בלונד'},{id:'hc4',color:'#888',label:'אפור'},{id:'hc5',color:'#8b1a1a',label:'אדום'}
  ],
  eyes: [
    {id:'normal',label:'רגיל'},{id:'glasses',label:'משקפיים'},{id:'sunglasses',label:'משקפי שמש'}
  ],
  clothes: [
    {id:'cl1',color:'#2b4cff',label:'כחול'},{id:'cl2',color:'#ff5240',label:'אדום'},
    {id:'cl3',color:'#22c98e',label:'ירוק'},{id:'cl4',color:'#3a3a3a',label:'שחור'},{id:'cl5',color:'#b06bff',label:'סגול'}
  ],
  bg: [
    {id:'bg1',color:'#C9BFA6',label:'קרפט'},{id:'bg2',color:'#FBF7EE',label:'נייר'},
    {id:'bg3',color:'#BFDDF0',label:'שמיים'},{id:'bg4',color:'#BFE3D3',label:'מנטה'},
    {id:'bg5',color:'#D8CCEE',label:'לילך'},{id:'bg6',color:'#99A3B1',label:'אפור'}
  ]
};
const BLD_ORDER = ['skin', 'hair', 'hairColor', 'eyes', 'clothes', 'bg'];
/* the axis headings Part B shows above each grid. hairColor has TWO: on
   the חיג'אב path the same axis colours the scarf, and it says so. */
const BLD_TITLE = { /* TAMAR */
  skin: 'גוון עור', hair: 'שיער', hairColor: 'צבע שיער', hairColorHijab: "צבע החיג'אב",
  eyes: 'עיניים', clothes: 'לבוש', bg: 'רקע'
};
/* NO LIGHT DEFAULT. The shipped list runs light→dark and app.js starts
   at s1; a build here starts in the MIDDLE of the range, index 2 (s3,
   #c68b5c — the tone AV3 itself wears). Part B's first cfg and the
   generator's own fallback both read this. */
const BLD_SKIN_DEFAULT = 2;
/* THE HIDE RULE, narrowed from app.js:231. The old build hid the hair
   colour for קרח AND חיג'אב — but the hijab's fabric is drawn in
   hairColor, so a hidden axis was controlling a visible thing, and the
   scarf took whatever the axis last held. Now only קרח skips the axis
   (nothing there to colour); on the hijab path the same axis stays,
   headed BLD_TITLE.hairColorHijab, and colours the scarf on purpose. */
const hairHidesColor = hair => hair === 'bald';
/* an axis value → its option. cfg holds option IDS on every axis (a
   divergence from app.js, which stores hex for skin/hairColor/clothes and
   ids for hair/eyes): an id can be checked against the table on restore,
   the way avatarId is checked against the sheet, and the palette lives in
   one place. A bare hex is still honoured below, so an app.js-shaped cfg
   draws the same figure. */
function bldOpt(axis, v) {
  return BLD[axis].find(o => o.id === v || (o.color && o.color === v)) || null;
}
const isHex = v => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

/* buildAvatar(cfg, gender) · app.js's buildAvatarSvg, COPIED not
   referenced (app.js is untouched and unloaded here). Lines 32–88 of the
   original — body, neck, face, hair, eyes, nose, mouth — are verbatim.
   Everything that differs is in the prologue and the two lines after:
     · gender comes from PROFILE, not `player`. THERE IS NO NEUTRAL
       BODY: the generator draws a dress-with-collar for 'f' and a
       shirt-and-tie for everything else, and its own fallback for an
       unset gender (app.js:25, `|| 'm'`) is the tie. Ported as is —
       null draws the tie — and flagged in the Part A report.
     · axis values are ids resolved through BLD (hex accepted).
     · a missing skin falls back to BLD_SKIN_DEFAULT, not s1.
     · the background rect is the chosen bg axis, opaque, not the outfit
       at 15%: roundShell() reads that rect's fill as the disc. (The
       outfit tint would have become a solid outfit-coloured disc; the
       skin tone, tried first, left the head with no edge.)
     · no xmlns on the root — inline SVG, same as the presets.
   NOT here, tried and removed: a paper keyline inside every hair shape,
   for black hair on the darkest skin. It read as a headband on short
   hair and as beads on curly — a different hairstyle, not a rim. With
   the ground no longer the skin, s5 × שחור reads as hair on its own. */
function buildAvatar(cfg, gnd) {
  var c = cfg || {}, gen = gnd || PROFILE.gender || 'm';
  var col = (axis, v, i) => { var o = bldOpt(axis, v); return o ? o.color : (isHex(v) ? v : BLD[axis][i].color); };
  var opt = (axis, v, i) => { var o = bldOpt(axis, v); return o ? o.id : BLD[axis][i].id; };
  var skin = col('skin', c.skin, BLD_SKIN_DEFAULT);
  var hairStyle = opt('hair', c.hair, 0);
  var hairColor = col('hairColor', c.hairColor, 0);
  var clothesColor = col('clothes', c.clothes, 0);
  var eyeStyle = opt('eyes', c.eyes, 0);
  var bgColor = col('bg', c.bg, 0);

  var body = gen === 'f'
    ? '<path d="M20 96 Q20 68 50 68 Q80 68 80 96 Z" fill="'+clothesColor+'" stroke="#161310" stroke-width="2.5"/><path d="M38 68 Q50 80 62 68 Q56 76 44 76 Z" fill="#fff" stroke="#161310" stroke-width="1.5" opacity="0.7"/>'
    : '<path d="M20 96 Q20 68 50 68 Q80 68 80 96 Z" fill="'+clothesColor+'" stroke="#161310" stroke-width="2.5"/><path d="M42 68 L50 78 L58 68 L58 96 L42 96 Z" fill="#fff" stroke="#161310" stroke-width="2"/><path d="M50 72 L46 78 L47 92 L50 96 L53 92 L54 78 Z" fill="'+clothesColor+'" stroke="#161310" stroke-width="1.5"/>';

  var neck = '<rect x="45" y="60" width="10" height="10" fill="'+skin+'" stroke="#161310" stroke-width="2"/>';
  var face = '<circle cx="50" cy="42" r="20" fill="'+skin+'" stroke="#161310" stroke-width="2.5"/>';

  var hair = '';
  switch(hairStyle) {
    case 'short':
      hair = '<path d="M30 40 Q30 22 50 22 Q70 22 70 40 Q66 32 62 30 Q55 26 50 26 Q45 26 38 30 Q34 32 30 40 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'; break;
    case 'long':
      hair = '<path d="M30 40 Q30 22 50 22 Q70 22 70 40 Q66 32 62 30 Q55 26 50 26 Q45 26 38 30 Q34 32 30 40 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<path d="M28 44 Q22 60 24 80 L30 90 L34 78 Q30 60 32 44 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<path d="M72 44 Q78 60 76 80 L70 90 L66 78 Q70 60 68 44 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'; break;
    case 'curly':
      hair = '<path d="M28 42 Q26 22 50 20 Q74 22 72 42 Q72 56 65 62 Q60 65 50 65 Q40 65 35 62 Q28 56 28 42 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<ellipse cx="50" cy="43" rx="16" ry="19" fill="'+skin+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="30" cy="35" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="70" cy="35" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="36" cy="24" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="64" cy="24" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="50" cy="21" r="5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'; break;
    case 'kippah':
      hair = '<path d="M38 32 Q38 20 50 20 Q62 20 62 32 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<ellipse cx="50" cy="32" rx="12" ry="3.5" fill="'+hairColor+'" stroke="#161310" stroke-width="1.5"/>'; break;
    case 'hijab':
      hair = '<path d="M28 46 Q26 22 50 20 Q74 22 72 46 Q72 72 50 72 Q28 72 28 46 Z" fill="'+hairColor+'" stroke="#161310" stroke-width="2"/>'
           + '<ellipse cx="50" cy="44" rx="17" ry="20" fill="'+skin+'" stroke="#161310" stroke-width="1.5"/>'; break;
    default: break;
  }

  var eyes = '';
  switch(eyeStyle) {
    case 'glasses':
      eyes = '<rect x="37" y="39" width="10" height="8" rx="1" fill="rgba(150,200,255,0.3)" stroke="#161310" stroke-width="2"/>'
           + '<rect x="53" y="39" width="10" height="8" rx="1" fill="rgba(150,200,255,0.3)" stroke="#161310" stroke-width="2"/>'
           + '<line x1="47" y1="43" x2="53" y2="43" stroke="#161310" stroke-width="2"/>'
           + '<line x1="27" y1="43" x2="37" y2="43" stroke="#161310" stroke-width="1.5"/>'
           + '<line x1="63" y1="43" x2="73" y2="43" stroke="#161310" stroke-width="1.5"/>'
           + '<circle cx="42" cy="43" r="1.5" fill="#161310"/><circle cx="58" cy="43" r="1.5" fill="#161310"/>'
           + '<path d="M39 37 Q43 36 47 37" stroke="#161310" stroke-width="1.5" fill="none"/>'
           + '<path d="M53 37 Q57 36 61 37" stroke="#161310" stroke-width="1.5" fill="none"/>'; break;
    case 'sunglasses':
      eyes = '<rect x="37" y="39" width="10" height="8" rx="1" fill="#1a1a1a" stroke="#161310" stroke-width="2"/>'
           + '<rect x="53" y="39" width="10" height="8" rx="1" fill="#1a1a1a" stroke="#161310" stroke-width="2"/>'
           + '<line x1="47" y1="43" x2="53" y2="43" stroke="#161310" stroke-width="2"/>'
           + '<line x1="27" y1="43" x2="37" y2="43" stroke="#161310" stroke-width="1.5"/>'
           + '<line x1="63" y1="43" x2="73" y2="43" stroke="#161310" stroke-width="1.5"/>'; break;
    default:
      eyes = '<ellipse cx="43" cy="42" rx="2" ry="2.5" fill="#161310"/><ellipse cx="57" cy="42" rx="2" ry="2.5" fill="#161310"/>'
           + '<path d="M39 37 Q43 36 47 37" stroke="#161310" stroke-width="1.5" fill="none"/>'
           + '<path d="M53 37 Q57 36 61 37" stroke="#161310" stroke-width="1.5" fill="none"/>'; break;
  }

  var nose = '<path d="M50 46 L48 51 L50 52 L52 51 Z" fill="none" stroke="#161310" stroke-width="1.2"/>';
  var mouth = '<path d="M44 55 Q50 58 56 55" stroke="#161310" stroke-width="1.5" fill="none"/>';
  var bg = '<rect x="4" y="4" width="92" height="92" fill="'+bgColor+'" stroke="#161310" stroke-width="3" rx="12"/>';

  return '<svg viewBox="0 0 100 100">'+bg+body+neck+face+hair+eyes+nose+mouth+'</svg>';
}

/* WHAT THE SIX CONSUMERS READ, and the one place the two representations
   are ranked: a built character, else the chosen preset, else AV3 when
   there is no sheet to choose from. Never a constant directly.
   cfg WINS when both are set. Building a character from nothing is the
   more deliberate act, and a preset chosen earlier — or the default one
   assigned at boot, which every player has — must not outrank it. Part B
   keeps both-set transient (picking a preset clears cfg), but the order
   here is the rule, not the UI. */
function avatarSvg() {
  if (PROFILE.cfg) return roundShell(buildAvatar(PROFILE.cfg));
  const x = currentPreset();
  return x ? roundShell(x.svg) : AV3;
}
/* the square die-cut, for the 2a sheet only — the one place the presets
   are shown as Roman drew them */
function squareSvg(x) { return x.svg.replace(/^<svg /, '<svg aria-hidden="true" '); }

/* ONE SETTER. Everything 2a and 2b do goes through here, so a change is
   saved and the HUD repainted in the same breath — there is no save
   button anywhere in them and nothing to forget. */
function setProfile(patch) {
  Object.assign(PROFILE, patch);
  saveState();
  paintHudAvatar();
}
function paintHudAvatar() { const h = $('#hudAvatar'); if (h) h.innerHTML = avatarSvg(); }

/* ---- t(key) · THE VOICE. The game speaks in the plural — 24 second-
   person strings, all אתם — and gender null keeps it that way. A set
   gender picks the singular slot when it EXISTS and falls back to the
   plural when it does not, so Tamar can fill the slots one at a time and
   nothing is ever blank or wrong-gendered in the meantime.
   THREE SLOTS ARE FILLED, to prove the mechanism, and only three; the
   other 21 stay where they are, inline, until she writes them. All three
   are visible inside any round: the beat-2 framing line, the tap hint,
   and the exit confirm's question. */
const COPY = {
  /* ITEM 30 · b2frame IS RETIRED. Its three voice variants went with the
     translucent banner beat 2 no longer carries; the conceit they carried
     ("כח״כ ה-121") is now in the vote question itself. Removed rather than
     left dangling, so nothing reads a slot that no longer paints — but
     noted here because those were three of Tamar's approved strings and
     this is where they were. */
  tapNext: {
    p: 'הקישו להמשך',                                                /* TAMAR */
    m: 'הקש להמשך',                                                  /* TAMAR */
    f: 'הקישי להמשך',                                                /* TAMAR */
  },
  /* the plural REPLACES the slash form בטוח/ה שאת/ה: the slash was the
     one second-person string not in the plural, and the plural is now
     what gender-null means everywhere */
  exitQ: {
    p: 'בטוחים שאתם רוצים לצאת?',                                    /* TAMAR */
    m: 'בטוח שאתה רוצה לצאת?',                                       /* TAMAR */
    f: 'בטוחה שאת רוצה לצאת?',                                       /* TAMAR */
  },
  /* T27b · THE RESTART'S QUESTION, in this table for the reason exitQ is:
     it addresses the player, so it agrees with them. PLURAL IS THE FORM,
     not the fallback — t() reaches for p unless a gender is set, which is
     the app-wide neutral voice rather than a default of last resort.
     The other three strings of this confirm are NOT here and must not be:
     the consequence names a fact and the two buttons are infinitives, and
     none of the three has anybody to agree with. Same split EXIT_COPY
     already draws. */
  egRestartQ: {
    p: 'בטוחים שאתם רוצים להתחיל את החלוקה מחדש?',                   /* TAMAR */
    m: 'בטוח שאתה רוצה להתחיל את החלוקה מחדש?',                      /* TAMAR */
    f: 'בטוחה שאת רוצה להתחיל את החלוקה מחדש?',                      /* TAMAR */
  },
  /* T11 · THE PRE-FINALE EXPLANATION, first round only. It belongs in this
     table and the BUTTON does not, and the split is the whole point: this
     line addresses the player — it asks them to do something — so it
     agrees with them, while לתוצאות names a place and has nobody to
     agree with. A destination has no voice.
     THE NAME IS revealHow, NOT revealGate. It was briefly the latter
     while the string was in the button; leaving that name on it would
     say the gate is gendered, which is the thing this split exists to
     deny. Three slots, all filled, differing by one word. */
  revealHow: {
    p: 'חשפו את התוצאות הסופיות של ההצבעה',                          /* TAMAR · T11 */
    m: 'חשוף את התוצאות הסופיות של ההצבעה',                          /* TAMAR · T11 */
    f: 'חשפי את התוצאות הסופיות של ההצבעה',                          /* TAMAR · T11 */
  },

  /* =====================================================================
     T25 · THE END SEQUENCE JOINS THE TABLE.
     Ten second-person strings across the four ending screens were bare
     literals in the plural, so a player who had set a gender was addressed
     as a group for the last four screens of the game. They are routed
     here now, like every other string that speaks to the player.

     EIGHT OF THE TEN HAVE ONE SINGULAR FORM, AND THAT IS A FACT ABOUT
     THESE WORDS RATHER THAN ABOUT SINGULAR. Hebrew's second-person
     singular PAST is spelled identically for את and אתה unvocalised —
     סיימת, הצבעת, חילקת — and so are the singular dative and possessive:
     לך, שלך, אותך, תורך. The brief's warning about צדקת/טעית is exactly
     right and it is why every slot below is written out in full rather
     than one form being assigned to both: the day one of these strings
     is re-worded into an imperative or a present tense, m and f diverge,
     and a table that had collapsed them would go on printing one form
     for both without anything failing.
     THE TWO THAT ALREADY DIVERGE ARE THE IMPERATIVES — alloc's חילקו and
     the picker's בחרו. They are the proof of the paragraph above.
     ===================================================================== */
  egDone: {
    p: 'סיימתם',                                                     /* TAMAR · T25 */
    m: 'סיימת',                                                      /* TAMAR · T25 */
    f: 'סיימת',                                                      /* TAMAR · T25 */
  },
  egGo1: {
    p: 'מה יצא לכם ›',                                               /* TAMAR · T25 */
    m: 'מה יצא לך ›',                                                /* TAMAR · T25 */
    f: 'מה יצא לך ›',                                                /* TAMAR · T25 */
  },
  egRecord: {
    p: 'מה יצא לכם',                                                 /* TAMAR · T25 */
    m: 'מה יצא לך',                                                  /* TAMAR · T25 */
    f: 'מה יצא לך',                                                  /* TAMAR · T25 */
  },
  egSurprised: {
    p: 'פעמים שהכנסת הפתיעה אתכם',                                   /* TAMAR · T25 */
    m: 'פעמים שהכנסת הפתיעה אותך',                                   /* TAMAR · T25 */
    f: 'פעמים שהכנסת הפתיעה אותך',                                   /* TAMAR · T25 */
  },
  egAligned: {
    p: 'הצבעתם עם הרוב',                                             /* TAMAR · T25 */
    m: 'הצבעת עם הרוב',                                              /* TAMAR · T25 */
    f: 'הצבעת עם הרוב',                                              /* TAMAR · T25 */
  },
  egGo2: {
    p: 'עכשיו תורכם ›',                                              /* TAMAR · T25 */
    m: 'עכשיו תורך ›',                                               /* TAMAR · T25 */
    f: 'עכשיו תורך ›',                                               /* TAMAR · T25 */
  },
  /* THE ONE WITH THREE VERBS IN IT, and the only allocation string where
     m and f differ — the opening imperative. The two past-tense verbs
     after it collapse; the imperative does not. */
  egAllocLede: {
    p: 'חילקו את המטבעות שצברתם בין הנושאים ששיחקתם.',                /* TAMAR · T25 */
    m: 'חלק את המטבעות שצברת בין הנושאים ששיחקת.',                    /* TAMAR · T25 */
    f: 'חלקי את המטבעות שצברת בין הנושאים ששיחקת.',                   /* TAMAR · T25 */
  },
  egAllSpent: {
    p: 'חילקתם את כל המטבעות',                                       /* TAMAR · T25 */
    m: 'חילקת את כל המטבעות',                                        /* TAMAR · T25 */
    f: 'חילקת את כל המטבעות',                                        /* TAMAR · T25 */
  },
  egOtherPh: {
    p: 'ומה עוד חשוב לכם?',                                          /* TAMAR · T25 */
    m: 'ומה עוד חשוב לך?',                                           /* TAMAR · T25 */
    f: 'ומה עוד חשוב לך?',                                           /* TAMAR · T25 */
  },
  egGo3: {
    p: 'לכרטיס שלכם ›',                                              /* TAMAR · T25 */
    m: 'לכרטיס שלך ›',                                               /* TAMAR · T25 */
    f: 'לכרטיס שלך ›',                                               /* TAMAR · T25 */
  },
  /* the picker's title. The second string in this block where m and f
     actually differ, and for the same reason: it is an imperative. */
  shTitle: {
    p: 'בחרו כרטיס לשיתוף',                                          /* TAMAR · T25 */
    m: 'בחר כרטיס לשיתוף',                                           /* TAMAR · T25 */
    f: 'בחרי כרטיס לשיתוף',                                          /* TAMAR · T25 */
  },
};
function t(key) {
  const c = COPY[key]; if (!c) return '';
  return (PROFILE.gender && c[PROFILE.gender]) || c.p;
}

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

/* THE GENERATOR THE SEED IS FOR, AND IT WAS MISSING. invPlan() called
   lcg() and nothing defined it, so every call threw ReferenceError —
   and because newRound() assigns `issue` on its first line but `S` forty
   lines later, the throw left `issue` pointing at a2 while S still held
   the PREVIOUS round. a2 could not be opened at all and the inverted
   round was unreachable in the build.

   IT HAS TO BE SEEDED, not Math.random(): the note above says so, ?invseed
   exists to vary it deliberately, and the contrast with the normal deal
   is the point — newRound() shuffles the cascade with Math.random() and
   this one is repeatable so a screenshot and a playtest are.

   THE CONSTANTS ARE THE ONES THE CALLER ALREADY DOCUMENTS. The note at
   the call site records lcg()'s first output as x*1664525 + 1013904223,
   which is the Numerical Recipes LCG over 2^32 returning a float in
   [0,1). Rebuilt from that, it reproduces the observation that note was
   written about: seeds 1, 7, 13, 42 and 99 return 0.236-0.274 on the
   first call and land on the SAME index in a 3- or 6-item pool, which is
   exactly the collision the scramble-and-burn below exists to defeat.
   Math.imul keeps the multiply in 32 bits instead of drifting through a
   double. */
const lcg = seed => {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
};

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

/* ===================== HAPTICS · §5, after O2 ======================
   iOS SAFARI DOES NOT IMPLEMENT THE VIBRATION API AT ALL. Confirmed
   against MDN's browser-compat-data: safari is version_added:false and
   safari_ios mirrors it. On an iPhone every call here is absent — not a
   silent failure to fix. Android only, and that has not changed.

   THREE EVENTS, AND NOW THE FILE MEANS IT. This comment used to say
   "three events, and only three" while ten call sites existed: every
   button press, the drag crossing, both stamps, the banner handoff, the
   finale flare, the 121st, the coin flight and a carousel step. An
   instrumented round measured FOURTEEN pulses on a five-card cascade —
   about 370 a session over 22 rounds. A tick on every tap is not
   feedback, it is a texture the player eventually escapes by turning
   vibration off at the OS, which costs them every other app on the
   phone. O2 is the subtraction. What is left is below, and the table IS
   the list.

   ── THE TABLE IS THE GUARD ─────────────────────────────────────────
   buzz() takes the NAME of an event, never a duration. A call that does
   not name one of these three does nothing, so the rule is enforced by
   identity rather than by a clock.
   THAT IS WHAT CLOSED THE BEAT-2 ESCAPE. The old guard was
   `if (S.beat === 2) return`, and the banner handoff defeated it by
   arithmetic: it is scheduled at tcTravelAt + tcTravel = 1120ms while
   beat3() starts at tcNextAt = 900ms, so the pulse landed 220ms after
   the counter ticked over, wore beat 3's number and fired. Measured, in
   the instrumented timeline, as `7037ms 18ms beat 3`. It was rewarding
   the player's own vote — the one input §1.4d says is never scored,
   never rewarded and never compared to a correct answer.
   The beat check is GONE rather than hardened. A guard that asks what
   time it is can always be beaten by something scheduled later; a guard
   that asks what the pulse IS cannot. There is no event named for beat 2
   in this table, so no call from beat 2 can fire — including one that
   arrives after the beat has advanced.

   CAN_BUZZ IS A PRESENCE CHECK AND NOTHING MAY BRANCH ON IT AS THOUGH IT
   MEANT MORE. `typeof navigator.vibrate === 'function'` is true on a
   MacBook with no vibration motor — measured. navigator.vibrate() also
   RETURNS true there, so the return value is no better: true means the
   call was accepted, never that the phone buzzed. Firefox Android is the
   proof by counter-example — vibration is disabled outright and it still
   returns true. There is no way to feature-detect a haptic, so nothing
   in this app may show, hide, promise or explain anything on the
   strength of it.

   IT RIDES THE SOUND SWITCH. See sndOn(): one control for both channels,
   because both are the same request — do not make my phone do things.
   ===================================================================== */
const CAN_BUZZ = typeof navigator !== 'undefined' &&
                 typeof navigator.vibrate === 'function';
/* every permitted haptic in the game. Adding a line here is the review
   point; there is deliberately no way to buzz without adding one. */
const BUZZ = Object.freeze({
  /* beat 1 · the verdict stamp hitting the claim card */
  claimStamp: 25,
  /* beat 4 · the verdict stamp hitting an MK card, cascade and inverted
     round alike — one event, two call sites, one number */
  mkStamp:    25,
  /* beat 5 · the player's vote landing on the finale board as the 121st.
     NOT a reward for the vote: the board is stating the count, and the
     121st seat is the title of the game enacted rather than described. */
  the121st:   18,
});
function buzz(event) {
  if (!CAN_BUZZ) return;
  /* THE GUARD: an unnamed event is not a haptic.
     hasOwnProperty.call rather than `in`, so BUZZ's inherited keys are
     not names — 'toString', 'constructor' and '__proto__' are all
     refused, verified. The typeof is not belt-and-braces either: a
     property lookup stringifies its key, so ['mkStamp'] would otherwise
     coerce to 'mkStamp' and fire. No call site passes an array, but a
     guard that can be walked past by coercion is not one. */
  if (typeof event !== 'string') return;
  if (!Object.prototype.hasOwnProperty.call(BUZZ, event)) return;
  /* O2 · the same switch that governs sound. Off by default, because
     that is where sound ships and this is the louder of the two. */
  if (!sndOn()) return;
  try { navigator.vibrate(BUZZ[event]); } catch (e) {}
}
/* one call site for every pressable thing. It carries the AUDIO UNLOCK
   and only that now — O2 took the 10ms press tick off it, which was 7 of
   the 14 pulses in a round on its own. The unlock has to stay here: iOS
   will not play anything until the gesture that creates the context, and
   this is the single place every pressable thing in the app passes. */
function pressable(node) { node.addEventListener('pointerdown', () => { unlockAudio(); }); return node; }

/* ===================== SOUND · THE FOLEY SET =========================
   FOLEY, NOT UI SOUNDS. Everything on screen is a physical object, so the
   library is paper, ink, card and wood. Ten files were cut for this in
   assets/sfx/; eight of them are used at runtime — stamp.wav is the
   assembled two-layer hero and its own layers stay on disk only so the
   composite can be rebuilt.

   IT CONFIRMS, IT NEVER INFORMS. Most players are muted, on a bus or in
   class, so no state change anywhere may depend on a sound being heard.
   Every call below is fire-and-forget: nothing is awaited, nothing is
   scheduled off a decode, and a missing buffer is silence rather than a
   wait. See sfx().

   OFF BY DEFAULT, and that is not timidity: sound-on by default on a
   phone is how a teenager kills the tab in a classroom.

   EVERY SOUND IS CAUSED BY SOMETHING THE PLAYER DID, at the moment they
   did it. That is the rule the set is built against and it is what keeps
   beat 2 and the coin silent — see the notes at those call sites.

   NOTHING IS FETCHED UNTIL SOUND IS TURNED ON. A player who never touches
   the toggle pays zero bytes, which is most of them. */
const SFX_DIR = 'assets/sfx/';
const SFX_SRC = {
  /* the hero. ONE file, not two scheduled layers: the 190ms offset and the
     8dB between knock and press are baked into it, so neither can drift
     from --t-stamp-drop or be re-levelled by accident. It is fired at the
     START of the fall, which is what puts the press on the contact frame. */
  stamp: 'stamp.wav',
  /* N2a · THE WRONG VERDICT'S STAMP. The SAME instrument landing badly,
     not a second instrument: one clean hit at centroid 5209 against the
     composite's 2997, which sits between its own two layers (press 2402,
     knock 5690). It does not descend, buzz or sag -- flatness 0.544, no
     pitched component to fall. The player never fails; the Knesset
     surprised them, and a sad sound would say otherwise.
     185ms OF SILENCE IS BAKED INTO THE FILE. Its hit is one event at 7ms
     where stamp.wav's press is at 192, so the file carries the offset and
     BOTH stamps are fired at the start of the fall by the same line. The
     alternative -- firing this one at contact instead -- is a scheduling
     divergence somebody maintains later, and the two stamps stop reading
     as one instrument the first time either number moves. */
  stampWrong: 'stamp_wrong.wav',
  /* three real takes, not one pitch-shifted three ways — 2106 / 3019 /
     3690 Hz, cut from separate card events. Cycled so no two consecutive
     cards in a cascade sound alike. */
  card1: 'card_1.wav', card2: 'card_2.wav', card3: 'card_3.wav',
  peel:  'tape_peel.wav',
  /* T55 · THE HOLE PUNCHED INTO THE PRESSED BUTTON, fired at the press.
     A DIFFERENT OBJECT from both things it sits between: r = 0.077
     against count_vote.wav and 0.165 against stamp.wav, where the set's
     own baseline for two unrelated recordings is stamp vs count_vote at
     0.063. The take with the fastest attack of the three was REJECTED on
     exactly this test at r = 0.233 — see sources.txt.
     LEVELLED TO count_vote, NOT TO THE STAMP. This is the player's own
     action and it fires on every card of the cascade; stamp.wav's -19.3
     would have made the press louder than the verdict it precedes. */
  punch: 'punch.wav',
  /* N2a · THE FINALE'S COIN, AND IT IS A DIFFERENT OBJECT RATHER THAN A
     BIGGER ONE. r = 0.12 against coin.wav: an unrelated recording, not
     the same coin louder. That distinction is the whole licence for it
     -- see award()'s `snd` argument for why nothing may reach it by
     reading the amount.
     LOUDNESS-MATCHED TO coin.wav, NOT RAISED. Both sit at RMS -30.30;
     what differs is the object, its 659ms against 180, and its six
     attacks against three. A summary payout is a handful, not a louder
     single coin. */
  coinFinale: 'finale_coin.wav',
  tick:  'count_tick.wav',
  land:  'count_land.wav',
  /* the player's own vote joining the count. A DIFFERENT RECORDING, not a
     third cut of the tally: count_tick and count_land come from one
     spin-board take and correlate at r=0.36, so a third instance of it
     would make the chamber and the player the same object. This is a
     poker chip set down — r=0.06 against the tick, which is the
     unrelated-recording floor. */
  vote:  'count_vote.wav',
  /* SOFT ATTACK ON PURPOSE: the coin spawns 340ms after the stamp starts
     and a hard transient on top of its tail would read as a collision.
     35ms from 10% to 90% of peak. */
  coin:  'coin.wav',
  deck:  'deck.wav',
  done:  'complete.wav'
};
let AC = null;                 /* the AudioContext, created on first gesture */
let SFX_BUF = {};              /* name -> AudioBuffer, as they decode        */
let SFX_FETCHED = false;       /* the fetch is fired once and only once      */
let SND_ON = false;            /* the save-backed preference. OFF by default */
/* the tick sample is 52ms; it may not retrigger faster than it lasts */
const SFX_TICK_MIN = 55;

/* ?sound=on / ?sound=off FORCE the preference WITHOUT writing it, on the
   same terms as ?intro, ?mapintro, ?beacon and ?prehow: a switch that
   exists to look at something must not spend the player's real state. */
/* O2 · TWO CHANNELS READ THIS, NOT ONE. sfx() asks it before playing and
   buzz() asks it before vibrating. The name stays `snd` — renaming a
   shipped save field to gain a synonym would cost every existing save
   for nothing — but what it means is now "make my phone do things", and
   the toggle's label says both out loud. */
function sndOn() {
  return DEV.sound !== null ? DEV.sound : SND_ON;
}

/* iOS WILL NOT PLAY ANYTHING UNTIL THE PLAYER TAPS, and the tap has to be
   the one that creates or resumes the context. pressable() is already the
   single call site for every pressable thing in the app — the comment
   above it says why — so the unlock rides there rather than being wired
   button by button and forgotten on one of them.
   IDEMPOTENT AND SILENT. It runs on every press for the life of the
   session and must cost nothing after the first. */
function unlockAudio() {
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!AC) AC = new Ctor();
    if (AC.state === 'suspended') AC.resume();
    /* THE FETCH HANGS HERE, NOT ONLY ON THE TOGGLE. A returning player
       whose save already says sound is on never passes through setSound(),
       so without this the context would open on their first press and the
       files would never be asked for. sfxLoad() is idempotent. */
    if (sndOn()) sfxLoad();
  } catch (e) { /* no audio on this device; the game is unchanged */ }
}

/* THE FETCH IS THE WHOLE PRELOAD, and it happens when sound is switched
   on rather than at boot. Eight files, ~149 KB, all in flight at once and
   each decoded as it lands, so a sound becomes available the moment its
   own file is ready instead of waiting for the slowest.
   A FILE THAT HAS NOT ARRIVED IS SILENCE. sfx() reads SFX_BUF and returns
   if the name is not in it yet; nothing retries, nothing queues, and no
   beat is held for a decode. On a slow connection the first stamp of the
   first round may be silent and the second will not, which is the correct
   failure for something that is garnish. */
function sfxLoad() {
  if (SFX_FETCHED || !AC) return;
  SFX_FETCHED = true;
  Object.keys(SFX_SRC).forEach(name => {
    fetch(SFX_DIR + SFX_SRC[name])
      .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(b => new Promise((ok, no) => {
        /* the callback form as well as the promise: older Safari resolves
           decodeAudioData only through the callback */
        const p = AC.decodeAudioData(b, ok, no);
        if (p && p.then) p.then(ok, no);
      }))
      .then(buf => { SFX_BUF[name] = buf; })
      .catch(() => { /* one file missing is one sound missing, not a bug */ });
  });
}

/* PLAY. Returns immediately, always. Every reason not to make a sound —
   preference off, no context, no buffer yet, a device that throws — lands
   in the same place, which is nothing happening.
   `at` is an offset in SECONDS from now, used only by the stamp's second
   layer... which it no longer needs, since the layers ship as one file.
   It stays because scheduling ahead is sample-accurate where setTimeout
   is not, and the next sound that needs it should not have to add it. */
function sfx(name, at) {
  if (!sndOn() || !AC) return;
  const buf = SFX_BUF[name];
  if (!buf) return;
  try {
    if (AC.state === 'suspended') AC.resume();
    const src = AC.createBufferSource();
    src.buffer = buf;
    src.connect(AC.destination);
    src.start(at ? AC.currentTime + at : 0);
  } catch (e) { /* never let a sound break a beat */ }
}

/* THE CARD DEAL CYCLES, and it cycles rather than randomises: three takes
   picked at random repeat immediately about a third of the time, which is
   the exact thing the three variants exist to prevent. A cursor guarantees
   no two consecutive cards are the same file. */
let SFX_CARD_I = 0;
function sfxCard() {
  const n = ['card1', 'card2', 'card3'][SFX_CARD_I % 3];
  SFX_CARD_I++;
  sfx(n);
}

/* THE 121ST VOTE IS TWO OBJECTS, FIRED TOGETHER. The player's chip lands
   INTO the chamber's thunk: count_vote is the chip being set down and
   count_land is the tally settling, and hearing them as one event is the
   point -- the moment gets the weight of the count's own landing without
   the player becoming the chamber.

   IT DOES NOT REPLACE count_vote WITH THE TALLY'S SOUND, and that is the
   whole care here. SFX_SRC's note on `vote` rules out "a third cut of the
   tally": count_tick and count_land come from one spin-board take and
   correlate at r=0.36, so painting the player with either would make the
   chamber and the player the same object. Layering keeps both recordings
   and both meanings -- the distinction survives, the moment gets heavier.

   WHY THIS WAS THE FIX AND NOT A LEVEL CHANGE. count_vote is not quiet:
   at RMS -27.19 it is ~4.5dB ABOVE count_tick and only 1.5dB under
   count_land. It was the FIFTH thing on a frame that also carries
   is-mine, is-up, is-plus1, paintBar() and buzz(), so nothing on that
   frame read as the moment. Weight, not volume.

   BOTH AT t=0, NO SCHEDULED OFFSET. Every other layered sound in this set
   bakes its offset into the file -- stamp.wav carries its own 190ms
   between knock and press, stamp_wrong.wav carries 185ms of leading
   silence -- precisely so no offset lives in a scheduling call that can
   drift. This adds none. Measured: the two transients do not coincide, so
   the sample-summed peak is -5.09 dBFS with 5.09dB of headroom, against a
   naive peak-on-peak worst case of +0.60 that would have clipped. */
function sfxVote() {
  sfx('vote');
  sfx('land');
}

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

/* EVERY AWARD PAYS ITS OWN DELTA, AND IT PAYS IT WHEN THE TOKEN LANDS.
   The old shape read `wallet` once at call time, kept the destination in
   `to`, and assigned `wallet = to` when the last token arrived — a
   read-modify-write straddling ~600ms of flight. Two awards overlapping
   in that window both computed `to` from the same starting balance and
   the second assignment silently erased the first: 25 coins gone, on the
   one counter the player is watching.
   It was not reachable while the only awards were a cascade's, ~9s
   apart. The end-game closes that gap — the finale pays into the same
   counter the allocation screen then spends from — so the race is fixed
   before the beats that would trigger it, not after.
   THE FIX IS TO NEVER HOLD A DESTINATION. `wallet` is read and written
   in the same synchronous step, at land time, so concurrent awards
   compose instead of clobbering: each adds only what it has just paid,
   and the running total is correct after any interleaving. */
/* N2a · THE SOUND IS AN ARGUMENT, AND IT IS THE CALL SITE THAT PASSES IT.
   `snd` names which coin this is. It defaults to the per-card 'coin', so
   every existing caller is unchanged, and the finale passes 'coinFinale'
   because the finale is a DIFFERENT EVENT -- a summary payout on a
   sticker, not a card resolving.
   NOTHING READS `n`. That is the rule and it is the reason this is a
   parameter rather than a threshold: a sound chosen by how many coins
   were won is an escalating reward, which is the Balatro register and is
   a recorded NEVER. The axis is WHICH MOMENT, never HOW MUCH. If a future
   change writes `if (n > ...)` anywhere near this line, that change is
   wrong. */
/* ---- THE DELTA LABEL ------------------------------------------------
   A "+N" that rises off the coin pill and fades. The counter itself ticks
   too fast to read as an amount -- it is a running total changing, not a
   payment -- so this is the only place the app ever states what a single
   award was worth.

   IT FIRES ON THE LANDING, NEVER ON THE AWARD. award() is called at the
   stamp's landing and the tokens are still ~530-610ms out at that point;
   a number that appears while the coins are mid-flight is announcing a
   payment that has not arrived. The two call sites below are the two
   moments coins actually finish: the LAST token's onLand, and the end of
   the count-up on the branch that has no tokens at all.

   ONE ELEMENT, REUSED -- it REPLACES, it does not stack. The cascade
   waits T.stampLand + T.flip = 740ms between cards and this label runs
   800ms, so a second award can land while the first label is still up.
   Stacking would need vertical offsets from a pill whose bottom is 2px
   off the HUD's own bottom edge, which puts the second label on the
   chyron and a third on the card; queueing would hold the number past the
   coins it belongs to, which is the one thing this must not do. The pill
   carries the running total and reconciles anything the eye misses.

   IT LIVES IN #coinfly, which is inset:0, z-index 60, pointer-events:none
   -- "over everything, out of every layout", which is why this cannot
   shift the pill or the HUD by construction. A pseudo-element on the pill
   would have ridden .hud-coins' own coin-land transform and bumped with
   it rather than floating free of it. */
let coinDeltaEl = null;
function coinDelta(n) {
  if (!n) return;
  const layer = $('#coinfly'), chip = $('.hud-coins');
  if (!layer || !chip) return;
  const box = layer.getBoundingClientRect(), p = chip.getBoundingClientRect();
  /* the pill has to be laid out to be measured; if it is not, there is
     nothing to centre on and the label is simply skipped */
  if (!p.width) return;
  if (!coinDeltaEl || !coinDeltaEl.isConnected) {
    coinDeltaEl = el('i', 'coin-delta');
    layer.appendChild(coinDeltaEl);
  }
  coinDeltaEl.innerHTML = '+' + N(n);
  coinDeltaEl.style.left = (p.left + p.width / 2 - box.left).toFixed(1) + 'px';
  coinDeltaEl.style.top  = (p.bottom - box.top + 4).toFixed(1) + 'px';
  /* restart: a live label is re-aimed and re-run rather than joined */
  coinDeltaEl.classList.remove('is-on'); void coinDeltaEl.offsetWidth;
  coinDeltaEl.classList.add('is-on');
}

/* `onDone` IS THE LANDING, AND IT IS THE SAME LANDING coinDelta USES.
   Both branches below already know the moment the coins are actually in:
   the last token's onLand, and the last frame of the count-up when there
   are no tokens. This hands that moment out rather than letting a caller
   guess it from a timer -- beat 5's sticker has to outlive its own coins,
   and the only honest way to know when they have arrived is to be told.
   It is optional and it is called exactly once; every existing caller
   passes nothing and is unaffected. */
function award(n, from, snd, onDone) {
  if (!n) return;
  /* SOUND · ONCE PER AWARD, AT SPAWN. award() is already called at
     T.stampLand — 360ms, the stamp's own landing — so this IS that mark,
     and it is the coins leaving rather than arriving: the flight takes
     another ~450ms and a sound at the far end of that is 790ms behind
     the verdict it belongs to.
     ABOVE THE coinFlight() BRANCH, so the degenerate case is covered:
     an award with no origin pays as a plain count-up with no tokens at
     all, and it still gets its one sound. */
  sfx(snd || 'coin');
  /* NO PILL LABEL ON THE FINALE. beat 5 prints its own "+N" on the coin
     sticker and holds it there, then flies the coins FROM that sticker --
     so a second +N at the pill restates a number still on screen, which
     reads as a double-count rather than as feedback. `snd` already names
     which moment this is, so the test is the moment and not the amount --
     see the NOTHING READS `n` rule above. */
  const isFinale = snd === 'coinFinale';
  const chip = $('.hud-coins'), out = $('#coinNum');
  if (S) S.coins += n;             /* the round's own tally; null on the map */

  /* WITHOUT AN ORIGIN IT IS STILL A COUNT-UP, not a flight. Awards that
     have no point on screen to leave from — the deferred claim payout at
     beat 5 — must not fake one. */
  const pts = from ? coinFlight(from, chip, coinCount(n)) : null;
  /* THE SAVE FOLLOWS THE VARIABLE, NOT THE ANIMATION. Both branches
     write it on the frame `wallet` actually changes, so an award that is
     still mid-flight when the tab closes is worth exactly what the
     counter had already paid in. See THE SAVE. */
  if (!pts) { const from0 = wallet; wallet += n; saveState();
              /* THE COUNT-UP IS THIS BRANCH'S LANDING. There are no tokens
                 to arrive, so the moment the coins are "in" is the moment
                 the number stops moving -- countCoins' own last frame. */
              countCoins(out, from0, wallet, T.coin,
                         () => { if (!isFinale) coinDelta(n); if (onDone) onDone(); });
              chip.classList.add('is-awarding');
              setTimeout(() => chip.classList.remove('is-awarding'), T.coin); return; }

  /* THE CHIP COUNTS UP AS THEY LAND, not before them and not after: each
     token carries its own share of the award and pays it in on arrival. */
  const share = n / pts.length;
  let paid = 0, landed = 0;
  pts.forEach(tok => {
    tok.onLand = () => {
      landed++;
      /* what this award owes by now, minus what it has already paid —
         so the number added to `wallet` is only ever this award's own */
      const due = (landed === pts.length) ? n : Math.round(share * landed);
      wallet += due - paid;
      paid = due;
      out.textContent = wallet;      /* the true running total, always */
      saveState();
      chip.classList.remove('is-landing'); void chip.offsetWidth;
      chip.classList.add('is-landing');    /* a small pop PER arrival */
      /* ONCE PER AWARD, NOT ONCE PER TOKEN. onLand runs 3-5 times -- the
         chip pops on every one of them, deliberately -- but the delta is
         the award's total and is stated when the award is fully paid. */
      if (landed === pts.length) {
        if (!isFinale) coinDelta(n);
        if (onDone) onDone();
      }
    };
  });
}

/* the plain count-up, for an award with no origin */
function countCoins(out, from, to, dur, done) {
  const t0 = performance.now();
  (function tick(now) {
    const k = Math.min(1, (now - t0) / dur);
    out.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
    else { out.textContent = to; if (done) done(); }
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

function pinVote(vote, q) {
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
    /* T26b · THE LABEL COMES OFF, THE MEANING DOES NOT. "הצבעת:" was 55px
       of a 180px pill saying what the avatar beside it already says — the
       token is the player's, so the vote is the player's, and the only
       thing the pill carries that is not already on screen is WHICH way.
       Dropping it takes the pill to ~125px and hands the difference to
       the question next to it, which is the whole of T26's fit problem.
       IT SURVIVES AS THE ACCESSIBLE NAME. The avatar is aria-hidden and a
       bare "בעד" in a landmark-less span would read as one word with no
       subject, so the sticker carries the full sentence as its label. The
       string is unchanged; only its rendering moved. */
    '<span class="bnr bnr--vote" role="img" aria-label="' +
        esc('הצבעת: ' + (VOTE_PIN[vote] || '')) + '">' +   /* TAMAR */
      '<span class="chyron-av as-d" aria-hidden="true">' + avatarSvg() + '</span>' +
      '<span class="chyron-line" aria-hidden="true">' +
        '<b>' + esc(VOTE_PIN[vote] || '') + '</b></span>' +
    '</span>' +
    /* T26 · THE QUESTION, IN THE WIDTH THE BAND WAS ALREADY RESERVING.
       .chyron is a 44px flex row that has held one ~140px pill since A7;
       this takes the remaining ~200px as a second flex item and clamps to
       two lines, so the band's height is what it always was. It is
       rendered only when a line is passed — repin() passes none, so every
       beat but the cascade is byte for byte what it was.
       NO GLOSSARY MARKING HERE. markGlossary() would put a tappable-
       looking marker on a line that is 13px, two-clamped and inside a
       pointer-events:none band; T23 already reported the claim card's
       version of that promise as a lie and this would be a second one. */
    (q ? '<span class="chyron-q">' + esc(q) + '</span>' : '');
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
       CSS px, so under the DPR-3 rule this wants a 1204px file, and T40 is
       where `hi` finally became one: the whole set is re-cropped from the
       1360x2048 masters to 1204x1605, so `dpr` is 3 for all 28 rather than
       the old 1.18-1.80x ceiling. The crop is anchored on the CROWN, not on
       the frame — every portrait puts the top of the head at 2.4% of its own
       height, which is what stops the head jumping card to card as the
       cascade deals. See manifest.json's `portrait_crop_rule`. */
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
            /* T50 · NO ARROW. The tape already says it lifts — the curl on
               its leading edge and the hard drop under it are the
               affordance, and they are the ones that survive being looked
               at rather than read. The glyph pointed UP, which is not the
               direction anything here moves: the sheet peels from the
               leading edge and leaves on an arc. aria-hidden, so nothing
               that spoke it loses anything either.
               THE HEBREW IS UNTOUCHED. The arrow was its own <span>
               sibling, never a character inside esc('מפלגה'). */
            '<b class="pcov__lab">' + esc('מפלגה') + '</b>' +
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
    /* the hint has been taken; it must not still be wiggling under the
       peel it just asked for */
    cov.classList.remove('is-nudging');
    /* SOUND · ON THE CLICK, AND ABOVE THE REDUCED-MOTION BRANCH. Under
       reduced motion the cover is removed outright and there is no
       .is-peeling and no .is-gone, so a sound hung on either stage would
       be silent for exactly the people who turned motion off. The peel is
       something the player did either way. */
    sfx('peel');
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
  /* SOUND · THE THWIP IS THE TURN, and it is fired before the await, not
     after: the sound belongs to the card starting to move, not to it
     having finished. The next card joining the deck underneath is the
     same physical event, so it gets no second sound. */
  sfxCard();
  await wait(T.cardFlip);
  /* ITEM 6 · THE TAPE'S AFFORDANCE NUDGE. The cover says מפלגה and is a
     button, but nothing on a still card says it can be taken off. Two
     small wiggles 400ms after the turn settles is the smallest thing
     that reads as "this moves" without reading as an error state.
     HERE, NOT AT DEAL. The class is added after the flip has been
     awaited, so the 400ms in the CSS is measured from the card being
     settled rather than from it starting to turn.
     ONCE PER CARD is structural, not a flag: every card is a fresh node
     and the class is added exactly once, on the frame it settles. */
  nudgeCover(d);
  return $('.mf-b', d);
}
/* prefers-reduced-motion SKIPS IT ENTIRELY — the class is never added, so
   there is no 1ms stub of it either. The global reduce rule only shortens
   animations, and an affordance hint that fires in 1ms is worse than one
   that does not fire: it is a flicker with no meaning. */
function nudgeCover(card) {
  if (!card) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cov = $('.pcov', card);
  if (cov && !cov.dataset.done) cov.classList.add('is-nudging');
}
/* the resolved card is swiped off the stack. The stamp rides with it —
   it is parented to .cardwrap, not to the card, so it has to be told. */
function leaveCard() {
  const cur = $('.deckcard.is-current'), st = $('.d2');
  /* d2-land holds transform:scale(1) with fill:both, which would win
     against a transition; the animation has finished landing by now.
     T23 · and clearing it is not enough on its own — unhold() forces the
     style pass that lets the transition start. The CARD needs no such
     treatment: .deckcard.is-current carries no animation, so its exit
     transitions from the class change and always did. */
  if (st) { unhold(st); st.classList.add('is-leaving'); }
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
/* T36 · AND IT HAS TO BE CLEARABLE. SEEN_KEY predates the save and is the
   one flag that lives outside it — clearSave() removes SAVE_KEY and only
   SAVE_KEY, so a wipe left this set and the next run skipped .b1intro.
   Two things were wrong with that: the reset sheet lists what it is about
   to destroy and this was not on the list while surviving anyway, which is
   exactly the honesty T35 spent a section buying; and a playtest could not
   reach a genuine first run without opening devtools.
   IT IS NOT CALLED BY clearSave(). See wipeAll() below — discardSave()
   also calls clearSave(), and a corrupt save is a recovery, not a reset:
   it must not spend or refund anybody's first run. Same fails-open
   contract as the other two accessors. */
function clearIntroSeen() {
  try { localStorage.removeItem(SEEN_KEY); } catch (e) { /* fails open */ }
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
   THREE LINES, AND THE VIEWPORT DOES NOT COME INTO IT. This said "Two
   lines at 393px, three at 360px" and that was wrong before Tamar's
   revision as well as after: .b1intro__box is a fixed 200px, so the
   measure never varies with the viewport and the count is the same at
   390, 375 and 360. The old body ran TWO lines at all three; this one
   runs three, because the forced <br> after the first comma leaves
   "נחשו אם המשפט הבא נכון או לא נכון," too long for 200px and it wraps.
   THE BOX GROWS 25.5px AND SPLITS IT, so the button moves down 12.7 and
   the heading up 12.7 -- symmetric, because the box is centred. */
/* §1 · THE OLD FRAMING WAS FACTUALLY WRONG and Tamar caught it. It said
   "נציג לכם טענה על הכנסת" — a claim ABOUT THE KNESSET — and the claims
   are not that. r1's is a demographic statistic about haredi conscription
   rates; e4's compares Israeli prices to the OECD. They are claims about
   Israeli society and politics, and the Knesset is where the response to
   them gets voted on. The replacement drops the false object entirely
   rather than swapping one noun for another. */
/* T15 · THE TITLE DROPS ITS FIRST LINE AND THE EM DASH. "טענה —" is gone
   and the heading is the question alone, which is also the string the
   claim sticker carries — so the two agree again, as the note below
   .b1intro__t always said they should. The body is Tamar's rewrite: it
   asks about "המשפט הבא" rather than "הטענה", and it puts the reveal on
   the player ("תגלו") rather than on the game ("נגלה").
   THE CTA IS UNTOUCHED. She did not change it. */
const INTRO_B1 = {
  title: 'אמת או שקר?',                                          /* TAMAR · T15 */
  body:  'נחשו אם המשפט הבא נכון או לא נכון, אח"כ תגלו את התשובה',   /* TAMAR */
  cta:   'הבנתי',                                                 /* TAMAR */
};

function firstRunIntro(done) {
  if (seenIntro()) return done();
  markIntroSeen();

  const o = el('div', 'b1intro');
  o.innerHTML =
    '<div class="b1intro__box" role="dialog" aria-modal="true">' +
      /* BUILD-IB · 1 · THE TITLE IS THE BAND. Same string, same job, set
         on the surface's one kraft object instead of as a 34px line in
         cream. h2 is kept so the heading is still a heading: the band is
         a treatment, not a demotion. */
      '<div class="bandslot">' +
        '<h2 class="band b1intro__t">' + esc(INTRO_B1.title) + '</h2></div>' +
      /* esc(), not ph(): this is a written sentence pending Tamar's
         approval, not a description of one that has not been written. */
      /* T17 · THE BREAK IS PUT IN AT RENDER, AFTER THE COMMA.
         Tamar's sentence has one, and it is where the sense divides:
         "נחשו אם המשפט הבא נכון," / "אחר כך תגלו את התשובה". Left to the
         measure the line broke wherever it ran out of room, which was
         mid-clause.
         A <br> INSERTED HERE, NOT A NEWLINE IN THE STRING. The string
         stays a plain sentence in INTRO_B1 for Tamar to rewrite at will;
         nothing in it encodes layout. And it degrades the right way: the
         replace only fires when a comma is present, so a comma-less
         rewrite falls straight through to normal wrapping rather than to
         one unbreakable line — which is what a nowrap span would have
         given. Escaped FIRST, then the tag is added, so the string can
         never inject markup. */
      '<p class="b1intro__b">' +
        esc(INTRO_B1.body).replace(/,\s*/, ',<br>') + '</p>' +
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
/* BUILD-IB · 9 · IS THE MK ASK STILL DUE? Same shape as qbarDemo()'s
   gate and preReveal()'s: a DEV override that never writes, a save flag
   that is spent once, and reduced motion skipping the whole thing.
   REDUCED MOTION SKIPS IT because the sticker IS its slap -- .ask-st
   arrives on a --t-ask-delay timer and lands with a transform, and a
   slap flattened to 1ms is a sticker that appears from nowhere over the
   card. The instruction is not lost: the round's own controls say the
   same thing, which is the argument for scheduling it at all.
   IT SPENDS THE FLAG WHEN IT ANSWERS YES, not when the sticker settles:
   the player has been shown the instruction the moment it is on screen,
   and tying the spend to an animation that may be interrupted would
   re-instruct anyone who left mid-cascade. */
function askMkDue() {
  if (DEV.askMk !== null) return DEV.askMk;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (ASK_MK_SEEN) return false;
  ASK_MK_SEEN = true; saveState();
  return true;
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
    return '<div class="b1art b1art--topic"><img src="' + ROOT + (T_['576'] || T_['512'] || T_['384'] || T_['128']) +
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
    '<p class="b1claim">' + markGlossary(issue.tf || '') + '</p>' +
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
    /* O2 · THE CROSSING NO LONGER BUZZES. It was defensible -- the moment
       a gesture becomes a decision -- but it duplicates the claim stamp
       ~600ms later and only one of the two can be the moment. The stamp
       is the one the game asserts; this is the player still moving. The
       `crossed` latch stays: it is what keeps the state once-per-drag. */
    const over = Math.abs(dx) > TH;
    if (over !== crossed) { crossed = over; }
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

  /* THE PUNCH LANDS HERE, ON THIS FRAME — reused, read-only, from the MK
     cascade (see gxMark()/verdict()): same 38px .gx-punch, same sfx, no
     transition. One call site covers both tap and swipe-release, since
     both commit through here.
     A SWIPED CARD IS STILL MID-DRAG at this instant — card.style.transform
     holds the gesture's translateX/rotate, and the snap-back to square
     runs a few lines down. Reading the button's rect while that transform
     is live would place the mark at its DRAGGED position, and the
     snap-back would then visibly pull the card out from under a mark that
     cannot move. So the transform is cleared, the rect read, and the
     transform restored, all synchronously (no repaint happens mid-script) —
     the mark lands where the button is about to settle, not where the
     drag currently has it. For a tap this is a no-op: the transform is
     already empty. */
  const punchBtn = card.querySelector('[data-ans="' + ans + '"]') || card;
  const savedT = card.style.transform;
  card.style.transform = '';
  const pr = punchBtn.getBoundingClientRect();
  card.style.transform = savedT;
  card._punch = gxMark(pr.x + pr.width / 2, punchBtn);
  sfx('punch');

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
  /* ITEM 2 · THE LIFT IS PLAYED, NOT SNAPPED, and it is a FLIP because the
     move is a REFLOW: .is-revealing hides the two answer buttons and frees
     the claim's flex, so the claim's box lands 163.6px higher on the very
     next frame (measured, s1 at 390x844: 576.6 -> 413.0). There is no
     from-value for CSS to interpolate against, so the positions are read
     before the class, re-read after it, and the difference is applied as
     an inverse transform that is then released — layout is final the whole
     time and only the paint moves.
     TRANSFORM, NOT LAYOUT, which is what keeps the measuring routines
     honest: sizeStage() reads offsetHeight and f5Place()/fitBeat() read
     scrollHeight, none of which a transform touches. The one reader that
     WOULD see it is claimReveal()'s panel cap, which measures
     .b1claim's bounding rect — and that runs after --t-claim-beat (400ms),
     140ms after this settles, so it never reads mid-transition.
     The art is included for completeness and in practice does not move
     (224.5 -> 224.5): only the claim does. */
  /* T18 · THE LIFT USED TO RUN HERE AND NO LONGER DOES. It is called from
     claimReveal(), after the verdict has landed — see claimLift() and the
     order note there. What is left on this path is the beat, unchanged. */

  /* §1.1 step 2 · the beat. The answer is registered and NOTHING moves:
     no stamp yet, no panel, no exit. --t-claim-beat is ~400ms. */
  await wait(T.claimBeat);
  await claimReveal(ans, card);
  beat2();
}

/* =====================================================================
   T18 · THE CARD'S REARRANGEMENT, LIFTED OUT SO IT CAN BE SEQUENCED.
   Same FLIP it always was, moved into a function of its own and nothing
   else. ITEM 2's note still applies word for word: .is-revealing hides
   the two answer buttons and frees the claim's flex, so the claim's box
   lands 163.6px higher on the very next frame and there is no from-value
   for CSS to interpolate against. The positions are read before the
   class, re-read after it, and the difference is applied as an inverse
   transform that is then released — layout is final the whole time and
   only the paint moves.
   IT RESOLVES WHEN IT HAS LANDED. The caller needs to know, because the
   panel's max-height is measured off .b1claim's rect and that read must
   happen after this settles rather than during it. Returning the wait is
   what makes that a fact rather than a comment. */
function claimLift(card) {
  const flip = ['.b1art', '.b1claim']
    .map(sel => $(sel, card))
    .filter(Boolean)
    .map(n => ({ n, y: n.getBoundingClientRect().top }));
  /* THE PUNCH GOES DOWN IN THE SAME BREATH AS THE BUTTONS. .is-revealing
     (next line) is what hides .b1ans via CSS — but the punch is not a
     child of .b1ans, it is parented to .cardwrap (see commitClaim()), so
     hiding the buttons does nothing to it on its own. Left alone it would
     hang there, on nothing, for the rest of the reveal until the הלאה
     cleanup finally takes it down. */
  if (card._punch) { card._punch.remove(); card._punch = null; }
  card.classList.add('is-revealing');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  const moved = flip.filter(f => {
    f.dy = f.y - f.n.getBoundingClientRect().top;
    return Math.abs(f.dy) > 0.5;
  });
  if (!moved.length) return Promise.resolve();
  moved.forEach(f => {
    f.n.style.transition = 'none';
    f.n.style.transform  = 'translateY(' + f.dy.toFixed(1) + 'px)';
  });
  void card.offsetHeight;                    /* commit the inverse */
  moved.forEach(f => {
    f.n.style.transition = 'transform ' + T.claimLift + 'ms ' + CLAIM_LIFT_EASE;
    f.n.style.transform  = '';
  });
  /* the inline styles come off once it has landed, so nothing on this
     card carries a stale transition into the exit throw */
  setTimeout(() => moved.forEach(f => {
    f.n.style.transition = ''; f.n.style.transform = '';
  }), T.claimLift + 40);
  return wait(T.claimLift);
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
/* ITEM 2 · the lift's own duration and curve. Named here rather than
   inlined so the JS-driven move is as findable as the CSS ones. */
const CLAIM_LIFT_EASE = 'cubic-bezier(.2,.8,.2,1)';

/* ITEM 3 · both marks carry the exclamation, and that part has not moved.
   T6c · THE PILL GOES SINGULAR, AND IT NOW SAYS WHAT THE DISC SAYS.
   LION'S DECISION, 09 SEP, TAKEN OVER A STOP I RAISED — recorded that way
   on purpose. The locked list named the MK disc as the ONLY surface
   allowed "טעית", so this was flagged rather than applied; Lion widened
   the exception to TWO SURFACES. It is his call, not a reading of the
   old rule, and not something a later editor may extend a third time.

   WAS: 'צדקתם!' / 'הופתעתם!' — plural, and "surprised" where the disc
   said "wrong". Two voices four seconds apart in one round.

   THE PLURAL WAS NOT AN ACCIDENT, WHICH IS WHY THIS NEEDS SAYING OUT
   LOUD: t() treats the PLURAL as the gender-neutral voice, not as a
   fallback — PROFILE.gender === null resolves to the `p` slot, and that
   is the state of every player who skips or un-picks the voice step.
   Some two dozen second-person strings speak אתם there.
   >>> THAT RULE IS UNCHANGED AND APP-WIDE. Lion confirmed it on 09 Sep.
   >>> THIS PILL IS A DELIBERATE EXCEPTION TO IT, NOT DRIFT AWAY FROM IT,
   >>> AND NOT A PRECEDENT. If you are reading this while making some
   >>> other string singular: don't. Nothing here licenses that.

   WHAT THE SINGULAR COSTS TAMAR: nothing. צדקת and טעית are spelled
   identically in the masculine and feminine second-person past —
   צָדַקְתָּ/צָדַקְתְּ and טָעִיתָ/טָעִית differ only in pointing, which
   this build does not set — so neither adds a slot to the gendered set.
   It also RETIRES a debt: 'צדקתם'/'הופתעתם' are masculine plural, the
   feminine plural צדקתן/הופתעתן had no slot anywhere, and that address
   was therefore wrong-gendered rather than merely unwritten. */
const CLAIM_MARK = {                      /* TAMAR */
  ok:  'צדקת!',                           /* TAMAR · T6c, 09 Sep */
  bad: 'טעית!',                           /* TAMAR · T6c, 09 Sep */
};

/* ITEM 50 · THE PILL'S RESTING ANGLE, READ FROM THE SHEET SO THERE IS ONE
   SOURCE FOR IT. The sheet needs it at five keyframes and at rest; the
   throw on הלאה needs to ADD the exit rotation to it rather than replace
   it. Two literals would drift the first time the tilt is retuned, and
   the failure would be silent — the pill would simply snap level as it
   left. ms() parses the leading float, which is all a deg needs. */
const CM_REST = ms('--cm-rest');          /* -6deg · v25 P5 used -1.6 */

async function claimReveal(ans, card) {
  const truth = issue.tf_answer === 'true' ? 'אמת'
              : issue.tf_answer === 'false' ? 'שקר' : 'חלקית';
  const ok = issue.tf_answer === 'partial' || ans === issue.tf_answer;
  S.claimCorrect = ok;
  if (window.HAC) HAC('beat1_answer', { issue_id: issue.id, correct: ok, answer: ans, time_ms: HAC.beatMs() });

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
  /* SOUND · FIRED AT THE START OF THE FALL, not at contact. stamp.wav is
     the assembled two-layer file: the knock is at 0 and the press is 190ms
     in, which is --t-stamp-drop, so playing it here puts the press on the
     contact frame and inside inkBleed()'s 60ms rupture. Firing it beside
     the buzz below would put the whole thing 190ms late. */
  sfx(ok ? 'stamp' : 'stampWrong');                             /* N2a */
  /* ITEM 7 DELIBERATELY DOES NOT REACH HERE. The claim stamp keeps its
     190ms fall and its 1.8/1.06 landing; only the MK card's stamp was
     asked to land harder. Its contact stays --t-stamp-drop. */
  inkBleed();
  setTimeout(() => buzz('claimStamp'), T.stampDrop);

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
     §4c · AND IT LEAVES THE BAND BEHIND. .is-mark stripped the chyron's
     band so the chip was not sitting in 250px of empty grey.

     ITEM 50 · THE PILL COMES OFF THE CHYRON AND ONTO THE STAMP. v25's P5:
     banner-style across the disc's LOWER EDGE, 4px higher than the board.
     Two consequences worth writing down, because both are easy to undo by
     accident:
       · IT IS PARENTED TO .cardwrap, NOT TO THE CARD, for the same two
         reasons the stamp is — .mf-b clips, and the card is a 3D flipper
         that would mirror anything inside it. The pill overhangs the
         card's start edge and must be allowed to.
       · IT THEREFORE HAS TO LEAVE WITH THE CARD. Under the chyron it was
         removed on הלאה; on .cardwrap it would be left hanging in mid-air
         while the card and the stamp fly out. See the exit below.
     THE CHYRON SLOT IS UNAFFECTED. The reserved 44px box is .chyron-slot,
     a separate element that stays in .sc-round's FLOW on every beat;
     .chyron is the absolutely-positioned banner that was placed over it.
     So the pill vacating the banner collapses nothing and shifts nothing
     below it — .chyron simply stays .is-empty through the reveal, exactly
     as it is on beat 1 before the answer, until beat 2 pins the vote. */
  const chip = el('div', 'bnr cmark ' + (ok ? 'cmark--ok' : 'cmark--sur'),
    '<span class="cmark__av as-d" aria-hidden="true">' + avatarSvg() + '</span>' +
    '<span>' + esc(ok ? CLAIM_MARK.ok : CLAIM_MARK.bad) + '</span>');
  wrap.appendChild(chip);

  const table = COIN_TABLES[DEV.coins];
  /* T53 · T.stamp -> T.stampLand. ITEM 47B moved the PILL to the 360ms
     landing and left the award on 340, so the claim's coins left 20ms
     before the disc settled — the same drift, the same event. */
  if (table.claimNeedsCorrect && ok) setTimeout(() => award(table.claim, mark), T.stampLand);

  /* §0 · THREE MOVEMENTS, IN ORDER, AND NOTHING ELSE MOVES.
       1  the stamp falls and lands            0 -> 340ms  (--t-stamp)
       2  the correctness mark appears       +120ms gap, 260ms (--t-flip)
       3  the explanation sheet rises        +160ms gap, 260ms
     The two gaps are what make it read as three events rather than one
     compound arrival; they are deliberately unequal so the sequence has a
     shape. The mark is held back until the stamp has settled because a
     coloured chip moving during the fall competes with it — that is what
     made this beat read as five things happening at once. */
  /* ITEM 47B · TWO BEATS. The stamp lands alone over --t-stamp-land, is
     HELD for --t-mark-gap with nothing else moving, and only then does the
     verdict arrive. The wait was T.stamp (340ms) against a landing that is
     now 360, which would have started the pill 20ms before the stamp had
     finished settling — the one thing this sequence must not do.
     REDUCED MOTION SKIPS THE STAGGER, not just the motion: both are in
     their final state on the same tick, because a 500ms wait with the
     animation stripped out is a blank pause, not an accessible version. */
  const reducedSeq = matchMedia('(prefers-reduced-motion: reduce)').matches;
  await wait(reducedSeq ? 0 : T.stampLand);
  await wait(reducedSeq ? 0 : T.markGap);
  requestAnimationFrame(() => chip.classList.add('is-in'));

  /* =================================================================
     T18 · THE ORDER, AND WHY IT IS THIS ONE.
     It used to be: the card rearranged, then the stamp fell onto the
     rearranged card, then the panel. The card moved before the player
     had been shown anything, so the movement ANTICIPATED the verdict
     instead of reacting to it — the one thing a reveal must not do.

     Now the stamp lands on the card AS IT STANDS. Everything above this
     point is untouched: --t-stamp-land's fall, ITEM 47B's --t-mark-gap
     held beat, and the pill arriving on the stamp after it. That whole
     run is one statement — the verdict — and item 50's pill is part of
     it, not a separate event to sequence around.

     THEN NOTHING MOVES FOR --t-claim-hold, AND THAT IS THE POINT. The
     jolt is the cue: d2-jolt-claim runs 120ms from --t-stamp-drop-mk and
     is finished at 320ms, well inside the 360ms landing, so by the time
     the pill has settled the card has been still for a while. The hold
     is what separates the verdict from the card's reaction to it. Under
     it the two motions read as one gesture and the cause-and-effect this
     reorder exists for is lost.

     THE PANEL COMES AFTER THE RISE, NOT WITH IT. With it and the card is
     doing two things at once again, which is what was wrong before.
     Before it is not available: the panel takes the room the rise
     creates. After, separated by --t-panel-gap, which is the token that
     already named this exact gap.
     ================================================================= */
  await wait(reducedSeq ? 0 : T.cmarkLand);
  await wait(reducedSeq ? 0 : T.claimHold);
  await claimLift(card);
  await wait(reducedSeq ? 0 : T.panelGap);

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
    /* T21 · .scrolls IS THE FIX AND .edgefade IS THE REST OF IT. This
       block's own comment above has said "IT SCROLLS, and that is a
       requirement rather than a nicety" since it was written, and it
       never opted into the policy that makes scrolling possible: the
       global touchmove handler cancels outside .scrolls, so on e1 at
       360x640 the panel showed 76px of a 219px explanation, drew the
       fade that says there is more, and refused the finger. Third
       instance of the same omission after the map's grid and the
       allocation list. */
    '<div class="creveal__scroll scrolls edgefade"><p class="creveal__text">' +
      markGlossary(issue.tf_explain || '') + '</p></div>' +
    '<button type="button" class="p-c creveal__go">' +
      esc('לשלב הבא') + ' <i aria-hidden="true">›</i></button>';   /* TAMAR · T14 */
  wrap.appendChild(panel);
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

  /* ---- 4b · A CUT BLOCK HAS TO LOOK CUT ON PURPOSE -----------------
     The scroller above is the cap doing its job: on six of the twenty-two
     issues tf_explain is longer than the room under the claim, and the
     four longest lose 58, 41, 23 and 13px of a line at 390x844 — more at
     360x640. It has always scrolled. What it has never done is SAY so:
     macOS and iOS both draw an overlay scrollbar, which is invisible at
     rest and takes no width, so what the player sees is a paragraph
     sliced horizontally through the middle of a line of Hebrew. That is
     indistinguishable from a rendering fault, and the reflex it produces
     is to tap הלאה rather than to drag.
     .has-more masks the scroller's bottom edge, and .is-atend takes the
     mask off again once there is nothing left below — a fade that stays
     up at the end of the text says there is more when there is not.

     ESTABLISHED BEFORE THE BEAT, NOT DURING IT. maxHeight above is the
     last thing on this panel that changes layout, so the scroller's
     geometry is final on this line — synchronously, before the rAF that
     starts .is-in. The reveal then animates opacity and transform only,
     and neither the scroll container nor the mask is touched while it
     runs. The state is re-read on scroll and on nothing else. */
  const scEl = $('.creveal__scroll', panel);
  edgeFade(scEl);
  scEl.addEventListener('scroll', () => edgeFade(scEl), { passive: true });

  requestAnimationFrame(() => panel.classList.add('is-in'));

  /* ---- 5 · הלאה SENDS THE CARD AWAY -------------------------------
     The throw the answer used to trigger happens here instead, and it
     carries the stamp and the panel with it — they are the card's, not
     the screen's. Direction is the drag's own: dirFor() so a player who
     swiped right sees it leave right. */
  await new Promise(res => {
    pressable(go).addEventListener('click', async () => {
      /* T22 · THE THROW IS THE DECK'S OWN, AND IT GOES LEFT.
         It used to take dirFor(S.claim), so the card left in whichever
         direction the player had swiped — which made the handover a
         different motion on an אמת round than on a שקר one, and made the
         card that is being retired behave like a card still in play.
         The values here are .deckcard.is-leaving's, read off that rule
         rather than invented: -420px, 8px of drop and -13deg. Every MK
         card in the cascade leaves on exactly these, so the claim card
         now leaves the way every other card in the game leaves. */
      const dir = -1;
      panel.classList.remove('is-in');
      /* .mf-b.is-stamped runs d2-jolt with fill:both, which HOLDS
         transform:translateY(0) forever — and a held animation beats an
         inline style, so the card would not move. Clear it first. */
      card.classList.remove('is-stamped');
      /* T23 · unhold(), not `style.animation = 'none'`. The jolt fills
         the transform and would otherwise suppress the transition that
         is added on the very next line. See unhold(). */
      unhold(card);
      card.classList.add('is-leaving');
      card.style.transform = CARD_EXIT_T;
      card.style.opacity = .2;              /* the deck's own exit value */
      unhold(mark);                       /* T23 · d2-land-mk, fill:both */
      /* T24 · the transform and the fade are .d2.is-leaving's now, and
         both stamps take them from there. See the note beside that rule. */
      mark.classList.add('is-leaving');
      /* ITEM 50 · THE PILL RIDES OUT WITH THEM. It is on .cardwrap now, so
         nothing else takes it off screen.
         THE RESTING ANGLE IS CARRIED INTO THE EXIT ROTATION rather than
         replaced by it: the stamp rests at 0deg and can simply be given
         dir*25, but the pill rests at CM_REST and setting a bare rotate()
         would snap it level on the first frame of the throw.
         translate:-50% -50% IS A SEPARATE PROPERTY from transform — that
         is why the pill is centred with `translate` in the sheet — so the
         throw can own transform outright without losing the centring. */
      unhold(chip);                       /* T23 · cmark-land, fill:both */
      chip.classList.add('is-leaving');
      chip.style.transform = 'translate(' + (dir * 420) + 'px,8px) rotate(' +
                             (dir * 13 + CM_REST) + 'deg)';
      chip.style.opacity = .2;
      await wait(T.cardExit);
      /* the punch is on .cardwrap, same as the cascade's hole — it does
         not ride the card's own exit and has to be taken off explicitly
         or it is left floating over every card that follows. */
      if (card._punch) card._punch.remove();
      card.remove(); mark.remove(); panel.remove(); chip.remove();
      /* T22 · THE BACK OF THE NEXT CARD IS SHOWN, ON PURPOSE. It was
         already visible for the frame between the throw finishing and
         beat 2 covering it, and the brief is right that this is correct
         rather than a glitch: it is the deck, and seeing the deck is what
         says another card is coming. It was simply too short to read.
         --t-deck-peek holds it with nothing else moving, which is the
         same device --t-mark-gap is on the verdict: a gap that exists so
         one thing can be seen before the next arrives. */
      await wait(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : T.deckPeek);
      res();
    }, { once:true });
  });
}

/* =====================================================================
   v30c · THE RESET CONFIRM. The only irreversible action in the game.

   IT IS .exitsheet's CONSTRUCTION, NOT A SECOND MODAL SHAPE. Paper on a
   dark scrim, white die-cut, keyline, hard offset, laid down at a tilt.
   The build has one modal shape and this does not add another; it adds a
   perforation to the one that exists.

   THE ESCALATION IS MATERIAL, NOT CHROMATIC, and that is forced rather
   than chosen: lime and magenta code correctness only and cannot be
   spent on danger. A perforation is native to a die-cut sticker system
   and means exactly one thing — this comes apart. Nothing else in the
   build has one, so it cannot be read as anything else.

   THE COST IS IN FIGURES. The chips say how much is lost rather than
   calling it "progress"; the exit confirm already sets that precedent
   for a round, and this is the same idea at the scale of a run. A player
   agreeing to a quantity is making a different decision from one
   agreeing to a word.

   THE SAFE OPTION IS THE PRIMARY. Yellow, 56px, full extrusion, first in
   reading order, above the tear. The destructive one is 46px, outlined,
   flush, below it — and the ✕ is a third way out, in the corner the
   build already puts it. Two ways out, one way through. */
function resetConfirm() {
  const sh = el('div', 'exitsheet rs');
  const coins = wallet;
  const topics = TOPICS().filter(t => topicDone(t.id)).length;
  const issues = Object.keys(PROGRESS).filter(k => PROGRESS[k] === true).length;
  sh.innerHTML =
    '<div class="exitsheet__box rs__box" role="dialog" aria-modal="true">' +
      '<button type="button" class="exitsheet__x" aria-label="סגירה">✕</button>' +
      '<p class="rs__q">' + esc(PROF_COPY.rsQ) + '</p>' +                /* TAMAR */
      '<p class="rs__note">' + esc(PROF_COPY.rsNote) + '</p>' +          /* TAMAR */
      '<div class="rs__cost">' +
        '<span class="rs__c">' + N(topics) + ' ' + esc(PROF_COPY.rsTop) + '</span>' +
        '<span class="rs__c">' + N(issues) + ' ' + esc(PROF_COPY.rsIss) + '</span>' +
        /* THE ONLY ONE THAT CAN REACH FOUR DIGITS, so it is the only one
           that takes the separator. shNum is the share card's own helper
           — the other place a wallet total is printed at size — rather
           than a second way of writing a number; it is declared further
           down the file and this runs long after that. */
        '<span class="rs__c">' + N(shNum(coins)) + ' ' + esc(PROF_COPY.rsCoin) + '</span>' +
        '<span class="rs__c">' + esc(PROF_COPY.rsCard) + '</span>' +
      '</div>' +
      '<button type="button" class="p-c rs__safe" data-keep>' +
        esc(PROF_COPY.rsKeep) + '</button>' +                            /* TAMAR */
      /* the perforation, ruled across the sheet with a ✂ break */
      '<div class="rs__tear" aria-hidden="true"></div>' +
      '<button type="button" class="rs__go" data-wipe>' +
        esc(PROF_COPY.rsGo) + '</button>' +                              /* TAMAR */
    '</div>';
  let gone = false;
  const close = () => {
    if (gone) return; gone = true;
    removeEventListener('keydown', onKey);
    sh.classList.remove('is-in'); sh.classList.add('is-out');
    setTimeout(() => sh.remove(), T.ovIn);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  pressable($('.exitsheet__x', sh)).addEventListener('click', close);
  pressable($('[data-keep]', sh)).addEventListener('click', close);
  sh.addEventListener('click', e => { if (e.target === sh) close(); });
  pressable($('[data-wipe]', sh)).addEventListener('click', () => {
    /* the same wipe ?reset performs, so there is one definition of what
       a clean slate is and this cannot drift from it. T36 · that
       definition is wipeAll(), not clearSave(): the sheet above promises
       the card and the run are gone, and .b1intro's seen-flag lives
       outside the save object. */
    wipeAll();
    location.href = location.pathname;
  });
  $('#stage').appendChild(sh);
  requestAnimationFrame(() => sh.classList.add('is-in'));
  return sh;
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
/* the nested sticker's back control. Icon only on screen — this is its
   accessible name, and it is the word the app already uses for the
   builder's way back rather than a second synonym for the same move. */
const BACK_LABEL = 'חזרה';                 /* TAMAR · the nested modal's back control */

/* T34 · THE BOX'S CONTENTS, AS A FUNCTION, SO THEY CAN BE RE-RENDERED.
   This was inline in stickerModal() and could therefore only ever be
   built once. A glossary term tapped inside the disclosure has to replace
   what is in the box rather than open a second box on top of it, and
   replacing means building the same markup again from a different options
   object. Nothing about the markup changed in the move — only `nested`
   is new, and it is false everywhere the old code ran.

   THE BACK CONTROL IS THE ONE THING `nested` ADDS. It is rendered ONLY
   when there is somewhere to go back to, which is why it is a parameter
   and not a field on `o`: a caller cannot get it wrong, because a caller
   never passes it. */
/* T59 · THE MODAL HEROES, AS LITERAL PATHS AND DELIBERATELY SO. The chair
   and the building come from M.props.*, which make_manifest.py generates
   and which is not ours to add to — the same reason .i-logo's path is
   written out at the intro. If the manifest ever carries these, each entry
   becomes M.props.hero_law['384'] and nothing else here changes.
   384 IS THE ONLY SIZE WIRED, because the band is 96px tall and every one
   of these clears 3x against it: gloss 384/96 = 4.00, howto 4.00, law
   4.00, and sources — the one landscape file, whose longest edge is its
   width — 302/96 = 3.15. The 256 and 128 ship alongside for whatever wants
   them later; nothing reads them today. */
const HERO = {
  law:     'assets/heroes/hero_law_384.webp',
  gloss:   'assets/heroes/hero_gloss_384.webp',
  sources: 'assets/heroes/hero_sources_384.webp',
  howto:   'assets/heroes/hero_howto_384.webp',
};

function stickerFill(o, nested) {
  o = o || {};
  /* ITEM 9 · THE RESERVED HERO. 96px at the top of every sticker, held
     whether or not there is art to put in it, so the modal has one
     silhouette instead of a tall one and a short one. It REPLACES the old
     .stmodal__art slot rather than sitting above it — two graphics
     stacked at the top of a 312px box is not a hero, it is a pile.
     RESOLUTION ORDER: caller art, else the "?" fallback. `hero:false`
     opts out entirely, which is what the two profile modals do: 2b and
     the invitation carry their own 156px round token on a dashed well,
     and a second hero above it would be the same pile by another route.
     The "?" is HTML — a span with a background and rings — not SVG text,
     so it takes the sticker construction the rest of the app uses and
     scales with the box rather than with a viewBox. */
  const hero = o.hero === false ? '' :
    '<div class="sthero"' +
      (o.heroKey ? ' data-hero="' + esc(o.heroKey) + '"' : '') + '>' +
      (o.art
        ? '<img class="sthero__art" src="' + o.art + '" alt="">'
        : '<span class="sthero__q" aria-hidden="true">?</span>') +
    '</div>';
  return '' +
      '<button type="button" class="stmodal__x" aria-label="סגירה">✕</button>' +
      /* TOP-LEFT, WHICH IN THIS RTL DOCUMENT IS THE PHYSICAL LEFT — the
         opposite corner from the ✕, so the two controls can never be
         mistaken for each other. The chevron is DRAWN and it is CHEV_R:
         › and ‹ are bidi-mirrored glyphs and would render the wrong way
         round, and CHEV_R is already what this app's other back control
         uses (the builder's הקודם), so back points one way everywhere. */
      (nested
        ? '<button type="button" class="stmodal__back" aria-label="' +
            esc(BACK_LABEL) + '">' + CHEV_R + '</button>'
        : '') +
      hero +
      '<h2 class="stmodal__title">' + esc(o.title || '') + '</h2>' +
      /* T7 · the label is a child of the meta line, not a line of its own:
         a separate <p> would take the box's gap and read as a third block
         between the title and the body. */
      /* T59 · THE DATE IS ITS OWN ELEMENT so it can carry the pill. It was
         a bare text node beside the label, which is also why it sat right:
         the <p> is a fit-content flex item, the LABEL set its width, and
         the shorter date then aligned start inside it. The string itself is
         untouched — this wraps it, it does not rewrite it. */
      (o.meta ? '<p class="stmodal__meta">' +
        (o.metaLabel ? '<span class="stmodal__metalab">' + esc(o.metaLabel) + '</span>' : '') +
        '<span class="stmodal__date">' + esc(o.meta) + '</span></p>' : '') +
      /* T12 · bodyHtml IS THE SAME SLOT WITH THE ESCAPING ALREADY DONE.
         The explanation moved in here carries glossary <span class="gt">
         markers from markGlossary(), and esc() would print the tags. It
         is a SECOND field rather than a flag on the first so that no
         existing caller can reach the unescaped path by accident: every
         one of them passes `body` and is still escaped exactly as
         before. Callers that pass bodyHtml own their own escaping —
         markGlossary() esc()s the text before it marks it. */
      (o.bodyHtml ? '<p class="stmodal__body">' + o.bodyHtml + '</p>'
                  : o.body ? '<p class="stmodal__body">' + esc(o.body) + '</p>' : '') +
      /* the ONE field this component grew, so beat 5's disclosure could
         reuse it instead of getting a second modal shape of its own. It
         is markup rather than text — chips and links, escaped by their
         own builder. Callers that pass nothing are unaffected. */
      (o.extra || '');
}

/* T34 · ONE MODAL SURFACE, AND THE DEPTH IS CAPPED AT ONE.
   stickerPush() replaces what is in an OPEN sticker and remembers what
   was there; m._pop() puts it back. It is deliberately not a stack: the
   guard below refuses a second push, and the only content that can be
   pushed — a glossary definition — is rendered through `body`, which is
   escaped, so it carries no .gt markers and offers no second door. Belt
   and braces, because the two failures look identical on screen.

   THE BOX'S HEIGHT MOVES THROUGH stickerSwap() (P2). Content swapping
   inside a box that jumps height reads as a bug, and there is exactly one
   mechanism for that in this file. */
function stickerPush(m, o) {
  const box = m && $('.stmodal__box', m);
  if (!box || m._depth) return;
  const prev = box.innerHTML;
  /* T59 · the flag has to move with the content. A glossary term pushed
     into the law sticker is still a glossary term, and without this it
     would take the law modal's title size on the way in. */
  stickerSwap(m, () => {
    box.innerHTML = stickerFill(o, true);
    box.classList.toggle('is-titlelg', !!o.titleLg);
  });
  m._depth = 1;
  m._pop = () => {
    stickerSwap(m, () => { box.innerHTML = prev; });
    m._depth = 0; m._pop = null;
    m._wire();
  };
  m._wire();
}

function stickerModal(o) {
  o = o || {};
  const m = el('div', 'stmodal');
  /* T59 · titleLg IS NAMED FOR WHAT IT CONTROLS. It replaces
     :has(.sthero__q), which meant "this sticker has no graphic" and was
     being used as a proxy for "this title can afford to be bigger". The
     two are not the same thing, and putting art into the glossary and
     sources stickers would have shrunk their titles 20 -> 17px with
     nothing in either change to connect them. */
  m.innerHTML = '<div class="stmodal__box' + (o.titleLg ? ' is-titlelg' : '') +
    '" role="dialog" aria-modal="true">' +
    stickerFill(o, false) + '</div>';
  let gone = false;
  /* ITEM 43 · ONE HOOK, FIRED ON EVERY WAY OUT. The ✕, the ground and
     Escape all funnel through close(), so a caller that needs to know the
     sticker has gone gets told once whichever route the player took —
     rather than wiring three listeners and hoping they stay in step with
     this function. Optional; every existing caller passes nothing. */
  const close = () => {
    if (gone) return; gone = true;
    removeEventListener('keydown', onKey);
    m.classList.remove('is-in'); m.classList.add('is-out');
    setTimeout(() => m.remove(), T.ovCollapse);
    if (typeof o.onClose === 'function') o.onClose();
  };
  /* and the same function by hand, for a caller whose own button dismisses
     the sticker. `_close` rather than `close` to match the `_swipe` the
     claim card already hangs on its node. */
  m._close = close;
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  /* T34 · RE-WIRED AFTER EVERY CONTENT SWAP. Replacing the box's innerHTML
     destroys the ✕ and its listener with it, so the wiring is a function
     the swap can call again rather than a line that runs once. ✕ closes
     the WHOLE modal from any depth — it is bound to close(), which knows
     nothing about depth — and the back control, which exists only while
     nested, calls m._pop(). Tap-outside is on `m` itself and survives
     untouched, so it too closes from any depth. */
  m._wire = () => {
    pressable($('.stmodal__x', m)).addEventListener('click', close);
    const bk = $('.stmodal__back', m);
    if (bk) pressable(bk).addEventListener('click', () => { if (m._pop) m._pop(); });
  };
  m._wire();
  m.addEventListener('click', e => { if (e.target === m) close(); });
  $('#stage').appendChild(m);
  requestAnimationFrame(() => m.classList.add('is-in'));
  return m;
}

/* the law. Title is bill_title, body is bill_summary, graphic is THIS
   ISSUE'S topic icon from the manifest rather than a literal path — the
   icons moved to assets/topics/ when they were framed and the hard-coded
   assets/mk/ path 404'd.
   ITEM 45 · IT USED TO READ M.topics.internal_sec, FULL STOP. Not a
   fallback and not a default — the key was hard-coded, so all 22 issues
   opened the bill detail under the police hat whatever their topic was.
   Fixed to the same lookup every other topic-icon site in this file
   already uses, `M.topics[issue.topic]`, so the modal draws the icon the
   map and the HUD are drawing for the same issue. */
/* T5b · THE OUTCOME SENTENCE COMES OFF THE BILL SUMMARY BEFORE IT IS SHOWN.
   bill_summary is a CONTEXT field with an OUTCOME sentence welded onto the
   end of it on some issues — s1 finishes "עבר 61 מול 55." and its own
   _tally is {for:61, against:55}, the exact pair the finale board counts up
   to. The modal opens at beat 2. Left whole, the field hands the player the
   answer two beats before the cascade asks for it, which is the locked
   "crowd data never appears between the player's own vote and the reveal".
   The split is here rather than in data.js because the field is Tamar's to
   write and Roman's to serve; this is the one place it is read.

   THE BOUNDARY IS A SENTENCE, NOT A SUBSTRING. Cutting at the first digit
   would have taken e1's "המע\"מ ל-18%", a1's "90 ח\"כים" and v1's climate
   targets — all context, all load-bearing. The unit removed is the final
   SENTENCE, and only when that sentence carries a vote count.

   WHAT COUNTS AS A VOTE COUNT. The data writes "מול", not "בעד/נגד" —
   "עבר 61 מול 55", "עברה בקריאה טרומית 55 מול 10". Both forms are matched
   anyway, because vote_result (beat 5's own field) writes the other one,
   "27 חברי כנסת בעד, 42 נגד", and the CMS has no rule keeping the two
   fields in separate dialects. Verified over every issue in data.js: the
   pattern fires on 14 of the 16 vote_result strings — the two it skips
   have no numbers in them at all — and on exactly 2 of the 16
   bill_summary fields, s1 and s2, in both cases on the last sentence.

   WHEN IT CANNOT CUT CLEANLY IT DOES NOT CUT. If the count sits anywhere
   but the final sentence, the summary is returned whole rather than
   guessed at, and the issue is a content report. No issue is in that state
   today; the branch exists so that a future one is visible instead of
   silently mangled. */
const TALLY_SENT =
  /\d{1,3}\s*(?:קולות\s*)?(?:בעד\s+)?מול\s+\d{1,3}|\d{1,3}[^.!?\d]{0,20}בעד[^.!?]{0,24}?\d{1,3}\s*נגד/;

/* sentence split without a lookbehind — Safari only grew those in 16.4 and
   this file has no build step to lower them. Runs of terminators (e2's
   summary ends "..") stay with the sentence they close. */
function sentencesOf(t) {
  const out = [];
  let start = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '.' || t[i] === '!' || t[i] === '?') {
      while (i + 1 < t.length && '.!?'.indexOf(t[i + 1]) > -1) i++;
      out.push(t.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < t.length) out.push(t.slice(start));
  return out;
}

function billContext(raw) {
  const txt = String(raw || '').trim();
  if (!txt) return '';
  const s = sentencesOf(txt);
  const hit = [];
  for (let i = 0; i < s.length; i++) if (TALLY_SENT.test(s[i])) hit.push(i);
  if (!hit.length) return txt;                                  /* nothing to take off */
  if (hit.length > 1 || hit[0] !== s.length - 1) return txt;     /* mid-text: report, do not guess */
  /* a summary that is ONLY its outcome sentence renders with no body
     rather than with the tally — the modal still carries title, date and
     art, and the locked rule outranks a full-looking panel. */
  return s.slice(0, -1).join('').trim();
}

const LAW_DATE_LABEL = 'תאריך ההצבעה:';                                /* TAMAR · T7 */
function lawModal() {
  /* ITEM 46 · THE 576, CHOSEN ON CACHING RATHER THAN ON SIZE. The 256 was
     picked against a 65px target, where 65 x DPR 3 = 195; item 45's band
     changed that target, and at 96 tall the wide icons were being served
     at 1.74-2.53x — under 2x on the police hat.
     THE 384 WOULD HAVE BEEN A THIRD COPY OF A PICTURE ALREADY IN CACHE.
     claimArt() loads T_['576'] for the issue's topic at beat 1, and 20 of
     the 22 issues have no issue art of their own, so that fallback fires
     and the 576 is already fetched one beat before the player can open
     this modal. Asking for the 384 here would download a second size of
     the same illustration — the map node has already taken the 256 — to
     get a WORSE result than the file sitting in cache.
     So: 0 marginal bytes on 20 of 22 issues, and every topic clears 3x
     (3.92x on the widest, 6.00x on the narrowest) rather than the 384's
     2.61x floor. The two that do pay are s1 and s2, which have issue art
     at beat 1 and therefore never warm it; they share the internal_sec
     topic, so the second of them is cached by the first.
     384 then 256 stay underneath as fallbacks, so a topic missing the
     576 still draws rather than rendering an empty hero. */
  const T_ = M.topics && M.topics[issue.topic];
  /* T41 · 512 SITS IN THE CHAIN because the replacement topic art tops
     out there. Without it a re-arted topic falls past 384 to 128 and
     draws a 128px file at 190 CSS px -- the exact defect the note above
     says was the worst-served surface in the audit. Topics that still
     have a 576 are unaffected: it is first in the chain. */
  const h = T_ && (T_['576'] || T_['512'] || T_['384'] || T_['256']);
  return stickerModal({
    title: issue.bill_title || '',
    meta:  issue.bill_date || '',
    metaLabel: LAW_DATE_LABEL,                                         /* TAMAR · T7 */
    bodyHtml: markGlossary(billContext(issue.bill_summary)),              /* T5b */
    /* T59 · THE LAW HERO REPLACES THE TOPIC ICON HERE. This modal is about
       a bill, not about the topic, and the topic icon is already on the map
       node the player came through — drawing it again named the wrong
       thing twice. The 576/512/384/256 lookup above is kept because the
       note it carries is about how topic art is served everywhere else,
       and `h` is still what the ? fallback is measured against. */
    art:   ROOT + HERO.law,
    /* ITEM 9 · the hook a per-issue graphic drops into later. It is on the
       hero, not on the modal, so whatever fills it does not have to know
       anything about the dialog around it. */
    heroKey: 'issue',
  });
}

/* §3.1 the glossary term, on the SAME sticker. It replaces the plain
   white .gdef panel that used to open inline under the term — a second
   light surface with its own radius and its own padding, sitting inside
   a paragraph and pushing the explanation around as it opened and shut.
   The definition is data.js's own; nothing is written here. */
/* T34 · ONE DEFINITION OF WHAT A GLOSSARY STICKER IS, read by both the
   standalone opener and the in-place swap, so the two can never drift
   into being two different surfaces wearing the same name. `body` and
   not `bodyHtml`: the definition is escaped, carries no .gt markers, and
   therefore offers no second door out — which is what caps the depth at
   one in the markup as well as in stickerPush()'s guard. */
function glossOpts(term) {
  return { title: term, body: (DATA.glossary || {})[term] || '',
           art: ROOT + HERO.gloss, heroKey: 'gloss',
           /* T59 · the term alone on the line, and it keeps the 20px it has
              had since ITEM 9 — see .is-titlelg. */
           titleLg: true };
}
function glossModal(term) {
  return stickerModal(glossOpts(term));
}

/* =====================================================================
   ONE DELEGATED LISTENER FOR EVERY GLOSSARY TERM, ANYWHERE.
   It replaces three hand-attached handlers — the beat-1 claim card, the
   beat-3 reveal panel and moreModal — and it exists because those three
   were never the whole set. markGlossary() is called at SIX sites and
   .gt styling is global, so lawModal()'s bill_summary and both
   tachles_prompt calls in .b2q rendered underlined terms that nothing
   listened for: decorated, never openable. FIVE terms were dead that way
   — קואליציה, טעמי דת, בית משפט העליון, מעצר מנהלי and יועמ"ש — while
   בג"ץ opened from `tf` and did nothing from `bill_summary`, same
   codepoints, same data-gt, different surface.
   קריאה טרומית IS NOT ONE OF THEM AND THIS CANNOT REACH IT. Its only
   occurrence is s2's final sentence, "עברה בקריאה טרומית 55 מול 10.",
   which billContext() strips before the bill sheet is drawn (T5b) so the
   outcome is not handed to the player two beats early. The term is never
   rendered anywhere, so there is nothing to tap; it is a content gap,
   and the fix for it is to use the phrase somewhere reachable.

   THE REAL DEFECT WAS STRUCTURAL: decoration and wiring were separate
   passes with nothing connecting them, so a new caller of markGlossary()
   got the underline for free and the behaviour never. This closes that —
   a surface added after today is wired the moment it renders a .gt, and
   there is no second place to remember.

   #stage IS THE HOST, and it covers everything: stickerModal() appends
   its box to $('#stage'), and all four screens plus every .ov overlay
   are inside it (index.html). The only two nodes appended to body
   instead are #coinfly and the share-download anchor, neither of which
   renders text. Nothing between a .gt and #stage listens for click —
   all 63 click listeners in this file are on specific controls — so
   nothing is intercepted on the way up, and the beat-1 handler's old
   e.stopPropagation() protected nothing and is not reproduced. The
   card's own gesture wiring is pointerdown/move/up only: a tap on a term
   ends below the 110px threshold and snaps back unscored, exactly as it
   did before.

   PUSH INSIDE A STICKER, OPEN STANDALONE OUTSIDE ONE. This is the T34
   rule, applied where T34 could not reach. Calling glossModal() from
   inside lawModal() would drop a SECOND .stmodal on the stage — two
   boxes, two scrims, and a ✕ that closes only the top one — which is the
   exact defect T34 removed from moreModal, reintroduced on the surface
   this change exists to fix. closest('.stmodal') is the whole test.
   .b2q is an .ovpane and not a sticker, so a term there opens standalone:
   there is nothing to push into.

   DEPTH STAYS CAPPED AT ONE and this does not lift the cap. stickerPush
   refuses a second push, and glossOpts() renders the definition through
   `body` — escaped by stickerFill — so a glossary sticker carries no .gt
   markers and offers no further door. Verified empirically, not taken on
   the comment's word: a pushed definition contains zero .gt.

   ONE LISTENER, INSTALLED ONCE, NEVER REMOVED. #stage outlives every
   screen, so there is nothing to tear down and no way to double-bind. */
function wireGlossary() {
  $('#stage').addEventListener('click', e => {
    const t = e.target.closest('.gt');
    if (!t || !t.dataset.gt) return;
    const m = t.closest('.stmodal');
    if (m) stickerPush(m, glossOpts(t.dataset.gt));
    else   glossModal(t.dataset.gt);
  });
}

/* ===== §B · 2b THE CHARACTER, 2a THE STICKER SHEET ==================
   Both on stickerModal(), both through `extra`, no title of their own:
   the sticker is the surface and the character is the content, and the
   game has one modal shape, not two. The HUD's avatar opens 2b on the
   map and the end. Two doors out of 2b — the board's shipped
   בחרו את הדמות שלכם to 2a, and the written התאימו את הדמות to Part D,
   which is not built and says so rather than pretending. 2a swaps the
   SAME modal's content in place and comes back the same way, so there is
   one sticker on screen throughout, never one on top of another.
   EVERYTHING APPLIES ON TAP. No save button: setProfile() writes the
   save and repaints the HUD behind the modal, so the player sees the
   change land in the corner the moment they lift their thumb.
   The name field sits between the hero and the voice chips. */
/* the sheet glyph on the hero's chip: four stickers on a sheet, which is
   what the door opens. Stroked, so it takes the chip's ink. */
const SHEET_GLYPH =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/>' +
  '<rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>';

const PROF_COPY = {
  voice: 'איך לפנות אליכם?',            /* TAMAR */
  nameLbl:'איך לקרוא לכם?',             /* TAMAR · the board's (אופציונלי) dropped: nothing on this card is required, so saying it once is noise */
  namePh: 'השם שלכם',                   /* shipped · board 2b */
  f:     'לשון נקבה',                   /* shipped · board 2b */
  m:     'לשון זכר',                    /* shipped · board 2b */
  swap:  'בחרו את הדמות שלכם',          /* shipped · board 2a title, 2b door */
  sub:   'בחרו דמות שתלווה אתכם במפה',  /* shipped · board 2a */
  build: 'עצבו דמות משלכם',              /* TAMAR · T3. 2b's second door and the builder's title while no build exists. NOT התאימו את הדמות — the presets cannot be adjusted; this builds from nothing */
  edit:  'ערכו את הדמות שלכם',          /* TAMAR · the same door and title once a build exists: now there IS something to edit */
  of:    'מתוך',                        /* shipped · the board's progress, "2 מתוך 5" */
  prev:  'הקודם',                       /* TAMAR · the builder's back chevron */
  next:  'הבא',                         /* TAMAR · the builder's forward chevron */
  back:  'חזרה',                        /* TAMAR · prev on the first axis: back to 2b */
  finish:'סיימתי',                      /* TAMAR · next on the last axis: back to 2b, nothing to save */
  shuffle:'ערבבו',                      /* TAMAR · one tap, one random character */
  any:   'לא משנה',                     /* TAMAR · the builder's voice step: picks one of the two bodies arbitrarily and moves on */
  hud:   'הדמות שלכם',                  /* TAMAR · the HUD sticker's label */
  save:  'שמור',                        /* TAMAR · 2b's one primary; it closes, everything is already kept */
  skip:  'לא משנה',                     /* TAMAR · the invitation's dismiss */
  change:'החליפו',                      /* TAMAR · the invitation's second line */
  /* v30c · RESET LIVES HERE AND NOWHERE ELSE. Not on the map: replaying
     one topic is a node tap, the map is where the picker's back control
     lands the player, and a destructive control there is permanent
     furniture one mis-tap from erasure. This sheet already opens from the
     HUD avatar, is present on the map, and already holds who the player
     is; the run's totals and the way to erase them belong with it. */
  reset:  'להתחיל מחדש',                /* TAMAR · the quiet door in 2b */
  rsQ:    'להתחיל את המשחק מחדש?',       /* TAMAR · the confirm's question */
  rsNote: 'כל מה שצברתם יימחק ולא ניתן יהיה לשחזר אותו.',  /* TAMAR */
  rsKeep: 'להשאיר הכל',                 /* TAMAR · the safe option, first */
  rsGo:   'כן, למחוק ולהתחיל מחדש',      /* TAMAR · the destructive one */
  rsCard: 'הכרטיס שלכם',                /* TAMAR · the fourth cost chip */
  rsTop:  'נושאים',                     /* TAMAR · cost chip unit */
  rsIss:  'סוגיות',                     /* TAMAR · cost chip unit */
  rsCoin: 'מטבעות',                     /* TAMAR · cost chip unit */
};

/* =====================================================================
   THE INFO SURFACE · 2d. A FOURTH CONTENT FOR THE PROFILE STICKER.
   Photo credits, methodology and the NGO's about-text, reached from a
   quiet link at the foot of 2b and returned from by the same חזרה the
   builder's first axis uses.

   IT IS NOT A SHEET. The prototype has no bottom-sheet idiom — every
   dismissible surface in it is the centred die-cut sticker — and the
   one real bottom sheet in this repo (.explain-sheet, styles/issue.css)
   belongs to the SHIPPED app. Porting that shape here would have been a
   second sheet idiom, not reuse. It is the THIRD thing .prof swaps to
   — 2a, 2c and this — through the same stickerSwap() the other two use.

   EVERY STRING BELOW IS A PLACEHOLDER. The chrome is Tamar's to write.
   The CREDITS ARE NOT COPY and carry no TAMAR mark: a photographer's
   name, a licence identifier and a URL are legal text, and normalising
   any of the three would be a defect rather than an edit. */
const INFO_COPY = {
  door:    'קרדיטים ומידע',        /* TAMAR · PLACEHOLDER · the quiet link at the foot of 2b */
  title:   'קרדיטים ומידע',        /* TAMAR · PLACEHOLDER · 2d's own title */
  credits: 'קרדיטים לתמונות',      /* TAMAR · PLACEHOLDER · section 1 */
  method:  'איך בנינו את המשחק',   /* TAMAR · PLACEHOLDER · section 2 */
  about:   'מי אנחנו',             /* TAMAR · PLACEHOLDER · section 3 */
  source:  'מקור',                 /* TAMAR · PLACEHOLDER · the label on a credit's source link */
  /* the two prose sections are structure today: one placeholder line
     each, so the shape is visible and the length is not pretended at */
  methodBody: 'כאן ייכתב הסבר על אופן איסוף הנתונים ובחירת הסוגיות.',   /* TAMAR · PLACEHOLDER */
  aboutBody:  'כאן ייכתב הטקסט על העמותה.',                             /* TAMAR · PLACEHOLDER */
};

/* THE PHOTO CREDITS, KEYED BY THE ART INDEX'S OWN ID.
   34 ROWS, NOT 29. The roster in data.js deals 28 of these people; the
   manifest holds art for 34, and all 34 .webp sets are served out of
   assets/mk/. A CC BY obligation attaches to what is DISTRIBUTED, not
   to what a player happens to be dealt, so the list is the art index.
   Six of these are people the game no longer deals — edelstein, galant,
   gantz, lahav, michaeli, silman — and one person it DOES deal, taha,
   has no art at all and is correctly absent: there is no photograph to
   credit. See the manifest's `fallback` block for what he draws instead.

   NAME AND PARTY ARE NOT HERE. They are read from M.politicians at
   render time, so this object cannot drift from the art index on the
   two fields the index already owns. The Hebrew name in each trailing
   comment is a TRANSCRIPTION of M.politicians[key].name as it stood on
   14 Sep 2026, kept only so the object can be filled in without holding
   the manifest open beside it. It is an editing aid and nothing reads
   it; the manifest is the truth on screen.

   FOUR FIELDS, ALL EMPTY TODAY. author is the photographer, source the
   page the file came from, licence the identifier as the licence states
   it ("CC BY-SA 3.0", not a translation of it), licenceUrl the deed. A
   row renders whatever of the four it has and nothing for what it does
   not, so a half-filled row is visibly half-filled rather than wrong. */
const MK_CREDITS = {
  abbas:         { author:'', source:'', licence:'', licenceUrl:'' },   /* מנסור עבאס */
  ben_ari_m:     { author:'', source:'', licence:'', licenceUrl:'' },   /* מירב בן-ארי */
  ben_gvir:      { author:'', source:'', licence:'', licenceUrl:'' },   /* איתמר בן-גביר */
  cohen_m:       { author:'', source:'', licence:'', licenceUrl:'' },   /* מירב כהן */
  deri:          { author:'', source:'', licence:'', licenceUrl:'' },   /* אריה דרעי */
  edelstein:     { author:'', source:'', licence:'', licenceUrl:'' },   /* יולי אדלשטיין */
  eisenkot:      { author:'', source:'', licence:'', licenceUrl:'' },   /* גדי איזנקוט */
  elharrar:      { author:'', source:'', licence:'', licenceUrl:'' },   /* קארין אלהרר */
  elkin:         { author:'', source:'', licence:'', licenceUrl:'' },   /* זאב אלקין */
  gafni:         { author:'', source:'', licence:'', licenceUrl:'' },   /* משה גפני */
  galant:        { author:'', source:'', licence:'', licenceUrl:'' },   /* יואב גלנט */
  gantz:         { author:'', source:'', licence:'', licenceUrl:'' },   /* בני גנץ */
  goldknopf:     { author:'', source:'', licence:'', licenceUrl:'' },   /* יצחק גולדקנופ */
  gotliv:        { author:'', source:'', licence:'', licenceUrl:'' },   /* טלי גוטליב */
  kariv:         { author:'', source:'', licence:'', licenceUrl:'' },   /* גלעד קריב */
  katz:          { author:'', source:'', licence:'', licenceUrl:'' },   /* ישראל כץ */
  lahav:         { author:'', source:'', licence:'', licenceUrl:'' },   /* יוראי להב-הרצנו */
  lapid:         { author:'', source:'', licence:'', licenceUrl:'' },   /* יאיר לפיד */
  lazimi:        { author:'', source:'', licence:'', licenceUrl:'' },   /* נעמה לזימי */
  levin:         { author:'', source:'', licence:'', licenceUrl:'' },   /* יריב לוין */
  liberman:      { author:'', source:'', licence:'', licenceUrl:'' },   /* אביגדור ליברמן */
  michaeli:      { author:'', source:'', licence:'', licenceUrl:'' },   /* מרב מיכאלי */
  netanyahu:     { author:'', source:'', licence:'', licenceUrl:'' },   /* בנימין נתניהו */
  odeh:          { author:'', source:'', licence:'', licenceUrl:'' },   /* איימן עודה */
  ohanah:        { author:'', source:'', licence:'', licenceUrl:'' },   /* אמיר אוחנה */
  saar:          { author:'', source:'', licence:'', licenceUrl:'' },   /* גדעון סער */
  seglovitch:    { author:'', source:'', licence:'', licenceUrl:'' },   /* יואב סגלוביץ */
  silman:        { author:'', source:'', licence:'', licenceUrl:'' },   /* עידית סילמן */
  smotrich:      { author:'', source:'', licence:'', licenceUrl:'' },   /* בצלאל סמוטריץ' */
  son_harmelech: { author:'', source:'', licence:'', licenceUrl:'' },   /* לימור סון הר-מלך */
  strook:        { author:'', source:'', licence:'', licenceUrl:'' },   /* אורית סטרוק */
  sukot:         { author:'', source:'', licence:'', licenceUrl:'' },   /* צבי סוכות */
  tamno:         { author:'', source:'', licence:'', licenceUrl:'' },   /* פנינה תמנו-שטה */
  troper:        { author:'', source:'', licence:'', licenceUrl:'' },   /* חילי טרופר */
};

/* ===== P2 · ONE HEIGHT TRANSITION FOR EVERY STICKER CONTENT SWAP =======
   stickerSwap(m, paint) — the ONLY way a .stmodal should change what is
   inside it. Not a profile helper: it takes the modal and a function that
   rewrites the content, and it eases .stmodal__box between the height it
   had and the height that function produces. 2b/2a/2c go through it, the
   invitation's החליפו goes through it, and T34's glossary swap inside
   moreModal() goes through it too — that is what the name is for. Write a
   second one and the two will drift.

   WHY MEASURED PIXELS AND NOT grid-template-rows:0fr->1fr. That technique
   expands a track from NOTHING. None of these moves start at nothing —
   524->376, 183->557 — so expressing one with it means collapsing the old
   content to zero and growing the new from zero: two animations, double
   the time, and a frame in the middle where the sticker has no body. It
   also needs the box converted from flex to grid, which costs
   .bsheet{flex:1 1 auto} — and that flex is the only reason builder axes
   5, 6 and 7 hold at one height across 3, 5 and 6 options. The technique
   would introduce height changes while trying to smooth them.

   ONE DURATION FOR EVERY MOVE, --t-swap, not scaled by distance. See the
   token. The four early returns below are each a real failure that was
   measured, not defensive noise; the comments say which. */
function stickerSwap(m, paint) {
  if (typeof paint !== 'function') return;
  const box = m && $('.stmodal__box', m);
  if (!box) { paint(); return; }

  /* REDUCED MOTION IS AN INSTANT SWAP — TODAY'S BEHAVIOUR, KEPT.
     The global reduce rule flattens transition-duration to 1ms, which is
     NOT the same thing: a 1ms transition still starts, still lands on a
     later frame and still fires transitionend, so the box would hold an
     inline height across a frame boundary for no visible gain. Taking the
     paint-only path means no class, no inline height and no event at all.
     Read live, not cached: the OS setting can change under a session. */
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paint(); return;
  }

  /* THE KEYBOARD OWNS THE HEIGHT WHILE IT IS UP. .kb-open caps the box at
     calc(var(--kb-vis) - 2*var(--sp-4)); an inline height would fight a
     max-height that --kb-h is still moving. The name field is in 2b and
     every door out of 2b is reachable with it focused, so this is
     reachable, not theoretical. */
  if (document.documentElement.classList.contains('kb-open')) { paint(); return; }

  /* AN IN-FLIGHT MOVE HANDS OVER ITS CURRENT HEIGHT, NOT ITS TARGET.
     offsetHeight during a transition is the interpolated value, so
     reading it first and only then tearing the old move down means a
     swap that interrupts another one continues from where the box
     actually is. Snapping to the old target first would read as a stutter
     at exactly the moment the player is moving fastest. */
  const from = box.offsetHeight;
  const live = box._hswap;
  if (live) live.stop();

  box.style.height = '';
  paint();
  const to = box.offsetHeight;

  /* OLD === NEW: WRITE NOTHING, FIRE NOTHING, CLEAR NOTHING.
     Builder axes 5, 6 and 7 are all one height — .bsheet absorbs the
     option count — so this branch is reached by a player simply stepping
     through the builder. Setting an equal height fires no transition, so
     transitionend never arrives, so the inline height is never cleared,
     so the NEXT swap measures a pinned box and does not move. The bug
     surfaces one interaction after the one that caused it. */
  if (to === from) { box.classList.remove('is-hswap'); return; }

  box.style.height = from + 'px';
  box.classList.add('is-hswap');
  void box.offsetHeight;                 /* flush, so `to` is a real change */
  box.style.height = to + 'px';

  const rec = {};
  const onEnd = e => {
    /* the box's own height and nothing else: this listener sits on an
       element whose descendants animate transform and translate, and both
       bubble */
    if (e.target !== box || e.propertyName !== 'height') return;
    rec.stop(); rec.clear();
  };
  rec.stop = () => {
    box.removeEventListener('transitionend', onEnd);
    clearTimeout(rec.t);
    if (box._hswap === rec) box._hswap = null;
  };
  rec.clear = () => { box.style.height = ''; box.classList.remove('is-hswap'); };
  box.addEventListener('transitionend', onEnd);
  /* the belt to transitionend's braces. A transition that is interrupted
     by something outside this function — a resize that re-lays the box
     out mid-move — fires no end event, and a pinned height is worse than
     an unanimated one. */
  rec.t = setTimeout(() => { rec.stop(); rec.clear(); }, ms('--t-swap') + 90);
  box._hswap = rec;
}

function profileModal() {
  const m = stickerModal({ hero: false, extra: '<div class="prof" data-prof></div>' });
  m.dataset.profile = '';
  renderProfile(m);
  return m;
}

/* 2b. The hero is the SAME round token the HUD carries, at 156px on a
   dashed well, die-cut. The chips are three-state: none, m, f — tapping
   the selected chip again clears it, because null is a real state (the
   plural) and the way back to it has to be one tap too. */
function renderProfile(m) {
  const box = $('[data-prof]', m);
  box.classList.remove('prof--bld', 'prof--info');
  const has = presets().length > 0;
  /* THE HERO IS THE DOOR TO 2a. A 132px button — the whole token, not
     just the chip — labelled with the board's shipped string, and a
     44px paper chip on its corner carrying the sheet glyph so it reads
     as tappable. It replaced a full-width yellow door: two primaries on
     one sheet competed, and the token is the thing being chosen anyway.
     With no sheet to choose from it is a plain span again. */
  box.innerHTML =
    (has
      ? '<button type="button" class="prof-hero" data-swap aria-label="' + esc(PROF_COPY.swap) + '">'
      : '<div class="prof-hero">') +
      '<span class="prof-well" aria-hidden="true"></span>' +
      '<span class="as-d prof-st avs-cut" data-hero>' + avatarSvg() + '</span>' +
      (has ? '<span class="prof-hero__chip" aria-hidden="true">' + SHEET_GLYPH + '</span>' : '') +
    (has ? '</button>' : '</div>') +
    /* THE NAME. Optional, never gated, no submit: the value lands on every
       input and again, cleaned, on blur. 17px so iOS does not zoom the
       page to the field; dir=auto so a Latin name does not sit RTL;
       autocorrect and autocapitalize off so nothing rewrites a Hebrew
       name; enterkeyhint=done and Enter blurs, which is the only "submit"
       there is. Board 2b: label and placeholder are shipped copy. */
    '<div class="prof-name">' +
      '<label class="prof-lbl prof-lbl--name" for="profName">' + esc(PROF_COPY.nameLbl) + '</label>' +
      '<input class="prof-field" id="profName" type="text" dir="auto"' +
        ' placeholder="' + esc(PROF_COPY.namePh) + '" maxlength="' + NAME_MAX + '"' +
        ' inputmode="text" autocomplete="nickname" autocorrect="off"' +
        ' autocapitalize="off" spellcheck="false" enterkeyhint="done"' +
        ' value="' + esc(PROFILE.name) + '">' +
    '</div>' +
    '<p class="prof-lbl">' + esc(PROF_COPY.voice) + '</p>' +
    '<div class="prof-gender" role="group" aria-label="' + esc(PROF_COPY.voice) + '">' +
      '<button type="button" class="gchip" data-g="f">' + esc(PROF_COPY.f) + '</button>' +
      '<button type="button" class="gchip" data-g="m">' + esc(PROF_COPY.m) + '</button>' +
    '</div>' +
    '<div class="prof-actions">' +
      /* THE BUILDER'S DOOR (§D, 2c). Its label says which of two things it
         does: with no build, it builds one from nothing; with a build
         active, it edits that one. The hero above already shows which
         is active, because avatarSvg() ranks cfg first. */
      '<button type="button" class="r-b prof-tweak" data-build>' +
        esc(PROFILE.cfg ? PROF_COPY.edit : PROF_COPY.build) + '</button>' +
      /* שמור, AND IT ONLY CLOSES. Everything above applied the moment it
         was tapped, so the button is always safe to press and never has
         anything to do; the copy matches the player's model — "I typed a
         name, I want to keep it" — not the code's. It was סגור for one
         device round and read as a second ✕ with no confirm. */
      '<button type="button" class="p-c prof-save" data-close>' + esc(PROF_COPY.save) + '</button>' +
      /* THE TWO QUIET DOORS SHARE ONE ROW, AND THE ROW IS A WRAPPER.
         .prof-actions is a flex COLUMN and has to stay one — the two
         controls above it are full-width and stacked by design — so the
         pair gets its own flex row inside it rather than the column
         changing direction under all four.
         DOM ORDER IS THE ORDER THEY HAD STACKED. In an RTL row the first
         child lays out at the physical RIGHT, so info-then-reset here is
         קרדיטים ומידע on the right and להתחיל מחדש on the left, which is
         top-then-bottom read the way this document reads. Nothing about
         their meaning changed with the axis. */
      '<div class="prof-quiet">' +
        /* 2d · THE INFO DOOR, AND IT IS A LINK FOR THE SAME REASON THE
           RESET IS. שמור is the only primary on this sheet; a third
           bordered control here would compete with it and read as a
           third thing the sheet is for. It comes FIRST — the reset is
           destructive and keeps the end of the row, as it kept the
           bottom of the column. */
        '<button type="button" class="prof-info" data-info>' +
          esc(INFO_COPY.door) + '</button>' +
        /* T35 · v30c · THE RESET DOOR, AFTER THE PRIMARY. It sat between
           the builder's door and שמור, which put a destructive link above
           the one button on the sheet that is safe to press — the quiet
           thing was in the loud position and the player read past it to
           reach שמור. Below both, and now beside the other quiet door,
           is where it belongs: it is not one of the two things this
           sheet is for. Still a link and not a button, so שמור remains
           the only primary; it opens a confirm and never resets on its
           own. */
        '<button type="button" class="prof-reset" data-reset>' +
          esc(PROF_COPY.reset) + '</button>' +
      '</div>' +
    '</div>';
  const paint = () => $$('.gchip', box).forEach(c => {
    const on = c.dataset.g === PROFILE.gender;
    c.classList.toggle('on', on); c.setAttribute('aria-pressed', on);
  });
  paint();
  $$('.gchip', box).forEach(c => pressable(c).addEventListener('click', () => {
    setProfile({ gender: c.dataset.g === PROFILE.gender ? null : c.dataset.g });
    paint();
  }));
  /* P2 · both doors out of 2b resize the sticker — 524->376 and 524->542 */
  if (has) pressable($('[data-swap]', box)).addEventListener('click',
    () => stickerSwap(m, () => renderSheet(m)));
  pressable($('[data-build]', box)).addEventListener('click',
    () => stickerSwap(m, () => renderBuilder(m)));
  const rs = $('[data-reset]', box);
  if (rs) pressable(rs).addEventListener('click', () => resetConfirm());
  /* 2d goes through stickerSwap like every other content change in this
     sticker, so the box eases between 2b's height and the info screen's
     rather than jumping. See the P2 block above stickerSwap(). */
  pressable($('[data-info]', box)).addEventListener('click',
    () => stickerSwap(m, () => renderInfo(m)));
  pressable($('[data-close]', box)).addEventListener('click', () => $('.stmodal__x', m).click());
  const nm = $('#profName', box);
  nm.addEventListener('input', () => setProfile({ name: cleanName(nm.value) }));
  nm.addEventListener('blur',  () => { nm.value = cleanName(nm.value); setProfile({ name: nm.value }); });
  nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nm.blur(); } });
}

/* 2a. The board's sheet: eight square die-cuts in three columns, each on
   a dashed well with its name under it, the current one shown mid-peel
   AND carrying the map's completed mark. Tapping applies at once, both
   move, and the sheet returns to 2b by itself. */
/* 300ms: the lift travels for 200 (.avp-st's translate transition) and
   the mark pops in over 180 alongside it; 300 lets both finish and hold
   for a beat before the cut. 250 cut into the pop's tail on a phone;
   longer started to read as waiting for something. Tune in the hand. */
const SHEET_RETURN_MS = 300;
function renderSheet(m) {
  const box = $('[data-prof]', m);
  /* with a build active NO sticker is the current one — the character in
     play is not on this sheet — so none carries the mark until one is
     picked, and picking it is what retires the build (below) */
  const cur = PROFILE.cfg ? null : currentPreset();
  box.classList.remove('prof--bld', 'prof--info');
  box.innerHTML =
    '<h2 class="peel-title">' + esc(PROF_COPY.swap) + '</h2>' +
    '<p class="peel-sub">' + esc(PROF_COPY.sub) + '</p>' +
    '<div class="sheet" role="group">' + presets().map(x => {
      const on = !!cur && x.id === cur.id;
      /* THE NAMES ARE NOT SHOWN. They are labels for eight drawings, not
         names on offer — the player's name is the field on 2b, and it is
         theirs alone — so they live on the buttons for screen readers and
         nowhere the eye can read them as a suggestion. */
      return '<button type="button" class="avp' + (on ? ' avp-peel' : '') + '" data-av="' +
          esc(x.id) + '" aria-pressed="' + on + '" aria-label="' + esc(x.name || x.id) + '">' +
        '<span class="avp-well" aria-hidden="true"></span>'  +
        /* THE MARK IS THE MAP'S, exactly: .node-check's glyph and casing,
           scaled to this host as 24/76 of the face was to the node. It
           lives INSIDE the sticker so the mid-peel lift carries it. */
        '<span class="avs avs-cut avp-st">' + squareSvg(x) +
          '<span class="node-check avp-check" aria-hidden="true">✓</span></span>' +
        '<span class="avp-lift" aria-hidden="true"></span>' +
      '</button>'; }).join('') +
    '</div>';
  /* SELECTING IS THE EXIT. A tap lifts the sticker, lands the mark, and
     after SHEET_RETURN_MS the sheet is 2b again with the new token in
     its hero. Never on the tap's own frame — the confirmation has to be
     seen — and never sooner than the lift has finished travelling. The
     ✕ is the only control left: the way out for someone who opened the
     sheet and wants nothing changed. Nothing at the foot.
     THE ALREADY-CHOSEN STICKER DOES THE SAME, not nothing: the mark pops
     again, the same hold, the same return. A tap that did nothing would
     read as a tap that failed.
     One return per opening: a second tap during the hold re-aims the
     choice but does not start a second timer. */
  let leaving = null;
  $$('.avp', box).forEach(b => pressable(b).addEventListener('click', () => {
    /* avatarId, AND cfg CLEARED — one truth in the state. A preset chosen
       here is the character now; a built one kept dormant beside it would
       be a second character nothing shows and everything has to reason
       about. The build is gone; the builder's door on 2b starts fresh.
       PROFILE.name is never written here or anywhere a preset is chosen:
       it is the player's, and only the player writes it. */
    setProfile({ avatarId: b.dataset.av, cfg: null });
    $$('.avp', box).forEach(x => {
      const on = x === b; x.classList.toggle('avp-peel', on); x.setAttribute('aria-pressed', on);
    });
    const ck = $('.avp-check', b);
    ck.classList.remove('is-pop'); void ck.offsetWidth; ck.classList.add('is-pop');
    if (leaving) return;
    /* P2 · the +148 back up. The guard compares NODE IDENTITY, not size,
       so a height move still in flight cannot make it miss. */
    leaving = setTimeout(() => {
      if (m.isConnected && $('[data-prof]', m) === box) stickerSwap(m, () => renderProfile(m));
    }, SHEET_RETURN_MS);
  }));
}

/* ===== §D · 2c THE BUILDER ============================================
   The CHAR board (v16 canvas, V15CHAR): the preview on its card up top,
   then a kraft sheet with a progress line, ONE axis at a time as a grid
   of white tiles — a mini figure and a name on each — and chevrons at
   the foot. Inside the same sticker 2a and 2b use, content swapped in
   place, so there is one sticker on screen throughout.

   TWO REPRESENTATIONS, ONE ACTIVE. PROFILE.avatarId is the chosen
   preset; PROFILE.cfg is the built character; avatarSvg() ranks cfg
   first. Opening the builder changes NOTHING: `work` is a private copy
   (the saved cfg, or the defaults) and cfg is written only by an axis
   tap or a shuffle — the first such write is the moment the HUD and the
   six consumers switch from preset to build. Open-and-✕ leaves the
   preset active and cfg null. Picking a preset on 2a clears cfg (see
   renderSheet), so both-set never persists.

   THE VOICE STEP. The generator has two bodies and no neutral one, and
   the game never chooses a voice for the player (§B). So when the
   builder opens with no voice set, its FIRST step is the voice question
   — 2b's two chips as tiles showing each body, plus לא משנה, which picks
   one of the two at random and moves on. It writes PROFILE.gender, the
   same field 2b's chips write, and NOT cfg: answering it and closing
   activates no build. If a voice is set the step is not there.

   THE COUNT NEVER LIES because it is never stored: the step list is
   recomputed from the state on every paint — voice (if the builder was
   opened without one), then the six axes less hairColor when the hair is
   קרח. So it reads N מתוך 6, 5 on the bald path, 7 with the voice step,
   and the moment קרח is tapped on the hair axis the line re-reads 5.
   The voice step stays in the list for the whole visit once shown, so
   the count does not jump from 7 to 6 under the player's thumb after
   they answer; prev from the first axis returns to it.

   HAIR COLOUR ON THE HIJAB PATH is the same axis with a different
   heading (BLD_TITLE.hairColorHijab): it colours the scarf, on purpose.

   SHUFFLE is one button, one tap, one result: every axis re-rolled from
   its own list, voice untouched, committed like a tap. No animation
   that rewards a second tap, no sound.

   NO DONE GATE. Every tap already saved. Prev on the first step and the
   ✕ both return to 2b; so does next on the last step (סיימתי), which
   is the same one-way door 2b's שמור is — it closes, it has nothing to
   save — because a chevron that dies on the last step is a dead end. */
function defaultCfg() {
  return { skin: BLD.skin[BLD_SKIN_DEFAULT].id, hair: BLD.hair[0].id, hairColor: BLD.hairColor[0].id,
           eyes: BLD.eyes[0].id, clothes: BLD.clothes[0].id, bg: BLD.bg[0].id };
}
/* a saved cfg, coerced axis by axis: an unknown id is the default for
   that axis, and anything that is not an object is no build at all.
   Never grounds for discarding a save (the same rule as every profile
   field). */
function cleanCfg(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const d = defaultCfg(), out = {};
  BLD_ORDER.forEach(a => { out[a] = bldOpt(a, c[a]) ? bldOpt(a, c[a]).id : d[a]; });
  return out;
}
function shuffleCfg() {
  const out = {};
  BLD_ORDER.forEach(a => { out[a] = BLD[a][Math.floor(Math.random() * BLD[a].length)].id; });
  return out;
}
/* the steps for this state: the axes less the one the hide rule removes */
function bldAxes(work) {
  return BLD_ORDER.filter(a => !(a === 'hairColor' && hairHidesColor(work.hair)));
}

function renderBuilder(m) {
  const box = $('[data-prof]', m);
  const editing = !!PROFILE.cfg;
  const work = editing ? cleanCfg(PROFILE.cfg) : defaultCfg();
  const withVoice = PROFILE.gender === null;
  const steps = () => (withVoice ? ['voice'] : []).concat(bldAxes(work));
  let cur = withVoice ? 'voice' : 'skin';
  const commit = () => setProfile({ cfg: Object.assign({}, work) });
  const preview = (c, g) => roundShell(buildAvatar(c, g));

  /* the grid is the one thing that may scroll here, never the hero */
  box.classList.remove('prof--info');
  box.classList.add('prof--bld');
  box.innerHTML =
    '<h2 class="peel-title bld-title">' + esc(editing ? PROF_COPY.edit : PROF_COPY.build) + '</h2>' +
    /* THE HERO, once. It is never re-created, only repainted, and it
       sits outside the sheet in the box's flow — so whatever the sheet
       does below it, it is on screen: the sticky preview is structural,
       not a scroll trick. */
    '<div class="prof-hero bld-hero">' +
      '<span class="prof-well" aria-hidden="true"></span>' +
      '<span class="as-d prof-st avs-cut" data-hero></span>' +
    '</div>' +
    '<div class="bsheet" data-sheet></div>';
  const hero = $('[data-hero]', box), sheet = $('[data-sheet]', box);

  /* the voice step shows the token in play — no body has been chosen,
     so none is drawn; the two tiles below show the bodies */
  const paintHero = () => {
    hero.innerHTML = (cur === 'voice' && PROFILE.gender === null) ? avatarSvg() : preview(work);
  };

  const tile = (id, label, svg, on) =>
    '<button type="button" class="bopt' + (on ? ' on' : '') + '" data-opt="' + esc(id) + '"' +
      ' aria-pressed="' + on + '" aria-label="' + esc(label) + '">' +
      '<span class="bopt-st" aria-hidden="true">' + svg + '</span>' +
      '<span class="bopt-lbl" aria-hidden="true">' + esc(label) + '</span>' +
      '<span class="node-check bopt-check" aria-hidden="true">✓</span>' +
    '</button>';

  const paintSheet = () => {
    const st = steps(), i = st.indexOf(cur), n = st.length;
    const first = i === 0, last = i === n - 1;
    const voice = cur === 'voice';
    const title = voice ? PROF_COPY.voice
                : (cur === 'hairColor' && work.hair === 'hijab') ? BLD_TITLE.hairColorHijab
                : BLD_TITLE[cur];
    let grid;
    if (voice) {
      grid = tile('f', PROF_COPY.f, preview(work, 'f'), PROFILE.gender === 'f') +
             tile('m', PROF_COPY.m, preview(work, 'm'), PROFILE.gender === 'm') +
             '<button type="button" class="gchip bopt-any" data-opt="">' + esc(PROF_COPY.any) + '</button>';
    } else {
      grid = BLD[cur].map(o => tile(o.id, o.label, preview(Object.assign({}, work, { [cur]: o.id })), work[cur] === o.id)).join('');
    }
    sheet.innerHTML =
      '<div class="bhead">' +
        '<p class="bprog" aria-live="polite">' +
          '<span class="bprog__n">' + (i + 1) + ' ' + esc(PROF_COPY.of) + ' ' + n + '</span>' +
          '<span class="bprog__bar" aria-hidden="true"><i style="width:' + Math.round((i + 1) / n * 100) + '%"></i></span>' +
        '</p>' +
        (voice ? '' :
          '<button type="button" class="ib-b bshuf" data-shuffle aria-label="' + esc(PROF_COPY.shuffle) + '">' +
            SHUFFLE_GLYPH + '</button>') +
      '</div>' +
      '<h3 class="baxis">' + esc(title) + '</h3>' +
      '<div class="bgrid scrolls' + (voice ? ' bgrid--voice' : '') + '" role="group" aria-label="' + esc(title) + '">' + grid + '</div>' +
      '<div class="bfoot">' +
        '<button type="button" class="bnav bnav--prev" data-prev>' +
          CHEV_R + esc(first ? PROF_COPY.back : PROF_COPY.prev) + '</button>' +
        '<button type="button" class="bnav bnav--next' + (last ? ' bnav--last' : '') + '" data-next>' +
          esc(last ? PROF_COPY.finish : PROF_COPY.next) + CHEV_L + '</button>' +
      '</div>';
    /* P2 · THE AXIS STEP IS THE old === new CASE. 5, 6 and 7 are all one
       height; 1 -> 5 is +17. It goes through the utility precisely so the
       guard is the thing deciding, rather than a caller guessing which
       steps move and which do not. */
    const go = a => { cur = a; stickerSwap(m, () => { paintHero(); paintSheet(); }); };
    $$('[data-opt]', sheet).forEach(b => pressable(b).addEventListener('click', () => {
      if (voice) {
        /* gender ONLY — not cfg. לא משנה picks one of the two bodies at
           random: something must be drawn and the game does not choose
           silently, so the player is told it was arbitrary by the label. */
        const g = b.dataset.opt || (Math.random() < .5 ? 'f' : 'm');
        setProfile({ gender: g });
        go(steps()[1]);
        return;
      }
      work[cur] = b.dataset.opt;
      commit();
      paintHero();
      $$('[data-opt]', sheet).forEach(x => {
        const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on);
      });
      const ck = $('.bopt-check', b);
      if (ck) { ck.classList.remove('is-pop'); void ck.offsetWidth; ck.classList.add('is-pop'); }
      /* the hide rule may have changed the step list (קרח, or back from
         it): only the count line and the chevrons need to know */
      if (cur === 'hair') stickerSwap(m, paintSheet);
    }));
    const sh = $('[data-shuffle]', sheet);
    if (sh) pressable(sh).addEventListener('click', () => {
      Object.assign(work, shuffleCfg());
      commit();
      /* the axis under the thumb may have been removed by the roll */
      if (steps().indexOf(cur) < 0) cur = 'hair';
      stickerSwap(m, () => { paintHero(); paintSheet(); });
    });
    pressable($('[data-prev]', sheet)).addEventListener('click', () => {
      if (first) stickerSwap(m, () => renderProfile(m)); else go(st[i - 1]);
    });
    pressable($('[data-next]', sheet)).addEventListener('click', () => {
      if (last) stickerSwap(m, () => renderProfile(m)); else go(st[i + 1]);
    });
  };
  paintHero();
  paintSheet();
}

/* 2d. THE INFO SCREEN. Three sections in one scroller, under a pinned
   title and over a pinned חזרה — the builder's silhouette exactly, and
   for the builder's reason (see .prof--bld): while this is showing,
   .prof stops being the scroller and ONE inner container owns the
   overflow, so the title and the way back cannot scroll away.

   THE SCROLLER CARRIES .scrolls, WHICH IS NOT OPTIONAL. html and body
   are touch-action:none and .scrolls is the only place the pan gesture
   is handed back; a new overflow container without it scrolls from
   script and is dead under a finger, which is the silent failure the
   rule at the top of proto.css was written after. .prof's own
   overflow-y:auto is a safety net that is documented as never engaging,
   and this screen deliberately does not make it engage. */
function renderInfo(m) {
  const box = $('[data-prof]', m);
  box.classList.remove('prof--bld');
  box.classList.add('prof--info');

  /* THE LIST IS THE ART INDEX, NOT THE ROSTER. M.politicians is what
     ships out of assets/mk/; MK_CREDITS is looked up BY the index's key
     rather than iterated itself, so a person with art and no credit row
     still appears — an empty row is a visible gap, a missing row is an
     invisible one, and only one of those gets filled in.
     THE FALLBACK IS MK_CREDITS' OWN KEYS, for the one frame before the
     manifest fetch lands. The modal cannot be opened that early today —
     boot() runs off the same .then() — so this is a guard, not a path. */
  const art = (M && M.politicians) || {};
  const ids = Object.keys(art).length ? Object.keys(art) : Object.keys(MK_CREDITS);

  const link = (href, label, cls) =>
    '<a class="' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener">' +
      esc(label) + '</a>';

  const rows = ids.map(id => {
    const a = art[id] || {}, c = MK_CREDITS[id] || {};
    /* WHATEVER OF THE FOUR THIS ROW HAS, AND NOTHING FOR WHAT IT HAS
       NOT. The licence is a link when there is a deed to point at and
       plain text when there is only an identifier — never the other way
       round, and never a bare URL standing in for the name of a licence. */
    const cr =
      (c.author  ? '<span class="info-by">' + esc(c.author) + '</span>' : '') +
      (c.source  ? link(c.source, INFO_COPY.source, 'info-src') : '') +
      (c.licence ? (c.licenceUrl ? link(c.licenceUrl, c.licence, 'info-lic')
                                 : '<span class="info-lic">' + esc(c.licence) + '</span>') : '');
    return '<li class="info-row">' +
        '<p class="info-who">' +
          '<span class="info-name">' + esc(a.name || id) + '</span>' +
          (a.party ? '<span class="info-party">' + esc(a.party) + '</span>' : '') +
        '</p>' +
        '<p class="info-cr">' + cr + '</p>' +
      '</li>';
  }).join('');

  box.innerHTML =
    '<h2 class="peel-title">' + esc(INFO_COPY.title) + '</h2>' +
    '<div class="info scrolls">' +
      '<section class="info-sec">' +
        '<h3 class="info-h">' + esc(INFO_COPY.credits) + '</h3>' +
        '<ul class="info-list">' + rows + '</ul>' +
      '</section>' +
      '<section class="info-sec">' +
        '<h3 class="info-h">' + esc(INFO_COPY.method) + '</h3>' +
        '<p class="info-p">' + esc(INFO_COPY.methodBody) + '</p>' +
      '</section>' +
      '<section class="info-sec">' +
        '<h3 class="info-h">' + esc(INFO_COPY.about) + '</h3>' +
        '<p class="info-p">' + esc(INFO_COPY.aboutBody) + '</p>' +
      '</section>' +
    '</div>' +
    /* THE SAME FOOT THE BUILDER'S FIRST AXIS DRAWS: one .bnav--prev
       carrying CHEV_R and PROF_COPY.back. Not a second string and not a
       second control — back out of a profile sub-screen is one thing,
       and it should look like one thing wherever the player met it. */
    '<div class="bfoot info-foot">' +
      '<button type="button" class="bnav bnav--prev" data-info-back>' +
        CHEV_R + esc(PROF_COPY.back) + '</button>' +
    '</div>';

  pressable($('[data-info-back]', box)).addEventListener('click',
    () => stickerSwap(m, () => renderProfile(m)));
}
/* THE CHEVRONS ARE DRAWN, NOT TYPED. › and ‹ are bidi-mirrored glyphs:
   in this RTL document a typed › renders pointing LEFT, so the back
   chevron pointed forward. An SVG path points where it is drawn. Back
   is to the physical RIGHT here (the first flex child, the way the
   reader came from); forward is to the left. */
const chev = d => '<svg class="bnav__chev" viewBox="0 0 24 24" width="20" height="20" fill="none"' +
  ' stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="' + d + '"/></svg>';
const CHEV_R = chev('M9 5l7 7-7 7'), CHEV_L = chev('M15 5l-7 7 7 7');
/* two crossing arrows, stroked, so it takes the chip's ink like the sheet glyph */
const SHUFFLE_GLYPH =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>';

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
  syncSndToggle('round');                                      /* T26 */
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
          /* ITEM 36 · VARIANT E · THE HEADLINE IS A KRAFT TAPE BEHIND THE
             CHAIR'S FOOT, not type on the cushion. It is still a child of
             .b2seat because it is positioned off the seat's own box —
             top:calc(100% - 5px) puts its top edge just under the chair, so
             the foot's die-cut overlaps it and the tape reads as passing
             BEHIND the chair. The chair takes a z-index above it for that
             to hold; see .b2tape and .b2chair.
             The copy is unchanged from item 34. */
          '<p class="b2tape">' + esc('אז מה באמת קורה בכנסת?') + '</p>' +  /* TAMAR */
          /* .b2taken is gone: the confirmation is no longer a chip that
             APPEARS on the chair, it is the callout that ARRIVES there
             and then leaves for the pin. .b2seat is still the anchor the
             callout is positioned from — see tachlesTransition(). */
        '</div>' +
        /* ITEM 34b · THE TITLE IS THE TAP TARGET, and the sentence is built
           around it. The underlined run is issue.title — the short subject,
           the same field the HUD pill carries — because that is the word
           the player recognises. THE MODAL IS UNCHANGED: lawModal() still
           shows bill_title and bill_summary. The two fields are not
           swapped; the short one is the handle, the long one is inside.
           ITEM 34c · the separate .b2bill--link line is gone; this is where
           its job went. */
        '<p class="b2head">' +
          esc('הצעת חוק אמיתית לעניין ') +                     /* TAMAR */
          '<button type="button" class="b2title-link" data-law>' +
            esc(issue.title || '') + '</button>' +
        '</p>' +
        /* ITEM 34d · ONE SLOT, THREE STATES, AND THE FALLBACK SHIPS.
           tachles_prompt when it exists; otherwise the vote question, which
           is real copy and is meant to be seen. The risk in a shipping
           fallback is that it hides the gap — so ?placeholders=on swaps it
           for the marked placeholder instead, which is how anyone auditing
           content can see which issues are actually carrying a תכלס.
           NOT ph(): body.no-ph is the default build and would erase it.
           NOTHING IS SUBSTITUTED — bill_summary is the modal's content and
           never this line. */
        (issue.tachles_prompt
          ? qBlock(issue.tachles_prompt)
          : DEV.ph
            ? qBlock('[טקסט — תמר: תכלס]', 'pr-ph')
            : qBlock('כח״כ ה-121 — מה אתה היית מצביע?')) +          /* TAMAR */
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
    /* T5 · BEAT 3 IS ONE LINE. ITEM 31's sentence is retired with it.
       It read "בתאריך {bill_date} הועלתה להצבעה הצעת החוק: {bill_title}."
       and both fields are still on screen a beat earlier — bill_title is
       what lawModal() titles itself with, bill_date is the line T7 just
       labelled inside it, and issue.title is the underlined handle in
       beat 2's own sentence. Restating them here spent the beat on facts
       the player has already been given and pushed the question, which is
       the only thing this beat is for, to the bottom of a paragraph.
       NEITHER FIELD IS READ HERE ANY MORE. bill_date and bill_title are
       beat 2's, through the modal, and nowhere else in this beat.
       The white pill under it is not new and is not built here: the
       affordance tachlesTransition() schedules at T.tcTapAt is .tctap,
       already floating at the bottom of this same overlay. */
    '<div class="ovpane ovpane--bill is-below">' +
      '<div class="ov-inner b3inner">' +
        /* BUILD-IB · 1 · THE LINE IS THE BAND. Beat 3 is one line and has
           been since T5; the band is what that line is set on now, so the
           surface carries the kraft object the other three do and the
           copy is untouched. .bandslot reserves the 53px in flow — the
           band itself is absolute and 440px wide, which is wider than the
           stage on purpose. */
        '<div class="bandslot"><p class="band b3ask">' +
          esc('נחשו מה הצביעו שאר הח״כים') + '</p></div>' +  /* TAMAR · T5 */
      '</div>' +
    '</div>';
  $('#stage').appendChild(ov);

  /* NO INSTRUCTION LINE. Three vote chips are the instruction. */

  /* T22 · THE CLAIM IS SIZED FIRST, and the order is not incidental. The
     question's height is a term in the chair's remainder, so a size
     picked after the budget would leave the chair measured against a
     block that is about to change height. Sized, then budgeted, then the
     tab placed against the line the first two settled. */
  fitClaimSize();
  /* v27 · the chair yields BEFORE the tab is placed: resizing it moves
     line 1, and placeQTab() reads line 1's rect. */
  fitBeat2();
  /* v26f · placed in the same tick the pane is appended, before a frame
     is painted, so the tab never shows at an unplaced position */
  placeQTab();

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
  if (window.HAC) HAC('beat2_vote', { issue_id: issue.id, vote: vote });
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
    '<span class="tcal__av as-d" aria-hidden="true">' + avatarSvg() + '</span>' +
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
  /* O2 · THIS IS THE PULSE THAT ESCAPED THE BEAT-2 GUARD, and it is
     gone. It fired at tcTravelAt + tcTravel = 1120ms while beat3() starts
     at tcNextAt = 900, so it wore beat 3's number and passed a check that
     reads S.beat. What it celebrated is the player's own vote arriving on
     the banner -- exactly the input §1.4d says is never rewarded. The
     banner still pins and the flying chip still hands off; only the pat
     on the back goes. */
  setTimeout(() => {
    pinVote(vote);
    cal.remove();
  }, T.tcTravelAt + T.tcTravel);
}

/* THE AFFORDANCE. The whole surface is the target, so the cue names the
   gesture rather than pretending to be the thing you press — BUILD-IB
   took the pill's costume off it and left the words. At this beat the
   screen has stopped moving and must not read as finished; the blur
   holding at the tier and tc-breathe are the other two halves of that.

   BUILD-IB · 10 · THE HELD STATE IS UNCONDITIONAL, THE WORDS ARE NOT.
   .is-held goes on every time: it is the surface saying it is alive, and
   the collapse's implicit from-keyframe reads its blur. Only the line is
   scheduled, and it is withheld after the first round — see tapDue().
   IT IS SAFE TO WITHHOLD BECAUSE OF WHERE IT SITS. armNext() fires
   beat3() at 900ms, the bill pane settles at 1260 and this lands at
   1300: the line is a late state ON a surface the player is already
   reading, not a curtain in front of it. Removing it removes a label and
   moves no timing. */
function tapAffordance(ov) {
  if (!ov.isConnected || $('.tctap', ov)) return;
  ov.classList.add('is-held');
  if (!tapDue()) return;
  const hint = el('div', 'tctap',
    '<span>' + esc(t('tapNext')) + '</span>' +                       /* TAMAR · COPY.tapNext */
    '<span class="tctap__c" aria-hidden="true">›</span>');
  /* T38 · IT HANGS OFF THE BAND, NOT OFF THE OVERLAY. The prompt is about
     the line the band carries, and at the foot of the surface it was
     thirty-odd centimetres of empty ground away from it. .bandslot is
     position:relative and exists from beat 2's build, so it is here by
     the time this runs (armNext 900 -> bill settles 1260 -> this at 1300).
     THE OVERLAY IS THE FALLBACK, not a second layout: if beat 3 ever
     stops carrying a band, the prompt still appears rather than being
     dropped on the floor by a missing selector. */
  ($('.bandslot', ov) || ov).appendChild(hint);
  requestAnimationFrame(() => requestAnimationFrame(() => hint.classList.add('is-in')));
}
/* the same gate askMkDue() uses, and deliberately the same shape: an
   override that never writes, a save flag spent once, reduced motion
   opting out. Reduced motion skips it because the line's entrance IS a
   transition and the breathe is an animation -- flattened to 1ms it
   appears from nowhere and then sits still, which says less than the
   cursor already does. */
function tapDue() {
  if (DEV.tctap !== null) return DEV.tctap;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

/* ===== v26 · THE תכלס TAB AND THE PROMPT'S TAIL =====================
   Both decided on explorations/v26/tachles-tab.html in ~/dev/hachach-121;
   the numbers below are that board's, measured, not estimated.

   THE SPLIT MATCHES THE SUFFIX STRING, NOT THE DASH. Every one of the
   sixteen tachles_prompt values ends with the exact run
   "מה ההצבעה שלך?" and every one is preceded by the identical separator
   "- " (U+002D U+0020) — verified across the whole set. The dash is NOT
   matched on, because dashes occur inside the claims themselves (v2's
   חד-פעמיים, a1's ה 7/10, r1's nothing at all): matching the tail's own
   words is the only rule that cannot cut a claim in half.

   THE DASH STAYS. Everything before the suffix is the claim, dash
   included, so the claim reads "…עבור החרדים-" and the CMS text is
   reproduced character for character. Only trailing WHITESPACE is
   trimmed, and only because a space before a display:block sibling is a
   space at the end of a rendered line. Nothing in data.js changes.

   NO SUFFIX, NO SPLIT. A prompt without the run renders exactly as it
   does today, one line, no tail element — which is the branch the
   fallback string takes, since "מה אתה היית מצביע?" is not the same
   words. That branch is live, not theoretical.

   THE TAIL IS ALWAYS ITS OWN LINE, never inline at any width, which is
   what display:block on .b2q__tail buys. Board measurement: pulling the
   tail out drops the claim a whole 33px line on every prompt long enough
   to have been wrapping, so the block gets SHORTER on three of the four
   cases measured (s1 at both widths, g1 at 360) and taller only where
   the claim was already down to two lines. */
const Q_TAIL = 'מה ההצבעה שלך?';                                       /* TAMAR */

/* T26 · THE SPLIT, FACTORED OUT, because two surfaces now need it and a
   second copy of the suffix test is a second thing to keep in step. The
   rule is unchanged and is the one argued above: match the tail's own
   words as an exact SUFFIX, never the dash, and trim only trailing
   whitespace. A prompt without the run comes back whole. */
function promptClaim(text) {
  const t = String(text || '');
  const i = t.indexOf(Q_TAIL);
  if (i < 0 || i + Q_TAIL.length !== t.length) return t;
  return t.slice(0, i).replace(/\s+$/, '');
}

/* =====================================================================
   T26 · WHAT THE BAND SAYS DURING THE CASCADE, AND THE ONE PLACE IT IS
   DECIDED.

   THIS IS THE FALLBACK, NOT THE FINAL FORM. Tamar's sixteen condensed
   lines do not exist yet, so the band carries the verbatim prompt with
   beat 2's question stripped off it: correct at two lines for eleven of
   the sixteen, truncated for five, and better than showing none of it on
   all sixteen.

   THE SWAP IS A DATA CHANGE. When the condensed strings land they go in
   data.js as one field per issue and this function returns it, falling
   back to today's behaviour for any issue that has not been written yet:

       return issue.tachles_short || promptClaim(issue.tachles_prompt);

   Nothing else moves — not the markup, not the CSS, not the clamp, not
   the call site. See the report.

   THE TAIL COMES OFF HERE AND NOT AT BEAT 2. "מה ההצבעה שלך?" is beat
   2's question and is right where it is asked; on the cascade it is the
   wrong question, asked again under a black tag that is already asking
   the right one, once per card. */
function bandQuestion(iss) {
  if (!iss) return '';
  /* T26b · AND THE HYPHEN GOES WITH IT, HERE AND NOT IN promptClaim().
     v26 ruled the dash stays, and that ruling is about BEAT 2, where the
     tail sits under it on its own line and the dash is what connects the
     claim to it. On this band there is no tail, so the same character is
     a hyphen with nothing after it — on all sixteen, and worst on the
     four that FIT, where r1 renders its complete claim as "…עבור החרדים-"
     and reads truncated on the one issue that is not.
     Band-side only: promptClaim() is shared with beat 2 and is untouched,
     so beat 2 still reads character for character as the CMS wrote it.
     The class covers the ASCII hyphen, the Hebrew maqaf and both dashes,
     because the set is Tamar's to grow and matching one of them would
     have this coming back. */
  return promptClaim(iss.tachles_prompt || '')
           .replace(/[\s\u00A0]*[-\u05BE\u2013\u2014]\s*$/, '');
}

/* v26g · THE TAB IS CENTRED ON THE FIRST WORD OF LINE 1.
   v26f anchored to a fraction of line 1 — 20% along from the start end.
   That guaranteed contact on all sixteen and was still wrong: 20% of a
   340px line is 68px in, past the end of any first word, so fifteen of
   the sixteen landed MID-WORD. g1 covered the middle three letters of
   לאפשר with a letter showing either side, which reads as crossing the
   word out rather than tagging it. Only r1, whose line is the shortest,
   happened to cover a whole word.
   The first word's own box is the only anchor that says "this word".

   WIDER THAN THE WORD IS FINE; HALF OF TWO WORDS IS NOT. When the word
   measures less than the tab the tab overhangs it symmetrically rather
   than shrinking or falling back — a tag wider than the thing it tags
   still reads as a tag. The one clamp is the line's own start end: the
   tab never pushes past it, because a tag hanging off the end of the
   line reads as belonging to nothing.

   ONE EXTRA RANGE, NOT A SECOND LAYOUT PASS. The line-1 rects are still
   read exactly as v26f read them — they are what the clamp needs — and
   the word's box comes from one more Range over the same text node,
   measured in the same batch. Still no ResizeObserver: this hangs off
   the resize stack sizeStage/placeChyron/redrawPath already share, and
   is a no-op on every screen with no .b2q__tab, exactly as redrawPath
   is a no-op with no #mapline. */

/* ===== v27 · BEAT 2 FITS, AND THE CHAIR IS WHAT YIELDS ==============
   THE BUG THIS CLOSES. Beat 2 overflowed 360x640 on fourteen of the
   sixteen issues — g2 by 128px, and on s1 the three vote buttons were
   ENTIRELY off the stage, so the player could not vote. .ov--stage is
   place-items:center inside a stage with overflow:hidden, so the excess
   split top and bottom and was clipped in silence: nothing looked
   broken, the buttons were simply not there.

   A BUDGET, NOT A SCALE. The bottom stack is the interaction and never
   moves: the vote row keeps its 60px and its gap, the question keeps
   whatever height its own text needs, and the padding — safe-area
   included — is identical at every viewport. What is left over is the
   chair, which is decoration. It is measured as a remainder rather than
   re-derived term by term, because the terms are spread across four
   rules and a flex gap and a re-derivation would drift the first time
   one of them moved; the remainder is the same number and cannot.

   ONE PASS IS ENOUGH. The chair's height does not change the column
   width, so the question's line breaks — and therefore the non-chair
   remainder — are identical before and after the resize. There is no
   second reflow to chase.

   THE FLOOR IS 150px. Below that the chair stops being the thing the
   question is about and becomes an icon beside it — which is the exact
   failure ITEM 36's predecessor is on record for at clamp(96px,...).
   At 150 the chair is 129px wide and still reads as a chair: arms,
   cushion and pedestal all survive. If the floor is hit and the screen
   still overflows the chair does NOT squash further — that is a
   content-length problem and it is reported as one. */
const CHAIR_MAX = 330;
const CHAIR_MIN = 150;

/* =====================================================================
   T22 PART 1 · 32px UNDER THE VOTE ROW, MEASURED ON INK.
   The overlay's bottom padding was 16px and the row sat 11.4px clear of
   the stage at 360x640 — close enough to the edge to read as cut off
   rather than as placed. The reservation is 32px of visible ground, and
   like T20's HUD gap it is taken from ink and not from the box: .v-a
   carries a 4.6px extrusion below its border box, so the padding has to
   be 32 + 4.6 to leave 32 of actual air.
   IT COMES OUT OF THE CHAIR, NOT THE QUESTION. avail shrinks, rest does
   not, and the chair is the remainder — which is v27's whole design and
   the reason it can absorb this without anything else moving.
   VOTE_INK is a named constant rather than a parse of computed
   box-shadow, for the reason HUD_INK gives: a shadow string is four
   numbers whose meaning depends on their count, and getting that wrong
   silently is worse than a named 4.6 that a grep for .v-a finds. */
const VOTE_GAP = 32;    /* T22 · visible ground under the row, ink to edge */
const VOTE_INK = 4.6;   /* .v-a's extrusion, painted below its box        */

/* =====================================================================
   T22 PART 2 · THE CLAIM STEPS, IT DOES NOT SCALE.
   Three fixed sizes and the largest that fits in three lines. A
   continuously fitted size would give the question a different size on
   every round, which reads as arbitrary rather than as designed — the
   player would see 26 on one issue, 24.3 on the next and have no way to
   understand why. Three steps are a set, and a set reads as a decision.
   THE FLOOR DOES NOT BEND. If an issue still runs to four lines at 20px
   it runs to four lines: going smaller would put the claim under its own
   21px tail and invert the hierarchy, which is a worse failure than a
   fourth line. Those issues are a content-length problem and are named
   in the report rather than absorbed here. */
/* T22 · THE DECK'S EXIT, WRITTEN ONCE. These are .deckcard.is-leaving's
   own numbers. The claim card cannot take that class — it is not a
   .deckcard and the rule also carries rotateY(180deg) for the flipper —
   so the transform is named here and applied inline, which is the same
   values reaching the same place by the only route available. If that
   rule is ever retuned, this is the other half to move with it. */
const CARD_EXIT_T = 'translate(-420px,8px) rotate(-13deg)';

/* =====================================================================
   T23 · CLEARING A FILLING ANIMATION IS NOT ENOUGH ON ITS OWN.

   THE BUG. Three objects leave with the claim card — the card, its stamp
   and the pinned pill — and all three were still holding a fill:both
   animation when they were told to go: d2-jolt-claim, d2-land-mk and
   cmark-land. Each site cleared it the obvious way and then set the exit
   transform in the SAME TICK:

       el.style.animation = 'none';
       el.classList.add('is-leaving');
       el.style.transform = CARD_EXIT_T;

   A CSS animation that is running or filling a property suppresses a
   transition on that property, and the browser only re-evaluates that
   when it computes a style. Nothing forces it to between those three
   lines, so no transform transition was ever created and the objects were
   at translate(-420px,8px) on the first frame after the tap. Measured:
   the card got an opacity transition and nothing else; the stamp and the
   pill got no transitions at all. Everything teleported off screen and
   the only thing that animated was the card's opacity, fading from 1 to
   .2 over 100ms starting at 220ms — an object already 420px off screen.
   That is why the exit was invisible. The 320ms was never the problem and
   is unchanged.

   THE FIX IS THE READ. Touching offsetHeight forces a style and layout
   pass, so the browser computes one state in which the animation is gone
   and the transform is still at rest — which is what the transition then
   has something to travel FROM. It is one line and it is deliberately a
   named function rather than a bare `void el.offsetHeight` at four call
   sites: a forced reflow with no explanation is exactly the line somebody
   deletes as dead code.
   ===================================================================== */
function unhold(el) {
  if (!el) return el;
  el.style.animation = 'none';
  void el.offsetHeight;               /* the pass IS the fix — see above */
  return el;
}

/* T22b · THE TAIL STEPS WITH THE CLAIM, AND IT IS A RATIO NOT A SIZE.
   21 was set against a claim fixed at 26 — 21/26 is 0.81 — and when the
   claim started stepping the tail did not follow. At the floor that put a
   21px tail under a 20px claim: the subordinate line larger than the
   question it belongs to, which is not a collapsed hierarchy but an
   inverted one. The pairs below hold 0.81 to the nearest pixel, so the
   relationship the board decided at 26 is the relationship at every step.
   PAIRS RATHER THAN A CALC. 23 x 0.81 is 18.63 and 20 x 0.81 is 16.2;
   written as a calc the tail would land on fractional sizes that hint
   differently at each step. Three pairs are a set the same way three
   sizes are. */
const Q_STEPS = [
  { q: 26, t: 21 },     /* today's, and what most issues get */
  { q: 23, t: 19 },
  { q: 20, t: 16 },     /* the floor */
];
const Q_MAX_LINES = 3;

/* the claim's own line count — the tail is excluded because it is its own
   line by declaration and is not part of what is being fitted */
function claimLines(q) {
  const tn = [].filter.call(q.childNodes, n => n.nodeType === 3 && n.textContent.trim());
  if (!tn.length) return 0;
  const rg = document.createRange();
  rg.setStart(tn[0], 0);
  rg.setEnd(tn[tn.length - 1], tn[tn.length - 1].textContent.length);
  const tops = [].filter.call(rg.getClientRects(), r => r.height > 4)
                 .map(r => Math.round(r.top));
  return new Set(tops).size;
}

/* ONE PASS PER STEP AND AT MOST THREE, which is cheap enough to run on
   every build: the block's width does not change with its font size, so
   each step's line count is settled the moment the size is written and
   there is nothing to converge on. */
function fitClaimSize() {
  const q = $('.b2q'); if (!q) return null;
  /* THE TAIL IS WRITTEN WITH EVERY TRY, NOT ONLY WITH THE WINNER. It is a
     block of its own so it cannot change where the claim wraps, but it IS
     part of the block the chair is budgeted against, and leaving it at the
     previous step's size between tries would measure a height that never
     ships. */
  const put = st => {
    q.style.setProperty('--b2q-size', st.q + 'px');
    q.style.setProperty('--b2q-tail', st.t + 'px');
  };
  for (let i = 0; i < Q_STEPS.length; i++) {
    put(Q_STEPS[i]);
    if (claimLines(q) <= Q_MAX_LINES) return Q_STEPS[i].q;
  }
  const floor = Q_STEPS[Q_STEPS.length - 1];
  put(floor);                     /* the floor holds, four lines and all */
  return floor.q;
}

/* =====================================================================
   T20 PART 1 · THE TOP OF THE BUDGET, WHICH v27 NEVER HAD.
   v27 reserved from the bottom up — the vote row, the gaps, the padding —
   and let the chair take whatever was left. Nothing reserved from the
   TOP, and .ov--stage is inset:0 over the whole stage with 18px of
   padding, so the column began 18px down while the HUD's painted edge
   ends at 51. The chair's first 33px of box therefore ran behind pills it
   is z-indexed under, on every issue, in every build. e2 only makes it
   obvious because e2's question is the longest and squeezes the chair
   into the space where the overlap shows.

   MEASURED ON INK. Two corrections to the box, both upward:
     · #dcw dilates SourceAlpha by 5 user-space px before compositing the
       white die-cut, so the chair paints 5px ABOVE its own border box.
       That is why the real overlap is 38 and not the 33 a box reading
       gives, and why v27's note says 32.
     · the HUD's pills carry .ib-b's 0 3px 0 extrusion, which paints
       below the HUD's box.
   HUD_INK names the second. It is a constant rather than a parse of
   computed box-shadow because a shadow string is four numbers whose
   meaning depends on their count, and getting that wrong silently is
   worse than a named 3 that a grep for .ib-b finds.

   IT IS COMPUTED, NOT WRITTEN AS A LITERAL. The HUD's own height moves
   with the safe-area inset and with anything that changes the pill row,
   and a literal padding-top would be right on one device. Reading the
   HUD's rect against the stage's costs one measurement in a function
   that is already measuring four. */
const HUD_GAP  = 12;   /* T20 · the visible air asked for, ink to ink */
const HUD_INK  = 3;    /* .ib-b's extrusion, painted below the HUD box */
const CHAIR_DILATE = 5;/* #dcw feMorphology radius, painted above the box */

function reserveHudGap(ov) {
  const hud = $('.hud'), st = $('#stage');
  if (!hud || !st) return;
  const need = (hud.getBoundingClientRect().bottom - st.getBoundingClientRect().top)
             + HUD_INK + HUD_GAP + CHAIR_DILATE;
  /* never SHRINK the overlay's own padding: 18px is the design's minimum
     air on a screen whose HUD is somehow shorter than that. */
  const cur = parseFloat(getComputedStyle(ov).paddingTop) || 0;
  ov.style.setProperty('--ov-top', Math.max(need, 18) .toFixed(2) + 'px');
  return cur;
}

function fitBeat2() {
  const ov = $('.ov--stage'); if (!ov) return;
  const pane = $('.ovpane--vote', ov); if (!pane) return;
  const inner = $('.ov-inner', pane); if (!inner) return;
  const chair = $('.b2chair', pane); if (!chair) return;

  /* BEFORE the budget reads its own padding, not after: the reservation
     is part of what "available" means now. */
  reserveHudGap(ov);
  /* T22 · and the same from the other end. --ov-bot is written here for
     the same reason --ov-top is: the safe-area inset is not knowable from
     the stylesheet alone and a literal would be right on one device. */
  ov.style.setProperty('--ov-bot', (VOTE_GAP + VOTE_INK).toFixed(2) + 'px');

  const cs = getComputedStyle(ov);
  const avail = ov.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const chairH = chair.getBoundingClientRect().height;
  /* everything that is not the chair: the seat's 61px reserve for the
     tape, the column gaps, the headline, the question block and the
     vote row. Measured, so a change to any of them is picked up. */
  const rest = inner.getBoundingClientRect().height - chairH;

  let target = avail - rest;
  if (target > CHAIR_MAX) target = CHAIR_MAX;
  if (target < CHAIR_MIN) target = CHAIR_MIN;
  chair.style.height = target.toFixed(2) + 'px';
}

function placeQTab() {
  const q = $('.b2q'); if (!q) return;
  const tab = $('.b2q__tab', q); if (!tab) return;
  /* the CLAIM's own text nodes — not the tail, which is its own line,
     and not the tab, which is what we are placing */
  const tn = [].filter.call(q.childNodes, n => n.nodeType === 3 && n.textContent.trim());
  if (!tn.length) return;
  const node = tn[0], txt = node.textContent;

  /* ---- line 1, for the clamp. getClientRects returns one rect per BIDI
     RUN, not per line: a digit or a Latin word splits its line into
     several. Merge by rounded top or a prompt with a number in it
     measures a fragment. */
  const rg = document.createRange();
  rg.setStart(tn[0], 0);
  rg.setEnd(tn[tn.length - 1], tn[tn.length - 1].textContent.length);
  const rects = [].filter.call(rg.getClientRects(), r => r.height > 4);
  if (!rects.length) return;
  let key = Infinity;
  rects.forEach(r => { key = Math.min(key, Math.round(r.top)); });
  let lineL = Infinity, lineR = -Infinity;
  rects.forEach(r => { if (Math.round(r.top) === key) {
    lineL = Math.min(lineL, r.left); lineR = Math.max(lineR, r.right); } });

  /* ---- the first word: first token to the first whitespace. Line 1
     begins the claim, so the claim's first word IS line 1's. */
  let end = txt.search(/\s/);
  if (end <= 0) end = txt.length;
  const wr = document.createRange();
  wr.setStart(node, 0); wr.setEnd(node, end);
  const wrects = [].filter.call(wr.getClientRects(), r => r.height > 4);
  let wl = Infinity, wR = -Infinity;
  wrects.forEach(r => { if (Math.round(r.top) === key) {
    wl = Math.min(wl, r.left); wR = Math.max(wR, r.right); } });
  /* a first word that somehow did not land on line 1 leaves the tab
     where it is rather than placing it somewhere invented */
  if (!(wR > wl)) return;

  const qb = q.getBoundingClientRect();
  /* if an ancestor is ever scaled, rects are in scaled px and `left` is
     not — divide it back out rather than silently drifting */
  const k = (q.offsetWidth ? qb.width / q.offsetWidth : 1) || 1;

  /* THE CLAMP HAS TO USE THE PAINTED EDGE, NOT THE BORDER BOX, and the
     first build of it did not: a +4deg rotation about the bottom-right
     corner throws the top-right corner a further offsetHeight*sin(4) to
     the right — 2.47px here — so clamping on offsetWidth/2 left the tab
     poking up to 2.4px past the line on every narrow-word issue.
     `ext` is that painted half-extent, derived rather than hard-coded so
     it stays right if the angle or the size ever moves: the distance
     from the tab's untransformed centre to its painted right edge, read
     once, before anything is written. Both reads are in the same batch
     as the Ranges above — no second layout pass. */
  const tb  = tab.getBoundingClientRect();
  /* translateX(-50%) makes the painted box centre on `left`, so `left` IS
     the centre and the extent is simply the painted right edge minus it.
     offsetLeft is the wrong reference here — it reports the box BEFORE
     the transform, which is half a tab away, and using it under-clamped
     by exactly that half. */
  const cur = parseFloat(getComputedStyle(tab).left) || 0;
  const ext = (tb.right - qb.left) / k - cur;

  /* v26h · START EDGE TO START EDGE. Centring was the wrong operation
     and לאפשר proved it: the word is 91.8px and the tab 58.4, so a
     centred tag sat INSIDE the word with a letter showing at each end —
     a redaction, not a tag. Anchored start-to-start the tag clips onto
     the front of the word and the rest of the word runs out from under
     it, which is what a tab on a thing looks like.
     wR is the word's start edge — its RIGHT edge, in RTL — and `ext` is
     the painted half-extent, so this puts the tab's painted start edge
     exactly on the word's. */
  let c = (wR - qb.left) / k - ext;
  /* CLAMP AT THE LINE'S START END, which in RTL is its right edge. The
     first word begins the line, so wR is lineR and this is now a no-op
     on every issue in data.js — kept because a first word that did not
     start the line would need it, and because it costs one comparison. */
  const startEnd = (lineR - qb.left) / k;
  if (c + ext > startEnd) c = startEnd - ext;

  tab.style.left = c.toFixed(2) + 'px';
}

function qBlock(text, extra) {
  const cls = 'b2q' + (extra ? ' ' + extra : '');
  /* T20 · the switch writes the size onto the block itself, so the CSS
     var has a value only when the comparison asked for one and the
     shipped default stays in the stylesheet where it belongs. Compared
     against the SHIPPED size, so ?qsize=26 is a no-op and the default
     path never writes an inline style. */
  /* T22b · the switch carries the tail with it, so a forced size is the
     whole pair rather than a claim at one step and a tail at another.
     An unlisted size falls back to the ratio, rounded. */
  const pair = Q_STEPS.filter(st => st.q === DEV.qsize)[0];
  const size = DEV.qsize !== 26
    ? ' style="--b2q-size:' + DEV.qsize + 'px;--b2q-tail:' +
      (pair ? pair.t : Math.round(DEV.qsize * 0.81)) + 'px"'
    : '';
  const t   = String(text || '');
  const i   = t.indexOf(Q_TAIL);            /* the tail STAYS on beat 2 */
  /* the tab is drawn in every branch: it labels the question, not the
     string, and a placeholder question is still the question */
  const tab = '<span class="b2q__tab">' + esc('תכלס') + '</span>';     /* TAMAR */
  if (i < 0 || i + Q_TAIL.length !== t.length)
    return '<p class="' + cls + '"' + size + '>' + tab + markGlossary(t) + '</p>';
  const claim = promptClaim(t);             /* T26 · the shared split */
  return '<p class="' + cls + '"' + size + '>' + tab + markGlossary(claim) +
         '<span class="b2q__tail">' + esc(Q_TAIL) + '</span></p>';
}

/* =====================================================================
   T27 · THE EXPANDING QUESTION BLOCK.

   IT TAKES THE CENTRE HUD SLOT FROM THE TOPIC PILL, and the topic name
   comes out with it: it is a filing label at the moment filing is
   irrelevant, and the name is already on the map node and on the map the
   player returns to.

   WHERE THE QUESTION MOVED FROM. T26 put it in the chyron as a two-line
   clamp beside the pinned vote. That is what the band is 8px shorter
   without: the chyron falls back to its own 44px min-height and the band
   goes 100 -> 92 at rest, while the question gains a state in which it
   can be read in full — all sixteen prompts, against the two-row clamp's
   six at 360.

   CREAM FILL AND INK TYPE IN BOTH STATES. The HUD's own pill language,
   not the black tag's: the coin pill beside it is cream and the band has
   to read as one family. The transition is height and the fade
   resolving, never a change of surface.

   IT IS ABSOLUTE, AND THAT IS THE WHOLE REASON THE ROUND DOES NOT MOVE.
   Expanding in flow would grow .hud and push the card down by the same
   number of pixels on every open. .hud-mid keeps a 36px floor so the row
   is the height it always was, and the panel grows out of it downward
   over the chyron — which is the one thing it is allowed to cover.
   ===================================================================== */
const QBAR_LBL = {
  /* the block names itself, because a bare question read out of context
     gives a screen reader no idea what it is looking at */
  name: 'השאלה של הסבב',                                        /* TAMAR */
  open: 'פתיחת השאלה המלאה',                                    /* TAMAR */
  shut: 'סגירת השאלה'                                           /* TAMAR */
};
/* T27 · THE DEMONSTRATION IS SPENT ONCE, EVER, on the same terms as
   T13's beacon: additive in the save, no SAVE_VER bump, and a store
   written before it restores false and demonstrates once. */
let QBAR_SHOWN = false;
let QBAR_OPEN  = false;

function qbarEl() { return $('#qbar'); }
/* T36 · THE HIT STRIP. A second, empty element rather than a pseudo-
   element on the pill, and that is forced rather than chosen: .qbar
   carries overflow:hidden and needs it — during the OPEN transition the
   text is already at its 3-line height while the pill is still growing
   through it, and without the clip those lines paint outside the pill.
   Anything hung off .qbar is inside that clip and therefore not
   hit-testable outside it, so the extra 4px has to live on a sibling. */
function qbarHitEl() { return $('#qbarHit'); }

/* THE CUT IS MEASURED, NOT ASSUMED. The fade is a property of a line
   that is actually too long — 13 of the 16 prompts at 390 — and putting
   it on the three that fit would be drawing an affordance for something
   that does not happen. scrollWidth against clientWidth on the collapsed
   single line is the only honest test, and it has to run after the
   webfont has applied or it answers for a fallback. */
function qbarMeasure() {
  const b = qbarEl(); if (!b) return;
  const t = $('.qbar__t', b); if (!t) return;
  b.classList.toggle('is-cut', !QBAR_OPEN && t.scrollWidth > t.clientWidth + 1);
}

/* the open height is the text's own, measured on the real node in the
   real width rather than derived from a line count — a prompt that wraps
   to four rows at 360 and three at 390 needs no branch anywhere. */
function qbarSetOpen(on) {
  const b = qbarEl(); if (!b) return;
  QBAR_OPEN = !!on;
  b.classList.toggle('is-open', QBAR_OPEN);
  b.setAttribute('aria-expanded', QBAR_OPEN ? 'true' : 'false');
  b.setAttribute('aria-label', (QBAR_OPEN ? QBAR_LBL.shut : QBAR_LBL.open) +
                               ' · ' + QBAR_LBL.name);
  const t = $('.qbar__t', b);
  if (QBAR_OPEN && t) {
    b.classList.remove('is-cut');
    b.style.height = (t.scrollHeight + QBAR_PAD) + 'px';
  } else {
    b.style.height = '';
    qbarMeasure();
  }
}
const QBAR_PAD = 16;                 /* 8px of padding top and bottom */

/* SET ONCE PER CARD, NOT PER FRAME. armPredict() calls this on every card
   of the cascade, which is also what closes a panel the player left open
   — the next card arrives with the question collapsed, every time. */
function qbarShow(text) {
  const b = qbarEl(); if (!b) return;
  const t = $('.qbar__t', b); if (!t) return;
  if (t.textContent !== text) t.textContent = text;
  b.hidden = false;
  /* T36 · the strip goes with the pill, always. A tap target for a panel
     that is not on screen is a tap target for nothing, and this one is
     invisible — there would be no way to see that it had been left
     behind. Mirrored here rather than by a CSS sibling selector because
     .hud-mid's children are moved around by pairHudProgress() and a
     selector that depends on their order would break silently. */
  const h = qbarHitEl(); if (h) h.hidden = false;
  qbarSetOpen(false);
}
function qbarHide() {
  const b = qbarEl(); if (!b) return;
  b.hidden = true; qbarSetOpen(false);
  const h = qbarHitEl(); if (h) h.hidden = true;
}

/* THE GESTURE. A tap on the panel is a tap; anything with travel in it is
   not, and must not be swallowed as one.

   PRESS AND RELEASE UNDER 10px CLAIMS THE EVENT and nothing else does.
   The toggle runs on pointerup rather than click so the decision is made
   with the travel in hand, and the click that follows is suppressed —
   without that, closing the question also registers as an interaction
   with whatever is under it.

   ANYTHING WITH MOVEMENT IS RELEASED. The panel drops pointer-events for
   the rest of that gesture, so a swipe that begins on it continues onto
   the card exactly as if the panel had not been there. */
const QBAR_SLOP = 10;
function wireQbar(b) {
  let sx = 0, sy = 0, moved = false, live = false;
  b.addEventListener('pointerdown', e => {
    live = true; moved = false; sx = e.clientX; sy = e.clientY;
  });
  b.addEventListener('pointermove', e => {
    if (!live || moved) return;
    if (Math.abs(e.clientX - sx) > QBAR_SLOP || Math.abs(e.clientY - sy) > QBAR_SLOP) {
      moved = true;
      /* hand the rest of the gesture to whatever is underneath */
      b.style.pointerEvents = 'none';
    }
  });
  const end = e => {
    if (!live) return;
    live = false;
    b.style.pointerEvents = '';
    if (moved) return;                       /* a swipe, not a tap */
    e.preventDefault(); e.stopPropagation();
    qbarSetOpen(!QBAR_OPEN);
  };
  b.addEventListener('pointerup', end);
  b.addEventListener('pointercancel', () => { live = false; b.style.pointerEvents = ''; });
  /* the click is the echo of the tap this already handled */
  b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
}

function buildQbar() {
  const mid = $('.hud-mid'); if (!mid || $('#qbar')) return;
  const b = el('button', 'qbar');
  b.id = 'qbar'; b.type = 'button'; b.hidden = true;
  b.setAttribute('aria-expanded', 'false');
  b.innerHTML = '<span class="qbar__t"></span>';
  mid.appendChild(b);
  wireQbar(b);
  /* T36 · THE 44px HIT AREA, AND IT SITS BEHIND THE PILL RATHER THAN
     OVER IT. z-index 0 against .qbar's 1 means every tap that lands on
     the pill still lands on the PILL — which is what keeps :active's
     press feedback working — and only the 4px bands above and below it
     reach this. Over the top it would have swallowed every press and the
     control would have stopped acknowledging touch.
     IT IS THE SAME GESTURE, NOT A SECOND ONE. wireQbar() toggles a
     global, so binding it here gives the strip the identical slop test,
     the identical swipe release and the identical click suppression; a
     second implementation is how the two would drift.
     NO WIDTH IS ADDED. The pill is already 205-235px wide, far past 44,
     so the strip takes .qbar's own inline box unchanged and the 8px and
     10px clearances to the coin pill and the ✕ are untouched — see the
     hit test in the report. Growing it sideways would have bought
     nothing and spent both. */
  const hit = el('div', 'qbar-hit');
  hit.id = 'qbarHit'; hit.hidden = true;
  hit.setAttribute('aria-hidden', 'true');       /* the button is the a11y surface */
  mid.appendChild(hit);
  wireQbar(hit);
}

/* IT OPENS ITSELF ONCE, on the player's first card of the game: the same
   motion the tap produces, run without one, so the affordance is
   demonstrated rather than labelled. No chevron, no caret, no "more".
   SKIPPED ENTIRELY UNDER REDUCED MOTION, the way nudgeCover() skips the
   tape's wiggle — a demonstration that resolves in 1ms is a flicker with
   no meaning, and the fade still says the line continues. */
function qbarDemo() {
  if (QBAR_SHOWN || DEV.qbar === false) return;
  if (DEV.qbar === null) { QBAR_SHOWN = true; saveState(); }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setTimeout(() => {
    if (!qbarEl() || qbarEl().hidden) return;
    qbarSetOpen(true);
    setTimeout(() => { if (QBAR_OPEN) qbarSetOpen(false); }, T.qbarHold);
  }, T.qbarAt);
}

/* ===================== BEAT 3 · THE BILL ============================ */
/* bill_title + bill_date ONLY, on the surface beat 2 already put up, over
   the MK card the bill is about. No new backdrop: the content swaps on
   the one that is already there. Dismiss COLLAPSES INTO the card. */
async function beat3(ov) {
  S.beat = 3;
  syncSndToggle('round');            /* T26 · beat 2 had it hidden */
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
    /* T26 · THE QUESTION GOES UP WITH THE CASCADE and comes down with it.
       Set once here rather than per card: armPredict() runs on every card
       and re-rendering the band nine times would rebuild the pinned pill
       — and its avatar — underneath a player who is looking at it. The
       pre-reveal gate and beat 5 both call repin(), which passes no line,
       so the band returns to the pill alone without anything having to
       remember to clear it. */
    /* T27 · THE BAND KEEPS THE VOTE AND GIVES UP THE QUESTION. Passing
       no line here is what takes .chyron back to its own 44px min-height
       and the band from 100 to 92; the question is the block's now. */
    pinVote(S.ownVote);
    qbarShow(bandQuestion(issue));                             /* T27 */
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
  /* T55 · THE LABEL IS ITS OWN SPAN so the punch can replace it rather
     than sit on top of it. Same shape beat 2's votes already use. */
  foot.innerHTML = VOTES.map(v =>
    '<button class="v-a" data-pred="' + v + '">' +
      '<span class="v-a__lab">' + VLABEL[v] + '</span></button>').join('');
  card.appendChild(foot);

  /* B2-4 · THE MK QUESTION IS A STICKER NOW, not a 17px line under the
     chyron. It slaps on the FIRST card of the cascade and then STAYS —
     it is parented to .cardwrap, so resolved cards swipe out from under
     it and the next one turns over beneath it without the sticker ever
     re-entering. Re-slapping on every card was the v17 board's own
     stated risk for this option ("it repeats on every card, which is
     where it may wear out"); one slap is the version that answers it. */
  /* BUILD-IB · 9 · AND ONLY ON THE FIRST ROUND OF THE GAME. `first` is
     the first CARD of this cascade and stays; askMkDue() is the first
     ROUND of the run. A player on round eleven has been told what to do
     ten times and the sticker is the loudest object on the card. */
  if (first && askMkDue()) slapAsk(ASK.mk);
  /* T27 · THE NEXT CARD CLOSES THE QUESTION. armPredict() runs once per
     card, so a panel the player left open on card three is collapsed by
     card four without a timeout anywhere — a timeout would fire while
     they were still reading it. */
  qbarSetOpen(false);
  if (first) qbarDemo();                                       /* T27 */
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

  /* T55 · THE PUNCH LANDS ON THE PRESSED BUTTON, ON THIS FRAME. No
     transition anywhere on it and none wanted: a hole punch is
     instantaneous, and anything that eases in reads as a fade, which is
     the exact thing this task removed. The physicality is carried by the
     sound, not by an animation on the mark.
     IT REPLACES THE LABEL. .v-a__lab goes to opacity:0 with transition:
     none (see proto.css), so the word does not show through the hole.
     IT IS THE SAME 38px .gx-punch THE STRIP CARRIES 440ms later — one
     object handed from the button to its stop, not two marks that
     resemble each other.
     T53'S RECESSION IS GONE and is-taken with it: the two unchosen
     buttons now do not move, fade or scale at all. See the T55 block in
     proto.css for what that knowingly leaves unsolved. */
  foot.querySelectorAll('.v-a').forEach(b => { b.disabled = true; });

  /* T57 · THE THREE BUTTON CENTRES, CAPTURED BEFORE foot.remove() TAKES
     THEM. These become the strip's stops, so the hole's x is literally the
     same number in both states. They cannot be expressed as a fraction:
     the buttons are flex:1 with a gap, so their centres are not at
     (2i+1)/6 of anything. */
  const stopX = {};
  foot.querySelectorAll('.v-a').forEach(b => {
    const r = b.getBoundingClientRect();
    stopX[b.dataset.pred] = r.x + r.width / 2;
  });

  /* THE STRIP IS BUILT NOW AND HELD HIDDEN, and that is not premature: it
     is the only way to place the hole on the strip's REAL stop rather than
     on one derived from tokens, which .mf-b's 3D projection puts 5px out.
     It is inert behind .gx--armed until the hold ends. */
  const g = axis(guess, p);
  card.appendChild(g);
  g.classList.add('gx--armed');
  const stops = gxPlaceStops(g, stopX, guess);
  const hole  = gxMark(stopX[guess], $('.gx-track', g));
  sfx('punch');                                                /* T55 */

  /* T27 · THE BLACK TAG RETIRES ON THE FIRST VERDICT. "נחשו מה הוא/היא
     הצביע/ה" earns card one and nothing after it: the card shows a face,
     a name and three buttons reading בעד · נמנע · נגד, and by card two
     the tag is the loudest object on the screen sitting directly under
     the block this item added to make room. It cannot re-slap — slapAsk()
     is called only under `first` in armPredict(), and retireAsk() removes
     the node — so this runs once and the cascade continues without it. */
  retireAsk();                                                 /* T27 */

  /* §1.2 the player's choice sits alone before the truth arrives — and
     T55 is what finally makes that true. The wait used to be --t-hold
     (640ms) spent staring at three unchanged buttons; it is now
     --t-punch-hold (440ms) spent looking at the mark they just made,
     with nothing else on screen moving at all. */
  await wait(T.punchHold);
  foot.remove();
  g.classList.remove('gx--armed');        /* T57 · gx-in starts here */

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
     it adds nothing to the card's box and cannot re-scale it. T57 built and
     appended it at the press; only the playing-out happens here. */
  await runAxis(g, guess, p.vote, stops);

  /* THE STAMP IS ONE PLANE, ON TOP. Parented to .cardwrap rather than the
     card because .mf-b carries overflow:hidden and would cut it at the
     edge, and because the card is a 3D flipper — a stamp inside it would
     be mirrored by the rotation. */
  const mark = stamp(ok);
  $('.cardwrap').appendChild(mark);
  card.classList.add('is-stamped');
  /* SOUND · the same file, fired at the start of the fall. Its press sits
     190ms in against this card's 200ms contact (ITEM 7 moved it) — 10ms
     early, which is well inside the window where a listener hears the
     sound and the jolt as one event, and the alternative is a second
     file whose offset could drift from the token. */
  sfx(ok ? 'stamp' : 'stampWrong');                             /* N2a */
  inkBleed(T.stampDropMk);
  /* §5 25ms AT CONTACT, not when the stamp is appended: --t-stamp-drop-mk
     is the frame the disc actually hits the card, and the jolt is keyed to
     the same number. The buzz and the hit are one event or neither.
     ITEM 7 moved that frame 190 -> 200ms, so all three moved together. */
  setTimeout(() => buzz('mkStamp'), T.stampDropMk);

  const table = COIN_TABLES[DEV.coins];
  /* §4 THE COINS LEAVE THE STAMP. Fired after the stamp has fully landed,
     so the flight follows the verdict rather than crossing it, and spawned
     AT the mark so the award has a place it came from.
     T53 · T.stamp -> T.stampLand. --t-stamp is hachach.css's 340, which
     ITEM 47 superseded for both stamps: the MK disc runs d2-land-mk for
     --t-stamp-land, 360ms. ITEM 47B already caught the same 20ms drift on
     the claim path and moved that site; these two were left behind, so the
     coins left and the card began its exit 20ms before the disc had
     finished settling. --t-stamp is NOT retuned — hachach.css:251 still
     drives its own d2-land from it. */
  if (ok) setTimeout(() => award(table.perCorrect, mark), T.stampLand);

  await wait(T.stampLand + T.flip);

  /* THE RESOLVED CARD IS SWIPED OFF, then the next one turns over. The
     player never sees a card replaced in place. */
  S.ci++;
  /* T24 · THE GATE GOES DOWN BEFORE THE THROW, not after it. On the last
     card the ground the deck is sitting on has to already carry the gate,
     or the throw reveals nothing and a screen has to arrive instead. */
  /* T57 · THE HOLE IS ON .cardwrap, SO THE SWIPE CANNOT TAKE IT. Everything
     else in this beat rides the card off screen; this one node would be left
     hanging over the next card's face. It goes on the frame the card starts
     leaving. */
  hole.remove();
  const last = S.ci >= S.dealt.length;
  if (last) layGate();
  leaveCard();
  await wait(T.cardExit);
  if (last) return preReveal();
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
  sfx(ok ? 'stamp' : 'stampWrong');   /* N2a · as the cascade's */
  /* ITEM 7 · the inverted round stamps the same MK card with the same
     disc, so it lands on the same 200ms contact as the cascade's. */
  inkBleed(T.stampDropMk);
  setTimeout(() => buzz('mkStamp'), T.stampDropMk);

  /* the floor plus the decaying bonus, paid from the stamp like every
     other cascade award — and shown for the first time here */
  const table = COIN_TABLES[DEV.coins];
  /* T53 · T.stamp -> T.stampLand, the same 20ms drift as the cascade */
  if (ok) setTimeout(() => award(table.perCorrect + INV_BONUS[step], mark), T.stampLand);

  await wait(T.stampLand + T.flip);
  S.ci++;
  layGate();                          /* T24 · see the cascade's tail */
  leaveCard();
  await wait(T.cardExit);
  return preReveal();
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
      '<span class="gx-m gx-you" style="right:' + stopPct(guess) + '%" ' +
        'role="img" aria-label="הניחוש שלך">' +
        /* T57 · NO .gx-punch HERE. The hole on .cardwrap IS the player's
           mark and it is already sitting at this exact stop; a second one
           inside the token would be the same object drawn twice. What is
           left is the label and the slot the MK's token is compared
           against. */
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

/* T57 · THE STOPS ARE THE BUTTONS' CENTRES, MEASURED. stopPct()'s
   (2i+1)/6 of the track sat 14.73px inside them at 390 — the buttons are
   flex:1 with an 18.2px gap in a 306px box, the track is 280px, and no
   fixed fraction reconciles the two. Called once, on a strip that is in
   the DOM but still hidden, so the track has a real box to measure.
   THE THREE STOPS STAY EVENLY SPACED AND SYMMETRIC, which is what the fill
   depends on: d1 and d2 remain exactly 1:2, and gx--d{dist} keys off the
   integer distance, untouched. */
function gxPlaceStops(g, stopX, guess) {
  const tr  = $('.gx-track', g).getBoundingClientRect();
  const pct = {};
  for (const v of VOTES)
    pct[v] = +(((tr.x + tr.width - stopX[v]) / tr.width) * 100).toFixed(3);
  $('.gx-you', g).style.right = pct[guess] + '%';
  $('.gx-mk',  g).style.right = pct[guess] + '%';
  /* the labels follow the tokens; as flex thirds they would now disagree.
     T58 · THE SAME VIEWPORT-INTO-LAYOUT BUG THE HOLE HAD, in the same
     function and shipped in the same commit. stopX and the row's rect are
     POST-scale; style.left is read PRE-scale. At 360x640 that put the three
     labels at 206.5/150.8/95.2 against button centres of 257.6/180/102.4.
     Invisible at 390x844 for the identical reason the hole's was: the
     effective scale there is exactly 1. The tokens themselves were never
     affected — they are placed with right:%, which is a fraction of the
     track's own box and so carries no units to convert. */
  const row = $('.gx-stops', g), rr = row.getBoundingClientRect();
  const rsc = rr.width / row.offsetWidth || 1;
  [...row.children].forEach((i, k) => {
    i.style.position  = 'absolute';
    i.style.left      = ((stopX[VOTES[k]] - rr.x) / rsc).toFixed(2) + 'px';
    i.style.transform = 'translateX(-50%)';
  });
  return pct;
}

/* T57 · THE HOLE, PLACED ON .cardwrap AT THE STRIP'S OWN STOP. Its x is the
   pressed button's centre and its y is the track's, both read off real
   boxes rather than computed from tokens — .mf-b's rect is a 3D projection
   and lies about the layout by 5px. Parented outside the foot and outside
   the card's flipper, so foot.remove() cannot take it and no transform can
   move it: same node, same coordinates, before and after. */
function gxMark(cx, track) {
  const wrap = $('.cardwrap'), wr = wrap.getBoundingClientRect();
  const tr = track.getBoundingClientRect();
  /* T58 · THE TWO COORDINATE SPACES ARE NOT THE SAME ONE, AND THAT SHIPPED.
     getBoundingClientRect returns POST-scale viewport pixels; style.left and
     style.top are read as PRE-scale layout pixels. .stack carries the
     --card-scale matrix above .cardwrap, so a viewport delta written
     straight into top/left renders SHORT by that factor — the hole landed
     113.9px above the track at 360x640 and 102.1px above it at 375x667,
     which is mid-card, on the MK's face.
     IT MEASURED CLEAN BECAUSE --card-scale IS EXACTLY 1.0000 AT 844 TALL,
     and every capture taken for T57 was at an 844-tall viewport. The delta
     is identically zero there, so the check could not see it. Any future
     measurement of this element has to run at a scaled profile as well.
     offsetWidth is the layout width and the rect's width is the rendered
     one, so their ratio IS the effective scale, whatever produced it — no
     need to read --card-scale or to know which ancestor applied it. */
  const sc = wr.width / wrap.offsetWidth || 1;
  const m = el('span', 'gx-punch gx-punch--mark');
  m.style.left = ((cx - wr.x) / sc).toFixed(2) + 'px';
  m.style.top  = ((tr.y + tr.height / 2 - wr.y) / sc).toFixed(2) + 'px';
  wrap.appendChild(m);
  punchCut(wrap, cx, tr.y + tr.height / 2, sc, m);
  return m;
}

/* T60 · EXPERIMENT · THE REAL CUT. Additive and removable: this function,
   its one call above, and one CSS block are the whole of it. Nothing here
   edits the disc -- .gx-punch's fill gradient and T56's tuned inset
   profile are untouched in the file, and the fill is suppressed through
   the new .is-cut class instead, so reverting is deleting rather than
   reconstructing.

   THE CUT IS ON THE FACE, NOT ON THE PUNCH. .gx-punch is a SIBLING of the
   card on .cardwrap -- parented there because .mf-b carries overflow:
   hidden -- so masking the punch itself would only reveal the card face
   beneath it. The mask goes on the face; the punch stays on top and keeps
   being the bore.

   ONE SELECTOR FOR BOTH SURFACES. The claim card is `mf-b b1card`, so it
   IS an .mf-b; the cascade face is .deckcard > .mf-b. `.mf-b.has-cut`
   reaches both without forking anything.

   MEASURED FROM THE FACE'S OWN RECT, not from .cardwrap's, so whatever
   offset or transform the face carries is already in the subtraction. The
   /sc is T58's conversion and is kept for the same reason: rects are
   POST-scale viewport pixels and custom properties are read as PRE-scale
   layout pixels, and --card-scale is exactly 1.0000 at 844 tall, which is
   where that difference is invisible.

   SUPPRESSED WHEN THERE IS NOTHING BEHIND, which is one rule covering two
   cases rather than two special cases. A cut to bare stage is not a hole.
     · the claim card on a round with no MK data -- S.dealt.length is 0, so
       beat 1 appends the card alone and the file says it "stands alone
       over the ground" by design;
     · the LAST cascade card -- flipUp() only builds a next card while
       i + 1 < S.dealt.length, so the final card has no paper under it.
   Both fall back to the filled disc, untouched. */
function punchCut(wrap, vx, vy, sc, m) {
  const owner = $('.deckcard.is-current', wrap) || $('.b1card', wrap);
  if (!owner) return;
  const face = owner.classList.contains('b1card') ? owner : $('.mf-b', owner);
  if (!face) return;
  /* THE TWO BARE-GROUND CASES ARE NOT THE SAME CASE, and only one of them
     is a reason to refuse the cut.
       · THE CLAIM CARD WITH NO DECK is a data artifact: S.dealt.length is
         0, beat 1 appends the card alone, and the file says it "stands
         alone over the ground" by design. A hole there exposes an absence
         rather than a depth, so it keeps the filled disc.
       · THE LAST CASCADE CARD is a normal moment every run reaches --
         flipUp() only builds a next card while i + 1 < S.dealt.length, and
         setPile() drops to zero leaves -- so the ground behind it IS the
         floor: #403E3A with .stage::before's dot grid, five transparent
         levels below .cardwrap. That is the surface the cards rest on and
         it is exactly what a hole in the last card should show. It also
         happens to be one of the two moments T55 named as the reason to
         build a real cut at all.
     So the refusal is scoped to the claim card rather than to "nothing
     behind". */
  const isClaim = owner.classList.contains('b1card');
  const backed = [...wrap.querySelectorAll('.deckcard, .b1card')].some(n => n !== owner);
  if (isClaim && !backed) return;
  const fr = face.getBoundingClientRect();
  face.style.setProperty('--cut-x', ((vx - fr.x) / sc).toFixed(2) + 'px');
  face.style.setProperty('--cut-y', ((vy - fr.y) / sc).toFixed(2) + 'px');
  face.classList.add('has-cut');
  m.classList.add('is-cut');
  /* WHICH GROUND THE BORE IS OVER, which is the same question `backed`
     already answered. Backed = the deck's #C4B48F paper; unbacked = the
     last cascade card, over #403E3A and the dot grid. The two need
     OPPOSITE treatments, not two strengths of one: paper has 107 levels
     of range to darken into, the floor has 38 and has to be LIFTED at the
     far wall instead. See the two --bore- pairs in proto.css. */
  m.classList.toggle('on-floor', !backed);
}

/* the strip, played out. Every duration is a token; see :root. */
async function runAxis(g, guess, vote, stops) {
  const you  = $('.gx-you', g), mk = $('.gx-mk', g), fill = $('.gx-fill', g);
  /* 1 · T55 · THE STRIP ARRIVES WITH THE PUNCH ALREADY AT ITS STOP, and
         this await is the strip's own fade FINISHING rather than a pause
         laid on top of it. gx-in runs for --t-gx-in from the moment
         axis() is appended, so waiting exactly that long is what
         guarantees the beat's ordering: the player's mark is fully
         settled before the MK's token begins to appear. Those two used to
         overlap by 90ms, because gx-in ran for --t-hold while this
         function was already three steps in underneath it.
         THE LOCK AND THE HOLD ARE BOTH GONE. --t-gx-lock drove the token
         DROPPING into its slot, which cannot happen now that the punch
         landed on the button 440ms ago and this is that same object
         continuing; and --t-gx-hold's pause has moved to the press, where
         the player spends it looking at their own mark instead of at
         nothing. Both tokens stay defined, as knobs. */
  await wait(T.gxIn);
  /* 2 · the MK's token appears in the PLAYER'S slot */
  mk.classList.remove('is-hidden');
  await wait(T.gxAppear);
  /* 3 · the fill travels to where the MK actually voted and carries the
         token with it. DISTANCE-PROPORTIONAL on one easing, so two slots
         of disagreement feel like twice one slot rather than like the
         same event with a different endpoint. */
  /* §3.1 · THE GAP IS COLOURED BY DISTANCE, and `dist` is already
     Math.abs() — which is what makes it symmetric BY CONSTRUCTION rather
     than by two branches that have to be kept in step. Guessed בעד /
     voted נגד and guessed נגד / voted בעד both give 2 and therefore the
     same class; there is no code path where the direction is read.
     It codes HOW FAR OFF, never WHICH WAY.
     T24 · AND THE HUE IS NO LONGER A VERDICT HUE, which is a separate
     point from this one and does not change a line here. The symmetry
     above was verified across all nine pairs and held; what did not hold
     was the AGREEMENT state, which tinted the whole track lime under
     stops labelled בעד · נמנע · נגד. See the note beside .gx-fill. */
  const dist = Math.abs(VOTES.indexOf(vote) - VOTES.indexOf(guess));
  g.classList.add('gx--d' + dist);
  const from = stops[guess], to = stops[vote];      /* T57 · measured */
  if (!dist) {
    /* agreement: there is nowhere to travel. A zero-length fill reads as
       a bug, so the pair settles in place instead and the player's token
       takes the badge treatment that keeps both readable in one slot. */
    you.classList.add('is-paired');
    mk.classList.add('is-paired-mk');
    g.classList.add('is-agreed');
    /* T57 · THE MK STEPS CLEAR OF THE HOLE, because the hole cannot move.
       Both land on the same stop on agreement, and the hole sits above the
       strip at z-index 9 — so without this the portrait is covered outright
       on every correct guess. TOWARD THE TRACK'S CENTRE, not a fixed
       direction: at the two outer stops a fixed one walks the portrait off
       the end of the track. 28px leaves them overlapping, which is what
       reads as a pair rather than as two separate answers. */
    const tw  = $('.gx-track', g).getBoundingClientRect().width;
    const dir = stops[guess] < 50 ? 1 : -1;
    mk.style.right = (stops[guess] + dir * (28 / tw * 100)).toFixed(3) + '%';
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
  /* 4 · the stamp lands after the token has settled, not with it */
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

   THE RULE, AND THE ONE HOLE PUNCHED IN IT. The locked guardrail is that
   THE PLAYER NEVER FAILS: no "לא נכון", no string that puts the player in
   the subject position of an error, because being wrong here is the
   Knesset surprising you. "הופתעת" said exactly that — it is something
   that happened TO the player.
   T6 · TAMAR OVERRODE IT ON 08 SEP, FOR THIS DISC AND NOTHING ELSE. The
   surprise stamp now reads "טעית!". The exception is deliberately narrow
   and the narrowness is load-bearing, so here is the exact blast radius,
   because the next person to edit this constant will need it:
     · stamp(ok) with no override is called from TWO places, and both are
       the SAME OBJECT — the disc on an MK card. cascade verdict() and the
       inverted round's invResolve(). That is the sanctioned surface.
     · the claim reveal calls stamp(ok, truth) and passes אמת / שקר /
       חלקית, so this constant never reaches the claim card.
     · the verdict PILL is CLAIM_MARK, a different constant on a different
       object. T6c · IT NOW CARRIES THE IDENTICAL PAIR — Lion's decision
       of 09 Sep, which widened the exception from one surface to two.
       The two constants are still SEPARATE, and deliberately: they are
       different objects on different planes, and one of them can be
       retuned without the other. If the pair is ever changed, change it
       in BOTH or the round speaks in two voices again — which is the
       thing T6c existed to fix.
     · the finale, the record and the share card are NOT included. The
       surprise framing is intact on all three and they were never fed by
       either constant.
   DO NOT GENERALISE THIS. Two surfaces is where Lion stopped it. A third
   is a new decision by him, not an extension of this one.
   THE PAIR MATCHES. The first pass of T6 left "צדקת" bare against a
   "טעית!" that had just gained a mark, which read as one of the two
   having been edited and the other forgotten — an exclamation is a
   loudness, and only one side was loud. Tamar closed it on 09 Sep.
   BOTH SIDES OR NEITHER, if this is ever retuned: these two strings are
   the same object in two states and the mark is part of the register,
   not part of the verdict. T6c · AND THE PILL IS NOW A THIRD AND FOURTH
   COPY OF THE SAME TWO WORDS, so "both sides" means all four — see
   CLAIM_MARK, which carries the identical pair and says why.

   `ring` is retired with the ring text and is not read anywhere. */
const D2_COPY_PLACEHOLDER = {
  correct:  'צדקת!',                             /* TAMAR · 09 Sep */
  surprise: 'טעית!'                              /* TAMAR · T6, 08 Sep */
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
/* ITEM 7 · `drop` IS THE CONTACT TIME, and it has to be a parameter rather
   than a constant: the claim stamp still falls for 190ms and the cascade's
   now falls for 200, and the ink has to rupture on whichever frame the
   disc it belongs to actually hits. Defaulting to T.stampDrop keeps every
   existing caller on the claim's clock. */
function inkBleed(drop) {
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
  }, drop == null ? T.stampDrop : drop);
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
/* T34b · זה IS OPTIONAL. The pattern required it, and three issues open
   with the bare form — v2 "נכון.", s1 "לא נכון —", s2 "נכון —" — so the
   stripper matched nothing on them and their modals opened by restating
   the verdict, which is the single thing this regex exists to prevent.
   It was survivable while the sentence sat mid-board; it is the modal's
   first line since T12. Not a copy change: the decision was already
   taken, this is the decision actually reaching all sixteen issues. */
const VERDICT_OPENER = /^\s*(?:זה\s+)?(?:לא\s+)?נכון\s*[!.,–—-]*\s*/;   /* TAMAR */
/* T34c · WHAT MAKES A REMAINDER UNABLE TO STAND ALONE. A vav bound to
   the front of a word IS the conjunction "and" in Hebrew — it is not a
   separate token — so the test is the prefix, not a word list. The three
   standalone conjunctions are named because they are words in their own
   right and no prefix rule would catch them.
   THE ONE FALSE POSITIVE THIS RULE CAN HAVE is a noun whose root simply
   begins with vav: ועדה / ועדת, "committee", occurs in these sixteen
   explanations. It never occurs in FIRST position, which is the only
   position this tests, so the rule is correct on all sixteen today —
   but a rewrite that opens a remainder on ועדת חקירה would keep an
   opener it does not need. Measured, and in the report. */
const LEADING_CONJ = /^(?:ו[א-ת]|אבל\s|אך\s|אלא\s)/;                   /* TAMAR */
function explainSplit(text) {
  const t = (text || '').trim();
  if (!t) return { first:'', rest:'' };
  /* T34c · DO NOT STRIP INTO A DANGLING CONJUNCTION. s1 reads
     "לא נכון — ובג״ץ דאג שזה יישאר ככה", where the ו־ conjoins the clause
     to the verdict; take the verdict away and the sentence opens on an
     "and" with nothing behind it. Weighed the two failures: a modal that
     opens mid-sentence reads as broken to every player who gets that
     issue, and a modal that restates the verdict is an impurity only we
     notice. The second is the lesser evil, so the whole opener stays.
     A RULE, NOT A CASE FOR s1: any remainder that cannot stand on its own
     keeps its opener. It fires on TWO of the sixteen — see the report. */
  const cut  = t.replace(VERDICT_OPENER, '');
  const body = (!cut || LEADING_CONJ.test(cut)) ? t : cut;
  const parts = body.split(/(?<=[.!?])\s+/).filter(p => p.trim());
  if (!parts.length) return { first:'', rest:'' };
  let first = parts[0], rest;
  if (first.length < 40 && parts.length > 1) { first += ' ' + parts[1]; rest = parts.slice(2).join(' '); }
  else rest = parts.slice(1).join(' ');
  return { first: first.trim(), rest: rest.trim() };
}

/* T34b · WHAT THE BOARD'S ONE LINE IS ALLOWED TO PROMISE.
   The line used to branch on links.length, which asks "is there anything
   behind this door" and answers with a sentence about VIDEO. Seven of the
   sixteen issues have something behind the door and no video in it —
   e1, v1, s1 and m1 carry only the Knesset vote page, b1, g1 and g2 carry
   only articles — so nearly half the game offered a video it did not
   have. Four states now, and the test is the content itself.

   A LINK IS A VIDEO BY ITS HOST, WITH THE LABEL AS A SECOND CHANCE.
   Host first because that is what the player will actually get: a2's one
   link is labelled כתבה and points at YouTube, and it is a video whatever
   the label calls it. The label test catches the reverse case — a video
   on a host not in this list — and costs nothing today, because every
   issue it would catch the host test already catches. */
const VIDEO_HOST =
  /(?:^|\.)(?:youtube\.com|youtu\.be|vimeo\.com|facebook\.com|fb\.watch)$/i;
function isVideoLink(l) {
  if (!l) return false;
  if (/^\s*סרטון/.test(l.label || '')) return true;          /* TAMAR's own word */
  let h = '';
  try { h = new URL(l.url).hostname; } catch (e) { return false; }
  return VIDEO_HOST.test(h);
}
/* `links` is further_links PLUS the synthesised Knesset row, so the
   Knesset-only case is read off further_links rather than off the merged
   list — otherwise "one link" and "one link that this function put there
   itself" are indistinguishable. */
function readKind(iss, links) {
  if (!links.length) return 'none';
  const fl = iss.further_links || [];
  if (fl.some(isVideoLink)) return 'video';
  return fl.length ? 'article' : 'knesset';
}
/* TWO OF THE FOUR ARE PLACEHOLDERS AND THEY LOOK LIKE IT.
   ph()'s hazard fill, in the [טקסט — תמר: …] form the pre-round sheet
   already uses, and the text describes the BRANCH rather than proposing
   copy for it — nothing here is a guess at what the line should say.
   body.no-ph is the default build and hides .ph, which would leave the
   board with an empty button, so beat 5's line takes the same narrowly
   scoped exception .f5res and .pr-ph already take. When Tamar's two
   strings land, both ph() calls go and the CSS exception goes with
   them. */
const F5_LINE = {
  video:   'לסרטונים ועוד מידע על הנושא',   /* TAMAR · shipped, and now only where it is true */
  none:    'עוד על ההצבעה',                 /* TAMAR · shipped; v2 and s2, nothing behind the door but the explanation */
  article: null,                             /* TAMAR — placeholder, see below */
  knesset: null,                             /* TAMAR — placeholder, see below */
};
const F5_LINE_PH = {
  article: '[טקסט — תמר: כתבות בלבד, אין סרטון]',        /* TAMAR — placeholder */
  knesset: '[טקסט — תמר: רק ההצבעה באתר הכנסת]',        /* TAMAR — placeholder */
};
function f5LineHtml(kind) {
  return F5_LINE[kind] ? esc(F5_LINE[kind]) : ph(F5_LINE_PH[kind]);
}

/* ===================== 4.5 · THE PRE-REVEAL =========================
   ITEM 32. A held screen between the last MK card and the finale: the
   cascade has ended, nothing has been revealed, and the player presses to
   see the result. It exists so the reveal is something they ASK for
   rather than something that arrives while the last card is still
   leaving.

   T11 · WHAT THE SCREEN IS NOW. The last card flies off and what is left
   is THE GROUND — the same charcoal dot-grid surface that has been behind
   the deck since the round opened. Not a panel on the ground and not a
   card-shaped object on it: nothing is drawn here at all, because the
   surface is already painted by #stage and .stage::before and every
   container between a card and the stage is transparent. The deck's exit
   is therefore the whole reveal; there is nothing to uncover and nothing
   to fade in behind it.

   TWO THINGS ON IT, AND THEY HAVE DIFFERENT LIFETIMES.
     · THE GATE IS EVERY ROUND. It is the press that asks for the result
       and the round does not advance without it.
     · THE EXPLANATION IS ONCE EVER. It answers "what is about to happen"
       and that question is only asked the first time. PRE_HOW_SEEN is
       written when it is SHOWN, not when the gate is pressed — the same
       contract maybeMapIntro() uses — because a player who reads it and
       leaves has still read it.
   Those two are deliberately not one condition. Gating the whole screen
   on the flag would delete the press, and the press is the item.

   NO CONFETTI AND NO COUNT-UP. Both belong elsewhere and both are locked:
   confetti to 8/8 map completion, the count to the finale board. This
   screen holds still.

   BOTH STRINGS ARE WRITTEN. The hazard placeholder this screen used to
   carry is gone: Tamar's line is the EXPLANATION and לתוצאות › is the
   button, which is the way round they were always meant to be. .pr-ph is
   no longer used here — it still exists for beat 3's unwritten line and
   is untouched.

   S.beat is 4.5 on purpose: exitRound() treats > 1 and < 5 as mid-round,
   so leaving here still asks for confirmation, which is right — the
   record is written by beat 5 and nothing is saved yet. */
/* =====================================================================
   T22 · THE PRE-REVEAL'S CHAIR BUDGET, AND IT IS v27's, NOT A NEW ONE.
   Same shape as fitBeat2(): the bottom of the column is the interaction
   and never moves — the gate keeps its height, the explanation keeps
   whatever its two lines need, the gaps are the gaps — and the chair is
   the remainder. Measured as a remainder rather than re-derived term by
   term, for the reason v27 gives: the terms are spread across a rule and
   a flex gap, and a re-derivation drifts the first time one of them
   moves while the remainder cannot.

   THE FLOOR IS v27's 150px, DELIBERATELY THE SAME NUMBER. Below it the
   chair stops being the thing the screen is about and becomes an icon
   beside a button, which is the failure that floor is on record for. If
   the remainder comes in under it the chair does NOT squash further — it
   takes the floor and the column absorbs the difference, which on this
   screen it can because the column is centred with slack rather than
   packed like beat 2's.

   THE CEILING IS 210, NOT BEAT 2's 330. This is a callback, not a
   reprise: at beat 2's size the same object twice in ninety seconds
   reads as the same screen returning, and the gate stops being the thing
   the eye lands on. 210 is comfortably a chair — beat 2 itself runs down
   to 180 on the long questions — and comfortably not beat 2's.

   IT CANNOT REACH THE HUD, and that is structural rather than computed
   here. This beat lives inside .round, which is a flex sibling BELOW the
   HUD in the stage's column; beat 2's chair could only ever pass behind
   the pills because its overlay is inset:0 over the whole stage. The
   clearance is measured in the report against T20's 14px rule and comes
   in far above it, but nothing here has to defend it.
   ===================================================================== */
const PR_CHAIR_MAX = 210;
const PR_CHAIR_MIN = CHAIR_MIN;      /* v27's 150, named once */
/* BUILD-IB · 12 · the field's own two constants, derived from SEAT_VB
   and p4()'s chair paste and written down so nothing re-derives them:
   745/458 is the drawn extent's ratio, and the chair is 268 of that 458.
   Change SEAT_VB and these move with it. */
const PR_FIELD_AR    = 745 / 458;    /* 1.6266 */
const PR_FIELD_CHAIR = 268 / 458;    /* 0.5851 */

function fitPreReveal(b) {
  const chair = $('.pr-chair', b); if (!chair) return;
  const cs = getComputedStyle(b);
  /* THE COLUMN IS CENTRED, WHICH IS WHY scrollHeight IS NO USE HERE.
     beat 2's inner is packed and its scrollHeight IS its content;
     .prereveal is justify-content:center inside a flex:1 box, so
     scrollHeight is clamped to clientHeight and reading it back gives
     the room rather than the content in it. The rest is summed from the
     children instead, plus the gaps between them, which is the same
     "measured, not re-derived" contract fitBeat2() keeps — it is just
     that on a centred column the measurable thing is the children. */
  const avail = b.clientHeight
              - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const gap = parseFloat(cs.rowGap) || 0;
  const kids = [].slice.call(b.children);
  const rest = kids.reduce((a, n) =>
        a + (n === chair ? 0 : n.getBoundingClientRect().height), 0)
      + gap * Math.max(0, kids.length - 1);

  let target = avail - rest;
  if (target > PR_CHAIR_MAX) target = PR_CHAIR_MAX;
  if (target < PR_CHAIR_MIN) target = PR_CHAIR_MIN;

  /* BUILD-IB · 12 · THE BUDGET NOW SIZES THE FIELD, AND THE CHAIR IS A
     PROPORTION OF IT. Everything above is unchanged: `target` is still
     the chair height the vertical budget can afford. What changed is
     that the chair is no longer a free object -- it stands in the pool
     at the poster's own proportions, so sizing it directly would slide
     it out of the light. The field is sized instead and the chair
     follows in CSS.
     WIDTH IS THE SECOND CONSTRAINT AND IT USUALLY WINS. The field is
     1.63:1, so a 210px chair asks for a 359px height and a 584px width
     -- wider than either target stage. Where the width binds, it sets
     the size and the chair comes out smaller than PR_CHAIR_MAX; that is
     the field being complete rather than the chair being cropped, and
     cropping the outer rows is the one thing that could make the count
     unreadable. */
  const availW = b.clientWidth
               - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  let fh = target / PR_FIELD_CHAIR;                 /* the field the chair asks for */
  let fw = fh * PR_FIELD_AR;
  if (fw > availW) { fw = availW; fh = fw / PR_FIELD_AR; }
  const field = $('.pr-field', b);
  if (field) { field.style.width = fw.toFixed(2) + 'px'; field.style.height = fh.toFixed(2) + 'px'; }
  chair.style.height = '';        /* the field owns it now — see .pr-chair */
}

/* =====================================================================
   T19 · THE PROGRESS PILL JOINS THE COIN PILL, AND IT IS MOVED FROM HERE
   RATHER THAN FROM THE MARKUP. index.html is Roman's and puts
   #hudProgress inside .hud-mid, the centred slot it shares with the
   round's topic title. One appendChild at boot takes it out of that slot
   and puts it beside .hud-coins instead; nothing else about the HUD moves
   and the markup keeps working if this never runs.

   BEFORE THE COIN PILL, NOT AFTER. The HUD is RTL, so DOM order runs
   right to left and inserting after would put the progress pill at the
   far edge with the coins inboard of it — the coin chip would move. The
   coin chip has been at that edge since the first build and is what the
   award animation flies to; inserting before leaves it exactly where it
   is and brings the progress pill in beside it.

   IT IS THE MAP'S PILL ONLY, which is worth stating because this is a
   shared HUD. #hudProgress is hidden on the round — the topic title has
   the middle there — so on that screen this function moves a hidden node
   and changes nothing. Verified in the report at both widths.

   WHAT IT LEAVES: an empty centre on the map. See the report; it is
   deliberate as far as this change goes and nothing was invented to
   fill it. */
function pairHudProgress() {
  const hud = $('.hud'), pr = $('#hudProgress'), coins = $('.hud-coins');
  if (!hud || !pr || !coins) return;
  hud.insertBefore(pr, coins);
}

function seenPreHow() {
  if (DEV.preHow !== null) return !DEV.preHow;
  return PRE_HOW_SEEN;
}
function markPreHowSeen() {
  /* an override never spends the player's one first run — the same
     contract markMapIntroSeen() and spendAvBeacon() keep */
  if (DEV.preHow !== null) return;
  if (PRE_HOW_SEEN) return;
  PRE_HOW_SEEN = true;
  saveState();
}

/* =====================================================================
   T24 · THE GATE IS ALREADY LYING ON THE GROUND, AND THE DECK IS ON TOP
   OF IT.

   WHAT IT REPLACES. preReveal() opened with r.innerHTML = '' and then
   faded its three parts up on an empty ground. So the last card left, the
   round went black for the length of one frame, and a screen ARRIVED —
   two events with a join in them. That is the opposite of the reading
   T11 settled for this screen: what is left when the deck goes is the
   ground, and the ground was always there.

   NOW IT IS LAID DOWN BEFORE THE LAST CARD IS THROWN, underneath the
   deck, and the throw REVEALS it. Nothing arrives, so nothing has to
   fade: the three parts lose .b5stage entirely.

   THE STACKING. .round is a flex column and .beat is flex:1, so two beats
   would sit one above the other. .has-gate switches .round to a one-cell
   grid and puts both beats in that cell, which is the SAME BOX flex:1
   gave them — that is the whole reason it is a grid and not an absolute
   inset, which would have resolved against the padding box and dropped
   the gate 26px. So there is no reflow when the deck goes and the class
   comes off: the gate's box is identical before and after.
   UNDER MEANS UNDER. .is-under takes z-index 0 against the cascade's 1
   and pointer-events:none, so a gate that is half visible around a
   340px card cannot take the tap meant for the card on top of it.
   ===================================================================== */
function layGate() {
  const r = $('#round');
  const had = $('.prereveal', r);
  if (had) return had;

  const firstTime = !seenPreHow();
  if (firstTime) markPreHowSeen();
  const b = buildGate(firstTime);
  r.classList.add('has-gate');
  /* FIRST child, so it is under the cascade in paint order as well as in
     z-index — one of the two would be enough and both is cheaper than
     explaining which. */
  r.insertBefore(b, r.firstChild);
  fitPreReveal(b);
  return b;
}

/* =====================================================================
   BUILD-IB · 12 · THE SEAT FIELD. THE CHAIR SITS INSIDE THE 120.

   THE GEOMETRY IS LIFTED, NOT RECONSTRUCTED. Every number below is
   explorations/v31/build.py, p4() -- the Open Graph poster -- read out of
   the source: centre (600,486), y squashed 0.92, a 118-degree span,
   seats as 22x20 rounded rectangles at radius 5, fill #605950, outline
   #1A1815 at 2px, and floorpool() at (600,512) as 52 nested ellipses of
   rgb(255,214,10) at 200x34 with peak 26. The one thing that is NOT the
   poster's is the row table, and that is deliberate -- see below.

   FIVE ROWS, NOT SIX, AND THE ARITHMETIC IS THE ARGUMENT. The poster
   runs [214,14] [266,18] [318,22] [370,26] [422,30] [474,10]: six rows
   at ~30px pitch across radii 214-474 want 148 seats, the field must be
   120, so a short sixth of ten finishes the count on a 331px stub of arc
   above an 869px one. At 360 that reads as ten seats set apart from 110,
   which is the one thing in this whole surface that is mistakable for a
   bloc. 16/20/24/28/32 is exactly 120 with every row at the full 118
   degrees and every pitch within 1.35px of every other -- measured
   28.04 to 29.38 -- and the field gets shallower with it (outer arc 474
   -> 422), which at 360 stops it crowding the chair.s shoulders.
   THE POSTER IS NOT CHANGED. It now diverges from the game surface, and
   that is expected: the same twelve numbers in p4() would have to move
   to match, and the poster is shipped work.

   THE 121st IS NOT A GAP IN THE FIELD. Nothing is missing, marked,
   removed or left empty -- an empty slot among 120 filled ones is a
   diagram of an outcome, and the field must not be one. It is LIT FLOOR:
   the pool is the player.s own yellow and the thing standing in it is
   the chair. The empty seat is expressed as light.

   THE GUARDRAIL, AND IT IS A CONSTRAINT ON THE DRAWING, NOT A NOTE:
   one fill, one outline, one size across all 120. No hue on any seat.
   No grouping, no ordering, no spacing that could read as a side. The
   only colour anywhere in this function is the player.s yellow, as light
   on the floor, and it never touches a seat. If a future change puts a
   second fill in here, that change is wrong.
   ===================================================================== */
const SEAT_ROWS = [[214,16],[266,20],[318,24],[370,28],[422,32]];  /* = 120 */
const SEAT_VB   = { x:227, y:88, w:745, h:458 };   /* the drawn extent, measured */

function seatFieldSvg() {
  const CX = 600, CY = 486, SQ = 0.92, SPAN = 118;
  let seats = '', n = 0;
  for (const [r, cnt] of SEAT_ROWS) {
    for (let i = 0; i < cnt; i++) {
      const a = (180 + (180 - SPAN) / 2 + SPAN * (i / (cnt - 1))) * Math.PI / 180;
      const sx = CX + r * Math.cos(a), sy = CY + r * Math.sin(a) * SQ;
      /* ONE rect, ONE fill, ONE outline, ONE size. The only thing that
         differs between any two of the 120 is x and y. */
      seats += '<rect x="' + (sx - 11).toFixed(2) + '" y="' + (sy - 10).toFixed(2) +
               '" width="22" height="20" rx="5"/>';
      n++;
    }
  }
  /* floorpool(), 52 nested ellipses, largest and faintest first so each
     one paints over the last -- which is what builds the falloff. */
  let pool = '';
  for (let i = 0; i < 52; i++) {
    const k = i / 52, w = 200 * (1 - k * .62), h = 34 * (1 - k * .62);
    pool += '<ellipse cx="600" cy="512" rx="' + w.toFixed(2) + '" ry="' + h.toFixed(2) +
            '" fill="rgba(255,214,10,' + ((4 + 26 * k) / 255).toFixed(4) + ')"/>';
  }
  return '<svg class="pr-field__svg" viewBox="' + SEAT_VB.x + ' ' + SEAT_VB.y + ' ' +
           SEAT_VB.w + ' ' + SEAT_VB.h + '" aria-hidden="true" focusable="false">' +
           '<g class="pr-seats">' + seats + '</g>' + pool +
         '</svg>';
}

async function preReveal() {
  S.beat = 4.5;
  const r = $('#round');
  /* laid down already on the cascade's path; built here for any other —
     ?screen deep links and the inverted round's early exits — so this
     function still works when nothing has laid a gate for it. */
  const b = layGate();
  /* THE DECK GOES AND THE GATE IS WHAT IS LEFT. Not innerHTML = '': that
     would take the gate with it and put us back to building a screen. */
  [].slice.call(r.children).forEach(n => { if (n !== b) n.remove(); });
  r.classList.remove('has-gate');
  b.classList.remove('is-under');
  helper('');
  repin();
  armGate(b);
}

/* the gate's own markup, built once and unchanged by T24 — it is only
   built EARLIER now, and by layGate() rather than here. */
function buildGate(firstTime) {
  /* NO BOX. Not a sheet, not a card, not the deck's rectangle — the first
     attempt built a 340x620 kraft panel in the cardwrap and it read as
     one more card being dealt, which is the opposite of what the beat is
     for. What is left when the deck goes is the GROUND, and the ground is
     already there: #stage paints it and .stage::before draws the dot grid
     over it, and every container between a card and the stage — .cardwrap,
     .stack, .beat, .round, .screen — paints nothing at all. So this
     builds no surface. It puts two objects on the one that is already
     under them.
     COMPOSED FOR THE SPACE, NOT FOR THE RECTANGLE. .prereveal centres its
     own content in the round area rather than reproducing where the card
     box sat: the deck's footprint was a consequence of card artwork, and
     inheriting it here would be inheriting a measurement that no longer
     has anything to measure. */
  const b = el('div', 'beat prereveal is-under');
  b.innerHTML =
    /* T22 · THE CHAIR, AT REST, AND IT IS BEAT 2'S. Same asset off the
       same manifest entry, so there is one chair in the game and this is
       it again rather than a second drawing of it. The screen was one
       button in a very large charcoal field on every round after the
       first; the chair is the object the player already reads as "the
       Knesset is about to do something", and it gives the gate something
       to sit under — which is the arrangement beat 2 has trained them on.
       AT REST MEANS AT REST. No breath, no float, no glow: the gate is
       the thing being offered and a second moving object beside it would
       split the invitation. The chair is the setting. */
    /* BUILD-IB · 12 · the chair is IN the field now, not above it. One
       positioned wrapper carries both, at the poster's own proportions,
       so the chair lands in the pool the way p4() composed it rather
       than by a number tuned here. NO CONTAINER: the wrapper paints
       nothing -- no fill, no edge, no radius. It is a coordinate space. */
    '<div class="pr-field">' + seatFieldSvg() +
      '<img class="pr-chair" src="' + ROOT +
        (M.props.chair['900'] || M.props.chair['300']) + '" alt="">' +
    '</div>' +
    /* THE EXPLANATION, FIRST ROUND ONLY, and it is written now — the
       hazard placeholder this screen carried is gone with it. It goes
       through t() because it speaks to the player; see COPY.revealHow. */
    (firstTime
      ? '<p class="pr-head">' + esc(t('revealHow')) + '</p>'   /* TAMAR */
      : '') +
    /* T11 · לתוצאות › — a destination, one line at every width, and the
       chevron is the same one לשלב הבא › carries so the two advancing
       presses in the round read as the same gesture. NOT through t():
       there is nothing here to agree with. */
    '<button type="button" class="p-c pr-go">' +
      esc('לתוצאות ›') + '</button>';                          /* TAMAR */
  return b;
}

/* the rest of preReveal(), after the deck has gone. */
function armGate(b) {
  sizeStage();
  fitPreReveal(b);
  /* T24 · NO .b5stage HERE ANY MORE. The three parts used to be added
     with opacity 0 and faded up one frame later, because they were
     arriving. They were already on the ground before the last card was
     thrown, so there is nothing to arrive and a fade would be the screen
     asserting an entrance it did not make. */

  /* T21 · THE INTRO'S BREATH, THE SAME ONE. startBreath() is the whole
     policy in three lines — it refuses under reduced motion and it stops
     on the first press — so calling it is also how this gate inherits
     both of those. The CSS above lists .pr-go beside .i-cta on one rule
     rather than copying the keyframes. */
  const gate = $('.pr-go', b);
  startBreath(gate);

  /* T21 · THE PRESS HANDS OVER, IT DOES NOT CUT. beat5() opens with
     r.innerHTML = '', so the gate used to vanish on the same frame the
     board was built and the board faded up 6px in place: two events, and
     the join between them was the one moment the screen had nothing to
     say. The gate now falls 32px and out, and the board falls 34px and
     in from above — see .prereveal.is-out and .f5board.b5stage. Same
     direction, so it reads as one motion.
     THE WAIT IS THE EXIT'S OWN DURATION and is read from the token
     rather than typed, so retuning --t-exit moves both halves together.
     Reduced motion skips it outright: the CSS kills the transition, and a
     wait for a transition that will not run is a delay with nothing in
     it. */
  pressable(gate).addEventListener('click', () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return beat5();
    b.classList.add('is-out');
    setTimeout(beat5, T.exit);
  }, { once:true });
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
  /* THE BOARD IS NOT BUILT WHEN IT WOULD BE EMPTY, and that is a change of
     kind rather than of degree. Without a tally the board's whole content
     is issue.vote_result, and that field is empty on every active issue —
     so what shipped was .f5board--prose collapsed to its own 11px/10px
     padding: a 21px lit bar, keeping its fill, its inset hairline, its
     extrusion and its glow, and arriving FIRST, as the peak of the beat.
     An empty lit bar at the peak is worse than no bar.
     There is no substitute copy and no hairline fallback: with nothing to
     say, the board does not exist, the plate becomes the first object, and
     the beat's own rule still holds — the loudest thing on screen is the
     only account of the outcome there is. The placeholder branch goes with
     it, so this beat cannot paint a hazard stripe even with ?placeholders=on. */
  /* ITEM 11b · WHERE THE TOKEN LANDS IS THE PLAYER'S VOTE, and until now
     it was always בעד: #f5slot was written into the FOR cell whatever the
     player had said, so a נגד vote flew across the board and landed beside
     a number it had not contributed to. The slot is built into the side
     that matches instead, and נמנע gets the majority line — see
     .f5slot--maj. It is still ONE slot, holding its size from the first
     frame, so the numerals do not shift when the avatar arrives.
     NO POSITION IS TREATED AS נמנע. S.position is null only if beat 5 is
     reached without a vote, which the round does not do today; landing on
     the line and ticking nothing is the honest degradation, and it can
     never add a vote the player did not cast. */
  const mySide = S.position === 'for' ? 'for'
               : S.position === 'against' ? 'ag' : 'maj';
  const slotIn = k => mySide === k ? '<span class="f5slot" id="f5slot"></span>' : '';
  const hasBoard = !!(tally || issue.vote_result);
  const board = hasBoard
    ? el('div', 'f5board b5stage' + (tally ? ' f5board--num' : ' f5board--prose'))
    : null;
  if (board) board.innerHTML = tally
    ? '<div class="f5row">' +
        '<div class="f5cell">' +
          '<p class="f5lab">' + esc(VLABEL.for) + '</p>' +
          '<div class="f5n f5n--for"><b id="f5for">0</b>' +
            slotIn('for') + '</div>' +
        '</div>' +
        '<div class="f5dash" aria-hidden="true">—</div>' +
        '<div class="f5cell">' +
          '<p class="f5lab">' + esc(VLABEL.against) + '</p>' +
          '<div class="f5n f5n--ag"><b id="f5ag">0</b>' +
            slotIn('ag') + '</div>' +
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
        '<span class="f5majlab">' + N(MAJORITY) + '</span>' +
        (mySide === 'maj'
          ? '<span class="f5slot f5slot--maj" id="f5slot"></span>' : '') +
        '</div>'
    : '<p class="f5prose">' + esc(issue.vote_result) + '</p>';
  if (board) {
    b.appendChild(board);
    requestAnimationFrame(() => { board.classList.add('is-in'); f5Place(b, board); fitBeat(); });
  }

  if (tally) await runCount(board, tally);
  /* the prose hold is the board's own beat. With no board there is nothing
     on screen to hold ON, so waiting here would be a pause on an empty
     stage before the plate arrives. */
  else if (board) await step(T.f5Prose);

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
  /* ITEM 11a · THE RECORD HOLDS, ALONE, BEFORE ANYTHING IS ADDED TO IT.
     500ms with the count settled and nothing else on screen. This is the
     historical result — what the Knesset actually did — and it has to be
     readable as that before the player's own vote is put on top of it,
     or the two are one number and the distinction the beat exists to
     make is gone. The twin keeps the shorter --t-f5-gap: it has no count
     to hold on, and 500ms of a settled prose board is a pause. */
  await step(tally ? T.f5Hold : T.f5Gap);
  await flyToken($('#f5slot', b));
  /* ITEM 11c/d · and then, once the token has settled, the board counts
     it. Awaited in full, so nothing else on the beat starts while it
     runs. */
  if (tally) { await step(T.f5TickAt); await tickVote(board, tally); }

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
    /* ITEM 51A · THE VERB IS READ OFF THE TALLY. It was the literal
       'ההצעה עברה' with no test at all, so e3 (27—42) and g2 (36—47) —
       both REJECTED — announced that the proposal had passed, directly
       above the numbers that said it had not. Twelve of the fourteen
       issues with a tally pass, which is why it survived this long.
       A TIE TAKES THE REJECTED BRANCH. A motion that does not reach a
       majority does not carry, so `for > against` is the whole test. No
       issue in the data ties, so this is written from the rule rather
       than from a case that can be looked at. */
    const passed = tally.for > tally.against;
    /* ITEM 51B · THE NUMBERS COME OFF THIS LINE. They were stated three
       times in three inches of screen: the board holds the count the
       player just watched land AND tick up, and this sentence restated
       the real pair and then the with-you pair underneath it — two of the
       three identical, and the board's own figure differing from the
       sentence immediately below it. RTL made it worse: the board reads
       בעד then נגד and the sentence writes נגד first, so the pairs were
       mirrored as well as repeated.
       The board is the count-up. This line is the verb, and 'עם הקול
       שלכם' keeps its pair — it is the one number the board cannot say in
       words. */
    /* ITEM 51A · THE REJECTED STRING IS TAMAR'S AND IS NOT WRITTEN HERE.
       ph() is used for the marker's treatment, but see the no-ph override
       in proto.css: unlike every other placeholder in the app this one is
       NOT hidden in the default build. Hiding it would leave the two
       rejected issues with a bare 'עם הקול שלכם' and no statement of the
       outcome at all — trading a wrong sentence for a missing one. */
    res.innerHTML =
      (passed ? esc('ההצעה עברה.')                                     /* TAMAR */
              : esc('ההצעה לא עברה.')) +                              /* TAMAR */
      /* ITEM 52 · THE PAIR IS WRITTEN IN THE BOARD'S ORDER, נגד FIRST.
         It was for—against, which renders 64—57 left-to-right because .num
         is direction:ltr — while the board above it renders נגד then בעד,
         57 then 64. Two pairs of the same numbers ordered opposite each
         other, six inches apart, with nothing on either to say which side
         is which. Item 51B took the duplicate pair off this line; the one
         that survived still disagreed with the board about the order.
         THE BOARD IS THE FIXED POINT, not this line. Its order is a
         consequence of the RTL row — .f5cell for בעד is the first child
         and therefore the rightmost — so it cannot be changed without
         moving the cells, and there is no reason to: the board is the
         object the player watched count. The sentence follows it. */
      '<span class="f5res__you">' + esc('עם הקול שלכם: ') +             /* TAMAR */
        '<b>' + N(mine.against + '—' + mine.for) + '</b></span>';
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
  if (window.HAC) HAC('issue_complete', { issue_id: issue.id, score: wallet, claim_correct: S.claimCorrect === true, position: S.position || null, mk_hits: roundHits(), mk_total: S.dealt.length, time_ms: HAC.beatMs() });
  /* THE ROUND'S RECORD IS WRITTEN HERE AND NOWHERE ELSE. Every value it
     keeps was already deposited on S by the beat that owns it —
     claimCorrect by claimReveal(), position by the tachles chips,
     guesses by the two verdict sites — so this reads them rather than
     re-deciding anything, and it is the last frame before newRound()
     reassigns S. A round abandoned through the ✕ writes nothing, which
     is correct: the coins it earned are kept, the issue is not done. */
  RECORD[issue.id] = {
    claim: S.claimCorrect === true,
    pos:   S.position || null,
    hits:  roundHits(),
    cards: S.dealt.length
  };
  saveState();
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
     BEAT 4 · THE READING AND THE BUTTONS.
     ITEM 8 · THE BOARD DOES NOT DEMOTE. It kept its numbers and its bar
     but at 32px on one line — 153px of board becoming 73 — which is the
     record being cleared away to make room for the reading, one beat
     after the whole beat was built to make the record the loudest thing
     on screen. It now holds its full size and RISES to its final place
     instead, and the reading and the buttons come up from underneath it.
     THE ORDER IS INVERTED, and that is the substantive change rather
     than the class that is no longer added. Every block used to arrive
     first, each one re-measuring and nudging the column, and the eased
     re-centre ran last to clean up after them. Now all of them are in
     the DOM and in layout — held at opacity 0 — BEFORE anything moves,
     so f5Place() measures the final stack once, the board makes one
     eased move to a value that is already correct, and the panels fade
     up behind it on the stagger. Nothing is measured while it moves and
     nothing moves after the measurement.
     ================================================================= */
  /* the blocks that arrive behind the board's move, in the order they
     take their step of the stagger. */
  const late = [];
  /* NO fitBeat() WHILE THE BLOCKS GO IN, and that is not tidying. Each
     call measures the stack against a padding-top that is still the
     board's PRE-move 315px, so the moment the reading and the buttons
     were in the DOM it read 868px of stack against 786 of room and
     scaled the whole beat to 0.905 — for one frame, until the move
     retargeted the padding and the next call put it back. A 9.5% flash
     on the frame before the move. The call inside the move's own handler
     runs after f5Place() has set the target, sees the layout that is
     arriving, and is the only one that needs to run at all. */

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
    /* it joins an outcome panel that is already on screen — the shape is
       part of the same account, and a panel that has been read for two
       beats does not re-enter to gain a line. On the twin there is no
       such panel and it takes a surface of its own, which DOES arrive
       with the rest. */
    if (outcome) { outcome.appendChild(shape); }
    else {
      const w = el('div', 'f5outcome f5surf b5stage f5late');
      w.appendChild(shape); b.appendChild(w);
      late.push(w);
    }
  }

  /* T12 · THE SENTENCE LEAVES THE BOARD ENTIRELY AND THE BLOCK BECOMES
     ONE LINE. The first sentence used to sit here with the rest behind a
     tap, which split one explanation across two surfaces and still spent
     the bottom third of the beat on the part players skip. The whole
     explanation is behind the tap now and the board carries the door.

     WHAT GOES IN IS ex.first + ex.rest, IN THAT ORDER — not the raw
     tf_explain. The two differ by exactly one thing: explainSplit()
     strips the "זה נכון" / "זה לא נכון" opener, which the claim
     resolution has already said on this same screen. Passing the raw
     field would restate the verdict inside its own explanation, so
     "whole" means every sentence the board and the modal were showing
     between them, in order, and nothing that was already deliberately
     removed. Flagged in the report. */
  const ex    = explainSplit(issue.tf_explain);
  const full  = [ex.first, ex.rest].filter(Boolean).join(' ');
  const terms = issue.glossary_terms || [];
  const links = (issue.further_links || []).slice();
  if (issue.knesset_url) links.push({ label:'ההצבעה באתר הכנסת', url:issue.knesset_url }); /* TAMAR */
  const hasMore = !!(full || terms.length || links.length);

  /* T34b · THE LINE NOW SAYS WHAT THE ISSUE ACTUALLY HAS. It was one
     test — links.length — and it was wrong on SEVEN of the sixteen: four
     issues carry only the Knesset vote page and three carry only
     articles, and all seven were offering the player a video. See
     readKind(). */
  if (hasMore) {
    const kind = readKind(issue, links);
    const read = el('div', 'f5read f5surf b5stage f5late');
    read.innerHTML =
      '<button type="button" class="f5more">' + f5LineHtml(kind) + '</button>';
    b.appendChild(read);
    late.push(read);
    pressable($('.f5more', read)).addEventListener('click',
      () => moreModal(full, terms, links));
  }

  /* ---- the way out. Unchanged: if the topic has another unplayed
     issue the PRIMARY action opens it directly, because going back to
     the map to come straight back buys nothing. */
  const acts = el('div', 'f5acts b5stage f5late');
  const restIss = topicIssues(issue.topic).filter(x => !issueDone(x.id));
  const next = restIss[0];
  /* §E · THE LAST ISSUE OF THE LAST TOPIC IS A DIFFERENT DOOR. The test
     is asked BEFORE the per-topic one, because the old order could only
     ever answer "is there another issue in THIS topic" and fell through
     to חזרה למפה — which is exactly the loop the end-game replaces. */
  if (gameDone()) {
    const go = el('button', 'p-c f5go', 'סיימתם את כל הנושאים ›');   /* TAMAR */
    pressable(go).addEventListener('click', () => endGame());
    acts.appendChild(go);
  } else if (next) {
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
  late.push(acts);

  /* ITEM 8 · THE ONE MOVE, AND THE PANELS BEHIND IT.
     Two frames of settling first, as before: the blocks that were just
     appended are still being laid out when this handler runs, and
     fitBeat() has yet to decide on a scale. Measuring inside the same
     frame read a layout that then changed under it. */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    /* .is-recentring arms the 320ms ease-out and drops .f5acts's auto
       margin — pinned to the floor, only the top of the stack could move
       and the result is a stretch rather than a move. */
    b.classList.add('is-recentring');
    void b.offsetHeight;
    /* THE BOARD'S MOVE. f5Place() measures the stack — every panel is
       already in it — restores the padding the column actually has, and
       only then sets the measured value, so the transition runs from
       where the board is to where it belongs and there is no frame in
       which it is somewhere else. It cannot jump: the value is never
       assigned with the transition live and un-restored. */
    f5Place(b, board, true);
    fitBeat();
    /* PART 4 · the pulse has done its job. It ran while the board was the
       only thing on screen and while the flight landed on it; once there
       is somewhere else to go it settles to a static, quieter glow. */
    if (board) board.classList.add('is-glow-calm');

    /* the panels follow, one --t-f5-panel step apart, starting on the
       frame after the move has begun. The stagger is the delay and
       nothing else — one shared transition, so they cannot drift out of
       step with each other.
       REDUCED MOTION TAKES THE STAGGER OFF TOO, not just the travel: the
       global rule cuts every duration to 1ms but leaves DELAYS alone, so
       without this the panels would still appear 80ms apart with the
       motion stripped out — a flicker rather than an arrival. */
    const stagger = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    late.forEach((n, i) => {
      if (stagger) n.style.transitionDelay = (i * T.f5Panel) + 'ms';
    });
    requestAnimationFrame(() => {
      late.forEach(n => n.classList.add('is-in'));
      /* AND fitBeat() AGAIN WHEN EVERYTHING HAS LANDED. It measures
         scrollHeight, which includes padding-top — and padding-top is
         mid-transition here, still holding the pre-move value. It
         therefore measured an overflow that only existed for the first
         frame of the move, applied scale(0.90) at 360, and nothing ever
         re-evaluated it: the beat settled 10% small for the rest of its
         life. One call after the last panel has arrived, and the scale
         reflects the layout that actually ended up on screen. */
      setTimeout(fitBeat,
        T.f5Board + (late.length - 1) * T.f5Panel + T.f5In + 40);
    });
  }));
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
  /* `board` MAY BE NULL, and the beat still has to be placed. A round with
     no tally and no vote_result builds no board at all (see beat5), and
     this function early-returned on that — so padding-top was never set,
     .is-recentring dropped .f5acts's auto margin, and the whole stack
     collapsed to the top of the stage with 380-460px of bare ground under
     the buttons. Only the HELD placement ever needed the board; the final
     re-centre measures the stack's own ink and never reads it. */
  const par = b.parentElement; if (!par) return null;
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

  /* THE ANCHOR IS THE BOARD WHERE THERE IS ONE AND THE FIRST BLOCK WHERE
     THERE IS NOT — the same rhythm, not a second one. The held placement
     centres whatever object is alone on screen when it runs, then caps it
     by the room the content leaves; on a tally beat that object IS the
     board, so `anchor` resolves to `board` and every figure below is
     unchanged to the pixel. On a no-board beat it is the plate, which is
     the block the flight lands on and the one the beat opens with. */
  const anchor  = board || b.children[0] || null;
  const boardH  = anchor ? anchor.offsetHeight : 0;
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
    /* ITEM 8 · MEASURED IN LAYOUT COORDINATES, NOT RENDERED ONES. Every
       panel is now in the stack BEFORE the move, held at its pre-entrance
       offset — which is a transform — so getBoundingClientRect() put the
       last block 22px below the box it actually occupies and the stack
       would have been centred against a position nothing was ever going
       to be in. offsetTop/offsetHeight are the untransformed boxes, and
       .b5fit is position:relative so every child's offsetParent is b:
       one read of b's own top puts them back into viewport space.
       IDENTICAL TO THE OLD FIGURES wherever no child carries a transform,
       which is every call this function had before this item. */
    const ink = () => {
      const k = [...b.children], o = b.getBoundingClientRect().top;
      return { t: o + Math.min(...k.map(n => n.offsetTop)),
               b: o + Math.max(...k.map(n => n.offsetTop + n.offsetHeight)) };
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
    const stackH = Math.round(Math.max(...kk.map(n => n.offsetTop + n.offsetHeight))
                            - Math.min(...kk.map(n => n.offsetTop)));
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
    /* SOUND · A FLAT TICK, AND A FLOOR UNDER IT. The count paints every
       frame, so at PLENUM 120 a numeral changes roughly every 17ms — a
       tick per change would be three copies of a 52ms sample overlapping
       and would arrive as a rattle, not as ticks. SFX_TICK_MIN is the
       sample's own length: it cannot retrigger faster than it lasts.
       THE RATE IS THEREFORE CONSTANT, which is the decided property. The
       count's own ease is near-linear and the tick is floored, so nothing
       here accelerates, and the 400ms hold at the majority crossing gets
       silence for free — the held branch returns above this. */
    let lastF = -1, lastA = -1, lastTickAt = 0;
    const tickIf = (f, a, now) => {
      if (f === lastF && a === lastA) return;
      lastF = f; lastA = a;
      if (now - lastTickAt < SFX_TICK_MIN) return;
      lastTickAt = now;
      sfx('tick');
    };
    (function tick(now) {
      if (document.hidden) {
        document.addEventListener('visibilitychange', function once() {
          document.removeEventListener('visibilitychange', once);
          requestAnimationFrame(tick);
        });
        return;
      }
      if (held && now < holdUntil) return requestAnimationFrame(tick);
      const k = Math.min(1, (now - t0 - (held ? T.f5Flare : 0)) / RUN);
      let p = curve(k);
      if (!held && crossAt > 0 && p > crossAt) {
        p = crossAt;
        held = true; holdUntil = now + T.f5Flare;
        paint(Math.round(tally.for * p), Math.round(tally.against * p));
        maj.classList.add('is-flare');
        return requestAnimationFrame(tick);
      }
      const nf = Math.round(tally.for * p), na = Math.round(tally.against * p);
      paint(nf, na);
      tickIf(nf, na, now);
      if (k < 1) requestAnimationFrame(tick);
      else {
        paint(tally.for, tally.against); maj.classList.remove('is-flare');
        /* SOUND · the weight is in the landing, not in a climb. One soft
           drop when the count stops, and nothing before it rises. */
        sfx('land');
        res();
      }
    })(t0);
  });
}

/* ---- ITEM 11 · THE 121ST VOTE IS COUNTED ---------------------------
   The board has said what the Knesset did. This is the only moment in the
   game where the player's own vote is added to it, and all three things
   that say so move together on one 220ms curve: the numeral ticks, the
   numeral goes gold, and the bar segment grows by one unit of its own
   scale.

   IT DERIVES FROM THE SAME PLACE THE COUNT DOES. `tally` is the object
   beat5() reads out of issue._tally and hands to runCount() — one source,
   passed in, never re-read from the DOM and never a second field name. If
   the CMS reconciliation moves the board onto tally_for/tally_against,
   beat5()'s single read moves with it and this follows for free. Reading
   the numeral's own text back off the screen would have been the other
   option and it is worse: it makes the animation depend on a rendering
   rather than on the record.

   THE 61 MARKER DOES NOT MOVE, and there is no branch here that could
   move it. A +1 that crosses 61 gets exactly what a +1 that does not
   gets. No issue in the data reaches it — the closest is s1, which is
   already ON 61 — but the rule is structural, not a fact about the data.

   נמנע, AND NO VOTE AT ALL, RETURN WITHOUT TOUCHING THE BOARD. There is
   no side to add to; the token has already landed on the majority line,
   which is the whole of what an abstention has to say here. */
function tickVote(board, tally) {
  const side = S.position === 'for' ? 'for'
             : S.position === 'against' ? 'against' : null;
  if (!side || !board) return Promise.resolve();
  const nEl = $(side === 'for' ? '#f5for' : '#f5ag', board);
  const nBox = $(side === 'for' ? '.f5n--for' : '.f5n--ag', board);
  if (!nEl || !nBox) return Promise.resolve();

  const from = tally[side], to = from + 1;
  /* the bar is painted the way runCount() paints it — the two sides and
     the unfilled remainder of the plenum — so the segment that grows and
     the segment that gives way stay one arithmetic. */
  const mine = { for: tally.for, against: tally.against };
  mine[side]++;
  const bar = $('.f5bar', board);
  const seg = $(side === 'for' ? '.f5bar__f' : '.f5bar__a', board);
  const rem = $('.f5bar__r', board);
  const paintBar = () => {
    if (!seg || !rem) return;
    seg.style.flexGrow = mine[side];
    rem.style.flexGrow = Math.max(0, PLENUM - mine.for - mine.against);
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    /* the colour still applies — the item asks for it explicitly. The
       global reduce rule turns the transition that carries it into a 1ms
       one rather than removing the value. */
    nBox.classList.add('is-mine');
    nEl.textContent = String(to);
    paintBar();
    sfxVote();                      /* SOUND · motion is off, sound is not */
    return Promise.resolve();
  }

  /* EVERY DIGIT GETS A WINDOW, and only the ones that change are stepped.
     Uniform boxes are what keeps the digits on one line: a mix of bare
     text nodes and inline-blocks in the same <b> aligns the text on the
     baseline and the blocks on the line box, which at 74px is a visible
     step between neighbouring digits. Unchanged digits carry the same
     glyph in both rows and never move.
     RIGHT-ALIGNED, so 99 -> 100 is a leading digit ARRIVING rather than
     three digits all changing meaning. Its outgoing row is empty; the
     column is already the width of the incoming glyph, so the numeral
     reaches its final width on the first frame instead of growing
     through the move. m1 is the one issue in the data where this
     happens. */
  const A = String(from), C = String(to), w = Math.max(A.length, C.length);
  const at = (str, i) => str[i - (w - str.length)] || '';
  nEl.innerHTML = '';
  const cols = [], all = [];
  for (let i = 0; i < w; i++) {
    const a = at(A, i), c = at(C, i);
    const d = el('span', 'f5dig',
      '<span class="f5dig__c"><i>' + esc(a) + '</i><i>' + esc(c) + '</i></span>');
    nEl.appendChild(d);
    all.push([d, c]);
    if (a !== c) cols.push(d);
  }
  /* EACH WINDOW IS THE WIDTH OF THE DIGIT IT SETTLES ON, MEASURED IN
     PLACE. Left to size themselves the windows changed the numeral's
     width twice inside one move — see the note by .f5dig. The gauge is a
     child of the numeral, so it inherits the exact face, size and
     features rather than approximating them, and the sum of the widths it
     yields is exactly the width of the text node that replaces the
     windows at the end: measured, digits 0-9 sum to the string's own
     width to three decimal places, so there is no kerning to account for. */
  const gauge = el('span');
  gauge.style.cssText = 'position:absolute; visibility:hidden; white-space:pre;';
  nEl.appendChild(gauge);
  all.forEach(([d, c]) => { gauge.textContent = c; d.style.width = gauge.getBoundingClientRect().width + 'px'; });
  gauge.remove();

  return new Promise(done => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      /* ALL THREE ON ONE FRAME. The colour class used to go on when the
         windows were built, two frames before the slide and the bar —
         32ms of the numeral changing colour while it was still reading
         the old value. Nothing about the +1 may lead any other part of
         it, so every one of them is written here. */
      nBox.classList.add('is-mine');
      cols.forEach(d => d.classList.add('is-up'));
      if (bar) bar.classList.add('is-plus1');
      paintBar();
      buzz('the121st');
      /* SOUND · THE 121ST VOTE, in the silence the beat leaves for it.
         Everything about the +1 already fires on one frame on purpose;
         this is the fifth thing on that frame -- which is why it is
         sfxVote() and not sfx('vote'): see there for why the chip is
         layered into the chamber's thunk rather than made louder. */
      sfxVote();
      setTimeout(() => {
        /* THE WINDOWS DO NOT SURVIVE THE BEAT. The settled numeral is the
           single text node it was before the tick, so nothing downstream
           — a re-measure, a scale, a screenshot — is looking at scaffolding. */
        nEl.textContent = String(to);
        done();
      }, T.f5Tick);
    }));
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
    slot.innerHTML = '<span class="f5av">' + avatarSvg() + '</span>';
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
  const fly = el('span', 'f5fly', avatarSvg());
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
      setTimeout(() => { land(); fly.remove(); done(); }, T.f5Flight);
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
  coin.innerHTML =
    '<span class="f5coin__n">+' + N(now) + '</span>' +
    '<p class="f5coin__sub">' + parts.join(' + ') + '</p>' +
    '<p class="f5coin__tot">' + esc('הסוגיה הזו: ') + N(total) + ' ●</p>'; /* TAMAR */
  /* IN FLOW, AND BEFORE .f5acts. It was position:absolute at the board's
     bottom + 26px, which is a y computed from the board ALONE while the
     result text sits in flow 11px under it -- so ~122px of a 113.5px
     sticker landed on .f5outcome at z-index 3 and made both unreadable.
     Nothing reserved its space because nothing could: an out-of-flow box
     is invisible to the column that has to make room for it.
     IT FITS. Measured at all three profiles, reading the column with
     flex:none as f5Place() does -- .b5fit is flex:1, so a naive
     scrollHeight returns the container height and says nothing: the
     column is 393px without the sticker and 517px with it, against
     782 / 605 / 578 of room. The tightest is 360x640 with 61px to spare,
     so fitBeat() never scales the beat.
     +150 IS NOT THE TALLER CASE. The caption does not wrap at any of the
     three widths, so the column is 517px at both values and only the
     number pill widens, 105.7 -> 126.8px.
     BEFORE .f5acts, NOT APPENDED. .f5acts carries margin-top:auto and
     .b5fit is flex:1, so the actions stay pinned to the bottom and the
     sticker eats the slack above them instead of pushing them off. It
     also has to land above the second .f5outcome that the .f5late branch
     appends after this moment. */
  const acts = $('.f5acts', b);
  if (acts) b.insertBefore(coin, acts); else b.appendChild(coin);
  /* the same arrival every other block in this beat gets: the class on
     the next frame, then re-centre and re-fit. Skipping these is what
     would leave the stack uncentred now that it is one block taller. */
  const board0 = $('.f5board', b);
  requestAnimationFrame(() => {
    coin.classList.add('is-in');
    f5Place(b, board0);
    fitBeat();
  });
  /* THE HOLD STARTS AFTER THE FADE, NOT AT APPEND. It used to start on
     the same tick as appendChild, so the 500ms hold and the 300ms
     fade-in overlapped and the sticker was fully opaque for 185ms --
     long enough to notice, nowhere near long enough to read a number AND
     the caption under it, which is why .f5coin__sub has never been
     legible. 300 in, then a clear 900 of stillness. */
  if (!reducedCoin()) await wait(T.f5In);
  await wait(T.f5CoinHold);
  /* N2a · the finale's coin, named here and only here. The amount `now`
     is passed as it always was and is not consulted by the sound. */
  /* AND IT STAYS UP UNTIL ITS OWN COINS HAVE LANDED. .is-out used to be
     added on the line after award(), so the sticker began dissolving on
     the frame the coins left it and was gone ~230-310ms BEFORE they
     arrived -- the object they visibly came from vanishing mid-flight.
     award()'s onDone is the real arrival (the last token's onLand, or
     the end of the count-up when there is no flight), so this waits for
     it rather than for a timer that only approximates it. */
  await new Promise(done => award(now, coin, 'coinFinale', done));
  coin.classList.add('is-out');
  await wait(T.f5CoinOut);
  coin.remove();
  /* the stack is one block shorter again, so it is re-centred once more
     rather than left sitting high for the rest of the beat */
  f5Place(b, board0);
  fitBeat();
}

/* REDUCED MOTION KEEPS THE TIME AND DROPS THE MOVEMENT. The fades are
   motion and they go; the 900ms of stillness is READING TIME and it
   stays. Reduce is a request to stop things moving, not a request to be
   given less time to read them -- shortening the dwell here would be
   answering a motion preference with a legibility cost. The CSS side
   holds the sticker at full opacity with no transition; this is the JS
   side of the same decision, and it is why the fade-in wait above is
   skipped rather than the hold. */
function reducedCoin() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
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
/* T12 · IT TAKES THE WHOLE EXPLANATION NOW, not the remainder. The
   parameter is renamed with it: `rest` was true when the board kept the
   first sentence and is a lie now that it does not. */
function moreModal(text, terms, links) {
  const extra =
    (terms.length ? '<div class="f5chips">' + terms.map(x =>
      '<button type="button" class="f5chip" data-term="' + esc(x) + '">' +
        esc(x) + '</button>').join('') + '</div>' : '') +
    (links.length ? '<div class="f5links">' + links.map(l => {
      /* T34c · THE SAME TEST THE BOARD'S LINE USES, and now the only one.
         This read the label alone, so b2's and a2's YouTube links drew
         🔗 while the line above the door promised video — the same
         overstatement T34b took out of the line, one layer down. One
         source of truth for "is this a video": isVideoLink(). */
      const icon = isVideoLink(l) ? '▶' : '🔗';
      return l.url
        ? '<a class="f5link" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
            '<i aria-hidden="true">' + icon + '</i>' + esc(l.label) + '</a>'
        : '<span class="f5link is-missing" data-missing-url>' +
            '<i aria-hidden="true">' + icon + '</i>' + esc(l.label) + '</span>';
    }).join('') + '</div>' : '');

  const m = stickerModal({
    title: issue.title || issue.bill_title || '',
    /* THE TERMS COME IN WITH THE TEXT. They were marked on the board and
       the board no longer has the sentence, so marking here is what
       keeps them from being lost with it — and it now covers the WHOLE
       explanation rather than only its first sentence, which is a gain:
       a term that happened to fall in the remainder was never marked at
       all, because stickerModal escaped `body`. */
    bodyHtml: text ? markGlossary(text) : '',
    /* T59 · the read-more and sources sticker. titleLg keeps the 20px this
       modal has had since ITEM 9 — the hero arriving is not a reason for
       the issue's title to shrink. */
    art: ROOT + HERO.sources, heroKey: 'sources', titleLg: true,
    extra: extra
  });
  /* T34 · IT SWAPS, IT DOES NOT STACK. This used to call glossModal(),
     which builds a whole second .stmodal and drops it on the stage — two
     boxes, two ✕, two scrims, and a ✕ that closed only the top one. The
     definition is the SAME surface showing different content now: one
     box on screen at every depth, a back control top-left while there is
     somewhere to go back to, and the box easing between the two heights
     rather than jumping.
     THE .gt ARM OF THIS LISTENER IS GONE, and the rule it discovered is
     not: wireGlossary() on #stage makes the same push for a term tapped
     in ANY open sticker, this one included. What stays here is the CHIP,
     which is this modal's own object — .f5chip is built by moreModal and
     exists nowhere else, so there is nothing to delegate. */
  m.addEventListener('click', e => {
    const c = e.target.closest('.f5chip');
    if (!c) return;
    e.stopPropagation();
    stickerPush(m, glossOpts(c.dataset.term));
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

/* issueId -> true. THIS NOW SURVIVES A RELOAD — see THE SAVE below.
   The "a client meeting should open on a clean map" intent that used to
   live here has not been dropped; it has moved to ?reset, because it can
   no longer be a consequence of writing nothing down. */
const PROGRESS = {};

/* issueId -> what the end-game needs to say a true sentence about the
   round. Written once per round, at the same moment as PROGRESS. */
const RECORD = {};

/* =====================================================================
   THE SAVE · ONE KEY, ONE VERSION, AND ONLY WHAT THE END-GAME READS.

   WHY IT EXISTS AT ALL. PROGRESS and the wallet were session-only by
   choice, and the choice was right while the game ended by looping back
   to the map. It stops being right the moment there is an end-game: a
   player who reloads on issue 9 of 11 loses the run, and the end-game is
   the one screen whose whole content is the run.

   WHAT IS STORED, AND WHY EACH FIELD EARNS ITS PLACE. Nothing here is
   speculative — every field is read by a beat that is specified:
     wallet          the coins to allocate                    (beat 3)
     progress        which issues are done; the map, and the
                     completion test topicsDone() === TOPICS().length
     record[id].claim   did the claim surprise them           (beats 2, 4)
     record[id].pos     their own vote, for the alignment line (beat 2)
     record[id].hits    correct MK predictions this round     (beats 2, 4)
     record[id].cards   how many were asked, so `hits` has a
                        denominator that is not re-derived later
     cf              whether the one celebration has been spent
   The surprise count is (claim ? 0 : 1) + (cards - hits), summed. The
   alignment record compares `pos` to _tally, which lives in data.js and
   is therefore never stored.

   WHAT IS DELIBERATELY NOT STORED. No timings. No per-MK answer history:
   WHICH member was missed is answer history, the counts are the beat's
   content, and only the counts are kept. No analytics of any kind. No
   avatar, no settings — the DEV switches are URL state and stay that way.

   FAILING OPEN, THREE WAYS. A save is discarded whole rather than
   repaired, because a half-trusted save is how a broken map gets
   rendered:
     1 · version mismatch — the shape changed under it
     2 · an issue id that is not in DATA — the content set moved and the
         progress no longer describes anything real
     3 · anything malformed — not an object, wallet not a finite number
   In all three the store is cleared and the session starts clean, which
   is exactly the behaviour of a first-ever visit.
   ===================================================================== */
const SAVE_KEY = 'h121.proto.save';
const SAVE_VER = 1;

/* THE CONFETTI'S ONCE-ONLY FLAG LIVES IN THE SAVE, not in the session.
   Scarcity is the whole argument for keeping confetti at all — it was cut
   from every per-round reveal precisely so that finishing the map could
   have it — and a flag that forgets on reload spends that scarcity for
   free. It is the one piece of end-game state the save carries that is
   not a number the beats read back, and it earns its place by being the
   only thing protecting the rule.
   NO VERSION BUMP. The field is additive and optional: a save written
   before it simply has no `cf`, restores cleanly, and fires the
   celebration once more. Bumping SAVE_VER would discard an eleven-round
   run to protect one animation, which is the wrong trade. */
let EG_CONFETTI_SPENT = false;
let SND_DONE_FIRED = false;     /* SOUND · once per session, on top of `cf` */

/* ITEM 43 · THE MAP'S FIRST ARRIVAL, ONCE EVER. It goes in the save
   rather than in a key of its own — SEEN_KEY predates the save and is
   stranded there; anything added now belongs with progress and profile so
   that ?reset clears the lot in one place, which is exactly what the item
   asks for. Additive and optional like `cf`, so no SAVE_VER bump: a save
   written before this simply has no `mi`, restores cleanly, and shows the
   sticker once. */
let MAP_INTRO_SEEN = false;

/* T13 · THE MAP AVATAR'S BEACON, ONCE EVER. Same reasoning as `mi`
   directly above: it goes in the save rather than in a key of its own, so
   ?reset clears the beacon with progress, profile and the first-arrival
   sticker in one place. Additive and optional — no SAVE_VER bump, and a
   save written before this has no `ab`, restores clean, and beacons once.
   SPENT MEANS TAPPED, NOT SEEN. The flag is written by the tap on the
   avatar and by nothing else: arriving on the map, looking at it and
   leaving does not spend it, because the beacon's whole job is to get
   that tap and it has not got it yet. */
let AV_BEACON_SPENT = false;

/* T11 · THE PRE-FINALE EXPLAINER, ONCE EVER. The fourth flag on the same
   terms as `mi` and `ab` above: in the save rather than a key of its own,
   additive and optional so no SAVE_VER bump, and a save written before it
   simply has no `pr` and explains itself once more.
   WHAT IS ONCE IS THE EXPLANATION, NOT THE GATE. The button that reveals
   the finale is on this screen EVERY round — see preReveal(), where the
   flag gates one paragraph and nothing else. If a later change makes the
   whole screen conditional on this flag, that is the bug, not the fix. */
let PRE_HOW_SEEN = false;

/* BUILD-IB · 9 · THE MK ASK'S SCHEDULE. נחשו מה הוא/היא הצביע/ה is the
   only instruction in the app that never stopped being given: card one
   of every cascade, twelve rounds, the same verb on the eleventh. It
   goes on the same terms as `mi`, `ab` and `pr` above -- in the save
   rather than a key of its own, additive and optional so no SAVE_VER
   bump, and a store written before it restores false and instructs once
   more.
   THE SCHEDULE IS NOT A COPY QUESTION. The line is Tamar's and is not
   touched; what changes is how many times it is said.
   ITS CLAIM TWIN IS NOT SCHEDULED. ASK.claim retires with the card it is
   stuck to -- it is a label on an object that leaves -- so it has never
   been the repeated one and is left alone. */
let ASK_MK_SEEN = false;

/* T38b · THE TAP AFFORDANCE HAS NO SCHEDULE, AND ITS FLAG IS GONE.
   BUILD-IB §10 withheld the pill after round one on the same terms as
   .ask-st, and the argument was that a repeat player does not need to be
   told to tap. That holds on a surface with other content. Beat 3 has
   none: no chair, no title, no date -- a band over the deck's card back
   under a 3px blur, and the pill was the only object saying the screen
   was waiting for something. Withholding it did not make the beat
   cleaner, it emptied it.
   THE FLAG IS DELETED RATHER THAN LEFT UNUSED. With the gate gone
   nothing read TCTAP_SEEN at all -- it would have been written on every
   save and restored on every load to be consulted by nobody, which is
   dead state that eventually gets reconnected by accident. Reinstating
   the schedule means re-adding four sites, and the reason it was
   reversed is a property of the beat rather than of the player.
   .ask-st KEEPS ITS SCHEDULE. That one teaches a mechanic learned once,
   and its surface carries a card, a face and a name -- see askMkDue().
   REDUCED MOTION STILL SUPPRESSES IT, and that is not part of this
   reversal: the pill's entrance is a transition and tc-tap is an
   animation, so flattened to 1ms it appears from nowhere and sits still.
   tapDue() keeps that branch and the DEV override above it. */

/* the same fails-open contract as seenIntro(): private mode, a cleared
   store and a browser with storage disabled all have to leave the game
   playable, so every access is wrapped and every failure is "no save". */
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* fails open */ }
}

/* T36 · THE CLEAN SLATE, AND IT IS ONE FUNCTION BECAUSE THERE ARE TWO
   DOORS. ?reset and the reset sheet's tear-off both mean "start as a
   first-ever visit", and resetConfirm() already says in a comment that
   the two cannot be allowed to drift. They were both calling clearSave(),
   which is not the whole store: SEEN_KEY sits outside the save object and
   survived, so neither door delivered the first run it promised.
   clearSave() KEEPS ITS NARROWER MEANING. discardSave() calls it to throw
   away a save it cannot read, and that is a silent recovery — the player
   gets a clean map, not a re-run of the instruction overlay they have
   already been through. Anything that is genuinely once-ever and NOT in
   the save object belongs on this list; everything else already goes with
   SAVE_KEY, and the in-memory flags go with the reload both doors do. */
function wipeAll() {
  clearSave();
  clearIntroSeen();
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: SAVE_VER, wallet, progress: PROGRESS, record: RECORD,
      cf: EG_CONFETTI_SPENT,
      mi: MAP_INTRO_SEEN,
      ab: AV_BEACON_SPENT,                                       /* T13 */
      pr: PRE_HOW_SEEN,                                          /* T11 */
      am: ASK_MK_SEEN,                                           /* BUILD-IB 9 */
      snd: SND_ON,                                               /* SOUND */
      qb: QBAR_SHOWN,                                            /* T27 */
      profile: PROFILE
    }));
  } catch (e) { /* fails open — a full or disabled store must not break play */ }
}

/* CALLED ONCE, FROM boot(), BEFORE ANY SCREEN IS BUILT. Nothing stored
   leaves PROGRESS, RECORD and wallet at their initial values, which is
   the "behave exactly as today" case. */
function restoreSave() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }
  if (!raw) return;

  let s = null;
  try { s = JSON.parse(raw); } catch (e) { return discardSave('unparseable'); }

  if (!s || typeof s !== 'object')      return discardSave('not an object');
  if (s.v !== SAVE_VER)                 return discardSave('version ' + s.v);
  if (!Number.isFinite(s.wallet) || s.wallet < 0)
                                        return discardSave('wallet ' + s.wallet);
  if (!s.progress || typeof s.progress !== 'object') return discardSave('no progress');
  if (!s.record   || typeof s.record   !== 'object') return discardSave('no record');

  /* THE CONTENT CHECK. Every id the save mentions has to still be in
     data.js. An id that is gone means the set was re-cut under the save,
     and a map drawn from it would show a topic complete on the strength
     of an issue nobody can open. Retired issues (active:false) are still
     IN data.js and are still valid here — topicIssues() filters those
     out on its own, so a stale done-flag on one is inert. */
  const known = new Set(DATA.issues.map(i => i.id));
  const ids = Object.keys(s.progress).concat(Object.keys(s.record));
  for (const id of ids) if (!known.has(id)) return discardSave('unknown issue ' + id);

  Object.keys(s.progress).forEach(id => { if (s.progress[id] === true) PROGRESS[id] = true; });
  Object.keys(s.record).forEach(id => {
    const r = s.record[id];
    if (r && typeof r === 'object') RECORD[id] = r;
  });
  wallet = s.wallet;
  /* coerced rather than validated: a malformed `cf` is a cosmetic field
     and must not be grounds for discarding eleven rounds of progress */
  EG_CONFETTI_SPENT = s.cf === true;
  /* ITEM 43 · coerced, never validated, for the reason above: a malformed
     `mi` shows one sticker again and must not cost a run. */
  MAP_INTRO_SEEN = s.mi === true;
  AV_BEACON_SPENT = s.ab === true;                               /* T13 */
  PRE_HOW_SEEN    = s.pr === true;                               /* T11 */
  /* SOUND · the fifth boolean on the same terms as the four above:
     additive and optional, so no SAVE_VER bump. A save written before
     this has no `snd` and restores FALSE — which is not a fallback here,
     it is the shipped default. Sound is off until somebody asks for it. */
  SND_ON          = s.snd === true;                              /* SOUND */
  QBAR_SHOWN      = s.qb === true;                               /* T27 */
  /* BUILD-IB · the two schedules, coerced on the same terms as the five
     above: a malformed value re-instructs once and can never cost a run. */
  ASK_MK_SEEN     = s.am === true;                               /* BUILD-IB 9 */
  /* T38b · `tt` is not read any more. A save written while the schedule
     existed still carries the key; it is ignored rather than migrated,
     which is the same additive-and-optional contract every other flag
     here is added under, run backwards. No SAVE_VER bump either way. */
  /* §B the profile, coerced field by field the way `cf` is: anything that
     is not a legal value is the default, and nothing in it can be grounds
     for discarding a save. An avatarId that names a preset no longer on
     the sheet falls back to the first, silently. */
  const p = (s.profile && typeof s.profile === 'object') ? s.profile : {};
  PROFILE.avatarId = (typeof p.avatarId === 'string' && preset(p.avatarId)) ? p.avatarId : null;
  PROFILE.name     = cleanName(p.name);
  PROFILE.gender   = (p.gender === 'm' || p.gender === 'f') ? p.gender : null;
  PROFILE.invited  = p.invited === true;
  PROFILE.cfg      = cleanCfg(p.cfg);
}

/* the reason is developer-facing and the recovery is silent: the player
   gets a clean first-run map, never a broken one. */
function discardSave(why) {
  console.warn('[save] discarded —', why);
  clearSave();
}

/* WHAT THE ROUND LEAVES BEHIND, read off S at the moment the round is
   recorded. S is reassigned wholesale by newRound(), so this is the last
   frame in which any of it exists. */
function roundHits() {
  if (!S.dealt.length) return 0;
  /* the inverted round asks a different question — the guess is a
     PERSON, not a vote — so its hit test is not the cascade's. Mirrors
     the two verdict sites and the §1.8 line at beat 5. */
  if (S.inv) return S.guesses[S.inv.shown.id] === S.inv.shown.id ? 1 : 0;
  return S.dealt.filter(d => S.guesses[d.id] === d.vote).length;
}

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
/* THE -1, RAISED INTO A STATE OF ITS OWN. findIndex returns -1 when no
   topic is unfinished, and currentIdx() used to swallow it into "park on
   the last node" because parking was the only thing there was to do with
   it. It is now the game's completion test, named once and read by both
   the map and beat 5. */
const nextTopicIdx = () => TOPICS().findIndex(t => !topicDone(t.id));
/* the guard matters: an empty topic list is not a finished game, and
   TOPICS() is derived from data.js, which can be re-cut under us. */
const gameDone = () => TOPICS().length > 0 && nextTopicIdx() < 0;
/* T35 · THE MAP'S RESTART LABEL IS NOT WRITTEN YET, and it is the one
   label in the app where the wrong word is actively dangerous: on a
   finished map, a centre button reads as "play again" and this one wipes
   the run. So it ships as a marked placeholder rather than as a guess —
   the alternatives, and the plural/gendered question, are in the report
   for Tamar. Same [טקסט — תמר: …] form and the same no-ph exception as
   beat 5's line. */
const MAP_RESTART_PH = '[טקסט — תמר: מחיקה והתחלה מחדש]';   /* TAMAR — placeholder */
/* the soft nudge, and the only ordering the map has. No lock follows it. */
const currentIdx = () => {
  const i = nextTopicIdx();
  return i < 0 ? TOPICS().length - 1 : i;
};

/* =====================================================================
   THE SCREEN ROUTER
   ===================================================================== */
function showScreen(name) {
  const st = $('#stage');
  st.dataset.screen = name;
  [['intro','#scIntro'], ['map','#scMap'], ['round','#scRound'],
   ['end','#scEnd']].forEach(([n, sel]) => {
    const node = $(sel); if (node) node.hidden = (n !== name);
  });
  /* the HUD's centre slot and its RIGHT slot are what differ between the
     two screens. Centre: the issue title in a round, the x/N count on the
     map. Right: the ✕ in a round, the avatar on the map — A4.
     THE END-GAME KEEPS THE MAP'S HUD, and deliberately: the count reads
     6/6 there, which is the thing that just happened, and the coin chip
     is the subject of beat 3. Only the round's two slots stay hidden. */
  const t = $('#hudTopic'), pr = $('#hudProgress');
  if (t)  t.hidden  = true;                                    /* T27 */
  /* T27 · the block belongs to the cascade and to nothing else, so the
     router takes it off every screen and beat4 puts it back. */
  if (name !== 'round') qbarHide();
  if (pr) pr.hidden = !(name === 'map' || name === 'end');
  const av = $('#hudAvatar'), x = $('#hudX');
  if (av) av.hidden = (name === 'round');
  if (x)  x.hidden  = (name !== 'round');
  syncAvBeacon(name);                                            /* T13 */
  syncSndToggle(name);                                         /* SOUND */
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
  /* q moved to COPY.exitQ — it is read through t(), by voice */
  note: 'ההתקדמות בסוגיה לא תישמר',   /* TAMAR */
  go:   'לצאת',                       /* TAMAR */
  stay: 'להישאר',                     /* TAMAR */
};

function exitRound() {
  const midRound = S && S.beat > 1 && S.beat < 5;
  /* quiet: leaving a round is never the moment for the invitation */
  /* FIXED, and not here: the stranded beat-2 surface this function used
     to carry a KNOWN-NOT-FIXED note about is gone with endRound(), which
     goMap() runs on the way out. Nothing about leaving a round is
     special-cased in this function any more — it decides whether to ask,
     and the teardown belongs to the door, not to the confirm. */
  if (!midRound) return goMap({ quiet: true });

  confirmSheet({
    q: t('exitQ'), note: EXIT_COPY.note, go: EXIT_COPY.go, stay: EXIT_COPY.stay,
    onGo: () => {
      if (window.HAC) HAC('round_exit', { beat: S ? S.beat : 0, issue_id: issue ? issue.id : '', score: wallet });
      goMap({ quiet: true });
    }
  });
}

/* =====================================================================
   T27b · THE CONFIRM, FACTORED OUT.

   ONE SHAPE FOR EVERY DESTRUCTIVE ASK. .exitsheet was already the app's
   answer to this question and its own note says why it is centred in
   both axes rather than a bottom sheet: "a bottom sheet is the shape of
   an options menu, and this is not one." The allocation's restart is the
   second thing in the app that cannot be undone, so it gets the same
   object rather than a second modal shape.

   THREE WAYS TO CANCEL AND ONE TO PROCEED, unchanged from the round's:
   the ✕, the ground and the stay button all dismiss; only `go` goes.
   Every ambiguous gesture resolves toward not losing the thing.

   T35c · THE YELLOW IS NOT IN THE SAME PLACE ON ALL THREE SHEETS, AND
   THAT ASYMMETRY IS THE DESIGN. Do not "fix" it into consistency.
     · This sheet — leaving a round, restarting an allocation — puts the
       DESTRUCTIVE verb on the primary. What is lost is one round or one
       screen's worth of taps, both of which the player can simply do
       again, so the sheet's job is to confirm quickly and get out of the
       way.
     · resetConfirm() — the whole game — inverts it: .rs__safe (keep
       playing) is the yellow primary and .rs__go (wipe) is demoted below
       the perforation, ringed and unlifted. What is lost there is the
       whole run and it cannot be re-earned.
   The rule the pair encodes: THE MORE SEVERE THE LOSS, THE MORE THE
   PRIMARY DEFENDS AGAINST IT. A sheet whose yellow always meant "yes"
   would make the gravest button in the game the easiest one to hit.
   The HEAD is the half that is shared — same box, same ✕, same centred
   title and consequence line as of T35c. The FOOT is where the two
   deliberately part.
   ===================================================================== */
function confirmSheet(o) {
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
      '<p class="exitsheet__q">' + esc(o.q) + '</p>' +
      '<p class="exitsheet__note">' + esc(o.note) + '</p>' +
      '<div class="exitsheet__row">' +
        '<button type="button" class="p-c" data-go>' + esc(o.go) + '</button>' +
        '<button type="button" class="r-b" data-stay>' + esc(o.stay) + '</button>' +
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
    removeEventListener('keydown', onKey); sh.remove();
    if (o.onGo) o.onGo();
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
  /* T1 · ONE LINE REPLACES BOTH. `sub` was the question and `para` the
     standfirst; the screen now carries neither and this instead, at the
     question's size. Both survive here unrendered, as `note` and `lede`
     already do — putting either back is one line in renderIntro().
     THE HYPHEN IS DELIBERATE. Tamar wrote "ה 121" with a space; the title
     four lines above it on the same screen is "ה-121" with a hyphen, and
     one screen may not show the number two ways. */
  line:  'אתם הח״כ ה-121, בואו לבדוק מה באמת קורה בכנסת, להצביע ולשתף עם כולם!', /* TAMAR */
  sub:   'מה באמת קורה בכנסת?',                         /* retired from the screen, T1 */
  para:  'לא בוחן ידע. לא אומר למי להצביע. משחק שמראה מה קרה — ומה אתם חושבים על זה.', /* retired from the screen, T1 */
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
    '<p class="i-sub">' + esc(INTRO_COPY.line) + '</p>' +                /* TAMAR */
    '<div class="i-stage" aria-hidden="true">' +
      '<img class="i-build" src="' + ROOT + (M.props.building['1170'] || M.props.building['390']) + '" alt=""></div>' +
    '<button type="button" class="p-c i-cta">' + esc(INTRO_COPY.cta) + '</button>' +
    /* v28d · THE HAMIGDALOR LOCKUP, placement D. Out of flow, so it adds
       nothing to the composed group and moves none of it — measured ±0px
       on every element of the intro, before and after.
       THE PATH IS A LITERAL and that is deliberate: the chair and the
       building come from M.props.*, which make_manifest.py generates and
       which is not ours to add to. If the manifest ever carries the logo
       this becomes M.props.logo['600'] and nothing else changes.
       NO FILTER — see .i-logo in proto.css. */
    '<img class="i-logo" src="' + ROOT + 'assets/mk/hamigdalor_logo_600.webp" ' +
      'alt="" aria-hidden="true">';

  /* ONE PRIMARY ACTION AND IT GOES TO THE MAP. Not to a character step:
     §4.1 kills creation-as-first-step, the default avatar is already in
     the HUD, and customisation moves to the map corner. The project
     flowmap still shows Intro -> Character -> Map; it is superseded, and a
     stub in between would be a screen we know is wrong. */
  pressable($('.i-cta', r)).addEventListener('click', () => loadingBeat(goMap));
  startBreath($('.i-cta', r));
  showScreen('intro');
}
/* ITEM 10 · THE BREATHING CTA, armed here and disarmed on contact.
   prefers-reduced-motion GETS NO ANIMATION AT ALL, which is why this is a
   branch and not only a media query: the global reduce rule shortens
   animations to 1ms, and a 1ms scale firing every 3500ms is a flicker
   with no meaning. The button simply sits at its rest state.
   IT STOPS ON pointerdown, NOT ON click. The invitation has been accepted
   the moment the finger lands; carrying on through the press would have
   the button breathing under the tap that answered it. `once` makes the
   stop permanent — nothing re-arms it, because the screen is rebuilt from
   scratch on every entry. */
function startBreath(cta) {
  if (!cta) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cta.classList.add('is-breathing');
  cta.addEventListener('pointerdown',
    () => cta.classList.remove('is-breathing'), { once:true });
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
/* v40 · VARIANT 6b. One full sine period spread over five steps, as
   fractions of the path's width so it holds its shape at 360, 375 and 390:

       x(i) = .5 - .215 * sin(i * 72deg)

   Amplitude .215, so the extremes sit at .2955 and .7045 and the swing is
   symmetric about the centreline. NODE 0 AND NODE 5 ARE BOTH DEAD CENTRE,
   which is the point of it: sin is zero at 0deg and again at 360deg, so
   the run opens on the centreline and closes back on it rather than
   arriving at the foot off to one side.

   CHOSEN FOR PEAK-BAND CLEARANCE. The previous serpentine put node 0 at
   .7682 and node 3 at .2318 -- mirrored, and both close enough to the
   edge that the current node's glow overhung #mapwin at its 1.16 pulse
   peak (measured 3.5px at 360). .215 pulls the whole swing inside that
   band. The measured clearance for this array is in the report; it is a
   consequence of the amplitude and is the number to re-check if the
   amplitude is ever retuned.

   WHAT REPLACED WHAT. The old array was PathMap's eight centres --
   275 · 227 · 131 · 83 · 131 · 227 · 275 · 227 across 358px -- a cosine
   the board had been drawn from. It is gone, and so is the "the board
   drew eight; the sheet leaves six" note under it: this generator is not
   the board's and taking the first N of it is no longer a quotation.

   THE ARRAY IS EIGHT LONG AND THE GENERATOR'S PERIOD IS FIVE, which is a
   mismatch worth stating rather than leaving to be discovered. Entries 6
   and 7 continue the formula (i=6 -> .2955, i=7 -> .3736, the same values
   as i=1 and i=2), so every index the modulo can reach up to 7 is the
   function's own value. At i=8 the wrap returns .5 where the formula
   wants .6264. That is unreachable today -- data.js yields six topics --
   and it is why the length is kept at eight rather than cut to five: the
   shape of this declaration is unchanged, only its values. If the topic
   count ever passes eight, cut the array to one period and this is
   seamless again. */
const NODE_SERPENTINE = [.5000, .2955, .3736, .6264, .7045, .5000, .2955, .3736];
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
  if (window.HAC) HAC('map_view', { issues_done: Object.keys(PROGRESS).length, score: wallet });
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
    /* v30c · THE CONTROLS GO IN A BAR PINNED OVER THE SCROLL. They were
       two absolutely-positioned pills at identical coordinates — both
       left:50%, translateX(-50%), bottom:14px — which is the collision
       fixed below. A bar is one box with one bottom inset, so two
       controls can never land on each other again by construction.
       THE BAR IS NOT RENDERED WHEN IT WOULD BE EMPTY: the jump pill
       shows and hides on scroll and the summary door only exists on a
       finished map, so on a fresh map the bar holds one hidden control
       and reserves nothing it is not using. */
    '<div class="map-bar' + (gameDone() ? ' has-restart' : '') + '" id="mapbar">' +
      /* §E · THE WAY BACK INTO THE SUMMARY. Without it the end-game is a
         one-way door: its own exit is the map, and a player who takes it
         would be back in the loop the end-game exists to replace, with no
         way to reach their card again. Rendered only when the game is
         actually finished, so it cannot appear mid-run. */
      (gameDone()
        ? '<button type="button" class="map-done" id="mapdone">' +
            esc('לסיכום שלכם ›') + '</button>'                        /* TAMAR */
        : '') +
      /* T35 · THE RESTART DOOR ON A FINISHED MAP. gameDone() ALONE, and
         that is the ruling, not an inference: it is derived from
         PROGRESS and stays true across reloads, so once the game is
         finished the door is simply present on the map, every visit.
         THE ARRIVAL IS NOT THE CONDITION. #stage.is-ending is the one
         signal that can identify the single map view that follows the
         end sequence, and it is the wrong hook for exactly that reason —
         a control that vanishes on reload is a bug, not a state.
         SAME BAR, SO IT CANNOT COLLIDE. The bar exists because two
         absolutely-positioned pills once landed on each other; a second
         centred control goes in it rather than beside it.
         IT ROUTES TO resetConfirm(), the one whole-game confirm, so
         there is one definition of what a wipe is and one sheet asking
         for it — never a second modal. */
      (gameDone()
        ? '<button type="button" class="map-restart" id="maprestart">' +
            ph(MAP_RESTART_PH) + '</button>'
        : '') +
      /* v30c · SUPPRESSED ON A FINISHED MAP, and it is a suppression
         rather than a restack. The jump exists to return the player to
         the CURRENT topic; when every topic is done there is no current
         one and the pill would offer a journey to nowhere. Restacking it
         under the summary door would have left an invisible control
         still taking the tap on its own half of the overlap. */
      (gameDone()
        ? ''
        : '<button type="button" class="map-jump" id="mapjump">' +
            '<i aria-hidden="true">↓</i>חזרה לנושא הנוכחי</button>') +
    '</div>';

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

  /* T44 · THE BASE CARRIES THE HUE, AT THE VALUE IT ALREADY HAD.
   --node-fill stays #2E2A26 for all six -- §3.2 above settled that and its
   reasoning holds -- so the icon's ground never moves and no contrast
   ratio on the disc changes. Only the EXTRUSION is tinted.

   ISO-LUMINANT, AND THAT IS THE WHOLE TRICK. The base survives the map's
   gradient today for one reason: at L=0.0073 it is darker than the
   gradient's darkest stop (#8E2A2E, L=0.0760), so it separates everywhere
   the node scrolls. The gradient is on .stage and the nodes scroll THROUGH
   it, so a base that is merely "dark" is not enough -- it has to be below
   the whole range. Every mix of the topic hue into the base lifts it into
   that range and loses the edge somewhere on the scroll: colour-mixed at
   20% the worst case falls to 1.34, and --tc-shade's own 78%/black lands
   religion at L=0.388, a gold rim that vanishes against the gold end.
   So the hue is rotated at CONSTANT luminance instead. Each base is the
   topic colour scaled until its relative luminance equals the old base's,
   which makes every contrast ratio -- against the face, against all four
   gradient stops -- arithmetically identical to what shipped. */
/* T44b · 0.00726 was the old base's own luminance -- iso-luminant, so every
   ratio was identical to what shipped. Lifted to 0.0110, which buys about
   31% more chroma for a worst-case-against-the-gradient of 2.07 against
   the old 2.20. 0.0130 was on the table at 2.00 and was refused: the node
   scrolls the full gradient, so the worst case is met on every scroll and
   not occasionally. The bound is the darkest stop, #8E2A2E at L 0.0760. */
const NODE_BASE_L = 0.0110;
function tintBase(hex) {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = v => 0.2126 * lin(v[0]) + 0.7152 * lin(v[1]) + 0.0722 * lin(v[2]);
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (L(c.map(x => x * m)) < NODE_BASE_L) lo = m; else hi = m;
  }
  const m = (lo + hi) / 2;
  return '#' + c.map(x => Math.round(Math.min(255, x * m)).toString(16).padStart(2, '0')).join('');
}

  /* the face's centre inside the box: the path threads the DISC, not the
     ring, so this is what the node is positioned by */
  const fcy = parseFloat(CSVAR('--node-face-y')) + parseFloat(CSVAR('--node-face')) / 2;

  return '<div class="' + cls + '" data-topic="' + esc(t.id) + '" data-i="' + i + '" ' +
      'style="left:calc(' + (NODE_X(i) * 100).toFixed(2) + '% - ' + G.c + 'px);top:' +
      (cy - fcy) + 'px;--tc:' + t.color +
      ';--tc-face:' + t.color +
      ';--tc-shade:color-mix(in srgb,' + t.color + ' 78%,#000)' +
      ';--node-base:' + tintBase(t.color) + '">' +
    '<span class="ringnode">' +
      '<svg class="ring" viewBox="0 0 ' + G.box + ' ' + G.box + '" aria-hidden="true">' +
        '<g transform="rotate(-90 ' + G.c + ' ' + G.c + ')">' +
          Array.from({ length: n }, (_, k) => seg(k)).join('') + '</g></svg>' +
      '<button type="button" class="node-face" ' +
        'aria-label="' + esc(t.label + ' — ' + segs + ' מתוך ' + n) + '">' +
        face +
        /* T42 · NO ORDINAL BADGE. It carried the map index and nothing
           else -- no state variant, no aria (it was aria-hidden), no
           handler. The four states are already carried between the ring's
           segments, the current node's keyline and halo, .node-check and
           the status line, so there was nothing to migrate off it. */
        (done ? '<span class="node-check" aria-hidden="true">✓</span>' : '') +
      '</button>' +
    '</span>' +
    '<span class="node-name">' + esc(t.sub || t.label) + '</span>' +
    /* T19 · the span is only built when there is a line for it. An empty
       one still takes its own line box — 13px of it — which is the whole
       height this change is trying not to spend on an untouched node. */
    (statusLine(t.id)
      ? '<span class="node-status">' + statusLine(t.id) + '</span>' : '') +
  '</div>';
}

/* THE STATUS READS WITHOUT COLOUR — it is the same information the ring
   carries, in words, which is what makes the node legible at 360px to
   somebody who cannot separate the two hues. No lock, ever. */
function statusLine(id) {
  const s = segsDone(id), n = SEGS(id);
  if (topicDone(id)) return '✓ הושלם';
  /* T19 · NOTHING AT ALL ON AN UNTOUCHED NODE. 0/2 is not progress, it is
     the absence of it, and printing it under every unplayed topic gave
     eight nodes a line that says the same nothing eight times. The ring is
     already empty and the node already has no check; a player reading
     "0 מתוך 2" is being told what the whole node has just told them.
     The line comes back the moment there is something to report. */
  if (s <= 0) return '';
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
  const done = $('#mapdone');
  if (done) pressable(done).addEventListener('click', () => endGame());
  /* T35 · ONE CONFIRM, TWO ENTRY POINTS. resetConfirm() is the identity
     sheet's own door; this hands it the same call rather than building a
     second sheet that would then have to be kept in step with it. */
  const rst = $('#maprestart');
  if (rst) pressable(rst).addEventListener('click', () => resetConfirm());

  /* PARK THE FIRST INCOMPLETE NODE IN THE LOWER THIRD. Two thirds down the
     window, so what is above it — everything still to play — is what fills
     the screen, and the climb reads as the point of the map. */
  const park = () => { win.scrollTop = Math.max(0, curY - win.clientHeight * 0.667); };
  park();

  /* v30c · the pill is not in the DOM on a finished map, so everything
     that drives it is guarded rather than assuming it is there. */
  if (jump) {
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
  }

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

/* ===== A4b · THE ROUND IS UNMOUNTED, NOT HIDDEN ======================
   showScreen() toggles `hidden` on the four .screen sections and on the
   chyron, and that is all it knows about. The beat-2/3 surface is not one
   of them: .ov--stage is a child of #stage — it has to be, or the blur
   stops at .round's padding and the dot grid shows through at every
   border — so hiding the round left the chair, the prompt and the three
   vote chips painted over the map at z-index 9, above everything the map
   draws, with their handlers still attached. Its only removal was its own
   beat-3 dismiss tap, which is a tap the player who just left the round
   is by definition not going to make.

   REMOVING THAT ONE NODE WOULD HAVE BEEN THE SYMPTOM'S FIX. What was
   actually wrong is that a round had no teardown at all: S kept the
   abandoned round's beat, position and guesses until the next newRound()
   happened to overwrite it, #round kept the whole beat's DOM behind the
   hidden screen, the chyron kept whatever the last beat pinned in it, and
   the inverted round's step timers kept firing against a round that no
   longer exists. This is that teardown, and it is the ONE place that
   knows what a round parents outside itself.

   S IS SET TO NULL, NOT EMPTIED. Every reader of it either runs inside a
   round or already guards (exitRound), and a null is what makes a stale
   timer's `S.phase` test fail outright instead of quietly passing against
   the dead round's state.

   .stmodal[data-profile] IS NOT A ROUND'S. It is the map's character
   sheet, opened from the HUD sticker; the invitation opens after goMap()
   has returned, on the map's own settle. Neither is touched here. */
function endRound() {
  if (S && S.invTimers) S.invTimers.forEach(clearTimeout);
  S = null;

  /* every node a beat parents to the stage rather than to #round */
  $$('.ov, .tcal, .b1intro, .exitsheet, .stmodal:not([data-profile])')
    .forEach(n => n.remove());

  const chy = $('#chyron');
  if (chy) {
    chy.innerHTML = '';
    chy.classList.remove('is-mark', 'is-exiting');
    chy.classList.add('is-empty');
    chy.setAttribute('aria-hidden', 'true');
  }
  helper('');

  const sr = $('#scRound'); if (sr) sr.classList.remove('is-finale');
  const rd = $('#round');   if (rd) rd.innerHTML = '';
}

function goMap(o) {
  /* T25c · the ending's HUD suppression ends here, and here only. goMap()
     is the single way out of the sequence — the picker's back control and
     the map door both funnel through it — so one removal covers every
     path and the map gets its chip, its count and its avatar back intact. */
  $('#stage').classList.remove('is-ending');
  /* the round is torn down BEFORE the map is built, so renderMap() and
     showScreen('map') run against a stage with nothing of the round left
     on it. Every way out of a round funnels through here — the exit
     confirm's two paths and beat 5's חזרה למפה — and on the paths where
     there is no round (the intro launch, ?screen=map) it is a no-op. */
  endRound();
  renderMap();
  const m = $('#scMap');
  m.classList.remove('is-arriving'); void m.offsetWidth; m.classList.add('is-arriving');
  /* §C the identity moment is the ARRIVAL, after it has landed — never
     during map-in, never under the chair. `quiet` is the exit confirm's:
     an arrival by abandoning a round is not a moment to ask anything. */
  /* ITEM 43 · THE FIRST ARRIVAL COMES FIRST, and the two can never
     collide anyway: maybeInvite() needs a finished topic, which by
     definition has not happened on a first arrival, and it also refuses
     to open on top of an existing .stmodal. Ordered explicitly so that
     stays true if either condition is ever relaxed. */
  onMapSettled(m, () => {
    if (maybeMapIntro()) return;
    if (!(o && o.quiet)) maybeInvite();
  });
}

/* ===== §C · THE ARRIVAL GATE ========================================
   There was no "after the map has arrived" hook: goMap() fires the
   animation and returns. This is that hook, and it is the ONLY place
   that measures the arrival. Three arrivals exist and it waits for the
   longest thing on screen in each:
     · map-in (260ms) from a round or the end-game — animationend;
     · lx-dest (180ms) from the intro launch, while the chair is still
       flying — animationend comes early, so it also waits for .is-launch
       to come off the stage, which loadingBeat()'s finish() does;
     · reduced motion, where the launch arrival is animation:none and no
       animationend ever fires — the timer is the floor.
   It fires ONCE, whichever comes last. */
function onMapSettled(m, fn) {
  let done = false, launching = () => $('#stage').classList.contains('is-launch');
  let landed = false, obs = null;
  const go = () => {
    if (done) return;
    if (launching()) {
      /* the chair is still coming: wait for finish() to drop the class */
      if (!obs) {
        obs = new MutationObserver(() => { if (!launching()) { obs.disconnect(); obs = null; go(); } });
        obs.observe($('#stage'), { attributes: true, attributeFilter: ['class'] });
      }
      return;
    }
    done = true; m.removeEventListener('animationend', onEnd); fn();
  };
  const onEnd = e => { if (e.target === m) { landed = true; go(); } };
  m.addEventListener('animationend', onEnd);
  setTimeout(() => { if (!landed) go(); }, Math.max(T.mapIn, T.lxDest) + 60);
}

/* ===== §C · THE INVITATION ==========================================
   §4.1: "1–2 contextual invitations at identity moments (after first
   completed topic; pre-share)". The first of those, and only it.
   THE CONDITION IS STATE, NOT PATH. It reads what is true — a topic is
   complete, the player has not been asked, no voice is set — rather
   than which button brought them here, so a reload, a deep link and the
   end-game's חזרה למפה all behave the same. The exit confirm's arrival
   is the one exception and it opts out at the call site.
   ONCE. `invited` is written the moment the card opens, before anything
   is tapped, so a dismiss, an ✕, an Escape and a reload all count as
   asked. It is never re-armed; the door in the HUD is always there.
   NEVER if a voice is already set in 2b — there is nothing to ask. */
/* =====================================================================
   ITEM 43 · THE MAP'S FIRST ARRIVAL
   One sticker, the first time the player reaches the map, once ever. It
   says what the next minute is FOR; it does not teach anyone to tap.

   IT DOES NOT BLOCK, and that is structural rather than a promise: it is
   stickerModal(), so the ✕, the ground and Escape all dismiss it exactly
   as they dismiss the law, the glossary and the invitation. There is no
   branch in here that could make it modal in the blocking sense.

   THE FLAG IS WRITTEN WHEN IT IS SHOWN, not when it is dismissed. A
   player who closes the tab mid-sticker has still had their first
   arrival; re-showing it on the next launch would make "once ever" a lie
   in the one case where it is most annoying.
   ===================================================================== */
/* COPY IS TAMAR'S AND NONE OF IT IS WRITTEN HERE. These are the briefs
   for the three strings, rendered as visible placeholders — see
   .stmodal[data-mapintro] in proto.css, which gives them the hazard
   treatment and, unlike every other ph() marker, does NOT hide them in
   the default build: a first-run sticker with three blank slots is worse
   than one that says out loud what it is waiting for. */
/* T2 · TAMAR'S LINE, AND IT IS ONE SENTENCE. The three placeholders were
   a title/body/button split standing in for copy nobody had written; what
   came back is a single instruction, so the title slot has no string to
   hold and is not rendered rather than being filled with half the
   sentence. The button still has no copy and keeps its marked
   placeholder — it is the one thing here still waiting.
   IT RUNS THREE LINES, NOT TWO, and the box does not grow: dropping the
   title takes 44.5px out and the third line puts 18.2 back, so the
   sticker is 26.3px SHORTER than the placeholder build. Measured, see
   the report — including that the "77-character two-line budget" the item
   quotes is the placeholder's own length and was never a budget: 77
   characters run four lines in this 244px column and two lines hold 68. */
const MAP_INTRO_COPY = {                                              /* TAMAR */
  title: 'אז איך זה עובד?',                                          /* TAMAR · T16 */
  line: 'הכנסו לנושא הראשון במפה, ענו על השאלות והמשיכו להתקדם במשחק לאורך מפת הנושאים ולצבור מטבעות',            /* TAMAR */
  go:   'מתחילים',
};
function seenMapIntro() {
  if (DEV.mapIntro !== null) return !DEV.mapIntro;
  return MAP_INTRO_SEEN;
}
function markMapIntroSeen() {
  /* an override never spends the player's one first arrival */
  if (DEV.mapIntro !== null) return;
  MAP_INTRO_SEEN = true;
  saveState();
}
/* T13 · ARMED FROM ONE PLACE, AND IT IS THE ROUTER. showScreen() is the
   only code that knows which screen is up, and it is already what shows
   and hides this button. Arming here rather than in goMap() is what makes
   "never left breathing on any other screen" a property of the code
   instead of a promise: the round and the intro hide the avatar outright,
   and the end-game keeps the map's HUD but is not the map, so it does not
   get the class. Leaving the map removes it on the same call that swaps
   the button for the ✕.
   THE STROKE IS NOT TOUCHED HERE. It is permanent and unconditional and
   lives entirely in .hud-you's own rule; only the pulse is state. */
function avBeaconOn() {
  if (DEV.beacon !== null) return DEV.beacon;
  return !AV_BEACON_SPENT;
}
function syncAvBeacon(screen) {
  const av = $('#hudAvatar'); if (!av) return;
  av.classList.toggle('is-beacon', screen === 'map' && avBeaconOn());
}
function spendAvBeacon() {
  /* an override never spends the real flag — same contract as
     markMapIntroSeen() and markIntroSeen() */
  if (DEV.beacon === null) {
    if (AV_BEACON_SPENT) return;
    AV_BEACON_SPENT = true;
    saveState();
  }
  const av = $('#hudAvatar'); if (av) av.classList.remove('is-beacon');
}

/* ===================== SOUND · THE TOGGLE ============================
   IT SHIPS WITH THE FIRST SOUND, never after: with sound off by default
   this control is the only way anyone learns sound exists at all.

   NOT IN THE HUD, AND BOTTOM-LEFT. The HUD's three slots are the coin
   chip, the count and the avatar, and all three are subject matter; this
   is a setting. The corner is free on both screens it appears on — the
   map bar's own pill starts at x=112 and the round's card foot ends at
   y=791, against a 44px target at [12,786].

   MAP AND ROUNDS ONLY, and that is the app's own rule rather than a new
   one. .stage.is-ending .hud{display:none} already takes the coin chip
   and the progress pill off for the whole ending because they are round
   chrome and the round is over. A control governing sounds that only
   fire in a round is round chrome by the same test, so it goes with them
   and comes back with them on goMap().

   ARMED FROM THE ROUTER, exactly as T13's beacon is. showScreen() is the
   only code that knows which screen is up, which is what makes "never
   left on a screen it does not belong to" a property of the code rather
   than a promise. See syncAvBeacon() directly above — this is the same
   mechanism, not a second one.

   THE RESTING STATE IS THE SLASHED SPEAKER because sound is off, and the
   slash is the true state rather than a warning. It also reads as an
   invitation in a way a plain speaker does not.

   FULL WHITE ON THE MAP, 0.7 EVERYWHERE ELSE. Measured: the map's ground
   under this corner is #E4752C and pure white is 3.05:1 against it, so
   every reduction fails there and the map gets 1.0. The round's ground is
   --ground #2B2926, where 0.7 white is 7.9:1 and the toggle can afford to
   be quiet. The opacity is per-screen in CSS; there is no plate and no
   new object.

   ONE ARC ON, NOT THREE. At 20px the outermost of three concentric arcs
   sits 2px from the box edge and the set smears; the slashed state is the
   more legible of the two because the slash REPLACES the arcs rather than
   adding to them. So the on-state carries one. */
/* O2 · ONE SWITCH, BOTH CHANNELS, AND THE LABEL HAS TO SAY SO. Haptics
   ride sndOn() now — see buzz(). The control did not change, the glyph
   did not change and the flag did not change; what changed is what the
   switch governs, so the only honest move is to name the second channel
   in the string. רטט is the standard word and the label stays literal:
   this is a screen-reader name, not a slogan.
   THE FLAG CARRIES BOTH. `snd` in the save is one boolean and it did not
   need a second — see setSound(). */
const SND_LBL = {
  off: 'הפעלת צלילים ורטט',                                     /* TAMAR · O2 */
  on:  'השתקת צלילים ורטט'                                      /* TAMAR · O2 */
};
/* the fade-up is ONE-SHOT PER SESSION rather than once-ever, and that is
   the one place this departs from T13. T13 spends its flag in the save;
   a sixth boolean was not sanctioned by the brief, and an ENTRANCE is not
   an attention loop the way a 2000ms infinite pulse is — every other
   entrance in the app replays on a fresh session too. */
let SND_ARRIVED = false;

function sndGlyph(on) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
    '<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/>' +
    (on ? '<path d="M15.6 9.2a4.4 4.4 0 0 1 0 5.6" fill="none" stroke="currentColor" ' +
          'stroke-width="2.2" stroke-linecap="round"/>'
        : '<path d="M21 9.5l-5 5M16 9.5l5 5" fill="none" stroke="currentColor" ' +
          'stroke-width="2.2" stroke-linecap="round"/>') +
  '</svg>';
}

function paintSndToggle() {
  const b = $('#sndToggle'); if (!b) return;
  const on = sndOn();
  b.innerHTML = sndGlyph(on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.setAttribute('aria-label', on ? SND_LBL.on : SND_LBL.off);
  b.classList.toggle('is-on', on);
}

/* THE PREFERENCE IS WRITTEN THE MOMENT IT CHANGES, not on some later
   save: a player who switches sound on and closes the tab meant it. */
function setSound(on) {
  SND_ON = !!on;
  if (DEV.sound === null) saveState();
  if (SND_ON) { unlockAudio(); sfxLoad(); }
  /* O2 · NOTHING TO ARM ON THE HAPTIC SIDE. buzz() reads sndOn() at the
     moment it fires, and the Vibration API needs no context, no decode
     and no preload — only sticky activation, which the tap that flipped
     this switch has already given the page. */
  paintSndToggle();
}

function buildSndToggle() {
  const st = $('#stage'); if (!st || $('#sndToggle')) return;
  const b = el('button', 'snd-t');
  b.id = 'sndToggle';
  b.type = 'button';
  b.hidden = true;
  st.appendChild(b);
  /* pressable() carries the unlock, so the toggle's own press is what
     opens the audio context on iOS — the player turning sound on IS the
     gesture that makes sound possible. */
  pressable(b).addEventListener('click', () => setSound(!sndOn()));
  paintSndToggle();
}

/* T26 · NOT ON BEAT 2, and this is a collision rather than a preference.
   At 360x640 the toggle's 44px target sits at [12,582] and beat 2's נגד
   button at [16,543,97x60] — they overlap by 40x21px, and hit-testing
   that region returns the TOGGLE. A player aiming at the bottom-left of
   נגד mutes the game instead of voting against the bill. At 390x844 the
   two clear each other by 24px, so it is a short-screen bug, but the
   control is removed from the beat at every width: a mute button that
   overlaps a vote button on some phones and not others is worse than one
   that is simply not on this screen.
   BEAT 2 IS ALSO THE ONE BEAT THAT OWES THE PLAYER NOTHING, and the
   toggle is the only chrome on the screen that is not part of the
   question being asked.
   O2 · THE REASON GIVEN HERE USED TO BE "buzz() already refuses here",
   AND THAT WAS NEVER RELIABLE. The refusal was a beat-number check and
   the banner handoff walked straight past it by landing 220ms after the
   beat advanced. buzz() now refuses by identity — there is no event
   named for beat 2 in its table — so the sentence is true for a
   different and much better reason. The collision argument above is what
   removes the toggle from this beat regardless.
   IT IS NOT STRANDED. The same control is on the map and on beats 1, 3,
   4 and 5, which is every other surface that has it. */
function sndToggleShown(screen) {
  if (screen !== 'map' && screen !== 'round') return false;
  return !(S && S.beat === 2);
}

function syncSndToggle(screen) {
  const b = $('#sndToggle'); if (!b) return;
  const show = sndToggleShown(screen);
  b.hidden = !show;
  if (show && screen === 'map' && !SND_ARRIVED) {
    SND_ARRIVED = true;
    /* skipped entirely under reduce, the way nudgeCover() skips the tape's
       wiggle: an entrance that resolves in 1ms is a flicker with no
       meaning, and the toggle simply being there is the correct still. */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    /* the same contract the beacon keeps: the class is added, the
       animation runs once, and the class comes off on its own end so
       nothing is left holding a fill state. Under reduced motion the
       rule kills the NAME, so there is no 1ms stub to clean up and the
       handler simply never fires — hence the class is removed here too. */
    b.classList.add('is-arriving');
    b.addEventListener('animationend', () => b.classList.remove('is-arriving'), { once: true });
  }
}

function maybeMapIntro() {
  if (seenMapIntro()) return false;
  if ($('#stage').dataset.screen !== 'map') return false;
  /* never on top of another sheet — the same guard the invitation uses */
  if ($('.stmodal') || $('.exitsheet')) return false;
  markMapIntroSeen();
  mapIntroModal();
  return true;
}
function mapIntroModal() {
  const m = stickerModal({
    /* T16 · the title slot has a string again. It was left out in T2
       because the copy was one sentence; the :empty rule that collapsed
       the slot is untouched and simply stops matching now. */
    title: MAP_INTRO_COPY.title,
    body:  MAP_INTRO_COPY.line,
    /* T59 · the how-it-works hero: the gold coin with the chair, which is
       the game's own mark. NO titleLg — this modal sets its own 18px below
       the .is-titlelg rule and has never taken the bigger size. */
    art: ROOT + HERO.howto,
    heroKey: 'mapintro',
    extra: '<button type="button" class="p-c mi-go">' +
             esc(MAP_INTRO_COPY.go) + '</button>',                    /* TAMAR */
    /* EVERY WAY OUT LEADS TO THE SAME PLACE. The suggestion follows the
       sticker however it was dismissed — button, ✕, ground or Escape —
       because it is the answer to "so where do I start", and a player who
       closed the sticker with the ✕ asked that question just as much as
       one who pressed the button. */
    onClose: () => breatheFirstNode(),
  });
  m.dataset.mapintro = '';
  const go = $('.mi-go', m);
  if (go) pressable(go).addEventListener('click', () => m._close());
  return m;
}
/* ---- the suggestion, and it is only ever that ----------------------
   ONE node breathes: the FIRST TOPIC IN THE MAP'S EXISTING ORDER. No
   recommendation is computed and nothing is reordered — TOPICS() is
   data.js's own array order and this reads index 0 of it.
   IT IS AN INVITATION AND NEVER A GATE. Nothing here disables, dims,
   covers or reorders any other node; every one of them keeps the click
   handler wireMap() gave it. The only thing that changes on the map is
   that one disc is moving.
   IT STOPS ON THE FIRST NODE TAP, ANY NODE — including a tap on a
   different topic, which is the case that matters: choosing something
   else has to end the suggestion, not leave it pulsing next to the topic
   the player has just decided against. Capture phase, so it fires whether
   or not anything downstream stops the event.
   prefers-reduced-motion: the sticker still shows and nothing breathes.
   The class is never added, exactly as startBreath() does it. */
function breatheFirstNode() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const map = $('#scMap'); if (!map) return;
  const face = $('.node .node-face', map);
  if (!face) return;
  face.classList.add('is-breathing');
  const stop = e => {
    if (!e.target.closest || !e.target.closest('.node-face')) return;
    face.classList.remove('is-breathing');
    map.removeEventListener('pointerdown', stop, true);
  };
  map.addEventListener('pointerdown', stop, true);
}

function maybeInvite() {
  if (PROFILE.invited || PROFILE.gender !== null) return;
  if (topicsDone() < 1) return;
  if ($('#stage').dataset.screen !== 'map') return;
  if ($('.stmodal') || $('.exitsheet')) return;
  inviteModal();
}

/* ONE CARD, ONE LINE, THREE EQUAL CHIPS. The dismiss is the same size
   and the same shape as the two answers, because "I'd rather not say"
   is an answer and not a lesser one. The second line is the sheet's
   other identity hook — the avatar, and a way to change it — and it
   opens 2a INSIDE this same sticker, never a second one on top.
   It is the same modal 2b is, so the ground, the ✕ and Escape all
   dismiss it. */
function inviteModal() {
  setProfile({ invited: true });
  const m = stickerModal({ hero: false, extra: '<div class="prof prof--invite" data-prof></div>' });
  m.dataset.profile = '';
  const box = $('[data-prof]', m);
  box.innerHTML =
    '<p class="inv-q">' + esc(PROF_COPY.voice) + '</p>' +
    '<div class="inv-row" role="group" aria-label="' + esc(PROF_COPY.voice) + '">' +
      '<button type="button" class="gchip" data-g="f">' + esc(PROF_COPY.f) + '</button>' +
      '<button type="button" class="gchip" data-g="m">' + esc(PROF_COPY.m) + '</button>' +
      '<button type="button" class="gchip" data-g="">' + esc(PROF_COPY.skip) + '</button>' +
    '</div>' +
    '<p class="inv-av">' +
      '<span class="as-d inv-av__st" aria-hidden="true">' + avatarSvg() + '</span>' +
      '<span>' + esc(PROF_COPY.hud) + '</span>' +
      (presets().length
        ? '<button type="button" class="inv-link" data-swap>' + esc(PROF_COPY.change) + '</button>'
        : '') +
    '</p>';
  $$('.gchip', box).forEach(c => pressable(c).addEventListener('click', () => {
    if (c.dataset.g) setProfile({ gender: c.dataset.g });
    $('.stmodal__x', m).click();
  }));
  /* T21 · IT OPENS THE BUILDER NOW, NOT THE PRESET SHEET. renderSheet()
     is the templates — pick one of the drawn characters and close.
     renderBuilder() is the six-axis customisation. החליפו next to
     "הדמות שלכם" is an offer to make the character yours, and handing
     that press a grid of other people's faces answers a different
     question. 2b's own two doors already distinguish them: [data-swap]
     goes to the sheet there and [data-build] to the builder; this link
     was wired to the first of those and should always have been the
     second. */
  const sw = $('[data-swap]', box);
  /* P2 · the largest move in the app, 183 -> 557, on the same 200ms as
     the 148 in 2b. The frame does not get a longer duration for being
     asked to travel further; see --t-swap. */
  if (sw) pressable(sw).addEventListener('click', () => stickerSwap(m, () => renderBuilder(m)));
  return m;
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

/* =====================================================================
   §E · THE END-GAME, FIVE BEATS.

   WHAT IT REPLACES. The terminal state used to be a loop: beat 5's exit
   was a per-topic question, so the last issue of the last topic fell
   through to חזרה למפה, the map read 6/6, and tapping any node replayed
   it (openTopic's `|| topicIssues(id)[0]` fallback). Nothing in the game
   could say it was over. gameDone() says it now.

   EVERY NUMBER ON THIS SCREEN IS DERIVED, and derived HERE. There is no
   stored total anywhere: endStats() reads RECORD — written one round at
   a time by beat 5 — and data.js, on every entry. Re-cut the content and
   the end-game re-counts. That is why the brief's own example figures
   (11 surprises, 5 of 8) appear nowhere in this file: they were written
   against the 16-round set and would be a lie on this one.

   THE FIVE BEATS ARE FOUR SCREENS. Beats 4 and 5 share one, because
   "the buttons arrive last and stay" is a statement about the card's
   screen — the exits arrive under the card and do not replace it.
   ===================================================================== */

/* ---------------------------------------------------------------------
   THE DERIVATIONS.

   A SURPRISE IS A PREDICTION REALITY DID NOT MATCH, and both kinds
   count: the claim at beat 1 and every MK at beat 4. That makes the
   arithmetic closed — asked = correct + surprises — so the share card
   and the record screen can never disagree, which is the §0.4 rule
   about the game never lying about its own numbers.

   THE ALIGNMENT DENOMINATOR IS THE ISSUES THAT CARRY A VOTE COUNT, and
   it is small on purpose: only 4 of the 11 active issues have _tally, so
   only 4 have a documented outcome to compare a position against. The
   alternative — inferring a direction from some other field — would
   invent an outcome the data does not state, on a product whose whole
   credibility is documented votes. So the number stays 4 and the COPY
   says what the 4 is.
   AN ABSTENTION IS COUNTED AND NEVER MATCHES. Dropping נמנע from the
   denominator would make it move per player and the sentence stop being
   checkable; keeping it is also just true — an abstention is not a vote
   with the majority.
   HARD GUARDRAIL (§1.4c, sheet p.11): the comparison is to WHAT
   HAPPENED, never to who the player resembles. There is no party, bloc
   or MK anywhere in this section, and there must never be one.
   --------------------------------------------------------------------- */
function endStats() {
  const ids = Object.keys(RECORD);
  let asked = 0, correct = 0, alignHits = 0, alignOf = 0;
  ids.forEach(id => {
    const r = RECORD[id];
    if (!r) return;
    /* one claim per round, plus however many MKs it asked about */
    asked   += 1 + (r.cards || 0);
    correct += (r.claim ? 1 : 0) + (r.hits || 0);
    const iss = DATA.issues.find(i => i.id === id);
    const tal = iss && iss._tally;
    if (tal && r.pos) {
      alignOf++;
      const majority = tal.for > tal.against ? 'for' : 'against';
      if (r.pos === majority) alignHits++;
    }
  });
  return { rounds: ids.length, asked, correct, surprises: asked - correct,
           alignHits, alignOf, coins: wallet };
}

/* the topic's own drawn object, exactly as the map's nodes resolve it —
   same manifest entry, same fallback to data.js's glyph. */
function topicFace(t, px) {
  const A = M.topics && M.topics[t.id];
  const art = A && (A['256'] || A['128'] || A['64']);
  if (!art) return '<span class="eg-ico" aria-hidden="true">' + t.icon + '</span>';
  const a = A.aspect || 1;
  const w = a >= 1 ? px : px * a, h = a >= 1 ? px / a : px;
  return '<img class="eg-ico" src="' + ROOT + art + '" alt="" style="width:' +
    w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px">';
}

/* the allocation, in memory only. It is NOT in the save: the brief's
   "do not persist anything else" is a rule about the store, and this is
   a decision the player makes on one screen and carries to the next.
   `wallet` is never mutated by it either — the earned total is a fact
   about the run and the allocation is a view over it, so the HUD chip
   keeps reading what was earned while this screen counts what is left. */
let ALLOC = {};

/* =====================================================================
   ITEM 19 · THE FREE-TEXT ROW
   Its COINS live in ALLOC like any other row's, under a key that is not
   and cannot become a topic id — data.js's ids are slugs and this starts
   with two underscores — so every sum over ALLOC (egPlaced, egRemaining)
   counts them without a special case, and every lookup BY TOPIC misses
   them without a special case either. That second half is the whole
   safety property; see cardTopics().
   Its NAME lives here, alone. It is not in ALLOC, not in PROFILE and not
   in the save, so it cannot be reached by anything that walks those. The
   ONE reader outside this screen is cardTopics(), since 09 Sep — see the
   dated note there; that is a decision, not drift.
   ===================================================================== */
const OTHER_KEY = '__other';
/* 11, NOT 24 — AND NOT 12. The player's own pill is never the widest thing
   in the block, in either script: 12 Hebrew characters is safe but 12
   Latin measures 332px at card scale, wider than the widest system pill
   (312px). The rule is absolute, so the cap is 11. Lowered together with
   the gate in cardTopics() opening — one without the other does nothing,
   or ships a 466px pill. v29h, 09 Sep. */
const OTHER_MAX = 11;                 /* the hard cap on what can be typed */
let ALLOC_OTHER_NAME = '';            /* NEVER leaves this screen */

/* =====================================================================
   THE END-GAME ROUTER. One screen, four stages, each replacing the last
   — the same shape as the round's beats, and for the same reason: the
   stage is a fixed box with overflow:hidden and a scrolling column here
   would be the second scrolling surface in an app that has exactly one.
   ===================================================================== */
async function endGame() {
  if (window.HAC) HAC('game_complete', { score: wallet, issues_done: Object.keys(PROGRESS).length });
  ALLOC = {};
  /* ITEM 19 · the label goes with the coins. Replaying must not leave a
     previous run's word sitting on an empty row. */
  ALLOC_OTHER_NAME = '';
  /* v30c · showScreen IS CALLED BY egOverlay(), not here. Screens 1 and
     2 are an overlay over the round that has just ended, so the round
     screen has to stay up behind the blur — and the HUD's slots still
     have to become the summary's. egOverlay() does both, in that order,
     and this function no longer knows which screen it is landing on. */
  /* v29h · NON-NEGOTIABLE 3 · the share card's assets are fetched and
     base64'd NOW, while beats 1–3 play, so beat 4's first export is the
     warm ~150ms and not the cold 1.3s measured on the phone. This is the
     ONLY call site: endGame() is reached from the finale's last door and
     from ?screen=end, and from nowhere on load or on the map — a player
     who never finishes never pays for it. */
  shWarm();
  await egOverlay();
}

/* =====================================================================
   T25c · THE WHOLE ENDING IS ONE OVERLAY, AND THE BLUR IS PAINTED ONCE.

   WHAT IT REPLACES. Screens 1 and 2 were an overlay over the blurred
   finale board; 3 and 4 were surfaces on #scEnd. The player crossed from
   one environment into another halfway through an ending that is supposed
   to be one thing, which is the whole of Lion's note.

   THE KEYBOARD OBJECTION DID NOT SURVIVE THE TEST, and it turned out to
   be pointing the wrong way. Measured with a 336px iOS keyboard driven
   exactly as kbSync() drives it, the SURFACE moved the free-text field by
   0px and left it 182.9px under the keyboard at 390x844 and 150.9px under
   at 360x640 — and the list could not be scrolled to rescue it, because
   the scroller's own box is under the keyboard too. §N says why in its
   first paragraph: --vh mirrors window.innerHeight, and window.innerHeight
   does not change on iOS when the keyboard opens. A flex surface sized to
   it does not re-lay-out either.
   WHAT DOES WORK IS CONSUMING --kb-h, and the app already ships that: the
   2b profile sheet is an absolutely-positioned overlay with a text field
   in it, and it survives the keyboard because .stmodal pads its foot by
   --kb-h and caps its box at --kb-vis. .ov--end does the same now. The
   overlay is not merely safe here — it is the repair.

   ONE OVERLAY, FOUR CONTENTS. Screens 1 and 2 are the posed column;
   3 and 4 are panes swapped into the same box. The backdrop is never
   re-rendered across the entire ending, which is the .ovpane argument
   from beat 2 carried to its end.
   ===================================================================== */
function egStage() {
  const ov = $('.ov--end');
  /* NO OVERLAY MEANS NO SEQUENCE — a ?screen=end deep link that somehow
     reached a beat without egOverlay(). The old #scEnd path is kept for
     exactly that case rather than deleted, because a demo link that
     throws is worse than one that renders plainly. */
  if (!ov) {
    const r = $('#scEnd');
    r.hidden = false;
    r.innerHTML = '<div class="eg-fx" id="egFx" aria-hidden="true"></div>' +
                  '<div class="eg-col" id="egCol"></div>';
    return $('#egCol', r);
  }
  const pane = el('div', 'egov__pane eg-col is-next');
  pane.id = 'egCol';
  ov.appendChild(pane);
  return pane;
}

/* THE SWAP · OUT LEFT, IN FROM THE RIGHT, WHICH IS FORWARD IN RTL.
   The direction and the easing are the deck's own — .deckcard.is-leaving
   travels left on --t-card-exit with --e-in — so the ending advances in
   the vocabulary the round already taught rather than in a second one.
   The distance is not the deck's 420px: a card is thrown off the screen
   and a pane is replaced in place, so it travels 64px, far enough to read
   as a direction and not so far that the ending looks like it is being
   dealt. Reduced motion lands both halves immediately. */
function egSwapIn(pane) {
  if (!pane) return;
  const ov = pane.parentElement; if (!ov) return;
  /* every pane BUT the incoming one leaves. Finding them here rather than
     being handed one means a beat cannot forget to retire its predecessor
     and leave two panes stacked in the same grid cell. */
  [].slice.call(ov.querySelectorAll('.egov__pane, .egov__col, .egov__chair'))
    .forEach(n => {
      if (n === pane) return;
      n.classList.remove('is-next');
      n.classList.add('is-gone');
      setTimeout(() => n.remove(), (egReduced() ? 0 : T.cardExit) + 40);
    });
  /* A FORCED REFLOW, NOT requestAnimationFrame, and runAxis() is where
     this file learned that: rAF does not fire in a backgrounded tab, so
     the class never comes off and the pane stays at opacity:0 — which
     for a pane rather than a token is the whole screen, permanently.
     Reading offsetWidth flushes the pending style synchronously and gives
     the transition its "from" without depending on a frame ever arriving. */
  void pane.offsetWidth;
  pane.classList.remove('is-next');
}

const egReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const egStep = ms => wait(egReduced() ? 0 : ms);

/* =====================================================================
   BEAT 1 · THE CONFETTI.

   THE ONLY CONFETTI IN THE GAME. It was cut from every per-round reveal
   for two reasons the sheet records as a High bug (§0.4-1): it fired at
   3/5, and it covered the results table. Both are answered here by the
   same two rules — it fires ONCE, on completing the map, and it lands
   AFTER the screen has settled.

   NEVER OVER CONTENT, STRUCTURALLY. #egFx is a sibling BEFORE .eg-col
   and sits at a lower z-index, so the pieces fall BEHIND the words. That
   is a stacking fact rather than a timing promise: even if the copy grew
   or the beat were re-ordered, the payload cannot be covered.

   NOT THE SIX TOPIC HUES. Cycling the topic palette would draw a rainbow
   across the screen, which is the exact thing lsGlyph() rejected on the
   title for a reason that has not changed: in Israel a rainbow reads as
   a pride symbol, one of the six live topics is מגדר ושוויון, and a
   celebration is the last place to make an unintended political
   statement. The pieces take the app's own neutrals and the coin's gold.

   ONCE, AND ONCE MEANS ONCE. EG_CONFETTI_SPENT is carried in the save,
   so a reload does not buy a second celebration — see the note beside it
   in THE SAVE. ?reset clears the store and therefore re-arms it, which
   is correct: that flag exists to hand a demo a clean first run.
   ===================================================================== */
const EG_CONFETTI_N = 34;
/* v30c · THE HOST IS AN ARGUMENT NOW. Screen 1 is an overlay rather than
   a beat on #scEnd, so the layer the pieces fall into is not always the
   one #egFx names — and two elements carrying that id, even for the
   260ms the overlay outlives the collapse, is a bug waiting to be found
   by the next person who queries it. The default is unchanged. */
function egConfetti(host) {
  /* SWEEP-2 · GATED ON COMPLETION AS WELL AS ON THE FLAG. The spent flag
     answers "has this player already had it"; it never answered "has the
     map actually been finished". On the real path that gap is invisible,
     because endGame() is only reached at completion -- but ?screen=end
     jumps straight here, and that is the link used to show the ending in
     a meeting. Measured before this line existed: 34 pieces at 8/8 and
     34 pieces at 0/6, identical. The one audience seeing confetti for a
     map nobody finished was a client.
     IT IS THE SAME TEST egOverlay() ALREADY MAKES one screen earlier --
     topicsDone() against TOPICS().length -- so the celebration and the
     screen that carries it now agree about what completion is. */
  if (topicsDone() < TOPICS().length) return;
  if (EG_CONFETTI_SPENT || egReduced()) return;
  EG_CONFETTI_SPENT = true;
  saveState();                    /* spent is spent, across reloads too */
  const fx = host || $('#egFx'); if (!fx) return;
  for (let i = 0; i < EG_CONFETTI_N; i++) {
    const p = el('i', 'eg-cf eg-cf--' + (i % 3));
    p.style.left = (Math.random() * 100).toFixed(2) + '%';
    p.style.animationDelay = (Math.random() * 620).toFixed(0) + 'ms';
    p.style.animationDuration = (1500 + Math.random() * 900).toFixed(0) + 'ms';
    p.style.setProperty('--cf-spin', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    p.style.setProperty('--cf-drift', (Math.random() * 44 - 22).toFixed(0) + 'px');
    fx.appendChild(p);
  }
  setTimeout(() => { fx.innerHTML = ''; }, 3200);
}

/* =====================================================================
   v30c · SCREENS 1 AND 2 ARE ONE OVERLAY IN TWO STEPS.

   WHAT IT REPLACES. egBeat1 and egBeat2 were two full screens on #scEnd,
   and the MAP — the object the whole run has been filling since minute
   one — was a fraction on the first of them and absent from the second.
   The completion arrived as "6/6" and left again before the record it
   was supposed to introduce had been shown.

   ONE SURFACE, TWO STEPS, NEVER TWO SCREENS. .ov--end IS .ov--stage: the
   same 9px backdrop-filter, painted ONCE and never re-rendered. Step 1
   is egPose(0), step 2 is egPose(1), and every frame of the handoff is
   egPose(e) — ONE function at different progress values, so the last
   frame of the transition IS screen 2 rather than a drawing that
   resembles it. That is the .ovpane argument two blocks up in the
   stylesheet, applied to a longer move: two overlays would be two blurs
   and the seam reads as a load.

   THE LAST SCREEN STAYS BEHIND IT. #scRound is not hidden while this is
   up — the finale board the player has just finished is what the blur is
   blurring, which is what makes the overlay read as an interruption
   rather than a navigation. It is hidden at the collapse, not before.

   THE OVERLAY COVERS THE HUD, and it is the only surface in the app that
   does: .ov--end takes z-index 13 against the HUD's 12. Beat 2's
   .ov--stage is 9 and has ALWAYS sat under the HUD — see the report; it
   is not changed here, because that would change every round.
   ===================================================================== */

/* ---- the geometry, and it is the board's own ------------------------
   NODE/SNODE and the 84px row are v30b/sequence.src.html's mapMorph()
   verbatim. The two things generalised out of it are the row count and
   the strip's spread: the board drew six because the sheet leaves six,
   and TOPICS() is read live everywhere else in this file. rows is
   ceil(n/2) and the strip is centred on (n-1)/2 steps, which reproduces
   the board's own 95 - i*38 at n=6 exactly and does not invent a second
   layout at any other count. */
const EG_NODE = 74, EG_SNODE = 31, EG_SGAP = 7;
/* =====================================================================
   T25 · THE ROW PITCH IS MEASURED, AND IT USED TO BE A COLLISION.

   EG_ROW was a flat 84 against a 74px node, so a row had 10px between one
   node's foot and the next node's head — and .egn__lab sits in that 10px
   with a 4px margin and a 13.2px line. Measured: every label overlapped
   the ring below it by 7.3px, on all three rows, not only the one that
   wraps. It was not a crowding problem, it was an overlap.

   PER ROW, NOT ONE PITCH. Only אחריות ציבורית wraps today and it happens
   to sit in the last row, where there is nothing under it. Reserving two
   lines on every row to cover that would spend 13px three times for one
   label. Each row is given the height its OWN tallest label needs, so a
   re-cut content set that puts a long label in row 0 gets the room there
   and nowhere else.
   THE AIR IS NAMED. EG_ROW_AIR is the clear space between a label's foot
   and the next ring, and it is the number to argue with if this still
   reads tight. EG_LAB_GAP is .egn__lab's own margin-top, stated here so
   the arithmetic is not reading a stylesheet value it cannot see.
   ===================================================================== */
const EG_LAB_GAP = 4;               /* .egn__lab's margin-top             */
const EG_ROW_AIR = 10;              /* label foot -> next ring, clear     */
let EG_ROWS   = [];                 /* each row's y offset, measured      */
let EG_GRID_H = 0;                  /* the grid at e=0, measured          */
/* the chair's own two numbers: the board's .66, and how far its inboard
   edge is allowed inside the column. 20px is the overlap the board draws
   at 390 — enough that the arm passes BEHIND the document and the two
   read as one object, not enough to reach the seat. */
const EG_CHAIR_S = 0.66, EG_CHAIR_BITE = 20;
/* THE FALLBACK, for a build that somehow poses before it measures: one
   line of label on every row. egMeasureRows() replaces both values with
   what was actually rendered. */
function egRowsFallback(n) {
  const rows = Math.ceil(n / 2), h = EG_NODE + EG_LAB_GAP + 13.2;
  EG_ROWS = []; for (let r = 0; r < rows; r++) EG_ROWS.push(r * (h + EG_ROW_AIR));
  EG_GRID_H = (EG_ROWS[rows - 1] || 0) + h;
}

/* ONE READ, and it is the only place either number is written. The grid
   ends at the LAST label's foot rather than a whole row further on: the
   air under the bottom row is the column's gap, not the grid's, and
   counting it twice pushed the count line down by 10px for nothing. */
function egMeasureRows(ov) {
  const labs = [].slice.call(ov.querySelectorAll('.egn__lab'));
  const n = labs.length; if (!n) return;
  const rows = Math.ceil(n / 2);
  EG_ROWS = [];
  let y = 0, tall = 0;
  for (let r = 0; r < rows; r++) {
    EG_ROWS.push(y);
    const a = labs[r * 2], b = labs[r * 2 + 1];
    tall = Math.max(a ? a.offsetHeight : 0, b ? b.offsetHeight : 0);
    y += EG_NODE + EG_LAB_GAP + tall + EG_ROW_AIR;
  }
  EG_GRID_H = EG_ROWS[rows - 1] + EG_NODE + EG_LAB_GAP + tall;
}
const EG_EASE3 = e => 1 - Math.pow(1 - e, 3);
const eg01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

/* one node, drawn the way the map draws one: the same ring, the same
   area-normalised icon, the same check. It is a copy of nodeHTML's face
   logic and not a call to it, because nodeHTML positions itself on the
   path from --node-box and --node-face-y and this one is positioned by
   egPose. The RING IS FULL here with no per-segment state: every topic
   on this screen is complete by definition — gameDone() is what opened
   it — so a partial ring could not be true. */
function egNodeHTML(t, i) {
  const T_ = M.topics && M.topics[t.id];
  const art = T_ && (T_['256'] || T_['128'] || T_['64']);
  let face;
  if (art) {
    const S = EG_NODE * 0.40 * (T_.node_scale || 1);
    const a = T_.aspect || 1;
    const w = a >= 1 ? S : S * a, hh = a >= 1 ? S / a : S;
    face = '<img src="' + ROOT + art + '" alt="" style="width:' + w.toFixed(1) +
           'px;height:' + hh.toFixed(1) + 'px">';
  } else {
    face = '<span aria-hidden="true">' + esc(t.icon || '') + '</span>';
  }
  return '<div class="egn" data-i="' + i + '">' +
    '<span class="egn__disc">' +
      '<svg class="egn__ring" viewBox="0 0 74 74" aria-hidden="true">' +
        '<circle cx="37" cy="37" r="32" fill="none" stroke="rgba(0,0,0,.34)" stroke-width="7"></circle>' +
        '<circle cx="37" cy="37" r="32" fill="none" stroke="' + t.color +
          '" stroke-width="7" stroke-linecap="round" stroke-dasharray="96 6" ' +
          'transform="rotate(-90 37 37)"></circle>' +
      '</svg>' +
      '<span class="egn__face">' + face + '</span>' +
      '<span class="egn__ck" aria-hidden="true">✓</span>' +
    '</span>' +
    /* THE SHORT LABEL, not the map's `sub || label`. The map's node shows
       the topic's QUESTION under it and has a whole column of height to
       show it in; six of those at an 84px pitch overlap each other into
       an unreadable band. This is the board's own choice and it is also
       the only one that fits. */
    '<span class="egn__lab">' + esc(t.label) + '</span>' +
  '</div>';
}

/* THE LETTERHEAD, STANDING STILL. Screen 3 is on a different ground, and
   the strip is the only object that crosses that change: it is what makes
   the handoff a DEMOTION rather than a replacement, and a completion that
   disappeared the moment the subject changed would say the completion had
   stopped being true.
   IT IS THE SAME OBJECT AT THE SAME SIZE, not a second drawing of it. The
   nodes are built at their full 74px and scaled by the morph's own .419,
   with the layout box collapsed by margin so the pitch comes out at the
   strip's 38 — so screen 3's letterhead is pixel-identical to the one
   screen 2 landed on rather than a 31px rebuild that nearly matches. */
/* T27b · THE RESTART MARK — the loop, chosen 09 Sep. A 300 degree sweep
   with the tail turned back on itself, stroked on a 24 box and drawn at
   20 with round caps and joins so it sits in the topic icons' hand
   rather than reading as a system glyph. It is the one mark of the two
   drawn with NO directional reading to get wrong in RTL, which is why
   the alternative and the switch that carried it are both gone. */
function egRestartMark() {
  return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" ' +
    'fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20 12a8 8 0 1 1-2.6-5.9"/>' +
    '<path d="M20.4 4.2v5.2h-5.2" />' +
  '</svg>';
}
const EG_RESTART_LBL = 'התחלה מחדש של החלוקה';                        /* TAMAR */

/* T27b · THE CONFIRM'S COPY, AND WHAT IT IS ALLOWED TO SAY.
   IT NAMES WHAT ACTUALLY GOES AND NOTHING ELSE. The restart clears the
   coins placed on every row — including the "אחר" row, whose coins live
   in ALLOC under OTHER_KEY — and the word typed into "אחר". It does NOT
   touch `wallet`: egRemaining() is wallet minus egPlaced(), so every
   coin returns to the pool rather than being spent. It does not touch
   PROGRESS, RECORD, PROFILE or anything in the save, because ALLOC and
   ALLOC_OTHER_NAME are session state that never leaves this screen.
   THE NINE PROFILE-SHEET RESET STRINGS ARE NOT REUSED, deliberately.
   Those describe losing the whole game. A confirm that overstates what
   is lost is how a player learns to dismiss confirms unread.
   THE NAME LINE IS CONDITIONAL. A player who never opened "אחר" has no
   word to lose, and telling them one will be erased is the same
   overstatement one size smaller. */
const EG_RESTART_COPY = {
  note:     'המטבעות יחזרו לקופה',                                   /* TAMAR */
  noteName: 'המטבעות יחזרו לקופה והשם שנכתב ב״אחר״ יימחק',           /* TAMAR */
  go:       'להתחיל מחדש',                                           /* TAMAR */
  stay:     'להמשיך'                                                 /* TAMAR */
};

function egStripHTML() {
  return '<div class="eg-strip" aria-hidden="true">' +
    TOPICS().map(egNodeHTML).join('') + '</div>';
}

/* =====================================================================
   THE ONE FUNCTION.

   egPose(0) is screen 1. egPose(1) is screen 2. Nothing else draws
   either of them, so they cannot drift apart and the handoff cannot
   arrive somewhere the destination is not.

   SIX ELEMENTS, SIX TRANSFORMS, ONE DURATION. The 2x3 grid becoming a
   1x6 letterhead is a REFLOW, and a reflow mid-transition reads as a
   cut — which is why the nodes are absolutely positioned and moved by
   transform rather than laid out by the grid at either end.

   THE STAGGER IS BETWEEN THE FOUR THINGS THAT MOVE, not between the six
   nodes: labels out over the first 90ms, the grid unfolding across the
   whole 360, the chair from 65ms, the document from 165ms. All four are
   sampled from the same e, so there is no gap anywhere to read as a
   second beat.

   EVERYTHING TRAVELS UP. The grid's rows rise to one line, the chair
   rises from below, the document follows the chair. The unfold does add
   a horizontal component — the outer nodes spread sideways as they rise,
   so four of the six paths are diagonal. That is Lion's call and it is
   kept: the vertical term is the larger one at every frame, and the
   spread RESOLVES onto a single line, which is a more legible
   destination than six arriving in a smaller copy of where they began.
   ===================================================================== */
function egPose(e) {
  const ov = $('.ov--end'); if (!ov) return;
  const grid = $('.egov__map', ov); if (!grid) return;
  const k = eg01(e), ease = EG_EASE3(k);
  const nodes = [].slice.call(grid.children);
  const n = nodes.length; if (!n) return;
  const rows = Math.ceil(n / 2);
  const s = 1 - (1 - EG_SNODE / EG_NODE) * ease;      /* 1 -> .419 */
  if (EG_ROWS.length !== rows) egRowsFallback(n);
  const gh = EG_GRID_H;
  const step = EG_SNODE + EG_SGAP;
  const lab = Math.max(0, 1 - ease * 3);              /* gone by ~90ms */
  grid.style.height = (gh - (gh - EG_SNODE) * ease).toFixed(1) + 'px';
  nodes.forEach((node, i) => {
    /* col 0 is the RIGHT column and node 0 is the FIRST topic: the offset
       is physical (+42 is right of centre) and RTL reading order puts the
       first node there, which is also where the strip's first node lands. */
    const col = i % 2, row = (i / 2) | 0;
    const gx = col === 0 ? 42 : -42, gy = EG_ROWS[row] || 0;
    const sx = ((n - 1) / 2 - i) * step;
    const x = gx + (sx - gx) * ease, y = gy - gy * ease;
    node.style.transform = 'translate(calc(-50% + ' + x.toFixed(1) + 'px), ' +
      y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    const l = $('.egn__lab', node); if (l) l.style.opacity = lab.toFixed(2);
  });

  const h = ov.clientHeight || 640;
  const hero = $('.egov__hero', ov), sub = $('.egov__sub', ov);
  const chair = $('.egov__chair', ov), doc = $('.egov__doc', ov);
  const col = $('.egov__col', ov), go = $('.egov__go', ov);
  /* the column's width is a term in the chair's position, so it is
     computed once here and written once below rather than read back */
  const colW = 358 - 96 * ease;

  /* the headline leaves on the FIRST HALF of the curve, so the two
     titles are never both legible. Its height is collapsed once it is
     gone or the column would keep centring around an empty box. */
  const hOp = Math.max(0, 1 - k / 0.5);
  [hero, sub].forEach(x => {
    if (!x) return;
    x.style.opacity = hOp.toFixed(2);
    x.style.transform = 'translateY(' + (-ease * 70).toFixed(1) + 'px)';
    x.style.height = hOp <= 0 ? '0px' : '';
    x.style.overflow = hOp <= 0 ? 'hidden' : '';
  });
  if (chair) {
    const cOp = eg01((k - 0.18) / 0.42);              /* ~65ms -> 360ms */
    chair.style.opacity = cOp.toFixed(2);
    /* THE CHAIR IS ANCHORED TO THE COLUMN, NOT TO THE STAGE'S EDGE, and
       that is a correction to the board rather than a copy of it. The
       board's -58px inline offset is measured from the surface's padding
       edge; the column is not, because it is 262px wide against whatever
       the stage is. At 390 the two happen to agree and the chair's arm
       tucks 20px behind the first stat card. At 360 the column moves 30px
       inboard and the same -58 put the card straight through the seated
       avatar — which is the one thing on step 2 that may not be covered,
       since the seat is the whole subject of the screen.
       So the offset is derived: the chair's inboard edge lands
       EG_CHAIR_BITE inside the column at every width, and -58.3 is what
       this expression returns at 390. */
    const pad = parseFloat(getComputedStyle(ov).paddingLeft) || 16;
    const inner = ov.clientWidth - pad * 2;
    const cw = chair.offsetWidth || 210;
    const rest = inner - colW + EG_CHAIR_BITE - cw * (1 + EG_CHAIR_S) / 2;
    chair.style.transform = 'translate(' + (rest + (1 - ease) * -86).toFixed(1) + 'px,' +
      ((1 - ease) * h * 0.42).toFixed(1) + 'px) scale(' + EG_CHAIR_S + ')';
  }
  if (doc) {
    const dOp = eg01((k - 0.46) / 0.44);              /* ~165ms -> 360ms */
    doc.style.opacity = dOp.toFixed(2);
    doc.style.transform = 'translateY(' + ((1 - ease) * h * 0.30).toFixed(1) + 'px)';
    doc.style.height = dOp <= 0 ? '0px' : '';
    doc.style.overflow = dOp <= 0 ? 'hidden' : '';
  }
  /* the column narrows and moves to the inline start as the chair takes
     the other edge — 358 centred to 262 against the leading edge */
  if (col) {
    col.style.maxWidth = colW.toFixed(0) + 'px';
    col.style.marginInlineEnd = ease > 0.02 ? 'auto' : '0';
  }
  /* THE BUTTON IS THE FIFTH THING ON THE SAME CLOCK. It fades out over
     the first third and back in over the last, with the label swapped at
     the turn — the same rule the two titles follow, for the same reason:
     never two labels legible at once. */
  if (go) {
    const bOp = k < 0.5 ? 1 - k / 0.34 : (k - 0.66) / 0.34;
    go.style.opacity = eg01(bOp).toFixed(2);
    const want = k < 0.5 ? EG_GO1() : EG_GO2();
    if (go.textContent !== want) go.textContent = want;
  }
}

/* T25 · both were bare literals in the plural; they are the voice table's
   now. Read at PAINT time rather than captured in a const, because the
   player can set a gender in 2b at any point and the overlay must not be
   holding a string from before that. */
const EG_GO1 = () => t('egGo1');
const EG_GO2 = () => t('egGo2');

/* =====================================================================
   STEP 1 · THE MAP COMPLETES.
   Built once, posed at 0, and never rebuilt: the handoff and step 2 are
   the same DOM at a different progress.
   ===================================================================== */
async function egOverlay() {
  const done = topicsDone(), total = TOPICS().length;
  const s = endStats();

  /* the HUD's slots become the summary's — 6/6, the coin chip and the
     avatar — while #scRound stays up behind the blur. showScreen does
     both halves and #scEnd is put straight back to hidden: it is built
     at the collapse, and two visible .screen children would each take
     flex:1 and split the stage between them. */
  showScreen('end');
  /* T25c · the HUD is off for the whole ending — see .stage.is-ending. */
  $('#stage').classList.add('is-ending');
  $('#scEnd').hidden = true;
  /* ONLY IF THERE IS SOMETHING BEHIND IT. ?screen=end drops straight in
     from the intro and no round has been built; unhiding it would put an
     empty round under the blur, which is a darker frame than the stage's
     own ground and reads as a load. The test is #round rather than
     #scRound because the section's three children — the chyron slot, the
     helper and #round — are in index.html and are there from load. */
  const sr = $('#scRound'), rd = $('#round');
  if (sr && rd && rd.firstElementChild) sr.hidden = false;
  paintHud();

  const ov = el('div', 'ov ov--stage ov--end');
  ov.innerHTML =
    /* the confetti layer keeps its PLACE — before the column, at a lower
       z-index — so "never over content" stays a stacking fact rather
       than a timing promise. It is passed to egConfetti() by node
       instead of by id; see the note there. */
    '<div class="eg-fx egov__fx" aria-hidden="true"></div>' +
    '<div class="egov__chair" aria-hidden="true">' +
      '<img src="' + ROOT + (M.props.chair['900'] || M.props.chair['300']) + '" alt="">' +
      '<span class="egov__seat as-d">' + avatarSvg() + '</span>' +
    '</div>' +
    '<div class="egov__col" id="egovCol">' +
      '<div class="egov__hero">' +
        '<p class="eg-eyebrow">' + esc(t('egDone')) + '</p>' +         /* TAMAR · T25 */
        '<h1 class="eg-h1">' + esc('כל הנושאים') + '</h1>' +           /* TAMAR */
      '</div>' +
      '<div class="egov__map" id="egovMap">' +
        TOPICS().map(egNodeHTML).join('') +
      '</div>' +
      '<p class="eg-sub egov__sub">' + N(done + '/' + total) + ' ' +
        esc('נושאים · ') + N(Object.keys(RECORD).length) +             /* TAMAR */
        esc(' סוגיות') + '</p>' +
      '<div class="egov__doc">' +
        '<h2 class="eg-h2 is-in egov__h2">' +
          /* T25 · the NAMED branch was already the singular form and is
             unchanged; only the unnamed one was stuck in the plural. */
          esc(PROFILE.name ? 'מה יצא לך, ' + PROFILE.name          /* TAMAR */
                           : t('egRecord')) +                      /* TAMAR · T25 */
        '</h2>' +
        '<div class="eg-card f5surf is-in">' +
          '<p class="eg-stat">' +
            '<span class="eg-stat__l">' + esc(t('egSurprised')) +      /* TAMAR · T25 */
            '</span><b class="eg-num">' + N(s.surprises) + '</b></p>' +
          '<p class="eg-stat__sub">' + esc('מתוך ') + N(s.asked) +     /* TAMAR */
            esc(' ניחושים לאורך המשחק') + '</p>' +
        '</div>' +
        (s.alignOf > 0
          ? '<div class="eg-card f5surf eg-card--quiet is-in">' +
              '<p class="eg-stat eg-stat--sm">' +
                '<span class="eg-stat__l">' + esc(t('egAligned')) +    /* TAMAR · T25 */
                '</span><b class="eg-num">' +
                N(s.alignHits + '/' + s.alignOf) + '</b></p>' +
              '<p class="eg-stat__sub">' +
                esc('מתוך ') + N(s.alignOf) +
                esc(' סוגיות שבהן יש ספירת קולות') + '</p>' +          /* TAMAR */
            '</div>'
          : '') +
      '</div>' +
      '<button type="button" class="p-c eg-go is-in egov__go"></button>' +
    '</div>';
  $('#stage').appendChild(ov);

  /* one read, before the first pose, of what the labels actually came out
     at. .egn is 74px wide with align-items:center, so a label longer than
     that wraps rather than overflowing — which is why this is a height
     question and not a width one. See egMeasureRows().

     AFTER THE FACE HAS LOADED, AND THAT IS NOT A DETAIL. Measured against
     the fallback face every one of the six labels wrapped to two lines,
     so the first version of this reserved 26px on every row and came out
     at a 114px pitch instead of 101 — a grid 25px taller than the content
     needs, decided by a font that was not going to be the one on screen.
     By the time anyone reaches the end-game the face is long since
     loaded and this resolves in the same tick; it costs something only on
     a cold ?screen=end deep link, which is a demo path. */
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* measure anyway */ }
  }
  egMeasureRows(ov);

  egPose(0);
  const go = $('.egov__go', ov);
  pressable(go).addEventListener('click', () => {
    if (ov.dataset.step === '2') return egCollapse();
    egHandoff();
  });
  ov.dataset.step = '1';

  /* the celebration waits for the surface to stop moving, exactly as it
     did on the old beat 1: the overlay's own ov-in first, the confetti
     after it. Map completion is still the only confetti in the game. */
  await egStep(T.ovIn + T.f5Gap);
  /* SOUND · THE ONE CELEBRATORY SOUND, and the last sound in the app. It
     is read BEFORE egConfetti(), which spends the flag, and it is not
     inside it: egConfetti() returns early under reduced motion, and
     prefers-reduced-motion governs motion, not sound. The session guard
     is what keeps the deep-link demo path from re-firing it on a store
     where the flag was never spent. */
  if (!EG_CONFETTI_SPENT && !SND_DONE_FIRED) { SND_DONE_FIRED = true; sfx('done'); }
  egConfetti($('.egov__fx', ov));
}

/* =====================================================================
   THE HANDOFF · ONE DURATION, ONE BACKDROP.
   rAF rather than six CSS transitions because the four staggered things
   have to be sampled from the SAME e as the nodes; six transitions plus
   four more would be ten clocks agreeing by arithmetic instead of one
   clock read ten times. The backdrop is on .ov--end and is not touched
   here at all, which is what "painted once" means in practice.
   ===================================================================== */
function egHandoff() {
  const ov = $('.ov--end'); if (!ov) return;
  if (ov.dataset.step !== '1') return;
  ov.dataset.step = 'x';                       /* neither, while it runs */
  const go = $('.egov__go', ov);
  if (go) go.disabled = true;
  const land = () => {
    egPose(1);
    ov.dataset.step = '2';
    /* the inline opacity is NOT cleared. egPose(1) writes opacity:1, and
       handing the button back to .eg-go's class rule here would make the
       overlay's settled state depend on HOW it was reached — the last
       frame of the handoff has to be byte-identical to egPose(1) on a
       fresh build, which is the whole claim this function makes. */
    if (go) go.disabled = false;
  };
  if (egReduced()) return land();
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - t0) / T.ovSwap);
    egPose(k);
    if (k < 1) requestAnimationFrame(tick); else land();
  };
  requestAnimationFrame(tick);
}

/* =====================================================================
   STEP 2 LEAVES THE OVERLAY · THE KEYBOARD ARGUMENT.
   Beat 3 has a text field in it, and a field on a backdrop-filtered
   layer is a field the keyboard slides under: the surface it is
   filtering moves and the blur re-resolves on every frame of the
   animation. So the allocation is built on the STAGE — --stage plus the
   dot grid, the app's own ground — and the overlay leaves over it.
   BUILT FIRST, COLLAPSED SECOND. The destination is painting before the
   blur starts to lift, so the ground fades UP underneath rather than
   arriving into an empty frame.
   ===================================================================== */
/* T25c · THE OVERLAY NO LONGER COLLAPSES HERE. It used to build beat 3
   on #scEnd and then fade itself out over it, which is what made the
   ground change. The round behind it is torn down — it has been blurred
   furniture since the sequence began and there is nothing left to reveal
   — and the same overlay carries the last two screens. */
async function egCollapse() {
  const sr = $('#scRound');
  if (sr) { sr.hidden = true; sr.classList.remove('is-finale'); }
  /* screens 1 and 2's column and chair are retired by egSwapIn(), which
     takes every pane but the incoming one — see there. */
  await egBeat3();
}

/* =====================================================================
   BEAT 3 · THE ALLOCATION.

   THE TARGETS ARE THE GAME'S OWN TOPICS, and that is the whole argument
   (§0.3b): a curated list of "legitimate causes" is itself an editorial
   act — who decided ביטחון counts and זכויות עובדים does not — and the
   six topics the player has just spent eleven rounds inside sidestep it
   entirely. TOPICS() is read live, so a re-cut content set re-cuts this
   screen and nothing here has to be told.

   CHIPS AND A SIMPLE SPLIT, NOT A SLIDER. The sheet's minimal v1
   (p.4, option b) verbatim. A tap adds one portion; the portion is a
   tenth of what was earned, rounded to the game's own 25-coin unit, so
   the numbers on screen stay in the vocabulary the round taught.

   EVERY COIN IS ALLOCATABLE. The last portion is whatever is left rather
   than a fixed step — without that, a 1,900 wallet and a 200 step strand
   100 coins nobody can place, which would make "distribute your coins" a
   promise the screen does not keep. That was the original build's whole
   failure and it is not being repeated in a new shape.

   LEAVING COINS UNSPENT IS A VALID END STATE. The continue button is
   never gated on a full allocation: this is a statement of priorities,
   not a puzzle with a solution, and a completion gate would turn it into
   one. NO SCARCITY, NO TIMER, NO PRESSURE COPY.

   THE HUD CHIP DOES NOT MOVE. It keeps showing what was earned, because
   that is a fact about the run; what is left to place is this screen's
   own line. Spending out of the HUD would also mean writing a smaller
   number into the save, and the save records the run, not this screen.
   ===================================================================== */
const egPortion = () => {
  const tenth = wallet / 10;
  return Math.max(25, Math.round(tenth / 25) * 25);
};
/* =====================================================================
   ITEM 14 · THE COINS GO WHERE THE PLAYER PUT THEM
   Feedback only. Nothing here reads or writes ALLOC, egPortion() or the
   totals — the allocation is exactly the line it always was and this is
   layered over it.

   THE ROW'S NUMBER WAITS FOR THE COINS. That is the whole point of the
   item and it is the one thing here that touches the render: the tap
   moves the state immediately (so the balance is honest and a second tap
   is charged correctly), but the ROW keeps showing what it was showing
   until the first token lands. Without that the number changes on tap and
   the flight is decoration arriving after the fact.
   The hold is a data attribute on the chip rather than a variable,
   because egPaint() is the one painter and it has to be able to see it.

   THREE FLIGHTS, NEVER A QUEUE. A fourth tap inside the window gets no
   sprites at all — it decrements, it increments, and it is done. Nothing
   is buffered: a backlog would land coins seconds after the tap that
   bought them, which is worse than no coins.

   prefers-reduced-motion: no sprites and no pulse. The row is then never
   held, so its number ticks on the tap, exactly as before this item.
   ===================================================================== */
const EG_FLY_CAP = 3;
let EG_FLY_LIVE = 0;

/* CSS's ease-in-out, cubic-bezier(.42,0,.58,1), SOLVED rather than
   approximated. The item names the CSS keyword and the usual JS stand-in
   (easeInOutCubic) is a visibly different curve — it leaves the origin
   flatter and arrives harder. Six Newton steps is exact to well under a
   pixel over 420ms. */
const EG_EASE = (() => {
  const cx = 3 * 0.42, bx = 3 * (0.58 - 0.42) - cx, ax = 1 - cx - bx;
  const cy = 0,        by = 3 * 1 - cy,             ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const fy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = fx(t) - x, d = dx(t);
      if (Math.abs(e) < 1e-5 || d === 0) break;
      t -= e / d;
    }
    return fy(Math.min(1, Math.max(0, t)));
  };
})();

/* the balance is the source, so the balance is what reacts to the tap */
function egBalancePulse() {
  if (egReduced()) return;
  const L = $('#egLeft'); if (!L) return;
  L.classList.remove('is-pulse'); void L.offsetWidth; L.classList.add('is-pulse');
}

/* returns TRUE only if sprites are actually in the air — the caller uses
   that to decide whether the row's number waits or lands on the tap */
function egCoinFlight(chip) {
  if (egReduced()) return false;
  if (EG_FLY_LIVE >= EG_FLY_CAP) return false;
  const layer = $('#coinfly'), src = $('#egLeft');
  if (!layer || !src || !chip) return false;
  const box = layer.getBoundingClientRect();
  /* the NUMBER, where there is one — the coins leave the figure that just
     went down, not the sentence around it. At zero left the line has no
     <b> and the line itself is the origin. */
  const from = $('b', src) || src;
  const a = from.getBoundingClientRect(), b = chip.getBoundingClientRect();
  if (!a.width || !b.width) return false;

  /* FROM ITS FOOT, NOT ITS MIDDLE. Spawning on the figure's centre put
     the whole handful over the number for the first ~100ms — on top of
     the one digit that had just changed, at the exact moment the pulse is
     asking the player to look at it. 0.85 of the height leaves from just
     under it, which is still the balance and does not cover it. */
  const x0 = a.left + a.width / 2 - box.left, y0 = a.top + a.height * 0.85 - box.top;
  const n  = 5 + Math.floor(Math.random() * 4);          /* 5-8 */
  EG_FLY_LIVE++;

  for (let i = 0; i < n; i++) {
    const t = el('i', 'coin-t coin-t--eg');
    /* NO TWO TAPS ALIKE, and the spread is on both ends: a slightly
       different launch point and angle, and a different place to land
       WITHIN the row. The inset keeps the arrival off the row's own
       edges so a coin never appears to land outside it. */
    const jx = (Math.random() - 0.5) * 18, jy = (Math.random() - 0.5) * 10;
    const inx = 18;
    const x1 = b.left - box.left + inx + Math.random() * Math.max(1, b.width - 2 * inx);
    const y1 = b.top  - box.top  + b.height * (0.3 + Math.random() * 0.4);
    /* THE ARC IS A QUADRATIC WHOSE CONTROL POINT IS PUSHED OFF THE CHORD,
       perpendicular to it, so the trip bows instead of dropping straight
       down the column. The push is randomised in size AND sign, which is
       what varies the launch angle: half the handful leaves to one side. */
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const bow = (26 + Math.random() * 34) * (Math.random() < 0.5 ? -1 : 1);
    const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
    layer.appendChild(t);
    t.style.transform = 'translate(' + (x0 + jx - 6.5) + 'px,' + (y0 + jy - 6.5) + 'px)';
    egFlyOne(t, x0 + jx, y0 + jy, cx, cy, x1, y1, i * T.egFlyStep,
      i === 0     ? () => { delete chip.dataset.hold; egPaint(); } : null,
      i === n - 1 ? () => { EG_FLY_LIVE = Math.max(0, EG_FLY_LIVE - 1); } : null);
  }
  return true;
}

function egFlyOne(node, x0, y0, cx, cy, x1, y1, delay, onFirst, onLast) {
  setTimeout(() => {
    const t0 = performance.now();
    /* the fade is a TIME, not a share of the curve: the last
       --t-eg-fly-fade of the trip, wherever the easing has got to. */
    const fadeAt = (T.egFly - T.egFlyFade) / T.egFly;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / T.egFly);
      const e = EG_EASE(k), m = 1 - e;
      const x = m * m * x0 + 2 * m * e * cx + e * e * x1;
      const y = m * m * y0 + 2 * m * e * cy + e * e * y1;
      node.style.transform = 'translate(' + (x - 6.5) + 'px,' + (y - 6.5) + 'px) scale(' +
        (1 - 0.28 * e).toFixed(3) + ')';
      node.style.opacity = k > fadeAt ? ((1 - k) / (1 - fadeAt)).toFixed(3) : '1';
      if (k < 1) requestAnimationFrame(tick);
      else {
        node.remove();
        if (onFirst) onFirst();
        if (onLast) onLast();
      }
    })(t0);
  }, delay);
}

/* ITEM 19 · the row's own copy. The glyph is a mark rather than a drawn
   object: the eight above name real topics and carry real artwork, and
   giving this one a picture would claim it is a ninth topic. */
const EG_OTHER_LABEL = 'אחר';                                          /* TAMAR */
/* T25 · the voice table's, read at paint time — see EG_GO1. */
const EG_OTHER_PH    = () => t('egOtherPh');                           /* TAMAR · T25 */
const OTHER_GLYPH    = '<span class="eg-other__g" aria-hidden="true">✎</span>';

/* =====================================================================
   ITEM 19 + 20B · THE ONE GATE — AND IT IS OPEN.
   Every topic name the card or the share string is allowed to say comes
   from here and from nowhere else; that part is unchanged. What changed:

   TAMAR'S DECISION, 09 SEP 2026: THE FREE TEXT GOES ON THE CARD.
   Until this date the walk below covered TOPICS() only — data.js's own
   eight — and the free-text row, whose coins sit under OTHER_KEY and
   whose words sit in ALLOC_OTHER_NAME, could not reach a card by
   construction. Tamar asked for the player's own words on the card, so
   the row is appended to the walk as a ninth entry, marked `free` so the
   card can dress it as authored (kraft, ✎) rather than as a topic. This
   is NOT a bug and NOT drift; the next reader should not "fix" it. It is
   paired with OTHER_MAX dropping to 11 — see the note there — because
   the words now have to fit a pill.
   An unnamed row with coins on it shows as אחר.
   ===================================================================== */
function cardTopics(n) {
  const list = TOPICS().map(t => ({ t, v: ALLOC[t.id] || 0 }));
  const ov = ALLOC[OTHER_KEY] || 0;
  if (ov > 0) list.push({ t: { id: OTHER_KEY, label: ALLOC_OTHER_NAME || EG_OTHER_LABEL, free: true }, v: ov });
  return list
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n || 1);
}

const egPlaced    = () => Object.values(ALLOC).reduce((a, b) => a + b, 0);
const egRemaining = () => wallet - egPlaced();

/* the topic with the most placed on it. Ties resolve to data.js's own
   order — first wins — so the card names something stable rather than
   whichever key the engine happened to enumerate first. */
function egTopTopic() {
  let best = null;
  TOPICS().forEach(t => {
    const v = ALLOC[t.id] || 0;
    if (v > 0 && (!best || v > best.v)) best = { t, v };
  });
  return best;
}

async function egBeat3() {
  const c = egStage();
  c.innerHTML =
    /* v30c · the letterhead crosses the ground change — see egStripHTML() */
    egStripHTML() +
    '<h2 class="eg-h2 is-in">' + esc('במה להשקיע?') + '</h2>' +        /* TAMAR */
    '<p class="eg-lede">' +
      esc(t('egAllocLede')) +                                          /* TAMAR · T25 */
    '</p>' +
    '<p class="eg-left" id="egLeft"></p>' +
    /* .scrolls IS NOT DECORATION HERE. The list is a scroll container —
       overflow-y:auto and min-height:0 in .eg-chips — but the app cancels
       every touchmove outside .scrolls and pins touch-action to none on
       the body, so it was a scroller no finger could move. At 360x640 the
       last row goes under the clip line the moment the first tap adds the
       reset link, and there was no way to bring it back. One class opts
       into both policies at once; nothing else was needed. */
    '<div class="eg-chips scrolls edgefade" id="egChips"></div>' +
    '<div class="eg-acts" id="egActs"></div>';

  const chips = $('#egChips', c);
  /* ITEM 19 · ONE MAKER FOR ALL NINE ROWS. "Behaves like any other topic
     row for allocation purposes" is not a promise kept by matching two
     code paths — it is the same code path, called once more with a
     different key and a different face. The increment, the cap against
     what is left, the bump, the disabled state and item 14's coin flight
     all come along because none of them knows which row it is on. */
  const mkChip = (key, icoHTML, label) => {
    const b = el('button', 'eg-chip');
    b.type = 'button';
    b.dataset.topic = key;
    b.innerHTML =
      '<span class="eg-chip__ico">' + icoHTML + '</span>' +
      '<span class="eg-chip__name">' + esc(label) + '</span>' +
      '<span class="eg-chip__v" aria-hidden="true"></span>';
    pressable(b).addEventListener('click', () => {
      const left = egRemaining();
      if (left <= 0) return;
      /* SOUND · THE SAME COIN, ONCE PER TAP. egCoinFlight() emits 5-8
         tokens and returns false when it is capped or under reduced
         motion, so the sound is fired HERE, on the allocation itself,
         rather than inside it — one tap, one coin, and reduced motion
         does not silence it.
         THE SAME FILE, NOT A VARIANT. This is a coin being spent rather
         than earned, and the direction is carried by the screen and the
         arithmetic. A second timbre for "spent" would be the set
         informing rather than confirming, and on a screen whose whole
         design is not to editorialise about where the money goes, a
         different sound per direction is a judgement nobody asked for. */
      sfx('coin');
      /* ITEM 14 · LAUNCHED BEFORE THE STATE MOVES, so the coins are aimed
         at the row as it looks on the tap — after egPaint() the row may
         have grown a number and shifted under them. It returns false when
         it is capped or under reduced motion, and then the row is not
         held and its number lands on the tap as it always did. */
      if (egCoinFlight(b)) b.dataset.hold = '1';
      egBalancePulse();
      /* the last portion is the remainder, so the wallet can always be
         emptied exactly — see the note above */
      ALLOC[key] = (ALLOC[key] || 0) + Math.min(egPortion(), left);
      b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
      egPaint();
      if (key === OTHER_KEY) revealOther();
    });
    chips.appendChild(b);
    return b;
  };
  TOPICS().forEach(t => mkChip(t.id, topicFace(t, 30), t.label));

  /* ITEM 19 · אחר, under the eight, with the field it opens.
     THE FIELD IS A SIBLING OF THE BUTTON, NOT INSIDE IT — a text input
     inside a button cannot be focused without the button swallowing the
     tap, and every tap on the row has to keep allocating. It appears on
     the first tap and stays; taps after that only add coins, exactly as
     they do on the eight above.
     EMPTY IS ALLOWED AND IS NOT AN ERROR STATE. Coins may sit on an
     unnamed אחר for the whole screen; nothing here requires the field,
     validates it, or marks it. */
  const otherWrap = el('div', 'eg-other');
  chips.appendChild(otherWrap);
  const otherBtn = mkChip(OTHER_KEY, OTHER_GLYPH, EG_OTHER_LABEL);     /* TAMAR */
  otherWrap.appendChild(otherBtn);
  const field = el('input', 'eg-other__in');
  field.type = 'text';
  field.maxLength = OTHER_MAX;                 /* the hard cap, 11 */
  field.placeholder = EG_OTHER_PH();                                   /* TAMAR · T25 */
  field.setAttribute('dir', 'auto');
  field.setAttribute('autocomplete', 'off');
  field.setAttribute('autocorrect', 'off');
  field.setAttribute('autocapitalize', 'off');
  field.setAttribute('spellcheck', 'false');
  field.setAttribute('enterkeyhint', 'done');
  field.setAttribute('aria-label', EG_OTHER_LABEL);                    /* TAMAR */
  field.value = ALLOC_OTHER_NAME;
  field.hidden = !(ALLOC_OTHER_NAME || (ALLOC[OTHER_KEY] || 0) > 0);
  otherWrap.appendChild(field);
  /* CAPPED IN THREE PLACES because maxlength alone is a UI hint: a paste,
     an IME commit and a scripted set can all exceed it. This is the value
     the variable ever holds. */
  const takeOther = () => { ALLOC_OTHER_NAME = field.value.replace(/\s+/g, ' ').trim().slice(0, OTHER_MAX); };
  field.addEventListener('input', takeOther);
  field.addEventListener('blur', () => { takeOther(); field.value = ALLOC_OTHER_NAME; });
  field.addEventListener('keydown', e => { if (e.key === 'Enter') field.blur(); });
  const revealOther = () => {
    if (!field.hidden) return;
    field.hidden = false;
    field.focus();
    /* the field is 46px of new content inside the scroller, and focus()
       may or may not move the scroll to reach it. The scroll listener
       covers the case where it does; this covers the case where it does
       not, and running twice is free because egFade() only measures. */
    egFade();
  };

  const acts = $('#egActs', c);
  /* T27 · THE RESTART IS AN ICON BUTTON BESIDE THE CTA, not a text link
     above it. Two marks are drawn and neither is chosen — ?restart=a|b
     switches between them and the default here is arbitrary, awaiting a
     pick. Both are die-cut sticker marks in the topic icons' hand,
     monochrome at 20px, which is the size the HUD slot already proved.
     ICON-ONLY IS NOT A LABEL, so it carries its accessible name and a
     title; the name is the same sentence the link used to read. */
  const clear = el('button', 'eg-restart');
  clear.type = 'button';
  clear.innerHTML = egRestartMark();
  clear.setAttribute('aria-label', EG_RESTART_LBL);                  /* TAMAR */
  clear.title = EG_RESTART_LBL;                                      /* TAMAR */
  /* T27b · IT ASKS FIRST. The wipe itself is unchanged and is now the
     confirm's callback; what changed is that an unlabelled square eight
     pixels from the primary CTA can no longer undo the whole allocation
     on one accidental contact. */
  const doRestart = () => {
    ALLOC = {};
    ALLOC_OTHER_NAME = '';                         /* ITEM 19 · reset takes it too */
    const f = $('.eg-other__in'); if (f) { f.value = ''; f.hidden = true; }
    /* ITEM 14 · a row still waiting for its coins is holding the number it
       had; the reset has to release that or the row keeps a value the
       allocation no longer has until a token that is already in the air
       happens to land on it. */
    $$('.eg-chip', $('#egChips')).forEach(x => { delete x.dataset.hold; });
    egPaint();
  };
  pressable(clear).addEventListener('click', () => {
    /* nothing placed means nothing to lose — but egPaint() hides the
       control in that state, so this is the belt to that braces */
    if (egPlaced() === 0) return;
    confirmSheet({
      q:    t('egRestartQ'),
      note: ALLOC_OTHER_NAME ? EG_RESTART_COPY.noteName : EG_RESTART_COPY.note,
      go:   EG_RESTART_COPY.go,
      stay: EG_RESTART_COPY.stay,
      onGo: doRestart
    });
  });
  const go = el('button', 'p-c eg-go', t('egGo3'));                    /* TAMAR · T25 */
  pressable(go).addEventListener('click', () => egBeat4());
  /* THE CTA IS FIRST IN THE DOM, so in RTL it renders on the right and
     the square sits at the left end of the row. The order matters: the
     yellow button is the thing being answered and it leads. */
  acts.append(go, clear);

  /* passive: this listener only reads and toggles a class, and marking it
     so keeps it off the critical path of a scroll it never cancels. */
  chips.addEventListener('scroll', egFade, { passive: true });

  egPaint();
  /* T25c · THE PANE ARRIVES, ITS PARTS DO NOT. The lede, the list and the
     actions used to fade up 6-8px each, which was written when this screen
     arrived on an empty ground. It arrives as one object now — see
     egSwapIn() — and a second entrance layered inside the first is the
     thing T24 took off the reveal gate for the same reason. The classes
     stay because .is-in is also the resting state; they are simply set in
     the same frame instead of a beat later. */
  egSwapIn(c);
  requestAnimationFrame(() => {
    $('.eg-lede', c).classList.add('is-in');
    chips.classList.add('is-in');
    acts.classList.add('is-in');
  });
}

/* =====================================================================
   THE FADE · SECOND CALL SITE OF THE REVEAL PANEL'S, NOT A NEW IDEA.
   Same two classes and the same test as the MK card's explanation block:
   .has-more only while the block ACTUALLY overflows, .is-atend clearing
   it at the bottom of the scroll, so a fully-scrolled list and a list
   with nothing hidden both end on a hard edge rather than on a permanent
   decorative shadow. The mask itself is in proto.css beside .eg-chips.

   WHY IT IS A FUNCTION AND NOT A CLOSURE INSIDE egBeat3(). The reveal
   panel is built once and never changes size, so its sync can run at
   build and on scroll and be done. This list changes size AFTER it is
   built, twice: the reset link appears on the first tap and takes 41px
   off the list, and the free-text row grows the content again. Both go
   through egPaint(), which is already the one place that runs on every
   change to this screen, so the test lives where it can be called from
   there rather than being reachable only from the builder's scope.

   IT MEASURES, IT DOES NOT REMEMBER. Reading clientHeight straight after
   egPaint() toggles the reset link forces the layout that toggle just
   invalidated, which is exactly what is wanted: the answer is about the
   list as it is now, not as it was before the link arrived. */
/* T21 · ONE SYNC FOR EVERY .edgefade, and it is this one. The MK reveal
   panel had a second copy of it as a closure, toggling the same two class
   names on a different node against the same arithmetic; that copy is
   gone. Anything that scrolls calls this, on build and on scroll.
   IT WRITES TO THE ELEMENT IT MEASURES. The reveal panel's copy wrote to
   the scroller's PARENT because its mask was a descendant selector; the
   shared rule reads the classes off the masked element, so there is one
   node holding the state and it is the one the state is about. */
function edgeFade(c) {
  if (!c) return;
  const over = c.scrollHeight - c.clientHeight > 1;
  c.classList.toggle('has-more', over);
  c.classList.toggle('is-atend',
    over && c.scrollTop + c.clientHeight >= c.scrollHeight - 2);
  c.classList.toggle('is-atstart', over && c.scrollTop <= 2);
}
/* the allocation list's call site keeps its name: egPaint() is the one
   place that knows when this screen's height has changed, and it should
   not have to know how to find the scroller. */
function egFade() {
  const c = $('#egChips');
  if (!c) return;
  edgeFade(c);
}

/* one painter for the whole screen, so the left-to-place line and every
   chip can never disagree about the same numbers */
function egPaint() {
  const left = egRemaining();
  const L = $('#egLeft');
  if (L) {
    /* THREE STATES, NOT TWO. "you have distributed all your coins" is
       false when there were none to distribute — reachable on the
       ?screen=end demo link against a clean store, and a screen that
       congratulates you for spending nothing is the kind of small lie
       this file does not ship. */
    L.innerHTML = wallet <= 0
      ? esc('אין מטבעות לחלוקה')                                        /* TAMAR */
      : left > 0
        ? esc('נותרו לחלוקה ') + '<b>' + N(left) + '</b> ' + esc('מטבעות') /* TAMAR */
        : esc(t('egAllSpent')) + ' ●';                                  /* TAMAR · T25 */
    L.classList.toggle('is-spent', wallet > 0 && left <= 0);
  }
  $('#egChips') && $$('.eg-chip', $('#egChips')).forEach(b => {
    const v = ALLOC[b.dataset.topic] || 0;
    const out = $('.eg-chip__v', b);
    /* ITEM 14 · A HELD ROW KEEPS WHAT IT IS SHOWING. The value and the
       paper fill are the same statement — "there are coins on this" — so
       both wait for the first token, or the row lights up on the tap and
       only the figure arrives with the coins. Everything else on this
       pass still runs: the balance, the disabled state, the clear button.
       The hold is released by the flight itself, or by the reset. */
    if (!b.dataset.hold) {
      out.innerHTML = v > 0 ? N(v) : '';
      b.classList.toggle('has-v', v > 0);
    }
    /* the control disables itself when there is nothing left to place —
       it is not an error state, it is the end of the supply */
    b.disabled = left <= 0;
  });
  const clear = $('.eg-restart');                                    /* T27 */
  if (clear) clear.hidden = egPlaced() === 0;
  /* LAST, because the line above is what changes the list's height: the
     reset link appearing on the first tap is the single event that turns
     a 15px overflow into a 56px one. Testing before it would answer for
     the layout the player has already left. */
  egFade();
}

/* =====================================================================
   v29h · BEAT 4 · THE SHARE SCREEN

   Three cards in a carousel, one toggle, two buttons, and nothing is
   ever laid over the card — if the player screenshots the picker instead
   of sharing, no control lands in the shot.

   C IS THE DEFAULT and it is re-asserted on every arrival, for the same
   reason the old beat re-asserted its own: most players never swipe, so
   the card that opens is the card that ships, and a module variable would
   quietly make the last pick the default for the rest of the session.

   THE CARD IS DRAWN ONCE, AT 1080px, AND SCALED. The preview in the
   track is the same DOM the export serialises — a 1080×1920 card under a
   transform — so what the player sees and what goes out cannot drift.
   The card's stylesheet lives in proto.css between the @ec-start /
   @ec-end markers and is read from there at export time, so it is
   written once and the export cannot fall behind the screen.

   THE EXPORT ROUTE is SVG <foreignObject> → <img> → canvas → PNG. No
   library. Four things were measured on real hardware on 09 Sep and are
   not negotiable — each is marked NON-NEGOTIABLE where it is honoured:
     1 · the SVG is a data: URL. A blob: URL taints the canvas.
     2 · fonts and images are base64-inlined into the SVG.
     3 · the inlining is warmed when the end-game mounts (shWarm(), called
         from endGame() and nowhere else).
     4 · the SVG image is drawn twice, 50ms apart, before toBlob.
   ===================================================================== */
const SH_KINDS   = ['C', 'D', 'E'];
const SH_ASPECTS = { '916': [1080, 1920], '45': [1080, 1350] };
/* T37 · the ink .sh-hold paints OUTSIDE its own box: a 3px paper ring, a
   5px keyline beyond it, and a 6px hard drop below. 6 is the largest of
   the three and is what the track has to hold clear at each end -- see
   place(). If the sticker's edge is ever retuned, this moves with it. */
const SH_EDGE = 6;
const SH_LINK    = 'hac121.org';
const SH_FILE    = 'hac121-card.png';
const SH_COPY = {
  /* T25 · SH_COPY.title is gone; the picker's heading is the voice
     table's t('shTitle'), because it is an imperative addressed to the
     player and m and f genuinely differ on it. Everything else in this
     table either names an object or speaks in the player's own first
     person on the card, where the past tense collapses m and f. */
  tag:      'הח״כ ה-121',                                   /* TAMAR */
  claim:    'תפסתי את<br>הכיסא ה-121',          /* C's title; the break is the design's */ /* TAMAR */
  claimTxt: 'תפסתי את הכיסא ה-121',            /* the same words, for the text fallback */ /* TAMAR */
  kicker:   'הח״כ ה-121 · דוח אישי',                        /* TAMAR */
  meta:     'סוגיות שנוחשו · עונה 1',                       /* TAMAR */
  guessed:  'ניחשתי נכון',                                  /* TAMAR */
  outOf:    'מתוך',                                         /* TAMAR */
  surprised:'פעמים שהכנסת הפתיעה אותי',                     /* TAMAR */
  most:     'הכי הרבה הקצאתי ל',                            /* TAMAR */
  more:     'עוד',                              /* "עוד N" — in words, never "+N" */ /* TAMAR */
  share:    'שיתוף',                                        /* TAMAR */
  save:     'שמירה לגלריה',                                 /* TAMAR */
  sharing:  'מכינים את הכרטיס…',                            /* TAMAR */
  saving:   'שומרים…',                                      /* TAMAR */
  copied:   'הועתק',                                        /* TAMAR */
  back:     'חזרה למפה',                                    /* TAMAR */
  card:     'כרטיס',                                        /* TAMAR */
  a916:     '9:16',
  a45:      '4:5',
};
/* S2 plane and D1 tray, as picked on the v29f board. Trailing — last in
   the DOM, so RTL puts them at the physical left edge. */
const SH_ICON = {
  share: '<svg class="sh-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 3.2 10.3 13.7"/><path d="M20.8 3.2 14.2 20.8l-3.9-7.1-7.1-3.9z"/></svg>',
  save:  '<svg class="sh-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.4v10.9"/><path d="M7.8 10.1 12 14.3l4.2-4.2"/><path d="M4.2 16.6v2.1c0 1 .8 1.8 1.8 1.8h12c1 0 1.8-.8 1.8-1.8v-2.1"/></svg>',
  spin:  '<span class="sh-spin" aria-hidden="true"></span>',
};
const SH_SRC = {
  /* T43 · the coin joins the inlined set. It has to: the pill's coin is an
     <img> precisely so shExport() can rewrite its src to base64, the way
     the chair and the logos are. A CSS url() inside @ec-start/@ec-end
     cannot resolve inside the export's data: SVG. */
  coin:    'assets/coin_128.webp',
  chair:   'assets/mk/knesset_chair_300_shadow.webp',  /* the BAKED shadow — see the note at .ec-c-chair */
  logo:    'assets/share/logo-mono-900.png',
  logoInk: 'assets/share/logo-mono-900-ink.png',       /* pre-inked for kraft; no filter */
  black:   'fonts/SimplerPro_HLAR-Black.woff2',
  regular: 'fonts/SimplerPro_HLAR-Regular.woff2',
};

let SH_KIND = 'C', SH_ASPECT = '916';
/* T27b · THE RAIL ARRIVES ONE-SIDED, AND MOTION IS WHAT TEACHES IT.
   C is index 0, so on arrival there is nothing to its right and the rail
   can read as a single card rather than as three. Reordering would fix
   the picture and break the product — C is safe at any score, D leads
   with the prediction record and self-selects against low scorers — so
   the affordance is taught instead: the rail settles from a small offset
   with the card to the left briefly further into view, then rests at 0.
   SESSION-SCOPED, NOT SAVED. "Never on re-entry" is about coming back to
   this screen, and the end sequence is once per run — a save field would
   be a sixth boolean bought for an entrance. */
let SH_ARRIVED = false;
const SH_ARRIVE_PX = 40;     /* +40 takes the left card's peek from 36 to 76 */
const SH_ARRIVE_MS = 520;    /* slower than the 380ms snap: settling, not snapping */
let SH_BUSY = false;

/* ---- the pills: what the card is allowed to say ---------------------
   cardTopics() is the gate (see it). Ordered by allocation, highest
   first; the free-text row rides along since 09 Sep. Three pills, then
   "עוד N" IN WORDS — a leading "+" is a bidi neutral and renders as "5+",
   which reads as "5 or more". */
const SH_PILL_CAP = 3;
function shPills() {
  const all = cardTopics(99);
  const shown = all.slice(0, SH_PILL_CAP);
  return { shown, more: all.length - shown.length, total: all.length };
}
/* the pill block's scale steps down as it grows — the v29e tiers, which
   with the cap only ever reach b on 9:16 and c on 4:5 */
function shTier(n, aspect) {
  if (aspect === '45') return n <= 1 ? 'a' : n <= 3 ? 'b' : n <= 5 ? 'c' : 'd';
  return n <= 2 ? 'a' : n <= 4 ? 'b' : n <= 6 ? 'c' : 'd';
}
const shNum = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function shPillsHTML(aspect) {
  const p = shPills();
  const n = p.shown.length + (p.more ? 1 : 0);
  if (!n) return '';
  let h = '<div class="ec-pills" data-t="' + shTier(n, aspect) + '">';
  p.shown.forEach(x => {
    h += '<span class="ec-pill' + (x.t.free ? ' ec-pill--free' : '') + '">' +
           (x.t.free ? '<span class="ec-pill__g" aria-hidden="true">✎</span>' : '') +
           '<span class="ec-pill__n">' + esc(x.t.label) + '</span>' +
           '<span class="ec-pill__r"></span>' +
           '<span class="ec-pill__c">' + shNum(x.v) +
             /* THE COIN IS .coin-t, THE REAL TOKEN — proto.css:4760:
                "a second coin drawn a second way would be a second currency".
                T43 · it is now one IMAGE at every site rather than a disc
                drawn four ways, so the em sizing carries the whole coin
                across the tiers instead of a keyline that had to be
                restated. An <img> rather than a background so shExport()
                can inline it; see SH_SRC.coin. */
             '<img class="coin-t ec-pill__coin" src="' + SH_SRC.coin + '" alt="" aria-hidden="true"></span>' +
         '</span>';
  });
  if (p.more) h += '<span class="ec-pill ec-pill--more">' + esc(SH_COPY.more) + ' ' + p.more + '</span>';
  return h + '</div>';
}

/* ---- the three cards, as markup ------------------------------------ */
function shAvatar() { return '<span class="ec-ava">' + avatarSvg() + '</span>'; }
function shCardHTML(kind, aspect) {
  const s = endStats(), pills = shPillsHTML(aspect), top = shPills().shown[0];
  const cls = 'ec ec--' + aspect + (kind === 'D' ? '' : ' ec--dots');
  let body = '';
  if (kind === 'C') {
    body =
      '<div class="ec-plaza"></div>' +
      '<div class="ec-pad">' +
        '<div class="ec-c-head"><span class="ec-tag">' + esc(SH_COPY.tag) + '</span>' + shAvatar() + '</div>' +
        '<div class="ec-c-chair"><img src="' + SH_SRC.chair + '" alt=""></div>' +
        '<p class="ec-c-title">' + SH_COPY.claim + '</p>' +
        pills +
        '<div class="ec-c-foot"><img class="ec-logo" src="' + SH_SRC.logo + '" alt="">' +
          '<span class="ec-link">' + SH_LINK + '</span></div>' +
      '</div>';
  } else if (kind === 'D') {
    body =
      '<div class="ec-d-doc ec-kraft ec-diecut"></div>' +
      '<div class="ec-d-doc ec-d-in">' +
        '<div class="ec-d-hd"><div><p class="ec-d-kicker">' + esc(SH_COPY.kicker) + '</p>' +
          '<p class="ec-d-meta">' + esc(SH_COPY.meta) + '</p></div>' +
          '<img class="ec-logo" src="' + SH_SRC.logoInk + '" alt=""></div>' +
        '<div class="ec-d-body">' +
          '<div class="ec-d-hero"><p class="ec-d-lab">' + esc(SH_COPY.guessed) + '</p>' +
            '<p class="ec-d-big"><span>' + s.correct + '</span><span class="ec-d-u">' + esc(SH_COPY.outOf) +
              '</span><span>' + s.asked + '</span></p>' +
            '<p class="ec-d-second"><b>' + s.surprises + '</b> ' + esc(SH_COPY.surprised) + '</p></div>' +
          (pills
            ? '<div class="ec-d-rule"></div><p class="ec-eyebrow ec-eyebrow--ink">' + esc(SH_COPY.most) + '</p>' + pills
            : '') +
        '</div>' +
        '<div class="ec-d-foot">' + shAvatar() +
          '<span class="ec-link ec-link--ink">' + SH_LINK + '</span></div>' +
      '</div>';
  } else {
    body =
      '<div class="ec-e-wrap">' +
        '<div class="ec-top"><span class="ec-tag">' + esc(SH_COPY.tag) + '</span>' + shAvatar() + '</div>' +
        '<div class="ec-e-mid"><div class="ec-e-rule"></div>' +
          (top
            ? '<p class="ec-e-lead">' + esc(SH_COPY.most) + '</p>' +
              '<p class="ec-e-topic">' + esc(top.t.label) + '</p>' + pills
            /* nothing allocated: the record is the only true sentence left */
            : '<p class="ec-e-rec">' + esc(SH_COPY.guessed) + ' <b>' + s.correct + '</b> ' +
              esc(SH_COPY.outOf) + ' ' + s.asked + '</p>') +
          '<div class="ec-e-rule ec-e-rule--end"></div></div>' +
        '<div class="ec-foot"><img class="ec-logo" src="' + SH_SRC.logo + '" alt="">' +
          '<span class="ec-link">' + SH_LINK + '</span></div>' +
      '</div>';
  }
  return '<div class="' + cls + '" data-k="' + kind + '">' + body + '</div>';
}

/* ---- the export ------------------------------------------------------
   NON-NEGOTIABLE 2 + 3 · everything the SVG needs, base64, fetched ONCE
   and only for a player who is in the end-game. On the real iPhone this
   fetch-and-encode was 1.1s of a 1.3s first export; warmed, the export
   is ~150–190ms. shWarm() is called from endGame() and from nowhere
   else — it is not on load and not on the map, so a player who never
   finishes never pays for it. */
let SH_WARM = null;
const shB64 = async url => {
  const b = await (await fetch(url)).blob();
  return new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
};
function shWarm() {
  if (SH_WARM) return SH_WARM;
  SH_WARM = (async () => {
    const [black, regular, chair, logo, logoInk, coin, cssText] = await Promise.all([
      shB64(SH_SRC.black), shB64(SH_SRC.regular),
      shB64(SH_SRC.chair), shB64(SH_SRC.logo), shB64(SH_SRC.logoInk),
      shB64(SH_SRC.coin),
      fetch('proto.css').then(r => r.text()),
    ]);
    /* the card's own rules, cut from proto.css between the markers */
    const m = cssText.match(/\/\*\s*@ec-start\s*\*\/([\s\S]*?)\/\*\s*@ec-end\s*\*\//);
    const css =
      "@font-face{font-family:'SimplerPro';src:url(" + black + ") format('woff2');font-weight:900}" +
      "@font-face{font-family:'SimplerPro';src:url(" + regular + ") format('woff2');font-weight:400}" +
      (m ? m[1] : '');
    return { css, img: { [SH_SRC.chair]: chair, [SH_SRC.logo]: logo,
                        [SH_SRC.logoInk]: logoInk, [SH_SRC.coin]: coin } };
  })();
  SH_WARM.catch(() => { SH_WARM = null; });      /* a failed warm is retried by the next call */
  return SH_WARM;
}

async function shExport(kind, aspect) {
  const W = SH_ASPECTS[aspect][0], H = SH_ASPECTS[aspect][1];
  const A = await shWarm();
  await Promise.all([document.fonts.load('900 40px SimplerPro'), document.fonts.load('400 40px SimplerPro')]);
  /* a fresh card, not the preview: the preview is under a transform and
     inside the stage's stacking, and the export wants neither */
  const host = el('div', '', shCardHTML(kind, aspect));
  $$('img', host).forEach(i => { const d = A.img[i.getAttribute('src')]; if (d) i.setAttribute('src', d); });
  const xhtml = new XMLSerializer().serializeToString(host.firstChild);
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
      '<foreignObject width="100%" height="100%">' +
        '<div xmlns="http://www.w3.org/1999/xhtml"><style>/*<![CDATA[*/' + A.css + '/*]]>*/</style>' + xhtml + '</div>' +
      '</foreignObject></svg>';
  /* NON-NEGOTIABLE 1 · a data: URL. blob: taints the canvas and toBlob
     throws SecurityError — Chrome, Playwright WebKit and real iOS Safari. */
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('svg')); img.src = url; });
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  /* NON-NEGOTIABLE 4 · drawn twice. WebKit paints the first draw of a new
     SVG document before its inlined fonts and images have decoded — a
     blank ground with one pill. img.decode() does not help. 50ms and a
     second draw does; it is done on every engine because it costs 50ms
     and a UA sniff would be the only thing that could get it wrong. */
  await wait(50);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('png')), 'image/png'));
}

/* ---- share and save --------------------------------------------------
   שיתוף → navigator.share({ files }). Confirmed on real iOS Safari 26 over
   HTTPS: canShare({files}) true, share() resolved. It does not EXIST on an
   http origin, so this feature-detects and falls back to text + link, and
   from there to the clipboard. A CANCEL IS NOT A FAILURE: AbortError is
   the player closing the sheet and must not fall through to a copy they
   chose not to send. */
function shText() {
  const top = shPills().shown[0];
  return [SH_COPY.tag, SH_COPY.claimTxt]
    .concat(top ? [SH_COPY.most + top.t.label] : [])
    .concat(['https://' + SH_LINK]).join('\n');
}
async function shShare() {
  const blob = await shExport(SH_KIND, SH_ASPECT);
  const file = new File([blob], SH_FILE, { type: 'image/png' });
  if (typeof navigator.share === 'function') {
    const data = navigator.canShare && navigator.canShare({ files: [file] })
      ? { files: [file], title: SH_COPY.tag }
      : { text: shText() };
    try { await navigator.share(data); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  try { await navigator.clipboard.writeText(shText()); return 'copied'; }
  catch (e) { return 'failed'; }
}
/* שמירה לגלריה → the PNG, downloaded. The aspect is whatever the toggle
   says — 4:5 is offered here, at save time, not as a second screen. */
async function shSave() {
  const blob = await shExport(SH_KIND, SH_ASPECT);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = SH_FILE;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  return 'saved';
}

/* THE WORKING STATE LIVES INSIDE THE PRESSED BUTTON: the label CLEARS, the
   icon slot becomes a 21px spinner alone, the box does not move. THE OTHER
   BUTTON IS DISABLED WHILE ONE RUNS — two rasterise passes at once on a
   mid-range Android is what produces a janked card.
   THE LABEL USED TO BE REPLACED WITH busyLabel RATHER THAN CLEARED — text
   and spinner side by side in one 64.5px button, fighting for the same
   9px gap. Cleared, the spinner centres alone; busyLabel is no longer
   painted but is kept as the button's aria-label so the busy state still
   has a name for a screen reader, not just aria-busy's bare "busy". */
async function shRun(btn, other, busyLabel, fn) {
  if (SH_BUSY) return;
  SH_BUSY = true;
  const lab = $('.sh-bl', btn), ico = $('.sh-ico', btn);
  const label0 = lab.textContent, ico0 = ico.innerHTML;
  btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
  btn.setAttribute('aria-label', busyLabel);
  lab.textContent = ''; ico.innerHTML = SH_ICON.spin;
  other.disabled = true;
  let r = 'failed';
  try { r = await fn(); } catch (e) { r = 'failed'; }
  btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy');
  btn.removeAttribute('aria-label');
  ico.innerHTML = ico0;
  other.disabled = false;
  SH_BUSY = false;
  /* the clipboard fallback is the one outcome the player cannot see
     happen, so it says so, briefly, in the button it came from */
  if (r === 'copied') { lab.textContent = SH_COPY.copied; setTimeout(() => { lab.textContent = label0; }, 1600); }
  else lab.textContent = label0;
}

/* ---- the screen ----------------------------------------------------- */
async function egBeat4() {
  const c = egStage();
  SH_KIND = 'C'; SH_ASPECT = '916';          /* the defaults, on every arrival */
  SH_BUSY = false;

  /* v30c · THE HEADER ROW, AND THE BACK CONTROL IS ON ITS OWN ROW IN IT.
     TOP RIGHT, which is the start edge in RTL and where iOS puts a back
     control. OWN ROW rather than inline with the title, and that is on
     evidence rather than taste: measured inline, the pill and the title
     clear each other by 2px with the short label, and only at that exact
     string in that exact weight and face. A longer word from Tamar, or
     the system fallback on a cold load before SimplerPro arrives, moves
     them into overlap with nothing to catch it.
     IT IS THE HUD's TOPIC PILL VERBATIM — same height, same radius, same
     paper, same keyline and extrusion — so the way back out of the
     picker is the same object the player has had at the top of every
     round. ON THE GROUND, never over the card: card D is cream and a
     cream pill on it would vanish. */
  c.innerHTML =
    /* T25c · THE LETTERHEAD RUNS TO THE END. It crossed onto screen 3 in
       v30c and stopped there, so the one object carrying the ending's
       continuity abandoned it one screen early. */
    /* T27 · THE BACK CONTROL IS A HUD ROW NOW, above the letterhead
       rather than under it. It is the same object it was — same pill,
       same paper, same keyline — and it is right-aligned, which is where
       the round's own ✕ sits in .hud-right. What it frees is the 10px
       gap and the 36px pill out of the middle of the screen; the column
       is centred, so the space returns to the card. */
    '<div class="sh-hud">' +
      '<button type="button" class="sh-back" id="shBack">' +
        '<i aria-hidden="true">›</i>' + esc(SH_COPY.back) + '</button>' +
    '</div>' +
    /* T37 · 2 · THE TOPIC STRIP IS GONE FROM THIS SCREEN. The six discs
       are shown on the completion screen one step earlier and again on
       the record; a third showing on the picker is the same information
       for the third time, and it is the only thing between the header and
       the card. egStripHTML() is untouched and still runs on the record —
       this removes a call, not a component. What it frees goes to the
       track, which is flex:1: 31px of strip plus the column's own
       clamp(8px,1.6vh,14px) gap. */
    '<div class="sh-hd">' +
      '<h2 class="eg-h2 sh-title">' + esc(t('shTitle')) + '</h2>' +    /* TAMAR · T25 */
    '</div>' +
    '<div class="sh-track" id="shTrack"><div class="sh-rail" id="shRail"></div></div>' +
    '<div class="sh-dots" id="shDots" role="tablist"></div>' +
    '<div class="sh-tg" id="shTg" role="radiogroup"></div>' +
    '<div class="sh-acts" id="shActs"></div>';
  egSwapIn(c);                                   /* T25c · out left, in right */
  const track = $('#shTrack', c), rail = $('#shRail', c), dots = $('#shDots', c), tg = $('#shTg', c), acts = $('#shActs', c);

  /* ---- the carousel: three slots, absolutely placed, one transform ----
     The rail is LTR on purpose: slot i sits at -i·step, so the RTL order
     (C on the right, then D, then E to its left) is arithmetic rather
     than a bidi question, and the swipe direction falls out with it. */
  let step = 0, k = 1, drag = null;
  const slots = SH_KINDS.map(kind => {
    const s = el('div', 'sh-slot'); s.dataset.k = kind;
    s.innerHTML = '<div class="sh-hold"><div class="sh-scale"></div></div>';
    rail.appendChild(s);
    return s;
  });
  const paintCards = () => slots.forEach(s => { $('.sh-scale', s).innerHTML = shCardHTML(s.dataset.k, SH_ASPECT); });
  const place = () => {
    const [W, H] = SH_ASPECTS[SH_ASPECT];
    /* T39 · THE SIZING WIDTH IS THE PADDED ONE, NOT THE BLED ONE. The track
       now carries a negative margin-inline so it reaches the screen edges,
       which grew clientWidth by twice the inset. Left alone, that would
       have grown the CARD: the 4:5 cap is (tw * 0.78) * H / W and binds
       where 9:16's th cap does, so 4:5 would have gone 349.05 -> 380.25 at
       390 while 9:16 stayed put — a bleed that silently resized one aspect
       and not the other. Reading the margin back off the element keeps one
       source of truth in the CSS: change --ov-inline and both follow. */
    const bleed = -parseFloat(getComputedStyle(track).marginInlineStart) || 0;
    const tw = track.clientWidth - bleed * 2, th = track.clientHeight;
    if (!tw || !th) return;
    /* T37 · 1 · THE DIE-CUT IS PAINTED OUTSIDE THE CARD'S BOX AND HAS TO
       BE PAID FOR OUT OF THE TRACK. .sh-hold draws the sticker edge as
       box-shadow -- a 3px paper ring, a 5px keyline outside that, and a
       6px hard drop -- so the ink extends 5px above the box and 6px below
       it while the ELEMENT is only as tall as the card. This line used to
       read Math.min(th, ...), which at 9:16 resolved to th exactly: the
       slot filled the track's full height, top computed to 0, and
       .sh-track's overflow:hidden -- which is there to make the peek work
       and is correct -- cut the edge off at both ends. Measured before
       the fix at 390x844: slot 234.6x417 in a 417 track, 0.00px of room
       above and 0.00 below. 4:5 was never clipped because its width cap
       binds first and left 33.98px at each end.
       SH_EDGE IS 6 AND IS RESERVED SYMMETRICALLY. The slot is centred in
       what is left, so 6px falls above and 6px below: above needs 5, below
       needs 6, and one number for both keeps the card on the track's
       centre line rather than nudged off it to save a pixel. */
    const h = Math.min(th - SH_EDGE * 2, (tw * 0.78) * H / W);
    const w = h * W / H;
    k = w / W; step = w + 14;
    slots.forEach((s, i) => {
      s.style.width = w + 'px'; s.style.height = h + 'px';
      s.style.left = (-w / 2 - i * step) + 'px';
      s.style.top  = ((th - h) / 2) + 'px';
      $('.sh-scale', s).style.transform = 'scale(' + k + ')';
    });
    go(SH_KINDS.indexOf(SH_KIND), true);
    arrive();
  };
  /* ONE SHOT, AND IT RUNS OFF place() BECAUSE place() IS WHERE step FIRST
     HAS A VALUE. place() also runs on resize; the flag is what keeps this
     to the first of those. Skipped entirely under reduced motion, the way
     nudgeCover() skips the tape's wiggle — a demonstration that resolves
     in 1ms is a flicker with no meaning, and the dots still say three. */
  const arrive = () => {
    if (SH_ARRIVED || !step) return;
    SH_ARRIVED = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const i = SH_KINDS.indexOf(SH_KIND);
    rail.classList.add('is-drag');                 /* no transition on the way out */
    rail.style.transform = 'translateX(' + (i * step + SH_ARRIVE_PX) + 'px)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      rail.classList.remove('is-drag');
      rail.classList.add('is-arriving');
      rail.style.transform = 'translateX(' + (i * step) + 'px)';
      setTimeout(() => rail.classList.remove('is-arriving'), SH_ARRIVE_MS + 60);
    }));
  };
  const go = (i, silent) => {
    i = Math.max(0, Math.min(SH_KINDS.length - 1, i));
    SH_KIND = SH_KINDS[i];
    rail.style.transform = 'translateX(' + (i * step) + 'px)';
    slots.forEach((s, j) => s.classList.toggle('is-cur', j === i));
    $$('.sh-dot', dots).forEach((d, j) => {
      d.classList.toggle('is-on', j === i);
      d.setAttribute('aria-selected', j === i);
    });
    /* O2 · a carousel step is navigation, not an event. The dots and the
       snap already say which card is current. */
  };
  /* the swipe. pointer events, one finger, a 40px threshold; the rail
     follows the finger and snaps on release. touch-action:pan-y in CSS
     keeps a vertical gesture the browser's. */
  track.addEventListener('pointerdown', e => {
    if (SH_BUSY) return;
    drag = { x: e.clientX, i: SH_KINDS.indexOf(SH_KIND), moved: false };
    rail.classList.add('is-drag');
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    rail.style.transform = 'translateX(' + (drag.i * step + dx) + 'px)';
  });
  const drop = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    rail.classList.remove('is-drag');
    /* T27 · THE COMMIT NOW AGREES WITH THE PREVIEW, and that is the whole
       of the swipe bug. The rail follows the finger (pointermove adds dx),
       and slot i sits at -i·step — higher index is further LEFT. So to
       bring the next card to the centre the rail travels RIGHT, which is
       a finger moving RIGHT. The old line committed on a finger moving
       LEFT: during the drag the card being reached for slid away, and on
       release the rail jumped 326px the other way at 390. Measured. */
    go(drag.i + (dx > 40 ? 1 : dx < -40 ? -1 : 0));
    drag = null;
  };
  track.addEventListener('pointerup', drop);
  track.addEventListener('pointercancel', drop);

  /* the dots: a pill for the active one, not a colour change */
  SH_KINDS.forEach((kind, i) => {
    const d = el('button', 'sh-dot'); d.type = 'button'; d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', SH_COPY.card + ' ' + (i + 1));              /* TAMAR */
    pressable(d).addEventListener('click', () => go(i));
    dots.appendChild(d);
  });

  /* the toggle: ONE control divided in two. The container carries the
     keyline, the radius and the lift; the halves are flush at 0px and
     the active fill is clipped to the rounded ends by overflow:hidden. */
  [['916', SH_COPY.a916], ['45', SH_COPY.a45]].forEach(([a, label]) => {
    const h = el('button', 'sh-tgh' + (a === SH_ASPECT ? ' is-on' : ''));
    h.type = 'button'; h.dataset.a = a; h.setAttribute('role', 'radio');
    h.innerHTML = '<i class="sh-tgm sh-tgm--' + a + '" aria-hidden="true"></i>' + label;
    h.setAttribute('aria-checked', a === SH_ASPECT);
    pressable(h).addEventListener('click', () => {
      if (SH_BUSY || a === SH_ASPECT) return;
      SH_ASPECT = a;
      $$('.sh-tgh', tg).forEach(x => {
        x.classList.toggle('is-on', x.dataset.a === a);
        x.setAttribute('aria-checked', x.dataset.a === a);
      });
      paintCards(); place();
    });
    tg.appendChild(h);
  });

  /* T37 · 3 · ONE ROW, ONE HEIGHT, AND THE ICON BESIDE THE LABEL RATHER
     THAN PINNED TO THE EDGE. The markup is unchanged — label then icon,
     so RTL puts the icon at the physical left of the pair — and what
     changed is the box: .sh-acts is a row, both buttons are 64.5px, and
     .sh-b centres its two children as one group instead of pushing them
     to opposite ends. See .sh-b in proto.css. */
  const mkBtn = (cls, label, icon) => {
    const b = el('button', cls); b.type = 'button';
    b.innerHTML = '<span class="sh-bl">' + esc(label) + '</span><span class="sh-ico">' + icon + '</span>';
    return b;
  };
  const share = mkBtn('p-c sh-b sh-b--share', SH_COPY.share, SH_ICON.share);
  const save  = mkBtn('r-b sh-b sh-b--save',  SH_COPY.save,  SH_ICON.save);
  pressable(share).addEventListener('click', () => shRun(share, save, SH_COPY.sharing, shShare));
  pressable(save ).addEventListener('click', () => shRun(save,  share, SH_COPY.saving,  shSave));
  acts.append(share, save);
  /* the way off the screen, quiet: the map is where every topic reopens */
  /* v30c · the back control moved into the header row above; this is the
     wiring for it, and the old foot-of-column button is gone with the
     row it sat in. */
  const back = $('#shBack');
  pressable(back).addEventListener('click', () => goMap());

  paintCards();
  place();
  if (window.ResizeObserver) new ResizeObserver(place).observe(track);
  else addEventListener('resize', place);
  requestAnimationFrame(() => {
    $('.eg-h2', c).classList.add('is-in');
    place();
    c.classList.add('is-in');
  });
}

/* ===================== boot ========================================= */
/* THE ROUND, which is now one screen of three rather than the whole app.
   It no longer resets the coin count: the wallet belongs to the session
   and the map is the thing you come back to with it. */
function startRound(issueId) {
  applyDev();
  /* SOUND · THE DECK MEETS THE TABLE. On startRound() and not on
     .sc-round.is-entering: openTopic() adds that class at the map's door
     (proto.js:7561) but beat 5's לסוגיה הבאה calls startRound() directly
     (proto.js:5436) and adds nothing, so half of all round starts would
     have been silent. This is the one place both doors pass through. */
  sfx('deck');
  /* the other door. Coming here from beat 5's לסוגיה הבאה, or back into a
     topic from the map, has to start on the same empty stage the map's
     door leaves behind — re-entering a topic must not inherit anything
     from the round before it. */
  endRound();
  const sr = $('#scRound'); if (sr) sr.classList.remove('is-finale');
  const chy0 = $('#chyron');
  if (chy0) { chy0.hidden = false; chy0.classList.remove('is-exiting'); }
  helper('');
  /* the chyron is emptied, never removed: it holds its box on beat 1 so
     the card is the same size before and after the answer is given */
  const c = $('#chyron');
  c.innerHTML = ''; c.classList.add('is-empty'); c.setAttribute('aria-hidden', 'true');
  newRound(issueId);
  if (window.HAC) { HAC.beatStart(); HAC('issue_start', { issue_id: issue.id, topic_id: issue.topic || '', score: wallet }); }
  /* §B the topic the issue belongs to, from data.js, centred in the HUD
     and present on every beat — the round is one issue inside one topic
     and the HUD is the only thing on screen that can say which.
     Read AFTER newRound(), which is what resolves `issue`. */
  /* A5 · THE CENTRE OF THE HUD IS THE ISSUE, NOT THE TOPIC. The player
     chose the topic on the map a second ago; what they cannot see from
     inside the round is which of its issues they are in. data.js carries
     both a short `title` (חוק הגיוס) and a long `bill_title` (החלת דין
     רציפות על חוק הגיוס) — the short one is the header, per A5. */
  /* ITEM 28 · variant C's markup. The slot is first so RTL renders it on
     the right, leading the title, and it carries the issue id as its hook
     so per-issue art can be attached in CSS alone. esc() on the title
     because it is data.js content going through innerHTML. */
  /* T27 · THE TOPIC PILL IS RETIRED. The slot it held is the question
     block's now, and the topic name is a filing label at the moment
     filing is irrelevant — it is on the map node the player came from
     and on the map they return to. The element is index.html's and
     cannot be deleted from here, so it is emptied and pinned hidden;
     showScreen() no longer unhides it. */
  const t = $('#hudTopic');
  if (t) { t.innerHTML = ''; t.hidden = true; }
  showScreen('round');
  beat1();
  sizeStage();
}

/* §4.1 THE DEFAULT AVATAR IS ASSIGNED INSTANTLY, guest included. There is
   no step where the player is asked to make one, and nothing gates on it. */
function boot() {
  applyDev();
  /* THE SAVE IS READ BEFORE ANY SCREEN IS BUILT, for the same reason the
     DEV switches are: the map and the HUD are drawn from PROGRESS and
     wallet, and restoring after the draw would render a clean map and
     then correct it. ?reset clears first, so the restore that follows
     finds nothing and the session starts as a first-ever visit. */
  if (DEV.reset) wipeAll();                    /* T36 · the save AND SEEN_KEY */
  restoreSave();
  /* §B the default is the first preset, written down so the save carries
     an explicit id rather than "whatever is first"; restoreSave() has
     already put back a saved pick if there was one. The sticker is the
     door to 2b on the map and the end — the round swaps it for the ✕ and
     the intro hides the HUD, so there is nothing to wire for those. */
  if (!PROFILE.avatarId && presets()[0]) PROFILE.avatarId = presets()[0].id;
  /* T19 · once, before the first screen. It is a DOM move, not a paint,
     so it belongs with the other things boot() settles before anything
     is drawn rather than with the per-screen HUD sync. */
  pairHudProgress();
  paintHudAvatar();
  /* SOUND · built once, before the first screen, so the router has
     something to show or hide on its very first call. */
  buildSndToggle();
  buildQbar();                                                 /* T27 */
  pressable($('#hudAvatar')).addEventListener('click', () => {
    /* T13 · SPENT BEFORE THE GUARD, NOT AFTER. The double-tap that lands
       while 2b is already open is still a tap on the avatar, and a beacon
       that survived it would be pulsing behind an open sheet. */
    spendAvBeacon();                                             /* T13 */
    if ($('.stmodal[data-profile]')) return;
    profileModal();
  });
  pressable($('#hudX')).addEventListener('click', exitRound);
  /* the one glossary listener, on #stage, before any screen is built —
     see wireGlossary() for why it is delegated and why #stage */
  wireGlossary();
  $('#coinNum').textContent = wallet;
  /* §7 the deep-link. `round` drops straight in without a map behind it,
     which is what makes it useful in a meeting; `map` and `intro` build
     their screen and stop. */
  /* ?issue=<id> lets the deep-link land on a specific round, which is the
     only way to reach the inverted a2 without playing a1 first */
  if (DEV.screen === 'round')      startRound(Q.get('issue') || undefined);
  else if (DEV.screen === 'map')   goMap();
  /* §E ?screen=end drops straight into the summary, which is the only
     way to show it in a meeting without playing eleven rounds first. It
     reads whatever RECORD the save holds — so on a clean store the
     numbers are honestly zero rather than invented. */
  else if (DEV.screen === 'end')   endGame();
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


fetch('explorations/v16/prototype/manifest.json')
  .then(r => r.json())
  .then(j => { M = j;
    /* MK-PORTRAITS · ONE WARN, AT LOAD, LISTING WHAT HAS NO ART.
       The initials badge is the shipped answer for a politician with no
       portrait and it stays — deckCard() builds it, the manifest's own
       `fallback` block documents it, and it NEVER substitutes another
       person's face. What the badge cannot do is tell the difference
       between a portrait that was never made and one that was lost, and
       both look identical on the card.
       SO THE DIFFERENCE IS SAID ONCE, HERE, IN THE CONSOLE. Not a throw:
       a missing face must never stop a round. Not UI: the player is not
       the audience for an asset gap. Not a placeholder file: that is the
       thing the fallback rule forbids. One line, at the only moment the
       whole roster and the whole manifest are both in hand.
       IT READS data.js, WHICH IS THE ROSTER. The manifest is the art
       index and can hold entries for people the game no longer deals —
       six of them today; those are not missing art and are not warned
       about. */
    try {
      const missing = Object.keys(DATA.politicians)
        .filter(k => !(M.politicians && M.politicians[k]));
      if (missing.length) console.warn('[mk] no portrait for: ' + missing.join(', '));
    } catch (e) { /* a warn may never be the thing that breaks a load */ }
    /* THE CARD BACK IS NO LONGER AN ASSET, so nothing is read for it here.
       It used to take props.card_back off the manifest and write it into
       --cardback-art; it is a tiling SVG pattern in proto.css now, for the
       reason given at §1 THE CARD BACK -- an illustration cannot survive
       being read through a 38px hole, and a texture can.
       props.card_back IS DELIBERATELY LEFT IN THE MANIFEST. It is still
       emitted by make_manifest.py and still names assets/card_background
       .webp, and neither is touched: that is Roman's data path and
       removing the entry would be editing generated output that would
       simply come back. It is inert as far as this app is concerned, and
       the asset is no longer fetched -- which is also 765KB off the first
       load, the figure 560062a cut it down to.
       IF THE BACK IS EVER AN IMAGE AGAIN, this is where it would be read;
       the manifest entry is intact and waiting. */
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
