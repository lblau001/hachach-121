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

const VOTES  = ['for', 'against', 'abstain'];
const VLABEL = { for: 'בעד', against: 'נגד', abstain: 'נמנע' };

/* ---------------------------------------------------------------------
   MOTION. Read from the stylesheet so there is exactly one source of
   truth for a duration: retuning a token retunes the JS with it.
   --------------------------------------------------------------------- */
const CS = getComputedStyle(document.documentElement);
const ms = n => parseFloat(CS.getPropertyValue(n)) || 0;
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

/* the spike's open decisions, switchable in the hand */
const DEV = {
  cards: 5,          /* #4d — the sheet says 3 (§8b, Hick's); app deals 5 */
  swipe: 'R',        /* #12 — which edge is אמת. Dual input either way    */
  b5:    'A1',       /* the two open beat-5 variants                     */
  coins: 'sheet',
  hold:  'long',     /* §1.2 the answer-first hold. short = the brief's
                        derived 275ms; long = the tuned 640ms.           */
  ph:    false       /* placeholders. OFF by default so the round plays
                        clean; the markers are hidden, never deleted.    */
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
const CARD_STACK_H = 620 + 96 + 52;  /* card + the axis strip + the gap that
                                        clears the stamp hanging below   */

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
    const others = [...beat.children]
      .filter(c => c !== stack)
      .reduce((a, c) => a + c.offsetHeight +
        (parseFloat(getComputedStyle(c).marginTop) || 0), 0);
    /* 4px of slack absorbs sub-pixel rounding in the scale, which was
       clipping the last 2px of the gate on the shortest phone. */
    const avail = Math.max(120, round.clientHeight - others - 4);
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
let gateTimers = [];
function gate(host, hint, urge) {
  clearGate();
  const g = el('div', 'gate', '<span class="gate-line"></span>');
  const line = $('.gate-line', g);
  host.appendChild(g);
  gateTimers.push(setTimeout(() => { line.textContent = hint; g.classList.add('is-hinting'); }, T.gateHint));
  gateTimers.push(setTimeout(() => { line.textContent = urge || hint; g.classList.add('is-urging'); }, T.gateGrow));
  /* the gate is appended after the beat has laid out, so the stack has to
     be re-sized with the gate's height counted — otherwise the card sits
     on top of it and the instruction line is clipped off a short phone. */
  sizeStage();
  return g;
}
function clearGate() { gateTimers.forEach(clearTimeout); gateTimers = []; }

/* ===================== the pinned claim ============================= */
/* Enters the chrome at beat 2 WITH the consent line, persists to beat 5,
   and resolves there. The one element continuously on screen for the
   whole round, so it is the round's load-bearing identity object.     */
function pin(word) {
  const host = $('#round');
  let p = $('.pinned', host);
  if (!p) { p = el('span', 'pinned'); host.appendChild(p); }
  p.innerHTML = esc(word);
  return p;
}
/* the round re-renders on every beat, so the pinned answer has to be
   re-attached rather than assumed to have survived */
function repin() { if (S.claim) pin(S.claim === 'true' ? 'אמת' : 'שקר'); }

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
  /* the deck the round will be dealt from, already under the claim.
     Counted from the DEALT sample so a back never promises a card that
     does not arrive. */
  const pile = el('span', 'pile', '<i></i>'.repeat(Math.min(4, S.dealt.length)));
  const card = el('article', 'mf-b b1card');
  card.innerHTML =
    '<div class="b1art"><img src="' + ROOT + art.file + '" alt="" width="' + art.w + '" height="' + art.h + '"></div>' +
    '<p class="b1claim">' + esc(issue.tf) + '</p>' +
    '<div class="v-a-row b1ans">' +
      '<button class="v-a" data-ans="true">אמת</button>' +
      '<button class="v-a" data-ans="false">שקר</button>' +
    '</div>' +
    /* §2.1 the preview pill lives INSIDE the card so it travels with it */
    '<div class="b1prev"><i>DRAG</i><b></b></div>' +
    /* the reveal wash, on the card's leading edge */
    '<div class="b1target"><span></span></div>';

  wrap.append(pile, card);
  stack.appendChild(wrap);
  b.appendChild(stack);

  /* the swipe hint is unwritten copy — the line that says both work.
     data-ph marks the HOST, so hiding it leaves no empty line behind. */
  const hint = el('p', 'b1hint', ph('[טקסט — תמר: החלקה או הקשה, שתיהן עובדות]'));
  hint.setAttribute('data-ph', '');
  b.appendChild(hint);

  r.appendChild(b);
  gate(b, 'אמת או שקר?', 'בחרו אמת או שקר כדי להמשיך');

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
  const show = d => {
    const a = ansFor(d), k = Math.min(1, Math.abs(d) / (TH * FADE));
    const right = d > 0;                       /* moving toward the right */
    $('span', tgt).textContent = a === 'true' ? 'אמת' : 'שקר';
    $('b', prev).textContent   = a === 'true' ? 'אמת' : 'שקר';
    /* same ink both directions — the preview names the word, never which
       one is the "good" answer, because neither of them is */
    tgt.style.opacity = k;
    tgt.classList.toggle('b1target--right', right);
    tgt.classList.toggle('b1target--left', !right);
    prev.style.opacity = k;
    /* the pill sits on the TRAILING edge. On the leading edge it left the
       stage with the card and only the word "DRAG" stayed visible — the
       wash already carries the answer on the side you are going to. */
    prev.style.left  = right ? '14px' : 'auto';
    prev.style.right = right ? 'auto' : '14px';
  };
  const clear = () => { tgt.style.opacity = 0; prev.style.opacity = 0; };
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
  clearGate();
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
  beat2();
}

/* ===================== BEAT 2 · YOUR OWN VOTE ======================= */
/* B2-CHAIR-FULL. An interruption, not a step in the same plane.
   Behind the blur: the pinned answer and the cards ahead. NOTHING else
   — no bill_summary, no tally, no sources, no crowd data.             */
function beat2() {
  S.beat = 2;
  const r = $('#round'); r.innerHTML = '';
  const b = el('div', 'beat b2');

  const under = el('div', 'b2under');
  under.innerHTML = '<div class="b2backs">' + '<i></i>'.repeat(Math.min(3, S.dealt.length)) + '</div>';

  /* THE OVERLAY IS A CHILD OF .stage, NOT OF THE BEAT. Anchored to the
     beat it stopped at the round's padding and the dot-grid ground showed
     through at every border. At stage level the blur reaches the edges
     and the safe areas; the HUD and the pinned answer sit above it. */
  const ov = el('div', 'ov ov--stage');
  ov.innerHTML =
    '<div class="ov-inner">' +
      /* the chair is height-capped against the viewport and never cropped:
         it is the game's emblem and a cut one reads as a bug */
      '<img class="b2chair" src="' + ROOT + M.props.chair['300'] + '" alt="">' +
      '<p class="b2q">איך הייתם מצביעים?</p>' +
      '<p class="b2bill">' + esc(issue.bill_title) + '</p>' +
      '<div class="v-a-row b2votes">' +
        VOTES.map(v => '<button class="v-a" data-vote="' + v + '">' + VLABEL[v] + '</button>').join('') +
      '</div>' +
      '<p class="b2consent">את התוצאה נגלה בסוף ›</p>' +
    '</div>';

  b.appendChild(under);
  r.appendChild(b);
  $('#stage').appendChild(ov);

  /* the pinned answer enters HERE, with the consent line */
  pin(S.claim === 'true' ? 'אמת' : 'שקר');
  /* and it is what shows behind the blur, per the board's beat-2 frame */

  gate(ov.firstElementChild, 'שלוש האפשרויות פתוחות', 'בחרו איך הייתם מצביעים — אין תשובה נכונה כאן');

  ov.querySelectorAll('[data-vote]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (S.position) return;
      S.position = btn.dataset.vote;
      clearGate();
      ov.querySelectorAll('.v-a').forEach(x => x.disabled = true);
      const table = COIN_TABLES[DEV.coins];
      award(table.position);                    /* 0 under 'sheet' §1.4d */
      await wait(T.hold);
      ov.classList.add('ov--out');
      await wait(T.ovIn);
      ov.remove();
      beat3();
    }));
}

/* ===================== BEAT 3 · THE BILL ============================ */
/* No longer a screen. bill_title + bill_date ONLY, on an overlay over
   the first MK card — the bill is read while looking at the person it
   is about. Dismiss COLLAPSES INTO the card beneath.                  */
function beat3() {
  S.beat = 3;
  renderCascade();                                   /* the card is already there */
  const wrap = $('.cardwrap');
  const ov = el('div', 'ov ov--card');
  ov.innerHTML =
    '<p class="b3title">' + esc(issue.bill_title) + '</p>' +
    '<span class="b3date">' + esc(issue.bill_date) + '</span>' +
    '<p class="b3go" data-ph>' + ph('[טקסט — תמר: רמז לסגירה]') + '</p>';
  wrap.appendChild(ov);

  ov.addEventListener('click', async () => {
    ov.classList.add('ov--collapse');
    await wait(T.ovCollapse);
    ov.remove();
    S.beat = 4;
    armPredict();
  }, { once:true });
}

/* ===================== BEAT 4 · THE CASCADE ========================= */
function renderCascade() {
  const r = $('#round'); r.innerHTML = '';
  const b = el('div', 'beat b4');
  const stack = el('div', 'stack');
  const wrap = el('div', 'cardwrap');

  /* the pile shows dealt - index - 1 backs, capped at what .pile draws */
  const left = Math.max(0, S.dealt.length - S.ci - 1);
  const pile = el('span', 'pile', '<i></i>'.repeat(Math.min(4, left)));

  const p = S.dealt[S.ci], pol = DATA.politicians[p.id];
  const art = M.politicians[p.id];

  const card = el('article', 'mf-b mkcard');
  card.innerHTML =
    '<span class="mf-b__halo"></span>' +
    (art
      ? '<img class="mf-b__port" src="' + ROOT + art['400'] + '" alt="">'
      : '<span class="mf-b__badge">' + esc(initials(pol.name)) + '</span>') +
    /* §1.4b the party label STAYS. Hiding it dumps the complexity on a
       17-year-old as noise — Tesler's Law. The fix for a boring round
       is curation, not concealment. */
    '<div class="mf-b__id"><h2>' + esc(pol.name) + '</h2><p>' + esc(pol.party) + '</p></div>';

  wrap.append(pile, card);
  stack.appendChild(wrap);
  b.appendChild(stack);
  r.appendChild(b);
  repin();
  sizeStage();
  return card;
}

function armPredict() {
  S.phase = 'predict';
  const card = $('.mkcard');
  const foot = el('div', 'v-a-row mf-b__foot');
  foot.innerHTML = VOTES.map(v =>
    '<button class="v-a" data-pred="' + v + '">' + VLABEL[v] + '</button>').join('');
  card.appendChild(foot);

  gate($('.beat'), 'מה הוא/היא הצביע/ה?',
       'בחרו ניחוש כדי לראות איך הוא/היא באמת הצביע/ה');

  foot.querySelectorAll('[data-pred]').forEach(btn =>
    btn.addEventListener('click', () => verdict(btn.dataset.pred, foot, card)));
}

async function verdict(guess, foot, card) {
  if (S.phase !== 'predict') return;
  S.phase = 'verdict';
  clearGate();
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

  /* THE AXIS LEAVES THE CARD. With the face rule re-locked there is no
     190px region inside the card clear of both the portrait and the
     right-aligned name, so the card's foot is given to the stamp and the
     axis becomes its own strip underneath — full width, fully legible. */
  $('.stack').appendChild(axis(guess, p));
  /* THE STAMP LEAVES THE CARD TOO: .mf-b carries overflow:hidden, which
     is what was clipping it at the left edge. .cardwrap does not clip. */
  $('.cardwrap').appendChild(stamp(ok));
  card.classList.add('is-stamped');
  inkBleed();
  sizeStage();

  const table = COIN_TABLES[DEV.coins];
  if (ok) setTimeout(() => award(table.perCorrect), T.stamp);

  /* MK flip: the whole verdict lands inside the measured band and the
     next card is the point, so the card leaves fast */
  await wait(T.stamp + T.flip);
  S.ci++;
  if (S.ci >= S.dealt.length) { card.classList.add('is-spent'); await wait(T.exit); return beat5(); }

  card.classList.add('is-spent');
  await wait(T.exit);
  const next = renderCascade();
  next.classList.add('is-drawing');
  await wait(T.draw);
  armPredict();
}

/* the guess-vs-reality axis — the payload of the beat */
function axis(guess, p) {
  const stop = v => ((VOTES.indexOf(v) * 2 + 1) / 6 * 100).toFixed(2) + '%';
  const same = guess === p.vote;
  const pol  = DATA.politicians[p.id], art = M.politicians[p.id];
  const g = el('div', 'gx');
  g.innerHTML =
    '<div class="gx-track">' +
      '<span class="gx-m gx-you' + (same ? ' is-paired' : '') + '" style="right:' + stop(guess) + '">' +
        '<span class="as-d">' + AV3 + '</span></span>' +
      '<span class="gx-m gx-mk" style="right:' + stop(p.vote) + '">' +
        (art ? '<img class="gx-port" src="' + ROOT + art['128'] + '" alt="">'
             : '<span class="gx-badge">' + esc(initials(pol.name)) + '</span>') +
      '</span>' +
    '</div>' +
    '<div class="gx-stops">' + VOTES.map(v => '<i>' + VLABEL[v] + '</i>').join('') + '</div>' +
    '<p class="gx-cap"><span>הניחוש שלכם</span><span>הצביע/ה</span></p>';
  return g;
}

/* D2 · the verdict stamp. Correctness only — neither ink appears
   anywhere near בעד, נגד or נמנע, and neither changes with which way
   the MK voted. The words are Tamar's and render as placeholders.    */
function stamp(ok) {
  const s = el('span', 'd2 ' + (ok ? 'd2--correct' : 'd2--surprise'));
  s.innerHTML =
    '<svg class="d2__art" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g filter="url(#ink)">' +
        '<circle cx="50" cy="50" r="45.5" stroke-width="6"></circle>' +
        '<circle cx="50" cy="50" r="38" stroke-width="2.2"></circle>' +
        '<text font-size="9.5" text-anchor="middle">' +
          '<textPath href="#d2ring" startOffset="50%">[RING-TEXT]</textPath></text>' +
      '</g></svg>' +
    '<span class="d2__lab">' + (ok ? '[RIGHT]' : '[SURPRISE]') + '</span>';
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

  /* ---- 1. the pinned claim RESOLVES. A moment, not a swap. -------- */
  const p = pin(S.claim === 'true' ? 'אמת' : 'שקר');
  p.classList.add('is-resolving');
  await wait(T.resolve * 0.38);
  p.innerHTML = esc(truth) + '<small>התשובה</small>';
  p.classList.add('is-truth');
  await wait(T.resolve * 0.62);

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

  $('#devclock').textContent =
    'machine ' + (machineMs / 1000).toFixed(1) + 's · wall ' +
    ((performance.now() - S.t0) / 1000).toFixed(1) + 's';
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
  clearGate();
  const old = $('.pinned', $('#stage')); if (old) old.remove();
  $('#coinNum').textContent = '0';
  $('#hudAvatar').innerHTML = AV3;
  newRound();
  beat1();
  sizeStage();
}

function applyDev() {
  document.documentElement.dataset.hold = DEV.hold;
  document.body.classList.toggle('no-ph', !DEV.ph);
  /* the spike bar is not part of the design, so it must not sit on top of
     anything that is — it was covering the pinned claim. It is anchored to
     the bottom and the stage reserves its height. */
  const bar = document.getElementById('devbar');
  if (bar) document.documentElement.style
    .setProperty('--devbar-h', bar.offsetHeight + 'px');
}

$('#devbar').addEventListener('click', e => {
  const k = e.target.dataset && e.target.dataset.dev; if (!k) return;
  if (k === 'cards') { DEV.cards = DEV.cards === 5 ? 3 : 5; e.target.textContent = 'cards: ' + DEV.cards; }
  if (k === 'swipe') { DEV.swipe = DEV.swipe === 'R' ? 'L' : 'R';
    e.target.textContent = 'swipe: ' + DEV.swipe + '=אמת'; }
  if (k === 'b5')    { DEV.b5 = DEV.b5 === 'A1' ? 'A2' : 'A1'; e.target.textContent = 'B5: ' + DEV.b5; }
  if (k === 'coins') { DEV.coins = DEV.coins === 'sheet' ? 'brief' : 'sheet';
    e.target.textContent = 'coins: ' + DEV.coins; }
  if (k === 'hold')  { DEV.hold = DEV.hold === 'long' ? 'short' : 'long';
    e.target.textContent = 'hold: ' + DEV.hold; }
  if (k === 'ph')    { DEV.ph = !DEV.ph;
    e.target.textContent = 'placeholders: ' + (DEV.ph ? 'on' : 'off'); }
  applyDev();
  start();
});

fetch('../prototype/manifest.json')
  .then(r => r.json())
  .then(j => { M = j; sizeStage(); start(); })
  .catch(() => {
    $('#round').innerHTML =
      '<p style="color:#EFECE4;font-weight:700;line-height:1.5">' +
      'manifest.json could not be read. Serve the repo over http — ' +
      '<code style="direction:ltr">python3 -m http.server 8000</code> — ' +
      'and open <code style="direction:ltr">/explorations/v16/proto/</code>.</p>';
  });
