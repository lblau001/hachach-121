/* hac121 · game analytics — Google Analytics 4 */

(function () {
  var G_ID = 'G-0RFE7DHTP6';
  var CONSENT_KEY = 'hac121_consent'; /* 'yes' | 'no' */

  /* ── session clock ──────────────────────────────────────────────── */
  var _t0 = Date.now();
  var _beatStart = Date.now();

  /* ── HAC stub — safe no-op until GA4 is ready ───────────────────── */
  window.HAC = function (eventName, params) { void eventName; void params; };
  window.HAC.beatStart = function () { _beatStart = Date.now(); };
  window.HAC.beatMs    = function () { return Date.now() - _beatStart; };

  /* ── full GA4 init (called only after consent) ──────────────────── */
  function initGA4() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', G_ID, {
      send_page_view: false,
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + G_ID;
    document.head.appendChild(script);

    /* replace stub with real implementation — keep beat helpers on the new fn */
    window.HAC = function (eventName, params) {
      var base = {
        game_version: 's1',
        elapsed_s: Math.round((Date.now() - _t0) / 1000),
      };
      gtag('event', eventName, Object.assign(base, params || {}));
    };
    window.HAC.beatStart = function () { _beatStart = Date.now(); };
    window.HAC.beatMs    = function () { return Date.now() - _beatStart; };

    HAC('game_open', {});

    document.addEventListener('visibilitychange', function () {
      HAC(document.hidden ? 'app_background' : 'app_foreground', {
        elapsed_s: Math.round((Date.now() - _t0) / 1000),
      });
    });

    window.addEventListener('beforeunload', function () {
      HAC('session_end', { total_s: Math.round((Date.now() - _t0) / 1000) });
    });
  }

  /* ── consent check ──────────────────────────────────────────────── */
  var stored;
  try { stored = localStorage.getItem(CONSENT_KEY); } catch (e) { stored = null; }

  /* ── bug-report button (always visible, bottom-left) ───────────── */
  function showBugButton() {
    var s = document.createElement('style');
    s.textContent = '#hac-bug{'
      + 'position:fixed;bottom:10px;left:10px;z-index:80;'
      + 'background:rgba(20,20,20,.6);color:#aaa;'
      + 'font-family:Arial,sans-serif;font-size:11px;'
      + 'border:1px solid rgba(255,255,255,.1);border-radius:20px;'
      + 'padding:4px 10px;cursor:pointer;text-decoration:none;'
      + '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);'
      + 'transition:background .15s,color .15s;'
      + '}'
      + '#hac-bug:hover{background:rgba(40,40,40,.85);color:#ddd;}';
    document.head.appendChild(s);
    var a = document.createElement('a');
    a.id = 'hac-bug';
    a.href = 'mailto:tamar@idea.org.il?subject=' + encodeURIComponent('תקלה באתר הח"כ ה-121');
    a.textContent = '🐞 דיווח על תקלה';
    a.setAttribute('aria-label', 'דיווח על תקלה');
    document.body.appendChild(a);
  }

  if (stored === 'yes') {
    initGA4();
    if (document.body) { showBugButton(); }
    else { document.addEventListener('DOMContentLoaded', showBugButton); }
    return;
  }
  if (stored === 'no') {
    if (document.body) { showBugButton(); }
    else { document.addEventListener('DOMContentLoaded', showBugButton); }
    return;
  }

  /* ── cookie banner (injected into DOM — no index.html change) ───── */
  function showBanner() {
    /* Override .consent position: pin to bottom-right, narrow width.
       Leon's glass-card look (blur, radius, shadow) is kept intact;
       only inset and width are changed so the banner clears the
       play-button in the centre of the stage. */
    var s = document.createElement('style');
    s.textContent = '#hac-consent.consent{'
      + 'inset-inline:auto;'      /* clear the 0/0 shorthand */
      + 'right:12px;left:auto;'   /* pin to physical right */
      + 'margin-inline:0;'
      + 'width:200px;max-width:200px;'
      + '}';
    document.head.appendChild(s);

    /* PRESENTATION LIVES IN proto.css (§CONSENT), NOT HERE. */
    var banner = document.createElement('div');
    banner.id = 'hac-consent';
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'hac-consent-p');
    banner.innerHTML = '<p class="consent__p" id="hac-consent-p">'
      +   'משתמשים ב-<span lang="en">Google Analytics</span> כדי לשפר.'
      +   ' <a href="/privacy.html">מדיניות פרטיות</a>.'
      + '</p>'
      + '<div class="consent__row">'
      +   '<button type="button" id="hac-accept" class="r-b consent__b">מסכימים</button>'
      +   '<button type="button" id="hac-decline" class="r-b consent__b">לא, תודה</button>'
      + '</div>';

    document.body.appendChild(banner);

    document.getElementById('hac-accept').addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {}
      banner.parentNode.removeChild(banner);
      initGA4();
      showBugButton();
    });

    document.getElementById('hac-decline').addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, 'no'); } catch (e) {}
      banner.parentNode.removeChild(banner);
      showBugButton();
    });
  }

  if (document.body) {
    showBanner();
  } else {
    document.addEventListener('DOMContentLoaded', showBanner);
  }
})();
