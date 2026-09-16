/* hac121 · game analytics — Google Analytics 4 */

(function () {
  var G_ID = 'G-0RFE7DHTP6';

  /* ── GA4 bootstrap ──────────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', G_ID, {
    send_page_view: false,  /* we send a custom event instead */
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + G_ID;
  document.head.appendChild(script);

  /* ── session clock ──────────────────────────────────────────────── */
  var _t0 = Date.now();
  var _beatStart = Date.now();

  /* ── HAC — the single call-site exposed to proto.js ────────────── */
  window.HAC = function (eventName, params) {
    var base = {
      game_version: 's1',
      elapsed_s: Math.round((Date.now() - _t0) / 1000),
    };
    gtag('event', eventName, Object.assign(base, params || {}));
  };

  /* ── beat timer helpers (called from proto.js) ──────────────────── */
  window.HAC.beatStart = function () { _beatStart = Date.now(); };
  window.HAC.beatMs    = function () { return Date.now() - _beatStart; };

  /* ── first event: game opened ───────────────────────────────────── */
  HAC('game_open', {});

  /* ── app visibility: critical for mobile drop-off detection ─────── */
  document.addEventListener('visibilitychange', function () {
    HAC(document.hidden ? 'app_background' : 'app_foreground', {
      elapsed_s: Math.round((Date.now() - _t0) / 1000),
    });
  });

  /* ── session end (best-effort on tab close) ─────────────────────── */
  window.addEventListener('beforeunload', function () {
    HAC('session_end', {
      total_s: Math.round((Date.now() - _t0) / 1000),
    });
  });
})();
