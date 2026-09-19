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

    /* replace stub with real implementation */
    window.HAC = function (eventName, params) {
      var base = {
        game_version: 's1',
        elapsed_s: Math.round((Date.now() - _t0) / 1000),
      };
      gtag('event', eventName, Object.assign(base, params || {}));
    };

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
    var s = document.createElement('style');
    s.textContent = [
      '#hac-consent{',
        'position:fixed;bottom:0;right:0;left:0;z-index:99999;',
        'background:#1a1a1a;color:#f0ede6;',
        'font-family:Arial,sans-serif;font-size:14px;line-height:1.6;',
        'padding:14px 16px;display:flex;align-items:center;flex-wrap:wrap;gap:10px;',
        'justify-content:space-between;direction:rtl;',
        'box-shadow:0 -2px 12px rgba(0,0,0,.35);',
      '}',
      '#hac-consent p{margin:0;flex:1 1 280px;}',
      '#hac-consent a{color:#8bbde0;text-decoration:underline;}',
      '#hac-consent .hac-btns{display:flex;gap:8px;flex-shrink:0;}',
      '#hac-consent button{',
        'border:none;border-radius:5px;padding:7px 18px;',
        'font-size:13px;font-family:inherit;cursor:pointer;font-weight:600;',
      '}',
      '#hac-accept{background:#2a7ae2;color:#fff;}',
      '#hac-accept:hover{background:#1a5fc0;}',
      '#hac-decline{background:#3a3a3a;color:#ccc;}',
      '#hac-decline:hover{background:#4a4a4a;}',
    ].join('');
    document.head.appendChild(s);

    var banner = document.createElement('div');
    banner.id = 'hac-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'הסכמה לעוגיות');
    banner.innerHTML = '<p>אנחנו משתמשים ב-Google Analytics כדי לשפר את המשחק. לפרטים ראו <a href="/privacy.html">מדיניות הפרטיות</a> ו<a href="/accessibility.html">הצהרת הנגישות</a>.</p>'
      + '<div class="hac-btns">'
      +   '<button id="hac-accept">מסכים/ה</button>'
      +   '<button id="hac-decline">לא מסכים/ה</button>'
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
