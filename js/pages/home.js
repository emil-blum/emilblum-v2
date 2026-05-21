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

    // Reveal wordmarks and push them below the clip atomically —
    // CSS keeps them opacity:0 to prevent a flash before this runs.
    gsap.set([emilImg, blumImg], { opacity: 1, yPercent: 110 });

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
    tl.addLabel('boxOpen', '<'); // anchor for image-cycle timing

    /* Image scales up at the same time as box */
    tl.fromTo(imageGrow,
      { scale: 0, transformOrigin: 'center center' },
      { scale: 1, duration: 0.9, ease: 'expo.inOut' },
      '<'
    );

    /* Names nudge outward as box opens */
    tl.fromTo(wordStart, { x: 0 }, { x: -6, duration: 1.0 }, '<');
    tl.fromTo(wordEnd,   { x: 0 }, { x:  6, duration: 1.0 }, '<');

    /* Images cycle one-by-one during scale-up.
       Each is hidden (display:none) immediately after fading so no transparent
       layer remains in the compositor — eliminates the sub-pixel seam artifact. */
    Array.from(extras).forEach((extra, i) => {
      tl.to(extra, {
        opacity: 0,
        duration: 0.06,
        ease: 'none',
        onComplete() { extra.style.display = 'none'; }
      }, `boxOpen+=${0.15 + i * 0.28}`);
    });

    /* Short hold after last image cycles, then exit */
    tl.to({}, { duration: 0.4 });

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
      onStart: () => {
        homeContent && homeContent.classList.add('is-visible');
        // Cascade hero [data-reveal] elements in DOM order
        const heroEls = Array.from(document.querySelectorAll('.hero [data-reveal]'));
        heroEls.forEach((el, i) => {
          setTimeout(() => {
            el.style.transitionDelay = '0ms';
            el.classList.add('is-visible');
          }, i * 65);
        });
      }
    }, '-=0.45');
  }

  // ── HOVER SCATTER ──────────────────────────────────────────
  const HOVER_PREVIEWS = {
    featured: [
      'assets/images/hover-previews/featured/01_Emil-Blum_Featured.avif',
      'assets/images/hover-previews/featured/02_Emil-Blum_Featured.avif',
      'assets/images/hover-previews/featured/03_Emil-Blum_Featured.avif',
    ],
    code: [
      'assets/images/hover-previews/code/01_Emil-Blum_Code.avif',
      'assets/images/hover-previews/code/02_Emil-Blum_Code.avif',
      'assets/images/hover-previews/code/03_Emil-Blum_Code.avif',
    ],
    art: [
      'assets/images/hover-previews/art/01_Emil-Blum_Art.avif',
      'assets/images/hover-previews/art/02_Emil-Blum_Art.avif',
      'assets/images/hover-previews/art/03_Emil-Blum_Art.avif',
      'assets/images/hover-previews/art/04_Emil-Blum_Art.avif',
      'assets/images/hover-previews/art/05_Emil-Blum_Art.avif',
      'assets/images/hover-previews/art/06_Emil-Blum_Art.avif',
      'assets/images/hover-previews/art/07_Emil-Blum_Art.avif',
    ],
    moments: [
      'assets/images/hover-previews/moments/01_Emil-Blum_Moments.avif',
      'assets/images/hover-previews/moments/02_Emil-Blum_Moments.avif',
      'assets/images/hover-previews/moments/03_Emil-Blum_Moments.avif',
      'assets/images/hover-previews/moments/04_Emil-Blum_Moments.avif',
      'assets/images/hover-previews/moments/05_Emil-Blum_Moments.avif',
    ],
    swarf: [
      'assets/images/hover-previews/swarf/01_Emil-Blum_Swarf.avif',
      'assets/images/hover-previews/swarf/02_Emil-Blum_Swarf.avif',
      'assets/images/hover-previews/swarf/03_Emil-Blum_Swarf.avif',
      'assets/images/hover-previews/swarf/04_Emil-Blum_Swarf.avif',
    ],
    about: [
      'assets/images/hover-previews/about/01_Emil-Blum_About.avif',
      'assets/images/hover-previews/about/02_Emil-Blum_About.avif',
      'assets/images/hover-previews/about/03_Emil-Blum_About.avif',
    ],
    play: [
      'assets/images/hover-previews/play/01_Emil-Blum_Play.avif',
      'assets/images/hover-previews/play/02_Emil-Blum_Play.avif',
      'assets/images/hover-previews/play/03_Emil-Blum_Play.avif',
    ],
  };

  // Widths for three size tiers (px) — varies each image for natural feel
  const SIZE_TIERS = [400, 480, 580];
  // How many images to show per hover (picked randomly from the full pool)
  const SCATTER_COUNT = 3;

  function initScatter() {
    const container = document.getElementById('hover-scatter');
    if (!container) return;

    // No hover interaction on touch-only devices — skip entirely
    if (!window.matchMedia('(hover: hover)').matches) return;

    // Preload during browser idle time so it doesn't compete with page load
    const preloadAll = () => {
      Object.values(HOVER_PREVIEWS).flat().forEach(src => { new Image().src = src; });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadAll, { timeout: 4000 });
    } else {
      setTimeout(preloadAll, 2500);
    }

    const FADE_IN_MS   = 300;  // duration of each image fade-in
    const FADE_OUT_MS  = 150;  // duration of each image fade-out
    const IN_STAGGER   = 200;  // ms between each successive image appearing
    const OUT_STAGGER  = 100;  // ms between each successive image disappearing

    let currentKey = null;
    let allTimers  = [];

    function clearTimers() {
      allTimers.forEach(clearTimeout);
      allTimers = [];
    }

    function later(fn, ms) {
      const t = setTimeout(fn, ms);
      allTimers.push(t);
    }

    // Divide viewport into a 3×2 grid of zones, shuffle, return one position per image.
    function spreadPositions(count) {
      const COLS = 3, ROWS = 2;
      const cells = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) cells.push([c, r]);
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      const cw = 75 / COLS, ch = 70 / ROWS;
      return cells.slice(0, count).map(([c, r]) => ({
        x: 3 + c * cw + Math.random() * cw * 0.65,
        y: 5 + r * ch + Math.random() * ch * 0.70,
      }));
    }

    function pickRandom(arr, n) {
      const pool = [...arr];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, Math.min(n, pool.length));
    }

    function showSection(key) {
      if (key === currentKey) return;
      clearTimers();

      // Fade out + remove any existing images, with per-image stagger
      const existing = Array.from(container.querySelectorAll('.scatter-img'));
      existing.forEach((img, i) => {
        const opacity = parseFloat(img.style.opacity || '0');
        if (opacity <= 0.01) {
          // Not yet visible — remove immediately, no transition needed
          img.remove();
        } else {
          img.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
          later(() => { img.style.opacity = '0'; }, i * OUT_STAGGER);
          later(() => { img.remove(); }, i * OUT_STAGGER + FADE_OUT_MS + 40);
        }
      });

      currentKey = key;
      if (!key) return;

      const pool = HOVER_PREVIEWS[key];
      if (!pool || !pool.length) return;

      const srcs      = pickRandom(pool, SCATTER_COUNT);
      const positions = spreadPositions(srcs.length);

      srcs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src       = src;
        img.className = 'scatter-img';
        img.alt       = '';
        img.draggable = false;

        const { x, y } = positions[i];
        const rot = (Math.random() - 0.5) * 30; // ±15°
        const w   = SIZE_TIERS[i % SIZE_TIERS.length];

        img.style.cssText = [
          `left:${x}%`,
          `top:${y}%`,
          `width:${w}px`,
          `transform:rotate(${rot}deg)`,
          `opacity:0`,
          `transition:opacity ${FADE_IN_MS}ms ease`,
        ].join(';');

        container.appendChild(img);

        // Stagger each image's fade-in start by IN_STAGGER ms
        later(() => { img.style.opacity = '1'; }, i * IN_STAGGER);
      });
    }

    // Use mousemove on the grid rather than per-cell mouseenter —
    // mouseenter can be skipped on fast pointer movements, mousemove never is.
    // DOM work is deferred to rAF so the mousemove handler stays weightless
    // and CSS :hover on cells paints in the current frame without delay.
    const grid = document.querySelector('.home-nav-grid');
    if (!grid) return;

    let rafPending    = false;
    let pendingSection = undefined;

    grid.addEventListener('mousemove', e => {
      const sectionItem = e.target.closest('.home-nav-item[data-section]');
      const anyItem     = e.target.closest('.home-nav-item');
      const key         = sectionItem ? sectionItem.dataset.section : null;

      if (key)       pendingSection = key;   // section tile
      else if (anyItem) pendingSection = null; // Connect → clear
      else           return;                  // gap between cells → no change

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          if (pendingSection !== currentKey) showSection(pendingSection);
        });
      }
    });

    grid.addEventListener('mouseleave', () => showSection(null));
  }
  // ────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    initScatter();
    if (typeof gsap !== 'undefined') {
      initLoader();
    } else {
      const loader = document.getElementById('loader');
      const homeContent = document.getElementById('home-content');
      if (loader) {
        setTimeout(() => {
          loader.style.display = 'none';
          if (homeContent) homeContent.classList.add('is-visible');
          const heroEls = Array.from(document.querySelectorAll('.hero [data-reveal]'));
          heroEls.forEach((el, i) => {
            setTimeout(() => {
              el.style.transitionDelay = '0ms';
              el.classList.add('is-visible');
            }, i * 65);
          });
        }, 600);
      }
    }
  });

})();
