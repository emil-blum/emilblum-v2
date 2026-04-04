/* =====================================================
   EMIL BLUM — HOME PAGE JS
   Fluid sequence — all steps overlap:
   · Emil slides up
   · 0.4s later Blum slides up (while Emil is still settling)
   · Image box starts expanding immediately after Blum begins
   · Images cycle during the scale-up
   · Slide up happens 0.4s after last image has cycled
   ===================================================== */

(function () {
  'use strict';

  function initLoader() {
    const loader      = document.getElementById('loader');
    const emilImg     = document.getElementById('wm-emil');
    const blumImg     = document.getElementById('wm-blum');
    const box         = document.getElementById('loader-box');
    const imageGrow   = document.getElementById('loader-image-grow');
    const wordStart   = document.querySelector('.loader-word-start');
    const wordEnd     = document.querySelector('.loader-word-end');
    const extras      = document.querySelectorAll('.loader-img-extra');
    const homeContent = document.getElementById('home-content');

    if (!loader || !emilImg || !blumImg) return;

    const boxInner = document.querySelector('.loader-box-inner');
    const targetW  = boxInner ? boxInner.offsetWidth : 420;

    const DUR = 1.0;    // per-word slide duration
    const STAGGER = 0.4; // gap between Emil and Blum starts

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      delay: 0.2
    });

    /* Emil slides up */
    tl.from(emilImg, { yPercent: 110, duration: DUR });

    /* Blum starts 0.4s after Emil — viewer gets a beat to register each word */
    tl.from(blumImg, { yPercent: 110, duration: DUR }, `-=${DUR - STAGGER}`);

    /* Box expands immediately after Blum begins (no gap) */
    tl.fromTo(box,
      { width: 0 },
      { width: targetW, duration: 0.9, ease: 'expo.inOut' },
      `-=${DUR - 0.05}`
    );

    /* Image scales up at the same time as box */
    tl.fromTo(imageGrow,
      { scale: 0, transformOrigin: 'center center' },
      { scale: 1, duration: 0.9, ease: 'expo.inOut' },
      '<'
    );

    /* Names nudge outward as box opens */
    tl.fromTo(wordStart, { x: 0 }, { x: -6, duration: 1.0 }, '<');
    tl.fromTo(wordEnd,   { x: 0 }, { x:  6, duration: 1.0 }, '<');

    /* Images cycle DURING the scale-up — start early, each visible ~0.28s */
    if (extras.length) {
      tl.to(extras, {
        opacity: 0,
        duration: 0.06,
        ease: 'none',
        stagger: 0.28
      }, '<+=0.15');
    }

    /* Slide up 0.4s after last image — short hold then exit */
    const cycleEnd = extras.length * 0.28 + 0.15 + 0.06; // approx time cycling takes
    tl.to({}, { duration: 0.4 }); // 0.4s beat after last image

    /* Loader exits upward */
    tl.to(loader, {
      yPercent: -105,
      duration: 0.85,
      ease: 'expo.inOut',
      onComplete: () => { loader.style.display = 'none'; }
    });

    /* Home content fades in overlapping with loader exit */
    tl.to(homeContent, {
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
      onStart: () => { homeContent && homeContent.classList.add('is-visible'); }
    }, '-=0.45');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined') {
      initLoader();
    } else {
      const loader = document.getElementById('loader');
      const homeContent = document.getElementById('home-content');
      if (loader) {
        setTimeout(() => {
          loader.style.display = 'none';
          if (homeContent) homeContent.classList.add('is-visible');
        }, 600);
      }
    }
  });

})();
