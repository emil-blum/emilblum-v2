/* =====================================================
   EMIL BLUM — PAGE TRANSITIONS
   A cream veil div covers the page, then fades out on
   load (entry). On internal link clicks it fades back in
   before navigating (exit).

   Why a veil instead of animating body:
   Any transform or opacity on <body> creates a new
   stacking context — breaking position:fixed (nav stops
   scrolling), mix-blend-mode (logo loses invert), and
   the cursor lerp (transform held by fill-mode: both).
   ===================================================== */

(function () {
  'use strict';

  const ENTER_MS = 450;  // must match CSS transition duration
  const EXIT_MS  = 180;  // quick fade-out before navigating

  let veil;

  /* ── CREATE VEIL ── */
  function createVeil() {
    veil = document.createElement('div');
    veil.id = 'page-veil';
    document.body.prepend(veil);

    // Double rAF: ensures the browser has painted opacity:1
    // before we start the fade-out transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        veil.style.opacity = '0';
      });
    });

    // Remove pointer-events once fully transparent
    setTimeout(() => {
      veil.style.pointerEvents = 'none';
    }, ENTER_MS);
  }

  /* ── INTERCEPT INTERNAL LINKS ── */
  function interceptLinks() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href ||
          href.startsWith('#') ||
          href.startsWith('http') ||
          href.startsWith('mailto') ||
          href.startsWith('tel') ||
          link.target === '_blank') return;

      e.preventDefault();

      // Fade veil back in quickly, then navigate
      veil.style.transition = `opacity ${EXIT_MS}ms ease`;
      veil.style.opacity    = '1';
      veil.style.pointerEvents = 'all';

      setTimeout(() => { window.location.href = href; }, EXIT_MS);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    createVeil();
    interceptLinks();
  });

})();
