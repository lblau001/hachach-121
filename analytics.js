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

  /* ── cookie banner (injected into DOM — no index.html change) ───── */
  function showBanner() {
    /* PRESENTATION LIVES IN proto.css (§CONSENT), NOT HERE. The banner
       used to inject its own <style>; it is now the same sticker material
       as the profile sheet and the exit sheet, drawn by the app's own
       stylesheet, and the DOM below only carries the hooks. The ids
       hac-accept / hac-decline are what the handlers under this look up
       and are unchanged. The consent logic — the two handlers, the
       localStorage key, initGA4() — is exactly as built. */
    var banner = document.createElement('div');
    banner.id = 'hac-consent';
    banner.className = 'consent';
    /* a dialog, not a region: proto.js seats focus in it and holds Tab
       until it is answered (see wireConsent()), which is what aria-modal
       promises a screen reader. */
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'hac-consent-p');
    banner.innerHTML = '<p class="consent__p" id="hac-consent-p">'
      +   'משתמשים ב-<span lang="en">Google Analytics</span> כדי לשפר את המשחק. '   /* TAMAR */
      +   'לפרטים ראו <a href="/privacy.html">מדיניות הפרטיות</a> '                   /* TAMAR */
      +   'ו<a href="/accessibility.html">הצהרת הנגישות</a>.'                          /* TAMAR */
      + '</p>'
      + '<div class="consent__row">'
      /* TWO OF THE SAME. Neither is the primary: both let you play, so
         neither wears the yellow, and accept is not louder than refuse. */
      +   '<button type="button" id="hac-accept" class="r-b consent__b">מסכימים</button>'     /* TAMAR */
      +   '<button type="button" id="hac-decline" class="r-b consent__b">לא, תודה</button>'   /* TAMAR */
      + '</div>';

    document.body.appendChild(banner);

    document.getElementById('hac-accept').addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {}
      banner.parentNode.removeChild(banner);
      initGA4();
    });

    document.getElementById('hac-decline').addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, 'no'); } catch (e) {}
      banner.parentNode.removeChild(banner);
    });
  }

  if (document.body) {
    showBanner();
  } else {
    document.addEventListener('DOMContentLoaded', showBanner);
  }
})();
