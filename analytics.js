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

  if (stored === 'yes') {
    initGA4();
    return;
  }
  if (stored === 'no') {
    return;
  }

  /* ── the consent choice (asked in the game's first-run sticker) ──── */
  /* THE BANNER IS GONE; THE CHOICE IS ASKED BY proto.js. The question now
     sits at the foot of the map's first-arrival sticker ("אז איך זה
     עובד?"), so this file no longer builds any DOM. It hands the two
     handlers to the game instead of wiring them to its own buttons.
     The consent logic — the two handler bodies below, the localStorage
     key and initGA4() — is exactly as built; only who calls them, and
     when, has changed. The object exists only while no answer is
     stored, which is how proto.js knows the question is still open. */
  window.HAC_CONSENT = {
    accept: function () {
      try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {}
      initGA4();
    },
    decline: function () {
      try { localStorage.setItem(CONSENT_KEY, 'no'); } catch (e) {}
    }
  };
})();
